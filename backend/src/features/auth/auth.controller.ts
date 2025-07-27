import { Request, Response } from 'express';
import { AuthService, AuthenticationError } from './auth.service.js';
import { AuthRequest } from './auth.middleware.js';
import { LoginRequest, RefreshTokenRequest, VALIDATION_RULES } from '../../types/index.js';
import { validateInput } from '../../common/validators/input-validator.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login
   * ユーザーログイン
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // 入力検証
      const validationResult = validateInput(req.body, {
        email: VALIDATION_RULES.USER.email,
        password: VALIDATION_RULES.USER.password
      });

      if (!validationResult.isValid) {
        res.status(400).json({
          error: '入力データが無効です',
          code: 'VALIDATION_ERROR',
          details: validationResult.errors
        });
        return;
      }

      const credentials: LoginRequest = req.body;
      
      // クライアント情報取得
      const clientMetadata = {
        ipAddress: this.getClientIp(req),
        userAgent: req.headers['user-agent'] || 'Unknown'
      };

      // ログイン処理
      const loginResponse = await this.authService.login(credentials, clientMetadata);

      // セキュアクッキーでトークン設定
      this.setSecureCookies(res, loginResponse.accessToken, loginResponse.refreshToken);

      res.status(200).json(loginResponse);
    } catch (error) {
      this.handleAuthError(error, res);
    }
  }

  /**
   * POST /api/auth/refresh
   * トークンリフレッシュ
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      // リフレッシュトークン取得（ボディまたはクッキーから）
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
      
      if (!refreshToken) {
        res.status(400).json({
          error: 'リフレッシュトークンが必要です',
          code: 'REFRESH_TOKEN_REQUIRED'
        });
        return;
      }

      const request: RefreshTokenRequest = { refreshToken };
      
      // トークンリフレッシュ処理
      const refreshResponse = await this.authService.refreshToken(request);

      // セキュアクッキー更新
      this.setSecureCookies(res, refreshResponse.accessToken, refreshResponse.refreshToken);

      res.status(200).json(refreshResponse);
    } catch (error) {
      this.handleAuthError(error, res);
    }
  }

  /**
   * POST /api/auth/logout
   * ユーザーログアウト
   */
  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

      if (userId) {
        await this.authService.logout(userId, refreshToken);
      }

      // クッキークリア
      this.clearAuthCookies(res);

      res.status(200).json({
        message: 'ログアウトしました'
      });
    } catch (error) {
      console.error('Logout error:', error);
      // ログアウトエラーは致命的ではない
      this.clearAuthCookies(res);
      res.status(200).json({
        message: 'ログアウトしました'
      });
    }
  }

  /**
   * GET /api/auth/me
   * 現在のユーザー情報取得
   */
  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: '認証が必要です',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      // ユーザー詳細情報取得（実装はDatabaseServiceに依存）
      // 簡略実装
      res.status(200).json({
        user: {
          id: req.user.userId,
          email: req.user.email,
          role: req.user.role
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }

  /**
   * GET /api/auth/google
   * Google OAuth2認証開始
   */
  async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      // Google OAuth2認証URL生成（実装はGmailAuthServiceに依存）
      const googleAuthUrl = this.generateGoogleAuthUrl();

      res.redirect(googleAuthUrl);
    } catch (error) {
      console.error('Google login error:', error);
      res.status(500).json({
        error: 'Google認証の開始に失敗しました',
        code: 'GOOGLE_AUTH_ERROR'
      });
    }
  }

  /**
   * GET /api/auth/google/callback
   * Google OAuth2コールバック処理
   */
  async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const authCode = req.query.code as string;
      const state = req.query.state as string;

      if (!authCode) {
        res.status(400).json({
          error: '認証コードが必要です',
          code: 'MISSING_AUTH_CODE'
        });
        return;
      }

      // Google OAuth2トークン交換とユーザー情報取得（実装はGmailAuthServiceに依存）
      const googleUser = await this.processGoogleCallback(authCode, state);

      // 既存ユーザー確認または新規作成
      const loginResponse = await this.handleGoogleUser(googleUser);

      // セキュアクッキーでトークン設定
      this.setSecureCookies(res, loginResponse.accessToken, loginResponse.refreshToken);

      // フロントエンドにリダイレクト
      const redirectUrl = this.determineRedirectUrl(loginResponse.user.role);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('/login?error=google_auth_failed');
    }
  }

  /**
   * POST /api/auth/register
   * 新規ユーザー登録（管理者のみ）
   */
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      // 管理者権限チェック（ミドルウェアで実装済みの想定）
      
      // 入力検証
      const validationResult = validateInput(req.body, {
        email: VALIDATION_RULES.USER.email,
        username: VALIDATION_RULES.USER.username,
        fullName: VALIDATION_RULES.USER.fullName,
        password: VALIDATION_RULES.USER.password
      });

      if (!validationResult.isValid) {
        res.status(400).json({
          error: '入力データが無効です',
          code: 'VALIDATION_ERROR',
          details: validationResult.errors
        });
        return;
      }

      // ユーザー登録処理（実装はUserServiceに依存）
      const newUser = await this.createUser(req.body);

      res.status(201).json({
        message: 'ユーザーが正常に作成されました',
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          fullName: newUser.fullName,
          role: newUser.role
        }
      });
    } catch (error) {
      this.handleAuthError(error, res);
    }
  }

  /**
   * セキュアクッキー設定
   */
  private setSecureCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // アクセストークン（短期間）
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15分
    });

    // リフレッシュトークン（長期間）
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7日
    });
  }

  /**
   * 認証クッキークリア
   */
  private clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }

  /**
   * クライアントIP取得
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    return forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress || 'unknown';
  }

  /**
   * 認証エラーハンドリング
   */
  private handleAuthError(error: unknown, res: Response): void {
    console.error('Auth controller error:', error);

    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
      return;
    }

    if (error instanceof Error) {
      // 既知のエラータイプ
      if (error.message.includes('validation')) {
        res.status(400).json({
          error: '入力データが無効です',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        res.status(409).json({
          error: 'このメールアドレスは既に使用されています',
          code: 'EMAIL_ALREADY_EXISTS'
        });
        return;
      }
    }

    // その他のエラー
    res.status(500).json({
      error: 'システムエラーが発生しました',
      code: 'SYSTEM_ERROR'
    });
  }

  /**
   * Google認証URL生成（実装スタブ）
   */
  private generateGoogleAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
    const scope = 'profile email https://www.googleapis.com/auth/gmail.readonly';
    const state = this.generateStateToken();

    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}&` +
      `access_type=offline&` +
      `prompt=consent`;
  }

  /**
   * Googleコールバック処理（実装スタブ）
   */
  private async processGoogleCallback(authCode: string, state: string): Promise<any> {
    // 実装はGmailAuthServiceに依存
    // ここではスタブとして簡略実装
    return {
      email: 'user@google.com',
      name: 'Google User',
      googleId: 'google123',
      accessToken: 'google-access-token',
      refreshToken: 'google-refresh-token'
    };
  }

  /**
   * Googleユーザー処理（実装スタブ）
   */
  private async handleGoogleUser(googleUser: any): Promise<any> {
    // 実装はUserServiceに依存
    // ここではスタブとして簡略実装
    return {
      user: {
        id: 'user-123',
        email: googleUser.email,
        role: 'USER'
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900
    };
  }

  /**
   * ユーザー作成（実装スタブ）
   */
  private async createUser(userData: any): Promise<any> {
    // 実装はUserServiceに依存
    // ここではスタブとして簡略実装
    return {
      id: 'new-user-123',
      email: userData.email,
      username: userData.username,
      fullName: userData.fullName,
      role: userData.role || 'USER'
    };
  }

  /**
   * リダイレクトURL決定
   */
  private determineRedirectUrl(role: string): string {
    switch (role) {
      case 'COMPANY_LEADER':
      case 'MANAGER':
        return '/admin/dashboard';
      case 'TEAM_LEADER':
      case 'USER':
        return '/user/dashboard';
      default:
        return '/dashboard';
    }
  }

  /**
   * ステートトークン生成
   */
  private generateStateToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}