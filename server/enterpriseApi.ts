import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

// ========== 演示模式：所有API改为publicProcedure，无需认证 ==========
// 固定返回李四（企业方）的模拟数据

export const enterpriseApiRouter = router({
  // 获取统计数据
  getStats: publicProcedure.query(async () => {
    // 演示模式：返回李四的固定数据
    return {
      success: true,
      data: {
        pendingReview: 0,
        inProgress: 1,
        completed: 1,
        balance: 5000.00,
        frozenAmount: 500.00,
      }
    };
  }),
  
  // 获取最近任务
  getRecentTasks: publicProcedure
    .input(z.object({
      limit: z.number().optional().default(5),
    }))
    .query(async ({ input }) => {
      // 演示模式：返回李四的固定任务列表
      const allTasks = [
        {
          id: 1,
          title: "市场调研报告撰写",
          type: "analysis",
          status: "in_progress",
          budget: "500.00",
          deadline: new Date("2026-02-20"),
          workerName: "张三"
        },
        {
          id: 2,
          title: "产品宣传视频制作",
          type: "video",
          status: "pending",
          budget: "1200.00",
          deadline: new Date("2026-02-25"),
          workerName: null
        },
        {
          id: 3,
          title: "数据标注任务",
          type: "labeling",
          status: "completed",
          budget: "300.00",
          deadline: new Date("2026-02-15"),
          workerName: "张三"
        }
      ];
      
      return {
        success: true,
        data: allTasks.slice(0, input.limit)
      };
    }),
  
  // 创建任务
  createTask: publicProcedure
    .input(z.object({
      type: z.string(),
      subType: z.string(),
      title: z.string(),
      description: z.string(),
      requirements: z.string().optional(),
      budget: z.number(),
      deadline: z.string(),
      isVideoTask: z.boolean().optional(),
      basePrice: z.number().optional(),
      pricePerThousandViews: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // 演示模式：模拟创建任务成功
      console.log('[演示模式] 创建任务:', input);
      
      return {
        success: true,
        data: { 
          taskId: Math.floor(Math.random() * 10000) + 100,
          message: '演示模式：任务创建成功（数据不会保存）'
        }
      };
    }),
  
  // 获取任务列表（带分页）
  getTasks: publicProcedure
    .input(z.object({
      status: z.string().nullable().optional(),
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      // 演示模式：返回李四的固定任务列表
      const allTasks = [
        {
          id: 1,
          title: "市场调研报告撰写",
          type: "analysis",
          status: "in_progress",
          budget: "500.00",
          deadline: new Date("2026-02-20"),
          workerName: "张三"
        },
        {
          id: 2,
          title: "产品宣传视频制作",
          type: "video",
          status: "pending",
          budget: "1200.00",
          deadline: new Date("2026-02-25"),
          workerName: null
        },
        {
          id: 3,
          title: "数据标注任务",
          type: "labeling",
          status: "completed",
          budget: "300.00",
          deadline: new Date("2026-02-15"),
          workerName: "张三"
        }
      ];
      
      // 根据status筛选
      let filteredTasks = allTasks;
      if (input.status) {
        filteredTasks = allTasks.filter(task => task.status === input.status);
      }
      
      // 分页
      const start = (input.page - 1) * input.pageSize;
      const end = start + input.pageSize;
      const paginatedTasks = filteredTasks.slice(start, end);
      
      return {
        success: true,
        data: {
          list: paginatedTasks,
          hasMore: end < filteredTasks.length
        }
      };
    }),
  
  // 获取个人资料
  getProfile: publicProcedure.query(async () => {
    // 演示模式：返回李四的固定数据
    return {
      success: true,
      data: {
        balance: 5000.00,
        totalTasks: 3,
        completedTasks: 1,
        creditScore: 4.8,
      }
    };
  }),
});
