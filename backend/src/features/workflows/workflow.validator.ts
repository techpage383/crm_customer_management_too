/**
 * ワークフロー管理 - バリデーション層
 * 最強タスク管理ツール
 */

import { 
  WorkflowTemplate, 
  WorkflowSettings, 
  EffortTemplate,
  WorkflowType,
  WorkflowScope,
  UserRole,
  ID
} from '../../types/index.js';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class WorkflowValidator {
  /**
   * ワークフローテンプレート作成バリデーション
   */
  static validateCreateWorkflowTemplate(data: any): ValidationResult {
    const errors: string[] = [];

    // 必須項目チェック
    if (!data.companyId || typeof data.companyId !== 'string') {
      errors.push('企業IDは必須です');
    }

    if (!data.name || typeof data.name !== 'string') {
      errors.push('ワークフロー名は必須です');
    } else if (data.name.length > 255) {
      errors.push('ワークフロー名は255文字以内で入力してください');
    }

    if (!data.type || !Object.values(WorkflowType).includes(data.type)) {
      errors.push('有効なワークフロータイプを指定してください (STANDARD, APPROVAL, CLIENT, CUSTOM)');
    }

    if (!data.scope || !Object.values(WorkflowScope).includes(data.scope)) {
      errors.push('有効なスコープを指定してください (PERSONAL, TEAM, COMPANY)');
    }

    if (!data.workflowData || typeof data.workflowData !== 'object') {
      errors.push('ワークフローデータは必須です');
    } else {
      const workflowValidation = this.validateWorkflowData(data.workflowData);
      if (!workflowValidation.isValid) {
        errors.push(...workflowValidation.errors);
      }
    }

    if (!data.accessControl || typeof data.accessControl !== 'object') {
      errors.push('アクセス制御設定は必須です');
    } else {
      const accessControlValidation = this.validateAccessControl(data.accessControl);
      if (!accessControlValidation.isValid) {
        errors.push(...accessControlValidation.errors);
      }
    }

    if (!data.createdBy || typeof data.createdBy !== 'string') {
      errors.push('作成者IDは必須です');
    }

    // 文字列長制限チェック
    if (data.description && data.description.length > 1000) {
      errors.push('説明は1000文字以内で入力してください');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * ワークフローテンプレート更新バリデーション
   */
  static validateUpdateWorkflowTemplate(data: any): ValidationResult {
    const errors: string[] = [];

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.length === 0) {
        errors.push('ワークフロー名は必須です');
      } else if (data.name.length > 255) {
        errors.push('ワークフロー名は255文字以内で入力してください');
      }
    }

    if (data.type !== undefined && !Object.values(WorkflowType).includes(data.type)) {
      errors.push('有効なワークフロータイプを指定してください (STANDARD, APPROVAL, CLIENT, CUSTOM)');
    }

    if (data.scope !== undefined && !Object.values(WorkflowScope).includes(data.scope)) {
      errors.push('有効なスコープを指定してください (PERSONAL, TEAM, COMPANY)');
    }

    if (data.workflowData !== undefined) {
      if (typeof data.workflowData !== 'object') {
        errors.push('ワークフローデータの形式が正しくありません');
      } else {
        const workflowValidation = this.validateWorkflowData(data.workflowData);
        if (!workflowValidation.isValid) {
          errors.push(...workflowValidation.errors);
        }
      }
    }

    if (data.accessControl !== undefined) {
      if (typeof data.accessControl !== 'object') {
        errors.push('アクセス制御設定の形式が正しくありません');
      } else {
        const accessControlValidation = this.validateAccessControl(data.accessControl);
        if (!accessControlValidation.isValid) {
          errors.push(...accessControlValidation.errors);
        }
      }
    }

    if (data.description !== undefined && data.description.length > 1000) {
      errors.push('説明は1000文字以内で入力してください');
    }

    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
      errors.push('アクティブ状態はboolean値で指定してください');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * ワークフローデータバリデーション
   */
  private static validateWorkflowData(workflowData: any): ValidationResult {
    const errors: string[] = [];

    if (!workflowData.statuses || !Array.isArray(workflowData.statuses)) {
      errors.push('ワークフローのステータス定義は必須です（配列形式）');
    } else {
      if (workflowData.statuses.length === 0) {
        errors.push('少なくとも1つのステータスを定義してください');
      }

      workflowData.statuses.forEach((status: any, index: number) => {
        if (!status.id || typeof status.id !== 'string') {
          errors.push(`ステータス${index + 1}: IDは必須です`);
        }
        if (!status.name || typeof status.name !== 'string') {
          errors.push(`ステータス${index + 1}: 名前は必須です`);
        }
        if (status.color && !/^#[0-9A-Fa-f]{6}$/.test(status.color)) {
          errors.push(`ステータス${index + 1}: カラーコードの形式が正しくありません`);
        }
      });
    }

    if (!workflowData.transitions || !Array.isArray(workflowData.transitions)) {
      errors.push('ワークフローの遷移定義は必須です（配列形式）');
    } else {
      workflowData.transitions.forEach((transition: any, index: number) => {
        if (!transition.from || typeof transition.from !== 'string') {
          errors.push(`遷移${index + 1}: 遷移元ステータスは必須です`);
        }
        if (!transition.to || typeof transition.to !== 'string') {
          errors.push(`遷移${index + 1}: 遷移先ステータスは必須です`);
        }
      });
    }

    if (workflowData.defaultStatus && typeof workflowData.defaultStatus !== 'string') {
      errors.push('デフォルトステータスは文字列で指定してください');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * アクセス制御バリデーション
   */
  private static validateAccessControl(accessControl: any): ValidationResult {
    const errors: string[] = [];

    if (!accessControl.allowedRoles || !Array.isArray(accessControl.allowedRoles)) {
      errors.push('許可ロールは必須です（配列形式）');
    } else {
      const validRoles = Object.values(UserRole);
      accessControl.allowedRoles.forEach((role: any, index: number) => {
        if (!validRoles.includes(role)) {
          errors.push(`許可ロール${index + 1}: 有効なロールを指定してください`);
        }
      });
    }

    if (accessControl.allowedUsers !== undefined && !Array.isArray(accessControl.allowedUsers)) {
      errors.push('許可ユーザーは配列形式で指定してください');
    }

    if (accessControl.allowedDepartments !== undefined && !Array.isArray(accessControl.allowedDepartments)) {
      errors.push('許可部門は配列形式で指定してください');
    }

    const validInheritanceLevels = ['NONE', 'TEAM', 'DEPARTMENT', 'COMPANY'];
    if (accessControl.inheritanceLevel && !validInheritanceLevels.includes(accessControl.inheritanceLevel)) {
      errors.push('継承レベルは NONE, TEAM, DEPARTMENT, COMPANY のいずれかを指定してください');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 工数テンプレート作成バリデーション
   */
  static validateCreateEffortTemplate(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data.companyId || typeof data.companyId !== 'string') {
      errors.push('企業IDは必須です');
    }

    if (!data.name || typeof data.name !== 'string') {
      errors.push('テンプレート名は必須です');
    } else if (data.name.length > 255) {
      errors.push('テンプレート名は255文字以内で入力してください');
    }

    if (!data.category || typeof data.category !== 'string') {
      errors.push('カテゴリは必須です');
    } else if (data.category.length > 100) {
      errors.push('カテゴリは100文字以内で入力してください');
    }

    if (data.estimatedHours === undefined || data.estimatedHours === null) {
      errors.push('予想工数は必須です');
    } else {
      const hours = parseFloat(data.estimatedHours);
      if (isNaN(hours) || hours < 0 || hours > 999.99) {
        errors.push('予想工数は0〜999.99の範囲で入力してください');
      }
    }

    if (!data.templateData || typeof data.templateData !== 'object') {
      errors.push('テンプレートデータは必須です');
    }

    if (!data.scope || !Object.values(WorkflowScope).includes(data.scope)) {
      errors.push('有効なスコープを指定してください (PERSONAL, TEAM, COMPANY)');
    }

    if (!data.accessControl || typeof data.accessControl !== 'object') {
      errors.push('アクセス制御設定は必須です');
    }

    if (!data.createdBy || typeof data.createdBy !== 'string') {
      errors.push('作成者IDは必須です');
    }

    if (data.description && data.description.length > 1000) {
      errors.push('説明は1000文字以内で入力してください');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * ワークフロー設定バリデーション
   */
  static validateWorkflowSettings(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data.userId || typeof data.userId !== 'string') {
      errors.push('ユーザーIDは必須です');
    }

    if (!data.companyId || typeof data.companyId !== 'string') {
      errors.push('企業IDは必須です');
    }

    if (data.defaultWorkflowId && typeof data.defaultWorkflowId !== 'string') {
      errors.push('デフォルトワークフローIDは文字列で指定してください');
    }

    if (data.personalWorkflows !== undefined && !Array.isArray(data.personalWorkflows)) {
      errors.push('個人ワークフローは配列形式で指定してください');
    }

    if (data.sharedWorkflows !== undefined && !Array.isArray(data.sharedWorkflows)) {
      errors.push('共有ワークフローは配列形式で指定してください');
    }

    if (data.customStatuses !== undefined && !Array.isArray(data.customStatuses)) {
      errors.push('カスタムステータスは配列形式で指定してください');
    }

    if (data.effortTemplates !== undefined && !Array.isArray(data.effortTemplates)) {
      errors.push('工数テンプレートは配列形式で指定してください');
    }

    if (data.privacySettings !== undefined && typeof data.privacySettings !== 'object') {
      errors.push('プライバシー設定はオブジェクト形式で指定してください');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * ページネーションパラメータバリデーション
   */
  static validatePaginationParams(params: any): ValidationResult {
    const errors: string[] = [];

    if (params.page !== undefined) {
      const page = parseInt(params.page);
      if (isNaN(page) || page < 1) {
        errors.push('ページ番号は1以上の整数で指定してください');
      }
    }

    if (params.limit !== undefined) {
      const limit = parseInt(params.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        errors.push('リミットは1〜100の範囲で指定してください');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * IDパラメータバリデーション
   */
  static validateId(id: any, fieldName: string = 'ID'): ValidationResult {
    const errors: string[] = [];

    if (!id || typeof id !== 'string') {
      errors.push(`${fieldName}は必須です`);
    } else if (id.length > 255) {
      errors.push(`${fieldName}は255文字以内で指定してください`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}