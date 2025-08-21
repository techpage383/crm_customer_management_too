import express from 'express';
import { Pool } from 'pg';
import { GmailController } from './gmail.controller.js';
import { authenticateToken } from '../auth/auth.middleware.js';

export function createGmailRoutes(pool: Pool): express.Router {
  const router = express.Router();
  const gmailController = new GmailController(pool);

  // ========== Gmail同期管理ルート ==========

  /**
   * Gmail同期状態取得
   * GET /api/gmail/sync/status
   * 認証: 必須（自分の同期状態のみ取得可能）
   */
  router.get('/sync/status', 
    authenticateToken,
    (req, res) => gmailController.getSyncStatus(req, res)
  );

  /**
   * Gmail手動同期実行
   * POST /api/gmail/sync
   * 認証: 必須（自分のGmailアカウントのみ同期可能）
   */
  router.post('/sync',
    authenticateToken,
    (req, res) => gmailController.triggerSync(req, res)
  );

  // ========== EmailThread管理ルート ==========

  /**
   * メールスレッド一覧取得
   * GET /api/gmail/threads
   * クエリパラメータ:
   *   - page: ページ番号（デフォルト: 1）
   *   - limit: 取得件数（デフォルト: 20、最大: 100）
   *   - companyId: 企業ID（オプション）
   *   - isRead: 既読状態（true/false、オプション）
   * 認証: 必須（自分のスレッドまたは担当企業のスレッド）
   */
  router.get('/threads',
    authenticateToken,
    (req, res) => gmailController.getThreads(req, res)
  );

  /**
   * Gmail高度検索
   * POST /api/gmail/threads/search
   * リクエストボディ:
   *   - companyId: 企業ID（オプション）
   *   - isRead: 既読状態（オプション）
   *   - dateFrom: 開始日（オプション）
   *   - dateTo: 終了日（オプション）
   *   - sender: 送信者（部分一致、オプション）
   *   - subject: 件名（部分一致、オプション）
   *   - hasAttachments: 添付ファイル有無（オプション）
   *   - labels: ラベル配列（オプション）
   *   - page: ページ番号（デフォルト: 1）
   *   - limit: 取得件数（デフォルト: 20、最大: 100）
   *   - sortBy: ソートフィールド（オプション）
   *   - sortOrder: ソート順（asc/desc、デフォルト: desc）
   * 認証: 必須（自分のスレッドまたは担当企業のスレッド）
   */
  router.post('/threads/search',
    authenticateToken,
    (req, res) => gmailController.searchThreads(req, res)
  );

  /**
   * メールスレッド詳細取得
   * GET /api/gmail/threads/:threadId
   * 認証: 必須（アクセス権限チェック）
   */
  router.get('/threads/:threadId',
    authenticateToken,
    (req, res) => gmailController.getThreadDetail(req, res)
  );

  /**
   * メールスレッド更新
   * PUT /api/gmail/threads/:threadId
   * 更新可能フィールド:
   *   - companyId: 企業紐付け変更
   *   - isRead: 既読状態変更
   *   - isStarred: スター状態変更
   *   - labels: ラベル変更
   * 認証: 必須（アクセス権限チェック）
   */
  router.put('/threads/:threadId',
    authenticateToken,
    (req, res) => gmailController.updateThread(req, res)
  );

  /**
   * スレッド内メッセージ一覧取得
   * GET /api/gmail/threads/:threadId/messages
   * 認証: 必須（アクセス権限チェック）
   */
  router.get('/threads/:threadId/messages',
    authenticateToken,
    (req, res) => gmailController.getThreadMessages(req, res)
  );

  // ========== 共有Gmail設定管理ルート ==========

  /**
   * 共有Gmail設定一覧取得
   * GET /api/gmail/shared-accounts
   * 認証: 必須（上位権限者のみ）
   */
  router.get('/shared-accounts',
    authenticateToken,
    (req, res) => gmailController.getSharedAccounts(req, res)
  );

  /**
   * 共有Gmail設定作成
   * POST /api/gmail/shared-accounts
   * リクエストボディ:
   *   - email: Gmail アドレス（必須）
   *   - displayName: 表示名（必須）
   *   - accessToken: アクセストークン（必須）
   *   - refreshToken: リフレッシュトークン（必須）
   *   - allowedRoles: 許可ロール配列（必須）
   * 認証: 必須（上位権限者のみ）
   */
  router.post('/shared-accounts',
    authenticateToken,
    (req, res) => gmailController.createSharedAccount(req, res)
  );

  /**
   * 共有Gmail設定更新
   * PUT /api/gmail/shared-accounts/:accountId
   * 更新可能フィールド:
   *   - displayName: 表示名
   *   - allowedRoles: 許可ロール配列
   *   - isActive: アクティブ状態
   *   - syncEnabled: 同期有効状態
   * 認証: 必須（上位権限者のみ）
   */
  router.put('/shared-accounts/:accountId',
    authenticateToken,
    (req, res) => gmailController.updateSharedAccount(req, res)
  );

  /**
   * 共有Gmail設定削除
   * DELETE /api/gmail/shared-accounts/:accountId
   * 認証: 必須（上位権限者のみ）
   */
  router.delete('/shared-accounts/:accountId',
    authenticateToken,
    (req, res) => gmailController.deleteSharedAccount(req, res)
  );

  // ========== 個人Gmail連携ルート ==========

  /**
   * Gmail認証URL生成
   * GET /api/users/:userId/gmail/connect
   * 認証: 必須（自分または上位権限者）
   */
  router.get('/users/:userId/gmail/connect',
    authenticateToken,  
    (req, res) => gmailController.generateAuthUrl(req, res)
  );

  /**
   * Gmail接続処理（OAuth コールバック）
   * POST /api/users/:userId/gmail/connect
   * リクエストボディ:
   *   - code: OAuth認証コード（必須）
   * 認証: 必須（自分または上位権限者）
   */
  router.post('/users/:userId/gmail/connect',
    authenticateToken,
    (req, res) => gmailController.connectGmail(req, res)
  );

  /**
   * Gmail接続解除
   * DELETE /api/users/:userId/gmail/disconnect
   * 認証: 必須（自分または上位権限者）
   */
  router.delete('/users/:userId/gmail/disconnect',
    authenticateToken,
    (req, res) => gmailController.disconnectGmail(req, res)
  );

  // ========== 開発・テスト用ルート ==========

  /**
   * Gmail設定テーブル初期化
   * POST /api/gmail/initialize
   * 認証: 必須（COMPANY_LEADER のみ、開発環境のみ）
   */
  router.post('/initialize',
    authenticateToken,
    (req, res) => gmailController.initializeTables(req, res)
  );

  // ========== 添付ファイル管理ルート ==========

  /**
   * 添付ファイルプレビュー取得
   * GET /api/gmail/messages/:messageId/attachments/:attachmentId/preview
   * パラメータ:
   *   - messageId: メッセージID
   *   - attachmentId: 添付ファイルID
   * 認証: 必須（Gmail接続済みユーザーのみ）
   * レスポンス: 直接ファイルデータ（画像、テキスト、PDF等）
   */
  router.get('/messages/:messageId/attachments/:attachmentId/preview',
    authenticateToken,
    (req, res) => gmailController.getAttachmentPreview(req, res)
  );

  // ========== ヘルスチェック用ルート ==========

  /**
   * Gmailサービスヘルスチェック
   * GET /api/gmail/health
   * 認証: 不要
   */
  router.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        service: 'Gmail API Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      },
      meta: {
        message: 'Gmail サービスは正常に動作しています'
      }
    });
  });

  // ========== エラーハンドリング ==========

  /**
   * 存在しないエンドポイントへのアクセス
   */
  router.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `エンドポイント ${req.method} ${req.originalUrl} は存在しません`,
      meta: {
        availableEndpoints: [
          'GET /api/gmail/sync/status',
          'POST /api/gmail/sync',
          'GET /api/gmail/threads',
          'POST /api/gmail/threads/search',  // P-003: 高度検索
          'GET /api/gmail/threads/:threadId',
          'PUT /api/gmail/threads/:threadId',
          'GET /api/gmail/threads/:threadId/messages',
          'GET /api/gmail/messages/:messageId/attachments/:attachmentId/preview',  // P-003: プレビュー
          'GET /api/gmail/shared-accounts',
          'POST /api/gmail/shared-accounts',
          'PUT /api/gmail/shared-accounts/:accountId',
          'DELETE /api/gmail/shared-accounts/:accountId',
          'GET /api/users/:userId/gmail/connect',
          'POST /api/users/:userId/gmail/connect',
          'DELETE /api/users/:userId/gmail/disconnect',
          'POST /api/gmail/initialize',
          'GET /api/gmail/health'
        ]
      }
    });
  });

  console.log('✅ Gmail routes initialized with authentication middleware');
  
  return router;
}

// ========== ルート説明コメント ==========

/*
Gmail API ルート構成:

1. 同期管理 (/api/gmail/sync/*)
   - 同期状態取得・手動同期実行
   - 個人のGmailアカウント対象

2. スレッド管理 (/api/gmail/threads/*)  
   - メールスレッド・メッセージのCRUD操作
   - 権限ベースアクセス制御

3. 共有設定 (/api/gmail/shared-accounts/*)
   - 組織共有Gmail設定の管理
   - 上位権限者のみアクセス可能

4. 個人連携 (/api/users/:userId/gmail/*)
   - 個人Gmail接続・解除
   - OAuth2 認証フロー対応

5. 管理機能 (/api/gmail/initialize, /api/gmail/health)
   - テーブル初期化・ヘルスチェック
   - 開発・運用サポート

権限体系:
- 一般ユーザー: 自分のメール同期・閲覧
- 上位権限者: 全ユーザーのメール閲覧・共有設定管理
- COMPANY_LEADER: テーブル初期化権限

セキュリティ:
- 全エンドポイントで認証必須（health除く）
- ユーザー・企業ベースのアクセス制御
- 権限レベル別の機能制限
*/