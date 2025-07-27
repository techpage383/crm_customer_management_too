# 認証システム設計書

## 1. 概要

このドキュメントでは顧客管理ツールの認証システムの詳細設計を定義します。Gmail連携機能を核とした企業向けCRMシステムにおける、多層権限管理と個人・共同メールアクセス制御を実現します。

## 2. 認証メカニズム

### 2.1 選定方式
* **JWT（JSON Web Token）ベースの認証**
* **Google OAuth2との統合認証**
* **リフレッシュトークンによるアクセストークン再発行**

### 2.2 選定理由
* ステートレス性によるスケーラビリティ確保
* Gmail API連携との親和性
* フロントエンド/バックエンド分離アーキテクチャとの適合性
* 個人・共同メールの権限分離に対応

### 2.3 認証フロー概要
```
ユーザー → システムログイン → Google OAuth2 → Gmail API許可 → JWTトークン発行
```

## 3. ユーザーロール定義

### 3.1 ロール階層
| ロールID | ロール名 | 説明 | Gmail権限 |
|---------|---------|-----|-----------|
| ADMIN | システム管理者 | 最上位権限 | 全メール（個人・共同） |
| MANAGER | マネージャー | 管理職権限 | 全メール（個人・共同） |
| USER | 一般ユーザー | 基本権限 | 個人メールのみ |

### 3.2 権限継承関係
* 上位権限者（ADMIN/MANAGER）は同等の管理権限を持つ
* 権限は上位から下位への包含関係（上位者は下位者の権限をすべて含む）

## 4. 認証フロー詳細

### 4.1 登録（サインアップ）フロー
```
1. ユーザー情報入力（email, name, password）
2. 基本認証情報の検証・保存
3. Google OAuth2フローへリダイレクト
4. Gmail API許可取得
5. アクセストークン・リフレッシュトークンの暗号化保存
6. JWT発行・レスポンス
```

### 4.2 ログイン（サインイン）フロー
```
1. email/password による基本認証
2. Google OAuth2 refresh token の有効性確認
3. 必要に応じて Gmail API再認証
4. ユーザーロール・権限情報の取得
5. JWT発行（ロール・Gmail権限情報を含む）
```

### 4.3 Gmail再認証フロー（トークン期限切れ時）
```
1. Gmail API呼び出し時のエラー検知
2. Refresh Tokenによる自動再認証
3. 新しいAccess Tokenの取得・保存
4. 元のAPI処理の継続実行
```

### 4.4 パスワードリセットフロー
```
1. email入力によるリセット要求
2. 時限式リセットトークンの生成・送信
3. セキュアリンクでのパスワード再設定
4. Gmail連携の維持（再認証不要）
```

## 5. Gmail連携アーキテクチャ

### 5.1 デュアルメールアクセス設計
```typescript
interface EmailAccessContext {
  userId: string;
  userRole: UserRole;
  personalGmailToken: string;
  sharedGmailAccess: boolean;
  accessibleEmailAccounts: string[];
}
```

### 5.2 個人・共同メール分離
* **個人メール**: ユーザー個別のGoogleアカウント連携
* **共同メール**: チーム共有メールアカウント（上位権限者のみアクセス）
* **権限チェック**: API呼び出し時にロールベースでアクセス制御

### 5.3 Gmail API呼び出し戦略
```typescript
// 上位権限者：個人 + 共同メールの統合ビュー
// 一般ユーザー：個人メールのみ
async function getEmailsForUser(context: EmailAccessContext) {
  const emails = await getPersonalEmails(context.personalGmailToken);
  
  if (hasSharedEmailAccess(context.userRole)) {
    const sharedEmails = await getSharedEmails();
    return mergeEmailViews(emails, sharedEmails);
  }
  
  return emails;
}
```

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
* **ブルートフォース対策**: 連続5回失敗で30分間一時ロック
* **Gmail API制限**: ユーザーごとのAPI呼び出し回数制限

### 6.4 権限昇格防止
* **ロール変更**: 上位権限者のみ実行可能
* **セッション分離**: ロール変更時の強制再ログイン
* **監査ログ**: 権限変更の完全な追跡記録

## 7. コード構造とアーキテクチャガイドライン

### 7.1 認証関連ディレクトリ構成
```
backend/src/features/auth/
├── auth.controller.ts      # 認証エンドポイント処理
├── auth.service.ts         # 認証ロジックと業務処理
├── auth.routes.ts          # ルート定義とミドルウェア
├── auth.middleware.ts      # JWT検証・権限チェック
├── auth.validator.ts       # 入力検証ルール
├── gmail-auth.service.ts   # Gmail OAuth2専用サービス
└── role.service.ts         # ロール管理サービス
```

### 7.2 フロントエンド認証管理
```
frontend/src/features/auth/
├── AuthContext.tsx         # 認証状態管理コンテキスト
├── services/
│   ├── tokenService.ts     # トークン管理とセキュアストレージ
│   └── gmailAuthService.ts # Gmail認証フロー管理
├── hooks/
│   ├── useAuth.ts          # 認証専用フック
│   └── useGmailAuth.ts     # Gmail認証フック
└── components/
    ├── ProtectedRoute.tsx  # 認証ガード
    └── RoleGuard.tsx       # ロールベースガード
```

### 7.3 Gmail連携統合設計
```
backend/src/features/gmail/
├── gmail.service.ts        # Gmail API統合サービス
├── shared-email.service.ts # 共同メール管理
├── access-control.service.ts # メールアクセス制御
└── sync.scheduler.ts       # 定期同期処理
```

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

### 8.2 Gmail アクセス制御
```typescript
export function requireGmailAccess(accessType: 'personal' | 'shared' | 'both') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const hasPersonal = await hasPersonalGmailAccess(req.user);
    const hasShared = isUpperRole(req.user.role);
    
    if (accessType === 'shared' && !hasShared) {
      return res.status(403).json({ 
        error: '共同メールアクセス権限がありません',
        code: 'GMAIL_SHARED_ACCESS_DENIED' 
      });
    }
    
    if (accessType === 'personal' && !hasPersonal) {
      return res.status(403).json({ 
        error: 'Gmail認証が必要です',
        code: 'GMAIL_AUTH_REQUIRED' 
      });
    }
    
    next();
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
  return role === UserRole.ADMIN || role === UserRole.MANAGER;
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

#### 12.2.1 上位権限者限定（ADMIN/MANAGER）
```typescript
// 担当者設定・変更
PUT /api/companies/:id/assignee

// システム設定
GET/PUT /api/system/settings
GET /api/system/users
POST /api/system/backup

// 共同メールアクセス
GET /api/gmail/shared/*
```

#### 12.2.2 担当者権限チェック
```typescript
// 企業データ編集（担当者のみ）
PUT /api/companies/:id

// 企業関連TODO編集（担当者のみ）
PUT /api/todos/:id (where companyId matches)
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

// 403 Forbidden - Gmail認証不足
{
  "error": "Gmail連携認証が必要です",
  "code": "GMAIL_AUTH_REQUIRED",
  "authUrl": "/api/auth/google"
}
```

### 12.4 実装時の注意点
1. **担当者チェック**: 企業編集時は必ず担当者確認を実施
2. **Gmail権限分離**: 個人・共同メールアクセスの明確な分離
3. **ロール更新**: ユーザーロール変更時の強制再認証
4. **監査ログ**: 重要な権限操作の完全な記録保持
5. **新データモデル対応**: Company エンティティと新しいUserRole enumに基づく権限制御