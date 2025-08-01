/**
 * Gmail管理API統合サービス
 * Gmail設定・同期・メール管理
 */

import { apiClient } from './client';
import { 
  GmailSyncStatus,
  EmailThread,
  EmailMessage,
  // SharedGmailAccount,
  ApiResponse,
  API_PATHS,
  PaginatedApiResponse
} from '../../types';

/**
 * Gmail管理サービス
 */
export const gmailApiService = {
  /**
   * Gmail同期状態取得
   */
  async getSyncStatus(): Promise<ApiResponse<GmailSyncStatus>> {
    const response = await apiClient.get<ApiResponse<GmailSyncStatus>>(
      API_PATHS.GMAIL.SYNC_STATUS
    );
    return response.data;
  },

  /**
   * Gmail手動同期実行
   */
  async syncGmail(): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      API_PATHS.GMAIL.SYNC,
      {}
    );
    return response.data;
  },

  /**
   * メールスレッド一覧取得
   */
  async getThreads(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isStarred?: boolean;
    hasAttachment?: boolean;
  }): Promise<PaginatedApiResponse<EmailThread>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isStarred !== undefined) queryParams.append('isStarred', String(params.isStarred));
    if (params?.hasAttachment !== undefined) queryParams.append('hasAttachment', String(params.hasAttachment));

    const queryString = queryParams.toString();
    const url = queryString 
      ? `${API_PATHS.GMAIL.THREADS}?${queryString}`
      : API_PATHS.GMAIL.THREADS;

    const response = await apiClient.get<PaginatedApiResponse<EmailThread>>(url);
    return response.data;
  },

  /**
   * メールスレッド詳細取得
   */
  async getThreadById(threadId: string): Promise<ApiResponse<EmailThread>> {
    const response = await apiClient.get<ApiResponse<EmailThread>>(
      API_PATHS.GMAIL.THREAD_DETAIL(threadId)
    );
    return response.data;
  },

  /**
   * メールスレッド更新
   */
  async updateThread(threadId: string, updates: {
    isRead?: boolean;
    isStarred?: boolean;
    labels?: string[];
  }): Promise<ApiResponse<EmailThread>> {
    const response = await apiClient.put<ApiResponse<EmailThread>>(
      API_PATHS.GMAIL.THREAD_DETAIL(threadId),
      updates
    );
    return response.data;
  },

  /**
   * スレッド内メッセージ一覧取得
   */
  async getThreadMessages(threadId: string): Promise<ApiResponse<EmailMessage[]>> {
    const response = await apiClient.get<ApiResponse<EmailMessage[]>>(
      `${API_PATHS.GMAIL.THREAD_DETAIL(threadId)}/messages`
    );
    return response.data;
  },

  /**
   * 共有Gmail設定一覧取得（上位権限）
   */
  async getSharedAccounts(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get<ApiResponse<any[]>>(
      API_PATHS.GMAIL.SHARED_ACCOUNTS
    );
    return response.data;
  },

  /**
   * 共有Gmail設定作成（上位権限）
   */
  async createSharedAccount(accountData: {
    accountName: string;
    email: string;
    allowedUserIds: string[];
    isActive?: boolean;
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>(
      API_PATHS.GMAIL.SHARED_ACCOUNTS,
      accountData
    );
    return response.data;
  },

  /**
   * 共有Gmail設定更新（上位権限）
   */
  async updateSharedAccount(
    accountId: string,
    updates: any
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.put<ApiResponse<any>>(
      API_PATHS.GMAIL.SHARED_ACCOUNT_DETAIL(accountId),
      updates
    );
    return response.data;
  },

  /**
   * 共有Gmail設定削除（上位権限）
   */
  async deleteSharedAccount(accountId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      API_PATHS.GMAIL.SHARED_ACCOUNT_DETAIL(accountId)
    );
    return response.data;
  },

  /**
   * Gmail認証URL生成
   */
  async getConnectUrl(userId: string): Promise<ApiResponse<{ authUrl: string }>> {
    const response = await apiClient.get<ApiResponse<{ authUrl: string }>>(
      `/api/gmail/connect/${userId}`
    );
    return response.data;
  },

  /**
   * Gmail接続処理
   */
  async connectGmail(userId: string, authCode: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/api/gmail/connect/${userId}`,
      { authCode }
    );
    return response.data;
  },

  /**
   * Gmail接続解除
   */
  async disconnectGmail(userId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/api/gmail/disconnect/${userId}`
    );
    return response.data;
  },

  /**
   * Gmail設定テーブル初期化（COMPANY_LEADER限定）
   */
  async initializeGmail(): Promise<ApiResponse<{ message: string; tablesCreated: string[] }>> {
    const response = await apiClient.post<ApiResponse<{ message: string; tablesCreated: string[] }>>(
      `/api/gmail/initialize`,
      {}
    );
    return response.data;
  },

  /**
   * Gmailサービスヘルスチェック
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    const response = await apiClient.get<ApiResponse<{ status: string; timestamp: string }>>(
      `/api/gmail/health`
    );
    return response.data;
  }
};