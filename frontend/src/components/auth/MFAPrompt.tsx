/**
 * 多要素認証プロンプトコンポーネント
 */

import React, { useState, FormEvent } from 'react';

interface MFAPromptProps {
  isVisible: boolean;
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function MFAPrompt({ 
  isVisible, 
  onVerify, 
  onCancel, 
  isLoading = false, 
  error = null 
}: MFAPromptProps) {
  const [mfaCode, setMfaCode] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!mfaCode || mfaCode.length !== 6) {
      return;
    }

    try {
      await onVerify(mfaCode);
      setMfaCode(''); // 成功時はコードをクリア
    } catch (err) {
      // エラーハンドリングは親コンポーネントで行う
    }
  };

  const handleCodeChange = (value: string) => {
    // 数字のみ6桁まで許可
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setMfaCode(numericValue);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mfa-prompt" style={{
      marginTop: '16px',
      padding: '16px',
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px',
      fontSize: '14px'
    }}>
      <strong>セキュリティ確認</strong>
      <p style={{ margin: '8px 0' }}>
        認証アプリの6桁のコードを入力してください
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="mfa-code" style={{ marginTop: '12px' }}>
          <input
            type="text"
            value={mfaCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="000000"
            maxLength={6}
            pattern="\d{6}"
            disabled={isLoading}
            required
            autoComplete="one-time-code"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '18px',
              letterSpacing: '4px',
              boxSizing: 'border-box',
              fontFamily: 'monospace'
            }}
            aria-label="6桁の認証コード"
          />
        </div>

        {error && (
          <div style={{
            color: '#f44336',
            fontSize: '12px',
            marginTop: '8px',
            padding: '4px 8px',
            backgroundColor: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '12px'
        }}>
          <button
            type="submit"
            disabled={isLoading || mfaCode.length !== 6}
            className="login-btn"
            style={{
              flex: 1,
              opacity: (isLoading || mfaCode.length !== 6) ? 0.6 : 1,
              cursor: (isLoading || mfaCode.length !== 6) ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '確認中...' : '確認'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              flex: 1,
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            キャンセル
          </button>
        </div>
      </form>

      {/* ヘルプテキスト */}
      <div style={{
        marginTop: '12px',
        fontSize: '12px',
        color: '#666',
        lineHeight: '1.4'
      }}>
        💡 認証アプリ（Google Authenticator、Microsoft Authenticator等）で生成された6桁のコードを入力してください。
      </div>

      {/* 開発用モックコード表示 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#f0f7ff',
          border: '1px solid #c3d9ff',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#1565c0'
        }}>
          <strong>🔧 開発用:</strong> モックコード「123456」
        </div>
      )}
    </div>
  );
}