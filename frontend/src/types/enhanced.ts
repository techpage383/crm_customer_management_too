/**
 * ===== 拡張型定義 =====
 * 高度なCRM機能をサポートする型定義
 */

// ========== メールスレッド関連 ==========
export interface EmailThread {
  id: string;
  threadId: string;            // Gmailのthread ID
  customerId: string;
  subject: string;
  participants: string[];      // 参加者のメールアドレス
  messageCount: number;
  lastMessageDate: Date;
  isRead: boolean;
  hasAttachments: boolean;
  tags: string[];
  priority: ThreadPriority;
  status: ThreadStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum ThreadPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum ThreadStatus {
  ACTIVE = 'ACTIVE',           // アクティブ
  PENDING_REPLY = 'PENDING_REPLY',  // 返信待ち
  WAITING_RESPONSE = 'WAITING_RESPONSE',  // 相手の返信待ち
  COMPLETED = 'COMPLETED',     // 完了
  ARCHIVED = 'ARCHIVED'        // アーカイブ
}

// ========== TODO関連 ==========
export interface CustomerTodo {
  id: string;
  customerId: string;
  threadId?: string;           // 関連するスレッド
  title: string;
  description: string;
  dueDate?: Date;
  priority: TodoPriority;
  status: TodoStatus;
  estimatedHours?: number;     // 予想工数
  actualHours?: number;        // 実工数
  assignedTo?: string;         // 担当者
  extractedFrom?: string;      // 抽出元メッセージID
  createdBy: 'USER' | 'AI';    // 作成者（ユーザーまたはAI）
  createdAt: Date;
  updatedAt: Date;
}

export enum TodoPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TodoStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// ========== 添付ファイル関連 ==========
export interface EmailAttachment {
  id: string;
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
  gmailAttachmentId: string;
  localPath?: string;          // ローカル保存パス
  thumbnailPath?: string;      // サムネイルパス
  extractedText?: string;      // OCRやPDF抽出テキスト
  tags: string[];
  isImported: boolean;         // インポート済みフラグ
  createdAt: Date;
}

// ========== 返信テンプレート関連 ==========
export interface ReplyTemplate {
  id: string;
  userId: string;
  name: string;
  subject?: string;
  body: string;
  category: string;
  isAIGenerated: boolean;
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReplyDraft {
  id: string;
  threadId: string;
  userId: string;
  toEmails: string[];
  ccEmails: string[];
  bccEmails: string[];
  subject: string;
  body: string;
  isAIGenerated: boolean;
  confidence?: number;         // AI提案の信頼度（0-1）
  suggestedTemplateId?: string;
  scheduledSendTime?: Date;
  createdAt: Date;
}

// ========== 顧客活動追跡 ==========
export interface CustomerActivity {
  id: string;
  customerId: string;
  type: ActivityType;
  description: string;
  metadata?: any;              // 関連データ
  timestamp: Date;
}

export enum ActivityType {
  EMAIL_SENT = 'EMAIL_SENT',
  EMAIL_RECEIVED = 'EMAIL_RECEIVED',
  REPLY_SENT = 'REPLY_SENT',
  TODO_CREATED = 'TODO_CREATED',
  TODO_COMPLETED = 'TODO_COMPLETED',
  MEETING_SCHEDULED = 'MEETING_SCHEDULED',
  CUSTOMER_UPDATED = 'CUSTOMER_UPDATED',
  ATTACHMENT_DOWNLOADED = 'ATTACHMENT_DOWNLOADED'
}

// ========== アラート関連 ==========
export interface CustomerAlert {
  id: string;
  customerId: string;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  isRead: boolean;
  actionRequired: boolean;
  metadata?: any;
  createdAt: Date;
  readAt?: Date;
}

export enum AlertType {
  LONG_NO_CONTACT = 'LONG_NO_CONTACT',     // 長期未連絡
  PENDING_REPLY = 'PENDING_REPLY',         // 返信待ち
  OVERDUE_TODO = 'OVERDUE_TODO',           // TODO期限切れ
  HIGH_PRIORITY_EMAIL = 'HIGH_PRIORITY_EMAIL',  // 重要メール
  ATTACHMENT_NEEDS_REVIEW = 'ATTACHMENT_NEEDS_REVIEW'  // 添付ファイル要確認
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// ========== 統計・分析関連 ==========
export interface CustomerMetrics {
  customerId: string;
  totalEmails: number;
  emailsSent: number;
  emailsReceived: number;
  averageResponseTime: number; // 時間
  responseRate: number;        // %
  lastContactDate?: Date;
  totalTodos: number;
  completedTodos: number;
  totalWorkHours: number;      // 総工数
  activeThreads: number;
  pendingReplies: number;
  calculatedAt: Date;
}

// ========== API Request/Response型定義 ==========
export interface CreateTodoRequest {
  customerId: string;
  threadId?: string;
  title: string;
  description: string;
  dueDate?: Date;
  priority: TodoPriority;
  estimatedHours?: number;
}

export interface CreateReplyDraftRequest {
  threadId: string;
  toEmails: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  subject?: string;
  body: string;
  useAISuggestion?: boolean;
}

export interface SyncAdvancedRequest {
  customerId?: string;
  includeAttachments?: boolean;
  extractTodos?: boolean;
  generateReplySuggestions?: boolean;
  syncPeriodDays?: number;
}

// ========== AI関連の型定義 ==========
export interface AIAnalysisResult {
  extractedTodos: Partial<CustomerTodo>[];
  suggestedReplies: Partial<ReplyDraft>[];
  detectedPriority: ThreadPriority;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  urgency: number;             // 0-1
  keyTopics: string[];
}

export interface TodoExtractionRequest {
  messageContent: string;
  customerContext?: string;
  existingTodos?: CustomerTodo[];
}

// EmailMessageとCustomerは基本型定義から参照
export interface ReplyGenerationRequest {
  threadHistory: any[];  // EmailMessage[]
  customerInfo: any;     // Customer
  responseType: 'QUICK' | 'DETAILED' | 'FORMAL';
  tone: 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL';
}