import { Context, Next } from "koa";
import { I18nService, SupportedLocale } from "../util/i18n";
import { logger } from "../util/log";

// 语言检测选项
export interface LocaleDetectionOptions {
  // 检测顺序
  detectionOrder: ('header' | 'query' | 'cookie' | 'session')[];
  // 默认语言
  defaultLocale: SupportedLocale;
  // 支持的语言列表
  supportedLocales: SupportedLocale[];
  // 是否保存到cookie
  saveToCookie?: boolean;
  // cookie名称
  cookieName?: string;
  // cookie过期时间（天）
  cookieMaxAge?: number;
  // 是否保存到session
  saveToSession?: boolean;
  // session键名
  sessionKey?: string;
}

// 默认配置
const defaultOptions: LocaleDetectionOptions = {
  detectionOrder: ['header', 'query', 'cookie', 'session'],
  defaultLocale: 'zh-CN',
  supportedLocales: ['zh-CN', 'en-US',],
  saveToCookie: true,
  cookieName: 'locale',
  cookieMaxAge: 365,
  saveToSession: true,
  sessionKey: 'locale'
};

export function i18nMiddleware(options: Partial<LocaleDetectionOptions> = {}) {
  const config = { ...defaultOptions, ...options };

  return async (ctx: Context, next: Next) => {
    try {
      // 检测语言
      const detectedLocale = detectLocale(ctx, config);
      
      // 设置语言
      const i18n = I18nService.getInstance();
      i18n.setLocale(detectedLocale);

      // 保存到cookie
      if (config.saveToCookie && detectedLocale !== config.defaultLocale) {
        ctx.cookies.set(config.cookieName!, detectedLocale, {
          maxAge: config.cookieMaxAge! * 24 * 60 * 60 * 1000,
          httpOnly: false,
          secure: ctx.request.protocol === 'https',
          sameSite: 'lax'
        });
      }

      // 保存到session
      if (config.saveToSession && ctx.session) {
        ctx.session[config.sessionKey!] = detectedLocale;
      }

      // 将i18n实例添加到ctx
      ctx.i18n = i18n;
      ctx.locale = detectedLocale;

      // 添加便捷方法
      ctx.t = (key: string, context?: any) => i18n.t(key, context, detectedLocale);
      ctx.formatDate = (date: Date, format?: string) => i18n.formatDate(date, format, detectedLocale);
      ctx.formatNumber = (num: number) => i18n.formatNumber(num, detectedLocale);
      ctx.formatCurrency = (amount: number, currency?: string) => i18n.formatCurrency(amount, currency, detectedLocale);
      ctx.plural = (key: string, count: number, context?: any) => i18n.plural(key, count, context, detectedLocale);

      if (i18n.getStats().currentLocale !== detectedLocale) {
        logger().info({
          event: "i18nLocaleDetected",
          message: "Locale detected and set",
          data: { 
            detectedLocale, 
            userAgent: ctx.request.headers['user-agent'],
            ip: ctx.request.ip 
          }
        });
      }

      await next();
    } catch (error) {
      logger().error({
        event: "i18nMiddlewareError",
        message: "Error in i18n middleware",
        error: error.message
      });
      
      // 继续执行，不影响其他功能
      await next();
    }
  };
}

/**
 * 检测语言
 */
function detectLocale(ctx: Context, config: LocaleDetectionOptions): SupportedLocale {
  for (const method of config.detectionOrder) {
    const locale = detectLocaleByMethod(ctx, method, config);
    if (locale) {
      return locale;
    }
  }

  return config.defaultLocale;
}

/**
 * 根据方法检测语言
 */
function detectLocaleByMethod(
  ctx: Context, 
  method: string, 
  config: LocaleDetectionOptions
): SupportedLocale | null {
  switch (method) {
    case 'header':
      return detectFromHeader(ctx, config);
    case 'query':
      return detectFromQuery(ctx, config);
    case 'cookie':
      return detectFromCookie(ctx, config);
    case 'session':
      return detectFromSession(ctx, config);
    default:
      return null;
  }
}

/**
 * 从请求头检测语言
 */
function detectFromHeader(ctx: Context, config: LocaleDetectionOptions): SupportedLocale | null {
  const acceptLanguage = ctx.request.headers['accept-language'];
  if (!acceptLanguage) return null;

  // 解析Accept-Language头
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, quality = '1'] = lang.trim().split(';q=');
      return { code: code.toLowerCase(), quality: parseFloat(quality) };
    })
    .sort((a, b) => b.quality - a.quality);

  // 匹配支持的语言
  for (const { code } of languages) {
    // 精确匹配
    if (config.supportedLocales.includes(code as SupportedLocale)) {
      return code as SupportedLocale;
    }

    // 语言代码匹配（如zh-CN匹配zh）
    const languageCode = code.split('-')[0];
    const matchedLocale = config.supportedLocales.find(locale => 
      locale.startsWith(languageCode + '-')
    );
    if (matchedLocale) {
      return matchedLocale;
    }
  }

  return null;
}

/**
 * 从查询参数检测语言
 */
function detectFromQuery(ctx: Context, config: LocaleDetectionOptions): SupportedLocale | null {
  const locale = ctx.query.locale || ctx.query.lang || ctx.query.l;
  if (!locale || typeof locale !== 'string') return null;

  const normalizedLocale = locale.toLowerCase();
  if (config.supportedLocales.includes(normalizedLocale as SupportedLocale)) {
    return normalizedLocale as SupportedLocale;
  }

  return null;
}

/**
 * 从Cookie检测语言
 */
function detectFromCookie(ctx: Context, config: LocaleDetectionOptions): SupportedLocale | null {
  const locale = ctx.cookies.get(config.cookieName!);
  if (!locale) return null;

  if (config.supportedLocales.includes(locale as SupportedLocale)) {
    return locale as SupportedLocale;
  }

  return null;
}

/**
 * 从Session检测语言
 */
function detectFromSession(ctx: Context, config: LocaleDetectionOptions): SupportedLocale | null {
  if (!ctx.session) return null;

  const locale = ctx.session[config.sessionKey!];
  if (!locale) return null;

  if (config.supportedLocales.includes(locale as SupportedLocale)) {
    return locale as SupportedLocale;
  }

  return null;
}

/**
 * 语言切换中间件
 */
export function localeSwitchMiddleware() {
  return async (ctx: Context, next: Next) => {
    // 检查是否是语言切换请求
    if (ctx.path === '/api/i18n/switch' && ctx.method === 'POST') {
      const { locale } = ctx.request.body as { locale: SupportedLocale };
      
      if (locale) {
        const i18n = I18nService.getInstance();
        i18n.setLocale(locale);

        // 保存到cookie
        ctx.cookies.set('locale', locale, {
          maxAge: 365 * 24 * 60 * 60 * 1000,
          httpOnly: false,
          secure: ctx.request.protocol === 'https',
          sameSite: 'lax'
        });

        // 保存到session
        if (ctx.session) {
          ctx.session.locale = locale;
        }

        ctx.body = {
          success: true,
          message: i18n.t('common.success'),
          data: { locale }
        };

        logger().info({
          event: "i18nLocaleSwitched",
          message: "Locale switched by user",
          data: { locale, userId: ctx.state.user?.id }
        });

        return;
      }
    }

    await next();
  };
}

/**
 * 语言信息中间件
 */
export function localeInfoMiddleware() {
  return async (ctx: Context, next: Next) => {
    // 提供语言信息API
    if (ctx.path === '/api/i18n/info' && ctx.method === 'GET') {
      const i18n = I18nService.getInstance();
      const currentLocale = i18n.getCurrentLocale();
      const supportedLocales = i18n.getSupportedLocales();
      const localeConfig = i18n.getLocaleConfig();
      const stats = i18n.getStats();

      ctx.body = {
        success: true,
        data: {
          currentLocale,
          supportedLocales,
          localeConfig,
          stats
        }
      };

      return;
    }

    await next();
  };
}

// 扩展Context类型
declare module "koa" {
  interface Context {
    i18n: I18nService;
    locale: SupportedLocale;
    t: (key: string, context?: any) => string;
    formatDate: (date: Date, format?: string) => string;
    formatNumber: (num: number) => string;
    formatCurrency: (amount: number, currency?: string) => string;
    plural: (key: string, count: number, context?: any) => string;
  }
} 