import { DataSource } from "typeorm";
import { ServerConfig } from "./env";
import { logger } from "./log";
import { entityList } from "../orm/entity/index"  ;

//配置Postgres default连接参数
export const DefaultPGDataSource = new DataSource({
  type: "postgres",
  name: ServerConfig.postgre.default.name || "pg_default",
  host: ServerConfig.postgre.default.host || "121.43.161.170",
  port: ServerConfig.postgre.default.port || 5432,
  username: ServerConfig.postgre.default.username || "root",
  password: ServerConfig.postgre.default.password || "123456",
  database: ServerConfig.postgre.default.database || "koa_casbin",
  synchronize: true,
  logging: false,
  entities: entityList,
  migrations: [],
  subscribers: [],
  extra: {
    //池化连接配置
    connectionLimit: 20,
  },
});


//在postgres自动迁移建表
export const initPg = async () => {
  try {
    await DefaultPGDataSource.initialize();
    logger().info({
      event: "postgres",
      message: "pg connected success 🐘🐘🐘",
    });
  } catch (err: any) {
    logger().error({
      event: "pg connection error ❌",
      error: err,
    });
    process.exit(1);
  }
};
