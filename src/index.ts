import "reflect-metadata";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import helmet from "koa-helmet";
import userRoutes from "./routes/router";
import { authorize } from "./middleware/auth";
import { responseFormatter } from "./middleware/response.middleware";
import { LoggerMiddleware } from "./middleware/logger.middleware";
import { initRedis } from "./util/redis";
import { logger } from "./util/log";
import { CasbinService } from "./util/casbin";
import { ServerConfig } from "./util/env";
import { initPg } from "./util/orm";

const app = new Koa();
// 初始化服务
const initializeServices = async () => {
  try {
    // 初始化连接
    await initPg();
    await initRedis();
    await CasbinService.getInstance();
    logger().info({ event: "servicesInitialized", message: "所有服务初始化完成" });
  } catch (error) {
    logger().error({ event: "serviceInitError", error: error });
    process.exit(1);
  }
};

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors()); // CORS支持
app.use(bodyParser({
  enableTypes: ['json', 'form', 'text'],
  jsonLimit: '10mb',
  formLimit: '10mb',
  textLimit: '10mb',
}));
app.use(LoggerMiddleware); // 日志中间件
app.use(responseFormatter); // 响应格式化
// app.use(authorize("read", "user")); // 权限验证

// 路由
app.use(userRoutes.routes()).use(userRoutes.allowedMethods());

// 全局错误没有被response middleware捕捉到的错误处理
app.on('error', (err, ctx) => {
  logger().error({
    event: "serverError",
    error: err,
  });
  ctx.status = 200;
  ctx.body = {
    code: -1,
    message: "服务器错误",
    data: null,
    success: false,
  };
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
  await initializeServices();
  
  const port = ServerConfig.PORT || '3000';
  const server = app.listen(port, () => {
    logger().info({
      event: "serverStarted",
      message: `服务器运行在 http://localhost:${port} 🚀`,
      data: {
        environment: ServerConfig.NODE_ENV
      }
    });
  });

  // 服务器错误处理
  server.on('error', (error) => {
    logger().error({ event: "serverError", error: error });
    process.exit(1);
  });
};

startServer().catch((error) => {
  logger().error({ event: "startupError", error: error.message });
  process.exit(1);
});
