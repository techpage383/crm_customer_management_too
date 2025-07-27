# PRP-003: システムダッシュボード実装計画書

## 1. Goal（目標）

システムダッシュボード（P-004）の完全実装により、管理者が以下を達成できる状態を実現する：

- **リアルタイムシステム監視**: システム稼働状況、パフォーマンス、リソース使用率の可視化
- **統合管理コックピット**: ユーザー管理、Gmail連携、セキュリティ、バックアップの一元制御
- **アラート・監視機能**: システム異常の早期検知と通知機能
- **運用効率化**: 日常的な管理業務の効率化と自動化
- **意思決定支援**: データに基づいた運用判断のための分析・レポート機能

## 2. Why（理由）

### ビジネス価値
- **運用効率化**: システム管理業務の一元化による作業効率向上
- **障害予防**: 早期アラートによるシステム障害の未然防止
- **データドリブン運用**: 統計情報に基づいた適切な意思決定
- **コンプライアンス**: システム監査ログの適切な管理・記録

### 技術的必要性
- **管理機能の集約**: 認証（001）・ユーザー管理（002）の統合管理層
- **Gmail連携監視**: Gmail同期・AI TODO抽出の稼働状況監視
- **企業管理の基盤**: 企業管理（004）実装前のシステム安定性確保
- **スケーラビリティ対応**: システム拡張時の監視・管理基盤

### 実装優先度の理由
- **順序003**: 認証・ユーザー管理の次に必要な管理機能基盤
- **企業管理前の準備**: CRMコア機能実装前にシステム安定性を確保
- **運用基盤の確立**: Gmail連携・AI機能実装前に監視体制を構築

## 3. What（要件）

### ユーザーストーリー

**システム管理者として**
- システム全体の稼働状況をリアルタイムで監視できる
- パフォーマンス指標（応答時間、CPU、メモリ、ディスク使用率）を可視化できる
- システムアラートの設定・管理・確認ができる
- 各種システムログの閲覧・検索・エクスポートができる
- ユーザー・Gmail連携・セキュリティ・バックアップの統合管理ができる
- システム設定の変更・保存ができる

**マネージャーとして**
- システムの健全性を確認できる
- ユーザー活動状況・統計情報を確認できる
- システム使用状況レポートを出力できる

**上位権限者として**
- 全システム機能の統合的な監視・制御ができる
- 緊急時の手動操作（バックアップ実行、システム停止等）ができる

### 技術要件

**フロントエンド要件**
- Material-UIベースのダッシュボードデザイン
- Chart.js によるリアルタイムグラフ表示
- レスポンシブデザイン（モバイル対応）
- リアルタイム更新機能（WebSocket または ポーリング）
- 設定値の永続化

**バックエンド要件**
- システムメトリクス収集API
- ログ管理・検索API
- アラート管理システム
- システム設定管理API
- リアルタイム通知機能

**成功基準**
- システム状況の2秒以内での表示
- リアルタイムメトリクスの正確な表示
- アラート通知の即座な反映
- 大量ログデータの効率的な検索・表示

## 4. All Needed Context（必要な情報）

### A. API仕様（schemas/index.tsから抜粋）

```typescript
// ========== システム設定関連 ==========
export interface SystemSettings {
  id: ID;
  companyName: string;
  systemEmail: string;
  emailNotifications: {
    todoReminders: boolean;
    contractExpiry: boolean;
    proposalExpiry: boolean;
    dailyDigest: boolean;
  };
  security: {
    passwordMinLength: number;
    passwordRequireSpecialChar: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    mfaEnabled: boolean;
  };
  integration: {
    gmailClientId?: string;
    gmailClientSecret?: string;
    openaiApiKey?: string;
    openaiModel?: string;
  };
  sharedGmail: {
    enabled: boolean;
    accounts: Array<{
      id: string;
      email: string;
      displayName: string;
      accessToken: string;        // 暗号化保存
      refreshToken: string;       // 暗号化保存
      allowedRoles: UserRole[];   // アクセス可能なロール
    }>;
  };
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
    lastBackupAt?: Date;
  };
  updatedAt: Date;
  updatedBy?: ID;
}

// ========== ダッシュボード関連 ==========
export interface DashboardStats {
  companies: {
    total: number;
    byStatus: Record<CompanyStatus, number>;
    newThisMonth: number;
  };
  todos: {
    total: number;
    byStatus: Record<TodoStatus, number>;
    overdue: number;
    dueToday: number;
    aiExtracted: number;
  };
  emails: {
    totalThreads: number;
    unreadThreads: number;
    threadsToday: number;
    pendingAnalysis: number;
  };
  contracts: {
    active: number;
    expiringSoon: number;
    totalValue: number;
  };
  proposals: {
    submitted: number;
    underReview: number;
    accepted: number;
    totalValue: number;
  };
}

// ========== 監査ログ関連 ==========
export enum AuditActionType {
  // 認証関連
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  
  // 権限変更
  ROLE_CHANGED = 'role_changed',
  ASSIGNEE_CHANGED = 'assignee_changed',
  
  // Gmail関連
  GMAIL_CONNECTED = 'gmail_connected',
  GMAIL_DISCONNECTED = 'gmail_disconnected',
  SHARED_GMAIL_ACCESSED = 'shared_gmail_accessed',
  
  // データ操作
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  BULK_OPERATION = 'bulk_operation',
  
  // CRUD操作
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete'
}

export interface AuditLog extends Timestamps {
  id: ID;
  userId: ID;
  user?: User;
  actionType: AuditActionType;      // 列挙型で明確化
  action: string;                    // 詳細な説明
  entityType: string;
  entityId: ID;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    riskScore?: number;            // セキュリティリスクスコア
  };
}

// ========== システムメトリクス関連（新規追加） ==========
export interface SystemMetrics {
  timestamp: Date;
  system: {
    uptime: number;               // 秒単位
    cpuUsage: number;            // パーセント
    memoryUsage: number;         // パーセント
    diskUsage: number;           // パーセント
    networkIO: {
      bytesIn: number;
      bytesOut: number;
    };
  };
  application: {
    activeUsers: number;
    totalSessions: number;
    requestsPerMinute: number;
    averageResponseTime: number;  // ミリ秒
    errorRate: number;           // パーセント
  };
  gmail: {
    syncStatus: GmailSyncStatus;
    lastSyncAt?: Date;
    syncDelayMinutes?: number;
    todayEmailCount: number;
    pendingTodoExtractions: number;
    apiQuotaUsage: number;       // パーセント
  };
  database: {
    connectionCount: number;
    queryAverageTime: number;    // ミリ秒
    size: number;               // バイト
    tableStats: {
      companies: number;
      users: number;
      emailThreads: number;
      todos: number;
    };
  };
}

export interface SystemAlert {
  id: ID;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  component: 'system' | 'gmail' | 'database' | 'security' | 'backup';
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

// 🔥 重要: 実装時は必ずこの型定義に完全準拠すること
// ❌ 禁止: 独自のレスポンス形式 {"success": true, "data": ...}
// ✅ 必須: 型定義通りの実装 {"companies": {...}, "todos": {...}, ...}

// ========== APIパス定義（システム管理関連） ==========
export const API_PATHS = {
  // ダッシュボード・レポート
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    ACTIVITIES: '/api/dashboard/activities',
    CHARTS: '/api/dashboard/charts',
    METRICS: '/api/dashboard/metrics',           // システムメトリクス取得
    ALERTS: '/api/dashboard/alerts',             // アラート一覧
    ALERT_DETAIL: (alertId: string) => `/api/dashboard/alerts/${alertId}`,
    MARK_ALERT_READ: (alertId: string) => `/api/dashboard/alerts/${alertId}/read`,
    RESOLVE_ALERT: (alertId: string) => `/api/dashboard/alerts/${alertId}/resolve`
  },
  
  // システム設定・管理
  SYSTEM: {
    SETTINGS: '/api/system/settings',
    AUDIT_LOGS: '/api/system/audit-logs',
    BACKUP: '/api/system/backup',
    RESTORE: '/api/system/restore',
    HEALTH: '/api/system/health',
    METRICS_HISTORY: '/api/system/metrics/history',  // 履歴メトリクス
    LOGS: '/api/system/logs',                        // システムログ
    LOG_SEARCH: '/api/system/logs/search',           // ログ検索
    MAINTENANCE: '/api/system/maintenance',          // メンテナンスモード
    CACHE_CLEAR: '/api/system/cache/clear'           // キャッシュクリア
  }
};

// ========== API認証設定 ==========
export const API_AUTH_CONFIG = {
  // ロール制限エンドポイント
  ROLE_RESTRICTED_ENDPOINTS: {
    // 上位権限者のみ
    [UPPER_ROLES.join(',')]: [
      API_PATHS.DASHBOARD.STATS,
      API_PATHS.DASHBOARD.METRICS,
      API_PATHS.DASHBOARD.ALERTS,
      API_PATHS.SYSTEM.SETTINGS,
      API_PATHS.SYSTEM.AUDIT_LOGS,
      API_PATHS.SYSTEM.LOGS,
      API_PATHS.SYSTEM.METRICS_HISTORY
    ],
    
    // COMPANY_LEADER のみ
    [UserRole.COMPANY_LEADER]: [
      API_PATHS.SYSTEM.BACKUP,
      API_PATHS.SYSTEM.RESTORE,
      API_PATHS.SYSTEM.MAINTENANCE,
      API_PATHS.SYSTEM.CACHE_CLEAR
    ]
  }
};
```

### B. モックアップファイル（完全なHTMLコード）

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>システム管理ダッシュボード - 顧客管理ツール</title>
    
    <!-- Material UI CDN -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    
    <!-- Chart.js for monitoring charts -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <style>
        /* 完全なCSS（省略：実際は1300行以上のスタイル定義）*/
        .app-header {
            background: #1976d2;
            color: white;
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .main-container {
            display: flex;
            height: calc(100vh - 64px);
        }
        
        .sidebar {
            width: 280px;
            background: white;
            border-right: 1px solid #e0e0e0;
            display: flex;
            flex-direction: column;
        }
        
        .main-content {
            flex: 1;
            background: white;
            display: flex;
            flex-direction: column;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
        }
        
        .status-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .chart-container {
            height: 200px;
            margin-top: 16px;
        }
    </style>
</head>
<body>
    <!-- ヘッダー -->
    <header class="app-header">
        <div class="app-title">システム管理ダッシュボード</div>
        <div class="system-status">
            <div class="status-indicator" id="systemStatusIndicator"></div>
            <span id="systemStatusText">システム正常稼働中</span>
        </div>
        <div class="user-info">
            <span>管理者: 田中 太郎</span>
            <i class="material-icons">admin_panel_settings</i>
        </div>
    </header>

    <!-- メインコンテナ -->
    <div class="main-container">
        <!-- サイドバー: ナビゲーション -->
        <div class="sidebar">
            <div class="sidebar-header">
                <h3 style="font-size: 16px; color: #333;">管理メニュー</h3>
            </div>
            
            <!-- アラート表示 -->
            <div class="alert-section" id="alertSection">
                <div class="alert-title">
                    <i class="material-icons" style="font-size: 16px;">warning</i>
                    システムアラート
                </div>
                <div class="alert-item">Gmail同期遅延が発生しています (5分遅延)</div>
                <div class="alert-item">ディスク使用量が80%を超えています</div>
            </div>
            
            <nav class="nav-menu">
                <button class="nav-item active" onclick="showSection('overview')">
                    <i class="material-icons">dashboard</i>
                    システム概要
                </button>
                <button class="nav-item" onclick="showSection('users')">
                    <i class="material-icons">people</i>
                    ユーザー管理
                </button>
                <button class="nav-item" onclick="showSection('monitoring')">
                    <i class="material-icons">monitoring</i>
                    パフォーマンス監視
                </button>
                <button class="nav-item" onclick="showSection('logs')">
                    <i class="material-icons">article</i>
                    ログ・履歴
                </button>
                <button class="nav-item" onclick="showSection('security')">
                    <i class="material-icons">security</i>
                    セキュリティ
                </button>
                <button class="nav-item" onclick="showSection('backup')">
                    <i class="material-icons">backup</i>
                    バックアップ
                </button>
                <button class="nav-item" onclick="showSection('settings')">
                    <i class="material-icons">settings</i>
                    システム設定
                </button>
            </nav>
        </div>

        <!-- メインコンテンツ -->
        <div class="main-content">
            <div class="content-header">
                <div class="content-title" id="contentTitle">システム概要</div>
                <div class="header-actions" id="headerActions">
                    <button class="btn btn-secondary" onclick="refreshDashboard()">
                        <i class="material-icons" style="font-size: 16px;">refresh</i>
                        更新
                    </button>
                    <button class="btn btn-primary" onclick="exportReport()">
                        <i class="material-icons" style="font-size: 16px;">download</i>
                        レポート出力
                    </button>
                </div>
            </div>
            
            <div class="content-body" id="contentBody">
                <!-- 7つのセクション（システム概要、ユーザー管理、パフォーマンス監視、ログ・履歴、セキュリティ、バックアップ、システム設定）の詳細なHTML内容 -->
                
                <!-- システム概要セクション例 -->
                <div class="dashboard-grid">
                    <div class="status-card">
                        <div class="card-header">
                            <div class="card-title">
                                <i class="material-icons">computer</i>
                                システム稼働状況
                            </div>
                            <span class="card-status status-healthy">正常</span>
                        </div>
                        <div class="metric-grid">
                            <div class="metric-item">
                                <div class="metric-value">99.8%</div>
                                <div class="metric-label">稼働率（30日）</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">15日</div>
                                <div class="metric-label">連続稼働時間</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">234ms</div>
                                <div class="metric-label">平均応答時間</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">10</div>
                                <div class="metric-label">アクティブユーザー</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Gmail同期状況、データベース、セキュリティの各カード -->
                    <!-- 省略：実際は4つのメトリクスカード + パフォーマンスチャート -->
                </div>
                
                <!-- 他セクションの詳細HTML省略 -->
            </div>
        </div>
    </div>

    <script>
        let currentSection = 'overview';
        let charts = {};

        // セクション表示切り替え
        function showSection(section) {
            // 7つのセクション（overview, users, monitoring, logs, security, backup, settings）
            // 各セクションのHTML動的生成
            // Chart.js による動的グラフ描画
            // リアルタイム更新処理
        }

        // チャート描画関数
        function renderPerformanceChart() {
            // Chart.js によるパフォーマンスチャート描画
        }

        function renderResourceChart() {
            // リソース使用率の円グラフ
        }

        function renderResponseChart() {
            // 応答時間の棒グラフ
        }

        // ユーティリティ関数
        function updateSystemStatus() {
            // システム状態のリアルタイム更新
        }

        // 定期更新（30秒間隔）
        setInterval(updateSystemStatus, 30000);
    </script>
</body>
</html>
```

### C. 統一ガイドライン（auth-system-design.mdから関連部分を抜粋）

以下の統一ガイドラインを必ず適用：

**権限管理の統一**
- **管理者権限**: COMPANY_LEADER/MANAGER/TEAM_LEADERのみアクセス可能
- **機能制限**: COMPANY_LEADERのみ重要システム操作（バックアップ・復元・メンテナンス）可能
- **監査ログ**: 全管理操作の完全な記録保持
- **リアルタイム権限チェック**: 各セクション表示時の権限確認

**システム監視の統一**
- **メトリクス収集**: 30秒間隔での定期的なシステム状況収集
- **アラート基準**: 応答時間2秒、CPU使用率80%、ディスク使用率85%
- **ログ管理**: 構造化ログによる効率的な検索・分析
- **レポート出力**: 標準フォーマットでの統計レポート生成

**データモデルの統一**
- **DashboardStats**: 各機能の統計情報の統一形式
- **SystemMetrics**: システムパフォーマンス情報の標準化
- **AuditLog**: 監査ログの統一記録形式
- **SystemAlert**: アラート情報の標準化

**Gmail連携監視の統一**
- **同期状況**: GmailSyncStatus enumによる状態管理
- **遅延監視**: 5分以上の遅延でアラート発生
- **API制限監視**: Gmail API使用量の監視・制御
- **AI TODO抽出**: 抽出処理の状況・統計の監視

### D. ディレクトリ構造

```
frontend/src/
├── pages/admin/                    # 管理者ページ
│   └── SystemDashboardPage.tsx     # P-004: システムダッシュボードページ
├── components/features/system/     # システム管理関連コンポーネント
│   ├── SystemOverview.tsx         # システム概要セクション
│   ├── SystemMetricsCard.tsx      # メトリクスカード
│   ├── SystemAlertsPanel.tsx      # アラートパネル
│   ├── PerformanceMonitoring.tsx  # パフォーマンス監視
│   ├── SystemLogs.tsx             # ログ表示・検索
│   ├── SecurityDashboard.tsx      # セキュリティダッシュボード
│   ├── BackupManagement.tsx       # バックアップ管理
│   ├── SystemSettings.tsx         # システム設定
│   ├── RealtimeChart.tsx          # リアルタイムチャート
│   └── NavigationSidebar.tsx      # ナビゲーションサイドバー
├── services/                      # 🔥 統合層（モック/実API切り替え管理）
│   ├── index.ts                   # 🔥 統合層（モック/実API切り替え管理）
│   ├── mock/                      # 🔥 モックサービス
│   │   ├── data/                  # 🔥 モックデータ（型定義準拠）
│   │   │   ├── dashboard.mock.ts
│   │   │   ├── metrics.mock.ts
│   │   │   ├── alerts.mock.ts
│   │   │   └── settings.mock.ts
│   │   └── system.service.ts
│   ├── api/                       # 実API接続実装
│   │   ├── client.ts              # APIクライアント基盤
│   │   └── system.service.ts
│   └── utils/                     # 🔥 @MARKシステム関連ユーティリティ
└── schemas/                       # バックエンドと同期するデータ契約
    └── index.ts                   # APIパスとデータ契約（単一の真実源）

backend/src/
├── features/system/               # システム管理機能
│   ├── system.controller.ts      # システム管理APIエンドポイント
│   ├── system.service.ts         # システム管理ビジネスロジック
│   ├── system.routes.ts          # ルート定義
│   ├── metrics.service.ts        # メトリクス収集サービス
│   ├── alerts.service.ts         # アラート管理サービス
│   ├── logs.service.ts           # ログ管理サービス
│   └── monitoring.service.ts     # 監視サービス
├── common/middlewares/            # 共通ミドルウェア
│   ├── metrics.middleware.ts     # メトリクス収集ミドルウェア
│   └── alert.middleware.ts       # アラート生成ミドルウェア
└── types/
    └── index.ts                   # フロントエンドと同期した型定義
```

### E. モック→API切り替え方針

```typescript
// 🔥 Phase 2A: モック実装時の必須ルール
// 1. すべてのモック箇所に @MOCK_TO_API マーク付与
// 2. モックデータは services/mock/data/ に分離
// 3. コンポーネント内でのハードコード完全禁止

// Phase 2A実装例：
// @MOCK_TO_API: systemService.getDashboardStats()に置き換え
const dashboardStats = await mockSystemService.getDashboardStats();

// services/index.ts でモックサービスをエクスポート
export const systemService = mockSystemService;

// 🔥 モックデータの品質基準
// services/mock/data/dashboard.mock.ts の例
export const mockDashboardStats: DashboardStats = {
  // schemas/index.ts の DashboardStats型定義に完全準拠
  companies: {
    total: 156,
    byStatus: {
      [CompanyStatus.PROSPECT]: 45,
      [CompanyStatus.ACTIVE]: 89,
      [CompanyStatus.INACTIVE]: 22
    },
    newThisMonth: 12
  },
  todos: {
    total: 423,
    byStatus: {
      [TodoStatus.PENDING]: 156,
      [TodoStatus.IN_PROGRESS]: 89,
      [TodoStatus.COMPLETED]: 167,
      [TodoStatus.CANCELLED]: 11
    },
    overdue: 23,
    dueToday: 15,
    aiExtracted: 67
  },
  emails: {
    totalThreads: 23456,
    unreadThreads: 234,
    threadsToday: 1234,
    pendingAnalysis: 45
  },
  contracts: {
    active: 78,
    expiringSoon: 12,
    totalValue: 45600000
  },
  proposals: {
    submitted: 34,
    underReview: 12,
    accepted: 23,
    totalValue: 12300000
  }
};

export const mockSystemMetrics: SystemMetrics = {
  // schemas/index.ts の SystemMetrics型定義に完全準拠
  timestamp: new Date(),
  system: {
    uptime: 1296000,        // 15日
    cpuUsage: 45.6,         // 45.6%
    memoryUsage: 67.2,      // 67.2%
    diskUsage: 78.9,        // 78.9%
    networkIO: {
      bytesIn: 1234567890,
      bytesOut: 987654321
    }
  },
  application: {
    activeUsers: 10,
    totalSessions: 24,
    requestsPerMinute: 156,
    averageResponseTime: 234,  // 234ms
    errorRate: 0.1             // 0.1%
  },
  gmail: {
    syncStatus: GmailSyncStatus.SYNCING,
    lastSyncAt: new Date('2024-01-27T15:25:00Z'),
    syncDelayMinutes: 5,
    todayEmailCount: 1234,
    pendingTodoExtractions: 8,
    apiQuotaUsage: 45.6        // 45.6%
  },
  database: {
    connectionCount: 12,
    queryAverageTime: 45,      // 45ms
    size: 2469606195,          // 2.3GB
    tableStats: {
      companies: 156,
      users: 10,
      emailThreads: 23456,
      todos: 423
    }
  }
};

export const mockSystemAlerts: SystemAlert[] = [
  {
    id: "alert-001",
    type: "warning",
    title: "Gmail同期遅延",
    message: "Gmail同期遅延が発生しています (5分遅延)",
    component: "gmail",
    isRead: false,
    isResolved: false,
    createdAt: new Date('2024-01-27T15:25:00Z'),
    metadata: {
      delayMinutes: 5,
      affectedUsers: 8
    }
  },
  {
    id: "alert-002",
    type: "warning",
    title: "ディスク使用量警告",
    message: "ディスク使用量が80%を超えています",
    component: "system",
    isRead: false,
    isResolved: false,
    createdAt: new Date('2024-01-27T15:10:00Z'),
    metadata: {
      currentUsage: 80.2,
      threshold: 80
    }
  }
];

// 🔥 Phase 2B: API切り替え時の手順
// 1. grep -r "@MOCK_TO_API" src/ で対象箇所特定
// 2. モック呼び出しを実API呼び出しに置き換え
// 3. services/mock/data/[システム関連].mock.ts 削除
// 4. services/index.ts で実APIサービスに切り替え

// Phase 2B実装例：
const dashboardStats = await systemService.getDashboardStats();

// services/index.ts で対象機能のみ実APIに切り替え
export const systemService = apiSystemService;     // ← 実APIに切り替え済み
export const usersService = mockUsersService;      // ← まだモック

// 🔥 型定義の具体的活用例
import { DashboardStats, SystemMetrics, API_PATHS } from '@/schemas';

const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch(API_PATHS.DASHBOARD.STATS, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json() as DashboardStats;
};

const getSystemMetrics = async (): Promise<SystemMetrics> => {
  const response = await fetch(API_PATHS.DASHBOARD.METRICS, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json() as SystemMetrics;
};

// 🔥 リアルタイム更新の実装例
const useRealtimeMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // @MOCK_TO_API: systemService.getRealtimeMetrics()に置き換え
        const data = await mockSystemService.getRealtimeMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('メトリクス取得エラー:', error);
      }
    };
    
    // 初回取得
    fetchMetrics();
    
    // 30秒間隔での自動更新
    const interval = setInterval(fetchMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return metrics;
};

// 🔥 権限チェック実装例
const canAccessSystemDashboard = (user: User): boolean => {
  return isUpperRole(user.role);
};

const canManageSystemSettings = (user: User): boolean => {
  return user.role === UserRole.COMPANY_LEADER;
};
```

## 5. Implementation Blueprint（実装設計図）

### Phase 1: バックエンド実装（2-3日）

```
タスクリスト:
- [ ] schemas/index.tsの型定義確認・拡張
  - SystemMetrics型の追加実装
  - SystemAlert型の追加実装  
  - API_PATHSの拡張（DASHBOARD.*）
- [ ] システム管理APIエンドポイント実装
  - GET /api/dashboard/stats (統計情報取得)
  - GET /api/dashboard/metrics (リアルタイムメトリクス)
  - GET /api/dashboard/alerts (アラート一覧)
  - PUT /api/dashboard/alerts/:id/read (アラート既読)
  - PUT /api/dashboard/alerts/:id/resolve (アラート解決)
  - GET /api/system/settings (システム設定取得)
  - PUT /api/system/settings (システム設定更新)
  - GET /api/system/logs (ログ取得)
  - POST /api/system/logs/search (ログ検索)
  - GET /api/system/health (ヘルスチェック)
  - POST /api/system/backup (手動バックアップ実行)
- [ ] メトリクス収集サービス実装
  - システムリソース監視
  - アプリケーション監視
  - Gmail連携状況監視
  - データベース監視
- [ ] アラート管理システム実装
  - 閾値監視・アラート生成
  - アラート通知機能
  - アラート解決・履歴管理
- [ ] ログ管理システム実装
  - 構造化ログ記録
  - ログ検索・フィルタリング
  - ログローテーション
- [ ] 統合テスト作成
- [ ] テスト通過確認

品質チェック:
- [ ] Backend Syntax & Style
- [ ] Backend Integration Test
```

### Phase 2A: UI実装（2-3日）

```
タスクリスト:
- [ ] ページコンポーネント作成（モックアップベース）
  - SystemDashboardPage.tsx (メインページ)
  - SystemOverview.tsx (システム概要セクション)
  - SystemMetricsCard.tsx (メトリクスカード)
  - SystemAlertsPanel.tsx (アラートパネル)
  - PerformanceMonitoring.tsx (パフォーマンス監視)
  - SystemLogs.tsx (ログ表示・検索)
  - SecurityDashboard.tsx (セキュリティダッシュボード)
  - BackupManagement.tsx (バックアップ管理)
  - SystemSettings.tsx (システム設定)
  - RealtimeChart.tsx (リアルタイムチャート)
  - NavigationSidebar.tsx (ナビゲーションサイドバー)
- [ ] 🔥 モックデータの実装（@MARKシステム使用）
  - services/mock/data/dashboard.mock.ts にダッシュボード統計データ
  - services/mock/data/metrics.mock.ts にシステムメトリクスデータ
  - services/mock/data/alerts.mock.ts にアラートデータ
  - services/mock/data/settings.mock.ts にシステム設定データ
  - 全モック箇所に @MOCK_TO_API コメント付与
  - コンポーネント内でのハードコード完全禁止
- [ ] services/index.ts でモックサービスをエクスポート
- [ ] モックデータの品質確認（schemas/index.ts完全準拠）
- [ ] Chart.js によるリアルタイムグラフ実装
  - パフォーマンスチャート（線グラフ）
  - リソース使用率チャート（円グラフ）
  - 応答時間チャート（棒グラフ）
- [ ] セクション切り替え機能実装
- [ ] アラート表示・管理機能実装
- [ ] システム設定フォーム実装
- [ ] レスポンシブデザイン対応

実装ルール:
// @MOCK_TO_API: API実装時にこのブロック全体をAPI呼び出しに置き換え
const dashboardData = await mockSystemService.getDashboardStats();

品質チェック:
- [ ] Frontend Syntax & Style
- [ ] フロントエンドビルド確認
- [ ] 基本的なコンパイル確認

注意: 実際の動作確認・UI調整は Phase 3 で人間が実行
```

### Phase 2B: API接続（1-2日）

```
タスクリスト:
- [ ] 🔥 @MARK検索でモック箇所特定
  grep -r "@MOCK_TO_API" src/
- [ ] 対象機能のモック箇所を実API呼び出しに置き換え
  - ダッシュボード統計取得
  - リアルタイムメトリクス取得
  - アラート管理（取得・既読・解決）
  - システム設定（取得・更新）
  - ログ管理（取得・検索）
  - バックアップ実行
- [ ] services/mock/data/[システム関連].mock.ts のみ削除
- [ ] services/index.ts で対象機能のみ実APIに切り替え
- [ ] エラーハンドリング実装（401/403/500/ネットワークエラー対応）
- [ ] 型定義を活用したAPI呼び出し実装
- [ ] ローディング状態実装
- [ ] リアルタイム更新機能実装（30秒間隔）
- [ ] 権限チェック実装（上位権限者のみアクセス）

品質チェック:
- [ ] フロントエンドビルド確認（API接続後）
- [ ] 型定義の整合性確認
- [ ] 基本的なコンパイル確認
```

### Phase 3: 人間による最終確認（半日）

```
タスクリスト:
- [ ] サーバー起動（npm run dev）
- [ ] ドキュメント更新

品質チェック:
- [ ] モックデータでの動作確認（人間）
- [ ] UI/UX調整（レスポンシブ、アニメーション等）（人間）
- [ ] 全ページの視覚的確認（人間）
- [ ] 全フローの動作確認（人間）
  - 7つのセクション切り替え
  - リアルタイムメトリクス表示
  - チャート表示・更新
  - アラート表示・管理
  - ログ表示・検索
  - システム設定変更・保存
  - レポート出力
- [ ] モックアップとの一致確認（人間）
- [ ] パフォーマンス確認（人間）
- [ ] 権限制御の動作確認（人間）
- [ ] レスポンシブデザイン確認（人間）
```

## 6. Validation Loop（検証ループ）

各Phaseで実行する品質チェックの詳細コマンド：

### Phase 1完了時: Backend Syntax & Style + 型定義整合性確認 + Backend Integration Test

```bash
# Backend Syntax & Style
cd backend && npm run lint -- --fix
cd backend && npm run type-check
# 期待値: エラーなし

# 🔥 型定義整合性確認（最優先・軽量）
npm run dev &

# ダッシュボード統計API確認
curl -X GET http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.'

# 期待値: schemas/index.tsのDashboardStats型と完全一致
# {
#   "companies": {
#     "total": 156,
#     "byStatus": {
#       "prospect": 45,
#       "active": 89,
#       "inactive": 22
#     },
#     "newThisMonth": 12
#   },
#   "todos": {
#     "total": 423,
#     "byStatus": { ... },
#     "overdue": 23,
#     "dueToday": 15,
#     "aiExtracted": 67
#   },
#   "emails": { ... },
#   "contracts": { ... },
#   "proposals": { ... }
# }
#
# ❌ 不一致例: {"success": true, "data": {...}}
# → この場合は即座に実装修正してから次のステップへ

# システムメトリクスAPI確認
curl -X GET http://localhost:3000/api/dashboard/metrics \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.'

# 期待値: schemas/index.tsのSystemMetrics型と完全一致
# {
#   "timestamp": "2024-01-27T15:30:00Z",
#   "system": {
#     "uptime": 1296000,
#     "cpuUsage": 45.6,
#     "memoryUsage": 67.2,
#     "diskUsage": 78.9,
#     "networkIO": { ... }
#   },
#   "application": { ... },
#   "gmail": { ... },
#   "database": { ... }
# }

# アラート一覧API確認
curl -X GET http://localhost:3000/api/dashboard/alerts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.'

# 期待値: SystemAlert[]型の配列

# Backend Integration Test（型定義確認後に実行）
npm run test:integration -- tests/integration/system.flow.test.js
# 期待値: システム管理APIの全テスト通過
```

### Phase 2A完了時: Frontend Syntax & Style + ビルド確認（AI自動）

```bash
# Frontend Syntax & Style
cd frontend && npm run lint -- --fix
cd frontend && npm run type-check
# 期待値: エラーなし

# フロントエンドビルド確認
npm run build
# 期待値: ビルドエラーなし

# 🔥 モック実装の完全性確認
grep -r "@MOCK_TO_API" src/ | wc -l
# 期待値: すべてのモック箇所がマーキング済み

grep -r "services/mock/data" src/
# 期待値: モックデータが完全分離済み

# Chart.js 依存関係確認
grep -r "chart.js\|Chart" src/
# 期待値: チャートライブラリが正しく使用されている

# 型定義整合性確認
grep -r "DashboardStats\|SystemMetrics\|SystemAlert" src/
# 期待値: 正しくimportされている

# 注意: モックデータでの動作確認は Phase 3 で人間が実行
# AIはブラウザでの表示確認・UI操作確認はできません
```

### Phase 2B完了時: API接続後の確認（CLI完結）

```bash
# フロントエンドビルド確認（API接続後）
npm run build
# 期待値: ビルドエラーなし

# 型チェック確認
npm run type-check
# 期待値: 型エラーなし

# 🔥 モック→API切り替え完了確認
grep -r "@MOCK_TO_API" src/
# 期待値: 検索結果なし（全て実APIに置き換え済み）

ls services/mock/data/
# 期待値: システム関連モックファイル（dashboard.mock.ts等）のみ削除済み

# 🔥 フロントエンド・バックエンド連携確認（重要）
npm run dev &

# APIエンドポイント疎通確認
curl -X GET http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.companies.total, .todos.total, .emails.totalThreads'

# システムメトリクス疎通確認
curl -X GET http://localhost:3000/api/dashboard/metrics \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.system.cpuUsage, .application.activeUsers'

# フロントエンドコードでの実際の使用確認
grep -r "companies\|todos\|emails" frontend/src/ | head -5
grep -r "API_PATHS.DASHBOARD" frontend/src/ | head -5

# 期待値: 
# - @MOCK_TO_API マークが完全削除済み
# - システム関連モックファイルのみ削除済み
# - APIレスポンスに companies, todos, emails等が存在
# - フロントエンドコードで正しいプロパティ名を使用
# - プロパティ名の完全一致
```

### Phase 3完了時: 人間による最終確認

```bash
# サーバー起動のみ（AIが実行）
npm run dev

# 以下は人間が実行:
# - ブラウザで http://localhost:3000/admin/dashboard を開く
# - mockups/system-dashboard.html と視覚的に比較
# - 全システム管理フローを確認
#   - 7つのセクション切り替え（概要・ユーザー・監視・ログ・セキュリティ・バックアップ・設定）
#   - リアルタイムメトリクス表示
#   - Chart.js グラフの正常表示・更新
#   - アラート表示・既読・解決操作
#   - ログ表示・検索・フィルタリング
#   - システム設定変更・保存
#   - レポート出力機能
#   - 手動バックアップ実行
# - パフォーマンス確認（応答時間2秒以内等）
# - 権限制御確認（権限に応じたセクション表示・非表示）
# - レスポンシブデザイン確認（モバイル対応）
# - リアルタイム更新確認（30秒間隔での自動更新）
# - 最終的な品質確認

# 注意: APIテストはPhase 1で完了済み
```

## 7. 完了条件

### 技術的完了基準:
- [ ] 全テストが通過（Phase 1: Backend Integration Test）
- [ ] フロントエンドビルドエラーなし
- [ ] @MOCK_TO_API マークが完全削除
- [ ] 型エラーなし（schemas/index.ts準拠）
- [ ] Chart.js グラフの正常表示
- [ ] リアルタイム更新機能の正常動作

### 機能的完了基準:
- [ ] モックアップとの視覚的一致（90%以上）
- [ ] 全システム管理フローの動作確認
- [ ] 7つのセクション切り替えの確認
- [ ] リアルタイムメトリクス表示の確認
- [ ] アラート管理機能の確認
- [ ] エラーケースの適切な処理（401, 403, 500等）
- [ ] 応答時間2秒以内
- [ ] レスポンシブ対応確認

### 品質保証基準:
- [ ] コードレビュー完了
- [ ] セキュリティチェック完了（権限制御・監査ログ）
- [ ] パフォーマンステスト完了
- [ ] 既存システム（認証・ユーザー管理）との統合確認
- [ ] 次期実装（企業管理）への準備完了（管理基盤の確立）