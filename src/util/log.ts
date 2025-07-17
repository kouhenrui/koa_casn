import { Log, logBody, LoggerOptions, LogLevel } from "./key";
import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
  addColors,
} from "winston";

// 扩展日志级别颜色
addColors({
  error: 'red',
  warn: 'yellow', 
  info: 'green',
  debug: 'blue',
  fatal: 'magenta',
  trace: 'cyan'
});


// 日志配置接口
interface LogConfig {
  level: string;
  enableConsole: boolean;
  enableFile: boolean;
  enableErrorFile: boolean;
  logDir: string;
  enableRequestLog: boolean;
  enablePerformanceLog: boolean;
}

// 默认日志配置
const defaultLogConfig: LogConfig = {
  level: process.env.LOG_LEVEL || 'info',
  enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
  enableFile: process.env.LOG_ENABLE_FILE === 'true',
  enableErrorFile: process.env.LOG_ENABLE_ERROR_FILE !== 'false',
  logDir: process.env.LOG_DIR || 'logs',
  enableRequestLog: process.env.LOG_ENABLE_REQUEST !== 'false',
  enablePerformanceLog: process.env.LOG_ENABLE_PERFORMANCE === 'true',
};

// 单例日志管理器
class LoggerManager {
  private static instance: LoggerManager;
  private winstonLogger: WinstonLogger;
  private config: LogConfig;
  private requestIdGenerator: number = 0;
  private loggerName: string;
  private loggerId: string;

  private constructor(option: LoggerOptions, config?: Partial<LogConfig>) {
    this.config = { ...defaultLogConfig, ...config };
    this.loggerName = option.name;
    this.loggerId = option.id;
    this.winstonLogger = this.createWinstonLogger();

  }

  public static getInstance(option?: LoggerOptions, config?: Partial<LogConfig>): LoggerManager {
    if (!LoggerManager.instance) {
      if (!option) {
        option = { name: "mainServer", id: "mainID", context: "mainContext" };
      }
      LoggerManager.instance = new LoggerManager(option, config);
    }
    return LoggerManager.instance;
  }


  private createWinstonLogger(): WinstonLogger {
    const formats = [
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.errors({ stack: true }),
      format.colorize({ message: true }),
    ];

    formats.push(
      format.printf((info: any) => {
        const { timestamp, level, message, event, data, error, requestId } = info;
        let log = `[${timestamp}] [${this.loggerName}] [${level.toUpperCase()}]`;
        if (event) log += ` [${event}]`;
        if (requestId) log += ` [${requestId}]`;
        if (message) log += ` ${message}`;
        if (data && Object.keys(data).length > 0) log += ` data: ${JSON.stringify(data)}`;
        if (error) log += ` | error: ${error?.message || error?.toString()}`;
        return log;
      })
    );

    return createLogger({
      level: this.config.level,
      format: format.combine(...formats),
      transports: [new transports.Console()],
      exitOnError: false,
    });
  }

  // 生成请求ID
  public generateRequestId(): string {
    return `${Date.now()}-${++this.requestIdGenerator}`;
  }

  // 处理日志体，添加请求ID和敏感信息过滤
  private processLogBody(body: logBody, requestId?: string): any {
    const processedData = { ...body.data };
    processedData.requestId =requestId|| this.generateRequestId();
    
    return {
      message: body.message,
      event: body.event,
      data: processedData,
      error: body.error,
      requestId: requestId,
      userId: body.data?.userId
    };
  }

  // 日志方法
  public async info(body: logBody, requestId?: string): Promise<void> {
    const logData = this.processLogBody(body, requestId);
    this.winstonLogger.info(logData);
  }

  public async warn(body: logBody, requestId?: string): Promise<void> {
    const logData = this.processLogBody(body, requestId);
    this.winstonLogger.warn(logData);
  }

  public async error(body: logBody, requestId?: string): Promise<void> {
    const logData = this.processLogBody(body, requestId);
    this.winstonLogger.error(logData);
  }

  public async debug(body: logBody, requestId?: string): Promise<void> {
    const logData = this.processLogBody(body, requestId);
    this.winstonLogger.debug(logData);
  }

  public async fatal(body: logBody, requestId?: string): Promise<void> {
    const logData = this.processLogBody(body, requestId);
    this.winstonLogger.log('fatal', logData);
  }

  // 请求日志
  public async request(method: string, url: string, status: number, duration: number, userId?: string): Promise<void> {
    if (!this.config.enableRequestLog) return;
    
    await this.info({
      event: 'request',
      message: `${method} ${url} - ${status} (${duration}ms)`,
      data: { method, url, status, duration, userId }
    });
  }

  // 获取日志配置
  public getConfig(): LogConfig {
    return { ...this.config };
  }

  // 更新日志配置
  public updateConfig(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.winstonLogger = this.createWinstonLogger();
  }
}

// 导出函数
export const initLogger = (option?: LoggerOptions, config?: Partial<LogConfig>) => {
  const loggerManager = LoggerManager.getInstance(option, config);
  loggerManager.info({
    event: "logger",
    message: "Logger initialized successfully 📔📔📔",
    data: { config: loggerManager.getConfig() }
  });
  return loggerManager;
};

export const logger = () => {
  return LoggerManager.getInstance();
};

// 便捷的日志方法
export const logInfo = (event: string, message?: string, data?: Record<string, any>, requestId?: string) => {
  logger().info({ event, message, data }, requestId);
};

export const logWarn = (event: string, message?: string, data?: Record<string, any>, requestId?: string) => {
  logger().warn({ event, message, data }, requestId);
};

export const logError = (event: string, message?: string, data?: Record<string, any>, requestId?: string) => {
  logger().error({ event, message, data }, requestId);
};

export const logDebug = (event: string, message?: string, data?: Record<string, any>, requestId?: string) => {
  logger().debug({ event, message, data }, requestId);
};

export const logFatal = (event: string, message?: string, data?: Record<string, any>, requestId?: string) => {
  logger().fatal({ event, message, data }, requestId);
};