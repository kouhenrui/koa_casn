import { QueueManager, QueueService, QueueJob } from "../src/services/queue.service";
import { logger } from "../src/util/log";

describe("QueueService", () => {
  let queueManager: QueueManager;
  let testQueue: QueueService;

//   beforeEach(() => {
//     queueManager = QueueManager.getInstance();
//     testQueue = queueManager.createQueue({
//       name: "test-queue",
//       maxAttempts: 2,
//       concurrency: 1
//     });
//   });

//   afterEach(async () => {
//     await testQueue.stopProcessing();
//     await testQueue.clear();
//   });

//   describe("基础功能", () => {
//     it("应该能创建队列", () => {
//       expect(testQueue).toBeDefined();
//       expect(testQueue).toBeInstanceOf(QueueService);
//     });

//     it("应该能添加任务", async () => {
//       const jobId = await testQueue.addJob({ test: "data" });
//       expect(jobId).toBeDefined();
//       expect(typeof jobId).toBe("string");
//     });

//     it("应该能获取任务", async () => {
//       const jobData = { test: "data", number: 123 };
//       const jobId = await testQueue.addJob(jobData);
      
//       const job = await testQueue.getJob(jobId);
//       expect(job).toBeDefined();
//       expect(job?.data).toEqual(jobData);
//     });

//     it("应该能删除任务", async () => {
//       const jobId = await testQueue.addJob({ test: "data" });
      
//       const result = await testQueue.removeJob(jobId);
//       expect(result).toBe(true);
      
//       const job = await testQueue.getJob(jobId);
//       expect(job).toBeNull();
//     });
//   });

//   describe("批量操作", () => {
//     it("应该能批量添加任务", async () => {
//       const jobs = [
//         { data: { id: 1, name: "task1" } },
//         { data: { id: 2, name: "task2" } },
//         { data: { id: 3, name: "task3" } }
//       ];

//       const jobIds = await testQueue.addJobs(jobs);
//       expect(jobIds).toHaveLength(3);
//       expect(jobIds.every(id => typeof id === "string")).toBe(true);
//     });
//   });

//   describe("优先级队列", () => {
//     it("应该按优先级处理任务", async () => {
//       const processedJobs: string[] = [];

//       testQueue.registerProcessor("priorityTest", async (job: QueueJob) => {
//         processedJobs.push(job.data.name);
//         await new Promise(resolve => setTimeout(resolve, 100));
//       });

//       // 添加不同优先级的任务
//       await testQueue.addJob({ name: "low" }, { priority: 1 });
//       await testQueue.addJob({ name: "high" }, { priority: 10 });
//       await testQueue.addJob({ name: "medium" }, { priority: 5 });

//       await testQueue.startProcessing("priorityTest");
      
//       // 等待处理完成
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       await testQueue.stopProcessing();

//       // 高优先级任务应该先处理
//       expect(processedJobs[0]).toBe("high");
//     });
//   });

//   describe("延迟任务", () => {
//     it("应该能处理延迟任务", async () => {
//       const startTime = Date.now();
//       const processedTimes: number[] = [];

//       testQueue.registerProcessor("delayTest", async (job: QueueJob) => {
//         processedTimes.push(Date.now() - startTime);
//       });

//       // 添加延迟任务
//       await testQueue.addJob({ name: "delayed" }, { delay: 500 });

//       await testQueue.startProcessing("delayTest");
      
//       // 等待处理完成
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       await testQueue.stopProcessing();

//       // 任务应该在延迟后处理
//       expect(processedTimes[0]).toBeGreaterThan(400);
//     });
//   });

//   describe("重试机制", () => {
//     it("应该在失败时重试", async () => {
//       let attemptCount = 0;

//       testQueue.registerProcessor("retryTest", async (job: QueueJob) => {
//         attemptCount++;
//         if (attemptCount < 2) {
//           throw new Error("Simulated failure");
//         }
//       });

//       await testQueue.addJob({ name: "retry" });

//       await testQueue.startProcessing("retryTest");
      
//       // 等待重试完成
//       await new Promise(resolve => setTimeout(resolve, 3000));
      
//       await testQueue.stopProcessing();

//       // 应该重试了2次
//       expect(attemptCount).toBe(2);
//     });
//   });

//   describe("队列统计", () => {
//     it("应该能获取队列统计信息", async () => {
//       await testQueue.addJob({ test: "data1" });
//       await testQueue.addJob({ test: "data2" }, { delay: 1000 });

//       const stats = await testQueue.getStats();
      
//       expect(stats.waiting).toBe(1);
//       expect(stats.delayed).toBe(1);
//     });
//   });

//   describe("队列管理", () => {
//     it("应该能管理多个队列", () => {
//       const queue1 = queueManager.createQueue({ name: "queue1" });
//       const queue2 = queueManager.createQueue({ name: "queue2" });

//       expect(queueManager.getQueue("queue1")).toBe(queue1);
//       expect(queueManager.getQueue("queue2")).toBe(queue2);
//       expect(queueManager.getAllQueues()).toHaveLength(3); // 包括testQueue
//     });

//     it("应该能删除队列", async () => {
//       const queue = queueManager.createQueue({ name: "temp-queue" });
//       await queue.addJob({ test: "data" });

//       const result = await queueManager.removeQueue("temp-queue");
//       expect(result).toBe(true);
//       expect(queueManager.getQueue("temp-queue")).toBeUndefined();
//     });
//   });

//   describe("错误处理", () => {
//     it("应该处理无效的处理器名称", async () => {
//       await expect(
//         testQueue.startProcessing("nonexistent")
//       ).rejects.toThrow("Processor 'nonexistent' not found");
//     });

//     it("应该处理重复启动", async () => {
//       testQueue.registerProcessor("test", async () => {});
//       await testQueue.startProcessing("test");
      
//       await expect(
//         testQueue.startProcessing("test")
//       ).rejects.toThrow("Queue is already processing");
      
//       await testQueue.stopProcessing();
//     });
//   });
// });

// describe("QueueManager", () => {
//   let queueManager: QueueManager;

//   beforeEach(() => {
//     queueManager = QueueManager.getInstance();
//   });

//   it("应该是单例", () => {
//     const instance1 = QueueManager.getInstance();
//     const instance2 = QueueManager.getInstance();
//     expect(instance1).toBe(instance2);
//   });

//   it("应该能获取所有队列统计", async () => {
//     const queue1 = queueManager.createQueue({ name: "stats-test-1" });
//     const queue2 = queueManager.createQueue({ name: "stats-test-2" });

//     await queue1.addJob({ test: "data" });
//     await queue2.addJob({ test: "data" }, { delay: 1000 });

//     const stats = await queueManager.getAllStats();
    
//     expect(stats["stats-test-1"]).toBeDefined();
//     expect(stats["stats-test-2"]).toBeDefined();
//     expect(stats["stats-test-1"].waiting).toBe(1);
//     expect(stats["stats-test-2"].delayed).toBe(1);

//     // 清理
//     await queueManager.removeQueue("stats-test-1");
//     await queueManager.removeQueue("stats-test-2");
//   });
}); 