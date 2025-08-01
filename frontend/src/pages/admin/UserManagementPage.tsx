import React, { useState, useEffect, useMemo } from 'react';
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
  FormControlLabel,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  People,
  Add,
  AdminPanelSettings,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  PersonOff,
  PersonAdd,
  Download,
  Refresh,
  Mail,
  Assessment,
  Security
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services';
import { 
  User, 
  UserRole, 
  UserSearchRequest, 
  UserStatsResponse,
  GmailSyncStatus 
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
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isMockMode = process.env.NODE_ENV === 'development';

  // State管理
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [tabValue, setTabValue] = useState(0);
  
  // 検索・フィルター
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole[]>([]);
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [gmailFilter, setGmailFilter] = useState<boolean | ''>('');
  
  // ページネーション
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // ダイアログ
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // メニュー
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUserId, setMenuUserId] = useState<string | null>(null);

  // ユーザー一覧取得
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const searchRequest: UserSearchRequest = {
        query: searchQuery || undefined,
        role: roleFilter.length > 0 ? roleFilter : undefined,
        isActive: statusFilter === '' ? undefined : statusFilter,
        department: departmentFilter || undefined,
        gmailConnected: gmailFilter === '' ? undefined : gmailFilter,
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'fullName',
        sortOrder: 'asc'
      };

      const response = await userService.searchUsers(searchRequest);
      
      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotalCount(response.data.totalCount);
      }
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 統計情報取得
  const fetchStats = async () => {
    try {
      const response = await userService.getUserStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('統計取得エラー:', error);
    }
  };

  // 初期データ取得
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [page, rowsPerPage, searchQuery, roleFilter, statusFilter, departmentFilter, gmailFilter]);

  // ロール表示名取得
  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case UserRole.COMPANY_LEADER: return '代表';
      case UserRole.MANAGER: return '管理職';
      case UserRole.TEAM_LEADER: return 'リーダー';
      case UserRole.USER: return '一般';
      default: return '不明';
    }
  };

  // Gmail同期状態表示
  const getGmailStatusChip = (user: User) => {
    if (!user.gmailPersonalConnected) {
      return <Chip size="small" label="未接続" color="default" />;
    }
    
    switch (user.gmailSyncStatus) {
      case GmailSyncStatus.CONNECTED:
        return <Chip size="small" label="接続中" color="success" icon={<Mail />} />;
      case GmailSyncStatus.SYNCING:
        return <Chip size="small" label="同期中" color="warning" />;
      case GmailSyncStatus.ERROR:
        return <Chip size="small" label="エラー" color="error" />;
      default:
        return <Chip size="small" label="不明" color="default" />;
    }
  };

  // メニューハンドラー
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUserId(null);
  };

  // ユーザー編集
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  // ユーザーステータス切り替え
  const handleToggleUserStatus = async (user: User) => {
    try {
      const response = await userService.updateUserStatus(
        user.id, 
        { 
          isActive: !user.isActive,
          reason: user.isActive ? '管理者による無効化' : '管理者による有効化'
        }
      );
      
      if (response.success) {
        await fetchUsers();
        await fetchStats();
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
    }
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
          [MOCK] ユーザー管理ページ - モックデータで完全動作中
        </Alert>
      )}

      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <AdminPanelSettings sx={{ mr: 2, color: 'secondary.main' }} />
          <Typography variant="h4" component="h1">
            ユーザー管理
          </Typography>
          <Chip 
            label="管理者限定" 
            color="secondary" 
            size="small" 
            sx={{ ml: 2 }} 
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          新規ユーザー作成
        </Button>
      </Box>

      {/* タブナビゲーション */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab 
            icon={<People />} 
            label="ユーザー一覧" 
            iconPosition="start"
          />
          <Tab 
            icon={<Assessment />} 
            label="統計・分析" 
            iconPosition="start"
          />
          <Tab 
            icon={<Security />} 
            label="権限管理" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* ユーザー一覧タブ */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* メインコンテンツ */}
          <Grid item xs={12} lg={8}>
            {/* 検索・フィルター */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="名前、メール、ユーザー名で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>ロール</InputLabel>
                    <Select
                      multiple
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as UserRole[])}
                      label="ロール"
                    >
                      {Object.values(UserRole).map(role => (
                        <MenuItem key={role} value={role}>
                          {getRoleDisplayName(role)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>ステータス</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => {
                        const value = e.target.value;
                        setStatusFilter(value === '' ? '' : value === 'true');
                      }}
                      label="ステータス"
                    >
                      <MenuItem value="">すべて</MenuItem>
                      <MenuItem value="true">アクティブ</MenuItem>
                      <MenuItem value="false">無効</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Search />}
                    onClick={fetchUsers}
                  >
                    検索
                  </Button>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<Add />}
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    新規追加
                  </Button>
                </Grid>
              </Grid>
            </Paper>


        {/* ユーザーテーブル */}
            {/* ユーザーテーブル */}
            <Paper>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  ユーザー一覧 ({totalCount}名)
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => {
                    // @MOCK_TO_API: CSV出力APIに置き換え
                    console.log('🔧 MOCK CSV Export');
                    alert('CSV出力機能（モック）');
                  }}
                >
                  CSV出力
                </Button>
              </Box>
              <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                      checked={users.length > 0 && selectedUsers.length === users.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(users.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>ユーザー</TableCell>
                  <TableCell>ロール</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>最終ログイン</TableCell>
                  <TableCell>Gmail連携</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {user.fullName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {user.fullName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={getRoleDisplayName(user.role)}
                        color={
                          user.role === UserRole.COMPANY_LEADER ? 'error' :
                          user.role === UserRole.MANAGER ? 'warning' :
                          user.role === UserRole.TEAM_LEADER ? 'info' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small"
                        label={user.isActive ? 'アクティブ' : '無効'}
                        color={user.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '未ログイン'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>{getGmailStatusChip(user)}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="編集">
                          <IconButton
                            size="small"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="権限設定">
                          <IconButton size="small">
                            <Security fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="詳細メニュー">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, user.id)}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
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
          </Grid>

          {/* サイドバー */}
          <Grid item xs={12} lg={4}>
            {/* ユーザー統計 */}
            <Card sx={{ mb: 3 }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">ユーザー統計</Typography>
              </Box>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {stats?.totalUsers || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        総ユーザー数
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {stats?.activeUsers || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        アクティブ
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h4" color="info.main" fontWeight="bold">
                        {stats?.gmailConnectedUsers || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Gmail連携済み
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        {stats?.usersByRole[UserRole.COMPANY_LEADER] || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        管理者
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* 権限設定 */}
            <Card sx={{ mb: 3 }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">権限設定</Typography>
              </Box>
              <CardContent>
                {[
                  { name: '企業管理', enabled: true },
                  { name: '契約管理', enabled: true },
                  { name: 'データインポート', enabled: false },
                  { name: 'ユーザー管理', enabled: false },
                  { name: 'システム設定', enabled: false }
                ].map((permission, index) => (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    py: 1.5,
                    borderBottom: index < 4 ? 1 : 0,
                    borderColor: 'divider'
                  }}>
                    <Typography variant="body2" fontWeight="medium">
                      {permission.name}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={permission.enabled} 
                          size="small"
                          onChange={() => {
                            // @MOCK_TO_API: 権限更新APIに置き換え
                            console.log('🔧 MOCK Permission Toggle:', permission.name);
                          }}
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* 最近のアクティビティ */}
            <Card>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">最近のアクティビティ</Typography>
              </Box>
              <CardContent>
                {[
                  { icon: 'login', text: '田中がログインしました', time: '2時間前' },
                  { icon: 'person_add', text: '中村のアカウントが作成されました', time: '3日前' },
                  { icon: 'security', text: '佐藤の権限が更新されました', time: '1週間前' },
                  { icon: 'block', text: '高橋のアカウントが無効化されました', time: '2週間前' }
                ].map((activity, index) => (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    mb: index < 3 ? 2 : 0 
                  }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                      <Box sx={{ fontSize: '16px' }}>📋</Box>
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {activity.text}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* 統計・分析タブ */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {stats && (
            <>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom>
                  ユーザー統計・分析
                </Typography>
              </Grid>
              
              {/* 統計カード */}
              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  title="総ユーザー数" 
                  value={stats.totalUsers} 
                  icon={<People fontSize="large" />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  title="アクティブユーザー" 
                  value={stats.activeUsers} 
                  icon={<PersonAdd fontSize="large" />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  title="Gmail連携済み" 
                  value={stats.gmailConnectedUsers} 
                  icon={<Mail fontSize="large" />}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  title="今月の新規ユーザー" 
                  value={stats.lastMonthNewUsers} 
                  icon={<PersonAdd fontSize="large" />}
                  color="secondary"
                />
              </Grid>

              {/* ロール別統計 */}
              <Grid item xs={12} md={6}>
                <Card>
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">ロール別ユーザー数</Typography>
                  </Box>
                  <CardContent>
                    {Object.entries(stats.usersByRole).map(([role, count]) => (
                      <Box key={role} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        py: 1
                      }}>
                        <Typography variant="body2">
                          {getRoleDisplayName(role as UserRole)}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={count} 
                          color="primary" 
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">アクティビティ概要</Typography>
                  </Box>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        最近アクティブ（7日以内）
                      </Typography>
                      <Typography variant="h5" color="success.main">
                        {stats.recentlyActiveUsers}名
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        平均ログイン頻度
                      </Typography>
                      <Typography variant="h5" color="info.main">
                        週3.2回
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </TabPanel>

      {/* 権限管理タブ */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              ロール別権限管理
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              各ロールに対する機能アクセス権限を設定できます。
            </Typography>
          </Grid>
          
          {Object.values(UserRole).map((role) => (
            <Grid item xs={12} md={6} key={role}>
              <Card>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6">
                    {getRoleDisplayName(role)}の権限
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    対象ユーザー: {stats?.usersByRole[role] || 0}名
                  </Typography>
                </Box>
                <CardContent>
                  {[
                    { key: 'canManageUsers', name: 'ユーザー管理' },
                    { key: 'canManageCompanies', name: '企業管理' },
                    { key: 'canManageContracts', name: '契約管理' },
                    { key: 'canAccessReports', name: 'レポート閲覧' },
                    { key: 'canExportData', name: 'データエクスポート' },
                    { key: 'canImportData', name: 'データインポート' },
                    { key: 'canManageSystem', name: 'システム設定' },
                    { key: 'canViewAuditLogs', name: '監査ログ閲覧' }
                  ].map((permission) => (
                    <Box key={permission.key} sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      py: 1
                    }}>
                      <Typography variant="body2">
                        {permission.name}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={role === UserRole.COMPANY_LEADER} // 簡単な例
                            size="small"
                            onChange={() => {
                              // @MOCK_TO_API: 権限更新APIに置き換え
                              console.log('🔧 MOCK Role Permission Update:', role, permission.key);
                            }}
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* ユーザーメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const user = users.find(u => u.id === menuUserId);
          if (user) handleEditUser(user);
        }}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>編集</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          const user = users.find(u => u.id === menuUserId);
          if (user) handleToggleUserStatus(user);
        }}>
          <ListItemIcon>
            {users.find(u => u.id === menuUserId)?.isActive ? <PersonOff /> : <PersonAdd />}
          </ListItemIcon>
          <ListItemText>
            {users.find(u => u.id === menuUserId)?.isActive ? '無効化' : '有効化'}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}><Delete /></ListItemIcon>
          <ListItemText>削除</ListItemText>
        </MenuItem>
      </Menu>

      {/* 新規ユーザー作成ダイアログ */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <PersonAdd sx={{ mr: 1 }} />
            新規ユーザー作成
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            ユーザー作成フォームは後のPhaseで実装予定です。
            現在はモック表示のみとなります。
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="姓名" placeholder="例: 田中 太郎" disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="ユーザー名" placeholder="例: tanaka123" disabled />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="メールアドレス" placeholder="例: tanaka@company.com" disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled>
                <InputLabel>ロール</InputLabel>
                <Select label="ロール" value="">
                  {Object.values(UserRole).map(role => (
                    <MenuItem key={role} value={role}>
                      {getRoleDisplayName(role)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="部署" placeholder="例: 営業部" disabled />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="電話番号" placeholder="例: 090-1234-5678" disabled />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>キャンセル</Button>
          <Button 
            variant="contained" 
            disabled
            onClick={() => {
              // @MOCK_TO_API: ユーザー作成APIに置き換え
              console.log('🔧 MOCK User Creation');
              setCreateDialogOpen(false);
            }}
          >
            作成（後のPhaseで実装）
          </Button>
        </DialogActions>
      </Dialog>

      {/* ユーザー編集ダイアログ */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Edit sx={{ mr: 1 }} />
            ユーザー編集 - {selectedUser?.fullName}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            ユーザー編集フォームは後のPhaseで実装予定です。
            現在はモック表示のみとなります。
          </Alert>
          {selectedUser && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="姓名" 
                  value={selectedUser.fullName}
                  disabled 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="ユーザー名" 
                  value={selectedUser.username}
                  disabled 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="メールアドレス" 
                  value={selectedUser.email}
                  disabled 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled>
                  <InputLabel>ロール</InputLabel>
                  <Select label="ロール" value={selectedUser.role}>
                    {Object.values(UserRole).map(role => (
                      <MenuItem key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="部署" 
                  value={selectedUser.department || ''}
                  disabled 
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={selectedUser.isActive}
                      disabled
                    />
                  }
                  label="アクティブ状態"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
          <Button 
            variant="contained" 
            disabled
            onClick={() => {
              // @MOCK_TO_API: ユーザー更新APIに置き換え
              console.log('🔧 MOCK User Update:', selectedUser?.id);
              setEditDialogOpen(false);
            }}
          >
            更新（後のPhaseで実装）
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};