// 自定义错误类型
export class CustomError extends Error {
  public status: number;
  public code: string;
  public details?: any;

  constructor(message: string, status: number = 500, code?: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code || this.getDefaultCode(status);
    this.details = details;
    
    // 确保错误堆栈正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  private getDefaultCode(status: number): string {
    const codeMap: { [key: number]: string } = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE'
    };
    return codeMap[status] || 'UNKNOWN_ERROR';
  }
}

// 业务错误类型
export class BusinessError extends CustomError {
  constructor(message: string, code?: string, details?: any) {
    super(message, 400, code || 'BUSINESS_ERROR', details);
  }
}

// 验证错误
export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

// 认证错误
export class AuthenticationError extends CustomError {
  constructor(message: string = '认证失败') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// 授权错误
export class AuthorizationError extends CustomError {
  constructor(message: string = '权限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// 资源不存在错误
export class NotFoundError extends CustomError {
  constructor(resource: string = '资源') {
    super(`${resource}不存在`, 404, 'NOT_FOUND');
  }
}

// 冲突错误
export class ConflictError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

// 限流错误
export class RateLimitError extends CustomError {
  constructor(message: string = '请求过于频繁') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

// 数据库错误
export class DatabaseError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

// 外部服务错误
export class ExternalServiceError extends CustomError {
  constructor(service: string, message: string, details?: any) {
    super(`${service}服务错误: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

// 错误码映射
export const ErrorCodes = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  
  // 认证授权
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  
  // 业务错误
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  PASSWORD_INCORRECT: 'PASSWORD_INCORRECT',
  
  // 数据错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // 系统错误
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const;

// 错误信息国际化
export const ErrorMessages = {
  zh: {
    [ErrorCodes.UNKNOWN_ERROR]: '未知错误',
    [ErrorCodes.INVALID_PARAMETER]: '参数无效',
    [ErrorCodes.MISSING_PARAMETER]: '缺少必要参数',
    [ErrorCodes.AUTHENTICATION_ERROR]: '认证失败',
    [ErrorCodes.AUTHORIZATION_ERROR]: '权限不足',
    [ErrorCodes.TOKEN_EXPIRED]: '令牌已过期',
    [ErrorCodes.TOKEN_INVALID]: '令牌无效',
    [ErrorCodes.BUSINESS_ERROR]: '业务错误',
    [ErrorCodes.USER_NOT_FOUND]: '用户不存在',
    [ErrorCodes.ACCOUNT_DISABLED]: '账户已禁用',
    [ErrorCodes.PASSWORD_INCORRECT]: '密码错误',
    [ErrorCodes.VALIDATION_ERROR]: '数据验证失败',
    [ErrorCodes.DATABASE_ERROR]: '数据库错误',
    [ErrorCodes.DUPLICATE_ENTRY]: '数据已存在',
    [ErrorCodes.INTERNAL_SERVER_ERROR]: '服务器内部错误',
    [ErrorCodes.EXTERNAL_SERVICE_ERROR]: '外部服务错误',
    [ErrorCodes.RATE_LIMIT_ERROR]: '请求过于频繁',
    [ErrorCodes.SERVICE_UNAVAILABLE]: '服务不可用'
  },
  en: {
    [ErrorCodes.UNKNOWN_ERROR]: 'Unknown error',
    [ErrorCodes.INVALID_PARAMETER]: 'Invalid parameter',
    [ErrorCodes.MISSING_PARAMETER]: 'Missing required parameter',
    [ErrorCodes.AUTHENTICATION_ERROR]: 'Authentication failed',
    [ErrorCodes.AUTHORIZATION_ERROR]: 'Insufficient permissions',
    [ErrorCodes.TOKEN_EXPIRED]: 'Token expired',
    [ErrorCodes.TOKEN_INVALID]: 'Invalid token',
    [ErrorCodes.BUSINESS_ERROR]: 'Business error',
    [ErrorCodes.USER_NOT_FOUND]: 'User not found',
    [ErrorCodes.ACCOUNT_DISABLED]: 'Account disabled',
    [ErrorCodes.PASSWORD_INCORRECT]: 'Incorrect password',
    [ErrorCodes.VALIDATION_ERROR]: 'Validation failed',
    [ErrorCodes.DATABASE_ERROR]: 'Database error',
    [ErrorCodes.DUPLICATE_ENTRY]: 'Duplicate entry',
    [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Internal server error',
    [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'External service error',
    [ErrorCodes.RATE_LIMIT_ERROR]: 'Rate limit exceeded',
    [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service unavailable'
  }
};

// 错误处理工具函数
export class ErrorHandler {
  // 格式化错误响应
  static formatError(error: Error, locale: string = 'zh'): any {
    const isCustomError = error instanceof CustomError;
    const status = isCustomError ? error.status : 500;
    const code = isCustomError ? error.code : ErrorCodes.UNKNOWN_ERROR;
    const message = isCustomError ? error.message : ErrorMessages[locale][ErrorCodes.UNKNOWN_ERROR];
    const details = isCustomError ? error.details : undefined;

    return {
      success: false,
      code: status,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        path: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    };
  }

  // 判断是否为可重试的错误
  static isRetryableError(error: Error): boolean {
    if (error instanceof CustomError) {
      return [502, 503, 504].includes(error.status);
    }
    return false;
  }

  // 判断是否为客户端错误
  static isClientError(error: Error): boolean {
    if (error instanceof CustomError) {
      return error.status >= 400 && error.status < 500;
    }
    return false;
  }

  // 判断是否为服务器错误
  static isServerError(error: Error): boolean {
    if (error instanceof CustomError) {
      return error.status >= 500;
    }
    return true;
  }

  // 创建标准错误
  static createError(
    code: keyof typeof ErrorCodes,
    message?: string,
    status?: number,
    details?: any
  ): CustomError {
    const defaultStatus = {
      [ErrorCodes.AUTHENTICATION_ERROR]: 401,
      [ErrorCodes.AUTHORIZATION_ERROR]: 403,
      [ErrorCodes.VALIDATION_ERROR]: 422,
      [ErrorCodes.RATE_LIMIT_ERROR]: 429,
      [ErrorCodes.DATABASE_ERROR]: 500,
      [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 502,
      [ErrorCodes.SERVICE_UNAVAILABLE]: 503
    }[code] || 400;

    return new CustomError(
      message || ErrorMessages.zh[code],
      status || defaultStatus,
      code,
      details
    );
  }
}
