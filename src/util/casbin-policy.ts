/**
 * Casbin 权限策略配置
 * 集中管理所有权限规则，便于维护和扩展
 */

export interface PolicyRule {
  sub: string;      // 主体 (角色)
  obj: string;      // 对象 (资源路径)
  act: string;      // 动作 (HTTP方法)
  domain: string;   // 域
  region: string;   // 区域
  level: string;    // 等级
  eft: "allow" | "deny";
}

export interface RoleAssignment {
  user: string;     // 用户ID
  role: string;     // 角色
  domain: string;   // 域
}

// 预定义的权限策略
export const POLICY_RULES: PolicyRule[] = [
  // 访客权限
  { sub: "guest", obj: "/api/public/*", act: "GET", domain: "*", region: "*", level: "10", eft: "allow" },
  { sub: "guest", obj: "/api/room", act: "GET", domain: "hotelA", region: "CN", level: "10", eft: "allow" },
  
  // 员工权限
  { sub: "staff", obj: "/api/room", act: "GET", domain: "hotelA", region: "CN", level: "20", eft: "allow" },
  { sub: "staff", obj: "/api/room/checkin", act: "POST", domain: "hotelA", region: "CN", level: "20", eft: "allow" },
  { sub: "staff", obj: "/api/room/checkout", act: "POST", domain: "hotelA", region: "CN", level: "20", eft: "allow" },
  { sub: "staff", obj: "/api/booking", act: "GET", domain: "hotelA", region: "CN", level: "20", eft: "allow" },
  
  // 主管权限
  { sub: "supervisor", obj: "/api/report", act: "GET", domain: "hotelA", region: "CN", level: "30", eft: "allow" },
  { sub: "supervisor", obj: "/api/analytics", act: "GET", domain: "hotelA", region: "CN", level: "30", eft: "allow" },
  { sub: "supervisor", obj: "/api/staff", act: "GET", domain: "hotelA", region: "CN", level: "30", eft: "allow" },
  
  // 管理员权限 (继承所有员工和主管权限)
  { sub: "admin", obj: "*", act: "*", domain: "hotelA", region: "*", level: "50", eft: "allow" },
  
  // 超级管理员权限 (全局权限)
  { sub: "super_admin", obj: "*", act: "*", domain: "*", region: "*", level: "*", eft: "allow" },
  
  // 拒绝规则示例
  { sub: "guest", obj: "/api/admin/*", act: "*", domain: "*", region: "*", level: "*", eft: "deny" },
  { sub: "staff", obj: "/api/admin/*", act: "*", domain: "*", region: "*", level: "*", eft: "deny" },
];

// 预定义的角色分配
export const ROLE_ASSIGNMENTS: RoleAssignment[] = [
  { user: "u1001", role: "guest", domain: "hotelA" },
  { user: "u1002", role: "staff", domain: "hotelA" },
  { user: "u1003", role: "supervisor", domain: "hotelA" },
  { user: "u1009", role: "admin", domain: "hotelA" },
  { user: "root", role: "super_admin", domain: "*" },
];

// 权限等级定义
export const PERMISSION_LEVELS = {
  GUEST: "10",
  STAFF: "20", 
  SUPERVISOR: "30",
  ADMIN: "50",
  SUPER_ADMIN: "*"
} as const;

// 业务域定义
export const DOMAINS = {
  HOTEL_A: "hotelA",
  HOTEL_B: "hotelB", 
  GLOBAL: "*"
} as const;

// 区域定义
export const REGIONS = {
  CHINA: "CN",
  US: "US",
  GLOBAL: "*"
} as const;

// 常用HTTP方法
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST", 
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  ALL: "*"
} as const; 