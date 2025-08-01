import React from 'react';
import { 
  Box, 
  Typography, 
  Grid,
  Paper, 
  Card, 
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  Stack
} from '@mui/material';
import { 
  TrendingUp, 
  Business, 
  Assignment, 
  Email,
  Schedule
} from '@mui/icons-material';

// User Dashboard Page - メインダッシュボード
export const DashboardPage: React.FC = () => {
  // @MOCK_UI: モック使用中の表示
  const isMockMode = process.env.NODE_ENV === 'development';

  // @MOCK_DATA: ダミー統計データ
  const mockStats = [
    { title: '担当企業数', value: '12', icon: <Business />, color: 'primary' as const },
    { title: '進行中TODO', value: '8', icon: <Assignment />, color: 'warning' as const },
    { title: '未読メール', value: '5', icon: <Email />, color: 'error' as const },
    { title: '今日の予定', value: '3', icon: <Schedule />, color: 'success' as const },
  ];

  // @MOCK_DATA: 最新活動データ
  const mockActivities = [
    { title: 'ABC株式会社との会議', time: '10:00', status: '完了' },
    { title: 'XYZ商事からの見積依頼', time: '14:30', status: '対応中' },
    { title: '定期フォローアップメール送信', time: '16:00', status: '予定' },
  ];

  return (
    <Box>
      {/* @MOCK_UI: モック表示 */}
      {isMockMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          [MOCK] ダッシュボードデータ - 実際のデータに置き換えられます
        </Alert>
      )}

      <Typography variant="h4" component="h1" gutterBottom>
        ダッシュボード
      </Typography>

      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {mockStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box color={`${stat.color}.main`} sx={{ display: 'flex' }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* メインコンテンツエリア */}
      <Grid container spacing={3}>
        {/* 最新活動 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              今日の活動
            </Typography>
            {mockActivities.map((activity, index) => (
              <Box 
                key={index} 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center"
                py={1}
                borderBottom={index < mockActivities.length - 1 ? 1 : 0}
                borderColor="divider"
              >
                <Box>
                  <Typography variant="body1">{activity.title}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {activity.time}
                  </Typography>
                </Box>
                <Chip 
                  label={activity.status}
                  size="small"
                  color={
                    activity.status === '完了' ? 'success' :
                    activity.status === '対応中' ? 'warning' : 'default'
                  }
                />
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* クイックアクション */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              クイックアクション
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Button 
                variant="contained" 
                startIcon={<Business />}
                fullWidth
              >
                新規企業登録
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Assignment />}
                fullWidth
              >
                TODO作成
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Email />}
                fullWidth
              >
                Gmail同期
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};