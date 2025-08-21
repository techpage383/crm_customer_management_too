/**
 * ワークフロー設定管理 - サービス層
 * 最強タスク管理ツール
 */

import { WorkflowModel } from './workflow.model.js';
import { WorkflowValidator } from './workflow.validator.js';
import { 
  WorkflowSettings,
  UserRole,
  ID,
  ApiResponse
} from '../../types/index.js';

interface CreateWorkflowSettingsRequest {
  userId: string;
  companyId: string;
  defaultWorkflowId?: string;
  personalWorkflows?: any[];
  sharedWorkflows?: string[];
  customStatuses?: any[];
  effortTemplates?: any[];
  privacySettings?: any;
}

interface UpdateWorkflowSettingsRequest {
  defaultWorkflowId?: string;
  personalWorkflows?: any[];
  sharedWorkflows?: string[];
  customStatuses?: any[];
  effortTemplates?: any[];
  privacySettings?: any;
}

export class WorkflowSettingsService {
  private workflowModel: WorkflowModel;

  constructor(databaseUrl: string) {
    this.workflowModel = new WorkflowModel({ connectionString: databaseUrl });
  }

  /**
   * ワークフロー設定取得
   */
  async getWorkflowSettings(
    userId: string,
    userRole: UserRole,
    targetUserId: string,
    companyId: string
  ): Promise<ApiResponse<WorkflowSettings>> {
    try {
      console.log(`[WorkflowSettingsService] ワークフロー設定取得開始 - 対象ユーザー: ${targetUserId}`);

      // 権限チェック
      const permissionCheck = await this.checkSettingsAccessPermission(
        userRole,
        userId,
        targetUserId
      );

      if (!permissionCheck.hasPermission) {
        console.log(`[WorkflowSettingsService] アクセス権限不足: ${permissionCheck.reason}`);
        return {
          success: false,
          error: `権限エラー: ${permissionCheck.reason}`
        };
      }

      // データベースから設定取得
      const settings = await this.getSettingsFromDatabase(targetUserId, companyId);

      console.log(`[WorkflowSettingsService] ワークフロー設定取得完了: ${targetUserId}`);
      return {
        success: true,
        data: settings
      };
    } catch (error) {
      console.error('[WorkflowSettingsService] ワークフロー設定取得エラー:', error);
      return {
        success: false,
        error: `ワークフロー設定取得に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * ワークフロー設定更新
   */
  async updateWorkflowSettings(
    userId: string,
    userRole: UserRole,
    targetUserId: string,
    companyId: string,
    updates: UpdateWorkflowSettingsRequest
  ): Promise<ApiResponse<WorkflowSettings>> {
    try {
      console.log(`[WorkflowSettingsService] ワークフロー設定更新開始 - 対象ユーザー: ${targetUserId}`);

      // バリデーション
      const validation = WorkflowValidator.validateWorkflowSettings({
        userId: targetUserId,
        companyId,
        ...updates
      });

      if (!validation.isValid) {
        return {
          success: false,
          error: `入力エラー: ${validation.errors.join(', ')}`
        };
      }

      // 権限チェック
      const permissionCheck = await this.checkSettingsUpdatePermission(
        userRole,
        userId,
        targetUserId
      );

      if (!permissionCheck.hasPermission) {
        console.log(`[WorkflowSettingsService] 更新権限不足: ${permissionCheck.reason}`);
        return {
          success: false,
          error: `権限エラー: ${permissionCheck.reason}`
        };
      }

      // 設定更新
      const updatedSettings = await this.updateSettingsInDatabase(
        targetUserId,
        companyId,
        updates
      );

      console.log(`[WorkflowSettingsService] ワークフロー設定更新完了: ${targetUserId}`);
      return {
        success: true,
        data: updatedSettings
      };
    } catch (error) {
      console.error('[WorkflowSettingsService] ワークフロー設定更新エラー:', error);
      return {
        success: false,
        error: `ワークフロー設定更新に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * 企業向けワークフロー設定取得
   */
  async getCompanyWorkflowSettings(
    userId: string,
    userRole: UserRole,
    companyId: string
  ): Promise<ApiResponse<any>> {
    try {
      console.log(`[WorkflowSettingsService] 企業ワークフロー設定取得開始 - 企業: ${companyId}`);

      // 企業設定アクセス権限チェック
      if (![UserRole.MANAGER, UserRole.COMPANY_LEADER].includes(userRole)) {
        return {
          success: false,
          error: '企業設定の取得にはマネージャー以上の権限が必要です'
        };
      }

      // 企業レベルの設定を取得
      const companySettings = await this.getCompanySettingsFromDatabase(companyId);

      console.log(`[WorkflowSettingsService] 企業ワークフロー設定取得完了: ${companyId}`);
      return {
        success: true,
        data: companySettings
      };
    } catch (error) {
      console.error('[WorkflowSettingsService] 企業ワークフロー設定取得エラー:', error);
      return {
        success: false,
        error: `企業ワークフロー設定取得に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * 企業向けワークフロー設定更新
   */
  async updateCompanyWorkflowSettings(
    userId: string,
    userRole: UserRole,
    companyId: string,
    updates: any
  ): Promise<ApiResponse<any>> {
    try {
      console.log(`[WorkflowSettingsService] 企業ワークフロー設定更新開始 - 企業: ${companyId}`);

      // 企業設定更新権限チェック
      if (![UserRole.MANAGER, UserRole.COMPANY_LEADER].includes(userRole)) {
        return {
          success: false,
          error: '企業設定の更新にはマネージャー以上の権限が必要です'
        };
      }

      // 企業レベルの設定を更新
      const updatedSettings = await this.updateCompanySettingsInDatabase(companyId, updates);

      console.log(`[WorkflowSettingsService] 企業ワークフロー設定更新完了: ${companyId}`);
      return {
        success: true,
        data: updatedSettings
      };
    } catch (error) {
      console.error('[WorkflowSettingsService] 企業ワークフロー設定更新エラー:', error);
      return {
        success: false,
        error: `企業ワークフロー設定更新に失敗しました: ${error.message}`
      };
    }
  }

  /**
   * 設定アクセス権限チェック
   */
  private async checkSettingsAccessPermission(
    userRole: UserRole,
    userId: string,
    targetUserId: string
  ): Promise<{ hasPermission: boolean; reason?: string }> {
    // 自分の設定は常にアクセス可能
    if (userId === targetUserId) {
      return { hasPermission: true };
    }

    // 上位権限者は他のユーザーの設定にアクセス可能
    if ([UserRole.TEAM_LEADER, UserRole.MANAGER, UserRole.COMPANY_LEADER].includes(userRole)) {
      return { hasPermission: true };
    }

    return { 
      hasPermission: false, 
      reason: '他のユーザーのワークフロー設定にアクセスする権限がありません' 
    };
  }

  /**
   * 設定更新権限チェック
   */
  private async checkSettingsUpdatePermission(
    userRole: UserRole,
    userId: string,
    targetUserId: string
  ): Promise<{ hasPermission: boolean; reason?: string }> {
    // 自分の設定は常に更新可能
    if (userId === targetUserId) {
      return { hasPermission: true };
    }

    // 上位権限者は他のユーザーの設定を更新可能
    if ([UserRole.TEAM_LEADER, UserRole.MANAGER, UserRole.COMPANY_LEADER].includes(userRole)) {
      return { hasPermission: true };
    }

    return { 
      hasPermission: false, 
      reason: '他のユーザーのワークフロー設定を更新する権限がありません' 
    };
  }

  /**
   * データベースから設定取得
   */
  private async getSettingsFromDatabase(userId: string, companyId: string): Promise<WorkflowSettings> {
    const client = await this.workflowModel['pool'].connect();

    try {
      const query = `
        SELECT * FROM workflow_settings 
        WHERE user_id = $1 AND company_id = $2
      `;

      const result = await client.query(query, [userId, companyId]);

      if (result.rows.length === 0) {
        // 設定が存在しない場合はデフォルト設定を作成
        return await this.createDefaultSettings(userId, companyId);
      }

      const row = result.rows[0];
      const settings: WorkflowSettings = {
        id: row.id,
        userId: row.user_id,
        companyId: row.company_id,
        defaultWorkflowId: row.default_workflow_id,
        personalWorkflows: row.personal_workflows || [],
        sharedWorkflows: row.shared_workflows || [],
        customStatuses: row.custom_statuses || [],
        effortTemplates: row.effort_templates || [],
        privacySettings: row.privacy_settings || {
          sharePersonalTemplates: false,
          allowWorkflowSuggestions: true,
          visibleToTeam: false
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      return settings;
    } finally {
      client.release();
    }
  }

  /**
   * データベースで設定更新
   */
  private async updateSettingsInDatabase(
    userId: string,
    companyId: string,
    updates: UpdateWorkflowSettingsRequest
  ): Promise<WorkflowSettings> {
    const client = await this.workflowModel['pool'].connect();

    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (updates.defaultWorkflowId !== undefined) {
        updateFields.push(`default_workflow_id = $${++paramCount}`);
        values.push(updates.defaultWorkflowId);
      }

      if (updates.personalWorkflows !== undefined) {
        updateFields.push(`personal_workflows = $${++paramCount}`);
        values.push(JSON.stringify(updates.personalWorkflows));
      }

      if (updates.sharedWorkflows !== undefined) {
        updateFields.push(`shared_workflows = $${++paramCount}`);
        values.push(JSON.stringify(updates.sharedWorkflows));
      }

      if (updates.customStatuses !== undefined) {
        updateFields.push(`custom_statuses = $${++paramCount}`);
        values.push(JSON.stringify(updates.customStatuses));
      }

      if (updates.effortTemplates !== undefined) {
        updateFields.push(`effort_templates = $${++paramCount}`);
        values.push(JSON.stringify(updates.effortTemplates));
      }

      if (updates.privacySettings !== undefined) {
        updateFields.push(`privacy_settings = $${++paramCount}`);
        values.push(JSON.stringify(updates.privacySettings));
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId, companyId);

      const query = `
        UPDATE workflow_settings 
        SET ${updateFields.join(', ')}
        WHERE user_id = $${++paramCount} AND company_id = $${++paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('設定の更新に失敗しました');
      }

      const row = result.rows[0];
      const settings: WorkflowSettings = {
        id: row.id,
        userId: row.user_id,
        companyId: row.company_id,
        defaultWorkflowId: row.default_workflow_id,
        personalWorkflows: row.personal_workflows || [],
        sharedWorkflows: row.shared_workflows || [],
        customStatuses: row.custom_statuses || [],
        effortTemplates: row.effort_templates || [],
        privacySettings: row.privacy_settings || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      return settings;
    } finally {
      client.release();
    }
  }

  /**
   * デフォルト設定作成
   */
  private async createDefaultSettings(userId: string, companyId: string): Promise<WorkflowSettings> {
    const client = await this.workflowModel['pool'].connect();
    const settingsId = `ws_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      const query = `
        INSERT INTO workflow_settings (
          id, user_id, company_id, personal_workflows, shared_workflows, 
          custom_statuses, effort_templates, privacy_settings
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const defaultPrivacySettings = {
        sharePersonalTemplates: false,
        allowWorkflowSuggestions: true,
        visibleToTeam: false
      };

      const values = [
        settingsId,
        userId,
        companyId,
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify(defaultPrivacySettings)
      ];

      const result = await client.query(query, values);
      const row = result.rows[0];

      const settings: WorkflowSettings = {
        id: row.id,
        userId: row.user_id,
        companyId: row.company_id,
        defaultWorkflowId: row.default_workflow_id,
        personalWorkflows: [],
        sharedWorkflows: [],
        customStatuses: [],
        effortTemplates: [],
        privacySettings: defaultPrivacySettings,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      console.log(`[WorkflowSettingsService] デフォルト設定作成完了: ${settingsId}`);
      return settings;
    } finally {
      client.release();
    }
  }

  /**
   * 企業設定取得（プレースホルダー実装）
   */
  private async getCompanySettingsFromDatabase(companyId: string): Promise<any> {
    // TODO: 企業レベル設定のデータベース実装
    return {
      companyId,
      defaultWorkflowTemplates: [],
      sharedTemplates: [],
      companyPolicies: {},
      lastUpdated: new Date()
    };
  }

  /**
   * 企業設定更新（プレースホルダー実装）
   */
  private async updateCompanySettingsInDatabase(companyId: string, updates: any): Promise<any> {
    // TODO: 企業レベル設定の更新実装
    return {
      companyId,
      ...updates,
      lastUpdated: new Date()
    };
  }

  /**
   * サービス終了処理
   */
  async close(): Promise<void> {
    await this.workflowModel.close();
    console.log('[WorkflowSettingsService] サービス終了');
  }
}