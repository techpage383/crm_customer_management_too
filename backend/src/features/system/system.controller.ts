/**
 * システムダッシュボード機能 - コントローラー層
 * P-004 システムダッシュボードページのRESTfulコントローラー
 */

import { Request, Response } from 'express';
import { SystemService } from './system.service.js';
import { SystemAlertType } from '../../types/index.js';
import { AuthRequest } from '../auth/auth.middleware.js';

export class SystemController {
  constructor(private systemService: SystemService) {}

  /**
   * GET /api/system/stats
   * システム統計情報取得
   */
  async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 GET /api/system/stats - System statistics request');

      const stats = await this.systemService.getSystemStats();

      res.json({
        success: true,
        data: stats,
        message: 'システム統計情報を取得しました'
      });

    } catch (error: any) {
      console.error('❌ Failed to get system stats:', error);
      res.status(500).json({
        success: false,
        error: 'システム統計情報の取得に失敗しました',
        code: 'SYSTEM_STATS_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/system/alerts
   * システムアラート一覧取得
   */
  async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      console.log('🚨 GET /api/system/alerts - System alerts request');

      const limit = parseInt(req.query.limit as string) || 50;
      const onlyUnread = req.query.onlyUnread === 'true';

      // 制限値チェック
      if (limit > 200) {
        res.status(400).json({
          success: false,
          error: 'limit は200以下で指定してください',
          code: 'INVALID_LIMIT'
        });
        return;
      }

      const alerts = await this.systemService.getAlerts(limit, onlyUnread);

      res.json({
        success: true,
        data: alerts,
        message: `${alerts.length}件のアラートを取得しました`
      });

    } catch (error: any) {
      console.error('❌ Failed to get alerts:', error);
      res.status(500).json({
        success: false,
        error: 'アラート一覧の取得に失敗しました',
        code: 'SYSTEM_ALERTS_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUT /api/system/alerts/:id/read
   * アラート既読化
   */
  async markAlertAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const alertId = req.params.id;
      const markedBy = req.user!.userId;

      console.log(`👁️ PUT /api/system/alerts/${alertId}/read - Mark alert as read`);

      await this.systemService.markAlertAsRead(alertId, markedBy);

      res.json({
        success: true,
        message: 'アラートを既読にしました'
      });

    } catch (error: any) {
      console.error('❌ Failed to mark alert as read:', error);

      if (error.message.includes('見つからない') || error.message.includes('既読')) {
        res.status(404).json({
          success: false,
          error: error.message,
          code: 'ALERT_NOT_FOUND_OR_READ'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'アラートの既読化に失敗しました',
        code: 'ALERT_READ_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUT /api/system/alerts/read-all
   * 全アラート既読化
   */
  async markAllAlertsAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const markedBy = req.user!.userId;

      console.log('👁️ PUT /api/system/alerts/read-all - Mark all alerts as read');

      const count = await this.systemService.markAllAlertsAsRead(markedBy);

      res.json({
        success: true,
        data: { count },
        message: `${count}件のアラートを既読にしました`
      });

    } catch (error: any) {
      console.error('❌ Failed to mark all alerts as read:', error);
      res.status(500).json({
        success: false,
        error: '全アラートの既読化に失敗しました',
        code: 'ALERTS_READ_ALL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/system/performance
   * 現在のシステムパフォーマンス取得
   */
  async getCurrentPerformance(req: Request, res: Response): Promise<void> {
    try {
      console.log('⚡ GET /api/system/performance - Current performance request');

      const performance = await this.systemService.getCurrentPerformance();

      res.json({
        success: true,
        data: performance,
        message: 'システムパフォーマンス情報を取得しました'
      });

    } catch (error: any) {
      console.error('❌ Failed to get current performance:', error);
      res.status(500).json({
        success: false,
        error: 'パフォーマンス情報の取得に失敗しました',
        code: 'SYSTEM_PERFORMANCE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/system/performance/history
   * システムパフォーマンス履歴取得
   */
  async getPerformanceHistory(req: Request, res: Response): Promise<void> {
    try {
      console.log('📈 GET /api/system/performance/history - Performance history request');

      const hours = parseInt(req.query.hours as string) || 24;

      // 時間制限チェック
      if (hours > 168) { // 最大1週間
        res.status(400).json({
          success: false,
          error: 'hours は168（1週間）以下で指定してください',
          code: 'INVALID_HOURS'
        });
        return;
      }

      const history = await this.systemService.getPerformanceHistory(hours);

      res.json({
        success: true,
        data: history,
        message: `${hours}時間のパフォーマンス履歴を取得しました`
      });

    } catch (error: any) {
      console.error('❌ Failed to get performance history:', error);
      res.status(500).json({
        success: false,
        error: 'パフォーマンス履歴の取得に失敗しました',
        code: 'PERFORMANCE_HISTORY_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/system/health
   * システムヘルスチェック
   */
  async performHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      console.log('🏥 GET /api/system/health - Health check request');

      const healthResult = await this.systemService.performHealthCheck();

      const statusCode = healthResult.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        success: healthResult.status === 'healthy',
        data: healthResult,
        message: healthResult.status === 'healthy' 
          ? 'システムは正常に動作しています' 
          : 'システムに問題が発生しています'
      });

    } catch (error: any) {
      console.error('❌ Failed to perform health check:', error);
      res.status(503).json({
        success: false,
        error: 'ヘルスチェックに失敗しました',
        code: 'HEALTH_CHECK_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/system/department-usage
   * 部門別利用状況取得
   */
  async getDepartmentUsage(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 GET /api/system/department-usage - Department usage request');

      const departmentUsage = await this.systemService.getDepartmentUsage();

      res.json({
        success: true,
        data: departmentUsage,
        message: '部門別利用状況を取得しました'
      });

    } catch (error: any) {
      console.error('❌ Failed to get department usage:', error);
      res.status(500).json({
        success: false,
        error: '部門別利用状況の取得に失敗しました',
        code: 'DEPARTMENT_USAGE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /api/system/alerts
   * システムアラート作成（管理者用）
   */
  async createAlert(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('🚨 POST /api/system/alerts - Create alert request');

      const { type, title, message, actionRequired } = req.body;
      const createdBy = req.user!.userId;

      // 入力検証
      if (!type || !title || !message) {
        res.status(400).json({
          success: false,
          error: 'type, title, message は必須です',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      if (!Object.values(SystemAlertType).includes(type)) {
        res.status(400).json({
          success: false,
          error: '無効なアラートタイプです',
          code: 'INVALID_ALERT_TYPE'
        });
        return;
      }

      const alert = await this.systemService.createAlert(
        type,
        title,
        message,
        actionRequired || false,
        createdBy
      );

      res.status(201).json({
        success: true,
        data: alert,
        message: 'システムアラートを作成しました'
      });

    } catch (error: any) {
      console.error('❌ Failed to create alert:', error);
      res.status(500).json({
        success: false,
        error: 'アラートの作成に失敗しました',
        code: 'ALERT_CREATE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /api/system/diagnostics
   * システム自動診断実行
   */
  async runSystemDiagnostics(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 POST /api/system/diagnostics - System diagnostics request');

      const diagnostics = await this.systemService.runSystemDiagnostics();

      res.json({
        success: true,
        data: diagnostics,
        message: 'システム診断を実行しました'
      });

    } catch (error: any) {
      console.error('❌ Failed to run system diagnostics:', error);
      res.status(500).json({
        success: false,
        error: 'システム診断の実行に失敗しました',
        code: 'SYSTEM_DIAGNOSTICS_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/system/settings/:key
   * システム設定取得
   */
  async getSetting(req: Request, res: Response): Promise<void> {
    try {
      const key = req.params.key;

      console.log(`⚙️ GET /api/system/settings/${key} - Get setting request`);

      const value = await this.systemService.getSetting(key);

      if (value === null) {
        res.status(404).json({
          success: false,
          error: '設定が見つかりません',
          code: 'SETTING_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: { key, value },
        message: 'システム設定を取得しました'
      });

    } catch (error: any) {
      console.error('❌ Failed to get setting:', error);
      res.status(500).json({
        success: false,
        error: 'システム設定の取得に失敗しました',
        code: 'SETTING_GET_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUT /api/system/settings/:key
   * システム設定保存
   */
  async saveSetting(req: AuthRequest, res: Response): Promise<void> {
    try {
      const key = req.params.key;
      const { value } = req.body;
      const updatedBy = req.user!.userId;

      console.log(`⚙️ PUT /api/system/settings/${key} - Save setting request`);

      // 入力検証
      if (value === undefined) {
        res.status(400).json({
          success: false,
          error: 'value は必須です',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      await this.systemService.saveSetting(key, value.toString(), updatedBy);

      res.json({
        success: true,
        message: 'システム設定を保存しました'
      });

    } catch (error: any) {
      console.error('❌ Failed to save setting:', error);
      res.status(500).json({
        success: false,
        error: 'システム設定の保存に失敗しました',
        code: 'SETTING_SAVE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

// サービスインスタンスを注入してコントローラーを作成
export function createSystemController(systemService: SystemService): SystemController {
  return new SystemController(systemService);
}