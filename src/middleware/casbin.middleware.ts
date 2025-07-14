import { Context, Next } from "koa";
import { CasbinService } from "../util/casbin";
import { logger } from "../util/log";
import { CustomError, ForbiddenError, UnauthorizedError } from "../util/error";
import { resourceRepo } from "../orm/repotity";

export interface CasbinMiddlewareOptions {
  requireAuth?: boolean;
  skipResourceCheck?: boolean;
  defaultDomain?: string;
  defaultRegion?: string;
}

/**
 * Casbin权限检查中间件
 */
export function casbinMiddleware(options: CasbinMiddlewareOptions = {}) {
  const {
    requireAuth = true,
    skipResourceCheck = false,
    defaultDomain = "*",
    defaultRegion = "*"
  } = options;

  return async (ctx: Context, next: Next) => {
    const startTime = Date.now();
    
    try {
      // 获取用户信息
      const user = ctx.state.user;
      
      if (requireAuth && !user) {
        throw new UnauthorizedError("Authentication required");
      }

      // 如果不需要认证且没有用户，直接通过
      if (!requireAuth && !user) {
        await next();
        return;
      }

      // 获取请求信息
      const path = ctx.path;
      const method = ctx.method.toUpperCase();
      
      // 获取用户信息
      const userDomain = user?.domain || defaultDomain;
      const userRegion = user?.region || defaultRegion;
      const userLevel = user?.level || "10";
      
      // 获取用户角色
      const userRoles = user?.roles?.map((role: any) => role.name) || [];
      
      if (userRoles.length === 0) {
        throw new ForbiddenError("User has no roles assigned");
      }

      // 检查资源是否存在（可选）
      let resourceInfo = null;
      if (!skipResourceCheck) {
        resourceInfo = await resourceRepo.findOneBy({ 
          path, 
          method, 
          domain: userDomain 
        });
        
        if (!resourceInfo) {
          logger().warn({
            event: "resourceNotFound",
            message: "Resource not found in database",
            data: { path, method, domain: userDomain }
          });
          // 不阻止访问，只是记录警告
        }
      }

      // 获取Casbin服务
      const casbinService = await CasbinService.getInstance();
      
      // 检查用户是否有权限
      let hasPermission = false;
      let checkedRoles = [];

      for (const role of userRoles) {
        const permission = await casbinService.checkPermission({
          sub: role,
          obj: path,
          act: method,
          domain: userDomain,
          region: userRegion,
          level: userLevel
        });

        checkedRoles.push({ role, permission });
        
        if (permission) {
          hasPermission = true;
          break; // 找到一个有权限的角色就足够了
        }
      }

      if (!hasPermission) {
        logger().warn({
          event: "permissionDenied",
          message: "Access denied by Casbin",
          data: {
            userId: user?.id,
            userName: user?.name,
            path,
            method,
            domain: userDomain,
            region: userRegion,
            level: userLevel,
            userRoles,
            checkedRoles,
            resourceInfo: resourceInfo ? {
              id: resourceInfo.id,
              level: resourceInfo.level
            } : null
          }
        });
        
        throw new ForbiddenError("Access denied");
      }

      // 记录权限检查成功
      const duration = Date.now() - startTime;
      logger().debug({
        event: "permissionGranted",
        message: "Permission check passed",
        data: {
          userId: user?.id,
          userName: user?.name,
          path,
          method,
          domain: userDomain,
          region: userRegion,
          level: userLevel,
          duration: `${duration}ms`
        }
      });

      // 权限检查通过，继续处理
      await next();

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof CustomError) {
        // 自定义错误，直接抛出
        logger().error({
          event: "casbinMiddlewareError",
          message: `${error.constructor.name}: ${error.message}`,
          data: {
            path: ctx.path,
            method: ctx.method,
            duration: `${duration}ms`
          }
        });
        throw error;
      }
      
      // 其他错误，包装为权限错误
      logger().error({
        event: "casbinMiddlewareUnexpectedError",
        message: "Unexpected error in Casbin middleware",
        error: error.message,
        data: {
          path: ctx.path,
          method: ctx.method,
          duration: `${duration}ms`
        }
      });
      
      throw new ForbiddenError("Permission check failed");
    }
  };
}

/**
 * 角色检查中间件
 */
export function requireRole(roles: string | string[]) {
  return async (ctx: Context, next: Next) => {
    const user = ctx.state.user;
    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }

    const userRoles = user.roles?.map((role: any) => role.name) || [];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      logger().warn({
        event: "roleCheckFailed",
        message: "User does not have required role",
        data: {
          userId: user.id,
          userName: user.name,
          userRoles,
          requiredRoles
        }
      });
      
      throw new ForbiddenError(`Required roles: ${requiredRoles.join(', ')}`);
    }

    await next();
  };
}

/**
 * 权限等级检查中间件
 */
export function requireLevel(minLevel: number) {
  return async (ctx: Context, next: Next) => {
    const user = ctx.state.user;
    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }

    const userLevel = Math.max(...(user.roles?.map((role: any) => parseInt(role.level) || 0) || [0]));
    
    if (userLevel < minLevel) {
      logger().warn({
        event: "levelCheckFailed",
        message: "User does not have required level",
        data: {
          userId: user.id,
          userName: user.name,
          userLevel,
          requiredLevel: minLevel
        }
      });
      
      throw new ForbiddenError(`Required minimum level: ${minLevel}`);
    }

    await next();
  };
}

/**
 * 域检查中间件
 */
export function requireDomain(domains: string | string[]) {
  return async (ctx: Context, next: Next) => {
    const user = ctx.state.user;
    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }

    const userDomain = user.domain;
    const requiredDomains = Array.isArray(domains) ? domains : [domains];
    
    const hasDomain = requiredDomains.includes(userDomain) || requiredDomains.includes("*");
    
    if (!hasDomain) {
      logger().warn({
        event: "domainCheckFailed",
        message: "User does not have access to required domain",
        data: {
          userId: user.id,
          userName: user.name,
          userDomain,
          requiredDomains
        }
      });
      
      throw new ForbiddenError(`Required domains: ${requiredDomains.join(', ')}`);
    }

    await next();
  };
}
