import { getRedisService } from './redis';

/**
 * Redis使用示例
 */
export class RedisExample {
  private redis = getRedisService();

  // 基础键值操作示例
  async basicOperations() {
    console.log('=== 基础键值操作 ===');
    
    // 设置值
    const setResult = await this.redis.set('user:1', { name: '张三', age: 25 });
    console.log('设置用户:', setResult);
    
    // 获取值
    const getResult = await this.redis.get<{ name: string; age: number }>('user:1');
    console.log('获取用户:', getResult);
    
    // 设置带过期时间的值
    const setExResult = await this.redis.set('temp:data', '临时数据', 60);
    console.log('设置临时数据:', setExResult);
    
    // 检查键是否存在
    const existsResult = await this.redis.exists('user:1');
    console.log('用户是否存在:', existsResult);
  }

  // 缓存操作示例
  async cacheOperations() {
    console.log('=== 缓存操作 ===');
    
    // 设置缓存
    const cacheData = { products: [{ id: 1, name: '商品1' }] };
    const setCacheResult = await this.redis.setCache('cache:products', cacheData);
    console.log('设置缓存:', setCacheResult);
    
    // 获取缓存
    const getCacheResult = await this.redis.getCache('cache:products');
    console.log('获取缓存:', getCacheResult);
    
    // 批量获取
    const mgetResult = await this.redis.mgetCache(['user:1', 'cache:products']);
    console.log('批量获取:', mgetResult);
  }

  // 计数器操作示例
  async counterOperations() {
    console.log('=== 计数器操作 ===');
    
    // 自增
    const incrResult = await this.redis.incr('counter:visits');
    console.log('访问计数:', incrResult);
    
    // 自增并设置过期时间
    const incrExResult = await this.redis.incrWithExpire('counter:daily', 86400);
    console.log('日访问计数:', incrExResult);
    
    // 自减
    const decrResult = await this.redis.decr('counter:stock');
    console.log('库存计数:', decrResult);
  }

  // 哈希表操作示例
  async hashOperations() {
    console.log('=== 哈希表操作 ===');
    
    // 设置哈希表字段
    await this.redis.hset('user:profile:1', 'name', '李四');
    await this.redis.hset('user:profile:1', 'email', 'lisi@example.com');
    await this.redis.hset('user:profile:1', 'age', '30');
    
    // 获取哈希表字段
    const nameResult = await this.redis.hget('user:profile:1', 'name');
    console.log('用户名:', nameResult);
    
    // 获取所有字段
    const allFieldsResult = await this.redis.hgetall('user:profile:1');
    console.log('所有字段:', allFieldsResult);
    
    // 获取字段名
    const keysResult = await this.redis.hkeys('user:profile:1');
    console.log('字段名:', keysResult);
  }

  // 地理位置操作示例
  async geoOperations() {
    console.log('=== 地理位置操作 ===');
    
    // 添加地理位置
    await this.redis.geoAdd('stores', 116.397128, 39.916527, '北京店');
    await this.redis.geoAdd('stores', 121.473701, 31.230416, '上海店');
    await this.redis.geoAdd('stores', 113.264435, 23.129163, '广州店');
    
    // 查询附近的位置
    const nearbyResult = await this.redis.geoRadius('stores', 116.397128, 39.916527, 1000, 'km');
    console.log('附近1000km内的店铺:', nearbyResult);
  }

  // 发布订阅示例
  async pubsubOperations() {
    console.log('=== 发布订阅操作 ===');
    
    // 订阅频道
    const subscriber = await this.redis.subscribe('news', (message) => {
      console.log('收到消息:', message);
    });
    
    // 发布消息
    const publishResult = await this.redis.publish('news', '这是一条测试消息');
    console.log('发布消息:', publishResult);
    
    // 延迟取消订阅
    setTimeout(() => {
      subscriber.disconnect();
      console.log('已取消订阅');
    }, 1000);
  }

  // 工具方法示例
  async utilityOperations() {
    console.log('=== 工具方法 ===');
    
    // 检查连接状态
    const isReady = this.redis.isReady();
    console.log('Redis连接状态:', isReady);
    
    // 获取服务器信息
    const infoResult = await this.redis.info();
    console.log('服务器信息:', infoResult);
  }

  // 错误处理示例
  async errorHandlingExample() {
    console.log('=== 错误处理示例 ===');
    
    try {
      // 尝试获取不存在的键
      const result = await this.redis.get('non:existent:key');
      console.log('获取不存在的键:', result);
      
      // 尝试删除键
      const delResult = await this.redis.del('user:1');
      console.log('删除键:', delResult);
      
    } catch (error) {
      console.error('操作失败:', error);
    }
  }

  // 完整示例
  async runAllExamples() {
    console.log('🚀 开始Redis操作示例...\n');
    
    await this.basicOperations();
    console.log('\n');
    
    await this.cacheOperations();
    console.log('\n');
    
    await this.counterOperations();
    console.log('\n');
    
    await this.hashOperations();
    console.log('\n');
    
    await this.geoOperations();
    console.log('\n');
    
    await this.pubsubOperations();
    console.log('\n');
    
    await this.utilityOperations();
    console.log('\n');
    
    await this.errorHandlingExample();
    console.log('\n✅ 所有示例执行完成');
  }
}

// 使用示例
export const runRedisExamples = async () => {
  const example = new RedisExample();
  await example.runAllExamples();
}; 