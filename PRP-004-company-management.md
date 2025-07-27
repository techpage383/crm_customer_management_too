# PRP-004: 企業管理ページ実装計画書

## 1. Goal（目標）

企業管理ページ（P-002）の完全実装により、営業担当者・管理者が以下を達成できる状態を実現する：

- **企業情報の包括管理**: 企業CRUD操作、詳細情報管理、担当者割り当て
- **効率的な企業検索**: 名前、ステータス、担当者による高速検索・フィルタリング
- **担当者権限制御**: 主担当者・副担当者による編集権限の厳密な管理
- **カスタム項目管理**: 企業ごとの独自情報項目の柔軟な追加・管理
- **ステータス管理**: 見込み客→既存顧客→休眠の段階的管理とフォロー
- **統合CRM基盤**: Gmail・TODO・契約・提案管理の中核エンティティとして機能

## 2. Why（理由）

### ビジネス価値
- **営業効率化**: 企業情報の一元管理による営業活動の効率化
- **顧客関係強化**: 担当者制による責任の明確化と関係の深化
- **営業機会創出**: 見込み客の適切な管理とフォローアップ体制
- **データドリブン営業**: 企業情報の構造化による分析・レポート基盤

### 技術的必要性
- **CRMの中核エンティティ**: 全ての顧客関連機能（Gmail・TODO・契約等）の基盤
- **担当者権限の実装基盤**: ユーザー管理（002）で確立した権限制御の活用
- **データ統合の基盤**: Gmail連携・AI TODO抽出の企業紐付け機能
- **スケーラブルな設計**: 大量企業データの効率的な管理・検索

### 実装優先度の理由
- **順序004**: 認証・ユーザー管理・システム管理の基盤構築完了後の必須機能
- **TODOマネジメントの前提**: TODO管理（005）で企業紐付けTODOを管理するため
- **Gmail連携の準備**: Gmail連携（006-008）で企業別メール管理を行うため

## 3. What（要件）

### ユーザーストーリー

**営業担当者として**
- 担当企業の一覧を表示・検索・フィルタリングできる
- 担当企業の詳細情報を閲覧・編集できる
- 企業のステータス（見込み客・既存顧客・休眠）を管理できる
- 企業にカスタム項目を追加・編集できる
- 新規企業を登録できる

**管理者として**
- 全企業の一覧を表示・管理できる
- 企業の担当者を変更・追加できる
- 企業データの一括操作（インポート・エクスポート）ができる
- 企業統計・レポートを確認できる

**上位権限者として**
- 担当者権限に関係なく全企業を編集できる
- 企業削除・復元操作ができる
- 企業データの監査ログを確認できる

### 技術要件

**フロントエンド要件**
- Material-UIベースのマスター・ディテール レイアウト
- リアルタイム検索・フィルタリング機能
- 担当者権限に応じた編集権限制御
- カスタムフィールドの動的追加・編集
- レスポンシブデザイン（モバイル対応）

**バックエンド要件**
- 企業CRUDのRESTful API
- 高速検索・インデックス最適化
- 担当者権限チェック機能
- カスタムフィールド管理システム
- 監査ログ記録機能

**成功基準**
- 1000件企業での2秒以内検索
- 担当者権限の厳密なチェック
- カスタムフィールドの柔軟な管理
- 全操作の監査ログ記録

## 4. All Needed Context（必要な情報）

### A. API仕様（schemas/index.tsから抜粋）

```typescript
// ========== 企業（顧客）関連 ==========
export enum CompanyStatus {
  PROSPECT = 'prospect',       // 見込み客
  ACTIVE = 'active',          // 既存顧客
  INACTIVE = 'inactive'       // 休眠
}

export enum IndustryType {
  IT = 'it',
  MANUFACTURING = 'manufacturing',
  RETAIL = 'retail',
  FINANCE = 'finance',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  REAL_ESTATE = 'real_estate',
  OTHER = 'other'
}

export interface CompanyBase {
  name: string;
  nameKana?: string;
  industry?: IndustryType;
  status: CompanyStatus;
  employeeCount?: number;
  capital?: number;
  establishedDate?: Date;
  fiscalYearEnd?: string;
  website?: string;
  phone?: string;
  fax?: string;
  address?: string;
  postalCode?: string;
  majorClients?: string[];
  notes?: string;
  primaryAssigneeId?: ID;           // 主担当者（権限を持つ）
  secondaryAssigneeIds?: ID[];      // 副担当者（閲覧のみ）
}

export interface CompanyCreate extends CompanyBase {}

export interface CompanyUpdate extends Partial<CompanyBase> {}

export interface Company extends CompanyBase, Timestamps {
  id: ID;
  primaryAssignee?: User;           // 主担当者の詳細
  secondaryAssignees?: User[];      // 副担当者の詳細
  contacts?: Contact[];
  emailThreads?: EmailThread[];
  todos?: Todo[];
  contracts?: Contract[];
  proposals?: Proposal[];
  deployments?: Deployment[];
}

// ========== 連絡先関連 ==========
export interface ContactBase {
  companyId: ID;
  name: string;
  nameKana?: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface ContactCreate extends ContactBase {}

export interface ContactUpdate extends Partial<ContactBase> {}

export interface Contact extends ContactBase, Timestamps {
  id: ID;
  company?: Company;
}

// ========== 企業検索・フィルタリング関連（新規追加） ==========
export interface CompanySearchRequest {
  query?: string;                    // 企業名での検索
  status?: CompanyStatus[];          // ステータスフィルター
  industry?: IndustryType[];         // 業種フィルター
  primaryAssigneeId?: ID[];          // 主担当者フィルター
  secondaryAssigneeId?: ID[];        // 副担当者フィルター
  employeeCountMin?: number;         // 従業員数最小値
  employeeCountMax?: number;         // 従業員数最大値
  capitalMin?: number;               // 資本金最小値
  capitalMax?: number;               // 資本金最大値
  establishedAfter?: Date;           // 設立日以降
  establishedBefore?: Date;          // 設立日以前
  hasEmail?: boolean;               // メール連携有無
  hasTodos?: boolean;               // TODO有無
  hasContracts?: boolean;           // 契約有無
  customFields?: Record<string, any>; // カスタムフィールド検索
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'status' | 'industry' | 'employeeCount' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CompanySearchResponse {
  companies: Company[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  facets?: {                        // 検索結果の統計情報
    statusCounts: Record<CompanyStatus, number>;
    industryCounts: Record<IndustryType, number>;
    assigneeCounts: Record<ID, number>;
  };
}

export interface CompanyStatsResponse {
  totalCompanies: number;
  byStatus: Record<CompanyStatus, number>;
  byIndustry: Record<IndustryType, number>;
  newThisMonth: number;
  updatedThisWeek: number;
  averageEmployeeCount: number;
  averageCapital: number;
  topAssignees: Array<{
    userId: ID;
    userName: string;
    companyCount: number;
  }>;
}

export interface CompanyAssignRequest {
  primaryAssigneeId?: ID;
  secondaryAssigneeIds?: ID[];
  reason?: string;
}

export interface CompanyBulkUpdateRequest {
  companyIds: ID[];
  updates: {
    status?: CompanyStatus;
    primaryAssigneeId?: ID;
    addSecondaryAssigneeIds?: ID[];
    removeSecondaryAssigneeIds?: ID[];
    industry?: IndustryType;
  };
}

export interface CompanyBulkUpdateResponse {
  successCount: number;
  errorCount: number;
  errors?: {
    companyId: ID;
    error: string;
  }[];
}

// 🔥 重要: 実装時は必ずこの型定義に完全準拠すること
// ❌ 禁止: 独自のレスポンス形式 {"success": true, "data": ...}
// ✅ 必須: 型定義通りの実装 {"companies": [...], "totalCount": 123, ...}

// ========== APIパス定義（企業関連） ==========
export const API_PATHS = {
  // 企業（顧客）関連
  COMPANIES: {
    BASE: '/api/companies',
    DETAIL: (companyId: string) => `/api/companies/${companyId}`,
    CONTACTS: (companyId: string) => `/api/companies/${companyId}/contacts`,
    EMAILS: (companyId: string) => `/api/companies/${companyId}/emails`,
    TODOS: (companyId: string) => `/api/companies/${companyId}/todos`,
    CONTRACTS: (companyId: string) => `/api/companies/${companyId}/contracts`,
    PROPOSALS: (companyId: string) => `/api/companies/${companyId}/proposals`,
    DEPLOYMENTS: (companyId: string) => `/api/companies/${companyId}/deployments`,
    ASSIGN: (companyId: string) => `/api/companies/${companyId}/assign`,
    // 企業管理機能追加
    SEARCH: '/api/companies/search',
    BULK_UPDATE: '/api/companies/bulk',
    EXPORT_CSV: '/api/companies/export/csv',
    IMPORT_CSV: '/api/companies/import/csv',
    STATS: '/api/companies/stats',
    CUSTOM_FIELDS: '/api/companies/custom-fields',
    DUPLICATE_CHECK: '/api/companies/duplicate-check'
  },
  
  // 連絡先関連
  CONTACTS: {
    BASE: '/api/contacts',
    DETAIL: (contactId: string) => `/api/contacts/${contactId}`
  }
};

// ========== API認証設定 ==========
export const API_AUTH_CONFIG = {
  // 担当者チェックが必要なエンドポイント（正規表現）
  ASSIGNEE_CHECK_REQUIRED: [
    /^\/api\/companies\/[^\/]+$/,          // PUT /api/companies/:id
    /^\/api\/companies\/[^\/]+\/.*$/,      // 企業関連サブリソース
  ]
};
```

### B. モックアップファイル（完全なHTMLコード）

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>企業管理 - 顧客管理ツール</title>
    
    <!-- Material UI CDN -->
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    
    <style>
        /* 完全なCSS（省略：実際は550行のスタイル定義）*/
        .header {
            background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
            color: white;
            padding: 1rem 2rem;
        }
        
        .search-bar {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        
        .content-grid {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 2rem;
            align-items: start;
        }
        
        .company-list {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .company-item {
            padding: 1.5rem;
            border-bottom: 1px solid #e0e0e0;
            cursor: pointer;
        }
        
        .company-item.active {
            background-color: #e3f2fd;
            border-left: 4px solid #1976d2;
        }
        
        .details-panel {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            position: sticky;
            top: 2rem;
        }
        
        .field-input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>企業管理</h1>
    </header>

    <div class="main-container">
        <div class="search-bar">
            <input type="text" class="search-input" placeholder="企業名で検索..." value="サンプル">
            <select class="filter-select">
                <option value="">ステータス</option>
                <option value="prospect">見込み客</option>
                <option value="customer">既存顧客</option>
                <option value="dormant">休眠</option>
            </select>
            <select class="filter-select">
                <option value="">担当者</option>
                <option value="tanaka">田中</option>
                <option value="sato">佐藤</option>
                <option value="suzuki">鈴木</option>
            </select>
            <button class="btn btn-primary">
                <span class="material-icons">search</span>
                検索
            </button>
            <button class="btn btn-success">
                <span class="material-icons">add</span>
                新規企業登録
            </button>
        </div>

        <div class="content-grid">
            <div class="company-list">
                <div class="list-header">
                    <h2>企業一覧 (3件)</h2>
                </div>
                
                <div class="company-item active">
                    <div class="company-name">サンプル株式会社</div>
                    <div class="company-info">
                        <span>IT・ソフトウェア</span>
                        <span>従業員100名</span>
                        <span>担当: 田中</span>
                    </div>
                    <div class="company-tags">
                        <span class="tag status-customer">既存顧客</span>
                        <span class="tag">重要</span>
                    </div>
                </div>
                
                <div class="company-item">
                    <div class="company-name">テスト商事株式会社</div>
                    <div class="company-info">
                        <span>商社・貿易</span>
                        <span>従業員50名</span>
                        <span>担当: 佐藤</span>
                    </div>
                    <div class="company-tags">
                        <span class="tag status-prospect">見込み客</span>
                    </div>
                </div>
                
                <div class="company-item">
                    <div class="company-name">デモ工業株式会社</div>
                    <div class="company-info">
                        <span>製造業</span>
                        <span>従業員200名</span>
                        <span>担当: 鈴木, 田中</span>
                    </div>
                    <div class="company-tags">
                        <span class="tag status-dormant">休眠</span>
                        <span class="tag">要フォロー</span>
                    </div>
                </div>
            </div>

            <div class="details-panel">
                <div class="details-header">
                    <h3>サンプル株式会社</h3>
                    <button class="btn edit-btn">
                        <span class="material-icons">edit</span>
                    </button>
                </div>
                
                <div class="details-content">
                    <!-- 基本情報フォーム -->
                    <div class="field-group">
                        <label class="field-label">会社名 *</label>
                        <input type="text" class="field-input" value="サンプル株式会社">
                    </div>
                    
                    <div class="field-row">
                        <div class="field-group">
                            <label class="field-label">業種</label>
                            <input type="text" class="field-input" value="IT・ソフトウェア">
                        </div>
                        <div class="field-group">
                            <label class="field-label">従業員数</label>
                            <input type="number" class="field-input" value="100">
                        </div>
                    </div>
                    
                    <div class="field-group">
                        <label class="field-label">連絡先</label>
                        <input type="text" class="field-input" value="03-1234-5678">
                    </div>
                    
                    <div class="field-group">
                        <label class="field-label">住所</label>
                        <input type="text" class="field-input" value="東京都渋谷区1-2-3">
                    </div>
                    
                    <div class="field-group">
                        <label class="field-label">ステータス</label>
                        <select class="field-input">
                            <option value="prospect">見込み客</option>
                            <option value="customer" selected>既存顧客</option>
                            <option value="dormant">休眠</option>
                        </select>
                    </div>
                    
                    <!-- 担当者管理 -->
                    <div class="field-group">
                        <label class="field-label">担当者</label>
                        <div class="assigned-users">
                            <span class="user-chip">
                                田中
                                <span class="material-icons close-icon">close</span>
                            </span>
                        </div>
                        <select class="field-input assign-select">
                            <option value="">担当者を追加</option>
                            <option value="sato">佐藤</option>
                            <option value="suzuki">鈴木</option>
                        </select>
                    </div>
                    
                    <!-- カスタム項目 -->
                    <div class="custom-fields">
                        <div class="custom-field-header">
                            <h4>カスタム項目</h4>
                            <button class="btn btn-add-field">
                                <span class="material-icons">add</span>
                                項目追加
                            </button>
                        </div>
                        
                        <div class="field-group">
                            <label class="field-label">資本金</label>
                            <input type="text" class="field-input" value="1億円">
                        </div>
                        
                        <div class="field-group">
                            <label class="field-label">設立年</label>
                            <input type="text" class="field-input" value="2010年">
                        </div>
                        
                        <div class="field-group">
                            <label class="field-label">主要取引先</label>
                            <input type="text" class="field-input" value="大手商社A, メーカーB">
                        </div>
                    </div>
                    
                    <div class="actions">
                        <button class="btn btn-primary save-btn">
                            <span class="material-icons">save</span>
                            保存
                        </button>
                        <button class="btn cancel-btn">
                            キャンセル
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // マスター・ディテール UI の動的切り替え
        // 企業選択・詳細表示・編集機能
        // 検索・フィルタリング機能
        // 担当者追加・削除機能
        // カスタムフィールド動的追加機能
        
        document.addEventListener('DOMContentLoaded', function() {
            // 企業選択処理
            const companyItems = document.querySelectorAll('.company-item');
            companyItems.forEach(item => {
                item.addEventListener('click', function() {
                    companyItems.forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                    
                    const companyName = this.querySelector('.company-name').textContent;
                    document.querySelector('.details-header h3').textContent = companyName;
                });
            });
            
            // 検索機能
            const searchInput = document.querySelector('.search-input');
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                companyItems.forEach(item => {
                    const companyName = item.querySelector('.company-name').textContent.toLowerCase();
                    item.style.display = companyName.includes(searchTerm) ? 'block' : 'none';
                });
            });
            
            // 担当者管理機能
            const assignSelect = document.querySelector('.assign-select');
            assignSelect.addEventListener('change', function() {
                if (this.value) {
                    const assignedUsers = document.querySelector('.assigned-users');
                    const newChip = document.createElement('span');
                    newChip.className = 'user-chip';
                    newChip.innerHTML = `
                        ${this.options[this.selectedIndex].text}
                        <span class="material-icons close-icon">close</span>
                    `;
                    
                    newChip.querySelector('.close-icon').addEventListener('click', function() {
                        newChip.remove();
                    });
                    
                    assignedUsers.appendChild(newChip);
                    this.value = '';
                }
            });
            
            // カスタムフィールド追加機能
            document.querySelector('.btn-add-field').addEventListener('click', function() {
                const customFields = document.querySelector('.custom-fields');
                const newField = document.createElement('div');
                newField.className = 'field-group';
                newField.innerHTML = `
                    <label class="field-label">
                        <input type="text" placeholder="項目名" style="border: none; background: transparent; width: 150px;">
                    </label>
                    <input type="text" class="field-input" placeholder="値を入力">
                `;
                
                customFields.insertBefore(newField, this.parentElement);
            });
        });
    </script>
</body>
</html>
```

### C. 統一ガイドライン（auth-system-design.mdから関連部分を抜粋）

以下の統一ガイドラインを必ず適用：

**担当者権限管理の統一**
- **担当者フィールド**: `primaryAssigneeId`（主担当者）、`secondaryAssigneeIds`（副担当者）
- **編集権限**: 主担当者のみ編集可能、副担当者は閲覧のみ
- **上位権限**: UPPER_ROLES（COMPANY_LEADER/MANAGER/TEAM_LEADER）は全企業編集可能
- **権限継承**: 上位権限者は下位権限者の担当企業を管理可能

**データモデルの統一**
- **Company エンティティ**: 企業中心のデータモデル（旧Customer → Company）
- **型定義準拠**: schemas/index.tsの型定義に完全準拠
- **関連エンティティ**: Contact, EmailThread, Todo, Contract, Proposal, Deploymentとの関連性
- **監査ログ**: 全企業操作の完全な記録保持

**検索・フィルタリングの統一**
- **高速検索**: インデックス最適化による大量データ対応
- **複合フィルター**: ステータス、業種、担当者、従業員数等の組み合わせ
- **ファセット検索**: 検索結果の統計情報表示
- **ページネーション**: 大量結果の効率的な表示

**セキュリティの統一**
- **担当者チェック**: 企業編集時の必須権限確認
- **操作ログ**: 全企業操作の監査ログ記録
- **データ保護**: 個人情報・機密情報の適切な管理
- **アクセス制御**: ロールベース + 担当者ベースの二重制御

### D. ディレクトリ構造

```
frontend/src/
├── pages/user/                     # ユーザーページ
│   └── CompanyManagementPage.tsx   # P-002: 企業管理ページ
├── components/features/companies/  # 企業管理関連コンポーネント
│   ├── CompanyList.tsx            # 企業一覧（左パネル）
│   ├── CompanyListItem.tsx        # 企業一覧アイテム
│   ├── CompanySearchForm.tsx      # 検索・フィルターフォーム
│   ├── CompanyDetailsPanel.tsx    # 企業詳細パネル（右パネル）
│   ├── CompanyEditForm.tsx        # 企業編集フォーム
│   ├── CompanyCreateModal.tsx     # 企業新規作成モーダル
│   ├── CompanyAssigneeManager.tsx # 担当者管理コンポーネント
│   ├── CompanyCustomFields.tsx    # カスタムフィールド管理
│   ├── CompanyStatusBadge.tsx     # ステータス表示バッジ
│   ├── CompanyStatsCard.tsx       # 企業統計カード
│   └── CompanyBulkActions.tsx     # 一括操作コンポーネント
├── services/                      # 🔥 統合層（モック/実API切り替え管理）
│   ├── index.ts                   # 🔥 統合層（モック/実API切り替え管理）
│   ├── mock/                      # 🔥 モックサービス
│   │   ├── data/                  # 🔥 モックデータ（型定義準拠）
│   │   │   ├── companies.mock.ts
│   │   │   ├── contacts.mock.ts
│   │   │   └── industry.mock.ts
│   │   └── companies.service.ts
│   ├── api/                       # 実API接続実装
│   │   ├── client.ts              # APIクライアント基盤
│   │   └── companies.service.ts
│   └── utils/                     # 🔥 @MARKシステム関連ユーティリティ
└── schemas/                       # バックエンドと同期するデータ契約
    └── index.ts                   # APIパスとデータ契約（単一の真実源）

backend/src/
├── features/companies/            # 企業管理機能
│   ├── companies.controller.ts   # 企業APIエンドポイント
│   ├── companies.service.ts      # 企業ビジネスロジック
│   ├── companies.routes.ts       # ルート定義
│   ├── search.service.ts         # 検索・フィルタリングサービス
│   ├── assignee.service.ts       # 担当者管理サービス
│   └── customfields.service.ts   # カスタムフィールド管理
├── common/middlewares/            # 共通ミドルウェア
│   ├── assignee.middleware.ts    # 担当者権限チェック
│   └── company.middleware.ts     # 企業操作権限チェック
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
// @MOCK_TO_API: companiesService.searchCompanies()に置き換え
const searchResult = await mockCompaniesService.searchCompanies(searchParams);

// services/index.ts でモックサービスをエクスポート
export const companiesService = mockCompaniesService;

// 🔥 モックデータの品質基準
// services/mock/data/companies.mock.ts の例
export const mockCompaniesData: Company[] = [
  {
    // schemas/index.ts の Company型定義に完全準拠
    id: "company-001",
    name: "サンプル株式会社",
    nameKana: "サンプルカブシキガイシャ",
    industry: IndustryType.IT,
    status: CompanyStatus.ACTIVE,
    employeeCount: 100,
    capital: 100000000,
    establishedDate: new Date("2010-04-01"),
    website: "https://sample.co.jp",
    phone: "03-1234-5678",
    address: "東京都渋谷区1-2-3",
    postalCode: "150-0001",
    majorClients: ["大手商社A", "メーカーB"],
    notes: "重要顧客。定期的なフォローが必要。",
    primaryAssigneeId: "user-001",
    secondaryAssigneeIds: ["user-002"],
    primaryAssignee: {
      id: "user-001",
      email: "tanaka@company.com",
      username: "tanaka",
      fullName: "田中 太郎",
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    secondaryAssignees: [
      {
        id: "user-002",
        email: "sato@company.com",
        username: "sato",
        fullName: "佐藤 花子",
        role: UserRole.USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    contacts: [
      {
        id: "contact-001",
        companyId: "company-001",
        name: "山田 一郎",
        title: "営業部長",
        email: "yamada@sample.co.jp",
        phone: "03-1234-5679",
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-27T15:30:00Z")
  },
  // 他2社のサンプルデータ...
];

export const mockCompanySearchResponse: CompanySearchResponse = {
  // schemas/index.ts の CompanySearchResponse型に完全準拠
  companies: mockCompaniesData,
  totalCount: 3,
  page: 1,
  limit: 20,
  totalPages: 1,
  facets: {
    statusCounts: {
      [CompanyStatus.PROSPECT]: 1,
      [CompanyStatus.ACTIVE]: 1,
      [CompanyStatus.INACTIVE]: 1
    },
    industryCounts: {
      [IndustryType.IT]: 1,
      [IndustryType.MANUFACTURING]: 1,
      [IndustryType.RETAIL]: 1,
      [IndustryType.FINANCE]: 0,
      [IndustryType.HEALTHCARE]: 0,
      [IndustryType.EDUCATION]: 0,
      [IndustryType.REAL_ESTATE]: 0,
      [IndustryType.OTHER]: 0
    },
    assigneeCounts: {
      "user-001": 2,
      "user-002": 1,
      "user-003": 1
    }
  }
};

// 🔥 Phase 2B: API切り替え時の手順
// 1. grep -r "@MOCK_TO_API" src/ で対象箇所特定
// 2. モック呼び出しを実API呼び出しに置き換え
// 3. services/mock/data/companies.mock.ts 削除
// 4. services/index.ts で実APIサービスに切り替え

// Phase 2B実装例：
const searchResult = await companiesService.searchCompanies(searchParams);

// services/index.ts で対象機能のみ実APIに切り替え
export const companiesService = apiCompaniesService;  // ← 実APIに切り替え済み
export const systemService = mockSystemService;      // ← まだモック

// 🔥 型定義の具体的活用例
import { CompanySearchRequest, CompanySearchResponse, API_PATHS } from '@/schemas';

const searchCompanies = async (params: CompanySearchRequest): Promise<CompanySearchResponse> => {
  const response = await fetch(API_PATHS.COMPANIES.SEARCH, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(params)
  });
  return response.json() as CompanySearchResponse;
};

const createCompany = async (data: CompanyCreate): Promise<Company> => {
  const response = await fetch(API_PATHS.COMPANIES.BASE, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.json() as Company;
};

// 🔥 担当者権限チェック実装例
const canEditCompany = (currentUser: User, company: Company): boolean => {
  // 上位権限者は全企業編集可能
  if (isUpperRole(currentUser.role)) {
    return true;
  }
  
  // 主担当者は編集可能
  if (company.primaryAssigneeId === currentUser.id) {
    return true;
  }
  
  // 副担当者は閲覧のみ
  if (company.secondaryAssigneeIds?.includes(currentUser.id)) {
    return false; // 閲覧のみ
  }
  
  // その他は編集不可
  return false;
};

const canViewCompany = (currentUser: User, company: Company): boolean => {
  // 上位権限者は全企業閲覧可能
  if (isUpperRole(currentUser.role)) {
    return true;
  }
  
  // 主担当者・副担当者は閲覧可能
  if (company.primaryAssigneeId === currentUser.id || 
      company.secondaryAssigneeIds?.includes(currentUser.id)) {
    return true;
  }
  
  return false;
};

// 🔥 検索・フィルタリング実装例
const useCompanySearch = () => {
  const [searchParams, setSearchParams] = useState<CompanySearchRequest>({
    query: '',
    status: [],
    industry: [],
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  const [searchResult, setSearchResult] = useState<CompanySearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  
  const search = useCallback(async () => {
    try {
      setLoading(true);
      // @MOCK_TO_API: companiesService.searchCompanies()に置き換え
      const result = await mockCompaniesService.searchCompanies(searchParams);
      setSearchResult(result);
    } catch (error) {
      console.error('企業検索エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);
  
  useEffect(() => {
    search();
  }, [search]);
  
  return {
    searchParams,
    setSearchParams,
    searchResult,
    loading,
    refetch: search
  };
};
```

## 5. Implementation Blueprint（実装設計図）

### Phase 1: バックエンド実装（2-3日）

```
タスクリスト:
- [ ] schemas/index.tsの型定義確認・拡張
  - CompanySearchRequest/Response型の実装
  - CompanyStats/Assign/BulkUpdate型の実装
  - API_PATHSの拡張（COMPANIES.*）
- [ ] 企業管理APIエンドポイント実装
  - GET /api/companies (一覧取得)
  - POST /api/companies (新規作成)
  - GET /api/companies/:id (詳細取得)
  - PUT /api/companies/:id (更新)
  - DELETE /api/companies/:id (削除)
  - POST /api/companies/search (高度検索)
  - PUT /api/companies/bulk (一括更新)
  - GET /api/companies/stats (統計取得)
  - PUT /api/companies/:id/assign (担当者変更)
  - GET /api/companies/custom-fields (カスタムフィールド管理)
- [ ] 連絡先管理APIエンドポイント実装
  - GET /api/contacts (一覧取得)
  - POST /api/contacts (新規作成)
  - PUT /api/contacts/:id (更新)
  - DELETE /api/contacts/:id (削除)
- [ ] 検索・フィルタリング機能実装
  - インデックス最適化
  - 複合検索条件対応
  - ファセット集計機能
  - ページネーション
- [ ] 担当者権限チェック機能実装
  - 担当者権限ミドルウェア
  - 編集権限チェック
  - 上位権限者の特権制御
- [ ] カスタムフィールド管理実装
  - 動的フィールド定義
  - フィールド値の保存・取得
  - フィールド検索対応
- [ ] 監査ログ機能実装
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
  - CompanyManagementPage.tsx (メインページ)
  - CompanyList.tsx (企業一覧・左パネル)
  - CompanyListItem.tsx (企業一覧アイテム)
  - CompanySearchForm.tsx (検索・フィルターフォーム)
  - CompanyDetailsPanel.tsx (企業詳細パネル・右パネル)
  - CompanyEditForm.tsx (企業編集フォーム)
  - CompanyCreateModal.tsx (企業新規作成モーダル)
  - CompanyAssigneeManager.tsx (担当者管理コンポーネント)
  - CompanyCustomFields.tsx (カスタムフィールド管理)
  - CompanyStatusBadge.tsx (ステータス表示バッジ)
  - CompanyStatsCard.tsx (企業統計カード)
  - CompanyBulkActions.tsx (一括操作コンポーネント)
- [ ] 🔥 モックデータの実装（@MARKシステム使用）
  - services/mock/data/companies.mock.ts に企業データ作成
  - services/mock/data/contacts.mock.ts に連絡先データ作成
  - services/mock/data/industry.mock.ts に業界データ作成
  - 全モック箇所に @MOCK_TO_API コメント付与
  - コンポーネント内でのハードコード完全禁止
- [ ] services/index.ts でモックサービスをエクスポート
- [ ] モックデータの品質確認（schemas/index.ts完全準拠）
- [ ] マスター・ディテール レイアウト実装
- [ ] 検索・フィルタリング機能実装
  - リアルタイム検索
  - 複合フィルター
  - ソート機能
  - ページネーション
- [ ] 担当者権限に応じたUI制御実装
  - 編集権限の表示制御
  - 担当者管理権限制御
- [ ] カスタムフィールド動的管理実装
- [ ] レスポンシブデザイン対応

実装ルール:
// @MOCK_TO_API: API実装時にこのブロック全体をAPI呼び出しに置き換え
const companiesData = await mockCompaniesService.searchCompanies(searchParams);

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
  - 企業検索・一覧取得
  - 企業作成・編集・削除
  - 担当者変更・追加・削除
  - ステータス変更
  - カスタムフィールド管理
  - 連絡先管理
  - 一括操作
  - 統計データ取得
- [ ] services/mock/data/companies.mock.ts 等のみ削除
- [ ] services/index.ts で対象機能のみ実APIに切り替え
- [ ] エラーハンドリング実装（401/403/500/ネットワークエラー対応）
- [ ] 型定義を活用したAPI呼び出し実装
- [ ] ローディング状態実装
- [ ] 担当者権限チェック実装
- [ ] 楽観的更新（Optimistic Update）実装

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
  - 企業検索・フィルタリング
  - 企業作成・編集・削除
  - 担当者変更・追加・削除
  - カスタムフィールド管理
  - ステータス変更
  - 連絡先管理
  - 一括操作
  - 権限制御確認
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

# 企業検索API確認
curl -X POST http://localhost:3000/api/companies/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query":"サンプル","limit":10}' \
  | jq '.'

# 期待値: schemas/index.tsのCompanySearchResponse型と完全一致
# {
#   "companies": [
#     {
#       "id": "...",
#       "name": "サンプル株式会社",
#       "nameKana": "サンプルカブシキガイシャ",
#       "industry": "it",
#       "status": "active",
#       "employeeCount": 100,
#       "primaryAssigneeId": "...",
#       "primaryAssignee": {...},
#       "createdAt": "...",
#       "updatedAt": "..."
#     }
#   ],
#   "totalCount": 1,
#   "page": 1,
#   "limit": 10,
#   "totalPages": 1,
#   "facets": {
#     "statusCounts": {...},
#     "industryCounts": {...}
#   }
# }
#
# ❌ 不一致例: {"success": true, "data": {...}, "pagination": {...}}
# → この場合は即座に実装修正してから次のステップへ

# 企業作成API確認
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "テスト企業",
    "industry": "it",
    "status": "prospect",
    "employeeCount": 50,
    "primaryAssigneeId": "user-001"
  }' \
  | jq '.'

# 期待値: schemas/index.tsのCompany型と完全一致

# 担当者変更API確認
curl -X PUT http://localhost:3000/api/companies/company-001/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "primaryAssigneeId": "user-002",
    "secondaryAssigneeIds": ["user-001", "user-003"]
  }' \
  | jq '.'

# Backend Integration Test（型定義確認後に実行）
npm run test:integration -- tests/integration/companies.flow.test.js
# 期待値: 企業管理APIの全テスト通過
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

# 型定義整合性確認
grep -r "CompanySearchRequest\|CompanySearchResponse\|Company\|Contact" src/
# 期待値: 正しくimportされている

# 担当者権限チェック関数確認
grep -r "canEditCompany\|canViewCompany\|isUpperRole" src/
# 期待値: 権限チェック関数が実装されている

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
# 期待値: 企業関連モックファイル（companies.mock.ts等）のみ削除済み

# 🔥 フロントエンド・バックエンド連携確認（重要）
npm run dev &

# APIエンドポイント疎通確認
curl -X POST http://localhost:3000/api/companies/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query":"","limit":10}' \
  | jq '.companies[0] | .name, .status, .primaryAssigneeId'

# 企業作成疎通確認
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"API疎通テスト","status":"prospect"}' \
  | jq '.id, .name, .status'

# フロントエンドコードでの実際の使用確認
grep -r "name\|status\|primaryAssigneeId" frontend/src/ | head -5
grep -r "API_PATHS.COMPANIES" frontend/src/ | head -5

# 期待値: 
# - @MOCK_TO_API マークが完全削除済み
# - 企業関連モックファイルのみ削除済み
# - APIレスポンスに companies配列、totalCount等が存在
# - フロントエンドコードで name, status等の正しいプロパティ名を使用
# - プロパティ名の完全一致
```

### Phase 3完了時: 人間による最終確認

```bash
# サーバー起動のみ（AIが実行）
npm run dev

# 以下は人間が実行:
# - ブラウザで http://localhost:3000/companies を開く
# - mockups/company-management.html と視覚的に比較
# - 全企業管理フローを確認
#   - 企業検索・フィルタリング（名前、ステータス、担当者）
#   - 企業一覧表示・選択
#   - 企業詳細表示・編集
#   - 企業新規作成
#   - 担当者変更・追加・削除
#   - カスタムフィールド追加・編集・削除
#   - ステータス変更
#   - 連絡先管理
#   - 権限制御確認（担当者以外は編集不可）
# - パフォーマンス確認（応答時間2秒以内等）
# - レスポンシブデザイン確認（モバイル対応）
# - マスター・ディテール レイアウトの確認
# - 最終的な品質確認

# 注意: APIテストはPhase 1で完了済み
```

## 7. 完了条件

### 技術的完了基準:
- [ ] 全テストが通過（Phase 1: Backend Integration Test）
- [ ] フロントエンドビルドエラーなし
- [ ] @MOCK_TO_API マークが完全削除
- [ ] 型エラーなし（schemas/index.ts準拠）
- [ ] 担当者権限チェック機能が正常動作
- [ ] 検索・フィルタリング機能が高速動作

### 機能的完了基準:
- [ ] モックアップとの視覚的一致（90%以上）
- [ ] 全企業管理フローの動作確認
- [ ] マスター・ディテール レイアウトの確認
- [ ] 担当者権限制御の確認
- [ ] カスタムフィールド管理の確認
- [ ] エラーケースの適切な処理（401, 403, 500等）
- [ ] 応答時間2秒以内（1000件企業での検索）
- [ ] レスポンシブ対応確認

### 品質保証基準:
- [ ] コードレビュー完了
- [ ] セキュリティチェック完了（担当者権限・監査ログ）
- [ ] パフォーマンステスト完了
- [ ] 既存システム（認証・ユーザー管理・システム管理）との統合確認
- [ ] 次期実装（TODOマネジメント）への準備完了（企業紐付けTODO管理基盤）