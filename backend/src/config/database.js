/**
 * データベース接続設定
 * PostgreSQL接続プール管理
 */

// 環境変数を最優先で読み込み
require('dotenv').config();

const { Pool } = require('pg');

// データベース接続プール設定
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// 接続プール作成
const pool = new Pool(poolConfig);

// 接続エラーハンドリング
pool.on('error', (err, client) => {
  console.error('PostgreSQL pool error:', err);
});

// 接続テスト
pool.on('connect', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 PostgreSQL接続プール: 新しい接続が確立されました');
  }
});

/**
 * データベースクエリ実行ヘルパー
 */
async function query(text, params = [], client = null) {
  const start = Date.now();
  
  try {
    const queryClient = client || pool;
    const result = await queryClient.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`⚠️ 遅いクエリ検出 (${duration}ms):`, text.substring(0, 100));
    }
    
    return result;
  } catch (error) {
    console.error('データベースクエリエラー:', error);
    console.error('クエリ:', text);
    console.error('パラメータ:', params);
    throw error;
  }
}

/**
 * トランザクション開始
 */
async function beginTransaction() {
  const client = await pool.connect();
  await client.query('BEGIN');
  return client;
}

/**
 * トランザクションコミット
 */
async function commitTransaction(client) {
  try {
    await client.query('COMMIT');
  } finally {
    client.release();
  }
}

/**
 * トランザクションロールバック
 */
async function rollbackTransaction(client) {
  try {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}

/**
 * 接続プールの正常終了
 */
async function closePool() {
  await pool.end();
  console.log('🔌 PostgreSQL接続プール終了');
}

module.exports = {
  pool,
  query,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  closePool
};