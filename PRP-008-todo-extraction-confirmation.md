# PRP-008: TODO抽出確認実装計画書

## 1. Goal（目標）

TODO抽出確認（P-012）の完全実装により、営業担当者・管理者が以下を達成できる状態を実現する：

- **AI抽出TODO確認**: Gmail連携で自動抽出されたTODOの承認・編集・却下ワークフロー
- **信頼度ベース管理**: AI信頼度による自動分類・一括処理機能
- **抽出精度向上**: 人間フィードバックによるAI学習・精度改善システム
- **効率的確認作業**: 信頼度フィルタ・一括操作による大量TODO効率的処理
- **元データ連携**: 抽出元メール・文書の即座確認・検証機能
- **TODO管理統合**: 承認されたTODOの自動TODO管理（005）システム登録

## 2. Why（理由）

### ビジネス価値
- **業務自動化効果**: 手動TODO作成作業の大幅削減による生産性向上
- **見落とし防止**: AI抽出による重要タスクの確実な検出・管理
- **品質保証**: 人間による確認・編集によるTODO品質の保証
- **学習効果**: フィードバックによるAI精度向上・長期的効率化

### 技術的必要性
- **Gmail連携完結**: Gmail設定（006）・ログページ（007）で取得したデータの活用
- **TODO管理統合**: TODO管理（005）への自動登録・連携システム
- **AI学習基盤**: 人間フィードバックによるAI改善システムの確立
- **ワークフロー最適化**: 手動確認プロセスの効率化・標準化

### 実装優先度の理由
- **順序008**: Gmail連携機能群（006-007）の完結として必須
- **AI活用完成**: Gmail→AI抽出→人間確認→TODO登録の完全自動化
- **商材管理準備**: 次段階（009）以降の商材・契約管理の前に業務効率化を完成

## 3. What（要件）

### ユーザーストーリー

**営業担当者として**
- AI抽出されたTODOを一覧で確認・評価できる
- 抽出されたTODOを承認・編集・却下できる
- TODO内容・期限・優先度・担当者を調整できる
- 抽出元メール・文書を即座に確認できる
- 信頼度による自動フィルタリングで効率的に確認できる

**チームリーダーとして**
- チーム全体のAI抽出TODO状況を監視できる
- 信頼度の低いTODOの確認・指導ができる
- 一括承認・却下による効率的な処理ができる
- AI抽出精度の傾向・改善状況を確認できる

**システム管理者として**
- AI抽出設定・閾値を調整できる
- 抽出統計・精度指標を分析できる
- 誤抽出パターンの分析・改善ができる
- システム全体のAI学習状況を監視できる

### 技術要件

**フロントエンド要件**
- Material-UIベースの確認ワークフロー画面
- 信頼度ベースの色分け・フィルタリング
- 抽出元データのプレビュー・詳細表示
- 一括操作機能（承認・却下・信頼度別処理）
- リアルタイム更新・統計表示

**バックエンド要件**
- AI抽出TODO管理・ワークフロー処理
- 信頼度計算・分類アルゴリズム
- 人間フィードバック学習システム
- 抽出統計・精度分析機能
- TODO管理（005）システムとの自動連携

**成功基準**
- AI抽出精度の継続的向上（月次5%改善）
- 人間確認作業の効率化（従来比70%時間短縮）
- 誤抽出率の低減（信頼度80%以上で95%精度）
- TODO登録までの完全自動化

## 4. All Needed Context（必要な情報）

### A. API仕様（schemas/index.tsから抜粋）

```typescript
// ========== AI TODO抽出確認関連 ==========
export enum AITodoExtractionStatus {
  PENDING = 'pending',           // 確認待ち
  APPROVED = 'approved',         // 承認済み
  REJECTED = 'rejected',         // 却下
  EDITED = 'edited',            // 編集済み
  AUTO_APPROVED = 'auto_approved' // 自動承認
}

export enum AIConfidenceLevel {
  HIGH = 'high',      // 80%以上
  MEDIUM = 'medium',  // 50-79%
  LOW = 'low'         // 50%未満
}

export interface AIExtractedTodo {
  id: ID;
  originalText: string;
  extractedTitle: string;
  extractedDescription?: string;
  suggestedPriority: TodoPriority;
  suggestedDueDate?: string;
  suggestedAssigneeId?: ID;
  suggestedCompanyId?: ID;
  suggestedTags: string[];
  confidenceScore: number; // 0-100
  confidenceLevel: AIConfidenceLevel;
  status: AITodoExtractionStatus;
  sourceType: 'email' | 'document' | 'call_transcript';
  sourceId: ID;
  sourceMetadata: {
    emailId?: ID;
    emailSubject?: string;
    emailFrom?: string;
    documentId?: ID;
    documentName?: string;
    extractedFrom?: string; // 抽出元テキスト位置
    highlightedText?: string;
  };
  extractedAt: string;
  extractedBy: ID; // AI system user
  reviewedAt?: string;
  reviewedBy?: ID;
  rejectionReason?: string;
  approvedTodoId?: ID; // 承認後のTODO ID
  aiModel: string;
  aiVersion: string;
  learningFeedback?: {
    isCorrect: boolean;
    improvedText?: string;
    improvedPriority?: TodoPriority;
    improvedDueDate?: string;
    feedbackNotes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AITodoReviewRequest {
  extractedTodoId: ID;
  action: 'approve' | 'reject' | 'edit';
  editedTodo?: {
    title?: string;
    description?: string;
    priority?: TodoPriority;
    dueDate?: string;
    assigneeId?: ID;
    companyId?: ID;
    tags?: string[];
  };
  rejectionReason?: string;
  learningFeedback?: {
    isCorrect: boolean;
    improvedText?: string;
    improvedPriority?: TodoPriority;
    improvedDueDate?: string;
    feedbackNotes?: string;
  };
}

export interface AITodoBulkReviewRequest {
  extractedTodoIds: ID[];
  action: 'approve' | 'reject';
  rejectionReason?: string;
  confidenceThreshold?: number;
}

export interface AITodoSearchRequest {
  status?: AITodoExtractionStatus[];
  confidenceLevel?: AIConfidenceLevel[];
  companyId?: ID;
  sourceType?: ('email' | 'document' | 'call_transcript')[];
  dateFrom?: string;
  dateTo?: string;
  assigneeId?: ID;
  searchTerm?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'extractedAt' | 'confidenceScore' | 'reviewedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AITodoSearchResponse {
  extractedTodos: AIExtractedTodo[];
  total: number;
  offset: number;
  limit: number;
  stats: AITodoExtractionStats;
}

export interface AITodoExtractionStats {
  totalExtracted: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  edited: number;
  autoApproved: number;
  averageConfidence: number;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  accuracyMetrics: {
    precisionRate: number;    // 正確性
    recallRate: number;       // 網羅性
    f1Score: number;          // 総合スコア
  };
  dailyExtractionTrend: Array<{
    date: string;
    extracted: number;
    approved: number;
    rejected: number;
  }>;
}

export interface AIModelConfiguration {
  id: ID;
  modelName: string;
  version: string;
  confidenceThreshold: number;
  autoApprovalThreshold: number;
  extractionPrompt: string;
  categories: string[];
  priorityKeywords: Record<TodoPriority, string[]>;
  isActive: boolean;
  lastTrained: string;
  performanceMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
}

// ========== APIパス（AI TODO抽出確認関連） ==========
export const API_PATHS = {
  // ... 既存のパス ...
  
  // AI抽出TODO確認
  AI_EXTRACTED_TODOS: '/api/ai/todos/extracted',
  AI_EXTRACTED_TODO_DETAIL: '/api/ai/todos/extracted/:id',
  AI_TODO_REVIEW: '/api/ai/todos/review',
  AI_TODO_BULK_REVIEW: '/api/ai/todos/bulk-review',
  AI_TODO_SEARCH: '/api/ai/todos/search',
  AI_TODO_STATS: '/api/ai/todos/stats',
  
  // 抽出元データ
  AI_TODO_SOURCE_PREVIEW: '/api/ai/todos/:id/source/preview',
  AI_TODO_SOURCE_FULL: '/api/ai/todos/:id/source/full',
  
  // AI設定・学習
  AI_MODEL_CONFIG: '/api/ai/config',
  AI_MODEL_RETRAIN: '/api/ai/retrain',
  AI_EXTRACTION_TRIGGER: '/api/ai/extract/trigger',
  
  // 学習フィードバック
  AI_LEARNING_FEEDBACK: '/api/ai/learning/feedback',
  AI_PERFORMANCE_ANALYTICS: '/api/ai/analytics/performance',
} as const;
```

### B. AI抽出・学習フロー設計

**Phase 1: AI抽出処理**
1. Gmail新着メール→AI解析トリガー
2. メール内容からTODO候補抽出
3. 信頼度スコア計算・分類
4. 抽出結果のデータベース保存

**Phase 2: 人間確認プロセス**
1. 抽出されたTODOの一覧表示
2. 信頼度・内容による確認・編集
3. 承認・却下・編集の決定
4. 承認されたTODOのTODO管理（005）登録

**Phase 3: 学習フィードバック**
1. 人間の判断をAI学習データとして蓄積
2. 定期的なモデル再学習
3. 精度指標の改善・監視
4. 抽出設定の最適化

### C. モックアップ分析（mockups/todo-extraction.html）

**主要機能エリア**
1. **ツールバー**: ステータス・信頼度・企業によるフィルタリング
2. **一括操作**: 信頼度ベースの一括承認・却下
3. **TODO一覧**: 抽出されたTODOの詳細表示・個別操作
4. **サイドバー**: 抽出元メールプレビュー・統計・一括操作

**重要なUI要素**
- 信頼度プログレスバー（高・中・低の色分け）
- ステータスバッジ（確認待ち・承認済み・却下・編集済み）
- 抽出元メールのハイライト表示
- TODO詳細情報（企業・期限・優先度・担当者）
- 個別操作ボタン（承認・編集・却下）

### D. 他システム連携

**Gmail設定（006）・ログページ（007）との連携**
- Gmail同期メールからのAI抽出トリガー
- 抽出元メールの詳細表示・参照
- メール内容のハイライト・該当箇所表示

**TODO管理（005）との連携**
- 承認されたTODOの自動登録
- TODO作成時の企業・担当者自動設定
- 抽出元情報の保持・参照機能

**企業管理（004）との連携**
- メールドメインによる企業自動識別
- 企業別抽出統計・精度分析
- 担当者による自動割り当て

## 5. Implementation Blueprint（実装設計図）

### Phase 1: Backend Implementation

**1.1 AI抽出TODO管理**
```typescript
// backend/src/features/ai/controllers/AITodoExtractionController.ts
export class AITodoExtractionController {
  async getExtractedTodos(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 抽出されたTODO一覧取得
  }
  
  async getExtractedTodoDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 抽出TODO詳細・抽出元データ取得
  }
  
  async reviewTodo(req: AuthenticatedRequest, res: Response): Promise<void> {
    // TODO承認・編集・却下処理
  }
  
  async bulkReviewTodos(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 一括承認・却下処理
  }
  
  async searchExtractedTodos(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 高度な検索・フィルタリング
  }
  
  async getExtractionStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 抽出統計・精度指標取得
  }
  
  async getSourcePreview(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 抽出元データプレビュー
  }
  
  async triggerReExtraction(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 再抽出実行
  }
}
```

**1.2 AI抽出エンジン**
```typescript
// backend/src/features/ai/services/TodoExtractionService.ts
export class TodoExtractionService {
  async extractTodosFromEmail(emailId: string): Promise<AIExtractedTodo[]> {
    // メールからTODO抽出
    const email = await this.getEmailContent(emailId);
    const extractionResults = await this.aiEngine.extractTodos(email);
    
    return extractionResults.map(result => ({
      ...result,
      confidenceScore: this.calculateConfidence(result),
      confidenceLevel: this.categorizeConfidence(result.confidenceScore)
    }));
  }
  
  async calculateConfidence(extractionResult: any): Promise<number> {
    // 信頼度スコア計算（複数要因による）
    const factors = {
      textClarity: this.analyzeTextClarity(extractionResult.originalText),
      contextRelevance: this.analyzeContextRelevance(extractionResult),
      keywordPresence: this.analyzeKeywordPresence(extractionResult),
      grammarCorrectness: this.analyzeGrammar(extractionResult.extractedTitle),
      dateTimePresence: this.analyzeDateTimePresence(extractionResult)
    };
    
    return this.calculateWeightedScore(factors);
  }
  
  async processReviewFeedback(
    extractedTodoId: string,
    review: AITodoReviewRequest
  ): Promise<void> {
    // 人間フィードバックの学習データ蓄積
    await this.learningService.addFeedback(extractedTodoId, review);
    
    if (review.action === 'approve') {
      await this.createApprovedTodo(extractedTodoId, review.editedTodo);
    }
    
    // AI学習のためのデータ準備
    await this.prepareLearningData(extractedTodoId, review);
  }
  
  async retainModel(): Promise<void> {
    // 蓄積されたフィードバックでモデル再学習
    const trainingData = await this.learningService.getTrainingData();
    await this.aiEngine.retrain(trainingData);
    await this.updatePerformanceMetrics();
  }
}
```

**1.3 AI学習・改善システム**
```typescript
// backend/src/features/ai/services/AILearningService.ts
export class AILearningService {
  async addFeedback(
    extractedTodoId: string,
    review: AITodoReviewRequest
  ): Promise<void> {
    // フィードバックデータ蓄積
    const feedback = {
      extractedTodoId,
      isCorrect: review.action === 'approve',
      humanDecision: review.action,
      improvements: review.editedTodo,
      rejectionReason: review.rejectionReason,
      timestamp: new Date().toISOString()
    };
    
    await this.feedbackRepository.save(feedback);
  }
  
  async analyzePerformance(): Promise<AITodoExtractionStats> {
    // 性能分析・精度計算
    const metrics = await this.calculateAccuracyMetrics();
    const trends = await this.analyzeTrends();
    const distribution = await this.analyzeConfidenceDistribution();
    
    return {
      ...metrics,
      dailyExtractionTrend: trends,
      confidenceDistribution: distribution
    };
  }
  
  async identifyImprovementAreas(): Promise<{
    commonMistakes: string[];
    improvementSuggestions: string[];
    retrainingRecommendation: boolean;
  }> {
    // 改善領域の特定
    const mistakes = await this.analyzeCommonMistakes();
    const suggestions = await this.generateImprovementSuggestions(mistakes);
    
    return {
      commonMistakes: mistakes,
      improvementSuggestions: suggestions,
      retrainingRecommendation: this.shouldRetrain(mistakes)
    };
  }
}
```

**1.4 データベース設計**
```sql
-- AI抽出TODOテーブル
CREATE TABLE ai_extracted_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_text TEXT NOT NULL,
  extracted_title VARCHAR(500) NOT NULL,
  extracted_description TEXT,
  suggested_priority todo_priority_enum NOT NULL,
  suggested_due_date TIMESTAMP WITH TIME ZONE,
  suggested_assignee_id UUID REFERENCES users(id),
  suggested_company_id UUID REFERENCES companies(id),
  suggested_tags TEXT[],
  confidence_score DECIMAL(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  confidence_level ai_confidence_level_enum NOT NULL,
  status ai_extraction_status_enum NOT NULL DEFAULT 'pending',
  source_type VARCHAR(50) NOT NULL,
  source_id UUID NOT NULL,
  source_metadata JSONB,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  extracted_by UUID NOT NULL REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  approved_todo_id UUID REFERENCES todos(id),
  ai_model VARCHAR(100) NOT NULL,
  ai_version VARCHAR(50) NOT NULL,
  learning_feedback JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI学習フィードバックテーブル
CREATE TABLE ai_learning_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extracted_todo_id UUID NOT NULL REFERENCES ai_extracted_todos(id),
  is_correct BOOLEAN NOT NULL,
  human_decision VARCHAR(50) NOT NULL,
  improved_text TEXT,
  improved_priority todo_priority_enum,
  improved_due_date TIMESTAMP WITH TIME ZONE,
  feedback_notes TEXT,
  feedback_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI性能メトリクステーブル
CREATE TABLE ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  measurement_date DATE NOT NULL,
  precision_rate DECIMAL(5,4) NOT NULL,
  recall_rate DECIMAL(5,4) NOT NULL,
  f1_score DECIMAL(5,4) NOT NULL,
  accuracy_rate DECIMAL(5,4) NOT NULL,
  total_extractions INTEGER NOT NULL,
  correct_extractions INTEGER NOT NULL,
  false_positives INTEGER NOT NULL,
  false_negatives INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_ai_extracted_todos_status ON ai_extracted_todos(status, extracted_at DESC);
CREATE INDEX idx_ai_extracted_todos_confidence ON ai_extracted_todos(confidence_level, confidence_score DESC);
CREATE INDEX idx_ai_extracted_todos_company ON ai_extracted_todos(suggested_company_id, status);
CREATE INDEX idx_ai_extracted_todos_source ON ai_extracted_todos(source_type, source_id);
CREATE INDEX idx_ai_learning_feedback_todo ON ai_learning_feedback(extracted_todo_id);
```

### Phase 2A: Frontend Mock Implementation

**2A.1 コンポーネント構造**
```typescript
// frontend/src/pages/AITodoExtractionPage.tsx
export const AITodoExtractionPage: React.FC = () => {
  return (
    <div className="ai-extraction-container">
      <PageHeader title="TODO抽出確認" />
      <div className="extraction-content">
        <ExtractionToolbar />
        <div className="main-content-grid">
          <ExtractedTodoList />
          <ExtractionSidebar />
        </div>
      </div>
    </div>
  );
};

// frontend/src/components/ai/ExtractionToolbar.tsx
export const ExtractionToolbar: React.FC = () => {
  return (
    <div className="extraction-toolbar">
      <FilterControls />
      <BulkActionButtons />
    </div>
  );
};

// frontend/src/components/ai/ExtractedTodoList.tsx
export const ExtractedTodoList: React.FC = () => {
  return (
    <div className="extracted-todo-list">
      <ListHeader />
      <TodoItems />
    </div>
  );
};

// frontend/src/components/ai/ExtractionSidebar.tsx
export const ExtractionSidebar: React.FC = () => {
  return (
    <div className="extraction-sidebar">
      <SourcePreview />
      <ExtractionStats />
      <BulkOperations />
    </div>
  );
};
```

**2A.2 状態管理**
```typescript
// frontend/src/stores/aiExtractionStore.ts
interface AIExtractionState {
  extractedTodos: AIExtractedTodo[];
  selectedTodo: AIExtractedTodo | null;
  filters: {
    status: AITodoExtractionStatus[];
    confidenceLevel: AIConfidenceLevel[];
    companyId?: string;
    dateRange?: { from: string; to: string };
  };
  stats: AITodoExtractionStats | null;
  sourcePreview: any | null;
  loading: boolean;
  error: string | null;
}

export const useAIExtractionStore = create<AIExtractionState>((set, get) => ({
  // @MARK: モックデータから開始、後でAPI連携
  extractedTodos: MOCK_EXTRACTED_TODOS,
  selectedTodo: null,
  filters: {
    status: [],
    confidenceLevel: [],
  },
  stats: MOCK_EXTRACTION_STATS,
  sourcePreview: null,
  loading: false,
  error: null,
  
  // TODO選択
  selectTodo: async (todo: AIExtractedTodo) => {
    set({ selectedTodo: todo, loading: true });
    // @MARK: API連携時に実装
    const sourcePreview = await aiExtractionService.getSourcePreview(todo.id);
    set({ sourcePreview, loading: false });
  },
  
  // レビュー操作
  reviewTodo: async (todoId: string, review: AITodoReviewRequest) => {
    // @MARK: API連携時に実装
    await aiExtractionService.reviewTodo(todoId, review);
    
    // ローカル状態更新
    const todos = get().extractedTodos.map(todo => 
      todo.id === todoId 
        ? { ...todo, status: review.action === 'approve' ? 'approved' : 'rejected' }
        : todo
    );
    set({ extractedTodos: todos });
  },
  
  // 一括操作
  bulkReview: async (todoIds: string[], action: 'approve' | 'reject') => {
    // @MARK: API連携時に実装
    await aiExtractionService.bulkReview({ extractedTodoIds: todoIds, action });
    
    // ローカル状態更新
    const status = action === 'approve' ? 'approved' : 'rejected';
    const todos = get().extractedTodos.map(todo => 
      todoIds.includes(todo.id) ? { ...todo, status } : todo
    );
    set({ extractedTodos: todos });
  },
  
  // フィルター更新
  updateFilters: (newFilters: Partial<typeof get().filters>) => {
    set({ filters: { ...get().filters, ...newFilters } });
    // @MARK: フィルター適用ロジック
  },
  
  // 統計取得
  loadStats: async () => {
    // @MARK: API連携時に実装
    const stats = await aiExtractionService.getStats();
    set({ stats });
  },
  
  // 再抽出実行
  triggerReExtraction: async () => {
    // @MARK: API連携時に実装
    await aiExtractionService.triggerReExtraction();
    // 一覧更新
  }
}));
```

### Phase 2B: API Integration

**2B.1 API統合**
```typescript
// frontend/src/services/aiExtractionService.ts
export class AIExtractionService {
  private apiClient: ApiClient;
  
  // @MARK: Phase 2B で実装
  async getExtractedTodos(searchRequest?: AITodoSearchRequest): Promise<AITodoSearchResponse> {
    return this.apiClient.post(API_PATHS.AI_TODO_SEARCH, searchRequest || {});
  }
  
  async getExtractedTodoDetail(todoId: string): Promise<AIExtractedTodo> {
    return this.apiClient.get(API_PATHS.AI_EXTRACTED_TODO_DETAIL.replace(':id', todoId));
  }
  
  async reviewTodo(todoId: string, review: AITodoReviewRequest): Promise<void> {
    return this.apiClient.post(API_PATHS.AI_TODO_REVIEW, {
      extractedTodoId: todoId,
      ...review
    });
  }
  
  async bulkReview(request: AITodoBulkReviewRequest): Promise<void> {
    return this.apiClient.post(API_PATHS.AI_TODO_BULK_REVIEW, request);
  }
  
  async getSourcePreview(todoId: string): Promise<any> {
    return this.apiClient.get(API_PATHS.AI_TODO_SOURCE_PREVIEW.replace(':id', todoId));
  }
  
  async getSourceFull(todoId: string): Promise<any> {
    return this.apiClient.get(API_PATHS.AI_TODO_SOURCE_FULL.replace(':id', todoId));
  }
  
  async getStats(): Promise<AITodoExtractionStats> {
    return this.apiClient.get(API_PATHS.AI_TODO_STATS);
  }
  
  async triggerReExtraction(): Promise<void> {
    return this.apiClient.post(API_PATHS.AI_EXTRACTION_TRIGGER);
  }
  
  async submitLearningFeedback(feedback: any): Promise<void> {
    return this.apiClient.post(API_PATHS.AI_LEARNING_FEEDBACK, feedback);
  }
}
```

**2B.2 リアルタイム更新**
```typescript
// frontend/src/hooks/useAIExtractionRealtime.ts
export const useAIExtractionRealtime = () => {
  const aiExtractionStore = useAIExtractionStore();
  
  useEffect(() => {
    // @MARK: WebSocket接続でリアルタイム更新
    const ws = new WebSocket(`${WS_BASE_URL}/ai/extraction`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      switch (update.type) {
        case 'NEW_EXTRACTION':
          aiExtractionStore.addExtractedTodo(update.extractedTodo);
          break;
        case 'TODO_REVIEWED':
          aiExtractionStore.updateTodoStatus(update.todoId, update.status);
          break;
        case 'BULK_OPERATION_COMPLETED':
          aiExtractionStore.updateMultipleTodos(update.todoIds, update.status);
          break;
        case 'STATS_UPDATED':
          aiExtractionStore.updateStats(update.stats);
          break;
        case 'MODEL_RETRAINED':
          aiExtractionStore.showRetrainingNotification(update.metrics);
          break;
      }
    };
    
    return () => ws.close();
  }, []);
};
```

### Phase 3: Human Validation

**3.1 機能検証項目**
- [ ] AI抽出TODO一覧の正確な表示
- [ ] 信頼度計算・分類の妥当性
- [ ] 承認・編集・却下ワークフローの正常動作
- [ ] 一括操作の安全性・効率性
- [ ] 抽出元データプレビューの正確性
- [ ] TODO管理（005）への自動登録
- [ ] 学習フィードバックシステムの動作
- [ ] AI精度向上の確認

**3.2 AI精度テスト**
- [ ] 信頼度80%以上での95%精度達成
- [ ] 誤抽出パターンの分析・改善
- [ ] 人間フィードバックによる学習効果確認

## 6. Validation Method（検証方法）

### 6.1 API動作確認
```bash
# 抽出TODO検索
curl -X POST "http://localhost:3001/api/ai/todos/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "status": ["pending"],
    "confidenceLevel": ["high"],
    "limit": 20
  }'

# TODO承認
curl -X POST "http://localhost:3001/api/ai/todos/review" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "extractedTodoId": "todo-123",
    "action": "approve",
    "learningFeedback": {
      "isCorrect": true,
      "feedbackNotes": "正確な抽出"
    }
  }'

# 一括承認
curl -X POST "http://localhost:3001/api/ai/todos/bulk-review" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "extractedTodoIds": ["todo-123", "todo-456"],
    "action": "approve",
    "confidenceThreshold": 80
  }'

# 統計取得
curl -X GET "http://localhost:3001/api/ai/todos/stats" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 6.2 AI精度検証
- 手動作成TODOとAI抽出TODOの比較
- 信頼度スコアと実際の精度の相関確認
- フィードバック学習による改善効果測定

### 6.3 ワークフロー確認
- Gmail→AI抽出→確認→TODO登録の完全フロー
- 一括操作の効率性・安全性確認
- 抽出元データ参照の正確性確認

## 7. Completion Criteria（完了基準）

### 7.1 機能完了基準
- [ ] **AI抽出管理**: 抽出されたTODOの完全な確認・管理ワークフロー
- [ ] **信頼度システム**: 精確な信頼度計算・分類・フィルタリング機能
- [ ] **レビューワークフロー**: 承認・編集・却下の効率的な処理
- [ ] **一括操作**: 信頼度ベースの安全な一括処理機能
- [ ] **抽出元連携**: 元メール・文書の即座確認・検証機能
- [ ] **TODO統合**: 承認TODOの自動TODO管理（005）登録

### 7.2 AI精度完了基準
- [ ] **高信頼度精度**: 信頼度80%以上で95%以上の精度達成
- [ ] **学習効果**: 人間フィードバックによる月次5%精度向上
- [ ] **誤抽出削減**: 不適切な抽出の月次10%削減

### 7.3 効率性完了基準
- [ ] **処理速度**: 100件TODO確認が従来比70%時間短縮
- [ ] **自動化率**: 信頼度閾値による自動承認の適切な実行
- [ ] **ユーザビリティ**: 新規ユーザーが5分以内に基本操作習得

### 7.4 統合完了基準
- [ ] **Gmail連携統合**: Gmail設定・ログページとの完全連携
- [ ] **TODO管理統合**: 承認TODOの seamless なTODO管理登録
- [ ] **学習システム統合**: 継続的なAI改善システムの確立

**実装完了判定**: 上記全基準を満たし、AI精度テスト・効率性テスト・統合テストが全て通過した時点で完了とする。