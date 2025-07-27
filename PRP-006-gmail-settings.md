# PRP-006: Gmail設定実装計画書

## 1. Goal（目標）

Gmail設定（P-011）の完全実装により、システム管理者・営業担当者が以下を達成できる状態を実現する：

- **Gmail OAuth連携**: Google認証による安全で継続的なGmail API連携
- **自動メール同期**: 設定可能な間隔での新着メール自動取得・企業紐付け
- **AI TODO抽出基盤**: メール内容からのTODO自動抽出・承認ワークフロー設定
- **企業自動関連付け**: メールドメインによる企業自動判定・新規企業作成
- **同期状況監視**: リアルタイム同期状況・統計・API使用量の可視化
- **柔軟な設定管理**: 同期間隔・対象期間・フォルダ・自動化レベルの細かな制御

## 2. Why（理由）

### ビジネス価値
- **営業効率化**: メール対応履歴の自動収集による顧客情報の一元化
- **機会損失防止**: メール内TODO自動抽出による重要な顧客要求の見落とし防止
- **データドリブン営業**: メール分析による顧客コミュニケーション状況の可視化
- **業務自動化**: 手動メール登録作業の削減による生産性向上

### 技術的必要性
- **Gmail連携の基盤**: Gmail ログページ（007）・TODO抽出確認（008）の前提システム
- **企業管理との統合**: 企業管理（004）との自動データ連携基盤
- **TODO管理との連携**: TODO管理（005）で管理するAI抽出TODOの源泉
- **セキュアな認証**: OAuth 2.0による安全なGmail API接続管理

### 実装優先度の理由
- **順序006**: TODO管理（005）完了後、Gmail連携機能群の基盤として必須
- **AI抽出の前提**: TODO抽出確認（008）機能の設定・管理基盤
- **データ統合準備**: 他システムとの連携前にGmail接続基盤を確立

## 3. What（要件）

### ユーザーストーリー

**システム管理者として**
- Gmail OAuth認証を設定・管理できる
- 同期設定（間隔・期間・対象フォルダ）を調整できる
- 同期状況・統計・エラーをリアルタイムで監視できる
- API使用量・制限を確認・管理できる
- トラブルシューティング・手動同期を実行できる

**営業担当者として**
- 個人Gmail設定を簡単に接続・管理できる
- 自動企業関連付け設定を調整できる
- AI TODO抽出の有効化・無効化を設定できる
- 同期されたメール数・企業関連付け状況を確認できる

**マネージャーとして**
- チーム全体のGmail連携状況を監視できる
- メール同期による営業活動状況を把握できる
- Gmail連携パフォーマンス・効果を分析できる

### 技術要件

**フロントエンド要件**
- Material-UIベースの設定ウィザード画面
- OAuth認証フローの統合
- リアルタイム同期状況表示
- 設定値の即座な保存・反映
- 直感的な権限管理画面

**バックエンド要件**
- Gmail OAuth 2.0認証管理
- Gmail API連携・メール取得機能
- 企業自動マッチング・作成機能
- AI TODO抽出トリガー機能
- 同期ジョブ・スケジュール管理

**成功基準**
- OAuth認証の完了まで30秒以内
- 新着メール同期の2分以内検知
- 企業自動関連付けの90%以上精度
- 同期エラーの即座な検出・通知

## 4. All Needed Context（必要な情報）

### A. API仕様（schemas/index.tsから抜粋）

```typescript
// ========== Gmail連携設定関連 ==========
export enum SyncFolder {
  INBOX = 'inbox',
  SENT = 'sent',
  DRAFT = 'draft',
  SPAM = 'spam',
  TRASH = 'trash',
  ALL_MAIL = 'all_mail'
}

export enum SyncStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ERROR = 'error',
  DISCONNECTED = 'disconnected'
}

export interface GmailSettings {
  id: ID;
  userId: ID;
  gmailAddress: string;
  accessToken: string; // 暗号化保存
  refreshToken: string; // 暗号化保存
  tokenExpiresAt: string;
  grantedScopes: string[];
  syncInterval: number; // minutes
  syncPeriodDays: number; // days, 0 = all
  syncFolders: SyncFolder[];
  autoCompanyMatching: boolean;
  autoCompanyCreation: boolean;
  aiTodoExtraction: boolean;
  autoTodoApproval: boolean;
  lastSyncAt?: string;
  nextSyncAt?: string;
  syncStatus: SyncStatus;
  syncErrors: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GmailOAuthRequest {
  code: string;
  state: string;
  scope: string;
}

export interface GmailOAuthResponse {
  settings: GmailSettings;
  authUrl?: string;
}

export interface GmailSettingsUpdateRequest {
  syncInterval?: number;
  syncPeriodDays?: number;
  syncFolders?: SyncFolder[];
  autoCompanyMatching?: boolean;
  autoCompanyCreation?: boolean;
  aiTodoExtraction?: boolean;
  autoTodoApproval?: boolean;
}

export interface GmailSyncStats {
  userId: ID;
  gmailAddress: string;
  totalSyncedEmails: number;
  todaySyncedEmails: number;
  lastSyncAt?: string;
  nextSyncAt?: string;
  syncStatus: SyncStatus;
  companyMatched: number;
  companyMatchRate: number; // percentage
  todayTodoExtracted: number;
  pendingTodoApprovals: number;
  apiCallsToday: number;
  apiCallLimit: number;
  syncErrors: Array<{
    timestamp: string;
    error: string;
    resolved: boolean;
  }>;
}

export interface GmailSyncOperation {
  id: ID;
  userId: ID;
  operation: 'full_sync' | 'incremental_sync' | 'manual_sync';
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  emailsProcessed: number;
  emailsTotal: number;
  companiesMatched: number;
  todosExtracted: number;
  errors: string[];
}

// Gmail メール管理
export interface GmailEmail {
  id: ID;
  gmailMessageId: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  date: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;
  labels: string[];
  folder: SyncFolder;
  companyId?: ID;
  companyName?: string;
  userId: ID;
  hasAIProcessed: boolean;
  extractedTodos: ID[];
  createdAt: string;
  updatedAt: string;
}

// ========== APIパス（Gmail設定関連） ==========
export const API_PATHS = {
  // ... 既存のパス ...
  
  // Gmail設定
  GMAIL_SETTINGS: '/api/gmail/settings',
  GMAIL_OAUTH_START: '/api/gmail/oauth/start',
  GMAIL_OAUTH_CALLBACK: '/api/gmail/oauth/callback',
  GMAIL_OAUTH_REFRESH: '/api/gmail/oauth/refresh',
  GMAIL_DISCONNECT: '/api/gmail/disconnect',
  
  // Gmail同期
  GMAIL_SYNC_STATS: '/api/gmail/sync/stats',
  GMAIL_SYNC_MANUAL: '/api/gmail/sync/manual',
  GMAIL_SYNC_STATUS: '/api/gmail/sync/status',
  GMAIL_SYNC_HISTORY: '/api/gmail/sync/history',
  
  // Gmail メール管理
  GMAIL_EMAILS: '/api/gmail/emails',
  GMAIL_EMAIL_DETAIL: '/api/gmail/emails/:id',
  GMAIL_EMAIL_SEARCH: '/api/gmail/emails/search',
  
  // 企業自動マッチング
  GMAIL_COMPANY_MATCH: '/api/gmail/company-match',
  GMAIL_COMPANY_MATCH_PREVIEW: '/api/gmail/company-match/preview',
} as const;
```

### B. OAuth 2.0認証フロー設計

**Phase 1: 認証開始**
1. フロントエンド: OAuth開始リクエスト
2. バックエンド: Google OAuth URL生成・state管理
3. ユーザー: Googleサインイン・権限承認
4. Google: 認証コード返却

**Phase 2: トークン取得**
1. バックエンド: 認証コード→アクセストークン交換
2. バックエンド: リフレッシュトークン暗号化保存
3. バックエンド: Gmail API接続確認
4. フロントエンド: 設定画面へリダイレクト

**Phase 3: トークン管理**
1. 定期トークンリフレッシュ（期限前自動更新）
2. API呼び出し失敗時の自動再認証
3. ユーザー手動でのトークン更新
4. 連携解除時の完全クリーンアップ

### C. モックアップ分析（mockups/gmail-settings.html）

**主要機能エリア**
1. **接続状況表示**: Gmail連携ステータス・アカウント情報
2. **OAuth認証セクション**: Google認証・権限管理・連携解除
3. **同期設定**: 間隔・期間・対象フォルダ・自動化設定
4. **同期状況監視**: 統計・API使用量・エラー状況
5. **トラブルシューティング**: 手動同期・認証更新

**重要なUI要素**
- 接続ステータスインジケーター（正常・警告・エラー）
- Google OAuth権限一覧表示
- 同期設定の即座反映フォーム
- リアルタイム同期統計表示
- 手動操作ボタン（同期実行・認証更新）

### D. 企業管理・TODO管理との連携

**企業自動関連付け**
- メールドメイン→企業マッチング
- 新規企業自動作成機能
- 企業担当者への自動割り当て

**TODO抽出連携**
- メール内容のAI解析トリガー
- 抽出結果のTODO管理（005）連携
- 承認ワークフローの設定管理

## 5. Implementation Blueprint（実装設計図）

### Phase 1: Backend Implementation

**1.1 Gmail OAuth認証管理**
```typescript
// backend/src/features/gmail/controllers/GmailOAuthController.ts
export class GmailOAuthController {
  async startOAuth(req: AuthenticatedRequest, res: Response): Promise<void> {
    // state生成、OAuth URL生成
  }
  
  async handleCallback(req: Request, res: Response): Promise<void> {
    // 認証コード→トークン交換、設定保存
  }
  
  async refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    // トークンリフレッシュ、設定更新
  }
  
  async disconnect(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 完全な連携解除、データクリーンアップ
  }
}
```

**1.2 Gmail設定管理**
```typescript
// backend/src/features/gmail/controllers/GmailSettingsController.ts
export class GmailSettingsController {
  async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async getSyncStats(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async getSyncHistory(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async triggerManualSync(req: AuthenticatedRequest, res: Response): Promise<void> {}
}
```

**1.3 Gmail同期エンジン**
```typescript
// backend/src/features/gmail/services/GmailSyncService.ts
export class GmailSyncService {
  async performFullSync(userId: string): Promise<void> {
    // 初回全メール同期
  }
  
  async performIncrementalSync(userId: string): Promise<void> {
    // 差分同期（新着メール）
  }
  
  async processEmail(email: any, settings: GmailSettings): Promise<void> {
    // メール処理：企業関連付け、TODO抽出トリガー
  }
  
  async matchCompany(fromEmail: string): Promise<ID | null> {
    // ドメインベース企業マッチング
  }
  
  async createCompanyFromEmail(fromEmail: string): Promise<ID> {
    // メールから新規企業作成
  }
}
```

**1.4 スケジューラー統合**
```typescript
// backend/src/features/gmail/jobs/GmailSyncJob.ts
export class GmailSyncJob {
  @Cron('*/5 * * * *') // 5分毎
  async runScheduledSync(): Promise<void> {
    const activeSettings = await this.getActiveSyncSettings();
    for (const settings of activeSettings) {
      if (this.shouldSync(settings)) {
        await this.gmailSyncService.performIncrementalSync(settings.userId);
      }
    }
  }
  
  private shouldSync(settings: GmailSettings): boolean {
    // 同期間隔チェック、エラー状態確認
  }
}
```

**1.5 データベース設計**
```sql
-- Gmail設定テーブル
CREATE TABLE gmail_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  gmail_address VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL, -- 暗号化
  refresh_token TEXT NOT NULL, -- 暗号化
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  granted_scopes TEXT[],
  sync_interval INTEGER DEFAULT 10, -- minutes
  sync_period_days INTEGER DEFAULT 90, -- 0 = all
  sync_folders sync_folder_enum[] DEFAULT '{inbox,sent}',
  auto_company_matching BOOLEAN DEFAULT true,
  auto_company_creation BOOLEAN DEFAULT false,
  ai_todo_extraction BOOLEAN DEFAULT true,
  auto_todo_approval BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status sync_status_enum DEFAULT 'active',
  sync_errors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Gmail同期履歴テーブル
CREATE TABLE gmail_sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  operation VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'running',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  emails_processed INTEGER DEFAULT 0,
  emails_total INTEGER DEFAULT 0,
  companies_matched INTEGER DEFAULT 0,
  todos_extracted INTEGER DEFAULT 0,
  errors TEXT[]
);

-- Gmailメールテーブル
CREATE TABLE gmail_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id VARCHAR(255) NOT NULL,
  thread_id VARCHAR(255) NOT NULL,
  subject TEXT,
  from_email VARCHAR(255) NOT NULL,
  to_emails TEXT[],
  cc_emails TEXT[],
  bcc_emails TEXT[],
  sent_date TIMESTAMP WITH TIME ZONE NOT NULL,
  body_text TEXT,
  body_html TEXT,
  attachments JSONB DEFAULT '[]',
  labels TEXT[],
  folder sync_folder_enum NOT NULL,
  company_id UUID REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES users(id),
  has_ai_processed BOOLEAN DEFAULT false,
  extracted_todos UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gmail_message_id, user_id)
);

-- インデックス
CREATE INDEX idx_gmail_settings_user_status ON gmail_settings(user_id, sync_status);
CREATE INDEX idx_gmail_emails_user_date ON gmail_emails(user_id, sent_date DESC);
CREATE INDEX idx_gmail_emails_company ON gmail_emails(company_id);
CREATE INDEX idx_gmail_emails_ai_processed ON gmail_emails(has_ai_processed);
```

### Phase 2A: Frontend Mock Implementation

**2A.1 コンポーネント構造**
```typescript
// frontend/src/pages/GmailSettingsPage.tsx
export const GmailSettingsPage: React.FC = () => {
  return (
    <div className="gmail-settings-container">
      <PageHeader title="Gmail設定" />
      <div className="settings-content">
        <ConnectionStatus />
        <OAuthSection />
        <SyncSettings />
        <SyncStatusSection />
      </div>
    </div>
  );
};

// frontend/src/components/gmail/ConnectionStatus.tsx
export const ConnectionStatus: React.FC = () => {
  const { settings, stats } = useGmailStore();
  
  return (
    <div className="connection-status">
      <StatusIndicator status={settings?.syncStatus} />
      <AccountInfo gmailAddress={settings?.gmailAddress} />
    </div>
  );
};

// frontend/src/components/gmail/OAuthSection.tsx
export const OAuthSection: React.FC = () => {
  const { startOAuth, refreshToken, disconnect } = useGmailStore();
  
  return (
    <div className="oauth-section">
      <GoogleOAuthButton onClick={startOAuth} />
      <PermissionsList />
      <OAuthActions onRefresh={refreshToken} onDisconnect={disconnect} />
    </div>
  );
};
```

**2A.2 状態管理**
```typescript
// frontend/src/stores/gmailStore.ts
interface GmailState {
  settings: GmailSettings | null;
  stats: GmailSyncStats | null;
  syncOperation: GmailSyncOperation | null;
  loading: boolean;
  error: string | null;
}

export const useGmailStore = create<GmailState>((set, get) => ({
  // @MARK: モックデータから開始、後でAPI連携
  settings: MOCK_GMAIL_SETTINGS,
  stats: MOCK_SYNC_STATS,
  syncOperation: null,
  loading: false,
  error: null,
  
  // OAuth認証
  startOAuth: async () => {
    // @MARK: API連携時に実装
    const authUrl = await gmailService.startOAuth();
    window.location.href = authUrl;
  },
  
  refreshToken: async () => {
    // @MARK: API連携時に実装
    await gmailService.refreshToken();
  },
  
  disconnect: async () => {
    // @MARK: API連携時に実装
    await gmailService.disconnect();
  },
  
  // 設定管理
  updateSettings: async (updates: GmailSettingsUpdateRequest) => {
    // @MARK: API連携時に実装
    const updatedSettings = await gmailService.updateSettings(updates);
    set({ settings: updatedSettings });
  },
  
  // 同期操作
  triggerManualSync: async () => {
    // @MARK: API連携時に実装
    const operation = await gmailService.triggerManualSync();
    set({ syncOperation: operation });
  },
  
  // 統計取得
  loadStats: async () => {
    // @MARK: API連携時に実装
    const stats = await gmailService.getSyncStats();
    set({ stats });
  }
}));
```

### Phase 2B: API Integration

**2B.1 API統合**
```typescript
// frontend/src/services/gmailService.ts
export class GmailService {
  private apiClient: ApiClient;
  
  // @MARK: Phase 2B で実装
  async getSettings(): Promise<GmailSettings | null> {
    return this.apiClient.get(API_PATHS.GMAIL_SETTINGS);
  }
  
  async startOAuth(): Promise<string> {
    const response = await this.apiClient.post(API_PATHS.GMAIL_OAUTH_START);
    return response.authUrl;
  }
  
  async updateSettings(updates: GmailSettingsUpdateRequest): Promise<GmailSettings> {
    return this.apiClient.put(API_PATHS.GMAIL_SETTINGS, updates);
  }
  
  async getSyncStats(): Promise<GmailSyncStats> {
    return this.apiClient.get(API_PATHS.GMAIL_SYNC_STATS);
  }
  
  async triggerManualSync(): Promise<GmailSyncOperation> {
    return this.apiClient.post(API_PATHS.GMAIL_SYNC_MANUAL);
  }
  
  async refreshToken(): Promise<GmailSettings> {
    return this.apiClient.post(API_PATHS.GMAIL_OAUTH_REFRESH);
  }
  
  async disconnect(): Promise<void> {
    return this.apiClient.delete(API_PATHS.GMAIL_DISCONNECT);
  }
}
```

**2B.2 リアルタイム更新**
```typescript
// frontend/src/hooks/useGmailRealtime.ts
export const useGmailRealtime = () => {
  const gmailStore = useGmailStore();
  
  useEffect(() => {
    // @MARK: WebSocket接続でリアルタイム更新
    const ws = new WebSocket(`${WS_BASE_URL}/gmail`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      switch (update.type) {
        case 'SYNC_STARTED':
          gmailStore.setSyncOperation(update.operation);
          break;
        case 'SYNC_PROGRESS':
          gmailStore.updateSyncProgress(update.progress);
          break;
        case 'SYNC_COMPLETED':
          gmailStore.completeSyncOperation(update.operation);
          gmailStore.loadStats();
          break;
        case 'SYNC_ERROR':
          gmailStore.setSyncError(update.error);
          break;
        case 'SETTINGS_UPDATED':
          gmailStore.setSettings(update.settings);
          break;
      }
    };
    
    return () => ws.close();
  }, []);
};
```

### Phase 3: Human Validation

**3.1 機能検証項目**
- [ ] OAuth認証フローの正常動作
- [ ] トークンリフレッシュの自動実行
- [ ] 同期設定の即座反映
- [ ] 手動同期の実行・進捗表示
- [ ] 企業自動関連付けの精度確認
- [ ] AI TODO抽出トリガーの動作
- [ ] エラーハンドリング・復旧機能
- [ ] 同期統計の正確性

**3.2 セキュリティテスト**
- [ ] トークンの安全な暗号化保存
- [ ] OAuth stateパラメータの検証
- [ ] API権限の適切な制限
- [ ] 連携解除時の完全クリーンアップ

## 6. Validation Method（検証方法）

### 6.1 OAuth認証確認
```bash
# OAuth開始
curl -X POST "http://localhost:3001/api/gmail/oauth/start" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 設定取得
curl -X GET "http://localhost:3001/api/gmail/settings" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 手動同期実行
curl -X POST "http://localhost:3001/api/gmail/sync/manual" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 6.2 企業管理連携確認
- メールドメインによる企業自動マッチング
- 新規企業作成の適切な実行
- 企業担当者への自動割り当て

### 6.3 TODO管理連携確認
- AI TODO抽出のトリガー実行
- 抽出結果のTODO管理（005）反映
- 承認ワークフローの正常動作

## 7. Completion Criteria（完了基準）

### 7.1 機能完了基準
- [ ] **OAuth認証**: Google認証・トークン管理が正常動作
- [ ] **メール同期**: 設定間隔での自動同期が確実に実行
- [ ] **企業連携**: メールドメインによる90%以上の自動関連付け
- [ ] **設定管理**: 同期設定の即座反映・永続化
- [ ] **監視機能**: リアルタイム同期状況・統計の正確表示
- [ ] **エラー処理**: 同期エラーの適切な検出・通知・復旧

### 7.2 パフォーマンス完了基準
- [ ] **認証速度**: OAuth認証完了まで30秒以内
- [ ] **同期性能**: 新着メール100件の5分以内処理
- [ ] **API効率**: Gmail API制限内での安定動作

### 7.3 セキュリティ完了基準
- [ ] **トークン保護**: アクセストークンの安全な暗号化保存
- [ ] **権限管理**: 最小権限でのGmail API接続
- [ ] **データ保護**: メール内容の適切な暗号化・アクセス制御

### 7.4 統合完了基準
- [ ] **企業管理統合**: 企業自動関連付け・作成の正常動作
- [ ] **TODO管理統合**: AI抽出TODOの適切な連携
- [ ] **システム統合**: 他機能との安定した連携動作

**実装完了判定**: 上記全基準を満たし、セキュリティテスト・性能テスト・統合テストが全て通過した時点で完了とする。