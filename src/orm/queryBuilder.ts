import { Repository, SelectQueryBuilder, FindOptionsWhere, Like, In, Between, MoreThan, LessThan, MoreThanOrEqual, LessThanOrEqual } from "typeorm";

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'like' | 'in' | 'between' | 'gt' | 'lt' | 'gte' | 'lte';
  value: any;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: Record<string, 'ASC' | 'DESC'>;
  relations?: string[];
  select?: string[];
  skip?: number;
  take?: number;
}

export class QueryBuilder<T> {
  private queryBuilder: SelectQueryBuilder<T>;

  constructor(repository: Repository<T>, alias: string = 'entity') {
    this.queryBuilder = repository.createQueryBuilder(alias);
  }

  // 添加过滤条件
  addFilters(filters: QueryFilter[]): this {
    filters.forEach((filter, index) => {
      const paramName = `${filter.field}_${index}`;
      
      switch (filter.operator) {
        case 'eq':
          this.queryBuilder.andWhere(`${filter.field} = :${paramName}`, { [paramName]: filter.value });
          break;
        case 'ne':
          this.queryBuilder.andWhere(`${filter.field} != :${paramName}`, { [paramName]: filter.value });
          break;
        case 'like':
          this.queryBuilder.andWhere(`${filter.field} LIKE :${paramName}`, { [paramName]: `%${filter.value}%` });
          break;
        case 'in':
          this.queryBuilder.andWhere(`${filter.field} IN (:...${paramName})`, { [paramName]: filter.value });
          break;
        case 'between':
          if (Array.isArray(filter.value) && filter.value.length === 2) {
            this.queryBuilder.andWhere(`${filter.field} BETWEEN :${paramName}_start AND :${paramName}_end`, {
              [`${paramName}_start`]: filter.value[0],
              [`${paramName}_end`]: filter.value[1]
            });
          }
          break;
        case 'gt':
          this.queryBuilder.andWhere(`${filter.field} > :${paramName}`, { [paramName]: filter.value });
          break;
        case 'lt':
          this.queryBuilder.andWhere(`${filter.field} < :${paramName}`, { [paramName]: filter.value });
          break;
        case 'gte':
          this.queryBuilder.andWhere(`${filter.field} >= :${paramName}`, { [paramName]: filter.value });
          break;
        case 'lte':
          this.queryBuilder.andWhere(`${filter.field} <= :${paramName}`, { [paramName]: filter.value });
          break;
      }
    });
    return this;
  }

  // 添加排序
  addOrderBy(orderBy: Record<string, 'ASC' | 'DESC'>): this {
    Object.entries(orderBy).forEach(([field, direction]) => {
      this.queryBuilder.addOrderBy(field, direction);
    });
    return this;
  }

  // 添加关联
  addRelations(relations: string[]): this {
    relations.forEach(relation => {
      this.queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
    });
    return this;
  }

  // 添加选择字段
  addSelect(select: string[]): this {
    select.forEach(field => {
      this.queryBuilder.addSelect(`entity.${field}`);
    });
    return this;
  }

  // 添加分页
  addPagination(skip: number, take: number): this {
    this.queryBuilder.skip(skip).take(take);
    return this;
  }

  // 构建查询
  build(options: QueryOptions): this {
    if (options.filters) {
      this.addFilters(options.filters);
    }
    if (options.orderBy) {
      this.addOrderBy(options.orderBy);
    }
    if (options.relations) {
      this.addRelations(options.relations);
    }
    if (options.select) {
      this.addSelect(options.select);
    }
    if (options.skip !== undefined && options.take !== undefined) {
      this.addPagination(options.skip, options.take);
    }
    return this;
  }

  // 执行查询
  async getMany(): Promise<T[]> {
    return await this.queryBuilder.getMany();
  }

  // 执行查询并计数
  async getManyAndCount(): Promise<[T[], number]> {
    return await this.queryBuilder.getManyAndCount();
  }

  // 获取单个结果
  async getOne(): Promise<T | null> {
    return await this.queryBuilder.getOne();
  }

  // 获取原始查询构建器
  getQueryBuilder(): SelectQueryBuilder<T> {
    return this.queryBuilder;
  }
}

// 工具函数：构建TypeORM的FindOptionsWhere
export function buildWhereCondition<T>(filters: QueryFilter[]): FindOptionsWhere<T> {
  const where: any = {};
  
  filters.forEach(filter => {
    switch (filter.operator) {
      case 'eq':
        where[filter.field] = filter.value;
        break;
      case 'ne':
        where[filter.field] = filter.value;
        break;
      case 'like':
        where[filter.field] = Like(`%${filter.value}%`);
        break;
      case 'in':
        where[filter.field] = In(filter.value);
        break;
      case 'between':
        if (Array.isArray(filter.value) && filter.value.length === 2) {
          where[filter.field] = Between(filter.value[0], filter.value[1]);
        }
        break;
      case 'gt':
        where[filter.field] = MoreThan(filter.value);
        break;
      case 'lt':
        where[filter.field] = LessThan(filter.value);
        break;
      case 'gte':
        where[filter.field] = MoreThanOrEqual(filter.value);
        break;
      case 'lte':
        where[filter.field] = LessThanOrEqual(filter.value);
        break;
    }
  });
  
  return where;
} 