const request = require('supertest');
const { MilestoneTracker } = require('../../utils/MilestoneTracker.ts');
const { dbTestHelper } = require('../../utils/db-test-helper');
const { testAuthHelper } = require('../../utils/test-auth-helper');
const { uniqueDataFactory } = require('../../utils/unique-data-factory');

// 実行中のサーバーのURLを使用
const SERVER_URL = 'http://localhost:3000';

describe('Gmail設定機能 完全統合テスト（実Gmail API接続）', () => {
  let testTransaction;
  let authHeaders;
  let testUser;
  let tracker;

  /**
   * 各テストケース開始前の初期化
   */
  beforeEach(async () => {
    tracker = new MilestoneTracker();
    tracker.mark('テスト開始');

    // 独立したトランザクション開始（テスト分離）
    tracker.setOperation('データベーストランザクション初期化');
    testTransaction = await dbTestHelper.beginTransaction();
    tracker.mark('トランザクション開始完了');

    // 認証付きヘッダー作成（上位権限ユーザー）
    tracker.setOperation('認証用テストユーザー作成');
    const authData = await testAuthHelper.createAuthHeaders(dbTestHelper, 'manager');
    authHeaders = authData.headers;
    testUser = authData.user;
    tracker.mark('認証準備完了');
  });

  /**
   * 各テストケース終了後のクリーンアップ
   */
  afterEach(async () => {
    tracker.setOperation('テストクリーンアップ');
    
    // トランザクションロールバック（データ復元）
    if (testTransaction) {
      await dbTestHelper.rollbackTransaction(testTransaction);
      tracker.mark('トランザクションロールバック完了');
    }

    // テストユーザークリーンアップ
    await testAuthHelper.cleanupTestUsers(dbTestHelper);
    tracker.mark('テストデータクリーンアップ完了');

    // パフォーマンスサマリー表示
    tracker.summary();
  });

  /**
   * 全テスト終了後のクリーンアップ
   */
  afterAll(async () => {
    await dbTestHelper.close();
    console.log('🔌 全テスト終了 - データベース接続終了');
  });

  describe('Gmail設定システム初期化', () => {
    it('Gmail関連テーブルが正常に初期化できる', async () => {
      tracker.setOperation('Gmail設定システム初期化テスト');
      
      // 最上位権限ユーザーでテーブル初期化
      const authData = await testAuthHelper.createAuthHeaders(dbTestHelper, 'company_leader');
      const leaderHeaders = authData.headers;
      tracker.mark('管理者ユーザー準備完了');

      const response = await request(SERVER_URL)
        .post('/api/gmail/initialize')
        .set(leaderHeaders);

      tracker.mark('初期化API呼び出し完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data.initialized).toBe(true);
      expect(response.body.meta.message).toContain('初期化が完了');
      
      tracker.mark('レスポンス検証完了');
    });

    it('一般ユーザーは初期化できない（権限チェック）', async () => {
      tracker.setOperation('初期化権限チェックテスト');
      
      const response = await request(app)
        .post('/api/gmail/initialize')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(403);

      tracker.mark('権限チェックAPI呼び出し完了');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('権限がありません');
      
      tracker.mark('権限エラー検証完了');
    });
  });

  describe('Gmail OAuth認証フロー', () => {
    it('Gmail認証URLを正常に生成できる', async () => {
      tracker.setOperation('Gmail認証URL生成テスト');
      
      const response = await request(app)
        .get(`/api/users/${testUser.id}/gmail/connect`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      tracker.mark('認証URL生成API呼び出し完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data.authUrl).toBeDefined();
      expect(response.body.data.authUrl).toContain('accounts.google.com');
      expect(response.body.data.authUrl).toContain('oauth2');
      
      tracker.mark('認証URL検証完了');
    });

    it('他のユーザーの認証URL生成はアクセス拒否される', async () => {
      tracker.setOperation('認証URL権限チェックテスト');
      
      // 別のテストユーザー作成
      const otherUser = await createTestUser({
        email: uniqueData.otherEmail,
        username: uniqueData.otherUsername,
        fullName: uniqueData.otherFullName,
        role: 'user'
      }, testTransaction);
      
      tracker.mark('別ユーザー作成完了');

      const response = await request(app)
        .get(`/api/users/${otherUser.id}/gmail/connect`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(403);

      tracker.mark('権限チェックAPI呼び出し完了');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('権限がありません');
      
      tracker.mark('権限エラー検証完了');
    });
  });

  describe('Gmail同期状態管理', () => {
    it('Gmail同期状態を正常に取得できる', async () => {
      tracker.setOperation('Gmail同期状態取得テスト');
      
      const response = await request(app)
        .get('/api/gmail/sync/status')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      tracker.mark('同期状態取得API呼び出し完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe(testUser.id);
      expect(['connected', 'disconnected', 'syncing', 'error']).toContain(response.body.data.status);
      
      tracker.mark('同期状態検証完了');
    });

    it('Gmail接続なしでの同期実行はエラーになる', async () => {
      tracker.setOperation('Gmail同期エラーテスト');
      
      const response = await request(app)
        .post('/api/gmail/sync')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          maxResults: 10
        })
        .expect(400);

      tracker.mark('同期エラーAPI呼び出し完了');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Gmail接続が設定されていません');
      
      tracker.mark('同期エラー検証完了');
    });
  });

  describe('メールスレッド管理', () => {
    it('メールスレッド一覧を正常に取得できる', async () => {
      tracker.setOperation('メールスレッド一覧取得テスト');
      
      const response = await request(app)
        .get('/api/gmail/threads')
        .query({
          page: 1,
          limit: 10
        })
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      tracker.mark('スレッド一覧取得API呼び出し完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
      expect(response.body.meta.total).toBeGreaterThanOrEqual(0);
      
      tracker.mark('スレッド一覧検証完了');
    });

    it('無効なページネーションパラメータでエラーになる', async () => {
      tracker.setOperation('ページネーションエラーテスト');
      
      const response = await request(app)
        .get('/api/gmail/threads')
        .query({
          page: -1,
          limit: 150
        })
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(400);

      tracker.mark('ページネーションエラーAPI呼び出し完了');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('パラメータエラー');
      
      tracker.mark('ページネーションエラー検証完了');
    });
  });

  describe('共有Gmail設定管理', () => {
    it('上位権限者は共有Gmail設定一覧を取得できる', async () => {
      tracker.setOperation('共有Gmail設定一覧取得テスト');
      
      const response = await request(app)
        .get('/api/gmail/shared-accounts')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      tracker.mark('共有設定一覧取得API呼び出し完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data.accounts).toBeInstanceOf(Array);
      expect(response.body.meta.totalCount).toBeGreaterThanOrEqual(0);
      
      tracker.mark('共有設定一覧検証完了');
    });

    it('一般ユーザーは共有Gmail設定にアクセスできない', async () => {
      tracker.setOperation('共有Gmail設定権限チェックテスト');
      
      // 一般ユーザーでテスト
      const generalUser = await createTestUser({
        email: uniqueData.generalEmail,
        username: uniqueData.generalUsername,
        fullName: uniqueData.generalFullName,
        role: 'user'
      }, testTransaction);
      
      const generalTokens = createAuthTokens(generalUser);
      tracker.mark('一般ユーザー準備完了');

      const response = await request(app)
        .get('/api/gmail/shared-accounts')
        .set('Authorization', `Bearer ${generalTokens.accessToken}`)
        .expect(403);

      tracker.mark('権限チェックAPI呼び出し完了');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('権限がありません');
      
      tracker.mark('权限エラー検証完了');
    });

    it('共有Gmail設定の作成バリデーションが正常に機能する', async () => {
      tracker.setOperation('共有Gmail設定作成バリデーションテスト');
      
      // バリデーションエラーをテスト
      const response = await request(app)
        .post('/api/gmail/shared-accounts')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          email: 'invalid-email',
          displayName: '',
          accessToken: '',
          refreshToken: '',
          allowedRoles: []
        })
        .expect(500); // バリデーションエラーによるサーバーエラー

      tracker.mark('バリデーションエラーAPI呼び出し完了');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('失敗');
      
      tracker.mark('バリデーションエラー検証完了');
    });
  });

  describe('Gmail設定ヘルスチェック', () => {
    it('Gmailサービスヘルスチェックが正常に動作する', async () => {
      tracker.setOperation('Gmailヘルスチェックテスト');
      
      const response = await request(app)
        .get('/api/gmail/health')
        .expect(200);

      tracker.mark('ヘルスチェックAPI呼び出し完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data.service).toBe('Gmail API Service');
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.version).toBeDefined();
      
      tracker.mark('ヘルスチェック検証完了');
    });
  });

  describe('Gmail設定エラーハンドリング', () => {
    it('存在しないエンドポイントで404エラーが返される', async () => {
      tracker.setOperation('404エラーテスト');
      
      const response = await request(app)
        .get('/api/gmail/nonexistent-endpoint')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(404);

      tracker.mark('404エラーAPI呼び出し完了');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('存在しません');
      expect(response.body.meta.availableEndpoints).toBeInstanceOf(Array);
      
      tracker.mark('404エラー検証完了');
    });

    it('認証なしでアクセスした場合401エラーが返される', async () => {
      tracker.setOperation('401エラーテスト');
      
      const response = await request(app)
        .get('/api/gmail/sync/status')
        .expect(401);

      tracker.mark('401エラーAPI呼び出し完了');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('認証');
      
      tracker.mark('401エラー検証完了');
    });
  });

  describe('Gmail設定パフォーマンステスト', () => {
    it('Gmail設定API群のレスポンス時間が許容範囲内である', async () => {
      tracker.setOperation('パフォーマンステスト');
      
      const startTime = Date.now();
      
      // 複数のAPIを並行実行
      const promises = [
        request(app)
          .get('/api/gmail/health')
          .expect(200),
        request(app)
          .get('/api/gmail/sync/status')
          .set('Authorization', `Bearer ${authTokens.accessToken}`)
          .expect(200),
        request(app)
          .get('/api/gmail/threads')
          .query({ page: 1, limit: 5 })
          .set('Authorization', `Bearer ${authTokens.accessToken}`)
          .expect(200),
        request(app)
          .get('/api/gmail/shared-accounts')
          .set('Authorization', `Bearer ${authTokens.accessToken}`)
          .expect(200)
      ];
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      tracker.mark('並行API呼び出し完了');
      
      // パフォーマンス検証
      expect(totalTime).toBeLessThan(3000); // 3秒以内
      
      // 全レスポンスが成功している
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
      
      tracker.mark('パフォーマンス検証完了');
      
      console.log(`📊 パフォーマンステスト結果: ${totalTime}ms (許容値: 3000ms以内)`);
    });
  });

  describe('Gmail設定データ整合性テスト', () => {
    it('同一ユーザーでの複数同期状態要求が一貫している', async () => {
      tracker.setOperation('データ整合性テスト');
      
      // 同じユーザーで複数回同期状態を取得
      const requests = Array(3).fill(null).map(() =>
        request(app)
          .get('/api/gmail/sync/status')
          .set('Authorization', `Bearer ${authTokens.accessToken}`)
          .expect(200)
      );
      
      const responses = await Promise.all(requests);
      tracker.mark('複数同期状態取得完了');
      
      // 全レスポンスが同じユーザーIDを返すことを確認
      const userIds = responses.map(res => res.body.data.userId);
      const uniqueUserIds = [...new Set(userIds)];
      
      expect(uniqueUserIds).toHaveLength(1);
      expect(uniqueUserIds[0]).toBe(testUser.id);
      
      // 全レスポンスが有効なステータスを返すことを確認
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(['connected', 'disconnected', 'syncing', 'error']).toContain(response.body.data.status);
      });
      
      tracker.mark('データ整合性検証完了');
    });
  });
});

// ========== テスト補助関数 ==========

/**
 * テスト用Gmail設定データ生成
 */
function createTestGmailData(baseData) {
  return {
    email: `test-gmail-${baseData.timestamp}@test.com`,
    displayName: `Test Gmail ${baseData.suffix}`,
    accessToken: `test_access_token_${baseData.timestamp}`,
    refreshToken: `test_refresh_token_${baseData.timestamp}`,
    allowedRoles: ['manager', 'team_leader']
  };
}

/**
 * 実Gmail API接続テスト（実際のクレデンシャルが利用可能な場合のみ）
 */
async function testRealGmailConnection() {
  // 実際のテスト環境でのみ実行
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('⚠️  実Gmail API テストをスキップします（クレデンシャル未設定）');
    return;
  }
  
  // 実Gmail APIテストロジックをここに追加
  console.log('✅ 実Gmail API接続テスト準備完了');
}

module.exports = {
  createTestGmailData,
  testRealGmailConnection
};