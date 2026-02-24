import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { tasks, enterprises, orders } from "../drizzle/schema"; // 引入真实的表
import { eq } from "drizzle-orm"; // 引入查询条件

// ========== 演示模式：部分API返回模拟数据 ==========

export const workerApiRouter = router({
  // 获取任务大厅列表
  getMarketTasks: publicProcedure
    .input(z.object({
      type: z.string().optional(),
      keyword: z.string().optional(),
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      // 演示模式：返回固定的任务大厅列表
      const allTasks = [
        {
          id: 2,
          title: "产品宣传视频制作",
          type: "video",
          subType: "product_video",
          description: "需要制作一个3分钟的产品宣传视频",
          budget: "1200.00",
          deadline: new Date("2026-02-25"),
          enterpriseName: "李四科技有限公司",
          status: "approved"
        },
        {
          id: 4,
          title: "用户调研报告",
          type: "analysis",
          subType: "market_research",
          description: "针对目标用户群体进行调研分析",
          budget: "800.00",
          deadline: new Date("2026-02-28"),
          enterpriseName: "王五科技",
          status: "approved"
        },
        {
          id: 5,
          title: "图片数据标注",
          type: "labeling",
          subType: "image_labeling",
          description: "对1000张图片进行分类标注",
          budget: "400.00",
          deadline: new Date("2026-03-05"),
          enterpriseName: "赵六AI",
          status: "approved"
        }
      ];
      
      // 根据type筛选
      let filteredTasks = allTasks;
      if (input.type && input.type !== 'all') {
        filteredTasks = allTasks.filter(task => task.type === input.type);
      }
      
      // 根据keyword搜索
      if (input.keyword) {
        filteredTasks = filteredTasks.filter(task => 
          task.title.includes(input.keyword!) || 
          task.description.includes(input.keyword!)
        );
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
  
  // 获取我的任务列表
  getMyTasks: publicProcedure
    .input(z.object({
      status: z.enum(['in_progress', 'submitted', 'completed']),
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      // 演示模式：返回张三的固定任务列表
      const allTasks = [
        {
          id: 1,
          title: "市场调研报告撰写",
          type: "analysis",
          status: "in_progress",
          budget: "500.00",
          deadline: new Date("2026-02-20"),
          enterpriseName: "李四科技有限公司",
          acceptedAt: new Date("2026-02-10"),
          submittedResult: null,
          rating: null,
          comment: null
        },
        {
          id: 3,
          title: "数据标注任务",
          type: "labeling",
          status: "completed",
          budget: "300.00",
          deadline: new Date("2026-02-15"),
          enterpriseName: "李四科技有限公司",
          acceptedAt: new Date("2026-02-05"),
          submittedResult: "已完成1000条数据标注",
          rating: 5,
          comment: "完成质量很高，非常满意"
        }
      ];
      
      // 根据status筛选
      const filteredTasks = allTasks.filter(task => task.status === input.status);
      
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
    // 演示模式：返回张三的固定数据
    return {
      success: true,
      data: {
        name: "张三",
        skills: ["数据分析", "报告撰写", "数据标注"],
        portfolio: "https://example.com/portfolio",
        creditScore: 4.9,
        completedTasks: 15,
        earnings: 8500.00,
        qualityScore: 4.8,
        patienceScore: 4.9,
        effectScore: 4.9,
      }
    };
  }),
  
  // 接受任务
  acceptTask: publicProcedure
    .input(z.object({
      taskId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // 演示模式：模拟接受任务成功
      console.log('[演示模式] 接受任务:', input.taskId);
      
      return {
        success: true,
        data: {
          orderId: Math.floor(Math.random() * 10000) + 100,
          message: '演示模式：接单成功（数据不会保存）'
        }
      };
    }),
  
  // 提交任务成果
  submitTask: publicProcedure
    .input(z.object({
      orderId: z.number(),
      result: z.string(),
    }))
    .mutation(async ({ input }) => {
      // 演示模式：模拟提交成功
      console.log('[演示模式] 提交任务成果:', input);
      
      return {
        success: true,
        data: {
          message: '演示模式：提交成功（数据不会保存）'
        }
      };
    }),

  // ==========================================
  // 获取任务详情（真实数据库查询）
  // ==========================================
  getTaskDetail: publicProcedure
    .input(z.object({
      taskId: z.number(),
    }))
    .query(async ({ input }) => {
      // 1. 获取数据库实例
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库连接失败" });
      }

      // 2. 联表查询：从 tasks 表查任务，并关联 enterprises 表查企业名称
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

      if (!taskResult || taskResult.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "任务不存在" });
      }

      const task = taskResult[0];

      // 3. 去 orders(订单) 表查一下有没有人提交了成果
      const orderResult = await db
        .select({
          result: orders.submitContent
        })
        .from(orders)
        .where(eq(orders.taskId, input.taskId))
        .limit(1);

      return {
        success: true,
        data: {
          ...task,
          result: orderResult.length > 0 ? orderResult[0].result : null
        }
      };
    }),
});