# PRP-011: 企業別契約管理実装計画書

## 1. Goal（目標）

企業別契約管理（P-008）の完全実装により、営業担当者・管理者が以下を達成できる状態を実現する：

- **契約ライフサイクル管理**: 商材導入から契約締結・更新・終了までの一貫した管理
- **企業別契約状況可視化**: 企業ごとの全契約状況・ステータス・期限の包括的管理
- **更新管理**: 契約更新の適切なタイミング通知・リマインド・手続き支援
- **商材連携**: 商材マスタ（009）・商品管理（010）との连携による商材詳細管理
- **提案統合**: 提案管理（012）との連携による提案→契約への seamless な移行
- **分析・予測**: 契約実績・更新予測・売上予測の戦略的分析・意思決定支援

## 2. Why（理由）

### ビジネス価値
- **売上最大化**: 契約更新機会の最適な管理による継続売上の確保・拡大
- **顧客満足向上**: 適切な契約管理による顧客ニーズ対応・サービス品質向上
- **営業効率化**: 契約状況の一元管理による営業活動の最適化・集中
- **リスク管理**: 契約期限・条件の適切な管理によるビジネスリスクの最小化

### 技術的必要性
- **商材活用**: 商材マスタ（009）・商品管理（010）の商材情報の契約実装
- **企業管理統合**: 企業管理（004）の顧客データとの契約情報連携
- **提案管理連携**: 提案管理（012）での提案内容の契約化プロセス
- **営業プロセス完結**: CRM営業プロセスの最終段階としての契約管理

### 実装優先度の理由
- **順序011**: 商材マスタ・商品管理完了後の契約実装として論理的順序
- **営業クロージング**: 提案→契約の重要なビジネスプロセス完結
- **継続売上基盤**: 企業との長期的関係維持・売上継続の核心機能

## 3. What（要件）

### ユーザーストーリー

**営業担当者として**
- 担当企業の全契約状況を一覧で確認できる
- 契約更新期限・条件を適切にトラッキングできる
- 新規契約の作成・既存契約の更新手続きができる
- 契約に関連する商材詳細・価格・条件を正確に管理できる
- 契約ステータス変更・履歴管理・承認プロセスを実行できる

**契約管理者として**
- 全企業の契約状況・期限・リスクを総合的に監視できる
- 契約テンプレート・標準条件・価格体系を管理できる
- 契約承認・ワークフロー・エスカレーション管理ができる
- 契約実績・更新率・売上予測の分析ができる
- 法務・コンプライアンス要件の遵守管理ができる

**マネージャーとして**
- 契約ポートフォリオ・売上予測・更新リスクを把握できる
- 営業チームの契約活動・パフォーマンスを監視できる
- 戦略的契約判断・価格決定・リソース配分を行える
- 市場動向・競合分析・契約トレンドを分析できる

### 技術要件

**フロントエンド要件**
- Material-UIベースの企業別契約管理ダッシュボード
- 契約ステータス・期限・金額の視覚的表示
- Chart.js による契約分析・売上予測・更新予測表示
- ドラッグ&ドロップによる契約ステータス管理
- カレンダー統合による契約期限・リマインド管理

**バックエンド要件**
- 契約CRUD・ワークフロー管理のRESTful API
- 商材マスタ・商品管理との統合データ管理
- 契約テンプレート・承認プロセス・通知システム
- 契約分析・売上予測・更新予測エンジン
- 電子署名・契約文書管理・アーカイブ機能

**成功基準**
- 100社×平均5契約での3秒以内表示
- 契約更新率95%以上の管理効率
- 契約情報の完全性・整合性維持
- 商材・提案管理との完全連携

## 4. All Needed Context（必要な情報）

### A. API仕様（schemas/index.tsから抜粋）

```typescript
// ========== 契約管理関連 ==========
export enum ContractStatus {
  DRAFT = 'draft',                    // 下書き
  UNDER_REVIEW = 'under_review',      // 審査中
  PENDING_APPROVAL = 'pending_approval', // 承認待ち
  APPROVED = 'approved',              // 承認済み
  ACTIVE = 'active',                  // 契約中
  RENEWAL_DUE = 'renewal_due',        // 更新要
  RENEWAL_IN_PROGRESS = 'renewal_in_progress', // 更新手続き中
  SUSPENDED = 'suspended',            // 一時停止
  TERMINATED = 'terminated',          // 終了
  EXPIRED = 'expired'                 // 期限切れ
}

export enum ContractType {
  STANDARD = 'standard',              // 標準契約
  CUSTOM = 'custom',                  // カスタム契約
  TRIAL = 'trial',                   // 試用契約
  RENEWAL = 'renewal',               // 更新契約
  UPGRADE = 'upgrade',               // アップグレード契約
  DOWNGRADE = 'downgrade'            // ダウングレード契約
}

export enum PaymentCycle {
  MONTHLY = 'monthly',               // 月額
  QUARTERLY = 'quarterly',           // 四半期
  SEMI_ANNUAL = 'semi_annual',       // 半年
  ANNUAL = 'annual',                 // 年額
  ONE_TIME = 'one_time'              // 一回払い
}

export interface ContractBase {
  id: ID;
  companyId: ID;
  companyName: string;
  productId: ID;  // CompanyProduct.id（商品管理との連携）
  productName: string;
  productMasterId: ID;  // ProductMaster.id（商材マスタとの連携）
  contractType: ContractType;
  status: ContractStatus;
  
  // 契約期間・条件
  startDate: string;
  endDate: string;
  renewalDate?: string;
  autoRenewal: boolean;
  renewalNoticeDay: number; // 更新通知日数（契約終了前）
  
  // 金額・支払い
  contractAmount: number;
  currency: string;
  paymentCycle: PaymentCycle;
  paymentTerms: string;  // 支払い条件の詳細
  
  // 契約詳細
  contractTerms: string;  // 契約条件・特記事項
  deliverables: string[]; // 納品物・サービス内容
  serviceLevel?: {
    sla: string;          // サービスレベル合意
    supportHours: string; // サポート時間
    responseTime: string; // 応答時間
  };
  
  // 承認・ワークフロー
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: ID;
  approvedAt?: string;
  approvalComments?: string;
  
  // 担当者・管理
  primaryAssigneeId: ID;
  secondaryAssigneeIds: ID[];
  salesRepId: ID;  // 営業担当者
  accountManagerId?: ID;  // アカウントマネージャー
  
  // 文書管理
  documents: Array<{
    type: 'contract' | 'amendment' | 'invoice' | 'report' | 'other';
    name: string;
    url: string;
    uploadedAt: string;
    uploadedBy: ID;
  }>;
  
  // 履歴・監査
  createdAt: string;
  updatedAt: string;
  createdBy: ID;
  updatedBy: ID;
  statusHistory: Array<{
    status: ContractStatus;
    changedAt: string;
    changedBy: ID;
    reason?: string;
  }>;
  
  // メタデータ
  tags: string[];
  customFields: Record<string, any>;
  notes: string;
}

export interface Contract extends ContractBase {}

export interface ContractCreateRequest {
  companyId: ID;
  productId: ID;
  contractType: ContractType;
  startDate: string;
  endDate: string;
  autoRenewal?: boolean;
  renewalNoticeDay?: number;
  contractAmount: number;
  currency?: string;
  paymentCycle: PaymentCycle;
  paymentTerms?: string;
  contractTerms?: string;
  deliverables?: string[];
  serviceLevel?: {
    sla: string;
    supportHours: string;
    responseTime: string;
  };
  primaryAssigneeId: ID;
  secondaryAssigneeIds?: ID[];
  salesRepId: ID;
  tags?: string[];
  customFields?: Record<string, any>;
  notes?: string;
}

export interface ContractUpdateRequest {
  contractType?: ContractType;
  status?: ContractStatus;
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  autoRenewal?: boolean;
  renewalNoticeDay?: number;
  contractAmount?: number;
  currency?: string;
  paymentCycle?: PaymentCycle;
  paymentTerms?: string;
  contractTerms?: string;
  deliverables?: string[];
  serviceLevel?: {
    sla?: string;
    supportHours?: string;
    responseTime?: string;
  };
  primaryAssigneeId?: ID;
  secondaryAssigneeIds?: ID[];
  accountManagerId?: ID;
  approvalComments?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  notes?: string;
}

export interface ContractSearchRequest {
  companyIds?: ID[];
  productIds?: ID[];
  productMasterIds?: ID[];
  status?: ContractStatus[];
  contractType?: ContractType[];
  salesRepIds?: ID[];
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  renewalDueDateFrom?: string;
  renewalDueDateTo?: string;
  amountMin?: number;
  amountMax?: number;
  paymentCycle?: PaymentCycle[];
  autoRenewal?: boolean;
  tags?: string[];
  customFieldFilters?: Record<string, any>;
  limit?: number;
  offset?: number;
  sortBy?: 'startDate' | 'endDate' | 'amount' | 'companyName' | 'productName' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ContractSearchResponse {
  contracts: Contract[];
  total: number;
  offset: number;
  limit: number;
  summary: {
    totalAmount: number;
    totalActive: number;
    totalRenewalDue: number;
    averageContractValue: number;
  };
}

// 契約分析・統計
export interface ContractAnalytics {
  companyId?: ID;
  totalContracts: number;
  activeContracts: number;
  contractsNearRenewal: number;
  totalRevenue: number;
  averageContractValue: number;
  renewalRate: number; // 更新率（%）
  
  // 期間別分析
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    newContracts: number;
    renewedContracts: number;
    expiredContracts: number;
  }>;
  
  // 商材別分析
  productBreakdown: Array<{
    productId: ID;
    productName: string;
    contractCount: number;
    totalRevenue: number;
    averageContractValue: number;
  }>;
  
  // 更新予測
  renewalForecast: Array<{
    renewalDate: string;
    contractsCount: number;
    estimatedRevenue: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
}

export interface ContractRenewalAlert {
  contractId: ID;
  companyId: ID;
  companyName: string;
  productName: string;
  currentEndDate: string;
  daysUntilRenewal: number;
  contractAmount: number;
  renewalRisk: 'low' | 'medium' | 'high';
  recommendedActions: string[];
  lastContactDate?: string;
  assigneeId: ID;
  assigneeName: string;
}

// ========== APIパス（契約管理関連） ==========
export const API_PATHS = {
  // ... 既存のパス ...
  
  // 契約管理
  CONTRACTS: '/api/contracts',
  CONTRACT_DETAIL: '/api/contracts/:id',
  CONTRACT_SEARCH: '/api/contracts/search',
  CONTRACT_BULK: '/api/contracts/bulk',
  
  // 企業別契約
  COMPANY_CONTRACTS: '/api/companies/:companyId/contracts',
  COMPANY_CONTRACT_SUMMARY: '/api/companies/:companyId/contracts/summary',
  
  // 契約承認・ワークフロー
  CONTRACT_APPROVAL: '/api/contracts/:id/approval',
  CONTRACT_STATUS_CHANGE: '/api/contracts/:id/status',
  CONTRACT_WORKFLOW: '/api/contracts/:id/workflow',
  
  // 契約更新
  CONTRACT_RENEWAL: '/api/contracts/:id/renewal',
  CONTRACT_RENEWAL_ALERTS: '/api/contracts/renewal-alerts',
  CONTRACT_RENEWAL_FORECAST: '/api/contracts/renewal-forecast',
  
  // 契約分析
  CONTRACT_ANALYTICS: '/api/contracts/analytics',
  CONTRACT_COMPANY_ANALYTICS: '/api/companies/:companyId/contracts/analytics',
  CONTRACT_REVENUE_FORECAST: '/api/contracts/revenue-forecast',
  
  // 契約文書
  CONTRACT_DOCUMENTS: '/api/contracts/:id/documents',
  CONTRACT_DOCUMENT_UPLOAD: '/api/contracts/:id/documents/upload',
  CONTRACT_DOCUMENT_DOWNLOAD: '/api/contracts/:id/documents/:documentId/download',
  CONTRACT_TEMPLATE: '/api/contracts/templates',
  
  // 契約レポート
  CONTRACT_REPORTS: '/api/contracts/reports',
  CONTRACT_EXPORT: '/api/contracts/export',
} as const;
```

### B. データフロー設計

**Phase 1: Backend API実装**
1. ContractController: CRUD + 検索・フィルタリング・承認ワークフロー
2. 契約更新管理・アラート・通知システム
3. 契約分析・売上予測エンジン
4. 文書管理・電子署名統合機能

**Phase 2A: フロントエンド モック実装**
1. Material-UIベースの企業別契約ダッシュボード
2. @MARK で API接続ポイントをマーク
3. モックデータでの動作確認

**Phase 2B: API統合**
1. @MARK 箇所を実API呼び出しに変更
2. 商材・商品管理システムとの統合
3. エラーハンドリング・バリデーション

**Phase 3: 人間による検証**
1. 全機能の動作確認
2. 契約ワークフローテスト
3. データ整合性・セキュリティ確認

### C. モックアップ分析（mockups/contract-management.html）

**主要機能エリア**
1. **企業情報ヘッダー**: 企業名・担当者・総契約数・新規契約追加
2. **導入済み商材**: 契約中商材・ステータス・期限・アクション
3. **提案中商材**: 提案状況・期限・回答待ち・フォローアップ
4. **サイドバー統計**: 契約サマリー・更新アラート・クイックアクション

**重要なUI要素**
- ステータスインジケーター（アクティブ・更新要・期限切れ・提案中）
- 契約期間・自動更新・条件の明確な表示
- 更新アラート・リマインド・タスク管理
- 契約金額・支払いサイクル・条件の管理
- Chart.js による契約状況・売上予測の可視化

### D. 他システム連携

**商材マスタ（009）との連携**
- 契約対象商材の詳細情報・仕様・価格体系
- 商材バージョン管理・アップデート通知
- 商材固有の契約条件・サービスレベル

**商品管理（010）との連携**
- 企業固有商品設定の契約実装
- カスタマイズ内容・オプション・価格調整
- 商品デプロイメント状況との連動

**提案管理（012）との連携**
- 提案内容の契約化・承認プロセス
- 提案条件の契約条件への反映
- 提案→契約の seamless な移行

**企業管理（004）との連携**
- 企業情報・担当者・権限管理
- 企業別契約ポリシー・承認ルート
- 顧客関係・信用情報・リスク評価

## 5. Implementation Blueprint（実装設計図）

### Phase 1: Backend Implementation

**1.1 契約基本管理**
```typescript
// backend/src/features/contract/controllers/ContractController.ts
export class ContractController {
  async createContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 新規契約作成（商材・商品情報連携）
  }
  
  async getContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 契約一覧取得（企業・ステータス・期限フィルター）
  }
  
  async getContractById(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 契約詳細取得（商材・文書・履歴含む）
  }
  
  async updateContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 契約更新（ステータス変更・承認・条件変更）
  }
  
  async deleteContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 契約削除（論理削除・アーカイブ）
  }
  
  async searchContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 高度な契約検索・フィルタリング
  }
  
  async getCompanyContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 企業別契約一覧・サマリー
  }
  
  async bulkUpdateContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 一括ステータス更新・承認
  }
}
```

**1.2 契約承認・ワークフロー**
```typescript
// backend/src/features/contract/services/ContractApprovalService.ts
export class ContractApprovalService {
  async submitForApproval(contractId: string, submitterId: string): Promise<ApprovalWorkflow> {
    // 契約承認申請・ワークフロー開始
  }
  
  async approveContract(
    contractId: string, 
    approverId: string, 
    comments?: string
  ): Promise<Contract> {
    // 契約承認・ステータス更新
  }
  
  async rejectContract(
    contractId: string, 
    approverId: string, 
    reason: string
  ): Promise<Contract> {
    // 契約却下・差し戻し
  }
  
  async getApprovalWorkflow(contractId: string): Promise<ApprovalWorkflow> {
    // 承認ワークフロー状況確認
  }
  
  async getPendingApprovals(approverId: string): Promise<Contract[]> {
    // 承認待ち契約一覧
  }
  
  async escalateApproval(contractId: string): Promise<void> {
    // 承認エスカレーション・上位承認者への移管
  }
}
```

**1.3 契約更新管理**
```typescript
// backend/src/features/contract/services/ContractRenewalService.ts
export class ContractRenewalService {
  async getRenewalAlerts(): Promise<ContractRenewalAlert[]> {
    // 更新予定契約・アラート取得
  }
  
  async createRenewalContract(
    originalContractId: string, 
    renewalData: ContractRenewalRequest
  ): Promise<Contract> {
    // 更新契約作成
  }
  
  async processAutoRenewal(contractId: string): Promise<Contract> {
    // 自動更新処理
  }
  
  async sendRenewalReminder(contractId: string): Promise<void> {
    // 更新リマインド送信
  }
  
  async getRenewalForecast(
    periodStart: string, 
    periodEnd: string
  ): Promise<Array<{
    renewalDate: string;
    contractsCount: number;
    estimatedRevenue: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>> {
    // 更新予測・売上予測
  }
  
  async updateRenewalSettings(
    contractId: string, 
    settings: {
      autoRenewal: boolean;
      renewalNoticeDay: number;
      renewalTerms?: string;
    }
  ): Promise<Contract> {
    // 更新設定変更
  }
}
```

**1.4 契約分析・レポート**
```typescript
// backend/src/features/contract/services/ContractAnalyticsService.ts
export class ContractAnalyticsService {
  async getContractAnalytics(
    companyId?: string,
    dateRange?: { start: string; end: string }
  ): Promise<ContractAnalytics> {
    // 契約分析データ取得
  }
  
  async getRevenueAnalysis(
    timeframe: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{
    totalRevenue: number;
    recurringRevenue: number;
    oneTimeRevenue: number;
    growthRate: number;
    trendData: Array<{
      period: string;
      revenue: number;
      contracts: number;
    }>;
  }> {
    // 売上分析・成長率計算
  }
  
  async getContractHealthScore(contractId: string): Promise<{
    score: number; // 0-100
    factors: {
      paymentHistory: number;
      usageLevel: number;
      supportTickets: number;
      lastContact: number;
    };
    renewalProbability: number;
    recommendations: string[];
  }> {
    // 契約健全性スコア・更新可能性評価
  }
  
  async generateContractReport(
    reportType: 'monthly' | 'quarterly' | 'annual' | 'custom',
    options: {
      companyIds?: string[];
      productIds?: string[];
      includeCharts: boolean;
      format: 'pdf' | 'excel' | 'json';
    }
  ): Promise<{
    reportId: string;
    downloadUrl: string;
    generatedAt: string;
  }> {
    // 契約レポート生成
  }
}
```

**1.5 データベース設計**
```sql
-- 契約テーブル
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  product_id UUID NOT NULL REFERENCES company_products(id),
  product_master_id UUID NOT NULL REFERENCES product_masters(id),
  contract_type contract_type_enum NOT NULL,
  status contract_status_enum NOT NULL DEFAULT 'draft',
  
  -- 契約期間
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE,
  auto_renewal BOOLEAN DEFAULT false,
  renewal_notice_day INTEGER DEFAULT 30,
  
  -- 金額・支払い
  contract_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'JPY',
  payment_cycle payment_cycle_enum NOT NULL,
  payment_terms TEXT,
  
  -- 契約詳細
  contract_terms TEXT,
  deliverables TEXT[],
  service_level JSONB DEFAULT '{}',
  
  -- 承認・ワークフロー
  approval_status VARCHAR(20) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_comments TEXT,
  
  -- 担当者
  primary_assignee_id UUID NOT NULL REFERENCES users(id),
  secondary_assignee_ids UUID[],
  sales_rep_id UUID NOT NULL REFERENCES users(id),
  account_manager_id UUID REFERENCES users(id),
  
  -- メタデータ
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  
  -- 監査
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 契約ステータス履歴テーブル
CREATE TABLE contract_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  status contract_status_enum NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID NOT NULL REFERENCES users(id),
  reason TEXT
);

-- 契約文書テーブル
CREATE TABLE contract_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  document_type VARCHAR(50) NOT NULL,
  name VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  is_signed BOOLEAN DEFAULT false,
  signature_date TIMESTAMP WITH TIME ZONE
);

-- 契約更新アラートテーブル
CREATE TABLE contract_renewal_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  alert_type VARCHAR(50) NOT NULL,  -- 'renewal_due', 'payment_overdue', etc.
  alert_date DATE NOT NULL,
  message TEXT NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_contracts_company_status ON contracts(company_id, status);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_contracts_renewal_date ON contracts(renewal_date);
CREATE INDEX idx_contracts_sales_rep ON contracts(sales_rep_id);
CREATE INDEX idx_contracts_product ON contracts(product_id, product_master_id);
CREATE INDEX idx_contract_status_history_contract ON contract_status_history(contract_id);
CREATE INDEX idx_contract_documents_contract ON contract_documents(contract_id);
CREATE INDEX idx_contract_renewal_alerts_date ON contract_renewal_alerts(alert_date, is_sent);
```

### Phase 2A: Frontend Mock Implementation

**2A.1 コンポーネント構造**
```typescript
// frontend/src/pages/CompanyContractManagementPage.tsx
export const CompanyContractManagementPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  
  return (
    <div className="contract-management-container">
      <PageHeader title="契約管理" breadcrumb={['企業管理', companyName, '契約状況']} />
      <CompanyContractHeader companyId={companyId} />
      <div className="contract-content-grid">
        <ContractMainContent companyId={companyId} />
        <ContractSidebar companyId={companyId} />
      </div>
    </div>
  );
};

// frontend/src/components/contract/CompanyContractHeader.tsx
export const CompanyContractHeader: React.FC<{ companyId: string }> = ({ companyId }) => {
  return (
    <div className="company-contract-header">
      <CompanyInfo companyId={companyId} />
      <NewContractButton companyId={companyId} />
    </div>
  );
};

// frontend/src/components/contract/ContractMainContent.tsx
export const ContractMainContent: React.FC<{ companyId: string }> = ({ companyId }) => {
  return (
    <div className="contract-main-content">
      <ActiveContractsCard companyId={companyId} />
      <ProposalContractsCard companyId={companyId} />
    </div>
  );
};

// frontend/src/components/contract/ContractSidebar.tsx
export const ContractSidebar: React.FC<{ companyId: string }> = ({ companyId }) => {
  return (
    <div className="contract-sidebar">
      <ContractSummaryCard companyId={companyId} />
      <RenewalAlertsCard companyId={companyId} />
      <QuickActionsCard companyId={companyId} />
    </div>
  );
};
```

**2A.2 状態管理**
```typescript
// frontend/src/stores/contractStore.ts
interface ContractState {
  contracts: Contract[];
  selectedContract: Contract | null;
  companyContracts: Record<string, Contract[]>;
  contractAnalytics: ContractAnalytics | null;
  renewalAlerts: ContractRenewalAlert[];
  filters: {
    status: ContractStatus[];
    contractType: ContractType[];
    dateRange: { start: string; end: string } | null;
    amountRange: { min: number; max: number } | null;
  };
  loading: boolean;
  error: string | null;
}

export const useContractStore = create<ContractState>((set, get) => ({
  // @MARK: モックデータから開始、後でAPI連携
  contracts: MOCK_CONTRACTS,
  selectedContract: null,
  companyContracts: {},
  contractAnalytics: null,
  renewalAlerts: MOCK_RENEWAL_ALERTS,
  filters: {
    status: [],
    contractType: [],
    dateRange: null,
    amountRange: null,
  },
  loading: false,
  error: null,
  
  // 企業別契約取得
  loadCompanyContracts: async (companyId: string) => {
    set({ loading: true });
    try {
      // @MARK: API連携時に実装
      const contracts = await contractService.getCompanyContracts(companyId);
      set({ 
        companyContracts: { 
          ...get().companyContracts, 
          [companyId]: contracts 
        },
        loading: false 
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  // 契約作成・更新
  createContract: async (contractData: ContractCreateRequest) => {
    // @MARK: API連携時に実装
    const newContract = await contractService.createContract(contractData);
    const contracts = [...get().contracts, newContract];
    set({ contracts });
    
    // 企業別契約リストも更新
    const companyContracts = get().companyContracts;
    const companyId = contractData.companyId;
    if (companyContracts[companyId]) {
      companyContracts[companyId] = [...companyContracts[companyId], newContract];
      set({ companyContracts: { ...companyContracts } });
    }
  },
  
  updateContract: async (contractId: string, updates: ContractUpdateRequest) => {
    // @MARK: API連携時に実装
    const updatedContract = await contractService.updateContract(contractId, updates);
    const contracts = get().contracts.map(c => 
      c.id === contractId ? updatedContract : c
    );
    set({ contracts, selectedContract: updatedContract });
    
    // 企業別契約リストも更新
    const companyContracts = get().companyContracts;
    Object.keys(companyContracts).forEach(companyId => {
      companyContracts[companyId] = companyContracts[companyId].map(c =>
        c.id === contractId ? updatedContract : c
      );
    });
    set({ companyContracts: { ...companyContracts } });
  },
  
  // 契約承認・ステータス変更
  approveContract: async (contractId: string, comments?: string) => {
    // @MARK: API連携時に実装
    const approvedContract = await contractService.approveContract(contractId, comments);
    await get().updateContract(contractId, { status: 'approved' });
  },
  
  changeContractStatus: async (contractId: string, status: ContractStatus, reason?: string) => {
    // @MARK: API連携時に実装
    await contractService.changeContractStatus(contractId, status, reason);
    await get().updateContract(contractId, { status });
  },
  
  // 契約更新
  createRenewalContract: async (originalContractId: string, renewalData: any) => {
    // @MARK: API連携時に実装
    const renewalContract = await contractService.createRenewalContract(originalContractId, renewalData);
    const contracts = [...get().contracts, renewalContract];
    set({ contracts });
  },
  
  // 更新アラート管理
  loadRenewalAlerts: async (companyId?: string) => {
    // @MARK: API連携時に実装
    const alerts = await contractService.getRenewalAlerts(companyId);
    set({ renewalAlerts: alerts });
  },
  
  sendRenewalReminder: async (contractId: string) => {
    // @MARK: API連携時に実装
    await contractService.sendRenewalReminder(contractId);
    // アラート状況を更新
    await get().loadRenewalAlerts();
  },
  
  // 契約分析
  loadContractAnalytics: async (companyId?: string) => {
    // @MARK: API連携時に実装
    const analytics = await contractService.getContractAnalytics(companyId);
    set({ contractAnalytics: analytics });
  },
  
  // フィルター・検索
  updateFilters: (newFilters: Partial<typeof get().filters>) => {
    set({ filters: { ...get().filters, ...newFilters } });
  },
  
  searchContracts: async (searchRequest: ContractSearchRequest) => {
    // @MARK: API連携時に実装
    const response = await contractService.searchContracts(searchRequest);
    set({ contracts: response.contracts });
  },
}));
```

### Phase 2B: API Integration

**2B.1 API統合**
```typescript
// frontend/src/services/contractService.ts
export class ContractService {
  private apiClient: ApiClient;
  
  // @MARK: Phase 2B で実装
  async getContracts(): Promise<Contract[]> {
    return this.apiClient.get(API_PATHS.CONTRACTS);
  }
  
  async getCompanyContracts(companyId: string): Promise<Contract[]> {
    return this.apiClient.get(API_PATHS.COMPANY_CONTRACTS.replace(':companyId', companyId));
  }
  
  async getContractById(contractId: string): Promise<Contract> {
    return this.apiClient.get(API_PATHS.CONTRACT_DETAIL.replace(':id', contractId));
  }
  
  async createContract(contractData: ContractCreateRequest): Promise<Contract> {
    return this.apiClient.post(API_PATHS.CONTRACTS, contractData);
  }
  
  async updateContract(contractId: string, updates: ContractUpdateRequest): Promise<Contract> {
    return this.apiClient.put(API_PATHS.CONTRACT_DETAIL.replace(':id', contractId), updates);
  }
  
  async deleteContract(contractId: string): Promise<void> {
    return this.apiClient.delete(API_PATHS.CONTRACT_DETAIL.replace(':id', contractId));
  }
  
  async searchContracts(searchRequest: ContractSearchRequest): Promise<ContractSearchResponse> {
    return this.apiClient.post(API_PATHS.CONTRACT_SEARCH, searchRequest);
  }
  
  async approveContract(contractId: string, comments?: string): Promise<Contract> {
    return this.apiClient.post(API_PATHS.CONTRACT_APPROVAL.replace(':id', contractId), {
      action: 'approve',
      comments
    });
  }
  
  async changeContractStatus(contractId: string, status: ContractStatus, reason?: string): Promise<Contract> {
    return this.apiClient.put(API_PATHS.CONTRACT_STATUS_CHANGE.replace(':id', contractId), {
      status,
      reason
    });
  }
  
  async createRenewalContract(originalContractId: string, renewalData: any): Promise<Contract> {
    return this.apiClient.post(API_PATHS.CONTRACT_RENEWAL.replace(':id', originalContractId), renewalData);
  }
  
  async getRenewalAlerts(companyId?: string): Promise<ContractRenewalAlert[]> {
    const params = companyId ? { companyId } : {};
    return this.apiClient.get(API_PATHS.CONTRACT_RENEWAL_ALERTS, { params });
  }
  
  async sendRenewalReminder(contractId: string): Promise<void> {
    return this.apiClient.post(`${API_PATHS.CONTRACT_DETAIL.replace(':id', contractId)}/reminder`);
  }
  
  async getContractAnalytics(companyId?: string): Promise<ContractAnalytics> {
    if (companyId) {
      return this.apiClient.get(API_PATHS.CONTRACT_COMPANY_ANALYTICS.replace(':companyId', companyId));
    }
    return this.apiClient.get(API_PATHS.CONTRACT_ANALYTICS);
  }
  
  async uploadContractDocument(contractId: string, file: File, documentType: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    return this.apiClient.post(
      API_PATHS.CONTRACT_DOCUMENT_UPLOAD.replace(':id', contractId),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  }
  
  async exportContracts(format: 'csv' | 'excel' = 'csv', filters?: ContractSearchRequest): Promise<Blob> {
    return this.apiClient.post(API_PATHS.CONTRACT_EXPORT, filters, {
      params: { format },
      responseType: 'blob'
    });
  }
}
```

### Phase 3: Human Validation

**3.1 機能検証項目**
- [ ] 契約CRUD・ワークフロー・承認プロセスの正常動作
- [ ] 企業別契約管理・検索・フィルタリング機能
- [ ] 契約更新・アラート・リマインド・自動処理
- [ ] 商材・商品管理システムとの連携確認
- [ ] 契約分析・売上予測・レポート機能
- [ ] 文書管理・電子署名・セキュリティ機能
- [ ] 提案管理システムとの連携動作

**3.2 パフォーマンステスト**
- [ ] 100社×平均5契約での3秒以内表示
- [ ] 契約検索・フィルタリングの応答性能
- [ ] 大量契約データでの分析・レポート生成性能

## 6. Validation Method（検証方法）

### 6.1 API動作確認
```bash
# 契約作成
curl -X POST "http://localhost:3001/api/contracts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "companyId": "company-123",
    "productId": "product-456", 
    "contractType": "standard",
    "startDate": "2024-02-01",
    "endDate": "2025-01-31",
    "contractAmount": 120000,
    "paymentCycle": "annual",
    "autoRenewal": true,
    "primaryAssigneeId": "user-789",
    "salesRepId": "user-456"
  }'

# 企業別契約取得
curl -X GET "http://localhost:3001/api/companies/company-123/contracts" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 契約承認
curl -X POST "http://localhost:3001/api/contracts/contract-123/approval" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "action": "approve",
    "comments": "条件確認済み、承認します"
  }'

# 更新アラート取得
curl -X GET "http://localhost:3001/api/contracts/renewal-alerts" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 6.2 統合テスト確認
- 商材マスタ（009）からの商材情報取得・契約反映
- 商品管理（010）の企業固有設定の契約実装
- 提案管理（012）からの提案内容契約化
- 企業管理（004）の担当者・権限情報連携

### 6.3 ワークフローテスト
- 契約作成→承認→アクティブ化→更新→終了の全ライフサイクル
- 承認ワークフロー・エスカレーション・差し戻し機能
- 自動更新・手動更新・条件変更プロセス

## 7. Completion Criteria（完了基準）

### 7.1 機能完了基準
- [ ] **契約ライフサイクル管理**: 作成→承認→実行→更新→終了の完全管理
- [ ] **企業別契約管理**: 企業ごとの契約状況・期限・リスクの総合管理  
- [ ] **更新管理**: 適切なタイミングでの更新通知・リマインド・手続き支援
- [ ] **商材連携**: 商材マスタ・商品管理との統合による詳細情報管理
- [ ] **承認ワークフロー**: 適切な承認プロセス・エスカレーション・監査証跡
- [ ] **分析・予測**: 契約実績・更新予測・売上予測の正確な分析

### 7.2 データ品質完了基準
- [ ] **データ整合性**: 商材・商品・企業情報との完全同期
- [ ] **履歴管理**: 契約変更・承認・ステータス変更の完全な監査証跡
- [ ] **セキュリティ**: 契約情報・文書の適切なアクセス制御・暗号化

### 7.3 ユーザビリティ完了基準  
- [ ] **直感的操作**: 営業担当者が契約状況を30秒以内で確認可能
- [ ] **効率的管理**: 契約更新手続きが従来比70%時間短縮
- [ ] **適切な通知**: 更新期限・リスクの適時・適切な通知・アラート

### 7.4 統合完了基準
- [ ] **商材統合**: 商材マスタ・商品管理からの正確なデータ連携
- [ ] **提案統合**: 提案管理からの契約化 seamless プロセス
- [ ] **企業統合**: 企業管理の担当者・権限情報との完全連携

**実装完了判定**: 上記全基準を満たし、機能テスト・統合テスト・ワークフローテスト・セキュリティテストが全て通過した時点で完了とする。