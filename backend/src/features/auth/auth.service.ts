import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse, UserRole, AuditActionType } from '../../types/index.js';
import { DatabaseService } from '../../common/utils/database.js';
import { AuditService } from '../../common/utils/audit.js';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string = '15m'; // 15分
  private readonly REFRESH_TOKEN_EXPIRES_IN: string = '7d'; // 7日
  private readonly BCRYPT_SALT_ROUNDS: number = 12;
  private readonly MAX_LOGIN_ATTEMPTS: number = 5;
  private readonly LOCKOUT_DURATION: number = 30 * 60 * 1000; // 30分

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService
  ) {
    this.JWT_SECRET = process.env.JWT_SECRET || '';
    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  /**
   * ユーザーログイン処理
   */
  async login(credentials: LoginRequest, clientMetadata?: { ipAddress?: string; userAgent?: string }): Promise<LoginResponse> {
    const { email, password } = credentials;

    try {
      // ユーザー存在確認
      const user = await this.databaseService.findUserByEmail(email);
      if (!user) {
        await this.logFailedLogin(email, 'USER_NOT_FOUND', clientMetadata);
        throw new AuthenticationError('認証に失敗しました', 'INVALID_CREDENTIALS');
      }

      // アカウントロック確認
      await this.checkAccountLockout(user.id);

      // パスワード検証
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        await this.recordFailedAttempt(user.id);
        await this.logFailedLogin(email, 'INVALID_PASSWORD', clientMetadata);
        throw new AuthenticationError('認証に失敗しました', 'INVALID_CREDENTIALS');
      }

      // アカウント有効性確認
      if (!user.isActive) {
        await this.logFailedLogin(email, 'ACCOUNT_DISABLED', clientMetadata);
        throw new AuthenticationError('アカウントが無効です', 'ACCOUNT_DISABLED');
      }

      // ログイン成功処理
      await this.clearFailedAttempts(user.id);
      await this.updateLastLogin(user.id);

      // トークン生成
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // リフレッシュトークン保存
      await this.storeRefreshToken(user.id, refreshToken);

      // 監査ログ記録
      await this.auditService.logAction({
        userId: user.id,
        actionType: AuditActionType.LOGIN_SUCCESS,
        action: `ユーザーログイン: ${email}`,
        entityType: 'User',
        entityId: user.id,
        metadata: clientMetadata
      });

      // レスポンス構築（パスワードハッシュを除外）
      const { passwordHash, ...userWithoutPassword } = user;
      
      return {
        user: userWithoutPassword as User,
        accessToken,
        refreshToken,
        expiresIn: 15 * 60 // 15分（秒単位）
      };

    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      await this.logFailedLogin(email, 'SYSTEM_ERROR', clientMetadata);
      throw new Error('システムエラーが発生しました');
    }
  }

  /**
   * トークンリフレッシュ処理
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const { refreshToken } = request;

    try {
      // リフレッシュトークンの検証
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as AuthTokenPayload;
      
      // データベースからリフレッシュトークン確認
      const storedToken = await this.databaseService.findRefreshToken(decoded.userId, refreshToken);
      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new AuthenticationError('リフレッシュトークンが無効です', 'TOKEN_EXPIRED');
      }

      // ユーザー情報取得
      const user = await this.databaseService.findUserById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AuthenticationError('ユーザーが見つからないか無効です', 'USER_NOT_FOUND');
      }

      // 新しいトークン生成
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // 古いリフレッシュトークン削除と新しいトークン保存
      await this.databaseService.deleteRefreshToken(refreshToken);
      await this.storeRefreshToken(user.id, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60 // 15分（秒単位）
      };

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('リフレッシュトークンが無効です', 'TOKEN_EXPIRED');
      }
      throw error;
    }
  }

  /**
   * ログアウト処理
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    try {
      // リフレッシュトークン削除
      if (refreshToken) {
        await this.databaseService.deleteRefreshToken(refreshToken);
      }

      // 監査ログ記録
      await this.auditService.logAction({
        userId,
        actionType: AuditActionType.LOGOUT,
        action: 'ユーザーログアウト',
        entityType: 'User',
        entityId: userId
      });

    } catch (error) {
      console.error('Logout error:', error);
      // ログアウトエラーは致命的ではない
    }
  }

  /**
   * トークン検証
   */
  async verifyToken(token: string): Promise<AuthTokenPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as AuthTokenPayload;
      
      // ユーザーの有効性確認
      const user = await this.databaseService.findUserById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AuthenticationError('ユーザーが無効です', 'USER_NOT_FOUND');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('トークンが無効です', 'TOKEN_EXPIRED');
      }
      throw error;
    }
  }

  /**
   * パスワードハッシュ化
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);
  }

  /**
   * パスワード検証
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * アクセストークン生成
   */
  private generateAccessToken(user: any): string {
    const payload: Omit<AuthTokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: 'crm-system',
      audience: 'crm-users'
    });
  }

  /**
   * リフレッシュトークン生成
   */
  private generateRefreshToken(user: any): string {
    const payload = {
      userId: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'crm-system',
      audience: 'crm-users'
    });
  }

  /**
   * リフレッシュトークン保存
   */
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7日後

    await this.databaseService.storeRefreshToken({
      userId,
      token: refreshToken,
      expiresAt,
      createdAt: new Date()
    });
  }

  /**
   * アカウントロックアウト確認
   */
  private async checkAccountLockout(userId: string): Promise<void> {
    const attempts = await this.databaseService.getFailedLoginAttempts(userId);
    
    if (attempts && attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
      const lockoutEnd = new Date(attempts.lastAttempt.getTime() + this.LOCKOUT_DURATION);
      
      if (new Date() < lockoutEnd) {
        const remainingMinutes = Math.ceil((lockoutEnd.getTime() - Date.now()) / (60 * 1000));
        throw new AuthenticationError(
          `アカウントが一時的にロックされています。${remainingMinutes}分後に再試行してください。`,
          'RATE_LIMIT_EXCEEDED'
        );
      }
    }
  }

  /**
   * 失敗試行記録
   */
  private async recordFailedAttempt(userId: string): Promise<void> {
    await this.databaseService.recordFailedLoginAttempt(userId);
  }

  /**
   * 失敗試行クリア
   */
  private async clearFailedAttempts(userId: string): Promise<void> {
    await this.databaseService.clearFailedLoginAttempts(userId);
  }

  /**
   * 最終ログイン時刻更新
   */
  private async updateLastLogin(userId: string): Promise<void> {
    await this.databaseService.updateUser(userId, {
      lastLoginAt: new Date()
    });
  }

  /**
   * ログイン失敗ログ記録
   */
  private async logFailedLogin(
    email: string, 
    reason: string, 
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    // 失敗ログは特別な処理で記録（ユーザーIDがない場合もある）
    await this.auditService.logAction({
      userId: 'system', // システムユーザーとして記録
      actionType: AuditActionType.LOGIN_FAILED,
      action: `ログイン失敗: ${email} (理由: ${reason})`,
      entityType: 'User',
      entityId: email,
      metadata: {
        ...metadata,
        failureReason: reason
      }
    });
  }
}

/**
 * 認証エラークラス
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * 認証サービスのシングルトンインスタンス
 */
let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    const databaseService = new DatabaseService();
    const auditService = new AuditService(databaseService);
    authServiceInstance = new AuthService(databaseService, auditService);
  }
  return authServiceInstance;
}