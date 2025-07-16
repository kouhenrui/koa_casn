# 队列服务 (QueueService)

基于Redis的高性能队列服务，支持优先级、延迟任务、重试机制等功能。

## 特性

- ✅ **Redis持久化**: 基于Redis的可靠队列存储
- ✅ **优先级队列**: 支持任务优先级排序
- ✅ **延迟任务**: 支持定时执行任务
- ✅ **重试机制**: 自动重试失败的任务
- ✅ **并发控制**: 可配置并发处理数量
- ✅ **批量操作**: 支持批量添加任务
- ✅ **队列管理**: 统一的队列管理器
- ✅ **统计监控**: 实时队列状态监控
- ✅ **错误处理**: 完善的错误处理和日志记录

## 快速开始

### 方式一：使用队列工厂（推荐）

```typescript
import { QueueFactory } from "../services/queue-factory.service";

const queueFactory = QueueFactory.getInstance();

// 创建邮件队列
const emailQueue = queueFactory.createEmailQueue();

// 创建短信队列
const smsQueue = queueFactory.createSMSQueue();

// 创建通知队列
const notificationQueue = queueFactory.createNotificationQueue();

// 创建数据处理队列
const dataQueue = queueFactory.createDataProcessingQueue();

// 创建定时任务队列
const scheduledQueue = queueFactory.createScheduledQueue();
```

### 方式二：使用队列管理器

```typescript
import { QueueManager } from "../services/queue.service";

const queueManager = QueueManager.getInstance();

// 创建邮件队列
const emailQueue = queueManager.createQueue({
  name: "email",
  maxAttempts: 3,        // 最大重试次数
  defaultPriority: 0,     // 默认优先级
  retryDelay: 5000,       // 重试延迟(ms)
  concurrency: 2          // 并发处理数量
});
```

### 2. 注册处理器（仅在使用队列管理器时需要）

```typescript
// 注册邮件发送处理器
emailQueue.registerProcessor("sendEmail", async (job) => {
  const { to, subject, content } = job.data;
  
  // 发送邮件逻辑
  await sendEmail(to, subject, content);
  
  console.log(`邮件已发送到: ${to}`);
});
```

### 3. 添加任务

```typescript
// 添加立即执行的任务
const jobId1 = await emailQueue.addJob({
  to: "user@example.com",
  subject: "欢迎",
  content: "欢迎使用我们的平台！"
});

// 添加高优先级任务
const jobId2 = await emailQueue.addJob({
  to: "admin@example.com",
  subject: "紧急通知",
  content: "系统出现异常"
}, {
  priority: 10  // 高优先级
});

// 添加延迟任务
const jobId3 = await emailQueue.addJob({
  to: "user@example.com",
  subject: "提醒",
  content: "请完成您的任务"
}, {
  delay: 3600000  // 1小时后执行
});
```

### 4. 开始处理

```typescript
// 使用队列工厂时，处理器已自动注册，直接启动即可
await queueFactory.startAllQueues();

// 或单独启动某个队列
await emailQueue.startProcessing("sendEmail");

// 停止处理
await emailQueue.stopProcessing();
```

## API 参考

### QueueService

#### 构造函数

```typescript
new QueueService(options: QueueOptions)
```

**QueueOptions:**
- `name: string` - 队列名称
- `redis?: Redis` - Redis客户端实例
- `maxAttempts?: number` - 最大重试次数 (默认: 3)
- `defaultPriority?: number` - 默认优先级 (默认: 0)
- `retryDelay?: number` - 重试延迟毫秒数 (默认: 5000)
- `batchSize?: number` - 批处理大小 (默认: 10)
- `concurrency?: number` - 并发处理数量 (默认: 1)

#### 方法

##### addJob(data, options?)

添加单个任务到队列。

```typescript
async addJob<T>(
  data: T,
  options?: {
    priority?: number;
    delay?: number;
    attempts?: number;
    maxAttempts?: number;
    metadata?: Record<string, any>;
  }
): Promise<string>
```

##### addJobs(jobs)

批量添加任务到队列。

```typescript
async addJobs<T>(
  jobs: Array<{
    data: T;
    priority?: number;
    delay?: number;
    attempts?: number;
    maxAttempts?: number;
    metadata?: Record<string, any>;
  }>
): Promise<string[]>
```

##### registerProcessor(name, processor)

注册任务处理器。

```typescript
registerProcessor<T>(name: string, processor: JobProcessor<T>): void
```

##### startProcessing(processorName, options?)

开始处理队列。

```typescript
async startProcessing(
  processorName: string, 
  options?: ProcessOptions
): Promise<void>
```

**ProcessOptions:**
- `timeout?: number` - 任务超时时间
- `retryOnError?: boolean` - 是否在错误时重试
- `removeOnComplete?: boolean` - 完成后是否删除任务
- `removeOnFail?: boolean` - 失败后是否删除任务

##### stopProcessing()

停止处理队列。

```typescript
async stopProcessing(): Promise<void>
```

##### getJob(jobId)

获取任务详情。

```typescript
async getJob(jobId: string): Promise<QueueJob | null>
```

##### removeJob(jobId)

删除任务。

```typescript
async removeJob(jobId: string): Promise<boolean>
```

##### clear()

清空队列。

```typescript
async clear(): Promise<number>
```

##### getStats()

获取队列统计信息。

```typescript
async getStats(): Promise<{
  waiting: number;
  delayed: number;
  processing: number;
  completed: number;
  failed: number;
}>
```

### QueueFactory

队列工厂，提供预配置的队列创建方法，支持邮件、短信、通知等常用队列类型。

#### getInstance()

获取单例实例。

```typescript
static getInstance(): QueueFactory
```

#### createEmailQueue()

创建邮件队列，自动配置邮件发送处理器。

```typescript
createEmailQueue(): QueueService
```

#### createSMSQueue()

创建短信队列，自动配置短信发送处理器。

```typescript
createSMSQueue(): QueueService
```

#### createNotificationQueue()

创建通知队列，自动配置通知发送处理器。

```typescript
createNotificationQueue(): QueueService
```

#### createDataProcessingQueue()

创建数据处理队列，自动配置数据处理处理器。

```typescript
createDataProcessingQueue(): QueueService
```

#### createScheduledQueue()

创建定时任务队列，自动配置定时任务处理器。

```typescript
createScheduledQueue(): QueueService
```

#### createCustomQueue(name, options?)

创建自定义队列。

```typescript
createCustomQueue(name: string, options?: Partial<QueueOptions>): QueueService
```

#### startAllQueues()

启动所有队列。

```typescript
async startAllQueues(): Promise<void>
```

#### stopAllQueues()

停止所有队列。

```typescript
async stopAllQueues(): Promise<void>
```

#### getAllStats()

获取所有队列统计信息。

```typescript
async getAllStats(): Promise<Record<string, any>>
```

### QueueManager

队列管理器，提供统一的队列管理接口。

#### getInstance()

获取单例实例。

```typescript
static getInstance(): QueueManager
```

#### createQueue(options)

创建新队列。

```typescript
createQueue(options: QueueOptions): QueueService
```

#### getQueue(name)

获取指定队列。

```typescript
getQueue(name: string): QueueService | undefined
```

#### removeQueue(name)

删除队列。

```typescript
async removeQueue(name: string): Promise<boolean>
```

#### getAllQueues()

获取所有队列。

```typescript
getAllQueues(): QueueService[]
```

#### getAllStats()

获取所有队列统计信息。

```typescript
async getAllStats(): Promise<Record<string, any>>
```

## 使用场景

### 1. 邮件发送队列

```typescript
// 使用队列工厂创建邮件队列
const queueFactory = QueueFactory.getInstance();
const emailQueue = queueFactory.createEmailQueue();

// 添加邮件任务
await emailQueue.addJob({
  to: "user@example.com",
  subject: "订单确认",
  content: "您的订单已确认",
  template: "order-confirmation"
}, {
  priority: 5,
  metadata: { orderId: "12345" }
});

// 添加批量邮件任务
const emailJobs = [
  {
    to: "user1@example.com",
    subject: "欢迎注册",
    content: "感谢您注册我们的平台！"
  },
  {
    to: "user2@example.com",
    subject: "密码重置",
    content: "您的密码重置链接：https://example.com/reset"
  }
];

await emailQueue.addJobs(
  emailJobs.map(email => ({ data: email }))
);

// 启动队列处理
await queueFactory.startAllQueues();
```

### 2. 短信发送队列

```typescript
// 使用队列工厂创建短信队列
const queueFactory = QueueFactory.getInstance();
const smsQueue = queueFactory.createSMSQueue();

// 添加验证码短信
await smsQueue.addJob({
  to: "13800138000",
  content: "您的验证码是：123456，5分钟内有效。",
  template: "verification_code"
});

// 添加紧急通知短信
await smsQueue.addJob({
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

await smsQueue.addJobs(
  smsJobs.map(sms => ({ data: sms }))
);
```

### 3. 通知推送队列

```typescript
// 使用队列工厂创建通知队列
const queueFactory = QueueFactory.getInstance();
const notificationQueue = queueFactory.createNotificationQueue();

// 添加推送通知
await notificationQueue.addJob({
  userId: "user123",
  type: "push",
  title: "新消息",
  content: "您有一条新的消息",
  data: { messageId: "msg123" },
  priority: "normal"
});

// 添加站内信
await notificationQueue.addJob({
  userId: ["user123", "user456"],
  type: "in_app",
  title: "系统维护通知",
  content: "系统将于今晚22:00-24:00进行维护，期间可能影响正常使用。",
  priority: "high"
});

// 添加Webhook通知
await notificationQueue.addJob({
  userId: "webhook_url",
  type: "webhook",
  title: "订单状态变更",
  content: "订单状态已更新为已发货",
  data: { orderId: "order123", status: "shipped" }
});
```

### 2. 数据处理队列

```typescript
// 创建数据处理队列
const dataQueue = queueManager.createQueue({
  name: "data-processing",
  maxAttempts: 2,
  concurrency: 3
});

// 注册数据处理器
dataQueue.registerProcessor("processData", async (job) => {
  const { userId, data, type } = job.data;
  
  switch (type) {
    case "user_profile":
      await processUserProfile(userId, data);
      break;
    case "order_data":
      await processOrderData(userId, data);
      break;
    default:
      throw new Error(`Unknown data type: ${type}`);
  }
});

// 批量添加数据处理任务
const jobs = userData.map(data => ({
  data: {
    userId: data.userId,
    data: data.payload,
    type: data.type
  },
  priority: data.priority || 0
}));

await dataQueue.addJobs(jobs);
await dataQueue.startProcessing("processData");
```

### 3. 定时任务队列

```typescript
// 创建定时任务队列
const scheduledQueue = queueManager.createQueue({
  name: "scheduled-tasks",
  maxAttempts: 1
});

// 注册定时任务处理器
scheduledQueue.registerProcessor("scheduledTask", async (job) => {
  const { taskType, params } = job.data;
  
  switch (taskType) {
    case "cleanup_expired_sessions":
      await cleanupExpiredSessions();
      break;
    case "generate_reports":
      await generateDailyReports();
      break;
    case "backup_database":
      await backupDatabase();
      break;
  }
});

// 添加定时任务
await scheduledQueue.addJob({
  taskType: "cleanup_expired_sessions",
  params: {}
}, {
  delay: 3600000  // 1小时后执行
});

await scheduledQueue.addJob({
  taskType: "generate_reports",
  params: { date: new Date().toISOString() }
}, {
  delay: 86400000  // 24小时后执行
});

await scheduledQueue.startProcessing("scheduledTask");
```

## 监控和管理

### 获取队列状态

```typescript
// 获取单个队列统计
const stats = await emailQueue.getStats();
console.log("邮件队列状态:", stats);

// 获取所有队列统计
const allStats = await queueManager.getAllStats();
console.log("所有队列状态:", allStats);
```

### 队列管理

```typescript
// 停止所有队列
const queues = queueManager.getAllQueues();
for (const queue of queues) {
  await queue.stopProcessing();
}

// 清空所有队列
for (const queue of queues) {
  await queue.clear();
}

// 删除队列
await queueManager.removeQueue("old-queue");
```

## 最佳实践

### 1. 错误处理

```typescript
emailQueue.registerProcessor("sendEmail", async (job) => {
  try {
    await sendEmail(job.data);
  } catch (error) {
    // 记录详细错误信息
    logger().error({
      event: "emailProcessorError",
      error: error.message,
      stack: error.stack,
      jobId: job.id,
      data: job.data
    });
    
    // 根据错误类型决定是否重试
    if (error.code === "RATE_LIMIT") {
      // 限流错误，延迟重试
      throw error;
    } else if (error.code === "INVALID_EMAIL") {
      // 无效邮箱，不重试
      return;
    }
    
    throw error;
  }
});
```

### 2. 性能优化

```typescript
// 使用批量操作
const jobs = largeDataSet.map(data => ({
  data,
  priority: data.priority || 0
}));

await queue.addJobs(jobs);

// 合理设置并发数
const queue = queueManager.createQueue({
  name: "high-load",
  concurrency: 10,  // 根据系统资源调整
  batchSize: 50     // 批量处理大小
});
```

### 3. 监控告警

```typescript
// 定期检查队列状态
setInterval(async () => {
  const stats = await queue.getStats();
  
  if (stats.waiting > 1000) {
    // 队列积压告警
    await sendAlert({
      type: "queue_backlog",
      queue: queue.name,
      waiting: stats.waiting
    });
  }
  
  if (stats.failed > 100) {
    // 失败任务告警
    await sendAlert({
      type: "queue_failures",
      queue: queue.name,
      failed: stats.failed
    });
  }
}, 60000); // 每分钟检查一次
```

## 注意事项

1. **Redis连接**: 确保Redis服务正常运行，队列服务依赖Redis存储
2. **内存管理**: 大量任务时注意Redis内存使用情况
3. **任务超时**: 设置合理的任务超时时间，避免长时间阻塞
4. **错误处理**: 在处理器中妥善处理异常，避免无限重试
5. **监控告警**: 设置队列监控，及时发现和处理问题
6. **资源清理**: 定期清理完成的任务，避免Redis数据积累

## 故障排除

### 常见问题

1. **任务不执行**: 检查处理器是否正确注册，队列是否已启动
2. **重试失败**: 检查重试逻辑，避免无限重试循环
3. **性能问题**: 调整并发数和批处理大小
4. **内存泄漏**: 定期清理完成的任务数据

### 调试技巧

```typescript
// 启用详细日志
logger().setLevel("debug");

// 检查任务状态
const job = await queue.getJob(jobId);
console.log("任务状态:", job);

// 监控队列统计
setInterval(async () => {
  const stats = await queue.getStats();
  console.log("队列统计:", stats);
}, 5000);
``` 