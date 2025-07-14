import { Enforcer, newEnforcer } from "casbin";
import TypeORMAdapter from "typeorm-adapter";
import { logger } from "./log";
import path from "path";
import { ServerConfig } from "./env";

export interface PermissionParams {
  sub: string;
  obj: string;
  act: string;
  domain: string;
  region: string;
  level: string;
}

export interface PolicyRule {
  sub: string;
  obj: string;
  act: string;
  domain: string;
  region: string;
  level: string;
  eft: "allow" | "deny";
}

export interface RoleAssignment {
  user: string;
  role: string;
  domain: string;
}

export class CasbinService {
  private enforcer: Enforcer;
  private static instance: CasbinService;
  private cache: Map<string, boolean> = new Map();
  private cacheTimeout: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  private constructor() {}

  public static async getInstance(): Promise<CasbinService> {
    if (!CasbinService.instance) {
      CasbinService.instance = new CasbinService();
      await CasbinService.instance.init();
    }
    return CasbinService.instance;
  }

  async init() {
    try {
      const adapter = await TypeORMAdapter.newAdapter({
        type: "postgres",
        host: ServerConfig.casbin_postgre.host,
        port: Number(ServerConfig.casbin_postgre.port),
        username: ServerConfig.casbin_postgre.username,
        password: ServerConfig.casbin_postgre.password,
        database: ServerConfig.casbin_postgre.database,
        synchronize: Boolean(ServerConfig.casbin_postgre.sync),
      });

      this.enforcer = await newEnforcer(
        path.resolve(__dirname, "../../model.conf"),
        adapter
      );

      // 启用自动保存
      this.enforcer.enableAutoSave(true);
      
      // 启用日志
      this.enforcer.enableLog(true);

      await this.enforcer.loadPolicy();
      
      const policies = await this.enforcer.getPolicy();
      const roles = await this.enforcer.getGroupingPolicy();
      
      logger().info({
        event: "casbin",
        message: "Casbin initialized successfully",
        data: { 
          policies: policies.length,
          roles: roles.length
        }
      });
    } catch (error) {
      logger().error({
        event: "casbinInitError",
        message: "Failed to initialize Casbin",
        error: error.message
      });
      throw error;
    }
  }

  // 检查权限（带缓存）
  async checkPermission(params: PermissionParams): Promise<boolean> {
    const cacheKey = this.generateCacheKey(params);
    
    // 检查缓存
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const { sub, obj, act, domain, region, level } = params;
      const result = await this.enforcer.enforce(sub, obj, act, domain, region, level);
      
      // 缓存结果
      this.setCache(cacheKey, result);
      
      logger().debug({
        event: "permissionCheck",
        message: "Permission check result",
        data: { ...params, result }
      });

      return result;
    } catch (error) {
      logger().error({
        event: "permissionCheckError",
        message: "Permission check failed",
        error: error.message,
        data: params
      });
      return false;
    }
  }

  // 批量检查权限
  async checkPermissions(params: PermissionParams[]): Promise<boolean[]> {
    const results = await Promise.all(
      params.map(param => this.checkPermission(param))
    );
    return results;
  }

  // 生成缓存键
  private generateCacheKey(params: PermissionParams): string {
    return `${params.sub}:${params.obj}:${params.act}:${params.domain}:${params.region}:${params.level}`;
  }

  // 检查缓存是否有效
  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimeout.get(key);
    return timestamp ? Date.now() < timestamp : false;
  }

  // 设置缓存
  private setCache(key: string, value: boolean): void {
    this.cache.set(key, value);
    this.cacheTimeout.set(key, Date.now() + this.CACHE_TTL);
  }

  // 清除缓存
  clearCache(): void {
    this.cache.clear();
    this.cacheTimeout.clear();
  }

  // =============== Policy 操作 ===============

  // 添加策略
  async addPolicy(
    sub: string,
    obj: string,
    act: string,
    domain: string,
    region: string,
    level: string,
    eft: "allow" | "deny" = "allow"
  ): Promise<boolean> {
    try {
      const result = await this.enforcer.addPolicy(sub, obj, act, domain, region, level, eft);
      if (result) {
        this.clearCache(); // 清除缓存
        logger().info({
          event: "policyAdded",
          message: "Policy added successfully",
          data: { sub, obj, act, domain, region, level, eft }
        });
      }
      return result;
    } catch (error) {
      logger().error({
        event: "addPolicyError",
        message: "Failed to add policy",
        error: error.message,
        data: { sub, obj, act, domain, region, level, eft }
      });
      return false;
    }
  }

  // 批量添加策略
  async addPolicies(policies: PolicyRule[]): Promise<boolean> {
    try {
      const policyStrings = policies.map(p => [p.sub, p.obj, p.act, p.domain, p.region, p.level, p.eft]);
      const result = await this.enforcer.addPolicies(policyStrings);
      if (result) {
        this.clearCache();
        logger().info({
          event: "policiesAdded",
          message: "Policies added successfully",
          data: { count: policies.length }
        });
      }
      return result;
    } catch (error) {
      logger().error({
        event: "addPoliciesError",
        message: "Failed to add policies",
        error: error.message
      });
      return false;
    }
  }

  // 删除策略
  async removePolicy(
    sub: string,
    obj: string,
    act: string,
    domain: string,
    region: string,
    level: string,
    eft: "allow" | "deny" = "allow"
  ): Promise<boolean> {
    try {
      const result = await this.enforcer.removePolicy(sub, obj, act, domain, region, level, eft);
      if (result) {
        this.clearCache();
        logger().info({
          event: "policyRemoved",
          message: "Policy removed successfully",
          data: { sub, obj, act, domain, region, level, eft }
        });
      }
      return result;
    } catch (error) {
      logger().error({
        event: "removePolicyError",
        message: "Failed to remove policy",
        error: error.message,
        data: { sub, obj, act, domain, region, level, eft }
      });
      return false;
    }
  }

  // 更新策略
  async updatePolicy(oldPolicy: string[], newPolicy: string[]): Promise<boolean> {
    try {
      const result = await this.enforcer.updatePolicy(oldPolicy, newPolicy);
      if (result) {
        this.clearCache();
        logger().info({
          event: "policyUpdated",
          message: "Policy updated successfully",
          data: { oldPolicy, newPolicy }
        });
      }
      return result;
    } catch (error) {
      logger().error({
        event: "updatePolicyError",
        message: "Failed to update policy",
        error: error.message,
        data: { oldPolicy, newPolicy }
      });
      return false;
    }
  }

  // 获取策略
  async getPolicy(): Promise<string[][]> {
    try {
      return await this.enforcer.getPolicy();
    } catch (error) {
      logger().error({
        event: "getPolicyError",
        message: "Failed to get policy",
        error: error.message
      });
      return [];
    }
  }

  // 获取角色权限
  async getPermissionsForRole(role: string): Promise<string[][]> {
    try {
      return await this.enforcer.getFilteredPolicy(0, role);
    } catch (error) {
      logger().error({
        event: "getPermissionsForRoleError",
        message: "Failed to get permissions for role",
        error: error.message,
        data: { role }
      });
      return [];
    }
  }

  // 检查策略是否存在
  async hasPolicy(
    sub: string,
    obj: string,
    act: string,
    domain: string,
    region: string,
    level: string,
    eft: "allow" | "deny" = "allow"
  ): Promise<boolean> {
    try {
      return await this.enforcer.hasPolicy(sub, obj, act, domain, region, level, eft);
    } catch (error) {
      logger().error({
        event: "hasPolicyError",
        message: "Failed to check policy existence",
        error: error.message,
        data: { sub, obj, act, domain, region, level, eft }
      });
      return false;
    }
  }

  // =============== GroupingPolicy 操作 ===============

  // 添加用户和角色的绑定
  async addGroupingPolicy(user: string, role: string, domain: string): Promise<boolean> {
    try {
      const result = await this.enforcer.addGroupingPolicy(user, role, domain);
      if (result) {
        this.clearCache();
        logger().info({
          event: "roleAssigned",
          message: "Role assigned to user successfully",
          data: { user, role, domain }
        });
      }
      return result;
    } catch (error) {
      logger().error({
        event: "addGroupingPolicyError",
        message: "Failed to assign role to user",
        error: error.message,
        data: { user, role, domain }
      });
      return false;
    }
  }

  // 删除用户和角色的绑定
  async removeGroupingPolicy(user: string, role: string, domain: string): Promise<boolean> {
    try {
      const result = await this.enforcer.removeGroupingPolicy(user, role, domain);
      if (result) {
        this.clearCache();
        logger().info({
          event: "roleRemoved",
          message: "Role removed from user successfully",
          data: { user, role, domain }
        });
      }
      return result;
    } catch (error) {
      logger().error({
        event: "removeGroupingPolicyError",
        message: "Failed to remove role from user",
        error: error.message,
        data: { user, role, domain }
      });
      return false;
    }
  }

  // 获取用户角色
  async getRolesForUser(user: string, domain?: string): Promise<string[]> {
    try {
      if (domain) {
        return await this.enforcer.getRolesForUserInDomain(user, domain);
      }
      return await this.enforcer.getRolesForUser(user);
    } catch (error) {
      logger().error({
        event: "getRolesForUserError",
        message: "Failed to get roles for user",
        error: error.message,
        data: { user, domain }
      });
      return [];
    }
  }

  // 获取角色用户
  async getUsersForRole(role: string, domain?: string): Promise<string[]> {
    try {
      if (domain) {
        return await this.enforcer.getUsersForRoleInDomain(role, domain);
      }
      return await this.enforcer.getUsersForRole(role);
    } catch (error) {
      logger().error({
        event: "getUsersForRoleError",
        message: "Failed to get users for role",
        error: error.message,
        data: { role, domain }
      });
      return [];
    }
  }

  // 检查用户角色关系是否存在
  async hasGroupingPolicy(user: string, role: string, domain: string): Promise<boolean> {
    try {
      return await this.enforcer.hasGroupingPolicy(user, role, domain);
    } catch (error) {
      logger().error({
        event: "hasGroupingPolicyError",
        message: "Failed to check user-role relationship",
        error: error.message,
        data: { user, role, domain }
      });
      return false;
    }
  }

  // =============== 高级封装 ===============

  // 添加角色到组
  async addRoleToGroup(role: string, group: string, domain: string): Promise<boolean> {
    return await this.addGroupingPolicy(role, group, domain);
  }

  // 获取组角色
  async getRolesInGroup(group: string, domain: string): Promise<string[]> {
    return await this.getUsersForRole(group, domain);
  }

  // 删除角色
  async deleteRole(role: string): Promise<boolean> {
    try {
      // 删除策略
      await this.enforcer.removeFilteredPolicy(0, role);
      // 删除分组
      await this.enforcer.removeFilteredGroupingPolicy(1, role);
      
      this.clearCache();
      logger().info({
        event: "roleDeleted",
        message: "Role deleted successfully",
        data: { role }
      });
      
      return true;
    } catch (error) {
      logger().error({
        event: "deleteRoleError",
        message: "Failed to delete role",
        error: error.message,
        data: { role }
      });
      return false;
    }
  }

  // 添加用户和角色的绑定（别名）
  async assignRole(sub: string, role: string, domain: string): Promise<boolean> {
    return await this.addGroupingPolicy(sub, role, domain);
  }

  // 删除用户和角色的绑定（别名）
  async removeRole(sub: string, role: string, domain: string): Promise<boolean> {
    return await this.removeGroupingPolicy(sub, role, domain);
  }

  // 获取用户权限
  async getPermissionsForUser(sub: string): Promise<string[][]> {
    try {
      return await this.enforcer.getFilteredPolicy(0, sub);
    } catch (error) {
      logger().error({
        event: "getPermissionsForUserError",
        message: "Failed to get permissions for user",
        error: error.message,
        data: { sub }
      });
      return [];
    }
  }

  // 获取权限统计信息
  async getStats(): Promise<{
    policies: number;
    roles: number;
    users: number;
  }> {
    try {
      const policies = await this.enforcer.getPolicy();
      const roles = await this.enforcer.getGroupingPolicy();
      const users = new Set(roles.map(r => r[0])).size;
      
      return {
        policies: policies.length,
        roles: roles.length,
        users
      };
    } catch (error) {
      logger().error({
        event: "getStatsError",
        message: "Failed to get stats",
        error: error.message
      });
      return { policies: 0, roles: 0, users: 0 };
    }
  }

  // 获取权限
  getEnforcer(): Enforcer {
    return this.enforcer;
  }
}
