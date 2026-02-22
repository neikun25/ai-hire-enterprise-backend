import { describe, it, expect, beforeAll } from 'vitest';
import { code2Session } from './wechat';

describe('微信登录配置测试', () => {
  beforeAll(() => {
    // 确保环境变量已设置
    if (!process.env.WECHAT_APPID || !process.env.WECHAT_SECRET) {
      throw new Error('缺少微信小程序配置: WECHAT_APPID 和 WECHAT_SECRET');
    }
  });

  it('应该正确配置微信小程序环境变量', () => {
    expect(process.env.WECHAT_APPID).toBeDefined();
    expect(process.env.WECHAT_SECRET).toBeDefined();
    expect(process.env.WECHAT_APPID).not.toBe('');
    expect(process.env.WECHAT_SECRET).not.toBe('');
  });

  it('使用无效code调用微信API应该返回错误', async () => {
    // 使用一个明显无效的code（太短）
    const invalidCode = 'invalid';
    
    try {
      await code2Session(invalidCode);
      // 如果没有抛出错误，测试失败
      expect.fail('应该抛出错误');
    } catch (error) {
      // 验证错误信息包含微信API错误提示
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message;
      expect(
        errorMessage.includes('微信API错误') || 
        errorMessage.includes('调用微信API失败')
      ).toBe(true);
    }
  });

  it('微信API配置格式应该正确', () => {
    const appId = process.env.WECHAT_APPID!;
    const appSecret = process.env.WECHAT_SECRET!;
    
    // AppID通常以wx开头，长度约18个字符
    expect(appId.startsWith('wx')).toBe(true);
    expect(appId.length).toBeGreaterThanOrEqual(16);
    
    // AppSecret通常是32个字符的十六进制字符串
    expect(appSecret.length).toBeGreaterThanOrEqual(32);
    expect(/^[a-f0-9]+$/i.test(appSecret)).toBe(true);
  });
});
