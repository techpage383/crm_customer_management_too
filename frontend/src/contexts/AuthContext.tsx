/**
 * 認証コンテキスト
 * アプリケーション全体の認証状態を管理
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RefreshTokenRequest } from '../types/index';
import { authService } from '../services/index';

// 認証状態の型定義
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

// 認証アクションの型定義
type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_TOKEN_REFRESH'; payload: { accessToken: string; refreshToken: string } };

// 認証コンテキストの型定義
interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

// 初期状態
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accessToken: null,
  refreshToken: null
};

// 認証リデューサー
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case 'AUTH_LOGOUT':
      return {
        ...initialState
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'AUTH_TOKEN_REFRESH':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        error: null
      };

    default:
      return state;
  }
}

// 認証コンテキスト作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 認証プロバイダーコンポーネント
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * ログイン処理
   */
  const login = async (credentials: LoginRequest): Promise<void> => {
    dispatch({ type: 'AUTH_LOADING' });
    
    try {
      // @MOCK_TO_API: authService.login()は既にモック/実APIを切り替え可能
      const response = await authService.login(credentials);
      
      // トークンをローカルストレージに保存
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        }
      });

      console.log('✅ Login Success - User:', response.user.email);
      
    } catch (error: any) {
      const errorMessage = error.message || '認証に失敗しました';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      console.error('❌ Login Failed:', errorMessage);
      throw error;
    }
  };

  /**
   * Google OAuth2ログイン
   */
  const googleLogin = async (): Promise<void> => {
    dispatch({ type: 'AUTH_LOADING' });
    
    try {
      // @MOCK_TO_API: authService.googleLogin()は既にモック/実APIを切り替え可能
      const authUrl = await authService.googleLogin();
      
      // Google認証ページにリダイレクト
      window.location.href = authUrl;
      
    } catch (error: any) {
      const errorMessage = error.message || 'Google認証の開始に失敗しました';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      console.error('❌ Google Login Failed:', errorMessage);
      throw error;
    }
  };

  /**
   * ログアウト処理
   */
  const logout = async (): Promise<void> => {
    try {
      // @MOCK_TO_API: authService.logout()は既にモック/実APIを切り替え可能
      await authService.logout(state.refreshToken || undefined);
      
      // ローカルストレージクリア
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      dispatch({ type: 'AUTH_LOGOUT' });
      
      console.log('👋 Logout Success');
      
    } catch (error: any) {
      console.error('❌ Logout Error:', error.message);
      // ログアウトエラーでも状態はクリア
      dispatch({ type: 'AUTH_LOGOUT' });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  /**
   * トークンリフレッシュ処理
   */
  const refreshTokens = async (): Promise<void> => {
    const currentRefreshToken = state.refreshToken || localStorage.getItem('refreshToken');
    
    if (!currentRefreshToken) {
      dispatch({ type: 'AUTH_ERROR', payload: 'リフレッシュトークンがありません' });
      return;
    }

    try {
      // @MOCK_TO_API: authService.refreshToken()は既にモック/実APIを切り替え可能
      const response = await authService.refreshToken({ refreshToken: currentRefreshToken });
      
      // 新しいトークンを保存
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      dispatch({
        type: 'AUTH_TOKEN_REFRESH',
        payload: {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        }
      });

      console.log('🔄 Token Refresh Success');
      
    } catch (error: any) {
      const errorMessage = error.message || 'トークンの更新に失敗しました';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      console.error('❌ Token Refresh Failed:', errorMessage);
      
      // リフレッシュ失敗時はログアウト状態にする
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  /**
   * エラークリア
   */
  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  /**
   * 認証状態確認
   */
  const checkAuthStatus = async (): Promise<void> => {
    const token = localStorage.getItem('accessToken');
    const refreshTokenStored = localStorage.getItem('refreshToken');
    
    if (!token || !refreshTokenStored) {
      return;
    }

    dispatch({ type: 'AUTH_LOADING' });

    try {
      // @MOCK_TO_API: authService.getCurrentUser()は既にモック/実APIを切り替え可能
      const user = await authService.getCurrentUser();
      
      if (user) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user,
            accessToken: token,
            refreshToken: refreshTokenStored
          }
        });
        console.log('✅ Auth Status Check - User Found:', user.email);
      }
      
    } catch (error: any) {
      console.log('⚠️ Auth Status Check Failed - Token may be expired');
      // トークンが無効な場合はリフレッシュを試行
      await refreshTokens();
    }
  };

  // アプリケーション起動時の認証状態確認
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 自動トークンリフレッシュ（有効期限5分前）
  useEffect(() => {
    if (!state.isAuthenticated || !state.accessToken) return;

    // 12分ごとにリフレッシュ（15分有効期限の3分前）
    const refreshInterval = setInterval(() => {
      refreshTokens();
    }, 12 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated, state.accessToken]);

  const contextValue: AuthContextType = {
    ...state,
    login,
    googleLogin,
    logout,
    refreshTokens,
    clearError,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 認証コンテキストを使用するためのカスタムフック
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * 認証が必要なコンポーネント用のカスタムフック
 */
export function useRequireAuth(): AuthContextType {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      console.warn('🚫 Authentication required - redirecting to login');
      // 実際のアプリケーションではここでログインページにリダイレクト
      // window.location.href = '/login';
    }
  }, [auth.isAuthenticated, auth.isLoading]);
  
  return auth;
}