# PRP-010: 商品管理ページ実装計画書

## 1. Goal（目標）

商品管理ページ（P-006）の完全実装により、営業担当者・管理者が以下を達成できる状態を実現する：

- **企業別商品管理**: 商材マスタ（009）を基にした企業固有の商品設定・価格調整
- **導入状況可視化**: 企業別商品導入状況・提案進捗・更新期限の一元管理
- **営業プロセス支援**: 未提案・提案中・導入済み・更新対応の効率的管理
- **カスタマイズ管理**: 企業固有の要件・オプション・カスタム設定の管理
- **分析・レポート**: 商品別導入状況・売上分析・更新予測の可視化
- **契約・提案連携**: 契約管理（011）・提案管理（012）との seamless な連携

## 2. Why（理由）

### ビジネス価値
- **営業効率化**: 企業別商品状況の一目確認による営業活動の最適化
- **売上機会創出**: 未提案商品・更新時期の適切な管理による売上機会最大化
- **顧客満足向上**: 企業固有ニーズに応じたカスタマイズ・サポート体制
- **戦略的提案**: 商品組み合わせ・アップセル・クロスセルの戦略的実行

### 技術的必要性
- **商材マスタ活用**: 商材マスタ（009）の企業別具体化・カスタマイズ
- **企業管理統合**: 企業管理（004）との連携による顧客別商品管理
- **契約管理準備**: 契約管理（011）での契約対象商品の詳細管理基盤
- **提案管理統合**: 提案管理（012）での商品選択・組み合わせ基盤

### 実装優先度の理由
- **順序010**: 商材マスタ（009）完了後の企業別商品展開として必須
- **営業プロセス中核**: 契約・提案管理の前提となる商品管理基盤
- **収益管理基盤**: 企業別売上・契約状況の正確な把握・分析

## 3. What（要件）

### ユーザーストーリー

**営業担当者として**
- 担当企業の商品導入状況を一覧で確認できる
- 未提案商品を特定し、提案機会を発見できる
- 導入済み商品の更新時期・条件を確認できる
- 企業固有のカスタマイズ・オプション設定を管理できる
- 商品提案・フォローアップ・契約管理の操作ができる

**商品管理者として**
- 全企業の商品導入状況を分析・管理できる
- 商品別売上・導入数・成功率を分析できる
- 企業別カスタマイズ要求・特殊条件を把握できる
- 商品ポートフォリオの最適化を判断できる

**マネージャーとして**
- 商品別売上実績・予測を確認できる
- 企業別商品戦略・アカウント戦略を策定できる
- 営業チームの商品提案活動を監視・指導できる
- 市場動向・競合状況を分析できる

### 技術要件

**フロントエンド要件**
- Material-UIベースの2ペインレイアウト（商品一覧・導入状況詳細）
- カード表示・一覧表示の切り替え機能
- 企業別導入状況の視覚的表示（ステータス・期限・オプション）
- Chart.js による商品分析・統計表示
- ドラッグ&ドロップによる商品組み合わせ・提案作成

**バックエンド要件**
- 商品（企業固有）CRUD の RESTful API
- 商材マスタとの連携・同期機能
- 導入状況・契約情報の統計・分析
- 企業別カスタマイズ・価格調整管理
- 更新期限・アラート管理機能

**成功基準**
- 100社×10商品での3秒以内表示
- 導入状況の正確な可視化・管理
- 商材マスタとの完全同期
- 契約・提案管理との seamless 連携

## 4. All Needed Context（必要な情報）

### A. API仕様（schemas/index.tsから抜粋）

```typescript
// ========== 商品管理（企業固有商材）関連 ==========
export enum ProductDeploymentStatus {
  NOT_PROPOSED = 'not_proposed',   // 未提案
  PROPOSAL = 'proposal',           // 提案中
  CONSIDERING = 'considering',     // 検討中
  ACTIVE = 'active',              // 導入済み
  SUSPENDED = 'suspended',         // 一時停止
  TERMINATED = 'terminated'        // 終了
}

export interface CompanyProduct {
  id: ID;
  companyId: ID;
  companyName: string;
  productMasterId: ID;
  productMasterName: string;
  productMasterCategory: ProductCategory;
  status: ProductDeploymentStatus;
  customName?: string; // 企業固有の商品名
  customDescription?: string;
  
  // 価格・契約情報
  pricing: {
    basePrice: number;
    currency: string;
    pricingModel: 'fixed' | 'subscription' | 'usage_based' | 'custom';
    customPricing?: Array<{
      description: string;
      amount: number;
      frequency?: 'monthly' | 'yearly' | 'one_time';
    }>;
    discountRate?: number;
    totalContractValue?: number;
  };
  
  // 導入・契約期間
  deployment: {
    proposalDate?: string;
    startDate?: string;
    endDate?: string;
    renewalDate?: string;
    implementationDuration?: number; // days
    implementationStatus?: 'planning' | 'in_progress' | 'completed' | 'delayed';
  };
  
  // カスタマイズ・オプション
  customizations: {
    enabledOptions: string[]; // ProductMaster.options の ID
    customFields: Record<string, any>;
    integrationSettings?: Record<string, any>;
    supportLevel?: 'basic' | 'standard' | 'premium' | 'enterprise';
    customRequirements?: string[];
  };
  
  // 担当者・管理情報
  assigneeInfo: {
    salesAssigneeId: ID;
    salesAssigneeName: string;
    technicalAssigneeId?: ID;
    technicalAssigneeName?: string;
    accountManagerId?: ID;
    accountManagerName?: string;
  };
  
  // 履歴・メタデータ
  notes: string[];
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  renewalRisk?: 'low' | 'medium' | 'high';
  customerSatisfaction?: number; // 1-5
  
  createdAt: string;
  updatedAt: string;
  createdBy: ID;
  updatedBy: ID;
}

export interface CompanyProductCreateRequest {
  companyId: ID;
  productMasterId: ID;
  status?: ProductDeploymentStatus;
  customName?: string;
  customDescription?: string;
  pricing?: {
    basePrice?: number;
    currency?: string;
    pricingModel?: 'fixed' | 'subscription' | 'usage_based' | 'custom';
    customPricing?: Array<{
      description: string;
      amount: number;
      frequency?: 'monthly' | 'yearly' | 'one_time';
    }>;
    discountRate?: number;
  };
  deployment?: {
    proposalDate?: string;
    startDate?: string;
    endDate?: string;
    renewalDate?: string;
  };
  customizations?: {
    enabledOptions?: string[];
    customFields?: Record<string, any>;
    supportLevel?: 'basic' | 'standard' | 'premium' | 'enterprise';
  };
  assigneeInfo?: {
    salesAssigneeId?: ID;
    technicalAssigneeId?: ID;
    accountManagerId?: ID;
  };
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface CompanyProductUpdateRequest {
  status?: ProductDeploymentStatus;
  customName?: string;
  customDescription?: string;
  pricing?: {
    basePrice?: number;
    currency?: string;
    pricingModel?: 'fixed' | 'subscription' | 'usage_based' | 'custom';
    customPricing?: Array<{
      description: string;
      amount: number;
      frequency?: 'monthly' | 'yearly' | 'one_time';
    }>;
    discountRate?: number;
    totalContractValue?: number;
  };
  deployment?: {
    proposalDate?: string;
    startDate?: string;
    endDate?: string;
    renewalDate?: string;
    implementationDuration?: number;
    implementationStatus?: 'planning' | 'in_progress' | 'completed' | 'delayed';
  };
  customizations?: {
    enabledOptions?: string[];
    customFields?: Record<string, any>;
    integrationSettings?: Record<string, any>;
    supportLevel?: 'basic' | 'standard' | 'premium' | 'enterprise';
    customRequirements?: string[];
  };
  assigneeInfo?: {
    salesAssigneeId?: ID;
    technicalAssigneeId?: ID;
    accountManagerId?: ID;
  };
  notes?: string[];
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  renewalRisk?: 'low' | 'medium' | 'high';
  customerSatisfaction?: number;
}

export interface CompanyProductSearchRequest {
  companyIds?: ID[];
  productMasterIds?: ID[];
  statuses?: ProductDeploymentStatus[];
  categories?: ProductCategory[];
  assigneeIds?: ID[];
  renewalDateFrom?: string;
  renewalDateTo?: string;
  priorityLevels?: ('low' | 'medium' | 'high' | 'urgent')[];
  searchTerm?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'companyName' | 'productName' | 'status' | 'renewalDate' | 'contractValue';
  sortOrder?: 'asc' | 'desc';
}

export interface CompanyProductSearchResponse {
  products: CompanyProduct[];
  total: number;
  offset: number;
  limit: number;
  statistics: {
    totalProducts: number;
    byStatus: Record<ProductDeploymentStatus, number>;
    totalContractValue: number;
    averageContractValue: number;
    renewalsThisMonth: number;
    expiringContracts: number;
  };
}

// 商品分析・統計
export interface ProductAnalytics {
  productMasterId: ID;
  productMasterName: string;
  deploymentStats: {
    totalCompanies: number;
    deployedCompanies: number;
    proposalCompanies: number;
    consideringCompanies: number;
    notProposedCompanies: number;
    deploymentRate: number; // percentage
  };
  revenueStats: {
    totalRevenue: number;
    averageContractValue: number;
    monthlyRecurringRevenue: number;
    yearlyRecurringRevenue: number;
  };
  optionUsage: Array<{
    optionId: string;
    optionName: string;
    usageCount: number;
    usageRate: number; // percentage
  }>;
  renewalInfo: {
    totalRenewals: number;
    upcomingRenewals: number;
    renewalRate: number; // percentage
    averageRenewalValue: number;
  };
  satisfactionMetrics: {
    averageScore: number;
    responseCount: number;
    distribution: Record<string, number>;
  };
}

// ========== APIパス（商品管理関連） ==========
export const API_PATHS = {
  // ... 既存のパス ...
  
  // 商品管理（企業固有商材）
  COMPANY_PRODUCTS: '/api/company-products',
  COMPANY_PRODUCT_DETAIL: '/api/company-products/:id',
  COMPANY_PRODUCTS_BY_COMPANY: '/api/companies/:companyId/products',
  COMPANY_PRODUCTS_BY_PRODUCT_MASTER: '/api/product-masters/:productMasterId/deployments',
  COMPANY_PRODUCT_SEARCH: '/api/company-products/search',
  
  // 商品操作
  COMPANY_PRODUCT_PROPOSE: '/api/company-products/:id/propose',
  COMPANY_PRODUCT_ACTIVATE: '/api/company-products/:id/activate',
  COMPANY_PRODUCT_RENEW: '/api/company-products/:id/renew',
  COMPANY_PRODUCT_TERMINATE: '/api/company-products/:id/terminate',
  
  // 分析・統計
  PRODUCT_ANALYTICS: '/api/product-masters/:id/analytics',
  COMPANY_PRODUCT_ANALYTICS: '/api/companies/:companyId/product-analytics',
  PRODUCT_DEPLOYMENT_MATRIX: '/api/product-deployment-matrix',
  
  // 更新・アラート管理
  RENEWAL_ALERTS: '/api/company-products/renewal-alerts',
  EXPIRING_CONTRACTS: '/api/company-products/expiring-contracts',
  
  // 一括操作
  COMPANY_PRODUCTS_BULK_UPDATE: '/api/company-products/bulk-update',
  COMPANY_PRODUCTS_BULK_PROPOSE: '/api/company-products/bulk-propose',
} as const;
```

### B. データフロー設計

**Phase 1: Backend API実装**
1. CompanyProductController: CRUD + 企業別・商品別検索
2. 商材マスタとの同期・連携機能
3. 導入状況分析・統計機能
4. 更新期限・アラート管理

**Phase 2A: フロントエンド モック実装**
1. 2ペインレイアウト（商品一覧・導入詳細）
2. @MARK で API接続ポイントをマーク
3. Chart.js による分析表示

**Phase 2B: API統合**
1. @MARK 箇所を実API呼び出しに変更
2. リアルタイム更新・同期機能
3. 商材マスタとの連携確認

**Phase 3: 人間による検証**
1. 全機能の動作確認
2. 商材マスタとの同期確認
3. 契約・提案管理との連携準備

### C. モックアップ分析（mockups/product-management.html）

**主要機能エリア**
1. **商品一覧サイドバー**: 商品別導入状況・ステータス表示
2. **メインコンテンツ**: 選択商品の詳細・企業別導入状況
3. **基本情報カード**: 商品概要・カスタム項目・分析チャート
4. **導入状況管理**: カード表示・一覧表示切り替え・フィルタリング

**重要なUI要素**
- ステータスバッジ（導入済み・提案中・検討中・未提案）
- 更新期限アラート・通知機能
- オプション利用状況のチャート表示
- 企業別アクションボタン（提案・フォローアップ・契約管理）
- カスタム項目の動的追加・編集

### D. 他システム連携

**商材マスタ（009）との連携**
- 商材マスタ情報の継承・同期
- カスタム項目・オプション設定の展開
- 商材変更時の企業別商品への反映

**企業管理（004）との連携**
- 企業別商品一覧の表示
- 担当者情報・権限による表示制御
- 企業詳細画面での商品状況表示

**契約管理（011）・提案管理（012）との連携**
- 商品選択・組み合わせ基盤の提供
- 契約対象商品の詳細情報連携
- 提案書作成での商品情報活用

## 5. Implementation Blueprint（実装設計図）

### Phase 1: Backend Implementation

**1.1 商品管理基本機能**
```typescript
// backend/src/features/companyProduct/controllers/CompanyProductController.ts
export class CompanyProductController {
  async createCompanyProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 企業固有商品作成
  }
  
  async getCompanyProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 商品一覧取得
  }
  
  async getCompanyProductById(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 商品詳細取得
  }
  
  async updateCompanyProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 商品情報更新
  }
  
  async deleteCompanyProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 商品削除（論理削除）
  }
  
  async getProductsByCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 企業別商品一覧
  }
  
  async getDeploymentsByProductMaster(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 商材マスタ別導入状況
  }
  
  async searchCompanyProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 高度な検索・フィルタリング
  }
}
```

**1.2 商品操作・ワークフロー**
```typescript
// backend/src/features/companyProduct/services/ProductWorkflowService.ts
export class ProductWorkflowService {
  async proposeProduct(
    companyProductId: string,
    proposalDetails: {
      proposalDate: string;
      customPricing?: any;
      notes?: string;
    }
  ): Promise<CompanyProduct> {
    // 商品提案ワークフロー
  }
  
  async activateProduct(
    companyProductId: string,
    activationDetails: {
      startDate: string;
      endDate?: string;
      implementationPlan?: any;
    }
  ): Promise<CompanyProduct> {
    // 商品導入開始
  }
  
  async renewProduct(
    companyProductId: string,
    renewalDetails: {
      newEndDate: string;
      pricingUpdates?: any;
      optionChanges?: string[];
    }
  ): Promise<CompanyProduct> {
    // 商品更新処理
  }
  
  async terminateProduct(
    companyProductId: string,
    terminationDetails: {
      terminationDate: string;
      reason: string;
      notes?: string;
    }
  ): Promise<CompanyProduct> {
    // 商品終了処理
  }
  
  async checkRenewalAlerts(): Promise<Array<{
    companyProductId: string;
    companyName: string;
    productName: string;
    renewalDate: string;
    daysUntilRenewal: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>> {
    // 更新期限アラート確認
  }
}
```

**1.3 商品分析・統計**
```typescript
// backend/src/features/companyProduct/services/ProductAnalyticsService.ts
export class ProductAnalyticsService {
  async getProductAnalytics(productMasterId: string): Promise<ProductAnalytics> {
    // 商品分析データ取得
  }
  
  async getCompanyProductAnalytics(companyId: string): Promise<{
    totalProducts: number;
    activeProducts: number;
    totalContractValue: number;
    upcomingRenewals: number;
    productDistribution: Array<{
      category: ProductCategory;
      count: number;
      value: number;
    }>;
  }> {
    // 企業別商品分析
  }
  
  async getDeploymentMatrix(): Promise<Array<{
    companyId: string;
    companyName: string;
    products: Array<{
      productMasterId: string;
      productMasterName: string;
      status: ProductDeploymentStatus;
      contractValue: number;
      renewalDate?: string;
    }>;
  }>> {
    // 導入状況マトリクス
  }
  
  async generateProductReport(
    productMasterId: string,
    timeframe: 'month' | 'quarter' | 'year'
  ): Promise<{
    deploymentTrends: any;
    revenueTrends: any;
    optionUsageTrends: any;
    recommendations: string[];
  }> {
    // 商品レポート生成
  }
}
```

**1.4 商材マスタ同期**
```typescript
// backend/src/features/companyProduct/services/ProductMasterSyncService.ts
export class ProductMasterSyncService {
  async syncWithProductMaster(
    productMasterId: string,
    changes: Partial<ProductMaster>
  ): Promise<void> {
    // 商材マスタ変更の企業商品への反映
  }
  
  async validateProductMasterCompatibility(
    companyProductId: string,
    newProductMasterId: string
  ): Promise<{
    compatible: boolean;
    issues: string[];
    migrationRequired: boolean;
  }> {
    // 商材マスタ互換性チェック
  }
  
  async migrateToNewProductMaster(
    companyProductId: string,
    newProductMasterId: string,
    migrationSettings: {
      preserveCustomizations: boolean;
      updatePricing: boolean;
      optionMappings: Record<string, string>;
    }
  ): Promise<CompanyProduct> {
    // 新商材マスタへの移行
  }
}
```

**1.5 データベース設計**
```sql
-- 企業商品テーブル
CREATE TABLE company_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  product_master_id UUID NOT NULL REFERENCES product_masters(id),
  status product_deployment_status_enum NOT NULL DEFAULT 'not_proposed',
  custom_name VARCHAR(500),
  custom_description TEXT,
  pricing JSONB DEFAULT '{}',
  deployment JSONB DEFAULT '{}',
  customizations JSONB DEFAULT '{}',
  assignee_info JSONB DEFAULT '{}',
  notes TEXT[],
  tags TEXT[],
  priority VARCHAR(20) DEFAULT 'medium',
  renewal_risk VARCHAR(20),
  customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(company_id, product_master_id, deleted_at)
);

-- 商品履歴テーブル
CREATE TABLE company_product_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_product_id UUID NOT NULL REFERENCES company_products(id),
  action VARCHAR(100) NOT NULL,
  old_status product_deployment_status_enum,
  new_status product_deployment_status_enum,
  changes JSONB,
  notes TEXT,
  performed_by UUID NOT NULL REFERENCES users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 更新アラートビュー
CREATE VIEW renewal_alerts AS
SELECT 
  cp.id,
  cp.company_id,
  c.name as company_name,
  cp.product_master_id,
  pm.name as product_master_name,
  (cp.deployment->>'renewalDate')::date as renewal_date,
  (cp.deployment->>'renewalDate')::date - CURRENT_DATE as days_until_renewal,
  CASE 
    WHEN (cp.deployment->>'renewalDate')::date - CURRENT_DATE <= 30 THEN 'high'
    WHEN (cp.deployment->>'renewalDate')::date - CURRENT_DATE <= 90 THEN 'medium'
    ELSE 'low'
  END as risk_level,
  cp.renewal_risk,
  cp.customer_satisfaction
FROM company_products cp
JOIN companies c ON cp.company_id = c.id
JOIN product_masters pm ON cp.product_master_id = pm.id
WHERE cp.status = 'active'
  AND cp.deployment->>'renewalDate' IS NOT NULL
  AND (cp.deployment->>'renewalDate')::date >= CURRENT_DATE
  AND cp.deleted_at IS NULL;

-- インデックス
CREATE INDEX idx_company_products_company_status ON company_products(company_id, status);
CREATE INDEX idx_company_products_product_master ON company_products(product_master_id, status);
CREATE INDEX idx_company_products_renewal_date ON company_products(((deployment->>'renewalDate')::date));
CREATE INDEX idx_company_products_assignee ON company_products(((assignee_info->>'salesAssigneeId')::uuid));
CREATE INDEX idx_company_product_history_product ON company_product_history(company_product_id, performed_at DESC);
```

### Phase 2A: Frontend Mock Implementation

**2A.1 コンポーネント構造**
```typescript
// frontend/src/pages/ProductManagementPage.tsx
export const ProductManagementPage: React.FC = () => {
  return (
    <div className="product-management-container">
      <PageHeader title="商品管理" />
      <div className="main-layout">
        <ProductSidebar />
        <ProductMainContent />
      </div>
    </div>
  );
};

// frontend/src/components/productManagement/ProductSidebar.tsx
export const ProductSidebar: React.FC = () => {
  return (
    <div className="product-sidebar">
      <SidebarHeader />
      <ProductList />
    </div>
  );
};

// frontend/src/components/productManagement/ProductMainContent.tsx
export const ProductMainContent: React.FC = () => {
  return (
    <div className="product-main-content">
      <ContentHeader />
      <ProductOverview />
      <DeploymentSection />
    </div>
  );
};

// frontend/src/components/productManagement/DeploymentSection.tsx
export const DeploymentSection: React.FC = () => {
  const { currentView } = useProductManagementStore();
  
  return (
    <div className="deployment-section">
      <DeploymentHeader />
      {currentView === 'cards' ? <DeploymentCards /> : <DeploymentMatrix />}
    </div>
  );
};
```

**2A.2 状態管理**
```typescript
// frontend/src/stores/productManagementStore.ts
interface ProductManagementState {
  productMasters: ProductMaster[];
  selectedProductMaster: ProductMaster | null;
  companyProducts: CompanyProduct[];
  deploymentAnalytics: ProductAnalytics | null;
  currentView: 'cards' | 'matrix';
  filters: {
    status: ProductDeploymentStatus[];
    company: string[];
    assignee: string[];
  };
  renewalAlerts: any[];
  loading: boolean;
  error: string | null;
}

export const useProductManagementStore = create<ProductManagementState>((set, get) => ({
  // @MARK: モックデータから開始、後でAPI連携
  productMasters: MOCK_PRODUCT_MASTERS,
  selectedProductMaster: null,
  companyProducts: [],
  deploymentAnalytics: null,
  currentView: 'cards',
  filters: {
    status: [],
    company: [],
    assignee: [],
  },
  renewalAlerts: [],
  loading: false,
  error: null,
  
  // 商品選択
  selectProductMaster: async (productMaster: ProductMaster) => {
    set({ selectedProductMaster: productMaster, loading: true });
    // @MARK: API連携時に実装
    const [deployments, analytics] = await Promise.all([
      productManagementService.getDeploymentsByProductMaster(productMaster.id),
      productManagementService.getProductAnalytics(productMaster.id)
    ]);
    set({ 
      companyProducts: deployments,
      deploymentAnalytics: analytics,
      loading: false 
    });
  },
  
  // 商品操作
  proposeProduct: async (companyProductId: string, proposalDetails: any) => {
    // @MARK: API連携時に実装
    const updatedProduct = await productManagementService.proposeProduct(
      companyProductId, 
      proposalDetails
    );
    const products = get().companyProducts.map(p => 
      p.id === companyProductId ? updatedProduct : p
    );
    set({ companyProducts: products });
  },
  
  activateProduct: async (companyProductId: string, activationDetails: any) => {
    // @MARK: API連携時に実装
    const updatedProduct = await productManagementService.activateProduct(
      companyProductId, 
      activationDetails
    );
    const products = get().companyProducts.map(p => 
      p.id === companyProductId ? updatedProduct : p
    );
    set({ companyProducts: products });
  },
  
  // 表示切り替え
  setCurrentView: (view: 'cards' | 'matrix') => {
    set({ currentView: view });
  },
  
  // フィルター
  updateFilters: (newFilters: Partial<typeof get().filters>) => {
    set({ filters: { ...get().filters, ...newFilters } });
  },
  
  // 更新アラート
  loadRenewalAlerts: async () => {
    // @MARK: API連携時に実装
    const alerts = await productManagementService.getRenewalAlerts();
    set({ renewalAlerts: alerts });
  },
  
  // カスタム項目管理
  addCustomField: (companyProductId: string, fieldName: string, fieldValue: any) => {
    const products = get().companyProducts.map(product => {
      if (product.id === companyProductId) {
        return {
          ...product,
          customizations: {
            ...product.customizations,
            customFields: {
              ...product.customizations.customFields,
              [fieldName]: fieldValue
            }
          }
        };
      }
      return product;
    });
    set({ companyProducts: products });
  }
}));
```

### Phase 2B: API Integration

**2B.1 API統合**
```typescript
// frontend/src/services/productManagementService.ts
export class ProductManagementService {
  private apiClient: ApiClient;
  
  // @MARK: Phase 2B で実装
  async getCompanyProducts(params?: CompanyProductSearchRequest): Promise<CompanyProductSearchResponse> {
    return this.apiClient.post(API_PATHS.COMPANY_PRODUCT_SEARCH, params || {});
  }
  
  async getProductsByCompany(companyId: string): Promise<CompanyProduct[]> {
    return this.apiClient.get(API_PATHS.COMPANY_PRODUCTS_BY_COMPANY.replace(':companyId', companyId));
  }
  
  async getDeploymentsByProductMaster(productMasterId: string): Promise<CompanyProduct[]> {
    return this.apiClient.get(API_PATHS.COMPANY_PRODUCTS_BY_PRODUCT_MASTER.replace(':productMasterId', productMasterId));
  }
  
  async createCompanyProduct(productData: CompanyProductCreateRequest): Promise<CompanyProduct> {
    return this.apiClient.post(API_PATHS.COMPANY_PRODUCTS, productData);
  }
  
  async updateCompanyProduct(productId: string, updates: CompanyProductUpdateRequest): Promise<CompanyProduct> {
    return this.apiClient.put(API_PATHS.COMPANY_PRODUCT_DETAIL.replace(':id', productId), updates);
  }
  
  async proposeProduct(productId: string, proposalDetails: any): Promise<CompanyProduct> {
    return this.apiClient.post(API_PATHS.COMPANY_PRODUCT_PROPOSE.replace(':id', productId), proposalDetails);
  }
  
  async activateProduct(productId: string, activationDetails: any): Promise<CompanyProduct> {
    return this.apiClient.post(API_PATHS.COMPANY_PRODUCT_ACTIVATE.replace(':id', productId), activationDetails);
  }
  
  async renewProduct(productId: string, renewalDetails: any): Promise<CompanyProduct> {
    return this.apiClient.post(API_PATHS.COMPANY_PRODUCT_RENEW.replace(':id', productId), renewalDetails);
  }
  
  async terminateProduct(productId: string, terminationDetails: any): Promise<CompanyProduct> {
    return this.apiClient.post(API_PATHS.COMPANY_PRODUCT_TERMINATE.replace(':id', productId), terminationDetails);
  }
  
  async getProductAnalytics(productMasterId: string): Promise<ProductAnalytics> {
    return this.apiClient.get(API_PATHS.PRODUCT_ANALYTICS.replace(':id', productMasterId));
  }
  
  async getCompanyProductAnalytics(companyId: string): Promise<any> {
    return this.apiClient.get(API_PATHS.COMPANY_PRODUCT_ANALYTICS.replace(':companyId', companyId));
  }
  
  async getRenewalAlerts(): Promise<any[]> {
    return this.apiClient.get(API_PATHS.RENEWAL_ALERTS);
  }
  
  async getExpiringContracts(days: number = 90): Promise<any[]> {
    return this.apiClient.get(API_PATHS.EXPIRING_CONTRACTS, { params: { days } });
  }
  
  async getDeploymentMatrix(): Promise<any[]> {
    return this.apiClient.get(API_PATHS.PRODUCT_DEPLOYMENT_MATRIX);
  }
}
```

### Phase 3: Human Validation

**3.1 機能検証項目**
- [ ] 商品CRUD操作の正常動作
- [ ] 商材マスタとの同期・連携
- [ ] 導入状況表示・フィルタリング
- [ ] 商品分析・統計の正確性
- [ ] 更新期限アラート・通知
- [ ] カスタマイズ・オプション管理
- [ ] 契約・提案管理との連携準備

**3.2 パフォーマンステスト**
- [ ] 100社×10商品での3秒以内表示
- [ ] チャート描画・分析計算の効率性
- [ ] フィルタリング・検索の応答性

## 6. Validation Method（検証方法）

### 6.1 API動作確認
```bash
# 企業商品作成
curl -X POST "http://localhost:3001/api/company-products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "companyId": "company-123",
    "productMasterId": "product-456",
    "status": "proposal",
    "pricing": {
      "basePrice": 100000,
      "currency": "JPY",
      "pricingModel": "subscription"
    },
    "deployment": {
      "proposalDate": "2024-01-15"
    }
  }'

# 商品提案
curl -X POST "http://localhost:3001/api/company-products/product-789/propose" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "proposalDate": "2024-02-01",
    "customPricing": {
      "discountRate": 10
    },
    "notes": "特別割引適用"
  }'

# 商品分析取得
curl -X GET "http://localhost:3001/api/product-masters/product-456/analytics" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 6.2 他システム連携確認
- 商材マスタ（009）変更時の自動同期
- 企業管理（004）での商品状況表示
- 契約管理（011）・提案管理（012）との連携

### 6.3 ユーザビリティテスト
- 商品選択から導入状況確認までの流れ
- フィルタリング・検索の使いやすさ
- チャート・分析データの分かりやすさ

## 7. Completion Criteria（完了基準）

### 7.1 機能完了基準
- [ ] **商品管理**: 企業固有商品の完全なCRUD・検索・管理機能
- [ ] **導入状況管理**: 正確な導入状況表示・ステータス管理・フィルタリング
- [ ] **商品分析**: 導入統計・売上分析・オプション利用状況の可視化
- [ ] **ワークフロー**: 提案・導入・更新・終了の適切な管理
- [ ] **アラート機能**: 更新期限・契約満了の的確な通知・管理
- [ ] **カスタマイズ**: 企業固有設定・オプション・価格調整の柔軟な管理

### 7.2 パフォーマンス完了基準
- [ ] **表示性能**: 100社×10商品での3秒以内表示
- [ ] **検索性能**: 複合条件での2秒以内フィルタリング
- [ ] **分析性能**: チャート・統計計算の1秒以内完了

### 7.3 データ整合性完了基準
- [ ] **商材マスタ同期**: 商材マスタ変更の正確な反映・同期
- [ ] **企業連携**: 企業情報との一貫性・整合性維持
- [ ] **契約情報**: 正確な契約・更新情報の管理・追跡

### 7.4 統合完了基準
- [ ] **商材マスタ統合**: 商材マスタ（009）との完全同期・連携
- [ ] **企業管理統合**: 企業管理（004）での商品状況表示準備
- [ ] **契約・提案統合**: 契約管理（011）・提案管理（012）との連携基盤

**実装完了判定**: 上記全基準を満たし、機能テスト・性能テスト・統合テスト・ユーザビリティテストが全て通過した時点で完了とする。