/**
 * ワークフロー設定管理 - コントローラー層
 * 最強タスク管理ツール
 */

import { Request, Response } from 'express';
import { WorkflowSettingsService } from './workflow-settings.service.js';
import { User } from '../../types/index.js';

export class WorkflowSettingsController {
  private workflowSettingsService: WorkflowSettingsService;

  constructor(databaseUrl: string) {
    this.workflowSettingsService = new WorkflowSettingsService(databaseUrl);
  }

  /**
   * ワークフロー設定取得
   * GET /api/workflows/settings
   */
  getWorkflowSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const startTime = Date.now();

      console.log(`[WorkflowSettingsController] ワークフロー設定取得リクエスト - ユーザー: ${user.id}`);

      const result = await this.workflowSettingsService.getWorkflowSettings(
        user.id,
        user.role,
        user.id, // 自分の設定を取得
        user.companyId
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WorkflowSettingsController] ワークフロー設定取得完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.includes('権限') ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('[WorkflowSettingsController] ワークフロー設定取得エラー:', error);
      res.status(500).json({
        success: false,
        error: 'ワークフロー設定取得中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * ワークフロー設定更新
   * PUT /api/workflows/settings
   */
  updateWorkflowSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const startTime = Date.now();

      console.log(`[WorkflowSettingsController] ワークフロー設定更新リクエスト - ユーザー: ${user.id}`);

      const {
        defaultWorkflowId,
        personalWorkflows,
        sharedWorkflows,
        customStatuses,
        effortTemplates,
        privacySettings
      } = req.body;

      const updates = {
        defaultWorkflowId,
        personalWorkflows,
        sharedWorkflows,
        customStatuses,
        effortTemplates,
        privacySettings
      };

      // undefined値を除去
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      const result = await this.workflowSettingsService.updateWorkflowSettings(
        user.id,
        user.role,
        user.id, // 自分の設定を更新
        user.companyId,
        updates
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WorkflowSettingsController] ワークフロー設定更新完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.includes('権限') ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('[WorkflowSettingsController] ワークフロー設定更新エラー:', error);
      res.status(500).json({
        success: false,
        error: 'ワークフロー設定更新中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * 特定ユーザーのワークフロー設定取得
   * GET /api/workflows/settings/user/:userId
   */
  getUserWorkflowSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const { userId } = req.params;
      const startTime = Date.now();

      console.log(`[WorkflowSettingsController] ユーザー設定取得リクエスト - 対象: ${userId}`);

      const result = await this.workflowSettingsService.getWorkflowSettings(
        user.id,
        user.role,
        userId,
        user.companyId
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WorkflowSettingsController] ユーザー設定取得完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.includes('権限') ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('[WorkflowSettingsController] ユーザー設定取得エラー:', error);
      res.status(500).json({
        success: false,
        error: 'ユーザー設定取得中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * 特定ユーザーのワークフロー設定更新
   * PUT /api/workflows/settings/user/:userId
   */
  updateUserWorkflowSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const { userId } = req.params;
      const startTime = Date.now();

      console.log(`[WorkflowSettingsController] ユーザー設定更新リクエスト - 対象: ${userId}`);

      const {
        defaultWorkflowId,
        personalWorkflows,
        sharedWorkflows,
        customStatuses,
        effortTemplates,
        privacySettings
      } = req.body;

      const updates = {
        defaultWorkflowId,
        personalWorkflows,
        sharedWorkflows,
        customStatuses,
        effortTemplates,
        privacySettings
      };

      // undefined値を除去
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      const result = await this.workflowSettingsService.updateWorkflowSettings(
        user.id,
        user.role,
        userId,
        user.companyId,
        updates
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WorkflowSettingsController] ユーザー設定更新完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.includes('権限') ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('[WorkflowSettingsController] ユーザー設定更新エラー:', error);
      res.status(500).json({
        success: false,
        error: 'ユーザー設定更新中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * 企業ワークフロー設定取得
   * GET /api/workflows/settings/company/:companyId
   */
  getCompanyWorkflowSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const { companyId } = req.params;
      const startTime = Date.now();

      console.log(`[WorkflowSettingsController] 企業設定取得リクエスト - 企業: ${companyId}`);

      // 自分の企業以外の設定にはアクセス不可
      if (user.companyId !== companyId) {
        res.status(403).json({
          success: false,
          error: '他の企業の設定にはアクセスできません'
        });
        return;
      }

      const result = await this.workflowSettingsService.getCompanyWorkflowSettings(
        user.id,
        user.role,
        companyId
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WorkflowSettingsController] 企業設定取得完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.includes('権限') ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('[WorkflowSettingsController] 企業設定取得エラー:', error);
      res.status(500).json({
        success: false,
        error: '企業設定取得中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * 企業ワークフロー設定更新
   * PUT /api/workflows/settings/company/:companyId
   */
  updateCompanyWorkflowSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const { companyId } = req.params;
      const startTime = Date.now();

      console.log(`[WorkflowSettingsController] 企業設定更新リクエスト - 企業: ${companyId}`);

      // 自分の企業以外の設定は更新不可
      if (user.companyId !== companyId) {
        res.status(403).json({
          success: false,
          error: '他の企業の設定は更新できません'
        });
        return;
      }

      const result = await this.workflowSettingsService.updateCompanyWorkflowSettings(
        user.id,
        user.role,
        companyId,
        req.body
      );

      const processingTime = Date.now() - startTime;
      console.log(`[WorkflowSettingsController] 企業設定更新完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.includes('権限') ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('[WorkflowSettingsController] 企業設定更新エラー:', error);
      res.status(500).json({
        success: false,
        error: '企業設定更新中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * サービス終了処理
   */
  async close(): Promise<void> {
    await this.workflowSettingsService.close();
    console.log('[WorkflowSettingsController] コントローラー終了');
  }
}