# 日志系统优化

## 概述

本项目实现了一套功能完善的日志系统，支持多种日志级别、文件输出、性能监控、审计日志等功能。

## 特性

- ✅ **多级别日志**：debug、info、warn、error、fatal
- ✅ **多种输出**：控制台、文件、错误文件
- ✅ **性能监控**：自动记录方法执行时间
- ✅ **审计日志**：记录用户操作和资源访问
- ✅ **请求追踪**：支持请求ID和链路追踪
- ✅ **敏感信息过滤**：自动过滤密码、token等敏感数据
- ✅ **结构化日志**：JSON格式，便于分析
- ✅ **彩色输出**：控制台彩色显示
- ✅ **配置灵活**：支持环境变量配置
- ✅ **装饰器支持**：性能监控和审计日志装饰器

## 配置

### 环境变量配置

```bash
# 日志级别
LOG_LEVEL=info

# 输出配置
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=true
LOG_ENABLE_ERROR_FILE=true

# 日志目录
LOG_DIR=logs

# 功能开关
LOG_ENABLE_REQUEST=true
LOG_ENABLE_PERFORMANCE=true
LOG_ENABLE_AUDIT=true
```

### 配置接口

```typescript
interface LogConfig {
  level: string;                    // 日志级别
  enableConsole: boolean;           // 是否启用控制台输出
  enableFile: boolean;              // 是否启用文件输出
  enableErrorFile: boolean;         // 是否启用错误文件输出
  logDir: string;                   // 日志目录
  enableRequestLog: boolean;        // 是否启用请求日志
  enablePerformanceLog: boolean;    // 是否启用性能日志
  enableAuditLog: boolean;          // 是否启用审计日志
  sensitiveFields: string[];        // 敏感字段列表
}
```

## 使用方法

### 1. 基本日志记录

```typescript
import { 
  logInfo, 
  logWarn, 
  logError, 
  logDebug, 
  logFatal,
  logger 
} from '../util/log';

// 使用便捷方法
logInfo('user_action', '用户登录成功', { userId: '123', ip: '127.0.0.1' });
logWarn('security', '检测到异常登录尝试', { ip: '127.0.0.1' });
logError('database', '数据库连接失败', { operation: 'query' });
logDebug('debug', '调试信息', { requestBody: ctx.request.body });
logFatal('system', '系统严重错误', { component: 'auth' });

// 使用logger实例
const log = logger();
await log.info({
  event: 'custom_event',
  message: '自定义事件',
  data: { custom: 'data' }
});
```

### 2. 性能监控

```typescript
import { logPerformance } from '../util/log';

class UserService {
  @logPerformance('用户查询')
  async getUserById(id: string) {
    // 方法执行时间会被自动记录
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id, name: 'John Doe' };
  }

  @logPerformance('文件上传')
  async uploadFile(file: any) {
    // 文件上传性能会被记录
    await new Promise(resolve => setTimeout(resolve, 500));
    return { filename: file.name, size: file.size };
  }
}
```

### 3. 审计日志

```typescript
import { logAudit } from '../util/log';

class UserController {
  @logAudit('create', (args) => `user_${args[0]?.id}`)
  async createUser(userData: any) {
    // 创建用户操作会被审计记录
    return { id: '123', ...userData };
  }

  @logAudit('update', (args) => `user_${args[0]}`)
  async updateUser(id: string, userData: any) {
    // 更新用户操作会被审计记录
    return { id, ...userData };
  }

  @logAudit('delete', (args) => `user_${args[0]}`)
  async deleteUser(id: string) {
    // 删除用户操作会被审计记录
    return { deleted: true, id };
  }
}
```

### 4. 请求日志中间件

```typescript
import { logger } from '../util/log';

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
```

### 5. 业务日志示例

```typescript
class OrderService {
  async processOrder(orderData: any, ctx: Context) {
    const requestId = ctx.state.requestId;
    
    try {
      // 记录订单开始处理
      await logger().info({
        event: 'order_processing_start',
        message: '开始处理订单',
        data: { orderId: orderData.id, amount: orderData.amount }
      }, requestId);

      // 验证订单
      await this.validateOrder(orderData);
      
      // 记录验证成功
      await logger().info({
        event: 'order_validation_success',
        message: '订单验证成功',
        data: { orderId: orderData.id }
      }, requestId);

      // 处理支付
      const paymentResult = await this.processPayment(orderData);
      
      // 记录支付结果
      await logger().info({
        event: 'payment_processed',
        message: '支付处理完成',
        data: { 
          orderId: orderData.id, 
          paymentId: paymentResult.id,
          status: paymentResult.status 
        }
      }, requestId);

      return paymentResult;
    } catch (error: any) {
      // 记录错误
      await logger().error({
        event: 'order_processing_error',
        message: '订单处理失败',
        data: { 
          orderId: orderData.id, 
          error: error.message,
          step: 'processing'
        }
      }, requestId);
      
      throw error;
    }
  }
}
```

### 6. 安全日志

```typescript
class SecurityService {
  async loginAttempt(credentials: any, ctx: Context) {
    const requestId = ctx.state.requestId;
    
    try {
      // 记录登录尝试
      await logger().info({
        event: 'login_attempt',
        message: '用户登录尝试',
        data: { 
          username: credentials.username,
          ip: ctx.ip,
          userAgent: ctx.headers['user-agent']
        }
      }, requestId);

      // 验证凭据
      const user = await this.validateCredentials(credentials);
      
      if (user) {
        // 记录登录成功
        await logger().info({
          event: 'login_success',
          message: '用户登录成功',
          data: { 
            userId: user.id,
            username: user.username,
            ip: ctx.ip
          }
        }, requestId);
        
        return user;
      } else {
        // 记录登录失败
        await logger().warn({
          event: 'login_failed',
          message: '用户登录失败',
          data: { 
            username: credentials.username,
            ip: ctx.ip,
            reason: 'invalid_credentials'
          }
        }, requestId);
        
        throw new Error('用户名或密码错误');
      }
    } catch (error: any) {
      // 记录登录错误
      await logger().error({
        event: 'login_error',
        message: '登录过程发生错误',
        data: { 
          username: credentials.username,
          ip: ctx.ip,
          error: error.message
        }
      }, requestId);
      
      throw error;
    }
  }
}
```

## 日志格式

### 控制台输出格式

```
[2024-01-01 12:00:00] [mainServer] [INFO] [user_action] [req_123] 用户登录成功 | data: {"userId":"123","ip":"127.0.0.1"}
```

### 文件输出格式（JSON）

```json
{
  "logger": "mainServer",
  "ID": "mainID",
  "level": "info",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "event": "user_action",
  "message": "用户登录成功",
  "data": {
    "userId": "123",
    "ip": "127.0.0.1",
    "requestId": "req_123"
  },
  "requestId": "req_123",
  "userId": "123"
}
```

### 性能日志格式

```json
{
  "event": "performance",
  "message": "用户查询 took 150ms",
  "data": {
    "operation": "用户查询",
    "duration": 150,
    "method": "getUserById"
  }
}
```

### 审计日志格式

```json
{
  "event": "audit",
  "message": "create on user_123",
  "data": {
    "action": "create",
    "resource": "user_123",
    "userId": "admin",
    "method": "createUser",
    "success": true
  }
}
```

## 日志文件

### 文件结构

```
logs/
├── application.log    # 应用日志
└── error.log         # 错误日志
```

### 日志轮转

当前使用简单的文件输出，后续可以集成 `winston-daily-rotate-file` 实现日志轮转：

```typescript
// 安装依赖
npm install winston-daily-rotate-file

// 使用示例
import DailyRotateFile from 'winston-daily-rotate-file';

transports.push(new DailyRotateFile({
  filename: path.join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d'
}));
```

## 敏感信息过滤

系统会自动过滤以下敏感字段：

```typescript
const sensitiveFields = [
  'password',
  'token', 
  'secret',
  'key',
  'authorization'
];
```

敏感信息会被替换为 `***REDACTED***`。

## 最佳实践

### 1. 日志级别使用

- **debug**: 调试信息，开发环境使用
- **info**: 一般信息，记录正常流程
- **warn**: 警告信息，需要注意但不影响功能
- **error**: 错误信息，功能异常
- **fatal**: 严重错误，系统崩溃

### 2. 日志内容

- 使用有意义的event名称
- 提供清晰的message描述
- 在data中包含必要的上下文信息
- 避免记录敏感信息

### 3. 性能考虑

- 使用异步日志记录
- 避免在日志中执行复杂操作
- 合理使用日志级别
- 定期清理日志文件

### 4. 错误处理

- 记录完整的错误信息
- 包含错误发生的上下文
- 使用try-catch包装日志操作
- 防止日志系统错误影响主程序

### 5. 监控和分析

- 使用结构化日志便于分析
- 设置日志告警机制
- 定期分析日志模式
- 监控日志文件大小

## 扩展功能

### 1. 添加新的日志类型

```typescript
// 添加业务日志方法
export const logBusiness = (event: string, message?: string, data?: Record<string, any>, requestId?: string) => {
  logger().info({ event, message, data }, requestId);
};

// 添加安全日志方法
export const logSecurity = (event: string, message?: string, data?: Record<string, any>, requestId?: string) => {
  logger().warn({ event, message, data }, requestId);
};
```

### 2. 自定义日志格式

```typescript
// 自定义日志格式
const customFormat = format.printf((info: any) => {
  const { timestamp, level, message, event, data, requestId } = info;
  return `[${timestamp}] [${level.toUpperCase()}] [${event}] ${message} ${JSON.stringify(data)}`;
});
```

### 3. 日志聚合

```typescript
// 批量日志记录
export const logBatch = async (logs: Array<{event: string, message: string, data?: any}>) => {
  for (const log of logs) {
    await logger().info(log);
  }
};
```

这个优化的日志系统提供了完整的日志解决方案，支持多种使用场景，便于监控、调试和审计。 