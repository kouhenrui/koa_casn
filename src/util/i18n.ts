import { logger } from "./log";
import { CustomError } from "./error";
import * as fs from "fs";
import * as path from "path";

// 支持的语言类型
export type SupportedLocale = 'zh-CN'  | 'en-US' ;

// 语言配置接口
export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  currency: string;
  numberFormat: {
    decimal: string;
    thousands: string;
    precision: number;
  };
}

// 翻译数据接口
export interface TranslationData {
  [key: string]: string | TranslationData;
}

// i18n配置接口
export interface I18nConfig {
  defaultLocale: SupportedLocale;
  fallbackLocale: SupportedLocale;
  locales: SupportedLocale[];
  localeConfigs: Record<SupportedLocale, LocaleConfig>;
  loadPath?: string;
  cache?: boolean;
  debug?: boolean;
}

// 翻译上下文接口
export interface TranslationContext {
  [key: string]: any;
}

export class I18nService {
  private static instance: I18nService;
  private config: I18nConfig;
  private translations: Map<SupportedLocale, TranslationData> = new Map();
  private currentLocale: SupportedLocale;
  private cache: Map<string, string> = new Map();

  private constructor(config: I18nConfig) {
    this.config = config;
    this.currentLocale = config.defaultLocale;
    this.loadTranslations();
  }

  public static getInstance(config?: I18nConfig): I18nService {
    if (!I18nService.instance && config) {
      I18nService.instance = new I18nService(config);
    } else if (!I18nService.instance) {
      throw new Error("I18nService must be initialized with config first");
    }
    return I18nService.instance;
  }

  /**
   * 初始化i18n服务
   */
  public static async init(config: I18nConfig): Promise<I18nService> {
    const instance = new I18nService(config);
    await instance.loadTranslations();
    I18nService.instance = instance;
    return instance;
  }

  /**
   * 加载翻译文件
   */
  private async loadTranslations(): Promise<void> {
    try {
      for (const locale of this.config.locales) {
        const translationPath = this.getTranslationPath(locale);
        const translationData = await this.loadTranslationFile(translationPath);
        this.translations.set(locale, translationData);
        
        if (this.config.debug) {
          logger().info({
            event: "i18nLoaded",
            message: `Translation loaded for locale: ${locale}`,
            data: { locale, keysCount: Object.keys(translationData).length }
          });
        }
      }
    } catch (error) {
      logger().error({
        event: "i18nLoadError",
        message: "Failed to load translations",
        error: error.message
      });
      throw new CustomError(`Failed to load translations: ${error.message}`);
    }
  }

  /**
   * 获取翻译文件路径
   */
  private getTranslationPath(locale: SupportedLocale): string {
    const loadPath = this.config.loadPath || path.join(process.cwd(), 'locales');
    return path.join(loadPath, `${locale}.json`);
  }

  /**
   * 加载翻译文件
   */
  private async loadTranslationFile(filePath: string): Promise<TranslationData> {
    try {
      if (!fs.existsSync(filePath)) {
        logger().warn({
          event: "i18nFileNotFound",
          message: "Translation file not found, using fallback",
          data: { filePath }
        });
        return {};
      }

      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      logger().error({
        event: "i18nFileLoadError",
        message: "Failed to load translation file",
        error: error.message,
        data: { filePath }
      });
      return {};
    }
  }

  /**
   * 设置当前语言
   */
  public setLocale(locale: SupportedLocale): void {
    if (!this.config.locales.includes(locale)) {
      logger().warn({
        event: "i18nInvalidLocale",
        message: "Invalid locale, using fallback",
        data: { locale, available: this.config.locales }
      });
      locale = this.config.fallbackLocale;
    }

    this.currentLocale = locale;
    
    if (this.config.debug) {
      logger().info({
        event: "i18nLocaleChanged",
        message: "Locale changed",
        data: { locale }
      });
    }
  }

  /**
   * 获取当前语言
   */
  public getCurrentLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * 获取支持的语言列表
   */
  public getSupportedLocales(): SupportedLocale[] {
    return this.config.locales;
  }

  /**
   * 获取语言配置
   */
  public getLocaleConfig(locale?: SupportedLocale): LocaleConfig {
    const targetLocale = locale || this.currentLocale;
    return this.config.localeConfigs[targetLocale];
  }

  /**
   * 翻译文本
   */
  public t(key: string, context?: TranslationContext, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale;
    const translation = this.getTranslation(key, targetLocale);
    
    if (!translation) {
      if (this.config.debug) {
        logger().warn({
          event: "i18nMissingKey",
          message: "Missing translation key",
          data: { key, locale: targetLocale }
        });
      }
      return key;
    }

    return this.interpolate(translation, context);
  }

  /**
   * 获取翻译文本
   */
  private getTranslation(key: string, locale: SupportedLocale): string | null {
    const cacheKey = `${locale}:${key}`;
    
    // 检查缓存
    if (this.config.cache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) || null;
    }

    const translation = this.getNestedTranslation(key, locale);
    
    // 缓存结果
    if (this.config.cache && translation) {
      this.cache.set(cacheKey, translation);
    }

    return translation;
  }

  /**
   * 获取嵌套翻译
   */
  private getNestedTranslation(key: string, locale: SupportedLocale): string | null {
    const keys = key.split('.');
    let translation = this.translations.get(locale);
    
    if (!translation) {
      // 尝试回退语言
      translation = this.translations.get(this.config.fallbackLocale);
      if (!translation) return null;
    }

    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k] as TranslationData;
      } else {
        return null;
      }
    }

    return typeof translation === 'string' ? translation : null;
  }

  /**
   * 插值替换
   */
  private interpolate(text: string, context?: TranslationContext): string {
    if (!context) return text;

    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] !== undefined ? String(context[key]) : match;
    });
  }

  /**
   * 格式化日期
   */
  public formatDate(date: Date, format?: string, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale;
    const config = this.getLocaleConfig(targetLocale);
    const dateFormat = format || config.dateFormat;

    // 简单的日期格式化实现
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return dateFormat
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 格式化数字
   */
  public formatNumber(num: number, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale;
    const config = this.getLocaleConfig(targetLocale);
    const { decimal, thousands, precision } = config.numberFormat;

    const parts = num.toFixed(precision).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
    
    return parts.join(decimal);
  }

  /**
   * 格式化货币
   */
  public formatCurrency(amount: number, currency?: string, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale;
    const config = this.getLocaleConfig(targetLocale);
    const currencySymbol = currency || config.currency;
    
    return `${currencySymbol}${this.formatNumber(amount, targetLocale)}`;
  }

  /**
   * 获取复数形式
   */
  public plural(key: string, count: number, context?: TranslationContext, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale;
    
    // 简单的复数规则
    let pluralKey = key;
    if (count === 0) {
      pluralKey = `${key}_zero`;
    } else if (count === 1) {
      pluralKey = `${key}_one`;
    } else {
      pluralKey = `${key}_other`;
    }

    const translation = this.t(pluralKey, { ...context, count }, targetLocale);
    
    // 如果复数形式不存在，回退到原key
    if (translation === pluralKey) {
      return this.t(key, { ...context, count }, targetLocale);
    }

    return translation;
  }

  /**
   * 重新加载翻译
   */
  public async reload(): Promise<void> {
    this.translations.clear();
    this.cache.clear();
    await this.loadTranslations();
    
    logger().info({
      event: "i18nReloaded",
      message: "Translations reloaded successfully"
    });
  }

  /**
   * 获取翻译统计
   */
  public getStats(): {
    currentLocale: SupportedLocale;
    supportedLocales: SupportedLocale[];
    loadedTranslations: number;
    cacheSize: number;
  } {
    return {
      currentLocale: this.currentLocale,
      supportedLocales: this.config.locales,
      loadedTranslations: this.translations.size,
      cacheSize: this.cache.size
    };
  }
}

// 默认语言配置
export const defaultLocaleConfigs: Record<SupportedLocale, LocaleConfig> = {
  'zh-CN': {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    direction: 'ltr',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    currency: '¥',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      precision: 2
    }
  },
  'en-US': {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm:ss',
    currency: '$',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      precision: 2
    }
  },
};

// 便捷函数
export const t = (key: string, context?: TranslationContext, locale?: SupportedLocale): string => {
  const i18n = I18nService.getInstance();
  return i18n.t(key, context, locale);
};

export const setLocale = (locale: SupportedLocale): void => {
  const i18n = I18nService.getInstance();
  i18n.setLocale(locale);
};

export const getCurrentLocale = (): SupportedLocale => {
  const i18n = I18nService.getInstance();
  return i18n.getCurrentLocale();
}; 