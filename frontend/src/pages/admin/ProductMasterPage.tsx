// P-008: 商材マスタページ
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
  TablePagination,
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Inventory,
  Refresh,
  Visibility,
  Edit,
  Add,
  CheckCircle,
  Cancel,
  Computer,
  Cloud,
  Memory,
  Code
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { mockContractProductService } from '../../services/mock/contractProduct.service';
import { ProductType } from '../../types';

export const ProductMasterPage: React.FC = () => {
  const { user } = useAuth();
  const isMockMode = process.env.NODE_ENV === 'development';

  // State管理
  const [products, setProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // フィルター・ページネーション
  const [typeFilter, setTypeFilter] = useState<ProductType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // ダイアログ
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // 初期データ取得
  useEffect(() => {
    fetchProducts();
  }, [page, rowsPerPage, typeFilter, categoryFilter, isActiveFilter, searchQuery]);

  // 商材取得
  const fetchProducts = async () => {
    try {
      const response = await mockContractProductService.searchProducts({
        query: searchQuery || undefined,
        type: typeFilter || undefined,
        category: categoryFilter || undefined,
        isActive: isActiveFilter,
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      if (response.success && response.data) {
        setProducts(response.data.products);
        setTotalCount(response.data.totalCount);
      }
    } catch (error) {
      console.error('商材取得エラー:', error);
    }
  };

  // 商材タイプ表示
  const getTypeDisplay = (type: ProductType) => {
    switch (type) {
      case ProductType.SOFTWARE:
        return { label: 'ソフトウェア', color: 'primary', icon: <Computer /> };
      case ProductType.CLOUD_SERVICE:
        return { label: 'クラウドサービス', color: 'info', icon: <Cloud /> };
      case ProductType.HARDWARE:
        return { label: 'ハードウェア', color: 'warning', icon: <Memory /> };
      case ProductType.CONSULTING:
        return { label: 'コンサルティング', color: 'success', icon: <Code /> };
      default:
        return { label: '不明', color: 'default', icon: <Computer /> };
    }
  };

  // 詳細表示
  const handleViewDetail = (product: any) => {
    setSelectedProduct(product);
    setDetailDialogOpen(true);
  };

  // 商材統計
  const getProductStats = () => {
    const total = products.length;
    const active = products.filter(p => p.isActive).length;
    const inactive = products.filter(p => !p.isActive).length;
    const software = products.filter(p => p.type === ProductType.SOFTWARE).length;
    const cloud = products.filter(p => p.type === ProductType.CLOUD_SERVICE).length;

    return { total, active, inactive, software, cloud };
  };

  const stats = getProductStats();

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
          [MOCK] 商材マスタページ - モックデータで完全動作中
        </Alert>
      )}

      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Inventory sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            商材マスタ
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchProducts}
          >
            更新
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
          >
            新規商材
          </Button>
        </Stack>
      </Box>

      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="総商材数" 
            value={stats.total} 
            icon={<Inventory />} 
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="有効商材" 
            value={stats.active} 
            icon={<CheckCircle />} 
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="ソフトウェア" 
            value={stats.software} 
            icon={<Computer />} 
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="クラウド" 
            value={stats.cloud} 
            icon={<Cloud />} 
            color="warning"
          />
        </Grid>
      </Grid>

      {/* フィルター */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          検索・フィルター
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="商材名、コードで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>タイプ</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ProductType | '')}
                label="タイプ"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value={ProductType.SOFTWARE}>ソフトウェア</MenuItem>
                <MenuItem value={ProductType.CLOUD_SERVICE}>クラウド</MenuItem>
                <MenuItem value={ProductType.HARDWARE}>ハードウェア</MenuItem>
                <MenuItem value={ProductType.CONSULTING}>コンサル</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="カテゴリ"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="CRM">CRM</MenuItem>
                <MenuItem value="Analytics">Analytics</MenuItem>
                <MenuItem value="Security">Security</MenuItem>
                <MenuItem value="Backup">Backup</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={isActiveFilter === true}
                  onChange={(e) => setIsActiveFilter(e.target.checked ? true : undefined)}
                />
              }
              label="有効のみ"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="textSecondary">
              {totalCount}件の商材
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 商材一覧 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>商材情報</TableCell>
                <TableCell>タイプ</TableCell>
                <TableCell>価格</TableCell>
                <TableCell>バージョン</TableCell>
                <TableCell>状態</TableCell>
                <TableCell>更新日</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => {
                const typeDisplay = getTypeDisplay(product.type);
                
                return (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {product.code} | {product.category}
                        </Typography>
                        <Box display="flex" gap={0.5} mt={0.5}>
                          {product.tags?.map((tag: string) => (
                            <Chip key={tag} size="small" label={tag} variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={typeDisplay.label}
                        color={typeDisplay.color as any}
                        icon={typeDisplay.icon}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          ¥{product.basePrice.toLocaleString()}
                        </Typography>
                        {product.monthlyPrice > 0 && (
                          <Typography variant="caption" color="textSecondary">
                            月額: ¥{product.monthlyPrice.toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {product.version}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={product.isActive ? '有効' : '無効'}
                        color={product.isActive ? 'success' : 'default'}
                        icon={product.isActive ? <CheckCircle /> : <Cancel />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(product.updatedAt).toLocaleDateString('ja-JP')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="詳細表示">
                          <IconButton 
                            size="small"
                            onClick={() => handleViewDetail(product)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="編集">
                          <IconButton size="small">
                            <Edit />
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
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="表示件数"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}件`}
        />
      </Paper>

      {/* 商材詳細ダイアログ */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>商材詳細</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">商材名</Typography>
                  <Typography variant="body1">{selectedProduct.name}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">商材コード</Typography>
                  <Typography variant="body1">{selectedProduct.code}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">タイプ</Typography>
                  <Chip 
                    size="small" 
                    label={getTypeDisplay(selectedProduct.type).label}
                    color={getTypeDisplay(selectedProduct.type).color as any}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">カテゴリ</Typography>
                  <Typography variant="body1">{selectedProduct.category}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">説明</Typography>
                  <Typography variant="body1">{selectedProduct.description}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">基本価格</Typography>
                  <Typography variant="body1">¥{selectedProduct.basePrice.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">月額料金</Typography>
                  <Typography variant="body1">¥{selectedProduct.monthlyPrice.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">機能</Typography>
                  <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                    {selectedProduct.features.map((feature: string) => (
                      <Chip key={feature} size="small" label={feature} variant="outlined" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">技術仕様</Typography>
                  <Typography variant="body1">
                    対応OS: {selectedProduct.technicalSpecs.supportedOs.join(', ')}<br/>
                    最小RAM: {selectedProduct.technicalSpecs.minRam}<br/>
                    ディスク容量: {selectedProduct.technicalSpecs.diskSpace}<br/>
                    クラウド対応: {selectedProduct.technicalSpecs.cloudCompatible ? 'あり' : 'なし'}<br/>
                    API提供: {selectedProduct.technicalSpecs.apiAvailable ? 'あり' : 'なし'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>閉じる</Button>
          <Button variant="contained">編集</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};