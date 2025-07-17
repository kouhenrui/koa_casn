import { Context } from 'koa';
import { 
  CustomError, 
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
import { 
  errorBoundary as errorBoundaryDecorator,
  asyncHandler,
  withRetry
} from '../middleware/error.middleware';

// =============== 错误处理使用示例 ===============

// 1. 基本错误抛出
export const basicErrorExample = async (ctx: Context) => {
  // 抛出业务错误
  if (!ctx.request.body) {
    throw new BusinessError('请求体不能为空');
  }
  
  // 抛出验证错误
  if (!(ctx.request.body as any)?.email) {
    throw new ValidationError('邮箱地址必填');
  }
  
  // 抛出认证错误
  if (!ctx.state.user) {
    throw new AuthenticationError();
  }
  
  // 抛出授权错误
  if (!ctx.state.user.isAdmin) {
    throw new AuthorizationError('需要管理员权限');
  }
  
  // 抛出资源不存在错误
  const user = await findUser(ctx.params.id);
  if (!user) {
    throw new NotFoundError('用户');
  }
  
  // 抛出冲突错误
  if (await userExists((ctx.request.body as any)?.email)) {
    throw new ConflictError('邮箱地址已存在');
  }
  
  ctx.body = { success: true, data: user };
};

// 2. 使用错误处理工具
export const errorHandlerExample = async (ctx: Context) => {
  try {
    // 模拟数据库操作
    await databaseOperation();
  } catch (error) {
    // 使用错误处理工具创建标准错误
    throw ErrorHandler.createError(
      ErrorCodes.DATABASE_ERROR,
      '数据库连接失败',
      500,
      { operation: 'query', table: 'users' }
    );
  }
};

// 3. 使用异步错误包装器
export const asyncHandlerExample = asyncHandler(async (ctx: Context) => {
  // 这个函数中的任何错误都会被自动捕获和处理
  const result = await riskyOperation();
  ctx.body = { success: true, data: result };
});

// 4. 使用错误边界装饰器
export class UserService {
  @errorBoundaryDecorator
  async createUser(userData: any) {
    // 这个方法中的错误会被自动记录
    if (!userData.email) {
      throw new ValidationError('邮箱必填');
    }
    
    return await saveUser(userData);
  }
  
  @errorBoundaryDecorator
  async updateUser(id: string, userData: any) {
    const user = await findUser(id);
    if (!user) {
      throw new NotFoundError('用户');
    }
    
    return await updateUserData(id, userData);
  }
}

// 5. 使用重试机制
export const retryExample = async () => {
  return await withRetry(
    async () => {
      // 模拟可能失败的外部API调用
      const response = await externalApiCall();
      if (!response.ok) {
        throw new Error('API调用失败');
      }
      return response.data;
    },
    3, // 最大重试次数
    1000 // 初始延迟时间（毫秒）
  );
};

// 6. 路由级别的错误处理
export const routeErrorExample = async (ctx: Context) => {
  // 模拟不同的错误场景
  const errorType = ctx.query.errorType;
  
  switch (errorType) {
    case 'validation':
      throw new ValidationError('参数验证失败', {
        field: 'email',
        value: ctx.query.email,
        rule: 'email format'
      });
      
    case 'auth':
      throw new AuthenticationError('用户未登录');
      
    case 'permission':
      throw new AuthorizationError('权限不足');
      
    case 'notfound':
      throw new NotFoundError('资源');
      
    case 'conflict':
      throw new ConflictError('数据冲突');
      
    case 'rateLimit':
      throw new RateLimitError();
      
    case 'database':
      throw new DatabaseError('数据库连接失败');
      
    case 'external':
      throw new ExternalServiceError('支付服务', '服务暂时不可用');
      
    default:
      throw new CustomError('未知错误', 500, 'UNKNOWN_ERROR');
  }
};

// 7. 中间件错误处理
export const middlewareErrorExample = async (ctx: Context, next: Function) => {
  try {
    // 验证请求头
    if (!ctx.headers.authorization) {
      throw new AuthenticationError('缺少认证头');
    }
    
    // 验证用户权限
    const user = await validateUser(ctx.headers.authorization);
    if (!user) {
      throw new AuthenticationError('无效的认证信息');
    }
    
    if (!user.isActive) {
      throw new AuthorizationError('账户已被禁用');
    }
    
    ctx.state.user = user;
    await next();
  } catch (error) {
    // 重新抛出错误，让全局错误处理器处理
    throw error;
  }
};

// 8. 批量操作错误处理
export const batchOperationExample = async (ctx: Context) => {
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
};

// 9. 条件错误处理
export const conditionalErrorExample = async (ctx: Context) => {
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
};

// 10. 错误恢复和降级
export const errorRecoveryExample = async (ctx: Context) => {
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
      throw new CustomError(
        '所有操作都失败了',
        503,
        'SERVICE_UNAVAILABLE',
        {
          primaryError: error.message,
          fallbackError: fallbackError.message
        }
      );
    }
  }
};

// =============== 辅助函数 ===============

async function findUser(id: string) {
  // 模拟数据库查询
  return null;
}

async function userExists(email: string) {
  // 模拟检查用户是否存在
  return false;
}

async function databaseOperation() {
  // 模拟数据库操作
  throw new Error('Database connection failed');
}

async function riskyOperation() {
  // 模拟有风险的操作
  return { result: 'success' };
}

async function saveUser(userData: any) {
  // 模拟保存用户
  return { id: '1', ...userData };
}

async function updateUserData(id: string, userData: any) {
  // 模拟更新用户数据
  return { id, ...userData };
}

async function externalApiCall() {
  // 模拟外部API调用
  return { ok: false, data: null };
}

async function validateUser(token: string) {
  // 模拟用户验证
  return null;
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
  return false;
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