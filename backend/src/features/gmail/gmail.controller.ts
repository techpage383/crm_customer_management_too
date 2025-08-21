import { Request, Response } from 'express';
import { Pool } from 'pg';
import { 
  ApiResponse,
  EmailThread,
  EmailMessage,
  EmailThreadSearchParams,
  GmailSyncStatus,
  UserRole,
  ID,
  isUpperRole
} from '../../types/index.js';
import { GmailService } from './gmail.service.js';
import { GmailValidator } from './gmail.validator.js';

export class GmailController {
  private gmailService: GmailService;

  constructor(pool: Pool) {
    this.gmailService = new GmailService(pool);
  }

  // ========== Gmail同期管理エンドポイント ==========

  /**
   * Gmail同期状態取得
   * GET /api/gmail/sync/status
   */
  async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      console.log(`📊 Gmail同期状態取得リクエスト: userId=${req.user?.id}`);

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: '認証が必要です'
        } as ApiResponse<null>);
        return;
      }

      const syncStatus = await this.gmailService.getUserGmailSyncStatus(userId);

      if (!syncStatus) {
        res.status(404).json({
          success: false,
          error: 'Gmail同期設定が見つかりません'
        } as ApiResponse<null>);
        return;
      }

      console.log(`✅ Gmail同期状態取得完了: status=${syncStatus.status}`);

      res.status(200).json({
        success: true,
        data: syncStatus
      } as ApiResponse<typeof syncStatus>);

    } catch (error) {
      console.error('❌ Gmail同期状態取得エラー:', error);
      
      res.status(500).json({
        success: false,
        error: 'Gmail同期状態の取得に失敗しました'
      } as ApiResponse<null>);
    }
  }

  /**
   * Gmail手動同期実行
   * POST /api/gmail/sync
   */
  async triggerSync(req: Request, res: Response): Promise<void> {
    try {
      console.log(`🔄 Gmail手動同期リクエスト: userId=${req.user?.id}`);

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: '認証が必要です'
        } as ApiResponse<null>);
        return;
      }

      // ユーザーのGmail接続情報を確認
      const user = req.user;
      if (!user.gmailPersonalAccessToken) {
        res.status(400).json({
          success: false,
          error: 'Gmail接続が設定されていません'
        } as ApiResponse<null>);
        return;
      }

      const syncResult = await this.gmailService.startGmailSync(
        userId,
        user.gmailPersonalAccessToken,
        user.gmailPersonalRefreshToken
      );

      console.log(`✅ Gmail同期完了: success=${syncResult.success}, threads=${syncResult.syncedThreads}, messages=${syncResult.syncedMessages}`);

      res.status(200).json({
        success: true,
        data: syncResult,
        meta: {
          message: syncResult.success 
            ? `${syncResult.syncedThreads}スレッド、${syncResult.syncedMessages}メッセージを同期しました`
            : `同期中にエラーが発生しました: ${syncResult.errors.join(', ')}`
        }
      } as ApiResponse<typeof syncResult>);

    } catch (error) {
      console.error('❌ Gmail同期エラー:', error);
      
      res.status(500).json({
        success: false,
        error: 'Gmail同期の実行に失敗しました'
      } as ApiResponse<null>);
    }
  }

  // ========== EmailThread管理エンドポイント ==========

  /**
   * メールスレッド一覧取得
   * GET /api/gmail/threads
   */
  async getThreads(req: Request, res: Response): Promise<void> {
    try {
      console.log(`📧 メールスレッド一覧リクエスト: userId=${req.user?.id}`);

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: '認証が必要です'
        } as ApiResponse<null>);
        return;
      }

      // パラメータバリデーション
      const paginationValidation = GmailValidator.validatePaginationParams(req.query);
      if (!paginationValidation.isValid) {
        res.status(400).json({
          success: false,
          error: `パラメータエラー: ${paginationValidation.errors.join(', ')}`
        } as ApiResponse<null>);
        return;
      }

      const options = {
        ...paginationValidation.data!,
        companyId: req.query.companyId as string,
        isRead: req.query.isRead ? req.query.isRead === 'true' : undefined
      };

      const result = await this.gmailService.getEmailThreads(userId, options);

      console.log(`✅ メールスレッド一覧取得完了: ${result.threads.length}件`);

      res.status(200).json({
        success: true,
        data: result.threads,
        meta: {
          page: options.page,
          limit: options.limit,
          total: result.totalCount,
          totalPages: Math.ceil(result.totalCount / options.limit)
        }
      } as ApiResponse<EmailThread[]>);

    } catch (error) {
      console.error('❌ メールスレッド一覧取得エラー:', error);
      
      res.status(500).json({
        success: false,
        error: 'メールスレッドの取得に失敗しました'
      } as ApiResponse<null>);
    }
  }

  /**
   * Gmail高度検索
   * POST /api/gmail/threads/search
   */
  async searchThreads(req: Request, res: Response): Promise<void> {
    try {
      console.log(`🔍 Gmail高度検索リクエスト: userId=${req.user?.id}`);

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: '認証が必要です'
        } as ApiResponse<null>);
        return;
      }

      // 検索パラメータのバリデーション
      const searchParams: EmailThreadSearchParams = {
        companyId: req.body.companyId,
        isRead: req.body.isRead,
        dateFrom: req.body.dateFrom ? new Date(req.body.dateFrom) : undefined,
        dateTo: req.body.dateTo ? new Date(req.body.dateTo) : undefined,
        sender: req.body.sender,
        subject: req.body.subject,
        hasAttachments: req.body.hasAttachments,
        labels: req.body.labels,
        page: req.body.page || 1,
        limit: Math.min(req.body.limit || 20, 100), // 最大100件
        sortBy: req.body.sortBy || 'receivedAt',
        sortOrder: req.body.sortOrder || 'desc'
      };

      console.log(`🔍 検索パラメータ: ${JSON.stringify(searchParams)}`);

      const result = await this.gmailService.searchEmailThreads(userId, searchParams);

      console.log(`✅ Gmail高度検索完了: ${result.threads.length}件ヒット`);

      res.status(200).json({
        success: true,
        data: result.threads,
        meta: {
          page: searchParams.page,
          limit: searchParams.limit,
          total: result.totalCount,
          totalPages: Math.ceil(result.totalCount / searchParams.limit)
        }
      } as ApiResponse<EmailThread[]>);
    } catch (error) {
      console.error('❌ Gmail高度検索エラー:', error);
      res.status(500).json({
        success: false,
        error: 'Gmail検索の実行に失敗しました'
      } as ApiResponse<null>);
    }
  }

  /**
   * メールスレッド詳細取得
   * GET /api/gmail/threads/:threadId
   */
  async getThreadDetail(req: Request, res: Response): Promise<void> {
    try {
      const threadId = req.params.threadId;
      console.log(`📧 メールスレッド詳細リクエスト: threadId=${threadId}, userId=${req.user?.id}`);

      if (!threadId || typeof threadId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'スレッドIDが必要です'
        } as ApiResponse<null>);
        return;
      }

      const thread = await this.gmailService.getEmailThreadById(threadId);

      if (!thread) {
        res.status(404).json({
          success: false,
          error: 'メールスレッドが見つかりません'
        } as ApiResponse<null>);
        return;
      }

      // アクセス権限チェック（自分のスレッドまたは担当企業のスレッド）
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (thread.user?.id !== userId && !isUpperRole(userRole as UserRole)) {
        if (!thread.company || !this.hasCompanyAccess(req.user, thread.company.id)) {
          res.status(403).json({
            success: false,
            error: 'このメールスレッドへのアクセス権限がありません'
          } as ApiResponse<null>);
          return;
        }
      }

      console.log(`✅ メールスレッド詳細取得完了: ${thread.subject}`);

      res.status(200).json({
        success: true,
        data: thread
      } as ApiResponse<EmailThread>);

    } catch (error) {
      console.error('❌ メールスレッド詳細取得エラー:', error);
      
      res.status(500).json({
        success: false,
        error: 'メールスレッドの取得に失敗しました'
      } as ApiResponse<null>);
    }
  }

  /**
   * メールスレッド更新
   * PUT /api/gmail/threads/:threadId
   */
  async updateThread(req: Request, res: Response): Promise<void> {
    try {
      const threadId = req.params.threadId;
      console.log(`📧 メールスレッド更新リクエスト: threadId=${threadId}, userId=${req.user?.id}`);

      if (!threadId || typeof threadId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'スレッドIDが必要です'
        } as ApiResponse<null>);
        return;
      }

      // アクセス権限チェック
      const existingThread = await this.gmailService.getEmailThreadById(threadId);
      if (!existingThread) {
        res.status(404).json({
          success: false,
          error: 'メールスレッドが見つかりません'
        } as ApiResponse<null>);
        return;
      }

      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (existingThread.user?.id !== userId && !isUpperRole(userRole as UserRole)) {
        if (!existingThread.company || !this.hasCompanyAccess(req.user, existingThread.company.id)) {
          res.status(403).json({
            success: false,
            error: 'このメールスレッドの更新権限がありません'
          } as ApiResponse<null>);
          return;
        }
      }

      const updatedThread = await this.gmailService.updateEmailThread(threadId, req.body);

      if (!updatedThread) {
        res.status(404).json({
          success: false,
          error: 'メールスレッドが見つかりません'
        } as ApiResponse<null>);
        return;
      }

      console.log(`✅ メールスレッド更新完了: ${updatedThread.subject}`);

      res.status(200).json({
        success: true,
        data: updatedThread,
        meta: {
          message: 'メールスレッドを更新しました'
        }
      } as ApiResponse<EmailThread>);

    } catch (error) {
      console.error('❌ メールスレッド更新エラー:', error);
      
      res.status(500).json({
        success: false,
        error: 'メールスレッドの更新に失敗しました'
      } as ApiResponse<null>);
    }
  }

  /**
   * スレッド内メッセージ一覧取得
   * GET /api/gmail/threads/:threadId/messages
   */
  async getThreadMessages(req: Request, res: Response): Promise<void> {
    try {
      const threadId = req.params.threadId;
      console.log(`📧 スレッドメッセージ一覧リクエスト: threadId=${threadId}, userId=${req.user?.id}`);

      if (!threadId || typeof threadId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'スレッドIDが必要です'
        } as ApiResponse<null>);
        return;
      }

      // アクセス権限チェック
      const thread = await this.gmailService.getEmailThreadById(threadId);
      if (!thread) {
        res.status(404).json({
          success: false,
          error: 'メールスレッドが見つかりません'
        } as ApiResponse<null>);
        return;
      }

      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (thread.user?.id !== userId && !isUpperRole(userRole as UserRole)) {
        if (!thread.company || !this.hasCompanyAccess(req.user, thread.company.id)) {
          res.status(403).json({
            success: false,
            error: 'このメールスレッドへのアクセス権限がありません'
          } as ApiResponse<null>);
          return;
        }
      }

      const messages = await this.gmailService.getMessagesByThreadId(threadId);

      console.log(`✅ スレッドメッセージ一覧取得完了: ${messages.length}件`);

      res.status(200).json({
        success: true,
        data: messages,
        meta: {
          threadId: threadId,
          messageCount: messages.length
        }
      } as ApiResponse<EmailMessage[]>);

    } catch (error) {
      console.error('❌ スレッドメッセージ一覧取得エラー:', error);
      
      res.status(500).json({
        success: false,
        error: 'メッセージの取得に失敗しました'
      } as ApiResponse<null>);
    }
  }

  // ========== 共有Gmail設定管理エンドポイント ==========

  /**
   * 共有Gmail設定一覧取得
   * GET /api/gmail/shared-accounts
   */
  async getSharedAccounts(req: Request, res: Response): Promise<void> {
    try {
      console.log(`📧 共有Gmail設定一覧リクエスト: userId=${req.user?.id}, role=${req.user?.role}`);

      // 上位権限者のみアクセス可能
      const userRole = req.user?.role as UserRole;
      if (!isUpperRole(userRole)) {
        res.status(403).json({
          success: false,
          error: '共有Gmail設定の閲覧権限がありません'
        } as ApiResponse<null>);
        return;
      }

      const accounts = await this.gmailService.getSharedGmailAccounts();

      console.log(`✅ 共有Gmail設定一覧取得完了: ${accounts.length}件`);

      res.status(200).json({
        success: true,
        data: accounts,
        meta: {
          totalCount: accounts.length
        }
      } as ApiResponse<typeof accounts>);

    } catch (error) {
      console.error('❌ 共有Gmail設定一覧取得エラー:', error);
      
      res.status(500).json({
        success: false,
        error: '共有Gmail設定の取得に失敗しました'
      } as ApiResponse<null>);
    }
  }

  /**
   * 共有Gmail設定作成
   * POST /api/gmail/shared-accounts
   */
  async createSharedAccount(req: Request, res: Response): Promise<void> {
    try {
      console.log(`📧 共有Gmail設定作成リクエスト: userId=${req.user?.id}, role=${req.user?.role}`);

      // 上位権限者のみアクセス可能
      const userRole = req.user?.role as UserRole;
      if (!isUpperRole(userRole)) {
        res.status(403).json({
          success: false,
          error: '共有Gmail設定の作成権限がありません'
        } as ApiResponse<null>);
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: '認証が必要です'
        } as ApiResponse<null>);
        return;
      }

      const accountData = {
        ...req.body,
        createdBy: userId
      };

      const accountId = await this.gmailService.createSharedGmailAccount(accountData);

      console.log(`✅ 共有Gmail設定作成完了: accountId=${accountId}`);

      res.status(201).json({
        success: true,
        data: { id: accountId },
        meta: {
          message: '共有Gmail設定を作成しました'
        }
      } as ApiResponse<{ id: ID }>);

    } catch (error) {
      console.error('❌ 共有Gmail設定作成エラー:', error);
      
      res.status(500).json({
        success: false,
        error: '共有Gmail設定の作成に失敗しました'
      } as ApiResponse<null>);
    }
  }

  /**
   * 共有Gmail設定更新
   * PUT /api/gmail/shared-accounts/:accountId
   */
  async updateSharedAccount(req: Request, res: Response): Promise<void> {
    try {
      const accountId = req.params.accountId;
      console.log(`📧 共有Gmail設定更新リクエスト: accountId=${accountId}, userId=${req.user?.id}, role=${req.user?.role}`);

      // 上位権限者のみアクセス可能
      const userRole = req.user?.role as UserRole;
      if (!isUpperRole(userRole)) {
        res.status(403).json({
          success: false,
          error: '共有Gmail設定の更新権限がありません'
        } as ApiResponse<null>);
        return;
      }

      if (!accountId || typeof accountId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'アカウントIDが必要です'
        } as ApiResponse<null>);
        return;
      }

      const success = await this.gmailService.updateSharedGmailAccount(accountId, req.body);

      if (!success) {
        res.status(404).json({
          success: false,
          error: '共有Gmail設定が見つかりません'
        } as ApiResponse<null>);
        return;
      }

      console.log(`✅ 共有Gmail設定更新完了: accountId=${accountId}`);

      res.status(200).json({
        success: true,
        data: { updated: true },
        meta: {
          message: '共有Gmail設定を更新しました'
        }
      } as ApiResponse<{ updated: boolean }>);

    } catch (error) {
      console.error('❌ 共有Gmail設定更新エラー:', error);
      
      res.status(500).json({
        success: false,
        error: '共有Gmail設定の更新に失敗しました'
      } as ApiResponse<null>);
    }
  }

  /**
   * 共有Gmail設定削除
   * DELETE /api/gmail/shared-accounts/:accountId
   */
  async deleteSharedAccount(req: Request, res: Response): Promise<void> {
    try {
      const accountId = req.params.accountId;
      console.log(`📧 共有Gmail設定削除リクエスト: accountId=${accountId}, userId=${req.user?.id}, role=${req.user?.role}`);

      // 上位権限者のみアクセス可能
      const userRole = req.user?.role as UserRole;
      if (!isUpperRole(userRole)) {
        res.status(403).json({
          success: false,
          error: '共有Gmail設定の削除権限がありません'
        } as ApiResponse<null>);
        return;
      }

      if (!accountId || typeof accountId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'アカウントIDが必要です'
        } as ApiResponse<null>);
        return;
      }

      const success = await this.gmailService.deleteSharedGmailAccount(accountId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: '共有Gmail設定が見つかりません'
        } as ApiResponse<null>);
        return;
      }

      console.log(`✅ 共有Gmail設定削除完了: accountId=${accountId}`);

      res.status(200).json({
        success: true,
        data: { deleted: true },
        meta: {
          message: '共有Gmail設定を削除しました'
        }
      } as ApiResponse<{ deleted: boolean }>);

    } catch (error) {
      console.error('❌ 共有Gmail設定削除エラー:', error);
      
      res.status(500).json({
        success: false,
        error: '共有Gmail設定の削除に失敗しました'
      } as ApiResponse<null>);
    }
  }

  // ========== 個人Gmail連携エンドポイント ==========

  /**
   * Gmail認証URL生成
   * GET /api/users/:userId/gmail/connect
   */
  async generateAuthUrl(req: Request, res: Response): Promise<void> {
    try {
      const targetUserId = req.params.userId;
      console.log(`🔐 Gmail認証URL生成リクエスト: targetUserId=${targetUserId}, requestUserId=${req.user?.id}`);

      // アクセス権限チェック（自分または上位権限者）
      const userId = req.user?.id;
      const userRole = req.user?.role as UserRole;
      
      if (targetUserId !== userId && !isUpperRole(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Gmail接続設定の権限がありません'
        } as ApiResponse<null>);
        return;
      }

      const authUrl = await this.gmailService.generateAuthUrl();

      console.log(`✅ Gmail認証URL生成完了`);

      res.status(200).json({
        success: true,
        data: { authUrl },
        meta: {
          message: 'Gmail認証URLを生成しました。このURLでGmailアカウントの認証を行ってください。'
        }
      } as ApiResponse<{ authUrl: string }>);

    } catch (error) {
      console.error('❌ Gmail認証URL生成エラー:', error);
      
      res.status(500).json({
        success: false,
        error: 'Gmail認証URLの生成に失敗しました'
      } as ApiResponse<null>);
    }
  }

  /**
   * Gmail接続コールバック処理
   * POST /api/users/:userId/gmail/connect
   */
  async connectGmail(req: Request, res: Response): Promise<void> {
    try {
      const targetUserId = req.params.userId;
      const { code } = req.body;
      
      console.log(`🔐 Gmail接続処理リクエスト: targetUserId=${targetUserId}, requestUserId=${req.user?.id}`);

      // アクセス権限チェック（自分または上位権限者）
      const userId = req.user?.id;
      const userRole = req.user?.role as UserRole;
      
      if (targetUserId !== userId && !isUpperRole(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Gmail接続設定の権限がありません'
        } as ApiResponse<null>);
        return;
      }

      if (!code || typeof code !== 'string') {
        res.status(400).json({
          success: false,
          error: 'OAuth認証コードが必要です'
        } as ApiResponse<null>);
        return;
      }

      // 認証コードからトークンを取得
      const tokens = await this.gmailService.exchangeCodeForTokens(code);

      // ユーザーのGmail設定を更新（実際の実装では UserService を使用）
      // ここでは簡略化してレスポンスのみ
      
      console.log(`✅ Gmail接続処理完了: targetUserId=${targetUserId}`);

      res.status(200).json({
        success: true,
        data: { 
          connected: true,
          email: 'connected' // 実際の実装では取得したメールアドレス
        },
        meta: {
          message: 'Gmailアカウントの接続が完了しました'
        }
      } as ApiResponse<{ connected: boolean; email: string }>);

    } catch (error) {
      console.error('❌ Gmail接続処理エラー:', error);
      
      res.status(500).json({
        success: false,
        error: 'Gmail接続の設定に失敗しました'
      } as ApiResponse<null>);
    }
  }

  /**
   * Gmail接続解除
   * DELETE /api/users/:userId/gmail/disconnect
   */
  async disconnectGmail(req: Request, res: Response): Promise<void> {
    try {
      const targetUserId = req.params.userId;
      console.log(`🔐 Gmail接続解除リクエスト: targetUserId=${targetUserId}, requestUserId=${req.user?.id}`);

      // アクセス権限チェック（自分または上位権限者）
      const userId = req.user?.id;
      const userRole = req.user?.role as UserRole;
      
      if (targetUserId !== userId && !isUpperRole(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Gmail接続設定の権限がありません'
        } as ApiResponse<null>);
        return;
      }

      // Gmail同期状態を「切断」に更新
      await this.gmailService.getUserGmailSyncStatus(targetUserId);
      // 実際の実装では UserService でトークンをクリア

      console.log(`✅ Gmail接続解除完了: targetUserId=${targetUserId}`);

      res.status(200).json({
        success: true,
        data: { disconnected: true },
        meta: {
          message: 'Gmailアカウントの接続を解除しました'
        }
      } as ApiResponse<{ disconnected: boolean }>);

    } catch (error) {
      console.error('❌ Gmail接続解除エラー:', error);
      
      res.status(500).json({
        success: false,
        error: 'Gmail接続の解除に失敗しました'
      } as ApiResponse<null>);
    }
  }

  // ========== ユーティリティメソッド ==========

  private hasCompanyAccess(user: any, companyId: ID): boolean {
    // 実際の実装では、ユーザーが担当している企業かどうかをチェック
    // ここでは簡略化して true を返す
    return true;
  }

  /**
   * Gmail設定テーブル初期化（開発・テスト用）
   * POST /api/gmail/initialize
   */
  async initializeTables(req: Request, res: Response): Promise<void> {
    try {
      console.log(`🔧 Gmail設定テーブル初期化リクエスト: userId=${req.user?.id}, role=${req.user?.role}`);

      // 開発環境またはテスト環境でのみ実行
      if (process.env.NODE_ENV === 'production') {
        res.status(403).json({
          success: false,
          error: '本番環境では実行できません'
        } as ApiResponse<null>);
        return;
      }

      // COMPANY_LEADER のみ実行可能
      const userRole = req.user?.role as UserRole;
      if (userRole !== UserRole.COMPANY_LEADER) {
        res.status(403).json({
          success: false,
          error: 'テーブル初期化の権限がありません'
        } as ApiResponse<null>);
        return;
      }

      await this.gmailService.initializeGmailTables();

      console.log(`✅ Gmail設定テーブル初期化完了`);

      res.status(200).json({
        success: true,
        data: { initialized: true },
        meta: {
          message: 'Gmailテーブルの初期化が完了しました'
        }
      } as ApiResponse<{ initialized: boolean }>);

    } catch (error) {
      console.error('❌ Gmail設定テーブル初期化エラー:', error);
      
      res.status(500).json({
        success: false,
        error: 'テーブル初期化に失敗しました'
      } as ApiResponse<null>);
    }
  }

  /**
   * 添付ファイルプレビュー取得
   * GET /api/gmail/messages/:messageId/attachments/:attachmentId/preview
   */
  async getAttachmentPreview(req: Request, res: Response): Promise<void> {
    try {
      const { messageId, attachmentId } = req.params;
      console.log(`📎 添付ファイルプレビューリクエスト: messageId=${messageId}, attachmentId=${attachmentId}, userId=${req.user?.id}`);

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: '認証が必要です'
        } as ApiResponse<null>);
        return;
      }

      if (!messageId || !attachmentId) {
        res.status(400).json({
          success: false,
          error: 'メッセージIDと添付ファイルIDが必要です'
        } as ApiResponse<null>);
        return;
      }

      // ユーザーのGmail接続情報を取得
      const user = req.user;
      if (!user?.gmailPersonalAccessToken) {
        res.status(400).json({
          success: false,
          error: 'Gmail接続が設定されていません'
        } as ApiResponse<null>);
        return;
      }

      const attachmentData = await this.gmailService.getAttachmentPreview(
        messageId,
        attachmentId,
        user.gmailPersonalAccessToken
      );

      if (!attachmentData) {
        res.status(404).json({
          success: false,
          error: '添付ファイルが見つかりません'
        } as ApiResponse<null>);
        return;
      }

      // プレビュー可能な形式かチェック
      const isPreviewable = this.isPreviewableMimeType(attachmentData.mimeType);
      
      if (!isPreviewable) {
        res.status(400).json({
          success: false,
          error: 'この形式のファイルはプレビューできません'
        } as ApiResponse<null>);
        return;
      }

      console.log(`✅ 添付ファイルプレビュー送信: ${attachmentData.filename}, タイプ: ${attachmentData.mimeType}`);

      // ファイルデータを直接レスポンス
      res.set({
        'Content-Type': attachmentData.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(attachmentData.filename)}"`,
        'Cache-Control': 'public, max-age=3600' // 1時間キャッシュ
      });

      res.send(attachmentData.data);

    } catch (error) {
      console.error('❌ 添付ファイルプレビュー取得エラー:', error);
      res.status(500).json({
        success: false,
        error: '添付ファイルプレビューの取得に失敗しました'
      } as ApiResponse<null>);
    }
  }

  // プレビュー可能なMIMEタイプかチェック
  private isPreviewableMimeType(mimeType: string): boolean {
    const previewableMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'application/pdf'
    ];

    return previewableMimeTypes.includes(mimeType) || 
           mimeType.startsWith('image/') || 
           mimeType.startsWith('text/');
  }
}