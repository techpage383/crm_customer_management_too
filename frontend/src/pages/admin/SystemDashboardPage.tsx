// P-004: システムダッシュボードページ
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid,
  Paper, 
  Card, 
  CardContent,
  Alert,
  Chip,
  IconButton,
  Badge,
  List,
  ListItem,
  Tooltip,
  LinearProgress,
  Divider
} from '@mui/material';
import { 
  AdminPanelSettings, 
  People, 
  Security,
  Refresh,
  CheckCircle,
  Warning,
  Error,
  Info,
  NotificationsNone,
  MarkEmailRead,
  Speed
} from '@mui/icons-material';
import { systemService } from '../../services/index';
import { mockSystemDashboardService } from '../../services/mock/systemDashboard.service';
import { 
  SystemStats,
  SystemAlert,
  SystemAlertType,
  SystemPerformance
} from '../../types';

export const SystemDashboardPage: React.FC = () => {
  const isMockMode = process.env.REACT_APP_USE_MOCK_API === 'true' || process.env.NODE_ENV === 'development';

  // State管理
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [performance, setPerformance] = useState<SystemPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{ status: string; checks: Record<string, boolean> } | null>(null);

  // データ取得
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsResponse, alertsResponse, performanceResponse, healthResponse] = await Promise.all([
        mockSystemDashboardService.getSystemStats(),
        mockSystemDashboardService.getSystemAlerts(5),
        mockSystemDashboardService.getSystemPerformance(6),
        mockSystemDashboardService.performHealthCheck()
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
      if (alertsResponse.success && alertsResponse.data) {
        setAlerts(alertsResponse.data);
      }
      if (performanceResponse.success && performanceResponse.data) {
        setPerformance(performanceResponse.data);
      }
      if (healthResponse.success && healthResponse.data) {
        setHealthStatus(healthResponse.data);
      }
    } catch (error) {
      console.error('ダッシュボードデータ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // アラート既読化
  const handleMarkAlertAsRead = async (alertId: string) => {
    try {
      await mockSystemDashboardService.markAlertAsRead(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
    } catch (error) {
      console.error('アラート既読化エラー:', error);
    }
  };

  // 初期データ取得
  useEffect(() => {
    fetchDashboardData();
    
    // 自動更新（5分ごと）
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // アラートアイコン取得
  const getAlertIcon = (type: SystemAlertType) => {
    switch (type) {
      case SystemAlertType.ERROR: return <Error color="error" />;
      case SystemAlertType.WARNING: return <Warning color="warning" />;
      case SystemAlertType.SUCCESS: return <CheckCircle color="success" />;
      case SystemAlertType.INFO: default: return <Info color="info" />;
    }
  };

  // システム統計カード
  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color?: string; unit?: string }> = 
    ({ title, value, icon, color = 'primary', unit }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}{unit}
            </Typography>
          </Box>
          <Box color={`${color}.main`} sx={{ display: 'flex' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* @MOCK_UI: モック表示 */}
      {isMockMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          [MOCK] システムダッシュボード - モックデータで完全動作中
        </Alert>
      )}

      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <AdminPanelSettings sx={{ mr: 2, color: 'secondary.main' }} />
          <Typography variant="h4" component="h1">
            システムダッシュボード
          </Typography>
          <Chip 
            label="管理者限定" 
            color="secondary" 
            size="small" 
            sx={{ ml: 2 }} 
          />
        </Box>
        <Tooltip title="データ更新">
          <IconButton onClick={fetchDashboardData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* システム統計カード */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="総ユーザー数" 
              value={stats.totalUsers} 
              icon={<People />} 
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="アクティブユーザー" 
              value={stats.activeUsers} 
              icon={<People />} 
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="稼働率" 
              value={stats.systemUptime.toFixed(1)} 
              unit="%" 
              icon={<Security />} 
              color={stats.systemUptime > 99 ? "success" : "warning"}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="応答時間" 
              value={stats.apiResponseTime} 
              unit="ms" 
              icon={<Speed />} 
              color={stats.apiResponseTime < 200 ? "success" : "warning"}
            />
          </Grid>
        </Grid>
      )}

      {/* メインコンテンツ */}
      <Grid container spacing={3}>
        {/* システム状況 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
              <Typography variant="h6">
                システム状況
              </Typography>
              {healthStatus && (
                <Chip 
                  label={healthStatus.status === 'healthy' ? '正常' : '警告'} 
                  color={healthStatus.status === 'healthy' ? 'success' : 'warning'}
                  icon={healthStatus.status === 'healthy' ? <CheckCircle /> : <Warning />}
                />
              )}
            </Box>
            
            {healthStatus && (
              <Grid container spacing={2}>
                {Object.entries(healthStatus.checks).map(([service, isHealthy]) => (
                  <Grid item xs={6} sm={3} key={service}>
                    <Box display="flex" alignItems="center" p={1}>
                      {isHealthy ? <CheckCircle color="success" /> : <Error color="error" />}
                      <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                        {service}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}

            {stats && (
              <Box mt={3}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  詳細統計
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h5">{stats.totalCompanies}</Typography>
                      <Typography variant="caption">企業数</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h5">{stats.totalTodos}</Typography>
                      <Typography variant="caption">総TODO数</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h5">{stats.gmailConnections}</Typography>
                      <Typography variant="caption">Gmail連携</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>

          {/* パフォーマンス履歴 */}
          {performance.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                パフォーマンス履歴（過去6時間）
              </Typography>
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  最新の応答時間: {performance[performance.length - 1]?.apiResponseTime}ms
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(performance[performance.length - 1]?.apiResponseTime / 3, 100)} 
                  sx={{ height: 8, borderRadius: 4 }}
                  color={performance[performance.length - 1]?.apiResponseTime < 200 ? "success" : "warning"}
                />
              </Box>
            </Paper>
          )}
        </Grid>
        
        {/* アラート一覧 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                システムアラート
              </Typography>
              <Badge badgeContent={alerts.filter(a => !a.isRead).length} color="error">
                <NotificationsNone />
              </Badge>
            </Box>
            
            {alerts.length > 0 ? (
              <List dense>
                {alerts.map((alert, index) => (
                  <React.Fragment key={alert.id}>
                    <ListItem
                      sx={{
                        bgcolor: alert.isRead ? 'transparent' : 'action.hover',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <Box display="flex" alignItems="flex-start" width="100%">
                        <Box sx={{ mr: 1, mt: 0.5 }}>
                          {getAlertIcon(alert.type)}
                        </Box>
                        <Box flexGrow={1}>
                          <Typography variant="body2" fontWeight={alert.isRead ? 'normal' : 'medium'}>
                            {alert.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {alert.timestamp.toLocaleString('ja-JP')}
                          </Typography>
                        </Box>
                        {!alert.isRead && (
                          <Tooltip title="既読にする">
                            <IconButton 
                              size="small" 
                              onClick={() => handleMarkAlertAsRead(alert.id)}
                            >
                              <MarkEmailRead fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </ListItem>
                    {index < alerts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
                アラートはありません
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};