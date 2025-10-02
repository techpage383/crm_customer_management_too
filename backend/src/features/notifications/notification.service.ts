import { Pool } from 'pg';
import { google } from 'googleapis';

export interface EmailNotificationRequest {
  to: string;
  originalTo?: string;
  subject: string;
  body: string;
  taskId?: string;
  type: 'task_created' | 'task_assigned' | 'task_mentioned' | 'task_deadline' | 'test';
}

export class NotificationService {
  private gmail: any;
  private oauth2Client: any;

  constructor(pool: Pool) {
    // Google OAuth2クライアント初期化
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // 管理者用のリフレッシュトークンを設定（環境変数から）
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * タスク管理システムからのメール通知送信
   */
  async sendTaskNotification(request: EmailNotificationRequest): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      console.log(`📧 [NOTIFICATION] メール送信開始: ${request.to}`);
      console.log(`📧 [NOTIFICATION] 件名: ${request.subject}`);
      console.log(`📧 [NOTIFICATION] タイプ: ${request.type}`);

      // メール本文を作成
      const emailContent = this.createEmailContent(request);
      
      // Gmail API でメール送信
      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: emailContent
        }
      });

      console.log(`✅ [NOTIFICATION] メール送信成功: ${result.data.id}`);
      
      return {
        success: true,
        messageId: result.data.id
      };

    } catch (error) {
      console.error('❌ [NOTIFICATION] メール送信エラー:', error);
      
      return {
        success: false,
        error: error.message || 'メール送信に失敗しました'
      };
    }
  }

  /**
   * Base64エンコードされたメールコンテンツを作成
   */
  private createEmailContent(request: EmailNotificationRequest): string {
    const fromEmail = process.env.GMAIL_FROM_ADDRESS || 'noreply@terracom.co.jp';
    
    // メールヘッダーと本文を構築
    const emailLines = [
      `From: ${fromEmail}`,
      `To: ${request.to}`,
      `Subject: ${request.subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      '',
      request.body
    ];

    // テスト段階での情報追加
    if (request.originalTo && request.originalTo !== request.to) {
      emailLines.push('');
      emailLines.push('---');
      emailLines.push(`【テスト送信】本来の宛先: ${request.originalTo}`);
    }

    // メール全体をBase64URLセーフエンコード
    const email = emailLines.join('\n');
    const base64Email = Buffer.from(email, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return base64Email;
  }

  /**
   * Gmail認証状態確認
   */
  async checkGmailAuth(): Promise<{ authenticated: boolean; email?: string }> {
    try {
      // プロファイル情報取得で認証確認
      const profile = await this.gmail.users.getProfile({ userId: 'me' });
      
      return {
        authenticated: true,
        email: profile.data.emailAddress
      };
    } catch (error) {
      console.error('❌ [NOTIFICATION] Gmail認証確認エラー:', error);
      
      return {
        authenticated: false
      };
    }
  }
}