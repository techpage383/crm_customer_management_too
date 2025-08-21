/**
 * 簡易API統合テスト
 * 実際のサーバーに対してHTTPリクエストを送信してテスト
 */

const request = require('supertest');

const SERVER_URL = 'http://localhost:3000';

describe('API 基本動作テスト', () => {
  it('ヘルスチェックエンドポイントが正常に動作する', async () => {
    const response = await request(SERVER_URL)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
    expect(response.body.environment).toBe('development');
    expect(response.body.version).toBe('1.0.0');
  });

  it('存在しないエンドポイントで404エラーが返される', async () => {
    const response = await request(SERVER_URL)
      .get('/nonexistent')
      .expect(404);
    
    expect(response.body.error).toContain('エンドポイントが見つかりません');
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('認証なしでユーザーAPIにアクセスすると401エラーが返される', async () => {
    const response = await request(SERVER_URL)
      .get('/api/users')
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('システムヘルスチェックが正常に動作する', async () => {
    const response = await request(SERVER_URL)
      .get('/api/system/health')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});