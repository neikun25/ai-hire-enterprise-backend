import { eq, desc, and, or, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  enterprises,
  InsertEnterprise,
  Enterprise,
  individuals,
  InsertIndividual,
  Individual,
  tasks,
  InsertTask,
  Task,
  orders,
  InsertOrder,
  Order,
  reviews,
  InsertReview,
  Review,
  transactions,
  InsertTransaction,
  Transaction,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: any): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const values: Record<string, any> = {
      openId: user.openId,
      lastSignedIn: user.lastSignedIn || new Date(),
    };

    // 【核心修复】：如果不传 role 就不要强行写 null，让 MySQL 自己去用默认值，避免崩溃
    if (user.role) {
      values.role = user.role;
    }

    const textFields = [
      "name",
      "email",
      "loginMethod",
      "phone",
      "avatarUrl",
    ] as const;
    textFields.forEach((field) => {
      if (user[field] !== undefined && user[field] !== null)
        values[field] = user[field];
    });

    if (user.openId === ENV.ownerOpenId) values.role = "admin";

    await db
      .insert(users)
      .values(values as any)
      .onDuplicateKeyUpdate({ set: values });
  } catch (error) {
    throw error;
  }
}

export async function updateUserRole(
  userId: number,
  role: "individual" | "enterprise" | "admin",
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== Enterprise Functions =====
export async function createEnterprise(data: InsertEnterprise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(enterprises).values(data as any);
}
export async function getEnterpriseByUserId(
  userId: number,
): Promise<Enterprise | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(enterprises)
    .where(eq(enterprises.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}
export async function updateEnterpriseBalance(userId: number, amount: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(enterprises)
    .set({ balance: sql`balance + ${amount}` } as any)
    .where(eq(enterprises.userId, userId));
}
export async function updateEnterprise(
  userId: number,
  data: Partial<InsertEnterprise>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(enterprises).set(data).where(eq(enterprises.userId, userId));
}

// ===== Individual Functions =====
export async function createIndividual(data: InsertIndividual) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(individuals).values(data as any);
}
export async function getIndividualByUserId(
  userId: number,
): Promise<Individual | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(individuals)
    .where(eq(individuals.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}
export async function updateIndividual(
  userId: number,
  data: Partial<InsertIndividual>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(individuals).set(data).where(eq(individuals.userId, userId));
}

// ===== Task Functions =====
export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(tasks).values(data as any);
}
export async function getTaskById(id: number): Promise<Task | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
export async function getTasksByEnterpriseId(
  enterpriseId: number,
  status?: string,
) {
  const db = await getDb();
  if (!db) return [];
  let query = db
    .select()
    .from(tasks)
    .where(eq(tasks.enterpriseId, enterpriseId));
  if (status)
    query = db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.enterpriseId, enterpriseId),
          eq(tasks.status, status as any),
        ),
      );
  return await query.orderBy(desc(tasks.createdAt));
}
export async function getAvailableTasks(filters?: {
  type?: string;
  minBudget?: number;
  maxBudget?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(tasks.status, "approved")];
  if (filters?.type) conditions.push(eq(tasks.type, filters.type as any));
  if (filters?.minBudget)
    conditions.push(gte(tasks.budget, filters.minBudget.toString()));
  if (filters?.maxBudget)
    conditions.push(lte(tasks.budget, filters.maxBudget.toString()));
  return await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));
}
export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

// ===== Order Functions =====
export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(orders).values(data as any);
}
export async function getOrderById(id: number): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}
export async function getOrdersByTaskId(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.taskId, taskId));
}
export async function getOrdersByIndividualId(
  individualId: number,
  status?: string,
) {
  const db = await getDb();
  if (!db) return [];
  let query = db
    .select()
    .from(orders)
    .where(eq(orders.individualId, individualId));
  if (status)
    query = db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.individualId, individualId),
          eq(orders.status, status as any),
        ),
      );
  return await query.orderBy(desc(orders.createdAt));
}
export async function updateOrder(id: number, data: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set(data).where(eq(orders.id, id));
}

// ===== Review Functions =====
export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(reviews).values(data as any);
}
export async function getReviewsByRevieweeId(revieweeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(reviews)
    .where(eq(reviews.revieweeId, revieweeId))
    .orderBy(desc(reviews.createdAt));
}
export async function getReviewByOrderId(
  orderId: number,
  reviewType: string,
): Promise<Review | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(reviews)
    .where(
      and(
        eq(reviews.orderId, orderId),
        eq(reviews.reviewType, reviewType as any),
      ),
    )
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== Transaction Functions =====
export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(transactions).values(data as any);
}
export async function getTransactionsByUserId(
  userId: number,
  limit: number = 50,
) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

// ===== Statistics Functions =====
export async function getEnterpriseStats(enterpriseId: number) {
  const db = await getDb();
  if (!db) return null;
  const allTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.enterpriseId, enterpriseId));
  const enterprise = await getEnterpriseByUserId(enterpriseId);
  return {
    totalTasks: allTasks.length,
    inProgressTasks: allTasks.filter((t) => t.status === "in_progress").length,
    completedTasks: allTasks.filter((t) => t.status === "completed").length,
    balance: enterprise?.balance ? parseFloat(enterprise.balance) : 0,
  };
}
export async function getIndividualStats(individualId: number) {
  const db = await getDb();
  if (!db) return null;
  const allOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.individualId, individualId));
  const completedOrders = allOrders.filter((o) => o.status === "completed");
  const individual = await getIndividualByUserId(individualId);
  return {
    completedTasks: completedOrders.length,
    successRate:
      allOrders.length > 0
        ? Math.round((completedOrders.length / allOrders.length) * 100)
        : 0,
    creditScore: individual?.creditScore
      ? parseFloat(individual.creditScore)
      : 0,
  };
}

// ===== Search and Pagination Functions =====
export async function searchTasks(params: {
  keyword?: string;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const db = await getDb();
  if (!db) return { list: [], total: 0, hasMore: false };
  const { keyword, type, status, page = 1, pageSize = 10 } = params;
  const offset = (page - 1) * pageSize;
  const conditions = [];
  if (status) conditions.push(eq(tasks.status, status as any));
  else conditions.push(eq(tasks.status, "approved"));
  if (type) conditions.push(eq(tasks.type, type as any));
  if (keyword)
    conditions.push(
      or(
        sql`${tasks.title} LIKE ${`%${keyword}%`}`,
        sql`${tasks.description} LIKE ${`%${keyword}%`}`,
      )!,
    );
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(whereClause);
  const list = await db
    .select()
    .from(tasks)
    .where(whereClause)
    .orderBy(desc(tasks.createdAt))
    .limit(pageSize + 1)
    .offset(offset);
  const hasMore = list.length > pageSize;
  if (hasMore) list.pop();
  return { list, total: countResult[0]?.count || 0, hasMore, page, pageSize };
}
export async function getTasksWithOrders(params: {
  enterpriseId: number;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const db = await getDb();
  if (!db) return { list: [], total: 0, hasMore: false };
  const { enterpriseId, status, page = 1, pageSize = 10 } = params;
  const offset = (page - 1) * pageSize;
  const conditions = [eq(tasks.enterpriseId, enterpriseId)];
  if (status && status !== "all")
    conditions.push(eq(tasks.status, status as any));
  const whereClause = and(...conditions);
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(whereClause);
  const list = await db
    .select()
    .from(tasks)
    .where(whereClause)
    .orderBy(desc(tasks.createdAt))
    .limit(pageSize + 1)
    .offset(offset);
  const hasMore = list.length > pageSize;
  if (hasMore) list.pop();
  return { list, total: countResult[0]?.count || 0, hasMore, page, pageSize };
}
export async function getMyTasksWithDetails(params: {
  individualId: number;
  status: string;
  page?: number;
  pageSize?: number;
}) {
  const db = await getDb();
  if (!db) return { list: [], total: 0, hasMore: false };
  const { individualId, status, page = 1, pageSize = 10 } = params;
  const offset = (page - 1) * pageSize;
  const orderStatus =
    status === "in_progress"
      ? "in_progress"
      : status === "submitted"
        ? "submitted"
        : status === "completed"
          ? "completed"
          : status;
  const conditions = [
    eq(orders.individualId, individualId),
    eq(orders.status, orderStatus as any),
  ];
  const whereClause = and(...conditions);
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(whereClause);
  const orderList = await db
    .select()
    .from(orders)
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize + 1)
    .offset(offset);
  const hasMore = orderList.length > pageSize;
  if (hasMore) orderList.pop();
  const taskIds = orderList.map((o) => o.taskId);
  const taskList =
    taskIds.length > 0
      ? await db
          .select()
          .from(tasks)
          .where(
            sql`${tasks.id} IN (${sql.join(
              taskIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          )
      : [];
  const list = orderList.map((order) => {
    const task = taskList.find((t) => t.id === order.taskId);
    return {
      ...task,
      orderId: order.id,
      orderStatus: order.status,
      submitContent: order.submitContent,
      submitAttachments: order.submitAttachments,
      reviewComment: order.reviewComment,
      actualAmount: order.actualAmount,
    };
  });
  return { list, total: countResult[0]?.count || 0, hasMore, page, pageSize };
}
