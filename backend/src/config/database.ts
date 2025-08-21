/**
 * データベース接続設定（TypeScript版）
 * PostgreSQL接続プール管理
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import * as dotenv from 'dotenv';

// 環境変数読み込み
dotenv.config();

// データベース接続プール設定
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// 接続プール作成
export const pool = new Pool(poolConfig);

// 接続エラーハンドリング
pool.on('error', (err: Error, client: PoolClient) => {
  console.error('PostgreSQL pool error:', err);
});

// 接続テスト
pool.on('connect', (client: PoolClient) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 PostgreSQL接続プール: 新しい接続が確立されました');
  }
});

/**
 * データベースクエリ実行ヘルパー
 */
export async function query(text: string, params: any[] = [], client: PoolClient | null = null): Promise<QueryResult> {
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
export async function beginTransaction(): Promise<PoolClient> {
  const client = await pool.connect();
  await client.query('BEGIN');
  return client;
}

/**
 * トランザクションコミット
 */
export async function commitTransaction(client: PoolClient): Promise<void> {
  try {
    await client.query('COMMIT');
  } finally {
    client.release();
  }
}

/**
 * トランザクションロールバック
 */
export async function rollbackTransaction(client: PoolClient): Promise<void> {
  try {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}

/**
 * 接続プールの正常終了
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('🔌 PostgreSQL接続プール終了');
}