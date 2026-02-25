import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { enterpriseApiRouter } from "./enterpriseApi";
import { workerApiRouter } from "./workerApi";
import * as db from "./db";
import { code2Session, generateToken } from "./wechat";

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
          let isNewUser = false;
          let user = await db.getUserByOpenId(input.openId);
          if (!user) isNewUser = true;

          await db.upsertUser({
            openId: input.openId,
            role: input.role,
            name: input.name,
            avatarUrl:
              input.avatarUrl ||
              "https://api.dicebear.com/7.x/avataaars/svg?seed=Default",
            loginMethod: "dev",
            lastSignedIn: new Date(),
          });

          user = await db.getUserByOpenId(input.openId);
          if (!user) throw new Error("用户创建失败");

          const token = generateToken({
            userId: user.id,
            openId: user.openId,
            role: user.role || "none",
          });

          return {
            success: true,
            data: {
              token,
              user: {
                id: user.id,
                openId: user.openId,
                name: user.name,
                avatarUrl: user.avatarUrl,
                role: isNewUser ? null : user.role,
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

    // 设置角色（接收前端传来的公司名，支持双重身份共存）
    setRole: publicProcedure
      .input(
        z.object({
          role: z.enum(["individual", "enterprise"]),
          userId: z.number().optional(),
          companyName: z.string().optional(), // 允许前端传公司名
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id || input.userId;
        if (!userId) throw new Error("未找到用户，请重新登录");

        // 更新当前激活的身份
        await db.updateUserRole(userId, input.role);

        // 智能建档：同一个 userId 可以同时拥有个人表和企业表的数据！
        if (input.role === "individual") {
          const exist = await db.getIndividualByUserId(userId);
          if (!exist)
            await db.createIndividual({
              userId: userId,
              skills: JSON.stringify(["数据分析", "文案撰写"]),
              creditScore: "5.0",
              completedTasks: 0,
            } as any);
        } else if (input.role === "enterprise") {
          const exist = await db.getEnterpriseByUserId(userId);
          if (!exist)
            await db.createEnterprise({
              userId: userId,
              companyName: input.companyName || "我的企业",
              creditScore: "5.0",
              balance: "10000.00",
            } as any);
        }
        return { success: true, data: { role: input.role } };
      }),

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
      .mutation(async ({ input, ctx }) => {
        try {
          const wxHeader = ctx.req?.headers["x-wx-openid"];
          let realOpenId = Array.isArray(wxHeader) ? wxHeader[0] : wxHeader;

          if (!realOpenId) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            try {
              const wechatRes = await code2Session(input.code);
              if (wechatRes && wechatRes.openid) realOpenId = wechatRes.openid;
            } catch (e) {
              console.warn("获取真实OpenID失败", e);
            }
          }

          if (!realOpenId) realOpenId = `wx_${input.code}`;

          let user = await db.getUserByOpenId(realOpenId);

          if (!user) {
            await db.upsertUser({
              openId: realOpenId,
              name: input.userInfo?.nickName || "微信用户",
              avatarUrl:
                input.userInfo?.avatarUrl ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Wechat",
              loginMethod: "wechat",
              lastSignedIn: new Date(),
            });
            user = await db.getUserByOpenId(realOpenId);
          } else {
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

          const token = generateToken({
            userId: user.id,
            openId: user.openId,
            role: user.role || "none",
          });

          return {
            success: true,
            data: {
              token,
              user: {
                id: user.id,
                openId: user.openId,
                name: user.name,
                avatarUrl: user.avatarUrl,
                // 【核心秘诀】：无论老用户还是新用户，发给前端时一律设为 null
                // 这样前端登录后必定向角色选择页跳转，让你自由切换身份！
                role: null,
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
