import { Pool } from 'pg';
import { google } from 'googleapis';
import { 
  EmailThread, 
  EmailThreadCreate, 
  EmailThreadUpdate,
  EmailThreadSearchParams,
  EmailMessage,
  EmailMessageCreate,
  GmailSyncStatus,
  User,
  ID
} from '../../types/index.js';
import { GmailModel } from './gmail.model.js';
import { GmailValidator } from './gmail.validator.js';

export class GmailService {
  private gmailModel: GmailModel;
  private gmail: any;
  private oauth2Client: any;

  constructor(pool: Pool) {
    this.gmailModel = new GmailModel(pool);
    
    // Google OAuth2クライアント初期化
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.FRONTEND_URL}/auth/google/callback`
    );

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  // ========== Gmail API認証 ==========

  async generateAuthUrl(): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify'
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    console.log(`🔐 Gmail認証URL生成: ${authUrl}`);
    return authUrl;
  }

  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  }> {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      
      console.log('✅ Gmail認証トークン取得成功');
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date
      };
    } catch (error) {
      console.error('❌ Gmail認証トークン取得失敗:', error);
      throw new Error('Gmail認証に失敗しました');
    }
  }

  private setCredentials(accessToken: string, refreshToken?: string): void {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }

  // ========== Gmail同期管理 ==========

  async getUserGmailSyncStatus(userId: ID): Promise<{
    userId: ID;
    status: GmailSyncStatus;
    lastSyncAt?: Date;
    nextSyncAt?: Date;
    errorMessage?: string;
    errorCount: number;
  } | null> {
    try {
      console.log(`📊 Gmail同期状態取得開始: userId=${userId}`);
      
      const syncStatus = await this.gmailModel.getGmailSyncStatus(userId);
      
      if (!syncStatus) {
        console.log('❌ Gmail同期状態が見つかりません');
        return null;
      }

      console.log(`✅ Gmail同期状態取得完了: status=${syncStatus.status}`);
      return syncStatus;
    } catch (error) {
      console.error('❌ Gmail同期状態取得エラー:', error);
      throw new Error('Gmail同期状態の取得に失敗しました');
    }
  }

  async startGmailSync(userId: ID, accessToken: string, refreshToken?: string): Promise<{
    success: boolean;
    syncedThreads: number;
    syncedMessages: number;
    errors: string[];
  }> {
    try {
      console.log(`🔄 Gmail同期開始: userId=${userId}`);
      
      // 同期状態を「同期中」に更新
      await this.gmailModel.upsertGmailSyncStatus(userId, GmailSyncStatus.SYNCING, {
        lastSyncAt: new Date()
      });

      // Gmail API認証設定
      this.setCredentials(accessToken, refreshToken);

      const result = await this.performGmailSync(userId);

      // 同期完了状態に更新
      await this.gmailModel.upsertGmailSyncStatus(userId, GmailSyncStatus.CONNECTED, {
        lastSyncAt: new Date(),
        nextSyncAt: new Date(Date.now() + 5 * 60 * 1000) // 5分後
      });

      console.log(`✅ Gmail同期完了: ${result.syncedThreads}スレッド、${result.syncedMessages}メッセージ`);
      return result;

    } catch (error) {
      console.error('❌ Gmail同期エラー:', error);
      
      // エラー状態に更新
      await this.gmailModel.upsertGmailSyncStatus(userId, GmailSyncStatus.ERROR, {
        errorMessage: error.message,
        incrementErrorCount: true
      });

      return {
        success: false,
        syncedThreads: 0,
        syncedMessages: 0,
        errors: [error.message]
      };
    }
  }

  private async performGmailSync(userId: ID): Promise<{
    success: boolean;
    syncedThreads: number;
    syncedMessages: number;
    errors: string[];
  }> {
    let syncedThreads = 0;
    let syncedMessages = 0;
    const errors: string[] = [];

    try {
      // スレッド一覧取得
      const threadsResponse = await this.gmail.users.threads.list({
        userId: 'me',
        maxResults: 50,
        q: 'in:inbox OR in:sent'  // 受信箱と送信済みのみ
      });

      const threads = threadsResponse.data.threads || [];
      console.log(`📥 Gmail API: ${threads.length}個のスレッドを取得`);

      for (const thread of threads) {
        try {
          const syncResult = await this.syncSingleThread(userId, thread.id);
          if (syncResult.success) {
            syncedThreads++;
            syncedMessages += syncResult.messageCount;
          } else {
            errors.push(`スレッド ${thread.id}: ${syncResult.error}`);
          }
        } catch (error) {
          console.error(`❌ スレッド同期エラー (${thread.id}):`, error);
          errors.push(`スレッド ${thread.id}: ${error.message}`);
        }
      }

      return {
        success: errors.length === 0,
        syncedThreads,
        syncedMessages,
        errors
      };

    } catch (error) {
      console.error('❌ Gmail同期処理エラー:', error);
      throw new Error(`Gmail同期処理に失敗しました: ${error.message}`);
    }
  }

  private async syncSingleThread(userId: ID, threadId: string): Promise<{
    success: boolean;
    messageCount: number;
    error?: string;
  }> {
    try {
      // スレッド詳細取得
      const threadResponse = await this.gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full'
      });

      const thread = threadResponse.data;
      const messages = thread.messages || [];

      if (messages.length === 0) {
        return { success: false, messageCount: 0, error: 'メッセージが見つかりません' };
      }

      // 最初のメッセージから件名とスニペットを取得
      const firstMessage = messages[0];
      const headers = firstMessage.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '(件名なし)';

      // スレッドデータ作成
      const threadData: EmailThreadCreate = {
        userId: userId,
        threadGmailId: threadId,
        subject: subject,
        snippet: thread.snippet || '',
        lastMessageDate: new Date(parseInt(messages[messages.length - 1].internalDate)),
        messageCount: messages.length,
        hasAttachment: messages.some(m => m.payload?.parts?.some(p => p.filename && p.filename.length > 0))
      };

      // バリデーション
      const validation = GmailValidator.validateEmailThreadCreate(threadData);
      if (!validation.isValid) {
        return { 
          success: false, 
          messageCount: 0, 
          error: `バリデーションエラー: ${validation.errors.join(', ')}` 
        };
      }

      // スレッド保存（重複チェック付き）
      let savedThread: EmailThread;
      try {
        savedThread = await this.gmailModel.createEmailThread(validation.data!);
      } catch (error) {
        if (error.message.includes('duplicate key value')) {
          // 既存スレッドの場合は更新
          const existingThread = await this.gmailModel.getEmailThreadById(threadId);
          if (existingThread) {
            savedThread = await this.gmailModel.updateEmailThread(existingThread.id, {
              messageCount: messages.length,
              lastMessageDate: threadData.lastMessageDate,
              hasAttachment: threadData.hasAttachment
            });
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }

      // メッセージ同期
      let syncedMessageCount = 0;
      for (const message of messages) {
        try {
          const messageResult = await this.syncSingleMessage(savedThread.id, message);
          if (messageResult.success) {
            syncedMessageCount++;
          }
        } catch (messageError) {
          console.error(`❌ メッセージ同期エラー (${message.id}):`, messageError);
        }
      }

      return {
        success: true,
        messageCount: syncedMessageCount
      };

    } catch (error) {
      console.error(`❌ スレッド同期エラー (${threadId}):`, error);
      return { 
        success: false, 
        messageCount: 0, 
        error: error.message 
      };
    }
  }

  private async syncSingleMessage(threadId: ID, gmailMessage: any): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const headers = gmailMessage.payload?.headers || [];
      const getHeader = (name: string) => headers.find(h => h.name === name)?.value || '';

      // メッセージデータ作成
      const messageData: EmailMessageCreate = {
        threadId: threadId,
        messageGmailId: gmailMessage.id,
        from: getHeader('From'),
        to: getHeader('To').split(',').map(email => email.trim()).filter(email => email),
        cc: getHeader('Cc') ? getHeader('Cc').split(',').map(email => email.trim()) : [],
        bcc: getHeader('Bcc') ? getHeader('Bcc').split(',').map(email => email.trim()) : [],
        subject: getHeader('Subject'),
        body: this.extractMessageBody(gmailMessage.payload),
        bodyHtml: this.extractMessageBodyHtml(gmailMessage.payload),
        sentAt: new Date(parseInt(gmailMessage.internalDate)),
        isInbound: !getHeader('From').includes('me'),  // 簡易的な判定
        hasAttachment: gmailMessage.payload?.parts?.some(p => p.filename && p.filename.length > 0) || false,
        attachments: this.extractAttachments(gmailMessage.payload)
      };

      // バリデーション
      const validation = GmailValidator.validateEmailMessageCreate(messageData);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `バリデーションエラー: ${validation.errors.join(', ')}` 
        };
      }

      // メッセージ保存（重複チェック付き）
      try {
        await this.gmailModel.createEmailMessage(validation.data!);
        return { success: true };
      } catch (error) {
        if (error.message.includes('duplicate key value')) {
          // 既存メッセージの場合はスキップ
          return { success: true };
        } else {
          throw error;
        }
      }

    } catch (error) {
      console.error(`❌ メッセージ同期エラー (${gmailMessage.id}):`, error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  private extractMessageBody(payload: any): string {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    return '';
  }

  private extractMessageBodyHtml(payload: any): string | undefined {
    if (payload.body?.data && payload.mimeType === 'text/html') {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    return undefined;
  }

  private extractAttachments(payload: any): any[] {
    const attachments: any[] = [];

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.filename && part.filename.length > 0) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body?.size || 0,
            attachmentId: part.body?.attachmentId
          });
        }
      }
    }

    return attachments;
  }

  // P-003: 添付ファイルプレビュー機能
  async getAttachmentPreview(
    messageId: string,
    attachmentId: string,
    accessToken: string
  ): Promise<{ data: Buffer; mimeType: string; filename: string } | null> {
    try {
      console.log(`📎 添付ファイルプレビュー取得: messageId=${messageId}, attachmentId=${attachmentId}`);

      // Gmail APIクライアント設定
      this.oauth2Client.setCredentials({ access_token: accessToken });

      // メッセージ詳細取得（添付ファイル情報含む）
      const messageResponse = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      // 指定された添付ファイルを検索
      const findAttachment = (parts: any[]): any => {
        for (const part of parts) {
          if (part.body?.attachmentId === attachmentId) {
            return part;
          }
          if (part.parts) {
            const found = findAttachment(part.parts);
            if (found) return found;
          }
        }
        return null;
      };

      const attachmentPart = findAttachment(messageResponse.data.payload?.parts || []);
      if (!attachmentPart) {
        console.log('❌ 指定された添付ファイルが見つかりません');
        return null;
      }

      // 添付ファイルデータ取得
      const attachmentResponse = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId
      });

      if (!attachmentResponse.data.data) {
        console.log('❌ 添付ファイルデータの取得に失敗しました');
        return null;
      }

      // Base64デコード
      const data = Buffer.from(attachmentResponse.data.data, 'base64');

      console.log(`✅ 添付ファイルプレビュー取得完了: ${attachmentPart.filename}, サイズ: ${data.length}bytes`);

      return {
        data,
        mimeType: attachmentPart.mimeType,
        filename: attachmentPart.filename
      };
    } catch (error) {
      console.error('❌ 添付ファイルプレビュー取得エラー:', error);
      throw new Error('添付ファイルプレビューの取得に失敗しました');
    }
  }

  // ========== EmailThread操作 ==========

  async getEmailThreads(
    userId: ID, 
    options: { 
      page?: number; 
      limit?: number; 
      companyId?: ID;
      isRead?: boolean;
    } = {}
  ): Promise<{ threads: EmailThread[]; totalCount: number }> {
    try {
      console.log(`📧 メールスレッド一覧取得: userId=${userId}, options=${JSON.stringify(options)}`);
      
      const result = await this.gmailModel.getEmailThreadsByUserId(userId, options);
      
      console.log(`✅ メールスレッド一覧取得完了: ${result.threads.length}件`);
      return result;
    } catch (error) {
      console.error('❌ メールスレッド一覧取得エラー:', error);
      throw new Error('メールスレッドの取得に失敗しました');
    }
  }

  // P-003: Gmail高度検索機能
  async searchEmailThreads(
    userId: ID, 
    searchParams: EmailThreadSearchParams
  ): Promise<{ threads: EmailThread[]; totalCount: number }> {
    try {
      console.log(`🔍 Gmail高度検索実行: userId=${userId}, params=${JSON.stringify(searchParams)}`);
      
      const result = await this.gmailModel.searchEmailThreads(userId, searchParams);
      
      console.log(`✅ Gmail高度検索完了: ${result.threads.length}件ヒット`);
      return result;
    } catch (error) {
      console.error('❌ Gmail高度検索エラー:', error);
      throw new Error('Gmail検索の実行に失敗しました');
    }
  }

  async getEmailThreadById(threadId: ID): Promise<EmailThread | null> {
    try {
      console.log(`📧 メールスレッド詳細取得: threadId=${threadId}`);
      
      const thread = await this.gmailModel.getEmailThreadById(threadId);
      
      if (!thread) {
        console.log('❌ メールスレッドが見つかりません');
        return null;
      }

      console.log(`✅ メールスレッド詳細取得完了: ${thread.subject}`);
      return thread;
    } catch (error) {
      console.error('❌ メールスレッド詳細取得エラー:', error);
      throw new Error('メールスレッドの取得に失敗しました');
    }
  }

  async updateEmailThread(threadId: ID, updates: EmailThreadUpdate): Promise<EmailThread | null> {
    try {
      console.log(`📧 メールスレッド更新: threadId=${threadId}`);
      
      // バリデーション
      const validation = GmailValidator.validateEmailThreadUpdate(updates);
      if (!validation.isValid) {
        throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
      }

      const updatedThread = await this.gmailModel.updateEmailThread(threadId, validation.data!);
      
      if (!updatedThread) {
        console.log('❌ 更新対象のメールスレッドが見つかりません');
        return null;
      }

      console.log(`✅ メールスレッド更新完了: ${updatedThread.subject}`);
      return updatedThread;
    } catch (error) {
      console.error('❌ メールスレッド更新エラー:', error);
      throw new Error('メールスレッドの更新に失敗しました');
    }
  }

  async getMessagesByThreadId(threadId: ID): Promise<EmailMessage[]> {
    try {
      console.log(`📧 メッセージ一覧取得: threadId=${threadId}`);
      
      const messages = await this.gmailModel.getMessagesByThreadId(threadId);
      
      console.log(`✅ メッセージ一覧取得完了: ${messages.length}件`);
      return messages;
    } catch (error) {
      console.error('❌ メッセージ一覧取得エラー:', error);
      throw new Error('メッセージの取得に失敗しました');
    }
  }

  // ========== 共有Gmail設定管理 ==========

  async getSharedGmailAccounts(): Promise<Array<{
    id: ID;
    email: string;
    displayName: string;
    allowedRoles: string[];
    isActive: boolean;
    syncEnabled: boolean;
    lastSyncAt?: Date;
    createdBy?: ID;
    createdAt: Date;
  }>> {
    try {
      console.log('📧 共有Gmail設定一覧取得');
      
      const accounts = await this.gmailModel.getSharedGmailAccounts();
      
      console.log(`✅ 共有Gmail設定一覧取得完了: ${accounts.length}件`);
      return accounts;
    } catch (error) {
      console.error('❌ 共有Gmail設定一覧取得エラー:', error);
      throw new Error('共有Gmail設定の取得に失敗しました');
    }
  }

  async createSharedGmailAccount(accountData: {
    email: string;
    displayName: string;
    accessToken: string;
    refreshToken: string;
    allowedRoles: string[];
    createdBy: ID;
  }): Promise<ID> {
    try {
      console.log(`📧 共有Gmail設定作成: ${accountData.email}`);
      
      // バリデーション
      const validation = GmailValidator.validateSharedGmailAccount(accountData);
      if (!validation.isValid) {
        throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
      }

      const accountId = await this.gmailModel.createSharedGmailAccount({
        ...validation.data!,
        createdBy: accountData.createdBy
      });
      
      console.log(`✅ 共有Gmail設定作成完了: accountId=${accountId}`);
      return accountId;
    } catch (error) {
      console.error('❌ 共有Gmail設定作成エラー:', error);
      throw new Error('共有Gmail設定の作成に失敗しました');
    }
  }

  async updateSharedGmailAccount(
    accountId: ID, 
    updates: {
      displayName?: string;
      allowedRoles?: string[];
      isActive?: boolean;
      syncEnabled?: boolean;
    }
  ): Promise<boolean> {
    try {
      console.log(`📧 共有Gmail設定更新: accountId=${accountId}`);
      
      // バリデーション
      const validation = GmailValidator.validateSharedGmailAccountUpdate(updates);
      if (!validation.isValid) {
        throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
      }

      const success = await this.gmailModel.updateSharedGmailAccount(accountId, validation.data!);
      
      if (!success) {
        console.log('❌ 更新対象の共有Gmail設定が見つかりません');
        return false;
      }

      console.log(`✅ 共有Gmail設定更新完了`);
      return true;
    } catch (error) {
      console.error('❌ 共有Gmail設定更新エラー:', error);
      throw new Error('共有Gmail設定の更新に失敗しました');
    }
  }

  async deleteSharedGmailAccount(accountId: ID): Promise<boolean> {
    try {
      console.log(`📧 共有Gmail設定削除: accountId=${accountId}`);
      
      const success = await this.gmailModel.deleteSharedGmailAccount(accountId);
      
      if (!success) {
        console.log('❌ 削除対象の共有Gmail設定が見つかりません');
        return false;
      }

      console.log(`✅ 共有Gmail設定削除完了`);
      return true;
    } catch (error) {
      console.error('❌ 共有Gmail設定削除エラー:', error);
      throw new Error('共有Gmail設定の削除に失敗しました');
    }
  }

  // ========== 初期化とクリーンアップ ==========

  async initializeGmailTables(): Promise<void> {
    try {
      console.log('🔧 Gmailテーブル初期化開始');
      
      await this.gmailModel.createGmailTables();
      
      console.log('✅ Gmailテーブル初期化完了');
    } catch (error) {
      console.error('❌ Gmailテーブル初期化エラー:', error);
      throw new Error('Gmailテーブルの初期化に失敗しました');
    }
  }

  async cleanupOldEmailData(daysToKeep: number = 90): Promise<{
    deletedThreads: number;
    deletedMessages: number;
  }> {
    try {
      console.log(`🧹 古いメールデータクリーンアップ開始: ${daysToKeep}日以前のデータを削除`);
      
      const result = await this.gmailModel.cleanupOldEmailData(daysToKeep);
      
      console.log(`✅ メールデータクリーンアップ完了: スレッド${result.deletedThreads}件、メッセージ${result.deletedMessages}件を削除`);
      return result;
    } catch (error) {
      console.error('❌ メールデータクリーンアップエラー:', error);
      throw new Error('メールデータのクリーンアップに失敗しました');
    }
  }
}