// P-009: 提案管理ページ
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
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Handshake,
  Refresh,
  Visibility,
  Edit,
  Add,
  CheckCircle,
  Schedule,
  Visibility as VisibilityIcon,
  MonetizationOn,
  Assignment,
  Business
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { mockContractProductService } from '../../services/mock/contractProduct.service';
import { ProposalStatus } from '../../types';

export const ProposalManagementPage: React.FC = () => {
  const { user } = useAuth();
  const isMockMode = process.env.NODE_ENV === 'development';

  // State管理
  const [proposals, setProposals] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // フィルター・ページネーション
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // ダイアログ
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);

  // 初期データ取得
  useEffect(() => {
    fetchProposals();
  }, [page, rowsPerPage, statusFilter, searchQuery]);

  // 提案取得
  const fetchProposals = async () => {
    try {
      const response = await mockContractProductService.searchProposals({
        query: searchQuery || undefined,
        status: statusFilter || undefined,
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'submittedAt',
        sortOrder: 'desc'
      });
      
      if (response.success && response.data) {
        setProposals(response.data.proposals);
        setTotalCount(response.data.totalCount);
      }
    } catch (error) {
      console.error('提案取得エラー:', error);
    }
  };

  // ステータス表示
  const getStatusDisplay = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.DRAFT:
        return { label: '下書き', color: 'default', icon: <Edit /> };
      case ProposalStatus.SUBMITTED:
        return { label: '提出済み', color: 'info', icon: <Schedule /> };
      case ProposalStatus.UNDER_REVIEW:
        return { label: '審査中', color: 'warning', icon: <VisibilityIcon /> };
      case ProposalStatus.ACCEPTED:
        return { label: '承認済み', color: 'success', icon: <CheckCircle /> };
      case ProposalStatus.REJECTED:
        return { label: '却下', color: 'error', icon: <Assignment /> };
      default:
        return { label: '不明', color: 'default', icon: <Assignment /> };
    }
  };

  // 詳細表示
  const handleViewDetail = (proposal: any) => {
    setSelectedProposal(proposal);
    setDetailDialogOpen(true);
  };

  // 提案統計
  const getProposalStats = () => {
    const total = proposals.length;
    const pending = proposals.filter(p => p.status === ProposalStatus.SUBMITTED).length;
    const underReview = proposals.filter(p => p.status === ProposalStatus.UNDER_REVIEW).length;
    const accepted = proposals.filter(p => p.status === ProposalStatus.ACCEPTED).length;
    const totalAmount = proposals.reduce((sum, p) => sum + p.totalAmount, 0);

    return { total, pending, underReview, accepted, totalAmount };
  };

  const stats = getProposalStats();

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
          [MOCK] 提案管理ページ - モックデータで完全動作中
        </Alert>
      )}

      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Handshake sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            提案管理
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchProposals}
          >
            更新
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
          >
            新規提案
          </Button>
        </Stack>
      </Box>

      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="総提案数" 
            value={stats.total} 
            icon={<Assignment />} 
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="審査中" 
            value={stats.underReview} 
            icon={<VisibilityIcon />} 
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="承認済み" 
            value={stats.accepted} 
            icon={<CheckCircle />} 
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="総提案額" 
            value={`¥${stats.totalAmount.toLocaleString()}`} 
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
              placeholder="提案番号、タイトルで検索..."
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
                onChange={(e) => setStatusFilter(e.target.value as ProposalStatus | '')}
                label="ステータス"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value={ProposalStatus.DRAFT}>下書き</MenuItem>
                <MenuItem value={ProposalStatus.SUBMITTED}>提出済み</MenuItem>
                <MenuItem value={ProposalStatus.UNDER_REVIEW}>審査中</MenuItem>
                <MenuItem value={ProposalStatus.ACCEPTED}>承認済み</MenuItem>
                <MenuItem value={ProposalStatus.REJECTED}>却下</MenuItem>
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
              {totalCount}件の提案
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 提案一覧 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>提案情報</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>提案額</TableCell>
                <TableCell>有効期限</TableCell>
                <TableCell>企業</TableCell>
                <TableCell>提出日</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proposals.map((proposal) => {
                const statusDisplay = getStatusDisplay(proposal.status);
                
                return (
                  <TableRow key={proposal.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {proposal.proposalNumber}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {proposal.title}
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
                      <Typography variant="body2" fontWeight="medium">
                        ¥{proposal.totalAmount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(proposal.validUntil).toLocaleDateString('ja-JP')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          企業ID: {proposal.companyId}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          担当: {proposal.assignedSalesRep}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {proposal.submittedAt 
                          ? new Date(proposal.submittedAt).toLocaleDateString('ja-JP')
                          : '未提出'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="詳細表示">
                          <IconButton 
                            size="small"
                            onClick={() => handleViewDetail(proposal)}
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

      {/* 提案詳細ダイアログ */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>提案詳細</DialogTitle>
        <DialogContent>
          {selectedProposal && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>基本情報</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">提案番号</Typography>
                      <Typography variant="body1">{selectedProposal.proposalNumber}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">タイトル</Typography>
                      <Typography variant="body1">{selectedProposal.title}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">説明</Typography>
                      <Typography variant="body1">{selectedProposal.description}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">総額</Typography>
                      <Typography variant="body1">¥{selectedProposal.totalAmount.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">有効期限</Typography>
                      <Typography variant="body1">{new Date(selectedProposal.validUntil).toLocaleDateString('ja-JP')}</Typography>
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>提案項目</Typography>
                  <List dense>
                    {selectedProposal.proposalItems.map((item: any, index: number) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={item.productName}
                            secondary={
                              <Box>
                                <Typography variant="caption">
                                  数量: {item.quantity} | 単価: ¥{item.unitPrice.toLocaleString()}
                                </Typography>
                                <br />
                                <Typography variant="caption">
                                  初期費用: ¥{item.setupFee.toLocaleString()} | 月額: ¥{item.monthlyFee.toLocaleString()}
                                </Typography>
                                {item.notes && (
                                  <>
                                    <br />
                                    <Typography variant="caption">{item.notes}</Typography>
                                  </>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < selectedProposal.proposalItems.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>成果物</Typography>
                  <List dense>
                    {selectedProposal.deliverables.map((deliverable: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemText primary={deliverable} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>契約条件</Typography>
                  <List dense>
                    {selectedProposal.terms.map((term: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemText primary={term} />
                      </ListItem>
                    ))}
                  </List>
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