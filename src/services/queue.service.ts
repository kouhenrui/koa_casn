import { Redis } from "ioredis";
import { logger } from "../util/log";
import { CustomError } from "../util/error";
import { getRedisService } from "../util/redis";

export interface QueueJob<T = any> {
  id: string;
  data: T;
  priority?: number;
  delay?: number;
  attempts?: number;
  maxAttempts?: number;
  createdAt: Date;
  processedAt?: Date;
  failedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface QueueOptions {
  name: string;
  redis?: Redis;
  maxAttempts?: number;
  defaultPriority?: number;
  retryDelay?: number;
  batchSize?: number;
  concurrency?: number;
}

export interface ProcessOptions {
  timeout?: number;
  retryOnError?: boolean;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

export type JobProcessor<T = any> = (job: QueueJob<T>) => Promise<void>;

export class QueueService {
  private redis: Redis;
  private name: string;
  private maxAttempts: number;
  private defaultPriority: number;
  private retryDelay: number;
  private batchSize: number;
  private concurrency: number;
  private isProcessing: boolean = false;
  private processors: Map<string, JobProcessor> = new Map();

  constructor(options: QueueOptions) {
    this.redis = options.redis || getRedisService().getClient();
    this.name = options.name||'default queue';
    this.maxAttempts = options.maxAttempts || 3;
    this.defaultPriority = options.defaultPriority || 0;
    this.retryDelay = options.retryDelay || 5000;
    this.batchSize = options.batchSize || 10;
    this.concurrency = options.concurrency || 1;
  }

  /**
   * 添加任务到队列
   */
  async addJob<T>(
    data: T,
    options: {
      priority?: number;
      delay?: number;
      attempts?: number;
      maxAttempts?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    try {
      const jobId = this.generateJobId();
      const job: QueueJob<T> = {
        id: jobId,
        data,
        priority: options.priority ?? this.defaultPriority,
        delay: options.delay || 0,
        attempts: options.attempts || 0,
        maxAttempts: options.maxAttempts ?? this.maxAttempts,
        createdAt: new Date(),
        metadata: options.metadata || {}
      };

      const jobKey = this.getJobKey(jobId);
      const queueKey = this.getQueueKey();

      // 保存任务数据
      await this.redis.set(jobKey, JSON.stringify(job), 'EX', 86400); // 24小时过期

      if (job.delay > 0) {
        // 延迟任务
        await this.redis.zadd(
          this.getDelayQueueKey(),
          Date.now() + job.delay,
          jobId
        );
      } else {
        // 立即执行任务
        await this.redis.zadd(queueKey, job.priority, jobId);
      }

      // 使用i18n翻译
      const { t } = await import("../util/i18n");
      logger().info({
        event: "jobAdded",
        message: t("queue.job_added"),
        data: {
          queueName: this.name,
          jobId,
          priority: job.priority,
          delay: job.delay
        }
      });

      return jobId;
    } catch (error) {
      logger().error({
        event: "addJobError",
        message: "Failed to add job to queue",
        error: error.message,
        data: { queueName: this.name, data }
      });
      throw new CustomError(`Failed to add job: ${error.message}`);
    }
  }

  /**
   * 批量添加任务
   */
  async addJobs<T>(
    jobs: Array<{
      data: T;
      priority?: number;
      delay?: number;
      attempts?: number;
      maxAttempts?: number;
      metadata?: Record<string, any>;
    }>
  ): Promise<string[]> {
    const jobIds: string[] = [];
    const pipeline = this.redis.pipeline();

    for (const jobData of jobs) {
      const jobId = this.generateJobId();
      const job: QueueJob<T> = {
        id: jobId,
        data: jobData.data,
        priority: jobData.priority ?? this.defaultPriority,
        delay: jobData.delay || 0,
        attempts: jobData.attempts || 0,
        maxAttempts: jobData.maxAttempts ?? this.maxAttempts,
        createdAt: new Date(),
        metadata: jobData.metadata || {}
      };

      const jobKey = this.getJobKey(jobId);
      const queueKey = this.getQueueKey();

      // 保存任务数据
      pipeline.set(jobKey, JSON.stringify(job), 'EX', 86400);

      if (job.delay > 0) {
        pipeline.zadd(this.getDelayQueueKey(), Date.now() + job.delay, jobId);
      } else {
        pipeline.zadd(queueKey, job.priority, jobId);
      }

      jobIds.push(jobId);
    }

    await pipeline.exec();

    logger().info({
      event: "jobsAdded",
      message: "Jobs added to queue",
      data: {
        queueName: this.name,
        count: jobIds.length
      }
    });

    return jobIds;
  }

  /**
   * 注册任务处理器
   */
  registerProcessor<T>(name: string, processor: JobProcessor<T>): void {
    this.processors.set(name, processor);
    logger().info({
      event: "processorRegistered",
      message: "Job processor registered",
      data: { queueName: this.name, processorName: name }
    });
  }

  /**
   * 开始处理队列
   */
  async startProcessing(processorName: string, options: ProcessOptions = {}): Promise<void> {
    if (this.isProcessing) {
      throw new CustomError("Queue is already processing");
    }

    const processor = this.processors.get(processorName);
    if (!processor) {
      throw new CustomError(`Processor '${processorName}' not found`);
    }

    this.isProcessing = true;
    logger().info({
      event: "queueProcessingStarted",
      message: "Queue processing started",
      data: { queueName: this.name, processorName }
    });

    // 启动延迟任务检查
    this.startDelayJobProcessor();

    // 启动主处理器
    for (let i = 0; i < this.concurrency; i++) {
      this.processJobs(processor, options);
    }
  }

  /**
   * 停止处理队列
   */
  async stopProcessing(): Promise<void> {
    this.isProcessing = false;
    logger().info({
      event: "queueProcessingStopped",
      message: "Queue processing stopped",
      data: { queueName: this.name }
    });
  }

  /**
   * 获取任务状态
   */
  async getJob(jobId: string): Promise<QueueJob | null> {
    try {
      const jobKey = this.getJobKey(jobId);
      const jobData = await this.redis.get(jobKey);
      
      if (!jobData) {
        return null;
      }

      return JSON.parse(jobData);
    } catch (error) {
      logger().error({
        event: "getJobError",
        message: "Failed to get job",
        error: error.message,
        data: { jobId }
      });
      return null;
    }
  }

  /**
   * 删除任务
   */
  async removeJob(jobId: string): Promise<boolean> {
    try {
      const jobKey = this.getJobKey(jobId);
      const queueKey = this.getQueueKey();
      const delayQueueKey = this.getDelayQueueKey();

      const pipeline = this.redis.pipeline();
      pipeline.del(jobKey);
      pipeline.zrem(queueKey, jobId);
      pipeline.zrem(delayQueueKey, jobId);

      await pipeline.exec();

      logger().info({
        event: "jobRemoved",
        message: "Job removed from queue",
        data: { queueName: this.name, jobId }
      });

      return true;
    } catch (error) {
      logger().error({
        event: "removeJobError",
        message: "Failed to remove job",
        error: error.message,
        data: { jobId }
      });
      return false;
    }
  }

  /**
   * 清空队列
   */
  async clear(): Promise<number> {
    try {
      const queueKey = this.getQueueKey();
      const delayQueueKey = this.getDelayQueueKey();

      // 获取所有任务ID
      const jobIds = await this.redis.zrange(queueKey, 0, -1);
      const delayJobIds = await this.redis.zrange(delayQueueKey, 0, -1);

      const allJobIds = [...jobIds, ...delayJobIds];
      
      if (allJobIds.length === 0) {
        return 0;
      }

      const pipeline = this.redis.pipeline();

      // 删除任务数据
      for (const jobId of allJobIds) {
        pipeline.del(this.getJobKey(jobId));
      }

      // 删除队列
      pipeline.del(queueKey);
      pipeline.del(delayQueueKey);

      await pipeline.exec();

      logger().info({
        event: "queueCleared",
        message: "Queue cleared",
        data: { queueName: this.name, count: allJobIds.length }
      });

      return allJobIds.length;
    } catch (error) {
      logger().error({
        event: "clearQueueError",
        message: "Failed to clear queue",
        error: error.message,
        data: { queueName: this.name }
      });
      throw new CustomError(`Failed to clear queue: ${error.message}`);
    }
  }

  /**
   * 获取队列统计信息
   */
  async getStats(): Promise<{
    waiting: number;
    delayed: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    try {
      const queueKey = this.getQueueKey();
      const delayQueueKey = this.getDelayQueueKey();

      const [waiting, delayed] = await Promise.all([
        this.redis.zcard(queueKey),
        this.redis.zcard(delayQueueKey)
      ]);

      return {
        waiting,
        delayed,
        processing: 0, // 需要额外跟踪
        completed: 0,  // 需要额外跟踪
        failed: 0      // 需要额外跟踪
      };
    } catch (error) {
      logger().error({
        event: "getStatsError",
        message: "Failed to get queue stats",
        error: error.message
      });
      return { waiting: 0, delayed: 0, processing: 0, completed: 0, failed: 0 };
    }
  }

  /**
   * 处理任务
   */
  private async processJobs(processor: JobProcessor, options: ProcessOptions): Promise<void> {
    while (this.isProcessing) {
      try {
        const jobId = await this.getNextJob();
        
        if (!jobId) {
          await this.sleep(1000); // 等待1秒
          continue;
        }

        const job = await this.getJob(jobId);
        if (!job) {
          continue;
        }

        await this.processJob(job, processor, options);
      } catch (error) {
        logger().error({
          event: "processJobsError",
          message: "Error in job processing loop",
          error: error.message
        });
        await this.sleep(5000); // 错误后等待5秒
      }
    }
  }

  /**
   * 处理单个任务
   */
  private async processJob<T>(
    job: QueueJob<T>,
    processor: JobProcessor,
    options: ProcessOptions
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 更新任务状态
      job.processedAt = new Date();
      await this.updateJob(job);

      // 执行任务
      await processor(job);

      // 任务完成
      if (options.removeOnComplete !== false) {
        await this.removeJob(job.id);
      }

      const duration = Date.now() - startTime;
      logger().info({
        event: "jobCompleted",
        message: "Job completed successfully",
        data: {
          queueName: this.name,
          jobId: job.id,
          duration: `${duration}ms`
        }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 处理重试
      if (job.attempts < job.maxAttempts && options.retryOnError !== false) {
        job.attempts++;
        job.error = error.message;
        await this.retryJob(job);
        
        logger().warn({
          event: "jobRetried",
          message: "Job retried",
          data: {
            queueName: this.name,
            jobId: job.id,
            attempts: job.attempts,
            maxAttempts: job.maxAttempts,
            duration: `${duration}ms`
          }
        });
      } else {
        // 任务失败
        job.failedAt = new Date();
        job.error = error.message;
        await this.updateJob(job);

        if (options.removeOnFail !== false) {
          await this.removeJob(job.id);
        }

        logger().error({
          event: "jobFailed",
          message: "Job failed permanently",
          error: error.message,
          data: {
            queueName: this.name,
            jobId: job.id,
            attempts: job.attempts,
            maxAttempts: job.maxAttempts,
            duration: `${duration}ms`
          }
        });
      }
    }
  }

  /**
   * 获取下一个任务
   */
  private async getNextJob(): Promise<string | null> {
    const queueKey = this.getQueueKey();
    const result = await this.redis.zpopmax(queueKey);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 重试任务
   */
  private async retryJob<T>(job: QueueJob<T>): Promise<void> {
    const jobKey = this.getJobKey(job.id);
    const queueKey = this.getQueueKey();

    // 更新任务数据
    await this.redis.set(jobKey, JSON.stringify(job), 'EX', 86400);

    // 延迟重试
    const delay = this.retryDelay * Math.pow(2, job.attempts - 1); // 指数退避
    await this.redis.zadd(queueKey, Date.now() + delay, job.id);
  }

  /**
   * 启动延迟任务处理器
   */
  private startDelayJobProcessor(): void {
    setInterval(async () => {
      try {
        const delayQueueKey = this.getDelayQueueKey();
        const now = Date.now();
        
        // 获取到期的延迟任务
        const expiredJobs = await this.redis.zrangebyscore(delayQueueKey, 0, now);
        
        if (expiredJobs.length === 0) {
          return;
        }

        const queueKey = this.getQueueKey();
        const pipeline = this.redis.pipeline();

        for (const jobId of expiredJobs) {
          const job = await this.getJob(jobId);
          if (job) {
            pipeline.zadd(queueKey, job.priority, jobId);
          }
          pipeline.zrem(delayQueueKey, jobId);
        }

        await pipeline.exec();

        if (expiredJobs.length > 0) {
          logger().info({
            event: "delayJobsProcessed",
            message: "Delay jobs moved to main queue",
            data: { count: expiredJobs.length }
          });
        }
      } catch (error) {
        logger().error({
          event: "delayJobProcessorError",
          message: "Error in delay job processor",
          error: error.message
        });
      }
    }, 1000); // 每秒检查一次
  }

  /**
   * 更新任务
   */
  private async updateJob<T>(job: QueueJob<T>): Promise<void> {
    const jobKey = this.getJobKey(job.id);
    await this.redis.set(jobKey, JSON.stringify(job), 'EX', 86400);
  }

  /**
   * 生成任务ID
   */
  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 11);
    const uuid = crypto.randomUUID ? crypto.randomUUID() : this.generateUUID();
    return `${this.name}:${timestamp}:${random}:${uuid.split('-')[0]}`;
  }

  /**
   * 生成UUID（兼容性）
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 获取任务键
   */
  private getJobKey(jobId: string): string {
    return `queue:${this.name}:job:${jobId}`;
  }

  /**
   * 获取队列键
   */
  private getQueueKey(): string {
    return `queue:${this.name}:waiting`;
  }

  /**
   * 获取延迟队列键
   */
  private getDelayQueueKey(): string {
    return `queue:${this.name}:delayed`;
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 队列管理器
export class QueueManager {
  private static instance: QueueManager;
  private queues: Map<string, QueueService> = new Map();

  private constructor() {}

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  /**
   * 创建队列
   */
  createQueue(options: QueueOptions): QueueService {
    const queue = new QueueService(options);
    this.queues.set(options.name, queue);
    return queue;
  }

  /**
   * 获取队列
   */
  getQueue(name: string): QueueService | undefined {
    return this.queues.get(name);
  }

  /**
   * 删除队列
   */
  async removeQueue(name: string): Promise<boolean> {
    const queue = this.queues.get(name);
    if (queue) {
      await queue.stopProcessing();
      await queue.clear();
      this.queues.delete(name);
      return true;
    }
    return false;
  }

  /**
   * 获取所有队列
   */
  getAllQueues(): QueueService[] {
    return Array.from(this.queues.values());
  }

  /**
   * 获取队列统计信息
   */
  async getAllStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};
    
    for (const [name, queue] of this.queues) {
      stats[name] = await queue.getStats();
    }
    
    return stats;
  }
} 