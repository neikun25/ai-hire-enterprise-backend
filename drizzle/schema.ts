import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * 用户表 - 支持企业和个人两种角色
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: varchar("avatarUrl", { length: 500 }), // 微信头像URL
  loginMethod: varchar("loginMethod", { length: 64 }),
  // 角色: enterprise(企业) / individual(个人)
  role: mysqlEnum("role", ["enterprise", "individual", "admin"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * 企业信息表
 */
export const enterprises = mysqlTable("enterprises", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 255 }),
  license: varchar("license", { length: 255 }), // 营业执照号
  contact: varchar("contact", { length: 100 }), // 联系人
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00").notNull(), // 账户余额
  creditScore: decimal("creditScore", { precision: 3, scale: 1 }).default("5.0").notNull(), // 信誉评分
  totalTasks: int("totalTasks").default(0).notNull(), // 发布任务总数
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 个人信息表
 */
export const individuals = mysqlTable("individuals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  realName: varchar("realName", { length: 100 }),
  skills: text("skills"), // JSON格式存储技能标签数组
  experience: text("experience"), // 工作经历
  portfolio: text("portfolio"), // 作品集(JSON格式存储作品链接数组)
  creditScore: decimal("creditScore", { precision: 3, scale: 1 }).default("5.0").notNull(), // 信誉评分
  completedTasks: int("completedTasks").default(0).notNull(), // 完成任务数
  successRate: decimal("successRate", { precision: 5, scale: 2 }).default("100.00").notNull(), // 成功率
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 任务表
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  enterpriseId: int("enterpriseId").notNull(), // 发布企业ID
  // 任务类型: report(分析报告) / video(短视频制作) / labeling(数据标注)
  type: mysqlEnum("type", ["report", "video", "labeling"]).notNull(),
  // 子类型(根据type不同而不同)
  subType: varchar("subType", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"), // 详细要求
  attachments: text("attachments"), // JSON格式存储附件URL数组
  budget: decimal("budget", { precision: 10, scale: 2 }).notNull(), // 预算金额
  // 视频号任务特殊字段
  isVideoTask: int("isVideoTask").default(0).notNull(), // 是否为视频号任务
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }), // 基础价格
  pricePerThousandViews: decimal("pricePerThousandViews", { precision: 10, scale: 2 }), // 每千次阅读加价
  deadline: timestamp("deadline").notNull(), // 截止时间
  // 状态: pending(待审核) / approved(已审核-进行中) / in_progress(已接单) / submitted(待验收) / completed(已完成) / rejected(已拒绝) / cancelled(已取消)
  status: mysqlEnum("status", ["pending", "approved", "in_progress", "submitted", "completed", "rejected", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 订单表 - 任务与接单者的关联
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  individualId: int("individualId").notNull(), // 接单者ID
  // 状态: in_progress(进行中) / submitted(已提交待验收) / completed(已完成) / rejected(被拒绝需修改)
  status: mysqlEnum("status", ["in_progress", "submitted", "completed", "rejected"]).default("in_progress").notNull(),
  submitContent: text("submitContent"), // 提交内容/说明
  submitAttachments: text("submitAttachments"), // 提交附件(JSON格式)
  submitTime: timestamp("submitTime"), // 提交时间
  reviewComment: text("reviewComment"), // 验收意见
  reviewTime: timestamp("reviewTime"), // 验收时间
  actualAmount: decimal("actualAmount", { precision: 10, scale: 2 }), // 实际结算金额(视频号任务根据阅读量计算)
  viewCount: int("viewCount"), // 视频阅读量(仅视频号任务)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 评价表 - 双向评价
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  reviewerId: int("reviewerId").notNull(), // 评价人用户ID
  revieweeId: int("revieweeId").notNull(), // 被评价人用户ID
  // 评价类型: enterprise_to_individual(企业评价个人) / individual_to_enterprise(个人评价企业)
  reviewType: mysqlEnum("reviewType", ["enterprise_to_individual", "individual_to_enterprise"]).notNull(),
  rating: int("rating").notNull(), // 星级评分(1-5)
  comment: text("comment"), // 评价内容
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * 交易记录表
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // 类型: recharge(充值) / freeze(冻结) / unfreeze(解冻) / pay(支付) / income(收入) / withdraw(提现)
  type: mysqlEnum("type", ["recharge", "freeze", "unfreeze", "pay", "income", "withdraw"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(), // 交易后余额
  relatedId: int("relatedId"), // 关联ID(任务ID或订单ID)
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Enterprise = typeof enterprises.$inferSelect;
export type InsertEnterprise = typeof enterprises.$inferInsert;
export type Individual = typeof individuals.$inferSelect;
export type InsertIndividual = typeof individuals.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
