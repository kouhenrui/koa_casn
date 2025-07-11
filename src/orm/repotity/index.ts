import { BaseRepo } from "../baseRepo";
import { Account, Resource, Role } from "../entity";
export class AccountRepo extends BaseRepo<Account> {
  constructor() {
    super(Account);
  }
}

export class RoleRepo extends BaseRepo<Role> {
  constructor() {
    super(Role);
  }
}

export class ResourceRepo extends BaseRepo<Resource> {
  constructor() {
    super(Resource);
  }
}
// 导出单例实例（可选）
export const accountRepo = new AccountRepo();
export const roleRepo = new RoleRepo();
export const resourceRepo = new ResourceRepo();