import { config as loadDotenv } from "dotenv";
import { resolve } from "path";

// 获取环境变量
const env = process.env.NODE_ENV || "development";

// 加载对应的 .env 文件
const envPath = resolve(__dirname, `../../.env`);
loadDotenv({ path: envPath, debug: false });

// 延迟日志记录，等待日志系统初始化完成
let envLoaded = false;
export const logEnvLoaded = () => {
  if (!envLoaded) {
    const { logger } = require("./log");
    logger().info({
      event: `加载的配置环境`,
      message: `${env}`,
    });
    envLoaded = true;
  }
};
export const ServerConfig = {
  // Redis
  redis: {
    default: {
      host: process.env.REDIS_DEFAULT_HOST || "121.43.161.170",
      port: parseInt(process.env.REDIS_DEFAULT_PORT || "6379"),
      username: process.env.REDIS_DEFAULT_USERNAME || "",
      password: process.env.REDIS_DEFAULT_PASSWORD || "",
      db: parseInt(process.env.REDIS_DEFAULT_DB || "0"),
    },
    cache: {
      host: process.env.REDIS_CACHE_HOST || "121.43.161.170",
      port: parseInt(process.env.REDIS_CACHE_PORT || "6379"),
      username: process.env.REDIS_CACHE_USERNAME || "",
      password: process.env.REDIS_CACHE_PASSWORD || "",
      db: parseInt(process.env.REDIS_CACHE_DB || "1"),
    },
  },
  captcha: {
    maxCount: 10,
    second: 60,
  },

  casbin: {
    type: process.env.CASBIN_TYPE! || "mysql",
    host: process.env.CASBIN_HOST! || "121.43.161.170",
    port: process.env.CASBIN_PORT || "3306",
    username: process.env.CASBIN_USERNAME || "root",
    password: process.env.CASBIN_PASSWORD || "123456",
    database: process.env.CASBIN_DATABASE || "test",
    sync: process.env.CASBIN_SYNC || true,
  },
  casbin_postgre: {
    type: process.env.CASBIN_TYPE || "postgres",
    host: process.env.CASBIN_POSTGRE_HOST || "121.43.161.170",
    port: process.env.CASBIN_POSTGRE_PORT || 5432,
    username: process.env.CASBIN_POSTGRE_USERNAME || "root",
    password: process.env.CASBIN_POSTGRE_PASSWORD || "123456",
    database: process.env.CASBIN_POSTGRE_DATABASE || "casbin",
    sync: process.env.CASBIN_POSTGRE_SYNC || true,
  },

  // MySQL
  mysql: {
    default: {
      name: process.env.MYSQL_DEFAULT_NAME!,
      host: process.env.MYSQL_DEFAULT_HOST!,
      port: parseInt(process.env.MYSQL_DEFAULT_PORT!),
      username: process.env.MYSQL_DEFAULT_USERNAME!,
      password: process.env.MYSQL_DEFAULT_PASSWORD!,
      database: process.env.MYSQL_DEFAULT_DATABASE!,
    },
    logDB: {
      name: process.env.MYSQL_LOGDB_NAME!,
      host: process.env.MYSQL_LOGDB_HOST!,
      port: parseInt(process.env.MYSQL_LOGDB_PORT!),
      username: process.env.MYSQL_LOGDB_USERNAME!,
      password: process.env.MYSQL_LOGDB_PASSWORD!,
      database: process.env.MYSQL_LOGDB_DATABASE!,
    },
  },

  postgre: {
    default: {
      name: process.env.POSTGRE_DEFAULT_NAME!,
      host: process.env.POSTGRE_DEFAULT_HOST!,
      port: parseInt(process.env.POSTGRE_DEFAULT_PORT!),
      username: process.env.POSTGRE_DEFAULT_USERNAME!,
      password: process.env.POSTGRE_DEFAULT_PASSWORD!,
      database: process.env.POSTGRE_DEFAULT_DATABASE!,
    },
    logDB: {
      name: process.env.POSTGRE_LOGDB_NAME!,
      host: process.env.POSTGRE_LOGDB_HOST!,
      port: parseInt(process.env.POSTGRE_LOGDB_PORT!),
      username: process.env.POSTGRE_LOGDB_USERNAME!,
      password: process.env.POSTGRE_LOGDB_PASSWORD!,
      database: process.env.POSTGRE_LOGDB_DATABASE!,
    },
  },

  // MongoDB
  mongo: {
    default: process.env.MONGO_DEFAULT!,
    logs: process.env.MONGO_LOGS!,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET! || "your_secret_key",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "your_refresh_secret",
    whiteList: [
      "/api/v1/captcha",
      "/api/v1/test/*",
      "/api/v1/health",
      "/api/v1/auth/login",
      "/api/v1/register",
      "/api/v1/",
      "/api/v1/auth/refresh",
    ],
    exptime: 60 * 60 * 24,
    refreshtime: 60 * 60 * 24 * 7,
    blackListPrefix: process.env.JWT_BLACKLIST!,
  },

  // ETH
  ETH_RPC_URL: process.env.ETH_RPC_URL!,

  // SOLANA
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL!,

  // PORT
  PORT: process.env.PORT || 3000,

  // NODE_ENV
  NODE_ENV: process.env.NODE_ENV || "development",

  // MESSAGE_KEY_PREFIX
  MESSAGE_KEY_PREFIX: process.env.MESSAGE_KEY_PREFIX!,
  APIKEY: process.env.API_KEY || "koa-key",

  ETCD_URL: process.env.ETCD_URL || "http://127.0.0.1:2379",
};
