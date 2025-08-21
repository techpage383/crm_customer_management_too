/**
 * データベーステストヘルパー
 * ★9統合テスト成功請負人用のデータベース操作支援ユーティリティ
 */

// 環境変数を最初に読み込み
require('dotenv').config();
const { Pool } = require('pg');

/**
 * テスト用データベース接続プール
 */
class DatabaseTestHelper {
  constructor() {
    this.pool = null;
    this.transactionCount = 0;
  }

  /**
   * データベース接続初期化
   */
  async initialize() {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      this.pool.on('error', (err) => {
        console.error('データベーステストプールエラー:', err);
      });

      console.log('🔧 テスト用データベース接続プール初期化完了');
    }
  }

  /**
   * データベース接続取得
   */
  async getConnection() {
    if (!this.pool) {
      await this.initialize();
    }
    return await this.pool.connect();
  }

  /**
   * トランザクション開始（テスト分離用）
   */
  async beginTransaction() {
    const client = await this.getConnection();
    await client.query('BEGIN');
    this.transactionCount++;
    console.log(`🔄 トランザクション開始 #${this.transactionCount}`);
    return client;
  }

  /**
   * トランザクションロールバック（テストクリーンアップ用）
   */
  async rollbackTransaction(client) {
    try {
      await client.query('ROLLBACK');
      console.log(`↩️ トランザクションロールバック #${this.transactionCount}`);
    } catch (error) {
      console.error('ロールバックエラー:', error);
    } finally {
      client.release();
      this.transactionCount--;
    }
  }

  /**
   * トランザクションコミット（必要な場合のみ）
   */
  async commitTransaction(client) {
    try {
      await client.query('COMMIT');
      console.log(`✅ トランザクションコミット #${this.transactionCount}`);
    } catch (error) {
      console.error('コミットエラー:', error);
      await client.query('ROLLBACK');
    } finally {
      client.release();
      this.transactionCount--;
    }
  }

  /**
   * クエリ実行（ヘルパーメソッド）
   */
  async query(text, params, client = null) {
    const dbClient = client || this.pool;
    const start = Date.now();
    
    try {
      const result = await dbClient.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) { // 1秒以上のクエリは警告
        console.warn(`⏰ 長時間クエリ検出: ${duration}ms`);
        console.warn(`SQL: ${text.substring(0, 100)}...`);
      }
      
      return result;
    } catch (error) {
      console.error('クエリエラー:', error);
      console.error('SQL:', text);
      console.error('パラメータ:', params);
      throw error;
    }
  }

  /**
   * テーブル存在チェック
   */
  async tableExists(tableName) {
    const result = await this.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
      [tableName]
    );
    return result.rows[0].exists;
  }

  /**
   * テストデータクリーンアップ（テスト後の掃除）
   */
  async cleanupTestData(patterns = []) {
    const defaultPatterns = [
      'test-%',
      '%-test-%',
      '%@test.com',
      'unittest-%'
    ];
    
    const allPatterns = [...defaultPatterns, ...patterns];
    
    for (const pattern of allPatterns) {
      try {
        // ユーザーテーブルのテストデータ削除
        await this.query(
          'DELETE FROM users WHERE email LIKE $1 OR username LIKE $1',
          [pattern]
        );
        
        console.log(`🧹 テストデータ削除完了: ${pattern}`);
      } catch (error) {
        console.warn(`テストデータ削除警告 (${pattern}):`, error.message);
      }
    }
  }

  /**
   * データベース接続終了
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 テスト用データベース接続プール終了');
    }
  }

  /**
   * データベース統計情報取得（デバッグ用）
   */
  async getStats() {
    const stats = await this.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('📊 データベース統計:');
    stats.rows.forEach(row => {
      console.log(`   ${row.tablename}: +${row.inserts} ~${row.updates} -${row.deletes}`);
    });
    
    return stats.rows;
  }
}

// シングルトンインスタンス
const dbTestHelper = new DatabaseTestHelper();

module.exports = {
  DatabaseTestHelper,
  dbTestHelper
};