/**
 * ===== 型定義同期ガイドライン =====
 * 型ファイルは下記2つの同期された型ファイルが存在します。  
 *  - **フロントエンド**: `frontend/src/types/index.ts`
 *　 - **バックエンド**: `backend/src/types/index.ts`
 * 【基本原則】この/types/index.tsを更新したら、もう一方の/types/index.tsも必ず同じ内容に更新する
 * 
 * 【変更の責任】
 * - 型定義を変更した開発者は、両方のファイルを即座に同期させる責任を持つ
 * - 1つのtypes/index.tsの更新は禁止。必ず1つを更新したらもう一つも更新その場で行う
 * 
 * 【絶対に守るべき原則】
 * 1. フロントエンドとバックエンドで異なる型を作らない
 * 2. 同じデータ構造に対して複数の型を作らない
 * 3. 新しいプロパティは必ずオプショナルとして追加
 * 4. APIパスは必ずこのファイルで一元管理する
 * 5. コード内でAPIパスをハードコードしない
 * 6. 2つの同期されたtypes/index.tsを単一の真実源とする
 * 7. パスパラメータを含むエンドポイントは関数として提供する
 */

// ========== 基本型定義 ==========
export type ID = string;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta | Record<string, any>;
}

// ページネーション用レスポンス
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PaginatedApiResponse<T> = ApiResponse<PaginatedResponse<T>>;

// ========== 認証・ユーザー関連 ==========
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

export interface UserBase {
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive?: boolean;
  department?: string;
  phoneNumber?: string;
  gmailPersonalConnected?: boolean;        // 個人Gmail連携状態
  gmailPersonalAccessToken?: string;       // 個人Gmailトークン（暗号化）
  gmailPersonalRefreshToken?: string;      // 個人Gmailリフレッシュトークン（暗号化）
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
}

export interface UserCreate extends UserBase {
  password: string;
}

export interface UserUpdate extends Partial<UserBase> {
  password?: string;
}

export interface User extends UserBase, Timestamps {
  id: ID;
  gmailSyncStatus?: GmailSyncStatus;
  assignedCompanies?: Company[];
  assignedTodos?: Todo[];
}

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

// ========== ユーザー管理関連 ==========
export interface UserSearchRequest {
  query?: string;
  role?: UserRole[];
  isActive?: boolean;
  department?: string;
  gmailConnected?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'fullName' | 'email' | 'role' | 'lastLoginAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserSearchResponse {
  users: User[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStatsResponse {
  totalUsers: number;
  activeUsers: number;
  gmailConnectedUsers: number;
  usersByRole: {
    [key in UserRole]: number;
  };
  recentlyActiveUsers: number;
  lastMonthNewUsers: number;
}

export interface UserActivityLog {
  id: ID;
  userId: ID;
  action: 'LOGIN' | 'LOGOUT' | 'PROFILE_UPDATE' | 'PASSWORD_CHANGE' | 'ROLE_CHANGE' | 'STATUS_CHANGE' | 'GMAIL_CONNECT' | 'GMAIL_DISCONNECT';
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  performedBy?: ID;
}

export interface UserPermissions {
  canManageUsers: boolean;
  canManageCompanies: boolean;
  canManageContracts: boolean;
  canAccessReports: boolean;
  canExportData: boolean;
  canImportData: boolean;
  canManageSystem: boolean;
  canViewAuditLogs: boolean;
}

export interface BulkUserUpdateRequest {
  userIds: ID[];
  updates: {
    role?: UserRole;
    isActive?: boolean;
    department?: string;
  };
}

export interface BulkUserUpdateResponse {
  successCount: number;
  errorCount: number;
  errors?: {
    userId: ID;
    error: string;
  }[];
}

export interface UserStatusUpdateRequest {
  isActive: boolean;
  reason?: string;
}

// ========== 企業（顧客）関連 ==========
export enum CompanyStatus {
  LEAD = 'lead',              // リード
  PROSPECT = 'prospect',       // 見込み客
  ACTIVE_CUSTOMER = 'active_customer',  // 既存顧客
  INACTIVE = 'inactive'       // 休眠
}

export enum CompanySize {
  LARGE = 'large',           // 大企業
  MEDIUM = 'medium',         // 中企業
  SMALL = 'small'            // 小企業
}

export enum IndustryType {
  IT = 'it',
  MANUFACTURING = 'manufacturing',
  RETAIL = 'retail',
  FINANCE = 'finance',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  REAL_ESTATE = 'real_estate',
  OTHER = 'other'
}

export interface CompanyBase {
  name: string;
  nameKana?: string;
  industry: string;
  status: CompanyStatus;
  size: CompanySize;
  employeeCount?: number;
  capital?: number;
  establishedYear?: number;
  description?: string;
  website?: string;
  phone?: string;
  fax?: string;
  address?: {
    prefecture: string;
    city: string;
    address1: string;
    address2?: string;
    postalCode: string;
  };
  tags?: string[];
  customFields?: Record<string, any>;
  lastContactAt?: Date;
  nextFollowUpAt?: Date;
  primaryAssigneeId: ID;           // 主担当者（権限を持つ）
  secondaryAssigneeIds?: ID[];      // 副担当者（閲覧のみ）
}

export interface CompanyCreate extends CompanyBase {}

export interface CompanyUpdate extends Partial<CompanyBase> {}

export interface Company extends CompanyBase, Timestamps {
  id: ID;
  primaryAssignee?: User;           // 主担当者の詳細
  secondaryAssignees?: User[];      // 副担当者の詳細
  contacts?: Contact[];
  emailThreads?: EmailThread[];
  todos?: Todo[];
  contracts?: Contract[];
  proposals?: Proposal[];
  deployments?: Deployment[];
}

// 企業検索リクエスト
export interface CompanySearchRequest extends PaginationParams {
  query?: string;
  status?: CompanyStatus[];
  size?: CompanySize[];
  industry?: string[];
  assigneeId?: string[];
}

// 企業検索レスポンス
export interface CompanySearchResponse {
  companies: Company[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========== 連絡先関連 ==========
export enum ContactType {
  DECISION_MAKER = 'decision_maker',    // 決裁者
  TECHNICAL = 'technical',              // 技術担当
  WINDOW = 'window',                    // 窓口担当
  OTHER = 'other'                       // その他
}

export enum ContactRelationshipLevel {
  CLOSE = 'close',                      // 良好
  GOOD = 'good',                        // 普通
  NEUTRAL = 'neutral',                  // 中立
  DIFFICULT = 'difficult'               // 困難
}

export interface ContactBase {
  companyId: ID;
  fullName: string;
  fullNameKana?: string;
  type: ContactType;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  relationshipLevel: ContactRelationshipLevel;
  isDecisionMaker: boolean;
  lastContactAt?: Date;
  notes?: string;
}

export interface ContactCreate extends ContactBase {}

export interface ContactUpdate extends Partial<ContactBase> {}

export interface Contact extends ContactBase, Timestamps {
  id: ID;
  company?: Company;
}

// ========== Gmail連携関連 ==========
export enum GmailSyncStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  SYNCING = 'syncing',
  ERROR = 'error'
}

export interface EmailThreadBase {
  threadGmailId: string;
  subject: string;
  snippet: string;
  companyId?: ID;
  lastMessageDate: Date;
  messageCount: number;
  hasAttachment?: boolean;
  isRead?: boolean;
  isStarred?: boolean;
  labels?: string[];
}

export interface EmailThreadCreate extends EmailThreadBase {
  userId: ID;
}

export interface EmailThreadUpdate extends Partial<EmailThreadBase> {}

// P-003 Gmailログページ用高度検索パラメータ
export interface EmailThreadSearchParams {
  companyId?: ID;
  isRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  sender?: string;
  subject?: string;
  hasAttachments?: boolean;
  labels?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'receivedAt' | 'subject' | 'sender' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface EmailThread extends EmailThreadBase, Timestamps {
  id: ID;
  user?: User;
  company?: Company;
  messages?: EmailMessage[];
  extractedTodos?: Todo[];
}

export interface EmailMessageBase {
  threadId: ID;
  messageGmailId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  sentAt: Date;
  isInbound: boolean;
  hasAttachment?: boolean;
  attachments?: EmailAttachment[];
  aiAnalysis?: {
    summary?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    actionItems?: string[];
    priority?: 'high' | 'medium' | 'low';
  };
}

export interface EmailMessageCreate extends EmailMessageBase {}

export interface EmailMessageUpdate extends Partial<EmailMessageBase> {}

export interface EmailMessage extends EmailMessageBase, Timestamps {
  id: ID;
  thread?: EmailThread;
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  url?: string;
}

// 共有Gmail アカウント
export interface SharedGmailAccount {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  allowedRoles: UserRole[];
  accessToken?: string;
  refreshToken?: string;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ========== TODO関連 ==========
export enum TodoStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  // ワークフロー対応の拡張ステータス
  APPROVAL_WAITING = 'approval_waiting',       // 承認待ち
  APPROVED = 'approved',                       // 承認済み
  CLIENT_REVIEW = 'client_review',             // 顧客確認中
  FEEDBACK_PENDING = 'feedback_pending',       // フィードバック対応中
  WAITING = 'waiting',                         // 待機中（その他）
  CUSTOM = 'custom'                           // カスタムステータス
}

export enum TodoPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum TodoSource {
  MANUAL = 'manual',
  AI_EXTRACTED = 'ai_extracted',
  EMAIL_FOLLOW_UP = 'email_follow_up',
  EMAIL_FORWARDED = 'email_forwarded',    // 内部タスク用メール転送
  INTERNAL_REQUEST = 'internal_request'    // 社内依頼
}

// TODO検索リクエスト
export interface TodoSearchRequest extends PaginationParams {
  query?: string;
  status?: TodoStatus[];
  priority?: TodoPriority[];
  assigneeId?: string[];
  companyId?: string;
  source?: TodoSource[];
  isInternal?: boolean;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  completedDateFrom?: Date;
  completedDateTo?: Date;
  tags?: string[];
  workflowId?: string;
  customStatus?: string;
}

export interface TodoBase {
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: Date;
  companyId?: ID;
  primaryAssigneeId: ID;                   // 主担当者に統一
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
  isApproved?: boolean;
  approvedBy?: ID;
  approvedAt?: Date;
  completedAt?: Date;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  // ワークフロー関連フィールド
  workflowId?: string;                     // 使用ワークフロー
  customStatus?: string;                   // カスタムステータス名
  effortTemplateId?: string;               // 使用工数テンプレート
  statusHistory?: {
    fromStatus: TodoStatus;
    toStatus: TodoStatus;
    changedAt: Date;
    changedBy: ID;
    reason?: string;
  }[];
}

export interface TodoCreate extends TodoBase {}

export interface TodoUpdate extends Partial<TodoBase> {}

export interface Todo extends TodoBase, Timestamps {
  id: ID;
  company?: Company;
  primaryAssignee?: User;
  emailThread?: EmailThread;
  approver?: User;
}

// ========== 商材関連 ==========
export enum ProductCategory {
  SOFTWARE = 'software',
  HARDWARE = 'hardware',
  SERVICE = 'service',
  SUBSCRIPTION = 'subscription',
  OTHER = 'other'
}

export interface ProductBase {
  name: string;
  code: string;
  category: ProductCategory;
  description?: string;
  price?: number;
  priceType?: 'one_time' | 'monthly' | 'yearly' | 'custom';
  isActive?: boolean;
  features?: string[];
  tags?: string[];
}

export interface ProductCreate extends ProductBase {}

export interface ProductUpdate extends Partial<ProductBase> {}

export interface Product extends ProductBase, Timestamps {
  id: ID;
  deployments?: Deployment[];
  proposals?: Proposal[];
}

// ========== 商材導入状況 ==========
export enum DeploymentStatus {
  PROPOSED = 'proposed',
  DEPLOYED = 'deployed',
  NOT_PROPOSED = 'not_proposed'
}

export interface DeploymentBase {
  companyId: ID;
  productId: ID;
  status: DeploymentStatus;
  deployedAt?: Date;
  proposedAt?: Date;
  primaryAssigneeId: ID;           // assignedUserIdから変更
  quantity?: number;
  customPrice?: number;
  notes?: string;
}

export interface DeploymentCreate extends DeploymentBase {}

export interface DeploymentUpdate extends Partial<DeploymentBase> {}

export interface Deployment extends DeploymentBase, Timestamps {
  id: ID;
  company?: Company;
  product?: Product;
  primaryAssignee?: User;
  contract?: Contract;
  proposal?: Proposal;
}

// ========== 契約関連 ==========
export enum ContractStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  RENEWED = 'renewed',
  CANCELLED = 'cancelled'
}

export interface ContractBase {
  companyId: ID;
  contractNumber: string;
  title: string;
  status: ContractStatus;
  startDate: Date;
  endDate: Date;
  value?: number;
  paymentTerms?: string;
  autoRenew?: boolean;
  renewalNotificationDays?: number;
  deploymentIds?: ID[];
  notes?: string;
  attachmentUrls?: string[];
}

export interface ContractCreate extends ContractBase {}

export interface ContractUpdate extends Partial<ContractBase> {}

export interface Contract extends ContractBase, Timestamps {
  id: ID;
  company?: Company;
  deployments?: Deployment[];
  renewalHistory?: ContractRenewal[];
}

export interface ContractRenewal {
  id: ID;
  contractId: ID;
  renewedAt: Date;
  previousEndDate: Date;
  newEndDate: Date;
  renewedBy: ID;
  notes?: string;
}

// ========== 提案関連 ==========
export enum ProposalStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export interface ProposalBase {
  companyId: ID;
  proposalNumber: string;
  title: string;
  status: ProposalStatus;
  submittedAt?: Date;
  validUntil?: Date;
  totalValue?: number;
  productIds: ID[];
  deploymentIds?: ID[];
  description?: string;
  attachmentUrls?: string[];
  rejectionReason?: string;
}

export interface ProposalCreate extends ProposalBase {}

export interface ProposalUpdate extends Partial<ProposalBase> {}

export interface Proposal extends ProposalBase, Timestamps {
  id: ID;
  company?: Company;
  products?: Product[];
  deployments?: Deployment[];
  createdBy?: User;
}

// ========== システム設定 ==========
export interface SystemSettings {
  id: ID;
  companyName: string;
  systemEmail: string;
  emailNotifications: {
    todoReminders: boolean;
    contractExpiry: boolean;
    proposalExpiry: boolean;
    dailyDigest: boolean;
  };
  security: {
    passwordMinLength: number;
    passwordRequireSpecialChar: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    mfaEnabled: boolean;
  };
  integration: {
    gmailClientId?: string;
    gmailClientSecret?: string;
    openaiApiKey?: string;
    openaiModel?: string;
  };
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
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
    lastBackupAt?: Date;
  };
  updatedAt: Date;
  updatedBy?: ID;
}

// ========== 監査ログ ==========
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
  BULK_OPERATION = 'bulk_operation',
  
  // CRUD操作
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete'
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

// ========== ダッシュボード関連 ==========
export interface DashboardStats {
  companies: {
    total: number;
    byStatus: Record<CompanyStatus, number>;
    newThisMonth: number;
  };
  todos: {
    total: number;
    byStatus: Record<TodoStatus, number>;
    overdue: number;
    dueToday: number;
    aiExtracted: number;
  };
  emails: {
    totalThreads: number;
    unreadThreads: number;
    threadsToday: number;
    pendingAnalysis: number;
  };
  contracts: {
    active: number;
    expiringSoon: number;
    totalValue: number;
  };
  proposals: {
    submitted: number;
    underReview: number;
    accepted: number;
    totalValue: number;
  };
}

// ========== データインポート関連 ==========
export interface ImportTemplate {
  id: ID;
  name: string;
  entityType: 'company' | 'contact' | 'product' | 'todo';
  mappings: Record<string, string>;
  defaultValues?: Record<string, any>;
  validationRules?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportJob {
  id: ID;
  templateId?: ID;
  entityType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  successRecords: number;
  failedRecords: number;
  errors?: Array<{
    row: number;
    field: string;
    error: string;
  }>;
  resultFileUrl?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: ID;
  createdAt: Date;
}

// ========== ワークフロー管理関連 ==========
export enum WorkflowType {
  STANDARD = 'standard',                    // 標準ワークフロー
  APPROVAL_PROCESS = 'approval_process',    // 承認プロセス対応
  CLIENT_COMMUNICATION = 'client_communication', // クライアント対応
  CUSTOM = 'custom'                         // カスタムワークフロー
}

// ワークフロー権限定義
export enum WorkflowPermission {
  CREATE_PERSONAL_WORKFLOW = 'create_personal_workflow',
  CREATE_TEAM_WORKFLOW = 'create_team_workflow',
  CREATE_COMPANY_WORKFLOW = 'create_company_workflow',
  EDIT_PERSONAL_WORKFLOW = 'edit_personal_workflow',
  EDIT_TEAM_WORKFLOW = 'edit_team_workflow',
  EDIT_COMPANY_WORKFLOW = 'edit_company_workflow',
  DELETE_PERSONAL_WORKFLOW = 'delete_personal_workflow',
  DELETE_TEAM_WORKFLOW = 'delete_team_workflow',
  DELETE_COMPANY_WORKFLOW = 'delete_company_workflow',
  APPROVE_STATUS_TRANSITION = 'approve_status_transition',
  CREATE_CUSTOM_STATUS = 'create_custom_status',
  MANAGE_EFFORT_TEMPLATES = 'manage_effort_templates',
  VIEW_TEAM_WORKFLOWS = 'view_team_workflows',
  VIEW_COMPANY_WORKFLOWS = 'view_company_workflows',
  EMERGENCY_OVERRIDE = 'emergency_override'
}

// ワークフローアクセス制御
export interface WorkflowAccessControl {
  scope: 'PERSONAL' | 'TEAM' | 'DEPARTMENT' | 'COMPANY';
  allowedRoles: UserRole[];
  allowedUsers?: ID[];
  allowedDepartments?: string[];
  inheritanceLevel: 'NONE' | 'TEAM' | 'DEPARTMENT' | 'COMPANY';
  isPublic: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

// 承認フロー定義
export enum ApprovalStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  TIMEOUT = 'timeout'
}

export interface ApprovalStep {
  stepOrder: number;
  requiredRole: UserRole;
  assignedUsers?: ID[];
  approvedBy?: ID;
  approvedAt?: Date;
  rejectedBy?: ID;
  rejectedAt?: Date;
  comments?: string;
  timeoutHours?: number;
}

export interface WorkflowApprovalFlow {
  id: ID;
  workflowId: ID;
  todoId?: ID;
  approvalType: 'STATUS_TRANSITION' | 'WORKFLOW_CHANGE' | 'TEMPLATE_UPDATE' | 'CUSTOM_STATUS_CREATE';
  requiredApprovers: UserRole[];
  currentApprovers: ID[];
  approvalStatus: ApprovalStatus;
  approvalSteps: ApprovalStep[];
  requestedBy: ID;
  requestedAt: Date;
  completedAt?: Date;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ワークフロー操作ログ
export enum WorkflowLogLevel {
  INFO = 'info',
  AUDIT = 'audit',
  ERROR = 'error',
  SECURITY = 'security'
}

export interface WorkflowOperationLog {
  id: ID;
  userId: ID;
  companyId: ID;
  operation: string;
  resourceType: 'WORKFLOW' | 'STATUS' | 'TEMPLATE' | 'APPROVAL';
  resourceId: ID;
  logLevel: WorkflowLogLevel;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  retentionDays: number;
}

export interface WorkflowColumn {
  id: string;
  name: string;
  statusValue: TodoStatus;
  color: string;                           // 背景色
  textColor: string;                       // テキスト色
  icon?: string;                          // Material Design アイコン名
  order: number;                          // 表示順序
  isDefault?: boolean;                    // デフォルトカラムかどうか
  description?: string;                   // カラムの説明
}

export interface WorkflowTemplate {
  id: string;
  companyId: ID;                          // 企業分離の要
  name: string;
  type: WorkflowType;
  description?: string;
  columns: WorkflowColumn[];
  isActive: boolean;
  isSystemDefault?: boolean;              // システムデフォルトテンプレート
  accessControl: WorkflowAccessControl;   // アクセス制御設定
  approvalFlowId?: ID;                   // 承認フロー参照
  createdBy?: ID;
  updatedBy?: ID;
  createdAt: Date;
  updatedAt: Date;
}

export interface EffortTemplate {
  id: string;
  companyId: ID;                          // 企業分離の要
  name: string;
  category: string;                       // 業務カテゴリ（開発、営業、サポート等）
  estimatedHours: number;
  description?: string;
  statusApplicable: TodoStatus[];         // 適用可能なステータス
  tags?: string[];
  isActive: boolean;
  accessControl: WorkflowAccessControl;   // アクセス制御設定
  createdBy?: ID;
  updatedBy?: ID;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowSettings {
  id: string;
  userId?: ID;                            // ユーザー固有設定（null=全体設定）
  companyId?: ID;                         // 企業固有設定（null=全体設定）
  projectId?: ID;                         // プロジェクト固有設定（null=全体設定）
  activeWorkflowId: string;               // 現在のアクティブワークフロー
  customColumns?: WorkflowColumn[];       // カスタムカラム定義
  effortTemplates?: EffortTemplate[];     // 工数テンプレート
  settings: {
    autoTransition?: boolean;             // 自動ステータス遷移
    notificationEnabled?: boolean;        // 通知有効
    allowCustomStatus?: boolean;          // カスタムステータス許可
    defaultEffortTemplate?: string;       // デフォルト工数テンプレート
  };
  privacySettings?: {                     // プライバシー設定
    sharePersonalTemplates: boolean;
    allowWorkflowSuggestions: boolean;
    visibleToTeam: boolean;
  };
  permissions: WorkflowPermission[];      // ユーザー権限
  createdAt: Date;
  updatedAt: Date;
}

// ユーザーワークフロー設定（プライバシー保護版）
export interface UserWorkflowSettings {
  userId: ID;
  companyId: ID;
  personalWorkflows: WorkflowTemplate[];  // 完全プライベート
  sharedWorkflows: ID[];                  // 共有ワークフローへの参照のみ
  customStatuses: WorkflowStatus[];
  effortTemplates: EffortTemplate[];      // 個人工数テンプレート
  privacySettings: {
    sharePersonalTemplates: boolean;
    allowWorkflowSuggestions: boolean;
    visibleToTeam: boolean;
  };
  permissions: WorkflowPermission[];
  createdAt: Date;
  updatedAt: Date;
}

// ワークフローステータス（カスタムステータス用）
export interface WorkflowStatus {
  id: string;
  companyId: ID;
  name: string;
  value: string;                          // システム内部値
  displayName: string;                    // 表示名
  description?: string;
  color: string;
  textColor: string;
  icon?: string;
  isCustom: boolean;
  scope: 'PERSONAL' | 'TEAM' | 'COMPANY';
  createdBy: ID;
  accessControl: WorkflowAccessControl;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTransition {
  id: string;
  workflowId: string;
  fromStatus: TodoStatus;
  toStatus: TodoStatus;
  name: string;                          // 遷移名（例：「承認」「差し戻し」）
  description?: string;
  requiresApproval?: boolean;
  approverRoles?: UserRole[];
  conditions?: {
    requiredFields?: string[];           // 必須フィールド
    customValidation?: string;           // カスタム検証ルール
  };
  isAutomatic?: boolean;                 // 自動遷移かどうか
  automationTrigger?: string;            // 自動遷移のトリガー条件
  createdAt: Date;
  updatedAt: Date;
}

// ワークフロー適用リクエスト
export interface WorkflowApplyRequest {
  todoId: string;
  fromStatus: TodoStatus;
  toStatus: TodoStatus;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowApplyResponse {
  success: boolean;
  todoId: string;
  fromStatus: TodoStatus;
  toStatus: TodoStatus;
  appliedAt: Date;
  appliedBy: ID;
  reason?: string;
}

// ========== システムダッシュボード関連 ==========
export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalCompanies: number;
  totalTodos: number;
  completedTodos: number;
  gmailConnections: number;
  systemUptime: number; // パーセンテージ
  apiResponseTime: number; // ミリ秒
  databaseSize: number; // MB
  lastBackup: Date;
}

export enum SystemAlertType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

export interface SystemAlert {
  id: ID;
  type: SystemAlertType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionRequired: boolean;
}

export interface SystemPerformance {
  timestamp: Date;
  cpuUsage: number; // パーセンテージ
  memoryUsage: number; // パーセンテージ
  activeConnections: number;
  apiResponseTime: number; // ミリ秒
}

// ========== APIパス定義 ==========
export const API_PATHS = {
  // 認証関連
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    REFRESH_TOKEN: '/api/auth/refresh',
    ME: '/api/auth/me',
    GOOGLE_LOGIN: '/api/auth/google',
    GOOGLE_CALLBACK: '/api/auth/google/callback',
    VERIFY_TOKEN: '/api/auth/verify',
    PASSWORD_RESET_REQUEST: '/api/auth/password-reset',
    MFA_VERIFY: '/api/auth/mfa/verify'
  },
  
  // ユーザー関連
  USERS: {
    BASE: '/api/users',
    DETAIL: (userId: string) => `/api/users/${userId}`,
    PROFILE: (userId: string) => `/api/users/${userId}/profile`,
    CHANGE_PASSWORD: (userId: string) => `/api/users/${userId}/password`,
    GMAIL_CONNECT: (userId: string) => `/api/users/${userId}/gmail/connect`,
    GMAIL_DISCONNECT: (userId: string) => `/api/users/${userId}/gmail/disconnect`,
    // ユーザー管理機能追加
    SEARCH: '/api/users/search',
    BULK_UPDATE: '/api/users/bulk',
    EXPORT_CSV: '/api/users/export/csv',
    ACTIVITY_LOG: (userId: string) => `/api/users/${userId}/activity`,
    PERMISSIONS: (userId: string) => `/api/users/${userId}/permissions`,
    STATUS: (userId: string) => `/api/users/${userId}/status`,
    STATS: '/api/users/stats'
  },
  
  // 企業（顧客）関連
  COMPANIES: {
    BASE: '/api/companies',
    DETAIL: (companyId: string) => `/api/companies/${companyId}`,
    CONTACTS: (companyId: string) => `/api/companies/${companyId}/contacts`,
    EMAILS: (companyId: string) => `/api/companies/${companyId}/emails`,
    TODOS: (companyId: string) => `/api/companies/${companyId}/todos`,
    CONTRACTS: (companyId: string) => `/api/companies/${companyId}/contracts`,
    PROPOSALS: (companyId: string) => `/api/companies/${companyId}/proposals`,
    DEPLOYMENTS: (companyId: string) => `/api/companies/${companyId}/deployments`,
    ASSIGN: (companyId: string) => `/api/companies/${companyId}/assign`
  },
  
  // 連絡先関連
  CONTACTS: {
    BASE: '/api/contacts',
    DETAIL: (contactId: string) => `/api/contacts/${contactId}`
  },
  
  // Gmail関連
  GMAIL: {
    THREADS: '/api/gmail/threads',
    THREAD_DETAIL: (threadId: string) => `/api/gmail/threads/${threadId}`,
    THREAD_SEARCH: '/api/gmail/threads/search',  // P-003用: 高度検索
    MESSAGES: '/api/gmail/messages',
    MESSAGE_DETAIL: (messageId: string) => `/api/gmail/messages/${messageId}`,
    SYNC: '/api/gmail/sync',
    SYNC_STATUS: '/api/gmail/sync/status',
    ATTACHMENTS: (messageId: string, attachmentId: string) => 
      `/api/gmail/messages/${messageId}/attachments/${attachmentId}`,
    ATTACHMENT_PREVIEW: (messageId: string, attachmentId: string) => 
      `/api/gmail/messages/${messageId}/attachments/${attachmentId}/preview`,  // P-003用: プレビュー
    EXTRACT_TODOS: (threadId: string) => `/api/gmail/threads/${threadId}/extract-todos`,
    SHARED_ACCOUNTS: '/api/gmail/shared-accounts',
    SHARED_ACCOUNT_DETAIL: (accountId: string) => `/api/gmail/shared-accounts/${accountId}`
  },
  
  // TODO関連
  TODOS: {
    BASE: '/api/todos',
    DETAIL: (todoId: string) => `/api/todos/${todoId}`,
    APPROVE: (todoId: string) => `/api/todos/${todoId}/approve`,
    COMPLETE: (todoId: string) => `/api/todos/${todoId}/complete`,
    AI_EXTRACT: '/api/todos/ai-extract',
    BATCH_UPDATE: '/api/todos/batch-update',
    SEARCH: '/api/todos/search',
    STATS: '/api/todos/stats',
    OVERDUE: '/api/todos/overdue',
    TODAY: '/api/todos/today',
    PENDING_APPROVAL: '/api/todos/pending-approval',
    BULK: '/api/todos/bulk',
    EXPORT_CSV: '/api/todos/export/csv'
  },

  // ワークフロー管理関連
  WORKFLOWS: {
    BASE: '/api/workflows',
    TEMPLATES: '/api/workflows/templates',
    TEMPLATE_DETAIL: (templateId: string) => `/api/workflows/templates/${templateId}`,
    SETTINGS: '/api/workflows/settings',
    USER_SETTINGS: (userId: string) => `/api/workflows/settings/user/${userId}`,
    COMPANY_SETTINGS: (companyId: string) => `/api/workflows/settings/company/${companyId}`,
    EFFORT_TEMPLATES: '/api/workflows/effort-templates',
    EFFORT_TEMPLATE_DETAIL: (templateId: string) => `/api/workflows/effort-templates/${templateId}`,
    EFFORT_TEMPLATE_BY_ID: (templateId: string) => `/api/workflows/effort-templates/${templateId}`,
    EFFORT_TEMPLATE_STATS: '/api/workflows/effort-templates/stats',
    TRANSITIONS: '/api/workflows/transitions',
    APPLY_WORKFLOW: '/api/workflows/apply',
    STATUS_HISTORY: (todoId: string) => `/api/workflows/todos/${todoId}/status-history`,
    // 承認フロー関連
    APPROVAL: {
      REQUEST: '/api/workflows/approval/request',
      APPROVE: '/api/workflows/approval/approve',
      REJECT: '/api/workflows/approval/reject',
      PENDING: '/api/workflows/approval/pending',
      HISTORY: '/api/workflows/approval/history',
      DETAIL: (approvalId: string) => `/api/workflows/approval/${approvalId}`
    },
    // カスタムステータス関連
    CUSTOM_STATUSES: '/api/workflows/custom-statuses',
    CUSTOM_STATUS_DETAIL: (statusId: string) => `/api/workflows/custom-statuses/${statusId}`,
    // 権限関連
    PERMISSIONS: '/api/workflows/permissions',
    USER_PERMISSIONS: (userId: string) => `/api/workflows/permissions/user/${userId}`,
    // 操作ログ関連
    OPERATION_LOGS: '/api/workflows/logs',
    AUDIT_LOGS: '/api/workflows/audit-logs'
  },
  
  // 商材関連
  PRODUCTS: {
    BASE: '/api/products',
    DETAIL: (productId: string) => `/api/products/${productId}`,
    DEPLOYMENTS: (productId: string) => `/api/products/${productId}/deployments`
  },
  
  // 商材導入状況
  DEPLOYMENTS: {
    BASE: '/api/deployments',
    DETAIL: (deploymentId: string) => `/api/deployments/${deploymentId}`
  },
  
  // 契約関連
  CONTRACTS: {
    BASE: '/api/contracts',
    DETAIL: (contractId: string) => `/api/contracts/${contractId}`,
    RENEW: (contractId: string) => `/api/contracts/${contractId}/renew`,
    CANCEL: (contractId: string) => `/api/contracts/${contractId}/cancel`,
    EXPIRING: '/api/contracts/expiring'
  },
  
  // 提案関連
  PROPOSALS: {
    BASE: '/api/proposals',
    DETAIL: (proposalId: string) => `/api/proposals/${proposalId}`,
    SUBMIT: (proposalId: string) => `/api/proposals/${proposalId}/submit`,
    ACCEPT: (proposalId: string) => `/api/proposals/${proposalId}/accept`,
    REJECT: (proposalId: string) => `/api/proposals/${proposalId}/reject`
  },
  
  // ダッシュボード・レポート
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    ACTIVITIES: '/api/dashboard/activities',
    CHARTS: '/api/dashboard/charts'
  },
  
  // システム設定・管理
  SYSTEM: {
    STATS: '/api/system/stats',
    ALERTS: '/api/system/alerts',
    PERFORMANCE: '/api/system/performance',
    HEALTH: '/api/system/health',
    DEPARTMENT_USAGE: '/api/system/department-usage',
    ALERT_READ: (alertId: string) => `/api/system/alerts/${alertId}/read`,
    ALERTS_READ_ALL: '/api/system/alerts/read-all',
    SETTINGS: '/api/system/settings',
    AUDIT_LOGS: '/api/system/audit-logs',
    BACKUP: '/api/system/backup',
    RESTORE: '/api/system/restore'
  },
  
  // データインポート・エクスポート
  IMPORT: {
    BASE: '/api/import',
    TEMPLATES: '/api/import/templates',
    TEMPLATE_DETAIL: (templateId: string) => `/api/import/templates/${templateId}`,
    UPLOAD: '/api/import/upload',
    PREVIEW: '/api/import/preview',
    EXECUTE: '/api/import/execute',
    JOB_STATUS: (jobId: string) => `/api/import/jobs/${jobId}`
  },
  
  EXPORT: {
    BASE: '/api/export',
    COMPANIES: '/api/export/companies',
    TODOS: '/api/export/todos',
    CONTACTS: '/api/export/contacts'
  }
};

// ========== API認証設定 ==========
export const API_AUTH_CONFIG = {
  // 認証不要エンドポイント
  PUBLIC_ENDPOINTS: [
    API_PATHS.AUTH.LOGIN,
    API_PATHS.AUTH.REGISTER,
    API_PATHS.AUTH.REFRESH,
    API_PATHS.AUTH.GOOGLE_LOGIN,
    API_PATHS.AUTH.GOOGLE_CALLBACK,
    API_PATHS.SYSTEM.HEALTH
  ],
  
  // ロール制限エンドポイント
  ROLE_RESTRICTED_ENDPOINTS: {
    // 上位権限者のみ
    [UPPER_ROLES.join(',')]: [
      API_PATHS.USERS.BASE,
      API_PATHS.SYSTEM.SETTINGS,
      API_PATHS.SYSTEM.AUDIT_LOGS,
      API_PATHS.IMPORT.BASE,
      API_PATHS.GMAIL.SHARED_ACCOUNTS
    ],
    
    // COMPANY_LEADER のみ
    [UserRole.COMPANY_LEADER]: [
      API_PATHS.SYSTEM.BACKUP,
      API_PATHS.SYSTEM.RESTORE
    ]
  },
  
  // 担当者チェックが必要なエンドポイント（正規表現）
  ASSIGNEE_CHECK_REQUIRED: [
    /^\/api\/companies\/[^\/]+$/,          // PUT /api/companies/:id
    /^\/api\/todos\/[^\/]+$/,              // PUT /api/todos/:id
    /^\/api\/deployments\/[^\/]+$/,        // PUT /api/deployments/:id
    /^\/api\/contracts\/[^\/]+$/,          // PUT /api/contracts/:id
    /^\/api\/proposals\/[^\/]+$/           // PUT /api/proposals/:id
  ]
};

// ========== バリデーションルール ==========
export const VALIDATION_RULES = {
  USER: {
    username: { required: true, minLength: 3, maxLength: 50 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { required: true, minLength: 8, maxLength: 100 },
    fullName: { required: true, maxLength: 100 }
  },
  COMPANY: {
    name: { required: true, maxLength: 200 },
    nameKana: { maxLength: 200, pattern: /^[\u30A0-\u30FF\u3040-\u309F\s]+$/ },
    employeeCount: { min: 1, max: 1000000 },
    capital: { min: 0 },
    website: { pattern: /^https?:\/\/.+/ },
    phone: { pattern: /^[0-9-+()]+$/ },
    postalCode: { pattern: /^[0-9]{3}-?[0-9]{4}$/ }
  },
  TODO: {
    title: { required: true, maxLength: 200 },
    description: { maxLength: 2000 },
    estimatedHours: { min: 0, max: 999 },
    actualHours: { min: 0, max: 999 }
  },
  CONTRACT: {
    contractNumber: { required: true, pattern: /^[A-Z0-9-]+$/ },
    title: { required: true, maxLength: 200 },
    value: { min: 0, max: 999999999999 },
    renewalNotificationDays: { min: 0, max: 365 }
  },
  PROPOSAL: {
    proposalNumber: { required: true, pattern: /^[A-Z0-9-]+$/ },
    title: { required: true, maxLength: 200 },
    totalValue: { min: 0, max: 999999999999 }
  },
  WORKFLOW: {
    name: { required: true, maxLength: 100 },
    description: { maxLength: 500 }
  },
  EFFORT_TEMPLATE: {
    name: { required: true, maxLength: 100 },
    category: { required: true, maxLength: 50 },
    estimatedHours: { required: true, min: 0, max: 999 },
    description: { maxLength: 500 }
  }
};

// ========== 定数定義 ==========
export const CONSTANTS = {
  // ページネーション
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // セッション
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30分
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7日
  
  // ファイルアップロード
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif'
  ],
  
  // Gmail同期
  GMAIL_SYNC_INTERVAL: 5 * 60 * 1000, // 5分
  GMAIL_MAX_RESULTS: 100,
  
  // AI分析
  AI_ANALYSIS_TIMEOUT: 30 * 1000, // 30秒
  AI_MAX_RETRIES: 3
};

// ========== プロダクト関連 ==========
export enum ProductDeploymentStatus {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  ARCHIVED = 'archived'
}

export enum ProductType {
  SERVICE = 'service',
  SOFTWARE = 'software',
  CLOUD_SERVICE = 'cloud_service',
  HARDWARE = 'hardware',
  CONSULTING = 'consulting'
}