import { QueueManager, QueueService, QueueJob } from "../services/queue.service";
import { logger } from "../util/log";

// 示例1: 基础队列使用
export async function basicQueueExample() {
  console.log("=== 基础队列示例 ===");
  
  const queueManager = QueueManager.getInstance();
  
  // 创建队列
  const emailQueue = queueManager.createQueue({
    name: "email",
    maxAttempts: 3,
    defaultPriority: 0,
    retryDelay: 5000,
    concurrency: 2
  });

  // 注册邮件处理器
  emailQueue.registerProcessor("sendEmail", async (job: QueueJob) => {
    const { to, subject, content } = job.data;
    
    logger().info({
      event: "sendEmail",
      message: "Processing email job",
      data: { to, subject, jobId: job.id }
    });

    // 模拟发送邮件
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger().info({
      event: "emailSent",
      message: "Email sent successfully",
      data: { to, subject, jobId: job.id }
    });
  });

  // 添加邮件任务
  const jobId1 = await emailQueue.addJob({
    to: "user1@example.com",
    subject: "Welcome",
    content: "Welcome to our platform!"
  });

  const jobId2 = await emailQueue.addJob({
    to: "user2@example.com", 
    subject: "Notification",
    content: "You have a new notification"
  }, {
    priority: 1, // 高优先级
    delay: 5000   // 5秒后执行
  });

  console.log(`添加了2个邮件任务: ${jobId1}, ${jobId2}`);

  // 开始处理队列
  await emailQueue.startProcessing("sendEmail");

  // 等待一段时间让任务处理完成
  await new Promise(resolve => setTimeout(resolve, 10000));

  // 停止处理
  await emailQueue.stopProcessing();
}

// 示例2: 批量任务处理
export async function batchQueueExample() {
  console.log("=== 批量任务示例 ===");
  
  const queueManager = QueueManager.getInstance();
  
  // 创建数据处理队列
  const dataQueue = queueManager.createQueue({
    name: "data-processing",
    maxAttempts: 2,
    concurrency: 3
  });

  // 注册数据处理器
  dataQueue.registerProcessor("processData", async (job: QueueJob) => {
    const { userId, data } = job.data;
    
    logger().info({
      event: "processData",
      message: "Processing data job",
      data: { userId, jobId: job.id }
    });

    // 模拟数据处理
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟偶尔失败
    if (Math.random() < 0.1) {
      throw new Error("Random processing error");
    }

    logger().info({
      event: "dataProcessed",
      message: "Data processed successfully",
      data: { userId, jobId: job.id }
    });
  });

  // 批量添加任务
  const jobs = Array.from({ length: 10 }, (_, i) => ({
    data: {
      userId: `user_${i + 1}`,
      data: `data_${i + 1}`
    },
    priority: Math.floor(Math.random() * 3),
    metadata: { batch: "example_batch" }
  }));

  const jobIds = await dataQueue.addJobs(jobs);
  console.log(`批量添加了${jobIds.length}个数据处理任务`);

  // 开始处理
  await dataQueue.startProcessing("processData");

  // 等待处理完成
  await new Promise(resolve => setTimeout(resolve, 15000));

  // 获取统计信息
  const stats = await dataQueue.getStats();
  console.log("队列统计:", stats);

  await dataQueue.stopProcessing();
}

// 示例3: 优先级队列
export async function priorityQueueExample() {
  console.log("=== 优先级队列示例 ===");
  
  const queueManager = QueueManager.getInstance();
  
  // 创建优先级队列
  const priorityQueue = queueManager.createQueue({
    name: "priority-tasks",
    defaultPriority: 5,
    concurrency: 1 // 单线程处理以观察优先级
  });

  // 注册任务处理器
  priorityQueue.registerProcessor("priorityTask", async (job: QueueJob) => {
    const { taskName, priority } = job.data;
    
    logger().info({
      event: "priorityTask",
      message: "Processing priority task",
      data: { taskName, priority, jobId: job.id }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger().info({
      event: "priorityTaskCompleted",
      message: "Priority task completed",
      data: { taskName, priority, jobId: job.id }
    });
  });

  // 添加不同优先级的任务
  const tasks = [
    { name: "Low Priority Task", priority: 1 },
    { name: "High Priority Task", priority: 10 },
    { name: "Medium Priority Task", priority: 5 },
    { name: "Critical Task", priority: 15 },
    { name: "Normal Task", priority: 3 }
  ];

  for (const task of tasks) {
    await priorityQueue.addJob({
      taskName: task.name,
      priority: task.priority
    }, {
      priority: task.priority
    });
  }

  console.log("添加了5个不同优先级的任务");

  // 开始处理
  await priorityQueue.startProcessing("priorityTask");

  // 等待处理完成
  await new Promise(resolve => setTimeout(resolve, 10000));

  await priorityQueue.stopProcessing();
}

// 示例4: 延迟任务
export async function delayedQueueExample() {
  console.log("=== 延迟任务示例 ===");
  
  const queueManager = QueueManager.getInstance();
  
  // 创建延迟队列
  const delayedQueue = queueManager.createQueue({
    name: "delayed-tasks",
    maxAttempts: 1
  });

  // 注册延迟任务处理器
  delayedQueue.registerProcessor("delayedTask", async (job: QueueJob) => {
    const { taskName, scheduledTime } = job.data;
    
    logger().info({
      event: "delayedTask",
      message: "Processing delayed task",
      data: { 
        taskName, 
        scheduledTime, 
        actualTime: new Date().toISOString(),
        jobId: job.id 
      }
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    
    logger().info({
      event: "delayedTaskCompleted",
      message: "Delayed task completed",
      data: { taskName, jobId: job.id }
    });
  });

  // 添加延迟任务
  const now = Date.now();
  
  await delayedQueue.addJob({
    taskName: "Task in 2 seconds",
    scheduledTime: new Date(now + 2000).toISOString()
  }, {
    delay: 2000
  });

  await delayedQueue.addJob({
    taskName: "Task in 5 seconds", 
    scheduledTime: new Date(now + 5000).toISOString()
  }, {
    delay: 5000
  });

  await delayedQueue.addJob({
    taskName: "Task in 1 second",
    scheduledTime: new Date(now + 1000).toISOString()
  }, {
    delay: 1000
  });

  console.log("添加了3个延迟任务");

  // 开始处理
  await delayedQueue.startProcessing("delayedTask");

  // 等待所有任务完成
  await new Promise(resolve => setTimeout(resolve, 10000));

  await delayedQueue.stopProcessing();
}

// 示例5: 错误处理和重试
export async function retryQueueExample() {
  console.log("=== 重试机制示例 ===");
  
  const queueManager = QueueManager.getInstance();
  
  // 创建重试队列
  const retryQueue = queueManager.createQueue({
    name: "retry-tasks",
    maxAttempts: 3,
    retryDelay: 2000
  });

  // 注册会失败的任务处理器
  retryQueue.registerProcessor("retryTask", async (job: QueueJob) => {
    const { taskName, attempts } = job.data;
    
    logger().info({
      event: "retryTask",
      message: "Processing retry task",
      data: { 
        taskName, 
        attempts: job.attempts,
        jobId: job.id 
      }
    });

    // 模拟任务失败（前两次失败，第三次成功）
    if (job.attempts < 2) {
      throw new Error(`Task failed on attempt ${job.attempts + 1}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger().info({
      event: "retryTaskCompleted",
      message: "Retry task completed successfully",
      data: { taskName, attempts: job.attempts, jobId: job.id }
    });
  });

  // 添加会失败的任务
  await retryQueue.addJob({
    taskName: "Task with retries",
    attempts: 0
  });

  console.log("添加了1个会重试的任务");

  // 开始处理
  await retryQueue.startProcessing("retryTask");

  // 等待重试完成
  await new Promise(resolve => setTimeout(resolve, 15000));

  await retryQueue.stopProcessing();
}

// 示例6: 队列管理
export async function queueManagementExample() {
  console.log("=== 队列管理示例 ===");
  
  const queueManager = QueueManager.getInstance();
  
  // 创建多个队列
  const queues = [
    queueManager.createQueue({ name: "queue1", concurrency: 1 }),
    queueManager.createQueue({ name: "queue2", concurrency: 2 }),
    queueManager.createQueue({ name: "queue3", concurrency: 3 })
  ];

  // 为每个队列注册处理器
  queues.forEach((queue, index) => {
    queue.registerProcessor("default", async (job: QueueJob) => {
      logger().info({
        event: "queueTask",
        message: `Processing task in queue${index + 1}`,
        data: { jobId: job.id }
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    });
  });

  // 向每个队列添加任务
  for (let i = 0; i < 3; i++) {
    await queues[i].addJob({ taskId: i + 1 });
  }

  // 启动所有队列
  for (const queue of queues) {
    await queue.startProcessing("default");
  }

  // 等待一段时间
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 获取所有队列统计
  const allStats = await queueManager.getAllStats();
  console.log("所有队列统计:", allStats);

  // 停止所有队列
  for (const queue of queues) {
    await queue.stopProcessing();
  }

  // 清理队列
  for (const queue of queues) {
    await queue.clear();
  }
}

// 运行所有示例
async function runAllExamples() {
  try {
    await basicQueueExample();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await batchQueueExample();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await priorityQueueExample();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await delayedQueueExample();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await retryQueueExample();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await queueManagementExample();
    
    console.log("所有示例运行完成！");
  } catch (error) {
    console.error("示例运行出错:", error);
  }
}

// 导出示例函数
export {
  runAllExamples
}; 