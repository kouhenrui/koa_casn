import Router from "koa-router";
import { accountService } from "../services/account.service";
import  MWSService  from "../meituan/api";
import { casbinMiddleware } from "../middleware/casbin.middleware";
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
  ctx.body = {
    message: `✅ Hello ${ctx.state.user.name}, welcome to the API!`,
  };
});
router.get('/error',async(ctx)=>{
  throw new Error('test error')
})
export default router;
