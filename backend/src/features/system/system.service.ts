/**
 * システムダッシュボード機能 - サービス層
 * P-004 システムダッシュボードページのビジネスロジック
 */

import { 
  SystemStats, 
  SystemAlert, 
  SystemAlertType,
  SystemPerformance,
  ID 
} from '../../types/index.js';
import { SystemModel } from './system.model.js';
// import { auditLogger } from '../../common/utils/audit.js';
// 監査ログは将来実装予定
const auditLogger = {
  log: async (action: string, data: any) => {
    console.log(`📝 監査ログ: ${action}`, data);
  }
};

export class SystemService {

  /**
   * システム統計情報取得
   */
  async getSystemStats(): Promise<SystemStats> {
    console.log('📊 Getting system statistics');

    try {
      const stats = await SystemModel.getSystemStats();
      
      // 統計情報取得の監査ログ
      await auditLogger.log('SYSTEM_STATS_ACCESSED', {
        timestamp: new Date(),
        stats: {
          totalUsers: stats.totalUsers,
          totalCompanies: stats.totalCompanies,
          systemUptime: stats.systemUptime
        }
      });

      console.log('✅ System statistics retrieved successfully');
      return stats;
      
    } catch (error) {
      console.error('❌ Failed to get system statistics:', error);
      
      // エラーアラート作成
      await this.createAlert(
        SystemAlertType.ERROR,
        'システム統計取得エラー',
        `システム統計情報の取得に失敗しました: ${error.message}`,
        true
      );
      
      throw error;
    }
  }

  /**
   * システムアラート作成
   */
  async createAlert(
    type: SystemAlertType, 
    title: string, 
    message: string, 
    actionRequired: boolean = false,
    createdBy?: ID
  ): Promise<SystemAlert> {
    console.log(`🚨 Creating system alert: ${type} - ${title}`);

    try {
      const alert = await SystemModel.createAlert(type, title, message, actionRequired);
      
      // アラート作成の監査ログ
      await auditLogger.log('SYSTEM_ALERT_CREATED', {
        alertId: alert.id,
        type: alert.type,
        title: alert.title,
        actionRequired: alert.actionRequired,
        createdBy
      });

      console.log(`✅ System alert created: ${alert.id}`);
      return alert;
      
    } catch (error) {
      console.error('❌ Failed to create system alert:', error);
      throw error;
    }
  }

  /**
   * システムアラート一覧取得
   */
  async getAlerts(limit: number = 50, onlyUnread: boolean = false): Promise<SystemAlert[]> {
    console.log(`📋 Getting system alerts: limit=${limit}, onlyUnread=${onlyUnread}`);

    try {
      const alerts = await SystemModel.getAlerts(limit, onlyUnread);
      
      console.log(`✅ Retrieved ${alerts.length} system alerts`);
      return alerts;
      
    } catch (error) {
      console.error('❌ Failed to get system alerts:', error);
      throw error;
    }
  }

  /**
   * アラート既読化
   */
  async markAlertAsRead(alertId: ID, markedBy: ID): Promise<void> {
    console.log(`👁️ Marking alert as read: ${alertId}`);

    try {
      const success = await SystemModel.markAlertAsRead(alertId);
      
      if (!success) {
        throw new Error('アラートが見つからないか、既に既読になっています');
      }
      
      // アラート既読化の監査ログ
      await auditLogger.log('SYSTEM_ALERT_READ', {
        alertId,
        markedBy
      });

      console.log(`✅ Alert marked as read: ${alertId}`);
      
    } catch (error) {
      console.error(`❌ Failed to mark alert as read: ${alertId}`, error);
      throw error;
    }
  }

  /**
   * 全アラート既読化
   */
  async markAllAlertsAsRead(markedBy: ID): Promise<number> {
    console.log('👁️ Marking all alerts as read');

    try {
      const count = await SystemModel.markAllAlertsAsRead();
      
      // 全アラート既読化の監査ログ
      await auditLogger.log('SYSTEM_ALERTS_ALL_READ', {
        count,
        markedBy
      });

      console.log(`✅ ${count} alerts marked as read`);
      return count;
      
    } catch (error) {
      console.error('❌ Failed to mark all alerts as read:', error);
      throw error;
    }
  }

  /**
   * システムパフォーマンス情報取得
   */
  async getCurrentPerformance(): Promise<SystemPerformance> {
    console.log('⚡ Getting current system performance');

    try {
      const performance = await SystemModel.getCurrentPerformance();
      
      // パフォーマンス記録（履歴保存）
      await SystemModel.recordPerformance({
        cpuUsage: performance.cpuUsage,
        memoryUsage: performance.memoryUsage,
        activeConnections: performance.activeConnections,
        apiResponseTime: performance.apiResponseTime
      });

      // パフォーマンス警告チェック
      await this.checkPerformanceThresholds(performance);

      console.log('✅ Current performance retrieved');
      return performance;
      
    } catch (error) {
      console.error('❌ Failed to get current performance:', error);
      
      // パフォーマンス取得エラーアラート
      await this.createAlert(
        SystemAlertType.ERROR,
        'パフォーマンス取得エラー',
        `システムパフォーマンス情報の取得に失敗しました: ${error.message}`,
        true
      );
      
      throw error;
    }
  }

  /**
   * システムパフォーマンス履歴取得
   */
  async getPerformanceHistory(hours: number = 24): Promise<SystemPerformance[]> {
    console.log(`📈 Getting performance history: ${hours} hours`);

    try {
      const history = await SystemModel.getPerformanceHistory(hours);
      
      console.log(`✅ Retrieved ${history.length} performance records`);
      return history;
      
    } catch (error) {
      console.error('❌ Failed to get performance history:', error);
      throw error;
    }
  }

  /**
   * システムヘルスチェック
   */
  async performHealthCheck(): Promise<{ status: string; details: any }> {
    console.log('🏥 Performing system health check');

    try {
      const healthResult = await SystemModel.healthCheck();
      
      // ヘルスチェックの監査ログ
      await auditLogger.log('SYSTEM_HEALTH_CHECK', {
        status: healthResult.status,
        timestamp: new Date()
      });

      // ヘルスチェック結果に応じたアラート作成
      if (healthResult.status === 'unhealthy') {
        await this.createAlert(
          SystemAlertType.ERROR,
          'システムヘルスチェック失敗',
          `システムが正常に動作していません: ${JSON.stringify(healthResult.details)}`,
          true
        );
      }

      console.log(`✅ Health check completed: ${healthResult.status}`);
      return healthResult;
      
    } catch (error) {
      console.error('❌ Failed to perform health check:', error);
      
      // ヘルスチェックエラーアラート
      await this.createAlert(
        SystemAlertType.ERROR,
        'ヘルスチェックエラー',
        `システムヘルスチェックに失敗しました: ${error.message}`,
        true
      );
      
      throw error;
    }
  }

  /**
   * システム設定保存
   */
  async saveSetting(key: string, value: string, updatedBy: ID): Promise<void> {
    console.log(`⚙️ Saving system setting: ${key}`);

    try {
      await SystemModel.saveSetting(key, value, updatedBy);
      
      // 設定変更の監査ログ
      await auditLogger.log('SYSTEM_SETTING_UPDATED', {
        key,
        value: key.includes('password') || key.includes('secret') ? '[HIDDEN]' : value,
        updatedBy
      });

      // 設定変更アラート（重要な設定の場合）
      const criticalSettings = ['backup', 'security', 'database', 'gmail'];
      if (criticalSettings.some(critical => key.toLowerCase().includes(critical))) {
        await this.createAlert(
          SystemAlertType.INFO,
          'システム設定変更',
          `重要なシステム設定が変更されました: ${key}`,
          false,
          updatedBy
        );
      }

      console.log(`✅ System setting saved: ${key}`);
      
    } catch (error) {
      console.error(`❌ Failed to save system setting: ${key}`, error);
      throw error;
    }
  }

  /**
   * システム設定取得
   */
  async getSetting(key: string): Promise<string | null> {
    console.log(`⚙️ Getting system setting: ${key}`);

    try {
      const value = await SystemModel.getSetting(key);
      
      console.log(`✅ System setting retrieved: ${key}`);
      return value;
      
    } catch (error) {
      console.error(`❌ Failed to get system setting: ${key}`, error);
      throw error;
    }
  }

  /**
   * パフォーマンス閾値チェック（内部メソッド）
   */
  private async checkPerformanceThresholds(performance: SystemPerformance): Promise<void> {
    try {
      // CPU使用率チェック（80%以上で警告）
      if (performance.cpuUsage >= 80) {
        await this.createAlert(
          SystemAlertType.WARNING,
          'CPU使用率高',
          `CPU使用率が${performance.cpuUsage.toFixed(1)}%に達しています`,
          performance.cpuUsage >= 90
        );
      }

      // メモリ使用率チェック（85%以上で警告）
      if (performance.memoryUsage >= 85) {
        await this.createAlert(
          SystemAlertType.WARNING,
          'メモリ使用率高',
          `メモリ使用率が${performance.memoryUsage.toFixed(1)}%に達しています`,
          performance.memoryUsage >= 95
        );
      }

      // API応答時間チェック（2秒以上で警告）
      if (performance.apiResponseTime >= 2000) {
        await this.createAlert(
          SystemAlertType.WARNING,
          'API応答時間遅延',
          `API応答時間が${performance.apiResponseTime.toFixed(0)}msに達しています`,
          performance.apiResponseTime >= 5000
        );
      }

      // アクティブ接続数チェック（50以上で警告）
      if (performance.activeConnections >= 50) {
        await this.createAlert(
          SystemAlertType.WARNING,
          'データベース接続数高',
          `アクティブな接続数が${performance.activeConnections}に達しています`,
          performance.activeConnections >= 80
        );
      }
      
    } catch (error) {
      console.error('パフォーマンス閾値チェックエラー:', error);
      // 閾値チェックのエラーは主要処理を止めない
    }
  }

  /**
   * システム自動診断実行
   */
  async runSystemDiagnostics(): Promise<{
    summary: string;
    issues: string[];
    recommendations: string[];
  }> {
    console.log('🔍 Running system diagnostics');

    try {
      const [stats, performance, alerts] = await Promise.all([
        this.getSystemStats(),
        this.getCurrentPerformance(),
        this.getAlerts(10, true) // 未読アラート10件
      ]);

      const issues: string[] = [];
      const recommendations: string[] = [];

      // 診断ロジック
      if (performance.cpuUsage > 70) {
        issues.push(`CPU使用率が高い: ${performance.cpuUsage.toFixed(1)}%`);
        recommendations.push('システム負荷の確認とプロセス最適化を検討してください');
      }

      if (performance.memoryUsage > 80) {
        issues.push(`メモリ使用率が高い: ${performance.memoryUsage.toFixed(1)}%`);
        recommendations.push('メモリリークの確認とガベージコレクション最適化を検討してください');
      }

      if (performance.apiResponseTime > 1000) {
        issues.push(`API応答時間が遅い: ${performance.apiResponseTime.toFixed(0)}ms`);
        recommendations.push('データベースクエリの最適化とインデックス追加を検討してください');
      }

      if (alerts.length > 5) {
        issues.push(`未読アラートが多い: ${alerts.length}件`);
        recommendations.push('システム管理者による緊急対応が必要です');
      }

      if (stats.systemUptime < 95) {
        issues.push(`システム稼働率が低い: ${stats.systemUptime.toFixed(1)}%`);
        recommendations.push('システム安定性の向上とインフラ強化を検討してください');
      }

      const summary = issues.length === 0 
        ? 'システムは正常に動作しています'
        : `${issues.length}件の問題が検出されました`;

      // 診断結果アラート作成
      if (issues.length > 0) {
        await this.createAlert(
          issues.length >= 3 ? SystemAlertType.ERROR : SystemAlertType.WARNING,
          'システム診断完了',
          `自動診断により${issues.length}件の問題が検出されました`,
          issues.length >= 3
        );
      }

      const result = {
        summary,
        issues,
        recommendations
      };

      console.log('✅ System diagnostics completed');
      return result;
      
    } catch (error) {
      console.error('❌ Failed to run system diagnostics:', error);
      throw error;
    }
  }

  /**
   * 部門別利用状況取得
   */
  async getDepartmentUsage(): Promise<{
    department: string;
    userCount: number;
    activeUsers: number;
    gmailConnections: number;
  }[]> {
    console.log('📊 Getting department usage statistics');

    try {
      // TODO: 実際のクエリは企業・TODO等のテーブル実装後に詳細化
      const mockDepartmentData = [
        {
          department: '営業部',
          userCount: 15,
          activeUsers: 12,
          gmailConnections: 8
        },
        {
          department: '開発部',
          userCount: 20,
          activeUsers: 18,
          gmailConnections: 15
        },
        {
          department: '管理部',
          userCount: 8,
          activeUsers: 6,
          gmailConnections: 4
        }
      ];

      console.log('✅ Department usage statistics retrieved');
      return mockDepartmentData;
      
    } catch (error) {
      console.error('❌ Failed to get department usage:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const systemService = new SystemService();