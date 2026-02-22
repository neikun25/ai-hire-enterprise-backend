import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createWorkerContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "worker-test",
    email: "worker@example.com",
    name: "Test Worker",
    phone: "13800138000",
    avatarUrl: "https://example.com/avatar.png",
    loginMethod: "manus",
    role: "individual",
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

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    // 【关键修复】这里使用 null as any 绕过 undefined 报错
    user: null as any,
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

describe("workerApi.getMarketTasks", () => {
  it("returns list of tasks even in public mode (no auth)", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx as any); 

    const result = await caller.workerApi.getMarketTasks({});
    expect(result).toBeDefined();
    
    // 兼容返回 {list: []} 或者直接返回 [] 的情况
    const isArray = Array.isArray(result) || (result && Array.isArray((result as any).list));
    expect(isArray).toBe(true);
  });
});

describe("workerApi.getMyTasks", () => {
  it("fails if not authenticated", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx as any);

    await expect(caller.workerApi.getMyTasks({ status: 'in_progress' })).rejects.toThrow();
  });

  it("succeeds if authenticated", async () => {
    const { ctx } = createWorkerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.workerApi.getMyTasks({ status: 'in_progress' });
    expect(result).toBeDefined();
    
    // 兼容返回 {list: []} 或者直接返回 [] 的情况
    const isArray = Array.isArray(result) || (result && Array.isArray((result as any).list));
    expect(isArray).toBe(true);
  });
});