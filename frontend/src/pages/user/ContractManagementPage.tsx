// P-006: 契約管理ページ
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
  Divider
} from '@mui/material';
import {
  Description,
  Refresh,
  Visibility,
  Edit,
  CheckCircle,
  Warning,
  Error,
  Schedule,
  Business,
  MonetizationOn,
  Assignment
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { mockContractProductService } from '../../services/mock/contractProduct.service';
import { ContractStatus } from '../../types';

export const ContractManagementPage: React.FC = () => {
  const { user } = useAuth();
  const isMockMode = process.env.NODE_ENV === 'development';

  // State管理
  const [contracts, setContracts] = useState<any[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // フィルター・ページネーション
  const [statusFilter, setStatusFilter] = useState<ContractStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // ダイアログ
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  // 初期データ取得
  useEffect(() => {
    fetchContracts();
  }, [page, rowsPerPage, statusFilter, searchQuery]);

  // 契約取得
  const fetchContracts = async () => {
    try {
      const response = await mockContractProductService.searchContracts({
        query: searchQuery || undefined,
        status: statusFilter || undefined,
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'startDate',
        sortOrder: 'desc'
      });
      
      if (response.success && response.data) {
        setContracts(response.data.contracts);
        setTotalCount(response.data.totalCount);
      }
    } catch (error) {
      console.error('契約取得エラー:', error);
    }
  };

  // ステータス表示
  const getStatusDisplay = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
        return { label: '有効', color: 'success', icon: <CheckCircle /> };
      case ContractStatus.PENDING:
        return { label: '審査中', color: 'warning', icon: <Schedule /> };
      case ContractStatus.EXPIRED:
        return { label: '期限切れ', color: 'error', icon: <Error /> };
      case ContractStatus.CANCELLED:
        return { label: 'キャンセル', color: 'default', icon: <Error /> };
      default:
        return { label: '不明', color: 'default', icon: <Assignment /> };
    }
  };

  // 詳細表示
  const handleViewDetail = (contract: any) => {
    setSelectedContract(contract);
    setDetailDialogOpen(true);
  };

  // 契約統計
  const getContractStats = () => {
    const total = contracts.length;
    const active = contracts.filter(c => c.status === ContractStatus.ACTIVE).length;
    const pending = contracts.filter(c => c.status === ContractStatus.PENDING).length;
    const expired = contracts.filter(c => c.status === ContractStatus.EXPIRED).length;
    const totalRevenue = contracts
      .filter(c => c.status === ContractStatus.ACTIVE)
      .reduce((sum, c) => sum + c.totalAmount, 0);

    return { total, active, pending, expired, totalRevenue };
  };

  const stats = getContractStats();

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
          [MOCK] 契約管理ページ - モックデータで完全動作中
        </Alert>
      )}

      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Description sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            契約管理
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchContracts}
        >
          更新
        </Button>
      </Box>

      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="総契約数" 
            value={stats.total} 
            icon={<Assignment />} 
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="有効契約" 
            value={stats.active} 
            icon={<CheckCircle />} 
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="審査中" 
            value={stats.pending} 
            icon={<Schedule />} 
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="総契約額" 
            value={`¥${stats.totalRevenue.toLocaleString()}`} 
            icon={<MonetizationOn />} 
            color="info"
          />
        </Grid>
      </Grid>

      {/* フィルター */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          検索・フィルター
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="契約番号、メモで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>ステータス</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ContractStatus | '')}
                label="ステータス"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value={ContractStatus.ACTIVE}>有効</MenuItem>
                <MenuItem value={ContractStatus.PENDING}>審査中</MenuItem>
                <MenuItem value={ContractStatus.EXPIRED}>期限切れ</MenuItem>
                <MenuItem value={ContractStatus.CANCELLED}>キャンセル</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setPage(0);
              }}
            >
              クリア
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="textSecondary">
              {totalCount}件の契約
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 契約一覧 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>契約情報</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>契約期間</TableCell>
                <TableCell>契約額</TableCell>
                <TableCell>企業・商材</TableCell>
                <TableCell>更新日</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.map((contract) => {
                const statusDisplay = getStatusDisplay(contract.status);
                
                return (
                  <TableRow key={contract.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {contract.contractNumber}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          担当: {contract.assignedSalesRep}
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
                      <Box>
                        <Typography variant="body2">
                          {new Date(contract.startDate).toLocaleDateString('ja-JP')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          〜 {new Date(contract.endDate).toLocaleDateString('ja-JP')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          ¥{contract.totalAmount.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          月額: ¥{contract.monthlyAmount.toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          企業ID: {contract.companyId}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          商材ID: {contract.productId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(contract.nextRenewalDate).toLocaleDateString('ja-JP')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="詳細表示">
                          <IconButton 
                            size="small"
                            onClick={() => handleViewDetail(contract)}
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

      {/* 契約詳細ダイアログ */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>契約詳細</DialogTitle>
        <DialogContent>
          {selectedContract && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">契約番号</Typography>
                  <Typography variant="body1">{selectedContract.contractNumber}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">ステータス</Typography>
                  <Chip 
                    size="small" 
                    label={getStatusDisplay(selectedContract.status).label}
                    color={getStatusDisplay(selectedContract.status).color as any}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">契約期間</Typography>
                  <Typography variant="body1">
                    {new Date(selectedContract.startDate).toLocaleDateString('ja-JP')} 〜 {new Date(selectedContract.endDate).toLocaleDateString('ja-JP')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">自動更新</Typography>
                  <Typography variant="body1">{selectedContract.autoRenewal ? 'あり' : 'なし'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">契約額</Typography>
                  <Typography variant="body1">¥{selectedContract.totalAmount.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">月額料金</Typography>
                  <Typography variant="body1">¥{selectedContract.monthlyAmount.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">ライセンス数</Typography>
                  <Typography variant="body1">{selectedContract.licenseCount}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">サポートレベル</Typography>
                  <Typography variant="body1">{selectedContract.supportLevel}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">支払条件</Typography>
                  <Typography variant="body1">{selectedContract.paymentTerms}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">メモ</Typography>
                  <Typography variant="body1">{selectedContract.notes || 'なし'}</Typography>
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