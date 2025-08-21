/**
 * TODOサービス層
 * ビジネスロジック層 - 実データベース直接操作
 * ★8 バックエンド実装エージェント担当
 */

import { TodoModel } from './todo.model.js';
import { TodoValidator, ValidationResult, createValidationErrorResponse } from './todo.validator.js';
import { Todo, TodoCreate, TodoUpdate, TodoStatus, TodoPriority, TodoSource } from '../../types/index.js';

export class TodoService {
  /**
   * TODO作成
   */
  static async createTodo(data: TodoCreate): Promise<{ success: boolean; data?: Todo; error?: string; code?: string; details?: any }> {
    try {
      // バリデーション
      const validation = TodoValidator.validateTodoCreate(data);
      if (!validation.isValid) {
        return createValidationErrorResponse(validation);
      }

      // 担当者の存在確認（必要に応じて実装）
      // const assigneeExists = await UserModel.findById(data.primaryAssigneeId);
      // if (!assigneeExists) {
      //   return { success: false, error: '指定された担当者が見つかりません', code: 'ASSIGNEE_NOT_FOUND' };
      // }

      // 企業の存在確認（指定されている場合）
      if (data.companyId) {
        // const companyExists = await CompanyModel.findById(data.companyId);
        // if (!companyExists) {
        //   return { success: false, error: '指定された企業が見つかりません', code: 'COMPANY_NOT_FOUND' };
        // }
      }

      // 内部タスクの場合のデフォルト設定
      if (data.isInternal && data.isApproved === undefined) {
        data.isApproved = false; // 内部タスクは承認が必要
      }

      const todo = await TodoModel.create(data);
      
      console.log(`✅ TODO作成成功: ${todo.id} - ${todo.title}`);
      return { success: true, data: todo };
    } catch (error) {
      console.error('TODO作成エラー:', error);
      return { 
        success: false, 
        error: 'TODO作成に失敗しました', 
        code: 'CREATE_TODO_FAILED' 
      };
    }
  }

  /**
   * TODO取得（ID指定）
   */
  static async getTodoById(id: string): Promise<{ success: boolean; data?: Todo; error?: string; code?: string }> {
    try {
      if (!id || typeof id !== 'string') {
        return { success: false, error: 'TODO IDが無効です', code: 'INVALID_TODO_ID' };
      }

      const todo = await TodoModel.findById(id);
      if (!todo) {
        return { success: false, error: 'TODOが見つかりません', code: 'TODO_NOT_FOUND' };
      }

      return { success: true, data: todo };
    } catch (error) {
      console.error('TODO取得エラー:', error);
      return { 
        success: false, 
        error: 'TODO取得に失敗しました', 
        code: 'GET_TODO_FAILED' 
      };
    }
  }

  /**
   * TODO検索
   */
  static async searchTodos(params: {
    query?: string;
    status?: TodoStatus | TodoStatus[];
    priority?: TodoPriority | TodoPriority[];
    assigneeId?: string;
    companyId?: string;
    isInternal?: boolean;
    isApproved?: boolean;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    tags?: string[];
    source?: TodoSource | TodoSource[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ success: boolean; data?: { todos: Todo[]; total: number; page: number; limit: number; totalPages: number }; error?: string; code?: string; details?: any }> {
    try {
      // バリデーション
      const validation = TodoValidator.validateTodoSearch(params);
      if (!validation.isValid) {
        return createValidationErrorResponse(validation);
      }

      const page = params.page || 1;
      const limit = params.limit || 20;

      const result = await TodoModel.search(params);
      const totalPages = Math.ceil(result.total / limit);

      console.log(`🔍 TODO検索実行: ${result.todos.length}件取得 (総件数: ${result.total})`);
      
      return { 
        success: true, 
        data: {
          todos: result.todos,
          total: result.total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('TODO検索エラー:', error);
      return { 
        success: false, 
        error: 'TODO検索に失敗しました', 
        code: 'SEARCH_TODOS_FAILED' 
      };
    }
  }

  /**
   * TODO更新
   */
  static async updateTodo(id: string, data: TodoUpdate): Promise<{ success: boolean; data?: Todo; error?: string; code?: string; details?: any }> {
    try {
      // バリデーション
      const validation = TodoValidator.validateTodoUpdate(data);
      if (!validation.isValid) {
        return createValidationErrorResponse(validation);
      }

      // 既存TODOの確認
      const existingTodo = await TodoModel.findById(id);
      if (!existingTodo) {
        return { success: false, error: 'TODOが見つかりません', code: 'TODO_NOT_FOUND' };
      }

      // ステータス変更の特別処理
      if (data.status === TodoStatus.COMPLETED && !data.completedAt) {
        data.completedAt = new Date();
      }

      // 承認処理の特別処理
      if (data.isApproved === true && !data.approvedBy) {
        return { 
          success: false, 
          error: '承認時は承認者IDが必要です', 
          code: 'APPROVER_REQUIRED' 
        };
      }

      const updatedTodo = await TodoModel.update(id, data);
      if (!updatedTodo) {
        return { success: false, error: 'TODO更新に失敗しました', code: 'UPDATE_TODO_FAILED' };
      }

      console.log(`✅ TODO更新成功: ${updatedTodo.id} - ${updatedTodo.title}`);
      return { success: true, data: updatedTodo };
    } catch (error) {
      console.error('TODO更新エラー:', error);
      return { 
        success: false, 
        error: 'TODO更新に失敗しました', 
        code: 'UPDATE_TODO_FAILED' 
      };
    }
  }

  /**
   * TODO削除
   */
  static async deleteTodo(id: string): Promise<{ success: boolean; message?: string; error?: string; code?: string }> {
    try {
      if (!id || typeof id !== 'string') {
        return { success: false, error: 'TODO IDが無効です', code: 'INVALID_TODO_ID' };
      }

      // 既存TODOの確認
      const existingTodo = await TodoModel.findById(id);
      if (!existingTodo) {
        return { success: false, error: 'TODOが見つかりません', code: 'TODO_NOT_FOUND' };
      }

      const deleted = await TodoModel.delete(id);
      if (!deleted) {
        return { success: false, error: 'TODO削除に失敗しました', code: 'DELETE_TODO_FAILED' };
      }

      console.log(`🗑️ TODO削除成功: ${id} - ${existingTodo.title}`);
      return { success: true, message: 'TODOを削除しました' };
    } catch (error) {
      console.error('TODO削除エラー:', error);
      return { 
        success: false, 
        error: 'TODO削除に失敗しました', 
        code: 'DELETE_TODO_FAILED' 
      };
    }
  }

  /**
   * TODO承認
   */
  static async approveTodo(id: string, approverId: string): Promise<{ success: boolean; data?: Todo; message?: string; error?: string; code?: string; details?: any }> {
    try {
      // バリデーション
      const validation = TodoValidator.validateTodoApproval(approverId);
      if (!validation.isValid) {
        return createValidationErrorResponse(validation);
      }

      // 既存TODOの確認
      const existingTodo = await TodoModel.findById(id);
      if (!existingTodo) {
        return { success: false, error: 'TODOが見つかりません', code: 'TODO_NOT_FOUND' };
      }

      // 既に承認済みの場合
      if (existingTodo.isApproved) {
        return { 
          success: false, 
          error: 'このTODOは既に承認済みです', 
          code: 'ALREADY_APPROVED' 
        };
      }

      const approvedTodo = await TodoModel.approve(id, approverId);
      if (!approvedTodo) {
        return { success: false, error: 'TODO承認に失敗しました', code: 'APPROVE_TODO_FAILED' };
      }

      console.log(`✅ TODO承認成功: ${approvedTodo.id} - ${approvedTodo.title} (承認者: ${approverId})`);
      return { 
        success: true, 
        data: approvedTodo,
        message: 'TODOを承認しました'
      };
    } catch (error) {
      console.error('TODO承認エラー:', error);
      return { 
        success: false, 
        error: 'TODO承認に失敗しました', 
        code: 'APPROVE_TODO_FAILED' 
      };
    }
  }

  /**
   * 一括TODO更新
   */
  static async bulkUpdateTodos(data: { todoIds: string[]; updates: TodoUpdate }): Promise<{ success: boolean; data?: { updated: number; failed: number }; error?: string; code?: string; details?: any }> {
    try {
      // バリデーション
      const validation = TodoValidator.validateBulkUpdate(data);
      if (!validation.isValid) {
        return createValidationErrorResponse(validation);
      }

      let updated = 0;
      let failed = 0;

      for (const todoId of data.todoIds) {
        try {
          const result = await this.updateTodo(todoId, data.updates);
          if (result.success) {
            updated++;
          } else {
            failed++;
            console.warn(`TODO一括更新失敗: ${todoId} - ${result.error}`);
          }
        } catch (error) {
          failed++;
          console.error(`TODO一括更新エラー: ${todoId}`, error);
        }
      }

      console.log(`📝 TODO一括更新完了: 成功${updated}件, 失敗${failed}件`);
      return { 
        success: true, 
        data: { updated, failed }
      };
    } catch (error) {
      console.error('TODO一括更新エラー:', error);
      return { 
        success: false, 
        error: 'TODO一括更新に失敗しました', 
        code: 'BULK_UPDATE_TODOS_FAILED' 
      };
    }
  }

  /**
   * TODO統計情報取得
   */
  static async getTodoStats(filters?: {
    assigneeId?: string;
    companyId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ success: boolean; data?: any; error?: string; code?: string }> {
    try {
      // 基本統計
      const stats = await TodoModel.getStats(filters);

      // 追加統計の計算
      const additionalStats = {
        completionRate: stats.totalCount > 0 
          ? Math.round((stats.statusBreakdown.find(s => s.status === 'completed')?.count || 0) / stats.totalCount * 100)
          : 0,
        activeTasksCount: stats.statusBreakdown
          .filter(s => ['pending', 'in_progress'].includes(s.status))
          .reduce((sum, s) => sum + s.count, 0),
        urgentTasksCount: stats.priorityBreakdown.find(p => p.priority === 'high')?.count || 0,
        internalTasksRatio: stats.totalCount > 0
          ? Math.round((stats.sourceBreakdown
              .filter(s => ['email_forwarded', 'internal_request'].includes(s.source))
              .reduce((sum, s) => sum + s.count, 0) / stats.totalCount) * 100)
          : 0
      };

      const result = {
        ...stats,
        ...additionalStats,
        summary: {
          total: stats.totalCount,
          active: additionalStats.activeTasksCount,
          overdue: stats.overdueTodos,
          completed: stats.statusBreakdown.find(s => s.status === 'completed')?.count || 0,
          completionRate: additionalStats.completionRate + '%',
          avgCompletionDays: stats.averageCompletionTime
        }
      };

      console.log(`📊 TODO統計取得完了: 総数${stats.totalCount}件`);
      return { success: true, data: result };
    } catch (error) {
      console.error('TODO統計取得エラー:', error);
      return { 
        success: false, 
        error: 'TODO統計取得に失敗しました', 
        code: 'GET_TODO_STATS_FAILED' 
      };
    }
  }

  /**
   * 期限切れTODO取得
   */
  static async getOverdueTodos(assigneeId?: string): Promise<{ success: boolean; data?: Todo[]; error?: string; code?: string }> {
    try {
      const searchParams = {
        dueDateTo: new Date(),
        status: [TodoStatus.PENDING, TodoStatus.IN_PROGRESS],
        assigneeId,
        sortBy: 'due_date',
        sortOrder: 'asc' as 'asc',
        limit: 100
      };

      const result = await this.searchTodos(searchParams);
      if (!result.success || !result.data) {
        return { success: false, error: '期限切れTODO取得に失敗しました', code: 'GET_OVERDUE_TODOS_FAILED' };
      }

      console.log(`⏰ 期限切れTODO取得: ${result.data.todos.length}件`);
      return { success: true, data: result.data.todos };
    } catch (error) {
      console.error('期限切れTODO取得エラー:', error);
      return { 
        success: false, 
        error: '期限切れTODO取得に失敗しました', 
        code: 'GET_OVERDUE_TODOS_FAILED' 
      };
    }
  }

  /**
   * 今日期限のTODO取得
   */
  static async getTodayDueTodos(assigneeId?: string): Promise<{ success: boolean; data?: Todo[]; error?: string; code?: string }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const searchParams = {
        dueDateFrom: today,
        dueDateTo: tomorrow,
        status: [TodoStatus.PENDING, TodoStatus.IN_PROGRESS],
        assigneeId,
        sortBy: 'priority',
        sortOrder: 'desc' as 'desc',
        limit: 100
      };

      const result = await this.searchTodos(searchParams);
      if (!result.success || !result.data) {
        return { success: false, error: '今日期限TODO取得に失敗しました', code: 'GET_TODAY_DUE_TODOS_FAILED' };
      }

      console.log(`📅 今日期限TODO取得: ${result.data.todos.length}件`);
      return { success: true, data: result.data.todos };
    } catch (error) {
      console.error('今日期限TODO取得エラー:', error);
      return { 
        success: false, 
        error: '今日期限TODO取得に失敗しました', 
        code: 'GET_TODAY_DUE_TODOS_FAILED' 
      };
    }
  }

  /**
   * 承認待ちTODO取得
   */
  static async getPendingApprovalTodos(approverId?: string): Promise<{ success: boolean; data?: Todo[]; error?: string; code?: string }> {
    try {
      const searchParams = {
        isInternal: true,
        isApproved: false,
        status: [TodoStatus.PENDING, TodoStatus.IN_PROGRESS],
        sortBy: 'created_at',
        sortOrder: 'desc' as 'desc',
        limit: 100
      };

      const result = await this.searchTodos(searchParams);
      if (!result.success || !result.data) {
        return { success: false, error: '承認待ちTODO取得に失敗しました', code: 'GET_PENDING_APPROVAL_TODOS_FAILED' };
      }

      console.log(`📋 承認待ちTODO取得: ${result.data.todos.length}件`);
      return { success: true, data: result.data.todos };
    } catch (error) {
      console.error('承認待ちTODO取得エラー:', error);
      return { 
        success: false, 
        error: '承認待ちTODO取得に失敗しました', 
        code: 'GET_PENDING_APPROVAL_TODOS_FAILED' 
      };
    }
  }
}