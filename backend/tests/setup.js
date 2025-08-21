/**
 * Jest グローバル設定ファイル
 * 全テストファイルで共通の設定とセットアップを定義
 */

// 環境変数を最初に読み込み
require('dotenv').config();

// Jest timeout設定（統合テストでは時間がかかる可能性があるため）
jest.setTimeout(30000); // 30秒

// 環境変数の設定
process.env.NODE_ENV = 'test';

// PostgreSQL接続設定（テスト環境用）
// 注意: 実際のSupabaseデータベースを使用（.envから読み込み）
// テスト用のローカルPostgreSQLではなく、本番同等のデータベースでテスト実行

// JWT設定（テスト環境用）
// 注意: 実際のJWT秘密鍵を使用（.envから読み込み）
// テスト用の仮の秘密鍵ではなく、本番同等の秘密鍵でテスト実行

// CORS設定（テスト環境用）
if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = 'http://localhost:5173';
}

// デバッグログ表示の制御
if (process.env.DEBUG_TESTS !== 'true') {
  // テスト時のコンソールログを抑制（エラーは除く）
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    // テスト進捗に関するログ、およびテスト内でのStatusやBodyログを表示
    if (args[0] && (
      args[0].includes('🚀') || 
      args[0].includes('📝') || 
      args[0].includes('🔒') || 
      args[0].includes('🌐') ||
      args[0].includes('🔍') ||
      args[0].includes('📊') ||
      args[0].includes('✅') ||
      args[0].includes('❌') ||
      args[0].includes('⚠️') ||
      args[0].includes('Status:') ||
      args[0].includes('Body:') ||
      args[0].includes('Headers:')
    )) {
      originalConsoleLog(...args);
    }
  };
}

// グローバルエラーハンドラー
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
});

console.log('🧪 Jest テスト環境初期化完了');
console.log(`📊 DATABASE_URL: ${process.env.DATABASE_URL ? '設定済み' : '未設定'}`);
console.log(`🔐 JWT_SECRET: ${process.env.JWT_SECRET ? '設定済み' : '未設定'}`);
console.log(`🌐 FRONTEND_URL: ${process.env.FRONTEND_URL}`);