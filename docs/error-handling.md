# 全局错误处理机制

## 概述

本项目实现了一套完整的全局错误处理机制，包括自定义错误类型、错误处理中间件、错误格式化、日志记录等功能。

## 特性

- ✅ **自定义错误类型**：支持业务错误、验证错误、认证错误等多种类型
- ✅ **全局错误处理**：自动捕获和处理所有未捕获的错误
- ✅ **错误格式化**：统一的错误响应格式
- ✅ **国际化支持**：支持中英文错误消息
- ✅ **错误日志**：详细的错误日志记录
- ✅ **重试机制**：支持自动重试可恢复的错误
- ✅ **错误边界**：类方法的错误边界装饰器
- ✅ **开发模式**：开发环境下提供详细的调试信息

## 错误类型

### 基础错误类型

```typescript
// 自定义错误基类
class CustomError extends Error {
  public status: number;    // HTTP状态码
  public code: string;      // 错误代码
  public details?: any;     // 错误详情
}

// 业务错误
class BusinessError extends CustomError

// 验证错误
class ValidationError extends CustomError

// 认证错误
class AuthenticationError extends CustomError

// 授权错误
class AuthorizationError extends CustomError

// 资源不存在错误
class NotFoundError extends CustomError

// 冲突错误
class ConflictError extends CustomError

// 限流错误
class RateLimitError extends CustomError

// 数据库错误
class DatabaseError extends CustomError

// 外部服务错误
class ExternalServiceError extends CustomError
```

### 错误代码

```typescript
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
}
```

## 使用方法

### 1. 基本错误抛出

```typescript
import { 
  BusinessError, 
  ValidationError, 
  AuthenticationError,
  NotFoundError 
} from '../util/error';

// 抛出业务错误
if (!userData) {
  throw new BusinessError('用户数据不能为空');
}

// 抛出验证错误
if (!email) {
  throw new ValidationError('邮箱地址必填', {
    field: 'email',
    value: email,
    rule: 'required'
  });
}

// 抛出认证错误
if (!token) {
  throw new AuthenticationError('用户未登录');
}

// 抛出资源不存在错误
if (!user) {
  throw new NotFoundError('用户');
}
```

### 2. 使用错误处理工具

```typescript
import { ErrorHandler, ErrorCodes } from '../util/error';

try {
  await databaseOperation();
} catch (error) {
  throw ErrorHandler.createError(
    ErrorCodes.DATABASE_ERROR,
    '数据库连接失败',
    500,
    { operation: 'query', table: 'users' }
  );
}
```

### 3. 异步错误包装器

```typescript
import { asyncHandler } from '../middleware/error.middleware';

const riskyOperation = asyncHandler(async (ctx) => {
  // 这个函数中的任何错误都会被自动捕获和处理
  const result = await someRiskyOperation();
  ctx.body = { success: true, data: result };
});
```

### 4. 错误边界装饰器

```typescript
import { errorBoundary } from '../middleware/error.middleware';

class UserService {
  @errorBoundary
  async createUser(userData: any) {
    // 这个方法中的错误会被自动记录
    if (!userData.email) {
      throw new ValidationError('邮箱必填');
    }
    return await saveUser(userData);
  }
}
```

### 5. 重试机制

```typescript
import { withRetry } from '../middleware/error.middleware';

const result = await withRetry(
  async () => {
    // 模拟可能失败的外部API调用
    const response = await externalApiCall();
    if (!response.ok) {
      throw new Error('API调用失败');
    }
    return response.data;
  },
  3,    // 最大重试次数
  1000  // 初始延迟时间（毫秒）
);
```

### 6. 批量操作错误处理

```typescript
const operations = ctx.request.body.operations || [];
const results = [];
const errors = [];

for (let i = 0; i < operations.length; i++) {
  try {
    const result = await processOperation(operations[i]);
    results.push({ index: i, success: true, data: result });
  } catch (error) {
    errors.push({ 
      index: i, 
      success: false, 
      error: ErrorHandler.formatError(error, 'zh')
    });
  }
}

ctx.body = {
  success: errors.length === 0,
  data: { results, errors }
};
```

### 7. 错误恢复和降级

```typescript
try {
  // 尝试主要操作
  const result = await primaryOperation();
  ctx.body = { success: true, data: result, source: 'primary' };
} catch (error) {
  // 如果主要操作失败，尝试备用操作
  try {
    const fallbackResult = await fallbackOperation();
    ctx.body = { 
      success: true, 
      data: fallbackResult, 
      source: 'fallback',
      warning: '使用备用数据源'
    };
  } catch (fallbackError) {
    // 如果备用操作也失败，返回错误
    throw new CustomError(
      '所有操作都失败了',
      503,
      'SERVICE_UNAVAILABLE',
      {
        primaryError: error.message,
        fallbackError: fallbackError.message
      }
    );
  }
}
```

## 错误响应格式

### 成功响应
```json
{
  "success": true,
  "code": 200,
  "data": { ... },
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "code": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "数据验证失败",
    "details": {
      "field": "email",
      "value": "invalid-email",
      "rule": "email format"
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 开发模式下的错误响应
```json
{
  "success": false,
  "code": 500,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "服务器内部错误",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "debug": {
    "stack": "Error: ...",
    "url": "/api/users",
    "method": "POST",
    "headers": { ... },
    "body": { ... },
    "query": { ... },
    "params": { ... }
  }
}
```

## 错误处理中间件

### 全局错误处理中间件

```typescript
import { errorHandler } from '../middleware/error.middleware';

// 在应用中使用（必须在最前面）
app.use(errorHandler());
```

### 错误类型自动识别

中间件会自动识别以下错误类型：

- **数据库错误**：MySQL、PostgreSQL等数据库错误
- **验证错误**：数据验证失败
- **JWT错误**：令牌过期、无效等
- **限流错误**：请求频率限制
- **外部服务错误**：网络连接、超时等

## 日志记录

错误处理中间件会自动记录详细的错误日志：

```typescript
// 错误日志格式
{
  event: 'error',
  url: '/api/users',
  method: 'POST',
  ip: '127.0.0.1',
  userAgent: 'Mozilla/5.0...',
  userId: 'user123',
  error: {
    name: 'ValidationError',
    message: '数据验证失败',
    stack: 'Error: ...',
    code: 'VALIDATION_ERROR',
    status: 422
  },
  request: {
    headers: { ... },
    body: { ... },
    query: { ... },
    params: { ... }
  }
}
```

## 测试和演示

### 错误处理演示路由

项目提供了完整的错误处理演示路由，可以通过以下端点测试：

- `GET /error-demo/business` - 业务错误
- `GET /error-demo/validation` - 验证错误
- `GET /error-demo/auth` - 认证错误
- `GET /error-demo/permission` - 权限错误
- `GET /error-demo/notfound` - 资源不存在错误
- `GET /error-demo/conflict` - 冲突错误
- `GET /error-demo/rate-limit` - 限流错误
- `GET /error-demo/database` - 数据库错误
- `GET /error-demo/external` - 外部服务错误
- `GET /error-demo/custom` - 自定义错误
- `GET /error-demo/async` - 异步错误处理
- `POST /error-demo/batch` - 批量操作错误处理
- `GET /error-demo/recovery` - 错误恢复和降级
- `POST /error-demo/conditional` - 条件错误处理
- `GET /error-demo/uncaught` - 未捕获错误
- `GET /error-demo/db-error` - 数据库错误模拟
- `GET /error-demo/jwt-error` - JWT错误模拟

### 测试示例

```bash
# 测试业务错误
curl http://localhost:3000/error-demo/business

# 测试验证错误
curl http://localhost:3000/error-demo/validation

# 测试批量操作
curl -X POST http://localhost:3000/error-demo/batch \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"type": "success"},
      {"type": "error"},
      {"type": "success"}
    ]
  }'
```

## 最佳实践

### 1. 错误分类
- 使用合适的错误类型
- 提供有意义的错误消息
- 包含必要的错误详情

### 2. 错误处理
- 在业务逻辑中主动抛出错误
- 使用错误处理工具创建标准错误
- 避免在中间件中吞掉错误

### 3. 日志记录
- 记录足够的上下文信息
- 区分客户端错误和服务器错误
- 保护敏感信息

### 4. 用户体验
- 提供友好的错误消息
- 在开发环境下提供调试信息
- 支持错误国际化

### 5. 性能考虑
- 避免在错误处理中执行耗时操作
- 合理使用重试机制
- 避免错误处理中的无限循环

## 配置

### 环境变量

```bash
# 环境模式
NODE_ENV=development

# 日志级别
LOG_LEVEL=debug

# 错误处理配置
ERROR_HANDLING_DEBUG=true
ERROR_HANDLING_LOCALE=zh
```

### 中间件配置

```typescript
// 自定义错误处理中间件配置
app.use(errorHandler({
  debug: process.env.NODE_ENV === 'development',
  locale: 'zh',
  logLevel: 'error'
}));
```

## 扩展

### 添加新的错误类型

```typescript
// 自定义错误类型
export class PaymentError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'PAYMENT_ERROR', details);
  }
}

// 添加错误代码
export const ErrorCodes = {
  // ... 现有错误代码
  PAYMENT_ERROR: 'PAYMENT_ERROR'
};

// 添加错误消息
export const ErrorMessages = {
  zh: {
    // ... 现有错误消息
    [ErrorCodes.PAYMENT_ERROR]: '支付失败'
  },
  en: {
    // ... 现有错误消息
    [ErrorCodes.PAYMENT_ERROR]: 'Payment failed'
  }
};
```

### 自定义错误处理逻辑

```typescript
// 扩展错误处理中间件
export const customErrorHandler = (options: any) => async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    // 自定义错误处理逻辑
    if (error instanceof PaymentError) {
      // 特殊处理支付错误
      await handlePaymentError(ctx, error);
    } else {
      // 使用默认错误处理
      await handleError(ctx, error);
    }
  }
};
```

这个全局错误处理机制提供了完整的错误处理解决方案，确保应用的稳定性和可维护性。 