import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import {
  tasks,
  orders,
  enterprises,
  individuals,
  users,
} from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const enterpriseApiRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // 【数据隔离】：通过 ctx.user.id 找到属于自己的企业档案
    const entResult = await db
      .select()
      .from(enterprises)
      .where(eq(enterprises.userId, ctx.user.id))
      .limit(1);

    if (entResult.length === 0)
      return {
        success: true,
        data: { pendingReview: 0, inProgress: 0, completed: 0, balance: 0 },
      };

    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.enterpriseId, entResult[0].id));

    return {
      success: true,
      data: {
        pendingReview: allTasks.filter((t) => t.status === "submitted").length,
        inProgress: allTasks.filter((t) => t.status === "in_progress").length,
        completed: allTasks.filter((t) => t.status === "completed").length,
        balance: Number(entResult[0].balance) || 0,
        frozenAmount: 0,
        name: entResult[0].companyName, // 返回企业名给前端
      },
    };
  }),

  getRecentTasks: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(5) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const entResult = await db
        .select()
        .from(enterprises)
        .where(eq(enterprises.userId, ctx.user.id))
        .limit(1);

      if (entResult.length === 0) return { success: true, data: [] };

      const allTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          type: tasks.type,
          status: tasks.status,
          budget: tasks.budget,
          deadline: tasks.deadline,
          workerName: users.name,
        })
        .from(tasks)
        .leftJoin(orders, eq(tasks.id, orders.taskId))
        .leftJoin(users, eq(orders.individualId, users.id))
        .where(eq(tasks.enterpriseId, entResult[0].id)) // 【数据隔离】：只查自己的任务
        .orderBy(desc(tasks.createdAt))
        .limit(input.limit);

      return { success: true, data: allTasks };
    }),

  createTask: protectedProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const entResult = await db
        .select()
        .from(enterprises)
        .where(eq(enterprises.userId, ctx.user.id))
        .limit(1);

      if (entResult.length === 0)
        throw new TRPCError({ code: "FORBIDDEN", message: "未找到企业信息" });

      const insertResult = await db.insert(tasks).values({
        enterpriseId: entResult[0].id, // 绑定给自己
        type: input.type,
        subType: input.subType,
        title: input.title,
        description: input.description,
        requirements: input.requirements || "",
        budget: String(input.budget),
        deadline: new Date(input.deadline),
        status: "approved",
      } as any);

      return {
        success: true,
        data: {
          taskId: (insertResult[0] as any).insertId,
          message: "发布成功",
        },
      };
    }),

  getTasks: protectedProcedure
    .input(
      z.object({
        status: z.string().nullable().optional(),
        page: z.number().optional().default(1),
        pageSize: z.number().optional().default(10),
      }),
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const entResult = await db
        .select()
        .from(enterprises)
        .where(eq(enterprises.userId, ctx.user.id))
        .limit(1);

      if (entResult.length === 0)
        return { success: true, data: { list: [], hasMore: false } };

      const allTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          type: tasks.type,
          status: tasks.status,
          budget: tasks.budget,
          deadline: tasks.deadline,
          workerName: users.name,
        })
        .from(tasks)
        .leftJoin(orders, eq(tasks.id, orders.taskId))
        .leftJoin(users, eq(orders.individualId, users.id))
        .where(eq(tasks.enterpriseId, entResult[0].id)) // 【数据隔离】
        .orderBy(desc(tasks.createdAt));

      let filteredTasks = allTasks;
      if (input.status)
        filteredTasks = allTasks.filter((task) => task.status === input.status);

      const start = (input.page - 1) * input.pageSize;
      return {
        success: true,
        data: {
          list: filteredTasks.slice(start, start + input.pageSize),
          hasMore: start + input.pageSize < filteredTasks.length,
        },
      };
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const entResult = await db
      .select()
      .from(enterprises)
      .where(eq(enterprises.userId, ctx.user.id))
      .limit(1);

    if (entResult.length === 0)
      return {
        success: true,
        data: {
          balance: 0,
          totalTasks: 0,
          completedTasks: 0,
          creditScore: 5.0,
        },
      };

    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.enterpriseId, entResult[0].id));

    return {
      success: true,
      data: {
        balance: Number(entResult[0].balance),
        totalTasks: allTasks.length,
        completedTasks: allTasks.filter((t) => t.status === "completed").length,
        creditScore: Number(entResult[0].creditScore),
        name: entResult[0].companyName, // 前端用于展示名称
      },
    };
  }),

  // 验收通过
  approveTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(orders)
        .set({ status: "completed", reviewTime: new Date() } as any)
        .where(eq(orders.taskId, input.taskId));
      await db
        .update(tasks)
        .set({ status: "completed" } as any)
        .where(eq(tasks.id, input.taskId));
      return { success: true, data: { message: "验收通过" } };
    }),

  // 验收驳回
  rejectTask: protectedProcedure
    .input(z.object({ taskId: z.number(), comment: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(orders)
        .set({
          status: "in_progress",
          reviewComment: input.comment,
          reviewTime: new Date(),
        } as any)
        .where(eq(orders.taskId, input.taskId));
      await db
        .update(tasks)
        .set({ status: "in_progress" } as any)
        .where(eq(tasks.id, input.taskId));
      return { success: true, data: { message: "已驳回" } };
    }),

  getTaskDetail: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const taskResult = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          type: tasks.type,
          status: tasks.status,
          budget: tasks.budget,
          deadline: tasks.deadline,
          description: tasks.description,
          requirements: tasks.requirements,
        })
        .from(tasks)
        .where(eq(tasks.id, input.taskId));
      if (!taskResult || taskResult.length === 0)
        throw new TRPCError({ code: "NOT_FOUND", message: "任务不存在" });

      const orderResult = await db
        .select({
          acceptedBy: users.name,
          result: orders.submitContent,
          attachments: orders.submitAttachments,
        })
        .from(orders)
        .leftJoin(individuals, eq(orders.individualId, individuals.id))
        .leftJoin(users, eq(individuals.userId, users.id))
        .where(eq(orders.taskId, input.taskId))
        .limit(1);

      return {
        success: true,
        data: {
          ...taskResult[0],
          acceptedBy: orderResult.length > 0 ? orderResult[0].acceptedBy : null,
          result: orderResult.length > 0 ? orderResult[0].result : null,
          attachments:
            orderResult.length > 0 && orderResult[0].attachments
              ? JSON.parse(orderResult[0].attachments as string)
              : [],
        },
      };
    }),
});
