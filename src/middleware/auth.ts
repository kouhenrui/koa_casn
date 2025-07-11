import { Context, Next } from "koa";
import { PrismaClient } from "@prisma/client";
// import { matchAttributes } from "../utils/abac";

// const prisma = new PrismaClient();

export  function authorize(action: string, resource: string) {
  return async (ctx: Context, next: Next) => {
    // const userId = ctx.headers["x-user-id"]; // 示例中用 header 模拟登录用户
    // if (!userId) return ctx.throw(401, "Unauthorized");

    // const user = await prisma.user.findUnique({
    //   where: { id: userId },
    //   include: { role: { include: { permissions: true } } },
    // });

    // if (!user) return ctx.throw(403, "User not found");

    // const allowed = user.role.permissions.some(
    //   (perm:any) =>
    //     perm.action === action &&
    //     perm.resource === resource //&&
    //     // matchAttributes(user, perm.condition as Record<string, any>)
    // );

    // if (!allowed) return ctx.throw(403, "Access Denied");

    // ctx.state.user = user;
    await next();
  };
}
