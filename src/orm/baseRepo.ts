import { ObjectLiteral, Repository, FindOptionsWhere, FindManyOptions, UpdateResult, DeleteResult, DeepPartial } from "typeorm";
import {
  DefaultPGDataSource,
} from "../util/orm";
import { CustomError } from "../util/error";

export interface PaginationOptions {
  page: number;
  pageSize: number;
  where?: FindOptionsWhere<any>;
  order?: Record<string, 'ASC' | 'DESC'>;
  relations?: string[];
}

export interface PaginationResult<T> {
  list: T[];
  pagination: {
    total: number;
    totalPage: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class BaseRepo<T extends ObjectLiteral> {
  protected repository: Repository<T>;

  constructor(entity: new () => T) {
    this.repository = DefaultPGDataSource.getRepository<T>(entity);
  }

  // 原生查询
  async query(query: string, parameters?: any[]): Promise<any> {
    try {
      return await this.repository.query(query, parameters);
    } catch (error) {
      throw new CustomError(`Query failed: ${error.message}`);
    }
  }

  // 创建
  async create(data: DeepPartial<T>): Promise<T> {
    try {
      const entity = this.repository.create(data);
      return await this.repository.save(entity);
    } catch (error) {
      throw new CustomError(`Create failed: ${error.message}`);
    }
  }

  // 批量创建
  async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    try {
      const entities = this.repository.create(data);
      return await this.repository.save(entities);
    } catch (error) {
      throw new CustomError(`Batch create failed: ${error.message}`);
    }
  }

  // 查找
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    try {
      return await this.repository.find(options);
    } catch (error) {
      throw new CustomError(`Find failed: ${error.message}`);
    }
  }

  // 根据条件查找单个
  async findOneBy(condition: FindOptionsWhere<T>): Promise<T | null> {
    try {
      return await this.repository.findOneBy(condition);
    } catch (error) {
      throw new CustomError(`FindOneBy failed: ${error.message}`);
    }
  }

  // 查找单个
  async findOne(options?: FindManyOptions<T>): Promise<T | null> {
    try {
      return await this.repository.findOne(options);
    } catch (error) {
      throw new CustomError(`FindOne failed: ${error.message}`);
    }
  }

  // 根据条件查找多个
  async findBy(condition: FindOptionsWhere<T>): Promise<T[]> {
    try {
      return await this.repository.findBy(condition);
    } catch (error) {
      throw new CustomError(`FindBy failed: ${error.message}`);
    }
  }

  // 查找所有
  async findAll(): Promise<T[]> {
    try {
      return await this.repository.find();
    } catch (error) {
      throw new CustomError(`FindAll failed: ${error.message}`);
    }
  }

  // 查找并计数
  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    try {
      return await this.repository.findAndCount(options);
    } catch (error) {
      throw new CustomError(`FindAndCount failed: ${error.message}`);
    }
  }

  // 更新
  async update(id: number | string, data: Partial<T>): Promise<UpdateResult> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      throw new CustomError(`Update failed: ${error.message}`);
    }
  }

  // 删除
  async delete(id: number | string): Promise<DeleteResult> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      throw new CustomError(`Delete failed: ${error.message}`);
    }
  }

  // 软删除
  async softDelete(id: number | string): Promise<UpdateResult> {
    try {
      return await this.repository.softDelete(id);
    } catch (error) {
      throw new CustomError(`SoftDelete failed: ${error.message}`);
    }
  }

  // 计数
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    try {
      const whereCondition: FindOptionsWhere<T> = { 
        deletedAt: null as any, 
        ...where 
      };
      return await this.repository.count({ where: whereCondition });
    } catch (error) {
      throw new CustomError(`Count failed: ${error.message}`);
    }
  }

  // 分页查询
  async paginate(options: PaginationOptions): Promise<PaginationResult<T>> {
    try {
      const page = Math.max(1, options.page || 1);
      const pageSize = Math.max(1, Math.min(100, options.pageSize || 10)); // 限制最大100
      const skip = (page - 1) * pageSize;
      
      const [list, total] = await this.repository.findAndCount({
        where: { deletedAt: null as any, ...options.where },
        skip,
        take: pageSize,
        order: options.order || { id: "DESC" } as any,
        relations: options.relations,
      });

      const totalPage = Math.ceil(total / pageSize);
      
      return {
        list,
        pagination: {
          total,
          totalPage,
          page,
          pageSize,
          hasNext: page < totalPage,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new CustomError(`Paginate failed: ${error.message}`);
    }
  }

  // 恢复软删除
  async restore(id: number | string): Promise<UpdateResult> {
    try {
      return await this.repository.restore(id);
    } catch (error) {
      throw new CustomError(`Restore failed: ${error.message}`);
    }
  }

  // 清空表
  async clear(): Promise<void> {
    try {
      await this.repository.clear();
    } catch (error) {
      throw new CustomError(`Clear failed: ${error.message}`);
    }
  }

  // 查询包含软删除的记录
  async findWithDeleted(id: number | string): Promise<T> {
    try {
      const result = await this.repository.findOne({
        where: { id: id as any },
        withDeleted: true,
      });
      
      if (!result) {
        throw new CustomError("Record not found");
      }
      
      return result;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(`FindWithDeleted failed: ${error.message}`);
    }
  }

  // 检查记录是否存在
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    try {
      const count = await this.repository.count({ where });
      return count > 0;
    } catch (error) {
      throw new CustomError(`Exists check failed: ${error.message}`);
    }
  }

  // 获取Repository实例（用于复杂查询）
  getRepository(): Repository<T> {
    return this.repository;
  }
}
