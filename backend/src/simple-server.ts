/**
 * シンプルサーバー - Phase 2B API統合テスト用
 * エラーの原因を特定するため、最小限の実装から開始
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS設定
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON解析
app.use(express.json());

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 認証エンドポイント（モック実装）
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔑 Login attempt:', { email, password: '***' });
  
  // バリデーション
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
      code: 'VALIDATION_ERROR'
    });
  }
  
  // モック認証ロジック（有効な認証情報のみ受け入れ）
  const validCredentials = [
    { email: 'test@company.com', password: 'password' },
    { email: 'manager@company.com', password: 'password' },
    { email: 'admin@company.com', password: 'password' }
  ];
  
  const isValid = validCredentials.some(cred => 
    cred.email === email && cred.password === password
  );
  
  if (isValid) {
    res.json({
      user: {
        userId: 'user-123',
        email: email,
        username: email.split('@')[0],
        fullName: 'テストユーザー',
        role: 'MANAGER',
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
        gmailPersonalConnected: false,
        gmailCompanyConnected: false,
        preferences: {}
      },
      accessToken: 'simple-mock-access-token-123',
      refreshToken: 'simple-mock-refresh-token-456',
      expiresIn: 900
    });
  } else {
    res.status(401).json({
      error: 'Invalid email or password',
      code: 'AUTHENTICATION_ERROR'
    });
  }
});

app.post('/api/auth/refresh', (req, res) => {
  console.log('🔄 Token refresh request');
  res.json({
    accessToken: 'simple-mock-access-token-new',
    refreshToken: 'simple-mock-refresh-token-new',
    expiresIn: 900
  });
});

app.get('/api/auth/me', (req, res) => {
  console.log('👤 Current user request');
  res.json({
    userId: 'user-123',
    email: 'test@company.com',
    username: 'testuser',
    fullName: 'テストユーザー',
    role: 'MANAGER',
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    gmailPersonalConnected: false,
    gmailCompanyConnected: false,
    preferences: {}
  });
});

app.post('/api/auth/logout', (req, res) => {
  console.log('👋 Logout request');
  res.json({ message: 'Logout successful' });
});

app.get('/api/auth/google', (req, res) => {
  console.log('📧 Google OAuth request');
  res.json({ 
    authUrl: 'https://accounts.google.com/oauth/authorize?mock=true' 
  });
});

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// エラーハンドラー
app.use((error: Error, req: any, res: any, next: any) => {
  console.error('Simple server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    code: 'SYSTEM_ERROR',
    message: error.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple Backend Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Auth login: http://localhost:${PORT}/api/auth/login`);
  console.log(`🌐 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});