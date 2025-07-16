import { I18nService, I18nConfig, defaultLocaleConfigs, SupportedLocale } from "./i18n";
import { logger } from "./log";

/**
 * 默认i18n配置
 */
export const defaultI18nConfig: I18nConfig = {
  // 默认语言
  defaultLocale: 'zh-CN',
  
  // 回退语言（当翻译不存在时使用）
  fallbackLocale: 'en-US',
  
  // 支持的语言列表
  locales: ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR'],
  
  // 语言配置
  localeConfigs: defaultLocaleConfigs,
  
  // 翻译文件加载路径（可选）
  loadPath: process.env.I18N_LOAD_PATH || undefined,
  
  // 是否启用缓存（默认启用）
  cache: process.env.I18N_CACHE !== 'false',
  
  // 是否启用调试模式（开发环境默认启用）
  debug: process.env.NODE_ENV === 'development'
};

/**
 * 生产环境i18n配置
 */
export const productionI18nConfig: I18nConfig = {
  ...defaultI18nConfig,
  debug: false,
  cache: true,
  loadPath: './locales' // 生产环境固定路径
};

/**
 * 开发环境i18n配置
 */
export const developmentI18nConfig: I18nConfig = {
  ...defaultI18nConfig,
  debug: true,
  cache: true,
  loadPath: './locales'
};

/**
 * 测试环境i18n配置
 */
export const testI18nConfig: I18nConfig = {
  ...defaultI18nConfig,
  debug: false,
  cache: false, // 测试环境禁用缓存
  locales: ['zh-CN', 'en-US'], // 测试环境只使用主要语言
  loadPath: './locales'
};

/**
 * 自定义i18n配置生成器
 */
export function createI18nConfig(options: Partial<I18nConfig> = {}): I18nConfig {
  const env = process.env.NODE_ENV || 'development';
  
  // 根据环境选择基础配置
  let baseConfig: I18nConfig;
  switch (env) {
    case 'production':
      baseConfig = productionI18nConfig;
      break;
    case 'test':
      baseConfig = testI18nConfig;
      break;
    default:
      baseConfig = developmentI18nConfig;
  }
  
  // 合并自定义配置
  return { ...baseConfig, ...options };
}

/**
 * 初始化i18n服务
 */
export async function initI18n(config?: Partial<I18nConfig>): Promise<I18nService> {
  try {
    const finalConfig = createI18nConfig(config);
    
    logger().info({
      event: "i18nInitStart",
      message: "Starting i18n service initialization",
      data: {
        defaultLocale: finalConfig.defaultLocale,
        fallbackLocale: finalConfig.fallbackLocale,
        supportedLocales: finalConfig.locales,
        loadPath: finalConfig.loadPath,
        cache: finalConfig.cache,
        debug: finalConfig.debug,
        environment: process.env.NODE_ENV
      }
    });

    const i18n = await I18nService.init(finalConfig);

    logger().info({
      event: "i18nInitialized",
      message: "I18n service initialized successfully",
      data: {
        currentLocale: i18n.getCurrentLocale(),
        supportedLocales: i18n.getSupportedLocales(),
        stats: i18n.getStats()
      }
    });

    return i18n;
  } catch (error) {
    logger().error({
      event: "i18nInitError",
      message: "Failed to initialize i18n service",
      error: error.message
    });
    throw error;
  }
}

/**
 * 获取i18n服务实例
 */
export function getI18nService(): I18nService {
  return I18nService.getInstance();
}

/**
 * 重新加载翻译
 */
export async function reloadI18n(): Promise<void> {
  try {
    const i18n = getI18nService();
    await i18n.reload();
    
    logger().info({
      event: "i18nReloaded",
      message: "I18n translations reloaded successfully",
      data: {
        stats: i18n.getStats()
      }
    });
  } catch (error) {
    logger().error({
      event: "i18nReloadError",
      message: "Failed to reload i18n translations",
      error: error.message
    });
    throw error;
  }
}

/**
 * 获取i18n统计信息
 */
export function getI18nStats() {
  const i18n = getI18nService();
  return i18n.getStats();
}

/**
 * 验证i18n配置
 */
export function validateI18nConfig(config: I18nConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查必需字段
  if (!config.defaultLocale) {
    errors.push("defaultLocale is required");
  }

  if (!config.fallbackLocale) {
    errors.push("fallbackLocale is required");
  }

  if (!config.locales || config.locales.length === 0) {
    errors.push("locales array is required and cannot be empty");
  }

  if (!config.localeConfigs || Object.keys(config.localeConfigs).length === 0) {
    errors.push("localeConfigs is required and cannot be empty");
  }

  // 检查语言一致性
  if (!config.locales.includes(config.defaultLocale)) {
    errors.push(`defaultLocale '${config.defaultLocale}' must be included in locales array`);
  }

  if (!config.locales.includes(config.fallbackLocale)) {
    errors.push(`fallbackLocale '${config.fallbackLocale}' must be included in locales array`);
  }

  // 检查语言配置一致性
  for (const locale of config.locales) {
    if (!config.localeConfigs[locale]) {
      errors.push(`localeConfig for '${locale}' is missing`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 环境变量配置示例
 */
export const I18N_ENV_VARS = {
  // 默认语言
  I18N_DEFAULT_LOCALE: 'zh-CN',
  
  // 回退语言
  I18N_FALLBACK_LOCALE: 'en-US',
  
  // 支持的语言（逗号分隔）
  I18N_SUPPORTED_LOCALES: 'zh-CN,zh-TW,en-US,ja-JP,ko-KR',
  
  // 翻译文件路径
  I18N_LOAD_PATH: './locales',
  
  // 是否启用缓存
  I18N_CACHE: 'true',
  
  // 是否启用调试模式
  I18N_DEBUG: 'false'
};

/**
 * 从环境变量创建配置
 */
export function createI18nConfigFromEnv(): I18nConfig {
  const supportedLocales = process.env.I18N_SUPPORTED_LOCALES?.split(',') as SupportedLocale[] || ['zh-CN', 'en-US'];
  
  return {
    defaultLocale: (process.env.I18N_DEFAULT_LOCALE as SupportedLocale) || 'zh-CN',
    fallbackLocale: (process.env.I18N_FALLBACK_LOCALE as SupportedLocale) || 'en-US',
    locales: supportedLocales,
    localeConfigs: defaultLocaleConfigs,
    loadPath: process.env.I18N_LOAD_PATH,
    cache: process.env.I18N_CACHE !== 'false',
    debug: process.env.I18N_DEBUG === 'true' || process.env.NODE_ENV === 'development'
  };
}

/**
 * 配置示例
 */
export const I18N_CONFIG_EXAMPLES = {
  // 基础配置
  basic: {
    defaultLocale: 'zh-CN',
    fallbackLocale: 'en-US',
    locales: ['zh-CN', 'en-US'],
    localeConfigs: defaultLocaleConfigs,
    cache: true,
    debug: false
  },

  // 多语言配置
  multilingual: {
    defaultLocale: 'zh-CN',
    fallbackLocale: 'en-US',
    locales: ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR'],
    localeConfigs: defaultLocaleConfigs,
    cache: true,
    debug: false
  },

  // 开发环境配置
  development: {
    defaultLocale: 'zh-CN',
    fallbackLocale: 'en-US',
    locales: ['zh-CN', 'en-US'],
    localeConfigs: defaultLocaleConfigs,
    loadPath: './locales',
    cache: true,
    debug: true
  },

  // 生产环境配置
  production: {
    defaultLocale: 'zh-CN',
    fallbackLocale: 'en-US',
    locales: ['zh-CN', 'en-US'],
    localeConfigs: defaultLocaleConfigs,
    loadPath: './locales',
    cache: true,
    debug: false
  },

  // 测试环境配置
  test: {
    defaultLocale: 'zh-CN',
    fallbackLocale: 'en-US',
    locales: ['zh-CN', 'en-US'],
    localeConfigs: defaultLocaleConfigs,
    cache: false,
    debug: false
  }
};

/**
 * 使用示例
 */
export const USAGE_EXAMPLES = {
  // 使用默认配置
  default: `
import { initI18n } from './util/i18n-init';

// 使用默认配置初始化
const i18n = await initI18n();
  `,

  // 使用自定义配置
  custom: `
import { initI18n } from './util/i18n-init';

// 使用自定义配置初始化
const i18n = await initI18n({
  defaultLocale: 'en-US',
  fallbackLocale: 'zh-CN',
  locales: ['en-US', 'zh-CN'],
  debug: true
});
  `,

  // 使用环境变量配置
  env: `
import { initI18n, createI18nConfigFromEnv } from './util/i18n-init';

// 从环境变量创建配置
const config = createI18nConfigFromEnv();
const i18n = await initI18n(config);
  `,

  // 使用预设配置
  preset: `
import { initI18n, I18N_CONFIG_EXAMPLES } from './util/i18n-init';

// 使用预设配置
const i18n = await initI18n(I18N_CONFIG_EXAMPLES.production);
  `
}; 