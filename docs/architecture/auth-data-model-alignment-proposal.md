# 認証システムとデータモデルの整合性修正提案

## 概要

認証設計ドキュメントとデータモデル（types/index.ts）の間に発見された不整合を解消するための修正提案書です。

## 1. ユーザーロールの統一

### 現状の問題
- データモデル: `ADMIN`, `USER`, `MANAGER`の3つ
- アクセス制御マトリックス: `COMPANY_LEADER`, `MANAGER`, `TEAM_LEADER`, `USER`の4つ

### 修正提案

```typescript
// backend/src/types/index.ts および frontend/src/types/index.ts
export enum UserRole {
  COMPANY_LEADER = 'company_leader',  // 最上位権限（旧ADMIN相当）
  MANAGER = 'manager',                 // 管理職権限
  TEAM_LEADER = 'team_leader',        // チームリーダー権限（新規追加）
  USER = 'user'                        // 一般ユーザー権限
}

// 権限階層判定用ヘルパー
export const UPPER_ROLES = [UserRole.COMPANY_LEADER, UserRole.MANAGER, UserRole.TEAM_LEADER];

export function isUpperRole(role: UserRole): boolean {
  return UPPER_ROLES.includes(role);
}
```

### 移行計画
1. 既存の`ADMIN`ロールを`COMPANY_LEADER`に自動マッピング
2. 新規ユーザーは4段階の権限階層から選択
3. 移行スクリプトで既存データを更新

## 2. 担当者フィールドの統一

### 現状の問題
- `Company`エンティティ: `assignedUsers`（複数担当者）
- その他エンティティ: `assignedUserId`（単一担当者）
- アクセス制御設計: 単一担当者を前提

### 修正提案

```typescript
// 主担当者と副担当者の明確な分離
export interface CompanyBase {
  // ... 既存フィールド
  primaryAssigneeId?: ID;           // 主担当者（権限を持つ）
  secondaryAssigneeIds?: ID[];      // 副担当者（閲覧のみ）
}

export interface Company extends CompanyBase, Timestamps {
  id: ID;
  primaryAssignee?: User;           // 主担当者の詳細
  secondaryAssignees?: User[];      // 副担当者の詳細
  // assignedUsers は廃止
}

// 他のエンティティも同様に統一
export interface DeploymentBase {
  // assignedUserId を primaryAssigneeId に変更
  primaryAssigneeId: ID;
}
```

### 権限チェックの明確化
- 編集権限: 上位権限者 + 主担当者のみ
- 閲覧権限: 上位権限者 + 主担当者 + 副担当者

## 3. Gmail連携フィールドの拡張

### 修正提案

```typescript
export interface UserBase {
  // ... 既存フィールド
  gmailPersonalConnected?: boolean;        // 個人Gmail連携状態
  gmailPersonalAccessToken?: string;       // 個人Gmailトークン（暗号化）
  gmailPersonalRefreshToken?: string;      // 個人Gmailリフレッシュトークン（暗号化）
}

// システム設定に共同メール設定を追加
export interface SystemSettings {
  // ... 既存フィールド
  sharedGmail: {
    enabled: boolean;
    accounts: Array<{
      id: string;
      email: string;
      displayName: string;
      accessToken: string;        // 暗号化保存
      refreshToken: string;       // 暗号化保存
      allowedRoles: UserRole[];   // アクセス可能なロール
    }>;
  };
}
```

## 4. 監査ログの詳細化

### 修正提案

```typescript
export enum AuditActionType {
  // 認証関連
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  
  // 権限変更
  ROLE_CHANGED = 'role_changed',
  ASSIGNEE_CHANGED = 'assignee_changed',
  
  // Gmail関連
  GMAIL_CONNECTED = 'gmail_connected',
  GMAIL_DISCONNECTED = 'gmail_disconnected',
  SHARED_GMAIL_ACCESSED = 'shared_gmail_accessed',
  
  // データ操作
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  BULK_OPERATION = 'bulk_operation'
}

export interface AuditLog extends Timestamps {
  id: ID;
  userId: ID;
  user?: User;
  actionType: AuditActionType;      // 列挙型で明確化
  action: string;                    // 詳細な説明
  entityType: string;
  entityId: ID;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    riskScore?: number;            // セキュリティリスクスコア
  };
}
```

## 5. 内部タスクソースの追加

### 修正提案

```typescript
export enum TodoSource {
  MANUAL = 'manual',
  AI_EXTRACTED = 'ai_extracted',
  EMAIL_FOLLOW_UP = 'email_follow_up',
  EMAIL_FORWARDED = 'email_forwarded',    // 内部タスク用メール転送
  INTERNAL_REQUEST = 'internal_request'    // 社内依頼
}

export interface TodoBase {
  // ... 既存フィールド
  source: TodoSource;
  sourceReference?: {
    type: 'email' | 'thread' | 'manual' | 'internal_email' | 'internal_request';
    id?: ID;
    metadata?: {
      forwardedBy?: ID;          // 転送者
      originalSender?: string;    // 元の送信者
      internalRequestor?: ID;     // 内部依頼者
    };
  };
  isInternal?: boolean;          // 内部タスクフラグ
}
```

## 6. APIパスの認証要件追加

### 修正提案

```typescript
// API認証要件の明示的な定義
export const API_AUTH_CONFIG = {
  // 認証不要エンドポイント
  PUBLIC_ENDPOINTS: [
    API_PATHS.AUTH.LOGIN,
    API_PATHS.AUTH.REGISTER,
    API_PATHS.AUTH.REFRESH
  ],
  
  // ロール制限エンドポイント
  ROLE_RESTRICTED_ENDPOINTS: {
    // 上位権限者のみ
    [UPPER_ROLES.join(',')]: [
      API_PATHS.USERS.BASE,
      API_PATHS.SYSTEM.SETTINGS,
      API_PATHS.SYSTEM.AUDIT_LOGS,
      API_PATHS.IMPORT.BASE
    ],
    
    // COMPANY_LEADER のみ
    [UserRole.COMPANY_LEADER]: [
      API_PATHS.SYSTEM.BACKUP
    ]
  },
  
  // 担当者チェックが必要なエンドポイント
  ASSIGNEE_CHECK_REQUIRED: [
    /^\/api\/companies\/[^\/]+$/,          // PUT /api/companies/:id
    /^\/api\/todos\/[^\/]+$/,              // PUT /api/todos/:id
    /^\/api\/deployments\/[^\/]+$/         // PUT /api/deployments/:id
  ]
};
```

## 実装優先順位

1. **高優先度（破壊的変更）**
   - ユーザーロールの統一
   - 担当者フィールドの統一

2. **中優先度（機能拡張）**
   - Gmail連携フィールドの拡張
   - 監査ログの詳細化

3. **低優先度（改善）**
   - 内部タスクソースの追加
   - APIパス認証要件の明示化

## 移行手順

1. **データベーススキーマの更新**
   - 新しいフィールドを追加（nullable）
   - 既存データの移行スクリプト作成

2. **型定義の更新**
   - backend/src/types/index.ts を更新
   - frontend/src/types/index.ts を同期

3. **認証ロジックの更新**
   - ミドルウェアの修正
   - 権限チェック関数の更新

4. **テストの実施**
   - 既存機能の動作確認
   - 新機能のテスト追加

5. **ドキュメントの更新**
   - auth-system-design.md の更新
   - access-control.md の更新

## リスクと対策

### リスク
- 既存データの移行ミス
- 権限昇格の脆弱性
- APIの後方互換性

### 対策
- 段階的な移行（カナリアリリース）
- 包括的なテストカバレッジ
- 監査ログによる変更追跡
- 旧APIエンドポイントの一時的な維持