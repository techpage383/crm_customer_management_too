# アクセス制御マトリックス

## 1. ユーザーロール定義

| ロールID | ロール名 | 説明 | Gmail権限 |
|---------|---------|-----|-----------|
| COMPANY_LEADER | カンパニー長 | 最上位権限・全社管理 | 個人 + 共同メール |
| MANAGER | マネージャー | 管理職・チーム管理 | 個人 + 共同メール |  
| TEAM_LEADER | チームリーダー | 中間管理・チーム統括 | 個人 + 共同メール |
| USER | 一般ユーザー | 基本権限・担当業務のみ | 個人メールのみ |

### 1.1 権限階層関係
- **上位権限者**（COMPANY_LEADER/MANAGER/TEAM_LEADER）：同等の管理権限
- **下位継承**：上位権限者は下位権限をすべて含む

## 2. リソースアクション定義

各リソースに対して以下のアクションを定義：
- **C**: Create (作成)
- **R**: Read (読取)
- **U**: Update (更新)  
- **D**: Delete (削除)
- **A**: Assign (割り当て・担当者設定)

## 3. アクセス制御マトリックス

### 3.1 認証・ユーザー管理

| リソース | アクション | COMPANY_LEADER | MANAGER | TEAM_LEADER | USER |
|---------|-----------|----------------|---------|-------------|------|
| ユーザー | C | ✓ | ✓ | ✓ | ✗ |
| ユーザー | R | ✓ | ✓ | ✓ | ✓* |
| ユーザー | U | ✓ | ✓ | ✓ | ✓* |
| ユーザー | D | ✓ | ✓ | ✓ | ✗ |
| ユーザーロール | U | ✓ | ✓ | ✓ | ✗ |

### 3.2 企業・顧客管理

| リソース | アクション | COMPANY_LEADER | MANAGER | TEAM_LEADER | USER |
|---------|-----------|----------------|---------|-------------|------|
| 企業情報 | C | ✓ | ✓ | ✓ | ✓ |
| 企業情報 | R | ✓ | ✓ | ✓ | ✓ |
| 企業情報 | U | ✓ | ✓ | ✓ | ✓† |
| 企業情報 | D | ✓ | ✓ | ✓ | ✗ |
| 企業情報 | A | ✓ | ✓ | ✓ | ✗ |
| 顧客データ | C | ✓ | ✓ | ✓ | ✓ |
| 顧客データ | R | ✓ | ✓ | ✓ | ✓ |
| 顧客データ | U | ✓ | ✓ | ✓ | ✓† |
| 顧客データ | D | ✓ | ✓ | ✓ | ✗ |
| 顧客データ | A | ✓ | ✓ | ✓ | ✗ |

### 3.3 Gmail・メール管理

| リソース | アクション | COMPANY_LEADER | MANAGER | TEAM_LEADER | USER |
|---------|-----------|----------------|---------|-------------|------|
| 個人メール | R | ✓ | ✓ | ✓ | ✓ |
| 共同メール | R | ✓ | ✓ | ✓ | ✗ |
| メール同期設定 | U | ✓ | ✓ | ✓ | ✓ |
| Gmail API設定 | U | ✓ | ✓ | ✓ | ✗ |

### 3.4 TODO・タスク管理

| リソース | アクション | COMPANY_LEADER | MANAGER | TEAM_LEADER | USER |
|---------|-----------|----------------|---------|-------------|------|
| 自分のTODO | C | ✓ | ✓ | ✓ | ✓ |
| 自分のTODO | R | ✓ | ✓ | ✓ | ✓ |
| 自分のTODO | U | ✓ | ✓ | ✓ | ✓ |
| 自分のTODO | D | ✓ | ✓ | ✓ | ✓ |
| 他人のTODO | R | ✓ | ✓ | ✓ | ✓‡ |
| 他人のTODO | U | ✓ | ✓ | ✓ | ✗ |
| 他人のTODO | D | ✓ | ✓ | ✓ | ✗ |
| TODO割り当て | A | ✓ | ✓ | ✓ | ✗ |
| AI抽出TODO承認 | U | ✓ | ✓ | ✓ | ✓† |

### 3.5 商材・契約管理

| リソース | アクション | COMPANY_LEADER | MANAGER | TEAM_LEADER | USER |
|---------|-----------|----------------|---------|-------------|------|
| 商材マスタ | C | ✓ | ✓ | ✓ | ✗ |
| 商材マスタ | R | ✓ | ✓ | ✓ | ✓ |
| 商材マスタ | U | ✓ | ✓ | ✓ | ✗ |
| 商材マスタ | D | ✓ | ✓ | ✓ | ✗ |
| 商材導入状況 | C | ✓ | ✓ | ✓ | ✓† |
| 商材導入状況 | R | ✓ | ✓ | ✓ | ✓ |
| 商材導入状況 | U | ✓ | ✓ | ✓ | ✓† |
| 契約情報 | C | ✓ | ✓ | ✓ | ✓† |
| 契約情報 | R | ✓ | ✓ | ✓ | ✓ |
| 契約情報 | U | ✓ | ✓ | ✓ | ✓† |
| 契約情報 | D | ✓ | ✓ | ✓ | ✗ |

### 3.6 提案管理

| リソース | アクション | COMPANY_LEADER | MANAGER | TEAM_LEADER | USER |
|---------|-----------|----------------|---------|-------------|------|
| 提案作成 | C | ✓ | ✓ | ✓ | ✓† |
| 提案情報 | R | ✓ | ✓ | ✓ | ✓ |
| 提案情報 | U | ✓ | ✓ | ✓ | ✓† |
| 提案情報 | D | ✓ | ✓ | ✓ | ✗ |
| 提案承認 | U | ✓ | ✓ | ✓ | ✗ |

### 3.7 システム管理

| リソース | アクション | COMPANY_LEADER | MANAGER | TEAM_LEADER | USER |
|---------|-----------|----------------|---------|-------------|------|
| システム設定 | R | ✓ | ✓ | ✓ | ✗ |
| システム設定 | U | ✓ | ✓ | ✓ | ✗ |
| ダッシュボード | R | ✓ | ✓ | ✓ | ✓ |
| システムログ | R | ✓ | ✓ | ✓ | ✗ |
| バックアップ | C | ✓ | ✓ | ✓ | ✗ |
| データインポート | C | ✓ | ✓ | ✓ | ✗ |

## 4. 権限条件詳細説明

### 4.1 条件付きアクセス権限

**凡例**：
- ✓: 無条件で許可
- ✗: 禁止
- *: 自分自身のリソースのみ
- †: 担当者として設定されているリソースのみ
- ‡: 同じ企業担当のTODOのみ閲覧可能

### 4.2 担当者権限の詳細

#### 4.2.1 企業・顧客データの担当者権限
```typescript
// 編集権限チェック例
function canEditCompany(userId: string, company: Company): boolean {
  const user = getUserById(userId);
  
  // 上位権限者は常に編集可能
  if (isUpperRole(user.role)) {
    return true;
  }
  
  // 担当者のみ編集可能
  return company.assignedUserId === userId;
}
```

#### 4.2.2 TODO権限の詳細
```typescript
function canViewTodo(userId: string, todo: Todo): boolean {
  const user = getUserById(userId);
  
  // 上位権限者は全TODO閲覧可能
  if (isUpperRole(user.role)) {
    return true;
  }
  
  // 自分のTODO
  if (todo.assignee === userId) {
    return true;
  }
  
  // 担当企業関連のTODO
  if (todo.customerId) {
    const customer = getCustomerById(todo.customerId);
    return customer.assignedUserId === userId;
  }
  
  return false;
}
```

#### 4.2.3 AI抽出TODO承認権限
```typescript
function canApproveAiTodo(userId: string, aiTodo: AIPendingTodo): boolean {
  const user = getUserById(userId);
  
  // 上位権限者は全承認可能
  if (isUpperRole(user.role)) {
    return true;
  }
  
  // 関連企業の担当者のみ承認可能
  const relatedCustomer = getCustomerByEmailId(aiTodo.sourceEmailId);
  return relatedCustomer?.assignedUserId === userId;
}
```

## 5. Gmail アクセス制御の詳細

### 5.1 個人メールアクセス
- **全ユーザー**: 自分のGoogleアカウントで認証したメールにアクセス可能
- **前提条件**: Google OAuth2による個人認証完了

### 5.2 共同メールアクセス
- **上位権限者のみ**: チーム共有メールアカウントにアクセス可能
- **実装方式**: システム管理者が設定した共有Googleアカウントのトークンを使用

### 5.3 メールビュー分離
```typescript
interface EmailViewConfig {
  showPersonalEmails: boolean;
  showSharedEmails: boolean;
  canAccessSharedGmail: boolean;
}

function getEmailViewConfig(userRole: UserRole): EmailViewConfig {
  const isUpper = isUpperRole(userRole);
  
  return {
    showPersonalEmails: true,  // 全ユーザー可能
    showSharedEmails: isUpper, // 上位権限者のみ
    canAccessSharedGmail: isUpper
  };
}
```

## 6. 担当者管理システム

### 6.1 担当者割り当てルール
```typescript
interface AssignmentRules {
  // 担当者設定権限
  canAssignUser: (assignerId: string, targetUserId: string) => boolean;
  
  // 担当者変更権限  
  canReassign: (reassignerId: string, currentAssigneeId: string) => boolean;
  
  // 自動割り当て条件
  autoAssignmentCriteria: AssignmentCriteria[];
}

const assignmentRules: AssignmentRules = {
  canAssignUser: (assignerId) => {
    const assigner = getUserById(assignerId);
    return isUpperRole(assigner.role);
  },
  
  canReassign: (reassignerId, currentAssigneeId) => {
    const reassigner = getUserById(reassignerId);
    return isUpperRole(reassigner.role) || reassignerId === currentAssigneeId;
  },
  
  autoAssignmentCriteria: [
    { type: 'email_history', weight: 0.8 },
    { type: 'territory_mapping', weight: 0.6 },
    { type: 'workload_balance', weight: 0.4 }
  ]
};
```

### 6.2 インポート時の担当者マッピング
```typescript
interface ImportAssignmentStrategy {
  // 1. メール履歴ベース推論
  inferFromEmailHistory: (companyEmail: string) => Promise<string[]>;
  
  // 2. 地域・業界マッピング
  inferFromTerritory: (company: ImportCompanyData) => Promise<string[]>;
  
  // 3. 負荷分散
  balanceWorkload: (candidates: string[]) => Promise<string>;
  
  // 4. 手動確認UI
  presentCandidates: (candidates: string[], confidence: number[]) => void;
}
```

## 7. 内部タスク管理の権限設計

### 7.1 内部タスクの分類と権限
```typescript
enum TaskSourceType {
  EMAIL_EXTRACTED = 'email_extracted',      // メールから自動抽出
  MANUAL_EXTERNAL = 'manual_external',      // 手動作成（対外）
  MANUAL_INTERNAL = 'manual_internal',      // 手動作成（内部）
  EMAIL_FORWARDED = 'email_forwarded'       // メール転送（内部）
}

interface InternalTaskPermission {
  canCreate: boolean;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssignToOthers: boolean;
}

function getInternalTaskPermission(userRole: UserRole): InternalTaskPermission {
  const isUpper = isUpperRole(userRole);
  
  return {
    canCreate: true,              // 全ユーザーが内部タスク作成可能
    canView: true,                // 自分・担当企業関連は閲覧可能
    canEdit: true,                // 自分のタスクは編集可能
    canDelete: isUpper,           // 上位権限者のみ削除可能
    canAssignToOthers: isUpper    // 上位権限者のみ他人への割り当て可能
  };
}
```

### 7.2 メール転送方式の権限制御
```typescript
interface EmailForwardingConfig {
  internalTaskEmailAddress: string;
  allowedForwarders: UserRole[];
  requireApproval: boolean;
  autoExtraction: boolean;
}

const internalTaskConfig: EmailForwardingConfig = {
  internalTaskEmailAddress: 'internal-tasks@company.com',
  allowedForwarders: ['TEAM_LEADER', 'MANAGER', 'COMPANY_LEADER'],
  requireApproval: false,  // 内部タスクは自動承認
  autoExtraction: true     // AI自動抽出有効
};
```

## 8. 実装ガイドライン

### 8.1 ミドルウェア実装例
```typescript
// 担当者権限チェックミドルウェア
export function requireAssigneeOrUpper(resourceType: 'company' | 'customer' | 'todo') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    const resourceId = req.params.id;
    
    // 上位権限者は常に許可
    if (isUpperRole(user.role)) {
      return next();
    }
    
    // 担当者チェック
    const isAssignee = await checkAssignee(user.id, resourceType, resourceId);
    if (!isAssignee) {
      return res.status(403).json({
        error: 'この操作は担当者のみ実行できます',
        code: 'ASSIGNEE_REQUIRED'
      });
    }
    
    next();
  };
}

// Gmail アクセス制御
export function requireGmailAccess(accessType: 'personal' | 'shared') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (accessType === 'shared' && !isUpperRole(user.role)) {
      return res.status(403).json({
        error: '共同メールアクセス権限がありません',
        code: 'SHARED_GMAIL_ACCESS_DENIED'
      });
    }
    
    const hasGmailAuth = await checkGmailAuthentication(user.id);
    if (!hasGmailAuth) {
      return res.status(403).json({
        error: 'Gmail認証が必要です',
        code: 'GMAIL_AUTH_REQUIRED',
        authUrl: '/api/auth/google'
      });
    }
    
    next();
  };
}
```

### 8.2 フロントエンド権限制御
```typescript
// UIコンポーネントでの権限制御
interface PermissionGuardProps {
  requiredRole?: UserRole[];
  requireAssignee?: boolean;
  resourceId?: string;
  children: React.ReactNode;
}

function PermissionGuard({ 
  requiredRole, 
  requireAssignee, 
  resourceId, 
  children 
}: PermissionGuardProps) {
  const { user } = useAuth();
  const { checkAssignee } = usePermissions();
  
  // ロール権限チェック
  if (requiredRole && !requiredRole.includes(user.role)) {
    return null;
  }
  
  // 担当者権限チェック
  if (requireAssignee && resourceId) {
    const isAssignee = checkAssignee(user.id, resourceId);
    if (!isAssignee && !isUpperRole(user.role)) {
      return null;
    }
  }
  
  return <>{children}</>;
}

// 使用例
function CompanyEditButton({ companyId }: { companyId: string }) {
  return (
    <PermissionGuard requireAssignee={true} resourceId={companyId}>
      <Button onClick={() => editCompany(companyId)}>編集</Button>
    </PermissionGuard>
  );
}
```

## 9. セキュリティ監査とログ

### 9.1 監査ログ要件
```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousValue?: any;
  newValue?: any;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

// 重要な監査対象
const auditableActions = [
  'user_role_change',         // ユーザーロール変更
  'assignee_change',          // 担当者変更
  'gmail_auth_grant',         // Gmail認証許可
  'system_settings_change',   // システム設定変更
  'data_export',              // データエクスポート
  'bulk_data_import'          // データ一括インポート
];
```

### 9.2 アクセス制御違反の検知
```typescript
interface SecurityAlert {
  type: 'UNAUTHORIZED_ACCESS' | 'PRIVILEGE_ESCALATION' | 'SUSPICIOUS_ACTIVITY';
  userId: string;
  attemptedAction: string;
  resourceId: string;
  timestamp: Date;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// 自動アラート条件
const alertConditions = [
  {
    condition: 'consecutive_auth_failures',
    threshold: 5,
    timeWindow: '5m',
    riskLevel: 'MEDIUM'
  },
  {
    condition: 'role_escalation_attempt',
    threshold: 1,
    timeWindow: '1m', 
    riskLevel: 'HIGH'
  },
  {
    condition: 'bulk_data_access',
    threshold: 100,
    timeWindow: '10m',
    riskLevel: 'MEDIUM'
  }
];
```

## 10. 運用時の権限管理

### 10.1 権限レビュープロセス
- **月次レビュー**: 担当者割り当ての適切性確認
- **四半期レビュー**: ユーザーロールの見直し
- **年次レビュー**: アクセス制御ポリシー全体の見直し

### 10.2 権限変更の承認フロー
```typescript
interface PermissionChangeRequest {
  requesterId: string;
  targetUserId: string;
  changeType: 'ROLE_CHANGE' | 'ASSIGNEE_CHANGE' | 'ACCESS_GRANT';
  requestedChange: any;
  justification: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approverId?: string;
  approvalDate?: Date;
}
```

### 10.3 緊急時のアクセス制御
- **緊急アクセス**: 一時的な権限昇格手順
- **アカウントロック**: セキュリティ侵害時の即座のアクセス遮断
- **監査証跡**: 緊急時対応の完全な記録保持