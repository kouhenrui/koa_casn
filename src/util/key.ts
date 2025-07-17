const enum sensitive {
  phone = "phone",
  email = "email",
  idCard = "idCard",
  bankCard = "bankCard",
  name = "name",
}
const enum CaptchaType {
  NUMERIC = "numeric",
  ALPHANUMERIC = "alphanumeric",
  MATH = "math",
}
interface LoggerOptions {
  name: string;
  id: string;
  context?: string;
}
const enum LogLevel {
  info = "info",
  warn = "warn",
  error = "error",
  debug = "debug",
  fatal = "fatal",
}

interface Log {
  logger: string; // 日志记录器名称
  ID: string; //日志ID
  level: LogLevel; //'info' | 'warn' | 'error' | 'debug' | 'fatal'; // 日志级别，严格限定为固定值
  timestamp: string; // 时间戳，使用 ISO 8601 格式的字符串
  event: string; // 必填字段，记录事件的名称
  message?: string; // 必填字段，描述日志的主要信息
  data?: Record<string, any>; // 可选字段，记录附加的数据结构
  error?: {
    name?: string; // 错误名称
    message?: string; // 错误信息
    stack?: string; // 错误堆栈
  }; // 可选字段，用于记录错误信息
  ip?: string; // 可选字段，记录 IP 地址
  metadata?: Record<string, any>; // 可选字段，用于存储额外的上下文信息
  requestId?: string; // 可选字段，用于追踪请求 ID
  userId?: string; // 可选字段，记录用户标识
}
// 日志体接口 - 用于记录日志的核心数据结构
interface logBody {
  // 必填字段：事件名称，用于标识日志类型
  event: string;
  
  // 可选字段：日志消息，描述具体内容
  message?: string;
  
  // 可选字段：附加数据，用于存储结构化信息
  data?: Record<string, any>;
  
  // 可选字段：错误对象，用于记录异常信息
  error?: Error;
  
  // 可选字段：请求ID，用于链路追踪
  requestId?: string;
  
  // 可选字段：用户ID，用于用户行为追踪
  userId?: string;
  
  // 可选字段：IP地址，用于安全审计
  ip?: string;
  
  // 可选字段：用户代理，用于客户端信息
  userAgent?: string;
  
  // 可选字段：标签，用于分类和过滤
  tags?: string[];
  
  // 可选字段：级别，用于覆盖默认日志级别
  level?: LogLevel;
  
  // 可选字段：时间戳，用于覆盖默认时间戳
  timestamp?: string;
  
  // 可选字段：上下文，用于存储额外的上下文信息
  context?: Record<string, any>;
  
  // 可选字段：性能指标，用于记录性能相关数据
  performance?: {
    duration?: number;      // 执行时长（毫秒）
    memory?: number;        // 内存使用量
    cpu?: number;          // CPU使用率
    operation?: string;    // 操作名称
  };
  
  // 可选字段：安全信息，用于记录安全相关数据
  security?: {
    action?: string;       // 安全操作类型
    resource?: string;     // 访问资源
    permission?: string;   // 权限级别
    risk?: 'low' | 'medium' | 'high'; // 风险等级
  };
  
  // 可选字段：业务信息，用于记录业务相关数据
  business?: {
    module?: string;       // 业务模块
    operation?: string;    // 业务操作
    entity?: string;       // 业务实体
    status?: string;       // 业务状态
  };
}
interface logData {
  level: string;
  message?: string;
  role: string;
  path: string;
  method: string;
  userId: string;
  resStatus: number;
  error?: string;
}
export {
  sensitive,
  CaptchaType,
  LogLevel,
  LoggerOptions,
  Log,
  logBody,
  logData,
};
