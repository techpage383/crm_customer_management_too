# PRP-002: ユーザー管理ページ実装計画書

## 1. Goal（目標）
**P-010ユーザー管理ページの完全実装**
- 上位権限ユーザー（COMPANY_LEADER, MANAGER, TEAM_LEADER）向けの包括的なユーザー管理機能
- CRUD操作、権限管理、Gmail連携管理、監査ログ、統計ダッシュボードの統合実装
- P-001で確立した@MARKシステムによる段階的実装（モック→実API）

## 2. Why（実装理由）
### 2.1 ビジネス要求
- **ユーザー管理の効率化**: 管理者が簡単にユーザーを管理できる
- **権限制御の強化**: 役割に応じた適切なアクセス制御
- **Gmail連携の管理**: 各ユーザーのGmail連携状況の一元管理
- **監査要件の充足**: 全ユーザー操作の追跡可能性

### 2.2 技術的要求
- **スケーラビリティ**: 大量ユーザーに対応するページネーション
- **セキュリティ**: RBAC（Role-Based Access Control）の実装
- **UX最適化**: 直感的で効率的なユーザーインターフェース

## 3. What（実装内容）
### 3.1 主要機能
1. **ユーザー一覧表示** - テーブル形式で全ユーザー情報表示
2. **検索・フィルタリング** - 名前、メール、役割、ステータスでの絞り込み
3. **ユーザーCRUD操作** - 作成、編集、削除、ステータス変更
4. **権限管理** - 個別ユーザーの権限設定
5. **Gmail連携管理** - 連携状況確認・設定
6. **統計ダッシュボード** - ユーザー数、アクティビティ統計
7. **監査ログ** - ユーザー操作履歴表示
8. **CSV出力** - ユーザーデータのエクスポート
9. **一括操作** - 複数ユーザーの一括更新

### 3.2 権限要件
- **アクセス制御**: UPPER_ROLES（COMPANY_LEADER, MANAGER, TEAM_LEADER）のみアクセス可能
- **機能制限**: 
  - COMPANY_LEADER: 全機能利用可能
  - MANAGER: ユーザー作成・編集・削除可能
  - TEAM_LEADER: 閲覧・一部編集のみ

## 4. Context（技術コンテキスト）
### 4.1 既存システム連携
- **認証システム**: P-001で実装済みのJWT認証システム
- **型定義システム**: フロントエンド・バックエンド同期済み型定義
- **@MARKシステム**: モック→実API段階的切り替えシステム

### 4.2 API仕様
```typescript
// 新規追加API（型定義済み）
GET    /api/users              - ユーザー一覧取得
POST   /api/users              - ユーザー作成
GET    /api/users/:id          - ユーザー詳細取得
PUT    /api/users/:id          - ユーザー更新
DELETE /api/users/:id          - ユーザー削除
POST   /api/users/search       - ユーザー検索
PUT    /api/users/bulk         - 一括更新
GET    /api/users/export/csv   - CSV出力
GET    /api/users/stats        - 統計情報
GET    /api/users/:id/activity - アクティビティログ
PUT    /api/users/:id/permissions - 権限設定
PUT    /api/users/:id/status   - ステータス変更
```

### 4.3 データフロー
```
[ブラウザ] ↔ [React Components] ↔ [Services Layer] ↔ [Backend API] ↔ [Database]
                    ↓
               [@MARK System]
                    ↓
            [Mock ↔ Real API]
```

## 5. Implementation Blueprint（実装設計図）

### 5.1 Phase 1: バックエンド基盤（Backend Foundation）
#### 5.1.1 Feature-based Architecture
```
backend/src/features/users/
├── user.controller.ts      # RESTfulコントローラー
├── user.service.ts         # ビジネスロジック
├── user.middleware.ts      # 認証・認可ミドルウェア
├── user.routes.ts          # ルート定義
└── user.validator.ts       # 入力検証
```

#### 5.1.2 データベース操作
- PostgreSQL with typed queries
- ページネーション対応
- 全文検索機能
- インデックス最適化

#### 5.1.3 セキュリティ実装
- RBAC権限チェック
- 入力サニタイゼーション
- SQL injection prevention
- 監査ログ記録

### 5.2 Phase 2A: フロントエンド UI（Mock Implementation）
#### 5.2.1 コンポーネント設計
```
frontend/src/pages/admin/UserManagementPage.tsx
frontend/src/components/user/
├── UserTable.tsx           # ユーザー一覧テーブル
├── UserSearchBar.tsx       # 検索・フィルター
├── UserModal.tsx           # 作成・編集モーダル
├── UserStatsCards.tsx      # 統計カード
├── UserActivityLog.tsx     # アクティビティログ
├── UserPermissionsPanel.tsx # 権限設定パネル
└── UserBulkActions.tsx     # 一括操作
```

#### 5.2.2 モック実装（@MARK使用）
```typescript
// @MOCK_TO_API: Phase 2Bで実APIに置き換え
const mockUserService = {
  getUsers: () => mockUserData,
  createUser: (data) => mockCreateResponse,
  updateUser: (id, data) => mockUpdateResponse,
  deleteUser: (id) => mockDeleteResponse
};
```

#### 5.2.3 状態管理
- React Context + useReducer
- ページネーション状態
- 検索・フィルター状態
- 選択状態（一括操作用）

### 5.3 Phase 2B: API統合（Real API Integration）
#### 5.3.1 実APIサービス実装
```typescript
export class ApiUserService {
  async getUsers(params: UserSearchRequest): Promise<UserSearchResponse>
  async createUser(data: UserCreate): Promise<User>
  async updateUser(id: ID, data: UserUpdate): Promise<User>
  async deleteUser(id: ID): Promise<void>
  async getUserStats(): Promise<UserStatsResponse>
  // ... その他のメソッド
}
```

#### 5.3.2 エラーハンドリング
- ネットワークエラー処理
- バリデーションエラー表示
- 権限エラー処理
- 楽観的更新 + ロールバック

### 5.4 Phase 3: 統合テスト（Integration Testing）
#### 5.3.1 テストシナリオ
1. **権限テスト**: 各ロールでのアクセス制御確認
2. **CRUD操作テスト**: 全ての作成・更新・削除操作
3. **検索性能テスト**: 大量データでの検索レスポンス
4. **一括操作テスト**: 複数ユーザーの同時更新
5. **エラーハンドリングテスト**: 異常系シナリオ

#### 5.3.2 UX検証
- ローディング状態表示
- エラーメッセージ表示
- 成功フィードバック
- レスポンシブデザイン

## 6. Validation Loop（検証ループ）

### 6.1 段階的検証
1. **Phase 1検証**: バックエンドAPI単体テスト
2. **Phase 2A検証**: UIコンポーネント動作確認（モック）
3. **Phase 2B検証**: フロントエンド↔バックエンド統合
4. **Phase 3検証**: E2Eテスト・UX検証

### 6.2 品質ゲート
- TypeScript型チェック通過
- ESLint/Prettier適用
- セキュリティスキャン通過
- パフォーマンステスト通過（<200ms API応答）

### 6.3 レビューポイント
- **コード品質**: 保守性・可読性
- **セキュリティ**: 認証・認可・入力検証
- **パフォーマンス**: レスポンス時間・メモリ使用量
- **UX**: 操作性・直感性

## 7. Completion Criteria（完了基準）

### 7.1 機能要件
- ✅ 全13機能の実装完了
- ✅ モック→実API完全切り替え動作
- ✅ 権限制御の適切な動作
- ✅ エラーハンドリングの完全性

### 7.2 品質要件
- ✅ TypeScript型安全性100%
- ✅ セキュリティテスト通過
- ✅ パフォーマンステスト通過
- ✅ アクセシビリティ基準準拠

### 7.3 運用要件
- ✅ 統合テストページ作成
- ✅ エラーシナリオテスト通過
- ✅ モック/API切り替えテスト通過
- ✅ SCOPE_PROGRESS.md更新

### 7.4 完了判定
**P-010ユーザー管理ページが以下の状態で完了とする：**
1. 全機能がモック・実API両方で動作
2. 上位権限ユーザーが効率的にユーザー管理できる
3. セキュリティ・パフォーマンス要件を満たす
4. 統合テストで全シナリオ通過

---

**🔥 重要**: この実装計画書は、P-001で確立された@MARKシステムと型同期ルールに完全準拠しています。段階的実装により、リスクを最小化しながら確実に機能を実現します。

**実装開始準備完了** - Phase 1バックエンド実装から開始可能です。