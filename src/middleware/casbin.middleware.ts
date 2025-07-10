import { Context, Next } from "koa";
import { CasbinService } from "../util/casbin";
import { logger } from "../util/log";
import { ForbiddenError } from "../util/error";


export const casbinMiddleware = async(ctx: Context, next: Next) => {
    try {
       const casbinService = await CasbinService.getInstance();
       const role = ctx.headers["x-role"] as string; // 示例中用 header 模拟登录用户
       if (!role) return ctx.throw(401, "Unauthorized");
       const path = ctx.path;
       const method = ctx.method.toUpperCase();

       logger().info({
         event: "casbinMiddleware",
         message: `${role} ${path} ${method}`,
       });
       const allowed = await casbinService.checkPermission({
         sub: "admin",
         obj: "/api/booking",
         act: "POST",
         domain: "*",
         region: "*",
         level: "*",
       });
       console.log(allowed,'allowed')
       if (!allowed) return ctx.throw(403, "Access Denied");
       await next();  
    } catch (error:any) {
        logger().error({
            event: "casbinMiddleware",
            message: error,
          });
         throw new ForbiddenError("Access Denied");
    }
       
  };