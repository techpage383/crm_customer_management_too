/**
 * 企業管理機能 - バリデータ層
 * P-002 企業管理ページの入力データ検証
 * 
 * 企業情報、連絡先情報の入力データバリデーション
 * 型定義は/src/types/index.tsと完全同期
 */

import { 
  CompanyCreate, 
  CompanyUpdate, 
  CompanyStatus,
  CompanySize,
  IndustryType,
  ContactCreate,
  ContactUpdate,
  ContactType,
  ContactRelationshipLevel,
  VALIDATION_RULES
} from '../../types/index.js';
import { 
  ValidationResult,
  validateInput,
  validateEmail,
  validatePhoneNumber,
  validatePostalCode,
  validateUrl,
  validateJapanese
} from '../../common/validators/input-validator.js';

/**
 * 企業作成データのバリデーション
 */
export function validateCompanyCreate(data: any): ValidationResult {
  console.log('[CompanyValidator.validateCreate] 企業作成データ検証開始');
  
  // 基本的な型チェック
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: { general: ['無効なデータ形式です'] }
    };
  }

  // 基本バリデーションルール（型定義ファイルから取得）
  const basicRules = {
    name: VALIDATION_RULES.COMPANY.name,
    nameKana: {
      ...VALIDATION_RULES.COMPANY.nameKana,
      custom: (value: string) => {
        if (!value) return null;
        if (!validateJapanese(value)) {
          return 'ひらがな・カタカナで入力してください';
        }
        return null;
      }
    },
    industry: { required: true, maxLength: 100 },
    status: { 
      required: true,
      custom: (value: string) => {
        if (!Object.values(CompanyStatus).includes(value as CompanyStatus)) {
          return '無効なステータスです';
        }
        return null;
      }
    },
    size: { 
      required: true,
      custom: (value: string) => {
        if (!Object.values(CompanySize).includes(value as CompanySize)) {
          return '無効な企業規模です';
        }
        return null;
      }
    },
    primaryAssigneeId: { 
      required: true,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      custom: (value: string) => {
        if (!value || typeof value !== 'string') {
          return '主担当者は必須です';
        }
        return null;
      }
    }
  };

  // 基本バリデーション実行
  const basicValidation = validateInput(data, basicRules);
  
  // 追加検証
  const additionalErrors: Record<string, string[]> = {};

  // 従業員数チェック
  if (data.employeeCount !== undefined && data.employeeCount !== null) {
    if (typeof data.employeeCount !== 'number' || data.employeeCount < 0) {
      additionalErrors.employeeCount = ['従業員数は0以上の数値で入力してください'];
    } else if (data.employeeCount > 1000000) {
      additionalErrors.employeeCount = ['従業員数が大きすぎます'];
    }
  }

  // 資本金チェック
  if (data.capital !== undefined && data.capital !== null) {
    if (typeof data.capital !== 'number' || data.capital < 0) {
      additionalErrors.capital = ['資本金は0以上の数値で入力してください'];
    }
  }

  // 設立年チェック
  if (data.establishedYear !== undefined && data.establishedYear !== null) {
    const currentYear = new Date().getFullYear();
    if (typeof data.establishedYear !== 'number' || 
        data.establishedYear < 1800 || 
        data.establishedYear > currentYear) {
      additionalErrors.establishedYear = [`設立年は1800年から${currentYear}年の間で入力してください`];
    }
  }

  // Webサイトチェック
  if (data.website && !validateUrl(data.website)) {
    additionalErrors.website = ['有効なURLを入力してください'];
  }

  // 電話番号チェック
  if (data.phone && !validatePhoneNumber(data.phone)) {
    additionalErrors.phone = ['有効な電話番号を入力してください'];
  }

  // FAX番号チェック
  if (data.fax && !validatePhoneNumber(data.fax)) {
    additionalErrors.fax = ['有効なFAX番号を入力してください'];
  }

  // 住所チェック
  if (data.address && typeof data.address === 'object') {
    if (data.address.postalCode && !validatePostalCode(data.address.postalCode)) {
      additionalErrors['address.postalCode'] = ['有効な郵便番号を入力してください（例：123-4567）'];
    }
    
    if (data.address.prefecture && !data.address.prefecture.trim()) {
      additionalErrors['address.prefecture'] = ['都道府県を入力してください'];
    }
    
    if (data.address.city && !data.address.city.trim()) {
      additionalErrors['address.city'] = ['市区町村を入力してください'];
    }

    if (data.address.address1 && !data.address.address1.trim()) {
      additionalErrors['address.address1'] = ['住所1を入力してください'];
    }
  }

  // 副担当者IDsの検証
  if (data.secondaryAssigneeIds) {
    if (!Array.isArray(data.secondaryAssigneeIds)) {
      additionalErrors.secondaryAssigneeIds = ['副担当者IDは配列で指定してください'];
    } else {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidIds = data.secondaryAssigneeIds.filter((id: any) => 
        typeof id !== 'string' || !uuidPattern.test(id)
      );
      if (invalidIds.length > 0) {
        additionalErrors.secondaryAssigneeIds = ['無効な副担当者IDが含まれています'];
      }
    }
  }

  // 日付フィールドの検証
  if (data.lastContactAt && !(data.lastContactAt instanceof Date) && 
      isNaN(Date.parse(data.lastContactAt))) {
    additionalErrors.lastContactAt = ['有効な日付を入力してください'];
  }

  if (data.nextFollowUpAt && !(data.nextFollowUpAt instanceof Date) && 
      isNaN(Date.parse(data.nextFollowUpAt))) {
    additionalErrors.nextFollowUpAt = ['有効な日付を入力してください'];
  }

  // エラーをマージ
  const allErrors = { ...basicValidation.errors, ...additionalErrors };
  const isValid = Object.keys(allErrors).length === 0;

  console.log(`[CompanyValidator.validateCreate] 検証完了: ${isValid ? '成功' : '失敗'}`);
  if (!isValid) {
    console.log('[CompanyValidator.validateCreate] エラー詳細:', allErrors);
  }

  return {
    isValid,
    errors: allErrors
  };
}

/**
 * 企業更新データのバリデーション
 */
export function validateCompanyUpdate(data: any): ValidationResult {
  console.log('[CompanyValidator.validateUpdate] 企業更新データ検証開始');
  
  // 基本的な型チェック
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: { general: ['無効なデータ形式です'] }
    };
  }

  // 更新データは部分的なので、存在するフィールドのみ検証
  const errors: Record<string, string[]> = {};

  // 名前の検証
  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.name = ['企業名は必須です'];
    } else if (data.name.length > 200) {
      errors.name = ['企業名は200文字以下で入力してください'];
    }
  }

  // 名前（カナ）の検証
  if (data.nameKana !== undefined && data.nameKana !== null) {
    if (data.nameKana.length > 200) {
      errors.nameKana = ['企業名（カナ）は200文字以下で入力してください'];
    } else if (data.nameKana && !validateJapanese(data.nameKana)) {
      errors.nameKana = ['ひらがな・カタカナで入力してください'];
    }
  }

  // ステータスの検証
  if (data.status !== undefined) {
    if (!Object.values(CompanyStatus).includes(data.status)) {
      errors.status = ['無効なステータスです'];
    }
  }

  // 企業規模の検証
  if (data.size !== undefined) {
    if (!Object.values(CompanySize).includes(data.size)) {
      errors.size = ['無効な企業規模です'];
    }
  }

  // 主担当者IDの検証
  if (data.primaryAssigneeId !== undefined) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!data.primaryAssigneeId || !uuidPattern.test(data.primaryAssigneeId)) {
      errors.primaryAssigneeId = ['有効な主担当者IDを指定してください'];
    }
  }

  // その他のフィールドも同様に検証（企業作成と同じロジック）
  if (data.employeeCount !== undefined && data.employeeCount !== null) {
    if (typeof data.employeeCount !== 'number' || data.employeeCount < 0) {
      errors.employeeCount = ['従業員数は0以上の数値で入力してください'];
    }
  }

  if (data.website !== undefined && data.website !== null && data.website && !validateUrl(data.website)) {
    errors.website = ['有効なURLを入力してください'];
  }

  if (data.phone !== undefined && data.phone !== null && data.phone && !validatePhoneNumber(data.phone)) {
    errors.phone = ['有効な電話番号を入力してください'];
  }

  const isValid = Object.keys(errors).length === 0;

  console.log(`[CompanyValidator.validateUpdate] 検証完了: ${isValid ? '成功' : '失敗'}`);
  if (!isValid) {
    console.log('[CompanyValidator.validateUpdate] エラー詳細:', errors);
  }

  return {
    isValid,
    errors
  };
}

/**
 * 連絡先作成データのバリデーション
 */
export function validateContactCreate(data: any): ValidationResult {
  console.log('[CompanyValidator.validateContactCreate] 連絡先作成データ検証開始');
  
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: { general: ['無効なデータ形式です'] }
    };
  }

  const rules = {
    companyId: { 
      required: true,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    },
    fullName: { required: true, maxLength: 100 },
    type: { 
      required: true,
      custom: (value: string) => {
        if (!Object.values(ContactType).includes(value as ContactType)) {
          return '無効な連絡先タイプです';
        }
        return null;
      }
    },
    relationshipLevel: {
      required: true,
      custom: (value: string) => {
        if (!Object.values(ContactRelationshipLevel).includes(value as ContactRelationshipLevel)) {
          return '無効な関係性レベルです';
        }
        return null;
      }
    },
    isDecisionMaker: {
      required: true,
      custom: (value: any) => {
        if (typeof value !== 'boolean') {
          return '決裁者フラグはboolean値で指定してください';
        }
        return null;
      }
    }
  };

  const basicValidation = validateInput(data, rules);
  const additionalErrors: Record<string, string[]> = {};

  // メールアドレスの検証
  if (data.email && !validateEmail(data.email)) {
    additionalErrors.email = ['有効なメールアドレスを入力してください'];
  }

  // 電話番号の検証
  if (data.phone && !validatePhoneNumber(data.phone)) {
    additionalErrors.phone = ['有効な電話番号を入力してください'];
  }

  if (data.mobile && !validatePhoneNumber(data.mobile)) {
    additionalErrors.mobile = ['有効な携帯電話番号を入力してください'];
  }

  // 名前（カナ）の検証
  if (data.fullNameKana && !validateJapanese(data.fullNameKana)) {
    additionalErrors.fullNameKana = ['ひらがな・カタカナで入力してください'];
  }

  const allErrors = { ...basicValidation.errors, ...additionalErrors };
  const isValid = Object.keys(allErrors).length === 0;

  console.log(`[CompanyValidator.validateContactCreate] 検証完了: ${isValid ? '成功' : '失敗'}`);
  
  return {
    isValid,
    errors: allErrors
  };
}

/**
 * 連絡先更新データのバリデーション
 */
export function validateContactUpdate(data: any): ValidationResult {
  console.log('[CompanyValidator.validateContactUpdate] 連絡先更新データ検証開始');
  
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: { general: ['無効なデータ形式です'] }
    };
  }

  const errors: Record<string, string[]> = {};

  // 存在するフィールドのみ検証
  if (data.fullName !== undefined) {
    if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim().length === 0) {
      errors.fullName = ['氏名は必須です'];
    } else if (data.fullName.length > 100) {
      errors.fullName = ['氏名は100文字以下で入力してください'];
    }
  }

  if (data.type !== undefined) {
    if (!Object.values(ContactType).includes(data.type)) {
      errors.type = ['無効な連絡先タイプです'];
    }
  }

  if (data.relationshipLevel !== undefined) {
    if (!Object.values(ContactRelationshipLevel).includes(data.relationshipLevel)) {
      errors.relationshipLevel = ['無効な関係性レベルです'];
    }
  }

  if (data.email !== undefined && data.email !== null && data.email && !validateEmail(data.email)) {
    errors.email = ['有効なメールアドレスを入力してください'];
  }

  if (data.phone !== undefined && data.phone !== null && data.phone && !validatePhoneNumber(data.phone)) {
    errors.phone = ['有効な電話番号を入力してください'];
  }

  if (data.mobile !== undefined && data.mobile !== null && data.mobile && !validatePhoneNumber(data.mobile)) {
    errors.mobile = ['有効な携帯電話番号を入力してください'];
  }

  const isValid = Object.keys(errors).length === 0;

  console.log(`[CompanyValidator.validateContactUpdate] 検証完了: ${isValid ? '成功' : '失敗'}`);
  
  return {
    isValid,
    errors
  };
}

/**
 * 企業検索パラメータのバリデーション
 */
export function validateCompanySearchRequest(data: any): ValidationResult {
  console.log('[CompanyValidator.validateSearchRequest] 検索パラメータ検証開始');
  
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: { general: ['無効なデータ形式です'] }
    };
  }

  const errors: Record<string, string[]> = {};

  // ページネーション検証
  if (data.page !== undefined) {
    if (typeof data.page !== 'number' || data.page < 1) {
      errors.page = ['ページ数は1以上の数値で指定してください'];
    }
  }

  if (data.limit !== undefined) {
    if (typeof data.limit !== 'number' || data.limit < 1 || data.limit > 100) {
      errors.limit = ['取得件数は1から100の間で指定してください'];
    }
  }

  // ソート検証
  if (data.sortBy !== undefined) {
    const validSortFields = ['name', 'status', 'size', 'industry', 'lastContactAt', 'createdAt', 'updatedAt'];
    if (!validSortFields.includes(data.sortBy)) {
      errors.sortBy = ['無効なソートフィールドです'];
    }
  }

  if (data.sortOrder !== undefined) {
    if (!['asc', 'desc'].includes(data.sortOrder)) {
      errors.sortOrder = ['ソート順序は"asc"または"desc"で指定してください'];
    }
  }

  // 検索条件の検証
  if (data.status !== undefined) {
    if (!Array.isArray(data.status)) {
      errors.status = ['ステータスは配列で指定してください'];
    } else {
      const invalidStatuses = data.status.filter((status: any) => 
        !Object.values(CompanyStatus).includes(status)
      );
      if (invalidStatuses.length > 0) {
        errors.status = ['無効なステータスが含まれています'];
      }
    }
  }

  if (data.size !== undefined) {
    if (!Array.isArray(data.size)) {
      errors.size = ['企業規模は配列で指定してください'];
    } else {
      const invalidSizes = data.size.filter((size: any) => 
        !Object.values(CompanySize).includes(size)
      );
      if (invalidSizes.length > 0) {
        errors.size = ['無効な企業規模が含まれています'];
      }
    }
  }

  if (data.assigneeId !== undefined) {
    if (!Array.isArray(data.assigneeId)) {
      errors.assigneeId = ['担当者IDは配列で指定してください'];
    } else {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidIds = data.assigneeId.filter((id: any) => 
        typeof id !== 'string' || !uuidPattern.test(id)
      );
      if (invalidIds.length > 0) {
        errors.assigneeId = ['無効な担当者IDが含まれています'];
      }
    }
  }

  const isValid = Object.keys(errors).length === 0;

  console.log(`[CompanyValidator.validateSearchRequest] 検証完了: ${isValid ? '成功' : '失敗'}`);
  
  return {
    isValid,
    errors
  };
}

/**
 * 企業担当者変更データのバリデーション
 */
export function validateCompanyAssignment(data: any): ValidationResult {
  console.log('[CompanyValidator.validateAssignment] 担当者変更データ検証開始');
  
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: { general: ['無効なデータ形式です'] }
    };
  }

  const errors: Record<string, string[]> = {};
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // 主担当者IDの検証
  if (!data.primaryAssigneeId || !uuidPattern.test(data.primaryAssigneeId)) {
    errors.primaryAssigneeId = ['有効な主担当者IDを指定してください'];
  }

  // 副担当者IDsの検証
  if (data.secondaryAssigneeIds !== undefined) {
    if (!Array.isArray(data.secondaryAssigneeIds)) {
      errors.secondaryAssigneeIds = ['副担当者IDは配列で指定してください'];
    } else {
      const invalidIds = data.secondaryAssigneeIds.filter((id: any) => 
        typeof id !== 'string' || !uuidPattern.test(id)
      );
      if (invalidIds.length > 0) {
        errors.secondaryAssigneeIds = ['無効な副担当者IDが含まれています'];
      }
      
      // 主担当者と副担当者の重複チェック
      if (data.secondaryAssigneeIds.includes(data.primaryAssigneeId)) {
        errors.secondaryAssigneeIds = ['主担当者と副担当者に同じユーザーを指定することはできません'];
      }
    }
  }

  const isValid = Object.keys(errors).length === 0;

  console.log(`[CompanyValidator.validateAssignment] 検証完了: ${isValid ? '成功' : '失敗'}`);
  
  return {
    isValid,
    errors
  };
}