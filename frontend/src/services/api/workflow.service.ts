/**
 * ワークフロー管理API統合サービス
 * 最強タスク管理ツール - 実API統合
 */

import { apiClient } from './client';
import { 
  WorkflowTemplate,
  WorkflowType,
  WorkflowSettings,
  EffortTemplate,
  WorkflowStatus,
  WorkflowApprovalFlow,
  ApiResponse,
  API_PATHS,
  PaginatedResponse,
  PaginatedApiResponse,
  TodoStatus
} from '../../types';

/**
 * ワークフローテンプレート管理サービス
 */
export const workflowApiService = {
  /**
   * ワークフローテンプレート一覧取得
   */
  async getWorkflowTemplates(options?: {
    type?: WorkflowType;
    createdBy?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<WorkflowTemplate>>> {
    const params = new URLSearchParams();
    if (options?.type) params.append('type', options.type);
    if (options?.createdBy) params.append('createdBy', options.createdBy);
    if (options?.isActive !== undefined) params.append('isActive', String(options.isActive));
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));

    const queryString = params.toString();
    const url = queryString 
      ? `${API_PATHS.WORKFLOWS.TEMPLATES}?${queryString}`
      : API_PATHS.WORKFLOWS.TEMPLATES;

    const response = await apiClient.get<ApiResponse<PaginatedResponse<WorkflowTemplate>>>(url);
    if (!response.data) {
      throw new Error('ワークフローテンプレートの取得に失敗しました');
    }
    return response.data;
  },

  /**
   * ワークフローテンプレート作成
   */
  async createWorkflowTemplate(templateData: {
    name: string;
    description?: string;
    type: WorkflowType;
    columns?: any[];
    accessControl?: any;
    isActive?: boolean;
  }): Promise<ApiResponse<WorkflowTemplate>> {
    const response = await apiClient.post<ApiResponse<WorkflowTemplate>>(
      API_PATHS.WORKFLOWS.TEMPLATES,
      templateData
    );
    if (!response.data) {
      throw new Error('ワークフローテンプレートの作成に失敗しました');
    }
    return response.data;
  },

  /**
   * ワークフローテンプレート詳細取得
   */
  async getWorkflowTemplateById(templateId: string): Promise<ApiResponse<WorkflowTemplate>> {
    const response = await apiClient.get<ApiResponse<WorkflowTemplate>>(
      API_PATHS.WORKFLOWS.TEMPLATE_DETAIL(templateId)
    );
    return response.data;
  },

  /**
   * ワークフローテンプレート更新
   */
  async updateWorkflowTemplate(
    templateId: string,
    updates: Partial<WorkflowTemplate>
  ): Promise<ApiResponse<WorkflowTemplate>> {
    const response = await apiClient.put<ApiResponse<WorkflowTemplate>>(
      API_PATHS.WORKFLOWS.TEMPLATE_DETAIL(templateId),
      updates
    );
    return response.data;
  },

  /**
   * ワークフローテンプレート削除
   */
  async deleteWorkflowTemplate(templateId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      API_PATHS.WORKFLOWS.TEMPLATE_DETAIL(templateId)
    );
    return response.data;
  },

  /**
   * ワークフロー設定取得（自分用）
   */
  async getWorkflowSettings(): Promise<ApiResponse<WorkflowSettings>> {
    const response = await apiClient.get<ApiResponse<WorkflowSettings>>(
      API_PATHS.WORKFLOWS.SETTINGS
    );
    return response.data;
  },

  /**
   * ワークフロー設定更新（自分用）
   */
  async updateWorkflowSettings(settings: Partial<WorkflowSettings>): Promise<ApiResponse<WorkflowSettings>> {
    const response = await apiClient.put<ApiResponse<WorkflowSettings>>(
      API_PATHS.WORKFLOWS.SETTINGS,
      settings
    );
    return response.data;
  },

  /**
   * 特定ユーザーのワークフロー設定取得（上位権限用）
   */
  async getUserWorkflowSettings(userId: string): Promise<ApiResponse<WorkflowSettings>> {
    const response = await apiClient.get<ApiResponse<WorkflowSettings>>(
      API_PATHS.WORKFLOWS.USER_SETTINGS(userId)
    );
    return response.data;
  },

  /**
   * 特定ユーザーのワークフロー設定更新（上位権限用）
   */
  async updateUserWorkflowSettings(
    userId: string,
    settings: Partial<WorkflowSettings>
  ): Promise<ApiResponse<WorkflowSettings>> {
    const response = await apiClient.put<ApiResponse<WorkflowSettings>>(
      API_PATHS.WORKFLOWS.USER_SETTINGS(userId),
      settings
    );
    return response.data;
  },

  /**
   * 企業ワークフロー設定取得（MANAGER以上）
   */
  async getCompanyWorkflowSettings(companyId: string): Promise<ApiResponse<WorkflowSettings>> {
    const response = await apiClient.get<ApiResponse<WorkflowSettings>>(
      API_PATHS.WORKFLOWS.COMPANY_SETTINGS(companyId)
    );
    return response.data;
  },

  /**
   * 企業ワークフロー設定更新（MANAGER以上）
   */
  async updateCompanyWorkflowSettings(
    companyId: string,
    settings: Partial<WorkflowSettings>
  ): Promise<ApiResponse<WorkflowSettings>> {
    const response = await apiClient.put<ApiResponse<WorkflowSettings>>(
      API_PATHS.WORKFLOWS.COMPANY_SETTINGS(companyId),
      settings
    );
    return response.data;
  },

  /**
   * 工数テンプレート一覧取得
   */
  async getEffortTemplates(): Promise<PaginatedApiResponse<EffortTemplate>> {
    const response = await apiClient.get<PaginatedApiResponse<EffortTemplate>>(
      API_PATHS.WORKFLOWS.EFFORT_TEMPLATES
    );
    return response.data;
  },

  /**
   * 工数テンプレート作成
   */
  async createEffortTemplate(templateData: {
    name: string;
    description?: string;
    templateData: any;
    isActive?: boolean;
  }): Promise<ApiResponse<EffortTemplate>> {
    const response = await apiClient.post<ApiResponse<EffortTemplate>>(
      API_PATHS.WORKFLOWS.EFFORT_TEMPLATES,
      templateData
    );
    return response.data;
  },

  /**
   * 工数テンプレート詳細取得
   */
  async getEffortTemplateById(templateId: string): Promise<ApiResponse<EffortTemplate>> {
    const response = await apiClient.get<ApiResponse<EffortTemplate>>(
      API_PATHS.WORKFLOWS.EFFORT_TEMPLATE_BY_ID(templateId)
    );
    return response.data;
  },

  /**
   * 工数テンプレート更新
   */
  async updateEffortTemplate(
    templateId: string,
    updates: Partial<EffortTemplate>
  ): Promise<ApiResponse<EffortTemplate>> {
    const response = await apiClient.put<ApiResponse<EffortTemplate>>(
      API_PATHS.WORKFLOWS.EFFORT_TEMPLATE_BY_ID(templateId),
      updates
    );
    return response.data;
  },

  /**
   * 工数テンプレート削除
   */
  async deleteEffortTemplate(templateId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      API_PATHS.WORKFLOWS.EFFORT_TEMPLATE_BY_ID(templateId)
    );
    return response.data;
  },

  /**
   * 工数テンプレート統計取得
   */
  async getEffortTemplateStats(): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(
      API_PATHS.WORKFLOWS.EFFORT_TEMPLATE_STATS
    );
    return response.data;
  },

  /**
   * カスタムステータス一覧取得
   */
  async getCustomStatuses(): Promise<ApiResponse<WorkflowStatus[]>> {
    const response = await apiClient.get<ApiResponse<WorkflowStatus[]>>(
      API_PATHS.WORKFLOWS.CUSTOM_STATUSES
    );
    if (!response.data) {
      throw new Error('カスタムステータスの取得に失敗しました');
    }
    return response.data;
  },

  /**
   * カスタムステータス作成
   */
  async createCustomStatus(statusData: {
    name: string;
    displayName: string;
    description?: string;
    color: string;
    textColor: string;
    icon?: string;
    scope: 'PERSONAL' | 'TEAM' | 'COMPANY';
  }): Promise<ApiResponse<WorkflowStatus>> {
    const response = await apiClient.post<ApiResponse<WorkflowStatus>>(
      API_PATHS.WORKFLOWS.CUSTOM_STATUSES,
      statusData
    );
    if (!response.data) {
      throw new Error('カスタムステータスの作成に失敗しました');
    }
    return response.data;
  },

  /**
   * 承認申請作成
   */
  async createApprovalRequest(approvalData: {
    workflowId: string;
    todoId?: string;
    approvalType: string;
    reason?: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<WorkflowApprovalFlow>> {
    const response = await apiClient.post<ApiResponse<WorkflowApprovalFlow>>(
      API_PATHS.WORKFLOWS.APPROVAL.REQUEST,
      approvalData
    );
    if (!response.data) {
      throw new Error('承認申請の作成に失敗しました');
    }
    return response.data;
  },

  /**
   * 承認実行
   */
  async approveRequest(approvalId: string, comments?: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      API_PATHS.WORKFLOWS.APPROVAL.APPROVE,
      { approvalId, comments }
    );
    return response.data;
  },

  /**
   * 承認拒否
   */
  async rejectRequest(approvalId: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      API_PATHS.WORKFLOWS.APPROVAL.REJECT,
      { approvalId, reason }
    );
    return response.data;
  },

  /**
   * ワークフロー適用（ステータス遷移）
   */
  async applyWorkflow(transitionData: {
    todoId: string;
    fromStatus: TodoStatus;
    toStatus: TodoStatus;
    reason?: string;
  }): Promise<ApiResponse<{ success: boolean }>> {
    const response = await apiClient.post<ApiResponse<{ success: boolean }>>(
      API_PATHS.WORKFLOWS.APPLY_WORKFLOW,
      transitionData
    );
    return response.data;
  },

  /**
   * 監査ログ取得（上位権限者のみ）
   */
  async getAuditLogs(filters?: {
    userId?: string;
    operation?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.operation) params.append('operation', filters.operation);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    const url = queryString 
      ? `${API_PATHS.WORKFLOWS.AUDIT_LOGS}?${queryString}`
      : API_PATHS.WORKFLOWS.AUDIT_LOGS;

    const response = await apiClient.get<ApiResponse<any[]>>(url);
    if (!response.data) {
      throw new Error('監査ログの取得に失敗しました');
    }
    return response.data;
  }
};