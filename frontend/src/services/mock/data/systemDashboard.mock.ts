import { 
  SystemStats,
  SystemAlert,
  SystemAlertType,
  SystemPerformance,
  ApiResponse
} from '../../../types';

// @MOCK_DATA: システム統計情報
export const MOCK_SYSTEM_STATS: SystemStats = {
  totalUsers: 8,
  activeUsers: 7,
  totalCompanies: 45,
  totalTodos: 127,
  completedTodos: 89,
  gmailConnections: 4,
  systemUptime: 99.8,
  apiResponseTime: 145,
  databaseSize: 256,
  lastBackup: new Date('2024-01-27T03:00:00Z')
};

// @MOCK_DATA: システムアラート
export const MOCK_SYSTEM_ALERTS: SystemAlert[] = [
  {
    id: 'alert-1',
    type: SystemAlertType.WARNING,
    title: 'API応答時間の増加',
    message: 'APIの平均応答時間が通常より20%増加しています',
    timestamp: new Date('2024-01-27T10:30:00Z'),
    isRead: false,
    actionRequired: true
  },
  {
    id: 'alert-2',
    type: SystemAlertType.INFO,
    title: 'システムバックアップ完了',
    message: '定期バックアップが正常に完了しました',
    timestamp: new Date('2024-01-27T03:00:00Z'),
    isRead: true,
    actionRequired: false
  },
  {
    id: 'alert-3',
    type: SystemAlertType.SUCCESS,
    title: 'Gmail連携復旧',
    message: 'メンテナンス中だったGmail連携サービスが正常に復旧しました',
    timestamp: new Date('2024-01-26T14:20:00Z'),
    isRead: true,
    actionRequired: false
  }
];

// @MOCK_DATA: システムパフォーマンス（時系列）
export const MOCK_SYSTEM_PERFORMANCE: SystemPerformance[] = [
  {
    timestamp: new Date('2024-01-27T09:00:00Z'),
    cpuUsage: 45.2,
    memoryUsage: 68.5,
    activeConnections: 23,
    apiResponseTime: 145
  },
  {
    timestamp: new Date('2024-01-27T08:30:00Z'),
    cpuUsage: 42.1,
    memoryUsage: 65.8,
    activeConnections: 18,
    apiResponseTime: 138
  },
  {
    timestamp: new Date('2024-01-27T08:00:00Z'),
    cpuUsage: 39.7,
    memoryUsage: 63.2,
    activeConnections: 15,
    apiResponseTime: 132
  },
  {
    timestamp: new Date('2024-01-27T07:30:00Z'),
    cpuUsage: 41.3,
    memoryUsage: 64.1,
    activeConnections: 12,
    apiResponseTime: 128
  },
  {
    timestamp: new Date('2024-01-27T07:00:00Z'),
    cpuUsage: 38.9,
    memoryUsage: 61.7,
    activeConnections: 8,
    apiResponseTime: 125
  }
];

// @MOCK_DATA: システム使用状況（部署別）
export const MOCK_DEPARTMENT_USAGE = [
  { department: '営業部', userCount: 4, activeUsers: 4, todoCount: 67 },
  { department: 'サポート部', userCount: 1, activeUsers: 1, todoCount: 23 },
  { department: '経営企画部', userCount: 1, activeUsers: 1, todoCount: 15 },
  { department: 'マーケティング部', userCount: 1, activeUsers: 1, todoCount: 12 },
  { department: '総務部', userCount: 1, activeUsers: 0, todoCount: 10 }
];