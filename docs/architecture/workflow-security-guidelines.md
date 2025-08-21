# 最強タスク管理ツール - セキュリティガイドライン

## 🔐 セキュリティ設計原則

**設計日**: 2025-07-30  
**設計者**: ★4 アーキテクチャデザイナー

### 核心セキュリティ原則
1. **多層防御**: 認証・認可・データ暗号化・監査の4層防御
2. **最小権限原則**: 必要最小限の権限のみ付与
3. **データ主権**: ユーザーが自分のデータを完全制御
4. **透明性**: セキュリティ関連の全操作をユーザーに通知

## 🏗️ データ分離アーキテクチャ

### 1. 企業間完全分離 (Multi-Tenancy)

#### データベース分離設計
```sql
-- 全テーブルでcompanyId必須
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,  -- 必須: 企業分離
  user_id UUID,              -- オプション: 個人ワークフロー
  name VARCHAR(255) NOT NULL,
  -- ... 他のフィールド
  CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Row Level Security (RLS) 適用
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- 企業分離ポリシー
CREATE POLICY company_isolation ON workflow_templates
  FOR ALL TO authenticated
  USING (company_id = current_setting('app.current_company_id')::UUID);
```

#### アプリケーションレベル分離
```typescript
// 全てのデータアクセスでcompanyIdフィルタ必須
class WorkflowService {
  async getWorkflowTemplates(companyId: ID, userId?: ID): Promise<WorkflowTemplate[]> {
    // companyIdでの絞り込みを必ず実行
    const query = `
      SELECT * FROM workflow_templates 
      WHERE company_id = $1 
      ${userId ? 'AND (user_id = $2 OR user_id IS NULL)' : ''}
    `;
    return await db.query(query, [companyId, userId]);
  }
}
```

### 2. ユーザーレベルプライバシー保護

#### 個人ワークフロー完全分離
```typescript
interface PersonalWorkflowAccess {
  // 個人ワークフローは作成者以外アクセス不可
  canAccess(userId: ID, workflowOwnerId: ID): boolean {
    return userId === workflowOwnerId;
  }
  
  // 企業管理者でも個人ワークフロー変更不可
  canModify(userRole: UserRole, workflowScope: string): boolean {
    if (workflowScope === 'PERSONAL') {
      return false; // いかなる権限でも個人ワークフロー変更不可
    }
    return checkRolePermission(userRole);
  }
}
```

#### プライバシー設定管理
```typescript
export interface PrivacySettings {
  sharePersonalTemplates: boolean;      // 個人テンプレート共有許可
  allowWorkflowSuggestions: boolean;    // ワークフロー提案受信許可
  visibleToTeam: boolean;               // チームからの可視性
  statisticsParticipation: boolean;     // 統計データ提供許可
  dataRetentionPeriod: number;          // データ保持期間（日）
}

class PrivacyService {
  async updatePrivacySettings(userId: ID, settings: PrivacySettings): Promise<void> {
    // プライバシー設定は本人のみ変更可能
    await this.validateUserOwnership(userId);
    await this.auditPrivacyChange(userId, settings);
    await db.updatePrivacySettings(userId, settings);
  }
}
```

### 3. 権限継承制限システム

#### 権限継承ルール
```typescript
class PermissionInheritance {
  // 個人データは権限継承を受けない
  canInheritPermission(targetScope: string, userRole: UserRole): boolean {
    if (targetScope === 'PERSONAL') {
      return false; // 個人スコープは継承拒否
    }
    
    const inheritanceRules = {
      'TEAM': [UserRole.TEAM_LEADER, UserRole.MANAGER, UserRole.COMPANY_LEADER],
      'DEPARTMENT': [UserRole.MANAGER, UserRole.COMPANY_LEADER],
      'COMPANY': [UserRole.COMPANY_LEADER]
    };
    
    return inheritanceRules[targetScope]?.includes(userRole) || false;
  }
}
```

## 🛡️ 認証・認可システム

### 1. JWT 拡張設計

#### ワークフロー専用ペイロード
```typescript
interface WorkflowJWTPayload extends JWTPayload {
  // 基本情報
  userId: ID;
  companyId: ID;
  role: UserRole;
  
  // ワークフロー専用権限
  workflowPermissions: WorkflowPermission[];
  workflowScopes: ('PERSONAL' | 'TEAM' | 'DEPARTMENT' | 'COMPANY')[];
  
  // 組織情報
  teamIds: ID[];
  departmentIds: ID[];
  
  // セキュリティ情報
  sessionId: string;
  ipAddress: string;
  deviceFingerprint: string;
  
  // 有効期限管理
  workflowTokenExpiry: number;
  refreshThreshold: number;
}
```

#### トークン検証ミドルウェア
```typescript
export const workflowAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. JWT基本検証
    const token = extractJWTToken(req);
    const payload = await verifyJWT(token) as WorkflowJWTPayload;
    
    // 2. セッション有効性確認
    await validateSession(payload.sessionId);
    
    // 3. デバイス指紋確認
    await validateDeviceFingerprint(req, payload.deviceFingerprint);
    
    // 4. ワークフロー権限確認
    req.workflowAuth = {
      userId: payload.userId,
      companyId: payload.companyId,
      permissions: payload.workflowPermissions,
      scopes: payload.workflowScopes
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'ワークフロー認証に失敗しました' });
  }
};
```

### 2. 動的権限チェックシステム

#### リアルタイム権限検証
```typescript
class DynamicPermissionChecker {
  async checkPermission(
    userId: ID,
    action: WorkflowPermission,
    resource: WorkflowResource,
    context: PermissionContext
  ): Promise<PermissionResult> {
    
    // 1. 基本権限チェック
    const basePermission = await this.checkBasePermission(userId, action);
    if (!basePermission.allowed) {
      return { allowed: false, reason: basePermission.reason };
    }
    
    // 2. リソース固有権限チェック
    const resourcePermission = await this.checkResourcePermission(userId, resource);
    if (!resourcePermission.allowed) {
      return { allowed: false, reason: resourcePermission.reason };
    }
    
    // 3. コンテキスト権限チェック（時間帯・IP制限等）
    const contextPermission = await this.checkContextPermission(context);
    if (!contextPermission.allowed) {
      return { allowed: false, reason: contextPermission.reason };
    }
    
    // 4. 動的制約チェック（同時編集・ロック状態等）
    const dynamicPermission = await this.checkDynamicConstraints(resource);
    
    return dynamicPermission;
  }
}
```

## 📊 監査・ログシステム

### 1. 包括的監査ログ

#### 監査対象操作
```typescript
enum AuditableWorkflowAction {
  // ワークフロー操作
  WORKFLOW_CREATED = 'workflow_created',
  WORKFLOW_UPDATED = 'workflow_updated',
  WORKFLOW_DELETED = 'workflow_deleted',
  WORKFLOW_APPLIED = 'workflow_applied',
  
  // ステータス遷移
  STATUS_CHANGED = 'status_changed',
  APPROVAL_REQUESTED = 'approval_requested',
  APPROVAL_GRANTED = 'approval_granted',
  APPROVAL_DENIED = 'approval_denied',
  
  // 権限変更
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_REVOKED = 'permission_revoked',
  EMERGENCY_OVERRIDE = 'emergency_override',
  
  // プライバシー操作  
  PRIVACY_SETTINGS_CHANGED = 'privacy_settings_changed',
  DATA_EXPORT_REQUESTED = 'data_export_requested',
  DATA_DELETION_REQUESTED = 'data_deletion_requested'
}

interface WorkflowAuditLog {
  id: UUID;
  userId: ID;
  companyId: ID;
  action: AuditableWorkflowAction;
  resourceType: string;
  resourceId: ID;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  reason?: string;           // 緊急操作時の理由
  approvedBy?: ID;          // 承認者
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
```

#### 監査ログ記録システム
```typescript
class WorkflowAuditService {
  async recordAuditLog(
    userId: ID,
    action: AuditableWorkflowAction,
    resource: { type: string; id: ID },
    details: AuditDetails,
    request: Request
  ): Promise<void> {
    
    const auditLog: WorkflowAuditLog = {
      id: generateUUID(),
      userId,
      companyId: details.companyId,
      action,
      resourceType: resource.type,
      resourceId: resource.id,
      oldValue: details.oldValue,
      newValue: details.newValue,
      ipAddress: this.extractIP(request),
      userAgent: request.headers['user-agent'],
      sessionId: details.sessionId,
      reason: details.reason,
      approvedBy: details.approvedBy,
      timestamp: new Date(),
      severity: this.calculateSeverity(action, resource)
    };
    
    // 複数保存先への並行書き込み
    await Promise.all([
      this.writeToDatabase(auditLog),
      this.writeToSecurityLog(auditLog),
      this.writeToComplianceLog(auditLog)
    ]);
    
    // 重要操作は即座にアラート
    if (auditLog.severity === 'CRITICAL') {
      await this.sendSecurityAlert(auditLog);
    }
  }
}
```

### 2. リアルタイム異常検知

#### 異常行動パターン検知
```typescript
class SecurityAnomalyDetector {
  async detectAnomalies(userId: ID, action: AuditableWorkflowAction): Promise<AnomalyReport[]> {
    const anomalies: AnomalyReport[] = [];
    
    // 1. 大量操作検知
    const bulkOperations = await this.detectBulkOperations(userId, action);
    if (bulkOperations.isAnomalous) {
      anomalies.push({
        type: 'BULK_OPERATIONS',
        severity: 'HIGH',
        description: `ユーザーが短時間で${bulkOperations.count}回の操作を実行`
      });
    }
    
    // 2. 異常時間帯アクセス
    const timeAnomaly = await this.detectTimeAnomaly(userId);
    if (timeAnomaly.isAnomalous) {
      anomalies.push({
        type: 'UNUSUAL_TIME_ACCESS',
        severity: 'MEDIUM',
        description: `通常の業務時間外（${timeAnomaly.time}）でのアクセス`
      });
    }
    
    // 3. 権限昇格試行
    const privilegeEscalation = await this.detectPrivilegeEscalation(userId, action);
    if (privilegeEscalation.isAnomalous) {
      anomalies.push({
        type: 'PRIVILEGE_ESCALATION',
        severity: 'CRITICAL',
        description: '許可されていない高権限操作の試行'
      });
    }
    
    return anomalies;
  }
}
```

## 🔒 データ暗号化・保護

### 1. 保存データ暗号化

#### 機密度別暗号化レベル
```typescript
enum DataSensitivityLevel {
  PUBLIC = 'public',           // 暗号化なし
  INTERNAL = 'internal',       // AES-256暗号化
  CONFIDENTIAL = 'confidential', // AES-256 + キー分離
  RESTRICTED = 'restricted'    // AES-256 + HSM + キー分割
}

class WorkflowDataProtection {
  async encryptWorkflowData(
    data: any,
    sensitivityLevel: DataSensitivityLevel,
    companyId: ID
  ): Promise<EncryptedData> {
    
    switch (sensitivityLevel) {
      case DataSensitivityLevel.RESTRICTED:
        // 個人ワークフロー: 最高レベル暗号化
        return await this.restrictedEncryption(data, companyId);
        
      case DataSensitivityLevel.CONFIDENTIAL:
        // 企業ワークフロー: 高レベル暗号化
        return await this.confidentialEncryption(data, companyId);
        
      case DataSensitivityLevel.INTERNAL:
        // チームワークフロー: 標準暗号化
        return await this.internalEncryption(data, companyId);
        
      default:
        // 公開ワークフロー: 暗号化なし
        return { data, encrypted: false };
    }
  }
}
```

### 2. 通信暗号化

#### API通信セキュリティ
```typescript
// HTTPS必須 + 証明書ピニング
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'HTTPS required' });
  }
  
  // セキュリティヘッダー設定
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
});

// API通信暗号化ミドルウェア
app.use('/api/workflows', (req, res, next) => {
  // リクエスト暗号化検証
  if (req.method !== 'GET' && !req.headers['x-encrypted-payload']) {
    return res.status(400).json({ error: 'Encrypted payload required' });
  }
  next();
});
```

## 🚨 インシデント対応

### 1. セキュリティインシデント分類

#### インシデントレベル定義
```typescript
enum SecurityIncidentLevel {
  INFO = 'info',           // 情報: 通常の操作記録
  LOW = 'low',             // 低: 軽微な異常（失敗したログイン等）
  MEDIUM = 'medium',       // 中: 権限外アクセス試行
  HIGH = 'high',           // 高: データ漏洩の可能性
  CRITICAL = 'critical'    // 緊急: システム侵害確認
}

class SecurityIncidentHandler {
  async handleIncident(incident: SecurityIncident): Promise<void> {
    switch (incident.level) {
      case SecurityIncidentLevel.CRITICAL:
        // 即座にシステム管理者通知 + 一時サービス停止検討
        await this.notifySecurityTeam(incident);
        await this.considerServiceSuspension(incident);
        break;
        
      case SecurityIncidentLevel.HIGH:
        // セキュリティチーム通知 + 詳細調査開始
        await this.notifySecurityTeam(incident);
        await this.startDetailedInvestigation(incident);
        break;
        
      case SecurityIncidentLevel.MEDIUM:
        // 自動対処 + 管理者通知
        await this.autoMitigation(incident);
        await this.notifyAdministrator(incident);
        break;
    }
  }
}
```

### 2. 自動対処システム

#### 異常検知時の自動対応
```typescript
class AutomatedResponse {
  async respondToAnomaly(anomaly: AnomalyReport, userId: ID): Promise<void> {
    switch (anomaly.type) {
      case 'BULK_OPERATIONS':
        // 一時的にAPI制限強化
        await this.increaseRateLimit(userId, 60000); // 1分間制限
        break;
        
      case 'PRIVILEGE_ESCALATION':
        // セッション即座に無効化
        await this.invalidateUserSessions(userId);
        await this.requireReauthentication(userId);
        break;
        
      case 'DATA_EXFILTRATION_ATTEMPT':
        // 該当ユーザーのダウンロード権限を一時停止
        await this.suspendDownloadPermissions(userId);
        await this.alertSecurityTeam(userId, anomaly);
        break;
    }
  }
}
```

## 📋 セキュリティチェックリスト

### 実装時必須チェック項目

#### ✅ 認証・認可
- [ ] JWT署名検証の実装
- [ ] 権限チェックミドルウェアの適用
- [ ] セッション管理の実装
- [ ] デバイス指紋認証の実装

#### ✅ データ保護
- [ ] companyId必須フィルタの実装
- [ ] 個人データアクセス制限の実装
- [ ] データ暗号化の実装
- [ ] バックアップデータの暗号化

#### ✅ 監査・ログ
- [ ] 全操作の監査ログ記録
- [ ] 異常検知システムの実装
- [ ] セキュリティアラートの実装
- [ ] インシデント対応手順の準備

#### ✅ 通信セキュリティ
- [ ] HTTPS必須化
- [ ] セキュリティヘッダーの設定
- [ ] API暗号化の実装
- [ ] 証明書ピニングの実装

---

**次フェーズ**: ★8バックエンド実装エージェントは、このセキュリティガイドラインに基づいてワークフロー管理APIを実装してください。