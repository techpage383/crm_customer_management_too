/**
 * シンプルシステムAPIテスト
 * システムAPIの基本的な動作テスト
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
 * システムAPIテスト
 */
async function runSystemTests() {
  const tracker = new MilestoneTracker();
  console.log('🚀 システムダッシュボードAPI統合テスト開始');
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

  // ステップ2: システムヘルスチェック
  tracker.setOperation('システムヘルスチェック');
  console.log('\n📋 Step 2: システムヘルスチェック');
  try {
    const healthResponse = await makeRequest('GET', '/api/system/health');
    
    console.log('📊 ヘルスチェックレスポンス:', {
      status: healthResponse.statusCode,
      success: healthResponse.data.success,
      status_field: healthResponse.data.status
    });
    
    if (healthResponse.statusCode === 200 && healthResponse.data.success === true) {
      console.log('✅ システムヘルスチェック成功');
      tracker.mark('ヘルスチェック完了');
      testsPassed++;
    } else {
      console.log('❌ システムヘルスチェック失敗:', healthResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ システムヘルスチェックエラー:', error.message);
    testsFailed++;
  }

  // ステップ3: システム統計情報取得（認証あり）
  tracker.setOperation('システム統計情報取得');
  console.log('\n📋 Step 3: システム統計情報取得（認証あり）');
  try {
    const statsResponse = await makeRequest('GET', '/api/system/stats', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 統計情報レスポンス:', {
      status: statsResponse.statusCode,
      success: statsResponse.data.success,
      hasData: !!statsResponse.data.data
    });
    
    if (statsResponse.statusCode === 200 && statsResponse.data.success === true) {
      console.log('✅ システム統計情報取得成功');
      console.log('   データ項目:', Object.keys(statsResponse.data.data || {}));
      tracker.mark('統計情報取得完了');
      testsPassed++;
    } else {
      console.log('❌ システム統計情報取得失敗:', statsResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ システム統計情報取得エラー:', error.message);
    testsFailed++;
  }

  // ステップ4: システム統計情報取得（認証なし）
  tracker.setOperation('認証なしアクセステスト');
  console.log('\n📋 Step 4: システム統計情報取得（認証なし）');
  try {
    const unauthorizedResponse = await makeRequest('GET', '/api/system/stats');
    
    console.log('📊 認証なしレスポンス:', {
      status: unauthorizedResponse.statusCode,
      success: unauthorizedResponse.data.success,
      code: unauthorizedResponse.data.code
    });
    
    if (unauthorizedResponse.statusCode === 401 && unauthorizedResponse.data.code === 'AUTHENTICATION_REQUIRED') {
      console.log('✅ 認証なしアクセス拒否成功');
      tracker.mark('認証なしテスト完了');
      testsPassed++;
    } else {
      console.log('❌ 認証なしアクセス拒否失敗:', unauthorizedResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 認証なしアクセステストエラー:', error.message);
    testsFailed++;
  }

  // ステップ5: システムパフォーマンス情報取得
  tracker.setOperation('パフォーマンス情報取得');
  console.log('\n📋 Step 5: システムパフォーマンス情報取得');
  try {
    const perfResponse = await makeRequest('GET', '/api/system/performance', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 パフォーマンス情報レスポンス:', {
      status: perfResponse.statusCode,
      success: perfResponse.data.success,
      hasData: !!perfResponse.data.data
    });
    
    if (perfResponse.statusCode === 200 && perfResponse.data.success === true) {
      console.log('✅ システムパフォーマンス情報取得成功');
      tracker.mark('パフォーマンス情報取得完了');
      testsPassed++;
    } else {
      console.log('❌ システムパフォーマンス情報取得失敗:', perfResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ システムパフォーマンス情報取得エラー:', error.message);
    testsFailed++;
  }

  // テスト結果サマリー
  console.log('\n📊 システムAPI統合テスト結果サマリー');
  console.log('='.repeat(60));
  console.log(`✅ 成功: ${testsPassed} テスト`);
  console.log(`❌ 失敗: ${testsFailed} テスト`);
  
  if (testsPassed + testsFailed > 0) {
    console.log(`📈 成功率: ${Math.round(testsPassed / (testsPassed + testsFailed) * 100)}%`);
  }
  
  tracker.summary();
  
  if (testsFailed === 0) {
    console.log('\n🎉 システムAPI統合テストが100%成功しました！');
    return true;
  } else {
    console.log('\n⚠️  いくつかのテストが失敗しました。');
    return false;
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
    runSystemTests()
      .then(success => {
        process.exit(success ? 0 : 1);
      })
      .catch(error => {
        console.error('❌ テスト実行エラー:', error);
        process.exit(1);
      });
  }, 1000);
}

module.exports = { runSystemTests };