/**
 * システムダッシュボード機能 - 統合テストスイート
 * P-004 システムダッシュボードページ
 * 
 * 実データベース・実環境での完全統合テスト
 * ★9統合テスト成功請負人への引き継ぎ用テストファイル
 */

const request = require('supertest');
const { Pool } = require('pg');
const { MilestoneTracker } = require('../../utils/MilestoneTracker.js');
const { dbTestHelper } = require('../../utils/db-test-helper.js');
const { testAuthHelper } = require('../../utils/test-auth-helper.js');
const { uniqueDataFactory } = require('../../utils/unique-data-factory.js');

// 実行中のサーバーのURLを使用
const SERVER_URL = 'http://localhost:3000';

// テストヘルパー初期化
const testTracker = new MilestoneTracker();

describe('システムダッシュボード機能統合テスト (P-004)', () => {
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

  /**
   * テストケース1: システム統計情報取得
   */
  describe('GET /api/system/stats - システム統計情報取得', () => {
    it('認証済みユーザーがシステム統計情報を取得できる', async () => {
      tracker.setOperation('システム統計情報取得テスト');

      // APIリクエスト送信
      tracker.setOperation('API呼び出し');
      const response = await request(SERVER_URL)
        .get('/api/system/stats')
        .set(authHeaders);
      tracker.mark('APIレスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('activeUsers');
      expect(response.body.data).toHaveProperty('systemUptime');
      expect(response.body.data).toHaveProperty('apiResponseTime');
      tracker.mark('レスポンス検証完了');

      // データ型検証
      tracker.setOperation('データ型検証');
      expect(typeof response.body.data.totalUsers).toBe('number');
      expect(typeof response.body.data.activeUsers).toBe('number');
      expect(typeof response.body.data.systemUptime).toBe('number');
      expect(typeof response.body.data.apiResponseTime).toBe('number');
      
      // データ整合性検証
      expect(response.body.data.activeUsers).toBeLessThanOrEqual(response.body.data.totalUsers);
      expect(response.body.data.systemUptime).toBeGreaterThanOrEqual(0);
      expect(response.body.data.apiResponseTime).toBeGreaterThan(0);
      tracker.mark('データ型検証完了');

      // パフォーマンスチェック（2秒以内）
      expect(tracker.checkThreshold('APIレスポンス受信', 2)).toBe(true);
    });

    it('認証なしではアクセスできない', async () => {
      tracker.setOperation('認証なしアクセステスト');

      const response = await request(SERVER_URL)
        .get('/api/system/stats');
      tracker.mark('認証なしアクセスレスポンス受信');

      // 認証エラー検証
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
      tracker.mark('認証エラー検証完了');
    });
  });
});
