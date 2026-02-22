import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createEnterpriseContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-enterprise",
    email: "enterprise@test.com",
    name: "Test Enterprise",
    phone: "13800138000",
    avatarUrl: "https://example.com/avatar.png",
    loginMethod: "manus",
    role: "enterprise",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("Enterprise API", () => {
  it("should set user role to enterprise", async () => {
    const { ctx } = createEnterpriseContext();
    ctx.user!.role = "individual";
    
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.setRole({ role: "enterprise" });

    expect(result.success).toBe(true);
  });

  it("should get enterprise info after creation", async () => {
    const { ctx } = createEnterpriseContext();
    const caller = appRouter.createCaller(ctx);

    const existing = await db.getEnterpriseByUserId(ctx.user!.id);
    if (!existing) {
      await db.createEnterprise({ userId: ctx.user!.id } as any);
    }

    const stats = await caller.enterpriseApi.getStats();
    expect(stats).toBeDefined();
  });

  it("should create a task successfully", async () => {
    const { ctx } = createEnterpriseContext();
    const caller = appRouter.createCaller(ctx);

    let enterprise = await db.getEnterpriseByUserId(ctx.user!.id);
    if (!enterprise) {
      await db.createEnterprise({ userId: ctx.user!.id } as any);
      enterprise = await db.getEnterpriseByUserId(ctx.user!.id);
    }

    if (parseFloat(enterprise!.balance || "0") < 1000) {
      await db.updateEnterpriseBalance(ctx.user!.id, "1000");
    }

    const result = await caller.enterpriseApi.createTask({
      type: "report",
      subType: "industry_research",
      title: "测试任务",
      description: "这是一个测试任务描述",
      budget: 500,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      requirements: JSON.stringify({}),
    });

    expect(result.success).toBe(true);
  });

  it("should list tasks for enterprise", async () => {
    const { ctx } = createEnterpriseContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.enterpriseApi.getRecentTasks({});
    
    // 【关键修复】因为 getRecentTasks 直接返回数组，所以直接判断 result 是否为数组即可
    expect(Array.isArray(result)).toBe(true);
  });
});