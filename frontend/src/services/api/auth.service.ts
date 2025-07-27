/**
 * 実API認証サービス
 * バックエンドAPI（ExpressサーバーのJWT認証）と通信
 */

import { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
  User,
  API_PATHS
} from '../../types/index';

export class ApiAuthService {
  private baseUrl: string;

  constructor() {
    // 環境変数からAPIベースURLを取得、デフォルトはlocalhost:3001
    this.baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
    console.log('🔗 API Auth Service initialized with baseUrl:', this.baseUrl);
  }

  /**
   * APIリクエストのベースメソッド
   */
  private async apiRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // アクセストークンがある場合は認証ヘッダーを追加
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && !endpoint.includes('/login') && !endpoint.includes('/refresh')) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${accessToken}`,
      };
    }

    console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // HTTPエラーの場合、レスポンスボディからエラーメッセージを取得
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        console.error(`❌ API Error: ${response.status} - ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ API Success: ${endpoint}`);
      return data;
      
    } catch (error: any) {
      console.error(`💥 API Request Failed: ${url}`, error);
      
      // ネットワークエラーやJSONパースエラーをわかりやすく
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('サーバーに接続できません。バックエンドが起動しているか確認してください。');
      }
      
      throw error;
    }
  }

  /**
   * ログイン
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('🔑 API Login attempt for:', credentials.email);
    
    return this.apiRequest<LoginResponse>(API_PATHS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  /**
   * Google OAuth2ログイン
   * バックエンドのGoogle認証URLを取得
   */
  async googleLogin(): Promise<string> {
    console.log('📧 API Google OAuth2 login initiation');
    
    const response = await this.apiRequest<{ authUrl: string }>(
      API_PATHS.AUTH.GOOGLE_LOGIN, 
      { method: 'GET' }
    );
    
    return response.authUrl;
  }

  /**
   * ログアウト
   */
  async logout(): Promise<void> {
    console.log('👋 API Logout');
    
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await this.apiRequest<void>(API_PATHS.AUTH.LOGOUT, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
    
    // ローカルストレージからトークンを削除
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * トークンリフレッシュ
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    console.log('🔄 API Token refresh');
    
    return this.apiRequest<RefreshTokenResponse>(API_PATHS.AUTH.REFRESH_TOKEN, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 現在のユーザー情報取得
   */
  async getCurrentUser(): Promise<User> {
    console.log('👤 API Get current user');
    
    return this.apiRequest<User>(API_PATHS.AUTH.ME);
  }

  /**
   * トークン検証
   */
  async verifyToken(token: string): Promise<boolean> {
    console.log('🔍 API Token verification');
    
    try {
      await this.apiRequest<{ valid: boolean }>(API_PATHS.AUTH.VERIFY_TOKEN, {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * パスワードリセット要求
   */
  async requestPasswordReset(email: string): Promise<void> {
    console.log('🔐 API Password reset request for:', email);
    
    await this.apiRequest<void>(API_PATHS.AUTH.PASSWORD_RESET_REQUEST, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * MFA検証
   */
  async verifyMFA(code: string): Promise<LoginResponse> {
    console.log('🔐 API MFA verification');
    
    return this.apiRequest<LoginResponse>(API_PATHS.AUTH.MFA_VERIFY, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  /**
   * 接続テスト
   */
  async testConnection(): Promise<{ status: string; message: string }> {
    console.log('🏥 API Connection test');
    
    try {
      return await this.apiRequest<{ status: string; message: string }>('/api/health');
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Connection failed'
      };
    }
  }
}

// シングルトンインスタンス
export const apiAuthService = new ApiAuthService();