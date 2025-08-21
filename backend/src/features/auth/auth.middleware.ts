import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthTokenPayload, AuthenticationError } from './auth.service.js';
import { UserRole, API_AUTH_CONFIG, isUpperRole } from '../../types/index.js';

export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

/**
 * JWT認証ミドルウェア
 */
export function requireAuth(authService: AuthService) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      // 認証不要エンドポイントのチェック
      if (API_AUTH_CONFIG.PUBLIC_ENDPOINTS.includes(req.path)) {
        return next();
      }

      // トークン取得（ヘッダーまたはクッキーから）
      const token = extractTokenFromRequest(req);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: '認証が必要です',
          code: 'AUTHENTICATION_REQUIRED',
          redirectTo: '/login'
        });
      }

      // トークン検証
      const decoded = await authService.verifyToken(token);
      
      // リクエストオブジェクトにユーザー情報を追加
      req.user = decoded;
      
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
          redirectTo: '/login'
        });
      }

      console.error('Authentication middleware error:', error);
      return res.status(500).json({
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  };
}

/**
 * ロールベース認証ミドルウェア
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({
        error: '認証が必要です',
        code: 'AUTH_REQUIRED',
        redirectTo: '/login'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'この操作を実行する権限がありません',
        code: 'PERMISSION_DENIED',
        requiredRole: allowedRoles.join(' または ')
      });
    }

    next();
  };
}

/**
 * 上位権限者チェックミドルウェア
 */
export function requireUpperRole() {
  return (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({
        error: '認証が必要です',
        code: 'AUTH_REQUIRED',
        redirectTo: '/login'
      });
    }

    if (!isUpperRole(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'この操作には管理者権限が必要です',
        code: 'INSUFFICIENT_ROLE',
        requiredRole: 'COMPANY_LEADER, MANAGER, または TEAM_LEADER'
      });
    }

    next();
  };
}

/**
 * 担当者権限チェックミドルウェア
 * 企業・TODO・契約などの編集時に担当者であることを確認
 */
export function requireAssigneeOrUpperRole(entityService: any, entityIdParam: string = 'id') {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: '認証が必要です',
          code: 'AUTHENTICATION_REQUIRED',
          redirectTo: '/login'
        });
      }

      const entityId = req.params[entityIdParam];
      if (!entityId) {
        return res.status(400).json({
          error: 'エンティティIDが必要です',
          code: 'INVALID_REQUEST'
        });
      }

      // 上位権限者は全てアクセス可能
      if (isUpperRole(req.user.role)) {
        return next();
      }

      // 担当者チェック
      const entity = await entityService.findById(entityId);
      if (!entity) {
        return res.status(404).json({
          error: 'リソースが見つかりません',
          code: 'NOT_FOUND'
        });
      }

      const isAssignee = 
        entity.primaryAssigneeId === req.user.userId ||
        (entity.secondaryAssigneeIds && entity.secondaryAssigneeIds.includes(req.user.userId));

      if (!isAssignee) {
        return res.status(403).json({
          error: 'この操作を実行する権限がありません（担当者または管理者である必要があります）',
          code: 'PERMISSION_DENIED'
        });
      }

      next();
    } catch (error) {
      console.error('Assignee check middleware error:', error);
      return res.status(500).json({
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  };
}

/**
 * Gmail アクセス権限チェックミドルウェア
 */
export function requireGmailAccess(accessType: 'personal' | 'shared' | 'both' = 'personal') {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    if (!req.user) {
      return res.status(401).json({
        error: '認証が必要です',
        code: 'AUTH_REQUIRED',
        redirectTo: '/login'
      });
    }

    try {
      // 個人Gmail接続確認（実装はGmailサービスに依存）
      const hasPersonalAccess = accessType !== 'shared'; // 簡略化
      
      // 共有Gmailアクセス確認（上位権限者のみ）
      const hasSharedAccess = isUpperRole(req.user.role);

      if (accessType === 'shared' && !hasSharedAccess) {
        return res.status(403).json({
          error: '共同メールアクセス権限がありません',
          code: 'GMAIL_SHARED_ACCESS_DENIED'
        });
      }

      if (accessType === 'personal' && !hasPersonalAccess) {
        return res.status(403).json({
          error: 'Gmail認証が必要です',
          code: 'GMAIL_AUTH_REQUIRED',
          authUrl: '/api/auth/google'
        });
      }

      if (accessType === 'both' && !hasPersonalAccess && !hasSharedAccess) {
        return res.status(403).json({
          error: 'Gmailアクセス権限がありません',
          code: 'GMAIL_ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      console.error('Gmail access middleware error:', error);
      return res.status(500).json({
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  };
}

/**
 * レート制限ミドルウェア
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const clientId = getClientId(req);
    const now = Date.now();
    
    // ウィンドウリセット
    const clientData = requests.get(clientId);
    if (!clientData || now > clientData.resetTime) {
      requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    // リクエスト数チェック
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        error: 'リクエスト回数が上限を超えました',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }

    // カウント増加
    clientData.count++;
    next();
  };
}

/**
 * CSRF保護ミドルウェア
 */
export function csrfProtection() {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    // GET、HEAD、OPTIONSは除外
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // 開発・テスト環境では無効化
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return next();
    }

    // CSRFトークンチェック（簡略実装）
    const csrfToken = req.headers['x-csrf-token'] as string;
    const sessionToken = req.headers['x-session-token'] as string;

    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      return res.status(403).json({
        error: 'CSRF検証に失敗しました',
        code: 'CSRF_TOKEN_INVALID'
      });
    }

    next();
  };
}

/**
 * セキュリティヘッダー設定ミドルウェア
 */
export function securityHeaders() {
  return (_req: Request, res: Response, next: NextFunction): void => {
    // セキュリティヘッダー設定
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    next();
  };
}

/**
 * ヘルパー関数: リクエストからトークン抽出
 */
function extractTokenFromRequest(req: Request): string | null {
  // Authorization ヘッダーから
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // クッキーから
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * ヘルパー関数: クライアントID取得（レート制限用）
 */
function getClientId(req: Request): string {
  // 認証済みユーザーはユーザーIDを使用
  const authRequest = req as AuthRequest;
  if (authRequest.user) {
    return `user:${authRequest.user.userId}`;
  }

  // 未認証はIPアドレスを使用
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
  return `ip:${ip}`;
}

/**
 * 認証エラーハンドラー
 */
export function authErrorHandler() {
  return (error: Error, _req: Request, res: Response, next: NextFunction): Response | void => {
    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }

    next(error);
  };
}