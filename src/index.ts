import "reflect-metadata";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import helmet from "koa-helmet";
import userRoutes from "./routes/router";
import { responseFormatter } from "./middleware/response.middleware";
import { LoggerMiddleware } from "./middleware/logger.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { initRedis } from "./util/redis";
import { initLogger, logDebug, logError,  logger, logInfo, logWarn } from "./util/log";
import { CasbinService } from "./util/casbin";
import { ServerConfig, logEnvLoaded } from "./util/env";
import { initPg } from "./util/orm";
import { EtcdService } from "./util/etcd";
import { getLocalIp, getPublicIp } from "./util/crypto";
// import { i18nMiddleware, localeSwitchMiddleware, localeInfoMiddleware } from "./middleware/i18n.middleware";
import { initI18n } from "./util/i18n-init";
import cluster from "node:cluster";
import os from "node:os";
const app = new Koa();
initLogger();
// 在日志系统初始化后记录环境变量加载
logEnvLoaded();
// 初始化服务
const initializeServices = async () => {
  try {
    // 初始化连接
    await initPg();
    await initRedis();
    await EtcdService.getInstance();
    await CasbinService.getInstance();
    await initI18n();
    logger().info({ event: "servicesInitialized", message: "所有服务初始化完成" });
  } catch (error) {
    logger().error({ event: "serviceInitError", error: error });
    process.exit(1);
  }
};
const primaryCluser=async()=>{
  const numCPUs = os.cpus().length;
  logger().info({ event: "primaryCluster", message: `Primary cluster running on ${numCPUs} CPUs` });
  logger().info({ event: "cluster", message: `is primary: ${cluster.isPrimary}` });
  if (cluster.isPrimary) {
    logger().info({ event: "primaryCluster", message: `Primary cluster running on ${numCPUs} CPUs` });
    for (let i = 0; i < 6; i++) {
      cluster.fork();
    }
  } else {
    logger().info({ event: "workerCluster", message: `Worker cluster running on ${process.pid}` });
  }
}

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors()); // CORS支持
app.use(bodyParser({
  enableTypes: ['json', 'form', 'text'],
  jsonLimit: '10mb',
  formLimit: '10mb',
  textLimit: '10mb',
}));
// 国际化中间件
// app.use(i18nMiddleware());
// app.use(localeSwitchMiddleware());
// app.use(localeInfoMiddleware());
app.use(errorHandler()); // 全局错误处理中间件（必须在最前面）
app.use(LoggerMiddleware); // 日志中间件
app.use(responseFormatter); // 响应格式化（在错误处理之后）
// app.use(authorize("read", "user")); // 权限验证

// 路由
app.use(userRoutes.routes()).use(userRoutes.allowedMethods());

// 全局错误处理（兜底处理）
app.on('error', (err, ctx) => {
  logger().error({
    event: "serverError",
    message: "未捕获的服务器错误",
    error: err,
  });
  
  // 如果响应还没有发送，则发送错误响应
  if (!ctx.res.headersSent) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      code: 500,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '服务器内部错误',
        timestamp: new Date().toISOString()
      }
    };
  }
});

// 优雅关闭
const gracefulShutdown = (signal: string) => {
  logger().info({ event: "shutdown", message: signal });
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// 启动服务器
const startServer = async () => {
 // await primaryCluser() 多线程模式
  // await initializeServices();
  const port = ServerConfig.PORT;
  const localIp = getLocalIp();
  const publicIp = await getPublicIp();
  
  const server = app.listen(port, () => {
    // 立即打印本地和局域网地址
    logger().info({
      event: "serverStarted",
      message: `server running at - Local: http://localhost:${port} 🚀 - LAN: http://${localIp}:${port} 🚀  - Public: http://${publicIp}:${port} 🚀`,
    });
  });

  // 服务器错误处理
  server.on('error', (error) => {
    logger().error({ event: "serverError", error: error });
    process.exit(1);
  });
};

startServer()
