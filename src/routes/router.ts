import Router from "koa-router";
import { accountService } from "../services/account.service";
import MWSService from "../meituan/api";
import { casbinMiddleware } from "../middleware/casbin.middleware";
import { logger } from "../util/log";
import AESSimple from "../meituan/aesCrypto";
import { CasbinService } from "../util/casbin";
import permissionRouter from "./permission";
import queueRouter from "./queue";
const router = new Router();

router.post('/test/casbin', casbinMiddleware(), async(ctx) => {
  ctx.body = "res"
})

// 注册权限管理路由
router.use(permissionRouter.routes());
router.use(permissionRouter.allowedMethods());

// 注册队列管理路由
router.use(queueRouter.routes());
router.use(queueRouter.allowedMethods());
router.get('/initData',async (ctx)=>{
  const res = await accountService.initData()
  ctx.body = res
})
router.get('/accountRoles',async (ctx)=>{
  const res = await accountService.getAccountRoles()
  ctx.body = res
})
router.get('/',async (ctx) => {
  // 使用 MWSService 获取用户信息
  // const authorizationRes = await MWSService.getAuthorizationMWS();
  // await MWSService.getAccessTokenMWS()
  logger().info({
    event:'远程调用'
  })
  ctx.body = {
    message: `✅ Hello , welcome to the API!`,
  };
});
router.get('/response',async(ctx)=>{
  logger().info({
    event:'远程调用'
  })
  ctx.body={};
})
router.get('/error',async(ctx)=>{
  throw new Error('test error')
})


router.post("/notification",async(ctx)=>{
    const body=ctx.request.body as any;
   const decrypted = AESSimple.decryptBase64(body?.encryptedParam$);
   logger().info({event:"解密",message:`decrypted是${decrypted}`})
   ctx.body={}
});

router.get('/policy',async(ctx)=>{
  const casbinService = await CasbinService.getInstance()
  const res = await casbinService.getPolicy()
  ctx.body = res
})

router.get('/test/i18n',async(ctx)=>{
   const isAuthorized = false;
   if (!isAuthorized) {
     const error = new Error("error.unauthorized");
     error["status"] = 401;
     throw error;
   }
  ctx.body = "success";
})
export default router;
