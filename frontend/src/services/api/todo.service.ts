/**
 * TODO管理API統合サービス
 * P-005 TODO管理機能の実API統合
 */

import { apiClient } from './client';
import { 
  ApiResponse, 
  Todo, 
  TodoSearchRequest, 
  // TodoSearchResponse,
  // TodoStatsResponse,
  TodoCreate,
  TodoUpdate,
  // BulkTodoUpdateRequest,
  // BulkTodoUpdateResponse,
  API_PATHS 
} from '../../types';

export class TodoApiService {
  /**
   * TODO検索・一覧取得
   */
  async searchTodos(searchRequest: TodoSearchRequest): Promise<ApiResponse<any>> {
    try {
      console.log('📋 API: Searching todos with request:', searchRequest);
      
      // クエリパラメータの構築
      const params = new URLSearchParams();
      if (searchRequest.query) params.append('query', searchRequest.query);
      if (searchRequest.status) {
        searchRequest.status.forEach(status => params.append('status', status));
      }
      if (searchRequest.priority) {
        searchRequest.priority.forEach(priority => params.append('priority', priority));
      }
      if (searchRequest.assigneeId) {
        searchRequest.assigneeId.forEach(assigneeId => params.append('assigneeId', assigneeId));
      }
      if (searchRequest.source) {
        searchRequest.source.forEach(source => params.append('source', source));
      }
      if (searchRequest.companyId) params.append('companyId', searchRequest.companyId);
      if (searchRequest.dueDateFrom) params.append('dueDateFrom', searchRequest.dueDateFrom.toISOString());
      if (searchRequest.dueDateTo) params.append('dueDateTo', searchRequest.dueDateTo.toISOString());
      if (searchRequest.isInternal !== undefined) params.append('isInternal', String(searchRequest.isInternal));
      params.append('page', String(searchRequest.page || 1));
      params.append('limit', String(searchRequest.limit || 20));
      if (searchRequest.sortBy) params.append('sortBy', searchRequest.sortBy);
      if (searchRequest.sortOrder) params.append('sortOrder', searchRequest.sortOrder);

      const response = await apiClient.get<ApiResponse<any>>(
        `${API_PATHS.TODOS.BASE}?${params.toString()}`
      );

      console.log('✅ API: Todo search successful, found:', (response.data as any)?.todos?.length || 0, 'todos');
      return response.data;
    } catch (error) {
      console.error('❌ API: Todo search failed:', error);
      throw new Error('TODO検索に失敗しました');
    }
  }

  /**
   * TODO統計情報取得
   */
  async getTodoStats(): Promise<ApiResponse<any>> {
    try {
      console.log('📊 API: Getting todo statistics');
      
      const response = await apiClient.get<ApiResponse<any>>(
        API_PATHS.TODOS.STATS
      );

      console.log('✅ API: Todo stats retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Todo stats retrieval failed:', error);
      throw new Error('TODO統計情報の取得に失敗しました');
    }
  }

  /**
   * TODO完了処理
   */
  async completeTodo(todoId: string): Promise<ApiResponse<Todo>> {
    try {
      console.log('✅ API: Completing todo:', todoId);
      
      const response = await apiClient.put<ApiResponse<Todo>>(
        API_PATHS.TODOS.DETAIL(todoId),
        { 
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        }
      );

      console.log('✅ API: Todo completed successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Todo completion failed:', error);
      throw new Error('TODOの完了処理に失敗しました');
    }
  }

  /**
   * 新規TODO作成
   */
  async createTodo(todoData: TodoCreate): Promise<ApiResponse<Todo>> {
    try {
      console.log('➕ API: Creating new todo');
      
      const response = await apiClient.post<ApiResponse<Todo>>(
        API_PATHS.TODOS.BASE, 
        todoData
      );

      console.log('✅ API: Todo created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Todo creation failed:', error);
      throw new Error('TODOの作成に失敗しました');
    }
  }

  /**
   * TODO詳細取得
   */
  async getTodo(todoId: string): Promise<ApiResponse<Todo>> {
    try {
      console.log('🔍 API: Getting todo details:', todoId);
      
      const response = await apiClient.get<ApiResponse<Todo>>(
        API_PATHS.TODOS.DETAIL(todoId)
      );

      console.log('✅ API: Todo details retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Todo details retrieval failed:', error);
      throw new Error('TODO詳細情報の取得に失敗しました');
    }
  }

  /**
   * TODO情報更新
   */
  async updateTodo(todoId: string, todoData: TodoUpdate): Promise<ApiResponse<Todo>> {
    try {
      console.log('🔄 API: Updating todo:', todoId);
      
      const response = await apiClient.put<ApiResponse<Todo>>(
        API_PATHS.TODOS.DETAIL(todoId),
        todoData
      );

      console.log('✅ API: Todo updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Todo update failed:', error);
      throw new Error('TODO情報の更新に失敗しました');
    }
  }

  /**
   * TODO削除
   */
  async deleteTodo(todoId: string): Promise<ApiResponse<void>> {
    try {
      console.log('🗑️ API: Deleting todo:', todoId);
      
      const response = await apiClient.delete<ApiResponse<void>>(
        API_PATHS.TODOS.DETAIL(todoId)
      );

      console.log('✅ API: Todo deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Todo deletion failed:', error);
      throw new Error('TODOの削除に失敗しました');
    }
  }

  /**
   * TODO承認
   */
  async approveTodo(todoId: string): Promise<ApiResponse<Todo>> {
    try {
      console.log('✅ API: Approving todo:', todoId);
      
      const response = await apiClient.put<ApiResponse<Todo>>(
        API_PATHS.TODOS.APPROVE(todoId),
        {}
      );

      console.log('✅ API: Todo approved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Todo approval failed:', error);
      throw new Error('TODOの承認に失敗しました');
    }
  }

  /**
   * 期限切れTODO取得
   */
  async getOverdueTodos(): Promise<ApiResponse<Todo[]>> {
    try {
      console.log('⚠️ API: Getting overdue todos');
      
      const response = await apiClient.get<ApiResponse<Todo[]>>(
        API_PATHS.TODOS.OVERDUE
      );

      console.log('✅ API: Overdue todos retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Overdue todos retrieval failed:', error);
      throw new Error('期限切れTODOの取得に失敗しました');
    }
  }

  /**
   * 今日期限TODO取得
   */
  async getTodayTodos(): Promise<ApiResponse<Todo[]>> {
    try {
      console.log('📅 API: Getting today todos');
      
      const response = await apiClient.get<ApiResponse<Todo[]>>(
        API_PATHS.TODOS.TODAY
      );

      console.log('✅ API: Today todos retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Today todos retrieval failed:', error);
      throw new Error('今日期限TODOの取得に失敗しました');
    }
  }

  /**
   * 承認待ちTODO取得
   */
  async getPendingApprovalTodos(): Promise<ApiResponse<Todo[]>> {
    try {
      console.log('⏳ API: Getting pending approval todos');
      
      const response = await apiClient.get<ApiResponse<Todo[]>>(
        API_PATHS.TODOS.PENDING_APPROVAL
      );

      console.log('✅ API: Pending approval todos retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ API: Pending approval todos retrieval failed:', error);
      throw new Error('承認待ちTODOの取得に失敗しました');
    }
  }

  /**
   * 一括TODO更新
   */
  async bulkUpdateTodos(bulkUpdate: any): Promise<ApiResponse<any>> {
    try {
      console.log('🔄 API: Bulk updating todos:', bulkUpdate.todoIds.length, 'todos');
      
      const response = await apiClient.put<ApiResponse<any>>(
        API_PATHS.TODOS.BATCH_UPDATE,
        bulkUpdate
      );

      console.log('✅ API: Bulk todo update completed');
      return response.data;
    } catch (error) {
      console.error('❌ API: Bulk todo update failed:', error);
      throw new Error('TODOの一括更新に失敗しました');
    }
  }

  /**
   * TODO CSV出力
   */
  async exportTodosCSV(filters?: Partial<TodoSearchRequest>): Promise<Blob> {
    try {
      console.log('📄 API: Exporting todos to CSV');
      
      const params = new URLSearchParams();
      if (filters?.query) params.append('query', filters.query);
      if (filters?.status) {
        filters.status.forEach(status => params.append('status', status));
      }
      if (filters?.priority) {
        filters.priority.forEach(priority => params.append('priority', priority));
      }
      if (filters?.assigneeId) {
        filters.assigneeId.forEach(assigneeId => params.append('assigneeId', assigneeId));
      }

      const response = await apiClient.get(
        `${API_PATHS.TODOS.EXPORT_CSV}?${params.toString()}`,
        { responseType: 'blob' }
      );

      console.log('✅ API: CSV export completed');
      return response.data;
    } catch (error) {
      console.error('❌ API: CSV export failed:', error);
      throw new Error('CSVエクスポートに失敗しました');
    }
  }
}

export const todoApiService = new TodoApiService();