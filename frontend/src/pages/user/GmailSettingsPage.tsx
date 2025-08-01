// P-011: Gmail設定ページ
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Grid,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Settings,
  Mail,
  Sync,
  CheckCircle,
  Error,
  Refresh,
  LinkOff,
  Schedule,
  Security
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { gmailService } from '../../services';
import { GmailSyncStatus } from '../../types';

export const GmailSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const isMockMode = process.env.NODE_ENV === 'development';

  // State管理
  const [syncStatus, setSyncStatus] = useState<GmailSyncStatus>(GmailSyncStatus.DISCONNECTED);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 設定状態
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(5);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [todoExtraction, setTodoExtraction] = useState(true);
  
  // ダイアログ
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  // 初期データ取得
  useEffect(() => {
    fetchSyncStatus();
    fetchStats();
  }, []);

  // 同期状態取得
  const fetchSyncStatus = async () => {
    try {
      const response = await gmailService.getSyncStatus();
      if (response.success && response.data) {
        setSyncStatus(response.data);
        setLastSyncAt(new Date());
      }
    } catch (error) {
      console.error('同期状態取得エラー:', error);
    }
  };

  // 統計情報取得
  const fetchStats = async () => {
    try {
      // 統計情報は別途実装予定
      // const response = await gmailService.getGmailStats();
      // if (response.success && response.data) {
      //   setStats(response.data);
      // }
    } catch (error) {
      console.error('統計取得エラー:', error);
    }
  };

  // Gmail接続
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Gmail OAuth認証フロー
      if (!user?.id) return;
      const authUrlResponse = await gmailService.getConnectUrl(user.id);
      if (authUrlResponse.success && authUrlResponse.data) {
        // OAuth認証画面にリダイレクト
        window.location.href = authUrlResponse.data.authUrl;
        return;
      }
      const response = { success: false, error: 'Gmail接続に失敗しました' };
      if (response.success) {
        setSyncStatus(GmailSyncStatus.CONNECTED);
        fetchSyncStatus();
        fetchStats();
      }
    } catch (error) {
      console.error('Gmail接続エラー:', error);
    } finally {
      setIsConnecting(false);
      setConnectDialogOpen(false);
    }
  };

  // Gmail切断
  const handleDisconnect = async () => {
    try {
      if (!user?.id) return;
      const response = await gmailService.disconnectGmail(user.id);
      if (response.success) {
        setSyncStatus(GmailSyncStatus.DISCONNECTED);
        setLastSyncAt(null);
        setStats(null);
      }
    } catch (error) {
      console.error('Gmail切断エラー:', error);
    } finally {
      setDisconnectDialogOpen(false);
    }
  };

  // 手動同期
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const response = await gmailService.syncGmail();
      if (response.success) {
        fetchSyncStatus();
        fetchStats();
      }
    } catch (error) {
      console.error('同期エラー:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // ステータス表示
  const getStatusDisplay = (status: GmailSyncStatus) => {
    switch (status) {
      case GmailSyncStatus.CONNECTED:
        return { label: '接続済み', color: 'success', icon: <CheckCircle /> };
      case GmailSyncStatus.SYNCING:
        return { label: '同期中', color: 'info', icon: <Sync /> };
      case GmailSyncStatus.ERROR:
        return { label: 'エラー', color: 'error', icon: <Error /> };
      default:
        return { label: '未接続', color: 'default', icon: <Mail /> };
    }
  };

  const statusDisplay = getStatusDisplay(syncStatus);

  return (
    <Box>
      {/* @MOCK_UI: モック表示 */}
      {isMockMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          [MOCK] Gmail設定ページ - モックデータで完全動作中
        </Alert>
      )}

      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Settings sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gmail連携設定
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* 接続状態カード */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Gmail接続状態
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                {statusDisplay.icon}
                <Box ml={2}>
                  <Chip 
                    label={statusDisplay.label}
                    color={statusDisplay.color as any}
                    sx={{ mb: 1 }}
                  />
                  {lastSyncAt && (
                    <Typography variant="caption" color="textSecondary" display="block">
                      最終同期: {lastSyncAt.toLocaleString('ja-JP')}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Box display="flex" gap={1}>
                {syncStatus === GmailSyncStatus.CONNECTED ? (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={handleManualSync}
                      disabled={isSyncing}
                    >
                      {isSyncing ? '同期中...' : '手動同期'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<LinkOff />}
                      onClick={() => setDisconnectDialogOpen(true)}
                    >
                      切断
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<Mail />}
                    onClick={() => setConnectDialogOpen(true)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? '接続中...' : 'Gmail連携を開始'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 統計情報カード */}
        {stats && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  同期統計
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">総スレッド数</Typography>
                    <Typography variant="h6">{stats.totalThreads}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">未読スレッド</Typography>
                    <Typography variant="h6">{stats.unreadThreads}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">AI処理済み</Typography>
                    <Typography variant="h6">{stats.aiProcessedThreads}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">TODO抽出数</Typography>
                    <Typography variant="h6">{stats.todoExtractedCount}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 同期設定 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                同期設定
              </Typography>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      disabled={syncStatus !== GmailSyncStatus.CONNECTED}
                    />
                  }
                  label="自動同期を有効にする"
                />
                <Box mt={2}>
                  <TextField
                    label="同期間隔（分）"
                    type="number"
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(Number(e.target.value))}
                    disabled={!autoSync || syncStatus !== GmailSyncStatus.CONNECTED}
                    size="small"
                    inputProps={{ min: 1, max: 60 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* AI機能設定 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI機能設定
              </Typography>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={todoExtraction}
                      onChange={(e) => setTodoExtraction(e.target.checked)}
                      disabled={syncStatus !== GmailSyncStatus.CONNECTED}
                    />
                  }
                  label="TODO自動抽出を有効にする"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationEnabled}
                      onChange={(e) => setNotificationEnabled(e.target.checked)}
                      disabled={syncStatus !== GmailSyncStatus.CONNECTED}
                    />
                  }
                  label="新着通知を有効にする"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 詳細設定 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                詳細設定
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Gmail連携の詳細な設定を管理します
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText
                    primary="同期対象フォルダ"
                    secondary="受信トレイ, 送信済みアイテム"
                  />
                  <ListItemSecondaryAction>
                    <Button size="small">編集</Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="除外キーワード"
                    secondary="スパム, 自動返信メール"
                  />
                  <ListItemSecondaryAction>
                    <Button size="small">編集</Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="データ保持期間"
                    secondary="90日間"
                  />
                  <ListItemSecondaryAction>
                    <Button size="small">編集</Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gmail接続ダイアログ */}
      <Dialog open={connectDialogOpen} onClose={() => setConnectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gmail連携の開始</DialogTitle>
        <DialogContent>
          <Typography variant="body1" mb={2}>
            Gmailアカウントと連携してメールの自動同期を開始します。
          </Typography>
          <Typography variant="body2" color="textSecondary">
            ※ モックモードでは実際のGmail認証は行われません
          </Typography>
          {isConnecting && (
            <Box mt={2}>
              <LinearProgress />
              <Typography variant="caption" color="textSecondary" mt={1}>
                Gmail認証を処理中...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectDialogOpen(false)} disabled={isConnecting}>
            キャンセル
          </Button>
          <Button variant="contained" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? '接続中...' : 'Gmail連携を開始'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Gmail切断確認ダイアログ */}
      <Dialog open={disconnectDialogOpen} onClose={() => setDisconnectDialogOpen(false)}>
        <DialogTitle>Gmail連携の切断</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Gmail連携を切断しますか？同期されたデータは保持されますが、新しいメールの自動同期は停止されます。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisconnectDialogOpen(false)}>
            キャンセル
          </Button>
          <Button color="error" variant="contained" onClick={handleDisconnect}>
            切断する
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};