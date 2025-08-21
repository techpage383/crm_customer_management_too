// ========== カスタムフロー設計システム ==========

export interface FlowPhase {
  id: string;
  name: string;
  color: string;
  position: {
    x: number;
    y: number;
  };
  order: number;
}

export interface CustomFlow {
  id: string;
  name: string;
  description?: string;
  phases: FlowPhase[];
  connections: FlowConnection[];
  isDefault: boolean;
  businessType: string; // 業務種類との関連
  createdAt: Date;
  updatedAt: Date;
}

export interface FlowConnection {
  id: string;
  fromPhaseId: string;
  toPhaseId: string;
  label?: string;
}

// ========== タスク管理 ==========

export interface Task {
  id: string;
  title: string;
  description?: string;
  businessType: BusinessType;
  priority: TaskPriority;
  urgency: TaskUrgency;
  importance: TaskImportance;
  
  // フロー関連
  flowId: string;
  currentPhaseId: string;
  
  // 期限・時間
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  
  // 担当・関係者
  assigneeId: string;
  collaborators: string[];
  
  // 営業特化機能
  waitingFor?: WaitingInfo;
  clientInfo?: ClientInfo;
  documents: string[];
  
  // 定期タスク
  recurring?: RecurringInfo;
  
  // メタデータ
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface WaitingInfo {
  type: 'client_response' | 'approval' | 'document' | 'payment' | 'other';
  reason: string;
  expectedDate?: Date;
  reminderDate?: Date;
  reminderSent: boolean;
  followUpHistory: FollowUpRecord[];
}

export interface FollowUpRecord {
  date: Date;
  method: 'email' | 'phone' | 'meeting' | 'other';
  note: string;
  response?: string;
}

export interface ClientInfo {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface RecurringInfo {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // 1 = 毎回, 2 = 1回おき
  daysOfWeek?: number[]; // 0=日曜, 1=月曜...
  dayOfMonth?: number; // 月の何日
  endDate?: Date;
  nextGenerationDate: Date;
}

// ========== 業務種類・優先度 ==========

export enum BusinessType {
  VISIT = 'visit',           // 訪問・商談
  DOCUMENT = 'document',     // 資料作成・送付
  ADMIN = 'admin',           // 事務作業
  FOLLOW_UP = 'follow_up',   // フォローアップ
  MEETING = 'meeting',       // 会議・打ち合わせ
  ESTIMATE = 'estimate',     // 見積作成
  CONTRACT = 'contract',     // 契約関連
  SUPPORT = 'support',       // サポート・問い合わせ対応
  OTHER = 'other'           // その他
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum TaskUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskImportance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ========== ユーザー・チーム ==========

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member'
}

export interface Team {
  id: string;
  name: string;
  members: string[]; // User IDs
  sharedFlows: string[]; // CustomFlow IDs
}

// ========== ワークスペース ==========

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  layout: WorkspaceLayout;
  settings: WorkspaceSettings;
}

export interface WorkspaceLayout {
  type: 'free' | 'grid' | 'kanban';
  windows: WorkspaceWindow[];
  canvasSize: {
    width: number;
    height: number;
  };
}

export interface WorkspaceWindow {
  id: string;
  type: 'phase' | 'stats' | 'calendar';
  title: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  phaseId?: string; // type='phase'の場合
  isMinimized: boolean;
}

export interface WorkspaceSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    deadlines: boolean;
    waiting: boolean;
    assignments: boolean;
  };
  defaultFlow: string;
}

// ========== 統計・分析 ==========

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number; // 日数
  completionRate: number; // パーセント
  tasksByBusinessType: Record<BusinessType, number>;
  tasksByPriority: Record<TaskPriority, number>;
  workload: UserWorkload[];
}

export interface UserWorkload {
  userId: string;
  userName: string;
  activeTasks: number;
  overdueTasksg: number;
  workloadPercentage: number;
  averageTasksPerDay: number;
}