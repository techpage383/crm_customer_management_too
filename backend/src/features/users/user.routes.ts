/**
 * ユーザー管理機能 - ルート定義
 * P-010 ユーザー管理ページのRESTful APIエンドポイント
 */

import { Router } from 'express';
import { userService } from './user.service.js';
import { createUserController } from './user.controller.js';
import { requireAuth, requireUpperRole } from '../auth/auth.middleware.js';
import { AuthService } from '../auth/auth.service.js';
import { API_PATHS } from '../../types/index.js';

// ユーザーコントローラーのインスタンス作成
const userController = createUserController(userService);

/**
 * ユーザールート作成関数
 * AuthService インスタンスを受け取って認証ミドルウェアを設定
 */
export function createUserRoutes(authService: AuthService): Router {
  const router = Router();

/**
 * ユーザー管理APIルート設定
 * 
 * 認証・認可要件:
 * - 全てのエンドポイントで認証が必要
 * - ユーザー管理操作は上位権限（COMPANY_LEADER, MANAGER, TEAM_LEADER）のみ
 */

// ====== ユーザー統計情報 ======
/**
 * GET /api/users/stats
 * ユーザー統計情報取得
 */
router.get('/stats', 
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => userController.getUserStats(req, res)
);

// ====== ユーザーエクスポート ======
/**
 * GET /api/users/export/csv
 * ユーザーデータCSV出力
 */
router.get('/export/csv',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => userController.exportUsersCSV(req, res)
);

// ====== ユーザー検索 ======
/**
 * GET /api/users/search (queryパラメータ)
 * POST /api/users/search (POSTボディでの詳細検索)
 * ユーザー検索・フィルタリング
 */
router.get('/search',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => userController.getUsers(req, res)
);

router.post('/search',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => userController.searchUsers(req, res)
);

// ====== 一括操作 ======
/**
 * PUT /api/users/bulk
 * 一括ユーザー更新
 */
router.put('/bulk',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => userController.bulkUpdateUsers(req, res)
);

// ====== 個別ユーザー操作 ======
/**
 * GET /api/users
 * ユーザー一覧取得（ページネーション対応）
 */
router.get('/',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => userController.getUsers(req, res)
);

/**
 * POST /api/users
 * 新規ユーザー作成
 */
router.post('/',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => userController.createUser(req, res)
);

/**
 * GET /api/users/:id
 * ユーザー詳細取得
 */
router.get('/:id',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => userController.getUserById(req, res)
);

/**
 * PUT /api/users/:id
 * ユーザー情報更新
 */
router.put('/:id',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => userController.updateUser(req, res)
);

/**
 * DELETE /api/users/:id
 * ユーザー削除（ソフトデリート）
 */
router.delete('/:id',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => userController.deleteUser(req, res)
);

/**
 * PUT /api/users/:id/status
 * ユーザーステータス更新（アクティブ/非アクティブ切り替え）
 */
router.put('/:id/status',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => userController.updateUserStatus(req, res)
);

// ====== 個別ユーザープロファイル操作 ======
/**
 * GET /api/users/:id/profile
 * ユーザープロファイル詳細取得
 * 注意: 型定義のAPI_PATHSにマッピングされています
 */
router.get('/:id/profile',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => userController.getUserById(req, res)
);

/**
 * PUT /api/users/:id/password
 * ユーザーパスワード変更
 * 注意: 型定義のAPI_PATHSにマッピングされています
 */
router.put('/:id/password',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => {
    // パスワード変更は通常のユーザー更新APIを使用
    req.body = { password: req.body.password };
    userController.updateUser(req, res);
  }
);

/**
 * GET /api/users/:id/activity
 * ユーザー活動ログ取得
 * 注意: 型定義のAPI_PATHSにマッピングされています
 * TODO: UserModelのgetActivityLogsメソッドと連携する専用エンドポイントを実装
 */
router.get('/:id/activity',
  requireAuth(authService),
  requireUpperRole(),
  async (req, res) => {
    try {
      // TODO: 実装予定 - ユーザー活動ログ取得
      res.json({
        success: true,
        data: [],
        message: 'ユーザー活動ログ取得機能は実装予定です'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'ユーザー活動ログの取得に失敗しました',
        code: 'USER_ACTIVITY_ERROR'
      });
    }
  }
);

/**
 * GET /api/users/:id/permissions
 * ユーザー権限情報取得
 * 注意: 型定義のAPI_PATHSにマッピングされています
 * TODO: ロールベースの権限チェック機能を実装
 */
router.get('/:id/permissions',
  requireAuth(authService),
  requireUpperRole(),
  async (req, res) => {
    try {
      // TODO: 実装予定 - ユーザー権限情報取得
      res.json({
        success: true,
        data: {
          canManageUsers: false,
          canManageCompanies: false,
          canManageContracts: false,
          canAccessReports: false,
          canExportData: false,
          canImportData: false,
          canManageSystem: false,
          canViewAuditLogs: false
        },
        message: 'ユーザー権限情報取得機能は実装予定です'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'ユーザー権限情報の取得に失敗しました',
        code: 'USER_PERMISSIONS_ERROR'
      });
    }
  }
);

  // ルーターを返す
  return router;
}

// デフォルトエクスポート（互換性のため）
export default createUserRoutes;

// API_PATHS 型定義との整合性チェック用コメント
/**
 * 実装済みエンドポイント（API_PATHS.USERSとの対応）:
 * ✅ BASE: '/api/users' -> GET / (一覧取得)
 * ✅ BASE: '/api/users' -> POST / (作成)
 * ✅ DETAIL: (userId) => `/api/users/${userId}` -> GET /:id (詳細取得)
 * ✅ DETAIL: (userId) => `/api/users/${userId}` -> PUT /:id (更新)
 * ✅ DETAIL: (userId) => `/api/users/${userId}` -> DELETE /:id (削除)
 * ✅ PROFILE: (userId) => `/api/users/${userId}/profile` -> GET /:id/profile
 * ✅ CHANGE_PASSWORD: (userId) => `/api/users/${userId}/password` -> PUT /:id/password
 * 🔄 GMAIL_CONNECT: (userId) => `/api/users/${userId}/gmail/connect` -> TODO: Gmail連携機能
 * 🔄 GMAIL_DISCONNECT: (userId) => `/api/users/${userId}/gmail/disconnect` -> TODO: Gmail連携機能
 * ✅ SEARCH: '/api/users/search' -> GET/POST /search
 * ✅ BULK_UPDATE: '/api/users/bulk' -> PUT /bulk
 * ✅ EXPORT_CSV: '/api/users/export/csv' -> GET /export/csv
 * 🔄 ACTIVITY_LOG: (userId) => `/api/users/${userId}/activity` -> TODO: 活動ログ機能
 * 🔄 PERMISSIONS: (userId) => `/api/users/${userId}/permissions` -> TODO: 権限管理機能
 * ✅ STATUS: (userId) => `/api/users/${userId}/status` -> PUT /:id/status
 * ✅ STATS: '/api/users/stats' -> GET /stats
 */