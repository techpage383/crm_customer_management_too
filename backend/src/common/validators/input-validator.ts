/**
 * 入力検証ユーティリティ
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

/**
 * 入力データを検証
 */
export function validateInput(
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): ValidationResult {
  const errors: Record<string, string[]> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const fieldErrors: string[] = [];

    // 必須チェック
    if (rule.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${field}は必須です`);
      continue;
    }

    // 値が存在しない場合はスキップ（必須でない場合）
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // 文字列長チェック
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        fieldErrors.push(`${field}は${rule.minLength}文字以上である必要があります`);
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        fieldErrors.push(`${field}は${rule.maxLength}文字以下である必要があります`);
      }
    }

    // 数値範囲チェック
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        fieldErrors.push(`${field}は${rule.min}以上である必要があります`);
      }
      
      if (rule.max !== undefined && value > rule.max) {
        fieldErrors.push(`${field}は${rule.max}以下である必要があります`);
      }
    }

    // パターンチェック
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        fieldErrors.push(`${field}の形式が正しくありません`);
      }
    }

    // カスタム検証
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        fieldErrors.push(customError);
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * メールアドレス検証
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * パスワード強度検証
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // 長さチェック
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('8文字以上にしてください');
  }

  // 小文字チェック
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('小文字を含めてください');
  }

  // 大文字チェック
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('大文字を含めてください');
  }

  // 数字チェック
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('数字を含めてください');
  }

  // 特殊文字チェック
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('特殊文字(!@#$%^&*など)を含めてください');
  }

  // よくあるパスワードチェック
  const commonPasswords = [
    'password', '123456', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0;
    feedback.push('よく使われるパスワードです。別のパスワードを選択してください');
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  };
}

/**
 * 日本語文字列検証
 */
export function validateJapanese(text: string): boolean {
  // ひらがな、カタカナ、漢字、英数字、一般的な記号を許可
  const japaneseRegex = /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u0020-\u007E\s]*$/;
  return japaneseRegex.test(text);
}

/**
 * 電話番号検証（日本形式）
 */
export function validatePhoneNumber(phone: string): boolean {
  // 日本の電話番号形式（ハイフン有無、国番号有無対応）
  const phoneRegex = /^(\+81|0)?[0-9]{1,4}-?[0-9]{1,4}-?[0-9]{3,4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * 郵便番号検証（日本形式）
 */
export function validatePostalCode(postal: string): boolean {
  // 日本の郵便番号形式（7桁、ハイフン有無対応）
  const postalRegex = /^[0-9]{3}-?[0-9]{4}$/;
  return postalRegex.test(postal);
}

/**
 * URL検証
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}