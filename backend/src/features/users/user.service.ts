/**
 * ユーザーサービス
 * P-010 ユーザー管理ページのビジネスロジック
 */

import bcrypt from 'bcrypt';
import { 
  User, 
  UserCreate, 
  UserUpdate, 
  UserSearchRequest, 
  UserSearchResponse,
  UserStatsResponse,
  UserActivityLog,
  UserPermissions,
  BulkUserUpdateRequest,
  BulkUserUpdateResponse,
  UserStatusUpdateRequest,
  UserRole,
  ID 
} from '../../types/index.js';
import { auditLogger } from '../../common/utils/audit.js';
import { query } from '../../common/utils/database.js';

export class UserService {

  /**
   * ユーザー一覧取得（検索・フィルタリング対応）
   */
  async getUsers(searchParams: UserSearchRequest = {}): Promise<UserSearchResponse> {
    const {
      query: searchQuery = '',
      role = [],
      isActive,
      department,
      gmailConnected,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = searchParams;

    console.log('🔍 User search request:', searchParams);

    // WHERE句の構築
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // 検索クエリ（名前・メールでの部分一致）
    if (searchQuery.trim()) {
      conditions.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`);
      params.push(`%${searchQuery.trim()}%`);
      paramIndex++;
    }

    // ロールフィルター
    if (role.length > 0) {
      conditions.push(`role = ANY($${paramIndex})`);
      params.push(role);
      paramIndex++;
    }

    // アクティブ状態フィルター
    if (isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    // 部署フィルター
    if (department) {
      conditions.push(`department = $${paramIndex}`);
      params.push(department);
      paramIndex++;
    }

    // Gmail連携フィルター
    if (gmailConnected !== undefined) {
      conditions.push(`gmail_personal_connected = $${paramIndex}`);
      params.push(gmailConnected);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // ソート順の検証とマッピング
    const sortColumnMap: { [key: string]: string } = {
      'fullName': 'full_name',
      'email': 'email',
      'role': 'role',
      'lastLoginAt': 'last_login_at',
      'createdAt': 'created_at'
    };
    
    const sortColumn = sortColumnMap[sortBy] || 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // 総件数取得
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users 
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].total);

    // ページネーション計算
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);

    // ユーザーデータ取得
    const usersQuery = `
      SELECT 
        id, email, username, full_name, role, is_active, department, phone_number,
        gmail_personal_connected, last_login_at, password_changed_at, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const usersResult = await query(usersQuery, [...params, limit, offset]);
    
    const users: User[] = usersResult.rows.map(row => ({
      id: row.id,
      email: row.email,
      username: row.username,
      fullName: row.full_name,
      role: row.role as UserRole,
      isActive: row.is_active,
      department: row.department,
      phoneNumber: row.phone_number,
      gmailPersonalConnected: row.gmail_personal_connected,
      lastLoginAt: row.last_login_at,
      passwordChangedAt: row.password_changed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    console.log(`✅ Found ${users.length} users (${totalCount} total)`);

    return {
      users,
      totalCount,
      page,
      limit,
      totalPages
    };
  }

  /**
   * ユーザー詳細取得
   */
  async getUserById(userId: ID): Promise<User | null> {
    console.log('👤 Getting user by ID:', userId);

    const userQuery = `
      SELECT 
        id, email, username, full_name, role, is_active, department, phone_number,
        gmail_personal_connected, last_login_at, password_changed_at, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;

    const result = await query(userQuery, [userId]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found:', userId);
      return null;
    }

    const row = result.rows[0];
    const user: User = {
      id: row.id,
      email: row.email,
      username: row.username,
      fullName: row.full_name,
      role: row.role as UserRole,
      isActive: row.is_active,
      department: row.department,
      phoneNumber: row.phone_number,
      gmailPersonalConnected: row.gmail_personal_connected,
      lastLoginAt: row.last_login_at,
      passwordChangedAt: row.password_changed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    console.log('✅ User found:', user.email);
    return user;
  }

  /**
   * ユーザー作成
   */
  async createUser(userData: UserCreate, createdBy: ID): Promise<User> {
    console.log('➕ Creating new user:', userData.email);

    // メールアドレス重複チェック
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('このメールアドレスは既に使用されています');
    }

    // ユーザー名重複チェック
    const existingUsername = await this.getUserByUsername(userData.username);
    if (existingUsername) {
      throw new Error('このユーザー名は既に使用されています');
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const insertQuery = `
      INSERT INTO users (
        email, username, full_name, password_hash, role, is_active, 
        department, phone_number, gmail_personal_connected, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
      ) RETURNING 
        id, email, username, full_name, role, is_active, department, phone_number,
        gmail_personal_connected, last_login_at, password_changed_at, created_at, updated_at
    `;

    const values = [
      userData.email,
      userData.username,
      userData.fullName,
      hashedPassword,
      userData.role,
      userData.isActive ?? true,
      userData.department || null,
      userData.phoneNumber || null,
      userData.gmailPersonalConnected ?? false
    ];

    const result = await query(insertQuery, values);
    const row = result.rows[0];

    const newUser: User = {
      id: row.id,
      email: row.email,
      username: row.username,
      fullName: row.full_name,
      role: row.role as UserRole,
      isActive: row.is_active,
      department: row.department,
      phoneNumber: row.phone_number,
      gmailPersonalConnected: row.gmail_personal_connected,
      lastLoginAt: row.last_login_at,
      passwordChangedAt: row.password_changed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    // 監査ログ記録
    await auditLogger.log('USER_CREATED', {
      targetUserId: newUser.id,
      targetUserEmail: newUser.email,
      performedBy: createdBy
    });

    console.log('✅ User created successfully:', newUser.email);
    return newUser;
  }

  /**
   * ユーザー更新
   */
  async updateUser(userId: ID, updateData: UserUpdate, updatedBy: ID): Promise<User> {
    console.log('📝 Updating user:', userId);

    // 既存ユーザー確認
    const existingUser = await this.getUserById(userId);
    if (!existingUser) {
      throw new Error('ユーザーが見つかりません');
    }

    // 更新対象フィールドの構築
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updateData.email && updateData.email !== existingUser.email) {
      // メール重複チェック
      const duplicateEmail = await this.getUserByEmail(updateData.email);
      if (duplicateEmail && duplicateEmail.id !== userId) {
        throw new Error('このメールアドレスは既に使用されています');
      }
      updateFields.push(`email = $${paramIndex}`);
      params.push(updateData.email);
      paramIndex++;
    }

    if (updateData.username && updateData.username !== existingUser.username) {
      // ユーザー名重複チェック
      const duplicateUsername = await this.getUserByUsername(updateData.username);
      if (duplicateUsername && duplicateUsername.id !== userId) {
        throw new Error('このユーザー名は既に使用されています');
      }
      updateFields.push(`username = $${paramIndex}`);
      params.push(updateData.username);
      paramIndex++;
    }

    if (updateData.fullName !== undefined) {
      updateFields.push(`full_name = $${paramIndex}`);
      params.push(updateData.fullName);
      paramIndex++;
    }

    if (updateData.role !== undefined) {
      updateFields.push(`role = $${paramIndex}`);
      params.push(updateData.role);
      paramIndex++;
    }

    if (updateData.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      params.push(updateData.isActive);
      paramIndex++;
    }

    if (updateData.department !== undefined) {
      updateFields.push(`department = $${paramIndex}`);
      params.push(updateData.department);
      paramIndex++;
    }

    if (updateData.phoneNumber !== undefined) {
      updateFields.push(`phone_number = $${paramIndex}`);
      params.push(updateData.phoneNumber);
      paramIndex++;
    }

    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 12);
      updateFields.push(`password_hash = $${paramIndex}`);
      params.push(hashedPassword);
      paramIndex++;
      updateFields.push(`password_changed_at = NOW()`);
    }

    if (updateFields.length === 0) {
      console.log('⚠️ No fields to update');
      return existingUser;
    }

    // updated_at は常に更新
    updateFields.push('updated_at = NOW()');

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id, email, username, full_name, role, is_active, department, phone_number,
        gmail_personal_connected, last_login_at, password_changed_at, created_at, updated_at
    `;

    params.push(userId);

    const result = await query(updateQuery, params);
    const row = result.rows[0];

    const updatedUser: User = {
      id: row.id,
      email: row.email,
      username: row.username,
      fullName: row.full_name,
      role: row.role as UserRole,
      isActive: row.is_active,
      department: row.department,
      phoneNumber: row.phone_number,
      gmailPersonalConnected: row.gmail_personal_connected,
      lastLoginAt: row.last_login_at,
      passwordChangedAt: row.password_changed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    // 監査ログ記録
    await auditLogger.log('USER_UPDATED', {
      targetUserId: updatedUser.id,
      targetUserEmail: updatedUser.email,
      performedBy: updatedBy,
      changedFields: Object.keys(updateData)
    });

    console.log('✅ User updated successfully:', updatedUser.email);
    return updatedUser;
  }

  /**
   * ユーザー削除（ソフトデリート）
   */
  async deleteUser(userId: ID, deletedBy: ID): Promise<void> {
    console.log('🗑️ Soft deleting user:', userId);

    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // 自分自身の削除を防ぐ
    if (userId === deletedBy) {
      throw new Error('自分自身のアカウントは削除できません');
    }

    const deleteQuery = `
      UPDATE users 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
    `;

    await query(deleteQuery, [userId]);

    // 監査ログ記録
    await auditLogger.log('USER_DELETED', {
      targetUserId: userId,
      targetUserEmail: user.email,
      performedBy: deletedBy
    });

    console.log('✅ User soft deleted successfully');
  }

  /**
   * ユーザー統計情報取得
   */
  async getUserStats(): Promise<UserStatsResponse> {
    console.log('📊 Getting user statistics');

    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE gmail_personal_connected = true) as gmail_connected_users,
        COUNT(*) FILTER (WHERE role = 'COMPANY_LEADER') as company_leaders,
        COUNT(*) FILTER (WHERE role = 'MANAGER') as managers,
        COUNT(*) FILTER (WHERE role = 'TEAM_LEADER') as team_leaders,
        COUNT(*) FILTER (WHERE role = 'USER') as users,
        COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '7 days') as recently_active_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_month_new_users
      FROM users
    `;

    const result = await query(statsQuery, []);
    const row = result.rows[0];

    const stats: UserStatsResponse = {
      totalUsers: parseInt(row.total_users),
      activeUsers: parseInt(row.active_users),
      gmailConnectedUsers: parseInt(row.gmail_connected_users),
      usersByRole: {
        [UserRole.COMPANY_LEADER]: parseInt(row.company_leaders),
        [UserRole.MANAGER]: parseInt(row.managers),
        [UserRole.TEAM_LEADER]: parseInt(row.team_leaders),
        [UserRole.USER]: parseInt(row.users)
      },
      recentlyActiveUsers: parseInt(row.recently_active_users),
      lastMonthNewUsers: parseInt(row.last_month_new_users)
    };

    console.log('✅ User statistics retrieved');
    return stats;
  }

  /**
   * 一括ユーザー更新
   */
  async bulkUpdateUsers(bulkUpdate: BulkUserUpdateRequest, updatedBy: ID): Promise<BulkUserUpdateResponse> {
    console.log('🔄 Bulk updating users:', bulkUpdate.userIds.length);

    const response: BulkUserUpdateResponse = {
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    for (const userId of bulkUpdate.userIds) {
      try {
        await this.updateUser(userId, bulkUpdate.updates, updatedBy);
        response.successCount++;
      } catch (error: any) {
        response.errorCount++;
        response.errors?.push({
          userId,
          error: error.message
        });
      }
    }

    console.log(`✅ Bulk update completed: ${response.successCount} success, ${response.errorCount} errors`);
    return response;
  }

  /**
   * ユーザーステータス更新
   */
  async updateUserStatus(userId: ID, statusUpdate: UserStatusUpdateRequest, updatedBy: ID): Promise<void> {
    console.log('🔄 Updating user status:', userId, statusUpdate.isActive);

    await this.updateUser(userId, { isActive: statusUpdate.isActive }, updatedBy);

    // 監査ログ記録（詳細な理由付き）
    await auditLogger.log('USER_STATUS_CHANGED', {
      targetUserId: userId,
      performedBy: updatedBy,
      newStatus: statusUpdate.isActive ? 'active' : 'inactive',
      reason: statusUpdate.reason || 'No reason provided'
    });

    console.log('✅ User status updated successfully');
  }

  /**
   * メールアドレスでユーザー取得（内部用）
   */
  private async getUserByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * ユーザー名でユーザー取得（内部用）
   */
  private async getUserByUsername(username: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * CSV出力用データ取得
   */
  async getUsersForExport(searchParams: UserSearchRequest = {}): Promise<User[]> {
    console.log('📄 Getting users for CSV export');
    
    // ページネーションを無効にして全データ取得
    const exportParams = { ...searchParams, page: 1, limit: 10000 };
    const result = await this.getUsers(exportParams);
    
    console.log(`✅ Retrieved ${result.users.length} users for export`);
    return result.users;
  }
}

// シングルトンインスタンス
export const userService = new UserService();