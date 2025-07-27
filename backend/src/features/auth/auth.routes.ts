import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { 
  requireAuth, 
  requireUpperRole, 
  rateLimit, 
  csrfProtection,
  AuthRequest 
} from './auth.middleware.js';
import { UserRole } from '../../types/index.js';

/**
 * 認証関連ルートの設定
 */
export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();
  const authController = new AuthController(authService);

  // レート制限設定（認証関連は厳しく制限）
  const authRateLimit = rateLimit(20, 15 * 60 * 1000); // 15分間で20リクエスト
  const strictRateLimit = rateLimit(5, 15 * 60 * 1000); // 15分間で5リクエスト（ログイン試行）

  // ===========================================
  // 公開エンドポイント（認証不要）
  // ===========================================

  /**
   * POST /api/auth/login
   * ユーザーログイン
   */
  router.post('/login', 
    strictRateLimit,
    csrfProtection(),
    async (req, res) => {
      await authController.login(req, res);
    }
  );

  /**
   * POST /api/auth/refresh
   * アクセストークンリフレッシュ
   */
  router.post('/refresh',
    authRateLimit,
    async (req, res) => {
      await authController.refresh(req, res);
    }
  );

  /**
   * GET /api/auth/google
   * Google OAuth2認証開始
   */
  router.get('/google',
    authRateLimit,
    async (req, res) => {
      await authController.googleLogin(req, res);
    }
  );

  /**
   * GET /api/auth/google/callback
   * Google OAuth2コールバック
   */
  router.get('/google/callback',
    authRateLimit,
    async (req, res) => {
      await authController.googleCallback(req, res);
    }
  );

  // ===========================================
  // 認証必須エンドポイント
  // ===========================================

  /**
   * POST /api/auth/logout
   * ユーザーログアウト
   */
  router.post('/logout',
    requireAuth(authService),
    async (req: AuthRequest, res) => {
      await authController.logout(req, res);
    }
  );

  /**
   * GET /api/auth/me
   * 現在のユーザー情報取得
   */
  router.get('/me',
    requireAuth(authService),
    async (req: AuthRequest, res) => {
      await authController.getCurrentUser(req, res);
    }
  );

  // ===========================================
  // 管理者限定エンドポイント
  // ===========================================

  /**
   * POST /api/auth/register
   * 新規ユーザー登録（管理者のみ）
   */
  router.post('/register',
    requireAuth(authService),
    requireUpperRole(),
    authRateLimit,
    csrfProtection(),
    async (req: AuthRequest, res) => {
      await authController.register(req, res);
    }
  );

  // ===========================================
  // ヘルスチェック・情報取得エンドポイント
  // ===========================================

  /**
   * GET /api/auth/status
   * 認証システムの状態確認
   */
  router.get('/status', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      features: {
        jwtAuth: true,
        googleOAuth: !!process.env.GOOGLE_CLIENT_ID,
        refreshTokens: true,
        rateLimiting: true,
        csrfProtection: true
      }
    });
  });

  /**
   * GET /api/auth/config
   * 認証設定情報（フロントエンド用・機密情報は除外）
   */
  router.get('/config', (req, res) => {
    res.json({
      google: {
        enabled: !!process.env.GOOGLE_CLIENT_ID,
        clientId: process.env.GOOGLE_CLIENT_ID // 公開情報なので問題なし
      },
      security: {
        mfaEnabled: process.env.MFA_ENABLED === 'true',
        passwordMinLength: 8,
        sessionTimeout: 30 * 60 * 1000 // 30分
      },
      endpoints: {
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        refresh: '/api/auth/refresh',
        googleLogin: '/api/auth/google',
        me: '/api/auth/me'
      }
    });
  });

  // ===========================================
  // エラーハンドリング
  // ===========================================

  /**
   * 認証ルート専用エラーハンドラー
   */
  router.use((error: Error, req: any, res: any, next: any) => {
    console.error('Auth route error:', error);

    // 認証エラーの詳細ログ（本番環境では注意）
    if (process.env.NODE_ENV !== 'production') {
      console.error('Auth error details:', {
        path: req.path,
        method: req.method,
        user: req.user?.userId,
        error: error.message,
        stack: error.stack
      });
    }

    // 認証系エラーは詳細を隠す
    res.status(500).json({
      error: 'システムエラーが発生しました',
      code: 'SYSTEM_ERROR',
      requestId: req.id || 'unknown'
    });
  });

  return router;
}

/**
 * 認証ミドルウェアのファクトリー関数
 * 他のルーターで使用するため
 */
export function createAuthMiddleware(authService: AuthService) {
  return {
    requireAuth: requireAuth(authService),
    requireUpperRole: requireUpperRole(),
    requireRole: (roles: UserRole[]) => requireAuth(authService),
    rateLimit: rateLimit(),
    csrfProtection: csrfProtection()
  };
}

/**
 * 認証関連のヘルパー関数
 */
export const authHelpers = {
  /**
   * ユーザーが指定されたロールを持っているかチェック
   */
  hasRole: (user: any, role: UserRole): boolean => {
    return user && user.role === role;
  },

  /**
   * ユーザーが上位権限を持っているかチェック
   */
  hasUpperRole: (user: any): boolean => {
    return user && [UserRole.COMPANY_LEADER, UserRole.MANAGER, UserRole.TEAM_LEADER].includes(user.role);
  },

  /**
   * ユーザーが特定のリソースにアクセスできるかチェック
   */
  canAccessResource: (user: any, resource: any): boolean => {
    if (!user || !resource) return false;
    
    // 上位権限者は全てアクセス可能
    if (authHelpers.hasUpperRole(user)) return true;
    
    // 担当者チェック
    return resource.primaryAssigneeId === user.userId ||
           (resource.secondaryAssigneeIds && resource.secondaryAssigneeIds.includes(user.userId));
  },

  /**
   * パスワード強度チェック
   */
  isStrongPassword: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('パスワードは8文字以上である必要があります');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('小文字を含む必要があります');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('大文字を含む必要があります');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('数字を含む必要があります');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('特殊文字を含む必要があります');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};