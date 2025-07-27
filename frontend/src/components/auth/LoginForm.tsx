/**
 * ログインフォームコンポーネント
 * 従来のメール・パスワード認証フォーム
 */

import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export function LoginForm({ onSuccess, onError, className = '' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      const errorMsg = 'メールアドレスとパスワードを入力してください';
      onError?.(errorMsg);
      return;
    }

    try {
      // @MOCK_TO_API: この呼び出しは自動的にモック/実APIが切り替わる
      await login({ email, password });
      onSuccess?.();
    } catch (err: any) {
      const errorMsg = err.message || '認証に失敗しました';
      onError?.(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`traditional-login ${className}`}>
      <div className="form-group">
        <label htmlFor="email">メールアドレス</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="例: user@company.com"
          disabled={isLoading}
          required
          autoComplete="email"
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">パスワード</label>
        <div className="password-input-wrapper" style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを入力"
            disabled={isLoading}
            required
            autoComplete="current-password"
            aria-describedby={error ? "login-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="password-toggle"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#666'
            }}
            aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {error && (
        <div id="login-error" className="error-message" style={{
          color: '#f44336',
          fontSize: '14px',
          marginBottom: '16px',
          padding: '8px 12px',
          backgroundColor: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      <button 
        type="submit" 
        className="login-btn"
        disabled={isLoading || !email || !password}
        style={{
          opacity: (isLoading || !email || !password) ? 0.6 : 1,
          cursor: (isLoading || !email || !password) ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'ログイン中...' : 'ログイン'}
      </button>

      {/* 開発用ヘルプ */}
      {process.env.NODE_ENV === 'development' && (
        <div className="dev-help" style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f0f7ff',
          border: '1px solid #c3d9ff',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#1565c0'
        }}>
          <strong>💡 開発用テスト認証情報:</strong>
          <br />
          マネージャー: manager@company.com / password
          <br />
          一般ユーザー: user@company.com / password
          <br />
          会社代表: leader@company.com / password
        </div>
      )}
    </form>
  );
}