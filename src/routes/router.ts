import Router from "koa-router";
import { accountService } from "../services/account.service";
import  MWSService  from "../meituan/api";
import { casbinMiddleware } from "../middleware/casbin.middleware";
import { logger } from "../util/log";
import AESSimple from "../meituan/aesCrypto";
const router = new Router();

router.get("/users", async (ctx) => {
  ctx.body = {
    message: `✅ Hello ${ctx.state.user.name}, you can read users.`,
  };
});

router.post('/test/casbin',casbinMiddleware,async(ctx)=>{

  ctx.body = "res"
})
router.get('/initData',async (ctx)=>{
  const res = await accountService.initData()
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
export default router;
