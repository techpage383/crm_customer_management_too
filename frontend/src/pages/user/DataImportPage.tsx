// P-007: データインポート・マッピングページ
import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { Upload } from '@mui/icons-material';

export const DataImportPage: React.FC = () => {
  const isMockMode = process.env.NODE_ENV === 'development';

  return (
    <Box>
      {isMockMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          [MOCK] データインポートページ - 実装予定（Phase 9）
        </Alert>
      )}
      <Typography variant="h4" component="h1" gutterBottom>データインポート・マッピング</Typography>
      <Paper sx={{ p: 3, textAlign: 'center', minHeight: 400 }}>
        <Upload sx={{ fontSize: 80, color: 'action.disabled', mb: 2 }} />
        <Typography variant="h6" color="textSecondary" gutterBottom>データインポート機能</Typography>
        <Typography variant="body1" color="textSecondary">
          Phase 9で実装予定：CSVインポート、フィールドマッピング、インポート結果確認
        </Typography>
      </Paper>
    </Box>
  );
};