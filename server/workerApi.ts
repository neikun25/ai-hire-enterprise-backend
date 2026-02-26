import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import {
  tasks,
  enterprises,
  orders,
  individuals,
  users,
} from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const workerApiRouter = router({
  // 任务大厅（所有人可见，保持 publicProcedure）
  getMarketTasks: publicProcedure
    .input(
      z.object({
        type: z.string().optional(),
        keyword: z.string().optional(),
        page: z.number().optional().default(1),
        pageSize: z.number().optional().default(10),
      }),
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "数据库连接失败",
        });

      const allTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          type: tasks.type,
          subType: tasks.subType,
          description: tasks.description,
          budget: tasks.budget,
          deadline: tasks.deadline,
          enterpriseName: enterprises.companyName,
          status: tasks.status,
        })
        .from(tasks)
        .leftJoin(enterprises, eq(tasks.enterpriseId, enterprises.id))
        .where(eq(tasks.status, "approved"))
        .orderBy(desc(tasks.createdAt));

      let filteredTasks = allTasks;
      if (input.type && input.type !== "all")
        filteredTasks = filteredTasks.filter(
          (task) => task.type === input.type,
        );
      if (input.keyword)
        filteredTasks = filteredTasks.filter(
          (task) =>
            task.title.includes(input.keyword!) ||
            (task.description && task.description.includes(input.keyword!)),
        );

      const start = (input.page - 1) * input.pageSize;
      return {
        success: true,
        data: {
          list: filteredTasks.slice(start, start + input.pageSize),
          hasMore: start + input.pageSize < filteredTasks.length,
        },
      };
    }),

  // 我的任务（必须登录，且只查自己的单子）
  getMyTasks: protectedProcedure
    .input(
      z.object({
        status: z.enum(["in_progress", "submitted", "completed"]),
        page: z.number().optional().default(1),
        pageSize: z.number().optional().default(10),
      }),
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // 【数据隔离】：通过 ctx.user.id 找到属于当前登录人的个人档案
      const indResult = await db
        .select()
        .from(individuals)
        .where(eq(individuals.userId, ctx.user.id))
        .limit(1);

      if (indResult.length === 0) {
        return { success: true, data: { list: [], hasMore: false } };
      }

      const allOrders = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          type: tasks.type,
          status: orders.status,
          budget: tasks.budget,
          deadline: tasks.deadline,
          enterpriseName: enterprises.companyName,
          submittedResult: orders.submitContent,
        })
        .from(orders)
        .innerJoin(tasks, eq(orders.taskId, tasks.id))
        .leftJoin(enterprises, eq(tasks.enterpriseId, enterprises.id))
        // 【数据隔离】：只查当前个人档案下的订单
        .where(eq(orders.individualId, indResult[0].id))
        .orderBy(desc(orders.createdAt));

      const filteredTasks = allOrders.filter(
        (task) => task.status === input.status,
      );
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

    const indResult = await db
      .select()
      .from(individuals)
      .where(eq(individuals.userId, ctx.user.id))
      .limit(1);

    if (indResult.length === 0)
      return {
        success: true,
        data: {
          name: "未知",
          skills: [],
          creditScore: 5.0,
          completedTasks: 0,
          earnings: 0,
        },
      };

    return {
      success: true,
      data: {
        name: ctx.user.name || "接单达人",
        skills: indResult[0].skills
          ? JSON.parse(indResult[0].skills as string)
          : ["数据分析"],
        creditScore: Number(indResult[0].creditScore),
        completedTasks: indResult[0].completedTasks,
        earnings: 0,
      },
    };
  }),

  acceptTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const indResult = await db
        .select()
        .from(individuals)
        .where(eq(individuals.userId, ctx.user.id))
        .limit(1);

      if (indResult.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "档案未建立" });
      }

      const insertResult = await db.insert(orders).values({
        taskId: input.taskId,
        individualId: indResult[0].id, // 绑定到自己
        status: "in_progress",
      } as any);

      await db
        .update(tasks)
        .set({ status: "in_progress" } as any)
        .where(eq(tasks.id, input.taskId));

      return {
        success: true,
        data: {
          orderId: (insertResult[0] as any).insertId,
          message: "接单成功",
        },
      };
    }),

  submitResult: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        result: z.string(),
        attachments: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(orders)
        .set({
          submitContent: input.result,
          submitAttachments:
            input.attachments && input.attachments.length > 0
              ? JSON.stringify(input.attachments)
              : null,
          status: "submitted",
          submitTime: new Date(),
        } as any)
        .where(eq(orders.taskId, input.taskId));

      await db
        .update(tasks)
        .set({ status: "submitted" } as any)
        .where(eq(tasks.id, input.taskId));
      return { success: true, data: { message: "提交成功" } };
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
          companyName: enterprises.companyName,
        })
        .from(tasks)
        .leftJoin(enterprises, eq(tasks.enterpriseId, enterprises.id))
        .where(eq(tasks.id, input.taskId));

      if (!taskResult || taskResult.length === 0)
        throw new TRPCError({ code: "NOT_FOUND", message: "任务不存在" });

      const orderResult = await db
        .select({
          result: orders.submitContent,
          attachments: orders.submitAttachments,
          reviewComment: orders.reviewComment,
        })
        .from(orders)
        .where(eq(orders.taskId, input.taskId))
        .limit(1);

      return {
        success: true,
        data: {
          ...taskResult[0],
          result: orderResult.length > 0 ? orderResult[0].result : null,
          reviewComment:
            orderResult.length > 0 ? orderResult[0].reviewComment : null,
          attachments:
            orderResult.length > 0 && orderResult[0].attachments
              ? JSON.parse(orderResult[0].attachments as string)
              : [],
        },
      };
    }),
});
