/**
 * TODOバリデーター層
 * 包括的なデータ検証機能
 * ★8 バックエンド実装エージェント担当
 */

import { TodoCreate, TodoUpdate, TodoStatus, TodoPriority, TodoSource } from '../../types/index.js';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export class TodoValidator {
  /**
   * TODO作成データのバリデーション
   */
  static validateTodoCreate(data: any): ValidationResult {
    const errors: Record<string, string[]> = {};

    // 必須フィールドのチェック
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.title = errors.title || [];
      errors.title.push('タイトルは必須です');
    }

    if (data.title && data.title.length > 255) {
      errors.title = errors.title || [];
      errors.title.push('タイトルは255文字以内で入力してください');
    }

    if (!data.primaryAssigneeId || typeof data.primaryAssigneeId !== 'string') {
      errors.primaryAssigneeId = errors.primaryAssigneeId || [];
      errors.primaryAssigneeId.push('主担当者IDは必須です');
    }

    if (!data.status) {
      errors.status = errors.status || [];
      errors.status.push('ステータスは必須です');
    }

    if (!data.priority) {
      errors.priority = errors.priority || [];
      errors.priority.push('優先度は必須です');
    }

    if (!data.source) {
      errors.source = errors.source || [];
      errors.source.push('ソースは必須です');
    }

    // データ型・形式のチェック
    this.validateCommonFields(data, errors);

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * TODO更新データのバリデーション
   */
  static validateTodoUpdate(data: any): ValidationResult {
    const errors: Record<string, string[]> = {};

    // 更新データは部分的なので、存在するフィールドのみチェック
    this.validateCommonFields(data, errors);

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * TODO検索パラメータのバリデーション
   */
  static validateTodoSearch(params: any): ValidationResult {
    const errors: Record<string, string[]> = {};

    // クエリ文字列
    if (params.query && typeof params.query !== 'string') {
      errors.query = ['クエリは文字列で入力してください'];
    }

    // ステータス配列
    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      const validStatuses = Object.values(TodoStatus);
      const invalidStatuses = statuses.filter((s: string) => !validStatuses.includes(s as TodoStatus));
      if (invalidStatuses.length > 0) {
        errors.status = [`無効なステータス: ${invalidStatuses.join(', ')}`];
      }
    }

    // 優先度配列
    if (params.priority) {
      const priorities = Array.isArray(params.priority) ? params.priority : [params.priority];
      const validPriorities = Object.values(TodoPriority);
      const invalidPriorities = priorities.filter((p: string) => !validPriorities.includes(p as TodoPriority));
      if (invalidPriorities.length > 0) {
        errors.priority = [`無効な優先度: ${invalidPriorities.join(', ')}`];
      }
    }

    // UUID形式チェック
    if (params.assigneeId && !this.isValidUUID(params.assigneeId)) {
      errors.assigneeId = ['担当者IDの形式が正しくありません'];
    }

    if (params.companyId && !this.isValidUUID(params.companyId)) {
      errors.companyId = ['企業IDの形式が正しくありません'];
    }

    // 日付範囲チェック
    if (params.dueDateFrom && !this.isValidDate(params.dueDateFrom)) {
      errors.dueDateFrom = ['期限日開始日の形式が正しくありません'];
    }

    if (params.dueDateTo && !this.isValidDate(params.dueDateTo)) {
      errors.dueDateTo = ['期限日終了日の形式が正しくありません'];
    }

    if (params.dueDateFrom && params.dueDateTo) {
      const fromDate = new Date(params.dueDateFrom);
      const toDate = new Date(params.dueDateTo);
      if (fromDate > toDate) {
        errors.dateRange = ['期限日の開始日は終了日より前の日付を指定してください'];
      }
    }

    // ページネーションチェック
    if (params.page && (!Number.isInteger(Number(params.page)) || Number(params.page) < 1)) {
      errors.page = ['ページ番号は1以上の整数で入力してください'];
    }

    if (params.limit && (!Number.isInteger(Number(params.limit)) || Number(params.limit) < 1 || Number(params.limit) > 100)) {
      errors.limit = ['リミットは1から100の間の整数で入力してください'];
    }

    // ソート条件チェック
    if (params.sortBy) {
      const validSortFields = ['created_at', 'updated_at', 'title', 'status', 'priority', 'due_date'];
      if (!validSortFields.includes(params.sortBy)) {
        errors.sortBy = [`無効なソートフィールド: ${params.sortBy}`];
      }
    }

    if (params.sortOrder && !['asc', 'desc'].includes(params.sortOrder)) {
      errors.sortOrder = ['ソート順序はascまたはdescを指定してください'];
    }

    // ソース配列
    if (params.source) {
      const sources = Array.isArray(params.source) ? params.source : [params.source];
      const validSources = Object.values(TodoSource);
      const invalidSources = sources.filter((s: string) => !validSources.includes(s as TodoSource));
      if (invalidSources.length > 0) {
        errors.source = [`無効なソース: ${invalidSources.join(', ')}`];
      }
    }

    // タグ配列
    if (params.tags && !Array.isArray(params.tags)) {
      errors.tags = ['タグは配列で指定してください'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * TODO承認データのバリデーション
   */
  static validateTodoApproval(approverId: any): ValidationResult {
    const errors: Record<string, string[]> = {};

    if (!approverId || typeof approverId !== 'string') {
      errors.approverId = ['承認者IDは必須です'];
    } else if (!this.isValidUUID(approverId)) {
      errors.approverId = ['承認者IDの形式が正しくありません'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * 一括更新データのバリデーション
   */
  static validateBulkUpdate(data: any): ValidationResult {
    const errors: Record<string, string[]> = {};

    if (!data.todoIds || !Array.isArray(data.todoIds) || data.todoIds.length === 0) {
      errors.todoIds = ['更新対象のTODO IDリストは必須です'];
    } else {
      const invalidIds = data.todoIds.filter((id: any) => !this.isValidUUID(id));
      if (invalidIds.length > 0) {
        errors.todoIds = ['無効なTODO IDが含まれています'];
      }
    }

    if (!data.updates || typeof data.updates !== 'object') {
      errors.updates = ['更新内容は必須です'];
    } else {
      // 更新内容のバリデーション
      const updateValidation = this.validateTodoUpdate(data.updates);
      if (!updateValidation.isValid) {
        Object.assign(errors, updateValidation.errors);
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * 共通フィールドのバリデーション
   */
  private static validateCommonFields(data: any, errors: Record<string, string[]>): void {
    // ステータスチェック
    if (data.status && !Object.values(TodoStatus).includes(data.status)) {
      errors.status = errors.status || [];
      errors.status.push(`無効なステータス: ${data.status}`);
    }

    // 優先度チェック
    if (data.priority && !Object.values(TodoPriority).includes(data.priority)) {
      errors.priority = errors.priority || [];
      errors.priority.push(`無効な優先度: ${data.priority}`);
    }

    // ソースチェック
    if (data.source && !Object.values(TodoSource).includes(data.source)) {
      errors.source = errors.source || [];
      errors.source.push(`無効なソース: ${data.source}`);
    }

    // 説明文字数チェック
    if (data.description && typeof data.description === 'string' && data.description.length > 2000) {
      errors.description = errors.description || [];
      errors.description.push('説明は2000文字以内で入力してください');
    }

    // 期限日チェック
    if (data.dueDate && !this.isValidDate(data.dueDate)) {
      errors.dueDate = errors.dueDate || [];
      errors.dueDate.push('期限日の形式が正しくありません');
    }

    // UUID形式チェック
    if (data.companyId && !this.isValidUUID(data.companyId)) {
      errors.companyId = errors.companyId || [];
      errors.companyId.push('企業IDの形式が正しくありません');
    }

    if (data.primaryAssigneeId && !this.isValidUUID(data.primaryAssigneeId)) {
      errors.primaryAssigneeId = errors.primaryAssigneeId || [];
      errors.primaryAssigneeId.push('主担当者IDの形式が正しくありません');
    }

    if (data.approvedBy && !this.isValidUUID(data.approvedBy)) {
      errors.approvedBy = errors.approvedBy || [];
      errors.approvedBy.push('承認者IDの形式が正しくありません');
    }

    // ブール値チェック
    if (data.isInternal !== undefined && typeof data.isInternal !== 'boolean') {
      errors.isInternal = errors.isInternal || [];
      errors.isInternal.push('内部フラグはtrueまたはfalseで指定してください');
    }

    if (data.isApproved !== undefined && typeof data.isApproved !== 'boolean') {
      errors.isApproved = errors.isApproved || [];
      errors.isApproved.push('承認フラグはtrueまたはfalseで指定してください');
    }

    // 数値チェック
    if (data.estimatedHours !== undefined) {
      if (typeof data.estimatedHours !== 'number' || data.estimatedHours < 0 || data.estimatedHours > 999.99) {
        errors.estimatedHours = errors.estimatedHours || [];
        errors.estimatedHours.push('見積時間は0から999.99の間の数値で入力してください');
      }
    }

    if (data.actualHours !== undefined) {
      if (typeof data.actualHours !== 'number' || data.actualHours < 0 || data.actualHours > 999.99) {
        errors.actualHours = errors.actualHours || [];
        errors.actualHours.push('実績時間は0から999.99の間の数値で入力してください');
      }
    }

    // タグ配列チェック
    if (data.tags !== undefined) {
      if (!Array.isArray(data.tags)) {
        errors.tags = errors.tags || [];
        errors.tags.push('タグは配列で指定してください');
      } else if (data.tags.length > 20) {
        errors.tags = errors.tags || [];
        errors.tags.push('タグは20個以内で指定してください');
      } else {
        const invalidTags = data.tags.filter((tag: any) => 
          typeof tag !== 'string' || tag.length === 0 || tag.length > 50
        );
        if (invalidTags.length > 0) {
          errors.tags = errors.tags || [];
          errors.tags.push('タグは1文字以上50文字以内の文字列で指定してください');
        }
      }
    }

    // ソース参照チェック
    if (data.sourceReference !== undefined && data.sourceReference !== null) {
      if (typeof data.sourceReference !== 'object') {
        errors.sourceReference = errors.sourceReference || [];
        errors.sourceReference.push('ソース参照はオブジェクト形式で指定してください');
      } else {
        const validTypes = ['email', 'thread', 'manual', 'internal_email', 'internal_request'];
        if (data.sourceReference.type && !validTypes.includes(data.sourceReference.type)) {
          errors.sourceReference = errors.sourceReference || [];
          errors.sourceReference.push(`無効なソース参照タイプ: ${data.sourceReference.type}`);
        }

        if (data.sourceReference.id && !this.isValidUUID(data.sourceReference.id)) {
          errors.sourceReference = errors.sourceReference || [];
          errors.sourceReference.push('ソース参照IDの形式が正しくありません');
        }
      }
    }

    // 日付整合性チェック
    if (data.approvedAt && !this.isValidDate(data.approvedAt)) {
      errors.approvedAt = errors.approvedAt || [];
      errors.approvedAt.push('承認日時の形式が正しくありません');
    }

    if (data.completedAt && !this.isValidDate(data.completedAt)) {
      errors.completedAt = errors.completedAt || [];
      errors.completedAt.push('完了日時の形式が正しくありません');
    }

    // 論理整合性チェック
    if (data.isApproved === true && !data.approvedBy && !data.approvedAt) {
      errors.approval = errors.approval || [];
      errors.approval.push('承認済みの場合は承認者と承認日時が必要です');
    }

    if (data.status === TodoStatus.COMPLETED && !data.completedAt) {
      // 完了ステータスの場合は自動で完了日時を設定するため、警告のみ
      console.warn('完了ステータスが設定されましたが、完了日時が指定されていません（自動設定されます）');
    }
  }

  /**
   * UUID形式チェック
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * 日付形式チェック
   */
  private static isValidDate(dateString: any): boolean {
    if (dateString instanceof Date) {
      return !isNaN(dateString.getTime());
    }
    if (typeof dateString === 'string') {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    }
    return false;
  }
}

/**
 * 便利関数：バリデーション結果からエラーレスポンスを生成
 */
export function createValidationErrorResponse(validation: ValidationResult) {
  return {
    success: false,
    error: 'バリデーションエラー',
    code: 'VALIDATION_ERROR',
    details: validation.errors
  };
}