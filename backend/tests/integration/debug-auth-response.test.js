/**
 * 認証レスポンス内容のデバッグ
 */

const request = require('supertest');

const SERVER_URL = 'http://localhost:3000';

describe('認証レスポンス内容確認', () => {
  
  it('認証なしでレスポンス内容を詳細確認', async () => {
    const response = await request(SERVER_URL)
      .get('/api/users');
    
    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(response.body, null, 2));
    console.log('Headers:', response.headers);
    
    expect(response.status).toBe(401);
  });

});