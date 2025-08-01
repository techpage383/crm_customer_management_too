import { 
  Product,
  Contract,
  ProductDeploymentStatus,
  ContractStatus,
  Proposal,
  ProposalStatus,
  ProductType,
  ProductCategory
} from '../../../types';

// @MOCK_DATA: 商材・契約データ

// 商材マスタデータ
export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'CRM Pro Enterprise',
    code: 'CRM-PRO-001',
    description: 'エンタープライズ向け顧客管理システム。高度なレポート機能とAI分析を搭載',
    category: ProductCategory.SOFTWARE,
    price: 120000,
    priceType: 'monthly' as const,
    features: [
      '顧客データ管理',
      'セールスパイプライン',
      'AI分析レポート',
      'メール連携',
      'モバイルアプリ'
    ],
    isActive: true,
    tags: ['人気', '新機能'],
    createdAt: new Date('2023-01-15T00:00:00Z'),
    updatedAt: new Date('2024-01-20T00:00:00Z')
  },
  {
    id: '2',
    name: 'Analytics Suite Standard',
    code: 'ANL-STD-002',
    description: 'ビジネスデータの可視化と分析を行うBIツール',
    category: ProductCategory.SOFTWARE,
    price: 80000,
    priceType: 'monthly' as const,
    features: [
      'データビジュアライゼーション',
      'カスタムダッシュボード',
      'スケジュールレポート',
      'データエクスポート'
    ],
    isActive: true,
    tags: ['コスパ'],
    createdAt: new Date('2023-03-10T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z')
  },
  {
    id: '3',
    name: 'Security Guard Professional',
    code: 'SEC-PRO-003',
    description: 'エンドポイントセキュリティソリューション',
    category: ProductCategory.SOFTWARE,
    price: 200000,
    priceType: 'monthly' as const,
    features: [
      'リアルタイム脅威検知',
      'マルウェア対策',
      'ファイアウォール',
      '脆弱性診断',
      'セキュリティレポート'
    ],
    isActive: true,
    tags: ['高性能', 'セキュリティ'],
    createdAt: new Date('2023-06-01T00:00:00Z'),
    updatedAt: new Date('2024-02-01T00:00:00Z')
  },
  {
    id: '4',
    name: 'Backup Master Cloud',
    code: 'BCK-CLD-004',
    description: 'クラウドベースのデータバックアップサービス',
    category: ProductCategory.SERVICE,
    price: 50000,
    priceType: 'monthly' as const,
    features: [
      '自動バックアップ',
      'クラウドストレージ',
      '暗号化',
      '差分バックアップ',
      '復旧サポート'
    ],
    isActive: true,
    tags: ['クラウド', 'サブスク'],
    createdAt: new Date('2023-08-20T00:00:00Z'),
    updatedAt: new Date('2024-01-30T00:00:00Z')
  },
  {
    id: '5',
    name: 'Legacy System Bridge',
    code: 'LEG-BRG-005',
    description: 'レガシーシステムとの連携ハードウェア',
    category: ProductCategory.HARDWARE,
    price: 300000,
    priceType: 'one_time' as const,
    features: [
      'レガシー連携',
      'プロトコル変換',
      'データ移行サポート'
    ],
    isActive: false,
    tags: ['廃止予定'],
    createdAt: new Date('2022-12-01T00:00:00Z'),
    updatedAt: new Date('2023-12-01T00:00:00Z')
  }
];

// 契約データ
export const MOCK_CONTRACTS: Contract[] = [
  {
    id: '1',
    contractNumber: 'CONT-2024-001',
    title: 'CRM Pro Enterprise 契約',
    companyId: '1', // テックソリューション様
    status: ContractStatus.ACTIVE,
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2024-12-31T23:59:59Z'),
    value: 300000,
    paymentTerms: '月末締め翌月末払い',
    autoRenew: true,
    notes: '導入サポート含む（50ライセンス、Premiumサポート）',
    createdAt: new Date('2023-12-15T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: '2',
    contractNumber: 'CONT-2024-002',
    title: 'Analytics Suite Standard 契約',
    companyId: '2', // グローバル商事様
    status: ContractStatus.PENDING,
    startDate: new Date('2024-03-01T00:00:00Z'),
    endDate: new Date('2025-02-28T23:59:59Z'),
    value: 200000,
    paymentTerms: '年一括前払い',
    autoRenew: false,
    notes: '試用期間1ヶ月含む（25ライセンス、Standardサポート）',
    createdAt: new Date('2024-01-20T00:00:00Z'),
    updatedAt: new Date('2024-02-01T00:00:00Z')
  },
  {
    id: '3',
    contractNumber: 'CONT-2023-015',
    title: 'Security Guard Professional 契約',
    companyId: '3', // 中部製造様
    status: ContractStatus.EXPIRED,
    startDate: new Date('2023-01-01T00:00:00Z'),
    endDate: new Date('2023-12-31T23:59:59Z'),
    value: 600000,
    paymentTerms: '四半期毎前払い',
    autoRenew: false,
    notes: 'オンサイトサポート付き（100ライセンス、Enterpriseサポート）',
    createdAt: new Date('2022-11-15T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
];

// 提案データ
export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: '1',
    proposalNumber: 'PROP-2024-001',
    title: 'CRM Pro Enterprise導入提案',
    companyId: '1',
    productIds: ['1'],
    status: ProposalStatus.ACCEPTED,
    totalValue: 300000,
    validUntil: new Date('2024-03-15T23:59:59Z'),
    description: 'テックソリューション様向けCRMシステム導入提案書',
    createdAt: new Date('2023-12-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
    submittedAt: new Date('2023-12-10T00:00:00Z')
  },
  {
    id: '2',
    proposalNumber: 'PROP-2024-002',
    title: 'Analytics + CRM セット提案',
    companyId: '2',
    productIds: ['1', '2'],
    status: ProposalStatus.SUBMITTED,
    totalValue: 350000,
    validUntil: new Date('2024-03-31T23:59:59Z'),
    description: 'グローバル商事様向け総合ビジネスソリューション',
    createdAt: new Date('2024-01-15T00:00:00Z'),
    updatedAt: new Date('2024-02-01T00:00:00Z'),
    submittedAt: new Date('2024-01-25T00:00:00Z')
  },
  {
    id: '3',
    proposalNumber: 'PROP-2024-003',
    title: 'セキュリティ強化提案',
    companyId: '3',
    productIds: ['3', '4'],
    status: ProposalStatus.UNDER_REVIEW,
    totalValue: 450000,
    validUntil: new Date('2024-04-30T23:59:59Z'),
    description: '中部製造様向けセキュリティ強化ソリューション',
    createdAt: new Date('2024-02-01T00:00:00Z'),
    updatedAt: new Date('2024-02-01T00:00:00Z'),
    submittedAt: new Date('2024-02-05T00:00:00Z')
  }
];

// 商材導入状況データ
export const MOCK_PRODUCT_DEPLOYMENTS = [
  {
    id: '1',
    companyId: '1',
    productId: '1',
    contractId: '1',
    status: ProductDeploymentStatus.PRODUCTION,
    deploymentDate: new Date('2024-01-15T00:00:00Z'),
    version: '3.2.1',
    licensesUsed: 45,
    licensesTotal: 50,
    lastHealthCheck: new Date('2024-02-01T00:00:00Z'),
    healthStatus: 'healthy',
    notes: '導入完了、順調に稼働中',
    assignedEngineer: 'engineer-1'
  },
  {
    id: '2',
    companyId: '2',
    productId: '2',
    contractId: '2',
    status: ProductDeploymentStatus.STAGING,
    deploymentDate: new Date('2024-02-15T00:00:00Z'),
    version: '2.8.5',
    licensesUsed: 0,
    licensesTotal: 25,
    lastHealthCheck: null,
    healthStatus: 'pending',
    notes: '導入作業中、来週完了予定',
    assignedEngineer: 'engineer-2'
  },
  {
    id: '3',
    companyId: '3',
    productId: '3',
    contractId: '3',
    status: ProductDeploymentStatus.DEVELOPMENT,
    deploymentDate: new Date('2023-02-01T00:00:00Z'),
    version: '1.4.8',
    licensesUsed: 95,
    licensesTotal: 100,
    lastHealthCheck: new Date('2024-01-20T00:00:00Z'),
    healthStatus: 'warning',
    notes: 'バージョン更新が必要',
    assignedEngineer: 'engineer-1'
  }
];

// フィルタリング・ソート用ヘルパー関数
export function filterProducts(products: Product[], filters: {
  query?: string;
  category?: string;
  type?: ProductType;
  isActive?: boolean;
  tags?: string[];
}): Product[] {
  let filtered = [...products];

  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query))
    );
  }

  if (filters.category) {
    filtered = filtered.filter(product => product.category === filters.category);
  }

  // typeフィルターはProduct型に対応するプロパティがないためコメントアウト
  // if (filters.type) {
  //   filtered = filtered.filter(product => product.type === filters.type);
  // }

  if (filters.isActive !== undefined) {
    filtered = filtered.filter(product => product.isActive === filters.isActive);
  }

  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(product => 
      product.tags?.some(tag => filters.tags!.includes(tag))
    );
  }

  return filtered;
}

export function filterContracts(contracts: Contract[], filters: {
  query?: string;
  status?: ContractStatus;
  companyId?: string;
  productId?: string;
  salesRep?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
}): Contract[] {
  let filtered = [...contracts];

  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(contract => 
      contract.contractNumber.toLowerCase().includes(query) ||
      contract.notes?.toLowerCase().includes(query)
    );
  }

  if (filters.status) {
    filtered = filtered.filter(contract => contract.status === filters.status);
  }

  if (filters.companyId) {
    filtered = filtered.filter(contract => contract.companyId === filters.companyId);
  }

  // productIdフィルターはContract型に対応するプロパティがないためコメントアウト
  // if (filters.productId) {
  //   filtered = filtered.filter(contract => contract.productId === filters.productId);
  // }

  // salesRepフィルターはContract型に対応するプロパティがないためコメントアウト
  // if (filters.salesRep) {
  //   filtered = filtered.filter(contract => contract.assignedSalesRep === filters.salesRep);
  // }

  if (filters.startDateFrom) {
    filtered = filtered.filter(contract => 
      new Date(contract.startDate) >= filters.startDateFrom!
    );
  }

  if (filters.startDateTo) {
    filtered = filtered.filter(contract => 
      new Date(contract.startDate) <= filters.startDateTo!
    );
  }

  return filtered;
}

export function filterProposals(proposals: Proposal[], filters: {
  query?: string;
  status?: ProposalStatus;
  companyId?: string;
  salesRep?: string;
  validUntilFrom?: Date;
  validUntilTo?: Date;
}): Proposal[] {
  let filtered = [...proposals];

  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(proposal => 
      proposal.proposalNumber.toLowerCase().includes(query) ||
      proposal.title.toLowerCase().includes(query) ||
      (proposal.description && proposal.description.toLowerCase().includes(query))
    );
  }

  if (filters.status) {
    filtered = filtered.filter(proposal => proposal.status === filters.status);
  }

  if (filters.companyId) {
    filtered = filtered.filter(proposal => proposal.companyId === filters.companyId);
  }

  // salesRepフィルターはProposal型に対応するプロパティがないためコメントアウト
  // if (filters.salesRep) {
  //   filtered = filtered.filter(proposal => proposal.assignedSalesRep === filters.salesRep);
  // }

  if (filters.validUntilFrom) {
    filtered = filtered.filter(proposal => 
      proposal.validUntil && new Date(proposal.validUntil) >= filters.validUntilFrom!
    );
  }

  if (filters.validUntilTo) {
    filtered = filtered.filter(proposal => 
      proposal.validUntil && new Date(proposal.validUntil) <= filters.validUntilTo!
    );
  }

  return filtered;
}