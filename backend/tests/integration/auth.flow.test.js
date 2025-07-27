/**
 * 認証フロー統合テスト
 * 認証システムの基本的な動作を検証
 */

const http = require('http');
const { URL } = require('url');

// テスト設定
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'test@company.com',
  password: 'password'
};

/**
 * HTTPリクエストヘルパー
 */
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: { raw: body }
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * テストケース
 */
async function runTests() {
  console.log('🚀 認証フロー統合テスト開始');
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  let testsPassed = 0;
  let testsFailed = 0;

  // テスト1: ヘルスチェック
  console.log('\n📋 Test 1: API Health Check');
  try {
    const response = await makeRequest('GET', '/api/auth/status');
    
    if (response.statusCode === 200 && response.data.status === 'healthy') {
      console.log('✅ ヘルスチェック成功');
      testsPassed++;
    } else {
      console.log('❌ ヘルスチェック失敗:', response);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ ヘルスチェックエラー:', error.message);
    testsFailed++;
  }

  // テスト2: 設定情報取得
  console.log('\n📋 Test 2: Auth Config');
  try {
    const response = await makeRequest('GET', '/api/auth/config');
    
    if (response.statusCode === 200 && response.data.endpoints) {
      console.log('✅ 認証設定取得成功');
      console.log('   Endpoints:', Object.keys(response.data.endpoints));
      testsPassed++;
    } else {
      console.log('❌ 認証設定取得失敗:', response);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 認証設定取得エラー:', error.message);
    testsFailed++;
  }

  // テスト3: 無効な認証情報でのログイン試行
  console.log('\n📋 Test 3: Invalid Login');
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'invalid@test.com',
      password: 'wrongpassword'
    });
    
    if (response.statusCode === 401 && response.data.code) {
      console.log('✅ 無効な認証情報拒否成功');
      console.log('   Error Code:', response.data.code);
      testsPassed++;
    } else {
      console.log('❌ 無効な認証情報拒否失敗:', response);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 無効認証テストエラー:', error.message);
    testsFailed++;
  }

  // テスト4: 有効な認証情報でのログイン（開発環境のみ）
  console.log('\n📋 Test 4: Valid Login (Development)');
  try {
    const response = await makeRequest('POST', '/api/auth/login', TEST_USER);
    
    if (response.statusCode === 200 && response.data.accessToken) {
      console.log('✅ 有効な認証成功');
      console.log('   User Role:', response.data.user?.role);
      console.log('   Token Type: JWT');
      
      // アクセストークンを保存（次のテストで使用）
      global.testAccessToken = response.data.accessToken;
      global.testRefreshToken = response.data.refreshToken;
      testsPassed++;
    } else {
      console.log('❌ 有効な認証失敗:', response);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 有効認証テストエラー:', error.message);
    testsFailed++;
  }

  // テスト5: 認証が必要なエンドポイントへの未認証アクセス
  console.log('\n📋 Test 5: Protected Endpoint (Unauthorized)');
  try {
    const response = await makeRequest('GET', '/api/auth/me');
    
    if (response.statusCode === 401) {
      console.log('✅ 未認証アクセス拒否成功');
      testsPassed++;
    } else {
      console.log('❌ 未認証アクセス拒否失敗:', response);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 未認証アクセステストエラー:', error.message);
    testsFailed++;
  }

  // テスト6: 認証済みエンドポイントアクセス
  if (global.testAccessToken) {
    console.log('\n📋 Test 6: Protected Endpoint (Authorized)');
    try {
      const response = await makeRequest('GET', '/api/auth/me', null, {
        'Authorization': `Bearer ${global.testAccessToken}`
      });
      
      if (response.statusCode === 200 && response.data.user) {
        console.log('✅ 認証済みアクセス成功');
        console.log('   User ID:', response.data.user.id);
        testsPassed++;
      } else {
        console.log('❌ 認証済みアクセス失敗:', response);
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ 認証済みアクセステストエラー:', error.message);
      testsFailed++;
    }
  }

  // テスト7: トークンリフレッシュ
  if (global.testRefreshToken) {
    console.log('\n📋 Test 7: Token Refresh');
    try {
      const response = await makeRequest('POST', '/api/auth/refresh', {
        refreshToken: global.testRefreshToken
      });
      
      if (response.statusCode === 200 && response.data.accessToken) {
        console.log('✅ トークンリフレッシュ成功');
        global.testNewAccessToken = response.data.accessToken;
        testsPassed++;
      } else {
        console.log('❌ トークンリフレッシュ失敗:', response);
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ トークンリフレッシュエラー:', error.message);
      testsFailed++;
    }
  }

  // テスト8: ログアウト
  if (global.testNewAccessToken || global.testAccessToken) {
    console.log('\n📋 Test 8: Logout');
    try {
      const token = global.testNewAccessToken || global.testAccessToken;
      const response = await makeRequest('POST', '/api/auth/logout', {
        refreshToken: global.testRefreshToken
      }, {
        'Authorization': `Bearer ${token}`
      });
      
      if (response.statusCode === 200) {
        console.log('✅ ログアウト成功');
        testsPassed++;
      } else {
        console.log('❌ ログアウト失敗:', response);
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ ログアウトエラー:', error.message);
      testsFailed++;
    }
  }

  // テスト結果サマリー
  console.log('\n📊 テスト結果サマリー');
  console.log('='.repeat(50));
  console.log(`✅ 成功: ${testsPassed} テスト`);
  console.log(`❌ 失敗: ${testsFailed} テスト`);
  console.log(`📈 成功率: ${Math.round(testsPassed / (testsPassed + testsFailed) * 100)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 すべてのテストが成功しました！');
    process.exit(0);
  } else {
    console.log('\n⚠️  いくつかのテストが失敗しました。');
    process.exit(1);
  }
}

/**
 * テスト実行
 */
if (require.main === module) {
  // 基本的な環境チェック
  console.log('🔍 環境チェック');
  console.log(`Node.js Version: ${process.version}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  
  // サーバー起動待ち
  setTimeout(() => {
    runTests().catch(error => {
      console.error('❌ テスト実行エラー:', error);
      process.exit(1);
    });
  }, 2000); // 2秒待機
}

module.exports = { runTests };