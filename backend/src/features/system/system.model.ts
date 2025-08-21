/**
 * システムダッシュボード機能 - データモデル層
 * P-004 システムダッシュボードページ
 * 
 * システム全体の稼働状況、パフォーマンス指標、アラート管理のデータ層
 * 型定義は/src/types/index.tsと完全同期
 */

import * as dotenv from 'dotenv';
// 環境変数を最初に読み込み
dotenv.config();

import { Pool, PoolClient } from 'pg';
import os from 'os';
import { 
  SystemStats, 
  SystemAlert, 
  SystemAlertType,
  SystemPerformance,
  ID 
} from '../../types/index.js';

// データベース接続プール
let pool: Pool;

/**
 * データベース接続プールの初期化
 */
export function initializeDatabase(): void {
  if (!pool) {
    console.log('🔍 DATABASE_URL設定確認:', process.env.DATABASE_URL ? 'あり' : 'なし');
    console.log('🔍 DATABASE_URL末尾:', process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(-30) : 'undefined');
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      // IPv4接続を強制（IPv6接続エラー回避）
      options: '--ipv4only=true'
    });

    pool.on('error', (err) => {
      console.error('システム管理機能: データベース接続プールでエラーが発生しました:', err);
    });

    console.log('システム管理機能: データベース接続プール初期化完了');
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
 * システムアラートテーブルのスキーマ作成
 */
export async function createSystemTableSchema(): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // システムアラートテーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(20) NOT NULL CHECK (type IN ('INFO', 'WARNING', 'ERROR', 'SUCCESS')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_read BOOLEAN DEFAULT false,
        action_required BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // システムパフォーマンス履歴テーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_performance_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        cpu_usage NUMERIC(5,2) DEFAULT 0,
        memory_usage NUMERIC(5,2) DEFAULT 0,
        active_connections INTEGER DEFAULT 0,
        api_response_time NUMERIC(8,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // システム設定テーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_by UUID
      );
    `);

    // インデックス作成
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_system_alerts_timestamp ON system_alerts(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(type);
      CREATE INDEX IF NOT EXISTS idx_system_alerts_is_read ON system_alerts(is_read);
      CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON system_performance_history(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
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
      DROP TRIGGER IF EXISTS update_system_alerts_updated_at ON system_alerts;
      CREATE TRIGGER update_system_alerts_updated_at
        BEFORE UPDATE ON system_alerts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
      CREATE TRIGGER update_system_settings_updated_at
        BEFORE UPDATE ON system_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query('COMMIT');
    console.log('システム管理機能: データベーススキーマ作成完了');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('システム管理機能: スキーマ作成エラー:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * データベース行をSystemAlertオブジェクトに変換
 */
function mapRowToSystemAlert(row: any): SystemAlert {
  return {
    id: row.id,
    type: row.type as SystemAlertType,
    title: row.title,
    message: row.message,
    timestamp: new Date(row.timestamp),
    isRead: row.is_read,
    actionRequired: row.action_required
  };
}

/**
 * データベース行をSystemPerformanceオブジェクトに変換
 */
function mapRowToSystemPerformance(row: any): SystemPerformance {
  return {
    timestamp: new Date(row.timestamp),
    cpuUsage: parseFloat(row.cpu_usage),
    memoryUsage: parseFloat(row.memory_usage),
    activeConnections: parseInt(row.active_connections),
    apiResponseTime: parseFloat(row.api_response_time)
  };
}

/**
 * システム管理データモデル操作クラス
 */
export class SystemModel {
  /**
   * システム統計情報取得
   */
  static async getSystemStats(): Promise<SystemStats> {
    try {
      console.log('[SystemModel.getSystemStats] システム統計情報取得開始');
      
      // 基本統計の並列取得
      const [
        userStatsResult,
        companyStatsResult,
        todoStatsResult,
        gmailStatsResult
      ] = await Promise.all([
        // ユーザー統計
        pool.query(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(*) FILTER (WHERE is_active = true) as active_users
          FROM users
        `),
        // 企業統計（仮想テーブル - 実装時に実際のテーブルに置き換え）
        pool.query(`
          SELECT 
            0 as total_companies
        `),
        // TODO統計（仮想テーブル - 実装時に実際のテーブルに置き換え）
        pool.query(`
          SELECT 
            0 as total_todos,
            0 as completed_todos
        `),
        // Gmail接続統計（まだ実装されていない列のため0を返す）
        pool.query(`
          SELECT 
            0 as gmail_connections
        `)
      ]);

      // システム情報取得
      const uptimeSeconds = process.uptime();
      const uptimePercentage = Math.min((uptimeSeconds / (24 * 60 * 60)) * 100, 100); // 24時間を100%とする

      // データベースサイズ取得
      const dbSizeResult = await pool.query(`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as size,
          pg_database_size(current_database()) as size_bytes
      `);

      // 最終バックアップ時間取得（設定テーブルから）
      const backupResult = await pool.query(`
        SELECT value FROM system_settings WHERE key = 'last_backup_at' LIMIT 1
      `);

      const userStats = userStatsResult.rows[0];
      const companyStats = companyStatsResult.rows[0];
      const todoStats = todoStatsResult.rows[0];
      const gmailStats = gmailStatsResult.rows[0];
      const dbSize = dbSizeResult.rows[0];

      // API応答時間の平均値取得（直近1時間）
      const perfResult = await pool.query(`
        SELECT AVG(api_response_time) as avg_response_time
        FROM system_performance_history 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      `);

      const avgResponseTime = perfResult.rows[0]?.avg_response_time || 100; // デフォルト100ms

      const stats: SystemStats = {
        totalUsers: parseInt(userStats.total_users) || 0,
        activeUsers: parseInt(userStats.active_users) || 0,
        totalCompanies: parseInt(companyStats.total_companies) || 0,
        totalTodos: parseInt(todoStats.total_todos) || 0,
        completedTodos: parseInt(todoStats.completed_todos) || 0,
        gmailConnections: parseInt(gmailStats.gmail_connections) || 0,
        systemUptime: Math.round(uptimePercentage * 100) / 100,
        apiResponseTime: Math.round(parseFloat(avgResponseTime) * 100) / 100,
        databaseSize: Math.round((parseInt(dbSize.size_bytes) || 0) / (1024 * 1024) * 100) / 100, // MB
        lastBackup: backupResult.rows[0]?.value ? new Date(backupResult.rows[0].value) : new Date()
      };

      console.log('[SystemModel.getSystemStats] システム統計情報取得完了:', stats);
      return stats;
      
    } catch (error) {
      console.error('[SystemModel.getSystemStats] システム統計情報取得エラー:', error);
      throw error;
    }
  }

  /**
   * システムアラート作成
   */
  static async createAlert(
    type: SystemAlertType, 
    title: string, 
    message: string, 
    actionRequired: boolean = false
  ): Promise<SystemAlert> {
    try {
      console.log(`[SystemModel.createAlert] アラート作成開始: ${type} - ${title}`);
      
      const query = `
        INSERT INTO system_alerts (type, title, message, action_required)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [type, title, message, actionRequired];
      const result = await pool.query(query, values);
      const alert = mapRowToSystemAlert(result.rows[0]);
      
      console.log(`[SystemModel.createAlert] アラート作成完了: ${alert.id}`);
      return alert;
      
    } catch (error) {
      console.error('[SystemModel.createAlert] アラート作成エラー:', error);
      throw error;
    }
  }

  /**
   * システムアラート一覧取得
   */
  static async getAlerts(limit: number = 50, onlyUnread: boolean = false): Promise<SystemAlert[]> {
    try {
      console.log(`[SystemModel.getAlerts] アラート一覧取得開始: limit=${limit}, onlyUnread=${onlyUnread}`);
      
      const whereClause = onlyUnread ? 'WHERE is_read = false' : '';
      const query = `
        SELECT * FROM system_alerts 
        ${whereClause}
        ORDER BY timestamp DESC 
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      const alerts = result.rows.map(mapRowToSystemAlert);
      
      console.log(`[SystemModel.getAlerts] アラート一覧取得完了: ${alerts.length}件`);
      return alerts;
      
    } catch (error) {
      console.error('[SystemModel.getAlerts] アラート一覧取得エラー:', error);
      throw error;
    }
  }

  /**
   * アラート既読化
   */
  static async markAlertAsRead(alertId: ID): Promise<boolean> {
    try {
      console.log(`[SystemModel.markAlertAsRead] アラート既読化開始: ${alertId}`);
      
      const query = `
        UPDATE system_alerts 
        SET is_read = true, updated_at = NOW()
        WHERE id = $1 AND is_read = false
        RETURNING id
      `;
      
      const result = await pool.query(query, [alertId]);
      const success = result.rows.length > 0;
      
      if (success) {
        console.log(`[SystemModel.markAlertAsRead] アラート既読化完了: ${alertId}`);
      } else {
        console.log(`[SystemModel.markAlertAsRead] アラートが見つからないか既に既読: ${alertId}`);
      }
      
      return success;
      
    } catch (error) {
      console.error('[SystemModel.markAlertAsRead] アラート既読化エラー:', error);
      throw error;
    }
  }

  /**
   * 全アラート既読化
   */
  static async markAllAlertsAsRead(): Promise<number> {
    try {
      console.log('[SystemModel.markAllAlertsAsRead] 全アラート既読化開始');
      
      const query = `
        UPDATE system_alerts 
        SET is_read = true, updated_at = NOW()
        WHERE is_read = false
        RETURNING id
      `;
      
      const result = await pool.query(query);
      const count = result.rows.length;
      
      console.log(`[SystemModel.markAllAlertsAsRead] 全アラート既読化完了: ${count}件`);
      return count;
      
    } catch (error) {
      console.error('[SystemModel.markAllAlertsAsRead] 全アラート既読化エラー:', error);
      throw error;
    }
  }

  /**
   * システムパフォーマンス記録
   */
  static async recordPerformance(performance: Omit<SystemPerformance, 'timestamp'>): Promise<void> {
    try {
      console.log('[SystemModel.recordPerformance] パフォーマンス記録開始');
      
      const query = `
        INSERT INTO system_performance_history (cpu_usage, memory_usage, active_connections, api_response_time)
        VALUES ($1, $2, $3, $4)
      `;
      
      const values = [
        performance.cpuUsage,
        performance.memoryUsage,
        performance.activeConnections,
        performance.apiResponseTime
      ];
      
      await pool.query(query, values);
      console.log('[SystemModel.recordPerformance] パフォーマンス記録完了');
      
    } catch (error) {
      console.error('[SystemModel.recordPerformance] パフォーマンス記録エラー:', error);
      throw error;
    }
  }

  /**
   * システムパフォーマンス履歴取得
   */
  static async getPerformanceHistory(hours: number = 24): Promise<SystemPerformance[]> {
    try {
      console.log(`[SystemModel.getPerformanceHistory] パフォーマンス履歴取得開始: ${hours}時間`);
      
      const query = `
        SELECT * FROM system_performance_history 
        WHERE timestamp > NOW() - INTERVAL '${hours} hours'
        ORDER BY timestamp DESC
      `;
      
      const result = await pool.query(query);
      const history = result.rows.map(mapRowToSystemPerformance);
      
      console.log(`[SystemModel.getPerformanceHistory] パフォーマンス履歴取得完了: ${history.length}件`);
      return history;
      
    } catch (error) {
      console.error('[SystemModel.getPerformanceHistory] パフォーマンス履歴取得エラー:', error);
      throw error;
    }
  }

  /**
   * 現在のシステムパフォーマンス取得
   */
  static async getCurrentPerformance(): Promise<SystemPerformance> {
    try {
      console.log('[SystemModel.getCurrentPerformance] 現在のパフォーマンス取得開始');
      
      // CPU使用率とメモリ使用率を取得
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
      
      // CPU使用率の計算（簡易版 - より精密には loadavg を使用）
      const loadAvg = os.loadavg()[0]; // 1分間の平均負荷
      const cpuCount = os.cpus().length;
      const cpuUsage = Math.min((loadAvg / cpuCount) * 100, 100);
      
      // アクティブ接続数（データベースプールから取得）
      const poolInfo = pool as any;
      const activeConnections = poolInfo.totalCount || 0;
      
      // 直近のAPI応答時間
      const recentPerfResult = await pool.query(`
        SELECT api_response_time 
        FROM system_performance_history 
        ORDER BY timestamp DESC 
        LIMIT 1
      `);
      
      const recentApiResponseTime = recentPerfResult.rows[0]?.api_response_time || 100;
      
      const performance: SystemPerformance = {
        timestamp: new Date(),
        cpuUsage: Math.round(cpuUsage * 100) / 100,
        memoryUsage: Math.round(memoryUsage * 100) / 100,
        activeConnections,
        apiResponseTime: parseFloat(recentApiResponseTime)
      };
      
      console.log('[SystemModel.getCurrentPerformance] 現在のパフォーマンス取得完了:', performance);
      return performance;
      
    } catch (error) {
      console.error('[SystemModel.getCurrentPerformance] 現在のパフォーマンス取得エラー:', error);
      throw error;
    }
  }

  /**
   * システム設定保存
   */
  static async saveSetting(key: string, value: string, updatedBy?: ID): Promise<void> {
    try {
      console.log(`[SystemModel.saveSetting] 設定保存開始: ${key}`);
      
      const query = `
        INSERT INTO system_settings (key, value, updated_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (key) 
        DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()
      `;
      
      await pool.query(query, [key, value, updatedBy]);
      console.log(`[SystemModel.saveSetting] 設定保存完了: ${key}`);
      
    } catch (error) {
      console.error('[SystemModel.saveSetting] 設定保存エラー:', error);
      throw error;
    }
  }

  /**
   * システム設定取得
   */
  static async getSetting(key: string): Promise<string | null> {
    try {
      console.log(`[SystemModel.getSetting] 設定取得開始: ${key}`);
      
      const query = 'SELECT value FROM system_settings WHERE key = $1';
      const result = await pool.query(query, [key]);
      
      const value = result.rows[0]?.value || null;
      console.log(`[SystemModel.getSetting] 設定取得完了: ${key} = ${value}`);
      
      return value;
      
    } catch (error) {
      console.error('[SystemModel.getSetting] 設定取得エラー:', error);
      throw error;
    }
  }

  /**
   * ヘルスチェック
   */
  static async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const start = Date.now();
      
      // データベース接続テスト
      await pool.query('SELECT 1');
      const dbResponseTime = Date.now() - start;
      
      // システム情報取得
      const systemInfo = {
        nodeVersion: process.version,
        platform: os.platform(),
        architecture: os.arch(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: os.loadavg(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem()
      };
      
      return {
        status: 'healthy',
        details: {
          database: {
            status: 'connected',
            responseTime: dbResponseTime
          },
          system: systemInfo,
          timestamp: new Date()
        }
      };
      
    } catch (error) {
      console.error('[SystemModel.healthCheck] ヘルスチェックエラー:', error);
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date()
        }
      };
    }
  }
}

// データベース初期化を自動実行
initializeDatabase();

// スキーマ作成を自動実行（初期化後に実行）
setTimeout(async () => {
  try {
    console.log('システム管理機能: スキーマ作成を開始します...');
    await createSystemTableSchema();
    console.log('システム管理機能: スキーマ作成が完了しました');
  } catch (error) {
    console.error('システム管理機能: スキーマ作成エラー:', error);
  }
}, 1000); // 1秒後に実行（データベースプール初期化を待つ）