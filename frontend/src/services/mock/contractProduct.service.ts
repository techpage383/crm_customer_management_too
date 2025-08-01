import { 
  Product,
  Contract,
  Proposal,
  ProductDeploymentStatus,
  ContractStatus,
  ProposalStatus,
  ApiResponse
} from '../../types';
import { 
  MOCK_PRODUCTS,
  MOCK_CONTRACTS,
  MOCK_PROPOSALS,
  MOCK_PRODUCT_DEPLOYMENTS,
  filterProducts,
  filterContracts,
  filterProposals
} from './data/contractProduct.mock';

// @MOCK_TO_API: 商材・契約管理サービス実装時にこのファイル全体をAPI呼び出しに置き換え
class MockContractProductService {
  private products: Product[] = [...MOCK_PRODUCTS];
  private contracts: Contract[] = [...MOCK_CONTRACTS];
  private proposals: Proposal[] = [...MOCK_PROPOSALS];
  private deployments = [...MOCK_PRODUCT_DEPLOYMENTS];

  // === 商材マスタ管理 ===

  // 商材一覧取得
  async searchProducts(filters: {
    query?: string;
    category?: string;
    type?: string;
    isActive?: boolean;
    tags?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    products: Product[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    console.warn('🔧 Using MOCK data for searchProducts');
    
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      let filtered = filterProducts(this.products, filters as any);

      // ソート適用
      if (filters.sortBy) {
        filtered = filtered.sort((a, b) => {
          let valueA: any, valueB: any;
          
          switch (filters.sortBy) {
            case 'name':
              valueA = a.name;
              valueB = b.name;
              break;
            case 'code':
              valueA = a.code;
              valueB = b.code;
              break;
            case 'basePrice':
              valueA = (a as any).basePrice || 0;
              valueB = (b as any).basePrice || 0;
              break;
            case 'createdAt':
              valueA = new Date(a.createdAt);
              valueB = new Date(b.createdAt);
              break;
            default:
              valueA = a.name;
              valueB = b.name;
          }

          if (valueA < valueB) return filters.sortOrder === 'asc' ? -1 : 1;
          if (valueA > valueB) return filters.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }

      // ページネーション
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = filtered.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          products: paginatedProducts,
          totalCount: filtered.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(filtered.length / limit)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: '商材検索に失敗しました'
      };
    }
  }

  // 商材詳細取得
  async getProductById(productId: string): Promise<ApiResponse<Product>> {
    console.warn('🔧 Using MOCK data for getProductById');
    
    await new Promise(resolve => setTimeout(resolve, 200));

    const product = this.products.find(p => p.id === productId);
    
    if (!product) {
      return {
        success: false,
        error: '商材が見つかりません'
      };
    }

    return {
      success: true,
      data: product
    };
  }

  // 商材作成
  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> {
    console.warn('🔧 Using MOCK data for createProduct');
    
    await new Promise(resolve => setTimeout(resolve, 500));

    const newProduct: Product = {
      ...productData,
      id: `product-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.products.push(newProduct);

    return {
      success: true,
      data: newProduct
    };
  }

  // 商材更新
  async updateProduct(productId: string, updates: Partial<Product>): Promise<ApiResponse<Product>> {
    console.warn('🔧 Using MOCK data for updateProduct');
    
    await new Promise(resolve => setTimeout(resolve, 400));

    const productIndex = this.products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return {
        success: false,
        error: '商材が見つかりません'
      };
    }

    this.products[productIndex] = {
      ...this.products[productIndex],
      ...updates,
      updatedAt: new Date()
    };

    return {
      success: true,
      data: this.products[productIndex]
    };
  }

  // === 契約管理 ===

  // 契約一覧取得
  async searchContracts(filters: {
    query?: string;
    status?: ContractStatus;
    companyId?: string;
    productId?: string;
    salesRep?: string;
    startDateFrom?: Date;
    startDateTo?: Date;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    contracts: Contract[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    console.warn('🔧 Using MOCK data for searchContracts');
    
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      let filtered = filterContracts(this.contracts, filters);

      // ページネーション
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedContracts = filtered.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          contracts: paginatedContracts,
          totalCount: filtered.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(filtered.length / limit)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: '契約検索に失敗しました'
      };
    }
  }

  // 契約詳細取得
  async getContractById(contractId: string): Promise<ApiResponse<Contract>> {
    console.warn('🔧 Using MOCK data for getContractById');
    
    await new Promise(resolve => setTimeout(resolve, 200));

    const contract = this.contracts.find(c => c.id === contractId);
    
    if (!contract) {
      return {
        success: false,
        error: '契約が見つかりません'
      };
    }

    return {
      success: true,
      data: contract
    };
  }

  // 契約作成
  async createContract(contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Contract>> {
    console.warn('🔧 Using MOCK data for createContract');
    
    await new Promise(resolve => setTimeout(resolve, 500));

    const newContract: Contract = {
      ...contractData,
      id: `contract-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.contracts.push(newContract);

    return {
      success: true,
      data: newContract
    };
  }

  // 契約更新
  async updateContract(contractId: string, updates: Partial<Contract>): Promise<ApiResponse<Contract>> {
    console.warn('🔧 Using MOCK data for updateContract');
    
    await new Promise(resolve => setTimeout(resolve, 400));

    const contractIndex = this.contracts.findIndex(c => c.id === contractId);
    
    if (contractIndex === -1) {
      return {
        success: false,
        error: '契約が見つかりません'
      };
    }

    this.contracts[contractIndex] = {
      ...this.contracts[contractIndex],
      ...updates,
      updatedAt: new Date()
    };

    return {
      success: true,
      data: this.contracts[contractIndex]
    };
  }

  // === 提案管理 ===

  // 提案一覧取得
  async searchProposals(filters: {
    query?: string;
    status?: ProposalStatus;
    companyId?: string;
    salesRep?: string;
    validUntilFrom?: Date;
    validUntilTo?: Date;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    proposals: Proposal[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    console.warn('🔧 Using MOCK data for searchProposals');
    
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      let filtered = filterProposals(this.proposals, filters);

      // ページネーション
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProposals = filtered.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          proposals: paginatedProposals,
          totalCount: filtered.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(filtered.length / limit)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: '提案検索に失敗しました'
      };
    }
  }

  // 提案詳細取得
  async getProposalById(proposalId: string): Promise<ApiResponse<Proposal>> {
    console.warn('🔧 Using MOCK data for getProposalById');
    
    await new Promise(resolve => setTimeout(resolve, 200));

    const proposal = this.proposals.find(p => p.id === proposalId);
    
    if (!proposal) {
      return {
        success: false,
        error: '提案が見つかりません'
      };
    }

    return {
      success: true,
      data: proposal
    };
  }

  // 提案作成
  async createProposal(proposalData: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Proposal>> {
    console.warn('🔧 Using MOCK data for createProposal');
    
    await new Promise(resolve => setTimeout(resolve, 500));

    const newProposal: Proposal = {
      ...proposalData,
      id: `proposal-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.proposals.push(newProposal);

    return {
      success: true,
      data: newProposal
    };
  }

  // 提案更新
  async updateProposal(proposalId: string, updates: Partial<Proposal>): Promise<ApiResponse<Proposal>> {
    console.warn('🔧 Using MOCK data for updateProposal');
    
    await new Promise(resolve => setTimeout(resolve, 400));

    const proposalIndex = this.proposals.findIndex(p => p.id === proposalId);
    
    if (proposalIndex === -1) {
      return {
        success: false,
        error: '提案が見つかりません'
      };
    }

    this.proposals[proposalIndex] = {
      ...this.proposals[proposalIndex],
      ...updates,
      updatedAt: new Date()
    };

    return {
      success: true,
      data: this.proposals[proposalIndex]
    };
  }

  // === 商材導入状況 ===

  // 導入状況一覧取得
  async getProductDeployments(filters: {
    companyId?: string;
    productId?: string;
    status?: ProductDeploymentStatus;
    healthStatus?: string;
  }): Promise<ApiResponse<typeof MOCK_PRODUCT_DEPLOYMENTS>> {
    console.warn('🔧 Using MOCK data for getProductDeployments');
    
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      let filtered = [...this.deployments];

      if (filters.companyId) {
        filtered = filtered.filter(d => d.companyId === filters.companyId);
      }

      if (filters.productId) {
        filtered = filtered.filter(d => d.productId === filters.productId);
      }

      if (filters.status) {
        filtered = filtered.filter(d => d.status === filters.status);
      }

      if (filters.healthStatus) {
        filtered = filtered.filter(d => d.healthStatus === filters.healthStatus);
      }

      return {
        success: true,
        data: filtered
      };
    } catch (error: any) {
      return {
        success: false,
        error: '導入状況取得に失敗しました'
      };
    }
  }

  // 導入状況統計取得
  async getDeploymentStats(): Promise<ApiResponse<{
    totalDeployments: number;
    activeDeployments: number;
    inProgressDeployments: number;
    maintenanceDeployments: number;
    healthyDeployments: number;
    warningDeployments: number;
    errorDeployments: number;
    licensesUsedTotal: number;
    licensesTotalTotal: number;
    utilizationRate: number;
  }>> {
    console.warn('🔧 Using MOCK data for getDeploymentStats');
    
    await new Promise(resolve => setTimeout(resolve, 200));

    const stats = {
      totalDeployments: this.deployments.length,
      activeDeployments: this.deployments.filter(d => d.status === ProductDeploymentStatus.PRODUCTION).length,
      inProgressDeployments: this.deployments.filter(d => d.status === ProductDeploymentStatus.STAGING).length,
      maintenanceDeployments: this.deployments.filter(d => d.status === ProductDeploymentStatus.DEVELOPMENT).length,
      healthyDeployments: this.deployments.filter(d => d.healthStatus === 'healthy').length,
      warningDeployments: this.deployments.filter(d => d.healthStatus === 'warning').length,
      errorDeployments: this.deployments.filter(d => d.healthStatus === 'error').length,
      licensesUsedTotal: this.deployments.reduce((sum, d) => sum + d.licensesUsed, 0),
      licensesTotalTotal: this.deployments.reduce((sum, d) => sum + d.licensesTotal, 0),
      utilizationRate: 0
    };

    stats.utilizationRate = stats.licensesTotalTotal > 0 
      ? (stats.licensesUsedTotal / stats.licensesTotalTotal) * 100 
      : 0;

    return {
      success: true,
      data: stats
    };
  }

  // === 統計・レポート ===

  // 売上統計取得
  async getSalesStats(period: 'month' | 'quarter' | 'year' = 'month'): Promise<ApiResponse<{
    totalRevenue: number;
    activeContracts: number;
    newContracts: number;
    expiredContracts: number;
    renewalRate: number;
    topProducts: Array<{ productId: string; productName: string; revenue: number; contracts: number }>;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
  }>> {
    console.warn('🔧 Using MOCK data for getSalesStats');
    
    await new Promise(resolve => setTimeout(resolve, 400));

    // モック統計データ生成
    const totalRevenue = this.contracts
      .filter(c => c.status === ContractStatus.ACTIVE)
      .reduce((sum, c) => sum + ((c as any).totalAmount || 0), 0);

    const stats = {
      totalRevenue,
      activeContracts: this.contracts.filter(c => c.status === ContractStatus.ACTIVE).length,
      newContracts: this.contracts.filter(c => {
        const startDate = new Date(c.startDate);
        const thisMonth = new Date();
        return startDate.getMonth() === thisMonth.getMonth() && startDate.getFullYear() === thisMonth.getFullYear();
      }).length,
      expiredContracts: this.contracts.filter(c => c.status === ContractStatus.EXPIRED).length,
      renewalRate: 85.5, // モック値
      topProducts: [
        { productId: '1', productName: 'CRM Pro Enterprise', revenue: 300000, contracts: 1 },
        { productId: '3', productName: 'Security Guard Professional', revenue: 600000, contracts: 1 },
        { productId: '2', productName: 'Analytics Suite Standard', revenue: 200000, contracts: 1 }
      ],
      monthlyRevenue: [
        { month: '2023-12', revenue: 300000 },
        { month: '2024-01', revenue: 450000 },
        { month: '2024-02', revenue: 200000 }
      ]
    };

    return {
      success: true,
      data: stats
    };
  }
}

export const mockContractProductService = new MockContractProductService();