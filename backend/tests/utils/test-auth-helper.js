/**
 * 認証テストヘルパー
 * ★9統合テスト成功請負人用の認証トークン生成・検証支援ユーティリティ
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * 認証テストヘルパークラス
 */
class TestAuthHelper {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
    this.testUsers = new Map(); // テスト用ユーザーキャッシュ
  }

  /**
   * テスト用JWTトークン生成
   */
  generateTestToken(userId, role = 'user', expiresIn = '1h') {
    const payload = {
      userId,
      role,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.JWT_SECRET, { expiresIn });
  }

  /**
   * テスト用リフレッシュトークン生成
   */
  generateTestRefreshToken(userId, role = 'user') {
    const payload = {
      userId,
      role,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  /**
   * テスト用ユーザー作成（データベースに登録）
   */
  async createTestUser(dbHelper, userData = {}) {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const defaultUser = {
      email: `test-user-${uniqueId}@test.com`,
      username: `testuser${uniqueId}`,
      fullName: `Test User ${uniqueId}`,
      password: 'testpassword123',
      role: 'user',
      isActive: true,
      department: 'テスト部署'
    };

    const user = { ...defaultUser, ...userData };
    
    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(user.password, 12);

    // データベースに挿入
    const insertQuery = `
      INSERT INTO users (
        email, username, full_name, password_hash, role, is_active, department, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, email, username, full_name, role, is_active, department, created_at, updated_at
    `;

    const values = [
      user.email,
      user.username,
      user.fullName,
      hashedPassword,
      user.role,
      user.isActive,
      user.department
    ];

    const result = await dbHelper.query(insertQuery, values);
    const createdUser = result.rows[0];

    // 平文パスワードも保持（テスト用）
    createdUser.plainPassword = user.password;

    // キャッシュに保存
    this.testUsers.set(createdUser.id, createdUser);

    console.log(`👤 テストユーザー作成: ${createdUser.email} (ID: ${createdUser.id})`);
    return createdUser;
  }

  /**
   * 複数権限レベルのテストユーザー作成
   */
  async createTestUsersForAllRoles(dbHelper) {
    const roles = ['company_leader', 'manager', 'team_leader', 'user'];
    const users = {};

    for (const role of roles) {
      users[role] = await this.createTestUser(dbHelper, { role });
    }

    console.log(`👥 全権限レベルのテストユーザー作成完了 (${roles.length}名)`);
    return users;
  }

  /**
   * テストユーザーでログイン（トークン取得）
   */
  async loginTestUser(user) {
    const accessToken = this.generateTestToken(user.id, user.role);
    const refreshToken = this.generateTestRefreshToken(user.id, user.role);

    const loginResponse = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        department: user.department
      },
      accessToken,
      refreshToken,
      expiresIn: 3600
    };

    console.log(`🔑 テストユーザーログイン: ${user.email}`);
    return loginResponse;
  }

  /**
   * Authorizationヘッダー生成
   */
  getAuthHeader(token) {
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * テスト用認証付きリクエストヘッダー作成
   */
  async createAuthHeaders(dbHelper, role = 'user') {
    const testUser = await this.createTestUser(dbHelper, { role });
    const loginData = await this.loginTestUser(testUser);
    
    return {
      headers: this.getAuthHeader(loginData.accessToken),
      user: testUser,
      loginData
    };
  }

  /**
   * JWTトークン検証
   */
  verifyToken(token, isRefreshToken = false) {
    try {
      const secret = isRefreshToken ? this.JWT_REFRESH_SECRET : this.JWT_SECRET;
      return jwt.verify(token, secret);
    } catch (error) {
      console.error('トークン検証エラー:', error.message);
      return null;
    }
  }

  /**
   * パスワード検証
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * テストユーザークリーンアップ
   */
  async cleanupTestUsers(dbHelper) {
    const userIds = Array.from(this.testUsers.keys());
    
    if (userIds.length > 0) {
      await dbHelper.query(
        'DELETE FROM users WHERE id = ANY($1)',
        [userIds]
      );
      
      console.log(`🧹 テストユーザークリーンアップ完了: ${userIds.length}名`);
    }
    
    this.testUsers.clear();
  }

  /**
   * 権限チェック用ヘルパー
   */
  hasUpperRole(role) {
    const upperRoles = ['company_leader', 'manager', 'team_leader'];
    return upperRoles.includes(role);
  }

  /**
   * ロール階層チェック
   */
  isRoleHigherThan(userRole, targetRole) {
    const hierarchy = {
      'company_leader': 3,
      'manager': 2,
      'team_leader': 1,
      'user': 0
    };

    return hierarchy[userRole] > hierarchy[targetRole];
  }

  /**
   * テスト用セッション情報生成
   */
  generateTestSession(user) {
    return {
      userId: user.id,
      role: user.role,
      email: user.email,
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30分後
    };
  }
}

// シングルトンインスタンス
const testAuthHelper = new TestAuthHelper();

module.exports = {
  TestAuthHelper,
  testAuthHelper
};