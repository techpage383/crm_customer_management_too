/**
 * シンプルユーザー管理APIテスト
 * ユーザー管理機能の基本的な動作テスト
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
 * ユーザー管理APIテスト
 */
async function runUserManagementTests() {
  const tracker = new MilestoneTracker();
  console.log('🚀 ユーザー管理API統合テスト開始');
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

  // ステップ2: ユーザー一覧取得（認証あり）
  tracker.setOperation('ユーザー一覧取得');
  console.log('\n📋 Step 2: ユーザー一覧取得（認証あり）');
  try {
    const usersResponse = await makeRequest('GET', '/api/users', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 ユーザー一覧レスポンス:', {
      status: usersResponse.statusCode,
      success: usersResponse.data.success,
      userCount: usersResponse.data.data?.length
    });
    
    if (usersResponse.statusCode === 200 && usersResponse.data.success === true) {
      console.log('✅ ユーザー一覧取得成功');
      console.log('   取得ユーザー数:', usersResponse.data.data?.length);
      tracker.mark('ユーザー一覧取得完了');
      testsPassed++;
    } else {
      console.log('❌ ユーザー一覧取得失敗:', usersResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ ユーザー一覧取得エラー:', error.message);
    testsFailed++;
  }

  // ステップ3: ユーザー一覧取得（認証なし）
  tracker.setOperation('認証なしアクセステスト');
  console.log('\n📋 Step 3: ユーザー一覧取得（認証なし）');
  try {
    const unauthorizedResponse = await makeRequest('GET', '/api/users');
    
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

  // ステップ4: 新規ユーザー作成
  tracker.setOperation('新規ユーザー作成');
  console.log('\n📋 Step 4: 新規ユーザー作成');
  try {
    const newUserData = {
      email: 'newuser@company.com',
      name: '新規テストユーザー',
      role: 'USER',
      password: 'testpassword123'
    };
    
    const createResponse = await makeRequest('POST', '/api/users', newUserData, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 ユーザー作成レスポンス:', {
      status: createResponse.statusCode,
      success: createResponse.data.success,
      hasData: !!createResponse.data.data
    });
    
    if (createResponse.statusCode === 201 && createResponse.data.success === true) {
      console.log('✅ 新規ユーザー作成成功');
      console.log('   作成ユーザー:', createResponse.data.data?.email);
      tracker.mark('ユーザー作成完了');
      testsPassed++;
    } else {
      console.log('❌ 新規ユーザー作成失敗:', createResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 新規ユーザー作成エラー:', error.message);
    testsFailed++;
  }

  // ステップ5: 重複メールアドレスエラーテスト
  tracker.setOperation('重複メールアドレステスト');
  console.log('\n📋 Step 5: 重複メールアドレステスト');
  try {
    const duplicateUserData = {
      email: 'duplicate@company.com',
      name: '重複テストユーザー',
      role: 'USER',
      password: 'testpassword123'
    };
    
    const duplicateResponse = await makeRequest('POST', '/api/users', duplicateUserData, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 重複メールテストレスポンス:', {
      status: duplicateResponse.statusCode,
      success: duplicateResponse.data.success,
      code: duplicateResponse.data.code
    });
    
    if (duplicateResponse.statusCode === 409 && duplicateResponse.data.code === 'EMAIL_ALREADY_EXISTS') {
      console.log('✅ 重複メールアドレス拒否成功');
      tracker.mark('重複メールテスト完了');
      testsPassed++;
    } else {
      console.log('❌ 重複メールアドレス拒否失敗:', duplicateResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ 重複メールアドレステストエラー:', error.message);
    testsFailed++;
  }

  // ステップ6: ユーザー詳細取得
  tracker.setOperation('ユーザー詳細取得');
  console.log('\n📋 Step 6: ユーザー詳細取得');
  try {
    const userDetailResponse = await makeRequest('GET', '/api/users/test-user-1', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 ユーザー詳細レスポンス:', {
      status: userDetailResponse.statusCode,
      success: userDetailResponse.data.success,
      hasData: !!userDetailResponse.data.data
    });
    
    if (userDetailResponse.statusCode === 200 && userDetailResponse.data.success === true) {
      console.log('✅ ユーザー詳細取得成功');
      tracker.mark('ユーザー詳細取得完了');
      testsPassed++;
    } else {
      console.log('❌ ユーザー詳細取得失敗:', userDetailResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ ユーザー詳細取得エラー:', error.message);
    testsFailed++;
  }

  // ステップ7: ユーザー統計情報取得
  tracker.setOperation('ユーザー統計情報取得');
  console.log('\n📋 Step 7: ユーザー統計情報取得');
  try {
    const statsResponse = await makeRequest('GET', '/api/users/stats', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('📊 統計情報レスポンス:', {
      status: statsResponse.statusCode,
      success: statsResponse.data.success,
      hasData: !!statsResponse.data.data
    });
    
    if (statsResponse.statusCode === 200 && statsResponse.data.success === true) {
      console.log('✅ ユーザー統計情報取得成功');
      console.log('   統計項目:', Object.keys(statsResponse.data.data || {}));
      tracker.mark('統計情報取得完了');
      testsPassed++;
    } else {
      console.log('❌ ユーザー統計情報取得失敗:', statsResponse);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ ユーザー統計情報取得エラー:', error.message);
    testsFailed++;
  }

  // テスト結果サマリー
  console.log('\n📊 ユーザー管理API統合テスト結果サマリー');
  console.log('='.repeat(60));
  console.log(`✅ 成功: ${testsPassed} テスト`);
  console.log(`❌ 失敗: ${testsFailed} テスト`);
  
  if (testsPassed + testsFailed > 0) {
    console.log(`📈 成功率: ${Math.round(testsPassed / (testsPassed + testsFailed) * 100)}%`);
  }
  
  tracker.summary();
  
  if (testsFailed === 0) {
    console.log('\n🎉 ユーザー管理API統合テストが100%成功しました！');
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
    runUserManagementTests()
      .then(success => {
        process.exit(success ? 0 : 1);
      })
      .catch(error => {
        console.error('❌ テスト実行エラー:', error);
        process.exit(1);
      });
  }, 1000);
}

module.exports = { runUserManagementTests };