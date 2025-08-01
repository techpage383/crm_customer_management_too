/**
 * ユーザー管理API統合サービス
 * P-010 ユーザー管理機能の実API統合
 */

import { apiClient } from './client';
import { 
  ApiResponse, 
  User, 
  UserSearchRequest, 
  UserSearchResponse,
  UserStatsResponse,
  UserStatusUpdateRequest,
  UserCreate,
  UserUpdate,
  BulkUserUpdateRequest,
  BulkUserUpdateResponse,
  API_PATHS 
} from '../../types';

export class UserApiService {
  /**
   * ユーザー検索・一覧取得
   */
  async searchUsers(searchRequest: UserSearchRequest): Promise<ApiResponse<UserSearchResponse>> {
    try {
      console.log('🔍 API: Searching users with request:', searchRequest);
      
      // クエリパラメータの構築
      const params = new URLSearchParams();
      if (searchRequest.query) params.append('query', searchRequest.query);
      if (searchRequest.role) {
        searchRequest.role.forEach(role => params.append('role', role));
      }
      if (searchRequest.isActive !== undefined) params.append('isActive', String(searchRequest.isActive));
      if (searchRequest.department) params.append('department', searchRequest.department);
      if (searchRequest.gmailConnected !== undefined) params.append('gmailConnected', String(searchRequest.gmailConnected));
      params.append('page', String(searchRequest.page || 1));
      params.append('limit', String(searchRequest.limit || 10));
      if (searchRequest.sortBy) params.append('sortBy', searchRequest.sortBy);
      if (searchRequest.sortOrder) params.append('sortOrder', searchRequest.sortOrder);

      const response = await apiClient.get<ApiResponse<UserSearchResponse>>(
        `${API_PATHS.USERS.BASE}?${params.toString()}`
      );

      console.log('✅ API: User search successful, found:', (response.data as any)?.users?.length || 0, 'users');
      return response.data;
    } catch (error) {
      console.error('❌ API: User search failed:', error);
      throw new Error('ユーザー検索に失敗しました');
    }
  }

  /**
   * ユーザー統計情報取得
   */
  async getUserStats(): Promise<ApiResponse<UserStatsResponse>> {
    try {
      console.log('📊 API: Getting user statistics');
      
      const response = await apiClient.get<ApiResponse<UserStatsResponse>>(
        API_PATHS.USERS.STATS
      );

      console.log('✅ API: User stats retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: User stats retrieval failed:', error);
      throw new Error('ユーザー統計情報の取得に失敗しました');
    }
  }

  /**
   * ユーザーステータス更新
   */
  async updateUserStatus(userId: string, statusUpdate: UserStatusUpdateRequest): Promise<ApiResponse<void>> {
    try {
      console.log('🔄 API: Updating user status:', { userId, statusUpdate });
      
      const response = await apiClient.put<ApiResponse<void>>(
        API_PATHS.USERS.STATUS(userId),
        statusUpdate
      );

      console.log('✅ API: User status updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: User status update failed:', error);
      throw new Error('ユーザーステータスの更新に失敗しました');
    }
  }

  /**
   * 新規ユーザー作成
   */
  async createUser(userData: UserCreate): Promise<ApiResponse<User>> {
    try {
      console.log('➕ API: Creating new user');
      
      const response = await apiClient.post<ApiResponse<User>>(
        API_PATHS.USERS.BASE, 
        userData
      );

      console.log('✅ API: User created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: User creation failed:', error);
      throw new Error('ユーザーの作成に失敗しました');
    }
  }

  /**
   * ユーザー詳細取得
   */
  async getUser(userId: string): Promise<ApiResponse<User>> {
    try {
      console.log('🔍 API: Getting user details:', userId);
      
      const response = await apiClient.get<ApiResponse<User>>(
        API_PATHS.USERS.DETAIL(userId)
      );

      console.log('✅ API: User details retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: User details retrieval failed:', error);
      throw new Error('ユーザー詳細情報の取得に失敗しました');
    }
  }

  /**
   * ユーザー情報更新
   */
  async updateUser(userId: string, userData: UserUpdate): Promise<ApiResponse<User>> {
    try {
      console.log('🔄 API: Updating user:', userId);
      
      const response = await apiClient.put<ApiResponse<User>>(
        API_PATHS.USERS.DETAIL(userId),
        userData
      );

      console.log('✅ API: User updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: User update failed:', error);
      throw new Error('ユーザー情報の更新に失敗しました');
    }
  }

  /**
   * ユーザー削除
   */
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    try {
      console.log('🗑️ API: Deleting user:', userId);
      
      const response = await apiClient.delete<ApiResponse<void>>(
        API_PATHS.USERS.DETAIL(userId)
      );

      console.log('✅ API: User deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: User deletion failed:', error);
      throw new Error('ユーザーの削除に失敗しました');
    }
  }

  /**
   * 一括ユーザー更新
   */
  async bulkUpdateUsers(bulkUpdate: BulkUserUpdateRequest): Promise<ApiResponse<BulkUserUpdateResponse>> {
    try {
      console.log('🔄 API: Bulk updating users:', bulkUpdate.userIds.length, 'users');
      
      const response = await apiClient.put<ApiResponse<BulkUserUpdateResponse>>(
        API_PATHS.USERS.BULK_UPDATE,
        bulkUpdate
      );

      console.log('✅ API: Bulk user update completed');
      return response.data;
    } catch (error) {
      console.error('❌ API: Bulk user update failed:', error);
      throw new Error('ユーザーの一括更新に失敗しました');
    }
  }

  /**
   * ユーザーCSV出力
   */
  async exportUsersCSV(filters?: Partial<UserSearchRequest>): Promise<Blob> {
    try {
      console.log('📄 API: Exporting users to CSV');
      
      const params = new URLSearchParams();
      if (filters?.query) params.append('query', filters.query);
      if (filters?.role) {
        filters.role.forEach(role => params.append('role', role));
      }
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters?.department) params.append('department', filters.department);

      const response = await apiClient.get(
        `${API_PATHS.USERS.EXPORT_CSV}?${params.toString()}`,
        { responseType: 'blob' }
      );

      console.log('✅ API: CSV export completed');
      return response.data;
    } catch (error) {
      console.error('❌ API: CSV export failed:', error);
      throw new Error('CSVエクスポートに失敗しました');
    }
  }
}

export const userApiService = new UserApiService();