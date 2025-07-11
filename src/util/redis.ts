import Redis from "ioredis";
import { logger } from "./log";
import { ServerConfig } from "./env";

// Redis配置接口
interface RedisConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}

// Redis操作结果接口
interface RedisResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class RedisService {
  private client: Redis;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 10;

  constructor() {
    const defaultConfig: RedisConfig = {
      host: "121.43.161.170",
      port: 6379,
      // username: ServerConfig.redis.default.username,
      // password: ServerConfig.redis.default.password,
      // db: ServerConfig.redis.default.db,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    };

    const finalConfig = { ...defaultConfig };

    this.client = new Redis({
      ...finalConfig,
      retryStrategy: (times) => {
        this.reconnectAttempts = times;
        if (times > this.maxReconnectAttempts) {
          logger().error({ 
            event: "redisMaxRetries", 
            message: `Redis重连次数超过${this.maxReconnectAttempts}次，停止重连` 
          });
          return null; // 停止重连
        }
        const delay = Math.min(times * 100, 3000);
        logger().warn({ 
          event: "redisReconnecting", 
          message: `Redis重连第${times}次，延迟${delay}ms` 
        });
        return delay;
      },
      reconnectOnError: (err) => {
        const targetErrors = ["READONLY", "ECONNREFUSED", "ETIMEDOUT"];
        return targetErrors.some(error => err.message.includes(error));
      },
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.client.on("connect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger().info({ 
        event: "redis", 
        message: "Redis连接成功 🔥🔥🔥" 
      });
    });

    this.client.on("ready", () => {
      logger().info({ 
        event: "redisReady", 
        message: "Redis服务就绪" 
      });
    });

    this.client.on("error", (err) => {
      this.isConnected = false;
             logger().error({ 
         event: "redisError", 
         error: err 
       });
    });

    this.client.on("close", () => {
      this.isConnected = false;
      logger().warn({ 
        event: "redisClosed", 
        message: "Redis连接已关闭" 
      });
    });

    this.client.on("reconnecting", () => {
      logger().info({ 
        event: "redisReconnecting", 
        message: "Redis正在重连..." 
      });
    });
  }

  // 连接状态检查
  public isReady(): boolean {
    return this.isConnected && this.client.status === 'ready';
  }

  // 等待连接就绪
  public async waitForReady(timeout: number = 5000): Promise<boolean> {
    if (this.isReady()) return true;
    
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeout);
      
      const checkReady = () => {
        if (this.isReady()) {
          clearTimeout(timer);
          resolve(true);
        } else {
          setTimeout(checkReady, 100);
        }
      };
      
      checkReady();
    });
  }

  // ==================== 基础键值操作 ====================
  
  /**
   * 设置键值对
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<RedisResult<string>> {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      const result = ttlSeconds 
        ? await this.client.set(key, data, "EX", ttlSeconds)
        : await this.client.set(key, data);
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取值
   */
  async get<T = any>(key: string): Promise<RedisResult<T>> {
    try {
      const val = await this.client.get(key);
      if (!val) return { success: true, data: null };
      
      try {
        return { success: true, data: JSON.parse(val) as T };
      } catch {
        return { success: true, data: val as unknown as T };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除键
   */
  async del(key: string): Promise<RedisResult<number>> {
    try {
      const result = await this.client.del(key);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<RedisResult<boolean>> {
    try {
      const result = await this.client.exists(key);
      return { success: true, data: result === 1 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, seconds: number): Promise<RedisResult<boolean>> {
    try {
      const result = await this.client.expire(key, seconds);
      return { success: true, data: result === 1 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==================== 缓存操作 ====================
  
  /**
   * 设置缓存（无过期时间）
   */
  async setCache(key: string, value: any): Promise<RedisResult<string>> {
    return this.set(key, value);
  }

  /**
   * 设置缓存（带过期时间）
   */
  async setCacheEx(key: string, value: any, ttl: number = 3600): Promise<RedisResult<string>> {
    return this.set(key, value, ttl);
  }

  /**
   * 获取缓存
   */
  async getCache<T = any>(key: string): Promise<RedisResult<T>> {
    const exists = await this.exists(key);
    if (!exists.success || !exists.data) {
      return { success: true, data: null };
    }
    return this.get<T>(key);
  }

  /**
   * 批量获取缓存
   */
  async mgetCache<T = any>(keys: string[]): Promise<RedisResult<T[]>> {
    try {
      const values = await this.client.mget(...keys);
      const result = values.map(val => {
        if (!val) return null;
        try {
          return JSON.parse(val) as T;
        } catch {
          return val as unknown as T;
        }
      });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==================== 计数器操作 ====================
  
  /**
   * 自增并设置过期时间
   */
  async incrWithExpire(key: string, expireSeconds: number): Promise<RedisResult<number>> {
    try {
      const current = await this.client.incr(key);
      if (current === 1) {
        await this.client.expire(key, expireSeconds);
      }
      return { success: true, data: current };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 自增
   */
  async incr(key: string): Promise<RedisResult<number>> {
    try {
      const result = await this.client.incr(key);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 自减
   */
  async decr(key: string): Promise<RedisResult<number>> {
    try {
      const result = await this.client.decr(key);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==================== 哈希表操作 ====================
  
  /**
   * 设置哈希表字段
   */
  async hset(key: string, field: string, value: string | number): Promise<RedisResult<number>> {
    try {
      const result = await this.client.hset(key, field, value.toString());
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取哈希表字段
   */
  async hget(key: string, field: string): Promise<RedisResult<string>> {
    try {
      const result = await this.client.hget(key, field);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取哈希表所有字段
   */
  async hgetall(key: string): Promise<RedisResult<Record<string, string>>> {
    try {
      const result = await this.client.hgetall(key);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除哈希表字段
   */
  async hdel(key: string, field: string): Promise<RedisResult<number>> {
    try {
      const result = await this.client.hdel(key, field);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取哈希表所有字段名
   */
  async hkeys(key: string): Promise<RedisResult<string[]>> {
    try {
      const result = await this.client.hkeys(key);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==================== 地理位置操作 ====================
  
  /**
   * 添加地理位置
   */
  async geoAdd(key: string, longitude: number, latitude: number, member: string): Promise<RedisResult<number>> {
    try {
      const result = await this.client.geoadd(key, longitude, latitude, member);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取指定范围内的地理位置
   */
  async geoRadius(
    key: string,
    longitude: number,
    latitude: number,
    radius: number,
    unit: "m" | "km" = "km"
  ): Promise<RedisResult<any>> {
    try {
      const result = await this.client.georadius(key, longitude, latitude, radius, unit, "WITHDIST");
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==================== 发布订阅操作 ====================
  
  /**
   * 发布消息
   */
  async publish(channel: string, message: string): Promise<RedisResult<number>> {
    try {
      const result = await this.client.publish(channel, message);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 订阅频道
   */
  async subscribe(channel: string, handler: (message: string) => void): Promise<Redis> {
    const sub = new Redis({
      host: ServerConfig.redis.default.host,
      port: ServerConfig.redis.default.port,
      username: ServerConfig.redis.default.username,
      password: ServerConfig.redis.default.password,
    });
    
    await sub.subscribe(channel);
    sub.on("message", (_, message) => {
      handler(message);
    });
    
    return sub;
  }

  // ==================== 工具方法 ====================
  
  /**
   * 获取Redis客户端实例
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * 关闭连接
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * 清空当前数据库
   */
  async flushdb(): Promise<RedisResult<string>> {
    try {
      const result = await this.client.flushdb();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取服务器信息
   */
  async info(): Promise<RedisResult<string>> {
    try {
      const result = await this.client.info();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// 单例模式
let redisService: RedisService;

/**
 * 初始化Redis服务
 */
export const initRedis = async (): Promise<RedisService> => {
  if (!redisService) {
    redisService = new RedisService();
    // 等待连接就绪
    // const isReady = await redisService.waitForReady();
    // if (!isReady) {
    //   throw new Error("Redis连接超时");
    // }
  }
  return redisService;
};

/**
 * 获取Redis服务实例
 */
export const getRedisService = (): RedisService => {
  if (!redisService) {
    throw new Error("Redis服务未初始化，请先调用 initRedis()");
  }
  return redisService;
};

/**
 * 关闭Redis连接
 */
export const closeRedis = async (): Promise<void> => {
  if (redisService) {
    await redisService.disconnect();
    redisService = null;
  }
};

