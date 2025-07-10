import { AccountListPaginationDto } from "../dto/account.dto";
import { AccountRepo, RoleRepo } from "../orm/repotity";


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
    return await this.accountRepo.paginate({ page: 3, pageSize: 500 });
  }
}

export const accountService = new AccountService();