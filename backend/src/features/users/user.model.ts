/**
 * ユーザー管理機能 - データモデル層
 * 
 * PostgreSQLデータベースとの接続、スキーマ定義、基本的なCRUD操作を提供
 * 型定義は/src/types/index.tsと完全同期
 */

import * as dotenv from 'dotenv';
// 環境変数を最初に読み込み
dotenv.config();

import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcrypt';
import { 
  User, 
  UserCreate, 
  UserUpdate, 
  UserRole, 
  UserSearchRequest,
  UserStatsResponse,
  UserActivityLog,
  ID 
} from '../../types/index.js';

// データベース接続プール
let pool: Pool;

/**
 * データベース接続プールの初期化
 */
export function initializeDatabase(): void {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('データベース接続プールでエラーが発生しました:', err);
    });

    console.log('ユーザー管理機能: データベース接続プール初期化完了');
  }
}

/**
 * データベース接続プールの取得
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('データベースプールが初期化されていません');
  }
  return pool;
}

/**
 * ユーザーテーブルのスキーマ作成
 * 本来はマイグレーションファイルで行うが、開発段階では直接実行
 */
export async function createUserTableSchema(): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // ユーザーテーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(50) NOT NULL UNIQUE,
        full_name VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('company_leader', 'manager', 'team_leader', 'user')),
        is_active BOOLEAN NOT NULL DEFAULT true,
        department VARCHAR(100),
        phone_number VARCHAR(20),
        gmail_personal_connected BOOLEAN DEFAULT false,
        gmail_personal_access_token TEXT,
        gmail_personal_refresh_token TEXT,
        last_login_at TIMESTAMP WITH TIME ZONE,
        password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // インデックス作成
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
      CREATE INDEX IF NOT EXISTS idx_users_gmail_connected ON users(gmail_personal_connected);
    `);

    // ユーザー活動ログテーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        details TEXT,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        performed_by UUID REFERENCES users(id)
      );
    `);

    // 活動ログインデックス
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON user_activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON user_activity_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON user_activity_logs(action);
    `);

    // 更新日時自動更新トリガー
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query('COMMIT');
    console.log('ユーザー管理機能: データベーススキーマ作成完了');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('ユーザー管理機能: スキーマ作成エラー:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * データベース行をUserオブジェクトに変換
 */
function mapRowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    fullName: row.full_name,
    role: row.role as UserRole,
    isActive: row.is_active,
    department: row.department,
    phoneNumber: row.phone_number,
    gmailPersonalConnected: row.gmail_personal_connected,
    gmailPersonalAccessToken: row.gmail_personal_access_token,
    gmailPersonalRefreshToken: row.gmail_personal_refresh_token,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
    passwordChangedAt: row.password_changed_at ? new Date(row.password_changed_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

/**
 * データベース行をUserActivityLogオブジェクトに変換
 */
function mapRowToActivityLog(row: any): UserActivityLog {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action as UserActivityLog['action'],
    details: row.details,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    timestamp: new Date(row.timestamp),
    performedBy: row.performed_by
  };
}

/**
 * パスワードハッシュ化
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * パスワード検証
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * ユーザーデータモデル操作クラス
 */
export class UserModel {
  /**
   * 新規ユーザー作成
   */
  static async create(userData: UserCreate, client?: PoolClient): Promise<User> {
    const dbClient = client || pool;
    
    try {
      console.log(`[UserModel.create] 新規ユーザー作成開始: ${userData.email}`);
      
      const passwordHash = await hashPassword(userData.password);
      
      const query = `
        INSERT INTO users (
          email, username, full_name, password_hash, role, is_active,
          department, phone_number, gmail_personal_connected,
          gmail_personal_access_token, gmail_personal_refresh_token
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        userData.email,
        userData.username,
        userData.fullName,
        passwordHash,
        userData.role,
        userData.isActive ?? true,
        userData.department,
        userData.phoneNumber,
        userData.gmailPersonalConnected ?? false,
        userData.gmailPersonalAccessToken,
        userData.gmailPersonalRefreshToken
      ];
      
      const result = await dbClient.query(query, values);
      const user = mapRowToUser(result.rows[0]);
      
      console.log(`[UserModel.create] ユーザー作成成功: ${user.id}`);
      return user;
      
    } catch (error) {
      console.error('[UserModel.create] ユーザー作成エラー:', error);
      throw error;
    }
  }

  /**
   * ID でユーザー取得
   */
  static async findById(id: ID): Promise<User | null> {
    try {
      console.log(`[UserModel.findById] ユーザー取得開始: ${id}`);
      
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        console.log(`[UserModel.findById] ユーザーが見つかりません: ${id}`);
        return null;
      }
      
      const user = mapRowToUser(result.rows[0]);
      console.log(`[UserModel.findById] ユーザー取得成功: ${user.email}`);
      return user;
      
    } catch (error) {
      console.error('[UserModel.findById] ユーザー取得エラー:', error);
      throw error;
    }
  }

  /**
   * メールアドレスでユーザー取得
   */
  static async findByEmail(email: string): Promise<User | null> {
    try {
      console.log(`[UserModel.findByEmail] ユーザー取得開始: ${email}`);
      
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      
      if (result.rows.length === 0) {
        console.log(`[UserModel.findByEmail] ユーザーが見つかりません: ${email}`);
        return null;
      }
      
      const user = mapRowToUser(result.rows[0]);
      console.log(`[UserModel.findByEmail] ユーザー取得成功: ${user.id}`);
      return user;
      
    } catch (error) {
      console.error('[UserModel.findByEmail] ユーザー取得エラー:', error);
      throw error;
    }
  }

  /**
   * ユーザー情報更新
   */
  static async update(id: ID, updateData: UserUpdate): Promise<User | null> {
    try {
      console.log(`[UserModel.update] ユーザー更新開始: ${id}`);
      
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // 動的にSET句を構築
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'password') {
            // パスワードは別途ハッシュ化が必要
            return;
          }
          
          const dbField = key === 'fullName' ? 'full_name' :
                         key === 'isActive' ? 'is_active' :
                         key === 'phoneNumber' ? 'phone_number' :
                         key === 'gmailPersonalConnected' ? 'gmail_personal_connected' :
                         key === 'gmailPersonalAccessToken' ? 'gmail_personal_access_token' :
                         key === 'gmailPersonalRefreshToken' ? 'gmail_personal_refresh_token' :
                         key === 'lastLoginAt' ? 'last_login_at' :
                         key === 'passwordChangedAt' ? 'password_changed_at' :
                         key;
          
          fields.push(`${dbField} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      // パスワード更新の処理
      if (updateData.password) {
        const passwordHash = await hashPassword(updateData.password);
        fields.push(`password_hash = $${paramCount}`);
        values.push(passwordHash);
        paramCount++;
        
        fields.push(`password_changed_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
      }

      if (fields.length === 0) {
        console.log(`[UserModel.update] 更新対象フィールドなし: ${id}`);
        return await UserModel.findById(id);
      }

      values.push(id);
      const query = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        console.log(`[UserModel.update] ユーザーが見つかりません: ${id}`);
        return null;
      }
      
      const user = mapRowToUser(result.rows[0]);
      console.log(`[UserModel.update] ユーザー更新成功: ${user.email}`);
      return user;
      
    } catch (error) {
      console.error('[UserModel.update] ユーザー更新エラー:', error);
      throw error;
    }
  }

  /**
   * ユーザー削除（論理削除）
   */
  static async delete(id: ID): Promise<boolean> {
    try {
      console.log(`[UserModel.delete] ユーザー削除開始: ${id}`);
      
      // 論理削除（is_active = false に設定）
      const query = `
        UPDATE users 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1 AND is_active = true
        RETURNING id
      `;
      
      const result = await pool.query(query, [id]);
      const success = result.rows.length > 0;
      
      if (success) {
        console.log(`[UserModel.delete] ユーザー削除成功: ${id}`);
      } else {
        console.log(`[UserModel.delete] ユーザーが見つからないか既に削除済み: ${id}`);
      }
      
      return success;
      
    } catch (error) {
      console.error('[UserModel.delete] ユーザー削除エラー:', error);
      throw error;
    }
  }

  /**
   * ユーザー検索・一覧取得
   */
  static async search(searchParams: UserSearchRequest): Promise<{
    users: User[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      console.log('[UserModel.search] ユーザー検索開始:', searchParams);
      
      const conditions: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // 検索条件の構築
      if (searchParams.query) {
        conditions.push(`(
          full_name ILIKE $${paramCount} OR 
          email ILIKE $${paramCount} OR 
          username ILIKE $${paramCount} OR 
          department ILIKE $${paramCount}
        )`);
        values.push(`%${searchParams.query}%`);
        paramCount++;
      }

      if (searchParams.role && searchParams.role.length > 0) {
        const rolePlaceholders = searchParams.role.map(() => `$${paramCount++}`).join(',');
        conditions.push(`role IN (${rolePlaceholders})`);
        values.push(...searchParams.role);
      }

      if (searchParams.isActive !== undefined) {
        conditions.push(`is_active = $${paramCount}`);
        values.push(searchParams.isActive);
        paramCount++;
      }

      if (searchParams.department) {
        conditions.push(`department = $${paramCount}`);
        values.push(searchParams.department);
        paramCount++;
      }

      if (searchParams.gmailConnected !== undefined) {
        conditions.push(`gmail_personal_connected = $${paramCount}`);
        values.push(searchParams.gmailConnected);
        paramCount++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 総件数取得
      const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
      const countResult = await pool.query(countQuery, values);
      const totalCount = parseInt(countResult.rows[0].count);

      // ページネーション
      const page = searchParams.page || 1;
      const limit = Math.min(searchParams.limit || 20, 100);
      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(totalCount / limit);

      // ソート
      const sortBy = searchParams.sortBy || 'created_at';
      const sortOrder = searchParams.sortOrder || 'desc';
      const dbSortField = sortBy === 'fullName' ? 'full_name' :
                         sortBy === 'lastLoginAt' ? 'last_login_at' :
                         sortBy === 'createdAt' ? 'created_at' :
                         sortBy;

      // メインクエリ
      const query = `
        SELECT * FROM users 
        ${whereClause}
        ORDER BY ${dbSortField} ${sortOrder.toUpperCase()}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      values.push(limit, offset);
      const result = await pool.query(query, values);

      const users = result.rows.map(mapRowToUser);

      console.log(`[UserModel.search] 検索完了: ${users.length}件/${totalCount}件`);

      return {
        users,
        totalCount,
        page,
        limit,
        totalPages
      };
      
    } catch (error) {
      console.error('[UserModel.search] ユーザー検索エラー:', error);
      throw error;
    }
  }

  /**
   * ユーザー統計情報取得
   */
  static async getStats(): Promise<UserStatsResponse> {
    try {
      console.log('[UserModel.getStats] 統計情報取得開始');
      
      // 基本統計
      const basicStatsQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE is_active = true) as active_users,
          COUNT(*) FILTER (WHERE gmail_personal_connected = true) as gmail_connected_users,
          COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '24 hours') as recently_active_users,
          COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as last_month_new_users
        FROM users
      `;
      
      const basicStatsResult = await pool.query(basicStatsQuery);
      const basicStats = basicStatsResult.rows[0];

      // ロール別統計
      const roleStatsQuery = `
        SELECT role, COUNT(*) as count
        FROM users 
        WHERE is_active = true
        GROUP BY role
      `;
      
      const roleStatsResult = await pool.query(roleStatsQuery);
      
      const usersByRole: { [key in UserRole]: number } = {
        company_leader: 0,
        manager: 0,
        team_leader: 0,
        user: 0
      };

      roleStatsResult.rows.forEach(row => {
        usersByRole[row.role as UserRole] = parseInt(row.count);
      });

      const stats: UserStatsResponse = {
        totalUsers: parseInt(basicStats.total_users),
        activeUsers: parseInt(basicStats.active_users),
        gmailConnectedUsers: parseInt(basicStats.gmail_connected_users),
        usersByRole,
        recentlyActiveUsers: parseInt(basicStats.recently_active_users),
        lastMonthNewUsers: parseInt(basicStats.last_month_new_users)
      };

      console.log('[UserModel.getStats] 統計情報取得完了:', stats);
      return stats;
      
    } catch (error) {
      console.error('[UserModel.getStats] 統計情報取得エラー:', error);
      throw error;
    }
  }

  /**
   * ユーザー活動ログ記録
   */
  static async logActivity(
    userId: ID, 
    action: UserActivityLog['action'],
    details?: string,
    ipAddress?: string,
    userAgent?: string,
    performedBy?: ID
  ): Promise<void> {
    try {
      console.log(`[UserModel.logActivity] 活動ログ記録: ${userId} - ${action}`);
      
      const query = `
        INSERT INTO user_activity_logs (user_id, action, details, ip_address, user_agent, performed_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      await pool.query(query, [userId, action, details, ipAddress, userAgent, performedBy]);
      console.log(`[UserModel.logActivity] 活動ログ記録完了`);
      
    } catch (error) {
      console.error('[UserModel.logActivity] 活動ログ記録エラー:', error);
      // 活動ログのエラーは主要処理を止めない
    }
  }

  /**
   * ユーザー活動ログ取得
   */
  static async getActivityLogs(userId: ID, limit: number = 50): Promise<UserActivityLog[]> {
    try {
      console.log(`[UserModel.getActivityLogs] 活動ログ取得開始: ${userId}`);
      
      const query = `
        SELECT * FROM user_activity_logs 
        WHERE user_id = $1 
        ORDER BY timestamp DESC 
        LIMIT $2
      `;
      
      const result = await pool.query(query, [userId, limit]);
      const logs = result.rows.map(mapRowToActivityLog);
      
      console.log(`[UserModel.getActivityLogs] 活動ログ取得完了: ${logs.length}件`);
      return logs;
      
    } catch (error) {
      console.error('[UserModel.getActivityLogs] 活動ログ取得エラー:', error);
      throw error;
    }
  }

  /**
   * 最終ログイン時刻更新
   */
  static async updateLastLogin(id: ID): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET last_login_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `;
      
      await pool.query(query, [id]);
      console.log(`[UserModel.updateLastLogin] 最終ログイン時刻更新: ${id}`);
      
    } catch (error) {
      console.error('[UserModel.updateLastLogin] 最終ログイン時刻更新エラー:', error);
      throw error;
    }
  }
}

// データベース初期化を自動実行
initializeDatabase();