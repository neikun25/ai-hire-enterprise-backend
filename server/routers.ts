import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { enterpriseApiRouter } from "./enterpriseApi";
import { workerApiRouter } from "./workerApi";
import * as db from "./db";

// ==========================================
// 生产模式：使用数据库持久化用户数据
// ==========================================

export const appRouter = router({
  auth: router({
    // 开发模式登录
    devLogin: publicProcedure
      .input(z.object({
        openId: z.string(),
        role: z.enum(['individual', 'enterprise']).optional(),
        name: z.string(),
        avatarUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        console.log('[Auth] 开发模式登录:', input);
        
        try {
          await db.upsertUser({
            openId: input.openId,
            role: input.role || 'individual',
            name: input.name,
            avatarUrl: input.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Default',
            loginMethod: 'dev',
            lastSignedIn: new Date(),
          });
          
          const user = await db.getUserByOpenId(input.openId);
          if (!user) throw new Error('用户创建失败');
          
          const token = `mock_token_${user.openId}_${Date.now()}`;
          console.log('[Auth] 开发模式登录成功:', user);
          
          return {
            success: true,
            data: {
              token,
              user: {
                id: user.id,
                openId: user.openId,
                name: user.name,
                avatarUrl: user.avatarUrl,
                // 关键点：返回 null 强制前端触发进入 role-selection 页面
                role: null, 
              },
            },
          };
        } catch (error) {
          console.error('[Auth] 开发模式登录失败:', error);
          return {
            success: false,
            message: '登录失败: ' + (error as Error).message,
          };
        }
      }),

    // 设置角色 (补充的 API)
    setRole: protectedProcedure
      .input(z.object({
        role: z.enum(['individual', 'enterprise'])
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new Error("未授权");
        await db.updateUserRole(ctx.user.id, input.role);
        return {
          success: true,
          data: { role: input.role }
        };
      }),
    
    // 微信登录（支持头像和昵称）
    wechatLogin: publicProcedure
      .input(z.object({
        code: z.string(),
        userInfo: z.object({
          nickName: z.string().optional(),
          avatarUrl: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        console.log('[Auth] 微信登录:', input);
        
        try {
          const mockOpenId = `wx_${input.code}`;
          let user = await db.getUserByOpenId(mockOpenId);
          
          if (!user) {
            await db.upsertUser({
              openId: mockOpenId,
              role: 'individual',
              name: input.userInfo?.nickName || '微信用户',
              avatarUrl: input.userInfo?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wechat',
              loginMethod: 'wechat',
              lastSignedIn: new Date(),
            });
            user = await db.getUserByOpenId(mockOpenId);
            console.log('[Auth] 创建新用户:', user);
          } else {
            await db.upsertUser({
              openId: mockOpenId,
              name: input.userInfo?.nickName || user.name || undefined,
              avatarUrl: input.userInfo?.avatarUrl || user.avatarUrl || undefined,
              lastSignedIn: new Date(),
            });
            user = await db.getUserByOpenId(mockOpenId);
            console.log('[Auth] 更新用户信息:', user);
          }
          
          if (!user) throw new Error('用户创建失败');
          
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
          console.error('[Auth] 微信登录失败:', error);
          return {
            success: false,
            message: '登录失败: ' + (error as Error).message,
          };
        }
      }),
    
    me: publicProcedure.query(() => {
      return null;
    }),
    
    logout: publicProcedure.mutation(() => {
      return { success: true };
    }),
  }),
  
  enterpriseApi: enterpriseApiRouter,
  workerApi: workerApiRouter,
});

export type AppRouter = typeof appRouter;