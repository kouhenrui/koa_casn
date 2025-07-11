import { Enforcer, newEnforcer } from "casbin";
// import PostgresAdapter from "casbin-pg-adapter";    
import  TypeORMAdapter  from "typeorm-adapter";
import { logger } from "./log";
import path from "path";
 export class CasbinService {
   private enforcer: Enforcer;
   private static instance: CasbinService;
   private constructor() {}
   public static async getInstance(): Promise<CasbinService> {
     if (!CasbinService.instance) {
       CasbinService.instance = new CasbinService();
       await CasbinService.instance.init();
     }
     return CasbinService.instance;
   }
   async init() {
     const adapter = await TypeORMAdapter.newAdapter({
       type: "postgres",
       host: "121.43.161.170",
       port: 5432,
       username: "root",
       password: "123456",
       database: "koa_casbin",
     });
     this.enforcer = await newEnforcer(
       path.resolve(__dirname, "../../model.conf"),
       adapter
     );
     await this.enforcer.loadPolicy();
     logger().info({
       event: "casbin",
       message: "casbin init success 🤖🤖🤖",
     });
   }
   // 检查权限
   async checkPermission(params: {
     sub: string;
     obj: string;
     act: string;
     domain: string;
     region: string;
     level: string;
   }): Promise<boolean> {
     const { sub, obj, act, domain, region, level } = params;
     return this.enforcer.enforce(sub, obj, act, domain, region, level);
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
   ) {
     return this.enforcer.addPolicy(sub, obj, act, domain, region, level, eft);
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
   ) {
     return this.enforcer.removePolicy(
       sub,
       obj,
       act,
       domain,
       region,
       level,
       eft
     );
   }

   // 更新策略
   async updatePolicy(oldPolicy: string[], newPolicy: string[]) {
     return this.enforcer.updatePolicy(oldPolicy, newPolicy);
   }

   // 获取策略
   async getPolicy() {
     return this.enforcer.getPolicy();
   }

   // 获取角色权限
   async getPermissionsForRole(role: string) {
     return this.enforcer.getFilteredPolicy(0, role);
   }

   async hasPolicy(
     sub: string,
     obj: string,
     act: string,
     domain: string,
     region: string,
     level: string,
     eft: "allow"
   ): Promise<boolean> {
     return this.enforcer.hasPolicy(sub, obj, act, domain, region, level, eft);
   }
   // =============== GroupingPolicy 操作 ===============

   // 添加用户和角色的绑定
   async addGroupingPolicy(user: string, role: string, domain: string) {
     return this.enforcer.addGroupingPolicy(user, role, domain);
   }

   // 删除用户和角色的绑定
   async removeGroupingPolicy(user: string, role: string, domain: string) {
     return this.enforcer.removeGroupingPolicy(user, role, domain);
   }

   // 获取用户角色
   async getRolesForUser(user: string, domain?: string) {
     if (domain) {
       return this.enforcer.getRolesForUserInDomain(user, domain);
     }
     return this.enforcer.getRolesForUser(user);
   }

   // 获取角色用户
   async getUsersForRole(role: string, domain?: string) {
     if (domain) {
       return this.enforcer.getUsersForRoleInDomain(role, domain);
     }
     return this.enforcer.getUsersForRole(role);
   }

   async hasGroupingPolicy(
     user: string,
     role: string,
     domain: string
   ): Promise<boolean> {
     return this.enforcer.hasGroupingPolicy(user, role, domain);
   }

   // =============== 高级封装 ===============

   // 添加角色到组
   async addRoleToGroup(role: string, group: string, domain: string) {
     return this.enforcer.addGroupingPolicy(role, group, domain);
   }

   // 获取组角色
   async getRolesInGroup(group: string, domain: string) {
     return this.enforcer.getUsersForRoleInDomain(group, domain);
   }

   // 删除角色
   async deleteRole(role: string) {
     // 删除策略
     await this.enforcer.removeFilteredPolicy(0, role);
     // 删除分组
     await this.enforcer.removeFilteredGroupingPolicy(1, role);
   }

   // 添加用户和角色的绑定
   async assignRole(sub: string, role: string, domain: string) {
     return this.enforcer.addGroupingPolicy(sub, role, domain);
   }

   // 删除用户和角色的绑定
   async removeRole(sub: string, role: string, domain: string) {
     return this.enforcer.removeGroupingPolicy(sub, role, domain);
   }

   // 获取用户权限
   async getPermissionsForUser(sub: string): Promise<string[][]> {
     return this.enforcer.getFilteredPolicy(0, sub);
   }

   // 获取权限
   getEnforcer(): Enforcer {
     return this.enforcer;
   }
 }
