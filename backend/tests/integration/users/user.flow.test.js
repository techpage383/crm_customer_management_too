/**
 * ユーザー管理機能 統合テスト
 * P-010 ユーザー管理ページの完全なフローテスト
 * 
 * 【重要】このテストは実データベースと実環境を使用します
 * モック機能は一切使用せず、★9統合テスト成功請負人が実行・成功させる設計です
 */

const request = require('supertest');
const express = require('express');
const { MilestoneTracker } = require('../../utils/MilestoneTracker.ts');
const { dbTestHelper } = require('../../utils/db-test-helper');
const { testAuthHelper } = require('../../utils/test-auth-helper');
const { uniqueDataFactory } = require('../../utils/unique-data-factory');

// 実行中のサーバーのURLを使用
const SERVER_URL = 'http://localhost:3000';

describe('ユーザー管理API 統合テスト', () => {
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
   * テストケース1: ユーザー一覧取得
   */
  describe('GET /api/users - ユーザー一覧取得', () => {
    it('正常にユーザー一覧を取得できる', async () => {
      tracker.setOperation('ユーザー一覧取得テスト');

      // テスト用ユーザーデータを事前に作成
      tracker.setOperation('テストデータ準備');
      const testUsersData = uniqueDataFactory.generateBulkData('user', 5);
      
      for (const userData of testUsersData) {
        await testAuthHelper.createTestUser(dbTestHelper, userData);
      }
      tracker.mark('テストユーザー作成完了');

      // APIリクエスト送信
      tracker.setOperation('API呼び出し');
      const response = await request(SERVER_URL)
        .get('/api/users')
        .set(authHeaders)
        .query({
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
      tracker.mark('APIレスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('totalCount');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      tracker.mark('レスポンス検証完了');

      // データ内容検証
      tracker.setOperation('データ内容検証');
      const firstUser = response.body.data.users[0];
      expect(firstUser).toHaveProperty('id');
      expect(firstUser).toHaveProperty('email');
      expect(firstUser).toHaveProperty('fullName');
      expect(firstUser).toHaveProperty('role');
      expect(firstUser).not.toHaveProperty('password');
      expect(firstUser).not.toHaveProperty('password_hash');
      tracker.mark('データ内容検証完了');

      // パフォーマンスチェック（10秒以内）統合テスト環境用
      expect(tracker.checkThreshold('APIレスポンス受信', 10)).toBe(true);
    });

    it('検索クエリでフィルタリングできる', async () => {
      tracker.setOperation('検索フィルタリングテスト');

      // 特定可能なテストユーザー作成
      tracker.setOperation('特定可能テストユーザー作成');
      const searchableUser = await testAuthHelper.createTestUser(dbTestHelper, {
        fullName: 'FINDME テストユーザー',
        email: 'findme-user@test.com',
        department: 'SEARCH部署'
      });
      tracker.mark('検索対象ユーザー作成完了');

      // 検索APIリクエスト
      tracker.setOperation('検索API呼び出し');
      const response = await request(SERVER_URL)
        .get('/api/users')
        .set(authHeaders)
        .query({
          query: 'FINDME',
          page: 1,
          limit: 10
        });
      tracker.mark('検索APIレスポンス受信');

      // 検索結果検証
      tracker.setOperation('検索結果検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      
      const foundUser = response.body.data.users.find(u => u.email === searchableUser.email);
      expect(foundUser).toBeTruthy();
      expect(foundUser.fullName).toContain('FINDME');
      tracker.mark('検索結果検証完了');
    });
  });

  /**
   * テストケース2: ユーザー作成
   */
  describe('POST /api/users - ユーザー作成', () => {
    it('正常に新規ユーザーを作成できる', async () => {
      tracker.setOperation('ユーザー作成テスト');

      // 新規ユーザーデータ準備
      tracker.setOperation('新規ユーザーデータ準備');
      const newUserData = uniqueDataFactory.generateUniqueUserData({
        role: 'team_leader',
        department: '新規作成テスト部署'
      });
      tracker.mark('新規ユーザーデータ準備完了');

      // ユーザー作成APIリクエスト
      tracker.setOperation('ユーザー作成API呼び出し');
      const response = await request(SERVER_URL)
        .post('/api/users')
        .set(authHeaders)
        .send(newUserData);
      tracker.mark('ユーザー作成APIレスポンス受信');

      // レスポンス検証
      tracker.setOperation('作成レスポンス検証');
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(newUserData.email);
      expect(response.body.data.username).toBe(newUserData.username);
      expect(response.body.data.fullName).toBe(newUserData.fullName);
      expect(response.body.data.role).toBe(newUserData.role);
      expect(response.body.data).not.toHaveProperty('password');
      tracker.mark('作成レスポンス検証完了');

      // データベース確認
      tracker.setOperation('データベース確認');
      const dbUser = await dbTestHelper.query(
        'SELECT * FROM users WHERE id = $1',
        [response.body.data.id],
        testTransaction
      );
      expect(dbUser.rows.length).toBe(1);
      expect(dbUser.rows[0].email).toBe(newUserData.email);
      expect(dbUser.rows[0].password_hash).toBeTruthy();
      expect(dbUser.rows[0].password_hash).not.toBe(newUserData.password);
      tracker.mark('データベース確認完了');

      // パフォーマンスチェック（3秒以内）
      expect(tracker.checkThreshold('ユーザー作成APIレスポンス受信', 3)).toBe(true);
    });

    it('重複メールアドレスでエラーになる', async () => {
      tracker.setOperation('重複メールアドレステスト');

      // 既存ユーザー作成
      tracker.setOperation('既存ユーザー作成');
      const existingUser = await testAuthHelper.createTestUser(dbTestHelper);
      tracker.mark('既存ユーザー作成完了');

      // 同じメールアドレスで新規ユーザー作成試行
      tracker.setOperation('重複ユーザー作成試行');
      const duplicateUserData = uniqueDataFactory.generateUniqueUserData({
        email: existingUser.email // 既存ユーザーと同じメールアドレス
      });

      const response = await request(SERVER_URL)
        .post('/api/users')
        .set(authHeaders)
        .send(duplicateUserData);
      tracker.mark('重複ユーザー作成レスポンス受信');

      // エラーレスポンス検証
      tracker.setOperation('重複エラー検証');
      expect(response.status).toBe(409); // Conflict
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('DUPLICATE_USER');
      expect(response.body.error).toContain('既に使用されています');
      tracker.mark('重複エラー検証完了');
    });

    it('不正なデータでバリデーションエラーになる', async () => {
      tracker.setOperation('バリデーションエラーテスト');

      const invalidUserData = {
        email: 'invalid-email', // 不正なメールアドレス
        username: 'ab', // 短すぎるユーザー名
        fullName: '', // 空の名前
        password: '123', // 短すぎるパスワード
        role: 'invalid_role' // 存在しない役割
      };

      const response = await request(SERVER_URL)
        .post('/api/users')
        .set(authHeaders)
        .send(invalidUserData);
      tracker.mark('バリデーションエラーレスポンス受信');

      // バリデーションエラー検証
      tracker.setOperation('バリデーションエラー検証');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      tracker.mark('バリデーションエラー検証完了');
    });
  });

  /**
   * テストケース3: ユーザー詳細取得
   */
  describe('GET /api/users/:id - ユーザー詳細取得', () => {
    it('正常にユーザー詳細を取得できる', async () => {
      tracker.setOperation('ユーザー詳細取得テスト');

      // テスト対象ユーザー作成
      tracker.setOperation('詳細取得対象ユーザー作成');
      const targetUser = await testAuthHelper.createTestUser(dbTestHelper, {
        role: 'team_leader',
        department: '詳細取得テスト部署'
      });
      tracker.mark('詳細取得対象ユーザー作成完了');

      // ユーザー詳細取得APIリクエスト
      tracker.setOperation('ユーザー詳細取得API呼び出し');
      const response = await request(SERVER_URL)
        .get(`/api/users/${targetUser.id}`)
        .set(authHeaders);
      tracker.mark('ユーザー詳細取得APIレスポンス受信');

      // レスポンス検証
      tracker.setOperation('詳細取得レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(targetUser.id);
      expect(response.body.data.email).toBe(targetUser.email);
      expect(response.body.data.fullName).toBe(targetUser.full_name);
      expect(response.body.data.role).toBe(targetUser.role);
      expect(response.body.data.department).toBe(targetUser.department);
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('password_hash');
      tracker.mark('詳細取得レスポンス検証完了');
    });

    it('存在しないユーザーIDで404エラーになる', async () => {
      tracker.setOperation('存在しないユーザーID取得テスト');

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(SERVER_URL)
        .get(`/api/users/${nonExistentId}`)
        .set(authHeaders);
      tracker.mark('存在しないユーザーAPIレスポンス受信');

      // 404エラー検証
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_NOT_FOUND');
      tracker.mark('404エラー検証完了');
    });
  });

  /**
   * テストケース4: ユーザー更新
   */
  describe('PUT /api/users/:id - ユーザー更新', () => {
    it('正常にユーザー情報を更新できる', async () => {
      tracker.setOperation('ユーザー更新テスト');

      // 更新対象ユーザー作成
      tracker.setOperation('更新対象ユーザー作成');
      const targetUser = await testAuthHelper.createTestUser(dbTestHelper);
      tracker.mark('更新対象ユーザー作成完了');

      // 更新データ準備
      tracker.setOperation('更新データ準備');
      const updateData = {
        fullName: '更新後テストユーザー',
        department: '更新後部署',
        phoneNumber: '090-1234-5678',
        role: 'team_leader'
      };
      tracker.mark('更新データ準備完了');

      // ユーザー更新APIリクエスト
      tracker.setOperation('ユーザー更新API呼び出し');
      const response = await request(SERVER_URL)
        .put(`/api/users/${targetUser.id}`)
        .set(authHeaders)
        .send(updateData);
      tracker.mark('ユーザー更新APIレスポンス受信');

      // レスポンス検証
      tracker.setOperation('更新レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(targetUser.id);
      expect(response.body.data.fullName).toBe(updateData.fullName);
      expect(response.body.data.department).toBe(updateData.department);
      expect(response.body.data.phoneNumber).toBe(updateData.phoneNumber);
      expect(response.body.data.role).toBe(updateData.role);
      tracker.mark('更新レスポンス検証完了');

      // データベース確認
      tracker.setOperation('更新データベース確認');
      const dbUser = await dbTestHelper.query(
        'SELECT * FROM users WHERE id = $1',
        [targetUser.id],
        testTransaction
      );
      expect(dbUser.rows[0].full_name).toBe(updateData.fullName);
      expect(dbUser.rows[0].department).toBe(updateData.department);
      expect(dbUser.rows[0].phone_number).toBe(updateData.phoneNumber);
      expect(dbUser.rows[0].role).toBe(updateData.role);
      tracker.mark('更新データベース確認完了');
    });

    it('パスワード更新ができる', async () => {
      tracker.setOperation('パスワード更新テスト');

      // パスワード更新対象ユーザー作成
      const targetUser = await testAuthHelper.createTestUser(dbTestHelper);
      tracker.mark('パスワード更新対象ユーザー作成完了');

      const newPassword = 'NewPassword123!';
      const updateData = { password: newPassword };

      // パスワード更新APIリクエスト
      const response = await request(SERVER_URL)
        .put(`/api/users/${targetUser.id}`)
        .set(authHeaders)
        .send(updateData);
      tracker.mark('パスワード更新APIレスポンス受信');

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).not.toHaveProperty('password');

      // データベースでパスワードハッシュ確認
      const dbUser = await dbTestHelper.query(
        'SELECT password_hash, password_changed_at FROM users WHERE id = $1',
        [targetUser.id],
        testTransaction
      );
      
      expect(dbUser.rows[0].password_hash).toBeTruthy();
      expect(dbUser.rows[0].password_hash).not.toBe(newPassword);
      expect(dbUser.rows[0].password_changed_at).toBeTruthy();
      
      // パスワード検証
      const isPasswordValid = await testAuthHelper.verifyPassword(
        newPassword, 
        dbUser.rows[0].password_hash
      );
      expect(isPasswordValid).toBe(true);
      tracker.mark('パスワード更新検証完了');
    });
  });

  /**
   * テストケース5: ユーザー削除（ソフトデリート）
   */
  describe('DELETE /api/users/:id - ユーザー削除', () => {
    it('正常にユーザーをソフトデリートできる', async () => {
      tracker.setOperation('ユーザーソフトデリートテスト');

      // 削除対象ユーザー作成
      const targetUser = await testAuthHelper.createTestUser(dbTestHelper);
      tracker.mark('削除対象ユーザー作成完了');

      // ユーザー削除APIリクエスト
      const response = await request(SERVER_URL)
        .delete(`/api/users/${targetUser.id}`)
        .set(authHeaders);
      tracker.mark('ユーザー削除APIレスポンス受信');

      // レスポンス検証
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // データベース確認（ソフトデリート）
      const dbUser = await dbTestHelper.query(
        'SELECT * FROM users WHERE id = $1',
        [targetUser.id],
        testTransaction
      );
      expect(dbUser.rows.length).toBe(1);
      expect(dbUser.rows[0].is_active).toBe(false);
      tracker.mark('ソフトデリート確認完了');
    });

    it('自分自身の削除はできない', async () => {
      tracker.setOperation('自己削除防止テスト');

      // 認証ユーザー自身の削除試行
      const response = await request(SERVER_URL)
        .delete(`/api/users/${testUser.id}`)
        .set(authHeaders);
      tracker.mark('自己削除APIレスポンス受信');

      // エラーレスポンス検証
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('SELF_DELETE_FORBIDDEN');
      tracker.mark('自己削除防止確認完了');
    });
  });

  /**
   * テストケース6: ユーザー統計情報取得
   */
  describe('GET /api/users/stats - ユーザー統計情報取得', () => {
    it('正常にユーザー統計情報を取得できる', async () => {
      tracker.setOperation('ユーザー統計情報取得テスト');

      // 複数の権限レベルのテストユーザー作成
      tracker.setOperation('統計用テストユーザー作成');
      await testAuthHelper.createTestUsersForAllRoles(dbTestHelper);
      tracker.mark('統計用テストユーザー作成完了');

      // 統計情報取得APIリクエスト
      tracker.setOperation('統計情報取得API呼び出し');
      const response = await request(SERVER_URL)
        .get('/api/users/stats')
        .set(authHeaders);
      tracker.mark('統計情報取得APIレスポンス受信');

      // レスポンス検証
      tracker.setOperation('統計情報レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('activeUsers');
      expect(response.body.data).toHaveProperty('gmailConnectedUsers');
      expect(response.body.data).toHaveProperty('usersByRole');
      expect(response.body.data).toHaveProperty('recentlyActiveUsers');
      expect(response.body.data).toHaveProperty('lastMonthNewUsers');
      
      expect(typeof response.body.data.totalUsers).toBe('number');
      expect(response.body.data.totalUsers).toBeGreaterThan(0);
      expect(response.body.data.usersByRole).toHaveProperty('company_leader');
      expect(response.body.data.usersByRole).toHaveProperty('manager');
      expect(response.body.data.usersByRole).toHaveProperty('team_leader');
      expect(response.body.data.usersByRole).toHaveProperty('user');
      tracker.mark('統計情報レスポンス検証完了');
    });
  });

  /**
   * テストケース7: 一括ユーザー更新
   */
  describe('PUT /api/users/bulk - 一括ユーザー更新', () => {
    it('正常に複数ユーザーを一括更新できる', async () => {
      tracker.setOperation('一括ユーザー更新テスト');

      // 一括更新対象ユーザー作成
      tracker.setOperation('一括更新対象ユーザー作成');
      const targetUsers = [];
      for (let i = 0; i < 3; i++) {
        const user = await testAuthHelper.createTestUser(dbTestHelper, {
          department: '旧部署'
        });
        targetUsers.push(user);
      }
      tracker.mark('一括更新対象ユーザー作成完了');

      // 一括更新データ準備
      const bulkUpdateData = {
        userIds: targetUsers.map(u => u.id),
        updates: {
          department: '新部署',
          role: 'team_leader'
        }
      };

      // 一括更新APIリクエスト
      tracker.setOperation('一括更新API呼び出し');
      const response = await request(SERVER_URL)
        .put('/api/users/bulk')
        .set(authHeaders)
        .send(bulkUpdateData);
      tracker.mark('一括更新APIレスポンス受信');

      // レスポンス検証
      tracker.setOperation('一括更新レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.successCount).toBe(3);
      expect(response.body.data.errorCount).toBe(0);
      tracker.mark('一括更新レスポンス検証完了');

      // データベース確認
      tracker.setOperation('一括更新データベース確認');
      for (const user of targetUsers) {
        const dbUser = await dbTestHelper.query(
          'SELECT * FROM users WHERE id = $1',
          [user.id],
          testTransaction
        );
        expect(dbUser.rows[0].department).toBe('新部署');
        expect(dbUser.rows[0].role).toBe('team_leader');
      }
      tracker.mark('一括更新データベース確認完了');
    });
  });

  /**
   * テストケース8: CSV出力
   */
  describe('GET /api/users/export/csv - CSV出力', () => {
    it('正常にユーザーデータをCSV形式で出力できる', async () => {
      tracker.setOperation('CSV出力テスト');

      // CSV出力用テストユーザー作成
      tracker.setOperation('CSV出力用テストユーザー作成');
      const csvUsers = uniqueDataFactory.generateBulkData('user', 3);
      for (const userData of csvUsers) {
        await testAuthHelper.createTestUser(dbTestHelper, userData);
      }
      tracker.mark('CSV出力用テストユーザー作成完了');

      // CSV出力APIリクエスト
      tracker.setOperation('CSV出力API呼び出し');
      const response = await request(SERVER_URL)
        .get('/api/users/export/csv')
        .set(authHeaders);
      tracker.mark('CSV出力APIレスポンス受信');

      // CSV レスポンス検証
      tracker.setOperation('CSV出力レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('users_export_');
      
      // CSV内容確認
      const csvContent = response.text;
      expect(csvContent).toContain('ID,名前,メールアドレス'); // ヘッダー確認
      expect(csvContent.split('\n').length).toBeGreaterThan(1); // データ行確認
      tracker.mark('CSV出力レスポンス検証完了');
    });
  });

  /**
   * テストケース9: 権限チェック
   */
  describe('権限制御テスト', () => {
    it('一般ユーザーはユーザー管理APIにアクセスできない', async () => {
      tracker.setOperation('権限制御テスト');

      // 一般ユーザーの認証ヘッダー作成
      tracker.setOperation('一般ユーザー認証準備');
      const regularUserAuth = await testAuthHelper.createAuthHeaders(dbTestHelper, 'user');
      tracker.mark('一般ユーザー認証準備完了');

      // 一般ユーザーでユーザー一覧取得試行
      tracker.setOperation('一般ユーザーアクセス試行');
      const response = await request(SERVER_URL)
        .get('/api/users')
        .set(regularUserAuth.headers);
      tracker.mark('一般ユーザーアクセスレスポンス受信');

      // 権限エラー検証
      tracker.setOperation('権限エラー検証');
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INSUFFICIENT_ROLE');
      tracker.mark('権限エラー検証完了');
    });

    it('認証なしではアクセスできない', async () => {
      tracker.setOperation('認証なしアクセステスト');

      const response = await request(SERVER_URL)
        .get('/api/users');
      tracker.mark('認証なしアクセスレスポンス受信');

      // 認証エラー検証
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
      tracker.mark('認証エラー検証完了');
    });
  });

  /**
   * パフォーマンステスト
   */
  describe('パフォーマンステスト', () => {
    it('大量データでもレスポンス時間が適切', async () => {
      tracker.setOperation('パフォーマンステスト');

      // 大量テストユーザー作成（一括INSERT最適化）
      tracker.setOperation('大量テストユーザー作成');
      const largeUserData = uniqueDataFactory.generateBulkData('user', 50);
      
      // 一括INSERT用のクエリ構築
      const bcrypt = require('bcrypt');
      const values = [];
      const placeholders = [];
      
      for (let i = 0; i < largeUserData.length; i++) {
        const user = largeUserData[i];
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        const baseIndex = i * 7;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`);
        values.push(user.email, user.username, user.fullName, hashedPassword, user.role, user.isActive, user.department);
      }
      
      const bulkInsertQuery = `
        INSERT INTO users (email, username, full_name, password_hash, role, is_active, department)
        VALUES ${placeholders.join(', ')}
        RETURNING id, email, username, full_name, role, is_active, department, created_at
      `;
      
      await dbTestHelper.query(bulkInsertQuery, values);
      tracker.mark('大量テストユーザー作成完了');

      // パフォーマンス計測付きAPIリクエスト
      tracker.setOperation('大量データAPI呼び出し');
      const startTime = Date.now();
      
      const response = await request(SERVER_URL)
        .get('/api/users')
        .set(authHeaders)
        .query({ limit: 100 });
        
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      tracker.mark('大量データAPIレスポンス受信');

      // パフォーマンス検証
      tracker.setOperation('パフォーマンス検証');
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5秒以内
      expect(response.body.data.users.length).toBeGreaterThan(0);
      
      console.log(`📊 大量データレスポンス時間: ${responseTime}ms`);
      tracker.mark('パフォーマンス検証完了');

      // パフォーマンス閾値チェック
      expect(tracker.checkThreshold('大量データAPIレスポンス受信', 20)).toBe(true);
    });
  });
});

/**
 * テストサポート関数群
 * ★9がデバッグ時に活用可能
 */

/**
 * データベース状態ダンプ（デバッグ用）
 */
async function dumpDatabaseState(dbHelper, prefix = '') {
  console.log(`\n=== ${prefix} データベース状態ダンプ ===`);
  
  try {
    const userCount = await dbHelper.query('SELECT COUNT(*) FROM users');
    console.log(`ユーザー総数: ${userCount.rows[0].count}`);
    
    const activeUsers = await dbHelper.query('SELECT COUNT(*) FROM users WHERE is_active = true');
    console.log(`アクティブユーザー数: ${activeUsers.rows[0].count}`);
    
    const roleStats = await dbHelper.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY role
    `);
    
    console.log('権限別統計:');
    roleStats.rows.forEach(row => {
      console.log(`  ${row.role}: ${row.count}名`);
    });
    
  } catch (error) {
    console.error('データベース状態ダンプエラー:', error);
  }
  
  console.log('=================================\n');
}

// デバッグモード時の追加ログ
if (process.env.DEBUG_TESTS === 'true') {
  beforeEach(async () => {
    await dumpDatabaseState(dbTestHelper, 'テスト開始前');
  });
  
  afterEach(async () => {
    await dumpDatabaseState(dbTestHelper, 'テスト終了後');
  });
}