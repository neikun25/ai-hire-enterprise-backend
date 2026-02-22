import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';

// 模拟企业用户上下文
const mockEnterpriseContext: Context = {
  user: {
    id: 1,
    openId: 'wx_openid_001',
    role: 'enterprise',
    name: '张三企业',
    email: null,
    phone: null,
    loginMethod: 'wechat',
    lastSignedIn: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

// 模拟个人用户上下文
const mockWorkerContext: Context = {
  user: {
    id: 2,
    openId: 'wx_openid_002',
    role: 'individual',
    name: '李四个人',
    email: null,
    phone: null,
    loginMethod: 'wechat',
    lastSignedIn: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

describe('Enterprise API', () => {
  const caller = appRouter.createCaller(mockEnterpriseContext);
  
  it('should get enterprise stats', async () => {
    const result = await caller.enterpriseApi.getStats();
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('totalTasks');
    expect(result.data).toHaveProperty('balance');
  });
  
  it('should get recent tasks', async () => {
    const result = await caller.enterpriseApi.getRecentTasks({ limit: 5 });
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });
  
  it('should get tasks with pagination', async () => {
    const result = await caller.enterpriseApi.getTasks({ 
      status: 'all',
      page: 1,
      pageSize: 10 
    });
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('list');
    expect(result.data).toHaveProperty('hasMore');
  });
  
  it('should get enterprise profile', async () => {
    const result = await caller.enterpriseApi.getProfile();
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('balance');
    expect(result.data).toHaveProperty('totalTasks');
    expect(result.data).toHaveProperty('creditScore');
  });
});

describe('Worker API', () => {
  const caller = appRouter.createCaller(mockWorkerContext);
  
  it('should get market tasks', async () => {
    const result = await caller.workerApi.getMarketTasks({ 
      type: 'all',
      page: 1,
      pageSize: 10 
    });
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('list');
    expect(result.data).toHaveProperty('hasMore');
  });
  
  it('should get my tasks', async () => {
    const result = await caller.workerApi.getMyTasks({ 
      status: 'in_progress',
      page: 1,
      pageSize: 10 
    });
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('list');
  });
  
  it('should get worker profile', async () => {
    const result = await caller.workerApi.getProfile();
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('completedTasks');
    expect(result.data).toHaveProperty('successRate');
    expect(result.data).toHaveProperty('creditScore');
    expect(result.data).toHaveProperty('skills');
  });
});

describe('Database Helper Functions', () => {
  it('should have all required db functions', async () => {
    const db = await import('./db');
    
    // 企业相关函数
    expect(typeof db.getEnterpriseStats).toBe('function');
    expect(typeof db.getEnterpriseByUserId).toBe('function');
    
    // 个人相关函数
    expect(typeof db.getIndividualStats).toBe('function');
    expect(typeof db.getIndividualByUserId).toBe('function');
    
    // 任务搜索和分页函数
    expect(typeof db.searchTasks).toBe('function');
    expect(typeof db.getTasksWithOrders).toBe('function');
    expect(typeof db.getMyTasksWithDetails).toBe('function');
  });
});
