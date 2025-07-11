import { Log, logBody, LoggerOptions, LogLevel } from "./key";
import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from "winston";
let loggerService: loggerManager;
export const initLogger = (option?: LoggerOptions) => {
  if (!option) {
    option = { name: "mainServer", id: "mainID", context: "mainContext" };
  }
  if (!loggerService) loggerService = new loggerManager(option);
  loggerService.info({
    event: "logger",
    message: "logger init success 📔📔📔",     
  })
  
};
export const logger = () => {
  if (!loggerService)
    initLogger({ name: "mainServer", id: "mainID", context: "mainContext" });
  return loggerService;
};
class loggerManager {
  private logger: Logger;

  constructor(option: LoggerOptions) {
    this.logger = new Logger(option);
  }

  public async info(body: logBody): Promise<void> {
    await this.logger.log(LogLevel.info, body);
  }
  public async warn(body: logBody): Promise<void> {
    await this.logger.log(LogLevel.warn, body);
  }
  public async error(body: logBody): Promise<void> {
    await this.logger.log(LogLevel.error, body);
  }

  public async debug(body: logBody): Promise<void> {
    await this.logger.log(LogLevel.debug, body);
  }
  public async fatal(body: logBody): Promise<void> {
    await this.logger.log(LogLevel.fatal, body);
  }
}

// 日志实现类
class Logger {
  private logger: WinstonLogger;
  private name: string;
  private id: string;

  constructor(option: LoggerOptions) {
    this.id = option.id;
    this.name = option.name;
    const logFormat = format.printf(
      ({ level, message, timestamp, event, data, error }) => {
        let log = `[${timestamp}] [${this.name}] [${level}] [${event}]`;
        if (message) log += `${message}`;
        if (data) log += `[data]:${JSON.stringify(data)}`;

        //使用类型守卫捕捉try catch捕捉的错误类型
        if (
          error &&
          typeof error === "object" &&
          "message" in error &&
          "stack" in error
        ) {
          log += `[error]:${JSON.stringify(error.message)}:错误定位点在${
            JSON.stringify(error.stack)//.split("at")[1]
          }`;
        }
        return log;
      }
    );

    this.logger = createLogger({
      level: "debug",
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.colorize(), // 彩色输出
        format.json(),
        logFormat // 自定义格式
      ),
      transports: [new transports.Console()],
    });
  }

  // 格式化日志
  private formatLog(level: LogLevel, body: logBody): Log {
    return {
      logger: this.name,
      ID: this.id,
      level: level,
      timestamp: new Date().toISOString(),
      event: body.event,
      message: body.message,
      data: body.data,
      error: body.error
        ? {
            name: body.error.name,
            message: body.error.message,
            stack: body.error.stack,
          }
        : undefined,
    };
  }

  // 日志写入队列
  public async log(level: LogLevel, body: logBody): Promise<void> {
    const logEntry = this.formatLog(level, body); // event, message, data, error);
    await this.logger.log(level, logEntry);
  }
}
