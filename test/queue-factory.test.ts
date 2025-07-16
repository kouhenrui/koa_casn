import { QueueFactory } from "../src/services/queue-factory.service";
import { logger } from "../src/util/log";

describe("QueueFactory", () => {
  // let queueFactory: QueueFactory;

  // beforeEach(() => {
  //   queueFactory = QueueFactory.getInstance();
  // });

  // afterEach(async () => {
  //   // 清理所有队列
  //   const queues = queueFactory.getAllQueues();
  //   for (const queue of queues) {
  //     await queue.stopProcessing();
  //   }
  // });

  // describe("createEmailQueue", () => {
  //   it("应该创建邮件队列", () => {
  //     const emailQueue = queueFactory.createEmailQueue();
      
  //     expect(emailQueue).toBeDefined();
  //     expect(typeof emailQueue.addJob).toBe("function");
  //     expect(typeof emailQueue.startProcessing).toBe("function");
  //   });

  //   it("应该返回相同的邮件队列实例", () => {
  //     const queue1 = queueFactory.createEmailQueue();
  //     const queue2 = queueFactory.createEmailQueue();
      
  //     expect(queue1).toBe(queue2);
  //   });

  //   it("应该能够添加邮件任务", async () => {
  //     const emailQueue = queueFactory.createEmailQueue();
      
  //     const jobId = await emailQueue.addJob({
  //       to: "test@example.com",
  //       subject: "测试邮件",
  //       content: "这是一封测试邮件"
  //     });

  //     expect(jobId).toBeDefined();
  //     expect(typeof jobId).toBe("string");
  //   });
  // });

  // describe("createSMSQueue", () => {
  //   it("应该创建短信队列", () => {
  //     const smsQueue = queueFactory.createSMSQueue();
      
  //     expect(smsQueue).toBeDefined();
  //     expect(typeof smsQueue.addJob).toBe("function");
  //     expect(typeof smsQueue.startProcessing).toBe("function");
  //   });

  //   it("应该返回相同的短信队列实例", () => {
  //     const queue1 = queueFactory.createSMSQueue();
  //     const queue2 = queueFactory.createSMSQueue();
      
  //     expect(queue1).toBe(queue2);
  //   });

  //   it("应该能够添加短信任务", async () => {
  //     const smsQueue = queueFactory.createSMSQueue();
      
  //     const jobId = await smsQueue.addJob({
  //       to: "13800138000",
  //       content: "您的验证码是：123456"
  //     });

  //     expect(jobId).toBeDefined();
  //     expect(typeof jobId).toBe("string");
  //   });
  // });

  // describe("createNotificationQueue", () => {
  //   it("应该创建通知队列", () => {
  //     const notificationQueue = queueFactory.createNotificationQueue();
      
  //     expect(notificationQueue).toBeDefined();
  //     expect(typeof notificationQueue.addJob).toBe("function");
  //     expect(typeof notificationQueue.startProcessing).toBe("function");
  //   });

  //   it("应该返回相同的通知队列实例", () => {
  //     const queue1 = queueFactory.createNotificationQueue();
  //     const queue2 = queueFactory.createNotificationQueue();
      
  //     expect(queue1).toBe(queue2);
  //   });

  //   it("应该能够添加通知任务", async () => {
  //     const notificationQueue = queueFactory.createNotificationQueue();
      
  //     const jobId = await notificationQueue.addJob({
  //       userId: "user123",
  //       type: "push",
  //       title: "测试通知",
  //       content: "这是一条测试通知"
  //     });

  //     expect(jobId).toBeDefined();
  //     expect(typeof jobId).toBe("string");
  //   });
  // });

  // describe("createDataProcessingQueue", () => {
  //   it("应该创建数据处理队列", () => {
  //     const dataQueue = queueFactory.createDataProcessingQueue();
      
  //     expect(dataQueue).toBeDefined();
  //     expect(typeof dataQueue.addJob).toBe("function");
  //     expect(typeof dataQueue.startProcessing).toBe("function");
  //   });

  //   it("应该返回相同的数据处理队列实例", () => {
  //     const queue1 = queueFactory.createDataProcessingQueue();
  //     const queue2 = queueFactory.createDataProcessingQueue();
      
  //     expect(queue1).toBe(queue2);
  //   });

  //   it("应该能够添加数据处理任务", async () => {
  //     const dataQueue = queueFactory.createDataProcessingQueue();
      
  //     const jobId = await dataQueue.addJob({
  //       type: "test_processing",
  //       data: { test: "data" }
  //     });

  //     expect(jobId).toBeDefined();
  //     expect(typeof jobId).toBe("string");
  //   });
  // });

  // describe("createScheduledQueue", () => {
  //   it("应该创建定时任务队列", () => {
  //     const scheduledQueue = queueFactory.createScheduledQueue();
      
  //     expect(scheduledQueue).toBeDefined();
  //     expect(typeof scheduledQueue.addJob).toBe("function");
  //     expect(typeof scheduledQueue.startProcessing).toBe("function");
  //   });

  //   it("应该返回相同的定时任务队列实例", () => {
  //     const queue1 = queueFactory.createScheduledQueue();
  //     const queue2 = queueFactory.createScheduledQueue();
      
  //     expect(queue1).toBe(queue2);
  //   });

  //   it("应该能够添加定时任务", async () => {
  //     const scheduledQueue = queueFactory.createScheduledQueue();
      
  //     const jobId = await scheduledQueue.addJob({
  //       taskType: "test_task",
  //       params: { test: "params" }
  //     });

  //     expect(jobId).toBeDefined();
  //     expect(typeof jobId).toBe("string");
  //   });
  // });

  // describe("createCustomQueue", () => {
  //   it("应该创建自定义队列", () => {
  //     const customQueue = queueFactory.createCustomQueue("test-queue", {
  //       maxAttempts: 5,
  //       concurrency: 3
  //     });
      
  //     expect(customQueue).toBeDefined();
  //     expect(typeof customQueue.addJob).toBe("function");
  //   });

  //   it("应该使用自定义配置", () => {
  //     const customQueue = queueFactory.createCustomQueue("test-queue-2", {
  //       maxAttempts: 10,
  //       concurrency: 5,
  //       retryDelay: 10000
  //     });
      
  //     expect(customQueue).toBeDefined();
  //   });
  // });

  // describe("getAllQueues", () => {
  //   it("应该返回所有创建的队列", () => {
  //     const emailQueue = queueFactory.createEmailQueue();
  //     const smsQueue = queueFactory.createSMSQueue();
  //     const notificationQueue = queueFactory.createNotificationQueue();
      
  //     const allQueues = queueFactory.getAllQueues();
      
  //     expect(allQueues).toContain(emailQueue);
  //     expect(allQueues).toContain(smsQueue);
  //     expect(allQueues).toContain(notificationQueue);
  //   });
  // });

  // describe("getAllStats", () => {
  //   it("应该返回所有队列的统计信息", async () => {
  //     const emailQueue = queueFactory.createEmailQueue();
  //     const smsQueue = queueFactory.createSMSQueue();
      
  //     // 添加一些任务
  //     await emailQueue.addJob({
  //       to: "test@example.com",
  //       subject: "测试",
  //       content: "测试内容"
  //     });
      
  //     await smsQueue.addJob({
  //       to: "13800138000",
  //       content: "测试短信"
  //     });
      
  //     const stats = await queueFactory.getAllStats();
      
  //     expect(stats).toBeDefined();
  //     expect(typeof stats).toBe("object");
  //     expect(stats.email).toBeDefined();
  //     expect(stats.sms).toBeDefined();
  //   });
  // });

  // describe("startAllQueues", () => {
  //   it("应该启动所有队列", async () => {
  //     const emailQueue = queueFactory.createEmailQueue();
  //     const smsQueue = queueFactory.createSMSQueue();
      
  //     await queueFactory.startAllQueues();
      
  //     // 等待一段时间让队列启动
  //     await new Promise(resolve => setTimeout(resolve, 1000));
      
  //     // 验证队列已启动（这里只是基本验证，实际测试可能需要更复杂的逻辑）
  //     expect(emailQueue).toBeDefined();
  //     expect(smsQueue).toBeDefined();
  //   });
  // });

  // describe("stopAllQueues", () => {
  //   it("应该停止所有队列", async () => {
  //     const emailQueue = queueFactory.createEmailQueue();
  //     const smsQueue = queueFactory.createSMSQueue();
      
  //     await queueFactory.startAllQueues();
  //     await new Promise(resolve => setTimeout(resolve, 1000));
      
  //     await queueFactory.stopAllQueues();
      
  //     // 验证队列已停止
  //     expect(emailQueue).toBeDefined();
  //     expect(smsQueue).toBeDefined();
  //   });
  // });

  // describe("批量任务处理", () => {
  //   it("应该能够批量添加邮件任务", async () => {
  //     const emailQueue = queueFactory.createEmailQueue();
      
  //     const emailJobs = [
  //       {
  //         to: "user1@example.com",
  //         subject: "批量邮件1",
  //         content: "内容1"
  //       },
  //       {
  //         to: "user2@example.com",
  //         subject: "批量邮件2",
  //         content: "内容2"
  //       }
  //     ];
      
  //     const jobIds = await emailQueue.addJobs(
  //       emailJobs.map(email => ({ data: email }))
  //     );
      
  //     expect(jobIds).toHaveLength(2);
  //     expect(jobIds.every(id => typeof id === "string")).toBe(true);
  //   });

  //   it("应该能够批量添加短信任务", async () => {
  //     const smsQueue = queueFactory.createSMSQueue();
      
  //     const smsJobs = [
  //       {
  //         to: "13800138001",
  //         content: "短信1"
  //       },
  //       {
  //         to: "13800138002",
  //         content: "短信2"
  //       }
  //     ];
      
  //     const jobIds = await smsQueue.addJobs(
  //       smsJobs.map(sms => ({ data: sms }))
  //     );
      
  //     expect(jobIds).toHaveLength(2);
  //     expect(jobIds.every(id => typeof id === "string")).toBe(true);
  //   });
  // });

  // describe("任务优先级", () => {
  //   it("应该支持任务优先级", async () => {
  //     const emailQueue = queueFactory.createEmailQueue();
      
  //     const jobId1 = await emailQueue.addJob({
  //       to: "user@example.com",
  //       subject: "普通邮件",
  //       content: "普通内容"
  //     }, {
  //       priority: 0
  //     });
      
  //     const jobId2 = await emailQueue.addJob({
  //       to: "admin@example.com",
  //       subject: "高优先级邮件",
  //       content: "紧急内容"
  //     }, {
  //       priority: 10
  //     });
      
  //     expect(jobId1).toBeDefined();
  //     expect(jobId2).toBeDefined();
  //   });
  // });

  // describe("延迟任务", () => {
  //   it("应该支持延迟任务", async () => {
  //     const emailQueue = queueFactory.createEmailQueue();
      
  //     const jobId = await emailQueue.addJob({
  //       to: "user@example.com",
  //       subject: "延迟邮件",
  //       content: "延迟内容"
  //     }, {
  //       delay: 1000 // 1秒后执行
  //     });
      
  //     expect(jobId).toBeDefined();
  //   });
  // });
}); 