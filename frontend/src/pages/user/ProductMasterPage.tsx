// P-013: 商材マスタ管理ページ
import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { Category } from '@mui/icons-material';

export const ProductMasterPage: React.FC = () => {
  const isMockMode = process.env.NODE_ENV === 'development';

  return (
    <Box>
      {isMockMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          [MOCK] 商材マスタ管理ページ - 実装予定（Phase 8）
        </Alert>
      )}
      <Typography variant="h4" component="h1" gutterBottom>商材マスタ管理</Typography>
      <Paper sx={{ p: 3, textAlign: 'center', minHeight: 400 }}>
        <Category sx={{ fontSize: 80, color: 'action.disabled', mb: 2 }} />
        <Typography variant="h6" color="textSecondary" gutterBottom>商材マスタ機能</Typography>
        <Typography variant="body1" color="textSecondary">
          Phase 8で実装予定：商材情報登録・編集、価格・仕様管理、カテゴリ管理
        </Typography>
      </Paper>
    </Box>
  );
};