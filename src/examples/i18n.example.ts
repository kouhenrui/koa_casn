import { I18nService, t, setLocale, getCurrentLocale } from "../util/i18n";
import { logger } from "../util/log";

// 示例1: 基础翻译使用
export function basicTranslationExample() {
  console.log("=== 基础翻译示例 ===");
  
  // 使用便捷函数
  console.log("成功:", t("common.success"));
  console.log("错误:", t("common.error"));
  console.log("保存:", t("common.save"));
  
  // 带上下文的翻译
  console.log("必填项:", t("validation.required", { field: "用户名" }));
  console.log("最小长度:", t("validation.min_length", { field: "密码", min: 6 }));
  
  // 复数形式
  console.log("1个文件:", t("file.count", { count: 1 }));
  console.log("5个文件:", t("file.count", { count: 5 }));
}

// 示例2: 语言切换
export function languageSwitchExample() {
  console.log("=== 语言切换示例 ===");
  
  // 切换到英文
  setLocale("en-US");
  console.log("当前语言:", getCurrentLocale());
  console.log("Success:", t("common.success"));
  console.log("Error:", t("common.error"));
  
  // 切换到中文
  setLocale("zh-CN");
  console.log("当前语言:", getCurrentLocale());
  console.log("成功:", t("common.success"));
  console.log("错误:", t("common.error"));
  
  // 切换到日文
  // setLocale("ja-JP");
  // console.log("当前语言:", getCurrentLocale());
  // console.log("Success:", t("common.success"));
  // console.log("Error:", t("common.error"));
}

// 示例3: 日期和数字格式化
export function formattingExample() {
  console.log("=== 格式化示例 ===");
  
  const i18n = I18nService.getInstance();
  const date = new Date();
  const number = 1234567.89;
  const amount = 99.99;
  
  // 中文格式化
  setLocale("zh-CN");
  console.log("中文日期:", i18n.formatDate(date));
  console.log("中文数字:", i18n.formatNumber(number));
  console.log("中文货币:", i18n.formatCurrency(amount));
  
  // 英文格式化
  setLocale("en-US");
  console.log("英文日期:", i18n.formatDate(date));
  console.log("英文数字:", i18n.formatNumber(number));
  console.log("英文货币:", i18n.formatCurrency(amount));
  
  // 日文格式化
  // setLocale("ja-JP");
  // console.log("日文日期:", i18n.formatDate(date));
  // console.log("日文数字:", i18n.formatNumber(number));
  // console.log("日文货币:", i18n.formatCurrency(amount));
}

// 示例4: 队列相关翻译
export function queueTranslationExample() {
  console.log("=== 队列翻译示例 ===");
  
  // 中文
  setLocale("zh-CN");
  console.log("队列创建成功:", t("queue.queue_created"));
  console.log("任务添加成功:", t("queue.job_added"));
  console.log("队列处理已开始:", t("queue.processing_started"));
  console.log("队列处理已停止:", t("queue.processing_stopped"));
  
  // 英文
  setLocale("en-US");
  console.log("Queue created:", t("queue.queue_created"));
  console.log("Job added:", t("queue.job_added"));
  console.log("Processing started:", t("queue.processing_started"));
  console.log("Processing stopped:", t("queue.processing_stopped"));
}

// 示例5: 权限相关翻译
export function permissionTranslationExample() {
  console.log("=== 权限翻译示例 ===");
  
  // 中文
  setLocale("zh-CN");
  console.log("权限不足:", t("permission.insufficient_permissions"));
  console.log("访问拒绝:", t("permission.access_denied"));
  console.log("需要身份验证:", t("permission.authentication_required"));
  console.log("角色创建成功:", t("permission.role_created"));
  
  // 英文
  setLocale("en-US");
  console.log("Insufficient permissions:", t("permission.insufficient_permissions"));
  console.log("Access denied:", t("permission.access_denied"));
  console.log("Authentication required:", t("permission.authentication_required"));
  console.log("Role created:", t("permission.role_created"));
}

// 示例6: 验证错误翻译
export function validationTranslationExample() {
  console.log("=== 验证翻译示例 ===");
  
  // 中文
  setLocale("zh-CN");
  console.log("邮箱验证:", t("validation.email"));
  console.log("必填项:", t("validation.required", { field: "邮箱" }));
  console.log("最小长度:", t("validation.min_length", { field: "密码", min: 8 }));
  console.log("最大长度:", t("validation.max_length", { field: "用户名", max: 20 }));
  
  // 英文
  setLocale("en-US");
  console.log("Email validation:", t("validation.email"));
  console.log("Required field:", t("validation.required", { field: "Email" }));
  console.log("Min length:", t("validation.min_length", { field: "Password", min: 8 }));
  console.log("Max length:", t("validation.max_length", { field: "Username", max: 20 }));
}

// 示例7: 时间相关翻译
export function timeTranslationExample() {
  console.log("=== 时间翻译示例 ===");
  
  // 中文
  setLocale("zh-CN");
  console.log("今天:", t("time.today"));
  console.log("昨天:", t("time.yesterday"));
  console.log("明天:", t("time.tomorrow"));
  console.log("5分钟前:", t("time.minutes_ago", { count: 5 }));
  console.log("2小时后:", t("time.in_hours", { count: 2 }));
  
  // 英文
  setLocale("en-US");
  console.log("Today:", t("time.today"));
  console.log("Yesterday:", t("time.yesterday"));
  console.log("Tomorrow:", t("time.tomorrow"));
  console.log("5 minutes ago:", t("time.minutes_ago", { count: 5 }));
  console.log("In 2 hours:", t("time.in_hours", { count: 2 }));
}

// 示例8: 状态翻译
export function statusTranslationExample() {
  console.log("=== 状态翻译示例 ===");
  
  // 中文
  setLocale("zh-CN");
  console.log("待处理:", t("status.pending"));
  console.log("处理中:", t("status.processing"));
  console.log("已完成:", t("status.completed"));
  console.log("失败:", t("status.failed"));
  console.log("已取消:", t("status.cancelled"));
  
  // 英文
  setLocale("en-US");
  console.log("Pending:", t("status.pending"));
  console.log("Processing:", t("status.processing"));
  console.log("Completed:", t("status.completed"));
  console.log("Failed:", t("status.failed"));
  console.log("Cancelled:", t("status.cancelled"));
}

// 示例9: 获取i18n统计信息
export function i18nStatsExample() {
  console.log("=== i18n统计示例 ===");
  
  const i18n = I18nService.getInstance();
  const stats = i18n.getStats();
  
  console.log("当前语言:", stats.currentLocale);
  console.log("支持的语言:", stats.supportedLocales);
  console.log("已加载翻译:", stats.loadedTranslations);
  console.log("缓存大小:", stats.cacheSize);
  
  // 获取语言配置
  const config = i18n.getLocaleConfig();
  console.log("语言配置:", {
    name: config.name,
    nativeName: config.nativeName,
    flag: config.flag,
    dateFormat: config.dateFormat,
    currency: config.currency
  });
}

// 示例10: 错误处理翻译
export function errorTranslationExample() {
  console.log("=== 错误翻译示例 ===");
  
  // 中文
  setLocale("zh-CN");
  console.log("网络错误:", t("auth.network_error"));
  console.log("服务器错误:", t("auth.server_error"));
  console.log("请求超时:", t("auth.timeout_error"));
  console.log("权限不足:", t("auth.permission_denied"));
  console.log("未授权访问:", t("auth.unauthorized"));
  
  // 英文
  setLocale("en-US");
  console.log("Network error:", t("auth.network_error"));
  console.log("Server error:", t("auth.server_error"));
  console.log("Request timeout:", t("auth.timeout_error"));
  console.log("Permission denied:", t("auth.permission_denied"));
  console.log("Unauthorized access:", t("auth.unauthorized"));
}

// 运行所有示例
function runAllI18nExamples() {
  try {
    basicTranslationExample();
    console.log("\n");
    
    languageSwitchExample();
    console.log("\n");
    
    formattingExample();
    console.log("\n");
    
    queueTranslationExample();
    console.log("\n");
    
    permissionTranslationExample();
    console.log("\n");
    
    validationTranslationExample();
    console.log("\n");
    
    timeTranslationExample();
    console.log("\n");
    
    statusTranslationExample();
    console.log("\n");
    
    i18nStatsExample();
    console.log("\n");
    
    errorTranslationExample();
    
    console.log("\n所有i18n示例运行完成！");
  } catch (error) {
    console.error("i18n示例运行出错:", error);
  }
}

// 导出示例函数
export {
  runAllI18nExamples
}; 