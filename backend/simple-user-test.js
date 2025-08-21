/**
 * シンプルユーザー管理テスト
 * ユーザー管理APIの基本的な動作テスト
 */

const http = require('http');
const { URL } = require('url');
const { MilestoneTracker } = require('./tests/utils/MilestoneTracker.js');

// テスト設定
const API_BASE_URL = 'http://localhost:3000';
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
async function runUserTests() {
  const tracker = new MilestoneTracker();
  console.log('🚀 ユーザー管理API基本テスト開始');
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  let testsPassed = 0;
  let testsFailed = 0;
  let authToken = null;

  // ステップ1: 認証
  tracker.setOperation('認証処理');
  console.log('\n📋 Step 1: ログイン認証');
  try {
    const loginResponse = await makeRequest('POST', '/api/auth/login', TEST_USER);
    
    if (loginResponse.statusCode === 200 && loginResponse.data.accessToken) {
      console.log('✅ ログイン成功');
      authToken = loginResponse.data.accessToken;
      tracker.mark('認証完了');
      testsPassed++;
    } else {
      console.log('❌ ログイン失敗:', loginResponse);
      testsFailed++;
      return;
    }
  } catch (error) {
    console.log('❌ ログインエラー:', error.message);
    testsFailed++;
    return;
  }

  // ステップ2: ユーザー一覧取得テスト
  tracker.setOperation('ユーザー一覧取得');
  console.log('\n📋 Step 2: ユーザー一覧取得');
  try {
    const usersResponse = await makeRequest('GET', '/api/users', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 レスポンス:', {
      status: usersResponse.statusCode,
      hasData: !!usersResponse.data,
      dataType: typeof usersResponse.data
    });
    
    if (usersResponse.statusCode === 200) {
      console.log('✅ ユーザー一覧取得成功');
      tracker.mark('ユーザー一覧取得完了');
      testsPassed++;
    } else if (usersResponse.statusCode === 404) {
      console.log('ℹ️  ユーザー管理エンドポイントが未実装またはルートが見つからない');
      console.log('   現在のテストサーバーにはユーザー管理APIが実装されていない可能性があります');
      testsFailed++;
    } else {
      console.log('❌ ユーザー一覧取得失敗:', usersResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ ユーザー一覧取得エラー:', error.message);
    testsFailed++;
  }

  // ステップ3: 利用可能なエンドポイント確認
  tracker.setOperation('エンドポイント確認');
  console.log('\n📋 Step 3: 利用可能エンドポイント確認');
  
  const endpoints = [
    '/api/auth/status',
    '/api/auth/config', 
    '/api/users',
    '/api/system/health',
    '/api/system/stats',
    '/api/companies',
    '/api/todos'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest('GET', endpoint, null, 
        endpoint.startsWith('/api/auth') ? {} : { 'Authorization': `Bearer ${authToken}` }
      );
      console.log(`${endpoint}: ${response.statusCode} ${response.statusCode < 400 ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`${endpoint}: ERROR ❌`);
    }
  }
  
  tracker.mark('エンドポイント確認完了');

  // テスト結果サマリー
  console.log('\n📊 テスト結果サマリー');
  console.log('='.repeat(50));
  console.log(`✅ 成功: ${testsPassed} テスト`);
  console.log(`❌ 失敗: ${testsFailed} テスト`);
  
  if (testsPassed > 0) {
    console.log(`📈 成功率: ${Math.round(testsPassed / (testsPassed + testsFailed) * 100)}%`);
  }
  
  tracker.summary();
  
  if (testsFailed === 0) {
    console.log('\n🎉 すべてのテストが成功しました！');
  } else {
    console.log('\n⚠️  いくつかのテストが失敗しました。');
    console.log('💡 ヒント: 完全なバックエンドサーバーが必要な可能性があります');
  }
}

/**
 * テスト実行
 */
if (require.main === module) {
  console.log('🔍 環境チェック');
  console.log(`Node.js Version: ${process.version}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  
  // サーバー起動待ち
  setTimeout(() => {
    runUserTests().catch(error => {
      console.error('❌ テスト実行エラー:', error);
      process.exit(1);
    });
  }, 1000);
}

module.exports = { runUserTests };