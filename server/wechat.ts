import axios from 'axios';
import jwt from 'jsonwebtoken';

// 微信API配置
const WECHAT_API_URL = 'https://api.weixin.qq.com';

/**
 * 微信登录响应接口
 */
interface WechatLoginResponse {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

/**
 * 调用微信API，使用code换取openid和session_key
 */
export async function code2Session(code: string): Promise<WechatLoginResponse> {
  const appId = process.env.WECHAT_APPID;
  const appSecret = process.env.WECHAT_SECRET;
  
  if (!appId || !appSecret) {
    throw new Error('微信小程序配置缺失: WECHAT_APPID 和 WECHAT_SECRET');
  }
  
  try {
    const response = await axios.get<WechatLoginResponse>(
      `${WECHAT_API_URL}/sns/jscode2session`,
      {
        params: {
          appid: appId,
          secret: appSecret,
          js_code: code,
          grant_type: 'authorization_code',
        },
      }
    );
    
    const data = response.data;
    
    // 检查微信API是否返回错误
    if (data.errcode) {
      throw new Error(`微信API错误: ${data.errmsg} (${data.errcode})`);
    }
    
    if (!data.openid) {
      throw new Error('微信API返回数据异常: 缺少openid');
    }
    
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`调用微信API失败: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 生成JWT token
 */
export function generateToken(payload: { userId: number; openId: string; role: string }): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT配置缺失: JWT_SECRET');
  }
  
  // 生成token，有效期7天
  return jwt.sign(payload, secret, {
    expiresIn: '7d',
  });
}

/**
 * 验证JWT token
 */
export function verifyToken(token: string): any {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT配置缺失: JWT_SECRET');
  }
  
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token已过期');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token无效');
    }
    throw error;
  }
}
