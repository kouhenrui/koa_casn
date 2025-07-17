import { Context } from 'koa';
import { 
  logger, 
  logInfo, 
  logWarn, 
  logError, 
  logDebug, 
} from '../util/log';

// =============== 日志系统使用示例 ===============

// 1. 基本日志记录
export const basicLoggingExample = async (ctx: Context) => {
  // 使用便捷方法
  logInfo('user_action', '用户登录成功', { userId: '123', ip: ctx.ip });
  logWarn('security', '检测到异常登录尝试', { ip: ctx.ip, userAgent: ctx.headers['user-agent'] });
  logError('database', '数据库连接失败', { operation: 'query', table: 'users' });
  logDebug('debug', '调试信息', { requestBody: ctx.request.body });

  // 使用logger实例
  const log = logger();
  await log.info({
    event: 'custom_event',
    message: '自定义事件',
    data: { custom: 'data' }
  });

  ctx.body = { success: true };
};


// 4. 请求日志中间件示例
export const requestLoggingMiddleware = async (ctx: Context, next: Function) => {
  const start = Date.now();
  const requestId = logger().generateRequestId();
  
  // 设置请求ID到上下文
  ctx.state.requestId = requestId;
  
  try {
    await next();
    
    // 记录请求完成日志
    const duration = Date.now() - start;
    await logger().request(
      ctx.method,
      ctx.url,
      ctx.status,
      duration,
      ctx.state.user?.id
    );
  } catch (error) {
    // 记录错误日志
    const duration = Date.now() - start;
    await logger().error({
      event: 'request_error',
      message: `Request failed: ${ctx.method} ${ctx.url}`,
      data: {
        method: ctx.method,
        url: ctx.url,
        status: ctx.status,
        duration,
        error: error.message,
        requestId
      }
    }, requestId);
    
    throw error;
  }
};
