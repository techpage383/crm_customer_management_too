// P-005: TODO管理ページ
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
  Divider,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  Assignment,
  Add,
  Search,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Download,
  Refresh,
  CheckCircle,
  Schedule,
  Warning,
  Assessment,
  TrendingUp,
  AccessTime,
  Person,
  Business,
  PlayArrow,
  Pause,
  Check,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { todoApiService } from '../../services/api/todo.service';
import { 
  Todo, 
  TodoStatus,
  TodoPriority,
  TodoSource,
  UserRole
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
      id={`todo-tabpanel-${index}`}
      aria-labelledby={`todo-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const TodoManagementPage: React.FC = () => {
  const { user } = useAuth();
  const isMockMode = process.env.NODE_ENV === 'development';

  // State管理
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedTodos, setSelectedTodos] = useState<string[]>([]);
  const [tabValue, setTabValue] = useState(0);
  
  // 検索・フィルター
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TodoStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority[]>([]);
  const [sourceFilter, setSourceFilter] = useState<TodoSource[]>([]);
  const [isInternalFilter, setIsInternalFilter] = useState<boolean | undefined>(undefined);
  const [isOverdueFilter, setIsOverdueFilter] = useState(false);
  
  // ページネーション
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // ダイアログ
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  
  // メニュー
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTodoId, setMenuTodoId] = useState<string | null>(null);

  // TODO一覧取得
  const fetchTodos = async () => {
    try {
      const filters = {
        query: searchQuery || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        priority: priorityFilter.length > 0 ? priorityFilter : undefined,
        source: sourceFilter.length > 0 ? sourceFilter : undefined,
        isInternal: isInternalFilter,
        isOverdue: isOverdueFilter,
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'dueDate',
        sortOrder: 'asc' as 'asc' | 'desc'
      };

      const response = await todoApiService.searchTodos(filters);
      
      if (response.success && response.data) {
        setTodos(response.data.todos);
        setTotalCount(response.data.totalCount);
      }
    } catch (error) {
      console.error('TODO取得エラー:', error);
    }
  };

  // 統計情報取得
  const fetchStats = async () => {
    try {
      const response = await todoApiService.getTodoStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('統計取得エラー:', error);
    }
  };

  // 初期データ取得
  useEffect(() => {
    fetchTodos();
    fetchStats();
  }, [page, rowsPerPage, searchQuery, statusFilter, priorityFilter, sourceFilter, isInternalFilter, isOverdueFilter]);

  // ステータス表示名取得
  const getStatusDisplayName = (status: TodoStatus): string => {
    switch (status) {
      case TodoStatus.PENDING: return '未着手';
      case TodoStatus.IN_PROGRESS: return '進行中';
      case TodoStatus.COMPLETED: return '完了';
      case TodoStatus.CANCELLED: return 'キャンセル';
      default: return '不明';
    }
  };

  // ステータス色取得
  const getStatusColor = (status: TodoStatus) => {
    switch (status) {
      case TodoStatus.PENDING: return 'warning';
      case TodoStatus.IN_PROGRESS: return 'info';
      case TodoStatus.COMPLETED: return 'success';
      case TodoStatus.CANCELLED: return 'default';
      default: return 'default';
    }
  };

  // 優先度表示名取得
  const getPriorityDisplayName = (priority: TodoPriority): string => {
    switch (priority) {
      case TodoPriority.HIGH: return '高';
      case TodoPriority.MEDIUM: return '中';
      case TodoPriority.LOW: return '低';
      default: return '不明';
    }
  };

  // 優先度色取得
  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case TodoPriority.HIGH: return 'error';
      case TodoPriority.MEDIUM: return 'warning';
      case TodoPriority.LOW: return 'success';
      default: return 'default';
    }
  };

  // ソース表示名取得
  const getSourceDisplayName = (source: TodoSource): string => {
    switch (source) {
      case TodoSource.MANUAL: return '手動';
      case TodoSource.AI_EXTRACTED: return 'AI抽出';
      case TodoSource.EMAIL_FOLLOW_UP: return 'メールFU';
      case TodoSource.EMAIL_FORWARDED: return 'メール転送';
      case TodoSource.INTERNAL_REQUEST: return '社内依頼';
      default: return '不明';
    }
  };

  // 期限切れ判定
  const isOverdue = (todo: Todo): boolean => {
    if (todo.status === TodoStatus.COMPLETED || todo.status === TodoStatus.CANCELLED) {
      return false;
    }
    return todo.dueDate ? new Date(todo.dueDate) < new Date() : false;
  };

  // メニューハンドラー
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, todoId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuTodoId(todoId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTodoId(null);
  };

  // TODO詳細表示
  const handleViewTodo = (todo: Todo) => {
    setSelectedTodo(todo);
    setViewDialogOpen(true);
    handleMenuClose();
  };

  // TODO編集
  const handleEditTodo = (todo: Todo) => {
    setSelectedTodo(todo);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  // TODO完了
  const handleCompleteTodo = async (todoId: string) => {
    try {
      const response = await todoApiService.completeTodo(todoId);
      if (response.success) {
        fetchTodos();
        fetchStats();
      }
    } catch (error) {
      console.error('TODO完了エラー:', error);
    }
    handleMenuClose();
  };

  // 統計カード
  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color?: string; subtitle?: string }> = 
    ({ title, value, icon, color = 'primary', subtitle }) => (
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
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
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
          [MOCK] TODO管理ページ - モックデータで完全動作中
        </Alert>
      )}

      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Assignment sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            TODO管理
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          新規TODO作成
        </Button>
      </Box>

      {/* タブナビゲーション */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab 
            icon={<Assignment />} 
            label="TODO一覧" 
            iconPosition="start"
          />
          <Tab 
            icon={<Assessment />} 
            label="統計・分析" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* TODO一覧タブ */}
      <TabPanel value={tabValue} index={0}>
        {/* 統計カード */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="総TODO数" 
                value={stats.totalTodos} 
                icon={<Assignment />} 
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="未着手" 
                value={stats.pendingTodos} 
                icon={<Schedule />} 
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="進行中" 
                value={stats.inProgressTodos} 
                icon={<PlayArrow />} 
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="期限切れ" 
                value={stats.overdueTodos} 
                icon={<Warning />} 
                color="error"
              />
            </Grid>
          </Grid>
        )}

        {/* 検索・フィルター */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="タイトル、説明、タグで検索..."
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
                  onChange={(e) => setStatusFilter(e.target.value as TodoStatus[])}
                  label="ステータス"
                >
                  {Object.values(TodoStatus).map(status => (
                    <MenuItem key={status} value={status}>
                      {getStatusDisplayName(status)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>優先度</InputLabel>
                <Select
                  multiple
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as TodoPriority[])}
                  label="優先度"
                >
                  {Object.values(TodoPriority).map(priority => (
                    <MenuItem key={priority} value={priority}>
                      {getPriorityDisplayName(priority)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>種別</InputLabel>
                <Select
                  value={isInternalFilter === undefined ? '' : String(isInternalFilter)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setIsInternalFilter(value === '' ? undefined : value === 'true');
                  }}
                  label="種別"
                >
                  <MenuItem value="">すべて</MenuItem>
                  <MenuItem value="false">外部</MenuItem>
                  <MenuItem value="true">内部</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Checkbox
                  checked={isOverdueFilter}
                  onChange={(e) => setIsOverdueFilter(e.target.checked)}
                />
                <Typography variant="body2">期限切れのみ</Typography>
                <Box display="flex" gap={1}>
                  <Tooltip title="更新">
                    <IconButton onClick={fetchTodos}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="エクスポート">
                    <IconButton>
                      <Download />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* TODOテーブル */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedTodos.length > 0 && selectedTodos.length < todos.length}
                      checked={todos.length > 0 && selectedTodos.length === todos.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTodos(todos.map(t => t.id));
                        } else {
                          setSelectedTodos([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>タイトル</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>優先度</TableCell>
                  <TableCell>担当者</TableCell>
                  <TableCell>期限</TableCell>
                  <TableCell>種別</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {todos.map((todo) => (
                  <TableRow key={todo.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedTodos.includes(todo.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTodos([...selectedTodos, todo.id]);
                          } else {
                            setSelectedTodos(selectedTodos.filter(id => id !== todo.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {todo.title}
                        </Typography>
                        {todo.companyId && (
                          <Box display="flex" alignItems="center" mt={0.5}>
                            <Business sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="textSecondary">
                              企業ID: {todo.companyId}
                            </Typography>
                          </Box>
                        )}
                        {isOverdue(todo) && (
                          <Chip 
                            size="small" 
                            label="期限切れ" 
                            color="error" 
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={getStatusDisplayName(todo.status)}
                        color={getStatusColor(todo.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={getPriorityDisplayName(todo.priority)}
                        color={getPriorityColor(todo.priority) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Person sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">
                          {/* TODO: 担当者名の表示 */}
                          担当者名
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {todo.dueDate ? (
                        <Box>
                          <Typography variant="body2">
                            {new Date(todo.dueDate).toLocaleDateString('ja-JP')}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(todo.dueDate).toLocaleTimeString('ja-JP', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          期限なし
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Chip 
                          size="small" 
                          label={getSourceDisplayName(todo.source)}
                          color="default"
                          variant="outlined"
                        />
                        {todo.isInternal && (
                          <Chip 
                            size="small" 
                            label="内部"
                            color="info"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, todo.id)}
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
        {stats && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    完了率
                  </Typography>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="h4" component="div" sx={{ mr: 2 }}>
                      {Math.round(stats.todosCompletionRate)}%
                    </Typography>
                    <TrendingUp color="success" />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.todosCompletionRate} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    平均完了時間
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <AccessTime sx={{ mr: 1 }} />
                    <Typography variant="h4" component="div">
                      {stats.averageCompletionTime}日
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* TODOメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const todo = todos.find(t => t.id === menuTodoId);
          if (todo) handleViewTodo(todo);
        }}>
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>詳細表示</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          const todo = todos.find(t => t.id === menuTodoId);
          if (todo) handleEditTodo(todo);
        }}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>編集</ListItemText>
        </MenuItem>
        {menuTodoId && todos.find(t => t.id === menuTodoId)?.status !== TodoStatus.COMPLETED && (
          <MenuItem onClick={() => handleCompleteTodo(menuTodoId)}>
            <ListItemIcon><CheckCircle /></ListItemIcon>
            <ListItemText>完了にする</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}><Delete /></ListItemIcon>
          <ListItemText>削除</ListItemText>
        </MenuItem>
      </Menu>

      {/* TODO詳細ダイアログ */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>TODO詳細情報</DialogTitle>
        <DialogContent>
          {selectedTodo && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedTodo.title}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">ステータス</Typography>
                  <Typography variant="body1">{getStatusDisplayName(selectedTodo.status)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">優先度</Typography>
                  <Typography variant="body1">{getPriorityDisplayName(selectedTodo.priority)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">説明</Typography>
                  <Typography variant="body1">{selectedTodo.description || '説明がありません'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">期限</Typography>
                  <Typography variant="body1">
                    {selectedTodo.dueDate 
                      ? new Date(selectedTodo.dueDate).toLocaleString('ja-JP')
                      : '期限なし'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">ソース</Typography>
                  <Typography variant="body1">{getSourceDisplayName(selectedTodo.source)}</Typography>
                </Grid>
                {selectedTodo.estimatedHours && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">見積時間</Typography>
                    <Typography variant="body1">{selectedTodo.estimatedHours}時間</Typography>
                  </Grid>
                )}
                {selectedTodo.actualHours && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">実績時間</Typography>
                    <Typography variant="body1">{selectedTodo.actualHours}時間</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* 新規TODO作成ダイアログ */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>新規TODO作成</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            TODO作成フォームは後のPhaseで実装予定
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained">作成</Button>
        </DialogActions>
      </Dialog>

      {/* TODO編集ダイアログ */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>TODO編集</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            TODO編集フォームは後のPhaseで実装予定
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