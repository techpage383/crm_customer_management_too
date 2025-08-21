# 最強タスク管理ツール - API認証仕様書

## 🔐 API認証アーキテクチャ

**設計日**: 2025-07-30  
**設計者**: ★4 アーキテクチャデザイナー

### 認証方式
- **基本認証**: JWT (JSON Web Token)
- **追加認証**: デバイス指紋 + セッション管理
- **セキュリティ拡張**: ワークフロー専用権限トークン

## 🎯 APIエンドポイント認証仕様

### 1. ワークフローテンプレート管理 API

#### GET /api/workflows/templates
```typescript
// 認証レベル: 標準
// 必要権限: VIEW_TEAM_WORKFLOWS or VIEW_COMPANY_WORKFLOWS
// スコープ制限: 所属企業内のみ

Request Headers:
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "X-Company-ID": "<COMPANY_ID>",
  "X-Workflow-Scope": "PERSONAL|TEAM|DEPARTMENT|COMPANY"
}

JWT Payload必須フィールド:
{
  "userId": "string",
  "companyId": "string", 
  "role": "USER|TEAM_LEADER|MANAGER|COMPANY_LEADER",
  "workflowPermissions": ["view_team_workflows", ...],
  "teamIds": ["string[]"],
  "departmentIds": ["string[]"]
}

権限チェックロジック:
- PERSONAL: 自分の個人ワークフローのみ閲覧可能
- TEAM: 所属チームのワークフローのみ閲覧可能  
- DEPARTMENT: MANAGER以上で担当部門のワークフロー閲覧可能
- COMPANY: COMPANY_LEADERで全社ワークフロー閲覧可能
```

#### POST /api/workflows/templates
```typescript
// 認証レベル: 高
// 必要権限: CREATE_PERSONAL_WORKFLOW | CREATE_TEAM_WORKFLOW | CREATE_COMPANY_WORKFLOW
// データ検証: ワークフロー定義の妥当性チェック

Request Headers:
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "X-Company-ID": "<COMPANY_ID>",
  "X-Request-ID": "<UNIQUE_REQUEST_ID>",
  "Content-Type": "application/json"
}

Request Body Validation:
{
  "name": "required|string|max:255",
  "type": "required|enum:KANBAN,SCRUM,CUSTOM",
  "scope": "required|enum:PERSONAL,TEAM,DEPARTMENT,COMPANY",
  "columns": "required|array|min:2|max:20",
  "accessControl": {
    "scope": "required|enum",
    "allowedRoles": "required|array",
    "isPublic": "boolean",
    "canEdit": "boolean",
    "canDelete": "boolean"
  }
}

権限チェック:
- PERSONAL: 全ユーザー作成可能
- TEAM: TEAM_LEADER以上で所属チーム内で作成可能
- DEPARTMENT: MANAGER以上で担当部門内で作成可能  
- COMPANY: COMPANY_LEADERのみ作成可能
```

#### PUT /api/workflows/templates/:templateId
```typescript
// 認証レベル: 高
// 必要権限: EDIT_PERSONAL_WORKFLOW | EDIT_TEAM_WORKFLOW | EDIT_COMPANY_WORKFLOW
// 追加チェック: 既存リソースの所有権確認

Pre-Check Logic:
1. テンプレートの存在確認
2. 企業ID一致確認 (companyId)
3. スコープ別権限確認
4. 作成者または上位権限確認

権限チェック階層:
- 作成者本人: 常に編集可能（PERSONALスコープのみ）
- TEAM_LEADER: 担当チーム内のTEAMスコープ編集可能
- MANAGER: 担当部門内のDEPARTMENTスコープ編集可能
- COMPANY_LEADER: 企業内の全スコープ編集可能

Concurrent Edit Protection:
- 同時編集検知: version番号による楽観ロック
- 編集ロック: 15分間の排他制御
- 強制解除: MANAGER以上の権限で可能
```

#### DELETE /api/workflows/templates/:templateId  
```typescript
// 認証レベル: 最高
// 必要権限: DELETE_PERSONAL_WORKFLOW | DELETE_TEAM_WORKFLOW | DELETE_COMPANY_WORKFLOW
// 制限事項: 使用中テンプレートは削除不可

Pre-Delete Validation:
1. 使用中テンプレート確認（active_workflow_count > 0）
2. 依存関係確認（子テンプレート・参照存在確認）
3. 承認フロー要件確認（TEAMスコープ以上は承認必要）

権限チェック:
- PERSONAL: 作成者のみ削除可能
- TEAM: TEAM_LEADER + 承認フロー
- DEPARTMENT: MANAGER以上 + 承認フロー  
- COMPANY: COMPANY_LEADERのみ削除可能

Approval Flow (TEAM以上):
1. 削除申請: 削除理由必須
2. 承認者決定: スコープに応じた承認者自動選出
3. 承認期限: 48時間（タイムアウト時は自動拒否）
4. 削除実行: 承認後に実際の削除処理
```

### 2. ワークフロー設定管理 API

#### GET /api/workflows/settings
```typescript
// 認証レベル: 標準
// 必要権限: 自分の設定のみアクセス可能
// プライバシー保護: 個人設定の完全分離

Authorization Check:
- JWT内のuserIdと一致確認必須
- companyId一致確認必須
- セッション有効性確認

Response Data Filtering:
- 個人設定のみ返却
- 他ユーザーの設定情報は一切含めない
- 企業レベル設定は参照のみ（編集権限なし）
```

#### PUT /api/workflows/settings
```typescript
// 認証レベル: 標準
// 必要権限: 自分の設定のみ変更可能
// 変更制限: 企業ポリシーによる制約適用

Change Validation:
1. 個人設定範囲内の変更のみ許可
2. 企業ポリシー違反チェック
3. プライバシー設定変更時の追加確認

Restricted Changes:
- 企業必須ワークフローの無効化禁止
- セキュリティポリシー設定の変更禁止
- 監査必須項目の非表示化禁止
```

#### GET /api/workflows/settings/user/:userId
```typescript  
// 認証レベル: 高
// 必要権限: VIEW_TEAM_WORKFLOWS以上 + 組織階層権限
// プライバシー制限: ユーザー同意による制限適用

Authorization Hierarchy:
- TEAM_LEADER: 所属チームメンバーのみ
- MANAGER: 担当部門メンバーのみ  
- COMPANY_LEADER: 企業内全ユーザー

Privacy Filter:
- ユーザーのプライバシー設定に応じたフィルタリング
- visibleToTeam: false の場合は基本情報のみ
- sharePersonalTemplates: false の場合は個人テンプレート除外
```

### 3. 工数テンプレート管理 API

#### GET /api/workflows/effort-templates
```typescript
// 認証レベル: 標準  
// 必要権限: 所属スコープ内の工数テンプレート閲覧
// データフィルタ: スコープ別可視性制御

Scope-based Filtering:
- PERSONAL: 自分が作成した個人テンプレートのみ
- TEAM: 所属チーム + 個人テンプレート
- DEPARTMENT: 担当部門 + チーム + 個人テンプレート
- COMPANY: 企業全体 + 部門 + チーム + 個人テンプレート
```

#### POST /api/workflows/effort-templates
```typescript
// 認証レベル: 中
// 必要権限: MANAGE_EFFORT_TEMPLATES + スコープ別権限
// 作成制限: スコープに応じた作成権限チェック

Creation Rules:
- PERSONAL: 全ユーザー作成可能（無制限）
- TEAM: TEAM_LEADER以上
- DEPARTMENT: MANAGER以上
- COMPANY: COMPANY_LEADERのみ

Template Validation:
- 工数見積もり妥当性チェック（0-1000時間）
- 適用可能ステータスの存在確認
- 重複テンプレート名チェック（スコープ内）
```

### 4. 承認フロー管理 API

#### POST /api/workflows/approval-requests
```typescript
// 認証レベル: 高
// 必要権限: 承認申請権限 + リソース変更権限
// 承認者自動選出: 組織階層に基づく承認者決定

Approval Request Creation:
1. 申請者権限確認
2. 対象リソースのアクセス権確認  
3. 承認者自動選出ロジック実行
4. 承認期限設定（デフォルト48時間）

Auto Approver Selection:
- TEAM scope: 上位のTEAM_LEADER
- DEPARTMENT scope: 担当MANAGER
- COMPANY scope: COMPANY_LEADER
- 複数承認者: 過半数承認で可決
```

#### PUT /api/workflows/approval-requests/:requestId/approve
```typescript
// 認証レベル: 最高
// 必要権限: APPROVE_STATUS_TRANSITION + 承認者権限
// 承認検証: 承認者資格の厳密チェック

Approval Authorization:
1. 承認者リストに含まれているか確認
2. 承認期限内であるか確認
3. 既に承認済みでないか確認
4. 利益相反チェック（申請者≠承認者）

Post-Approval Actions:
1. 承認状態更新
2. 他承認者への通知
3. 申請者への結果通知
4. 必要に応じて自動実行
```

## 🔑 JWT トークン仕様

### 標準JWT ペイロード
```typescript
interface WorkflowJWTPayload {
  // 標準クレーム
  iss: string;           // 発行者
  sub: string;           // ユーザーID  
  aud: string;           // オーディエンス
  exp: number;           // 有効期限
  nbf: number;           // 有効開始時刻
  iat: number;           // 発行時刻
  jti: string;           // JWT ID
  
  // ワークフロー専用クレーム  
  companyId: string;     // 企業ID
  role: UserRole;        // ユーザー役割
  workflowPermissions: WorkflowPermission[]; // ワークフロー権限
  workflowScopes: string[];      // アクセス可能スコープ
  teamIds: string[];     // 所属チームID
  departmentIds: string[]; // 所属部門ID
  
  // セキュリティクレーム
  sessionId: string;     // セッションID
  deviceId: string;      // デバイスID
  ipAddress: string;     // 発行時IP
  
  // 有効期限管理
  workflowTokenExpiry: number;  // ワークフロー専用期限
  refreshThreshold: number;     // リフレッシュ閾値
}
```

### JWT 署名・検証

#### RS256 署名方式
```typescript
// 秘密鍵・公開鍵ペアによる署名
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;

// トークン生成
const generateWorkflowJWT = (payload: WorkflowJWTPayload): string => {
  return jwt.sign(payload, JWT_PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: '15m',        // メイントークン15分
    issuer: 'workflow-api',
    audience: 'workflow-client'
  });
};

// トークン検証
const verifyWorkflowJWT = (token: string): WorkflowJWTPayload => {
  return jwt.verify(token, JWT_PUBLIC_KEY, {
    algorithms: ['RS256'],
    issuer: 'workflow-api',
    audience: 'workflow-client'
  }) as WorkflowJWTPayload;
};
```

### トークンリフレッシュ機構
```typescript
// リフレッシュトークン（長期間有効）
interface RefreshToken {
  userId: string;
  companyId: string;
  deviceId: string;
  expiresAt: Date;
  isRevoked: boolean;
}

// 自動リフレッシュミドルウェア
const autoRefreshMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractJWTToken(req);
  const payload = jwt.decode(token) as WorkflowJWTPayload;
  
  // 残り有効期間が閾値以下の場合、自動リフレッシュ
  const remainingTime = payload.exp - Math.floor(Date.now() / 1000);
  if (remainingTime < payload.refreshThreshold) {
    const newToken = await refreshWorkflowToken(payload.jti);
    res.setHeader('X-New-Token', newToken);
  }
  
  next();
};
```

## 🛡️ セキュリティ検証フロー

### リクエスト処理フロー
```
1. HTTPS接続確認
   ↓
2. JWT存在確認  
   ↓
3. JWT署名検証
   ↓  
4. JWT有効期限確認
   ↓
5. セッション有効性確認
   ↓
6. デバイス指紋照合
   ↓
7. 企業ID一致確認
   ↓
8. 権限マトリックス照合
   ↓
9. スコープ制限チェック
   ↓
10. リソース所有権確認
   ↓
11. 動的制約確認
   ↓
12. API実行許可
```

### エラーレスポンス統一仕様
```typescript
interface WorkflowAPIError {
  success: false;
  error: {
    code: string;           // エラーコード
    message: string;        // ユーザー向けメッセージ
    details?: any;          // 詳細情報（開発環境のみ）
    requestId: string;      // リクエストID
    timestamp: string;      // エラー発生時刻
  };
  meta?: {
    documentation: string;  // ドキュメントURL
    supportContact: string; // サポート連絡先
  };
}

// 認証エラーの例
{
  "success": false,
  "error": {
    "code": "WORKFLOW_AUTH_INSUFFICIENT_PERMISSION",
    "message": "このワークフローテンプレートを編集する権限がありません",
    "requestId": "req_1234567890",  
    "timestamp": "2025-07-30T10:00:00.000Z"
  },
  "meta": {
    "documentation": "https://docs.example.com/workflow-permissions",
    "supportContact": "support@example.com"
  }
}
```

## 📊 監査・ログ要件

### API呼び出しログ
```typescript
interface WorkflowAPILog {
  requestId: string;
  method: string;
  endpoint: string;
  userId: string;
  companyId: string;
  ipAddress: string;
  userAgent: string;
  requestSize: number;
  responseStatus: number;
  responseSize: number;
  processingTime: number;
  permissions: string[];
  resourcesAccessed: string[];
  timestamp: Date;
}
```

### セキュリティイベントログ
```typescript
interface WorkflowSecurityEvent {
  eventId: string;
  eventType: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'PERMISSION_DENIED' | 'SUSPICIOUS_ACTIVITY';
  userId?: string;
  companyId?: string;
  ipAddress: string;
  details: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
}
```

---

**実装指針**: ★8バックエンド実装エージェントは、この認証仕様に基づいて各APIエンドポイントの認証・認可機能を実装してください。特に権限チェックロジックとセキュリティ検証フローは、仕様書の通りに厳密に実装することが重要です。