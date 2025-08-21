/**
 * TODOコントローラー層
 * HTTP リクエスト・レスポンス制御層
 * ★8 バックエンド実装エージェント担当
 */

import { Request, Response } from 'express';
import { TodoService } from './todo.service.js';
import { TodoStatus, TodoPriority, TodoSource } from '../../types/index.js';

export class TodoController {
  /**
   * TODO作成
   * POST /api/todos
   */
  static async createTodo(req: Request, res: Response): Promise<void> {
    try {
      const result = await TodoService.createTodo(req.body);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('TODO作成コントローラーエラー:', error);
      res.status(500).json({
        success: false,
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }

  /**
   * TODO詳細取得
   * GET /api/todos/:id
   */
  static async getTodoById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await TodoService.getTodoById(id);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.code === 'TODO_NOT_FOUND' ? 404 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('TODO詳細取得コントローラーエラー:', error);
      res.status(500).json({
        success: false,
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }

  /**
   * TODO検索（GET）
   * GET /api/todos
   */
  static async searchTodos(req: Request, res: Response): Promise<void> {
    try {
      // クエリパラメータの型変換
      const params = {
        query: req.query.query as string,
        status: req.query.status ? 
          (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) as TodoStatus[] : undefined,
        priority: req.query.priority ? 
          (Array.isArray(req.query.priority) ? req.query.priority : [req.query.priority]) as TodoPriority[] : undefined,
        assigneeId: req.query.assigneeId as string,
        companyId: req.query.companyId as string,
        isInternal: req.query.isInternal === 'true' ? true : req.query.isInternal === 'false' ? false : undefined,
        isApproved: req.query.isApproved === 'true' ? true : req.query.isApproved === 'false' ? false : undefined,
        dueDateFrom: req.query.dueDateFrom ? new Date(req.query.dueDateFrom as string) : undefined,
        dueDateTo: req.query.dueDateTo ? new Date(req.query.dueDateTo as string) : undefined,
        tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) as string[] : undefined,
        source: req.query.source ? 
          (Array.isArray(req.query.source) ? req.query.source : [req.query.source]) as TodoSource[] : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const result = await TodoService.searchTodos(params);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('TODO検索コントローラーエラー:', error);
      res.status(500).json({
        success: false,
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }

  /**
   * TODO高度検索（POST）
   * POST /api/todos/search
   */
  static async advancedSearchTodos(req: Request, res: Response): Promise<void> {
    try {
      const result = await TodoService.searchTodos(req.body);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('TODO高度検索コントローラーエラー:', error);
      res.status(500).json({
        success: false,
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }

  /**
   * TODO更新
   * PUT /api/todos/:id
   */
  static async updateTodo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await TodoService.updateTodo(id, req.body);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.code === 'TODO_NOT_FOUND' ? 404 : 
                          result.code === 'VALIDATION_ERROR' ? 400 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('TODO更新コントローラーエラー:', error);
      res.status(500).json({
        success: false,
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }

  /**
   * TODO削除
   * DELETE /api/todos/:id
   */
  static async deleteTodo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await TodoService.deleteTodo(id);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.code === 'TODO_NOT_FOUND' ? 404 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('TODO削除コントローラーエラー:', error);
      res.status(500).json({
        success: false,
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }

  /**
   * TODO承認
   * PUT /api/todos/:id/approve
   */
  static async approveTodo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { approverId } = req.body;
      
      // 認証されたユーザーIDを承認者として使用（実装時はreq.user.idを使用）
      const actualApproverId = approverId || (req as any).user?.id;
      
      if (!actualApproverId) {
        res.status(400).json({
          success: false,
          error: '承認者IDが指定されていません',
          code: 'APPROVER_ID_REQUIRED'
        });
        return;
      }

      const result = await TodoService.approveTodo(id, actualApproverId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.code === 'TODO_NOT_FOUND' ? 404 : 
                          result.code === 'ALREADY_APPROVED' ? 409 :
                          result.code === 'VALIDATION_ERROR' ? 400 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('TODO承認コントローラーエラー:', error);
      res.status(500).json({
        success: false,
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }

  /**
   * TODO一括更新
   * PUT /api/todos/bulk
   */
  static async bulkUpdateTodos(req: Request, res: Response): Promise<void> {
    try {
      const result = await TodoService.bulkUpdateTodos(req.body);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error) {
      console.error('TODO一括更新コントローラーエラー:', error);
      res.status(500).json({
        success: false,
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }

  /**
   * TODO統計情報取得
   * GET /api/todos/stats
   */
  static async getTodoStats(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        assigneeId: req.query.assigneeId as string,
        companyId: req.query.companyId as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      };

      const result = await TodoService.getTodoStats(filters);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('TODO統計取得コントローラーエラー:', error);
      res.status(500).json({
        success: false,
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }

  /**
   * 期限切れTODO取得
   * GET /api/todos/overdue
   */
  static async getOverdueTodos(req: Request, res: Response): Promise<void> {
    try {
      const assigneeId = req.query.assigneeId as string;
      const result = await TodoService.getOverdueTodos(assigneeId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('期限切れTODO取得コントローラーエラー:', error);
      res.status(500).json({
        success: false,
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }

  /**
   * 今日期限TODO取得
   * GET /api/todos/today
   */
  static async getTodayDueTodos(req: Request, res: Response): Promise<void> {
    try {
      const assigneeId = req.query.assigneeId as string;
      const result = await TodoService.getTodayDueTodos(assigneeId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('今日期限TODO取得コントローラーエラー:', error);
      res.status(500).json({
        success: false,
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }

  /**
   * 承認待ちTODO取得
   * GET /api/todos/pending-approval
   */
  static async getPendingApprovalTodos(req: Request, res: Response): Promise<void> {
    try {
      const approverId = req.query.approverId as string;
      const result = await TodoService.getPendingApprovalTodos(approverId);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('承認待ちTODO取得コントローラーエラー:', error);
      res.status(500).json({
        success: false,
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }

  /**
   * CSV出力
   * GET /api/todos/export/csv
   */
  static async exportTodosCSV(req: Request, res: Response): Promise<void> {
    try {
      // 検索パラメータの取得（search と同じ形式）
      const params = {
        query: req.query.query as string,
        status: req.query.status ? 
          (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) as TodoStatus[] : undefined,
        priority: req.query.priority ? 
          (Array.isArray(req.query.priority) ? req.query.priority : [req.query.priority]) as TodoPriority[] : undefined,
        assigneeId: req.query.assigneeId as string,
        companyId: req.query.companyId as string,
        isInternal: req.query.isInternal === 'true' ? true : req.query.isInternal === 'false' ? false : undefined,
        isApproved: req.query.isApproved === 'true' ? true : req.query.isApproved === 'false' ? false : undefined,
        dueDateFrom: req.query.dueDateFrom ? new Date(req.query.dueDateFrom as string) : undefined,
        dueDateTo: req.query.dueDateTo ? new Date(req.query.dueDateTo as string) : undefined,
        tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) as string[] : undefined,
        source: req.query.source ? 
          (Array.isArray(req.query.source) ? req.query.source : [req.query.source]) as TodoSource[] : undefined,
        sortBy: req.query.sortBy as string || 'created_at',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        limit: 10000 // CSV出力では大量データを取得
      };

      const result = await TodoService.searchTodos(params);
      
      if (!result.success || !result.data) {
        res.status(500).json({
          success: false,
          error: 'TODO データの取得に失敗しました',
          code: 'EXPORT_FAILED'
        });
        return;
      }

      // CSVヘッダー
      const csvHeaders = [
        'ID',
        'タイトル',
        '説明',
        'ステータス',
        '優先度',
        '期限日',
        '企業名',
        '担当者名',
        'ソース',
        '内部タスク',
        '承認済み',
        '承認者',
        '作成日',
        '更新日',
        'タグ',
        '見積時間',
        '実績時間'
      ];

      // CSVデータの生成
      const csvRows = result.data.todos.map(todo => [
        todo.id,
        `"${todo.title.replace(/"/g, '""')}"`,
        `"${(todo.description || '').replace(/"/g, '""')}"`,
        todo.status,
        todo.priority,
        todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('ja-JP') : '',
        todo.company ? `"${todo.company.name.replace(/"/g, '""')}"` : '',
        todo.primaryAssignee ? `"${todo.primaryAssignee.fullName.replace(/"/g, '""')}"` : '',
        todo.source,
        todo.isInternal ? 'はい' : 'いいえ',
        todo.isApproved ? 'はい' : 'いいえ',
        todo.approver ? `"${todo.approver.fullName.replace(/"/g, '""')}"` : '',
        new Date(todo.createdAt).toLocaleDateString('ja-JP'),
        new Date(todo.updatedAt).toLocaleDateString('ja-JP'),
        todo.tags ? `"${todo.tags.join(', ')}"` : '',
        todo.estimatedHours || '',
        todo.actualHours || ''
      ]);

      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

      // CSV出力用のヘッダー設定
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `todos_${timestamp}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // BOM追加（Excel用）
      res.write('\uFEFF');
      res.write(csvContent);
      res.end();

      console.log(`📊 TODO CSV出力完了: ${result.data.todos.length}件`);
    } catch (error) {
      console.error('TODO CSV出力コントローラーエラー:', error);
      res.status(500).json({
        success: false,
        error: 'システムエラーが発生しました',
        code: 'SYSTEM_ERROR'
      });
    }
  }
}