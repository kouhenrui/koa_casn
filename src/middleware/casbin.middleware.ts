import { Context, Next } from "koa";
import { CasbinService } from "../util/casbin";
import { logger } from "../util/log";
import { CustomError, ForbiddenError } from "../util/error";
import { resourceRepo } from "../orm/repotity";

export const casbinMiddleware = async (ctx: Context, next: Next) => {
  try {
    // const casbinService = await CasbinService.getInstance();
    // const user=ctx.state.user;
    // if(!user) throw new CustomError("No Auth,please login");
    // const path = ctx.path;
    // const method = ctx.method.toUpperCase();
    // const resourceInfo=await resourceRepo.findOneBy({path})
    // if(!resourceInfo) throw new CustomError("Resource Not Found");
    // logger().info({
    //   event: "casbinMiddleware",
    //   message: `${user.role} ${path} ${method}`,
    // });
    // const allowed = await casbinService.checkPermission({
    //   sub: "admin",
    //   obj: path,
    //   act: method,
    //   domain: user?.domain || "*",
    //   region: user?.region || "*",
    //   level: user?.level || "*",
    // });
    // if (!allowed) throw new ForbiddenError("Access Denied"); //return ctx.throw(403, "Access Denied");
    await next();
  } catch (error: any) {
    logger().error({
      event: "casbinMiddleware",
      message: error,
    });
    throw new ForbiddenError("Access Denied");
  }
};
