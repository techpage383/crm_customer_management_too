const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// CORS設定
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Session-Token']
}));

app.use(express.json());

// セキュリティヘッダー
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

// ログ
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// 認証エンドポイント
app.get('/api/auth/status', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: {
      jwtAuth: true,
      googleOAuth: !!process.env.GOOGLE_CLIENT_ID,
      refreshTokens: true,
      rateLimiting: true,
      csrfProtection: false // テスト環境では無効
    }
  });
});

app.get('/api/auth/config', (req, res) => {
  res.json({
    google: {
      enabled: !!process.env.GOOGLE_CLIENT_ID,
      clientId: process.env.GOOGLE_CLIENT_ID
    },
    security: {
      mfaEnabled: process.env.MFA_ENABLED === 'true',
      passwordMinLength: 8,
      sessionTimeout: 30 * 60 * 1000
    },
    endpoints: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      googleLogin: '/api/auth/google',
      me: '/api/auth/me'
    }
  });
});

// システムAPIエンドポイント
app.get('/api/system/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected',
    memory: {
      usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      limit: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  });
});

app.get('/api/system/stats', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED',
      redirectTo: '/login'
    });
  }
  
  const token = authHeader.substring(7);
  if (token !== 'test-access-token-123' && token !== 'test-new-access-token-789') {
    return res.status(401).json({
      success: false,
      error: 'トークンが無効です',
      code: 'INVALID_TOKEN'
    });
  }
  
  res.json({
    success: true,
    data: {
      totalUsers: 10,
      activeUsers: 8,
      totalCompanies: 25,
      activeTodos: 45,
      systemAlerts: 2,
      databaseConnections: 15,
      memoryUsage: 67.5,
      cpuUsage: 23.1,
      uptime: Math.floor(process.uptime()),
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  });
});

app.get('/api/system/performance', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  res.json({
    success: true,
    data: {
      responseTime: 150,
      throughput: 1200,
      errorRate: 0.1,
      activeConnections: 45
    }
  });
});

// ユーザー管理APIエンドポイント
app.get('/api/users', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED',
      redirectTo: '/login'
    });
  }
  
  const token = authHeader.substring(7);
  if (token !== 'test-access-token-123' && token !== 'test-new-access-token-789') {
    return res.status(401).json({
      success: false,
      error: 'トークンが無効です',
      code: 'INVALID_TOKEN'
    });
  }
  
  // 検索・フィルタリング対応
  const { search, role, status, page = 1, limit = 10 } = req.query;
  
  const users = [
    {
      id: 'user-1',
      email: 'admin@company.com',
      name: '管理者ユーザー',
      role: 'COMPANY_LEADER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    },
    {
      id: 'user-2', 
      email: 'manager@company.com',
      name: 'マネージャー',
      role: 'MANAGER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    },
    {
      id: 'user-3',
      email: 'user@company.com', 
      name: '一般ユーザー',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastLoginAt: null
    }
  ];
  
  res.json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: users.length,
      totalPages: 1
    }
  });
});

app.post('/api/users', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  const { email, name, role, password } = req.body;
  
  if (!email || !name || !role || !password) {
    return res.status(400).json({
      success: false,
      error: 'バリデーションエラー',
      code: 'VALIDATION_ERROR',
      details: ['email、name、role、passwordは必須です']
    });
  }
  
  if (email === 'duplicate@company.com') {
    return res.status(409).json({
      success: false,
      error: 'メールアドレスが既に使用されています',
      code: 'EMAIL_ALREADY_EXISTS'
    });
  }
  
  const newUser = {
    id: `user-${Date.now()}`,
    email,
    name,
    role,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    lastLoginAt: null
  };
  
  res.status(201).json({
    success: true,
    data: newUser
  });
});

app.get('/api/users/stats', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  res.json({
    success: true,
    data: {
      totalUsers: 15,
      activeUsers: 12,
      inactiveUsers: 3,
      adminUsers: 2,
      regularUsers: 13,
      newUsersThisMonth: 3,
      lastLoginToday: 8
    }
  });
});

app.get('/api/users/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  const { id } = req.params;
  
  if (id === 'non-existent') {
    return res.status(404).json({
      success: false,
      error: 'ユーザーが見つかりません',
      code: 'USER_NOT_FOUND'
    });
  }
  
  const user = {
    id,
    email: `user${id}@company.com`,
    name: `テストユーザー${id}`,
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: user
  });
});

app.put('/api/users/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  const { id } = req.params;
  const { name, role, status } = req.body;
  
  const updatedUser = {
    id,
    email: `user${id}@company.com`,
    name: name || `更新ユーザー${id}`,
    role: role || 'USER',
    status: status || 'ACTIVE',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: updatedUser
  });
});

app.delete('/api/users/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  const { id } = req.params;
  
  if (id === 'self-delete-test') {
    return res.status(403).json({
      success: false,
      error: '自分自身を削除することはできません',
      code: 'CANNOT_DELETE_SELF'
    });
  }
  
  res.json({
    success: true,
    message: 'ユーザーが削除されました',
    data: { id, deletedAt: new Date().toISOString() }
  });
});

// 企業管理APIエンドポイント
app.get('/api/companies', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED',
      redirectTo: '/login'
    });
  }
  
  const token = authHeader.substring(7);
  if (token !== 'test-access-token-123' && token !== 'test-new-access-token-789') {
    return res.status(401).json({
      success: false,
      error: 'トークンが無効です',
      code: 'INVALID_TOKEN'
    });
  }
  
  // 検索・フィルタリング対応
  const { search, industry, status, page = 1, limit = 10 } = req.query;
  
  const companies = [
    {
      id: 'company-1',
      name: 'テスト株式会社',
      industry: 'IT',
      status: 'ACTIVE',
      email: 'contact@test-company.com',
      phone: '03-1234-5678',
      address: '東京都渋谷区',
      primaryAssigneeId: 'user-1',
      secondaryAssigneeIds: ['user-2'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'company-2',
      name: 'サンプル商事',
      industry: '商社',
      status: 'ACTIVE',
      email: 'info@sample-corp.com',
      phone: '03-9876-5432',
      address: '大阪府大阪市',
      primaryAssigneeId: 'user-2',
      secondaryAssigneeIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: companies,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: companies.length,
      totalPages: 1
    }
  });
});

app.post('/api/companies', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  const { name, industry, email, phone, address } = req.body;
  
  if (!name || !industry || !email) {
    return res.status(400).json({
      success: false,
      error: 'バリデーションエラー',
      code: 'VALIDATION_ERROR',
      details: ['name、industry、emailは必須です']
    });
  }
  
  if (name === '重複企業名') {
    return res.status(409).json({
      success: false,
      error: '企業名が既に使用されています',
      code: 'COMPANY_NAME_EXISTS'
    });
  }
  
  const newCompany = {
    id: `company-${Date.now()}`,
    name,
    industry,
    status: 'ACTIVE',
    email,
    phone: phone || null,
    address: address || null,
    primaryAssigneeId: 'user-1',
    secondaryAssigneeIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: newCompany
  });
});

app.get('/api/companies/stats', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  res.json({
    success: true,
    data: {
      totalCompanies: 45,
      activeCompanies: 38,
      inactiveCompanies: 7,
      newCompaniesThisMonth: 5,
      industriesCount: {
        'IT': 15,
        '製造業': 12,
        '商社': 8,
        'サービス': 10
      },
      averageContactsPerCompany: 2.3
    }
  });
});

app.get('/api/companies/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  const { id } = req.params;
  
  if (id === 'non-existent') {
    return res.status(404).json({
      success: false,
      error: '企業が見つかりません',
      code: 'COMPANY_NOT_FOUND'
    });
  }
  
  const company = {
    id,
    name: `テスト企業${id}`,
    industry: 'IT',
    status: 'ACTIVE',
    email: `contact${id}@test-company.com`,
    phone: '03-1234-5678',
    address: '東京都渋谷区テスト町1-1-1',
    primaryAssigneeId: 'user-1',
    secondaryAssigneeIds: ['user-2'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: company
  });
});

app.put('/api/companies/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  const { id } = req.params;
  const { name, industry, email, phone, address, status } = req.body;
  
  const updatedCompany = {
    id,
    name: name || `更新企業${id}`,
    industry: industry || 'IT',
    status: status || 'ACTIVE',
    email: email || `updated${id}@company.com`,
    phone: phone || '03-1234-5678',
    address: address || '更新住所',
    primaryAssigneeId: 'user-1',
    secondaryAssigneeIds: ['user-2'],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: updatedCompany
  });
});

app.delete('/api/companies/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  const { id } = req.params;
  
  res.json({
    success: true,
    message: '企業が削除されました',
    data: { id, deletedAt: new Date().toISOString() }
  });
});

app.get('/api/companies/:id/contacts', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  const { id } = req.params;
  
  const contacts = [
    {
      id: 'contact-1',
      companyId: id,
      name: '田中太郎',
      email: 'tanaka@company.com',
      phone: '090-1234-5678',
      position: '営業部長',
      isPrimary: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'contact-2',
      companyId: id,
      name: '佐藤花子',
      email: 'sato@company.com',
      phone: '090-9876-5432',
      position: '経理担当',
      isPrimary: false,
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: contacts
  });
});

app.post('/api/companies/search', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  const { query, filters } = req.body;
  
  const searchResults = [
    {
      id: 'search-result-1',
      name: 'マッチした企業',
      industry: 'IT',
      status: 'ACTIVE',
      email: 'match@company.com',
      relevanceScore: 0.95
    }
  ];
  
  res.json({
    success: true,
    data: searchResults,
    totalMatches: searchResults.length,
    query: query || '',
    filters: filters || {}
  });
});

// 認証テスト用エンドポイント
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'invalid@test.com') {
    return res.status(401).json({
      error: '認証に失敗しました',
      code: 'AUTHENTICATION_FAILED'
    });
  }
  
  if (email === 'test@company.com' && password === 'password') {
    return res.json({
      success: true,
      accessToken: 'test-access-token-123',
      refreshToken: 'test-refresh-token-456',
      user: {
        id: 'test-user-id',
        email: 'test@company.com',
        role: 'COMPANY_LEADER'
      }
    });
  }
  
  res.status(401).json({
    error: '認証に失敗しました',
    code: 'AUTHENTICATION_FAILED'
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED',
      redirectTo: '/login'
    });
  }
  
  const token = authHeader.substring(7);
  if (token === 'test-access-token-123') {
    return res.json({
      success: true,
      user: {
        id: 'test-user-id',
        email: 'test@company.com',
        role: 'COMPANY_LEADER'
      }
    });
  }
  
  res.status(401).json({
    error: 'トークンが無効です',
    code: 'INVALID_TOKEN'
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (refreshToken === 'test-refresh-token-456') {
    return res.json({
      success: true,
      accessToken: 'test-new-access-token-789'
    });
  }
  
  res.status(401).json({
    error: 'リフレッシュトークンが無効です',
    code: 'INVALID_REFRESH_TOKEN'
  });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: '認証が必要です',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  res.json({
    success: true,
    message: 'ログアウトしました'
  });
});

// エラーハンドリング
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'システムエラーが発生しました',
    code: 'SYSTEM_ERROR'
  });
});

// 404エラー
app.use((req, res) => {
  res.status(404).json({
    error: 'エンドポイントが見つかりません',
    code: 'NOT_FOUND',
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});