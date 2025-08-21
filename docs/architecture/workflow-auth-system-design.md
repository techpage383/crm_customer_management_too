# 最強タスク管理ツール - ワークフロー認証システム設計書

## 🎯 設計概要

**プロジェクト**: 最強タスク管理ツール  
**設計対象**: ワークフロー管理システムの認証・認可アーキテクチャ  
**設計思想**: 最大限のカスタマイズ自由度を保ちつつ、共有タスクでは適切な承認制御を実装

## 🔐 認証・認可の基本原則

### 1. カスタマイズ自由度の最大化
- **個人ワークフロー**: 完全に自由なカスタマイズを許可
- **工数テンプレート**: 個人レベルでの自由な作成・編集を保証
- **ステータス定義**: 個人利用では制限なし

### 2. 共有タスクでの適切な制御
- **プロジェクトタスク**: 共同メンバーが存在する場合は承認制を適用
- **企業レベル設定**: 上位権限による統制を維持
- **データ分離**: 企業間・ユーザー間の完全分離

### 3. 階層的権限構造
```
COMPANY_LEADER (企業統括者)
├── MANAGER (管理職) 
├── TEAM_LEADER (チームリーダー)
└── USER (一般ユーザー)
```

## 🏗️ ワークフロー権限アーキテクチャ

### 個人ワークフロー権限（最大自由度）

| 操作対象 | USER | TEAM_LEADER | MANAGER | COMPANY_LEADER |
|---------|------|-------------|---------|----------------|
| 個人ワークフロー作成 | ✅ 無制限 | ✅ 無制限 | ✅ 無制限 | ✅ 無制限 |
| 個人ステータス定義 | ✅ 無制限 | ✅ 無制限 | ✅ 無制限 | ✅ 無制限 |
| 個人工数テンプレート | ✅ 無制限 | ✅ 無制限 | ✅ 無制限 | ✅ 無制限 |
| 個人ワークフロー削除 | ✅ 自分のみ | ✅ 自分のみ | ✅ 自分のみ | ✅ 自分のみ |

### プロジェクトワークフロー権限（承認制適用）

| 操作対象 | USER | TEAM_LEADER | MANAGER | COMPANY_LEADER |
|---------|------|-------------|---------|----------------|
| プロジェクトワークフロー作成 | 🔒 承認必要 | ✅ 直接可能 | ✅ 直接可能 | ✅ 直接可能 |
| 共有ステータス変更 | 🔒 承認必要 | ✅ チーム内承認 | ✅ 部門内承認 | ✅ 全社承認 |
| 承認フロー設定 | ❌ 不可 | ✅ チーム内 | ✅ 部門内 | ✅ 全社 |
| プロジェクト工数設定 | 🔒 提案のみ | ✅ チーム承認 | ✅ 部門承認 | ✅ 全社承認 |

### 企業レベルワークフロー権限

| 操作対象 | USER | TEAM_LEADER | MANAGER | COMPANY_LEADER |
|---------|------|-------------|---------|----------------|
| 企業ワークフローテンプレート作成 | ❌ 閲覧のみ | ❌ 閲覧のみ | ✅ 作成可能 | ✅ 作成可能 |
| 企業標準ステータス定義 | ❌ 閲覧のみ | 🔒 提案のみ | ✅ 作成可能 | ✅ 作成可能 |
| 企業工数テンプレート管理 | ❌ 閲覧のみ | 🔒 提案のみ | ✅ 管理可能 | ✅ 管理可能 |
| 全社ワークフロー適用 | ❌ 不可 | ❌ 不可 | ❌ 不可 | ✅ 可能 |

## 🔄 ワークフロー承認システム設計

### 1. 承認フロー定義

```typescript
interface WorkflowApprovalFlow {
  workflowId: ID;
  approvalType: 'STATUS_TRANSITION' | 'WORKFLOW_CHANGE' | 'TEMPLATE_UPDATE';
  requiredApprovers: UserRole[];
  currentApprovers: ID[];
  approvalStatus: 'PENDING' | 'PARTIAL' | 'APPROVED' | 'REJECTED';
  approvalSteps: ApprovalStep[];
}

interface ApprovalStep {
  stepOrder: number;
  requiredRole: UserRole;
  assignedUsers?: ID[];
  approvedBy?: ID;
  approvedAt?: Date;
  rejectedBy?: ID;
  rejectedAt?: Date;
  comments?: string;
}
```

### 2. 承認が必要なケース

#### プロジェクトタスクでの承認要件
- **共同メンバーが存在**: 必ず承認フローを適用
- **ステータス遷移**: 承認権限者の確認が必要
- **ワークフロー変更**: プロジェクト責任者の承認が必要

#### 承認権限者の自動判定
```typescript
function determineApprovers(
  task: Todo, 
  currentUser: User, 
  operation: WorkflowOperation
): UserRole[] {
  if (task.type === 'PERSONAL') {
    return []; // 個人タスクは承認不要
  }
  
  if (task.sharedMembers && task.sharedMembers.length > 0) {
    // 共同タスクの場合
    const projectLeaders = task.sharedMembers.filter(u => 
      u.role === UserRole.TEAM_LEADER || 
      u.role === UserRole.MANAGER ||
      u.role === UserRole.COMPANY_LEADER
    );
    
    return projectLeaders.length > 0 
      ? [getHighestRole(projectLeaders)]
      : [UserRole.TEAM_LEADER]; // デフォルト承認権限
  }
  
  return [];
}
```

## 🗃️ データ分離アーキテクチャ

### 1. 企業レベルデータ分離

```typescript
interface WorkflowTemplate {
  id: ID;
  companyId: ID; // 企業分離の要
  name: string;
  type: WorkflowType;
  scope: 'PERSONAL' | 'TEAM' | 'COMPANY';
  createdBy: ID;
  isPublic: boolean;
  accessControl: WorkflowAccessControl;
}

interface WorkflowAccessControl {
  allowedRoles: UserRole[];
  allowedUsers?: ID[];
  allowedDepartments?: string[];
  inheritanceLevel: 'NONE' | 'TEAM' | 'DEPARTMENT' | 'COMPANY';
}
```

### 2. ユーザープライバシー保護

```typescript
interface UserWorkflowSettings {
  userId: ID;
  companyId: ID;
  personalWorkflows: WorkflowTemplate[]; // 完全プライベート
  sharedWorkflows: ID[]; // 共有ワークフローへの参照のみ
  customStatuses: WorkflowStatus[]; // 個人カスタムステータス
  effortTemplates: EffortTemplate[]; // 個人工数テンプレート
  privacySettings: {
    sharePersonalTemplates: boolean;
    allowWorkflowSuggestions: boolean;
    visibleToTeam: boolean;
  };
}
```

## 📊 ワークフロー操作権限マトリックス

### ステータス遷移権限

| 遷移パターン | 個人タスク | 共有タスク | 承認要件 |
|------------|----------|----------|---------|
| TODO → IN_PROGRESS | ✅ 自由 | ✅ 自由 | なし |
| IN_PROGRESS → APPROVAL_WAITING | ✅ 自由 | 🔒 承認必要 | 上位権限者 |
| APPROVAL_WAITING → APPROVED | ❌ 不可 | 🔒 承認者のみ | 承認権限必要 |
| APPROVED → DONE | ✅ 自由 | ✅ 自由 | なし |
| ANY → CLIENT_REVIEW | ✅ 自由 | 🔒 担当者のみ | 担当者権限 |
| CLIENT_REVIEW → CLIENT_APPROVED | ❌ クライアント | 🔒 承認フロー | 特別権限 |

### カスタムステータス権限

| ステータス作成レベル | USER | TEAM_LEADER | MANAGER | COMPANY_LEADER |
|-------------------|------|-------------|---------|----------------|
| 個人カスタムステータス | ✅ 無制限 | ✅ 無制限 | ✅ 無制限 | ✅ 無制限 |
| チームカスタムステータス | 🔒 提案のみ | ✅ 作成可能 | ✅ 作成可能 | ✅ 作成可能 |
| 部門カスタムステータス | ❌ 不可 | 🔒 提案のみ | ✅ 作成可能 | ✅ 作成可能 |
| 企業カスタムステータス | ❌ 不可 | ❌ 不可 | 🔒 提案のみ | ✅ 作成可能 |

## 🔒 セキュリティ実装方針

### 1. JWT認証の拡張

```typescript
interface WorkflowJWTPayload extends JWTPayload {
  userId: ID;
  companyId: ID;
  role: UserRole;
  workflowPermissions: {
    canCreateCompanyWorkflows: boolean;
    canApproveTransitions: boolean;
    canManageTeamWorkflows: boolean;
    maxCustomStatuses: number; // -1 = 無制限
  };
  departmentId?: ID;
  teamIds: ID[];
}
```

### 2. API認可ミドルウェア

```typescript
export const workflowAuthMiddleware = (
  requiredPermission: WorkflowPermission,
  scope: 'PERSONAL' | 'TEAM' | 'COMPANY' = 'PERSONAL'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    const workflowPermissions = calculateWorkflowPermissions(user, scope);
    
    if (!workflowPermissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: '権限が不足しています',
        requiredPermission,
        userRole: user.role
      });
    }
    
    next();
  };
};
```

### 3. データアクセス制御

```typescript
export class WorkflowSecurityService {
  static async canAccessWorkflow(
    userId: ID, 
    workflowId: ID
  ): Promise<boolean> {
    const workflow = await WorkflowTemplate.findById(workflowId);
    const user = await User.findById(userId);
    
    // 企業分離チェック
    if (workflow.companyId !== user.companyId) {
      return false;
    }
    
    // スコープ別アクセス制御
    switch (workflow.scope) {
      case 'PERSONAL':
        return workflow.createdBy === userId;
      case 'TEAM':
        return this.isSameTeam(user, workflow);
      case 'COMPANY':
        return this.hasCompanyAccess(user, workflow);
      default:
        return false;
    }
  }
}
```

## 🚀 実装優先順位

### フェーズ1: 基礎認証システム（即座に実装）
1. JWT拡張（ワークフロー権限追加）
2. 基本的なワークフロー操作権限
3. 企業・ユーザーデータ分離

### フェーズ2: 承認システム（フェーズ1後）
1. 承認フロー定義システム
2. ステータス遷移承認機能
3. 通知システム連携

### フェーズ3: 高度なカスタマイズ（フェーズ2後）
1. カスタムステータス権限管理
2. 工数テンプレート承認システム
3. 企業レベルワークフロー統制

## 📋 設計原則の確認

### ✅ カスタマイズ自由度
- 個人レベルでの完全な自由度を保証
- 工数テンプレートの制限なし作成
- 個人ワークフローの無制限カスタマイズ

### ✅ 適切な承認制御
- 共有タスクでの承認フロー
- 上位権限による適切な統制
- 企業レベル設定の保護

### ✅ データ分離とセキュリティ
- 企業間の完全分離
- ユーザープライバシーの保護
- 役割ベースアクセス制御

---

**作成日**: 2025-07-29  
**作成者**: ★4認証システムアーキテクター  
**レビュー**: 要・★8バックエンド実装エージェント確認