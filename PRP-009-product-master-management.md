# PRP-009: 商材マスタ管理実装計画書

## 1. Goal（目標）

商材マスタ管理（P-013）の完全実装により、営業担当者・管理者が以下を達成できる状態を実現する：

- **商材マスタ管理**: 企業が提供する全商材・サービスの一元管理・情報整備
- **詳細情報管理**: 商材仕様・価格・バージョン・対応OS等の詳細な情報管理
- **導入状況追跡**: 各商材の企業別導入状況・提案中案件の可視化
- **カスタム項目拡張**: 商材固有の属性・仕様を柔軟に追加・管理
- **営業支援データ**: 商材特性・競合比較・提案材料の営業活動支援
- **契約・提案連携**: 商品管理（010）・契約管理（011）・提案管理（012）の基盤データ

## 2. Why（理由）

### ビジネス価値
- **営業効率化**: 商材情報の一元化による営業提案・見積作成の効率化
- **情報品質向上**: 正確で最新の商材情報による顧客対応品質向上
- **戦略的意思決定**: 商材別導入状況分析による商品戦略・価格戦略の最適化
- **営業チーム支援**: 詳細な商材情報による営業担当者の提案力向上

### 技術的必要性
- **商品管理基盤**: 商品管理（010）の基本データ・マスタ情報の提供
- **契約管理連携**: 企業別契約管理（011）での商材情報参照
- **提案管理統合**: 提案管理（012）での商材選択・組み合わせ基盤
- **データ一貫性**: 営業プロセス全体での商材データの統一性確保

### 実装優先度の理由
- **順序009**: Gmail連携完了後、営業プロセス管理の基盤として最優先
- **マスタデータ優先**: 商品管理・契約管理・提案管理の前提となるマスタ情報
- **営業支援強化**: CRM機能を活用した営業活動高度化の出発点

## 3. What（要件）

### ユーザーストーリー

**営業担当者として**
- 提案に必要な商材情報を迅速に検索・確認できる
- 商材の詳細仕様・価格・対応条件を正確に把握できる
- 商材の導入実績・成功事例を確認できる
- 類似商材・競合商材の比較情報を確認できる
- 商材カタログ・提案資料を即座にダウンロードできる

**商材管理者として**
- 新規商材の登録・既存商材の更新ができる
- 商材カテゴリ・ステータス・バージョン管理ができる
- 商材固有のカスタム属性を追加・編集できる
- 商材別の導入状況・営業実績を分析できる
- 商材情報の一括インポート・エクスポートができる

**マネージャーとして**
- 全商材の導入状況・売上実績を把握できる
- 商材ポートフォリオの戦略的分析ができる
- 商材別収益性・成長性を評価できる
- 商材廃止・新規投入の意思決定を支援できる

### 技術要件

**フロントエンド要件**
- Material-UIベースのマスター・ディテール レイアウト
- 高速検索・フィルタリング機能（名前・カテゴリ・ステータス）
- カスタム項目の動的追加・編集機能
- 商材詳細情報の豊富な表示・編集機能
- CSV インポート・エクスポート機能

**バックエンド要件**
- 商材マスタ CRUD の RESTful API
- 詳細検索・分類・統計機能
- カスタム属性管理システム
- 商材関連統計・分析機能
- バージョン管理・履歴追跡機能

**成功基準**
- 100件商材での1秒以内検索
- カスタム項目の柔軟な追加・管理
- 商材情報の正確性・一貫性維持
- 他システムとの安定した連携動作

## 4. All Needed Context（必要な情報）

### A. API仕様（schemas/index.tsから抜粋）

```typescript
// ========== 商材マスタ関連 ==========
export enum ProductCategory {
  SOFTWARE = 'software',
  HARDWARE = 'hardware',
  SERVICE = 'service',
  CONSULTING = 'consulting',
  CLOUD = 'cloud',
  SECURITY = 'security',
  AI_ML = 'ai_ml',
  OTHER = 'other'
}

export enum ProductStatus {
  ACTIVE = 'active',           // アクティブ
  INACTIVE = 'inactive',       // 非アクティブ
  DRAFT = 'draft',            // 下書き
  DEPRECATED = 'deprecated',   // 廃止予定
  END_OF_LIFE = 'end_of_life' // サポート終了
}

export interface ProductMasterBase {
  id: ID;
  name: string;
  category: ProductCategory;
  description?: string;
  shortDescription?: string;
  status: ProductStatus;
  version?: string;
  releaseDate?: string;
  endOfLifeDate?: string;
  tags: string[];
  customAttributes: Record<string, any>;
  documents: Array<{
    type: 'catalog' | 'manual' | 'specification' | 'pricing';
    name: string;
    url: string;
    fileSize?: number;
    uploadedAt: string;
  }>;
  pricing: {
    basePrice?: number;
    currency?: string;
    pricingModel?: 'fixed' | 'subscription' | 'usage_based' | 'custom';
    priceRanges?: Array<{
      minQuantity: number;
      maxQuantity?: number;
      unitPrice: number;
    }>;
  };
  specifications: {
    technicalSpecs?: Record<string, any>;
    systemRequirements?: Record<string, any>;
    supportedPlatforms?: string[];
    integrations?: string[];
  };
  createdAt: string;
  updatedAt: string;
  createdBy: ID;
  updatedBy: ID;
}

export interface ProductMaster extends ProductMasterBase {}

export interface ProductMasterCreateRequest {
  name: string;
  category: ProductCategory;
  description?: string;
  shortDescription?: string;
  status?: ProductStatus;
  version?: string;
  releaseDate?: string;
  tags?: string[];
  customAttributes?: Record<string, any>;
  pricing?: {
    basePrice?: number;
    currency?: string;
    pricingModel?: 'fixed' | 'subscription' | 'usage_based' | 'custom';
    priceRanges?: Array<{
      minQuantity: number;
      maxQuantity?: number;
      unitPrice: number;
    }>;
  };
  specifications?: {
    technicalSpecs?: Record<string, any>;
    systemRequirements?: Record<string, any>;
    supportedPlatforms?: string[];
    integrations?: string[];
  };
}

export interface ProductMasterUpdateRequest {
  name?: string;
  category?: ProductCategory;
  description?: string;
  shortDescription?: string;
  status?: ProductStatus;
  version?: string;
  releaseDate?: string;
  endOfLifeDate?: string;
  tags?: string[];
  customAttributes?: Record<string, any>;
  pricing?: {
    basePrice?: number;
    currency?: string;
    pricingModel?: 'fixed' | 'subscription' | 'usage_based' | 'custom';
    priceRanges?: Array<{
      minQuantity: number;
      maxQuantity?: number;
      unitPrice: number;
    }>;
  };
  specifications?: {
    technicalSpecs?: Record<string, any>;
    systemRequirements?: Record<string, any>;
    supportedPlatforms?: string[];
    integrations?: string[];
  };
}

export interface ProductMasterSearchRequest {
  searchTerm?: string;
  category?: ProductCategory[];
  status?: ProductStatus[];
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  releaseDateFrom?: string;
  releaseDateTo?: string;
  customAttributeFilters?: Record<string, any>;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'category' | 'releaseDate' | 'createdAt' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductMasterSearchResponse {
  products: ProductMaster[];
  total: number;
  offset: number;
  limit: number;
}

// 商材導入統計
export interface ProductDeploymentStats {
  productId: ID;
  productName: string;
  totalDeployments: number;
  activeDeployments: number;
  proposalsInProgress: number;
  averageImplementationTime: number; // days
  customerSatisfactionScore?: number; // 1-5
  revenueGenerated: number;
  topDeployingCompanies: Array<{
    companyId: ID;
    companyName: string;
    deploymentCount: number;
    lastDeployment: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    deployments: number;
    revenue: number;
  }>;
}

// 商材カテゴリ統計
export interface ProductCategoryStats {
  category: ProductCategory;
  totalProducts: number;
  activeProducts: number;
  totalDeployments: number;
  averagePrice: number;
  topProducts: Array<{
    productId: ID;
    productName: string;
    deploymentCount: number;
  }>;
}

// ========== APIパス（商材マスタ関連） ==========
export const API_PATHS = {
  // ... 既存のパス ...
  
  // 商材マスタ管理
  PRODUCT_MASTERS: '/api/product-masters',
  PRODUCT_MASTER_DETAIL: '/api/product-masters/:id',
  PRODUCT_MASTER_SEARCH: '/api/product-masters/search',
  PRODUCT_MASTER_CATEGORIES: '/api/product-masters/categories',
  PRODUCT_MASTER_BULK: '/api/product-masters/bulk',
  
  // 商材統計・分析
  PRODUCT_DEPLOYMENT_STATS: '/api/product-masters/:id/deployment-stats',
  PRODUCT_CATEGORY_STATS: '/api/product-masters/categories/stats',
  PRODUCT_POPULARITY_RANKING: '/api/product-masters/popularity-ranking',
  
  // 商材ドキュメント
  PRODUCT_DOCUMENTS: '/api/product-masters/:id/documents',
  PRODUCT_DOCUMENT_UPLOAD: '/api/product-masters/:id/documents/upload',
  PRODUCT_DOCUMENT_DOWNLOAD: '/api/product-masters/:id/documents/:documentId/download',
  
  // カスタム属性管理
  PRODUCT_CUSTOM_ATTRIBUTES: '/api/product-masters/custom-attributes',
  PRODUCT_ATTRIBUTE_TEMPLATES: '/api/product-masters/attribute-templates',
  
  // インポート・エクスポート
  PRODUCT_MASTERS_IMPORT: '/api/product-masters/import',
  PRODUCT_MASTERS_EXPORT: '/api/product-masters/export',
} as const;
```

### B. データフロー設計

**Phase 1: Backend API実装**
1. ProductMasterController: CRUD + 検索・フィルタリング
2. カスタム属性管理機能
3. 導入統計・分析機能
4. ドキュメント管理機能

**Phase 2A: フロントエンド モック実装**
1. Material-UIベースのマスター・ディテール レイアウト
2. @MARK で API接続ポイントをマーク
3. モックデータでの動作確認

**Phase 2B: API統合**
1. @MARK 箇所を実API呼び出しに変更
2. カスタム属性管理の統合
3. エラーハンドリング・バリデーション

**Phase 3: 人間による検証**
1. 全機能の動作確認
2. パフォーマンステスト
3. データ整合性確認

### C. モックアップ分析（mockups/product-master.html）

**主要機能エリア**
1. **ツールバー**: 検索・フィルタリング（カテゴリ・ステータス）・新規登録
2. **商材一覧**: 商材基本情報・導入状況・ステータス・タグ表示
3. **詳細編集エリア**: 商材詳細情報・カスタム項目編集・保存
4. **統計エリア**: 商材統計・導入状況・カテゴリ別分析

**重要なUI要素**
- ステータスバッジ（アクティブ・非アクティブ・下書き）
- 導入企業数・提案中数の表示
- カスタム項目の動的追加・削除機能
- 商材詳細情報の豊富な入力フォーム
- 統計情報の視覚的表示

### D. 他システム連携

**商品管理（010）との連携**
- 商材マスタ→商品（企業固有設定）への展開
- 商材基本情報の継承・カスタマイズ
- 価格・仕様の企業別調整

**契約管理（011）との連携**
- 契約対象商材の詳細情報参照
- 商材バージョン・ライセンス情報管理
- 契約条件・価格情報の連携

**提案管理（012）との連携**
- 提案書での商材情報引用
- 商材組み合わせ・パッケージ提案
- 競合比較・特徴説明の活用

## 5. Implementation Blueprint（実装設計図）

### Phase 1: Backend Implementation

**1.1 商材マスタ基本機能**
```typescript
// backend/src/features/productMaster/controllers/ProductMasterController.ts
export class ProductMasterController {
  async createProductMaster(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 新規商材マスタ作成
  }
  
  async getProductMasters(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 商材マスタ一覧取得
  }
  
  async getProductMasterById(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 商材マスタ詳細取得
  }
  
  async updateProductMaster(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 商材マスタ更新
  }
  
  async deleteProductMaster(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 商材マスタ削除（論理削除）
  }
  
  async searchProductMasters(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 高度な検索・フィルタリング
  }
  
  async getProductCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    // カテゴリ一覧・統計取得
  }
  
  async bulkUpdateProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 一括更新（ステータス変更等）
  }
}
```

**1.2 カスタム属性管理**
```typescript
// backend/src/features/productMaster/services/CustomAttributeService.ts
export class CustomAttributeService {
  async getAttributeTemplates(category?: ProductCategory): Promise<AttributeTemplate[]> {
    // カテゴリ別カスタム属性テンプレート取得
  }
  
  async validateCustomAttributes(
    attributes: Record<string, any>,
    category: ProductCategory
  ): Promise<ValidationResult> {
    // カスタム属性バリデーション
  }
  
  async mergeAttributeTemplates(
    existingAttributes: Record<string, any>,
    newAttributes: Record<string, any>
  ): Promise<Record<string, any>> {
    // 属性のマージ・更新
  }
  
  async getAttributeUsageStats(): Promise<Array<{
    attributeName: string;
    usageCount: number;
    categories: ProductCategory[];
  }>> {
    // 属性使用統計
  }
}
```

**1.3 商材統計・分析**
```typescript
// backend/src/features/productMaster/services/ProductAnalyticsService.ts
export class ProductAnalyticsService {
  async getDeploymentStats(productId: string): Promise<ProductDeploymentStats> {
    // 商材導入統計取得
  }
  
  async getCategoryStats(): Promise<ProductCategoryStats[]> {
    // カテゴリ別統計取得
  }
  
  async getPopularityRanking(
    timeframe: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<Array<{
    productId: string;
    productName: string;
    score: number;
    rank: number;
  }>> {
    // 人気商材ランキング
  }
  
  async generateProductReport(productId: string): Promise<{
    deploymentStats: ProductDeploymentStats;
    competitorAnalysis: any;
    marketTrends: any;
    recommendations: string[];
  }> {
    // 商材レポート生成
  }
}
```

**1.4 ドキュメント管理**
```typescript
// backend/src/features/productMaster/controllers/ProductDocumentController.ts
export class ProductDocumentController {
  async uploadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 商材ドキュメントアップロード
  }
  
  async getDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 商材ドキュメント一覧取得
  }
  
  async downloadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    // ドキュメントダウンロード
  }
  
  async deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    // ドキュメント削除
  }
  
  async updateDocumentMetadata(req: AuthenticatedRequest, res: Response): Promise<void> {
    // ドキュメントメタデータ更新
  }
}
```

**1.5 データベース設計**
```sql
-- 商材マスタテーブル
CREATE TABLE product_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500) NOT NULL,
  category product_category_enum NOT NULL,
  description TEXT,
  short_description VARCHAR(1000),
  status product_status_enum NOT NULL DEFAULT 'draft',
  version VARCHAR(100),
  release_date DATE,
  end_of_life_date DATE,
  tags TEXT[],
  custom_attributes JSONB DEFAULT '{}',
  pricing JSONB DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 商材ドキュメントテーブル
CREATE TABLE product_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES product_masters(id),
  document_type VARCHAR(50) NOT NULL,
  name VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  is_public BOOLEAN DEFAULT false
);

-- カスタム属性テンプレートテーブル
CREATE TABLE product_attribute_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category product_category_enum NOT NULL,
  attribute_name VARCHAR(200) NOT NULL,
  attribute_type VARCHAR(50) NOT NULL, -- text, number, boolean, select, date
  default_value TEXT,
  validation_rules JSONB,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_product_masters_category_status ON product_masters(category, status);
CREATE INDEX idx_product_masters_name_search ON product_masters USING gin(to_tsvector('japanese', name));
CREATE INDEX idx_product_masters_tags ON product_masters USING gin(tags);
CREATE INDEX idx_product_masters_custom_attrs ON product_masters USING gin(custom_attributes);
CREATE INDEX idx_product_documents_product ON product_documents(product_id);
CREATE INDEX idx_product_attribute_templates_category ON product_attribute_templates(category);
```

### Phase 2A: Frontend Mock Implementation

**2A.1 コンポーネント構造**
```typescript
// frontend/src/pages/ProductMasterManagementPage.tsx
export const ProductMasterManagementPage: React.FC = () => {
  return (
    <div className="product-master-container">
      <PageHeader title="商材マスタ管理" />
      <div className="product-content">
        <ProductToolbar />
        <div className="main-content-grid">
          <ProductMasterList />
          <ProductDetailSidebar />
        </div>
      </div>
    </div>
  );
};

// frontend/src/components/productMaster/ProductToolbar.tsx
export const ProductToolbar: React.FC = () => {
  return (
    <div className="product-toolbar">
      <SearchInput />
      <CategoryFilter />
      <StatusFilter />
      <SearchButton />
      <NewProductButton />
    </div>
  );
};

// frontend/src/components/productMaster/ProductMasterList.tsx
export const ProductMasterList: React.FC = () => {
  return (
    <div className="product-master-list">
      <ListHeader />
      <ProductItems />
    </div>
  );
};

// frontend/src/components/productMaster/ProductDetailSidebar.tsx
export const ProductDetailSidebar: React.FC = () => {
  return (
    <div className="product-detail-sidebar">
      <ProductDetailForm />
      <ProductStatistics />
      <DeploymentStatus />
    </div>
  );
};
```

**2A.2 状態管理**
```typescript
// frontend/src/stores/productMasterStore.ts
interface ProductMasterState {
  products: ProductMaster[];
  selectedProduct: ProductMaster | null;
  categories: ProductCategory[];
  filters: {
    searchTerm: string;
    category: ProductCategory[];
    status: ProductStatus[];
    tags: string[];
  };
  statistics: {
    totalProducts: number;
    activeProducts: number;
    categoryStats: ProductCategoryStats[];
    popularityRanking: any[];
  };
  loading: boolean;
  error: string | null;
}

export const useProductMasterStore = create<ProductMasterState>((set, get) => ({
  // @MARK: モックデータから開始、後でAPI連携
  products: MOCK_PRODUCT_MASTERS,
  selectedProduct: null,
  categories: Object.values(ProductCategory),
  filters: {
    searchTerm: '',
    category: [],
    status: [],
    tags: [],
  },
  statistics: MOCK_PRODUCT_STATISTICS,
  loading: false,
  error: null,
  
  // 商材選択
  selectProduct: async (product: ProductMaster) => {
    set({ selectedProduct: product, loading: true });
    // @MARK: API連携時に詳細統計取得
    const deploymentStats = await productMasterService.getDeploymentStats(product.id);
    set({ 
      selectedProduct: { ...product, deploymentStats },
      loading: false 
    });
  },
  
  // 商材作成・更新
  createProduct: async (productData: ProductMasterCreateRequest) => {
    // @MARK: API連携時に実装
    const newProduct = await productMasterService.createProduct(productData);
    const products = [...get().products, newProduct];
    set({ products });
  },
  
  updateProduct: async (productId: string, updates: ProductMasterUpdateRequest) => {
    // @MARK: API連携時に実装
    const updatedProduct = await productMasterService.updateProduct(productId, updates);
    const products = get().products.map(p => 
      p.id === productId ? updatedProduct : p
    );
    set({ products, selectedProduct: updatedProduct });
  },
  
  // フィルター・検索
  updateFilters: (newFilters: Partial<typeof get().filters>) => {
    set({ filters: { ...get().filters, ...newFilters } });
    // @MARK: フィルター適用ロジック
  },
  
  searchProducts: async (searchRequest: ProductMasterSearchRequest) => {
    // @MARK: API連携時に実装
    const response = await productMasterService.searchProducts(searchRequest);
    set({ products: response.products });
  },
  
  // カスタム属性管理
  addCustomAttribute: (attributeName: string, attributeValue: any) => {
    const product = get().selectedProduct;
    if (product) {
      const updatedProduct = {
        ...product,
        customAttributes: {
          ...product.customAttributes,
          [attributeName]: attributeValue
        }
      };
      set({ selectedProduct: updatedProduct });
    }
  },
  
  removeCustomAttribute: (attributeName: string) => {
    const product = get().selectedProduct;
    if (product) {
      const { [attributeName]: removed, ...remaining } = product.customAttributes;
      const updatedProduct = {
        ...product,
        customAttributes: remaining
      };
      set({ selectedProduct: updatedProduct });
    }
  },
  
  // 統計取得
  loadStatistics: async () => {
    // @MARK: API連携時に実装
    const categoryStats = await productMasterService.getCategoryStats();
    const popularityRanking = await productMasterService.getPopularityRanking();
    set({ 
      statistics: {
        ...get().statistics,
        categoryStats,
        popularityRanking
      }
    });
  }
}));
```

### Phase 2B: API Integration

**2B.1 API統合**
```typescript
// frontend/src/services/productMasterService.ts
export class ProductMasterService {
  private apiClient: ApiClient;
  
  // @MARK: Phase 2B で実装
  async getProducts(): Promise<ProductMaster[]> {
    return this.apiClient.get(API_PATHS.PRODUCT_MASTERS);
  }
  
  async getProductById(productId: string): Promise<ProductMaster> {
    return this.apiClient.get(API_PATHS.PRODUCT_MASTER_DETAIL.replace(':id', productId));
  }
  
  async createProduct(productData: ProductMasterCreateRequest): Promise<ProductMaster> {
    return this.apiClient.post(API_PATHS.PRODUCT_MASTERS, productData);
  }
  
  async updateProduct(productId: string, updates: ProductMasterUpdateRequest): Promise<ProductMaster> {
    return this.apiClient.put(API_PATHS.PRODUCT_MASTER_DETAIL.replace(':id', productId), updates);
  }
  
  async deleteProduct(productId: string): Promise<void> {
    return this.apiClient.delete(API_PATHS.PRODUCT_MASTER_DETAIL.replace(':id', productId));
  }
  
  async searchProducts(searchRequest: ProductMasterSearchRequest): Promise<ProductMasterSearchResponse> {
    return this.apiClient.post(API_PATHS.PRODUCT_MASTER_SEARCH, searchRequest);
  }
  
  async getDeploymentStats(productId: string): Promise<ProductDeploymentStats> {
    return this.apiClient.get(API_PATHS.PRODUCT_DEPLOYMENT_STATS.replace(':id', productId));
  }
  
  async getCategoryStats(): Promise<ProductCategoryStats[]> {
    return this.apiClient.get(API_PATHS.PRODUCT_CATEGORY_STATS);
  }
  
  async getPopularityRanking(): Promise<any[]> {
    return this.apiClient.get(API_PATHS.PRODUCT_POPULARITY_RANKING);
  }
  
  async uploadDocument(productId: string, file: File, documentType: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    return this.apiClient.post(
      API_PATHS.PRODUCT_DOCUMENT_UPLOAD.replace(':id', productId),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  }
  
  async exportProducts(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    return this.apiClient.get(API_PATHS.PRODUCT_MASTERS_EXPORT, {
      params: { format },
      responseType: 'blob'
    });
  }
  
  async importProducts(file: File): Promise<{ success: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.apiClient.post(API_PATHS.PRODUCT_MASTERS_IMPORT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
}
```

### Phase 3: Human Validation

**3.1 機能検証項目**
- [ ] 商材マスタ CRUD の正常動作
- [ ] 検索・フィルタリング機能の性能
- [ ] カスタム属性追加・編集の柔軟性
- [ ] 商材統計・分析データの正確性
- [ ] ドキュメント管理機能の安全性
- [ ] CSV インポート・エクスポートの正確性
- [ ] 他システムとの連携準備確認

**3.2 パフォーマンステスト**
- [ ] 100件商材での1秒以内検索
- [ ] 大量カスタム属性での表示性能
- [ ] ファイルアップロード・ダウンロードの効率性

## 6. Validation Method（検証方法）

### 6.1 API動作確認
```bash
# 商材マスタ作成
curl -X POST "http://localhost:3001/api/product-masters" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "name": "新CRMシステム Pro",
    "category": "software",
    "description": "次世代顧客管理システム",
    "status": "active",
    "version": "v1.0",
    "pricing": {
      "basePrice": 50000,
      "currency": "JPY",
      "pricingModel": "subscription"
    }
  }'

# 商材検索
curl -X POST "http://localhost:3001/api/product-masters/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "category": ["software"],
    "status": ["active"],
    "searchTerm": "CRM"
  }'

# 導入統計取得
curl -X GET "http://localhost:3001/api/product-masters/product-123/deployment-stats" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 6.2 他システム連携確認
- 商品管理（010）での商材マスタ参照
- 契約管理（011）での商材情報活用
- 提案管理（012）での商材選択機能

### 6.3 データ整合性確認
- カスタム属性の正確な保存・取得
- 商材統計の計算精度確認
- インポート・エクスポートのデータ完全性

## 7. Completion Criteria（完了基準）

### 7.1 機能完了基準
- [ ] **商材マスタ管理**: 完全なCRUD操作・検索・フィルタリング機能
- [ ] **カスタム属性**: 柔軟なカスタム項目追加・編集・管理機能
- [ ] **統計・分析**: 導入状況・カテゴリ別・人気度の正確な分析
- [ ] **ドキュメント管理**: 安全なファイルアップロード・ダウンロード機能
- [ ] **インポート・エクスポート**: CSV・Excel形式での一括処理
- [ ] **検索性能**: 100件商材での1秒以内高速検索

### 7.2 データ品質完了基準
- [ ] **データ整合性**: カスタム属性・価格・仕様情報の正確な管理
- [ ] **バリデーション**: 商材データの適切な検証・エラーハンドリング
- [ ] **履歴管理**: 商材変更履歴の適切な記録・追跡

### 7.3 ユーザビリティ完了基準
- [ ] **直感的操作**: 新規ユーザーが5分以内に商材登録可能
- [ ] **効率的管理**: 既存商材の更新が従来比50%時間短縮
- [ ] **情報アクセス**: 営業担当者が商材詳細を30秒以内で確認可能

### 7.4 統合完了基準
- [ ] **商品管理統合**: 商材マスタ→商品管理への適切なデータ連携
- [ ] **契約管理統合**: 契約作成時の商材情報正確な参照
- [ ] **提案管理統合**: 提案書作成での商材情報活用準備

**実装完了判定**: 上記全基準を満たし、機能テスト・性能テスト・統合テストが全て通過した時点で完了とする。