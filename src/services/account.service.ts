import { AccountListPaginationDto } from "../dto/account.dto";
import { AccountRepo, RoleRepo } from "../orm/repotity";
import bcrypt from 'bcrypt';
import { CustomError } from "../util/error";
import jwt from 'jsonwebtoken';
import { generateToken } from "../util/crypto";

class AccountService {
  private accountRepo: AccountRepo;
  private roleRepo: RoleRepo;
  constructor() {
    this.accountRepo = new AccountRepo();
    this.roleRepo = new RoleRepo();
  }
  async getAccountList(body: AccountListPaginationDto) {
    return await this.accountRepo.paginate(body);
  }

  // 初始化角色和账户数据
  async initData() {
    return await this.accountRepo.paginate({ page: 1, pageSize: 500 });
  }

  async getAccountRoles(){
    const account = await this.accountRepo.find({
      relations: ['roles']
    });
    return account;
  }
  async getToken(body:any):Promise<{token:string,etime:number}>{
    try {
      const {account,password} = body;
      const accountEntity = await this.accountRepo.findOne({
        where:{
          name:account,
        }
      })
      if(!accountEntity){
        throw new CustomError('账号不存在',400);
      }
        const isPasswordValid = await bcrypt.compare(
          password,
          accountEntity.pwd
        );
        if (!isPasswordValid) {
          throw new CustomError("密码错误", 400);
        }
      const roles = accountEntity.roles;
      const roleNames = roles.map((role:any)=>role.name);
      const tokenPayload={
        id:accountEntity.id,
        roles:roleNames
      }
      const token = await generateToken(tokenPayload)
      //更新access_token和其他数据
      return token;
    } catch (error:any) {
      throw new CustomError(error.message,400);
    }
  }

}

export const accountService = new AccountService();