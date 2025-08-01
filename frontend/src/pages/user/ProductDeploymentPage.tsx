// P-013: 商材導入状況ページ
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  Dashboard,
  Refresh,
  Visibility,
  CheckCircle,
  Warning,
  Error,
  Settings,
  Timeline,
  Business,
  Computer,
  Cloud,
  Storage
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { mockContractProductService } from '../../services/mock/contractProduct.service';
import { ProductDeploymentStatus } from '../../types';

export const ProductDeploymentPage: React.FC = () => {
  const { user } = useAuth();
  const isMockMode = process.env.NODE_ENV === 'development';

  // State管理
  const [deployments, setDeployments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filteredDeployments, setFilteredDeployments] = useState<any[]>([]);
  
  // フィルター
  const [statusFilter, setStatusFilter] = useState<ProductDeploymentStatus | ''>('');
  const [healthFilter, setHealthFilter] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // ダイアログ
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<any>(null);

  // 初期データ取得
  useEffect(() => {
    fetchDeployments();
    fetchStats();
  }, []);

  // フィルター適用
  useEffect(() => {
    applyFilters();
  }, [deployments, statusFilter, healthFilter, companyFilter, searchQuery]);

  // 導入状況取得
  const fetchDeployments = async () => {
    try {
      const response = await mockContractProductService.getProductDeployments({});
      if (response.success && response.data) {
        setDeployments(response.data);
      }
    } catch (error) {
      console.error('導入状況取得エラー:', error);
    }
  };

  // 統計取得
  const fetchStats = async () => {
    try {
      const response = await mockContractProductService.getDeploymentStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('統計取得エラー:', error);
    }
  };

  // フィルター適用
  const applyFilters = () => {
    let filtered = [...deployments];

    if (statusFilter) {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    if (healthFilter) {
      filtered = filtered.filter(d => d.healthStatus === healthFilter);
    }

    if (companyFilter) {
      filtered = filtered.filter(d => d.companyId === companyFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.notes?.toLowerCase().includes(query)
      );
    }

    setFilteredDeployments(filtered);
  };

  // ステータス表示
  const getStatusDisplay = (status: ProductDeploymentStatus) => {
    switch (status) {
      case ProductDeploymentStatus.PRODUCTION:
        return { label: '導入完了', color: 'success', icon: <CheckCircle /> };
      case ProductDeploymentStatus.STAGING:
        return { label: '導入中', color: 'info', icon: <Settings /> };
      case ProductDeploymentStatus.DEVELOPMENT:
        return { label: '開発中', color: 'warning', icon: <Warning /> };
      case ProductDeploymentStatus.ARCHIVED:
        return { label: 'アーカイブ', color: 'error', icon: <Error /> };
      default:
        return { label: '不明', color: 'default', icon: <Computer /> };
    }
  };

  // ヘルス状態表示
  const getHealthDisplay = (healthStatus: string) => {
    switch (healthStatus) {
      case 'healthy':
        return { label: '正常', color: 'success', icon: <CheckCircle /> };
      case 'warning':
        return { label: '警告', color: 'warning', icon: <Warning /> };
      case 'error':
        return { label: 'エラー', color: 'error', icon: <Error /> };
      case 'pending':
        return { label: '未確認', color: 'default', icon: <Timeline /> };
      default:
        return { label: '不明', color: 'default', icon: <Computer /> };
    }
  };

  // 詳細表示
  const handleViewDetail = (deployment: any) => {
    setSelectedDeployment(deployment);
    setDetailDialogOpen(true);
  };

  // 統計カード
  const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color?: string }> = 
    ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h6" component="div">
              {value}
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
          [MOCK] 商材導入状況ページ - モックデータで完全動作中
        </Alert>
      )}

      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Dashboard sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            商材導入状況
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => {
            fetchDeployments();
            fetchStats();
          }}
        >
          更新
        </Button>
      </Box>

      {/* 統計カード */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="総導入数" 
              value={stats.totalDeployments} 
              icon={<Computer />} 
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="稼働中" 
              value={stats.activeDeployments} 
              icon={<CheckCircle />} 
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="導入中" 
              value={stats.inProgressDeployments} 
              icon={<Settings />} 
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="利用率" 
              value={`${Math.round(stats.utilizationRate)}%`} 
              icon={<Timeline />} 
              color="warning"
            />
          </Grid>
        </Grid>
      )}

      {/* フィルター */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          フィルター
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="メモで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>ステータス</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProductDeploymentStatus | '')}
                label="ステータス"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value={ProductDeploymentStatus.PRODUCTION}>導入完了</MenuItem>
                <MenuItem value={ProductDeploymentStatus.STAGING}>導入中</MenuItem>
                <MenuItem value={ProductDeploymentStatus.DEVELOPMENT}>開発中</MenuItem>
                <MenuItem value={ProductDeploymentStatus.ARCHIVED}>アーカイブ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>ヘルス状態</InputLabel>
              <Select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                label="ヘルス状態"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="healthy">正常</MenuItem>
                <MenuItem value="warning">警告</MenuItem>
                <MenuItem value="error">エラー</MenuItem>
                <MenuItem value="pending">未確認</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>企業</InputLabel>
              <Select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                label="企業"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="1">テックソリューション</MenuItem>
                <MenuItem value="2">グローバル商事</MenuItem>
                <MenuItem value="3">中部製造</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="textSecondary">
              {filteredDeployments.length}件の導入状況
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 導入状況一覧 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>企業・商材</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>ヘルス状態</TableCell>
                <TableCell>ライセンス使用状況</TableCell>
                <TableCell>導入日</TableCell>
                <TableCell>最終チェック</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDeployments.map((deployment) => {
                const statusDisplay = getStatusDisplay(deployment.status);
                const healthDisplay = getHealthDisplay(deployment.healthStatus);
                
                return (
                  <TableRow key={deployment.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          企業ID: {deployment.companyId}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          商材ID: {deployment.productId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={statusDisplay.label}
                        color={statusDisplay.color as any}
                        icon={statusDisplay.icon}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={healthDisplay.label}
                        color={healthDisplay.color as any}
                        icon={healthDisplay.icon}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {deployment.licensesUsed} / {deployment.licensesTotal}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(deployment.licensesUsed / deployment.licensesTotal) * 100}
                          sx={{ mt: 0.5, width: 100 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(deployment.deploymentDate).toLocaleDateString('ja-JP')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {deployment.lastHealthCheck 
                          ? new Date(deployment.lastHealthCheck).toLocaleDateString('ja-JP')
                          : '未実施'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="詳細表示">
                          <IconButton 
                            size="small"
                            onClick={() => handleViewDetail(deployment)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 詳細ダイアログ */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>導入状況詳細</DialogTitle>
        <DialogContent>
          {selectedDeployment && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">企業ID</Typography>
                  <Typography variant="body1">{selectedDeployment.companyId}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">商材ID</Typography>
                  <Typography variant="body1">{selectedDeployment.productId}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">バージョン</Typography>
                  <Typography variant="body1">{selectedDeployment.version}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">担当エンジニア</Typography>
                  <Typography variant="body1">{selectedDeployment.assignedEngineer}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">メモ</Typography>
                  <Typography variant="body1">{selectedDeployment.notes}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};