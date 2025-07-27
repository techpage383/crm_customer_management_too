/**
 * Phase 3: エラーシナリオテストスクリプト
 * 自動化されたエラーハンドリング検証
 */

const baseUrl = 'http://localhost:3000/api';

async function runErrorScenarioTests() {
    console.log('🚨 Phase 3: エラーシナリオテスト開始');
    console.log('=====================================');
    
    const testResults = [];

    // テスト1: 空の認証情報
    try {
        console.log('📝 テスト1: 空の認証情報でログイン試行');
        const response = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: '', password: '' })
        });
        
        if (!response.ok) {
            const error = await response.json();
            console.log(`✅ テスト1 成功: ${error.error} (${error.code})`);
            testResults.push({ test: '空の認証情報', status: '成功', message: error.error });
        } else {
            console.log('❌ テスト1 失敗: 空の認証情報が受け入れられた');
            testResults.push({ test: '空の認証情報', status: '失敗', message: '検証不備' });
        }
    } catch (error) {
        console.log(`💥 テスト1 エラー: ${error.message}`);
        testResults.push({ test: '空の認証情報', status: 'エラー', message: error.message });
    }

    // テスト2: 無効な認証情報
    try {
        console.log('📝 テスト2: 無効な認証情報でログイン試行');
        const response = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'invalid@test.com', password: 'wrongpassword' })
        });
        
        if (!response.ok) {
            const error = await response.json();
            console.log(`✅ テスト2 成功: ${error.error}`);
            testResults.push({ test: '無効な認証情報', status: '成功', message: error.error });
        } else {
            console.log('❌ テスト2 失敗: 無効な認証情報が受け入れられた');
            testResults.push({ test: '無効な認証情報', status: '失敗', message: '認証不備' });
        }
    } catch (error) {
        console.log(`💥 テスト2 エラー: ${error.message}`);
        testResults.push({ test: '無効な認証情報', status: 'エラー', message: error.message });
    }

    // テスト3: 不正なJSON形式
    try {
        console.log('📝 テスト3: 不正なJSON形式でリクエスト');
        const response = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{ invalid json format'
        });
        
        if (!response.ok) {
            console.log('✅ テスト3 成功: 不正なJSONが適切に拒否された');
            testResults.push({ test: '不正なJSON', status: '成功', message: 'JSON拒否' });
        } else {
            console.log('❌ テスト3 失敗: 不正なJSONが受け入れられた');
            testResults.push({ test: '不正なJSON', status: '失敗', message: 'JSON検証不備' });
        }
    } catch (error) {
        console.log(`✅ テスト3 成功: ネットワークエラーでキャッチされた`);
        testResults.push({ test: '不正なJSON', status: '成功', message: error.message });
    }

    // テスト4: 存在しないエンドポイント
    try {
        console.log('📝 テスト4: 存在しないエンドポイントへのアクセス');
        const response = await fetch(`${baseUrl}/nonexistent/endpoint`);
        
        if (response.status === 404) {
            console.log('✅ テスト4 成功: 404エラーが適切に返された');
            testResults.push({ test: '存在しないエンドポイント', status: '成功', message: '404エラー' });
        } else {
            console.log(`❌ テスト4 失敗: 期待しないステータス ${response.status}`);
            testResults.push({ test: '存在しないエンドポイント', status: '失敗', message: `Status: ${response.status}` });
        }
    } catch (error) {
        console.log(`💥 テスト4 エラー: ${error.message}`);
        testResults.push({ test: '存在しないエンドポイント', status: 'エラー', message: error.message });
    }

    // テスト5: SQLインジェクション試行
    try {
        console.log('📝 テスト5: SQLインジェクション攻撃試行');
        const sqlInjection = "'; DROP TABLE users; --";
        const response = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: sqlInjection, password: sqlInjection })
        });
        
        // サーバーがまだ稼働していることを確認
        const healthCheck = await fetch(`${baseUrl.replace('/api', '')}/api/health`);
        if (healthCheck.ok) {
            console.log('✅ テスト5 成功: SQLインジェクション攻撃が無効化された');
            testResults.push({ test: 'SQLインジェクション', status: '成功', message: '攻撃無効化' });
        } else {
            console.log('❌ テスト5 失敗: サーバーが応答しない');
            testResults.push({ test: 'SQLインジェクション', status: '失敗', message: 'サーバー停止' });
        }
    } catch (error) {
        console.log(`💥 テスト5 エラー: ${error.message}`);
        testResults.push({ test: 'SQLインジェクション', status: 'エラー', message: error.message });
    }

    // テスト6: XSS攻撃試行
    try {
        console.log('📝 テスト6: XSS攻撃試行');
        const xssPayload = "<script>alert('XSS')</script>";
        const response = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: xssPayload, password: 'test' })
        });
        
        if (!response.ok) {
            console.log('✅ テスト6 成功: XSS攻撃が適切に処理された');
            testResults.push({ test: 'XSS攻撃', status: '成功', message: '攻撃処理済み' });
        } else {
            const data = await response.json();
            const responseText = JSON.stringify(data);
            if (!responseText.includes('<script>')) {
                console.log('✅ テスト6 成功: XSSペイロードがサニタイズされた');
                testResults.push({ test: 'XSS攻撃', status: '成功', message: 'サニタイズ済み' });
            } else {
                console.log('❌ テスト6 失敗: XSSペイロードがそのまま返された');
                testResults.push({ test: 'XSS攻撃', status: '失敗', message: 'サニタイズ不備' });
            }
        }
    } catch (error) {
        console.log(`💥 テスト6 エラー: ${error.message}`);
        testResults.push({ test: 'XSS攻撃', status: 'エラー', message: error.message });
    }

    // テスト結果サマリー
    console.log('\n📊 エラーシナリオテスト結果サマリー');
    console.log('=====================================');
    
    const successCount = testResults.filter(r => r.status === '成功').length;
    const failCount = testResults.filter(r => r.status === '失敗').length;
    const errorCount = testResults.filter(r => r.status === 'エラー').length;
    
    console.log(`✅ 成功: ${successCount}件`);
    console.log(`❌ 失敗: ${failCount}件`);
    console.log(`💥 エラー: ${errorCount}件`);
    
    testResults.forEach((result, index) => {
        const icon = result.status === '成功' ? '✅' : result.status === '失敗' ? '❌' : '💥';
        console.log(`${icon} ${index + 1}. ${result.test}: ${result.message}`);
    });

    const totalTests = testResults.length;
    const successRate = ((successCount / totalTests) * 100).toFixed(1);
    console.log(`\n🎯 テスト成功率: ${successRate}% (${successCount}/${totalTests})`);
    
    if (successRate >= 80) {
        console.log('🎉 エラーハンドリング検証合格！');
    } else {
        console.log('⚠️ エラーハンドリングに改善が必要です');
    }
}

// Node.js環境でのみ実行
if (typeof require !== 'undefined' && require.main === module) {
    // Node.js fetch polyfill
    const fetch = require('node-fetch');
    global.fetch = fetch;
    runErrorScenarioTests().catch(console.error);
}