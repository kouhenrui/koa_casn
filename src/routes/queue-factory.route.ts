import Router from "koa-router";
import { QueueFactory } from "../services/queue-factory.service";
import { logger } from "../util/log";

// 定义请求体类型
interface EmailRequest {
  to: string;
  subject: string;
  content: string;
  template?: string;
  priority?: number;
  delay?: number;
}

interface SMSRequest {
  to: string;
  content: string;
  template?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  provider?: string;
}

interface NotificationRequest {
  userId: string | string[];
  type: "push" | "in_app" | "webhook";
  title: string;
  content: string;
  data?: Record<string, any>;
  priority?: "low" | "normal" | "high";
}

interface DataProcessingRequest {
  type: string;
  data: any;
  userId?: string;
  metadata?: Record<string, any>;
}

interface ScheduledRequest {
  taskType: string;
  params?: Record<string, any>;
  delay?: number;
}

interface CustomQueueRequest {
  name: string;
  options?: {
    maxAttempts?: number;
    defaultPriority?: number;
    retryDelay?: number;
    batchSize?: number;
    concurrency?: number;
  };
}

const router = new Router({ prefix: "/api/queue-factory" });

// 获取队列工厂实例
const queueFactory = QueueFactory.getInstance();

/**
 * 获取所有队列统计信息
 */
router.get("/stats", async (ctx) => {
  try {
    const stats = await queueFactory.getAllStats();
    
    ctx.body = {
      success: true,
      data: stats,
      message: "获取队列统计信息成功"
    };
  } catch (error) {
    logger().error({
      event: "getQueueStatsError",
      message: "获取队列统计信息失败",
      error: error.message
    });
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取队列统计信息失败",
      error: error.message
    };
  }
});

/**
 * 启动所有队列
 */
router.post("/start", async (ctx) => {
  try {
    await queueFactory.startAllQueues();
    
    ctx.body = {
      success: true,
      message: "所有队列已启动"
    };
  } catch (error) {
    logger().error({
      event: "startAllQueuesError",
      message: "启动所有队列失败",
      error: error.message
    });
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "启动所有队列失败",
      error: error.message
    };
  }
});

/**
 * 停止所有队列
 */
router.post("/stop", async (ctx) => {
  try {
    await queueFactory.stopAllQueues();
    
    ctx.body = {
      success: true,
      message: "所有队列已停止"
    };
  } catch (error) {
    logger().error({
      event: "stopAllQueuesError",
      message: "停止所有队列失败",
      error: error.message
    });
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "停止所有队列失败",
      error: error.message
    };
  }
});

  /**
   * 添加邮件任务
   */
  router.post("/email", async (ctx) => {
    try {
      const { to, subject, content, template, priority, delay } = ctx.request.body as EmailRequest;
    
    if (!to || !subject || !content) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少必要参数：to, subject, content"
      };
      return;
    }
    
    const emailQueue = queueFactory.createEmailQueue();
    
    const jobId = await emailQueue.addJob({
      to,
      subject,
      content,
      template
    }, {
      priority,
      delay
    });
    
    ctx.body = {
      success: true,
      data: { jobId },
      message: "邮件任务已添加"
    };
  } catch (error) {
    logger().error({
      event: "addEmailJobError",
      message: "添加邮件任务失败",
      error: error.message,
      data: ctx.request.body
    });
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "添加邮件任务失败",
      error: error.message
    };
  }
});

  /**
   * 批量添加邮件任务
   */
  router.post("/email/batch", async (ctx) => {
    try {
      const { emails } = ctx.request.body as { emails: EmailRequest[] };
    
    if (!Array.isArray(emails) || emails.length === 0) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "emails参数必须是非空数组"
      };
      return;
    }
    
    const emailQueue = queueFactory.createEmailQueue();
    
    const jobIds = await emailQueue.addJobs(
      emails.map(email => ({ data: email }))
    );
    
    ctx.body = {
      success: true,
      data: { jobIds },
      message: `批量添加了 ${jobIds.length} 个邮件任务`
    };
  } catch (error) {
    logger().error({
      event: "addBatchEmailJobsError",
      message: "批量添加邮件任务失败",
      error: error.message,
      data: ctx.request.body
    });
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "批量添加邮件任务失败",
      error: error.message
    };
  }
});

  /**
   * 添加短信任务
   */
  router.post("/sms", async (ctx) => {
    try {
      const { to, content, template, priority, provider } = ctx.request.body as SMSRequest;
    
    if (!to || !content) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少必要参数：to, content"
      };
      return;
    }
    
    const smsQueue = queueFactory.createSMSQueue();
    
    const jobId = await smsQueue.addJob({
      to,
      content,
      template,
      priority,
      provider
    });
    
    ctx.body = {
      success: true,
      data: { jobId },
      message: "短信任务已添加"
    };
  } catch (error) {
    logger().error({
      event: "addSMSJobError",
      message: "添加短信任务失败",
      error: error.message,
      data: ctx.request.body
    });
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "添加短信任务失败",
      error: error.message
    };
  }
});

  /**
   * 批量添加短信任务
   */
  router.post("/sms/batch", async (ctx) => {
    try {
      const { sms } = ctx.request.body as { sms: SMSRequest[] };
    
    if (!Array.isArray(sms) || sms.length === 0) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "sms参数必须是非空数组"
      };
      return;
    }
    
    const smsQueue = queueFactory.createSMSQueue();
    
    const jobIds = await smsQueue.addJobs(
      sms.map(smsItem => ({ data: smsItem }))
    );
    
    ctx.body = {
      success: true,
      data: { jobIds },
      message: `批量添加了 ${jobIds.length} 个短信任务`
    };
  } catch (error) {
    logger().error({
      event: "addBatchSMSJobsError",
      message: "批量添加短信任务失败",
      error: error.message,
      data: ctx.request.body
    });
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "批量添加短信任务失败",
      error: error.message
    };
  }
});

  /**
   * 添加通知任务
   */
  router.post("/notification", async (ctx) => {
    try {
      const { userId, type, title, content, data, priority } = ctx.request.body as NotificationRequest;
    
    if (!userId || !type || !title || !content) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少必要参数：userId, type, title, content"
      };
      return;
    }
    
    const notificationQueue = queueFactory.createNotificationQueue();
    
    const jobId = await notificationQueue.addJob({
      userId,
      type,
      title,
      content,
      data,
      priority
    });
    
    ctx.body = {
      success: true,
      data: { jobId },
      message: "通知任务已添加"
    };
  } catch (error) {
    logger().error({
      event: "addNotificationJobError",
      message: "添加通知任务失败",
      error: error.message,
      data: ctx.request.body
    });
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "添加通知任务失败",
      error: error.message
    };
  }
});

/**
 * 添加数据处理任务
 */
router.post("/data-processing", async (ctx) => {
  try {
    const { type, data, userId, metadata } = ctx.request.body as DataProcessingRequest;
    
    if (!type || !data) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少必要参数：type, data"
      };
      return;
    }
    
    const dataQueue = queueFactory.createDataProcessingQueue();
    
    const jobId = await dataQueue.addJob({
      type,
      data,
      userId,
      metadata
    });
    
    ctx.body = {
      success: true,
      data: { jobId },
      message: "数据处理任务已添加"
    };
  } catch (error) {
    logger().error({
      event: "addDataProcessingJobError",
      message: "添加数据处理任务失败",
      error: error.message,
      data: ctx.request.body
    });
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "添加数据处理任务失败",
      error: error.message
    };
  }
});

/**
 * 添加定时任务
 */
router.post("/scheduled", async (ctx) => {
  try {
    const { taskType, params, delay } = ctx.request.body as ScheduledRequest;
    
    if (!taskType) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少必要参数：taskType"
      };
      return;
    }
    
    const scheduledQueue = queueFactory.createScheduledQueue();
    
    const jobId = await scheduledQueue.addJob({
      taskType,
      params
    }, {
      delay
    });
    
    ctx.body = {
      success: true,
      data: { jobId },
      message: "定时任务已添加"
    };
  } catch (error) {
    logger().error({
      event: "addScheduledJobError",
      message: "添加定时任务失败",
      error: error.message,
      data: ctx.request.body
    });
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "添加定时任务失败",
      error: error.message
    };
  }
});

/**
 * 创建自定义队列
 */
router.post("/custom", async (ctx) => {
  try {
    const { name, options } = ctx.request.body as CustomQueueRequest;
    
    if (!name) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少必要参数：name"
      };
      return;
    }
    
    const customQueue = queueFactory.createCustomQueue(name, options);
    
    ctx.body = {
      success: true,
      data: { queueName: name },
      message: "自定义队列创建成功"
    };
  } catch (error) {
    logger().error({
      event: "createCustomQueueError",
      message: "创建自定义队列失败",
      error: error.message,
      data: ctx.request.body
    });
    
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "创建自定义队列失败",
      error: error.message
    };
  }
});

export default router; 