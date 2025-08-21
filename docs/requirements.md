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
- **P-001: ログインページ** (`login.html`) → [モックアップ](../mockups/login.html)
  - メールアドレス・パスワード入力
  - Googleログインボタン
  - 新規登録リンク

#### 2.2.2 メインアプリケーション（要認証）
- **P-002: 企業管理ページ** (`company-management.html`) → [モックアップ](../mockups/company-management.html)
  - 企業一覧・検索・フィルタリング
  - 企業詳細情報の表示・編集
  - 担当者情報管理
  - 企業ステータス管理（見込み客・アクティブ・非アクティブ）

- **P-003: Gmailログページ** (`gmail-log.html`)
  - 顧客別メール履歴表示
  - メールスレッド管理
  - 添付ファイル管理
  - メール検索・フィルタリング

- **P-004: システムダッシュボード** (`system-dashboard.html`) → [モックアップ](../mockups/system-dashboard.html)
  - システムヘルス状態の一目把握（正常・注意・異常の色分け）
  - リアルタイムパフォーマンス指標（CPU・メモリ・ディスク・ネットワーク）
  - アラート管理（重要度別表示・個別解決・自動更新）
  - ユーザー統計とアクティビティ可視化
  - システムアクション（診断・キャッシュクリア・ログエクスポート・緊急モード）

- **P-005: TODOマネジメント** (`todo-management.html`) → [モックアップ](../mockups/todo-management.html)
  - カンバンボード形式のTODO管理（未着手・進行中・完了）
  - AI抽出TODO承認セクション（承認・却下・一括承認）
  - ドラッグ&ドロップによるステータス変更
  - 優先度・期限・企業紐付け管理
  - フィルタリング機能（優先度別・企業別）
  - TODO作成・編集モーダル

- **P-006: 商品管理ページ** (`product-management.html`) → [モックアップ](../mockups/product-management.html)
  - 商材×企業導入マトリックス（3状態：未提案・検討中・導入済み）
  - 統計ダッシュボード（総商材数・導入数・売上集計）  
  - 商材サイドバー（価格・導入統計表示）
  - 営業効率化機能（CSV出力・一括提案作成）
  - 商材管理（追加・編集・カテゴリ管理）

- **P-007: データインポート・マッピング** (`data-import-mapping.html`)
  - CSVファイルからの顧客データインポート
  - フィールドマッピング設定
  - インポート結果確認

- **P-008: 企業別契約管理** (`contract-management.html`) → [モックアップ](../mockups/contract-management.html)
  - 企業別契約グループ表示（企業ごとに契約をまとめて表示）
  - 契約ライフサイクル管理（アクティブ・期限間近・期限切れ・更新待ちの4段階）
  - 契約期限タイムライン（7日間カレンダービューでの期限可視化）
  - プログレスバー表示（契約期間の進行状況を視覚的に表示）
  - 契約詳細情報管理（金額・期間・自動更新・担当者・備考）
  - ワンクリック契約更新機能（期限切れ・期限間近契約の迅速更新）
  - 契約検索・フィルタリング（ステータス別・企業別・期間別）
  - 契約レポート出力（PDF・CSV形式での契約状況報告）
  - 更新アラート通知（30日前・7日前・当日の自動通知）

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

## 3. ページ詳細

### 3.1 ログインページ (P-001)
**モックアップ**: [login.html](/mockups/login.html)

**ページ概要**: システムへのセキュアな認証を提供する入口ページ。Gmail連携を最優先とし、シンプルで効率的な認証フローを実現。

**含まれる要素**:
- **Googleログインボタン**: Gmail連携のためのメイン認証手段（視覚的に最優先）
- **メール/パスワード入力**: 代替認証手段（最小限の2フィールド）
- **パスワードリセットリンク**: セルフサービスでのパスワード復旧

**状態と動作**:
- **初期ロード**: メールアドレスフィールドに自動フォーカス、デモ情報の表示
- **Google認証フロー**: OAuth2による外部認証、Gmail権限の自動取得
- **メール認証フロー**: バリデーション付きフォーム送信、エラーハンドリング
- **認証成功**: ユーザー情報に基づく適切なページへのリダイレクト
- **ローディング状態**: 認証処理中のスピナー表示とメッセージ更新

**データとAPI**:
- **AuthUser**: { id: string, email: string, name: string, authProvider: 'google'|'email', gmailConnected: boolean, role: 'admin'|'manager'|'user' }
- **AuthRequest**: { email: string, password: string }
- **AuthResponse**: { user: AuthUser, accessToken: string, refreshToken: string }
- `POST /api/auth/login` → メール/パスワード認証
  - リクエスト: { email, password }
  - 成功: { user, accessToken, refreshToken }
  - エラー: 401 認証失敗, 429 レート制限
- `POST /api/auth/google` → Google OAuth認証
  - リクエスト: { googleToken: string }
  - 成功: { user, accessToken, refreshToken }
  - エラー: 400 不正なトークン
- `POST /api/auth/reset-password` → パスワードリセット
  - リクエスト: { email: string }
  - 成功: { message: "リセット手順を送信しました" }
  - エラー: 404 ユーザーが見つからない

### 3.2 企業管理ページ (P-002)
**モックアップ**: [company-management.html](/mockups/company-management.html)

**ページ概要**: CRMの中核となる企業情報の一元管理ページ。検索優先設計により情報アクセスを高速化し、視覚的なカード形式で企業状態を即座に把握。

**含まれる要素**:
- **統計ダッシュボード**: 総企業数、ステータス別内訳をリアルタイム表示
- **検索バー**: インクリメンタル検索による即座のフィルタリング
- **ステータスフィルター**: ドロップダウンによる絞り込み
- **企業カード**: 企業名、担当者、最終連絡日、ステータスを集約表示
- **アクションボタン**: 編集、メール履歴、TODO、削除を各カードに配置

**状態と動作**:
- **初期ロード**: 全企業をカード形式で表示、統計情報を計算
- **リアルタイム検索**: 入力と同時に企業名・担当者名でフィルタリング
- **ステータス変更**: カード上のステータスボタンクリックで即座に切り替え
- **モーダル編集**: 企業情報の追加・編集はモーダルダイアログで実行
- **削除確認**: 削除前に確認ダイアログを表示

**データとAPI**:
- **Company**: { id: string, name: string, contactName: string, email: string, phone: string, status: 'prospect'|'active'|'inactive', notes: string, lastContact: string, assignedTo: string }
- **CompanyListRequest**: { search?: string, status?: string, page?: number, limit?: number }
- **CompanyListResponse**: { companies: Company[], total: number, stats: { total: number, active: number, prospect: number, inactive: number } }
- `GET /api/companies` → 企業一覧取得
  - リクエスト: { search?, status?, page?, limit? }
  - 成功: { companies, total, stats }
  - エラー: 401 未認証
- `POST /api/companies` → 企業新規作成
  - リクエスト: Company (idなし)
  - 成功: { company: Company }
  - エラー: 400 検証エラー
- `PUT /api/companies/:id` → 企業情報更新
  - リクエスト: Partial<Company>
  - 成功: { company: Company }
  - エラー: 404 企業が見つからない
- `DELETE /api/companies/:id` → 企業削除
  - 成功: { message: "削除しました" }
  - エラー: 404 企業が見つからない

### 3.3 TODOマネジメントページ (P-005)
**モックアップ**: [todo-management.html](/mockups/todo-management.html)

**ページ概要**: AI抽出TODOの承認機能とカンバンボード式のタスク管理を統合。ドラッグ&ドロップによる直感的な操作性と企業紐付けによる顧客管理との連携を実現。

**含まれる要素**:
- **AI抽出TODOセクション**: Gmail等から抽出された未承認TODOの一覧表示
- **承認アクション**: 個別承認・却下ボタンと一括承認機能
- **カンバンボード**: 未着手・進行中・完了の3列構成
- **フィルター機能**: 優先度別・企業別でのTODO絞り込み
- **TODO作成フォーム**: モーダル形式での新規TODO追加・編集

**状態と動作**:
- **初期ロード**: AI抽出TODOの表示、承認待ち件数の更新
- **承認フロー**: AI提案の承認/却下、自動的にカンバンボードの「未着手」へ移動
- **ドラッグ&ドロップ**: カード間でのステータス変更、リアルタイム反映
- **TODO作成**: モーダルでの詳細入力（タイトル・内容・優先度・期限・企業紐付け）
- **期限管理**: 期限切れ・今日期限・今後期限の視覚的な色分け表示

**データとAPI**:
- **Todo**: { id: string, title: string, content: string, priority: 'high'|'medium'|'low', deadline: string, status: 'pending'|'in_progress'|'completed', companyId?: string, companyName?: string, source: 'manual'|'ai', extractedFrom?: string, createdAt: string }
- **AITodo**: Todo & { source: 'ai', extractedFrom: string, approved: boolean }
- **TodoListRequest**: { priorityFilter?: string, companyFilter?: string, status?: string }
- **TodoListResponse**: { todos: Todo[], aiTodos: AITodo[], counts: { pending: number, inProgress: number, completed: number } }
- `GET /api/todos` → TODO一覧取得
  - リクエスト: { priorityFilter?, companyFilter?, status? }
  - 成功: { todos, aiTodos, counts }
  - エラー: 401 未認証
- `POST /api/todos` → TODO新規作成
  - リクエスト: Todo (idなし)
  - 成功: { todo: Todo }
  - エラー: 400 検証エラー
- `PUT /api/todos/:id` → TODO更新（ステータス変更含む）
  - リクエスト: Partial<Todo>
  - 成功: { todo: Todo }
  - エラー: 404 TODOが見つからない
- `PUT /api/todos/:id/approve` → AI抽出TODO承認
  - 成功: { todo: Todo, message: "承認しました" }
  - エラー: 404 TODOが見つからない, 400 既に承認済み
- `DELETE /api/todos/:id` → TODO削除
  - 成功: { message: "削除しました" }
  - エラー: 404 TODOが見つからない

#### 3.2.8 企業別契約管理API (P-008)
- `GET /api/contracts` → 契約一覧取得（企業別グループ化・フィルタリング対応）
  - クエリ: status, companyId, searchTerm, page, limit
  - 成功: { contracts: Contract[], totalCount: number, summary: ContractSummary }
  - エラー: 400 不正なフィルター条件
- `POST /api/contracts` → 新規契約作成
  - リクエスト: CreateContractRequest
  - 成功: { contract: Contract, message: "契約を作成しました" }
  - エラー: 400 バリデーションエラー, 404 企業が見つからない
- `GET /api/contracts/:id` → 契約詳細取得
  - 成功: { contract: Contract }
  - エラー: 404 契約が見つからない
- `PUT /api/contracts/:id` → 契約情報更新
  - リクエスト: Partial<Contract>
  - 成功: { contract: Contract, message: "契約を更新しました" }
  - エラー: 404 契約が見つからない, 400 バリデーションエラー
- `PUT /api/contracts/:id/renew` → 契約更新（期限延長）
  - リクエスト: { renewalPeriod: number }
  - 成功: { contract: Contract, message: "契約を更新しました" }
  - エラー: 404 契約が見つからない, 400 更新不可能なステータス
- `GET /api/contracts/timeline` → 契約期限タイムライン取得
  - クエリ: startDate, endDate, view（week/month）
  - 成功: { timeline: TimelineEvent[] }
  - エラー: 400 不正な日付範囲
- `GET /api/contracts/expiring` → 期限切れ・期限間近契約取得
  - クエリ: days（期限までの日数）
  - 成功: { contracts: Contract[] }
- `GET /api/contracts/export` → 契約レポート出力
  - クエリ: format（pdf/csv）, filters
  - 成功: ファイルダウンロード
  - エラー: 400 サポートされていない形式
- `DELETE /api/contracts/:id` → 契約削除（ソフトデリート）
  - 成功: { message: "契約を削除しました" }
  - エラー: 404 契約が見つからない

## 4. 非機能要件

### 4.1 パフォーマンス要件
- **レスポンス時間**: 一般的な操作で2秒以内
- **Gmail同期**: 大量メール処理時も安定した動作
- **同時接続**: 最大50ユーザーの同時利用をサポート

### 4.2 セキュリティ要件
- **認証**: OAuth2 + JWT による安全な認証
- **データ暗号化**: 機密データの暗号化保存
- **アクセス制御**: ロールベースのアクセス管理
- **Gmail API**: 必要最小限の権限でのAPI利用

### 4.3 可用性要件
- **稼働率**: 99%以上（計画メンテナンス除く）
- **バックアップ**: 日次自動バックアップ
- **災害復旧**: データ損失時の復旧手順整備

### 4.4 拡張性要件
- **ユーザー数**: 100ユーザーまでの拡張を想定
- **データ量**: 大量メールデータの効率的な処理
- **機能追加**: モジュール単位での機能拡張

## 5. 技術要件

### 5.1 開発技術スタック
- **フロントエンド**: React + TypeScript
- **バックエンド**: Node.js + Express + TypeScript
- **データベース**: PostgreSQL または MongoDB
- **認証**: Passport.js + JWT
- **Gmail API**: Google APIs Client Library

### 5.2 型定義管理
- **統合型定義**: フロントエンド・バックエンド共通の型定義
- **APIパス管理**: 一元化されたAPIパス定義
- **同期ルール**: 型定義ファイルの同期維持

### 5.3 開発環境
- **コード管理**: Git による版本管理
- **CI/CD**: 自動テスト・デプロイメント
- **開発ツール**: VSCode + 各種拡張機能

## 6. データモデル要件

### 6.1 主要エンティティ
- **User**: システムユーザー情報
- **Customer**: 顧客情報（旧式）
- **Company**: 企業情報（新CRM）
- **Contact**: 企業担当者情報
- **EmailMessage**: Gmail メッセージ
- **Todo**: TODO項目（手動・AI抽出）
- **Contract**: 契約情報
- **Proposal**: 提案情報
- **Product**: 商材マスタ

### 6.2 関係性
- User → 複数の Customer/Company （担当者関係）
- Company → 複数の Contact （企業-担当者）
- Company → 複数の Contract （企業-契約）
- EmailMessage → Customer/Company （メール-顧客紐付け）
- Todo → Customer/Company （TODO-顧客紐付け）

## 7. ディレクトリ構造設計

### 7.1 機能中心設計思想
技術的な層（controllers, services）ではなく、ビジネス機能（auth, companies, todos）でディレクトリを分割し、非技術者にも理解しやすい構造を採用。

### 7.2 バックエンド構造
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

### 7.3 フロントエンド構造
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

### 7.4 重要な設計ポイント

#### 7.4.1 モック→実API切り替え機能
- `services/index.ts`がモック/実APIの切り替えを一元管理
- 各ページは`services`を使うだけで、モック/実APIを意識しない
- モック使用時は画面に小さくインジケーター表示
- バックエンドAPIが完成次第、`services/index.ts`の切り替えロジックだけで順次実APIに移行

#### 7.4.2 型定義同期システム
- `backend/src/types/index.ts`と`frontend/src/types/index.ts`は完全同期
- APIパスも型定義ファイルで一元管理
- コード内でAPIパスをハードコードすることを禁止

#### 7.4.3 機能中心アーキテクチャ
- 技術的な層ではなく、ビジネス機能で分割
- 各機能ディレクトリは自己完結的な構造
- 非技術者にも理解しやすい命名規則

## 6.5 ディレクトリ構造設計

### 7.5.1 バックエンド構造
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

### 7.5.2 フロントエンド構造

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

### 7.5.3 重要な設計ポイント

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