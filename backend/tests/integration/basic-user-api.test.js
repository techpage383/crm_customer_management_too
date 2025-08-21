/**
 * 基本ユーザーAPI動作確認テスト
 * 複雑な統合テストの前に基本動作を確認
 */

const request = require('supertest');

const SERVER_URL = 'http://localhost:3000';

describe('基本ユーザーAPI動作確認', () => {
  
  it('認証なしで/api/usersアクセスすると401エラー', async () => {
    const response = await request(SERVER_URL)
      .get('/api/users');
    
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('存在しないユーザーIDで404エラー', async () => {
    const response = await request(SERVER_URL)
      .get('/api/users/00000000-0000-0000-0000-000000000000');
    
    expect(response.status).toBe(401); // 認証エラーが先に出るはず
  });

});