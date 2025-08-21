# 認証システム設計書

## 1. 概要

このドキュメントでは顧客管理ツールの認証システムの詳細設計を定義します。

## 2. 認証メカニズム

### 2.1 選定方式
* JWT（JSON Web Token）ベースの認証
* リフレッシュトークンによるアクセストークン再発行
* 個人Gmail OAuth2連携（将来機能として共同Gmail対応予定）

### 2.2 選定理由
* ステートレス性によるスケーラビリティ確保
* フロントエンド/バックエンド分離アーキテクチャとの親和性
* Gmail API連携との統合の容易さ
* マイクロサービス間の認証情報共有の容易さ

### 2.3 認証フロー概要
```
ユーザー → メールアドレス・パスワード認証 → JWTトークン発行
ユーザー → Google OAuth2認証 → Gmail API許可 → JWTトークン発行（オプション）
```

## 3. ユーザーロール定義

### 3.1 ロール階層
| ロールID | ロール名 | 説明 | システム権限 |
|---------|---------|-----|-------------|
| COMPANY_LEADER | 企業リーダー | 最上位権限 | 全システム管理・バックアップ |
| MANAGER | マネージャー | 管理職権限 | ユーザー管理・システム設定 |
| TEAM_LEADER | チームリーダー | チーム管理權限 | ユーザー管理のみ |
| USER | 一般ユーザー | 基本権限 | 担当企業・TODO管理のみ |

### 3.2 権限継承関係
* 上位権限者（COMPANY_LEADER, MANAGER, TEAM_LEADER）は下位権限をすべて含む
* 担当者権限：primaryAssigneeIdを持つユーザーは該当リソースの閲覧・編集・削除が可能
* 上位権限者は担当者に関係なく全リソースにアクセス可能

## 4. 認証フロー詳細

### 4.1 登録（サインアップ）フロー
```
1. ユーザーが登録フォームに入力
   ↓
2. バックエンドがユーザー情報を検証・バリデーション
   ↓
3. パスワードをbcryptでハッシュ化（コスト係数12）
   ↓
4. PostgreSQLにユーザー情報を保存
   ↓
5. JWTアクセストークン（15分）・リフレッシュトークン（7日）を生成
   ↓
6. HttpOnly, Secure Cookieにトークンをセット
   ↓
7. ユーザー情報とトークンをレスポンス
```

### 4.2 ログイン（サインイン）フロー
```
1. ユーザーがメールアドレス・パスワードを入力
   ↓
2. バックエンドがユーザー存在確認
   ↓
3. bcryptでパスワード照合
   ↓
4. 認証成功時：JWTトークン生成・Cookie設定
   認証失敗時：失敗回数記録・レート制限チェック
   ↓
5. ユーザー情報・トークン・権限情報をレスポンス
```

### 4.3 Google OAuth2ログインフロー（オプション）
```
1. フロントエンドがGoogle OAuth2認証を開始
   ↓
2. Googleで認証完了後、authorizationCodeを取得
   ↓
3. バックエンドがGoogleからユーザー情報・アクセストークンを取得
   ↓
4. メールアドレスで既存ユーザーをチェック
   ↓
5. 新規ユーザーの場合：自動ユーザー作成（デフォルトUSERロール）
   既存ユーザーの場合：Gmail連携情報を更新
   ↓
6. JWTトークン生成・Cookie設定
   ↓
7. ユーザー情報・トークンをレスポンス
```

### 4.4 パスワードリセットフロー
```
1. ユーザーがメールアドレスを入力
   ↓
2. バックエンドがユーザー存在確認
   ↓
3. パスワードリセット用の一時トークン生成（30分有効）
   ↓
4. メール送信（リセットリンク付き）
   ↓
5. ユーザーがリンクをクリック・新パスワード入力
   ↓
6. トークン検証・新パスワードのハッシュ化・保存
   ↓
7. パスワード変更完了通知
```

### 4.5 トークン更新フロー
```
1. アクセストークンの有効期限切れを検知
   ↓
2. フロントエンドが自動的にリフレッシュトークンを送信
   ↓
3. バックエンドがリフレッシュトークンを検証
   ↓
4. 有効な場合：新しいアクセストークン・リフレッシュトークンを生成
   無効な場合：401エラー・ログアウト処理
   ↓
5. 新トークンをCookieに設定・レスポンス
```

### 4.6 ログアウトプロセス
```
1. ユーザーがログアウトボタンをクリック
   ↓
2. フロントエンドがログアウトAPIを呼び出し
   ↓
3. バックエンドがリフレッシュトークンを無効化
   ↓
4. HttpOnly CookieからToken情報をクリア
   ↓
5. フロントエンドの認証状態をリセット
   ↓
6. ログインページにリダイレクト
```

## 5. Gmail連携アーキテクチャ（将来機能）

### 5.1 個人Gmail連携設計
```typescript
interface GmailConnection {
  userId: string;
  gmailEmail: string;
  accessToken: string;  // 暗号化保存
  refreshToken: string; // 暗号化保存
  tokenExpiry: Date;
  isConnected: boolean;
}
```

### 5.2 Gmail API統合方針
* **個人メール**: ユーザー個別のGoogleアカウント連携のみ
* **将来拡張**: 共同メールアカウント機能は後期実装予定
* **権限チェック**: 個人Gmail連携の有無による機能制限

## 6. セキュリティ対策

### 6.1 パスワード管理
* **ハッシュアルゴリズム**: bcrypt (コスト係数 12)
* **パスワードポリシー**: 最低8文字、英数字・特殊文字混在必須
* **履歴管理**: 過去5回のパスワード再利用禁止

### 6.2 トークン管理
* **アクセストークン有効期限**: 15分
* **リフレッシュトークン有効期限**: 7日
* **Gmail APIトークン**: 暗号化してデータベース保存
* **トークン保存**: HttpOnly, Secure Cookieでの保存

### 6.3 API保護対策
* **CSRF対策**: Double Submit Cookie Pattern
* **レート制限**: 同一IPからの試行を10回/分に制限
* **ブルートフォース対策**: 連続5回失敗で15分間一時ロック
* **SQL注入対策**: パラメータ化クエリの徹底
* **XSS対策**: 入力値のサニタイズ・エスケープ

### 6.4 権限昇格防止
* **ロール変更**: 上位権限者のみ実行可能
* **セッション分離**: ロール変更時の強制再ログイン
* **監査ログ**: 権限変更の完全な追跡記録

## 7. コード構造とアーキテクチャガイドライン

### 7.1 認証関連ディレクトリ構成
バックエンド側の認証関連コードは `features/auth/` ディレクトリに集約する：

```
backend/src/features/auth/
├── auth.controller.ts    # リクエスト処理とレスポンス整形
├── auth.service.ts       # 認証ロジックの中核と業務処理
├── auth.routes.ts        # エンドポイント定義とミドルウェア適用
├── auth.middleware.ts    # 認証状態検証と権限チェック機能
└── auth.validator.ts     # 入力検証ルール
```

### 7.2 フロントエンド認証管理
```
frontend/src/features/auth/
├── AuthContext.tsx           # 認証状態の全体管理
├── services/
│   └── tokenService.ts       # トークン管理とセキュアなストレージ
├── hooks/
│   └── useAuth.ts           # 認証専用フック
└── components/
    └── ProtectedRoute.tsx   # 保護されたルート処理
```

### 7.3 依存関係と責任分離
* 認証モジュールは他の機能モジュールに依存しない（単方向依存）
* 認証状態の変更は適切なイベントシステムを通じて通知する
* 認証関連のエラー処理は専用のエラーハンドラーで一元管理
* 環境ごとの認証設定は設定ファイルから注入（ハードコード禁止）

## 8. 権限チェックメカニズム

### 8.1 ミドルウェア実装方式
```typescript
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractTokenFromCookie(req);
  
  if (!token || !isValidJWT(token)) {
    return res.status(401).json({ error: '認証が必要です', code: 'AUTH_REQUIRED' });
  }
  
  req.user = decodeUserFromToken(token);
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'この操作を実行する権限がありません', 
        code: 'PERMISSION_DENIED' 
      });
    }
    next();
  };
}
```

### 8.2 担当者チェック
```typescript
// 担当者チェック
export function checkAssignee(resourceType) {
  return async (req, res, next) => {
    const resourceId = req.params.id;
    const userId = req.user.id;
    
    // 上位権限者は全てアクセス可能
    if (isUpperRole(req.user.role)) {
      return next();
    }
    
    // 担当者チェック
    const resource = await getResource(resourceType, resourceId);
    if (resource.primaryAssigneeId === userId || 
        (resource.secondaryAssigneeIds && resource.secondaryAssigneeIds.includes(userId))) {
      return next();
    }
    
    return res.status(403).json({ error: 'この操作を実行する権限がありません' });
  };
}
```

## 9. エラー処理とログ

### 9.1 認証エラー分類
```typescript
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  GMAIL_AUTH_FAILED = 'GMAIL_AUTH_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

### 9.2 セキュリティログ要件
* **認証試行**: 成功・失敗の詳細記録
* **権限変更**: ロール変更・担当者変更の監査ログ
* **Gmail API**: アクセス履歴・エラー詳細
* **異常検知**: 不正アクセス試行の検知・アラート

## 10. 担当者管理システム

### 10.1 担当者割り当て権限
```typescript
interface AssignmentPermission {
  canAssign: (assignerId: string, targetUserId: string) => boolean;
  canModify: (modifierId: string, currentAssigneeId: string) => boolean;
}

// 上位権限者のみ担当者設定可能
const assignmentRules: AssignmentPermission = {
  canAssign: (assignerId) => isUpperRole(getUserRole(assignerId)),
  canModify: (modifierId, currentAssigneeId) => 
    isUpperRole(getUserRole(modifierId)) || modifierId === currentAssigneeId
};

// ロール判定ヘルパー関数
function isUpperRole(role: UserRole): boolean {
  return role === UserRole.COMPANY_LEADER || role === UserRole.MANAGER || role === UserRole.TEAM_LEADER;
}
```

### 10.2 インポート時担当者マッピング
```typescript
interface ImportMapping {
  emailPattern?: string;
  lastContactUserId?: string;
  departmentMapping?: Record<string, string>;
  fallbackAssignee?: string;
}

// インテリジェント担当者推論
async function inferAssignee(companyData: ImportCompanyData): Promise<string[]> {
  const candidates = [];
  
  // メール履歴から推論
  const emailHistory = await getEmailHistory(companyData.email);
  if (emailHistory.length > 0) {
    candidates.push(...emailHistory.map(e => e.lastContactUserId));
  }
  
  // 業界・地域マッピング
  const territoryAssignee = await getTerritoryAssignee(companyData.region);
  if (territoryAssignee) {
    candidates.push(territoryAssignee);
  }
  
  return dedupe(candidates);
}
```

## 11. パフォーマンス最適化

### 11.1 Gmail API効率化
* **バッチ処理**: 複数メール一括取得
* **キャッシュ戦略**: Redis使用による高速アクセス
* **差分同期**: 前回同期時点からの増分取得

### 11.2 認証処理最適化
* **JWT短期化**: 頻繁な権限チェックによるセキュリティ向上
* **セッションプール**: DB接続の効率的な再利用
* **非同期処理**: Gmail再認証の非ブロッキング実行

## 12. APIデザイナーへの引き継ぎポイント

### 12.1 認証が必要なエンドポイント
* **全 `/api/*` エンドポイント**: 認証必須（除外リスト以外）
* **認証不要エンドポイント**:
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/auth/password-reset`
  - `/api/auth/google/callback`

### 12.2 権限チェックが必要なエンドポイント

#### 12.2.1 上位権限者限定（COMPANY_LEADER/MANAGER/TEAM_LEADER）
```typescript
// ユーザー管理
GET/POST/PUT/DELETE /api/users/*

// システム管理
GET/PUT /api/system/settings
GET /api/system/audit-logs
GET/POST /api/import/*

// データエクスポート
GET /api/export/*
```

#### 12.2.2 COMPANY_LEADER のみアクセス可能
```typescript
// バックアップ・復旧
POST /api/system/backup
POST /api/system/restore
```

#### 12.2.3 担当者権限チェック
```typescript
// 企業データ編集（担当者のみ）
PUT /api/companies/:id

// TODO編集（担当者のみ）
PUT /api/todos/:id

// 契約編集（担当者のみ）
PUT /api/contracts/:id

// 提案編集（担当者のみ）
PUT /api/proposals/:id
```

### 12.3 認証エラーレスポンス標準形式
```typescript
// 401 Unauthorized
{
  "error": "認証が必要です",
  "code": "AUTH_REQUIRED",
  "redirectTo": "/login"
}

// 403 Forbidden - 権限不足
{
  "error": "この操作を実行する権限がありません",
  "code": "PERMISSION_DENIED",
  "requiredRole": "MANAGER"
}

// 429 Too Many Requests
{
  "success": false,
  "error": "リクエストが多すぎます。しばらく待ってから再試行してください",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

### 12.4 実装時の注意点
1. **担当者チェック**: 企業・TODO・契約・提案編集時は必ず担当者確認を実施
2. **上位権限者**: COMPANY_LEADER、MANAGER、TEAM_LEADERは担当者に関係なく全リソースアクセス可能
3. **ロール更新**: ユーザーロール変更時の強制再認証
4. **監査ログ**: 重要な権限操作の完全な記録保持
5. **型定義準拠**: backend/frontend両方のtypes/index.tsで定義されたUserRole enumを使用