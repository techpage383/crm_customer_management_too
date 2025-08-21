/**
 * 工数テンプレート管理 - コントローラー層
 * 最強タスク管理ツール
 */

import { Request, Response } from 'express';
import { EffortTemplateService } from './effort-template.service.js';
import { 
  WorkflowScope,
  User
} from '../../types/index.js';

export class EffortTemplateController {
  private effortTemplateService: EffortTemplateService;

  constructor(databaseUrl: string) {
    this.effortTemplateService = new EffortTemplateService(databaseUrl);
  }

  /**
   * 工数テンプレート作成
   * POST /api/workflows/effort-templates
   */
  createEffortTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const startTime = Date.now();

      console.log(`[EffortTemplateController] 工数テンプレート作成リクエスト - ユーザー: ${user.id}`);

      const {
        name,
        category,
        estimatedHours,
        description,
        templateData,
        scope,
        accessControl,
        isActive
      } = req.body;

      const result = await this.effortTemplateService.createEffortTemplate(
        user.id,
        user.role,
        {
          companyId: user.companyId,
          name,
          category,
          estimatedHours: parseFloat(estimatedHours),
          description,
          templateData,
          scope: scope as WorkflowScope,
          accessControl,
          isActive,
          createdBy: user.id
        }
      );

      const processingTime = Date.now() - startTime;
      console.log(`[EffortTemplateController] 工数テンプレート作成完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('[EffortTemplateController] 工数テンプレート作成エラー:', error);
      res.status(500).json({
        success: false,
        error: '工数テンプレート作成中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * 工数テンプレート一覧取得
   * GET /api/workflows/effort-templates
   */
  getEffortTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const startTime = Date.now();

      console.log(`[EffortTemplateController] 工数テンプレート一覧取得リクエスト - ユーザー: ${user.id}`);

      const {
        category,
        scope,
        createdBy,
        isActive,
        page,
        limit
      } = req.query;

      const options = {
        category: category as string,
        scope: scope as WorkflowScope,
        createdBy: createdBy as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const result = await this.effortTemplateService.getEffortTemplates(
        user.id,
        user.role,
        user.companyId,
        options
      );

      const processingTime = Date.now() - startTime;
      console.log(`[EffortTemplateController] 工数テンプレート一覧取得完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('[EffortTemplateController] 工数テンプレート一覧取得エラー:', error);
      res.status(500).json({
        success: false,
        error: '工数テンプレート一覧取得中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * 工数テンプレート詳細取得
   * GET /api/workflows/effort-templates/:templateId
   */
  getEffortTemplateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const { templateId } = req.params;
      const startTime = Date.now();

      console.log(`[EffortTemplateController] 工数テンプレート詳細取得リクエスト - テンプレート: ${templateId}`);

      const result = await this.effortTemplateService.getEffortTemplateById(
        user.id,
        user.role,
        templateId,
        user.companyId
      );

      const processingTime = Date.now() - startTime;
      console.log(`[EffortTemplateController] 工数テンプレート詳細取得完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.includes('見つかりません') ? 404 : 
                          result.error?.includes('権限') ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('[EffortTemplateController] 工数テンプレート詳細取得エラー:', error);
      res.status(500).json({
        success: false,
        error: '工数テンプレート詳細取得中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * 工数テンプレート更新
   * PUT /api/workflows/effort-templates/:templateId
   */
  updateEffortTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const { templateId } = req.params;
      const startTime = Date.now();

      console.log(`[EffortTemplateController] 工数テンプレート更新リクエスト - テンプレート: ${templateId}`);

      const {
        name,
        category,
        estimatedHours,
        description,
        templateData,
        scope,
        accessControl,
        isActive
      } = req.body;

      const updates = {
        name,
        category,
        estimatedHours: estimatedHours !== undefined ? parseFloat(estimatedHours) : undefined,
        description,
        templateData,
        scope: scope as WorkflowScope,
        accessControl,
        isActive
      };

      // undefined値を除去
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      const result = await this.effortTemplateService.updateEffortTemplate(
        user.id,
        user.role,
        templateId,
        user.companyId,
        updates
      );

      const processingTime = Date.now() - startTime;
      console.log(`[EffortTemplateController] 工数テンプレート更新完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.includes('見つかりません') ? 404 : 
                          result.error?.includes('権限') ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('[EffortTemplateController] 工数テンプレート更新エラー:', error);
      res.status(500).json({
        success: false,
        error: '工数テンプレート更新中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * 工数テンプレート削除
   * DELETE /api/workflows/effort-templates/:templateId
   */
  deleteEffortTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const { templateId } = req.params;
      const startTime = Date.now();

      console.log(`[EffortTemplateController] 工数テンプレート削除リクエスト - テンプレート: ${templateId}`);

      const result = await this.effortTemplateService.deleteEffortTemplate(
        user.id,
        user.role,
        templateId,
        user.companyId
      );

      const processingTime = Date.now() - startTime;
      console.log(`[EffortTemplateController] 工数テンプレート削除完了 - 処理時間: ${processingTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.error?.includes('見つかりません') ? 404 : 
                          result.error?.includes('権限') ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('[EffortTemplateController] 工数テンプレート削除エラー:', error);
      res.status(500).json({
        success: false,
        error: '工数テンプレート削除中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * カテゴリ別工数テンプレート統計取得
   * GET /api/workflows/effort-templates/stats
   */
  getEffortTemplateStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as User;
      const startTime = Date.now();

      console.log(`[EffortTemplateController] 工数テンプレート統計取得リクエスト - ユーザー: ${user.id}`);

      // すべての工数テンプレートを取得してカテゴリ別統計を計算
      const result = await this.effortTemplateService.getEffortTemplates(
        user.id,
        user.role,
        user.companyId,
        { isActive: true }
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      // カテゴリ別統計を計算
      const categoryStats = result.data.reduce((stats, template) => {
        const category = template.category;
        if (!stats[category]) {
          stats[category] = {
            category,
            count: 0,
            totalHours: 0,
            averageHours: 0,
            templates: []
          };
        }
        
        stats[category].count++;
        stats[category].totalHours += template.estimatedHours;
        stats[category].templates.push({
          id: template.id,
          name: template.name,
          estimatedHours: template.estimatedHours
        });
        
        return stats;
      }, {});

      // 平均工数を計算
      Object.values(categoryStats).forEach((stat: any) => {
        stat.averageHours = stat.totalHours / stat.count;
      });

      const processingTime = Date.now() - startTime;
      console.log(`[EffortTemplateController] 工数テンプレート統計取得完了 - 処理時間: ${processingTime}ms`);

      res.status(200).json({
        success: true,
        data: {
          totalTemplates: result.data.length,
          categories: Object.values(categoryStats),
          summary: {
            totalCategories: Object.keys(categoryStats).length,
            totalEstimatedHours: result.data.reduce((sum, t) => sum + t.estimatedHours, 0)
          }
        }
      });
    } catch (error) {
      console.error('[EffortTemplateController] 工数テンプレート統計取得エラー:', error);
      res.status(500).json({
        success: false,
        error: '工数テンプレート統計取得中にサーバーエラーが発生しました'
      });
    }
  };

  /**
   * サービス終了処理
   */
  async close(): Promise<void> {
    await this.effortTemplateService.close();
    console.log('[EffortTemplateController] コントローラー終了');
  }
}