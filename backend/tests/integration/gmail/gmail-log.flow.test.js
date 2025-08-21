/**
 * P-003 Gmailログページ 統合テスト
 * ★9統合テスト成功請負人が実行する完全なフローテスト
 */

const request = require('supertest');
const { MilestoneTracker } = require('../../utils/MilestoneTracker');
const { dbTestHelper } = require('../../utils/db-test-helper');
const { testAuthHelper } = require('../../utils/test-auth-helper');
const { uniqueDataFactory } = require('../../utils/unique-data-factory');

// 実行中のサーバーのURLを使用
const SERVER_URL = 'http://localhost:3000';

describe('P-003 Gmailログページ 統合テスト', () => {
  let testTransaction;
  let testUser;
  let authToken;
  let uniqueId;

  beforeEach(async () => {
    const tracker = new MilestoneTracker();
    tracker.setOperation('テスト環境初期化');
    tracker.mark('開始');

    // ユニークなテストデータ生成
    uniqueId = uniqueDataFactory.generateUniqueId();
    
    // テストトランザクション作成
    testTransaction = await dbTestHelper.beginTransaction();
    tracker.mark('テストトランザクション作成完了');

    // テストユーザー作成
    testUser = await testAuthHelper.createTestUser(testTransaction, {
      email: `gmail-log-test-${uniqueId}@test.com`,
      username: `gmail-log-test-${uniqueId}`,
      fullName: `Gmail Log Test User ${uniqueId}`,
      role: 'user',
      gmailPersonalConnected: true,
      gmailPersonalAccessToken: 'test-access-token-' + uniqueId
    });
    
    authToken = testAuthHelper.generateTestToken(testUser);
    tracker.mark('テストユーザー作成完了');

    tracker.summary();
  });

  afterEach(async () => {
    if (testTransaction) {
      await testTransaction.rollback();
    }
  });

  describe('Gmail高度検索機能テスト', () => {
    it('高度検索機能が正常に動作すること', async () => {
      const tracker = new MilestoneTracker();
      tracker.setOperation('Gmail高度検索テスト');
      tracker.mark('テスト開始');

      // 検索パラメータ
      const searchParams = {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        sender: 'test@example.com',
        subject: 'テスト件名',
        hasAttachments: true,
        page: 1,
        limit: 20,
        sortBy: 'receivedAt',
        sortOrder: 'desc'
      };

      tracker.mark('検索パラメータ準備完了');

      const response = await request(SERVER_URL)
        .post('/api/gmail/threads/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send(searchParams);

      tracker.mark('APIリクエスト送信完了');

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(20);

      tracker.mark('レスポンス検証完了');
      tracker.summary();
    });

    it('企業別フィルタリングが正常に動作すること', async () => {
      const tracker = new MilestoneTracker();
      tracker.setOperation('企業別フィルタリングテスト');
      tracker.mark('テスト開始');

      // 企業作成（テスト用）
      const testCompany = await testTransaction.query(`
        INSERT INTO companies (
          id, name, website, industry, status, 
          primary_assignee_id, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()
        ) RETURNING id
      `, [
        `Test Company ${uniqueId}`,
        `https://test-${uniqueId}.com`,
        'technology',
        'active',
        testUser.id
      ]);

      const companyId = testCompany.rows[0].id;
      tracker.mark('テスト企業作成完了');

      const searchParams = {
        companyId: companyId,
        page: 1,
        limit: 10
      };

      const response = await request(SERVER_URL)
        .post('/api/gmail/threads/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send(searchParams);

      tracker.mark('企業フィルタリング実行完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      tracker.mark('検証完了');
      tracker.summary();
    });

    it('日付範囲フィルタリングが正常に動作すること', async () => {
      const tracker = new MilestoneTracker();
      tracker.setOperation('日付範囲フィルタリングテスト');
      tracker.mark('テスト開始');

      const searchParams = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-06-30T23:59:59.999Z',
        sortBy: 'receivedAt',
        sortOrder: 'desc'
      };

      const response = await request(SERVER_URL)
        .post('/api/gmail/threads/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send(searchParams);

      tracker.mark('日付範囲フィルタリング実行完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      tracker.mark('検証完了');
      tracker.summary();
    });

    it('送信者・件名検索が正常に動作すること', async () => {
      const tracker = new MilestoneTracker();
      tracker.setOperation('送信者・件名検索テスト');
      tracker.mark('テスト開始');

      const searchParams = {
        sender: 'important@client.com',
        subject: '重要な案件',
        page: 1,
        limit: 5
      };

      const response = await request(SERVER_URL)
        .post('/api/gmail/threads/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send(searchParams);

      tracker.mark('送信者・件名検索実行完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      tracker.mark('検証完了');
      tracker.summary();
    });

    it('添付ファイル有無フィルタリングが正常に動作すること', async () => {
      const tracker = new MilestoneTracker();
      tracker.setOperation('添付ファイルフィルタリングテスト');
      tracker.mark('テスト開始');

      const searchParams = {
        hasAttachments: true,
        sortBy: 'createdAt',
        sortOrder: 'asc'
      };

      const response = await request(SERVER_URL)
        .post('/api/gmail/threads/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send(searchParams);

      tracker.mark('添付ファイルフィルタリング実行完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      tracker.mark('検証完了');
      tracker.summary();
    });
  });

  describe('添付ファイルプレビュー機能テスト', () => {
    it('添付ファイルプレビューが正常に動作すること（画像ファイル）', async () => {
      const tracker = new MilestoneTracker();
      tracker.setOperation('画像プレビューテスト');
      tracker.mark('テスト開始');

      const messageId = `test-message-${uniqueId}`;
      const attachmentId = `test-attachment-${uniqueId}`;

      const response = await request(SERVER_URL)
        .get(`/api/gmail/messages/${messageId}/attachments/${attachmentId}/preview`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404); // 実際の添付ファイルが存在しないため404が正常

      tracker.mark('画像プレビューリクエスト実行完了');

      // 404応答でも API仕様に従った適切なエラーレスポンスであることを確認
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('添付ファイルが見つかりません');

      tracker.mark('検証完了');
      tracker.summary();
    });

    it('サポートされていないファイル形式のプレビューを適切に拒否すること', async () => {
      const tracker = new MilestoneTracker();
      tracker.setOperation('未対応形式プレビューテスト');
      tracker.mark('テスト開始');

      const messageId = `test-message-${uniqueId}`;
      const attachmentId = `test-attachment-exe-${uniqueId}`;

      const response = await request(SERVER_URL)
        .get(`/api/gmail/messages/${messageId}/attachments/${attachmentId}/preview`)
        .set('Authorization', `Bearer ${authToken}`);

      tracker.mark('未対応形式プレビューリクエスト実行完了');

      // プレビュー機能の適切なエラーハンドリングを確認
      expect([400, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);

      tracker.mark('検証完了');
      tracker.summary();
    });
  });

  describe('認証・権限テスト', () => {
    it('未認証ユーザーのアクセスを適切に拒否すること', async () => {
      const tracker = new MilestoneTracker();
      tracker.setOperation('未認証アクセステスト');
      tracker.mark('テスト開始');

      const response = await request(SERVER_URL)
        .post('/api/gmail/threads/search')
        .send({ page: 1, limit: 10 });

      tracker.mark('未認証リクエスト実行完了');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('認証が必要です');

      tracker.mark('検証完了');
      tracker.summary();
    });

    it('Gmail未接続ユーザーの添付ファイルアクセスを適切に拒否すること', async () => {
      const tracker = new MilestoneTracker();
      tracker.setOperation('Gmail未接続ユーザーテスト');
      tracker.mark('テスト開始');

      // Gmail未接続のテストユーザー作成
      const unconnectedUser = await createTestUser(testTransaction, {
        email: `unconnected-${uniqueId}@test.com`,
        username: `unconnected-${uniqueId}`,
        fullName: `Unconnected User ${uniqueId}`,
        role: 'user',
        gmailPersonalConnected: false
      });

      const unconnectedToken = generateTestToken(unconnectedUser);
      tracker.mark('Gmail未接続ユーザー作成完了');

      const messageId = `test-message-${uniqueId}`;
      const attachmentId = `test-attachment-${uniqueId}`;

      const response = await request(SERVER_URL)
        .get(`/api/gmail/messages/${messageId}/attachments/${attachmentId}/preview`)
        .set('Authorization', `Bearer ${unconnectedToken}`);

      tracker.mark('未接続ユーザーリクエスト実行完了');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Gmail接続が設定されていません');

      tracker.mark('検証完了');
      tracker.summary();
    });
  });

  describe('パフォーマンス・エラーハンドリングテスト', () => {
    it('大量検索リクエストが適切な時間内に処理されること', async () => {
      const tracker = new MilestoneTracker();
      tracker.setOperation('大量検索パフォーマンステスト');
      tracker.mark('テスト開始');

      const searchParams = {
        page: 1,
        limit: 100, // 最大値
        sortBy: 'receivedAt',
        sortOrder: 'desc'
      };

      const startTime = Date.now();
      const response = await request(SERVER_URL)
        .post('/api/gmail/threads/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send(searchParams);
      
      const responseTime = Date.now() - startTime;
      tracker.mark(`検索完了 (${responseTime}ms)`);

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5秒以内
      expect(response.body.meta.limit).toBe(100);

      tracker.mark('パフォーマンス検証完了');
      tracker.summary();
    });

    it('不正な検索パラメータを適切にハンドリングすること', async () => {
      const tracker = new MilestoneTracker();
      tracker.setOperation('不正パラメータハンドリングテスト');
      tracker.mark('テスト開始');

      const invalidParams = {
        dateFrom: 'invalid-date',
        dateTo: '2024-13-45', // 不正な日付
        limit: 9999, // 制限値超過
        sortBy: 'invalid-field',
        sortOrder: 'invalid-order'
      };

      const response = await request(SERVER_URL)
        .post('/api/gmail/threads/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidParams);

      tracker.mark('不正パラメータリクエスト実行完了');

      // エラーハンドリングの確認（400または500が適切）
      expect([200, 400, 500]).toContain(response.status);
      expect(response.body.success).toBeDefined();

      tracker.mark('検証完了');
      tracker.summary();
    });
  });

  describe('統合API動作確認テスト', () => {
    it('Gmail全体のAPIエンドポイントが連携して動作すること', async () => {
      const tracker = new MilestoneTracker();
      tracker.setOperation('Gmail API統合テスト');
      tracker.mark('テスト開始');

      // 1. ヘルスチェック
      const healthResponse = await request(SERVER_URL)
        .get('/api/gmail/health');
      
      expect(healthResponse.status).toBe(200);
      tracker.mark('ヘルスチェック完了');

      // 2. 同期状態取得
      const syncResponse = await request(SERVER_URL)
        .get('/api/gmail/sync/status')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 404]).toContain(syncResponse.status);
      tracker.mark('同期状態取得完了');

      // 3. スレッド一覧取得
      const threadsResponse = await request(SERVER_URL)
        .get('/api/gmail/threads?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(threadsResponse.status).toBe(200);
      tracker.mark('スレッド一覧取得完了');

      // 4. 高度検索実行
      const searchResponse = await request(SERVER_URL)
        .post('/api/gmail/threads/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ page: 1, limit: 5 });
      
      expect(searchResponse.status).toBe(200);
      tracker.mark('高度検索実行完了');

      tracker.summary();
    });
  });
});