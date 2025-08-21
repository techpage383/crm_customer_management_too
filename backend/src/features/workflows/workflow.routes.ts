/**
 * ワークフロー管理 - ルート定義
 * 最強タスク管理ツール
 */

import { Router } from 'express';
import { WorkflowController } from './workflow.controller.js';
import { WorkflowSettingsController } from './workflow-settings.controller.js';
import { EffortTemplateController } from './effort-template.controller.js';
import { authenticateToken } from '../auth/auth.middleware.js';

export function createWorkflowRoutes(databaseUrl: string): Router {
  const router = Router();
  const workflowController = new WorkflowController(databaseUrl);
  const workflowSettingsController = new WorkflowSettingsController(databaseUrl);
  const effortTemplateController = new EffortTemplateController(databaseUrl);

  // 初期化
  workflowController.initialize().catch(error => {
    console.error('[WorkflowRoutes] 初期化エラー:', error);
  });

  // ヘルスチェック（認証不要）
  router.get('/health', workflowController.healthCheck);

  // 以下のエンドポイントには認証が必要
  router.use(authenticateToken);

  /**
   * ワークフローテンプレート管理
   */
  
  // ワークフローテンプレート一覧取得
  // GET /api/workflows/templates
  router.get('/templates', workflowController.getWorkflowTemplates);

  // ワークフローテンプレート作成
  // POST /api/workflows/templates
  router.post('/templates', workflowController.createWorkflowTemplate);

  // ワークフローテンプレート詳細取得
  // GET /api/workflows/templates/:templateId
  router.get('/templates/:templateId', workflowController.getWorkflowTemplateById);

  // ワークフローテンプレート更新
  // PUT /api/workflows/templates/:templateId
  router.put('/templates/:templateId', workflowController.updateWorkflowTemplate);

  // ワークフローテンプレート削除
  // DELETE /api/workflows/templates/:templateId
  router.delete('/templates/:templateId', workflowController.deleteWorkflowTemplate);

  /**
   * ワークフロー設定管理
   */
  
  // 自分のワークフロー設定取得
  // GET /api/workflows/settings
  router.get('/settings', workflowSettingsController.getWorkflowSettings);

  // 自分のワークフロー設定更新
  // PUT /api/workflows/settings
  router.put('/settings', workflowSettingsController.updateWorkflowSettings);

  // 特定ユーザーのワークフロー設定取得
  // GET /api/workflows/settings/user/:userId
  router.get('/settings/user/:userId', workflowSettingsController.getUserWorkflowSettings);

  // 特定ユーザーのワークフロー設定更新
  // PUT /api/workflows/settings/user/:userId
  router.put('/settings/user/:userId', workflowSettingsController.updateUserWorkflowSettings);

  // 企業ワークフロー設定取得
  // GET /api/workflows/settings/company/:companyId
  router.get('/settings/company/:companyId', workflowSettingsController.getCompanyWorkflowSettings);

  // 企業ワークフロー設定更新
  // PUT /api/workflows/settings/company/:companyId
  router.put('/settings/company/:companyId', workflowSettingsController.updateCompanyWorkflowSettings);

  /**
   * 工数テンプレート管理
   */
  
  // 工数テンプレート一覧取得
  // GET /api/workflows/effort-templates
  router.get('/effort-templates', effortTemplateController.getEffortTemplates);

  // 工数テンプレート作成
  // POST /api/workflows/effort-templates
  router.post('/effort-templates', effortTemplateController.createEffortTemplate);

  // 工数テンプレート統計取得
  // GET /api/workflows/effort-templates/stats
  router.get('/effort-templates/stats', effortTemplateController.getEffortTemplateStats);

  // 工数テンプレート詳細取得
  // GET /api/workflows/effort-templates/:templateId
  router.get('/effort-templates/:templateId', effortTemplateController.getEffortTemplateById);

  // 工数テンプレート更新
  // PUT /api/workflows/effort-templates/:templateId
  router.put('/effort-templates/:templateId', effortTemplateController.updateEffortTemplate);

  // 工数テンプレート削除
  // DELETE /api/workflows/effort-templates/:templateId
  router.delete('/effort-templates/:templateId', effortTemplateController.deleteEffortTemplate);

  console.log('[WorkflowRoutes] ワークフロー管理ルート設定完了');
  return router;
}