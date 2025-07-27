/**
 * ログインページ
 * P-001: ログインページの実装
 * モックアップベースのUI実装
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoginForm } from '../../components/auth/LoginForm';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';
import { MFAPrompt } from '../../components/auth/MFAPrompt';
import { getServiceStatus } from '../../services/index';

export function LoginPage() {
  const [showMFA, setShowMFA] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const { isAuthenticated, user, isLoading, error, clearError, getRedirectUrl } = useAuth();

  // 認証済みの場合はリダイレクト
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectUrl = getRedirectUrl();
      console.log(`✅ Already authenticated - redirecting to ${redirectUrl}`);
      // 実際のアプリケーションではここでリダイレクト
      showNotification('success', `ログイン済みです。${redirectUrl}にリダイレクトします...`);
    }
  }, [isAuthenticated, user, getRedirectUrl]);

  // エラー表示
  useEffect(() => {
    if (error) {
      showNotification('error', error);
      clearError();
    }
  }, [error, clearError]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleLoginSuccess = () => {
    if (user) {
      const redirectUrl = getRedirectUrl();
      showNotification('success', `ログイン成功！${redirectUrl}へリダイレクトします...`);
      
      // 実際のアプリケーションではここでリダイレクト
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1500);
    }
  };

  const handleLoginError = (errorMessage: string) => {
    // 特定のエラーでMFAプロンプトを表示
    if (errorMessage.includes('多要素認証') || errorMessage.includes('MFA')) {
      setShowMFA(true);
      showNotification('info', 'セキュリティのため、多要素認証が必要です');
    } else {
      showNotification('error', errorMessage);
    }
  };

  const handleMFAVerify = async (code: string) => {
    // モック実装: 開発用コード「123456」を受け入れ
    if (code === '123456') {
      setShowMFA(false);
      showNotification('success', '多要素認証成功！ログインしています...');
      handleLoginSuccess();
    } else {
      throw new Error('認証コードが正しくありません');
    }
  };

  const handleForgotPassword = () => {
    const email = prompt('パスワードリセット用のメールアドレスを入力してください:');
    if (email) {
      showNotification('info', `${email} にリセット手順を送信しました`);
    }
  };

  const handleRegister = () => {
    showNotification('info', '新規ユーザー登録は管理者にお問い合わせください');
  };

  // サービス状態表示（開発用）
  const serviceStatus = getServiceStatus();
  const isUsingMock = serviceStatus.auth === 'MOCK';

  return (
    <div style={{
      margin: 0,
      padding: 0,
      fontFamily: "'Roboto', sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div className="login-container" style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        padding: '48px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center' as const,
        position: 'relative' as const
      }}>
        {/* モック使用インジケーター */}
        {isUsingMock && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: '#ff9800',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            🎭 MOCK
          </div>
        )}

        {/* ロゴ・タイトル */}
        <div className="logo" style={{ marginBottom: '32px' }}>
          <h1 style={{
            color: '#1976d2',
            fontSize: '28px',
            margin: 0,
            fontWeight: 500
          }}>
            顧客管理ツール
          </h1>
          <p style={{
            color: '#666',
            margin: '8px 0 0 0',
            fontSize: '14px'
          }}>
            効率的な顧客関係管理
          </p>
        </div>

        {/* 通知表示 */}
        {notification && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 500,
            zIndex: 1001,
            background: notification.type === 'success' ? '#4caf50' : 
                       notification.type === 'error' ? '#f44336' : '#2196f3',
            maxWidth: '300px',
            wordWrap: 'break-word' as const
          }}>
            {notification.message}
          </div>
        )}

        {/* ローディングオーバーレイ */}
        {isLoading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: '18px',
            zIndex: 1000
          }}>
            <div>認証中...</div>
          </div>
        )}

        {/* 認証方法 */}
        <div className="auth-methods" style={{
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '16px'
        }}>
          {/* メイン認証: Google OAuth */}
          <GoogleLoginButton
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
          />

          {/* 区切り線 */}
          <div className="divider" style={{
            display: 'flex',
            alignItems: 'center',
            margin: '24px 0',
            color: '#999',
            fontSize: '14px'
          }}>
            <div style={{
              flex: 1,
              height: '1px',
              background: '#ddd'
            }} />
            <span style={{ padding: '0 16px' }}>または</span>
            <div style={{
              flex: 1,
              height: '1px',
              background: '#ddd'
            }} />
          </div>

          {/* 従来ログイン */}
          <LoginForm
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
          />
        </div>

        {/* 多要素認証プロンプト */}
        <MFAPrompt
          isVisible={showMFA}
          onVerify={handleMFAVerify}
          onCancel={() => setShowMFA(false)}
          isLoading={isLoading}
        />

        {/* フッターリンク */}
        <div className="footer-links" style={{
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px',
          flexWrap: 'wrap' as const,
          gap: '8px'
        }}>
          <button
            onClick={handleForgotPassword}
            style={{
              background: 'none',
              border: 'none',
              color: '#1976d2',
              textDecoration: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            パスワードを忘れた方
          </button>
          <button
            onClick={handleRegister}
            style={{
              background: 'none',
              border: 'none',
              color: '#1976d2',
              textDecoration: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            新規ユーザー登録
          </button>
        </div>

        {/* セキュリティ注意事項 */}
        <div className="security-notice" style={{
          marginTop: '24px',
          padding: '12px',
          background: '#f5f5f5',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>🔒 セキュリティ:</strong> このシステムは多層セキュリティで保護されています。不正アクセスは自動検知・ブロックされます。
        </div>

        {/* 開発用情報 */}
        {process.env.NODE_ENV === 'development' && (
          <details style={{
            marginTop: '16px',
            fontSize: '11px',
            color: '#666'
          }}>
            <summary style={{ cursor: 'pointer', color: '#1976d2' }}>
              🔧 開発用情報
            </summary>
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: '#f0f7ff',
              borderRadius: '4px',
              textAlign: 'left' as const
            }}>
              <div><strong>Service Status:</strong> {serviceStatus.auth}</div>
              <div><strong>Environment:</strong> {serviceStatus.environment}</div>
              <div><strong>Features:</strong></div>
              <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                <li>JWT認証: ✅</li>
                <li>Google OAuth2: ✅</li>
                <li>多要素認証: ✅</li>
                <li>モックデータ: ✅</li>
              </ul>
            </div>
          </details>
        )}
      </div>

      {/* レスポンシブ対応 */}
      <style>{`
        @media (max-width: 480px) {
          .login-container {
            padding: 32px 24px !important;
            margin: 16px !important;
          }
          
          .footer-links {
            flex-direction: column !important;
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
}