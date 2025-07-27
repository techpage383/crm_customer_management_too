# PRP-012: 提案管理実装計画書

## 1. Goal（目標）

提案管理（P-009）の完全実装により、営業担当者・管理者が以下を達成できる状態を実現する：

- **提案ライフサイクル管理**: 提案作成から承認・送付・追跡・結果確定までの一貫した管理
- **商材組み合わせ提案**: 商材マスタ（009）・商品管理（010）を活用した効果的な提案書作成
- **承認ワークフロー**: 提案内容・価格・条件の適切な承認プロセス・エスカレーション管理
- **契約統合**: 承認済み提案の契約管理（011）への seamless な契約化・移行
- **追跡・分析**: 提案実績・成約率・期限管理・営業パフォーマンス分析
- **営業支援**: 提案テンプレート・競合比較・成功事例による営業活動高度化

## 2. Why（理由）

### ビジネス価値
- **営業効率化**: 体系的な提案管理による営業プロセスの標準化・効率化
- **成約率向上**: 適切な提案内容・タイミング・フォローアップによる成約率最大化
- **売上機会創出**: 商材組み合わせ・クロスセル・アップセル提案の戦略的実行
- **営業品質向上**: 承認プロセス・テンプレート活用による提案品質の標準化・向上

### 技術的必要性
- **営業プロセス完結**: 商材→商品→提案→契約の営業プロセス一貫管理
- **商材活用**: 商材マスタ・商品管理の情報を活用した効果的提案書作成
- **契約連携**: 承認済み提案の契約管理への自動的移行・データ連携
- **分析基盤**: 営業活動・提案実績の分析・改善基盤として重要

### 実装優先度の理由
- **順序012**: 商材・商品・契約管理完了後の営業プロセス最終段階として必須
- **営業クロージング**: 見込み客→正式契約への重要なビジネスプロセス
- **CRM完成**: 顧客管理・営業管理・契約管理を統合するCRMシステムの完成

## 3. What（要件）

### ユーザーストーリー

**営業担当者として**
- 企業のニーズに応じた最適な商材組み合わせ提案を作成できる
- 提案書テンプレート・過去事例を活用して効率的に提案書を作成できる
- 提案状況・期限・回答状況を適切にトラッキングできる
- 承認済み提案を契約へ seamless に移行できる
- 提案実績・成約率を分析して営業活動を改善できる

**提案承認者として**
- 提案内容・価格・条件を適切に審査・承認できる
- 承認ワークフロー・エスカレーション・差し戻し機能を活用できる
- 提案品質・リスク・競合状況を総合的に評価できる
- 承認履歴・コメント・条件変更を適切に管理できる

**マネージャーとして**
- 営業チームの提案活動・成約状況を総合的に監視できる
- 提案実績・成約率・売上予測を分析できる
- 営業戦略・商材戦略・価格戦略を提案データから策定できる
- 営業チームの提案品質・スキル向上を支援できる

### 技術要件

**フロントエンド要件**
- Material-UIベースの提案管理ダッシュボード
- 提案作成ウィザード・商材選択・価格計算機能
- Chart.js による提案分析・成約率・売上予測表示
- ドラッグ&ドロップによる提案ステータス管理
- 承認ワークフロー・コメント・履歴管理機能

**バックエンド要件**
- 提案CRUD・承認ワークフロー・ステータス管理のRESTful API
- 商材マスタ・商品管理との統合による提案書自動生成
- 提案テンプレート・計算エンジン・価格最適化機能
- 契約管理との統合・提案→契約の自動移行機能
- 提案分析・成約予測・営業パフォーマンス評価エンジン

**成功基準**
- 50社×平均3提案での2秒以内表示
- 提案→契約の seamless 移行率90%以上
- 提案作成時間の従来比60%短縮
- 商材・契約管理との完全連携

## 4. All Needed Context（必要な情報）

### A. API仕様（schemas/index.tsから抜粋）

```typescript
// ========== 提案管理関連 ==========
export enum ProposalStatus {
  DRAFT = 'draft',                    // 下書き
  UNDER_REVIEW = 'under_review',      // 審査中
  PENDING_APPROVAL = 'pending_approval', // 承認待ち
  APPROVED = 'approved',              // 承認済み
  SENT = 'sent',                      // 提案済み
  REVIEWING = 'reviewing',            // 顧客検討中
  NEGOTIATING = 'negotiating',        // 条件交渉中
  ACCEPTED = 'accepted',              // 受諾
  REJECTED = 'rejected',              // 却下
  EXPIRED = 'expired',                // 期限切れ
  CONTRACTED = 'contracted'           // 契約済み
}

export enum ProposalType {
  NEW_BUSINESS = 'new_business',      // 新規案件
  RENEWAL = 'renewal',                // 更新案件
  UPSELL = 'upsell',                 // アップセル
  CROSS_SELL = 'cross_sell',         // クロスセル
  COMPETITIVE = 'competitive',        // 競合対応
  EMERGENCY = 'emergency'             // 緊急対応
}

export enum ProposalPriority {
  LOW = 'low',                       // 低
  MEDIUM = 'medium',                 // 中
  HIGH = 'high',                     // 高
  URGENT = 'urgent'                  // 緊急
}

export interface ProposalBase {
  id: ID;
  companyId: ID;
  companyName: string;
  title: string;
  description?: string;
  type: ProposalType;
  priority: ProposalPriority;
  status: ProposalStatus;
  
  // 商材・商品情報
  proposedProducts: Array<{
    productId: ID;        // CompanyProduct.id
    productMasterId: ID;  // ProductMaster.id
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    customOptions?: Record<string, any>;
    notes?: string;
  }>;
  
  // 金額・条件
  totalAmount: number;
  currency: string;
  discountRate?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  finalAmount: number;
  
  // 期間・期限
  proposalDate: string;
  responseDeadline: string;
  validUntil: string;
  implementationPeriod?: {
    startDate: string;
    endDate: string;
    milestones?: Array<{
      name: string;
      dueDate: string;
      deliverables: string[];
    }>;
  };
  
  // 提案詳細
  objectives: string[];     // 提案目的・課題解決
  benefits: string[];       // 導入効果・メリット
  competitorAnalysis?: {    // 競合比較
    competitors: Array<{
      name: string;
      strengths: string[];
      weaknesses: string[];
      priceComparison?: number;
    }>;
    ourAdvantages: string[];
  };
  
  // 承認・ワークフロー
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: ID;
  approvedAt?: string;
  approvalComments?: string;
  approvalHistory: Array<{
    action: 'submitted' | 'approved' | 'rejected' | 'returned';
    userId: ID;
    userName: string;
    timestamp: string;
    comments?: string;
  }>;
  
  // 担当者・管理
  primaryAssigneeId: ID;    // 主担当営業
  secondaryAssigneeIds: ID[];
  salesTeamId?: ID;
  salesManagerId?: ID;
  
  // 顧客とのやり取り
  communicationHistory: Array<{
    date: string;
    type: 'email' | 'phone' | 'meeting' | 'document' | 'other';
    summary: string;
    nextAction?: string;
    userId: ID;
    userName: string;
  }>;
  
  // 文書管理
  documents: Array<{
    type: 'proposal' | 'quotation' | 'presentation' | 'contract_draft' | 'other';
    name: string;
    url: string;
    version: string;
    uploadedAt: string;
    uploadedBy: ID;
  }>;
  
  // 契約化情報
  contractId?: ID;          // 契約化後の契約ID
  contractedAt?: string;    // 契約化日時
  
  // メタデータ
  tags: string[];
  customFields: Record<string, any>;
  notes: string;
  
  // 監査・履歴
  createdAt: string;
  updatedAt: string;
  createdBy: ID;
  updatedBy: ID;
  statusHistory: Array<{
    status: ProposalStatus;
    changedAt: string;
    changedBy: ID;
    reason?: string;
  }>;
}

export interface Proposal extends ProposalBase {}

export interface ProposalCreateRequest {
  companyId: ID;
  title: string;
  description?: string;
  type: ProposalType;
  priority?: ProposalPriority;
  proposedProducts: Array<{
    productId: ID;
    productMasterId: ID;
    quantity: number;
    unitPrice: number;
    customOptions?: Record<string, any>;
    notes?: string;
  }>;
  responseDeadline: string;
  validUntil: string;
  implementationPeriod?: {
    startDate: string;
    endDate: string;
    milestones?: Array<{
      name: string;
      dueDate: string;
      deliverables: string[];
    }>;
  };
  objectives?: string[];
  benefits?: string[];
  competitorAnalysis?: any;
  primaryAssigneeId: ID;
  secondaryAssigneeIds?: ID[];
  tags?: string[];
  customFields?: Record<string, any>;
  notes?: string;
}

export interface ProposalUpdateRequest {
  title?: string;
  description?: string;
  type?: ProposalType;
  priority?: ProposalPriority;
  status?: ProposalStatus;
  proposedProducts?: Array<{
    productId: ID;
    productMasterId: ID;
    quantity: number;
    unitPrice: number;
    customOptions?: Record<string, any>;
    notes?: string;
  }>;
  responseDeadline?: string;
  validUntil?: string;
  implementationPeriod?: {
    startDate: string;
    endDate: string;
    milestones?: Array<{
      name: string;
      dueDate: string;
      deliverables: string[];
    }>;
  };
  objectives?: string[];
  benefits?: string[];
  competitorAnalysis?: any;
  primaryAssigneeId?: ID;
  secondaryAssigneeIds?: ID[];
  approvalComments?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  notes?: string;
}

export interface ProposalSearchRequest {
  companyIds?: ID[];
  status?: ProposalStatus[];
  type?: ProposalType[];
  priority?: ProposalPriority[];
  assigneeIds?: ID[];
  salesTeamIds?: ID[];
  proposalDateFrom?: string;
  proposalDateTo?: string;
  responseDeadlineFrom?: string;
  responseDeadlineTo?: string;
  amountMin?: number;
  amountMax?: number;
  tags?: string[];
  searchTerm?: string;
  customFieldFilters?: Record<string, any>;
  limit?: number;
  offset?: number;
  sortBy?: 'proposalDate' | 'responseDeadline' | 'amount' | 'companyName' | 'status' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface ProposalSearchResponse {
  proposals: Proposal[];
  total: number;
  offset: number;
  limit: number;
  summary: {
    totalAmount: number;
    totalActive: number;
    totalNearDeadline: number;
    averageAmount: number;
  };
}

// 提案分析・統計
export interface ProposalAnalytics {
  totalProposals: number;
  totalAmount: number;
  averageAmount: number;
  winRate: number; // 成約率（%）
  averageClosingTime: number; // 平均成約期間（日）
  
  // ステータス別分析
  statusBreakdown: Array<{
    status: ProposalStatus;
    count: number;
    amount: number;
    percentage: number;
  }>;
  
  // 期間別分析
  monthlyTrend: Array<{
    month: string;
    proposalsCount: number;
    totalAmount: number;
    wonCount: number;
    winRate: number;
  }>;
  
  // 商材別分析
  productPerformance: Array<{
    productId: ID;
    productName: string;
    proposalsCount: number;
    totalAmount: number;
    winRate: number;
    averageAmount: number;
  }>;
  
  // 営業担当者別分析
  salesPerformance: Array<{
    assigneeId: ID;
    assigneeName: string;
    proposalsCount: number;
    totalAmount: number;
    winRate: number;
    averageClosingTime: number;
  }>;
  
  // 期限アラート
  upcomingDeadlines: Array<{
    proposalId: ID;
    companyName: string;
    title: string;
    responseDeadline: string;
    daysRemaining: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
}

// 提案テンプレート
export interface ProposalTemplate {
  id: ID;
  name: string;
  description: string;
  category: string;
  productCategories: string[]; // 対象商材カテゴリ
  template: {
    objectives: string[];
    benefits: string[];
    defaultImplementationPeriod: number; // 日数
    requiredFields: string[];
    optionalFields: string[];
  };
  isActive: boolean;
  usageCount: number;
  createdBy: ID;
  createdAt: string;
  updatedAt: string;
}

// ========== APIパス（提案管理関連） ==========
export const API_PATHS = {
  // ... 既存のパス ...
  
  // 提案管理
  PROPOSALS: '/api/proposals',
  PROPOSAL_DETAIL: '/api/proposals/:id',
  PROPOSAL_SEARCH: '/api/proposals/search',
  PROPOSAL_BULK: '/api/proposals/bulk',
  
  // 企業別提案
  COMPANY_PROPOSALS: '/api/companies/:companyId/proposals',
  COMPANY_PROPOSAL_SUMMARY: '/api/companies/:companyId/proposals/summary',
  
  // 提案承認・ワークフロー
  PROPOSAL_APPROVAL: '/api/proposals/:id/approval',
  PROPOSAL_STATUS_CHANGE: '/api/proposals/:id/status',
  PROPOSAL_WORKFLOW: '/api/proposals/:id/workflow',
  
  // 契約化
  PROPOSAL_TO_CONTRACT: '/api/proposals/:id/convert-to-contract',
  PROPOSAL_CONTRACT_PREVIEW: '/api/proposals/:id/contract-preview',
  
  // 提案分析
  PROPOSAL_ANALYTICS: '/api/proposals/analytics',
  PROPOSAL_PERFORMANCE: '/api/proposals/performance',
  PROPOSAL_WIN_RATE: '/api/proposals/win-rate',
  PROPOSAL_DEADLINES: '/api/proposals/upcoming-deadlines',
  
  // 提案テンプレート
  PROPOSAL_TEMPLATES: '/api/proposals/templates',
  PROPOSAL_TEMPLATE_DETAIL: '/api/proposals/templates/:id',
  PROPOSAL_FROM_TEMPLATE: '/api/proposals/from-template/:templateId',
  
  // 提案文書
  PROPOSAL_DOCUMENTS: '/api/proposals/:id/documents',
  PROPOSAL_DOCUMENT_UPLOAD: '/api/proposals/:id/documents/upload',
  PROPOSAL_DOCUMENT_DOWNLOAD: '/api/proposals/:id/documents/:documentId/download',
  PROPOSAL_GENERATE_PDF: '/api/proposals/:id/generate-pdf',
  
  // 提案レポート
  PROPOSAL_REPORTS: '/api/proposals/reports',
  PROPOSAL_EXPORT: '/api/proposals/export',
} as const;
```

### B. データフロー設計

**Phase 1: Backend API実装**
1. ProposalController: CRUD + 検索・フィルタリング・承認ワークフロー
2. 商材選択・価格計算・提案書生成エンジン
3. 契約化・統合機能
4. 提案分析・成約予測エンジン

**Phase 2A: フロントエンド モック実装**
1. Material-UIベースの提案管理ダッシュボード
2. @MARK で API接続ポイントをマーク
3. モックデータでの動作確認

**Phase 2B: API統合**
1. @MARK 箇所を実API呼び出しに変更
2. 商材・商品・契約管理システムとの統合
3. エラーハンドリング・バリデーション

**Phase 3: 人間による検証**
1. 全機能の動作確認
2. 提案→契約の統合テスト
3. データ整合性・セキュリティ確認

### C. モックアップ分析（mockups/proposal-management.html）

**主要機能エリア**
1. **ツールバー**: 検索・フィルタリング（ステータス・担当者）・新規提案作成
2. **提案一覧**: 提案基本情報・ステータス・期限・担当者・アクション
3. **サイドバー統計**: 提案サマリー・期限アラート・クイックアクション
4. **提案詳細**: 商材組み合わせ・価格・承認状況・進捗管理

**重要なUI要素**
- ステータスバッジ（下書き・提案済み・検討中・承認・契約済み・却下）
- 提案期限・回答期限・最終連絡日の管理
- 承認・編集・却下・契約化アクション
- 進捗バー・アラート・優先度表示
- Chart.js による提案分析・成約率の可視化

**特徴的な機能**
- 承認→契約化の seamless な移行ワークフロー
- 期限アラート・リマインド機能
- 高額案件・緊急案件のタグ付け・優先度管理

### D. 他システム連携

**商材マスタ（009）との連携**
- 提案書での商材詳細情報・仕様・価格の活用
- 商材組み合わせ・パッケージ提案の自動計算
- 競合比較・特徴説明の商材データ活用

**商品管理（010）との連携**
- 企業固有商品設定の提案への反映
- カスタマイズ・オプション・価格調整の提案
- 商品デプロイメント状況に基づく提案戦略

**契約管理（011）との連携**
- 承認済み提案の契約への自動変換
- 提案条件の契約条件への引き継ぎ
- 契約締結後のステータス同期・履歴管理

**企業管理（004）との連携**
- 企業情報・担当者・過去取引履歴の提案活用
- 企業ニーズ・予算・決裁プロセスの考慮
- 顧客関係・信頼度に基づく提案戦略

## 5. Implementation Blueprint（実装設計図）

### Phase 1: Backend Implementation

**1.1 提案基本管理**
```typescript
// backend/src/features/proposal/controllers/ProposalController.ts
export class ProposalController {
  async createProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 新規提案作成（商材選択・価格計算）
  }
  
  async getProposals(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 提案一覧取得（企業・ステータス・期限フィルター）
  }
  
  async getProposalById(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 提案詳細取得（商材・文書・履歴含む）
  }
  
  async updateProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 提案更新（ステータス変更・承認・内容変更）
  }
  
  async deleteProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 提案削除（論理削除・アーカイブ）
  }
  
  async searchProposals(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 高度な提案検索・フィルタリング
  }
  
  async getCompanyProposals(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 企業別提案一覧・サマリー
  }
  
  async bulkUpdateProposals(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 一括ステータス更新・承認
  }
}
```

**1.2 提案承認・ワークフロー**
```typescript
// backend/src/features/proposal/services/ProposalApprovalService.ts
export class ProposalApprovalService {
  async submitForApproval(proposalId: string, submitterId: string): Promise<ApprovalWorkflow> {
    // 提案承認申請・ワークフロー開始
  }
  
  async approveProposal(
    proposalId: string, 
    approverId: string, 
    comments?: string
  ): Promise<Proposal> {
    // 提案承認・ステータス更新
  }
  
  async rejectProposal(
    proposalId: string, 
    approverId: string, 
    reason: string
  ): Promise<Proposal> {
    // 提案却下・差し戻し
  }
  
  async getApprovalWorkflow(proposalId: string): Promise<ApprovalWorkflow> {
    // 承認ワークフロー状況確認
  }
  
  async getPendingApprovals(approverId: string): Promise<Proposal[]> {
    // 承認待ち提案一覧
  }
  
  async escalateApproval(proposalId: string): Promise<void> {
    // 承認エスカレーション・上位承認者への移管
  }
}
```

**1.3 契約化・統合**
```typescript
// backend/src/features/proposal/services/ProposalContractService.ts
export class ProposalContractService {
  async convertToContract(
    proposalId: string, 
    conversionOptions?: {
      adjustments?: {
        amount?: number;
        terms?: string;
        startDate?: string;
      };
      skipApproval?: boolean;
    }
  ): Promise<{ proposal: Proposal; contract: Contract }> {
    // 提案→契約変換
  }
  
  async previewContract(proposalId: string): Promise<ContractCreateRequest> {
    // 契約プレビュー・事前確認
  }
  
  async getConversionHistory(proposalId: string): Promise<Array<{
    contractId: string;
    convertedAt: string;
    convertedBy: string;
    adjustments: any;
  }>> {
    // 契約化履歴取得
  }
  
  async validateConversion(proposalId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    requiredApprovals: string[];
  }> {
    // 契約化可能性検証
  }
  
  async syncWithContract(proposalId: string, contractId: string): Promise<void> {
    // 契約との同期・ステータス更新
  }
}
```

**1.4 提案分析・レポート**
```typescript
// backend/src/features/proposal/services/ProposalAnalyticsService.ts
export class ProposalAnalyticsService {
  async getProposalAnalytics(
    filters?: {
      companyIds?: string[];
      assigneeIds?: string[];
      dateRange?: { start: string; end: string };
    }
  ): Promise<ProposalAnalytics> {
    // 提案分析データ取得
  }
  
  async calculateWinRate(
    timeframe: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{
    overallWinRate: number;
    trendData: Array<{
      period: string;
      proposals: number;
      won: number;
      winRate: number;
    }>;
    productWinRates: Array<{
      productId: string;
      productName: string;
      winRate: number;
    }>;
  }> {
    // 成約率分析・商材別成約率
  }
  
  async getSalesPerformance(
    salesRepIds?: string[]
  ): Promise<Array<{
    salesRepId: string;
    salesRepName: string;
    metrics: {
      totalProposals: number;
      totalAmount: number;
      winRate: number;
      averageClosingTime: number;
      recentTrend: 'up' | 'down' | 'stable';
    };
  }>> {
    // 営業パフォーマンス分析
  }
  
  async getUpcomingDeadlines(daysAhead: number = 30): Promise<Array<{
    proposalId: string;
    companyName: string;
    title: string;
    responseDeadline: string;
    daysRemaining: number;
    riskLevel: 'low' | 'medium' | 'high';
    assigneeName: string;
  }>> {
    // 期限アラート・リスク評価
  }
  
  async generateProposalReport(
    reportType: 'monthly' | 'quarterly' | 'annual' | 'custom',
    options: {
      companyIds?: string[];
      assigneeIds?: string[];
      includeCharts: boolean;
      format: 'pdf' | 'excel' | 'json';
    }
  ): Promise<{
    reportId: string;
    downloadUrl: string;
    generatedAt: string;
  }> {
    // 提案レポート生成
  }
}
```

**1.5 データベース設計**
```sql
-- 提案テーブル
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type proposal_type_enum NOT NULL,
  priority proposal_priority_enum DEFAULT 'medium',
  status proposal_status_enum NOT NULL DEFAULT 'draft',
  
  -- 金額・条件
  total_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'JPY',
  discount_rate DECIMAL(5, 2),
  discount_amount DECIMAL(15, 2),
  tax_rate DECIMAL(5, 2),
  tax_amount DECIMAL(15, 2),
  final_amount DECIMAL(15, 2) NOT NULL,
  
  -- 期間・期限
  proposal_date DATE NOT NULL,
  response_deadline DATE NOT NULL,
  valid_until DATE NOT NULL,
  implementation_period JSONB,
  
  -- 提案詳細
  objectives TEXT[],
  benefits TEXT[],
  competitor_analysis JSONB,
  
  -- 承認・ワークフロー
  approval_status VARCHAR(20) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_comments TEXT,
  
  -- 担当者
  primary_assignee_id UUID NOT NULL REFERENCES users(id),
  secondary_assignee_ids UUID[],
  sales_team_id UUID REFERENCES teams(id),
  sales_manager_id UUID REFERENCES users(id),
  
  -- 契約化情報
  contract_id UUID REFERENCES contracts(id),
  contracted_at TIMESTAMP WITH TIME ZONE,
  
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

-- 提案商材テーブル
CREATE TABLE proposal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  product_id UUID NOT NULL REFERENCES company_products(id),
  product_master_id UUID NOT NULL REFERENCES product_masters(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  custom_options JSONB DEFAULT '{}',
  notes TEXT,
  display_order INTEGER DEFAULT 0
);

-- 提案ステータス履歴テーブル
CREATE TABLE proposal_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  status proposal_status_enum NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID NOT NULL REFERENCES users(id),
  reason TEXT
);

-- 提案承認履歴テーブル
CREATE TABLE proposal_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  action VARCHAR(20) NOT NULL,  -- 'submitted', 'approved', 'rejected', 'returned'
  user_id UUID NOT NULL REFERENCES users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  comments TEXT
);

-- 提案コミュニケーション履歴テーブル
CREATE TABLE proposal_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  communication_date DATE NOT NULL,
  type VARCHAR(20) NOT NULL,  -- 'email', 'phone', 'meeting', 'document', 'other'
  summary TEXT NOT NULL,
  next_action TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 提案文書テーブル
CREATE TABLE proposal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  document_type VARCHAR(50) NOT NULL,
  name VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES users(id)
);

-- 提案テンプレートテーブル
CREATE TABLE proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  product_categories TEXT[],
  template_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_proposals_company_status ON proposals(company_id, status);
CREATE INDEX idx_proposals_assignee ON proposals(primary_assignee_id);
CREATE INDEX idx_proposals_deadline ON proposals(response_deadline);
CREATE INDEX idx_proposals_amount ON proposals(final_amount);
CREATE INDEX idx_proposal_products_proposal ON proposal_products(proposal_id);
CREATE INDEX idx_proposal_status_history_proposal ON proposal_status_history(proposal_id);
CREATE INDEX idx_proposal_approval_history_proposal ON proposal_approval_history(proposal_id);
CREATE INDEX idx_proposal_communications_proposal ON proposal_communications(proposal_id);
CREATE INDEX idx_proposal_documents_proposal ON proposal_documents(proposal_id);
```

### Phase 2A: Frontend Mock Implementation

**2A.1 コンポーネント構造**
```typescript
// frontend/src/pages/ProposalManagementPage.tsx
export const ProposalManagementPage: React.FC = () => {
  return (
    <div className="proposal-management-container">
      <PageHeader title="提案管理" />
      <div className="proposal-content">
        <ProposalToolbar />
        <div className="proposal-content-grid">
          <ProposalList />
          <ProposalSidebar />
        </div>
      </div>
    </div>
  );
};

// frontend/src/components/proposal/ProposalToolbar.tsx
export const ProposalToolbar: React.FC = () => {
  return (
    <div className="proposal-toolbar">
      <SearchInput />
      <StatusFilter />
      <AssigneeFilter />
      <SearchButton />
      <NewProposalButton />
    </div>
  );
};

// frontend/src/components/proposal/ProposalList.tsx
export const ProposalList: React.FC = () => {
  return (
    <div className="proposals-list">
      <ProposalListHeader />
      <ProposalItems />
    </div>
  );
};

// frontend/src/components/proposal/ProposalSidebar.tsx
export const ProposalSidebar: React.FC = () => {
  return (
    <div className="proposal-sidebar">
      <ProposalSummaryCard />
      <DeadlineAlertsCard />
      <QuickActionsCard />
    </div>
  );
};
```

**2A.2 状態管理**
```typescript
// frontend/src/stores/proposalStore.ts
interface ProposalState {
  proposals: Proposal[];
  selectedProposal: Proposal | null;
  proposalAnalytics: ProposalAnalytics | null;
  upcomingDeadlines: Array<any>;
  filters: {
    searchTerm: string;
    status: ProposalStatus[];
    assigneeIds: string[];
    dateRange: { start: string; end: string } | null;
    amountRange: { min: number; max: number } | null;
  };
  loading: boolean;
  error: string | null;
}

export const useProposalStore = create<ProposalState>((set, get) => ({
  // @MARK: モックデータから開始、後でAPI連携
  proposals: MOCK_PROPOSALS,
  selectedProposal: null,
  proposalAnalytics: null,
  upcomingDeadlines: MOCK_UPCOMING_DEADLINES,
  filters: {
    searchTerm: '',
    status: [],
    assigneeIds: [],
    dateRange: null,
    amountRange: null,
  },
  loading: false,
  error: null,
  
  // 提案選択
  selectProposal: async (proposal: Proposal) => {
    set({ selectedProposal: proposal, loading: true });
    // @MARK: API連携時に詳細情報取得
    const detailedProposal = await proposalService.getProposalById(proposal.id);
    set({ selectedProposal: detailedProposal, loading: false });
  },
  
  // 提案作成・更新
  createProposal: async (proposalData: ProposalCreateRequest) => {
    // @MARK: API連携時に実装
    const newProposal = await proposalService.createProposal(proposalData);
    const proposals = [...get().proposals, newProposal];
    set({ proposals });
  },
  
  updateProposal: async (proposalId: string, updates: ProposalUpdateRequest) => {
    // @MARK: API連携時に実装
    const updatedProposal = await proposalService.updateProposal(proposalId, updates);
    const proposals = get().proposals.map(p => 
      p.id === proposalId ? updatedProposal : p
    );
    set({ proposals, selectedProposal: updatedProposal });
  },
  
  // 提案承認・ステータス変更
  approveProposal: async (proposalId: string, comments?: string) => {
    // @MARK: API連携時に実装
    const approvedProposal = await proposalService.approveProposal(proposalId, comments);
    await get().updateProposal(proposalId, { status: 'approved' });
  },
  
  rejectProposal: async (proposalId: string, reason: string) => {
    // @MARK: API連携時に実装
    await proposalService.rejectProposal(proposalId, reason);
    await get().updateProposal(proposalId, { status: 'rejected' });
  },
  
  changeProposalStatus: async (proposalId: string, status: ProposalStatus, reason?: string) => {
    // @MARK: API連携時に実装
    await proposalService.changeProposalStatus(proposalId, status, reason);
    await get().updateProposal(proposalId, { status });
  },
  
  // 契約化
  convertToContract: async (proposalId: string, adjustments?: any) => {
    // @MARK: API連携時に実装
    const result = await proposalService.convertToContract(proposalId, adjustments);
    await get().updateProposal(proposalId, { 
      status: 'contracted',
      contractId: result.contract.id,
      contractedAt: new Date().toISOString()
    });
    return result;
  },
  
  previewContract: async (proposalId: string) => {
    // @MARK: API連携時に実装
    return await proposalService.previewContract(proposalId);
  },
  
  // 分析・統計
  loadProposalAnalytics: async (filters?: any) => {
    // @MARK: API連携時に実装
    const analytics = await proposalService.getProposalAnalytics(filters);
    set({ proposalAnalytics: analytics });
  },
  
  loadUpcomingDeadlines: async (daysAhead: number = 30) => {
    // @MARK: API連携時に実装
    const deadlines = await proposalService.getUpcomingDeadlines(daysAhead);
    set({ upcomingDeadlines: deadlines });
  },
  
  // フィルター・検索
  updateFilters: (newFilters: Partial<typeof get().filters>) => {
    set({ filters: { ...get().filters, ...newFilters } });
  },
  
  searchProposals: async (searchRequest: ProposalSearchRequest) => {
    // @MARK: API連携時に実装
    const response = await proposalService.searchProposals(searchRequest);
    set({ proposals: response.proposals });
  },
}));
```

### Phase 2B: API Integration

**2B.1 API統合**
```typescript
// frontend/src/services/proposalService.ts
export class ProposalService {
  private apiClient: ApiClient;
  
  // @MARK: Phase 2B で実装
  async getProposals(): Promise<Proposal[]> {
    return this.apiClient.get(API_PATHS.PROPOSALS);
  }
  
  async getProposalById(proposalId: string): Promise<Proposal> {
    return this.apiClient.get(API_PATHS.PROPOSAL_DETAIL.replace(':id', proposalId));
  }
  
  async createProposal(proposalData: ProposalCreateRequest): Promise<Proposal> {
    return this.apiClient.post(API_PATHS.PROPOSALS, proposalData);
  }
  
  async updateProposal(proposalId: string, updates: ProposalUpdateRequest): Promise<Proposal> {
    return this.apiClient.put(API_PATHS.PROPOSAL_DETAIL.replace(':id', proposalId), updates);
  }
  
  async deleteProposal(proposalId: string): Promise<void> {
    return this.apiClient.delete(API_PATHS.PROPOSAL_DETAIL.replace(':id', proposalId));
  }
  
  async searchProposals(searchRequest: ProposalSearchRequest): Promise<ProposalSearchResponse> {
    return this.apiClient.post(API_PATHS.PROPOSAL_SEARCH, searchRequest);
  }
  
  async approveProposal(proposalId: string, comments?: string): Promise<Proposal> {
    return this.apiClient.post(API_PATHS.PROPOSAL_APPROVAL.replace(':id', proposalId), {
      action: 'approve',
      comments
    });
  }
  
  async rejectProposal(proposalId: string, reason: string): Promise<Proposal> {
    return this.apiClient.post(API_PATHS.PROPOSAL_APPROVAL.replace(':id', proposalId), {
      action: 'reject',
      reason
    });
  }
  
  async changeProposalStatus(proposalId: string, status: ProposalStatus, reason?: string): Promise<Proposal> {
    return this.apiClient.put(API_PATHS.PROPOSAL_STATUS_CHANGE.replace(':id', proposalId), {
      status,
      reason
    });
  }
  
  async convertToContract(proposalId: string, adjustments?: any): Promise<{ proposal: Proposal; contract: Contract }> {
    return this.apiClient.post(API_PATHS.PROPOSAL_TO_CONTRACT.replace(':id', proposalId), adjustments);
  }
  
  async previewContract(proposalId: string): Promise<ContractCreateRequest> {
    return this.apiClient.get(API_PATHS.PROPOSAL_CONTRACT_PREVIEW.replace(':id', proposalId));
  }
  
  async getProposalAnalytics(filters?: any): Promise<ProposalAnalytics> {
    return this.apiClient.get(API_PATHS.PROPOSAL_ANALYTICS, { params: filters });
  }
  
  async getUpcomingDeadlines(daysAhead: number = 30): Promise<any[]> {
    return this.apiClient.get(API_PATHS.PROPOSAL_DEADLINES, { params: { daysAhead } });
  }
  
  async uploadProposalDocument(proposalId: string, file: File, documentType: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    return this.apiClient.post(
      API_PATHS.PROPOSAL_DOCUMENT_UPLOAD.replace(':id', proposalId),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  }
  
  async generateProposalPDF(proposalId: string): Promise<Blob> {
    return this.apiClient.get(API_PATHS.PROPOSAL_GENERATE_PDF.replace(':id', proposalId), {
      responseType: 'blob'
    });
  }
  
  async exportProposals(format: 'csv' | 'excel' = 'csv', filters?: ProposalSearchRequest): Promise<Blob> {
    return this.apiClient.post(API_PATHS.PROPOSAL_EXPORT, filters, {
      params: { format },
      responseType: 'blob'
    });
  }
}
```

### Phase 3: Human Validation

**3.1 機能検証項目**
- [ ] 提案CRUD・承認ワークフロー・ステータス管理の正常動作
- [ ] 商材選択・価格計算・提案書生成機能
- [ ] 提案→契約の seamless 移行・データ同期
- [ ] 商材・商品・契約管理システムとの統合確認
- [ ] 提案分析・成約率・売上予測機能
- [ ] 期限管理・アラート・リマインド機能
- [ ] 承認ワークフロー・エスカレーション・履歴管理

**3.2 パフォーマンステスト**
- [ ] 50社×平均3提案での2秒以内表示
- [ ] 提案検索・フィルタリングの応答性能
- [ ] 大量提案データでの分析・レポート生成性能

## 6. Validation Method（検証方法）

### 6.1 API動作確認
```bash
# 提案作成
curl -X POST "http://localhost:3001/api/proposals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "companyId": "company-123",
    "title": "AI チャットボット Pro 導入提案",
    "type": "new_business",
    "priority": "high",
    "proposedProducts": [{
      "productId": "product-456",
      "productMasterId": "product-master-789",
      "quantity": 1,
      "unitPrice": 120000
    }],
    "responseDeadline": "2024-02-15",
    "validUntil": "2024-03-31",
    "primaryAssigneeId": "user-123"
  }'

# 提案承認
curl -X POST "http://localhost:3001/api/proposals/proposal-123/approval" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "action": "approve",
    "comments": "商材選定・価格設定ともに適切です。承認します。"
  }'

# 契約化
curl -X POST "http://localhost:3001/api/proposals/proposal-123/convert-to-contract" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "adjustments": {
      "startDate": "2024-02-01"
    }
  }'

# 提案分析取得
curl -X GET "http://localhost:3001/api/proposals/analytics" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 6.2 統合テスト確認
- 商材マスタ（009）からの商材情報取得・提案書反映
- 商品管理（010）の企業固有設定の提案活用
- 契約管理（011）への提案→契約の seamless 移行
- 企業管理（004）の顧客情報・担当者連携

### 6.3 ワークフローテスト
- 提案作成→承認→送付→追跡→契約化の全ライフサイクル
- 承認ワークフロー・エスカレーション・差し戻し機能
- 期限管理・アラート・リマインド・追跡機能

## 7. Completion Criteria（完了基準）

### 7.1 機能完了基準
- [ ] **提案ライフサイクル管理**: 作成→承認→送付→追跡→結果確定の完全管理
- [ ] **商材組み合わせ提案**: 商材マスタ・商品管理を活用した効果的提案書作成
- [ ] **承認ワークフロー**: 適切な承認プロセス・エスカレーション・履歴管理
- [ ] **契約統合**: 承認済み提案の契約への seamless 移行・同期
- [ ] **追跡・分析**: 提案実績・成約率・期限管理・パフォーマンス分析
- [ ] **営業支援**: テンプレート・競合比較・事例活用による営業高度化

### 7.2 データ品質完了基準
- [ ] **データ整合性**: 商材・商品・契約・企業情報との完全同期
- [ ] **履歴管理**: 提案変更・承認・ステータス変更の完全な監査証跡
- [ ] **価格整合性**: 商材価格・割引・税計算の正確性

### 7.3 ユーザビリティ完了基準
- [ ] **直感的操作**: 営業担当者が提案状況を30秒以内で確認可能
- [ ] **効率的作成**: 提案書作成時間が従来比60%短縮
- [ ] **適切な追跡**: 期限・進捗・リスクの適時・適切な管理・通知

### 7.4 統合完了基準
- [ ] **商材統合**: 商材マスタ・商品管理からの正確なデータ活用
- [ ] **契約統合**: 提案→契約の seamless 移行・データ継承
- [ ] **企業統合**: 企業管理の顧客情報・履歴との完全連携

**実装完了判定**: 上記全基準を満たし、機能テスト・統合テスト・ワークフローテスト・パフォーマンステストが全て通過した時点で完了とする。