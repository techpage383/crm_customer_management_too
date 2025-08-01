// P-003: Gmailログページ
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Stack
} from '@mui/material';
import {
  Email,
  Search,
  Star,
  StarBorder,
  MarkEmailRead,
  MarkEmailUnread,
  AttachFile,
  Business,
  Person,
  Refresh,
  FilterList,
  MoreVert
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { mockGmailIntegrationService } from '../../services/mock/gmailIntegration.service';
import { EmailThread } from '../../types';

export const GmailLogPage: React.FC = () => {
  const { user } = useAuth();
  const isMockMode = process.env.NODE_ENV === 'development';

  // State管理
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThreads, setSelectedThreads] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // 検索・フィルター
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRead, setFilterRead] = useState<boolean | undefined>(undefined);
  const [filterStarred, setFilterStarred] = useState<boolean | undefined>(undefined);
  const [filterAttachment, setFilterAttachment] = useState<boolean | undefined>(undefined);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  
  // ページネーション
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // UI状態
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuThreadId, setMenuThreadId] = useState<string | null>(null);
  const [threadDetailOpen, setThreadDetailOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);

  // データ取得
  useEffect(() => {
    fetchThreads();
    fetchStats();
    fetchLabels();
  }, [page, rowsPerPage, searchQuery, filterRead, filterStarred, filterAttachment, selectedLabels]);

  // メールスレッド取得
  const fetchThreads = async () => {
    try {
      const filters = {
        query: searchQuery || undefined,
        isRead: filterRead,
        isStarred: filterStarred,
        hasAttachment: filterAttachment,
        labels: selectedLabels.length > 0 ? selectedLabels : undefined,
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'lastMessageDate',
        sortOrder: 'desc' as 'desc' | 'asc'
      };

      const response = await mockGmailIntegrationService.searchEmailThreads(filters);
      if (response.success && response.data) {
        setThreads(response.data.threads);
        setTotalCount(response.data.totalCount);
      }
    } catch (error) {
      console.error('メールスレッド取得エラー:', error);
    }
  };

  // 統計取得
  const fetchStats = async () => {
    try {
      const response = await mockGmailIntegrationService.getGmailStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('統計取得エラー:', error);
    }
  };

  // ラベル取得
  const fetchLabels = async () => {
    try {
      const response = await mockGmailIntegrationService.getEmailLabels();
      if (response.success && response.data) {
        setAvailableLabels(response.data);
      }
    } catch (error) {
      console.error('ラベル取得エラー:', error);
    }
  };

  // スター切り替え
  const toggleStar = async (threadId: string, isStarred: boolean) => {
    try {
      const response = await mockGmailIntegrationService.updateThreadStarStatus(threadId, !isStarred);
      if (response.success) {
        fetchThreads();
        fetchStats();
      }
    } catch (error) {
      console.error('スター更新エラー:', error);
    }
  };

  // 既読切り替え
  const toggleRead = async (threadId: string, isRead: boolean) => {
    try {
      const response = await mockGmailIntegrationService.updateThreadReadStatus(threadId, !isRead);
      if (response.success) {
        fetchThreads();
        fetchStats();
      }
    } catch (error) {
      console.error('既読状態更新エラー:', error);
    }
  };

  // メニューハンドラー
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, threadId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuThreadId(threadId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuThreadId(null);
  };

  // スレッド詳細表示
  const handleViewThread = (thread: EmailThread) => {
    setSelectedThread(thread);
    setThreadDetailOpen(true);
    handleMenuClose();
  };

  // 一括既読
  const handleBulkMarkAsRead = async () => {
    if (selectedThreads.length === 0) return;
    
    try {
      const response = await mockGmailIntegrationService.markThreadsAsRead(selectedThreads);
      if (response.success) {
        setSelectedThreads([]);
        fetchThreads();
        fetchStats();
      }
    } catch (error) {
      console.error('一括既読エラー:', error);
    }
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
          [MOCK] Gmailログページ - モックデータで完全動作中
        </Alert>
      )}

      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Email sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gmailログ
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchThreads}
        >
          更新
        </Button>
      </Box>

      {/* 統計カード */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="総スレッド数" 
              value={stats.totalThreads} 
              icon={<Email />} 
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="未読スレッド" 
              value={stats.unreadThreads} 
              icon={<MarkEmailUnread />} 
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="スター付き" 
              value={stats.starredThreads} 
              icon={<Star />} 
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="添付ファイル有り" 
              value={stats.threadsWithAttachments} 
              icon={<AttachFile />} 
              color="success"
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
              placeholder="件名、内容で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>既読状態</InputLabel>
              <Select
                value={filterRead === undefined ? '' : String(filterRead)}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterRead(value === '' ? undefined : value === 'true');
                }}
                label="既読状態"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="false">未読のみ</MenuItem>
                <MenuItem value="true">既読のみ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filterStarred === true}
                  onChange={(e) => setFilterStarred(e.target.checked ? true : undefined)}
                />
              }
              label="スター付きのみ"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filterAttachment === true}
                  onChange={(e) => setFilterAttachment(e.target.checked ? true : undefined)}
                />
              }
              label="添付ファイル有り"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            {selectedThreads.length > 0 && (
              <Button
                variant="outlined"
                onClick={handleBulkMarkAsRead}
                size="small"
              >
                選択を既読に
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* メールスレッド一覧 */}
      <Paper>
        <List>
          {threads.map((thread, index) => (
            <React.Fragment key={thread.id}>
              <ListItem>
                <Checkbox
                  checked={selectedThreads.includes(thread.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedThreads([...selectedThreads, thread.id]);
                    } else {
                      setSelectedThreads(selectedThreads.filter(id => id !== thread.id));
                    }
                  }}
                  sx={{ mr: 1 }}
                />
                
                <IconButton 
                  onClick={() => toggleStar(thread.id, thread.isStarred || false)}
                  sx={{ mr: 1 }}
                >
                  {thread.isStarred ? <Star color="warning" /> : <StarBorder />}
                </IconButton>

                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography 
                        variant="body1" 
                        fontWeight={thread.isRead ? 'normal' : 'bold'}
                        sx={{ flex: 1 }}
                      >
                        {thread.subject}
                      </Typography>
                      {thread.hasAttachment && <AttachFile fontSize="small" />}
                      {thread.companyId && (
                        <Chip size="small" icon={<Business />} label="企業" variant="outlined" />
                      )}
                      <Typography variant="caption" color="textSecondary">
                        {new Date(thread.lastMessageDate).toLocaleDateString('ja-JP')}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary" noWrap>
                        {thread.snippet}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={1}>
                        <Chip size="small" label={`${thread.messageCount}件`} />
                        {thread.labels?.map(label => (
                          <Chip key={label} size="small" label={label} variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  }
                  onClick={() => handleViewThread(thread)}
                  sx={{ cursor: 'pointer' }}
                />

                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title={thread.isRead ? "未読にする" : "既読にする"}>
                      <IconButton 
                        onClick={() => toggleRead(thread.id, thread.isRead || false)}
                        size="small"
                      >
                        {thread.isRead ? <MarkEmailUnread /> : <MarkEmailRead />}
                      </IconButton>
                    </Tooltip>
                    <IconButton 
                      onClick={(e) => handleMenuOpen(e, thread.id)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
              {index < threads.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        
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

      {/* スレッドメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const thread = threads.find(t => t.id === menuThreadId);
          if (thread) handleViewThread(thread);
        }}>
          詳細表示
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          企業に関連付け
        </MenuItem>
      </Menu>

      {/* スレッド詳細ダイアログ */}
      <Dialog 
        open={threadDetailOpen} 
        onClose={() => setThreadDetailOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>メールスレッド詳細</DialogTitle>
        <DialogContent>
          {selectedThread && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedThread.subject}
              </Typography>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">メッセージ数</Typography>
                  <Typography variant="body1">{selectedThread.messageCount}件</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">最終更新</Typography>
                  <Typography variant="body1">
                    {new Date(selectedThread.lastMessageDate).toLocaleString('ja-JP')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">内容プレビュー</Typography>
                  <Typography variant="body1">{selectedThread.snippet}</Typography>
                </Grid>
                {selectedThread.labels && selectedThread.labels.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">ラベル</Typography>
                    <Box display="flex" gap={1} mt={1}>
                      {selectedThread.labels.map(label => (
                        <Chip key={label} size="small" label={label} variant="outlined" />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setThreadDetailOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};