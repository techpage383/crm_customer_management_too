/**
 * 認証関連モックデータ
 * schemas/index.ts の型定義に完全準拠
 */

import { LoginResponse, User, UserRole, GmailSyncStatus } from '../../../types/index';

/**
 * モックユーザーデータ
 */
export const mockUsers: User[] = [
  {
    id: "mock-user-001",
    email: "manager@company.com",
    username: "manager001",
    fullName: "田中 太郎",
    role: UserRole.MANAGER,
    isActive: true,
    department: "営業部",
    phoneNumber: "090-1234-5678",
    gmailPersonalConnected: true,
    gmailSyncStatus: GmailSyncStatus.CONNECTED,
    lastLoginAt: new Date(),
    passwordChangedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "mock-user-002",
    email: "user@company.com",
    username: "user002",
    fullName: "山田 花子",
    role: UserRole.USER,
    isActive: true,
    department: "マーケティング部",
    phoneNumber: "090-2345-6789",
    gmailPersonalConnected: false,
    gmailSyncStatus: GmailSyncStatus.DISCONNECTED,
    lastLoginAt: new Date(Date.now() - 86400000), // 1日前
    passwordChangedAt: new Date(Date.now() - 7 * 86400000), // 1週間前
    createdAt: new Date(Date.now() - 30 * 86400000), // 1ヶ月前
    updatedAt: new Date()
  },
  {
    id: "mock-user-003",
    email: "leader@company.com",
    username: "leader003",
    fullName: "佐藤 次郎",
    role: UserRole.COMPANY_LEADER,
    isActive: true,
    department: "経営企画部",
    phoneNumber: "090-3456-7890",
    gmailPersonalConnected: true,
    gmailSyncStatus: GmailSyncStatus.CONNECTED,
    lastLoginAt: new Date(),
    passwordChangedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * モックログインレスポンス（成功）
 */
export const mockLoginSuccessResponse: LoginResponse = {
  user: mockUsers[0], // マネージャーユーザー
  accessToken: "mock-jwt-access-token-12345",
  refreshToken: "mock-refresh-token-67890",
  expiresIn: 900 // 15分
};

/**
 * 管理者ログインレスポンス
 */
export const mockAdminLoginResponse: LoginResponse = {
  user: mockUsers[2], // 会社リーダー
  accessToken: "mock-jwt-admin-token-54321",
  refreshToken: "mock-refresh-admin-token-09876",
  expiresIn: 900
};

/**
 * 一般ユーザーログインレスポンス
 */
export const mockUserLoginResponse: LoginResponse = {
  user: mockUsers[1], // 一般ユーザー
  accessToken: "mock-jwt-user-token-11111",
  refreshToken: "mock-refresh-user-token-22222",
  expiresIn: 900
};

/**
 * Google OAuth2 モックレスポンス
 */
export const mockGoogleAuthResponse: LoginResponse = {
  user: {
    id: "mock-google-user-001",
    email: "google.user@gmail.com",
    username: "googleuser",
    fullName: "Google ユーザー",
    role: UserRole.USER,
    isActive: true,
    department: "IT部",
    gmailPersonalConnected: true,
    gmailSyncStatus: GmailSyncStatus.CONNECTED,
    lastLoginAt: new Date(),
    passwordChangedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  accessToken: "mock-google-jwt-token-99999",
  refreshToken: "mock-google-refresh-token-88888",
  expiresIn: 900
};

/**
 * リフレッシュトークンレスポンス
 */
export const mockRefreshTokenResponse = {
  accessToken: "mock-new-access-token-33333",
  refreshToken: "mock-new-refresh-token-44444",
  expiresIn: 900
};

/**
 * 認証エラーレスポンス
 */
export const mockAuthErrors = {
  invalidCredentials: {
    error: "認証に失敗しました",
    code: "INVALID_CREDENTIALS",
    statusCode: 401
  },
  accountLocked: {
    error: "アカウントが一時的にロックされています。30分後に再試行してください。",
    code: "RATE_LIMIT_EXCEEDED",
    statusCode: 429
  },
  tokenExpired: {
    error: "トークンの有効期限が切れています",
    code: "TOKEN_EXPIRED",
    statusCode: 401
  },
  gmailAuthRequired: {
    error: "Gmail認証が必要です",
    code: "GMAIL_AUTH_REQUIRED",
    authUrl: "/api/auth/google",
    statusCode: 403
  }
};

/**
 * 認証設定情報（モック）
 */
export const mockAuthConfig = {
  google: {
    enabled: true,
    clientId: "mock-google-client-id.apps.googleusercontent.com"
  },
  security: {
    mfaEnabled: false,
    passwordMinLength: 8,
    sessionTimeout: 30 * 60 * 1000 // 30分
  },
  endpoints: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    googleLogin: '/api/auth/google',
    me: '/api/auth/me'
  }
};

/**
 * 認証状態チェック関数（モック）
 */
export function getMockUserByCredentials(email: string, password: string): User | null {
  // 開発用の固定認証情報
  const validCredentials = [
    { email: "manager@company.com", password: "password", user: mockUsers[0] },
    { email: "user@company.com", password: "password", user: mockUsers[1] },
    { email: "leader@company.com", password: "password", user: mockUsers[2] },
    { email: "test@company.com", password: "test123", user: mockUsers[0] }
  ];

  const match = validCredentials.find(
    cred => cred.email === email && cred.password === password
  );

  return match ? match.user : null;
}

/**
 * ロール別リダイレクトURL（モック）
 */
export function getMockRedirectUrl(role: UserRole): string {
  switch (role) {
    case UserRole.COMPANY_LEADER:
    case UserRole.MANAGER:
      return '/admin/dashboard';
    case UserRole.TEAM_LEADER:
    case UserRole.USER:
      return '/user/dashboard';
    default:
      return '/dashboard';
  }
}