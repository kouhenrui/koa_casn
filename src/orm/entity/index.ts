import { 
  Column, 
  CreateDateColumn, 
  DeleteDateColumn, 
  Entity, 
  JoinTable, 
  ManyToMany, 
  PrimaryGeneratedColumn, 
  UpdateDateColumn,
  Index,
  Unique
} from "typeorm";

@Entity("account")
@Index(["name"], { unique: true })
export class Account {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column({ 
    type: "varchar", 
    length: 100, 
    comment: "账户名称",
    nullable: false 
  })
  name: string;

  @ManyToMany(() => Role, (role) => role.accounts, {
    cascade: true,
    eager: false
  })
  @JoinTable({
    name: "account_role",
    joinColumn: {
      name: "account_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "role_id",
      referencedColumnName: "id",
    },
  })
  roles?: Role[];

  @CreateDateColumn({ 
    type: "timestamp", 
    comment: "创建时间" 
  })
  createdAt: Date;

  @UpdateDateColumn({ 
    type: "timestamp", 
    comment: "更新时间" 
  })
  updatedAt: Date;

  @DeleteDateColumn({ 
    type: "timestamp", 
    comment: "删除时间" 
  })
  deletedAt?: Date;
}

@Entity("role")
@Index(["name", "domain"], { unique: true })
@Index(["level"])
@Index(["status"])
export class Role {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column({ 
    type: "varchar",
    length: 50,
    comment: "角色名称",
    nullable: false 
  })
  name: string;

  @Column({ 
    type: "text",
    comment: "角色描述",
    nullable: true 
  })
  description: string;

  @Column({ 
    type: "varchar",
    length: 10,
    comment: "角色等级,如10,20,30,40,50",
    default: "10" 
  })
  level: string;

  @Column({ 
    type: "varchar",
    length: 50,
    comment: "角色域,如hotelA,hotelB",
    nullable: true 
  })
  domain: string;

  @Column({ 
    type: "varchar",
    length: 10,
    comment: "角色区域,如CN,US",
    nullable: true 
  })
  region: string;

  @Column({ 
    type: "int",
    comment: "角色状态,如0:禁用,1:启用",
    default: 1 
  })
  status: number;

  @ManyToMany(() => Account, (account) => account.roles, {
    cascade: false,
    eager: false
  })
  accounts?: Account[];

  @CreateDateColumn({ 
    type: "timestamp", 
    comment: "创建时间" 
  })
  createdAt: Date;

  @UpdateDateColumn({ 
    type: "timestamp", 
    comment: "更新时间" 
  })
  updatedAt: Date;

  @DeleteDateColumn({ 
    type: "timestamp", 
    comment: "删除时间" 
  })
  deletedAt?: Date;
}

@Entity("resource")
@Index(["path", "method", "domain"], { unique: true })
@Index(["level"])
@Index(["region"])
export class Resource {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column({ 
    type: "varchar",
    length: 255,
    comment: "资源路径,如/api/booking,如果是query请求转为/api/booking/*",
    nullable: false 
  })
  path: string;

  @Column({ 
    type: "varchar",
    length: 10,
    comment: "资源方法,如GET,POST,PUT,DELETE,PATCH",
    nullable: false 
  })
  method: string;

  @Column({ 
    type: "varchar",
    length: 50,
    comment: "资源域,如hotelA,hotelB",
    nullable: false 
  })
  domain: string;

  @Column({ 
    type: "varchar",
    length: 10,
    comment: "资源区域,如CN,US",
    nullable: false 
  })
  region: string;

  @Column({ 
    type: "varchar",
    length: 10,
    comment: "资源等级,如10,20,30,40,50",
    nullable: false 
  })
  level: string;

  @CreateDateColumn({ 
    type: "timestamp", 
    comment: "创建时间" 
  })
  createdAt: Date;

  @UpdateDateColumn({ 
    type: "timestamp", 
    comment: "更新时间" 
  })
  updatedAt: Date;

  @DeleteDateColumn({ 
    type: "timestamp", 
    comment: "删除时间" 
  })
  deletedAt?: Date;
}

export const entityList = [Account, Role, Resource];
