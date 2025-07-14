import Router from "koa-router";
import { CasbinService } from "../util/casbin";
import {
  casbinMiddleware,
  requireRole,
  requireLevel,
} from "../middleware/casbin.middleware";
import { logger } from "../util/log";
import { CustomError } from "../util/error";

const router = new Router({ prefix: "/api/permission" });

// 获取所有策略
router.get(
  "/policies",
  casbinMiddleware({ requireAuth: true }),
//   requireRole(["admin", "super_admin"]),
  async (ctx) => {
    try {
      const casbinService = await CasbinService.getInstance();
      const policies = await casbinService.getPolicy();
      ctx.body = { policies, count: policies.length };
    } catch (error) {
      logger().error({
        event: "getPoliciesError",
        message: "Failed to get policies",
        error: error.message,
      });
      throw new CustomError("Failed to get policies");
    }
  }
);

// 添加策略
router.post(
  "/policies",
  casbinMiddleware({ requireAuth: true }),
  requireRole(["admin", "super_admin"]),
  async (ctx) => {
    try {
      const {
        sub,
        obj,
        act,
        domain,
        region,
        level,
        eft = "allow",
      } = ctx.request.body as any;

      if (!sub || !obj || !act) {
        throw new CustomError("Missing required fields: sub, obj, act");
      }

      const casbinService = await CasbinService.getInstance();
      const result = await casbinService.addPolicy(
        sub,
        obj,
        act,
        domain || "*",
        region || "*",
        level || "*",
        eft
      );

      if (!result) {
        throw new CustomError("Failed to add policy");
      }

      ctx.body = { sub, obj, act, domain, region, level, eft };
    } catch (error) {
      logger().error({
        event: "addPolicyError",
        message: "Failed to add policy",
        error: error.message,
        data: ctx.request.body,
      });
      throw error;
    }
  }
);

// 批量添加策略
router.post(
  "/policies/batch",
  casbinMiddleware({ requireAuth: true }),
  requireRole(["admin", "super_admin"]),
  async (ctx) => {
    try {
      const { policies } = ctx.request.body as any;

      if (!Array.isArray(policies)) {
        throw new CustomError("Policies must be an array");
      }

      const casbinService = await CasbinService.getInstance();
      const result = await casbinService.addPolicies(policies);

      if (!result) {
        throw new CustomError("Failed to add policies");
      }

      ctx.body = { count: policies.length };
    } catch (error) {
      logger().error({
        event: "addPoliciesBatchError",
        message: "Failed to add policies batch",
        error: error.message,
      });
      throw error;
    }
  }
);

// 删除策略
router.delete(
  "/policies",
  casbinMiddleware({ requireAuth: true }),
  requireRole(["admin", "super_admin"]),
  async (ctx) => {
    try {
      const {
        sub,
        obj,
        act,
        domain,
        region,
        level,
        eft = "allow",
      } = ctx.request.body as any;

      if (!sub || !obj || !act) {
        throw new CustomError("Missing required fields: sub, obj, act");
      }

      const casbinService = await CasbinService.getInstance();
      const result = await casbinService.removePolicy(
        sub,
        obj,
        act,
        domain || "*",
        region || "*",
        level || "*",
        eft
      );

      if (!result) {
        throw new CustomError("Failed to remove policy");
      }

      ctx.body = { sub, obj, act, domain, region, level, eft };
    } catch (error) {
      logger().error({
        event: "removePolicyError",
        message: "Failed to remove policy",
        error: error.message,
        data: ctx.request.body,
      });
      throw error;
    }
  }
);

// 获取用户角色
router.get(
  "/users/:userId/roles",
  casbinMiddleware({ requireAuth: true }),
  requireLevel(20),
  async (ctx) => {
    try {
      const { userId } = ctx.params;
      const { domain } = ctx.query;

      const casbinService = await CasbinService.getInstance();
      const roles = await casbinService.getRolesForUser(
        userId,
        domain as string
      );

      ctx.body = {
        userId,
        roles,
        count: roles.length,
      };
    } catch (error) {
      logger().error({
        event: "getUserRolesError",
        message: "Failed to get user roles",
        error: error.message,
        data: { userId: ctx.params.userId },
      });
      throw new CustomError("Failed to get user roles");
    }
  }
);

// 为用户分配角色
router.post(
  "/users/:userId/roles",
  casbinMiddleware({ requireAuth: true }),
  requireRole(["admin", "super_admin"]),
  async (ctx) => {
    const { userId } = ctx.params;
    const { role, domain = "*" } = ctx.request.body as any;
    try {
      if (!role) {
        throw new CustomError("Role is required");
      }

      const casbinService = await CasbinService.getInstance();
      const result = await casbinService.assignRole(userId, role, domain);

      if (!result) {
        throw new CustomError("Failed to assign role to user");
      }

      ctx.body = { userId, role, domain };
    } catch (error) {
      logger().error({
        event: "assignRoleError",
        message: "Failed to assign role to user",
        error: error.message,
        data: { userId: ctx.params.userId, body: ctx.request.body },
      });
      throw error;
    }
  }
);

// 移除用户角色
router.delete(
  "/users/:userId/roles",
  casbinMiddleware({ requireAuth: true }),
  requireRole(["admin", "super_admin"]),
  async (ctx) => {
    try {
      const { userId } = ctx.params;
      const { role, domain = "*" } = ctx.request.body as any;

      if (!role) {
        throw new CustomError("Role is required");
      }

      const casbinService = await CasbinService.getInstance();
      const result = await casbinService.removeRole(userId, role, domain);

      if (!result) {
        throw new CustomError("Failed to remove role from user");
      }

      ctx.body = { userId, role, domain };
    } catch (error) {
      logger().error({
        event: "removeRoleError",
        message: "Failed to remove role from user",
        error: error.message,
        data: { userId: ctx.params.userId, body: ctx.request.body },
      });
      throw error;
    }
  }
);

// 获取角色用户
router.get(
  "/roles/:role/users",
  casbinMiddleware({ requireAuth: true }),
  requireLevel(20),
  async (ctx) => {
    try {
      const { role } = ctx.params;
      const { domain } = ctx.query;

      const casbinService = await CasbinService.getInstance();
      const users = await casbinService.getUsersForRole(role, domain as string);

      ctx.body = {
        role,
        users,
        count: users.length,
      };
    } catch (error) {
      logger().error({
        event: "getRoleUsersError",
        message: "Failed to get role users",
        error: error.message,
        data: { role: ctx.params.role },
      });
      throw new CustomError("Failed to get role users");
    }
  }
);

// 获取权限统计信息
router.get(
  "/stats",
  casbinMiddleware({ requireAuth: true }),
  requireRole(["admin", "super_admin"]),
  async (ctx) => {
    try {
      const casbinService = await CasbinService.getInstance();
      const stats = await casbinService.getStats();
      ctx.body = stats;
    } catch (error) {
      logger().error({
        event: "getStatsError",
        message: "Failed to get permission stats",
        error: error.message,
      });
      throw new CustomError("Failed to get permission stats");
    }
  }
);

// 清除缓存
router.post(
  "/cache/clear",
  casbinMiddleware({ requireAuth: true }),
  requireRole(["admin", "super_admin"]),
  async (ctx) => {
    try {
      const casbinService = await CasbinService.getInstance();
      casbinService.clearCache();

      ctx.body = {
        success: true,
        message: "Cache cleared successfully",
      };
    } catch (error) {
      logger().error({
        event: "clearCacheError",
        message: "Failed to clear cache",
        error: error.message,
      });
      throw new CustomError("Failed to clear cache");
    }
  }
);

// 检查权限
router.post("/check", casbinMiddleware({ requireAuth: true }), async (ctx) => {
  try {
    const { sub, obj, act, domain, region, level } = ctx.request.body as any;

    if (!sub || !obj || !act) {
      throw new CustomError("Missing required fields: sub, obj, act");
    }

    const casbinService = await CasbinService.getInstance();
    const result = await casbinService.checkPermission({
      sub,
      obj,
      act,
      domain: domain || "*",
      region: region || "*",
      level: level || "*",
    });

    ctx.body = {
      success: true,
      data: {
        allowed: result,
        params: { sub, obj, act, domain, region, level },
      },
    };
  } catch (error) {
    logger().error({
      event: "checkPermissionError",
      message: "Failed to check permission",
      error: error.message,
      data: ctx.request.body,
    });
    throw error;
  }
});

export default router;
