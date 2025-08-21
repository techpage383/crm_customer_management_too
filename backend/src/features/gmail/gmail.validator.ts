import { 
  EmailThreadCreate, 
  EmailThreadUpdate,
  EmailMessageCreate,
  EmailMessageUpdate,
  GmailSyncStatus,
  UserRole,
  ID
} from '../../types/index.js';

export class GmailValidator {
  
  // ========== EmailThread バリデーション ==========
  
  static validateEmailThreadCreate(data: any): { isValid: boolean; errors: string[]; data?: EmailThreadCreate } {
    const errors: string[] = [];
    
    // 必須フィールドの検証
    if (!data.userId || typeof data.userId !== 'string') {
      errors.push('ユーザーIDは必須です');
    }
    
    if (!data.threadGmailId || typeof data.threadGmailId !== 'string') {
      errors.push('Gmail Thread IDは必須です');
    }
    
    if (!data.subject || typeof data.subject !== 'string') {
      errors.push('件名は必須です');
    }
    
    if (!data.snippet || typeof data.snippet !== 'string') {
      errors.push('スニペットは必須です');
    }
    
    if (!data.lastMessageDate) {
      errors.push('最終メッセージ日時は必須です');
    } else {
      const date = new Date(data.lastMessageDate);
      if (isNaN(date.getTime())) {
        errors.push('最終メッセージ日時の形式が不正です');
      }
    }
    
    if (data.messageCount !== undefined && (typeof data.messageCount !== 'number' || data.messageCount < 1)) {
      errors.push('メッセージ数は1以上の数値である必要があります');
    }

    // オプショナルフィールドの検証
    if (data.companyId && typeof data.companyId !== 'string') {
      errors.push('企業IDは文字列である必要があります');
    }
    
    if (data.hasAttachment !== undefined && typeof data.hasAttachment !== 'boolean') {
      errors.push('添付ファイル有無はboolean値である必要があります');
    }
    
    if (data.isRead !== undefined && typeof data.isRead !== 'boolean') {
      errors.push('既読状態はboolean値である必要があります');
    }
    
    if (data.isStarred !== undefined && typeof data.isStarred !== 'boolean') {
      errors.push('スター状態はboolean値である必要があります');
    }
    
    if (data.labels && !Array.isArray(data.labels)) {
      errors.push('ラベルは配列である必要があります');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const validatedData: EmailThreadCreate = {
      userId: data.userId,
      threadGmailId: data.threadGmailId,
      subject: data.subject.trim(),
      snippet: data.snippet.trim(),
      companyId: data.companyId || undefined,
      lastMessageDate: new Date(data.lastMessageDate),
      messageCount: data.messageCount || 1,
      hasAttachment: data.hasAttachment || false,
      isRead: data.isRead || false,
      isStarred: data.isStarred || false,
      labels: data.labels || []
    };

    return { isValid: true, errors: [], data: validatedData };
  }

  static validateEmailThreadUpdate(data: any): { isValid: boolean; errors: string[]; data?: EmailThreadUpdate } {
    const errors: string[] = [];
    
    // 更新可能フィールドの検証
    if (data.subject !== undefined) {
      if (typeof data.subject !== 'string' || data.subject.trim().length === 0) {
        errors.push('件名は空でない文字列である必要があります');
      }
    }
    
    if (data.snippet !== undefined) {
      if (typeof data.snippet !== 'string') {
        errors.push('スニペットは文字列である必要があります');
      }
    }
    
    if (data.companyId !== undefined && data.companyId !== null) {
      if (typeof data.companyId !== 'string') {
        errors.push('企業IDは文字列である必要があります');
      }
    }
    
    if (data.lastMessageDate !== undefined) {
      const date = new Date(data.lastMessageDate);
      if (isNaN(date.getTime())) {
        errors.push('最終メッセージ日時の形式が不正です');
      }
    }
    
    if (data.messageCount !== undefined) {
      if (typeof data.messageCount !== 'number' || data.messageCount < 1) {
        errors.push('メッセージ数は1以上の数値である必要があります');
      }
    }
    
    if (data.hasAttachment !== undefined && typeof data.hasAttachment !== 'boolean') {
      errors.push('添付ファイル有無はboolean値である必要があります');
    }
    
    if (data.isRead !== undefined && typeof data.isRead !== 'boolean') {
      errors.push('既読状態はboolean値である必要があります');
    }
    
    if (data.isStarred !== undefined && typeof data.isStarred !== 'boolean') {
      errors.push('スター状態はboolean値である必要があります');
    }
    
    if (data.labels !== undefined && !Array.isArray(data.labels)) {
      errors.push('ラベルは配列である必要があります');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const validatedData: EmailThreadUpdate = {};
    
    if (data.subject !== undefined) validatedData.subject = data.subject.trim();
    if (data.snippet !== undefined) validatedData.snippet = data.snippet.trim();
    if (data.companyId !== undefined) validatedData.companyId = data.companyId;
    if (data.lastMessageDate !== undefined) validatedData.lastMessageDate = new Date(data.lastMessageDate);
    if (data.messageCount !== undefined) validatedData.messageCount = data.messageCount;
    if (data.hasAttachment !== undefined) validatedData.hasAttachment = data.hasAttachment;
    if (data.isRead !== undefined) validatedData.isRead = data.isRead;
    if (data.isStarred !== undefined) validatedData.isStarred = data.isStarred;
    if (data.labels !== undefined) validatedData.labels = data.labels;

    return { isValid: true, errors: [], data: validatedData };
  }

  // ========== EmailMessage バリデーション ==========
  
  static validateEmailMessageCreate(data: any): { isValid: boolean; errors: string[]; data?: EmailMessageCreate } {
    const errors: string[] = [];
    
    // 必須フィールドの検証
    if (!data.threadId || typeof data.threadId !== 'string') {
      errors.push('スレッドIDは必須です');
    }
    
    if (!data.messageGmailId || typeof data.messageGmailId !== 'string') {
      errors.push('Gmail Message IDは必須です');
    }
    
    if (!data.from || typeof data.from !== 'string') {
      errors.push('送信者は必須です');
    }
    
    if (!data.to || !Array.isArray(data.to) || data.to.length === 0) {
      errors.push('受信者は必須で、配列形式である必要があります');
    } else {
      // メールアドレス形式の簡易検証
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      data.to.forEach((email: any, index: number) => {
        if (typeof email !== 'string' || !emailRegex.test(email)) {
          errors.push(`受信者[${index}]のメールアドレス形式が不正です`);
        }
      });
    }
    
    if (!data.subject || typeof data.subject !== 'string') {
      errors.push('件名は必須です');
    }
    
    if (!data.body || typeof data.body !== 'string') {
      errors.push('本文は必須です');
    }
    
    if (!data.sentAt) {
      errors.push('送信日時は必須です');
    } else {
      const date = new Date(data.sentAt);
      if (isNaN(date.getTime())) {
        errors.push('送信日時の形式が不正です');
      }
    }
    
    if (data.isInbound === undefined || typeof data.isInbound !== 'boolean') {
      errors.push('受信/送信フラグは必須です');
    }

    // オプショナルフィールドの検証
    if (data.cc && !Array.isArray(data.cc)) {
      errors.push('CCは配列である必要があります');
    }
    
    if (data.bcc && !Array.isArray(data.bcc)) {
      errors.push('BCCは配列である必要があります');
    }
    
    if (data.bodyHtml !== undefined && typeof data.bodyHtml !== 'string') {
      errors.push('HTML本文は文字列である必要があります');
    }
    
    if (data.hasAttachment !== undefined && typeof data.hasAttachment !== 'boolean') {
      errors.push('添付ファイル有無はboolean値である必要があります');
    }
    
    if (data.attachments && !Array.isArray(data.attachments)) {
      errors.push('添付ファイルは配列である必要があります');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const validatedData: EmailMessageCreate = {
      threadId: data.threadId,
      messageGmailId: data.messageGmailId,
      from: data.from,
      to: data.to,
      cc: data.cc || [],
      bcc: data.bcc || [],
      subject: data.subject.trim(),
      body: data.body,
      bodyHtml: data.bodyHtml || undefined,
      sentAt: new Date(data.sentAt),
      isInbound: data.isInbound,
      hasAttachment: data.hasAttachment || false,
      attachments: data.attachments || [],
      aiAnalysis: data.aiAnalysis || undefined
    };

    return { isValid: true, errors: [], data: validatedData };
  }

  // ========== Gmail同期設定バリデーション ==========
  
  static validateGmailSyncStatus(status: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    const validStatuses: GmailSyncStatus[] = [
      GmailSyncStatus.CONNECTED,
      GmailSyncStatus.DISCONNECTED,
      GmailSyncStatus.SYNCING,
      GmailSyncStatus.ERROR
    ];
    
    if (!validStatuses.includes(status)) {
      errors.push(`同期状態は次のいずれかである必要があります: ${validStatuses.join(', ')}`);
    }
    
    return { isValid: errors.length === 0, errors };
  }

  // ========== 共有Gmail設定バリデーション ==========
  
  static validateSharedGmailAccount(data: any): { 
    isValid: boolean; 
    errors: string[]; 
    data?: {
      email: string;
      displayName: string;
      accessToken: string;
      refreshToken: string;
      allowedRoles: string[];
    }
  } {
    const errors: string[] = [];
    
    // メールアドレス検証
    if (!data.email || typeof data.email !== 'string') {
      errors.push('メールアドレスは必須です');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('メールアドレスの形式が不正です');
      }
    }
    
    // 表示名検証
    if (!data.displayName || typeof data.displayName !== 'string') {
      errors.push('表示名は必須です');
    } else if (data.displayName.trim().length === 0) {
      errors.push('表示名は空にできません');
    }
    
    // アクセストークン検証
    if (!data.accessToken || typeof data.accessToken !== 'string') {
      errors.push('アクセストークンは必須です');
    }
    
    // リフレッシュトークン検証
    if (!data.refreshToken || typeof data.refreshToken !== 'string') {
      errors.push('リフレッシュトークンは必須です');
    }
    
    // 許可ロール検証
    if (!data.allowedRoles || !Array.isArray(data.allowedRoles)) {
      errors.push('許可ロールは配列である必要があります');
    } else {
      const validRoles = Object.values(UserRole);
      data.allowedRoles.forEach((role: any, index: number) => {
        if (!validRoles.includes(role)) {
          errors.push(`許可ロール[${index}]が不正です。有効な値: ${validRoles.join(', ')}`);
        }
      });
      
      if (data.allowedRoles.length === 0) {
        errors.push('最低1つの許可ロールが必要です');
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const validatedData = {
      email: data.email.trim().toLowerCase(),
      displayName: data.displayName.trim(),
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      allowedRoles: data.allowedRoles
    };

    return { isValid: true, errors: [], data: validatedData };
  }

  static validateSharedGmailAccountUpdate(data: any): { 
    isValid: boolean; 
    errors: string[]; 
    data?: {
      displayName?: string;
      allowedRoles?: string[];
      isActive?: boolean;
      syncEnabled?: boolean;
    }
  } {
    const errors: string[] = [];
    
    // 更新可能フィールドの検証
    if (data.displayName !== undefined) {
      if (typeof data.displayName !== 'string' || data.displayName.trim().length === 0) {
        errors.push('表示名は空でない文字列である必要があります');
      }
    }
    
    if (data.allowedRoles !== undefined) {
      if (!Array.isArray(data.allowedRoles)) {
        errors.push('許可ロールは配列である必要があります');
      } else {
        const validRoles = Object.values(UserRole);
        data.allowedRoles.forEach((role: any, index: number) => {
          if (!validRoles.includes(role)) {
            errors.push(`許可ロール[${index}]が不正です。有効な値: ${validRoles.join(', ')}`);
          }
        });
        
        if (data.allowedRoles.length === 0) {
          errors.push('最低1つの許可ロールが必要です');
        }
      }
    }
    
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
      errors.push('アクティブ状態はboolean値である必要があります');
    }
    
    if (data.syncEnabled !== undefined && typeof data.syncEnabled !== 'boolean') {
      errors.push('同期有効状態はboolean値である必要があります');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const validatedData: any = {};
    
    if (data.displayName !== undefined) validatedData.displayName = data.displayName.trim();
    if (data.allowedRoles !== undefined) validatedData.allowedRoles = data.allowedRoles;
    if (data.isActive !== undefined) validatedData.isActive = data.isActive;
    if (data.syncEnabled !== undefined) validatedData.syncEnabled = data.syncEnabled;

    return { isValid: true, errors: [], data: validatedData };
  }

  // ========== Gmail同期パラメータバリデーション ==========
  
  static validateSyncFilters(filters: any): { 
    isValid: boolean; 
    errors: string[]; 
    data?: {
      companyId?: ID;
      isRead?: boolean;
      hasAttachment?: boolean;
      dateFrom?: Date;
      dateTo?: Date;
      maxResults?: number;
    }
  } {
    const errors: string[] = [];
    
    if (filters.companyId && typeof filters.companyId !== 'string') {
      errors.push('企業IDは文字列である必要があります');
    }
    
    if (filters.isRead !== undefined && typeof filters.isRead !== 'boolean') {
      errors.push('既読フィルターはboolean値である必要があります');
    }
    
    if (filters.hasAttachment !== undefined && typeof filters.hasAttachment !== 'boolean') {
      errors.push('添付ファイルフィルターはboolean値である必要があります');
    }
    
    if (filters.dateFrom !== undefined) {
      const date = new Date(filters.dateFrom);
      if (isNaN(date.getTime())) {
        errors.push('開始日時の形式が不正です');
      }
    }
    
    if (filters.dateTo !== undefined) {
      const date = new Date(filters.dateTo);
      if (isNaN(date.getTime())) {
        errors.push('終了日時の形式が不正です');
      }
    }
    
    if (filters.maxResults !== undefined) {
      if (typeof filters.maxResults !== 'number' || filters.maxResults < 1 || filters.maxResults > 500) {
        errors.push('最大取得件数は1から500の間の数値である必要があります');
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const validatedData: any = {};
    
    if (filters.companyId) validatedData.companyId = filters.companyId;
    if (filters.isRead !== undefined) validatedData.isRead = filters.isRead;
    if (filters.hasAttachment !== undefined) validatedData.hasAttachment = filters.hasAttachment;
    if (filters.dateFrom) validatedData.dateFrom = new Date(filters.dateFrom);
    if (filters.dateTo) validatedData.dateTo = new Date(filters.dateTo);
    if (filters.maxResults) validatedData.maxResults = filters.maxResults;

    return { isValid: true, errors: [], data: validatedData };
  }

  // ========== ユーティリティメソッド ==========
  
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '')  // HTMLタグの除去
      .replace(/javascript:/gi, '')  // JavaScript URLの除去
      .substring(0, 2000);  // 最大長制限
  }

  static validatePaginationParams(params: any): { 
    isValid: boolean; 
    errors: string[]; 
    data?: { page: number; limit: number }
  } {
    const errors: string[] = [];
    
    let page = 1;
    let limit = 20;
    
    if (params.page !== undefined) {
      const pageNum = parseInt(params.page);
      if (isNaN(pageNum) || pageNum < 1) {
        errors.push('ページ番号は1以上の数値である必要があります');
      } else {
        page = pageNum;
      }
    }
    
    if (params.limit !== undefined) {
      const limitNum = parseInt(params.limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push('取得件数は1から100の間の数値である必要があります');
      } else {
        limit = limitNum;
      }
    }
    
    if (errors.length > 0) {
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [], data: { page, limit } };
  }
}