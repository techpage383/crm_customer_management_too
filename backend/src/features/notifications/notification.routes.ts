import { Router } from 'express';
import { Pool } from 'pg';
import { NotificationController } from './notification.controller.js';

export function createNotificationRoutes(pool: Pool): Router {
  const router = Router();
  const controller = new NotificationController(pool);

  // メール通知送信
  router.post('/email', controller.sendEmailNotification.bind(controller));

  // Gmail認証状態確認
  router.get('/auth/status', controller.getAuthStatus.bind(controller));

  // テスト用メール送信
  router.post('/test', controller.sendTestNotification.bind(controller));

  console.log('📧 [ROUTES] Notification routes initialized');

  return router;
}