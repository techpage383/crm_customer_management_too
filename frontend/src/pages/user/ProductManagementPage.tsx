// P-006: 商品管理ページ
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Stack,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Inventory,
  Add,
  Search,
  Refresh,
  Visibility,
  Edit,
  CheckCircle,
  Cancel,
  Computer,
  Memory,
  Assessment,
  Business,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { mockContractProductService } from '../../services/mock/contractProduct.service';
import { 
  Product, 
  ProductCategory,
  Deployment,
  ProductDeploymentStatus,
  Company
} from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ProductManagementPage: React.FC = () => {
  const { user } = useAuth();
  const isMockMode = process.env.NODE_ENV === 'development';

  // State管理
  const [products, setProducts] = useState<Product[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // フィルター・検索
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<ProductDeploymentStatus | ''>('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  
  // ページネーション
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // ダイアログ
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 初期データ取得
  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, searchQuery, categoryFilter, statusFilter]);

  // データ取得
  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsResponse, deploymentsResponse, statsResponse] = await Promise.all([
        mockContractProductService.searchProducts({
          query: searchQuery || undefined,
          category: categoryFilter || undefined,
          page: page + 1,
          limit: rowsPerPage,
          sortBy: 'name',
          sortOrder: 'asc'
        }),
        mockContractProductService.getProductDeployments({
          status: statusFilter || undefined,
          companyId: companyFilter || undefined
        }),
        mockContractProductService.getDeploymentStats()
      ]);
      
      if (productsResponse.success && productsResponse.data) {
        setProducts(productsResponse.data.products);
        setTotalCount(productsResponse.data.totalCount);
      }
      
      if (deploymentsResponse.success && deploymentsResponse.data) {
        setDeployments(deploymentsResponse.data as any);
      }
      
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 商材詳細表示
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setDetailDialogOpen(true);
  };

  // カテゴリー表示名取得
  const getCategoryDisplayName = (category: ProductCategory): string => {
    switch (category) {
      case ProductCategory.SOFTWARE: return 'ソフトウェア';
      case ProductCategory.HARDWARE: return 'ハードウェア';
      case ProductCategory.SERVICE: return 'サービス';
      case ProductCategory.SUBSCRIPTION: return 'サブスクリプション';
      case ProductCategory.OTHER: return 'その他';
      default: return '不明';
    }
  };

  // 導入状態表示名取得
  const getStatusDisplayName = (status: any): string => {
    switch (status) {
      case 'DEVELOPMENT': return '開発中';
      case 'STAGING': return 'ステージング';
      case 'PRODUCTION': return '本番運用';
      case 'ARCHIVED': return 'アーカイブ';
      default: return '不明';
    }
  };

  // 統計カード
  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color?: string; unit?: string }> = 
    ({ title, value, icon, color = 'primary', unit = '' }) => (
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
          [MOCK] 商品管理ページ - モックデータで完全動作中
        </Alert>
      )}

      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Inventory sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            商品管理
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={fetchData}
          disabled={loading}
        >
          更新
        </Button>
      </Box>

      {/* 統計カード */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="総商品数"
              value={stats.totalProducts}
              icon={<Inventory />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="導入済み"
              value={stats.deployedProducts}
              icon={<CheckCircle />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="提案済み"
              value={stats.proposedProducts}
              icon={<Assessment />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="売上合計"
              value={stats.totalRevenue}
              icon={<TrendingUp />}
              color="info"
              unit="万円"
            />
          </Grid>
        </Grid>
      )}

      {/* タブナビゲーション */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab
            icon={<Inventory />}
            label="商品一覧"
            iconPosition="start"
          />
          <Tab
            icon={<Business />}
            label="導入状況"
            iconPosition="start"
          />
          <Tab
            icon={<Assessment />}
            label="分析レポート"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* 商品一覧タブ */}
      <TabPanel value={tabValue} index={0}>
        {/* 検索・フィルター */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="商品名、コードで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>カテゴリー</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as ProductCategory)}
                  label="カテゴリー"
                >
                  <MenuItem value="">すべて</MenuItem>
                  {Object.values(ProductCategory).map(category => (
                    <MenuItem key={category} value={category}>
                      {getCategoryDisplayName(category)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Search />}
                onClick={fetchData}
              >
                検索
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={<Add />}
                onClick={() => {
                  // @MOCK_TO_API: 商品追加機能に置き換え
                  console.log('🔧 MOCK 商品追加');
                  alert('商品追加機能（モック）');
                }}
              >
                新規商品追加
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* 商品テーブル */}
        <Paper>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>商品情報</TableCell>
                  <TableCell>カテゴリー</TableCell>
                  <TableCell>価格</TableCell>
                  <TableCell>導入企業数</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => {
                  const deploymentCount = deployments.filter(d => d.productId === product.id).length;
                  const deployedCount = deployments.filter(d => d.productId === product.id && String(d.status) === 'PRODUCTION').length;
                  
                  return (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {product.category === ProductCategory.SOFTWARE ? <Computer /> : <Memory />}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {product.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {product.code}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={getCategoryDisplayName(product.category)}
                          color="default"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {product.priceType === 'monthly' 
                            ? `月額 ${product.price?.toLocaleString()}円`
                            : `${product.price?.toLocaleString()}円`
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {deployedCount} / {deploymentCount} 社
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={product.isActive ? 'アクティブ' : '無効'}
                          color={product.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="詳細表示">
                            <IconButton
                              size="small"
                              onClick={() => handleViewProduct(product)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="編集">
                            <IconButton
                              size="small"
                              onClick={() => {
                                // @MOCK_TO_API: 商品編集機能に置き換え
                                console.log('🔧 MOCK 商品編集:', product.id);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="表示件数"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}件`}
          />
        </Paper>
      </TabPanel>

      {/* 導入状況タブ */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            導入状況一覧
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            導入状況の詳細管理は後のPhaseで実装予定です。
          </Alert>
          <Typography variant="body2" color="textSecondary">
            企業別の商品導入状況、導入スケジュール、利用状況などを管理できます。
          </Typography>
        </Paper>
      </TabPanel>

      {/* 分析レポートタブ */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            分析レポート
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            分析レポート機能は後のPhaseで実装予定です。
          </Alert>
          <Typography variant="body2" color="textSecondary">
            商品別売上分析、導入トレンド、顧客満足度などのレポートを表示できます。
          </Typography>
        </Paper>
      </TabPanel>

      {/* 商品詳細ダイアログ */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Visibility sx={{ mr: 1 }} />
            商品詳細 - {selectedProduct?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>基本情報</Typography>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">商品名</Typography>
                  <Typography variant="body1">{selectedProduct.name}</Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">商品コード</Typography>
                  <Typography variant="body1">{selectedProduct.code}</Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">カテゴリー</Typography>
                  <Typography variant="body1">{getCategoryDisplayName(selectedProduct.category)}</Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">価格</Typography>
                  <Typography variant="body1">
                    {selectedProduct.priceType === 'monthly' 
                      ? `月額 ${selectedProduct.price?.toLocaleString()}円`
                      : `${selectedProduct.price?.toLocaleString()}円`
                    }
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>機能</Typography>
                <Stack spacing={1}>
                  {selectedProduct.features?.map((feature, index) => (
                    <Chip key={index} label={feature} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>説明</Typography>
                <Typography variant="body2">
                  {selectedProduct.description}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>閉じる</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              // @MOCK_TO_API: 商品編集画面に遷移
              console.log('🔧 MOCK 商品編集:', selectedProduct?.id);
              setDetailDialogOpen(false);
            }}
          >
            編集
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};