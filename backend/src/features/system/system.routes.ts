/**
 * システムダッシュボード機能 - ルート定義
 * P-004 システムダッシュボードページのRESTful APIエンドポイント
 */

import { Router } from 'express';
import { systemService } from './system.service.js';
import { createSystemController } from './system.controller.js';
import { requireAuth, requireUpperRole } from '../auth/auth.middleware.js';
import { AuthService } from '../auth/auth.service.js';
import { API_PATHS } from '../../types/index.js';

// システムコントローラーのインスタンス作成
const systemController = createSystemController(systemService);

/**
 * システムルート作成関数
 * AuthService インスタンスを受け取って認証ミドルウェアを設定
 */
export function createSystemRoutes(authService: AuthService): Router {
  const router = Router();

/**
 * システム管理APIルート設定
 * 
 * 認証・認可要件:
 * - 全てのエンドポイントで認証が必要
 * - システム管理操作は上位権限（COMPANY_LEADER, MANAGER, TEAM_LEADER）のみ
 * - 一部の診断機能はCOMPANY_LEADERのみ
 */

// ====== パブリックヘルスチェック ======
/**
 * GET /api/system/health
 * システムヘルスチェック（認証不要）
 * 注意: API_PATHSで公開エンドポイントとして定義済み
 */
router.get('/health', 
  (req, res) => systemController.performHealthCheck(req, res)
);

// ====== システム統計情報 ======
/**
 * GET /api/system/stats
 * システム統計情報取得
 */
router.get('/stats',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => systemController.getSystemStats(req, res)
);

// ====== パフォーマンス監視 ======
/**
 * GET /api/system/performance
 * 現在のシステムパフォーマンス取得
 */
router.get('/performance',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => systemController.getCurrentPerformance(req, res)
);

/**
 * GET /api/system/performance/history
 * システムパフォーマンス履歴取得
 */
router.get('/performance/history',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => systemController.getPerformanceHistory(req, res)
);

// ====== アラート管理 ======
/**
 * GET /api/system/alerts
 * システムアラート一覧取得
 */
router.get('/alerts',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => systemController.getAlerts(req, res)
);

/**
 * POST /api/system/alerts
 * システムアラート作成（管理者用）
 */
router.post('/alerts',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => systemController.createAlert(req, res)
);

/**
 * PUT /api/system/alerts/:id/read
 * アラート既読化
 */
router.put('/alerts/:id/read',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => systemController.markAlertAsRead(req, res)
);

/**
 * PUT /api/system/alerts/read-all
 * 全アラート既読化
 */
router.put('/alerts/read-all',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => systemController.markAllAlertsAsRead(req, res)
);

// ====== 部門別利用状況 ======
/**
 * GET /api/system/department-usage
 * 部門別利用状況取得
 */
router.get('/department-usage',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => systemController.getDepartmentUsage(req, res)
);

// ====== システム診断 ======
/**
 * POST /api/system/diagnostics
 * システム自動診断実行
 */
router.post('/diagnostics',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => systemController.runSystemDiagnostics(req, res)
);

// ====== システム設定管理 ======
/**
 * GET /api/system/settings/:key
 * システム設定取得
 */
router.get('/settings/:key',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => systemController.getSetting(req, res)
);

/**
 * PUT /api/system/settings/:key
 * システム設定保存
 */
router.put('/settings/:key',
  requireAuth(authService),
  requireUpperRole(),
  (req, res) => systemController.saveSetting(req, res)
);

// ====== 将来実装予定 ======
/**
 * POST /api/system/backup
 * システムバックアップ実行（COMPANY_LEADERのみ）
 * TODO: バックアップ機能実装時に追加
 */
router.post('/backup',
  requireAuth(authService),
  requireUpperRole(), // TODO: COMPANY_LEADERのみに変更
  async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'バックアップ機能は実装予定です'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'バックアップ機能の実行に失敗しました',
        code: 'BACKUP_ERROR'
      });
    }
  }
);

/**
 * POST /api/system/restore
 * システム復元実行（COMPANY_LEADERのみ）
 * TODO: 復元機能実装時に追加
 */
router.post('/restore',
  requireAuth(authService),
  requireUpperRole(), // TODO: COMPANY_LEADERのみに変更
  async (req, res) => {
    try {
      res.json({
        success: true,
        message: '復元機能は実装予定です'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: '復元機能の実行に失敗しました',
        code: 'RESTORE_ERROR'
      });
    }
  }
);

/**
 * GET /api/system/audit-logs
 * システム監査ログ取得
 * TODO: 監査ログ機能実装時に追加
 */
router.get('/audit-logs',
  requireAuth(authService),
  requireUpperRole(),
  async (req, res) => {
    try {
      res.json({
        success: true,
        data: [],
        message: '監査ログ機能は実装予定です'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: '監査ログの取得に失敗しました',
        code: 'AUDIT_LOGS_ERROR'
      });
    }
  }
);

  // ルーターを返す
  return router;
}

// デフォルトエクスポート（互換性のため）
export default createSystemRoutes;

// API_PATHS 型定義との整合性チェック用コメント
/**
 * 実装済みエンドポイント（API_PATHS.SYSTEMとの対応）:
 * ✅ STATS: '/api/system/stats' -> GET /stats
 * ✅ ALERTS: '/api/system/alerts' -> GET /alerts, POST /alerts
 * ✅ PERFORMANCE: '/api/system/performance' -> GET /performance, GET /performance/history
 * ✅ HEALTH: '/api/system/health' -> GET /health
 * ✅ DEPARTMENT_USAGE: '/api/system/department-usage' -> GET /department-usage
 * ✅ ALERT_READ: (alertId) => `/api/system/alerts/${alertId}/read` -> PUT /alerts/:id/read
 * ✅ ALERTS_READ_ALL: '/api/system/alerts/read-all' -> PUT /alerts/read-all
 * ✅ SETTINGS: '/api/system/settings' -> GET/PUT /settings/:key
 * 🔄 AUDIT_LOGS: '/api/system/audit-logs' -> TODO: 監査ログ機能
 * 🔄 BACKUP: '/api/system/backup' -> TODO: バックアップ機能
 * 🔄 RESTORE: '/api/system/restore' -> TODO: 復元機能
 * ➕ DIAGNOSTICS: '/api/system/diagnostics' -> POST /diagnostics（追加機能）
 */