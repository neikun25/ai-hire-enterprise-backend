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

        await db.updateUserRole(userId, input.role);

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
              companyName: "新注册企业",
              creditScore: "5.0",
              balance: "0.00",
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
      // 【注意这里】：解构出 ctx 上下文，用来读取请求头
      .mutation(async ({ input, ctx }) => {
        try {
          // 1. 微信云托管专属绝招：直接从网关注入的 header 拿真实的 openid！
          const wxHeader = ctx.req?.headers["x-wx-openid"];
          let realOpenId = Array.isArray(wxHeader) ? wxHeader[0] : wxHeader;

          // 2. 如果本地调试没经过网关，用兜底请求去换取
          if (!realOpenId) {
            // 强行关闭 Node.js 的严格证书校验，避免自签名证书报错
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            try {
              const wechatRes = await code2Session(input.code);
              if (wechatRes && wechatRes.openid) realOpenId = wechatRes.openid;
            } catch (e) {
              console.warn("获取真实OpenID失败", e);
            }
          }

          // 3. 如果环境变量全都没配，最后再用随机码（一般不会走到这了）
          if (!realOpenId) {
            realOpenId = `wx_${input.code}`;
          }

          let isNewUser = false;
          let user = await db.getUserByOpenId(realOpenId);

          if (!user) {
            isNewUser = true;
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

    me: publicProcedure.query(() => null),
    logout: publicProcedure.mutation(() => ({ success: true })),
  }),
  enterpriseApi: enterpriseApiRouter,
  workerApi: workerApiRouter,
});

export type AppRouter = typeof appRouter;
