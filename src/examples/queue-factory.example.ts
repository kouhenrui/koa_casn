import { QueueFactory } from "../services/queue-factory.service";
import { logger } from "../util/log";

/**
 * 队列工厂使用示例
 */
export class QueueFactoryExample {
  private queueFactory: QueueFactory;

  constructor() {
    this.queueFactory = QueueFactory.getInstance();
  }

  /**
   * 邮件队列示例
   */
  async emailQueueExample(): Promise<void> {
    const emailQueue = this.queueFactory.createEmailQueue();

    // 添加普通邮件任务
    const jobId1 = await emailQueue.addJob({
      to: "user@example.com",
      subject: "欢迎注册",
      content: "感谢您注册我们的平台！",
      template: "welcome"
    });

    // 添加高优先级邮件任务
    const jobId2 = await emailQueue.addJob({
      to: "admin@example.com",
      subject: "系统告警",
      content: "系统出现异常，请立即处理！",
      priority: 10
    }, {
      priority: 10
    });

    // 添加延迟邮件任务
    const jobId3 = await emailQueue.addJob({
      to: "user@example.com",
      subject: "订单提醒",
      content: "您的订单即将到期，请及时处理。",
      template: "order-reminder"
    }, {
      delay: 3600000 // 1小时后发送
    });

    // 批量添加邮件任务
    const emailJobs = [
      {
        to: "user1@example.com",
        subject: "批量邮件1",
        content: "这是批量邮件1的内容"
      },
      {
        to: "user2@example.com",
        subject: "批量邮件2",
        content: "这是批量邮件2的内容"
      }
    ];

    const jobIds = await emailQueue.addJobs(
      emailJobs.map(email => ({ data: email }))
    );

    logger().info({
      event: "emailJobsAdded",
      message: "邮件任务已添加",
      data: { jobIds: [jobId1, jobId2, jobId3, ...jobIds] }
    });
  }

  /**
   * 短信队列示例
   */
  async smsQueueExample(): Promise<void> {
    const smsQueue = this.queueFactory.createSMSQueue();

    // 添加普通短信任务
    const jobId1 = await smsQueue.addJob({
      to: "13800138000",
      content: "您的验证码是：123456，5分钟内有效。",
      template: "verification_code"
    });

    // 添加紧急短信任务
    const jobId2 = await smsQueue.addJob({
      to: "13900139000",
      content: "紧急通知：您的账户出现异常登录，请立即检查！",
      priority: "urgent",
      provider: "aliyun"
    }, {
      priority: 10
    });

    // 批量发送短信
    const smsJobs = [
      {
        to: "13800138001",
        content: "您的订单已发货，物流单号：SF1234567890"
      },
      {
        to: "13800138002",
        content: "您的账户余额不足，请及时充值"
      }
    ];

    const jobIds = await smsQueue.addJobs(
      smsJobs.map(sms => ({ data: sms }))
    );

    logger().info({
      event: "smsJobsAdded",
      message: "短信任务已添加",
      data: { jobIds: [jobId1, jobId2, ...jobIds] }
    });
  }

  /**
   * 通知队列示例
   */
  async notificationQueueExample(): Promise<void> {
    const notificationQueue = this.queueFactory.createNotificationQueue();

    // 添加推送通知
    const jobId1 = await notificationQueue.addJob({
      userId: "user123",
      type: "push",
      title: "新消息",
      content: "您有一条新的消息",
      data: { messageId: "msg123" },
      priority: "normal"
    });

    // 添加站内信
    const jobId2 = await notificationQueue.addJob({
      userId: ["user123", "user456"],
      type: "in_app",
      title: "系统维护通知",
      content: "系统将于今晚22:00-24:00进行维护，期间可能影响正常使用。",
      priority: "high"
    });

    // 添加Webhook通知
    const jobId3 = await notificationQueue.addJob({
      userId: "webhook_url",
      type: "webhook",
      title: "订单状态变更",
      content: "订单状态已更新为已发货",
      data: { orderId: "order123", status: "shipped" }
    });

    logger().info({
      event: "notificationJobsAdded",
      message: "通知任务已添加",
      data: { jobIds: [jobId1, jobId2, jobId3] }
    });
  }

  /**
   * 数据处理队列示例
   */
  async dataProcessingQueueExample(): Promise<void> {
    const dataQueue = this.queueFactory.createDataProcessingQueue();

    // 添加用户数据处理任务
    const jobId1 = await dataQueue.addJob({
      type: "user_profile_update",
      data: {
        userId: "user123",
        profile: {
          name: "张三",
          email: "zhangsan@example.com",
          phone: "13800138000"
        }
      },
      userId: "user123"
    });

    // 添加订单数据处理任务
    const jobId2 = await dataQueue.addJob({
      type: "order_processing",
      data: {
        orderId: "order123",
        items: [
          { productId: "prod1", quantity: 2, price: 100 },
          { productId: "prod2", quantity: 1, price: 200 }
        ]
      },
      metadata: { priority: "high" }
    });

    // 批量添加数据处理任务
    const dataJobs = [
      {
        type: "log_analysis",
        data: { logFile: "app.log", date: "2024-01-01" }
      },
      {
        type: "report_generation",
        data: { reportType: "daily", date: "2024-01-01" }
      }
    ];

    const jobIds = await dataQueue.addJobs(
      dataJobs.map(job => ({ data: job }))
    );

    logger().info({
      event: "dataProcessingJobsAdded",
      message: "数据处理任务已添加",
      data: { jobIds: [jobId1, jobId2, ...jobIds] }
    });
  }

  /**
   * 定时任务队列示例
   */
  async scheduledQueueExample(): Promise<void> {
    const scheduledQueue = this.queueFactory.createScheduledQueue();

    // 添加清理过期会话任务
    const jobId1 = await scheduledQueue.addJob({
      taskType: "cleanup_expired_sessions",
      params: { retentionDays: 7 }
    }, {
      delay: 3600000 // 1小时后执行
    });

    // 添加生成日报任务
    const jobId2 = await scheduledQueue.addJob({
      taskType: "generate_daily_report",
      params: { date: new Date().toISOString().split('T')[0] }
    }, {
      delay: 86400000 // 24小时后执行
    });

    // 添加数据库备份任务
    const jobId3 = await scheduledQueue.addJob({
      taskType: "backup_database",
      params: { 
        database: "main_db",
        backupType: "full",
        retention: "7d"
      }
    }, {
      delay: 7200000 // 2小时后执行
    });

    logger().info({
      event: "scheduledJobsAdded",
      message: "定时任务已添加",
      data: { jobIds: [jobId1, jobId2, jobId3] }
    });
  }

  /**
   * 自定义队列示例
   */
  async customQueueExample(): Promise<void> {
    // 创建自定义队列
    const customQueue = this.queueFactory.createCustomQueue("custom-queue", {
      maxAttempts: 5,
      concurrency: 3,
      retryDelay: 3000
    });

    // 注册自定义处理器
    customQueue.registerProcessor("customTask", async (job) => {
      const { taskType, data } = job.data as any;
      
      logger().info({
        event: "customTaskExecuted",
        message: "自定义任务执行",
        data: { taskType, jobId: job.id }
      });

      // 模拟任务处理
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    // 添加自定义任务
    const jobId = await customQueue.addJob({
      taskType: "custom_processing",
      data: { message: "这是一个自定义任务" }
    });

    logger().info({
      event: "customJobAdded",
      message: "自定义任务已添加",
      data: { jobId }
    });
  }

  /**
   * 启动所有队列
   */
  async startAllQueues(): Promise<void> {
    await this.queueFactory.startAllQueues();
    
    logger().info({
      event: "allQueuesStarted",
      message: "所有队列已启动"
    });
  }

  /**
   * 获取队列统计信息
   */
  async getQueueStats(): Promise<void> {
    const stats = await this.queueFactory.getAllStats();
    
    logger().info({
      event: "queueStats",
      message: "队列统计信息",
      data: stats
    });
  }

  /**
   * 运行完整示例
   */
  async runCompleteExample(): Promise<void> {
    try {
      // 创建各种类型的任务
      await this.emailQueueExample();
      await this.smsQueueExample();
      await this.notificationQueueExample();
      await this.dataProcessingQueueExample();
      await this.scheduledQueueExample();
      await this.customQueueExample();

      // 启动所有队列
      await this.startAllQueues();

      // 等待一段时间让任务处理
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 获取统计信息
      await this.getQueueStats();

    } catch (error) {
      logger().error({
        event: "queueExampleError",
        message: "队列示例运行出错",
        error: error.message
      });
    }
  }
}

// 使用示例
export async function runQueueFactoryExample(): Promise<void> {
  const example = new QueueFactoryExample();
  await example.runCompleteExample();
} 