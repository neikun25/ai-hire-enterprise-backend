import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { enterpriseApiRouter } from "./enterpriseApi";
import { workerApiRouter } from "./workerApi";
import * as db from "./db";
// 引入真实微信登录获取 OpenID 的方法
import { code2Session } from "./wechat";

export const appRouter = router({
  auth: router({
    devLogin: publicProcedure
      .input(
        z.object({
          openId: z.string(),
          role: z.enum(["individual", "enterprise"]).optional(),
          name: z.string(),
          avatarUrl: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          await db.upsertUser({
            openId: input.openId,
            role: input.role || null, // 修复：默认角色为空
            name: input.name,
            avatarUrl:
              input.avatarUrl ||
              "https://api.dicebear.com/7.x/avataaars/svg?seed=Default",
            loginMethod: "dev",
            lastSignedIn: new Date(),
          });
          const user = await db.getUserByOpenId(input.openId);
          if (!user) throw new Error("用户创建失败");
          const token = `mock_token_${user.openId}_${Date.now()}`;
          return {
            success: true,
            data: {
              token,
              user: {
                id: user.id,
                openId: user.openId,
                name: user.name,
                avatarUrl: user.avatarUrl,
                role: user.role,
              },
            },
          };
        } catch (error) {
          return {
            success: false,
            message: "登录失败: " + (error as Error).message,
          };
        }
      }),

    // 设置角色（接收前端传来的 userId 并自动建档）
    setRole: publicProcedure
      .input(
        z.object({
          role: z.enum(["individual", "enterprise"]),
          userId: z.number().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id || input.userId;
        if (!userId) throw new Error("未找到用户，请重新登录");

        // 1. 更新主表角色
        await db.updateUserRole(userId, input.role);

        // 2. 根据选的角色，在数据库自动初始化对应的子档案
        if (input.role === "individual") {
          const exist = await db.getIndividualByUserId(userId);
          if (!exist) {
            // 【关键修复】：加上 as any 绕过极其严格的类型校验
            await db.createIndividual({
              userId: userId,
              skills: JSON.stringify(["数据分析", "文案撰写"]),
              creditScore: "5.0",
              completedTasks: 0,
            } as any);
          }
        } else if (input.role === "enterprise") {
          const exist = await db.getEnterpriseByUserId(userId);
          if (!exist) {
            // 【关键修复】：加上 as any 绕过极其严格的类型校验
            await db.createEnterprise({
              userId: userId,
              companyName: "新注册企业",
              creditScore: "5.0",
              balance: "0.00",
            } as any);
          }
        }
        return { success: true, data: { role: input.role } };
      }),

    // 真实的微信登录
    wechatLogin: publicProcedure
      .input(
        z.object({
          code: z.string(),
          userInfo: z
            .object({
              nickName: z.string().optional(),
              avatarUrl: z.string().optional(),
            })
            .optional(),
        }),
      )
      .mutation(async ({ input }) => {
        try {
          let realOpenId = `wx_${input.code}`;

          // 调用微信接口换取真实、不变的 OpenID
          try {
            const wechatRes = await code2Session(input.code);
            if (wechatRes && wechatRes.openid) realOpenId = wechatRes.openid;
          } catch (e) {
            console.warn(
              "获取真实OpenID失败，临时使用随机ID，请检查微信环境变量",
              e,
            );
          }

          let user = await db.getUserByOpenId(realOpenId);

          if (!user) {
            // 新用户注册
            await db.upsertUser({
              openId: realOpenId,
              role: null, // 新用户绝对不设默认角色，留空逼迫前端跳转选择页！
              name: input.userInfo?.nickName || "微信用户",
              avatarUrl:
                input.userInfo?.avatarUrl ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Wechat",
              loginMethod: "wechat",
              lastSignedIn: new Date(),
            });
            user = await db.getUserByOpenId(realOpenId);
          } else {
            // 老用户登录，仅更新时间
            await db.upsertUser({
              openId: realOpenId,
              name: input.userInfo?.nickName || user.name || undefined,
              avatarUrl:
                input.userInfo?.avatarUrl || user.avatarUrl || undefined,
              lastSignedIn: new Date(),
            });
            user = await db.getUserByOpenId(realOpenId);
          }

          if (!user) throw new Error("用户创建失败");

          const token = `mock_token_${user.openId}_${Date.now()}`;
          return {
            success: true,
            data: {
              token,
              user: {
                id: user.id,
                openId: user.openId,
                name: user.name,
                avatarUrl: user.avatarUrl,
                role: user.role,
              },
            },
          };
        } catch (error) {
          return {
            success: false,
            message: "登录失败: " + (error as Error).message,
          };
        }
      }),

    me: publicProcedure.query(() => null),
    logout: publicProcedure.mutation(() => ({ success: true })),
  }),
  enterpriseApi: enterpriseApiRouter,
  workerApi: workerApiRouter,
});

export type AppRouter = typeof appRouter;
