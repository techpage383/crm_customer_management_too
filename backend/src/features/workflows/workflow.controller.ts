/**
 * ワークフロー管理 - コントローラー層
 * 最強タスク管理ツール
 */

import { Request, Response } from 'express';
import { WorkflowService } from './workflow.service.js';
import { 
  WorkflowType,
  WorkflowScope,
  UserRole,
  User
} from '../../types/index.js';

export class WorkflowController {
  private workflowService: WorkflowService;

  constructor(databaseUrl: string) {
    this.workflowService = new WorkflowService(databaseUrl);
  }

  /**
   * サービス初期化
   */
  async initialize(): Promise<void> {
    await this.workflowService.initialize();
    console.log('[WorkflowController] 初期化完了');
  }

  /**
   * ワークフローテンプレート作成
   * POST /api/workflows/templates
   */
  createWorkflowTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const startTime = Date.now();

      console.log(`[WorkflowController] ワークフローテンプレート作成リクエスト - ユーザー: ${user.id}`);

      const {
        name,
        description,
        type,
        scope,
        workflowData,
        accessControl,
        isActive
      } = req.body;

      const result = await this.workflowService.createWorkflowTemplate(
        user.id,
        user.role,
        {
          companyId: user.companyId,
          name,
          description,
          type: type as WorkflowType,
          scope: scope as WorkflowScope,
          workflowData,
          accessControl,
          isActive,
          createdBy: user.id
        }
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WorkflowController] ワークフローテンプレート作成完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('[WorkflowController] ワークフローテンプレート作成エラー:', error);
      res.status(500).json({
        success: false,
        error: 'ワークフローテンプレート作成中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * ワークフローテンプレート一覧取得
   * GET /api/workflows/templates
   */
  getWorkflowTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const startTime = Date.now();

      console.log(`[WorkflowController] ワークフローテンプレート一覧取得リクエスト - ユーザー: ${user.id}`);

      const {
        scope,
        type,
        createdBy,
        isActive,
        page,
        limit
      } = req.query;

      const options = {
        scope: scope as WorkflowScope,
        type: type as WorkflowType,
        createdBy: createdBy as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const result = await this.workflowService.getWorkflowTemplates(
        user.id,
        user.role,
        user.companyId,
        options
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WorkflowController] ワークフローテンプレート一覧取得完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('[WorkflowController] ワークフローテンプレート一覧取得エラー:', error);
      res.status(500).json({
        success: false,
        error: 'ワークフローテンプレート一覧取得中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * ワークフローテンプレート詳細取得
   * GET /api/workflows/templates/:templateId
   */
  getWorkflowTemplateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const { templateId } = req.params;
      const startTime = Date.now();

      console.log(`[WorkflowController] ワークフローテンプレート詳細取得リクエスト - テンプレート: ${templateId}`);

      const result = await this.workflowService.getWorkflowTemplateById(
        user.id,
        user.role,
        templateId,
        user.companyId
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WorkflowController] ワークフローテンプレート詳細取得完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.includes('見つかりません') ? 404 : 
                          result.error?.includes('権限') ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('[WorkflowController] ワークフローテンプレート詳細取得エラー:', error);
      res.status(500).json({
        success: false,
        error: 'ワークフローテンプレート詳細取得中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * ワークフローテンプレート更新
   * PUT /api/workflows/templates/:templateId
   */
  updateWorkflowTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const { templateId } = req.params;
      const startTime = Date.now();

      console.log(`[WorkflowController] ワークフローテンプレート更新リクエスト - テンプレート: ${templateId}`);

      const {
        name,
        description,
        type,
        scope,
        workflowData,
        accessControl,
        isActive
      } = req.body;

      const updates = {
        name,
        description,
        type: type as WorkflowType,
        scope: scope as WorkflowScope,
        workflowData,
        accessControl,
        isActive
      };

      // undefined値を除去
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      const result = await this.workflowService.updateWorkflowTemplate(
        user.id,
        user.role,
        templateId,
        user.companyId,
        updates
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WorkflowController] ワークフローテンプレート更新完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.includes('見つかりません') ? 404 : 
                          result.error?.includes('権限') ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('[WorkflowController] ワークフローテンプレート更新エラー:', error);
      res.status(500).json({
        success: false,
        error: 'ワークフローテンプレート更新中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * ワークフローテンプレート削除
   * DELETE /api/workflows/templates/:templateId
   */
  deleteWorkflowTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const { templateId } = req.params;
      const startTime = Date.now();

      console.log(`[WorkflowController] ワークフローテンプレート削除リクエスト - テンプレート: ${templateId}`);

      const result = await this.workflowService.deleteWorkflowTemplate(
        user.id,
        user.role,
        templateId,
        user.companyId
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WorkflowController] ワークフローテンプレート削除完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.includes('見つかりません') ? 404 : 
                          result.error?.includes('権限') ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('[WorkflowController] ワークフローテンプレート削除エラー:', error);
      res.status(500).json({
        success: false,
        error: 'ワークフローテンプレート削除中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * ヘルスチェック
   * GET /api/workflows/health
   */
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const startTime = Date.now();
      
      // 基本的な動作確認
      const status = {
        service: 'workflow-management',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      const processingTime = Date.now() - startTime;
      console.log(`[WorkflowController] ヘルスチェック完了 - 処理時間: ${processingTime}ms`);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('[WorkflowController] ヘルスチェックエラー:', error);
      res.status(500).json({
        success: false,
        error: 'ヘルスチェック中にエラーが発生しました'
      });
    }
  };

  /**
   * サービス終了処理
   */
  async close(): Promise<void> {
    await this.workflowService.close();
    console.log('[WorkflowController] コントローラー終了');
  }
}