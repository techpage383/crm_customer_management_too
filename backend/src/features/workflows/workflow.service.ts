/**
 * ワークフロー管理 - サービス層
 * 最強タスク管理ツール
 */

import { WorkflowModel } from './workflow.model.js';
import { WorkflowValidator } from './workflow.validator.js';
import { 
  WorkflowTemplate, 
  WorkflowSettings, 
  EffortTemplate,
  WorkflowType,
  WorkflowScope,
  UserRole,
  ID,
  ApiResponse,
  PaginationParams,
  PaginationMeta
} from '../../types/index.js';

interface CreateWorkflowTemplateRequest {
  companyId: string;
  name: string;
  description?: string;
  type: WorkflowType;
  scope: WorkflowScope;
  workflowData: any;
  accessControl: any;
  createdBy: string;
  isActive?: boolean;
}

interface UpdateWorkflowTemplateRequest {
  name?: string;
  description?: string;
  type?: WorkflowType;
  scope?: WorkflowScope;
  workflowData?: any;
  accessControl?: any;
  isActive?: boolean;
}

interface WorkflowTemplateListOptions {
  scope?: WorkflowScope;
  type?: WorkflowType;
  createdBy?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class WorkflowService {
  private workflowModel: WorkflowModel;

  constructor(databaseUrl: string) {
    this.workflowModel = new WorkflowModel({ connectionString: databaseUrl });
  }

  /**
   * データベース初期化
   */
  async initialize(): Promise<void> {
    try {
      await this.workflowModel.createWorkflowTables();
      console.log('[WorkflowService] 初期化完了');
    } catch (error) {
      console.error('[WorkflowService] 初期化エラー:', error);
      throw new Error(`ワークフローサービス初期化に失敗しました: ${error.message}`);
    }
  }

  /**
   * ワークフローテンプレート作成
   */
  async createWorkflowTemplate(
    userId: string,
    userRole: UserRole,
    request: CreateWorkflowTemplateRequest
  ): Promise<ApiResponse<WorkflowTemplate>> {
    try {
      console.log(`[WorkflowService] ワークフローテンプレート作成開始 - ユーザー: ${userId}`);

      // バリデーション
      const validation = WorkflowValidator.validateCreateWorkflowTemplate(request);
      if (!validation.isValid) {
        console.log(`[WorkflowService] バリデーションエラー: ${validation.errors.join(', ')}`);
        return {
          success: false,
          error: `入力エラー: ${validation.errors.join(', ')}`
        };
      }

      // 権限チェック
      const permissionCheck = await this.checkWorkflowTemplateCreatePermission(
        userRole, 
        request.scope, 
        request.companyId,
        userId
      );
      
      if (!permissionCheck.hasPermission) {
        console.log(`[WorkflowService] 権限不足: ${permissionCheck.reason}`);
        return {
          success: false,
          error: `権限エラー: ${permissionCheck.reason}`
        };
      }

      // ワークフローテンプレート作成
      const template = await this.workflowModel.createWorkflowTemplate({
        companyId: request.companyId,
        name: request.name,
        description: request.description,
        type: request.type,
        scope: request.scope,
        workflowData: request.workflowData,
        accessControl: request.accessControl,
        isActive: request.isActive !== false,
        createdBy: request.createdBy
      });

      console.log(`[WorkflowService] ワークフローテンプレート作成完了: ${template.id}`);
      return {
        success: true,
        data: template
      };
    } catch (error) {
      console.error('[WorkflowService] ワークフローテンプレート作成エラー:', error);
      return {
        success: false,
        error: `ワークフローテンプレート作成に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * ワークフローテンプレート一覧取得
   */
  async getWorkflowTemplates(
    userId: string,
    userRole: UserRole,
    companyId: string,
    options: WorkflowTemplateListOptions = {}
  ): Promise<ApiResponse<WorkflowTemplate[]>> {
    try {
      console.log(`[WorkflowService] ワークフローテンプレート一覧取得開始 - ユーザー: ${userId}`);

      // ページネーションバリデーション
      if (options.page || options.limit) {
        const paginationValidation = WorkflowValidator.validatePaginationParams(options);
        if (!paginationValidation.isValid) {
          return {
            success: false,
            error: `ページネーションエラー: ${paginationValidation.errors.join(', ')}`
          };
        }
      }

      // 権限に基づいたフィルタリング
      const filteredOptions = await this.applyPermissionBasedFiltering(
        userRole,
        userId,
        companyId,
        options
      );

      // データ取得
      const result = await this.workflowModel.getWorkflowTemplates(companyId, filteredOptions);

      const paginationMeta: PaginationMeta = {
        page: options.page || 1,
        limit: options.limit || result.total,
        total: result.total,
        totalPages: options.limit ? Math.ceil(result.total / options.limit) : 1
      };

      console.log(`[WorkflowService] ワークフローテンプレート一覧取得完了: ${result.templates.length}件`);
      return {
        success: true,
        data: result.templates,
        meta: paginationMeta
      };
    } catch (error) {
      console.error('[WorkflowService] ワークフローテンプレート一覧取得エラー:', error);
      return {
        success: false,
        error: `ワークフローテンプレート一覧取得に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * ワークフローテンプレート詳細取得
   */
  async getWorkflowTemplateById(
    userId: string,
    userRole: UserRole,
    templateId: string,
    companyId: string
  ): Promise<ApiResponse<WorkflowTemplate>> {
    try {
      console.log(`[WorkflowService] ワークフローテンプレート詳細取得開始: ${templateId}`);

      // IDバリデーション
      const idValidation = WorkflowValidator.validateId(templateId, 'テンプレートID');
      if (!idValidation.isValid) {
        return {
          success: false,
          error: `IDエラー: ${idValidation.errors.join(', ')}`
        };
      }

      // データ取得
      const template = await this.workflowModel.getWorkflowTemplateById(templateId, companyId);
      
      if (!template) {
        console.log(`[WorkflowService] ワークフローテンプレートが見つかりません: ${templateId}`);
        return {
          success: false,
          error: 'ワークフローテンプレートが見つかりません'
        };
      }

      // アクセス権限チェック
      const accessCheck = await this.checkWorkflowTemplateAccessPermission(
        userRole,
        userId,
        template
      );

      if (!accessCheck.hasPermission) {
        console.log(`[WorkflowService] アクセス権限不足: ${accessCheck.reason}`);
        return {
          success: false,
          error: `アクセス権限エラー: ${accessCheck.reason}`
        };
      }

      console.log(`[WorkflowService] ワークフローテンプレート詳細取得完了: ${templateId}`);
      return {
        success: true,
        data: template
      };
    } catch (error) {
      console.error('[WorkflowService] ワークフローテンプレート詳細取得エラー:', error);
      return {
        success: false,
        error: `ワークフローテンプレート詳細取得に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * ワークフローテンプレート更新
   */
  async updateWorkflowTemplate(
    userId: string,
    userRole: UserRole,
    templateId: string,
    companyId: string,
    updates: UpdateWorkflowTemplateRequest
  ): Promise<ApiResponse<WorkflowTemplate>> {
    try {
      console.log(`[WorkflowService] ワークフローテンプレート更新開始: ${templateId}`);

      // バリデーション
      const validation = WorkflowValidator.validateUpdateWorkflowTemplate(updates);
      if (!validation.isValid) {
        return {
          success: false,
          error: `入力エラー: ${validation.errors.join(', ')}`
        };
      }

      // 既存テンプレート取得
      const existingTemplate = await this.workflowModel.getWorkflowTemplateById(templateId, companyId);
      if (!existingTemplate) {
        return {
          success: false,
          error: 'ワークフローテンプレートが見つかりません'
        };
      }

      // 更新権限チェック
      const permissionCheck = await this.checkWorkflowTemplateUpdatePermission(
        userRole,
        userId,
        existingTemplate
      );

      if (!permissionCheck.hasPermission) {
        console.log(`[WorkflowService] 更新権限不足: ${permissionCheck.reason}`);
        return {
          success: false,
          error: `権限エラー: ${permissionCheck.reason}`
        };
      }

      // 更新実行
      const updatedTemplate = await this.workflowModel.updateWorkflowTemplate(
        templateId,
        companyId,
        updates
      );

      if (!updatedTemplate) {
        return {
          success: false,
          error: 'ワークフローテンプレートの更新に失敗しました'
        };
      }

      console.log(`[WorkflowService] ワークフローテンプレート更新完了: ${templateId}`);
      return {
        success: true,
        data: updatedTemplate
      };
    } catch (error) {
      console.error('[WorkflowService] ワークフローテンプレート更新エラー:', error);
      return {
        success: false,
        error: `ワークフローテンプレート更新に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * ワークフローテンプレート削除
   */
  async deleteWorkflowTemplate(
    userId: string,
    userRole: UserRole,
    templateId: string,
    companyId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      console.log(`[WorkflowService] ワークフローテンプレート削除開始: ${templateId}`);

      // 既存テンプレート取得
      const existingTemplate = await this.workflowModel.getWorkflowTemplateById(templateId, companyId);
      if (!existingTemplate) {
        return {
          success: false,
          error: 'ワークフローテンプレートが見つかりません'
        };
      }

      // 削除権限チェック
      const permissionCheck = await this.checkWorkflowTemplateDeletePermission(
        userRole,
        userId,
        existingTemplate
      );

      if (!permissionCheck.hasPermission) {
        console.log(`[WorkflowService] 削除権限不足: ${permissionCheck.reason}`);
        return {
          success: false,
          error: `権限エラー: ${permissionCheck.reason}`
        };
      }

      // 削除実行
      const deleted = await this.workflowModel.deleteWorkflowTemplate(templateId, companyId);

      if (!deleted) {
        return {
          success: false,
          error: 'ワークフローテンプレートの削除に失敗しました'
        };
      }

      console.log(`[WorkflowService] ワークフローテンプレート削除完了: ${templateId}`);
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('[WorkflowService] ワークフローテンプレート削除エラー:', error);
      return {
        success: false,
        error: `ワークフローテンプレート削除に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * ワークフローテンプレート作成権限チェック
   */
  private async checkWorkflowTemplateCreatePermission(
    userRole: UserRole,
    scope: WorkflowScope,
    companyId: string,
    userId: string
  ): Promise<{ hasPermission: boolean; reason?: string }> {
    switch (scope) {
      case WorkflowScope.PERSONAL:
        // 個人スコープは全ユーザーが作成可能
        return { hasPermission: true };

      case WorkflowScope.TEAM:
        // チームスコープはTEAM_LEADER以上が作成可能
        if ([UserRole.TEAM_LEADER, UserRole.MANAGER, UserRole.COMPANY_LEADER].includes(userRole)) {
          return { hasPermission: true };
        }
        return { 
          hasPermission: false, 
          reason: 'チーム向けワークフローの作成にはチームリーダー以上の権限が必要です' 
        };

      case WorkflowScope.COMPANY:
        // 企業スコープはMANAGER以上が作成可能
        if ([UserRole.MANAGER, UserRole.COMPANY_LEADER].includes(userRole)) {
          return { hasPermission: true };
        }
        return { 
          hasPermission: false, 
          reason: '企業向けワークフローの作成にはマネージャー以上の権限が必要です' 
        };

      default:
        return { hasPermission: false, reason: '無効なスコープです' };
    }
  }

  /**
   * ワークフローテンプレートアクセス権限チェック
   */
  private async checkWorkflowTemplateAccessPermission(
    userRole: UserRole,
    userId: string,
    template: WorkflowTemplate
  ): Promise<{ hasPermission: boolean; reason?: string }> {
    // 作成者は常にアクセス可能
    if (template.createdBy === userId) {
      return { hasPermission: true };
    }

    // スコープ別アクセス制御
    switch (template.scope) {
      case WorkflowScope.PERSONAL:
        // 個人スコープは作成者のみアクセス可能
        return { 
          hasPermission: false, 
          reason: '個人ワークフローは作成者のみアクセス可能です' 
        };

      case WorkflowScope.TEAM:
        // チームスコープはチームメンバーがアクセス可能
        // TODO: チームメンバーシップの確認ロジックを実装
        return { hasPermission: true };

      case WorkflowScope.COMPANY:
        // 企業スコープは同じ企業のユーザーがアクセス可能
        return { hasPermission: true };

      default:
        return { hasPermission: false, reason: '無効なスコープです' };
    }
  }

  /**
   * ワークフローテンプレート更新権限チェック
   */
  private async checkWorkflowTemplateUpdatePermission(
    userRole: UserRole,
    userId: string,
    template: WorkflowTemplate
  ): Promise<{ hasPermission: boolean; reason?: string }> {
    // 作成者は常に更新可能
    if (template.createdBy === userId) {
      return { hasPermission: true };
    }

    // スコープ別更新権限
    switch (template.scope) {
      case WorkflowScope.PERSONAL:
        return { 
          hasPermission: false, 
          reason: '個人ワークフローは作成者のみ更新可能です' 
        };

      case WorkflowScope.TEAM:
        if ([UserRole.TEAM_LEADER, UserRole.MANAGER, UserRole.COMPANY_LEADER].includes(userRole)) {
          return { hasPermission: true };
        }
        return { 
          hasPermission: false, 
          reason: 'チーム向けワークフローの更新にはチームリーダー以上の権限が必要です' 
        };

      case WorkflowScope.COMPANY:
        if ([UserRole.MANAGER, UserRole.COMPANY_LEADER].includes(userRole)) {
          return { hasPermission: true };
        }
        return { 
          hasPermission: false, 
          reason: '企業向けワークフローの更新にはマネージャー以上の権限が必要です' 
        };

      default:
        return { hasPermission: false, reason: '無効なスコープです' };
    }
  }

  /**
   * ワークフローテンプレート削除権限チェック
   */
  private async checkWorkflowTemplateDeletePermission(
    userRole: UserRole,
    userId: string,
    template: WorkflowTemplate
  ): Promise<{ hasPermission: boolean; reason?: string }> {
    // 削除権限は更新権限と同じロジック
    return this.checkWorkflowTemplateUpdatePermission(userRole, userId, template);
  }

  /**
   * 権限に基づいたフィルタリング適用
   */
  private async applyPermissionBasedFiltering(
    userRole: UserRole,
    userId: string,
    companyId: string,
    options: WorkflowTemplateListOptions
  ): Promise<WorkflowTemplateListOptions> {
    const filteredOptions = { ...options };

    // 一般ユーザーは自分の個人ワークフローのみ閲覧可能
    if (userRole === UserRole.USER) {
      filteredOptions.createdBy = userId;
      filteredOptions.scope = WorkflowScope.PERSONAL;
    }

    return filteredOptions;
  }

  /**
   * サービス終了処理
   */
  async close(): Promise<void> {
    await this.workflowModel.close();
    console.log('[WorkflowService] サービス終了');
  }
}