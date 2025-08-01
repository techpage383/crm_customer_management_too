import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Alert } from '@mui/material';

export const PublicLayout: React.FC = () => {
  // @MOCK_UI: モック使用状態をチェック
  const isMockMode = process.env.NODE_ENV === 'development';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* @MOCK_UI: モック使用時のバナー表示 */}
      {isMockMode && (
        <Alert severity="warning" sx={{ mb: 0 }}>
          ⚠️ モックデータ使用中 - 本番環境では使用不可
        </Alert>
      )}
      
      {/* ヘッダー */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            顧客管理ツール
          </Typography>
        </Toolbar>
      </AppBar>

      {/* メインコンテンツ */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};