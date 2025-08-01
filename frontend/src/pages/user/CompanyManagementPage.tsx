// P-002: 企業管理ページ
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Chip,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Business,
  Add,
  Search,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Download,
  Refresh,
  Person,
  Assessment,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { companyService } from '../../services';
import { 
  Company, 
  CompanyStatus,
  CompanySize,
  CompanySearchRequest,
  Contact
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
      id={`company-tabpanel-${index}`}
      aria-labelledby={`company-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const CompanyManagementPage: React.FC = () => {
  const isMockMode = process.env.NODE_ENV === 'development';

  // State管理
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [tabValue, setTabValue] = useState(0);
  
  // 検索・フィルター
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CompanyStatus[]>([]);
  const [sizeFilter, setSizeFilter] = useState<CompanySize[]>([]);
  
  // ページネーション
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // ダイアログ
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyContacts, setCompanyContacts] = useState<Contact[]>([]);
  
  // メニュー
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuCompanyId, setMenuCompanyId] = useState<string | null>(null);

  // 企業一覧取得
  const fetchCompanies = async () => {
    try {
      const searchRequest: CompanySearchRequest = {
        query: searchQuery || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        size: sizeFilter.length > 0 ? sizeFilter : undefined,
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const response = await companyService.searchCompanies(searchRequest);
      
      if (response.success && response.data) {
        setCompanies(response.data.companies);
        setTotalCount(response.data.totalCount);
      }
    } catch (error) {
      console.error('企業取得エラー:', error);
    }
  };

  // 統計情報取得
  const fetchStats = async () => {
    try {
      const response = await companyService.getCompanyStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('統計取得エラー:', error);
    }
  };

  // 初期データ取得
  useEffect(() => {
    fetchCompanies();
    fetchStats();
  }, [page, rowsPerPage, searchQuery, statusFilter, sizeFilter]);

  // ステータス表示名取得
  const getStatusDisplayName = (status: CompanyStatus): string => {
    switch (status) {
      case CompanyStatus.LEAD: return 'リード';
      case CompanyStatus.PROSPECT: return '見込み客';
      case CompanyStatus.ACTIVE_CUSTOMER: return '顧客';
      case CompanyStatus.INACTIVE: return '非活性';
      default: return '不明';
    }
  };

  // ステータス色取得
  const getStatusColor = (status: CompanyStatus) => {
    switch (status) {
      case CompanyStatus.LEAD: return 'info';
      case CompanyStatus.PROSPECT: return 'warning';
      case CompanyStatus.ACTIVE_CUSTOMER: return 'success';
      case CompanyStatus.INACTIVE: return 'default';
      default: return 'default';
    }
  };

  // 規模表示名取得
  const getSizeDisplayName = (size: CompanySize): string => {
    switch (size) {
      case CompanySize.LARGE: return '大企業';
      case CompanySize.MEDIUM: return '中企業';
      case CompanySize.SMALL: return '小企業';
      default: return '不明';
    }
  };

  // メニューハンドラー
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, companyId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuCompanyId(companyId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCompanyId(null);
  };

  // 企業詳細表示
  const handleViewCompany = async (company: Company) => {
    setSelectedCompany(company);
    
    // 担当者情報取得
    try {
      const response = await companyService.getCompanyContacts(company.id);
      if (response.success && response.data) {
        setCompanyContacts(response.data);
      }
    } catch (error) {
      console.error('担当者取得エラー:', error);
    }
    
    setViewDialogOpen(true);
    handleMenuClose();
  };

  // 企業編集
  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  // 統計カード
  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color?: string }> = 
    ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
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
          [MOCK] 企業管理ページ - モックデータで完全動作中
        </Alert>
      )}

      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Business sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            企業管理
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          新規企業登録
        </Button>
      </Box>

      {/* タブナビゲーション */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab 
            icon={<Business />} 
            label="企業一覧" 
            iconPosition="start"
          />
          <Tab 
            icon={<Assessment />} 
            label="統計・分析" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* 企業一覧タブ */}
      <TabPanel value={tabValue} index={0}>
        {/* 統計カード */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="総企業数" 
                value={stats.totalCompanies} 
                icon={<Business />} 
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="顧客数" 
                value={stats.activeCustomers} 
                icon={<TrendingUp />} 
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="見込み客" 
                value={stats.prospects} 
                icon={<Assessment />} 
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="リード数" 
                value={stats.leads} 
                icon={<Add />} 
                color="info"
              />
            </Grid>
          </Grid>
        )}

        {/* 検索・フィルター */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="企業名、業界、タグで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>ステータス</InputLabel>
                <Select
                  multiple
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as CompanyStatus[])}
                  label="ステータス"
                >
                  {Object.values(CompanyStatus).map(status => (
                    <MenuItem key={status} value={status}>
                      {getStatusDisplayName(status)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>規模</InputLabel>
                <Select
                  multiple
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value as CompanySize[])}
                  label="規模"
                >
                  {Object.values(CompanySize).map(size => (
                    <MenuItem key={size} value={size}>
                      {getSizeDisplayName(size)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box display="flex" gap={1}>
                <Tooltip title="更新">
                  <IconButton onClick={fetchCompanies}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Tooltip title="エクスポート">
                  <IconButton>
                    <Download />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* 企業テーブル */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedCompanies.length > 0 && selectedCompanies.length < companies.length}
                      checked={companies.length > 0 && selectedCompanies.length === companies.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCompanies(companies.map(c => c.id));
                        } else {
                          setSelectedCompanies([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>企業名</TableCell>
                  <TableCell>業界</TableCell>
                  <TableCell>規模</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>担当者</TableCell>
                  <TableCell>最終コンタクト</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedCompanies.includes(company.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCompanies([...selectedCompanies, company.id]);
                          } else {
                            setSelectedCompanies(selectedCompanies.filter(id => id !== company.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {company.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {company.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {company.nameKana}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{company.industry}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={getSizeDisplayName(company.size)}
                        color="default"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={getStatusDisplayName(company.status)}
                        color={getStatusColor(company.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {/* TODO: 担当者名の表示 */}
                        担当者名
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {company.lastContactAt 
                        ? new Date(company.lastContactAt).toLocaleDateString('ja-JP')
                        : '未コンタクト'
                      }
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, company.id)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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
      </TabPanel>

      {/* 統計・分析タブ */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          企業統計・分析
        </Typography>
        <Typography variant="body1" color="textSecondary">
          詳細な分析機能は後のPhaseで実装予定
        </Typography>
      </TabPanel>

      {/* 企業メニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const company = companies.find(c => c.id === menuCompanyId);
          if (company) handleViewCompany(company);
        }}>
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>詳細表示</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          const company = companies.find(c => c.id === menuCompanyId);
          if (company) handleEditCompany(company);
        }}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>編集</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}><Delete /></ListItemIcon>
          <ListItemText>削除</ListItemText>
        </MenuItem>
      </Menu>

      {/* 企業詳細ダイアログ */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>企業詳細情報</DialogTitle>
        <DialogContent>
          {selectedCompany && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedCompany.name}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">業界</Typography>
                  <Typography variant="body1">{selectedCompany.industry}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">規模</Typography>
                  <Typography variant="body1">{getSizeDisplayName(selectedCompany.size)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">説明</Typography>
                  <Typography variant="body1">{selectedCompany.description || '説明がありません'}</Typography>
                </Grid>
              </Grid>
              
              {companyContacts.length > 0 && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>担当者一覧</Typography>
                  {companyContacts.map(contact => (
                    <Box key={contact.id} display="flex" alignItems="center" py={1}>
                      <Person sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="body2">{contact.fullName} ({contact.position})</Typography>
                        <Typography variant="caption" color="textSecondary">{contact.email}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* 新規企業作成ダイアログ */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>新規企業登録</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            企業登録フォームは後のPhaseで実装予定
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained">登録</Button>
        </DialogActions>
      </Dialog>

      {/* 企業編集ダイアログ */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>企業編集</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            企業編集フォームは後のPhaseで実装予定
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained">更新</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};