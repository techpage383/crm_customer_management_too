/**
 * ワークフローテンプレート・設定管理 - データモデル層
 * 最強タスク管理ツール
 */

import { Pool, PoolClient } from 'pg';
import { 
  WorkflowTemplate, 
  WorkflowSettings, 
  EffortTemplate, 
  WorkflowTransition,
  WorkflowType,
  WorkflowScope,
  WorkflowAccessControl,
  ID
} from '../../types/index.js';

interface DatabaseConfig {
  connectionString: string;
}

export class WorkflowModel {
  private pool: Pool;

  constructor(dbConfig: DatabaseConfig) {
    this.pool = new Pool({
      connectionString: dbConfig.connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  /**
   * データベーステーブル作成
   */
  async createWorkflowTables(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // ワークフローテンプレートテーブル
      await client.query(`
        CREATE TABLE IF NOT EXISTS workflow_templates (
          id VARCHAR(255) PRIMARY KEY,
          company_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL CHECK (type IN ('STANDARD', 'APPROVAL', 'CLIENT', 'CUSTOM')),
          scope VARCHAR(50) NOT NULL CHECK (scope IN ('PERSONAL', 'TEAM', 'COMPANY')),
          workflow_data JSONB NOT NULL,
          access_control JSONB NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (company_id),
          INDEX (created_by),
          INDEX (type),
          INDEX (scope)
        )
      `);

      // ワークフロー設定テーブル
      await client.query(`
        CREATE TABLE IF NOT EXISTS workflow_settings (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          company_id VARCHAR(255) NOT NULL,
          default_workflow_id VARCHAR(255),
          personal_workflows JSONB DEFAULT '[]',
          shared_workflows JSONB DEFAULT '[]',
          custom_statuses JSONB DEFAULT '[]',
          effort_templates JSONB DEFAULT '[]',
          privacy_settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, company_id),
          INDEX (user_id),
          INDEX (company_id)
        )
      `);

      // 工数テンプレートテーブル
      await client.query(`
        CREATE TABLE IF NOT EXISTS effort_templates (
          id VARCHAR(255) PRIMARY KEY,
          company_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          estimated_hours DECIMAL(5,2) NOT NULL,
          description TEXT,
          template_data JSONB NOT NULL,
          scope VARCHAR(50) NOT NULL CHECK (scope IN ('PERSONAL', 'TEAM', 'COMPANY')),
          access_control JSONB NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (company_id),
          INDEX (created_by),
          INDEX (category),
          INDEX (scope)
        )
      `);

      // ワークフロー遷移履歴テーブル
      await client.query(`
        CREATE TABLE IF NOT EXISTS workflow_transitions (
          id VARCHAR(255) PRIMARY KEY,
          todo_id VARCHAR(255) NOT NULL,
          workflow_id VARCHAR(255) NOT NULL,
          from_status VARCHAR(100),
          to_status VARCHAR(100) NOT NULL,
          transition_data JSONB,
          performed_by VARCHAR(255) NOT NULL,
          performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (todo_id),
          INDEX (workflow_id),
          INDEX (performed_by),
          INDEX (performed_at)
        )
      `);

      await client.query('COMMIT');
      console.log('[WorkflowModel] ワークフロー管理テーブル作成完了');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[WorkflowModel] テーブル作成エラー:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * ワークフローテンプレート作成
   */
  async createWorkflowTemplate(template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowTemplate> {
    const client = await this.pool.connect();
    const templateId = `wf_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      const query = `
        INSERT INTO workflow_templates (
          id, company_id, name, description, type, scope, 
          workflow_data, access_control, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *, created_at, updated_at
      `;

      const values = [
        templateId,
        template.companyId,
        template.name,
        template.description || '',
        template.type,
        template.scope,
        JSON.stringify(template.workflowData),
        JSON.stringify(template.accessControl),
        template.isActive !== false,
        template.createdBy
      ];

      const result = await client.query(query, values);
      const row = result.rows[0];

      const workflowTemplate: WorkflowTemplate = {
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        description: row.description,
        type: row.type as WorkflowType,
        scope: row.scope as WorkflowScope,
        workflowData: row.workflow_data,
        accessControl: row.access_control,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      console.log(`[WorkflowModel] ワークフローテンプレート作成完了: ${templateId}`);
      return workflowTemplate;
    } catch (error) {
      console.error('[WorkflowModel] ワークフローテンプレート作成エラー:', error);
      throw new Error(`ワークフローテンプレート作成に失敗しました: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * ワークフローテンプレート一覧取得
   */
  async getWorkflowTemplates(
    companyId: string, 
    options: {
      scope?: WorkflowScope;
      type?: WorkflowType;
      createdBy?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ templates: WorkflowTemplate[]; total: number }> {
    const client = await this.pool.connect();

    try {
      let whereClause = 'WHERE company_id = $1';
      const values: any[] = [companyId];
      let paramCount = 1;

      if (options.scope) {
        whereClause += ` AND scope = $${++paramCount}`;
        values.push(options.scope);
      }

      if (options.type) {
        whereClause += ` AND type = $${++paramCount}`;
        values.push(options.type);
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
      const countQuery = `SELECT COUNT(*) FROM workflow_templates ${whereClause}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // データ取得
      let query = `
        SELECT * FROM workflow_templates ${whereClause}
        ORDER BY created_at DESC
      `;

      if (options.limit) {
        const offset = ((options.page || 1) - 1) * options.limit;
        query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
        values.push(options.limit, offset);
      }

      const result = await client.query(query, values);
      
      const templates: WorkflowTemplate[] = result.rows.map(row => ({
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        description: row.description,
        type: row.type as WorkflowType,
        scope: row.scope as WorkflowScope,
        workflowData: row.workflow_data,
        accessControl: row.access_control,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      console.log(`[WorkflowModel] ワークフローテンプレート一覧取得完了: ${templates.length}件`);
      return { templates, total };
    } catch (error) {
      console.error('[WorkflowModel] ワークフローテンプレート一覧取得エラー:', error);
      throw new Error(`ワークフローテンプレート一覧取得に失敗しました: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * ワークフローテンプレート詳細取得
   */
  async getWorkflowTemplateById(templateId: string, companyId: string): Promise<WorkflowTemplate | null> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM workflow_templates 
        WHERE id = $1 AND company_id = $2
      `;

      const result = await client.query(query, [templateId, companyId]);
      
      if (result.rows.length === 0) {
        console.log(`[WorkflowModel] ワークフローテンプレートが見つかりません: ${templateId}`);
        return null;
      }

      const row = result.rows[0];
      const template: WorkflowTemplate = {
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        description: row.description,
        type: row.type as WorkflowType,
        scope: row.scope as WorkflowScope,
        workflowData: row.workflow_data,
        accessControl: row.access_control,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      console.log(`[WorkflowModel] ワークフローテンプレート詳細取得完了: ${templateId}`);
      return template;
    } catch (error) {
      console.error('[WorkflowModel] ワークフローテンプレート詳細取得エラー:', error);
      throw new Error(`ワークフローテンプレート詳細取得に失敗しました: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * ワークフローテンプレート更新
   */
  async updateWorkflowTemplate(
    templateId: string, 
    companyId: string, 
    updates: Partial<Omit<WorkflowTemplate, 'id' | 'companyId' | 'createdBy' | 'createdAt' | 'updatedAt'>>
  ): Promise<WorkflowTemplate | null> {
    const client = await this.pool.connect();

    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (updates.name !== undefined) {
        updateFields.push(`name = $${++paramCount}`);
        values.push(updates.name);
      }

      if (updates.description !== undefined) {
        updateFields.push(`description = $${++paramCount}`);
        values.push(updates.description);
      }

      if (updates.type !== undefined) {
        updateFields.push(`type = $${++paramCount}`);
        values.push(updates.type);
      }

      if (updates.scope !== undefined) {
        updateFields.push(`scope = $${++paramCount}`);
        values.push(updates.scope);
      }

      if (updates.workflowData !== undefined) {
        updateFields.push(`workflow_data = $${++paramCount}`);
        values.push(JSON.stringify(updates.workflowData));
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
        UPDATE workflow_templates 
        SET ${updateFields.join(', ')}
        WHERE id = $${++paramCount} AND company_id = $${++paramCount}
        RETURNING *, created_at, updated_at
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        console.log(`[WorkflowModel] 更新対象のワークフローテンプレートが見つかりません: ${templateId}`);
        return null;
      }

      const row = result.rows[0];
      const template: WorkflowTemplate = {
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        description: row.description,
        type: row.type as WorkflowType,
        scope: row.scope as WorkflowScope,
        workflowData: row.workflow_data,
        accessControl: row.access_control,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      console.log(`[WorkflowModel] ワークフローテンプレート更新完了: ${templateId}`);
      return template;
    } catch (error) {
      console.error('[WorkflowModel] ワークフローテンプレート更新エラー:', error);
      throw new Error(`ワークフローテンプレート更新に失敗しました: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * ワークフローテンプレート削除（ソフトデリート）
   */
  async deleteWorkflowTemplate(templateId: string, companyId: string): Promise<boolean> {
    const client = await this.pool.connect();

    try {
      const query = `
        UPDATE workflow_templates 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND company_id = $2
      `;

      const result = await client.query(query, [templateId, companyId]);
      
      if (result.rowCount === 0) {
        console.log(`[WorkflowModel] 削除対象のワークフローテンプレートが見つかりません: ${templateId}`);
        return false;
      }

      console.log(`[WorkflowModel] ワークフローテンプレート削除完了: ${templateId}`);
      return true;
    } catch (error) {
      console.error('[WorkflowModel] ワークフローテンプレート削除エラー:', error);
      throw new Error(`ワークフローテンプレート削除に失敗しました: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * データベース接続を閉じる
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('[WorkflowModel] データベース接続を閉じました');
  }
}