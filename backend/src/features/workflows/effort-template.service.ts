/**
 * 工数テンプレート管理 - サービス層
 * 最強タスク管理ツール
 */

import { WorkflowModel } from './workflow.model.js';
import { WorkflowValidator } from './workflow.validator.js';
import { 
  EffortTemplate,
  WorkflowScope,
  UserRole,
  ID,
  ApiResponse,
  PaginationMeta
} from '../../types/index.js';

interface CreateEffortTemplateRequest {
  companyId: string;
  name: string;
  category: string;
  estimatedHours: number;
  description?: string;
  templateData: any;
  scope: WorkflowScope;
  accessControl: any;
  createdBy: string;
  isActive?: boolean;
}

interface UpdateEffortTemplateRequest {
  name?: string;
  category?: string;
  estimatedHours?: number;
  description?: string;
  templateData?: any;
  scope?: WorkflowScope;
  accessControl?: any;
  isActive?: boolean;
}

interface EffortTemplateListOptions {
  category?: string;
  scope?: WorkflowScope;
  createdBy?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class EffortTemplateService {
  private workflowModel: WorkflowModel;

  constructor(databaseUrl: string) {
    this.workflowModel = new WorkflowModel({ connectionString: databaseUrl });
  }

  /**
   * 工数テンプレート作成
   */
  async createEffortTemplate(
    userId: string,
    userRole: UserRole,
    request: CreateEffortTemplateRequest
  ): Promise<ApiResponse<EffortTemplate>> {
    try {
      console.log(`[EffortTemplateService] 工数テンプレート作成開始 - ユーザー: ${userId}`);

      // バリデーション
      const validation = WorkflowValidator.validateCreateEffortTemplate(request);
      if (!validation.isValid) {
        console.log(`[EffortTemplateService] バリデーションエラー: ${validation.errors.join(', ')}`);
        return {
          success: false,
          error: `入力エラー: ${validation.errors.join(', ')}`
        };
      }

      // 権限チェック
      const permissionCheck = await this.checkEffortTemplateCreatePermission(
        userRole, 
        request.scope, 
        request.companyId,
        userId
      );
      
      if (!permissionCheck.hasPermission) {
        console.log(`[EffortTemplateService] 権限不足: ${permissionCheck.reason}`);
        return {
          success: false,
          error: `権限エラー: ${permissionCheck.reason}`
        };
      }

      // 工数テンプレート作成
      const template = await this.createEffortTemplateInDatabase(request);

      console.log(`[EffortTemplateService] 工数テンプレート作成完了: ${template.id}`);
      return {
        success: true,
        data: template
      };
    } catch (error) {
      console.error('[EffortTemplateService] 工数テンプレート作成エラー:', error);
      return {
        success: false,
        error: `工数テンプレート作成に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * 工数テンプレート一覧取得
   */
  async getEffortTemplates(
    userId: string,
    userRole: UserRole,
    companyId: string,
    options: EffortTemplateListOptions = {}
  ): Promise<ApiResponse<EffortTemplate[]>> {
    try {
      console.log(`[EffortTemplateService] 工数テンプレート一覧取得開始 - ユーザー: ${userId}`);

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
      const result = await this.getEffortTemplatesFromDatabase(companyId, filteredOptions);

      const paginationMeta: PaginationMeta = {
        page: options.page || 1,
        limit: options.limit || result.total,
        total: result.total,
        totalPages: options.limit ? Math.ceil(result.total / options.limit) : 1
      };

      console.log(`[EffortTemplateService] 工数テンプレート一覧取得完了: ${result.templates.length}件`);
      return {
        success: true,
        data: result.templates,
        meta: paginationMeta
      };
    } catch (error) {
      console.error('[EffortTemplateService] 工数テンプレート一覧取得エラー:', error);
      return {
        success: false,
        error: `工数テンプレート一覧取得に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * 工数テンプレート詳細取得
   */
  async getEffortTemplateById(
    userId: string,
    userRole: UserRole,
    templateId: string,
    companyId: string
  ): Promise<ApiResponse<EffortTemplate>> {
    try {
      console.log(`[EffortTemplateService] 工数テンプレート詳細取得開始: ${templateId}`);

      // IDバリデーション
      const idValidation = WorkflowValidator.validateId(templateId, 'テンプレートID');
      if (!idValidation.isValid) {
        return {
          success: false,
          error: `IDエラー: ${idValidation.errors.join(', ')}`
        };
      }

      // データ取得
      const template = await this.getEffortTemplateFromDatabase(templateId, companyId);
      
      if (!template) {
        console.log(`[EffortTemplateService] 工数テンプレートが見つかりません: ${templateId}`);
        return {
          success: false,
          error: '工数テンプレートが見つかりません'
        };
      }

      // アクセス権限チェック
      const accessCheck = await this.checkEffortTemplateAccessPermission(
        userRole,
        userId,
        template
      );

      if (!accessCheck.hasPermission) {
        console.log(`[EffortTemplateService] アクセス権限不足: ${accessCheck.reason}`);
        return {
          success: false,
          error: `アクセス権限エラー: ${accessCheck.reason}`
        };
      }

      console.log(`[EffortTemplateService] 工数テンプレート詳細取得完了: ${templateId}`);
      return {
        success: true,
        data: template
      };
    } catch (error) {
      console.error('[EffortTemplateService] 工数テンプレート詳細取得エラー:', error);
      return {
        success: false,
        error: `工数テンプレート詳細取得に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * 工数テンプレート更新
   */
  async updateEffortTemplate(
    userId: string,
    userRole: UserRole,
    templateId: string,
    companyId: string,
    updates: UpdateEffortTemplateRequest
  ): Promise<ApiResponse<EffortTemplate>> {
    try {
      console.log(`[EffortTemplateService] 工数テンプレート更新開始: ${templateId}`);

      // 既存テンプレート取得
      const existingTemplate = await this.getEffortTemplateFromDatabase(templateId, companyId);
      if (!existingTemplate) {
        return {
          success: false,
          error: '工数テンプレートが見つかりません'
        };
      }

      // 更新権限チェック
      const permissionCheck = await this.checkEffortTemplateUpdatePermission(
        userRole,
        userId,
        existingTemplate
      );

      if (!permissionCheck.hasPermission) {
        console.log(`[EffortTemplateService] 更新権限不足: ${permissionCheck.reason}`);
        return {
          success: false,
          error: `権限エラー: ${permissionCheck.reason}`
        };
      }

      // 更新実行
      const updatedTemplate = await this.updateEffortTemplateInDatabase(
        templateId,
        companyId,
        updates
      );

      if (!updatedTemplate) {
        return {
          success: false,
          error: '工数テンプレートの更新に失敗しました'
        };
      }

      console.log(`[EffortTemplateService] 工数テンプレート更新完了: ${templateId}`);
      return {
        success: true,
        data: updatedTemplate
      };
    } catch (error) {
      console.error('[EffortTemplateService] 工数テンプレート更新エラー:', error);
      return {
        success: false,
        error: `工数テンプレート更新に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * 工数テンプレート削除
   */
  async deleteEffortTemplate(
    userId: string,
    userRole: UserRole,
    templateId: string,
    companyId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      console.log(`[EffortTemplateService] 工数テンプレート削除開始: ${templateId}`);

      // 既存テンプレート取得
      const existingTemplate = await this.getEffortTemplateFromDatabase(templateId, companyId);
      if (!existingTemplate) {
        return {
          success: false,
          error: '工数テンプレートが見つかりません'
        };
      }

      // 削除権限チェック
      const permissionCheck = await this.checkEffortTemplateDeletePermission(
        userRole,
        userId,
        existingTemplate
      );

      if (!permissionCheck.hasPermission) {
        console.log(`[EffortTemplateService] 削除権限不足: ${permissionCheck.reason}`);
        return {
          success: false,
          error: `権限エラー: ${permissionCheck.reason}`
        };
      }

      // 削除実行
      const deleted = await this.deleteEffortTemplateInDatabase(templateId, companyId);

      if (!deleted) {
        return {
          success: false,
          error: '工数テンプレートの削除に失敗しました'
        };
      }

      console.log(`[EffortTemplateService] 工数テンプレート削除完了: ${templateId}`);
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('[EffortTemplateService] 工数テンプレート削除エラー:', error);
      return {
        success: false,
        error: `工数テンプレート削除に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * 工数テンプレート作成権限チェック
   */
  private async checkEffortTemplateCreatePermission(
    userRole: UserRole,
    scope: WorkflowScope,
    companyId: string,
    userId: string
  ): Promise<{ hasPermission: boolean; reason?: string }> {
    switch (scope) {
      case WorkflowScope.PERSONAL:
        return { hasPermission: true };

      case WorkflowScope.TEAM:
        if ([UserRole.TEAM_LEADER, UserRole.MANAGER, UserRole.COMPANY_LEADER].includes(userRole)) {
          return { hasPermission: true };
        }
        return { 
          hasPermission: false, 
          reason: 'チーム向け工数テンプレートの作成にはチームリーダー以上の権限が必要です' 
        };

      case WorkflowScope.COMPANY:
        if ([UserRole.MANAGER, UserRole.COMPANY_LEADER].includes(userRole)) {
          return { hasPermission: true };
        }
        return { 
          hasPermission: false, 
          reason: '企業向け工数テンプレートの作成にはマネージャー以上の権限が必要です' 
        };

      default:
        return { hasPermission: false, reason: '無効なスコープです' };
    }
  }

  /**
   * 工数テンプレートアクセス権限チェック
   */
  private async checkEffortTemplateAccessPermission(
    userRole: UserRole,
    userId: string,
    template: EffortTemplate
  ): Promise<{ hasPermission: boolean; reason?: string }> {
    // 作成者は常にアクセス可能
    if (template.createdBy === userId) {
      return { hasPermission: true };
    }

    // スコープ別アクセス制御
    switch (template.scope) {
      case WorkflowScope.PERSONAL:
        return { 
          hasPermission: false, 
          reason: '個人工数テンプレートは作成者のみアクセス可能です' 
        };

      case WorkflowScope.TEAM:
      case WorkflowScope.COMPANY:
        return { hasPermission: true };

      default:
        return { hasPermission: false, reason: '無効なスコープです' };
    }
  }

  /**
   * 工数テンプレート更新権限チェック
   */
  private async checkEffortTemplateUpdatePermission(
    userRole: UserRole,
    userId: string,
    template: EffortTemplate
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
          reason: '個人工数テンプレートは作成者のみ更新可能です' 
        };

      case WorkflowScope.TEAM:
        if ([UserRole.TEAM_LEADER, UserRole.MANAGER, UserRole.COMPANY_LEADER].includes(userRole)) {
          return { hasPermission: true };
        }
        return { 
          hasPermission: false, 
          reason: 'チーム向け工数テンプレートの更新にはチームリーダー以上の権限が必要です' 
        };

      case WorkflowScope.COMPANY:
        if ([UserRole.MANAGER, UserRole.COMPANY_LEADER].includes(userRole)) {
          return { hasPermission: true };
        }
        return { 
          hasPermission: false, 
          reason: '企業向け工数テンプレートの更新にはマネージャー以上の権限が必要です' 
        };

      default:
        return { hasPermission: false, reason: '無効なスコープです' };
    }
  }

  /**
   * 工数テンプレート削除権限チェック
   */
  private async checkEffortTemplateDeletePermission(
    userRole: UserRole,
    userId: string,
    template: EffortTemplate
  ): Promise<{ hasPermission: boolean; reason?: string }> {
    return this.checkEffortTemplateUpdatePermission(userRole, userId, template);
  }

  /**
   * 権限に基づいたフィルタリング適用
   */
  private async applyPermissionBasedFiltering(
    userRole: UserRole,
    userId: string,
    companyId: string,
    options: EffortTemplateListOptions
  ): Promise<EffortTemplateListOptions> {
    const filteredOptions = { ...options };

    // 一般ユーザーは自分の個人テンプレートのみ閲覧可能
    if (userRole === UserRole.USER) {
      filteredOptions.createdBy = userId;
      filteredOptions.scope = WorkflowScope.PERSONAL;
    }

    return filteredOptions;
  }

  /**
   * データベースから工数テンプレート作成
   */
  private async createEffortTemplateInDatabase(
    request: CreateEffortTemplateRequest
  ): Promise<EffortTemplate> {
    const client = await this.workflowModel['pool'].connect();
    const templateId = `et_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      const query = `
        INSERT INTO effort_templates (
          id, company_id, name, category, estimated_hours, description,
          template_data, scope, access_control, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *, created_at, updated_at
      `;

      const values = [
        templateId,
        request.companyId,
        request.name,
        request.category,
        request.estimatedHours,
        request.description || '',
        JSON.stringify(request.templateData),
        request.scope,
        JSON.stringify(request.accessControl),
        request.isActive !== false,
        request.createdBy
      ];

      const result = await client.query(query, values);
      const row = result.rows[0];

      const template: EffortTemplate = {
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        category: row.category,
        estimatedHours: parseFloat(row.estimated_hours),
        description: row.description,
        templateData: row.template_data,
        scope: row.scope as WorkflowScope,
        accessControl: row.access_control,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      return template;
    } finally {
      client.release();
    }
  }

  /**
   * データベースから工数テンプレート一覧取得
   */
  private async getEffortTemplatesFromDatabase(
    companyId: string,
    options: EffortTemplateListOptions
  ): Promise<{ templates: EffortTemplate[]; total: number }> {
    const client = await this.workflowModel['pool'].connect();

    try {
      let whereClause = 'WHERE company_id = $1';
      const values: any[] = [companyId];
      let paramCount = 1;

      if (options.category) {
        whereClause += ` AND category = $${++paramCount}`;
        values.push(options.category);
      }

      if (options.scope) {
        whereClause += ` AND scope = $${++paramCount}`;
        values.push(options.scope);
      }

      if (options.createdBy) {
        whereClause += ` AND created_by = $${++paramCount}`;
        values.push(options.createdBy);
      }

      if (options.isActive !== undefined) {
        whereClause += ` AND is_active = $${++paramCount}`;
        values.push(options.isActive);
      }

      // 件数取得
      const countQuery = `SELECT COUNT(*) FROM effort_templates ${whereClause}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // データ取得
      let query = `
        SELECT * FROM effort_templates ${whereClause}
        ORDER BY created_at DESC
      `;

      if (options.limit) {
        const offset = ((options.page || 1) - 1) * options.limit;
        query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
        values.push(options.limit, offset);
      }

      const result = await client.query(query, values);
      
      const templates: EffortTemplate[] = result.rows.map(row => ({
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        category: row.category,
        estimatedHours: parseFloat(row.estimated_hours),
        description: row.description,
        templateData: row.template_data,
        scope: row.scope as WorkflowScope,
        accessControl: row.access_control,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      return { templates, total };
    } finally {
      client.release();
    }
  }

  /**
   * データベースから工数テンプレート詳細取得
   */
  private async getEffortTemplateFromDatabase(
    templateId: string,
    companyId: string
  ): Promise<EffortTemplate | null> {
    const client = await this.workflowModel['pool'].connect();

    try {
      const query = `
        SELECT * FROM effort_templates 
        WHERE id = $1 AND company_id = $2
      `;

      const result = await client.query(query, [templateId, companyId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const template: EffortTemplate = {
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        category: row.category,
        estimatedHours: parseFloat(row.estimated_hours),
        description: row.description,
        templateData: row.template_data,
        scope: row.scope as WorkflowScope,
        accessControl: row.access_control,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      return template;
    } finally {
      client.release();
    }
  }

  /**
   * データベースで工数テンプレート更新
   */
  private async updateEffortTemplateInDatabase(
    templateId: string,
    companyId: string,
    updates: UpdateEffortTemplateRequest
  ): Promise<EffortTemplate | null> {
    const client = await this.workflowModel['pool'].connect();

    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (updates.name !== undefined) {
        updateFields.push(`name = $${++paramCount}`);
        values.push(updates.name);
      }

      if (updates.category !== undefined) {
        updateFields.push(`category = $${++paramCount}`);
        values.push(updates.category);
      }

      if (updates.estimatedHours !== undefined) {
        updateFields.push(`estimated_hours = $${++paramCount}`);
        values.push(updates.estimatedHours);
      }

      if (updates.description !== undefined) {
        updateFields.push(`description = $${++paramCount}`);
        values.push(updates.description);
      }

      if (updates.templateData !== undefined) {
        updateFields.push(`template_data = $${++paramCount}`);
        values.push(JSON.stringify(updates.templateData));
      }

      if (updates.scope !== undefined) {
        updateFields.push(`scope = $${++paramCount}`);
        values.push(updates.scope);
      }

      if (updates.accessControl !== undefined) {
        updateFields.push(`access_control = $${++paramCount}`);
        values.push(JSON.stringify(updates.accessControl));
      }

      if (updates.isActive !== undefined) {
        updateFields.push(`is_active = $${++paramCount}`);
        values.push(updates.isActive);
      }

      if (updateFields.length === 0) {
        throw new Error('更新する項目が指定されていません');
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(templateId, companyId);

      const query = `
        UPDATE effort_templates 
        SET ${updateFields.join(', ')}
        WHERE id = $${++paramCount} AND company_id = $${++paramCount}
        RETURNING *, created_at, updated_at
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const template: EffortTemplate = {
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        category: row.category,
        estimatedHours: parseFloat(row.estimated_hours),
        description: row.description,
        templateData: row.template_data,
        scope: row.scope as WorkflowScope,
        accessControl: row.access_control,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      return template;
    } finally {
      client.release();
    }
  }

  /**
   * データベースから工数テンプレート削除
   */
  private async deleteEffortTemplateInDatabase(
    templateId: string,
    companyId: string
  ): Promise<boolean> {
    const client = await this.workflowModel['pool'].connect();

    try {
      const query = `
        UPDATE effort_templates 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND company_id = $2
      `;

      const result = await client.query(query, [templateId, companyId]);
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * サービス終了処理
   */
  async close(): Promise<void> {
    await this.workflowModel.close();
    console.log('[EffortTemplateService] サービス終了');
  }
}