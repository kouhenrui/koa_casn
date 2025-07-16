import { QueueManager, QueueService, QueueOptions } from "./queue.service";
import { logger } from "../util/log";

export interface EmailJobData {
  to: string | string[];
  subject: string;
  content: string;
  template?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

export interface SMSJobData {
  to: string | string[];
  content: string;
  template?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  provider?: string;
}

export interface NotificationJobData {
  userId: string | string[];
  type: "push" | "in_app" | "webhook";
  title: string;
  content: string;
  data?: Record<string, any>;
  priority?: "low" | "normal" | "high";
}

export interface DataProcessingJobData {
  type: string;
  data: any;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ScheduledJobData {
  taskType: string;
  params?: Record<string, any>;
  schedule?: string; // cron表达式
}

export class QueueFactory {
  private static instance: QueueFactory;
  private queueManager: QueueManager;

  private constructor() {
    this.queueManager = QueueManager.getInstance();
  }

  public static getInstance(): QueueFactory {
    if (!QueueFactory.instance) {
      QueueFactory.instance = new QueueFactory();
    }
    return QueueFactory.instance;
  }

  /**
   * 创建邮件队列
   */
  createEmailQueue(): QueueService {
    const queueName = "email";
    let queue = this.queueManager.getQueue(queueName);
    
    if (!queue) {
      queue = this.queueManager.createQueue({
        name: queueName,
        maxAttempts: 3,
        defaultPriority: 0,
        retryDelay: 10000, // 邮件重试间隔10秒
        concurrency: 5,    // 邮件并发数
        batchSize: 20
      });

      // 注册邮件处理器
      queue.registerProcessor("sendEmail", async (job) => {
        const data = job.data as EmailJobData;
        const { to, subject, content, template, attachments, cc, bcc, replyTo } = data;
        
        try {
          // 这里调用实际的邮件发送服务
          await this.sendEmail({
            to,
            subject,
            content,
            template,
            attachments,
            cc,
            bcc,
            replyTo
          });

          logger().info({
            event: "emailSent",
            message: "邮件发送成功",
            data: { to, subject, jobId: job.id }
          });
        } catch (error) {
          logger().error({
            event: "emailSendFailed",
            message: "邮件发送失败",
            error: error.message,
            data: { to, subject, jobId: job.id }
          });
          throw error;
        }
      });

      logger().info({
        event: "emailQueueCreated",
        message: "邮件队列创建成功",
        data: { queueName }
      });
    }

    return queue;
  }

  /**
   * 创建短信队列
   */
  createSMSQueue(): QueueService {
    const queueName = "sms";
    let queue = this.queueManager.getQueue(queueName);
    
    if (!queue) {
      queue = this.queueManager.createQueue({
        name: queueName,
        maxAttempts: 2,
        defaultPriority: 0,
        retryDelay: 5000,  // 短信重试间隔5秒
        concurrency: 10,   // 短信并发数较高
        batchSize: 50
      });

      // 注册短信处理器
      queue.registerProcessor("sendSMS", async (job) => {
        const data = job.data as SMSJobData;
        const { to, content, template, priority, provider } = data;
        
        try {
          // 这里调用实际的短信发送服务
          await this.sendSMS({
            to,
            content,
            template,
            priority,
            provider
          });

          logger().info({
            event: "smsSent",
            message: "短信发送成功",
            data: { to, content: content.substring(0, 50), jobId: job.id }
          });
        } catch (error) {
          logger().error({
            event: "smsSendFailed",
            message: "短信发送失败",
            error: error.message,
            data: { to, jobId: job.id }
          });
          throw error;
        }
      });

      logger().info({
        event: "smsQueueCreated",
        message: "短信队列创建成功",
        data: { queueName }
      });
    }

    return queue;
  }

  /**
   * 创建通知队列
   */
  createNotificationQueue(): QueueService {
    const queueName = "notification";
    let queue = this.queueManager.getQueue(queueName);
    
    if (!queue) {
      queue = this.queueManager.createQueue({
        name: queueName,
        maxAttempts: 2,
        defaultPriority: 0,
        retryDelay: 3000,  // 通知重试间隔3秒
        concurrency: 8,    // 通知并发数
        batchSize: 30
      });

      // 注册通知处理器
      queue.registerProcessor("sendNotification", async (job) => {
        const data = job.data as NotificationJobData;
        const { userId, type, title, content, data: jobData, priority } = data;
        
        try {
          // 这里调用实际的通知发送服务
          await this.sendNotification({
            userId,
            type,
            title,
            content,
            data,
            priority
          });

          logger().info({
            event: "notificationSent",
            message: "通知发送成功",
            data: { userId, type, title, jobId: job.id }
          });
        } catch (error) {
          logger().error({
            event: "notificationSendFailed",
            message: "通知发送失败",
            error: error.message,
            data: { userId, type, jobId: job.id }
          });
          throw error;
        }
      });

      logger().info({
        event: "notificationQueueCreated",
        message: "通知队列创建成功",
        data: { queueName }
      });
    }

    return queue;
  }

  /**
   * 创建数据处理队列
   */
  createDataProcessingQueue(): QueueService {
    const queueName = "data-processing";
    let queue = this.queueManager.getQueue(queueName);
    
    if (!queue) {
      queue = this.queueManager.createQueue({
        name: queueName,
        maxAttempts: 3,
        defaultPriority: 0,
        retryDelay: 15000, // 数据处理重试间隔15秒
        concurrency: 3,    // 数据处理并发数较低
        batchSize: 10
      });

      // 注册数据处理处理器
      queue.registerProcessor("processData", async (job) => {
        const data = job.data as DataProcessingJobData;
        const { type, data: jobData, userId, metadata } = data;
        
        try {
          // 这里调用实际的数据处理服务
          await this.processData({
            type,
            data,
            userId,
            metadata
          });

          logger().info({
            event: "dataProcessed",
            message: "数据处理成功",
            data: { type, userId, jobId: job.id }
          });
        } catch (error) {
          logger().error({
            event: "dataProcessingFailed",
            message: "数据处理失败",
            error: error.message,
            data: { type, userId, jobId: job.id }
          });
          throw error;
        }
      });

      logger().info({
        event: "dataProcessingQueueCreated",
        message: "数据处理队列创建成功",
        data: { queueName }
      });
    }

    return queue;
  }

  /**
   * 创建定时任务队列
   */
  createScheduledQueue(): QueueService {
    const queueName = "scheduled";
    let queue = this.queueManager.getQueue(queueName);
    
    if (!queue) {
      queue = this.queueManager.createQueue({
        name: queueName,
        maxAttempts: 1,    // 定时任务不重试
        defaultPriority: 0,
        retryDelay: 0,
        concurrency: 2,    // 定时任务并发数较低
        batchSize: 5
      });

      // 注册定时任务处理器
      queue.registerProcessor("scheduledTask", async (job) => {
        const data = job.data as ScheduledJobData;
        const { taskType, params } = data;
        
        try {
          // 这里调用实际的定时任务处理服务
          await this.executeScheduledTask({
            taskType,
            params
          });

          logger().info({
            event: "scheduledTaskExecuted",
            message: "定时任务执行成功",
            data: { taskType, jobId: job.id }
          });
        } catch (error) {
          logger().error({
            event: "scheduledTaskFailed",
            message: "定时任务执行失败",
            error: error.message,
            data: { taskType, jobId: job.id }
          });
          throw error;
        }
      });

      logger().info({
        event: "scheduledQueueCreated",
        message: "定时任务队列创建成功",
        data: { queueName }
      });
    }

    return queue;
  }

  /**
   * 创建自定义队列
   */
  createCustomQueue(name: string, options: Partial<QueueOptions> = {}): QueueService {
    const defaultOptions: QueueOptions = {
      name,
      maxAttempts: 3,
      defaultPriority: 0,
      retryDelay: 5000,
      concurrency: 1,
      batchSize: 10,
      ...options
    };

    return this.queueManager.createQueue(defaultOptions);
  }

  /**
   * 获取所有队列
   */
  getAllQueues(): QueueService[] {
    return this.queueManager.getAllQueues();
  }

  /**
   * 获取队列统计信息
   */
  async getAllStats(): Promise<Record<string, any>> {
    return await this.queueManager.getAllStats();
  }

  /**
   * 启动所有队列
   */
  async startAllQueues(): Promise<void> {
    const queues = this.getAllQueues();
    
    for (const queue of queues) {
      // 根据队列名称启动对应的处理器
      const queueName = (queue as any).name;
      
      switch (queueName) {
        case "email":
          await queue.startProcessing("sendEmail");
          break;
        case "sms":
          await queue.startProcessing("sendSMS");
          break;
        case "notification":
          await queue.startProcessing("sendNotification");
          break;
        case "data-processing":
          await queue.startProcessing("processData");
          break;
        case "scheduled":
          await queue.startProcessing("scheduledTask");
          break;
        default:
          logger().warn({
            event: "unknownQueueType",
            message: "未知队列类型，无法自动启动",
            data: { queueName }
          });
      }
    }

    logger().info({
      event: "allQueuesStarted",
      message: "所有队列已启动",
      data: { queueCount: queues.length }
    });
  }

  /**
   * 停止所有队列
   */
  async stopAllQueues(): Promise<void> {
    const queues = this.getAllQueues();
    
    for (const queue of queues) {
      await queue.stopProcessing();
    }

    logger().info({
      event: "allQueuesStopped",
      message: "所有队列已停止",
      data: { queueCount: queues.length }
    });
  }

  // 以下是实际的服务调用方法，需要根据你的具体实现来修改

  private async sendEmail(data: EmailJobData): Promise<void> {
    // TODO: 实现邮件发送逻辑
    // 例如：调用 nodemailer、SendGrid 等邮件服务
    console.log("发送邮件:", data);
  }

  private async sendSMS(data: SMSJobData): Promise<void> {
    // TODO: 实现短信发送逻辑
    // 例如：调用阿里云短信、腾讯云短信等服务
    console.log("发送短信:", data);
  }

  private async sendNotification(data: NotificationJobData): Promise<void> {
    // TODO: 实现通知发送逻辑
    // 例如：推送通知、站内信等
    console.log("发送通知:", data);
  }

  private async processData(data: DataProcessingJobData): Promise<void> {
    // TODO: 实现数据处理逻辑
    console.log("处理数据:", data);
  }

  private async executeScheduledTask(data: ScheduledJobData): Promise<void> {
    // TODO: 实现定时任务逻辑
    console.log("执行定时任务:", data);
  }
} 