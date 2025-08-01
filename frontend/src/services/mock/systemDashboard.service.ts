import { 
  SystemStats,
  SystemAlert,
  SystemPerformance,
  ApiResponse
} from '../../types';
import { 
  MOCK_SYSTEM_STATS,
  MOCK_SYSTEM_ALERTS,
  MOCK_SYSTEM_PERFORMANCE,
  MOCK_DEPARTMENT_USAGE
} from './data/systemDashboard.mock';

// @MOCK_TO_API: システムダッシュボードサービス実装時にこのファイル全体をAPI呼び出しに置き換え
class MockSystemDashboardService {
  private stats: SystemStats = { ...MOCK_SYSTEM_STATS };
  private alerts: SystemAlert[] = [...MOCK_SYSTEM_ALERTS];
  private performanceData: SystemPerformance[] = [...MOCK_SYSTEM_PERFORMANCE];

  // システム統計情報取得
  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    console.warn('🔧 Using MOCK data for getSystemStats');
    
    await new Promise(resolve => setTimeout(resolve, 400));

    // リアルタイム計算
    const currentTime = new Date();
    const updatedStats: SystemStats = {
      ...this.stats,
      systemUptime: 99.8 + (Math.random() - 0.5) * 0.4, // 99.6-100.0%
      apiResponseTime: 145 + Math.floor(Math.random() * 20 - 10), // 135-155ms
      lastBackup: new Date(currentTime.getTime() - 3 * 60 * 60 * 1000) // 3時間前
    };

    return {
      success: true,
      data: updatedStats
    };
  }

  // システムアラート取得
  async getSystemAlerts(limit: number = 10): Promise<ApiResponse<SystemAlert[]>> {
    console.warn('🔧 Using MOCK data for getSystemAlerts');
    
    await new Promise(resolve => setTimeout(resolve, 300));

    const sortedAlerts = [...this.alerts]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return {
      success: true,
      data: sortedAlerts
    };
  }

  // システムパフォーマンス取得
  async getSystemPerformance(hours: number = 24): Promise<ApiResponse<SystemPerformance[]>> {
    console.warn('🔧 Using MOCK data for getSystemPerformance');
    
    await new Promise(resolve => setTimeout(resolve, 500));

    // 指定された時間分のデータを生成
    const now = new Date();
    const performanceData: SystemPerformance[] = [];
    
    for (let i = 0; i < hours; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      performanceData.push({
        timestamp,
        cpuUsage: 35 + Math.random() * 30, // 35-65%
        memoryUsage: 50 + Math.random() * 30, // 50-80%
        activeConnections: Math.floor(5 + Math.random() * 25), // 5-30
        apiResponseTime: Math.floor(120 + Math.random() * 60) // 120-180ms
      });
    }

    return {
      success: true,
      data: performanceData.reverse() // 古い順にソート
    };
  }

  // 部署別使用状況取得
  async getDepartmentUsage(): Promise<ApiResponse<typeof MOCK_DEPARTMENT_USAGE>> {
    console.warn('🔧 Using MOCK data for getDepartmentUsage');
    
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      success: true,
      data: MOCK_DEPARTMENT_USAGE
    };
  }

  // アラート既読化
  async markAlertAsRead(alertId: string): Promise<ApiResponse<void>> {
    console.warn('🔧 Using MOCK data for markAlertAsRead');
    
    await new Promise(resolve => setTimeout(resolve, 200));

    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex === -1) {
      return {
        success: false,
        error: 'アラートが見つかりません'
      };
    }

    this.alerts[alertIndex].isRead = true;

    return {
      success: true
    };
  }

  // 全アラート既読化
  async markAllAlertsAsRead(): Promise<ApiResponse<void>> {
    console.warn('🔧 Using MOCK data for markAllAlertsAsRead');
    
    await new Promise(resolve => setTimeout(resolve, 400));

    this.alerts.forEach(alert => {
      alert.isRead = true;
    });

    return {
      success: true
    };
  }

  // システムヘルスチェック
  async performHealthCheck(): Promise<ApiResponse<{ status: string; checks: Record<string, boolean> }>> {
    console.warn('🔧 Using MOCK data for performHealthCheck');
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const checks = {
      database: Math.random() > 0.1, // 90%の確率で正常
      gmail: Math.random() > 0.05,   // 95%の確率で正常
      storage: Math.random() > 0.02,  // 98%の確率で正常
      network: Math.random() > 0.03   // 97%の確率で正常
    };

    const allHealthy = Object.values(checks).every(check => check);
    
    return {
      success: true,
      data: {
        status: allHealthy ? 'healthy' : 'warning',
        checks
      }
    };
  }
}

export const mockSystemDashboardService = new MockSystemDashboardService();