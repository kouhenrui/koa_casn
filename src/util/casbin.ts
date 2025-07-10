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
    //  await this.initPolicy();
   }
   async initPolicy(){
     // 3. 添加角色权限（policy：p = sub, obj, act, domain, region, level）
     await this.enforcer.addPolicy("guest", "room", "view", "hotelA", "CN", "10");
     await this.enforcer.addPolicy("staff", "room", "checkin", "hotelA", "CN", "20");
     await this.enforcer.addPolicy(
       "staff",
       "room",
       "checkout",
       "hotelA",
       "CN",
       "20"
     );
     await this.enforcer.addPolicy(
       "supervisor",
       "report",
       "view",
       "hotelA",
       "CN",
       "30"
     );
     await this.enforcer.addPolicy("admin", "*", "*", "hotelA", "*", "50");
     await this.enforcer.addPolicy("super_admin", "*", "*", "*", "*", "*");

     // 4. 添加用户和角色的绑定（grouping policy：g = userId, role, domain）
     await this.enforcer.addGroupingPolicy("u1001", "guest", "hotelA");
     await this.enforcer.addGroupingPolicy("u1002", "staff", "hotelA");
     await this.enforcer.addGroupingPolicy("u1003", "supervisor", "hotelA");
     await this.enforcer.addGroupingPolicy("u1009", "admin", "hotelA");
     await this.enforcer.addGroupingPolicy("root", "super_admin", "*");
     logger().info({
      event: "loadInitPolicy",message: "loadInitPolicy success 🤖🤖🤖"
     })
     // 5. 保存策略到数据库（可选，因为 adapter 会自动持久化）
    //  await this.enforcer.savePolicy();
   }
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

   async removePolicy(
     sub: string,
     obj: string,
     act: string,
     domain: string,
     region: string,
     level: string
   ) {
     return this.enforcer.removePolicy(
       sub,
       obj,
       act,
       domain,
       region,
       level,
       "allow"
     );
   }

   async assignRole(sub: string, role: string, domain: string) {
     return this.enforcer.addGroupingPolicy(sub, role, domain);
   }

   async removeRole(sub: string, role: string, domain: string) {
     return this.enforcer.removeGroupingPolicy(sub, role, domain);
   }

   async getRolesForUser(sub: string, domain: string): Promise<string[]> {
     return this.enforcer.getRolesForUser(sub, domain);
   }

   async getPermissionsForUser(sub: string): Promise<string[][]> {
     return this.enforcer.getFilteredPolicy(0, sub);
   }

   getEnforcer(): Enforcer {
     return this.enforcer;
   }
 }
