import Router from 'koa-router';
import { 
  BusinessError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  ErrorHandler,
  ErrorCodes
} from '../util/error';
import { asyncHandler } from '../middleware/error.middleware';

const router = new Router({ prefix: '/error-demo' });

// 演示不同类型的错误
router.get('/business', async (ctx) => {
  throw new BusinessError('这是一个业务错误示例');
});

router.get('/validation', async (ctx) => {
  throw new ValidationError('数据验证失败', {
    field: 'email',
    value: 'invalid-email',
    rule: 'email format'
  });
});

router.get('/auth', async (ctx) => {
  throw new AuthenticationError('用户未登录');
});

router.get('/permission', async (ctx) => {
  throw new AuthorizationError('权限不足');
});

router.get('/notfound', async (ctx) => {
  throw new NotFoundError('用户');
});

router.get('/conflict', async (ctx) => {
  throw new ConflictError('数据已存在');
});

router.get('/rate-limit', async (ctx) => {
  throw new RateLimitError();
});

router.get('/database', async (ctx) => {
  throw new DatabaseError('数据库连接失败');
});

router.get('/external', async (ctx) => {
  throw new ExternalServiceError('支付服务', '服务暂时不可用');
});

// 演示错误处理工具
router.get('/custom', async (ctx) => {
  const error = ErrorHandler.createError(
    ErrorCodes.BUSINESS_ERROR,
    '自定义错误消息',
    400,
    { customField: 'customValue' }
  );
  throw error;
});

// 演示异步错误包装器
router.get('/async', async (ctx) => {
  // 这个函数中的任何错误都会被自动捕获和处理
  const result = await riskyOperation();
  ctx.body = { success: true, data: result };
});

// 演示批量操作错误处理
router.post('/batch', async (ctx) => {
  const operations = (ctx.request.body as any)?.operations || [];
  const results = [];
  const errors = [];
  
  for (let i = 0; i < operations.length; i++) {
    try {
      const result = await processOperation(operations[i]);
      results.push({ index: i, success: true, data: result });
    } catch (error) {
      errors.push({ 
        index: i, 
        success: false, 
        error: ErrorHandler.formatError(error, 'zh')
      });
    }
  }
  
  ctx.body = {
    success: errors.length === 0,
    data: {
      results,
      errors,
      summary: {
        total: operations.length,
        success: results.length,
        failed: errors.length
      }
    }
  };
});

// 演示错误恢复和降级
router.get('/recovery', async (ctx) => {
  try {
    // 尝试主要操作
    const result = await primaryOperation();
    ctx.body = { success: true, data: result, source: 'primary' };
  } catch (error) {
    // 如果主要操作失败，尝试备用操作
    try {
      const fallbackResult = await fallbackOperation();
      ctx.body = { 
        success: true, 
        data: fallbackResult, 
        source: 'fallback',
        warning: '使用备用数据源'
      };
    } catch (fallbackError) {
      // 如果备用操作也失败，返回错误
      throw ErrorHandler.createError(
        ErrorCodes.SERVICE_UNAVAILABLE,
        '所有操作都失败了',
        503,
        {
          primaryError: error.message,
          fallbackError: fallbackError.message
        }
      );
    }
  }
});

// 演示条件错误处理
router.post('/conditional', async (ctx) => {
  const { action, resource } = ctx.request.body as any;
  
  // 根据业务逻辑抛出不同的错误
  if (action === 'delete' && resource === 'system') {
    throw new AuthorizationError('不能删除系统资源');
  }
  
  if (action === 'create' && await resourceExists(resource)) {
    throw new ConflictError(`${resource}已存在`);
  }
  
  if (action === 'update' && !await resourceExists(resource)) {
    throw new NotFoundError(resource);
  }
  
  // 执行操作
  const result = await executeAction(action, resource);
  ctx.body = { success: true, data: result };
});

// 演示未捕获的错误
router.get('/uncaught', async (ctx) => {
  // 这个错误会被全局错误处理器捕获
  throw new Error('这是一个未捕获的错误');
});

// 演示数据库错误
router.get('/db-error', async (ctx) => {
  // 模拟数据库错误
  const dbError = new Error('ER_DUP_ENTRY: Duplicate entry');
  (dbError as any).code = 'ER_DUP_ENTRY';
  throw dbError;
});

// 演示JWT错误
router.get('/jwt-error', async (ctx) => {
  // 模拟JWT错误
  const jwtError = new Error('Token expired');
  jwtError.name = 'TokenExpiredError';
  throw jwtError;
});

// 辅助函数
async function riskyOperation() {
  // 模拟有风险的操作
  if (Math.random() > 0.5) {
    throw new Error('随机错误');
  }
  return { result: 'success' };
}

async function processOperation(operation: any) {
  // 模拟处理操作
  if (operation.type === 'error') {
    throw new Error('操作失败');
  }
  return { processed: true, operation };
}

async function resourceExists(resource: string) {
  // 模拟检查资源是否存在
  return resource === 'existing';
}

async function executeAction(action: string, resource: string) {
  // 模拟执行操作
  return { action, resource, executed: true };
}

async function primaryOperation() {
  // 模拟主要操作
  throw new Error('Primary operation failed');
}

async function fallbackOperation() {
  // 模拟备用操作
  return { data: 'fallback data' };
}

export default router; 