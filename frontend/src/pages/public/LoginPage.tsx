// P-001: ログインページ
// HTMLモックアップ（login.html）をReactコンポーネントに統合
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { LoginRequest, LoginResponse } from '../../types';
import { 
  mockLoginSuccessResponse, 
  mockAdminLoginResponse, 
  mockUserLoginResponse,
  mockGoogleAuthResponse,
  getMockUserByCredentials 
} from '../../services/mock/data/auth.mock';

interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = () => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);

  // @MOCK_TO_API: モック認証をAPI呼び出しに置き換え
  const handleTraditionalLogin = async () => {
    if (!formData.email || !formData.password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setLoginAttempts(prev => prev + 1);

    try {
      // @MOCK_TO_API: 実際のAPI呼び出しに置き換え
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUser = getMockUserByCredentials(formData.email, formData.password);
      
      if (!mockUser) {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      }

      // @MOCK_LOGIC: 多要素認証のモック
      if (loginAttempts === 0) {
        setMfaRequired(true);
        setLoading(false);
        return;
      }

      // @MOCK_DATA: ログイン成功のモックレスポンス
      let loginResponse: LoginResponse;
      if (formData.email.includes('admin') || formData.email.includes('leader')) {
        loginResponse = mockAdminLoginResponse;
      } else {
        loginResponse = mockUserLoginResponse;
      }

      console.log('🔧 MOCK Login Success:', loginResponse);
      alert('ログイン成功！ダッシュボードへ移動します');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // @MOCK_TO_API: Google OAuth認証をAPI呼び出しに置き換え
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // @MOCK_TO_API: 実際のGoogle OAuth フローに置き換え
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // @MOCK_DATA: Google認証成功のモックレスポンス
      const loginResponse = mockGoogleAuthResponse;

      console.log('🔧 MOCK Google Login Success:', loginResponse);
      alert('Googleログイン成功！ダッシュボードへ移動します');
      
    } catch (err) {
      setError('Googleログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // @MOCK_TO_API: MFA認証をAPI呼び出しに置き換え
  const handleMfaVerification = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      setError('6桁のコードを入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // @MOCK_TO_API: 実際のMFA検証APIに置き換え
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // @MOCK_DATA: テスト用MFAコード
      if (mfaCode === '123456') {
        console.log('🔧 MOCK MFA Success');
        alert('多要素認証成功！ダッシュボードへ移動します');
        setMfaRequired(false);
      } else {
        throw new Error('認証コードが正しくありません');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // @MOCK_TO_API: パスワードリセットAPIに置き換え
  const handleForgotPassword = () => {
    const email = prompt('パスワードリセット用のメールアドレスを入力してください:');
    if (email) {
      alert(`${email} にリセット手順を送信しました`);
    }
  };

  // @MOCK_TO_API: 新規登録フローに置き換え
  const handleRegister = () => {
    alert('新規ユーザー登録は管理者にお問い合わせください');
  };

  // キーボード操作対応
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (mfaRequired) {
          handleMfaVerification();
        } else {
          handleTraditionalLogin();
        }
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [formData, mfaCode, mfaRequired]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2
      }}
    >
      {/* @MOCK_UI: モック使用表示バナー */}
      <Alert 
        severity="warning" 
        sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000,
          borderRadius: 0
        }}
      >
        ⚠️ モックデータ使用中 - 本番環境では使用不可
      </Alert>

      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            padding: 6,
            borderRadius: 4,
            textAlign: 'center',
            maxWidth: 400,
            margin: '0 auto'
          }}
        >
          {/* ロゴ・タイトル */}
          <Box sx={{ marginBottom: 4 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              color="primary" 
              fontWeight={500}
              gutterBottom
            >
              顧客管理ツール
            </Typography>
            <Typography variant="body2" color="text.secondary">
              効率的な顧客関係管理
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          {!mfaRequired ? (
            <>
              {/* @MOCK_UI: テスト用ログインボタン */}
              <Alert severity="info" sx={{ marginBottom: 3 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>テスト用ログイン:</strong>
                </Typography>
                <Box sx={{ marginTop: 1 }}>
                  <Button 
                    size="small"
                    onClick={() => {
                      setFormData({ email: 'user@company.com', password: 'password' });
                      setTimeout(() => handleTraditionalLogin(), 100);
                    }}
                    sx={{ marginRight: 1 }}
                  >
                    一般ユーザー
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => {
                      setFormData({ email: 'leader@company.com', password: 'password' });
                      setTimeout(() => handleTraditionalLogin(), 100);
                    }}
                  >
                    管理者
                  </Button>
                </Box>
              </Alert>

              {/* Google認証ボタン */}
              <Button
                fullWidth
                variant="contained"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
                disabled={loading}
                sx={{
                  backgroundColor: '#4285f4',
                  '&:hover': { backgroundColor: '#357ae8' },
                  marginBottom: 3,
                  padding: 1.5
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Googleアカウントでログイン'}
              </Button>

              {/* 区切り線 */}
              <Divider sx={{ marginY: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  または
                </Typography>
              </Divider>

              {/* 従来ログインフォーム */}
              <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  type="email"
                  label="メールアドレス"
                  placeholder="例: user@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={loading}
                  required
                />
                
                <TextField
                  fullWidth
                  type="password"
                  label="パスワード"
                  placeholder="パスワードを入力"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={loading}
                  required
                />
                
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleTraditionalLogin}
                  disabled={loading}
                  sx={{ padding: 1.5, marginTop: 1 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'ログイン'}
                </Button>
              </Box>
            </>
          ) : (
            /* MFA認証プロンプト */
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                セキュリティ確認
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                認証アプリの6桁のコードを入力してください
              </Typography>
              <Typography variant="body2" color="info.main" sx={{ marginBottom: 2 }}>
                テスト用コード: 123456
              </Typography>
              
              <TextField
                fullWidth
                label="認証コード"
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '4px' } }}
                disabled={loading}
                sx={{ marginBottom: 2 }}
              />
              
              <Button
                fullWidth
                variant="contained"
                onClick={handleMfaVerification}
                disabled={loading}
                sx={{ padding: 1.5 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : '確認'}
              </Button>
            </Box>
          )}

          {/* フッターリンク */}
          <Box sx={{ marginTop: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Button variant="text" size="small" onClick={handleForgotPassword}>
              パスワードを忘れた方
            </Button>
            <Button variant="text" size="small" onClick={handleRegister}>
              新規ユーザー登録
            </Button>
          </Box>

          {/* セキュリティ注意事項 */}
          <Alert severity="info" sx={{ marginTop: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>🔒 セキュリティ:</strong> このシステムは多層セキュリティで保護されています。
              不正アクセスは自動検知・ブロックされます。
            </Typography>
          </Alert>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;