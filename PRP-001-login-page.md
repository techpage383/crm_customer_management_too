# PRP-001-login-page.md

## 1. Goal（目標）

ログインページ（P-001）の完全実装により、認証システムの基盤を確立し、以下の最終状態を実現する：

- **ユーザー認証**: メールアドレス・パスワード認証とGoogle OAuth2認証の両方に対応
- **多要素認証**: セキュリティ要件を満たす2段階認証フロー
- **権限ベースリダイレクト**: ユーザーロールに応じた適切なダッシュボードへの誘導
- **セキュリティ対策**: ブルートフォース攻撃防止とJWTベース認証
- **Gmail連携**: 認証と同時にGmail API権限の取得・管理

## 2. Why（理由）

### ビジネス価値
- **CRMシステムの基盤**: 全機能への安全なアクセス制御
- **Gmail連携機能**: メール管理とTODO抽出機能の前提条件
- **コンプライアンス**: 企業データ保護とアクセス監査の実現

### 技術的必要性
- **全システムの依存関係**: 他の全ページが認証システムに依存
- **権限管理**: Company Leader/Manager/Team Leader/Userの4階層権限制御
- **API保護**: バックエンドAPIの統一された認証基盤

### 実装優先度
- **Phase 1の基盤**: 認証なしに他機能の開発が不可能
- **開発効率**: 認証確立後の並行開発を可能にする

## 3. What（要件）

### ユーザーストーリー
```
As a システムユーザー
I want セキュアなログイン機能
So that 安全に顧客管理ツールにアクセスできる

And Gmail連携機能を活用できる
```

### 技術要件
- **認証方式**: JWT + リフレッシュトークン
- **OAuth2連携**: Google Gmail API権限取得
- **多要素認証**: TOTP（Time-based One-Time Password）対応
- **セキュリティ**: bcrypt, CSRF対策, レート制限
- **レスポンシブ**: 全デバイス対応

### 成功基準
- [ ] 従来認証フローの完全動作
- [ ] Google OAuth2認証フローの完全動作  
- [ ] 多要素認証フローの完全動作
- [ ] 権限別リダイレクトの正確性
- [ ] セキュリティ対策の有効性検証

## 4. All Needed Context（必要な情報）

### A. API仕様（schemas/index.tsから抜粋）

```typescript
// 🔥 重要: 実装時は必ずこの型定義に完全準拠すること
// ❌ 禁止: 独自のレスポンス形式 {"success": true, "data": ...}
// ✅ 必須: 型定義通りの実装

// 認証関連型定義
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User extends UserBase, Timestamps {
  id: ID;
  gmailSyncStatus?: GmailSyncStatus;
  assignedCompanies?: Company[];
  assignedTodos?: Todo[];
}

export interface UserBase {
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive?: boolean;
  department?: string;
  phoneNumber?: string;
  gmailPersonalConnected?: boolean;
  gmailPersonalAccessToken?: string;
  gmailPersonalRefreshToken?: string;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
}

export enum UserRole {
  COMPANY_LEADER = 'company_leader',
  MANAGER = 'manager',
  TEAM_LEADER = 'team_leader',
  USER = 'user'
}

// APIパス定義
export const API_PATHS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
    GOOGLE_LOGIN: '/api/auth/google',
    GOOGLE_CALLBACK: '/api/auth/google/callback'
  }
};

// 認証エラー分類
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  GMAIL_AUTH_FAILED = 'GMAIL_AUTH_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

### B. モックアップファイル（完全なHTMLコード）

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>顧客管理ツール - ログイン</title>
    
    <!-- Material UI CDN -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .login-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            padding: 48px;
            max-width: 400px;
            width: 100%;
            text-align: center;
        }
        
        .logo h1 {
            color: #1976d2;
            font-size: 28px;
            margin: 0;
            font-weight: 500;
        }
        
        .auth-methods {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .google-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #4285f4;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 24px;
            font-size: 16px;
            cursor: pointer;
        }
        
        .traditional-login {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            box-sizing: border-box;
        }
        
        .login-btn {
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 24px;
            font-size: 16px;
            cursor: pointer;
        }
        
        .mfa-prompt {
            margin-top: 16px;
            padding: 16px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
        }
        
        .security-notice {
            margin-top: 24px;
            padding: 12px;
            background: #f5f5f5;
            border-radius: 8px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>顧客管理ツール</h1>
            <p>効率的な顧客関係管理</p>
        </div>
        
        <div class="auth-methods">
            <!-- Google OAuth -->
            <button class="google-btn" onclick="handleGoogleLogin()">
                <svg viewBox="0 0 24 24" width="20" height="20" style="margin-right: 12px;">
                    <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                </svg>
                Googleアカウントでログイン
            </button>
            
            <div class="divider"><span>または</span></div>
            
            <!-- 従来ログイン -->
            <div class="traditional-login">
                <div class="form-group">
                    <label for="email">メールアドレス</label>
                    <input type="email" id="email" placeholder="例: user@company.com">
                </div>
                
                <div class="form-group">
                    <label for="password">パスワード</label>
                    <input type="password" id="password" placeholder="パスワードを入力">
                </div>
                
                <button class="login-btn" onclick="handleTraditionalLogin()">
                    ログイン
                </button>
            </div>
        </div>
        
        <!-- MFA プロンプト -->
        <div class="mfa-prompt" id="mfaPrompt" style="display: none;">
            <strong>セキュリティ確認</strong>
            <p>認証アプリの6桁のコードを入力してください</p>
            <input type="text" id="mfaCode" placeholder="000000" maxlength="6">
            <button class="login-btn" onclick="handleMFAVerification()">確認</button>
        </div>
        
        <div class="footer-links">
            <a href="#" onclick="handleForgotPassword()">パスワードを忘れた方</a>
            <a href="#" onclick="handleRegister()">新規ユーザー登録</a>
        </div>
        
        <div class="security-notice">
            <strong>🔒 セキュリティ:</strong> このシステムは多層セキュリティで保護されています。
        </div>
    </div>

    <script>
        // JavaScript実装（モック含む）
        let currentUser = null;
        let mfaRequired = false;

        function handleGoogleLogin() {
            // Google OAuth2フロー実装
            window.location.href = '/api/auth/google';
        }

        function handleTraditionalLogin() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showError('メールアドレスとパスワードを入力してください');
                return;
            }
            
            // API呼び出し実装
            authenticateUser({ email, password });
        }

        async function authenticateUser(credentials) {
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials)
                });
                
                const result = await response.json();
                
                if (result.user && result.accessToken) {
                    // ログイン成功
                    localStorage.setItem('accessToken', result.accessToken);
                    localStorage.setItem('refreshToken', result.refreshToken);
                    
                    // ロール別リダイレクト
                    redirectToUserDashboard(result.user.role);
                }
            } catch (error) {
                showError('ログインに失敗しました');
            }
        }

        function redirectToUserDashboard(role) {
            switch (role) {
                case 'COMPANY_LEADER':
                case 'MANAGER':
                    window.location.href = '/admin/dashboard';
                    break;
                case 'TEAM_LEADER':
                case 'USER':
                    window.location.href = '/user/dashboard';
                    break;
                default:
                    window.location.href = '/dashboard';
            }
        }
    </script>
</body>
</html>
```

### C. 統一ガイドライン（auth-system-design.mdから関連部分を抜粋）

以下の統一ガイドラインを必ず適用：

#### API仕様統一
- **認証エンドポイント**: `/api/auth/*` の統一パターン
- **JWT管理**: アクセストークン15分、リフレッシュトークン7日
- **セキュリティ**: bcrypt (コスト係数 12)、CSRF対策

#### データモデル統一
- **UserRole enum**: COMPANY_LEADER/MANAGER/TEAM_LEADER/USER の4階層
- **Gmail連携**: 個人Gmail + 共同Gmail設定の統一管理
- **権限チェック**: `isUpperRole()` ヘルパー関数の活用

#### 実装パターン統一
- **認証ミドルウェア**: `requireAuth()`, `requireRole()` の統一使用
- **エラーハンドリング**: `AuthErrorCode` enum による分類
- **監査ログ**: `AuditActionType` による操作記録

#### 環境変数統一
```
JWT_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
SESSION_TIMEOUT=1800000
```

### D. ディレクトリ構造

```
frontend/src/
├── pages/public/
│   └── LoginPage.tsx              # 🔥 メインログインページ
├── components/auth/
│   ├── LoginForm.tsx              # 🔥 従来ログインフォーム  
│   ├── GoogleLoginButton.tsx      # 🔥 Google OAuth ボタン
│   ├── MFAPrompt.tsx              # 🔥 多要素認証プロンプト
│   └── PasswordResetModal.tsx     # パスワードリセット機能
├── services/
│   ├── index.ts                   # 🔥 統合層（モック/実API切り替え管理）
│   ├── mock/                      # 🔥 モックサービス
│   │   ├── data/                  # 🔥 モックデータ（型定義準拠）
│   │   │   └── auth.mock.ts
│   │   └── auth.service.ts
│   ├── api/                       # 実API接続実装
│   │   ├── client.ts              # APIクライアント基盤
│   │   └── auth.service.ts
│   └── utils/                     # 🔥 @MARKシステム関連ユーティリティ
├── hooks/
│   ├── useAuth.ts                 # 🔥 認証状態管理フック
│   └── useGoogleAuth.ts           # Google認証専用フック
├── contexts/
│   └── AuthContext.tsx            # 🔥 認証コンテキスト
└── schemas/                       # バックエンドと同期するデータ契約
    └── index.ts                   # APIパスとデータ契約（単一の真実源）

backend/src/
├── features/auth/
│   ├── auth.controller.ts         # 認証エンドポイント処理
│   ├── auth.service.ts            # 認証ロジック・業務処理
│   ├── auth.routes.ts             # ルート定義・ミドルウェア
│   ├── auth.middleware.ts         # JWT検証・権限チェック
│   ├── gmail-auth.service.ts      # Gmail OAuth2専用サービス
│   └── role.service.ts            # ロール管理サービス
├── common/
│   ├── middlewares/               # 共通ミドルウェア
│   ├── utils/                     # ユーティリティ関数
│   └── validators/                # 共通バリデーター
└── types/
    └── index.ts                   # フロントエンドと同期する型定義
```

### E. モック→API切り替え方針

```typescript
// 🔥 Phase 2A: モック実装時の必須ルール
// 1. すべてのモック箇所に @MOCK_TO_API マーク付与
// 2. モックデータは services/mock/data/ に分離
// 3. コンポーネント内でのハードコード完全禁止

// Phase 2A実装例：
// @MOCK_TO_API: authService.login()に置き換え
const loginResult = await mockAuthService.login(credentials);

// services/index.ts でモックサービスをエクスポート
export const authService = mockAuthService;

// 🔥 モックデータの品質基準
// services/mock/data/auth.mock.ts の例
export const mockLoginResponse: LoginResponse = {
  // schemas/index.ts の型定義に完全準拠
  user: {
    id: "mock-user-001",
    email: "test@company.com",
    username: "testuser",
    fullName: "テスト ユーザー",
    role: UserRole.MANAGER,
    isActive: true,
    department: "営業部",
    gmailPersonalConnected: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  accessToken: "mock-jwt-token-12345",  // 実際のJWT形式に近似
  refreshToken: "mock-refresh-token-67890",
  expiresIn: 900  // 15分
};

// 🔥 Phase 2B: API切り替え時の手順
// 1. grep -r "@MOCK_TO_API" src/ で対象箇所特定
// 2. モック呼び出しを実API呼び出しに置き換え
// 3. services/mock/data/auth.mock.ts 削除
// 4. services/index.ts で実APIサービスに切り替え

// 🔥 型定義の具体的活用例
import { LoginRequest, LoginResponse, API_PATHS } from '@/schemas';

const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(API_PATHS.AUTH.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }
  
  return response.json() as LoginResponse;
};

// 🔥 エラーハンドリング標準パターン
try {
  const result = await authService.login(credentials);
  // ログイン成功処理
  localStorage.setItem('accessToken', result.accessToken);
  localStorage.setItem('refreshToken', result.refreshToken);
  
  // ロール別リダイレクト
  redirectByRole(result.user.role);
} catch (error) {
  if (error.status === 401) {
    setError('メールアドレスまたはパスワードが正しくありません');
  } else if (error.status === 429) {
    setError('ログイン試行回数が上限を超えました。しばらくお待ちください');
  } else if (error.status === 500) {
    setError('サーバーエラーが発生しました');
  } else {
    setError('予期しないエラーが発生しました');
  }
}

// Phase 2B実装例：
const loginResult = await authService.login(credentials);

// services/index.ts で認証機能のみ実APIに切り替え
export const authService = apiAuthService;           // ← 実APIに切り替え済み
export const companyService = mockCompanyService;     // ← まだモック
export const todoService = mockTodoService;          // ← まだモック
```

## 5. Implementation Blueprint（実装設計図）

### Phase 1: バックエンド実装（1-2日）

```
タスクリスト:
- [ ] schemas/index.tsの認証型定義確認・同期
- [ ] backend/src/features/auth/ ディレクトリ作成
- [ ] auth.controller.ts: ログイン・ログアウト・リフレッシュ エンドポイント実装
- [ ] auth.service.ts: JWT生成・検証・ユーザー認証ロジック実装
- [ ] auth.middleware.ts: 認証ミドルウェア・権限チェック実装
- [ ] gmail-auth.service.ts: Google OAuth2フロー実装
- [ ] auth.routes.ts: ルート定義とミドルウェア適用
- [ ] User エンティティとのDB統合
- [ ] パスワードハッシュ化（bcrypt）実装
- [ ] 統合テスト作成（認証フロー・権限チェック）
- [ ] テスト通過確認

品質チェック:
- [ ] Backend Syntax & Style
- [ ] Backend Integration Test
```

### Phase 2A: UI実装（1-2日）

```
タスクリスト:
- [ ] pages/public/LoginPage.tsx 作成（モックアップベース）
- [ ] components/auth/ コンポーネント群作成
  - LoginForm.tsx (従来ログイン)
  - GoogleLoginButton.tsx (OAuth)
  - MFAPrompt.tsx (多要素認証)
- [ ] 🔥 モックデータの実装（@MARKシステム使用）
  - services/mock/data/auth.mock.ts にモックデータ作成
  - 全モック箇所に @MOCK_TO_API コメント付与
  - コンポーネント内でのハードコード完全禁止
- [ ] hooks/useAuth.ts: 認証状態管理フック実装
- [ ] contexts/AuthContext.tsx: グローバル認証コンテキスト実装
- [ ] services/index.ts でモックサービスをエクスポート
- [ ] レスポンシブデザイン実装
- [ ] アクセシビリティ対応（キーボードナビゲーション等）
- [ ] モックデータの品質確認（schemas/index.ts完全準拠）

実装ルール:
// @MOCK_TO_API: API実装時にこのブロック全体をAPI呼び出しに置き換え
const loginResult = await mockAuthService.login(credentials);

品質チェック:
- [ ] Frontend Syntax & Style
- [ ] フロントエンドビルド確認
- [ ] 基本的なコンパイル確認

注意: 実際の動作確認・UI調整は Phase 3 で人間が実行
```

### Phase 2B: API接続（1日）

```
タスクリスト:
- [ ] 🔥 @MARK検索でモック箇所特定
  grep -r "@MOCK_TO_API" src/
- [ ] 認証機能のモック箇所を実API呼び出しに置き換え
- [ ] services/mock/data/auth.mock.ts のみ削除
- [ ] services/index.ts で認証機能のみ実APIに切り替え
- [ ] api/auth.service.ts: 実API呼び出し実装
  - login(), logout(), refresh(), googleAuth()
- [ ] エラーハンドリング実装（401/429/500/ネットワークエラー対応）
- [ ] JWT トークン管理実装（localStorage/Cookie）
- [ ] 自動リフレッシュ機能実装
- [ ] Google OAuth2 コールバック処理実装
- [ ] ローディング状態・エラー状態実装
- [ ] 型定義を活用したAPI呼び出し実装

品質チェック:
- [ ] フロントエンドビルド確認（API接続後）
- [ ] 型定義の整合性確認
- [ ] 基本的なコンパイル確認
```

### Phase 3: 人間による最終確認（半日）

```
タスクリスト:
- [ ] サーバー起動（npm run dev）
- [ ] ドキュメント更新（認証フロー・API仕様）

品質チェック:
- [ ] 従来ログインフローの動作確認（人間）
- [ ] Google OAuth2フローの動作確認（人間）
- [ ] 多要素認証フローの動作確認（人間）
- [ ] 権限別リダイレクトの確認（人間）
- [ ] エラーケースの動作確認（人間）
- [ ] UI/UX調整（レスポンシブ、アニメーション等）（人間）
- [ ] セキュリティテスト（人間）
- [ ] 全ブラウザでの動作確認（人間）
- [ ] モックアップとの一致確認（人間）
- [ ] パフォーマンス確認（人間）
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
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@company.com","password":"password"}' \
  | jq '.'

# 期待値: schemas/index.tsのLoginResponse型と完全一致
# {
#   "user": {
#     "id": "...",
#     "email": "test@company.com",
#     "username": "...",
#     "fullName": "...",
#     "role": "MANAGER",
#     "isActive": true,
#     ...
#   },
#   "accessToken": "...",
#   "refreshToken": "...",
#   "expiresIn": 900
# }
# 
# ❌ 不一致例: {"success": true, "data": {...}, "token": "..."}
# → この場合は即座に実装修正してから次のステップへ

# Google OAuth2エンドポイント確認
curl -X GET http://localhost:3000/api/auth/google
# 期待値: Google OAuth2 リダイレクトURL

# リフレッシュトークン確認
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"test-refresh-token"}' \
  | jq '.'

# Backend Integration Test（型定義確認後に実行）
npm run test:integration -- tests/integration/auth.flow.test.js
# 期待値: バックエンドAPIの全テスト通過
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

grep -r "mockAuthService" src/
# 期待値: 認証モックサービスの正しい使用

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
# 期待値: auth.mock.ts のみ削除済み（他機能のモックは残存）

# 🔥 フロントエンド・バックエンド連携確認（重要）
npm run dev &
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@company.com","password":"password"}' \
  | jq '.user, .accessToken, .refreshToken, .expiresIn'

# フロントエンドコードでの実際の使用確認
grep -r "accessToken\|refreshToken" frontend/src/ | head -5
grep -r "expiresIn" frontend/src/ | head -5

# Google OAuth2エンドポイント連携確認
curl -X GET http://localhost:3000/api/auth/google
# 期待値: 適切なリダイレクトURL応答

# 期待値: 
# - @MOCK_TO_API マークが完全削除済み
# - auth.mock.ts のみ削除済み
# - APIレスポンスに user, accessToken, refreshToken, expiresIn が存在
# - フロントエンドコードで正しいプロパティ名を使用
# - プロパティ名の完全一致
```

### Phase 3完了時: 人間による最終確認

```bash
# サーバー起動のみ（AIが実行）
npm run dev

# 以下は人間が実行:
# - ブラウザで http://localhost:3000/login を開く
# - mockups/login.html と視覚的に比較
# - 従来ログインフロー（メール・パスワード）をテスト
# - Google OAuth2フローをテスト
# - 多要素認証フローをテスト（有効な場合）
# - 権限別リダイレクト確認（COMPANY_LEADER → /admin/dashboard等）
# - エラーケーステスト（不正認証情報、ネットワークエラー等）
# - レスポンシブデザイン確認（モバイル・タブレット）
# - アクセシビリティ確認（キーボードナビゲーション等）
# - パフォーマンス確認（応答時間2秒以内等）
# - セキュリティ確認（CSRF、XSS対策等）
# - 最終的な品質確認

# 注意: APIテストはPhase 1で完了済み
```

## 7. 完了条件

### 技術的完了基準
- [ ] 全テストが通過（Phase 1: Backend Integration Test）
- [ ] フロントエンドビルドエラーなし
- [ ] @MOCK_TO_API マークが完全削除
- [ ] 型エラーなし（schemas/index.ts準拠）
- [ ] 認証フロー全パターンの動作確認

### 機能的完了基準
- [ ] 従来ログイン（メール・パスワード）の完全動作
- [ ] Google OAuth2ログインの完全動作
- [ ] 多要素認証フローの完全動作
- [ ] 権限別リダイレクトの正確性（4つのUserRole）
- [ ] エラーケースの適切な処理（401/429/500等）
- [ ] セキュリティ要件の満足（JWT、CSRF、レート制限等）
- [ ] レスポンシブ対応確認
- [ ] モックアップとの視覚的一致（90%以上）

### 品質保証基準
- [ ] 認証セキュリティテスト完了
- [ ] パフォーマンステスト完了（応答時間2秒以内）
- [ ] アクセシビリティテスト完了
- [ ] ブラウザ互換性テスト完了
- [ ] 統合テスト完了（他ページとの連携）

### セキュリティ完了基準
- [ ] ブルートフォース攻撃防止の動作確認
- [ ] JWT有効期限管理の動作確認
- [ ] CSRF対策の有効性確認
- [ ] パスワードハッシュ化の実装確認
- [ ] セッション管理の安全性確認