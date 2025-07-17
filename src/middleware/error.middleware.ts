import { Context, Next } from 'koa';
import { logger } from '../util/log';
import { 
  CustomError, 
  ErrorHandler, 
  ErrorCodes,
  DatabaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  ExternalServiceError
} from '../util/error';
import { ServerConfig } from '../util/env';

// 错误处理中间件
export const errorHandler = () => async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    await handleError(ctx, error);
  }
};

// 处理错误的核心函数
async function handleError(ctx: Context, error: any) {
  const isDevelopment = ServerConfig.NODE_ENV === 'development';
  
  // 记录错误日志
  logError(error, ctx);
  
  // 格式化错误响应
  const errorResponse = formatErrorResponse(error, ctx, isDevelopment);
  
  // 设置响应状态码
  ctx.status = errorResponse.code;
  ctx.body = errorResponse;
  
  // 在开发环境下添加额外调试信息
  if (isDevelopment) {
    (ctx.body as any).debug = {
      stack: error.stack,
      url: ctx.url,
      method: ctx.method,
      headers: ctx.headers,
      body: ctx.request.body,
      query: ctx.query,
      params: ctx.params
    };
  }
}

// 格式化错误响应
function formatErrorResponse(error: any, ctx: Context, isDevelopment: boolean) {
  // 处理已知的自定义错误
  if (error instanceof CustomError) {
    return ErrorHandler.formatError(error, getLocale(ctx));
  }
  
  // 处理数据库错误
  if (isDatabaseError(error)) {
    const dbError = new DatabaseError(
      isDevelopment ? error.message : '数据库操作失败',
      isDevelopment ? error : undefined
    );
    return ErrorHandler.formatError(dbError, getLocale(ctx));
  }
  
  // 处理验证错误
  if (isValidationError(error)) {
    const validationError = new ValidationError(
      '数据验证失败',
      isDevelopment ? error : undefined
    );
    return ErrorHandler.formatError(validationError, getLocale(ctx));
  }
  
  // 处理JWT错误
  if (isJWTError(error)) {
    const authError = new AuthenticationError(
      error.name === 'TokenExpiredError' ? '令牌已过期' : '令牌无效'
    );
    return ErrorHandler.formatError(authError, getLocale(ctx));
  }
  
  // 处理限流错误
  if (isRateLimitError(error)) {
    const rateLimitError = new RateLimitError();
    return ErrorHandler.formatError(rateLimitError, getLocale(ctx));
  }
  
  // 处理外部服务错误
  if (isExternalServiceError(error)) {
    const externalError = new ExternalServiceError(
      '外部服务',
      isDevelopment ? error.message : '外部服务调用失败',
      isDevelopment ? error : undefined
    );
    return ErrorHandler.formatError(externalError, getLocale(ctx));
  }
  
  // 处理其他未知错误
  const unknownError = new CustomError(
    isDevelopment ? error.message : '服务器内部错误',
    500,
    ErrorCodes.INTERNAL_SERVER_ERROR,
    isDevelopment ? error : undefined
  );
  
  return ErrorHandler.formatError(unknownError, getLocale(ctx));
}

// 记录错误日志
function logError(error: any, ctx: Context) {
  const logData = {
    event: 'error',
    url: ctx.url,
    method: ctx.method,
    ip: ctx.ip,
    userAgent: ctx.headers['user-agent'],
    userId: ctx.state.user?.id,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status
    },
    request: {
      headers: ctx.headers,
      body: ctx.request.body,
      query: ctx.query,
      params: ctx.params
    }
  };
  
  // 根据错误类型选择日志级别
  if (ErrorHandler.isServerError(error)) {
    logger().error(logData);
  } else if (ErrorHandler.isClientError(error)) {
    logger().warn(logData);
  } else {
    logger().info(logData);
  }
}

// 获取当前语言环境
function getLocale(ctx: Context): string {
  return ctx.state.locale || ctx.acceptsLanguages('zh', 'en') || 'zh';
}

// 错误类型判断函数
function isDatabaseError(error: any): boolean {
  return error.code === 'ER_DUP_ENTRY' || 
         error.code === 'ER_NO_REFERENCED_ROW_2' ||
         error.code === '23505' || // PostgreSQL unique constraint
         error.code === '23503' || // PostgreSQL foreign key constraint
         error.name === 'SequelizeValidationError' ||
         error.name === 'SequelizeUniqueConstraintError' ||
         error.name === 'QueryFailedError';
}

function isValidationError(error: any): boolean {
  return error.name === 'ValidationError' ||
         error.name === 'ValidatorError' ||
         error.name === 'CastError' ||
         Array.isArray(error.errors);
}

function isJWTError(error: any): boolean {
  return error.name === 'JsonWebTokenError' ||
         error.name === 'TokenExpiredError' ||
         error.name === 'NotBeforeError';
}

function isRateLimitError(error: any): boolean {
  return error.status === 429 ||
         error.code === 'RATE_LIMIT_EXCEEDED' ||
         error.message?.includes('rate limit');
}

function isExternalServiceError(error: any): boolean {
  return error.code === 'ECONNREFUSED' ||
         error.code === 'ENOTFOUND' ||
         error.code === 'ETIMEDOUT' ||
         error.code === 'ECONNRESET' ||
         error.status >= 500 && error.status < 600;
}

// 异步错误包装器
export function asyncHandler(fn: Function) {
  return async (ctx: Context, next: Next) => {
    try {
      await fn(ctx, next);
    } catch (error) {
      await handleError(ctx, error);
    }
  };
}

// 错误边界装饰器（用于类方法）
export function errorBoundary(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    try {
      return await method.apply(this, args);
    } catch (error) {
      logger().error({
        event: 'methodError',
        message: `Method ${propertyName} failed`,
        error: error
      });
      throw error;
    }
  };
  
  return descriptor;
}

// 重试机制
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (!ErrorHandler.isRetryableError(error) || i === maxRetries) {
        throw error;
      }
      
      // 指数退避
      const waitTime = delay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      logger().warn({
        event: 'retry',
        message: `Retry attempt ${i + 1}/${maxRetries}, waitTime: ${waitTime}ms`,
        error: error
      });
    }
  }
  
  throw lastError!;
} 