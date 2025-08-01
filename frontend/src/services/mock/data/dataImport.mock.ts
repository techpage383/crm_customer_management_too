// 一時的な型定義（types/index.tsに存在しない場合）
enum ImportJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

enum ImportDataType {
  COMPANIES = 'companies',
  CONTACTS = 'contacts',
  PRODUCTS = 'products',
  CONTRACTS = 'contracts',
  TODOS = 'todos',
  USERS = 'users'
}

// @MOCK_DATA: データインポート関連データ

// インポートジョブの履歴データ
export const MOCK_IMPORT_JOBS = [
  {
    id: '1',
    jobName: '2024年1月企業データ一括取り込み',
    dataType: ImportDataType.COMPANIES,
    fileName: '企業マスタ_2024_01.csv',
    fileSize: 2048576, // 2MB
    status: ImportJobStatus.COMPLETED,
    totalRecords: 150,
    successCount: 147,
    errorCount: 3,
    startedAt: new Date('2024-01-15T10:00:00Z'),
    completedAt: new Date('2024-01-15T10:05:30Z'),
    createdBy: 'admin-user',
    errorSummary: [
      { row: 23, field: 'email', message: '無効なメールアドレス形式' },
      { row: 67, field: 'phone', message: '電話番号の形式が正しくありません' },
      { row: 89, field: 'name', message: '企業名が重複しています' }
    ],
    mapping: {
      name: 'A',
      email: 'B', 
      phone: 'C',
      address: 'D',
      industry: 'E'
    }
  },
  {
    id: '2',
    jobName: 'ユーザーアカウント追加',
    dataType: ImportDataType.USERS,
    fileName: 'new_users_batch2.xlsx',
    fileSize: 512000, // 512KB
    status: ImportJobStatus.PROCESSING,
    totalRecords: 25,
    successCount: 20,
    errorCount: 0,
    startedAt: new Date('2024-02-01T14:30:00Z'),
    completedAt: null,
    createdBy: 'admin-user',
    progress: 80,
    mapping: {
      name: 'A',
      email: 'B',
      role: 'C',
      department: 'D'
    }
  },
  {
    id: '3',
    jobName: '契約データ移行',
    dataType: ImportDataType.CONTRACTS,
    fileName: 'legacy_contracts.csv',
    fileSize: 1024000, // 1MB
    status: ImportJobStatus.FAILED,
    totalRecords: 75,
    successCount: 0,
    errorCount: 75,
    startedAt: new Date('2024-01-28T16:00:00Z'),
    completedAt: new Date('2024-01-28T16:01:15Z'),
    createdBy: 'data-admin',
    errorSummary: [
      { row: 1, field: 'startDate', message: '日付形式が正しくありません（YYYY-MM-DD形式で入力してください）' },
      { row: 2, field: 'amount', message: '契約金額は数値で入力してください' }
    ],
    mapping: {
      contractNumber: 'A',
      companyId: 'B',
      productId: 'C',
      startDate: 'D',
      endDate: 'E',
      amount: 'F'
    }
  }
];

// インポート可能なデータタイプの設定
export const IMPORT_DATA_TYPES = [
  {
    type: ImportDataType.COMPANIES,
    name: '企業データ',
    description: '企業の基本情報（名前、連絡先、業界など）',
    requiredFields: ['name', 'email'],
    optionalFields: ['phone', 'address', 'industry', 'website', 'notes'],
    sampleData: [
      { name: 'テック株式会社', email: 'info@tech.co.jp', phone: '03-1234-5678', industry: 'IT' },
      { name: 'グローバル商事', email: 'contact@global.com', phone: '06-9876-5432', industry: '商社' }
    ]
  },
  {
    type: ImportDataType.USERS,
    name: 'ユーザーデータ', 
    description: 'システムユーザーアカウント情報',
    requiredFields: ['name', 'email', 'role'],
    optionalFields: ['department', 'phone', 'isActive'],
    sampleData: [
      { name: '田中太郎', email: 'tanaka@company.co.jp', role: 'user', department: '営業部' },
      { name: '佐藤花子', email: 'sato@company.co.jp', role: 'admin', department: '管理部' }
    ]
  },
  {
    type: ImportDataType.CONTRACTS,
    name: '契約データ',
    description: '契約情報（契約番号、企業、商材、期間など）',
    requiredFields: ['contractNumber', 'companyId', 'productId', 'startDate', 'endDate', 'amount'],
    optionalFields: ['licenseCount', 'supportLevel', 'notes'],
    sampleData: [
      { 
        contractNumber: 'CONT-2024-001', 
        companyId: '1', 
        productId: '1', 
        startDate: '2024-01-01', 
        endDate: '2024-12-31', 
        amount: 300000 
      }
    ]
  },
  {
    type: ImportDataType.PRODUCTS,
    name: '商材データ',
    description: '商材マスタ情報（名前、価格、仕様など）',
    requiredFields: ['name', 'code', 'type', 'basePrice'],
    optionalFields: ['monthlyPrice', 'category', 'description', 'version'],
    sampleData: [
      { 
        name: 'CRM Pro Enterprise', 
        code: 'CRM-PRO-001', 
        type: 'SOFTWARE', 
        basePrice: 120000,
        monthlyPrice: 15000 
      }
    ]
  }
];

// CSV解析結果のサンプル
export const MOCK_CSV_PREVIEW = {
  headers: ['企業名', 'メールアドレス', '電話番号', '住所', '業界'],
  rows: [
    ['テック株式会社', 'info@tech.co.jp', '03-1234-5678', '東京都渋谷区...', 'IT'],
    ['グローバル商事', 'contact@global.com', '06-9876-5432', '大阪府大阪市...', '商社'],
    ['製造工業', 'support@manufacturing.jp', '052-111-2222', '愛知県名古屋市...', '製造業'],
    ['コンサル企業', 'hello@consulting.net', '092-333-4444', '福岡県福岡市...', 'コンサルティング'],
    ['システム開発', 'dev@systems.co.jp', '022-555-6666', '宮城県仙台市...', 'IT']
  ],
  totalRows: 150,
  encoding: 'UTF-8'
};

// フィールドマッピングの候補
export const FIELD_MAPPING_SUGGESTIONS = {
  [ImportDataType.COMPANIES]: [
    { csvField: '企業名', systemField: 'name', confidence: 0.95 },
    { csvField: 'メールアドレス', systemField: 'email', confidence: 0.98 },
    { csvField: '電話番号', systemField: 'phone', confidence: 0.90 },
    { csvField: '住所', systemField: 'address', confidence: 0.85 },
    { csvField: '業界', systemField: 'industry', confidence: 0.80 }
  ],
  [ImportDataType.USERS]: [
    { csvField: '氏名', systemField: 'name', confidence: 0.95 },
    { csvField: 'メール', systemField: 'email', confidence: 0.98 },
    { csvField: 'ロール', systemField: 'role', confidence: 0.90 },
    { csvField: '部署', systemField: 'department', confidence: 0.85 }
  ],
  [ImportDataType.CONTRACTS]: [
    { csvField: '契約番号', systemField: 'contractNumber', confidence: 0.98 },
    { csvField: '企業ID', systemField: 'companyId', confidence: 0.95 },
    { csvField: '商材ID', systemField: 'productId', confidence: 0.95 },
    { csvField: '開始日', systemField: 'startDate', confidence: 0.90 },
    { csvField: '終了日', systemField: 'endDate', confidence: 0.90 },
    { csvField: '契約金額', systemField: 'amount', confidence: 0.95 }
  ]
};

// バリデーションエラーのサンプル
export const MOCK_VALIDATION_ERRORS = [
  {
    row: 23,
    field: 'email',
    value: 'invalid-email',
    message: '無効なメールアドレス形式です',
    severity: 'error'
  },
  {
    row: 45,
    field: 'phone',
    value: '123-456',
    message: '電話番号の形式が正しくありません（例：03-1234-5678）',
    severity: 'error'
  },
  {
    row: 67,
    field: 'industry',
    value: '',
    message: '業界情報が空です',
    severity: 'warning'
  },
  {
    row: 89,
    field: 'name',
    value: 'テック株式会社',
    message: '企業名が重複しています（行23と同じ）',
    severity: 'error'
  }
];

// 統計情報
export const MOCK_IMPORT_STATS = {
  totalJobs: MOCK_IMPORT_JOBS.length,
  completedJobs: MOCK_IMPORT_JOBS.filter(job => job.status === ImportJobStatus.COMPLETED).length,
  inProgressJobs: MOCK_IMPORT_JOBS.filter(job => job.status === ImportJobStatus.PROCESSING).length,
  failedJobs: MOCK_IMPORT_JOBS.filter(job => job.status === ImportJobStatus.FAILED).length,
  totalRecordsImported: MOCK_IMPORT_JOBS
    .filter(job => job.status === ImportJobStatus.COMPLETED)
    .reduce((sum, job) => sum + job.successCount, 0),
  averageSuccessRate: 95.2,
  lastImportDate: new Date('2024-02-01T14:30:00Z')
};

// フィルタリング用ヘルパー関数
export function filterImportJobs(jobs: typeof MOCK_IMPORT_JOBS, filters: {
  status?: ImportJobStatus;
  dataType?: ImportDataType;
  dateFrom?: Date;
  dateTo?: Date;
  createdBy?: string;
}) {
  let filtered = [...jobs];

  if (filters.status) {
    filtered = filtered.filter(job => job.status === filters.status);
  }

  if (filters.dataType) {
    filtered = filtered.filter(job => job.dataType === filters.dataType);
  }

  if (filters.createdBy) {
    filtered = filtered.filter(job => job.createdBy === filters.createdBy);
  }

  if (filters.dateFrom) {
    filtered = filtered.filter(job => 
      new Date(job.startedAt) >= filters.dateFrom!
    );
  }

  if (filters.dateTo) {
    filtered = filtered.filter(job => 
      new Date(job.startedAt) <= filters.dateTo!
    );
  }

  return filtered;
}