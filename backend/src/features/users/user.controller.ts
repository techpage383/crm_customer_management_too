/**
 * ユーザーコントローラー
 * P-010 ユーザー管理ページのRESTfulコントローラー
 */

import { Request, Response } from 'express';
import { UserService } from './user.service.js';
import { 
  UserSearchRequest, 
  UserCreate, 
  UserUpdate,
  BulkUserUpdateRequest,
  UserStatusUpdateRequest 
} from '../../types/index.js';
import { AuthRequest } from '../auth/auth.middleware.js';
import { validateInput } from '../../common/validators/input-validator.js';

export class UserController {
  constructor(private userService: UserService) {}

  /**
   * GET /api/users
   * ユーザー一覧取得（検索・フィルタリング対応）
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      console.log('📋 GET /api/users - User list request');

      // クエリパラメータの解析
      const searchParams: UserSearchRequest = {
        query: req.query.query as string,
        role: req.query.role ? (Array.isArray(req.query.role) ? req.query.role as string[] : [req.query.role as string]) : undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        department: req.query.department as string,
        gmailConnected: req.query.gmailConnected ? req.query.gmailConnected === 'true' : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as any || 'createdAt',
        sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
      };

      // ページネーション制限
      if (searchParams.limit! > 100) {
        searchParams.limit = 100;
      }

      const result = await this.userService.getUsers(searchParams);

      res.json({
        success: true,
        data: result,
        message: `${result.users.length}件のユーザーを取得しました`
      });

    } catch (error: any) {
      console.error('❌ Failed to get users:', error);
      res.status(500).json({
        success: false,
        error: 'ユーザー一覧の取得に失敗しました',
        code: 'USER_LIST_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/users/:id
   * ユーザー詳細取得
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      console.log('👤 GET /api/users/:id - User detail request:', userId);

      const user = await this.userService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'ユーザーが見つかりません',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // パスワード関連情報を除外
      const { ...userWithoutSensitiveData } = user;

      res.json({
        success: true,
        data: userWithoutSensitiveData,
        message: 'ユーザー詳細を取得しました'
      });

    } catch (error: any) {
      console.error('❌ Failed to get user:', error);
      res.status(500).json({
        success: false,
        error: 'ユーザー詳細の取得に失敗しました',
        code: 'USER_DETAIL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /api/users
   * ユーザー作成
   */
  async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('➕ POST /api/users - User creation request');

      const userData: UserCreate = req.body;
      const createdBy = req.user!.userId;

      // 入力検証
      const validationError = this.validateUserCreateData(userData);
      if (validationError) {
        res.status(400).json({
          success: false,
          error: validationError,
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const newUser = await this.userService.createUser(userData, createdBy);

      // パスワード情報を除外してレスポンス
      const { ...userResponse } = newUser;

      res.status(201).json({
        success: true,
        data: userResponse,
        message: 'ユーザーを作成しました'
      });

    } catch (error: any) {
      console.error('❌ Failed to create user:', error);
      
      // 重複エラーの場合
      if (error.message.includes('既に使用されています')) {
        res.status(409).json({
          success: false,
          error: error.message,
          code: 'DUPLICATE_USER'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'ユーザーの作成に失敗しました',
        code: 'USER_CREATE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUT /api/users/:id
   * ユーザー更新
   */
  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const updateData: UserUpdate = req.body;
      const updatedBy = req.user!.userId;

      console.log('📝 PUT /api/users/:id - User update request:', userId);

      // 入力検証
      const validationError = this.validateUserUpdateData(updateData);
      if (validationError) {
        res.status(400).json({
          success: false,
          error: validationError,
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const updatedUser = await this.userService.updateUser(userId, updateData, updatedBy);

      // パスワード情報を除外してレスポンス
      const { ...userResponse } = updatedUser;

      res.json({
        success: true,
        data: userResponse,
        message: 'ユーザー情報を更新しました'
      });

    } catch (error: any) {
      console.error('❌ Failed to update user:', error);

      if (error.message.includes('見つかりません')) {
        res.status(404).json({
          success: false,
          error: error.message,
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      if (error.message.includes('既に使用されています')) {
        res.status(409).json({
          success: false,
          error: error.message,
          code: 'DUPLICATE_USER'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'ユーザー情報の更新に失敗しました',
        code: 'USER_UPDATE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * DELETE /api/users/:id
   * ユーザー削除（ソフトデリート）
   */
  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const deletedBy = req.user!.userId;

      console.log('🗑️ DELETE /api/users/:id - User deletion request:', userId);

      await this.userService.deleteUser(userId, deletedBy);

      res.json({
        success: true,
        message: 'ユーザーを削除しました'
      });

    } catch (error: any) {
      console.error('❌ Failed to delete user:', error);

      if (error.message.includes('見つかりません')) {
        res.status(404).json({
          success: false,
          error: error.message,
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      if (error.message.includes('削除できません')) {
        res.status(403).json({
          success: false,
          error: error.message,
          code: 'SELF_DELETE_FORBIDDEN'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'ユーザーの削除に失敗しました',
        code: 'USER_DELETE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /api/users/search
   * ユーザー検索（POSTボディでの詳細検索）
   */
  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 POST /api/users/search - Advanced user search');

      const searchParams: UserSearchRequest = req.body;

      const result = await this.userService.getUsers(searchParams);

      res.json({
        success: true,
        data: result,
        message: `検索条件に一致する${result.users.length}件のユーザーを取得しました`
      });

    } catch (error: any) {
      console.error('❌ Failed to search users:', error);
      res.status(500).json({
        success: false,
        error: 'ユーザー検索に失敗しました',
        code: 'USER_SEARCH_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUT /api/users/bulk
   * 一括ユーザー更新
   */
  async bulkUpdateUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('🔄 PUT /api/users/bulk - Bulk user update');

      const bulkUpdate: BulkUserUpdateRequest = req.body;
      const updatedBy = req.user!.userId;

      // 入力検証
      if (!bulkUpdate.userIds || !Array.isArray(bulkUpdate.userIds) || bulkUpdate.userIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'ユーザーIDの配列が必要です',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      if (!bulkUpdate.updates || Object.keys(bulkUpdate.updates).length === 0) {
        res.status(400).json({
          success: false,
          error: '更新データが必要です',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const result = await this.userService.bulkUpdateUsers(bulkUpdate, updatedBy);

      res.json({
        success: true,
        data: result,
        message: `一括更新が完了しました（成功: ${result.successCount}件、エラー: ${result.errorCount}件）`
      });

    } catch (error: any) {
      console.error('❌ Failed to bulk update users:', error);
      res.status(500).json({
        success: false,
        error: 'ユーザーの一括更新に失敗しました',
        code: 'BULK_UPDATE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/users/stats
   * ユーザー統計情報取得
   */
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 GET /api/users/stats - User statistics request');

      const stats = await this.userService.getUserStats();

      res.json({
        success: true,
        data: stats,
        message: 'ユーザー統計情報を取得しました'
      });

    } catch (error: any) {
      console.error('❌ Failed to get user stats:', error);
      res.status(500).json({
        success: false,
        error: 'ユーザー統計情報の取得に失敗しました',
        code: 'USER_STATS_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUT /api/users/:id/status
   * ユーザーステータス更新
   */
  async updateUserStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const statusUpdate: UserStatusUpdateRequest = req.body;
      const updatedBy = req.user!.userId;

      console.log('🔄 PUT /api/users/:id/status - User status update:', userId);

      // 入力検証
      if (statusUpdate.isActive === undefined) {
        res.status(400).json({
          success: false,
          error: 'isActiveフィールドが必要です',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      await this.userService.updateUserStatus(userId, statusUpdate, updatedBy);

      res.json({
        success: true,
        message: `ユーザーステータスを${statusUpdate.isActive ? 'アクティブ' : '非アクティブ'}に変更しました`
      });

    } catch (error: any) {
      console.error('❌ Failed to update user status:', error);
      res.status(500).json({
        success: false,
        error: 'ユーザーステータスの更新に失敗しました',
        code: 'USER_STATUS_UPDATE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/users/export/csv
   * ユーザーデータCSV出力
   */
  async exportUsersCSV(req: Request, res: Response): Promise<void> {
    try {
      console.log('📄 GET /api/users/export/csv - CSV export request');

      // クエリパラメータからフィルター条件を取得
      const searchParams: UserSearchRequest = {
        query: req.query.query as string,
        role: req.query.role ? (Array.isArray(req.query.role) ? req.query.role as string[] : [req.query.role as string]) : undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        department: req.query.department as string,
        gmailConnected: req.query.gmailConnected ? req.query.gmailConnected === 'true' : undefined
      };

      const users = await this.userService.getUsersForExport(searchParams);

      // CSV形式に変換
      const csvHeader = 'ID,名前,メールアドレス,ユーザー名,役割,ステータス,部署,電話番号,Gmail連携,最終ログイン,作成日時';
      const csvRows = users.map(user => [
        user.id,
        `"${user.fullName}"`,
        user.email,
        user.username,
        user.role,
        user.isActive ? 'アクティブ' : '非アクティブ',
        user.department || '',
        user.phoneNumber || '',
        user.gmailPersonalConnected ? '連携済み' : '未連携',
        user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ja-JP') : '',
        new Date(user.createdAt).toLocaleString('ja-JP')
      ].join(','));

      const csvContent = [csvHeader, ...csvRows].join('\n');

      // CSVファイルとしてダウンロード
      const filename = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\uFEFF' + csvContent); // UTF-8 BOM付き

    } catch (error: any) {
      console.error('❌ Failed to export users CSV:', error);
      res.status(500).json({
        success: false,
        error: 'CSV出力に失敗しました',
        code: 'CSV_EXPORT_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * ユーザー作成データの検証
   */
  private validateUserCreateData(userData: UserCreate): string | null {
    if (!userData.email || !this.isValidEmail(userData.email)) {
      return '有効なメールアドレスを入力してください';
    }

    if (!userData.username || userData.username.length < 3) {
      return 'ユーザー名は3文字以上で入力してください';
    }

    if (!userData.fullName || userData.fullName.length < 1) {
      return 'フルネームを入力してください';
    }

    if (!userData.password || userData.password.length < 8) {
      return 'パスワードは8文字以上で入力してください';
    }

    if (!userData.role) {
      return '役割を選択してください';
    }

    return null;
  }

  /**
   * ユーザー更新データの検証
   */
  private validateUserUpdateData(updateData: UserUpdate): string | null {
    if (updateData.email && !this.isValidEmail(updateData.email)) {
      return '有効なメールアドレスを入力してください';
    }

    if (updateData.username && updateData.username.length < 3) {
      return 'ユーザー名は3文字以上で入力してください';
    }

    if (updateData.fullName !== undefined && updateData.fullName.length < 1) {
      return 'フルネームを入力してください';
    }

    if (updateData.password && updateData.password.length < 8) {
      return 'パスワードは8文字以上で入力してください';
    }

    return null;
  }

  /**
   * メールアドレスの妥当性検証
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// サービスインスタンスを注入してコントローラーを作成
export function createUserController(userService: UserService): UserController {
  return new UserController(userService);
}