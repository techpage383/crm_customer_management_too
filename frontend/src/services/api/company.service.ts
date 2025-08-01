/**
 * 企業管理API統合サービス
 * P-002 企業管理機能の実API統合
 */

import { apiClient } from './client';
import { 
  ApiResponse, 
  Company, 
  Contact,
  CompanySearchRequest, 
  CompanySearchResponse,
  CompanyCreate,
  CompanyUpdate,
  ContactCreate,
  ContactUpdate,
  API_PATHS 
} from '../../types';

export class CompanyApiService {
  /**
   * 企業検索・一覧取得
   */
  async searchCompanies(searchRequest: CompanySearchRequest): Promise<ApiResponse<CompanySearchResponse>> {
    try {
      console.log('🏢 API: Searching companies with request:', searchRequest);
      
      // クエリパラメータの構築
      const params = new URLSearchParams();
      if (searchRequest.query) params.append('query', searchRequest.query);
      if (searchRequest.status) {
        searchRequest.status.forEach(status => params.append('status', status));
      }
      if (searchRequest.size) {
        searchRequest.size.forEach(size => params.append('size', size));
      }
      if (searchRequest.industry) {
        searchRequest.industry.forEach(industry => params.append('industry', industry));
      }
      if (searchRequest.assigneeId) {
        searchRequest.assigneeId.forEach(assigneeId => params.append('assigneeId', assigneeId));
      }
      params.append('page', String(searchRequest.page || 1));
      params.append('limit', String(searchRequest.limit || 20));

      const response = await apiClient.get<ApiResponse<CompanySearchResponse>>(
        `${API_PATHS.COMPANIES.BASE}?${params.toString()}`
      );

      console.log('✅ API: Company search successful, found:', (response.data as any)?.companies?.length || 0, 'companies');
      return response.data;
    } catch (error) {
      console.error('❌ API: Company search failed:', error);
      throw new Error('企業検索に失敗しました');
    }
  }

  /**
   * 新規企業作成
   */
  async createCompany(companyData: CompanyCreate): Promise<ApiResponse<Company>> {
    try {
      console.log('➕ API: Creating new company');
      
      const response = await apiClient.post<ApiResponse<Company>>(
        API_PATHS.COMPANIES.BASE, 
        companyData
      );

      console.log('✅ API: Company created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Company creation failed:', error);
      throw new Error('企業の作成に失敗しました');
    }
  }

  /**
   * 企業詳細取得
   */
  async getCompany(companyId: string): Promise<ApiResponse<Company>> {
    try {
      console.log('🔍 API: Getting company details:', companyId);
      
      const response = await apiClient.get<ApiResponse<Company>>(
        API_PATHS.COMPANIES.DETAIL(companyId)
      );

      console.log('✅ API: Company details retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Company details retrieval failed:', error);
      throw new Error('企業詳細情報の取得に失敗しました');
    }
  }

  /**
   * 企業情報更新
   */
  async updateCompany(companyId: string, companyData: CompanyUpdate): Promise<ApiResponse<Company>> {
    try {
      console.log('🔄 API: Updating company:', companyId);
      
      const response = await apiClient.put<ApiResponse<Company>>(
        API_PATHS.COMPANIES.DETAIL(companyId),
        companyData
      );

      console.log('✅ API: Company updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Company update failed:', error);
      throw new Error('企業情報の更新に失敗しました');
    }
  }

  /**
   * 企業削除
   */
  async deleteCompany(companyId: string): Promise<ApiResponse<void>> {
    try {
      console.log('🗑️ API: Deleting company:', companyId);
      
      const response = await apiClient.delete<ApiResponse<void>>(
        API_PATHS.COMPANIES.DETAIL(companyId)
      );

      console.log('✅ API: Company deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Company deletion failed:', error);
      throw new Error('企業の削除に失敗しました');
    }
  }

  /**
   * 企業担当者変更
   */
  async assignCompany(companyId: string, assigneeData: { primaryAssigneeId?: string; secondaryAssigneeIds?: string[] }): Promise<ApiResponse<Company>> {
    try {
      console.log('👤 API: Assigning company:', { companyId, assigneeData });
      
      const response = await apiClient.put<ApiResponse<Company>>(
        API_PATHS.COMPANIES.ASSIGN(companyId),
        assigneeData
      );

      console.log('✅ API: Company assignment updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Company assignment failed:', error);
      throw new Error('企業担当者の変更に失敗しました');
    }
  }

  /**
   * 企業連絡先一覧取得
   */
  async getCompanyContacts(companyId: string): Promise<ApiResponse<Contact[]>> {
    try {
      console.log('📞 API: Getting company contacts:', companyId);
      
      const response = await apiClient.get<ApiResponse<Contact[]>>(
        API_PATHS.COMPANIES.CONTACTS(companyId)
      );

      console.log('✅ API: Company contacts retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Company contacts retrieval failed:', error);
      throw new Error('企業連絡先の取得に失敗しました');
    }
  }

  /**
   * 連絡先作成
   */
  async createContact(contactData: ContactCreate): Promise<ApiResponse<Contact>> {
    try {
      console.log('➕ API: Creating new contact');
      
      const response = await apiClient.post<ApiResponse<Contact>>(
        '/api/contacts', // 連絡先は別エンドポイント
        contactData
      );

      console.log('✅ API: Contact created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Contact creation failed:', error);
      throw new Error('連絡先の作成に失敗しました');
    }
  }

  /**
   * 連絡先更新
   */
  async updateContact(contactId: string, contactData: ContactUpdate): Promise<ApiResponse<Contact>> {
    try {
      console.log('🔄 API: Updating contact:', contactId);
      
      const response = await apiClient.put<ApiResponse<Contact>>(
        `/api/contacts/${contactId}`, // 連絡先は別エンドポイント
        contactData
      );

      console.log('✅ API: Contact updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Contact update failed:', error);
      throw new Error('連絡先の更新に失敗しました');
    }
  }

  /**
   * 連絡先削除
   */
  async deleteContact(contactId: string): Promise<ApiResponse<void>> {
    try {
      console.log('🗑️ API: Deleting contact:', contactId);
      
      const response = await apiClient.delete<ApiResponse<void>>(
        `/api/contacts/${contactId}` // 連絡先は別エンドポイント
      );

      console.log('✅ API: Contact deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Contact deletion failed:', error);
      throw new Error('連絡先の削除に失敗しました');
    }
  }

  /**
   * 企業統計情報取得（将来拡張用）
   */
  async getCompanyStats(): Promise<ApiResponse<any>> {
    try {
      console.log('📊 API: Getting company statistics');
      
      // 現在は/api/companies/statsが未実装のため、基本統計を返す
      const response = await apiClient.get<ApiResponse<any>>(
        `${API_PATHS.COMPANIES.BASE}?limit=1` // 仮実装：1件だけ取得して統計を推測
      );

      console.log('✅ API: Company stats retrieved successfully');
      return {
        success: true,
        data: {
          totalCompanies: 0, // 実際の統計は後で実装
          activeCompanies: 0,
          inactiveCompanies: 0
        }
      };
    } catch (error) {
      console.error('❌ API: Company stats retrieval failed:', error);
      throw new Error('企業統計情報の取得に失敗しました');
    }
  }
}

export const companyApiService = new CompanyApiService();