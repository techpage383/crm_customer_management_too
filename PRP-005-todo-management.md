# PRP-005: TODOマネジメント実装計画書

## 1. Goal（目標）

TODOマネジメント（P-005）の完全実装により、営業担当者・管理者が以下を達成できる状態を実現する：

- **効率的タスク管理**: 個人・チーム・企業別の包括的TODO管理とフィルタリング
- **AI自動化連携**: Gmail連携によるTODO自動抽出と承認ワークフロー
- **企業紐付け管理**: 企業管理（004）と連携した顧客別TODO整理
- **優先度管理**: 緊急度・重要度による適切なタスク優先順位付け
- **進捗可視化**: リアルタイム統計・期限管理・完了率追跡
- **チーム連携**: 担当者間のタスク共有・引き継ぎ・協力体制

## 2. Why（理由）

### ビジネス価値
- **営業効率化**: タスクの見落とし防止と適切な優先順位付けによる営業活動最適化
- **顧客満足向上**: 期限管理・フォローアップ徹底による顧客対応品質向上
- **チーム生産性**: 業務の可視化・共有による組織全体の生産性向上
- **AI活用効果**: 手動入力削減と自動TODO抽出による業務効率大幅改善

### 技術的必要性
- **企業管理との統合**: 企業管理（004）実装完了後の必須連携機能
- **Gmail連携の準備**: Gmail設定（006）・ログページ（007）・AI抽出（008）の受け皿
- **CRMワークフロー**: 契約管理・提案管理の基盤となるタスク管理システム
- **データ駆動営業**: TODO分析による営業プロセス改善とKPI管理

### 実装優先度の理由
- **順序005**: 企業管理の後、Gmail連携前に必要な中核業務機能
- **Gmail連携の前提**: AI TODO抽出機能（008）の受け側システム
- **営業プロセス基盤**: 契約・提案管理の前に確立すべきタスク管理基盤

## 3. What（要件）

### ユーザーストーリー

**営業担当者として**
- 自分に割り当てられたTODOを一覧・管理できる
- TODO作成・編集・削除・完了操作ができる
- 優先度・期限・企業別でTODOをフィルタリング・検索できる
- AI抽出されたTODOを承認・拒否・編集できる
- 元メール・データソースからTODOの背景を確認できる

**チームリーダーとして**
- チーム全体のTODO状況を監視・管理できる
- メンバー間のタスク割り当て・再配布ができる
- チームの進捗統計・完了率を確認できる
- 緊急・重要TODOの優先処理を指示できる

**マネージャーとして**
- 企業別TODO状況を把握・管理できる
- 全体的な業務負荷・進捗を監視できる
- TODO分析レポートを出力できる
- システム全体のTODO統計を確認できる

### 技術要件

**フロントエンド要件**
- Material-UIベースのマルチビューダッシュボード
- リアルタイム検索・フィルタリング機能
- ドラッグ&ドロップによる優先度変更
- 一括操作機能（完了・削除・優先度変更）
- AI抽出TODO承認ワークフロー画面

**バックエンド要件**
- TODO CRUD の RESTful API
- 企業・ユーザー・Gmail連携との統合
- AI抽出TODO管理機能
- 高速検索・フィルタリング最適化
- リアルタイム通知・更新機能

**成功基準**
- 1000件TODOでの2秒以内フィルタリング
- AI抽出TODOの適切な承認ワークフロー
- 企業別TODO表示の正確性
- 期限管理・アラートの正確な動作

## 4. All Needed Context（必要な情報）

### A. API仕様（schemas/index.tsから抜粋）

```typescript
// ========== TODO関連 ==========
export enum TodoPriority {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TodoStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TodoSource {
  MANUAL = 'manual',                    // 手動作成
  EMAIL_AI_EXTRACTED = 'email_ai_extracted',  // Gmail AI抽出
  EMAIL_FORWARDED = 'email_forwarded',   // メール転送
  INTERNAL_REQUEST = 'internal_request'  // 社内依頼
}

export interface TodoBase {
  id: ID;
  title: string;
  description?: string;
  priority: TodoPriority;
  status: TodoStatus;
  dueDate?: string;
  assigneeId: ID;
  assigneeName: string;
  companyId?: ID;
  companyName?: string;
  tags: string[];
  source: TodoSource;
  sourceMetadata?: {
    emailId?: ID;
    emailSubject?: string;
    emailFrom?: string;
    gmailMessageId?: string;
    forwardedBy?: ID;
    requestedBy?: ID;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy: ID;
  updatedBy: ID;
}

export interface Todo extends TodoBase {}

export interface TodoCreateRequest {
  title: string;
  description?: string;
  priority: TodoPriority;
  dueDate?: string;
  assigneeId: ID;
  companyId?: ID;
  tags?: string[];
  source: TodoSource;
  sourceMetadata?: {
    emailId?: ID;
    emailSubject?: string;
    emailFrom?: string;
    gmailMessageId?: string;
    forwardedBy?: ID;
    requestedBy?: ID;
  };
}

export interface TodoUpdateRequest {
  title?: string;
  description?: string;
  priority?: TodoPriority;
  status?: TodoStatus;
  dueDate?: string;
  assigneeId?: ID;
  companyId?: ID;
  tags?: string[];
}

export interface TodoSearchRequest {
  assigneeId?: ID;
  companyId?: ID;
  priority?: TodoPriority[];
  status?: TodoStatus[];
  source?: TodoSource[];
  dueAfter?: string;
  dueBefore?: string;
  searchTerm?: string;
  tags?: string[];
  createdAfter?: string;
  createdBefore?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface TodoSearchResponse {
  todos: Todo[];
  total: number;
  offset: number;
  limit: number;
}

export interface TodoStats {
  total: number;
  byStatus: Record<TodoStatus, number>;
  byPriority: Record<TodoPriority, number>;
  bySource: Record<TodoSource, number>;
  overdue: number;
  dueToday: number;
  dueTomorrow: number;
  dueThisWeek: number;
  completionRate: number;
  avgDaysToCompletion: number;
}

// AI抽出TODO承認ワークフロー
export interface AIPendingTodo {
  id: ID;
  extractedTitle: string;
  extractedDescription?: string;
  suggestedPriority: TodoPriority;
  suggestedDueDate?: string;
  suggestedAssigneeId?: ID;
  suggestedCompanyId?: ID;
  suggestedTags?: string[];
  sourceEmailId: ID;
  sourceEmailSubject: string;
  sourceEmailFrom: string;
  sourceGmailMessageId: string;
  confidence: number;
  extractedAt: string;
  extractedBy: ID;
  status: 'pending' | 'approved' | 'rejected' | 'edited';
}

export interface AITodoApprovalRequest {
  pendingTodoId: ID;
  action: 'approve' | 'reject' | 'edit';
  editedTodo?: TodoCreateRequest;
}

// ========== APIパス（TODO関連） ==========
export const API_PATHS = {
  // ... 既存のパス ...
  
  // TODO管理
  TODOS: '/api/todos',
  TODO_DETAIL: '/api/todos/:id',
  TODO_SEARCH: '/api/todos/search',
  TODO_STATS: '/api/todos/stats',
  TODO_BULK_UPDATE: '/api/todos/bulk',
  TODO_BULK_DELETE: '/api/todos/bulk/delete',
  
  // AI抽出TODO
  AI_PENDING_TODOS: '/api/todos/ai/pending',
  AI_TODO_APPROVAL: '/api/todos/ai/approval',
  AI_TODO_BULK_APPROVAL: '/api/todos/ai/bulk-approval',
  
  // TODO by 企業
  COMPANY_TODOS: '/api/companies/:companyId/todos',
  
  // TODO by ユーザー
  USER_TODOS: '/api/users/:userId/todos',
  MY_TODOS: '/api/todos/my',
} as const;
```

### B. データフロー設計

**Phase 1: Backend API実装**
1. TodoController: CRUD + 検索・フィルタリング
2. AI抽出TODO管理機能
3. 企業・ユーザー連携機能
4. 統計・レポート機能

**Phase 2A: フロントエンド モック実装**
1. Material-UIベースのマルチビューレイアウト
2. @MARK で API接続ポイントをマーク
3. モックデータでの動作確認

**Phase 2B: API統合**
1. @MARK 箇所を実API呼び出しに変更
2. リアルタイム更新機能統合
3. エラーハンドリング実装

**Phase 3: 人間による検証**
1. 全機能の動作確認
2. パフォーマンステスト
3. ユーザビリティ検証

### C. モックアップ分析（mockups/todo-management.html）

**主要機能エリア**
1. **ヘッダー**: AI抽出ステータス・ユーザー情報表示
2. **サイドバー**: ビュー切り替え（自分・チーム・企業別・緊急）
3. **AI抽出エリア**: 承認待ちTODO表示・操作
4. **統計エリア**: クイック統計（期限別・完了率）
5. **メインエリア**: TODO一覧・フィルター・検索
6. **詳細エリア**: TODO詳細情報・編集・操作

**重要なUI要素**
- ビュータブ（自分のTODO・チーム全体・企業別・緊急）
- AI抽出TODO承認エリア（承認・編集・拒否）
- 期限インジケーター（期限超過・今日・明日）
- 優先度カラーコーディング
- 一括操作機能（選択・完了・削除）
- 元メール参照機能

### D. 企業管理（004）との連携

**企業TODOの表示**
- 企業詳細画面からのTODO一覧表示
- 企業ステータス（見込み客・既存顧客・休眠）による優先度調整
- 担当者権限による編集制御

**データ連携ポイント**
- companyId による TODO-企業 紐付け
- 企業担当者情報との同期
- 企業ステータス変更時のTODO自動更新

## 5. Implementation Blueprint（実装設計図）

### Phase 1: Backend Implementation

**1.1 TODO基本機能**
```typescript
// backend/src/features/todos/controllers/TodoController.ts
export class TodoController {
  // 基本CRUD
  async createTodo(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async getTodos(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async getTodoById(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async updateTodo(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async deleteTodo(req: AuthenticatedRequest, res: Response): Promise<void> {}
  
  // 検索・フィルタリング
  async searchTodos(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async getTodoStats(req: AuthenticatedRequest, res: Response): Promise<void> {}
  
  // 一括操作
  async bulkUpdateTodos(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async bulkDeleteTodos(req: AuthenticatedRequest, res: Response): Promise<void> {}
  
  // 個人・チーム・企業別
  async getMyTodos(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async getUserTodos(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async getCompanyTodos(req: AuthenticatedRequest, res: Response): Promise<void> {}
}
```

**1.2 AI抽出TODO管理**
```typescript
// backend/src/features/todos/controllers/AITodoController.ts
export class AITodoController {
  async getPendingTodos(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async approveTodo(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async rejectTodo(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async editAndApproveTodo(req: AuthenticatedRequest, res: Response): Promise<void> {}
  async bulkApproveTodos(req: AuthenticatedRequest, res: Response): Promise<void> {}
}
```

**1.3 データベース設計**
```sql
-- TODOテーブル
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  priority todo_priority_enum NOT NULL DEFAULT 'medium',
  status todo_status_enum NOT NULL DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  assignee_id UUID NOT NULL REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  tags TEXT[],
  source todo_source_enum NOT NULL,
  source_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id)
);

-- AI抽出TODO承認待ちテーブル
CREATE TABLE ai_pending_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extracted_title VARCHAR(500) NOT NULL,
  extracted_description TEXT,
  suggested_priority todo_priority_enum NOT NULL,
  suggested_due_date TIMESTAMP WITH TIME ZONE,
  suggested_assignee_id UUID REFERENCES users(id),
  suggested_company_id UUID REFERENCES companies(id),
  suggested_tags TEXT[],
  source_email_id UUID NOT NULL,
  source_email_subject VARCHAR(500),
  source_email_from VARCHAR(255),
  source_gmail_message_id VARCHAR(255),
  confidence DECIMAL(3,2),
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  extracted_by UUID NOT NULL REFERENCES users(id),
  status ai_todo_status_enum DEFAULT 'pending',
  approved_todo_id UUID REFERENCES todos(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id)
);

-- インデックス
CREATE INDEX idx_todos_assignee_status ON todos(assignee_id, status);
CREATE INDEX idx_todos_company_status ON todos(company_id, status);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_priority_due ON todos(priority, due_date);
CREATE INDEX idx_ai_pending_status ON ai_pending_todos(status);
```

### Phase 2A: Frontend Mock Implementation

**2A.1 コンポーネント構造**
```typescript
// frontend/src/pages/TodoManagementPage.tsx
export const TodoManagementPage: React.FC = () => {
  return (
    <div className="todo-management-container">
      <TodoHeader />
      <div className="todo-main-layout">
        <TodoSidebar />
        <TodoMainContent />
      </div>
    </div>
  );
};

// frontend/src/components/todo/TodoSidebar.tsx
export const TodoSidebar: React.FC = () => {
  return (
    <div className="todo-sidebar">
      <ViewTabs />
      <AIPendingSection />
      <QuickStats />
    </div>
  );
};

// frontend/src/components/todo/TodoMainContent.tsx
export const TodoMainContent: React.FC = () => {
  return (
    <div className="todo-main-content">
      <ContentHeader />
      <FiltersBar />
      <BulkActions />
      <TodoList />
    </div>
  );
};
```

**2A.2 状態管理**
```typescript
// frontend/src/stores/todoStore.ts
interface TodoState {
  todos: Todo[];
  filteredTodos: Todo[];
  selectedTodos: Set<string>;
  currentView: 'my-todos' | 'team-todos' | 'by-company' | 'urgent';
  filters: TodoFilters;
  searchTerm: string;
  aiPendingTodos: AIPendingTodo[];
  stats: TodoStats;
  loading: boolean;
  error: string | null;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  // @MARK: モックデータから開始、後でAPI連携
  todos: MOCK_TODOS,
  filteredTodos: [],
  selectedTodos: new Set(),
  currentView: 'my-todos',
  filters: {},
  searchTerm: '',
  aiPendingTodos: MOCK_AI_PENDING_TODOS,
  stats: MOCK_TODO_STATS,
  loading: false,
  error: null,
  
  // アクション
  setCurrentView: (view) => set({ currentView: view }),
  setFilters: (filters) => set({ filters }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  toggleTodoSelection: (todoId) => {
    const selected = get().selectedTodos;
    if (selected.has(todoId)) {
      selected.delete(todoId);
    } else {
      selected.add(todoId);
    }
    set({ selectedTodos: new Set(selected) });
  },
  
  // @MARK: API連携時に実装
  loadTodos: async () => {},
  createTodo: async (todo) => {},
  updateTodo: async (id, updates) => {},
  deleteTodo: async (id) => {},
  bulkCompleteTodos: async (ids) => {},
  approveAITodo: async (pendingId) => {},
  rejectAITodo: async (pendingId) => {}
}));
```

### Phase 2B: API Integration

**2B.1 API統合**
```typescript
// frontend/src/services/todoService.ts
export class TodoService {
  private apiClient: ApiClient;
  
  // @MARK: Phase 2B で実装
  async getTodos(params: TodoSearchRequest): Promise<TodoSearchResponse> {
    return this.apiClient.get(API_PATHS.TODO_SEARCH, { params });
  }
  
  async createTodo(todo: TodoCreateRequest): Promise<Todo> {
    return this.apiClient.post(API_PATHS.TODOS, todo);
  }
  
  async updateTodo(id: string, updates: TodoUpdateRequest): Promise<Todo> {
    return this.apiClient.put(API_PATHS.TODO_DETAIL.replace(':id', id), updates);
  }
  
  async deleteTodo(id: string): Promise<void> {
    return this.apiClient.delete(API_PATHS.TODO_DETAIL.replace(':id', id));
  }
  
  async getTodoStats(): Promise<TodoStats> {
    return this.apiClient.get(API_PATHS.TODO_STATS);
  }
  
  async getPendingAITodos(): Promise<AIPendingTodo[]> {
    return this.apiClient.get(API_PATHS.AI_PENDING_TODOS);
  }
  
  async approveAITodo(request: AITodoApprovalRequest): Promise<Todo> {
    return this.apiClient.post(API_PATHS.AI_TODO_APPROVAL, request);
  }
}
```

**2B.2 リアルタイム更新**
```typescript
// frontend/src/hooks/useTodoRealtime.ts
export const useTodoRealtime = () => {
  const todoStore = useTodoStore();
  
  useEffect(() => {
    // @MARK: WebSocket接続でリアルタイム更新
    const ws = new WebSocket(`${WS_BASE_URL}/todos`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      switch (update.type) {
        case 'TODO_CREATED':
          todoStore.addTodo(update.todo);
          break;
        case 'TODO_UPDATED':
          todoStore.updateTodoInStore(update.todo);
          break;
        case 'TODO_DELETED':
          todoStore.removeTodo(update.todoId);
          break;
        case 'AI_TODO_EXTRACTED':
          todoStore.addAIPendingTodo(update.pendingTodo);
          break;
      }
    };
    
    return () => ws.close();
  }, []);
};
```

### Phase 3: Human Validation

**3.1 機能検証項目**
- [ ] TODO作成・編集・削除の正常動作
- [ ] 優先度・期限・ステータス管理の正確性
- [ ] 検索・フィルタリング機能の性能
- [ ] AI抽出TODO承認ワークフローの正常動作
- [ ] 企業紐付け機能の正確性
- [ ] 一括操作機能の安全性
- [ ] リアルタイム更新の動作確認
- [ ] 権限制御の正確性

**3.2 パフォーマンステスト**
- [ ] 1000件TODOでの2秒以内レスポンス
- [ ] 同時ユーザー操作の競合制御
- [ ] メモリ使用量の最適化確認

## 6. Validation Method（検証方法）

### 6.1 API動作確認
```bash
# TODO作成テスト
curl -X POST "http://localhost:3001/api/todos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "title": "テスト TODO",
    "description": "TODO作成テスト",
    "priority": "high",
    "dueDate": "2024-02-01T10:00:00Z",
    "assigneeId": "user-123",
    "companyId": "company-456",
    "tags": ["テスト", "営業"],
    "source": "manual"
  }'

# TODO検索テスト
curl -X GET "http://localhost:3001/api/todos/search?assigneeId=user-123&priority=high&status=pending" \
  -H "Authorization: Bearer $JWT_TOKEN"

# AI抽出TODO承認テスト
curl -X POST "http://localhost:3001/api/todos/ai/approval" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "pendingTodoId": "pending-789",
    "action": "approve"
  }'
```

### 6.2 企業管理連携確認
- 企業詳細画面でのTODO表示確認
- 企業担当者変更時のTODO更新確認
- 権限による編集制御確認

### 6.3 ユーザビリティテスト
- ビュー切り替えの直感性
- フィルター・検索の使いやすさ
- AI抽出TODO承認フローの分かりやすさ
- 一括操作の安全性・効率性

## 7. Completion Criteria（完了基準）

### 7.1 機能完了基準
- [ ] **TODO基本機能**: 作成・編集・削除・完了が正常動作
- [ ] **検索・フィルタリング**: 複数条件での高速検索が可能
- [ ] **AI抽出連携**: 承認・拒否・編集ワークフローが正常動作
- [ ] **企業紐付け**: 企業管理（004）との完全連携
- [ ] **権限制御**: ロール・担当者権限による適切なアクセス制御
- [ ] **一括操作**: 安全で効率的な一括処理機能
- [ ] **リアルタイム更新**: WebSocketによる即座な状態同期

### 7.2 パフォーマンス完了基準
- [ ] **レスポンス時間**: 1000件TODOで2秒以内検索
- [ ] **同時接続**: 50ユーザー同時操作でも正常動作
- [ ] **メモリ効率**: フロントエンド使用量が適切な範囲内

### 7.3 ユーザビリティ完了基準
- [ ] **直感的操作**: 新規ユーザーが5分以内にTODO作成可能
- [ ] **AI承認フロー**: 抽出されたTODOの承認が30秒以内で可能
- [ ] **モバイル対応**: タブレット・スマートフォンでの基本操作が可能

### 7.4 統合完了基準
- [ ] **企業管理統合**: 企業詳細画面でのTODO表示・操作
- [ ] **ユーザー管理統合**: 担当者変更時のTODO自動更新
- [ ] **Gmail連携準備**: AI抽出TODO受信の受け皿として機能

**実装完了判定**: 上記全基準を満たし、手動・自動テストが全て通過した時点で完了とする。