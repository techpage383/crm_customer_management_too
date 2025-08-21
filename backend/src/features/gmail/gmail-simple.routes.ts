import express from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../auth/auth.middleware.js';

export function createSimpleGmailRoutes(pool: Pool): express.Router {
  const router = express.Router();

  // Gmail設定システム初期化（テスト用）
  router.post('/initialize', authenticateToken, async (req, res) => {
    try {
      // シンプルな成功レスポンス
      res.status(200).json({
        success: true,
        data: {
          initialized: true,
          tablesCreated: ['gmail_settings', 'email_threads', 'email_messages']
        },
        meta: {
          message: 'Gmail設定システムの初期化が完了しました'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Gmail初期化に失敗しました',
        meta: { details: error.message }
      });
    }
  });

  // Gmail認証URL生成（テスト用）
  router.get('/users/:userId/gmail/connect', authenticateToken, async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          authUrl: 'https://accounts.google.com/oauth/test',
          userId: req.params.userId
        },
        meta: {
          message: 'Gmail認証URLが生成されました'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Gmail認証URL生成に失敗しました',
        meta: { details: error.message }
      });
    }
  });

  // Gmail同期状態取得（テスト用）
  router.get('/sync/status', authenticateToken, async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          syncStatus: 'idle',
          lastSync: new Date().toISOString(),
          totalEmails: 0
        },
        meta: {
          message: 'Gmail同期状態を取得しました'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Gmail同期状態取得に失敗しました',
        meta: { details: error.message }
      });
    }
  });

  // メールスレッド一覧取得（テスト用）
  router.get('/threads', authenticateToken, async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          threads: [],
          total: 0,
          page: 1,
          limit: 20
        },
        meta: {
          message: 'メールスレッド一覧を取得しました'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'メールスレッド取得に失敗しました',
        meta: { details: error.message }
      });
    }
  });

  // 共有Gmail設定一覧取得（テスト用）
  router.get('/shared-accounts', authenticateToken, async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          accounts: [],
          total: 0
        },
        meta: {
          message: '共有Gmail設定一覧を取得しました'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: '共有Gmail設定取得に失敗しました',
        meta: { details: error.message }
      });
    }
  });

  // Gmailサービスヘルスチェック（テスト用）
  router.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        service: 'Gmail API Service (Simple)',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0-test'
      },
      meta: {
        message: 'Gmail サービスは正常に動作しています（テストモード）'
      }
    });
  });

  // 404エラーハンドリング
  router.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `エンドポイント ${req.method} ${req.originalUrl} は存在しません`,
      meta: {
        availableEndpoints: [
          'POST /api/gmail/initialize',
          'GET /api/gmail/users/:userId/gmail/connect',
          'GET /api/gmail/sync/status',
          'GET /api/gmail/threads',
          'GET /api/gmail/shared-accounts',
          'GET /api/gmail/health'
        ]
      }
    });
  });

  console.log('✅ Simple Gmail routes initialized for testing');
  
  return router;
}