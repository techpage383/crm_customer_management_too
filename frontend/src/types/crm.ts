/**
 * ===== 本格的なBtoB CRM型定義 =====
 * 企業向け顧客管理システムの包括的な型定義
 */

// ========== 企業情報管理 ==========
export interface Company {
  id: string;
  companyName: string;
  industry: string;              // 業種（メイン事業）
  employeeCount?: number;        // 従業員数
  website?: string;              // 会社HP
  mainPhoneNumber?: string;      // 代表番号
  address?: string;
  foundedYear?: number;
  annualRevenue?: number;
  companySize: CompanySize;
  status: CompanyStatus;
  tags: string[];
  notes?: string;
  
  // 自社情報
  ourAccountManager: string;     // 自社担当者
  relationshipStart?: Date;      // 取引開始日
  
  // メタデータ
  userId: string;                // 登録ユーザー
  createdAt: Date;
  updatedAt: Date;
  
  // カスタムフィールド
  customFields: Record<string, any>;
}

export enum CompanySize {
  STARTUP = 'STARTUP',           // スタートアップ
  SMALL = 'SMALL',              // 小規模（1-50名）
  MEDIUM = 'MEDIUM',            // 中規模（51-300名）
  LARGE = 'LARGE',              // 大規模（301-1000名）
  ENTERPRISE = 'ENTERPRISE'      // 企業（1000名以上）
}

export enum CompanyStatus {
  PROSPECT = 'PROSPECT',         // 見込み客
  ACTIVE = 'ACTIVE',            // アクティブ顧客
  INACTIVE = 'INACTIVE',        // 非アクティブ
  CHURNED = 'CHURNED',          // 解約済み
  BLACKLISTED = 'BLACKLISTED'   // ブラックリスト
}

// ========== 担当者情報管理 ==========
export interface Contact {
  id: string;
  companyId: string;
  name: string;
  title?: string;               // 役職
  department?: string;          // 部署
  email: string;
  phoneNumber?: string;
  mobileNumber?: string;
  isMainContact: boolean;       // メイン担当者フラグ
  decisionMaker: boolean;       // 決裁者フラグ
  
  // コミュニケーション設定
  preferredContactMethod: ContactMethod;
  timezone?: string;
  
  // 関係性
  relationshipLevel: RelationshipLevel;
  lastContactDate?: Date;
  
  // カスタムフィールド
  customFields: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum ContactMethod {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  CHAT = 'CHAT',
  IN_PERSON = 'IN_PERSON'
}

export enum RelationshipLevel {
  COLD = 'COLD',               // 冷たい
  WARM = 'WARM',               // 暖かい
  HOT = 'HOT',                 // 熱い
  CHAMPION = 'CHAMPION'        // 推進者
}

// ========== 商材マスタ管理 ==========
export interface Product {
  id: string;
  productName: string;
  category: string;
  description?: string;
  price?: number;
  currency: string;
  billingCycle: BillingCycle;
  features: string[];
  isActive: boolean;
  
  // カスタムフィールド
  customFields: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum BillingCycle {
  ONE_TIME = 'ONE_TIME',       // 一回払い
  MONTHLY = 'MONTHLY',         // 月額
  QUARTERLY = 'QUARTERLY',     // 四半期
  YEARLY = 'YEARLY',           // 年額
  CUSTOM = 'CUSTOM'            // カスタム
}

// ========== 契約情報管理 ==========
export interface Contract {
  id: string;
  companyId: string;
  productId: string;
  contractName: string;
  contractType: ContractType;
  
  // 契約期間
  startDate: Date;
  endDate?: Date;
  autoRenewal: boolean;
  
  // 金額情報
  contractValue: number;
  currency: string;
  billingCycle: BillingCycle;
  
  // ステータス
  status: ContractStatus;
  signedDate?: Date;
  
  // 担当者
  ourAccountManager: string;
  clientContactId: string;
  
  // カスタムフィールド
  customFields: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum ContractType {
  NEW = 'NEW',                 // 新規契約
  RENEWAL = 'RENEWAL',         // 更新契約
  EXPANSION = 'EXPANSION',     // 拡大契約
  DOWNGRADE = 'DOWNGRADE'      // ダウングレード
}

export enum ContractStatus {
  DRAFT = 'DRAFT',             // 下書き
  PROPOSED = 'PROPOSED',       // 提案済み
  NEGOTIATING = 'NEGOTIATING', // 交渉中
  SIGNED = 'SIGNED',           // 契約済み
  ACTIVE = 'ACTIVE',           // アクティブ
  EXPIRED = 'EXPIRED',         // 期限切れ
  CANCELLED = 'CANCELLED'      // キャンセル
}

// ========== 提案管理 ==========
export interface Proposal {
  id: string;
  companyId: string;
  productIds: string[];
  title: string;
  description?: string;
  
  // 提案内容
  proposedValue: number;
  currency: string;
  proposedStartDate?: Date;
  
  // ステータス
  status: ProposalStatus;
  proposedDate: Date;
  responseDate?: Date;
  
  // 担当者
  proposedBy: string;          // 提案者
  proposedTo: string;          // 提案先担当者ID
  
  // 結果
  rejectionReason?: string;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum ProposalStatus {
  DRAFT = 'DRAFT',             // 下書き
  SENT = 'SENT',               // 送信済み
  VIEWED = 'VIEWED',           // 閲覧済み
  UNDER_REVIEW = 'UNDER_REVIEW', // 検討中
  ACCEPTED = 'ACCEPTED',       // 受諾
  REJECTED = 'REJECTED',       // 拒否
  EXPIRED = 'EXPIRED'          // 期限切れ
}

// ========== カスタムフィールド管理 ==========
export interface CustomField {
  id: string;
  name: string;
  label: string;               // 表示名
  fieldType: CustomFieldType;
  targetEntity: EntityType;   // 対象エンティティ
  
  // フィールド設定
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  
  // 選択肢（SELECT, MULTI_SELECTの場合）
  options?: CustomFieldOption[];
  
  // バリデーション
  validation?: FieldValidation;
  
  // 権限
  createdBy: string;
  editableBy: UserRole[];
  
  createdAt: Date;
  updatedAt: Date;
}

export enum CustomFieldType {
  TEXT = 'TEXT',               // テキスト
  TEXTAREA = 'TEXTAREA',       // 長文テキスト
  NUMBER = 'NUMBER',           // 数値
  DATE = 'DATE',               // 日付
  DATETIME = 'DATETIME',       // 日時
  BOOLEAN = 'BOOLEAN',         // チェックボックス
  SELECT = 'SELECT',           // 選択肢（単一）
  MULTI_SELECT = 'MULTI_SELECT', // 選択肢（複数）
  URL = 'URL',                 // URL
  EMAIL = 'EMAIL',             // メールアドレス
  PHONE = 'PHONE'              // 電話番号
}

export enum EntityType {
  COMPANY = 'COMPANY',
  CONTACT = 'CONTACT',
  PRODUCT = 'PRODUCT',
  CONTRACT = 'CONTRACT',
  PROPOSAL = 'PROPOSAL'
}

export interface CustomFieldOption {
  value: string;
  label: string;
  color?: string;
  isActive: boolean;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;           // 正規表現
  min?: number;              // 数値の最小値
  max?: number;              // 数値の最大値
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SALES = 'SALES',
  VIEWER = 'VIEWER'
}

// ========== インポート機能 ==========
export interface ImportMapping {
  id: string;
  name: string;               // マッピング名
  targetEntity: EntityType;
  
  // フィールドマッピング
  fieldMappings: FieldMapping[];
  
  // 設定
  hasHeader: boolean;         // ヘッダー行の有無
  skipRows: number;           // スキップ行数
  encoding: string;           // 文字エンコーディング
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldMapping {
  sourceColumn: string;       // CSVの列名 or 列番号
  targetField: string;        // 対象フィールド名
  isRequired: boolean;
  defaultValue?: string;
  transformation?: string;    // データ変換ルール
}

export interface ImportJob {
  id: string;
  fileName: string;
  mappingId: string;
  status: ImportStatus;
  
  // 結果
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors: ImportError[];
  
  // 実行情報
  startedAt: Date;
  completedAt?: Date;
  executedBy: string;
}

export enum ImportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface ImportError {
  rowNumber: number;
  field?: string;
  message: string;
  originalValue?: string;
}

// ========== API Request/Response型定義 ==========
export interface CreateCompanyRequest {
  companyName: string;
  industry: string;
  employeeCount?: number;
  website?: string;
  mainPhoneNumber?: string;
  ourAccountManager: string;
  customFields?: Record<string, any>;
}

export interface CreateContactRequest {
  companyId: string;
  name: string;
  title?: string;
  department?: string;
  email: string;
  phoneNumber?: string;
  isMainContact?: boolean;
  customFields?: Record<string, any>;
}

export interface CreateContractRequest {
  companyId: string;
  productId: string;
  contractName: string;
  startDate: Date;
  endDate?: Date;
  contractValue: number;
  clientContactId: string;
  customFields?: Record<string, any>;
}

export interface QuickActionRequest {
  type: QuickActionType;
  targetId: string;           // 対象のID（会社、担当者など）
  parameters: Record<string, any>;
}

export enum QuickActionType {
  SEND_EMAIL = 'SEND_EMAIL',
  SCHEDULE_CALL = 'SCHEDULE_CALL',
  CREATE_PROPOSAL = 'CREATE_PROPOSAL',
  UPDATE_STATUS = 'UPDATE_STATUS'
}