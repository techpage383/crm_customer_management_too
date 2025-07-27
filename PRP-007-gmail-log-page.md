# PRP-007: Gmailログページ実装計画書

## 1. Goal（目標）

Gmailログページ（P-003）の完全実装により、営業担当者・管理者が以下を達成できる状態を実現する：

- **企業別メール履歴**: 同期されたGmailデータの企業別整理・可視化
- **効率的メール管理**: スレッド表示・フィルタリング・検索による迅速な履歴確認
- **顧客対応状況把握**: 未読・重要・TODO・添付ファイルによる対応状況の一目確認
- **営業活動分析**: メール頻度・内容・対応パターンの分析による営業改善
- **リアルタイム同期**: Gmail設定（006）と連携したリアルタイムメール更新
- **TODO連携**: メール内容からのTODO生成・管理（005）とのシームレス連携

## 2. Why（理由）

### ビジネス価値
- **顧客関係強化**: 過去の対応履歴の即座確認による一貫性のある顧客対応
- **営業機会発見**: メール分析による新たな営業機会・課題の発見
- **対応品質向上**: メール内容の振り返りによる対応品質向上
- **業務効率化**: Gmail・顧客管理システム間の行き来削減による作業効率向上

### 技術的必要性
- **Gmail設定の活用**: Gmail設定（006）で取得したメールデータの可視化
- **企業管理との統合**: 企業管理（004）との連携による顧客別メール整理
- **TODO管理との連携**: TODO管理（005）との統合による業務の一元化
- **AI抽出の前準備**: TODO抽出確認（008）の前段階としてメール内容確認

### 実装優先度の理由
- **順序007**: Gmail設定（006）完了後の必須表示機能
- **TODO抽出準備**: AI TODO抽出確認（008）機能の前提となるメール確認基盤
- **営業活動可視化**: CRM全体のメール対応状況把握の中核機能

## 3. What（要件）

### ユーザーストーリー

**営業担当者として**
- 担当企業とのメール履歴を時系列・スレッド別で確認できる
- 未読・重要・TODO付きメールを優先的に確認できる
- メール内容・添付ファイルを即座に確認・ダウンロードできる
- 過去のメール内容を検索・フィルタリングできる
- メールからTODOを手動作成・AI抽出結果を確認できる

**チームリーダーとして**
- チーム全体のメール対応状況を監視できる
- 重要な顧客とのメール履歴を確認できる
- 対応漏れ・遅延を検出・改善指導できる
- メール対応品質を評価・分析できる

**マネージャーとして**
- 全社的なメール対応状況を把握できる
- 顧客別メール頻度・満足度を分析できる
- Gmail連携効果・使用状況を評価できる
- メールデータのエクスポート・レポート作成ができる

### 技術要件

**フロントエンド要件**
- Material-UIベースの2ペイン レイアウト（企業一覧・メール詳細）
- リアルタイムメール更新・未読カウント表示
- 高速フィルタリング・検索機能
- スレッド展開・折りたたみ機能
- 添付ファイルプレビュー・ダウンロード

**バックエンド要件**
- Gmail同期データの高速検索・フィルタリング
- 企業別メール自動分類・統計
- メール内容の全文検索
- 未読・重要・TODO状態管理
- リアルタイム通知・更新配信

**成功基準**
- 1000件メールでの2秒以内検索
- スレッド表示・展開の瞬時反応
- リアルタイム更新の即座反映
- 添付ファイルの安全なアクセス制御

## 4. All Needed Context（必要な情報）

### A. API仕様（schemas/index.tsから抜粋）

```typescript
// ========== Gmailメール表示関連 ==========
export interface GmailEmailSearchRequest {
  companyId?: ID;
  fromEmail?: string;
  toEmail?: string;
  subject?: string;
  bodyText?: string;
  hasAttachment?: boolean;
  folder?: SyncFolder[];
  dateFrom?: string;
  dateTo?: string;
  unreadOnly?: boolean;
  importantOnly?: boolean;
  hasTodoOnly?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'subject' | 'from';
  sortOrder?: 'asc' | 'desc';
}

export interface GmailEmailSearchResponse {
  emails: GmailEmail[];
  threads: GmailThread[];
  total: number;
  offset: number;
  limit: number;
  stats: {
    totalEmails: number;
    unreadEmails: number;
    importantEmails: number;
    todoEmails: number;
    emailsWithAttachments: number;
  };
}

export interface GmailThread {
  id: ID;
  threadId: string;
  subject: string;
  participants: string[];
  companyId?: ID;
  companyName?: string;
  emailCount: number;
  hasUnread: boolean;
  hasImportant: boolean;
  hasTodo: boolean;
  hasAttachment: boolean;
  firstEmailDate: string;
  lastEmailDate: string;
  emails: GmailEmail[];
  tags: string[];
}

export interface GmailEmailDisplay extends GmailEmail {
  isRead: boolean;
  isImportant: boolean;
  hasTodoExtracted: boolean;
  tags: string[];
  threadPosition: number;
  attachmentPreviews?: Array<{
    attachmentId: string;
    filename: string;
    mimeType: string;
    size: number;
    previewUrl?: string;
    downloadUrl: string;
  }>;
}

export interface CompanyEmailStats {
  companyId: ID;
  companyName: string;
  totalEmails: number;
  unreadEmails: number;
  importantEmails: number;
  todoEmails: number;
  lastEmailDate?: string;
  emailFrequency: 'high' | 'medium' | 'low';
  responseRate: number; // percentage
  avgResponseTime: number; // hours
}

// メール操作関連
export interface GmailEmailUpdateRequest {
  emailId: ID;
  markAsRead?: boolean;
  markAsImportant?: boolean;
  addTags?: string[];
  removeTags?: string[];
}

export interface GmailBulkEmailOperation {
  emailIds: ID[];
  operation: 'markAsRead' | 'markAsUnread' | 'markAsImportant' | 'removeImportant' | 'addTags' | 'removeTags';
  tags?: string[];
}

// ========== APIパス（Gmailログページ関連） ==========
export const API_PATHS = {
  // ... 既存のパス ...
  
  // Gmail メール表示
  GMAIL_EMAILS_BY_COMPANY: '/api/gmail/emails/company/:companyId',
  GMAIL_EMAIL_THREADS: '/api/gmail/threads',
  GMAIL_EMAIL_THREAD_DETAIL: '/api/gmail/threads/:threadId',
  GMAIL_EMAIL_SEARCH_ADVANCED: '/api/gmail/emails/search/advanced',
  GMAIL_EMAIL_UPDATE: '/api/gmail/emails/:id/update',
  GMAIL_EMAIL_BULK_OPERATION: '/api/gmail/emails/bulk',
  
  // 企業別統計
  GMAIL_COMPANY_STATS: '/api/gmail/companies/stats',
  GMAIL_COMPANY_EMAIL_STATS: '/api/gmail/companies/:companyId/stats',
  
  // 添付ファイル
  GMAIL_ATTACHMENT_PREVIEW: '/api/gmail/attachments/:attachmentId/preview',
  GMAIL_ATTACHMENT_DOWNLOAD: '/api/gmail/attachments/:attachmentId/download',
  
  // エクスポート
  GMAIL_EXPORT_COMPANY_EMAILS: '/api/gmail/export/company/:companyId',
  GMAIL_EXPORT_EMAILS: '/api/gmail/export',
} as const;
```

### B. データフロー設計

**Phase 1: Backend API実装**
1. GmailEmailController: メール検索・表示・操作
2. GmailThreadController: スレッド管理・表示
3. CompanyEmailStatsService: 企業別統計
4. EmailSearchService: 高速検索・フィルタリング

**Phase 2A: フロントエンド モック実装**
1. 2ペインレイアウト（企業一覧・メール詳細）
2. @MARK で API接続ポイントをマーク
3. モックデータでの動作確認

**Phase 2B: API統合**
1. @MARK 箇所を実API呼び出しに変更
2. リアルタイム更新機能統合
3. 添付ファイル処理・エラーハンドリング

**Phase 3: 人間による検証**
1. 全機能の動作確認
2. パフォーマンステスト
3. ユーザビリティ検証

### C. モックアップ分析（mockups/gmail-log.html）

**主要機能エリア**
1. **ヘッダー**: Gmail同期状況・ユーザー情報表示
2. **同期情報バー**: 最終同期時刻・新着メール数・対象アカウント
3. **サイドバー**: 企業一覧・検索・フィルタリング（すべて・未読・重要・TODO）
4. **メインエリア**: 選択企業のメール履歴・スレッド表示
5. **アクション**: 手動同期・エクスポート・新規メール作成

**重要なUI要素**
- 企業一覧の未読カウント・重要度表示
- スレッド表示（件数・参加者・最終更新日）
- メール展開表示（送信者・日時・本文・添付ファイル・タグ）
- クイックフィルター（今日・1週間・1ヶ月・添付ファイル有）
- インジケーター（未読・重要・TODO・添付ファイル）

### D. 他システム連携

**企業管理（004）との連携**
- 企業別メール自動分類
- 企業担当者による表示権限制御
- 企業情報とメール履歴の統合表示

**TODO管理（005）との連携**
- メールからのTODO手動作成
- AI抽出TODO結果の表示・確認
- TODO完了時のメール関連タグ更新

**Gmail設定（006）との連携**
- 同期設定による表示対象制御
- リアルタイム同期状況の反映
- 同期エラー・制限の表示

## 5. Implementation Blueprint（実装設計図）

### Phase 1: Backend Implementation

**1.1 Gmailメール検索・表示**
```typescript
// backend/src/features/gmail/controllers/GmailEmailController.ts
export class GmailEmailController {
  async searchEmails(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 高速検索・フィルタリング
  }
  
  async getEmailsByCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 企業別メール一覧取得
  }
  
  async getEmailThreads(req: AuthenticatedRequest, res: Response): Promise<void> {
    // スレッド一覧取得
  }
  
  async getThreadDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    // スレッド詳細・メール展開
  }
  
  async updateEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
    // メール状態更新（既読・重要・タグ）
  }
  
  async bulkUpdateEmails(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 一括メール操作
  }
}
```

**1.2 企業別統計管理**
```typescript
// backend/src/features/gmail/services/CompanyEmailStatsService.ts
export class CompanyEmailStatsService {
  async getCompanyEmailStats(companyId: string): Promise<CompanyEmailStats> {
    // 企業別メール統計計算
  }
  
  async getAllCompaniesStats(userId: string): Promise<CompanyEmailStats[]> {
    // 全企業のメール統計一覧
  }
  
  async calculateResponseMetrics(companyId: string): Promise<{
    responseRate: number;
    avgResponseTime: number;
  }> {
    // 応答率・応答時間計算
  }
  
  async updateStatsRealtime(emailId: string): Promise<void> {
    // リアルタイム統計更新
  }
}
```

**1.3 高速検索サービス**
```typescript
// backend/src/features/gmail/services/EmailSearchService.ts
export class EmailSearchService {
  async searchEmailsAdvanced(
    searchRequest: GmailEmailSearchRequest,
    userId: string
  ): Promise<GmailEmailSearchResponse> {
    // 複合条件による高速検索
  }
  
  async searchByFullText(
    query: string,
    userId: string,
    filters?: Partial<GmailEmailSearchRequest>
  ): Promise<GmailEmail[]> {
    // 全文検索
  }
  
  async getEmailThread(threadId: string): Promise<GmailThread> {
    // スレッド取得・構築
  }
  
  async groupEmailsByThread(emails: GmailEmail[]): Promise<GmailThread[]> {
    // メールのスレッドグループ化
  }
}
```

**1.4 添付ファイル管理**
```typescript
// backend/src/features/gmail/controllers/AttachmentController.ts
export class AttachmentController {
  async getAttachmentPreview(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 添付ファイルプレビュー（画像・PDF等）
  }
  
  async downloadAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 添付ファイルダウンロード
  }
  
  async getAttachmentMetadata(req: AuthenticatedRequest, res: Response): Promise<void> {
    // ファイル情報取得
  }
}
```

**1.5 データベース最適化**
```sql
-- メール検索用インデックス
CREATE INDEX CONCURRENTLY idx_gmail_emails_search 
ON gmail_emails(user_id, company_id, sent_date DESC);

CREATE INDEX CONCURRENTLY idx_gmail_emails_fulltext 
ON gmail_emails USING gin(to_tsvector('japanese', subject || ' ' || COALESCE(body_text, '')));

CREATE INDEX CONCURRENTLY idx_gmail_emails_status 
ON gmail_emails(user_id, is_read, is_important, has_ai_processed);

CREATE INDEX CONCURRENTLY idx_gmail_emails_thread 
ON gmail_emails(thread_id, sent_date ASC);

-- 企業別統計用マテリアライズドビュー
CREATE MATERIALIZED VIEW company_email_stats AS
SELECT 
  e.company_id,
  c.name as company_name,
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE NOT e.is_read) as unread_emails,
  COUNT(*) FILTER (WHERE e.is_important) as important_emails,
  COUNT(*) FILTER (WHERE e.has_ai_processed AND array_length(e.extracted_todos, 1) > 0) as todo_emails,
  MAX(e.sent_date) as last_email_date,
  COUNT(*) FILTER (WHERE e.sent_date >= NOW() - INTERVAL '7 days') as emails_this_week
FROM gmail_emails e
JOIN companies c ON e.company_id = c.id
WHERE e.company_id IS NOT NULL
GROUP BY e.company_id, c.name;

-- 統計の定期更新
CREATE INDEX ON company_email_stats(company_id);
```

### Phase 2A: Frontend Mock Implementation

**2A.1 コンポーネント構造**
```typescript
// frontend/src/pages/GmailLogPage.tsx
export const GmailLogPage: React.FC = () => {
  return (
    <div className="gmail-log-container">
      <PageHeader />
      <SyncInfoBar />
      <div className="main-layout">
        <CompanySidebar />
        <EmailMainContent />
      </div>
    </div>
  );
};

// frontend/src/components/gmail/CompanySidebar.tsx
export const CompanySidebar: React.FC = () => {
  return (
    <div className="company-sidebar">
      <SearchSection />
      <FilterTabs />
      <CompanyList />
    </div>
  );
};

// frontend/src/components/gmail/EmailMainContent.tsx
export const EmailMainContent: React.FC = () => {
  return (
    <div className="email-main-content">
      <ContentHeader />
      <QuickFilters />
      <EmailThreadList />
    </div>
  );
};
```

**2A.2 状態管理**
```typescript
// frontend/src/stores/gmailLogStore.ts
interface GmailLogState {
  companies: CompanyEmailStats[];
  selectedCompany: CompanyEmailStats | null;
  emailThreads: GmailThread[];
  expandedThreads: Set<string>;
  currentFilter: 'all' | 'unread' | 'important' | 'todo';
  quickFilter: 'all' | 'today' | 'week' | 'month' | 'attachments';
  searchTerm: string;
  syncStatus: 'active' | 'syncing' | 'error';
  loading: boolean;
  error: string | null;
}

export const useGmailLogStore = create<GmailLogState>((set, get) => ({
  // @MARK: モックデータから開始、後でAPI連携
  companies: MOCK_COMPANY_EMAIL_STATS,
  selectedCompany: null,
  emailThreads: [],
  expandedThreads: new Set(),
  currentFilter: 'all',
  quickFilter: 'all',
  searchTerm: '',
  syncStatus: 'active',
  loading: false,
  error: null,
  
  // 企業選択
  selectCompany: async (company: CompanyEmailStats) => {
    set({ selectedCompany: company, loading: true });
    // @MARK: API連携時に実装
    const threads = await gmailService.getCompanyEmailThreads(company.companyId);
    set({ emailThreads: threads, loading: false });
  },
  
  // フィルター更新
  setFilter: (filter) => {
    set({ currentFilter: filter });
    // @MARK: フィルター適用ロジック
  },
  
  setQuickFilter: (filter) => {
    set({ quickFilter: filter });
    // @MARK: クイックフィルター適用
  },
  
  // 検索
  setSearchTerm: (term) => {
    set({ searchTerm: term });
    // @MARK: 検索実行
  },
  
  // スレッド操作
  toggleThread: (threadId: string) => {
    const expanded = get().expandedThreads;
    if (expanded.has(threadId)) {
      expanded.delete(threadId);
    } else {
      expanded.add(threadId);
    }
    set({ expandedThreads: new Set(expanded) });
  },
  
  // メール操作
  markEmailAsRead: async (emailId: string) => {
    // @MARK: API連携時に実装
    await gmailService.updateEmail(emailId, { markAsRead: true });
  },
  
  markEmailAsImportant: async (emailId: string) => {
    // @MARK: API連携時に実装
    await gmailService.updateEmail(emailId, { markAsImportant: true });
  }
}));
```

### Phase 2B: API Integration

**2B.1 API統合**
```typescript
// frontend/src/services/gmailLogService.ts
export class GmailLogService {
  private apiClient: ApiClient;
  
  // @MARK: Phase 2B で実装
  async getCompanyEmailStats(): Promise<CompanyEmailStats[]> {
    return this.apiClient.get(API_PATHS.GMAIL_COMPANY_STATS);
  }
  
  async getCompanyEmailThreads(companyId: string): Promise<GmailThread[]> {
    return this.apiClient.get(API_PATHS.GMAIL_EMAILS_BY_COMPANY.replace(':companyId', companyId));
  }
  
  async searchEmails(searchRequest: GmailEmailSearchRequest): Promise<GmailEmailSearchResponse> {
    return this.apiClient.post(API_PATHS.GMAIL_EMAIL_SEARCH_ADVANCED, searchRequest);
  }
  
  async getThreadDetail(threadId: string): Promise<GmailThread> {
    return this.apiClient.get(API_PATHS.GMAIL_EMAIL_THREAD_DETAIL.replace(':threadId', threadId));
  }
  
  async updateEmail(emailId: string, updates: GmailEmailUpdateRequest): Promise<void> {
    return this.apiClient.put(API_PATHS.GMAIL_EMAIL_UPDATE.replace(':id', emailId), updates);
  }
  
  async downloadAttachment(attachmentId: string): Promise<Blob> {
    return this.apiClient.get(API_PATHS.GMAIL_ATTACHMENT_DOWNLOAD.replace(':attachmentId', attachmentId), {
      responseType: 'blob'
    });
  }
  
  async exportCompanyEmails(companyId: string, format: 'csv' | 'excel'): Promise<Blob> {
    return this.apiClient.get(API_PATHS.GMAIL_EXPORT_COMPANY_EMAILS.replace(':companyId', companyId), {
      params: { format },
      responseType: 'blob'
    });
  }
}
```

**2B.2 リアルタイム更新**
```typescript
// frontend/src/hooks/useGmailLogRealtime.ts
export const useGmailLogRealtime = () => {
  const gmailLogStore = useGmailLogStore();
  
  useEffect(() => {
    // @MARK: WebSocket接続でリアルタイム更新
    const ws = new WebSocket(`${WS_BASE_URL}/gmail/log`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      switch (update.type) {
        case 'NEW_EMAIL_SYNCED':
          gmailLogStore.addNewEmail(update.email);
          gmailLogStore.updateCompanyStats(update.email.companyId);
          break;
        case 'EMAIL_STATUS_UPDATED':
          gmailLogStore.updateEmailStatus(update.emailId, update.status);
          break;
        case 'SYNC_STATUS_CHANGED':
          gmailLogStore.setSyncStatus(update.status);
          break;
        case 'COMPANY_STATS_UPDATED':
          gmailLogStore.updateCompanyStats(update.companyId, update.stats);
          break;
      }
    };
    
    return () => ws.close();
  }, []);
};
```

### Phase 3: Human Validation

**3.1 機能検証項目**
- [ ] 企業別メール表示の正確性
- [ ] スレッド表示・展開の正常動作
- [ ] フィルター・検索機能の性能
- [ ] 添付ファイルプレビュー・ダウンロード
- [ ] リアルタイム更新の即座反映
- [ ] メール状態更新（既読・重要・タグ）
- [ ] エクスポート機能の正常動作
- [ ] 権限制御の正確性

**3.2 パフォーマンステスト**
- [ ] 1000件メールでの2秒以内検索
- [ ] スレッド展開の瞬時応答
- [ ] 添付ファイルの適切なストリーミング

## 6. Validation Method（検証方法）

### 6.1 API動作確認
```bash
# 企業別メール統計取得
curl -X GET "http://localhost:3001/api/gmail/companies/stats" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 企業別メールスレッド取得
curl -X GET "http://localhost:3001/api/gmail/emails/company/company-123" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 高度な検索
curl -X POST "http://localhost:3001/api/gmail/emails/search/advanced" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "companyId": "company-123",
    "hasAttachment": true,
    "dateFrom": "2024-01-01",
    "sortBy": "date",
    "sortOrder": "desc"
  }'

# メール状態更新
curl -X PUT "http://localhost:3001/api/gmail/emails/email-456/update" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "markAsRead": true,
    "addTags": ["重要", "フォローアップ"]
  }'
```

### 6.2 統合機能確認
- 企業管理（004）との企業情報連携
- TODO管理（005）との手動TODO作成
- Gmail設定（006）との同期状況連携

### 6.3 ユーザビリティテスト
- 企業選択からメール表示までの流れ
- スレッド展開・折りたたみの直感性
- フィルター・検索の使いやすさ
- 添付ファイル操作の安全性

## 7. Completion Criteria（完了基準）

### 7.1 機能完了基準
- [ ] **企業別表示**: 同期されたメールの企業別正確な分類・表示
- [ ] **スレッド管理**: Gmail スレッドの適切な表示・展開機能
- [ ] **高速検索**: 複合条件・全文検索での2秒以内レスポンス
- [ ] **状態管理**: 未読・重要・TODO状態の正確な管理・更新
- [ ] **添付ファイル**: プレビュー・ダウンロードの安全な実装
- [ ] **リアルタイム**: Gmail同期と連動した即座なUI更新

### 7.2 パフォーマンス完了基準
- [ ] **検索性能**: 1000件メールでの2秒以内検索
- [ ] **表示性能**: スレッド展開・企業切り替えの瞬時応答
- [ ] **ファイル処理**: 添付ファイルの効率的なストリーミング

### 7.3 ユーザビリティ完了基準
- [ ] **直感的操作**: 新規ユーザーが3分以内に企業メール確認可能
- [ ] **効率的管理**: 未読メール処理が従来の50%時間で完了
- [ ] **モバイル対応**: タブレットでの基本メール確認が可能

### 7.4 統合完了基準
- [ ] **企業管理統合**: 企業情報とメール履歴の完全連携
- [ ] **TODO管理統合**: メール→TODO作成の円滑な流れ
- [ ] **Gmail設定統合**: 同期設定・状況の正確な反映

**実装完了判定**: 上記全基準を満たし、性能テスト・統合テスト・ユーザビリティテストが全て通過した時点で完了とする。