/**
 * システムダッシュボード API サービス
 * P-004 システムダッシュボードページの実API連携
 */

import { 
  SystemStats, 
  SystemAlert, 
  SystemAlertType, 
  SystemPerformance,
  ApiResponse,
  API_PATHS 
} from '../../types/index';

export class SystemApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  }

  /**
   * APIリクエストのベースメソッド
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // アクセストークンがある場合は認証ヘッダーを追加
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${accessToken}`,
      };
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(error.error || `API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * システム統計情報取得
   * GET /api/system/stats
   */
  async getSystemStats(): Promise<SystemStats> {
    const response = await this.apiRequest<ApiResponse<SystemStats>>(API_PATHS.SYSTEM.STATS);
    return response.data!;
  }

  /**
   * システムアラート一覧取得
   * GET /api/system/alerts
   */
  async getAlerts(limit = 50, onlyUnread = false): Promise<SystemAlert[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      onlyUnread: onlyUnread.toString()
    });
    
    const response = await this.apiRequest<ApiResponse<SystemAlert[]>>(
      `${API_PATHS.SYSTEM.ALERTS}?${params}`
    );
    return response.data!;
  }

  /**
   * アラート既読化
   * PUT /api/system/alerts/:id/read
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    const response = await this.apiRequest<ApiResponse<void>>(
      API_PATHS.SYSTEM.ALERT_READ(alertId),
      { method: 'PUT' }
    );
    if (!response.success) {
      throw new Error(response.error || 'アラートの既読化に失敗しました');
    }
  }

  /**
   * 全アラート既読化
   * PUT /api/system/alerts/read-all
   */
  async markAllAlertsAsRead(): Promise<{ count: number }> {
    const response = await this.apiRequest<ApiResponse<{ count: number }>>(
      API_PATHS.SYSTEM.ALERTS_READ_ALL,
      { method: 'PUT' }
    );
    return response.data!;
  }

  /**
   * 現在のシステムパフォーマンス取得
   * GET /api/system/performance
   */
  async getCurrentPerformance(): Promise<SystemPerformance> {
    const response = await this.apiRequest<ApiResponse<SystemPerformance>>(
      API_PATHS.SYSTEM.PERFORMANCE
    );
    return response.data!;
  }

  /**
   * システムパフォーマンス履歴取得
   * GET /api/system/performance/history
   */
  async getPerformanceHistory(hours = 24): Promise<SystemPerformance[]> {
    const params = new URLSearchParams({
      hours: hours.toString()
    });

    const response = await this.apiRequest<ApiResponse<SystemPerformance[]>>(
      `${API_PATHS.SYSTEM.PERFORMANCE}/history?${params}`
    );
    return response.data!;
  }

  /**
   * システムヘルスチェック
   * GET /api/system/health
   */
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      database: boolean;
      api: boolean;
      timestamp: string;
    };
  }> {
    const response = await this.apiRequest<ApiResponse<{
      status: 'healthy' | 'unhealthy';
      details: {
        database: boolean;
        api: boolean;
        timestamp: string;
      };
    }>>(API_PATHS.SYSTEM.HEALTH);
    return response.data!;
  }

  /**
   * 部門別利用状況取得
   * GET /api/system/department-usage  
   */
  async getDepartmentUsage(): Promise<{
    department: string;
    userCount: number;
    activeUserCount: number;
    todoCount: number;
    completedTodoCount: number;
  }[]> {
    const response = await this.apiRequest<ApiResponse<{
      department: string;
      userCount: number;
      activeUserCount: number;
      todoCount: number;
      completedTodoCount: number;
    }[]>>(API_PATHS.SYSTEM.DEPARTMENT_USAGE);
    return response.data!;
  }

  /**
   * システムアラート作成（管理者用）
   * POST /api/system/alerts
   */
  async createAlert(
    type: SystemAlertType,
    title: string,
    message: string,
    actionRequired = false
  ): Promise<SystemAlert> {
    const response = await this.apiRequest<ApiResponse<SystemAlert>>(
      API_PATHS.SYSTEM.ALERTS,
      {
        method: 'POST',
        body: JSON.stringify({
          type,
          title,
          message,
          actionRequired
        })
      }
    );
    return response.data!;
  }

  /**
   * システム自動診断実行
   * POST /api/system/diagnostics
   */
  async runSystemDiagnostics(): Promise<{
    overallHealth: 'good' | 'warning' | 'critical';
    checks: {
      name: string;
      status: 'pass' | 'warning' | 'fail';
      message: string;
      duration?: number;
    }[];
    runAt: string;
  }> {
    const response = await this.apiRequest<ApiResponse<{
      overallHealth: 'good' | 'warning' | 'critical';
      checks: {
        name: string;
        status: 'pass' | 'warning' | 'fail';
        message: string;
        duration?: number;
      }[];
      runAt: string;
    }>>('/api/system/diagnostics', { method: 'POST' });
    return response.data!;
  }

  /**
   * システム設定取得
   * GET /api/system/settings/:key
   */
  async getSetting(key: string): Promise<{ key: string; value: string }> {
    const response = await this.apiRequest<ApiResponse<{ key: string; value: string }>>(
      `${API_PATHS.SYSTEM.SETTINGS}/${key}`
    );
    return response.data!;
  }

  /**
   * システム設定保存
   * PUT /api/system/settings/:key
   */
  async saveSetting(key: string, value: string): Promise<void> {
    const response = await this.apiRequest<ApiResponse<void>>(
      `${API_PATHS.SYSTEM.SETTINGS}/${key}`,
      {
        method: 'PUT',
        body: JSON.stringify({ value })
      }
    );
    if (!response.success) {
      throw new Error(response.error || 'システム設定の保存に失敗しました');
    }
  }
}

// シングルトンインスタンス
export const systemApiService = new SystemApiService();