# PRP-013: データインポート・マッピング実装計画書

## 1. Goal（目標）

データインポート・マッピング（P-007）の完全実装により、システム管理者・営業担当者が以下を達成できる状態を実現する：

- **既存データ移行**: Excel・CSV・外部システムからの顧客・商材・契約データの一括インポート
- **柔軟なマッピング**: 多様なデータ形式・項目名に対応する柔軟なフィールドマッピング機能
- **データ品質確保**: インポート前のプレビュー・検証・重複チェック・エラー修正機能
- **カスタム項目対応**: システム標準項目以外のカスタム項目の動的作成・マッピング機能
- **バッチ処理**: 大量データの効率的なバッチインポート・進捗監視・エラーハンドリング
- **統合検証**: インポート後のデータ整合性・関連性の検証・修正・最適化機能

## 2. Why（理由）

### ビジネス価値
- **導入効率化**: 既存システムからの迅速なデータ移行による短期間での運用開始
- **運用継続性**: 定期的な外部データ取り込みによる運用効率の向上・データ更新自動化
- **データ品質向上**: 統一されたデータ形式・検証プロセスによるデータ品質の確保
- **導入コスト削減**: 手動データ入力作業の削減による導入・運用コストの最適化

### 技術的必要性
- **システム完成**: CRM機能完成後の実用化に必要な既存データ統合機能
- **データ連携**: 企業（004）・商材（009-010）・契約（011）・提案（012）の統合データ管理
- **運用基盤**: システム運用開始時の初期データセットアップ・継続的データ更新基盤
- **拡張性確保**: 将来的な外部システム連携・API統合の基盤機能

### 実装優先度の理由
- **順序013**: 全機能実装完了後の実用化準備として最終実装項目
- **統合検証**: 全システム機能の統合動作確認・データ整合性検証の機会
- **運用準備**: 実際の顧客データでの動作確認・パフォーマンステストの実施

## 3. What（要件）

### ユーザーストーリー

**システム管理者として**
- 既存の顧客管理システム・Excelファイルから顧客データを一括インポートできる
- 多様なデータ形式・項目名を柔軟にシステム項目にマッピングできる
- インポート前にデータプレビュー・検証・エラー修正ができる
- インポート処理の進捗監視・エラーハンドリング・ロールバックができる
- インポート結果の検証・レポート・品質評価ができる

**営業担当者として**
- 営業活動で収集した見込み客リストを効率的にシステムに取り込める
- 展示会・セミナーの参加者リストを一括登録できる
- 既存の商材情報・価格リストをシステムに統合できる
- インポートしたデータの正確性・関連性を確認できる

**データ管理者として**
- 定期的な外部データソースからの自動データ更新ができる
- データ品質基準・検証ルール・変換ルールを設定・管理できる
- インポート履歴・変更履歴・監査証跡を適切に管理できる
- 大量データの効率的な処理・パフォーマンス最適化ができる

### 技術要件

**フロントエンド要件**
- Material-UIベースのステップ・バイ・ステップ インポートウィザード
- ドラッグ&ドロップファイルアップロード・プレビュー機能
- 動的フィールドマッピング・自動マッピング・カスタム項目作成機能
- リアルタイム進捗表示・エラー表示・結果レポート機能
- Chart.js によるインポート統計・データ品質・分析表示

**バックエンド要件**
- 多形式ファイル解析（Excel・CSV・JSON・XML）のRESTful API
- 柔軟なフィールドマッピング・データ変換・検証エンジン
- バッチ処理・キュー管理・進捗追跡・エラーハンドリング機能
- 重複検出・データマージ・整合性検証・ロールバック機能
- カスタム項目自動生成・スキーマ拡張・メタデータ管理機能

**成功基準**
- 10万件データの30分以内インポート
- 95%以上の自動マッピング精度
- インポートエラー率5%以下
- 全システムとのデータ整合性確保

## 4. All Needed Context（必要な情報）

### A. API仕様（schemas/index.tsから抜粋）

```typescript
// ========== データインポート・マッピング関連 ==========
export enum ImportDataType {
  COMPANIES = 'companies',              // 企業データ
  PRODUCT_MASTERS = 'product_masters',  // 商材マスタ
  CONTRACTS = 'contracts',              // 契約データ
  PROPOSALS = 'proposals',              // 提案データ
  USERS = 'users',                     // ユーザーデータ
  CUSTOM = 'custom'                    // カスタムデータ
}

export enum ImportStatus {
  UPLOADED = 'uploaded',               // アップロード完了
  ANALYZING = 'analyzing',             // ファイル解析中
  MAPPING = 'mapping',                 // マッピング設定中
  VALIDATING = 'validating',           // データ検証中
  IMPORTING = 'importing',             // インポート実行中
  COMPLETED = 'completed',             // インポート完了
  FAILED = 'failed',                   // インポート失敗
  CANCELLED = 'cancelled'              // インポート中断
}

export enum FieldMappingType {
  DIRECT = 'direct',                   // 直接マッピング
  TRANSFORM = 'transform',             // 変換マッピング
  CUSTOM = 'custom',                   // カスタム項目作成
  IGNORE = 'ignore',                   // 無視
  CONSTANT = 'constant'                // 定数値設定
}

export interface ImportSession {
  id: ID;
  dataType: ImportDataType;
  status: ImportStatus;
  fileName: string;
  fileSize: number;
  filePath: string;
  mimeType: string;
  
  // ファイル解析結果
  fileAnalysis: {
    totalRows: number;
    totalColumns: number;
    hasHeader: boolean;
    encoding: string;
    delimiter?: string;
    sheetNames?: string[];
    selectedSheet?: string;
    sampleData: Array<Record<string, any>>;
    detectedColumns: Array<{
      index: number;
      name: string;
      dataType: 'string' | 'number' | 'date' | 'boolean';
      sampleValues: any[];
      nullCount: number;
      uniqueCount: number;
    }>;
  };
  
  // フィールドマッピング
  fieldMappings: Array<{
    sourceColumn: string;
    sourceIndex: number;
    targetField: string;
    mappingType: FieldMappingType;
    transformation?: {
      type: 'format' | 'calculation' | 'lookup' | 'custom';
      parameters: Record<string, any>;
    };
    validation?: {
      required: boolean;
      dataType: string;
      format?: string;
      enumValues?: string[];
      minLength?: number;
      maxLength?: number;
      minValue?: number;
      maxValue?: number;
    };
    customField?: {
      name: string;
      type: 'string' | 'number' | 'date' | 'boolean' | 'select';
      options?: string[];
      defaultValue?: any;
    };
  }>;
  
  // 検証結果
  validationResult?: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
    errors: Array<{
      row: number;
      column: string;
      errorType: string;
      message: string;
      suggestedFix?: string;
    }>;
    warnings: Array<{
      row: number;
      column: string;
      warningType: string;
      message: string;
    }>;
    duplicates: Array<{
      rows: number[];
      duplicateField: string;
      value: any;
      action: 'skip' | 'merge' | 'update';
    }>;
  };
  
  // インポート実行
  importConfig: {
    batchSize: number;
    skipErrors: boolean;
    updateExisting: boolean;
    duplicateHandling: 'skip' | 'update' | 'merge' | 'create_new';
    rollbackOnError: boolean;
    notifyOnCompletion: boolean;
  };
  
  // インポート結果
  importResult?: {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    skippedCount: number;
    updatedCount: number;
    createdCount: number;
    processingTime: number; // seconds
    memoryUsage: number;   // MB
    errorDetails: Array<{
      row: number;
      error: string;
      data: Record<string, any>;
    }>;
    summary: {
      newRecords: number;
      updatedRecords: number;
      skippedRecords: number;
      duplicatesFound: number;
      customFieldsCreated: number;
    };
  };
  
  // メタデータ
  createdAt: string;
  updatedAt: string;
  createdBy: ID;
  completedAt?: string;
  
  // 設定
  options: {
    allowCustomFields: boolean;
    autoMapping: boolean;
    preserveOriginalData: boolean;
    generateReport: boolean;
    notificationEmail?: string;
  };
}

export interface ImportSessionCreateRequest {
  dataType: ImportDataType;
  fileName: string;
  options?: {
    allowCustomFields?: boolean;
    autoMapping?: boolean;
    preserveOriginalData?: boolean;
    generateReport?: boolean;
    notificationEmail?: string;
  };
}

export interface ImportFileUploadRequest {
  sessionId: ID;
  file: File;
}

export interface ImportMappingUpdateRequest {
  sessionId: ID;
  fieldMappings: Array<{
    sourceColumn: string;
    sourceIndex: number;
    targetField: string;
    mappingType: FieldMappingType;
    transformation?: any;
    validation?: any;
    customField?: any;
  }>;
}

export interface ImportExecuteRequest {
  sessionId: ID;
  importConfig: {
    batchSize?: number;
    skipErrors?: boolean;
    updateExisting?: boolean;
    duplicateHandling?: 'skip' | 'update' | 'merge' | 'create_new';
    rollbackOnError?: boolean;
    notifyOnCompletion?: boolean;
  };
}

// フィールドマッピング テンプレート
export interface MappingTemplate {
  id: ID;
  name: string;
  description: string;
  dataType: ImportDataType;
  fieldMappings: Array<{
    sourcePattern: string; // 正規表現パターン
    targetField: string;
    mappingType: FieldMappingType;
    transformation?: any;
    validation?: any;
  }>;
  isDefault: boolean;
  usageCount: number;
  createdBy: ID;
  createdAt: string;
  updatedAt: string;
}

// インポート統計・分析
export interface ImportAnalytics {
  totalSessions: number;
  totalImported: number;
  totalErrors: number;
  successRate: number;
  avgProcessingTime: number;
  
  // データタイプ別統計
  dataTypeStats: Array<{
    dataType: ImportDataType;
    sessionCount: number;
    totalRows: number;
    successRate: number;
    avgProcessingTime: number;
  }>;
  
  // 期間別統計
  monthlyStats: Array<{
    month: string;
    sessionCount: number;
    totalRows: number;
    successCount: number;
    errorCount: number;
  }>;
  
  // エラー分析
  commonErrors: Array<{
    errorType: string;
    count: number;
    fields: string[];
    suggestedSolutions: string[];
  }>;
  
  // パフォーマンス分析
  performanceMetrics: {
    avgRowsPerSecond: number;
    avgMemoryUsage: number;
    peakMemoryUsage: number;
    slowestOperations: Array<{
      operation: string;
      avgTime: number;
      bottlenecks: string[];
    }>;
  };
}

// ========== APIパス（データインポート関連） ==========
export const API_PATHS = {
  // ... 既存のパス ...
  
  // データインポート
  IMPORT_SESSIONS: '/api/import/sessions',
  IMPORT_SESSION_DETAIL: '/api/import/sessions/:id',
  IMPORT_SESSION_CREATE: '/api/import/sessions/create',
  
  // ファイル処理
  IMPORT_FILE_UPLOAD: '/api/import/sessions/:id/upload',
  IMPORT_FILE_ANALYZE: '/api/import/sessions/:id/analyze',
  IMPORT_FILE_PREVIEW: '/api/import/sessions/:id/preview',
  
  // マッピング
  IMPORT_MAPPING_UPDATE: '/api/import/sessions/:id/mapping',
  IMPORT_MAPPING_AUTO: '/api/import/sessions/:id/auto-mapping',
  IMPORT_MAPPING_TEMPLATES: '/api/import/mapping-templates',
  IMPORT_MAPPING_TEMPLATE_DETAIL: '/api/import/mapping-templates/:id',
  
  // 検証・プレビュー
  IMPORT_VALIDATE: '/api/import/sessions/:id/validate',
  IMPORT_PREVIEW_DATA: '/api/import/sessions/:id/preview-data',
  IMPORT_DUPLICATE_CHECK: '/api/import/sessions/:id/duplicate-check',
  
  // インポート実行
  IMPORT_EXECUTE: '/api/import/sessions/:id/execute',
  IMPORT_STATUS: '/api/import/sessions/:id/status',
  IMPORT_PROGRESS: '/api/import/sessions/:id/progress',
  IMPORT_CANCEL: '/api/import/sessions/:id/cancel',
  IMPORT_ROLLBACK: '/api/import/sessions/:id/rollback',
  
  // 結果・レポート
  IMPORT_RESULT: '/api/import/sessions/:id/result',
  IMPORT_REPORT: '/api/import/sessions/:id/report',
  IMPORT_ERROR_LOG: '/api/import/sessions/:id/errors',
  IMPORT_EXPORT_RESULT: '/api/import/sessions/:id/export-result',
  
  // 統計・分析
  IMPORT_ANALYTICS: '/api/import/analytics',
  IMPORT_HISTORY: '/api/import/history',
  IMPORT_PERFORMANCE: '/api/import/performance',
  
  // カスタム項目管理
  IMPORT_CUSTOM_FIELDS: '/api/import/custom-fields',
  IMPORT_FIELD_SUGGESTIONS: '/api/import/field-suggestions',
} as const;
```

### B. データフロー設計

**Phase 1: Backend API実装**
1. ImportController: セッション管理・ファイル処理・マッピング・実行制御
2. ファイル解析エンジン（Excel・CSV・JSON・XML対応）
3. フィールドマッピング・データ変換・検証エンジン
4. バッチ処理・キュー管理・進捗追跡システム

**Phase 2A: フロントエンド モック実装**
1. Material-UIベースのインポートウィザード
2. @MARK で API接続ポイントをマーク
3. モックデータでの動作確認

**Phase 2B: API統合**
1. @MARK 箇所を実API呼び出しに変更
2. 全システムとの統合・データ整合性確保
3. エラーハンドリング・パフォーマンス最適化

**Phase 3: 人間による検証**
1. 全機能の動作確認
2. 実データでの統合テスト
3. パフォーマンス・セキュリティ・データ品質確認

### C. モックアップ分析（mockups/data-import-mapping.html）

**主要機能エリア**
1. **ステッパー**: ファイル選択→項目マッピング→プレビュー→インポート実行の4段階プロセス
2. **ファイル情報**: アップロードファイル詳細・変更・解析結果表示
3. **マッピング設定**: Excelカラム→システム項目の柔軟なマッピング設定
4. **自動マッピング**: AI・ルールベースの自動項目マッピング機能

**重要なUI要素**
- ステップ・バイ・ステップのプログレス表示
- ドラッグ&ドロップファイルアップロード
- 動的マッピング設定（マッピング済み・未マッピング・無視）
- マッピング状況サマリー（進捗・統計・予測）
- 自動マッピング結果・確認・調整機能

**特徴的な機能**
- リアルタイムマッピング状況表示
- フィールドタイプ自動検出・検証
- カスタム項目の動的作成機能
- 詳細なエラー・警告表示

### D. 他システム連携

**企業管理（004）との連携**
- 企業データのインポート・マッピング・重複チェック
- 担当者情報・権限設定の統合インポート
- 既存企業データとの整合性確保・マージ処理

**商材マスタ（009）との連携**
- 商材データのインポート・カテゴリ・価格情報の統合
- 商材仕様・カスタム属性の動的インポート
- 商材マスタ拡張・スキーマ進化の対応

**商品管理（010）との連携**
- 企業固有商品設定のインポート・デプロイメント情報
- 商品カスタマイズ・価格調整・条件設定のインポート
- 商材マスタとの関連性維持・データ整合性確保

**契約管理（011）との連携**
- 契約データのインポート・ステータス・期限・条件の統合
- 契約履歴・変更履歴・承認プロセスのインポート
- 企業・商品情報との関連性維持・整合性検証

**提案管理（012）との連携**
- 提案データのインポート・ステータス・商材組み合わせ
- 提案履歴・コミュニケーション履歴・文書のインポート
- 関連する企業・商品・契約情報との整合性確保

## 5. Implementation Blueprint（実装設計図）

### Phase 1: Backend Implementation

**1.1 インポートセッション管理**
```typescript
// backend/src/features/import/controllers/ImportController.ts
export class ImportController {
  async createImportSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    // インポートセッション作成
  }
  
  async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    // ファイルアップロード・保存・基本検証
  }
  
  async analyzeFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    // ファイル解析・構造検出・サンプルデータ抽出
  }
  
  async getImportSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    // インポートセッション詳細取得
  }
  
  async updateMapping(req: AuthenticatedRequest, res: Response): Promise<void> {
    // フィールドマッピング設定・更新
  }
  
  async autoMapping(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 自動マッピング実行・結果返却
  }
  
  async validateData(req: AuthenticatedRequest, res: Response): Promise<void> {
    // データ検証・エラー検出・重複チェック
  }
  
  async previewData(req: AuthenticatedRequest, res: Response): Promise<void> {
    // インポート予定データプレビュー
  }
  
  async executeImport(req: AuthenticatedRequest, res: Response): Promise<void> {
    // インポート実行・バッチ処理開始
  }
  
  async getImportStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    // インポート進捗・ステータス取得
  }
  
  async cancelImport(req: AuthenticatedRequest, res: Response): Promise<void> {
    // インポート中断・クリーンアップ
  }
  
  async getImportResult(req: AuthenticatedRequest, res: Response): Promise<void> {
    // インポート結果・統計・レポート取得
  }
}
```

**1.2 ファイル解析エンジン**
```typescript
// backend/src/features/import/services/FileAnalysisService.ts
export class FileAnalysisService {
  async analyzeFile(filePath: string, mimeType: string): Promise<FileAnalysisResult> {
    // ファイル形式判定・構造解析
  }
  
  async parseExcelFile(filePath: string): Promise<ExcelAnalysisResult> {
    // Excel ファイル解析・シート検出・データ型推定
  }
  
  async parseCSVFile(filePath: string): Promise<CSVAnalysisResult> {
    // CSV ファイル解析・区切り文字検出・エンコーディング判定
  }
  
  async parseJSONFile(filePath: string): Promise<JSONAnalysisResult> {
    // JSON ファイル解析・構造解析・配列検出
  }
  
  async detectDataTypes(data: any[][]): Promise<DataTypeAnalysis[]> {
    // データ型自動検出・統計情報計算
  }
  
  async extractSampleData(
    filePath: string, 
    format: string, 
    sampleSize: number = 100
  ): Promise<any[]> {
    // サンプルデータ抽出・プレビュー用データ生成
  }
  
  async validateFileIntegrity(filePath: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fileInfo: {
      size: number;
      encoding: string;
      lineCount: number;
      columnCount: number;
    };
  }> {
    // ファイル整合性検証・破損チェック
  }
}
```

**1.3 フィールドマッピング・データ変換**
```typescript
// backend/src/features/import/services/MappingService.ts
export class MappingService {
  async suggestAutoMapping(
    sourceColumns: ColumnInfo[], 
    targetSchema: SchemaInfo,
    dataType: ImportDataType
  ): Promise<MappingSuggestion[]> {
    // 自動マッピング提案・類似度計算・ルールベース判定
  }
  
  async validateMapping(mappings: FieldMapping[]): Promise<MappingValidationResult> {
    // マッピング検証・必須項目チェック・競合検出
  }
  
  async applyFieldMapping(
    sourceData: any[], 
    mappings: FieldMapping[]
  ): Promise<{
    mappedData: any[];
    errors: MappingError[];
    warnings: MappingWarning[];
  }> {
    // フィールドマッピング適用・データ変換
  }
  
  async transformData(
    value: any, 
    transformation: DataTransformation
  ): Promise<{
    result: any;
    success: boolean;
    error?: string;
  }> {
    // データ変換・フォーマット・計算・ルックアップ
  }
  
  async createCustomField(
    customFieldDef: CustomFieldDefinition,
    targetTable: string
  ): Promise<CustomField> {
    // カスタム項目動的作成・スキーマ拡張
  }
  
  async saveMappingTemplate(
    templateData: MappingTemplateData
  ): Promise<MappingTemplate> {
    // マッピングテンプレート保存・再利用化
  }
  
  async loadMappingTemplate(
    templateId: string,
    sourceColumns: ColumnInfo[]
  ): Promise<FieldMapping[]> {
    // マッピングテンプレート適用・カスタマイズ
  }
}
```

**1.4 データ検証・品質管理**
```typescript
// backend/src/features/import/services/ValidationService.ts
export class ValidationService {
  async validateImportData(
    data: any[], 
    mappings: FieldMapping[], 
    rules: ValidationRule[]
  ): Promise<ValidationResult> {
    // データ検証・エラー検出・品質評価
  }
  
  async checkDataTypes(data: any[], schema: SchemaInfo): Promise<DataTypeValidationResult> {
    // データ型検証・形式チェック・変換可能性評価
  }
  
  async detectDuplicates(
    data: any[], 
    duplicateKeys: string[]
  ): Promise<DuplicateAnalysisResult> {
    // 重複検出・類似レコード検出・マージ候補抽出
  }
  
  async validateBusinessRules(
    data: any[], 
    businessRules: BusinessRule[]
  ): Promise<BusinessRuleValidationResult> {
    // ビジネスルール検証・制約チェック・整合性確認
  }
  
  async checkReferentialIntegrity(
    data: any[], 
    referenceChecks: ReferenceCheck[]
  ): Promise<ReferentialIntegrityResult> {
    // 参照整合性チェック・外部キー検証・関連性確認
  }
  
  async generateDataQualityReport(
    validationResults: ValidationResult[]
  ): Promise<DataQualityReport> {
    // データ品質レポート生成・統計・改善提案
  }
  
  async suggestDataFixes(
    errors: ValidationError[]
  ): Promise<DataFixSuggestion[]> {
    // データ修正提案・自動修正候補・手動修正ガイド
  }
}
```

**1.5 バッチ処理・インポート実行**
```typescript
// backend/src/features/import/services/ImportExecutionService.ts
export class ImportExecutionService {
  async executeImport(
    sessionId: string, 
    config: ImportConfig
  ): Promise<ImportJob> {
    // インポート実行・バッチ処理開始・進捗追跡
  }
  
  async processBatch(
    batchData: any[], 
    batchNumber: number, 
    sessionId: string
  ): Promise<BatchResult> {
    // バッチデータ処理・エラーハンドリング・進捗更新
  }
  
  async insertData(
    data: any[], 
    targetTable: string, 
    mappings: FieldMapping[]
  ): Promise<InsertResult> {
    // データ挿入・更新・マージ処理
  }
  
  async handleDuplicates(
    duplicates: DuplicateRecord[], 
    handling: DuplicateHandling
  ): Promise<DuplicateHandlingResult> {
    // 重複処理・マージ・スキップ・更新
  }
  
  async updateProgress(
    sessionId: string, 
    progress: ImportProgress
  ): Promise<void> {
    // 進捗更新・リアルタイム通知・ステータス管理
  }
  
  async rollbackImport(sessionId: string): Promise<RollbackResult> {
    // インポートロールバック・データ復旧・整合性復元
  }
  
  async generateImportReport(sessionId: string): Promise<ImportReport> {
    // インポートレポート生成・統計・結果サマリー
  }
  
  async cleanupImportSession(sessionId: string): Promise<void> {
    // セッションクリーンアップ・一時ファイル削除・リソース解放
  }
}
```

**1.6 データベース設計**
```sql
-- インポートセッションテーブル
CREATE TABLE import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type import_data_type_enum NOT NULL,
  status import_status_enum NOT NULL DEFAULT 'uploaded',
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  
  -- ファイル解析結果
  file_analysis JSONB DEFAULT '{}',
  
  -- フィールドマッピング
  field_mappings JSONB DEFAULT '[]',
  
  -- 検証結果
  validation_result JSONB,
  
  -- インポート設定
  import_config JSONB DEFAULT '{}',
  
  -- インポート結果
  import_result JSONB,
  
  -- オプション
  options JSONB DEFAULT '{}',
  
  -- 監査
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id)
);

-- マッピングテンプレートテーブル
CREATE TABLE mapping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  data_type import_data_type_enum NOT NULL,
  field_mappings JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インポートジョブテーブル（非同期処理管理）
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES import_sessions(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress JSONB DEFAULT '{}',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3
);

-- カスタム項目メタデータテーブル
CREATE TABLE import_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES import_sessions(id),
  table_name VARCHAR(100) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  field_definition JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インポート履歴・監査ログテーブル
CREATE TABLE import_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES import_sessions(id),
  action VARCHAR(50) NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id)
);

-- インデックス
CREATE INDEX idx_import_sessions_status ON import_sessions(status);
CREATE INDEX idx_import_sessions_data_type ON import_sessions(data_type);
CREATE INDEX idx_import_sessions_created_by ON import_sessions(created_by);
CREATE INDEX idx_mapping_templates_data_type ON mapping_templates(data_type);
CREATE INDEX idx_import_jobs_status ON import_jobs(status, priority);
CREATE INDEX idx_import_audit_logs_session ON import_audit_logs(session_id);
```

### Phase 2A: Frontend Mock Implementation

**2A.1 コンポーネント構造**
```typescript
// frontend/src/pages/DataImportPage.tsx
export const DataImportPage: React.FC = () => {
  return (
    <div className="data-import-container">
      <PageHeader title="データインポート" />
      <div className="import-content">
        <ImportStepper />
        <ImportWizardContent />
      </div>
    </div>
  );
};

// frontend/src/components/import/ImportStepper.tsx
export const ImportStepper: React.FC = () => {
  return (
    <div className="import-stepper">
      <ImportStep step={1} label="ファイル選択" />
      <ImportStep step={2} label="項目マッピング" />
      <ImportStep step={3} label="プレビュー" />
      <ImportStep step={4} label="インポート実行" />
    </div>
  );
};

// frontend/src/components/import/ImportWizardContent.tsx
export const ImportWizardContent: React.FC = () => {
  const { currentStep } = useImportStore();
  
  return (
    <div className="import-wizard-content">
      {currentStep === 1 && <FileUploadStep />}
      {currentStep === 2 && <FieldMappingStep />}
      {currentStep === 3 && <DataPreviewStep />}
      {currentStep === 4 && <ImportExecutionStep />}
    </div>
  );
};

// frontend/src/components/import/FieldMappingStep.tsx
export const FieldMappingStep: React.FC = () => {
  return (
    <div className="field-mapping-step">
      <MappingSummary />
      <AutoMappingButton />
      <MappingTable />
      <MappingActions />
    </div>
  );
};
```

**2A.2 状態管理**
```typescript
// frontend/src/stores/importStore.ts
interface ImportState {
  currentSession: ImportSession | null;
  currentStep: number;
  uploadedFile: File | null;
  fileAnalysis: FileAnalysisResult | null;
  fieldMappings: FieldMapping[];
  validationResult: ValidationResult | null;
  importProgress: ImportProgress | null;
  importResult: ImportResult | null;
  mappingTemplates: MappingTemplate[];
  loading: boolean;
  error: string | null;
}

export const useImportStore = create<ImportState>((set, get) => ({
  // @MARK: モックデータから開始、後でAPI連携
  currentSession: null,
  currentStep: 1,
  uploadedFile: null,
  fileAnalysis: null,
  fieldMappings: [],
  validationResult: null,
  importProgress: null,
  importResult: null,
  mappingTemplates: MOCK_MAPPING_TEMPLATES,
  loading: false,
  error: null,
  
  // インポートセッション作成
  createImportSession: async (dataType: ImportDataType, options?: any) => {
    set({ loading: true });
    try {
      // @MARK: API連携時に実装
      const session = await importService.createImportSession(dataType, options);
      set({ currentSession: session, loading: false });
      return session;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // ファイルアップロード・解析
  uploadFile: async (file: File) => {
    const session = get().currentSession;
    if (!session) throw new Error('インポートセッションが作成されていません');
    
    set({ loading: true, uploadedFile: file });
    try {
      // @MARK: API連携時に実装
      await importService.uploadFile(session.id, file);
      const analysis = await importService.analyzeFile(session.id);
      set({ 
        fileAnalysis: analysis, 
        currentStep: 2, 
        loading: false 
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // 自動マッピング実行
  performAutoMapping: async () => {
    const session = get().currentSession;
    if (!session) throw new Error('セッションが存在しません');
    
    set({ loading: true });
    try {
      // @MARK: API連携時に実装
      const mappings = await importService.performAutoMapping(session.id);
      set({ fieldMappings: mappings, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  // フィールドマッピング更新
  updateFieldMapping: async (mappings: FieldMapping[]) => {
    const session = get().currentSession;
    if (!session) throw new Error('セッションが存在しません');
    
    set({ loading: true });
    try {
      // @MARK: API連携時に実装
      await importService.updateFieldMapping(session.id, mappings);
      set({ fieldMappings: mappings, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  // データ検証・プレビュー
  validateAndPreview: async () => {
    const session = get().currentSession;
    if (!session) throw new Error('セッションが存在しません');
    
    set({ loading: true });
    try {
      // @MARK: API連携時に実装
      const validationResult = await importService.validateData(session.id);
      set({ 
        validationResult, 
        currentStep: 3, 
        loading: false 
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  // インポート実行
  executeImport: async (config: ImportConfig) => {
    const session = get().currentSession;
    if (!session) throw new Error('セッションが存在しません');
    
    set({ loading: true, currentStep: 4 });
    try {
      // @MARK: API連携時に実装
      const job = await importService.executeImport(session.id, config);
      
      // 進捗監視
      const progressInterval = setInterval(async () => {
        try {
          const progress = await importService.getImportProgress(session.id);
          set({ importProgress: progress });
          
          if (progress.status === 'completed' || progress.status === 'failed') {
            clearInterval(progressInterval);
            const result = await importService.getImportResult(session.id);
            set({ importResult: result, loading: false });
          }
        } catch (error) {
          console.error('進捗取得エラー:', error);
        }
      }, 1000);
      
      return job;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // インポート中断
  cancelImport: async () => {
    const session = get().currentSession;
    if (!session) throw new Error('セッションが存在しません');
    
    try {
      // @MARK: API連携時に実装
      await importService.cancelImport(session.id);
      set({ importProgress: null });
    } catch (error) {
      set({ error: error.message });
    }
  },
  
  // ステップ移動
  goToStep: (step: number) => {
    set({ currentStep: step });
  },
  
  // リセット
  resetImport: () => {
    set({
      currentSession: null,
      currentStep: 1,
      uploadedFile: null,
      fileAnalysis: null,
      fieldMappings: [],
      validationResult: null,
      importProgress: null,
      importResult: null,
      error: null
    });
  },
  
  // マッピングテンプレート管理
  loadMappingTemplates: async (dataType: ImportDataType) => {
    // @MARK: API連携時に実装
    const templates = await importService.getMappingTemplates(dataType);
    set({ mappingTemplates: templates });
  },
  
  saveMappingTemplate: async (templateData: MappingTemplateData) => {
    // @MARK: API連携時に実装
    const template = await importService.saveMappingTemplate(templateData);
    const templates = [...get().mappingTemplates, template];
    set({ mappingTemplates: templates });
  },
}));
```

### Phase 2B: API Integration

**2B.1 API統合**
```typescript
// frontend/src/services/importService.ts
export class ImportService {
  private apiClient: ApiClient;
  
  // @MARK: Phase 2B で実装
  async createImportSession(dataType: ImportDataType, options?: any): Promise<ImportSession> {
    return this.apiClient.post(API_PATHS.IMPORT_SESSION_CREATE, {
      dataType,
      options
    });
  }
  
  async uploadFile(sessionId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.apiClient.post(
      API_PATHS.IMPORT_FILE_UPLOAD.replace(':id', sessionId),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  }
  
  async analyzeFile(sessionId: string): Promise<FileAnalysisResult> {
    return this.apiClient.post(API_PATHS.IMPORT_FILE_ANALYZE.replace(':id', sessionId));
  }
  
  async performAutoMapping(sessionId: string): Promise<FieldMapping[]> {
    return this.apiClient.post(API_PATHS.IMPORT_MAPPING_AUTO.replace(':id', sessionId));
  }
  
  async updateFieldMapping(sessionId: string, mappings: FieldMapping[]): Promise<void> {
    return this.apiClient.put(API_PATHS.IMPORT_MAPPING_UPDATE.replace(':id', sessionId), {
      fieldMappings: mappings
    });
  }
  
  async validateData(sessionId: string): Promise<ValidationResult> {
    return this.apiClient.post(API_PATHS.IMPORT_VALIDATE.replace(':id', sessionId));
  }
  
  async previewData(sessionId: string, limit: number = 100): Promise<any[]> {
    return this.apiClient.get(API_PATHS.IMPORT_PREVIEW_DATA.replace(':id', sessionId), {
      params: { limit }
    });
  }
  
  async executeImport(sessionId: string, config: ImportConfig): Promise<ImportJob> {
    return this.apiClient.post(API_PATHS.IMPORT_EXECUTE.replace(':id', sessionId), {
      importConfig: config
    });
  }
  
  async getImportProgress(sessionId: string): Promise<ImportProgress> {
    return this.apiClient.get(API_PATHS.IMPORT_PROGRESS.replace(':id', sessionId));
  }
  
  async getImportResult(sessionId: string): Promise<ImportResult> {
    return this.apiClient.get(API_PATHS.IMPORT_RESULT.replace(':id', sessionId));
  }
  
  async cancelImport(sessionId: string): Promise<void> {
    return this.apiClient.post(API_PATHS.IMPORT_CANCEL.replace(':id', sessionId));
  }
  
  async getMappingTemplates(dataType: ImportDataType): Promise<MappingTemplate[]> {
    return this.apiClient.get(API_PATHS.IMPORT_MAPPING_TEMPLATES, {
      params: { dataType }
    });
  }
  
  async saveMappingTemplate(templateData: MappingTemplateData): Promise<MappingTemplate> {
    return this.apiClient.post(API_PATHS.IMPORT_MAPPING_TEMPLATES, templateData);
  }
  
  async getImportAnalytics(): Promise<ImportAnalytics> {
    return this.apiClient.get(API_PATHS.IMPORT_ANALYTICS);
  }
  
  async exportImportResult(sessionId: string, format: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    return this.apiClient.get(API_PATHS.IMPORT_EXPORT_RESULT.replace(':id', sessionId), {
      params: { format },
      responseType: 'blob'
    });
  }
}
```

### Phase 3: Human Validation

**3.1 機能検証項目**
- [ ] インポートセッション管理・ファイル処理・解析機能
- [ ] フィールドマッピング・自動マッピング・カスタム項目作成機能
- [ ] データ検証・品質チェック・エラー修正機能
- [ ] バッチ処理・進捗監視・エラーハンドリング機能
- [ ] 全システムとの統合・データ整合性・関連性検証
- [ ] パフォーマンス・メモリ使用量・処理効率確認
- [ ] セキュリティ・アクセス制御・監査証跡機能

**3.2 実データテスト**
- [ ] 10万件企業データの30分以内インポート
- [ ] 複雑なExcelファイル・多様なデータ形式の対応
- [ ] 重複データ検出・マージ・整合性確保
- [ ] システム全体の動作確認・パフォーマンス影響評価

## 6. Validation Method（検証方法）

### 6.1 API動作確認
```bash
# インポートセッション作成
curl -X POST "http://localhost:3001/api/import/sessions/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "dataType": "companies",
    "options": {
      "allowCustomFields": true,
      "autoMapping": true,
      "generateReport": true
    }
  }'

# ファイルアップロード
curl -X POST "http://localhost:3001/api/import/sessions/session-123/upload" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@顧客リスト_2024.xlsx"

# 自動マッピング実行
curl -X POST "http://localhost:3001/api/import/sessions/session-123/auto-mapping" \
  -H "Authorization: Bearer $JWT_TOKEN"

# インポート実行
curl -X POST "http://localhost:3001/api/import/sessions/session-123/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "importConfig": {
      "batchSize": 1000,
      "skipErrors": true,
      "updateExisting": true,
      "duplicateHandling": "merge"
    }
  }'
```

### 6.2 統合テスト確認
- 企業管理（004）への顧客データインポート・担当者設定・権限付与
- 商材マスタ（009）への商材データインポート・カテゴリ・価格設定
- 契約管理（011）への契約データインポート・関連性・ステータス確認
- 提案管理（012）への提案データインポート・商材関連・履歴確認

### 6.3 パフォーマンステスト
- 大量データ処理性能・メモリ使用量・処理時間測定
- 並行インポート・リソース競合・システム影響評価
- エラー処理・回復性・ロールバック機能確認

## 7. Completion Criteria（完了基準）

### 7.1 機能完了基準
- [ ] **多形式対応**: Excel・CSV・JSON・XMLファイルの完全対応・解析
- [ ] **柔軟マッピング**: 動的フィールドマッピング・自動マッピング・カスタム項目作成
- [ ] **データ品質**: インポート前検証・品質チェック・エラー修正機能
- [ ] **バッチ処理**: 大量データの効率的処理・進捗監視・エラーハンドリング
- [ ] **統合検証**: 全システムとのデータ整合性・関連性・セキュリティ確保
- [ ] **運用支援**: インポート履歴・レポート・分析・テンプレート管理

### 7.2 パフォーマンス完了基準
- [ ] **処理性能**: 10万件データの30分以内インポート
- [ ] **自動精度**: 95%以上の自動マッピング精度
- [ ] **エラー率**: インポートエラー率5%以下
- [ ] **リソース効率**: メモリ使用量最適化・CPUリソース管理

### 7.3 統合完了基準
- [ ] **システム統合**: 全機能との完全な統合・データ整合性確保
- [ ] **セキュリティ**: 適切なアクセス制御・監査証跡・データ保護
- [ ] **運用準備**: 実運用データでの動作確認・パフォーマンステスト通過

### 7.4 実用性完了基準
- [ ] **使いやすさ**: 非技術者でも30分以内で基本インポート操作習得
- [ ] **信頼性**: 重要データの安全なインポート・ロールバック機能確保
- [ ] **保守性**: インポート履歴・トラブルシューティング・サポート機能

**実装完了判定**: 上記全基準を満たし、機能テスト・統合テスト・パフォーマンステスト・実データテストが全て通過し、実際の顧客データでの運用テストが成功した時点で完了とする。