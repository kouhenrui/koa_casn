import { DataSource, QueryRunner, EntityTarget, Repository } from "typeorm";
import { DefaultPGDataSource } from "../util/orm";
import { CustomError } from "../util/error";

export class TransactionManager {
  private dataSource: DataSource;
  private queryRunner?: QueryRunner;

  constructor() {
    this.dataSource = DefaultPGDataSource;
  }

  // 开始事务
  async beginTransaction(): Promise<void> {
    try {
      this.queryRunner = this.dataSource.createQueryRunner();
      await this.queryRunner.connect();
      await this.queryRunner.startTransaction();
    } catch (error) {
      throw new CustomError(`Failed to begin transaction: ${error.message}`);
    }
  }

  // 提交事务
  async commitTransaction(): Promise<void> {
    if (!this.queryRunner) {
      throw new CustomError("No active transaction");
    }

    try {
      await this.queryRunner.commitTransaction();
    } catch (error) {
      throw new CustomError(`Failed to commit transaction: ${error.message}`);
    } finally {
      await this.queryRunner.release();
      this.queryRunner = undefined;
    }
  }

  // 回滚事务
  async rollbackTransaction(): Promise<void> {
    if (!this.queryRunner) {
      throw new CustomError("No active transaction");
    }

    try {
      await this.queryRunner.rollbackTransaction();
    } catch (error) {
      throw new CustomError(`Failed to rollback transaction: ${error.message}`);
    } finally {
      await this.queryRunner.release();
      this.queryRunner = undefined;
    }
  }

  // 获取事务中的Repository
  getRepository<T>(entity: EntityTarget<T>): Repository<T> {
    if (!this.queryRunner) {
      throw new CustomError("No active transaction");
    }
    return this.queryRunner.manager.getRepository(entity);
  }

  // 执行事务
  async executeInTransaction<T>(
    operation: (manager: TransactionManager) => Promise<T>
  ): Promise<T> {
    await this.beginTransaction();
    
    try {
      const result = await operation(this);
      await this.commitTransaction();
      return result;
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }

  // 检查是否有活动的事务
  hasActiveTransaction(): boolean {
    return !!this.queryRunner;
  }

  // 获取查询运行器
  getQueryRunner(): QueryRunner | undefined {
    return this.queryRunner;
  }
}

// 事务装饰器
// export function Transaction() {
//   return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
//     const method = descriptor.value;

//     descriptor.value = async function (...args: any[]) {
//       const transactionManager = new TransactionManager();
      
//       return await transactionManager.executeInTransaction(async (manager) => {
//         // 将事务管理器注入到方法中
//         return await method.apply(this, [...args, manager]);
//       });
//     };
//   };
// }

// 使用示例：
/*
class UserService {
  @Transaction()
  async createUserWithProfile(userData: any, profileData: any, transactionManager?: TransactionManager) {
    const userRepo = transactionManager?.getRepository(User) || getRepository(User);
    const profileRepo = transactionManager?.getRepository(Profile) || getRepository(Profile);
    
    const user = await userRepo.save(userData);
    const profile = await profileRepo.save({ ...profileData, userId: user.id });
    
    return { user, profile };
  }
}
*/ 