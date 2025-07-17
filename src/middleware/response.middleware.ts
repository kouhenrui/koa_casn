import { Context, Next } from "koa";
import { logger } from "../util/log";

/**
 * 响应格式化中间件
 * 只处理成功响应的格式化，错误处理由 error.middleware.ts 负责
 */
export async function responseFormatter(ctx: Context, next: Next) {
  await next();
  
  // 跳过格式化的情况
  const skip = ctx.state.skipFormat || 
               Buffer.isBuffer(ctx.body) || 
               ctx.body === null || 
               ctx.body === undefined;
               
  if (skip) {
    return;
  }
  
  // 只处理成功响应（状态码200）的格式化
  if (ctx.status === 200 && ctx.body !== undefined) {
    // 如果响应体已经是标准格式，则不重复包装
    if (isStandardResponse(ctx.body)) {
      return;
    }
    
    // 包装成统一格式
    ctx.body = {
      success: true,
      code: 200,
      data: ctx.body,
      message: "success",
      timestamp: new Date().toLocaleString(),
    };
    
    logger().info({
      event: "response",
      message: `响应格式化完成 - ${ctx.method} ${ctx.url} (${ctx.status})`
    });
  }
}

/**
 * 判断响应体是否已经是标准格式
 */
function isStandardResponse(body: any): boolean {
  return body && 
         typeof body === 'object' && 
         (body.success !== undefined || body.code !== undefined);
}

/**
 * 跳过响应格式化的装饰器
 * 用于文件下载等不需要格式化的场景
 */
export function skipResponseFormat() {
  return async (ctx: Context, next: Next) => {
    ctx.state.skipFormat = true;
    await next();
  };
}
