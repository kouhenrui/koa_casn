import Router from "koa-router";
import { QueueManager, QueueService } from "../services/queue.service";
import { logger } from "../util/log";
import { CustomError } from "../util/error";

const router = new Router({ prefix: "/api/queue" });
const queueManager = QueueManager.getInstance();

// 创建队列
router.post("/create", async (ctx) => {
  try {
    const { name, maxAttempts, defaultPriority, retryDelay, concurrency } = ctx.request.body as any;

    if (!name) {
      throw new CustomError("Queue name is required");
    }

    const queue = queueManager.createQueue({
      name,
      maxAttempts: maxAttempts || 3,
      defaultPriority: defaultPriority || 0,
      retryDelay: retryDelay || 5000,
      concurrency: concurrency || 1
    });

    ctx.body = {
      success: true,
      message: "Queue created successfully",
      data: { name, maxAttempts, defaultPriority, retryDelay, concurrency }
    };
  } catch (error) {
    logger().error({
      event: "createQueueError",
      message: "Failed to create queue",
      error: error.message,
      data: ctx.request.body
    });
    throw error;
  }
});

// 添加任务
router.post("/:queueName/jobs", async (ctx) => {
  try {
    const { queueName } = ctx.params;
    const { data, priority, delay, maxAttempts, metadata } = ctx.request.body as any;

    if (!data) {
      throw new CustomError("Job data is required");
    }

    const queue = queueManager.getQueue(queueName);
    if (!queue) {
      throw new CustomError(`Queue '${queueName}' not found`);
    }

    const jobId = await queue.addJob(data, {
      priority,
      delay,
      maxAttempts,
      metadata
    });

    ctx.body = {
      success: true,
      message: "Job added successfully",
      data: { jobId, queueName }
    };
  } catch (error) {
    logger().error({
      event: "addJobError",
      message: "Failed to add job",
      error: error.message,
      data: { queueName: ctx.params.queueName, body: ctx.request.body }
    });
    throw error;
  }
});

// 批量添加任务
router.post("/:queueName/jobs/batch", async (ctx) => {
  try {
    const { queueName } = ctx.params;
    const { jobs } = ctx.request.body as any;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      throw new CustomError("Jobs array is required");
    }

    const queue = queueManager.getQueue(queueName);
    if (!queue) {
      throw new CustomError(`Queue '${queueName}' not found`);
    }

    const jobIds = await queue.addJobs(jobs);

    ctx.body = {
      success: true,
      message: "Jobs added successfully",
      data: { jobIds, count: jobIds.length, queueName }
    };
  } catch (error) {
    logger().error({
      event: "addJobsBatchError",
      message: "Failed to add jobs batch",
      error: error.message,
      data: { queueName: ctx.params.queueName }
    });
    throw error;
  }
});

// 获取任务状态
router.get("/:queueName/jobs/:jobId", async (ctx) => {
  try {
    const { queueName, jobId } = ctx.params;

    const queue = queueManager.getQueue(queueName);
    if (!queue) {
      throw new CustomError(`Queue '${queueName}' not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new CustomError(`Job '${jobId}' not found`);
    }

    ctx.body = {
      success: true,
      data: job
    };
  } catch (error) {
    logger().error({
      event: "getJobError",
      message: "Failed to get job",
      error: error.message,
      data: { queueName: ctx.params.queueName, jobId: ctx.params.jobId }
    });
    throw error;
  }
});

// 删除任务
router.delete("/:queueName/jobs/:jobId", async (ctx) => {
  try {
    const { queueName, jobId } = ctx.params;

    const queue = queueManager.getQueue(queueName);
    if (!queue) {
      throw new CustomError(`Queue '${queueName}' not found`);
    }

    const result = await queue.removeJob(jobId);
    if (!result) {
      throw new CustomError(`Failed to remove job '${jobId}'`);
    }

    ctx.body = {
      success: true,
      message: "Job removed successfully",
      data: { jobId, queueName }
    };
  } catch (error) {
    logger().error({
      event: "removeJobError",
      message: "Failed to remove job",
      error: error.message,
      data: { queueName: ctx.params.queueName, jobId: ctx.params.jobId }
    });
    throw error;
  }
});

// 注册处理器
router.post("/:queueName/processors", async (ctx) => {
  try {
    const { queueName } = ctx.params;
    const { name, processor } = ctx.request.body as any;

    if (!name || !processor) {
      throw new CustomError("Processor name and function are required");
    }

    const queue = queueManager.getQueue(queueName);
    if (!queue) {
      throw new CustomError(`Queue '${queueName}' not found`);
    }

    // 这里需要根据实际情况处理处理器注册
    // 在实际应用中，处理器通常是在代码中预定义的
    ctx.body = {
      success: true,
      message: "Processor registration endpoint",
      data: { queueName, processorName: name }
    };
  } catch (error) {
    logger().error({
      event: "registerProcessorError",
      message: "Failed to register processor",
      error: error.message,
      data: { queueName: ctx.params.queueName }
    });
    throw error;
  }
});

// 开始处理队列
router.post("/:queueName/start", async (ctx) => {
  try {
    const { queueName } = ctx.params;
    const { processorName, options } = ctx.request.body as any;

    if (!processorName) {
      throw new CustomError("Processor name is required");
    }

    const queue = queueManager.getQueue(queueName);
    if (!queue) {
      throw new CustomError(`Queue '${queueName}' not found`);
    }

    await queue.startProcessing(processorName, options || {});

    ctx.body = {
      success: true,
      message: "Queue processing started",
      data: { queueName, processorName }
    };
  } catch (error) {
    logger().error({
      event: "startQueueError",
      message: "Failed to start queue processing",
      error: error.message,
      data: { queueName: ctx.params.queueName }
    });
    throw error;
  }
});

// 停止处理队列
router.post("/:queueName/stop", async (ctx) => {
  try {
    const { queueName } = ctx.params;

    const queue = queueManager.getQueue(queueName);
    if (!queue) {
      throw new CustomError(`Queue '${queueName}' not found`);
    }

    await queue.stopProcessing();

    ctx.body = {
      success: true,
      message: "Queue processing stopped",
      data: { queueName }
    };
  } catch (error) {
    logger().error({
      event: "stopQueueError",
      message: "Failed to stop queue processing",
      error: error.message,
      data: { queueName: ctx.params.queueName }
    });
    throw error;
  }
});

// 清空队列
router.delete("/:queueName/clear", async (ctx) => {
  try {
    const { queueName } = ctx.params;

    const queue = queueManager.getQueue(queueName);
    if (!queue) {
      throw new CustomError(`Queue '${queueName}' not found`);
    }

    const count = await queue.clear();

    ctx.body = {
      success: true,
      message: "Queue cleared successfully",
      data: { queueName, removedJobs: count }
    };
  } catch (error) {
    logger().error({
      event: "clearQueueError",
      message: "Failed to clear queue",
      error: error.message,
      data: { queueName: ctx.params.queueName }
    });
    throw error;
  }
});

// 获取队列统计信息
router.get("/:queueName/stats", async (ctx) => {
  try {
    const { queueName } = ctx.params;

    const queue = queueManager.getQueue(queueName);
    if (!queue) {
      throw new CustomError(`Queue '${queueName}' not found`);
    }

    const stats = await queue.getStats();

    ctx.body = {
      success: true,
      data: { queueName, ...stats }
    };
  } catch (error) {
    logger().error({
      event: "getQueueStatsError",
      message: "Failed to get queue stats",
      error: error.message,
      data: { queueName: ctx.params.queueName }
    });
    throw error;
  }
});

// 获取所有队列统计信息
router.get("/stats", async (ctx) => {
  try {
    const stats = await queueManager.getAllStats();

    ctx.body = {
      success: true,
      data: stats
    };
  } catch (error) {
    logger().error({
      event: "getAllQueueStatsError",
      message: "Failed to get all queue stats",
      error: error.message
    });
    throw error;
  }
});

// 删除队列
router.delete("/:queueName", async (ctx) => {
  try {
    const { queueName } = ctx.params;

    const result = await queueManager.removeQueue(queueName);
    if (!result) {
      throw new CustomError(`Queue '${queueName}' not found`);
    }

    ctx.body = {
      success: true,
      message: "Queue removed successfully",
      data: { queueName }
    };
  } catch (error) {
    logger().error({
      event: "removeQueueError",
      message: "Failed to remove queue",
      error: error.message,
      data: { queueName: ctx.params.queueName }
    });
    throw error;
  }
});

export default router; 