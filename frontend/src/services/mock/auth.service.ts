/**
 * 認証モックサービス
 * @MARKシステムによる実API切り替え準備済み
 */

import { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
  User,
  UserRole 
} from '../../types/index';
import {
  mockLoginSuccessResponse,
  mockAdminLoginResponse,
  mockUserLoginResponse,
  mockGoogleAuthResponse,
  mockRefreshTokenResponse,
  mockAuthErrors,
  mockAuthConfig,
  getMockUserByCredentials,
  getMockRedirectUrl
} from './data/auth.mock';

export class MockAuthService {
  private currentUser: User | null = null;
  private currentTokens: { accessToken: string; refreshToken: string } | null = null;

  /**
   * ログイン処理（モック）
   * @MOCK_TO_API: authService.login()に置き換え
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // 意図的な遅延（リアルなAPI体験）
    await this.delay(800);

    const { email, password } = credentials;

    // バリデーション
    if (!email || !password) {
      throw new MockAuthError(
        'メールアドレスとパスワードを入力してください',
        'VALIDATION_ERROR',
        400
      );
    }

    // 認証情報確認
    const user = getMockUserByCredentials(email, password);
    if (!user) {
      throw new MockAuthError(
        mockAuthErrors.invalidCredentials.error,
        mockAuthErrors.invalidCredentials.code,
        mockAuthErrors.invalidCredentials.statusCode
      );
    }

    // アカウント有効性チェック
    if (!user.isActive) {
      throw new MockAuthError(
        'アカウントが無効です',
        'ACCOUNT_DISABLED',
        403
      );
    }

    // ロール別レスポンス生成
    let response: LoginResponse;
    switch (user.role) {
      case UserRole.COMPANY_LEADER:
        response = { ...mockAdminLoginResponse, user };
        break;
      case UserRole.MANAGER:
        response = { ...mockLoginSuccessResponse, user };
        break;
      default:
        response = { ...mockUserLoginResponse, user };
    }

    // 内部状態更新
    this.currentUser = user;
    this.currentTokens = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken
    };

    console.log('🔐 Mock Login Success:', {
      user: user.email,
      role: user.role,
      redirectUrl: getMockRedirectUrl(user.role)
    });

    return response;
  }

  /**
   * Google OAuth2ログイン（モック）
   * @MOCK_TO_API: authService.googleLogin()に置き換え
   */
  async googleLogin(): Promise<string> {
    await this.delay(500);
    
    // Google認証URL生成（モック）
    const mockGoogleAuthUrl = 'https://accounts.google.com/oauth/mock?' + 
      'client_id=mock-client-id&' +
      'redirect_uri=http://localhost:3000/api/auth/google/callback&' +
      'scope=profile email gmail.readonly&' +
      'response_type=code';

    console.log('🌐 Mock Google Auth URL generated');
    return mockGoogleAuthUrl;
  }

  /**
   * Google OAuth2コールバック処理（モック）
   * @MOCK_TO_API: authService.handleGoogleCallback()に置き換え
   */
  async handleGoogleCallback(authCode: string): Promise<LoginResponse> {
    await this.delay(1000);

    if (!authCode || authCode === 'error') {
      throw new MockAuthError(
        'Google認証に失敗しました',
        'GOOGLE_AUTH_FAILED',
        400
      );
    }

    const response = mockGoogleAuthResponse;
    
    // 内部状態更新
    this.currentUser = response.user;
    this.currentTokens = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken
    };

    console.log('🔐 Mock Google Login Success:', {
      user: response.user.email,
      role: response.user.role
    });

    return response;
  }

  /**
   * トークンリフレッシュ（モック）
   * @MOCK_TO_API: authService.refreshToken()に置き換え
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    await this.delay(300);

    const { refreshToken } = request;

    if (!refreshToken || !this.currentTokens || this.currentTokens.refreshToken !== refreshToken) {
      throw new MockAuthError(
        mockAuthErrors.tokenExpired.error,
        mockAuthErrors.tokenExpired.code,
        mockAuthErrors.tokenExpired.statusCode
      );
    }

    const response = mockRefreshTokenResponse;
    
    // 内部状態更新
    this.currentTokens = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken
    };

    console.log('🔄 Mock Token Refresh Success');
    return response;
  }

  /**
   * ログアウト（モック）
   * @MOCK_TO_API: authService.logout()に置き換え
   */
  async logout(refreshToken?: string): Promise<void> {
    await this.delay(200);

    // 内部状態クリア
    this.currentUser = null;
    this.currentTokens = null;

    console.log('👋 Mock Logout Success');
  }

  /**
   * 現在のユーザー情報取得（モック）
   * @MOCK_TO_API: authService.getCurrentUser()に置き換え
   */
  async getCurrentUser(): Promise<User | null> {
    await this.delay(100);

    if (!this.currentUser || !this.currentTokens) {
      throw new MockAuthError(
        '認証が必要です',
        'AUTH_REQUIRED',
        401
      );
    }

    console.log('👤 Mock Get Current User:', this.currentUser.email);
    return this.currentUser;
  }

  /**
   * 認証設定取得（モック）
   * @MOCK_TO_API: authService.getConfig()に置き換え
   */
  async getConfig(): Promise<typeof mockAuthConfig> {
    await this.delay(50);
    return mockAuthConfig;
  }

  /**
   * トークン検証（モック）
   * @MOCK_TO_API: authService.verifyToken()に置き換え
   */
  async verifyToken(token: string): Promise<boolean> {
    await this.delay(100);

    // 簡単なトークン検証（モック）
    const isValid = !!(token && 
                   token.startsWith('mock-') && 
                   this.currentTokens && 
                   this.currentTokens.accessToken === token);

    console.log('🔍 Mock Token Verification:', isValid ? 'Valid' : 'Invalid');
    return isValid;
  }

  /**
   * パスワードリセット要求（モック）
   * @MOCK_TO_API: authService.requestPasswordReset()に置き換え
   */
  async requestPasswordReset(email: string): Promise<void> {
    await this.delay(500);

    if (!email) {
      throw new MockAuthError(
        'メールアドレスを入力してください',
        'VALIDATION_ERROR',
        400
      );
    }

    console.log('📧 Mock Password Reset Email Sent:', email);
  }

  /**
   * 遅延ヘルパー（リアルなAPI体験用）
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 内部状態取得（デバッグ用）
   */
  getInternalState() {
    return {
      currentUser: this.currentUser,
      currentTokens: this.currentTokens,
      isAuthenticated: !!this.currentUser
    };
  }
}

/**
 * モック認証エラークラス
 */
export class MockAuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'MockAuthError';
  }
}

/**
 * モック認証サービスのシングルトンインスタンス
 */
let mockAuthServiceInstance: MockAuthService | null = null;

export function getMockAuthService(): MockAuthService {
  if (!mockAuthServiceInstance) {
    mockAuthServiceInstance = new MockAuthService();
  }
  return mockAuthServiceInstance;
}