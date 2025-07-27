# 顧客管理ツール 要件定義書

## 1. プロジェクト概要

### 1.1 プロジェクト名
顧客管理ツール（Customer Relationship Management System）

### 1.2 プロジェクトの目的
Gmail連携機能とAI支援を活用した、企業向け総合顧客管理システムの構築。メール管理、TODO自動抽出、商材管理、契約管理を統合したワンストップソリューションを提供する。

### 1.3 主要な価値提案
- **Gmail連携**: 顧客とのメールコミュニケーションを自動的に顧客情報と紐付け
- **AI TODO抽出**: メール内容からアクションアイテムを自動識別・提案
- **統合管理**: 顧客情報、契約、提案、商材をワンストップで管理
- **自動化**: 定期的なフォローアップや更新リマインダーの自動化

## 2. 機能要件

### 2.1 認証・ユーザー管理機能
- **基本認証**
  - メールアドレス・パスワードによるログイン
  - ユーザー登録（新規アカウント作成）
  - パスワードリセット機能
  
- **Google認証連携**
  - Google OAuth2による認証
  - Gmail API アクセス許可の管理
  - リフレッシュトークンによる継続的なアクセス

- **ユーザー管理**（システム管理者向け）
  - ユーザー一覧表示・編集
  - 権限管理（管理者・一般ユーザー）
  - アクティブセッション管理

### 2.2 ページ構成と画面設計

#### 2.2.1 公開ページ（認証不要）
- **P-001: ログインページ** (`login.html`)
  - メールアドレス・パスワード入力
  - Googleログインボタン
  - 新規登録リンク

#### 2.2.2 メインアプリケーション（要認証）
- **P-002: 企業管理ページ** (`company-management.html`)
  - 企業一覧・検索・フィルタリング
  - 企業詳細情報の表示・編集
  - 担当者情報管理
  - 企業ステータス管理（見込み客・アクティブ・非アクティブ）

- **P-003: Gmailログページ** (`gmail-log.html`)
  - 顧客別メール履歴表示
  - メールスレッド管理
  - 添付ファイル管理
  - メール検索・フィルタリング

- **P-004: システムダッシュボード** (`system-dashboard.html`)
  - システム全体の稼働状況
  - パフォーマンス指標
  - アラート・通知管理
  - ユーザー管理機能

- **P-005: TODOマネジメント** (`todo-management.html`)
  - TODO一覧・管理
  - AI抽出TODO承認機能
  - 優先度・期限管理
  - 進捗トラッキング

- **P-006: 商品管理ページ** (`product-management.html`)
  - 商材マスタ管理
  - 企業別導入状況
  - 分析・レポート機能

- **P-007: データインポート・マッピング** (`data-import-mapping.html`)
  - CSVファイルからの顧客データインポート
  - フィールドマッピング設定
  - インポート結果確認

- **P-008: 企業別契約管理** (`contract-management.html`)
  - 契約一覧・詳細管理
  - 更新期限管理
  - 契約ステータス追跡

- **P-009: 提案管理** (`proposal-management.html`)
  - 提案作成・管理
  - 提案ステータス追跡
  - 承認フロー管理

- **P-010: ユーザー管理** (`user-management.html`)
  - システムユーザー管理
  - 権限設定
  - アクセス履歴

- **P-011: Gmail設定** (`gmail-settings.html`)
  - Gmail同期設定
  - API接続管理
  - 同期間隔設定

- **P-012: TODO抽出確認** (`todo-extraction.html`)
  - AI抽出結果の確認・承認
  - 抽出精度の調整
  - 学習データ管理

- **P-013: 商材マスタ管理** (`product-master.html`)
  - 商材情報の登録・編集
  - 価格・仕様管理
  - カテゴリ管理

### 2.3 ルーティング設計
- **公開ルート**: `/login`, `/register`
- **認証保護ルート**: `/dashboard/*`
- **管理者限定ルート**: `/admin/*`

### 2.4 Gmail連携機能
- **メール同期**
  - 定期的なメール取得（設定可能間隔）
  - 顧客メールアドレスとの自動マッピング
  - スレッド管理による会話履歴の保持
  
- **添付ファイル管理**
  - 添付ファイルの自動ダウンロード・保存
  - ファイル種別による分類
  - OCR/PDF抽出によるテキスト化

- **メール分析**
  - 送信者・受信者の自動識別
  - 重要度・緊急度の自動判定
  - 感情分析による顧客満足度推定

### 2.5 レイアウト設計
- **PublicLayout**: ヘッダーのみのシンプルレイアウト（ログイン・登録画面用）
- **UserLayout**: ヘッダー + サイドバー（一般ユーザー用）
- **AdminLayout**: ヘッダー + 管理メニュー付きサイドバー（管理者用）

### 2.6 AI TODO抽出機能
- **自動抽出**
  - メール内容からアクションアイテムを識別
  - 期限・優先度の自動推定
  - 担当者の自動割り当て

- **承認フロー**
  - AI抽出結果の人間による確認・承認
  - 編集・修正機能
  - 学習フィードバック機能

- **精度向上**
  - ユーザーフィードバックによる学習
  - ドメイン固有キーワードの学習
  - 抽出パターンの継続的改善

### 2.7 商材・契約管理機能
- **商材マスタ管理**
  - 商材情報の登録・編集・削除
  - 価格・仕様・カテゴリ管理
  - カスタム属性の設定

- **企業別導入状況管理**
  - 商材ごとの導入企業管理
  - 導入ステータス追跡（未提案・検討中・導入済み）
  - 更新期限管理

- **契約管理**
  - 契約情報の詳細管理
  - 自動更新設定
  - 契約変更履歴追跡

### 2.8 システム管理機能
- **ダッシュボード**
  - システム稼働状況の可視化
  - パフォーマンス指標の監視
  - アラート・通知の一元管理

- **ログ管理**
  - システムログの閲覧・検索
  - エラーログの追跡
  - ユーザーアクション履歴

- **バックアップ・復元**
  - 自動バックアップ機能
  - 手動バックアップ実行
  - データ復元機能

## 3. 非機能要件

### 3.1 パフォーマンス要件
- **レスポンス時間**: 一般的な操作で2秒以内
- **Gmail同期**: 大量メール処理時も安定した動作
- **同時接続**: 最大50ユーザーの同時利用をサポート

### 3.2 セキュリティ要件
- **認証**: OAuth2 + JWT による安全な認証
- **データ暗号化**: 機密データの暗号化保存
- **アクセス制御**: ロールベースのアクセス管理
- **Gmail API**: 必要最小限の権限でのAPI利用

### 3.3 可用性要件
- **稼働率**: 99%以上（計画メンテナンス除く）
- **バックアップ**: 日次自動バックアップ
- **災害復旧**: データ損失時の復旧手順整備

### 3.4 拡張性要件
- **ユーザー数**: 100ユーザーまでの拡張を想定
- **データ量**: 大量メールデータの効率的な処理
- **機能追加**: モジュール単位での機能拡張

## 4. 技術要件

### 4.1 開発技術スタック
- **フロントエンド**: React + TypeScript
- **バックエンド**: Node.js + Express + TypeScript
- **データベース**: PostgreSQL または MongoDB
- **認証**: Passport.js + JWT
- **Gmail API**: Google APIs Client Library

### 4.2 型定義管理
- **統合型定義**: フロントエンド・バックエンド共通の型定義
- **APIパス管理**: 一元化されたAPIパス定義
- **同期ルール**: 型定義ファイルの同期維持

### 4.3 開発環境
- **コード管理**: Git による版本管理
- **CI/CD**: 自動テスト・デプロイメント
- **開発ツール**: VSCode + 各種拡張機能

## 5. データモデル要件

### 5.1 主要エンティティ
- **User**: システムユーザー情報
- **Customer**: 顧客情報（旧式）
- **Company**: 企業情報（新CRM）
- **Contact**: 企業担当者情報
- **EmailMessage**: Gmail メッセージ
- **Todo**: TODO項目（手動・AI抽出）
- **Contract**: 契約情報
- **Proposal**: 提案情報
- **Product**: 商材マスタ

### 5.2 関係性
- User → 複数の Customer/Company （担当者関係）
- Company → 複数の Contact （企業-担当者）
- Company → 複数の Contract （企業-契約）
- EmailMessage → Customer/Company （メール-顧客紐付け）
- Todo → Customer/Company （TODO-顧客紐付け）

## 6. ディレクトリ構造設計

### 6.1 機能中心設計思想
技術的な層（controllers, services）ではなく、ビジネス機能（auth, companies, todos）でディレクトリを分割し、非技術者にも理解しやすい構造を採用。

### 6.2 バックエンド構造
```
backend/
├── src/
│   ├── common/                    # 全機能で共有する共通コード
│   │   ├── middlewares/           # 共通ミドルウェア（認証、ログ等）
│   │   ├── utils/                 # ユーティリティ関数
│   │   ├── validators/            # 共通バリデーター
│   │   └── database/              # DB接続・設定
│   │
│   ├── features/                  # 機能ごとにグループ化
│   │   ├── auth/                  # 認証機能
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.types.ts      # 機能固有の追加型
│   │   │
│   │   ├── companies/             # 企業管理機能
│   │   │   ├── companies.controller.ts
│   │   │   ├── companies.service.ts
│   │   │   ├── companies.routes.ts
│   │   │   └── companies.types.ts
│   │   │
│   │   ├── gmail/                 # Gmail連携機能
│   │   │   ├── gmail.controller.ts
│   │   │   ├── gmail.service.ts
│   │   │   ├── gmail.routes.ts
│   │   │   └── sync.scheduler.ts  # 定期同期処理
│   │   │
│   │   ├── todos/                 # TODO管理機能
│   │   │   ├── todos.controller.ts
│   │   │   ├── todos.service.ts
│   │   │   ├── todos.routes.ts
│   │   │   └── ai-extractor.ts    # AI抽出エンジン
│   │   │
│   │   ├── products/              # 商材管理機能
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── products.routes.ts
│   │   │   └── analytics.service.ts
│   │   │
│   │   ├── contracts/             # 契約管理機能
│   │   │   ├── contracts.controller.ts
│   │   │   ├── contracts.service.ts
│   │   │   └── contracts.routes.ts
│   │   │
│   │   ├── proposals/             # 提案管理機能
│   │   │   ├── proposals.controller.ts
│   │   │   ├── proposals.service.ts
│   │   │   └── proposals.routes.ts
│   │   │
│   │   └── system/                # システム管理機能
│   │       ├── system.controller.ts
│   │       ├── monitoring.service.ts
│   │       ├── backup.service.ts
│   │       └── system.routes.ts
│   │
│   ├── types/                     # フロントエンドと同期する型定義
│   │   ├── index.ts               # メイン型定義とAPIパス
│   │   ├── enhanced.ts            # 高度なCRM機能型定義
│   │   └── crm.ts                 # 企業・契約・提案管理型定義
│   │
│   ├── config/                    # アプリケーション設定
│   │   ├── database.ts
│   │   ├── gmail.ts
│   │   └── environment.ts
│   │
│   ├── migrations/                # データベースマイグレーション
│   └── app.ts                     # アプリケーションエントリーポイント
```

### 6.3 フロントエンド構造
モックデータで完全動作するUIを構築し、後からAPIエンドポイントに差し替える前提の構造：

```
frontend/
├── src/
│   ├── types/                     # バックエンドと同期する型定義
│   │   ├── index.ts               # APIパスと型定義（単一の真実源）
│   │   ├── enhanced.ts            # 高度なCRM機能型定義
│   │   └── crm.ts                 # 企業・契約・提案管理型定義
│   │
│   ├── layouts/                   # 共通レイアウト
│   │   ├── PublicLayout.tsx       # 公開ページ用（ヘッダーのみ）
│   │   ├── UserLayout.tsx         # ユーザー用（ヘッダー＋サイドバー）
│   │   └── AdminLayout.tsx        # 管理者用（管理メニュー付き）
│   │
│   ├── pages/                     # ページコンポーネント
│   │   ├── public/                # 公開ページ
│   │   │   ├── LoginPage.tsx      # P-001
│   │   │   └── RegisterPage.tsx   # 新規登録
│   │   ├── user/                  # ユーザーページ（要認証）
│   │   │   ├── CompanyManagementPage.tsx    # P-002
│   │   │   ├── GmailLogPage.tsx             # P-003
│   │   │   ├── TodoManagementPage.tsx       # P-005
│   │   │   ├── ProductManagementPage.tsx    # P-006
│   │   │   ├── DataImportPage.tsx           # P-007
│   │   │   ├── ContractManagementPage.tsx   # P-008
│   │   │   ├── ProposalManagementPage.tsx   # P-009
│   │   │   ├── GmailSettingsPage.tsx        # P-011
│   │   │   ├── TodoExtractionPage.tsx       # P-012
│   │   │   └── ProductMasterPage.tsx        # P-013
│   │   └── admin/                 # 管理者ページ（要管理者権限）
│   │       ├── SystemDashboardPage.tsx      # P-004
│   │       └── UserManagementPage.tsx       # P-010
│   │
│   ├── components/                # 再利用可能なコンポーネント
│   │   ├── common/                # 汎用UI部品
│   │   │   ├── Button/
│   │   │   ├── Table/
│   │   │   ├── Form/
│   │   │   ├── Modal/
│   │   │   └── Charts/
│   │   └── features/              # 機能別コンポーネント
│   │       ├── auth/              # 認証関連（LoginForm等）
│   │       ├── companies/         # 企業管理関連
│   │       ├── gmail/             # Gmail連携関連
│   │       ├── todos/             # TODO管理関連
│   │       ├── products/          # 商材管理関連
│   │       └── system/            # システム管理関連
│   │
│   ├── services/                  # API接続層（差し替えの中心）
│   │   ├── api/                   # 実API接続実装
│   │   │   ├── client.ts          # APIクライアント基盤
│   │   │   ├── auth.api.ts
│   │   │   ├── companies.api.ts
│   │   │   ├── gmail.api.ts
│   │   │   ├── todos.api.ts
│   │   │   ├── products.api.ts
│   │   │   └── system.api.ts
│   │   ├── mock/                  # モックデータ・ロジック
│   │   │   ├── data.ts            # モックデータ定義
│   │   │   ├── auth.mock.ts
│   │   │   ├── companies.mock.ts
│   │   │   ├── gmail.mock.ts
│   │   │   ├── todos.mock.ts
│   │   │   ├── products.mock.ts
│   │   │   └── system.mock.ts
│   │   └── index.ts               # 統合層（自動フォールバック）
│   │
│   ├── hooks/                     # カスタムフック
│   │   ├── useApi.ts              # API呼び出し汎用フック
│   │   ├── useAuth.ts             # 認証状態管理
│   │   ├── useCompanies.ts        # 企業管理フック
│   │   ├── useGmail.ts            # Gmail連携フック
│   │   ├── useTodos.ts            # TODO管理フック
│   │   └── useProducts.ts         # 商材管理フック
│   │
│   ├── contexts/                  # グローバル状態管理
│   │   ├── AuthContext.tsx        # 認証コンテキスト
│   │   ├── ThemeContext.tsx       # テーマ設定
│   │   └── NotificationContext.tsx # 通知管理
│   │
│   ├── routes/                    # ルーティング設定
│   │   ├── index.tsx              # メインルーター
│   │   ├── ProtectedRoute.tsx     # 認証ガード
│   │   └── AdminRoute.tsx         # 管理者ガード
│   │
│   └── utils/                     # ユーティリティ
│       ├── mockIndicator.ts       # モック使用状態の表示制御
│       ├── dateUtils.ts           # 日付ユーティリティ
│       └── validation.ts          # バリデーション関数
```

### 6.4 重要な設計ポイント

#### 6.4.1 モック→実API切り替え機能
- `services/index.ts`がモック/実APIの切り替えを一元管理
- 各ページは`services`を使うだけで、モック/実APIを意識しない
- モック使用時は画面に小さくインジケーター表示
- バックエンドAPIが完成次第、`services/index.ts`の切り替えロジックだけで順次実APIに移行

#### 6.4.2 型定義同期システム
- `backend/src/types/index.ts`と`frontend/src/types/index.ts`は完全同期
- APIパスも型定義ファイルで一元管理
- コード内でAPIパスをハードコードすることを禁止

#### 6.4.3 機能中心アーキテクチャ
- 技術的な層ではなく、ビジネス機能で分割
- 各機能ディレクトリは自己完結的な構造
- 非技術者にも理解しやすい命名規則

## 6.5 ディレクトリ構造設計

### 6.5.1 バックエンド構造
```
backend/
├── src/
│   ├── common/            # 全機能で共有する共通コード
│   │   ├── middlewares/   # 共通ミドルウェア
│   │   ├── utils/         # ユーティリティ
│   │   └── validators/    # 共通バリデーター
│   │
│   ├── features/          # 機能ごとにグループ化
│   │   ├── auth/          # 認証機能
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.types.ts  # 機能固有の追加型
│   │   │
│   │   ├── users/         # ユーザー管理機能
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.routes.ts
│   │   │   └── users.types.ts
│   │   │
│   │   ├── companies/     # 企業管理機能
│   │   │   ├── companies.controller.ts
│   │   │   ├── companies.service.ts
│   │   │   ├── companies.routes.ts
│   │   │   └── companies.types.ts
│   │   │
│   │   ├── gmail/         # Gmail連携機能
│   │   │   ├── gmail.controller.ts
│   │   │   ├── gmail.service.ts
│   │   │   ├── gmail.routes.ts
│   │   │   └── gmail.types.ts
│   │   │
│   │   ├── todos/         # TODO管理機能
│   │   │   ├── todos.controller.ts
│   │   │   ├── todos.service.ts
│   │   │   ├── todos.routes.ts
│   │   │   └── todos.types.ts
│   │   │
│   │   ├── products/      # 商材管理機能
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── products.routes.ts
│   │   │   └── products.types.ts
│   │   │
│   │   ├── contracts/     # 契約管理機能
│   │   │   ├── contracts.controller.ts
│   │   │   ├── contracts.service.ts
│   │   │   ├── contracts.routes.ts
│   │   │   └── contracts.types.ts
│   │   │
│   │   ├── proposals/     # 提案管理機能
│   │   │   ├── proposals.controller.ts
│   │   │   ├── proposals.service.ts
│   │   │   ├── proposals.routes.ts
│   │   │   └── proposals.types.ts
│   │   │
│   │   └── system/        # システム管理機能
│   │       ├── system.controller.ts
│   │       ├── system.service.ts
│   │       ├── system.routes.ts
│   │       └── system.types.ts
│   │
│   ├── types/             # フロントエンドと同期する型定義
│   │   └── index.ts       # バックエンド用型定義とAPIパス
│   │
│   ├── config/           # アプリケーション設定
│   ├── db/               # データベース関連
│   └── app.ts            # アプリケーションエントリーポイント
```

### 6.5.2 フロントエンド構造

モックデータで完全動作するUIを構築し、後からAPIエンドポイントに差し替える前提の構造：

```
frontend/
├── src/
│   ├── types/             # バックエンドと同期する型定義
│   │   └── index.ts       # APIパスと型定義（単一の真実源）
│   │
│   ├── layouts/           # 共通レイアウト（要件定義書2.5に対応）
│   │   ├── PublicLayout.tsx    # 公開ページ用（ヘッダーのみ）
│   │   ├── UserLayout.tsx      # ユーザー用（ヘッダー＋サイドバー）
│   │   └── AdminLayout.tsx     # 管理者用（管理メニュー付き）
│   │
│   ├── pages/             # ページコンポーネント（要件定義書2.2に対応）
│   │   ├── public/        # 公開ページ
│   │   │   ├── LoginPage.tsx        # P-001
│   │   │   └── RegisterPage.tsx     # P-002
│   │   ├── user/          # ユーザーページ（要認証）
│   │   │   ├── DashboardPage.tsx    # U-001
│   │   │   ├── CompanyManagementPage.tsx  # P-002
│   │   │   ├── GmailLogPage.tsx     # P-003
│   │   │   ├── TodoManagementPage.tsx # P-005
│   │   │   ├── ProductManagementPage.tsx # P-006
│   │   │   ├── ContractManagementPage.tsx # P-008
│   │   │   ├── ProposalManagementPage.tsx # P-009
│   │   │   ├── DataImportPage.tsx   # P-007
│   │   │   ├── GmailSettingsPage.tsx # P-011
│   │   │   ├── TodoExtractionPage.tsx # P-012
│   │   │   └── ProductMasterPage.tsx # P-013
│   │   └── admin/         # 管理者ページ（要管理者権限）
│   │       ├── AdminDashboard.tsx   # P-004
│   │       └── UserManagementPage.tsx # P-010
│   │
│   ├── components/        # 再利用可能なコンポーネント
│   │   ├── common/        # 汎用UI部品（Button, Table, Form等）
│   │   │   ├── Button.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Form.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── Loading.tsx
│   │   └── features/      # 機能別コンポーネント
│   │       ├── auth/      # 認証関連（LoginForm等）
│   │       │   ├── LoginForm.tsx
│   │       │   └── RegisterForm.tsx
│   │       ├── companies/ # 企業関連
│   │       │   ├── CompanyCard.tsx
│   │       │   ├── CompanyForm.tsx
│   │       │   └── CompanyList.tsx
│   │       ├── gmail/     # Gmail関連
│   │       │   ├── EmailThread.tsx
│   │       │   ├── EmailMessage.tsx
│   │       │   └── GmailSettings.tsx
│   │       ├── todos/     # TODO関連
│   │       │   ├── TodoCard.tsx
│   │       │   ├── TodoForm.tsx
│   │       │   └── TodoList.tsx
│   │       ├── products/  # 商材関連
│   │       │   ├── ProductCard.tsx
│   │       │   ├── ProductForm.tsx
│   │       │   └── ProductList.tsx
│   │       ├── contracts/ # 契約関連
│   │       │   ├── ContractCard.tsx
│   │       │   ├── ContractForm.tsx
│   │       │   └── ContractList.tsx
│   │       └── proposals/ # 提案関連
│   │           ├── ProposalCard.tsx
│   │           ├── ProposalForm.tsx
│   │           └── ProposalList.tsx
│   │
│   ├── services/          # API接続層（差し替えの中心）
│   │   ├── api/           # 実API接続実装
│   │   │   ├── client.ts  # APIクライアント基盤
│   │   │   ├── auth.ts    # 認証API
│   │   │   ├── companies.ts # 企業API
│   │   │   ├── gmail.ts   # Gmail API
│   │   │   ├── todos.ts   # TODO API
│   │   │   ├── products.ts # 商材API
│   │   │   ├── contracts.ts # 契約API
│   │   │   └── proposals.ts # 提案API
│   │   ├── mock/          # モックデータ・ロジック
│   │   │   ├── data.ts    # モックデータ定義
│   │   │   ├── auth.ts    # 認証モック
│   │   │   ├── companies.ts # 企業モック
│   │   │   ├── gmail.ts   # Gmailモック
│   │   │   ├── todos.ts   # TODOモック
│   │   │   ├── products.ts # 商材モック
│   │   │   ├── contracts.ts # 契約モック
│   │   │   └── proposals.ts # 提案モック
│   │   └── index.ts       # 統合層（自動フォールバック）
│   │
│   ├── hooks/             # カスタムフック
│   │   ├── useApi.ts      # API呼び出し汎用フック
│   │   ├── useAuth.ts     # 認証状態管理
│   │   ├── useCompanies.ts # 企業データ管理
│   │   ├── useGmail.ts    # Gmail関連
│   │   ├── useTodos.ts    # TODO管理
│   │   ├── useProducts.ts # 商材管理
│   │   ├── useContracts.ts # 契約管理
│   │   └── useProposals.ts # 提案管理
│   │
│   ├── contexts/          # グローバル状態管理
│   │   ├── AuthContext.tsx # 認証コンテキスト
│   │   ├── ThemeContext.tsx # テーマコンテキスト
│   │   └── NotificationContext.tsx # 通知コンテキスト
│   │
│   ├── routes/            # ルーティング設定（要件定義書2.3に対応）
│   │   ├── index.tsx      # メインルーター
│   │   └── ProtectedRoute.tsx # 認証ガード
│   │
│   └── utils/             # ユーティリティ
│       ├── mockIndicator.ts # モック使用状態の表示制御
│       ├── validation.ts  # バリデーション
│       ├── formatting.ts  # フォーマット関数
│       └── constants.ts   # 定数定義
```

### 6.5.3 重要な設計ポイント

1. **pages/内のファイル名にページIDをコメントで明記**
   - 要件定義書のページIDと対応関係を明確化

2. **services/がモック→実APIの切り替えを一元管理**
   - 各ページはserviceを使うだけで、モック/実APIを意識しない
   - services/index.tsの切り替えロジックで制御

3. **モック使用時は画面に小さくインジケーター表示**
   - 開発者がモード状態を常に把握できる

4. **機能別コンポーネントの一貫した命名**
   - [機能名]Card.tsx: 一覧表示用カード
   - [機能名]Form.tsx: 作成・編集フォーム
   - [機能名]List.tsx: リスト表示コンポーネント

この構造により、モックで完全に動作するフロントエンドを作成し、バックエンドAPIが完成次第、services/index.tsの切り替えロジックだけで順次実APIに移行できます。

## 7. 開発計画とマイルストーン

### 7.1 フェーズ1: 基盤構築（4週間）
- 認証システム実装
- 基本的なユーザー管理
- Gmail API連携基盤
- 基本的なフロントエンド構造

### 7.2 フェーズ2: コア機能実装（6週間）
- 企業・顧客管理機能
- Gmail同期機能
- 基本的なTODO管理
- データインポート機能

### 7.3 フェーズ3: AI機能・高度な機能（4週間）
- AI TODO抽出機能
- 商材・契約管理
- 提案管理機能
- システム監視・管理

### 7.4 フェーズ4: 最適化・運用準備（2週間）
- パフォーマンス最適化
- セキュリティ強化
- バックアップ・復旧機能
- 運用ドキュメント整備

## 8. 品質保証

### 8.1 テスト戦略
- **単体テスト**: 各機能モジュールの個別テスト
- **統合テスト**: Gmail API連携等の外部システム連携テスト
- **E2Eテスト**: 主要なユーザーフローのエンドツーエンドテスト
- **セキュリティテスト**: 認証・認可のセキュリティテスト

### 8.2 品質基準
- **コードカバレッジ**: 80%以上
- **パフォーマンス**: 主要機能で2秒以内のレスポンス
- **セキュリティ**: OWASP Top 10への対策実施
- **アクセシビリティ**: WCAG 2.1 AA準拠

## 9. 運用・保守

### 9.1 監視・ログ
- **アプリケーションログ**: エラー・警告・情報ログの記録
- **アクセスログ**: ユーザーアクション履歴の記録
- **パフォーマンス監視**: レスポンス時間・リソース使用量の監視
- **Gmail API監視**: API使用量・エラー率の監視

### 9.2 バックアップ・復旧
- **定期バックアップ**: 日次自動バックアップ
- **差分バックアップ**: 重要データの増分バックアップ
- **復旧手順**: データ損失時の復旧プロセス
- **テスト復旧**: 定期的な復旧テスト実施

### 9.3 更新・拡張
- **機能追加**: モジュール単位での機能追加対応
- **データマイグレーション**: スキーマ変更時のデータ移行
- **バージョン管理**: 段階的なアップデート対応
- **ロールバック**: 問題発生時の前バージョン復帰

## 10. リスク管理

### 10.1 技術リスク
- **Gmail API制限**: API使用量制限への対策
- **データ量増大**: 大量メールデータ処理の性能影響
- **外部依存**: Google サービス停止時の影響
- **セキュリティ**: 機密データ漏洩リスク

### 10.2 対策・緩和策
- **API制限対策**: バッチ処理・レート制限対応
- **性能対策**: データベース最適化・インデックス設計
- **冗長性**: 重要機能の代替手段確保
- **セキュリティ対策**: 暗号化・アクセス制御・監査ログ

## 11. SCOPE_PROGRESS - 開発進捗管理

### 11.1 Phase 1: 基盤設計・データモデル設計 ✅
- [x] **要件定義書作成**: 機能要件・非機能要件の完全定義
- [x] **データモデル設計**: 10エンティティの統合設計完了
  - User, Company, Contact, EmailThread, EmailMessage
  - Todo, Product, Deployment, Contract, Proposal
- [x] **型定義同期**: フロントエンド・バックエンド型定義ファイル作成
- [x] **認証システム設計**: 新データモデル対応済み
- [x] **アーキテクチャ設計**: 機能中心ディレクトリ構造設計

### 11.2 Phase 2: 認証システム実装 🔄 (予定)
- [ ] **JWT認証基盤**: JWT・リフレッシュトークン実装
- [ ] **Google OAuth2連携**: Gmail API認証フロー実装
- [ ] **ユーザー管理**: CRUD・権限管理・セッション管理
- [ ] **認証ミドルウェア**: 権限チェック・ロールベースアクセス制御
- [ ] **セキュリティ対策**: パスワードハッシュ・レート制限・CSRF対策

### 11.3 Phase 3: Gmail連携基盤実装 🔄 (予定)
- [ ] **Gmail API統合**: メール取得・同期機能実装
- [ ] **データ同期**: 定期同期・リアルタイム更新機能
- [ ] **メール管理**: スレッド管理・検索・フィルタリング
- [ ] **添付ファイル**: アップロード・ダウンロード・プレビュー

### 11.4 Phase 4: 企業・顧客管理実装 🔄 (予定)
- [ ] **企業CRUD**: 作成・読取・更新・削除機能
- [ ] **担当者管理**: 権限ベース担当者割り当て
- [ ] **連絡先管理**: 企業関連連絡先のCRUD
- [ ] **検索・フィルタ**: 高度検索・絞り込み機能

### 11.5 Phase 5: AI TODO抽出実装 🔄 (予定)
- [ ] **AI統合**: メール内容解析・TODO抽出
- [ ] **承認フロー**: 抽出結果確認・承認機能
- [ ] **TODO管理**: 優先度・期限・進捗管理
- [ ] **自動化**: 定期実行・通知機能

### 11.6 Phase 6: 商材・契約管理実装 🔄 (予定)
- [ ] **商材管理**: プロダクト・オプション・価格管理
- [ ] **導入状況**: 企業別導入・デプロイメント管理
- [ ] **契約管理**: ライフサイクル・更新・アラート
- [ ] **提案管理**: 作成・送信・フォローアップ

### 11.7 Phase 7: 統合・テスト・デプロイ 🔄 (予定)
- [ ] **統合テスト**: 全機能横断的テスト
- [ ] **パフォーマンステスト**: 負荷テスト・最適化
- [ ] **セキュリティテスト**: 脆弱性検査・侵入テスト
- [ ] **デプロイ**: 本番環境設定・リリース準備

### 11.8 現在の開発状況
**完了**: Phase 1 - 基盤設計・データモデル設計 (100%)
**次回**: Phase 2 - 認証システム実装

**重要な技術決定**:
- TypeScript型定義の完全同期（backend/frontend）
- UserRole enum: ADMIN, MANAGER, USER
- Company中心のデータモデル（旧Customer → Company）
- API_PATHSによるエンドポイント一元管理