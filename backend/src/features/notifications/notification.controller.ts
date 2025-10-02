import { Request, Response } from 'express';
import { Pool } from 'pg';
import { NotificationService, EmailNotificationRequest } from './notification.service.js';

export class NotificationController {
  private notificationService: NotificationService;

  constructor(pool: Pool) {
    this.notificationService = new NotificationService(pool);
  }

  /**
   * タスク通知メール送信
   * POST /api/notifications/email
   */
  async sendEmailNotification(req: Request, res: Response): Promise<void> {
    try {
      console.log(`📧 [API] メール通知リクエスト受信`);
      console.log(`📧 [API] Body:`, JSON.stringify(req.body, null, 2));

      // リクエストボディの検証
      const { to, subject, body, taskId, type, originalTo } = req.body;

      if (!to || !subject || !body || !type) {
        res.status(400).json({
          success: false,
          error: '必須パラメータが不足しています（to, subject, body, type）'
        });
        return;
      }

      // メール通知リクエスト作成
      const notificationRequest: EmailNotificationRequest = {
        to,
        originalTo,
        subject,
        body,
        taskId,
        type
      };

      // メール送信実行
      const result = await this.notificationService.sendTaskNotification(notificationRequest);

      if (result.success) {
        console.log(`✅ [API] メール通知送信成功`);
        res.status(200).json({
          success: true,
          messageId: result.messageId,
          message: 'メール通知を送信しました'
        });
      } else {
        console.error(`❌ [API] メール通知送信失敗:`, result.error);
        res.status(500).json({
          success: false,
          error: result.error || 'メール送信に失敗しました'
        });
      }

    } catch (error) {
      console.error('❌ [API] メール通知API処理エラー:', error);
      res.status(500).json({
        success: false,
        error: 'サーバーエラーが発生しました'
      });
    }
  }

  /**
   * Gmail認証状態確認
   * GET /api/notifications/auth/status
   */
  async getAuthStatus(req: Request, res: Response): Promise<void> {
    try {
      console.log(`🔐 [API] Gmail認証状態確認`);

      const authStatus = await this.notificationService.checkGmailAuth();

      res.status(200).json({
        success: true,
        ...authStatus
      });

    } catch (error) {
      console.error('❌ [API] 認証状態確認エラー:', error);
      res.status(500).json({
        success: false,
        error: '認証状態の確認に失敗しました'
      });
    }
  }

  /**
   * テスト用メール送信
   * POST /api/notifications/test
   */
  async sendTestNotification(req: Request, res: Response): Promise<void> {
    try {
      console.log(`🧪 [API] テストメール送信リクエスト`);

      const testRequest: EmailNotificationRequest = {
        to: 'muranaka-tenma@terracom.co.jp',
        subject: '[TEST] タスク管理システム通知テスト',
        body: 'これはタスク管理システムからのテスト通知です。\n\nメール通知機能が正常に動作しています。',
        type: 'test'
      };

      const result = await this.notificationService.sendTaskNotification(testRequest);

      if (result.success) {
        res.status(200).json({
          success: true,
          messageId: result.messageId,
          message: 'テストメールを送信しました'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      console.error('❌ [API] テストメール送信エラー:', error);
      res.status(500).json({
        success: false,
        error: 'テストメール送信に失敗しました'
      });
    }
  }
}