// P-012: TODO抽出確認ページ
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
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  SmartToy,
  Check,
  Close,
  Visibility,
  Edit,
  PlayArrow,
  Assessment,
  Schedule,
  Business,
  Person
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { mockGmailIntegrationService } from '../../services/mock/gmailIntegration.service';
import { MOCK_AI_TODO_CANDIDATES } from '../../services/mock/data/gmailIntegration.mock';
import { TodoPriority, TodoStatus } from '../../types';

export const TodoExtractionPage: React.FC = () => {
  const { user } = useAuth();
  const isMockMode = process.env.NODE_ENV === 'development';

  // State管理
  const [todoCandidates, setTodoCandidates] = useState<typeof MOCK_AI_TODO_CANDIDATES>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // ダイアログ
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [batchApprovalOpen, setBatchApprovalOpen] = useState(false);

  // 初期データ取得
  useEffect(() => {
    fetchTodoCandidates();
    fetchStats();
  }, []);

  // TODO候補取得
  const fetchTodoCandidates = async () => {
    try {
      // モック：AI抽出結果を取得
      setTodoCandidates(MOCK_AI_TODO_CANDIDATES);
    } catch (error) {
      console.error('TODO候補取得エラー:', error);
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

  // AI抽出実行
  const handleStartExtraction = async () => {
    setIsExtracting(true);
    try {
      // モック：新しいTODO抽出を実行
      await new Promise(resolve => setTimeout(resolve, 3000));
      fetchTodoCandidates();
    } catch (error) {
      console.error('TODO抽出エラー:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  // TODO候補承認
  const handleApproveCandidate = async (candidateId: string) => {
    try {
      // モック：TODOとして登録
      console.log('TODO承認:', candidateId);
      setTodoCandidates(prev => prev.filter(c => c.id !== candidateId));
    } catch (error) {
      console.error('TODO承認エラー:', error);
    }
  };

  // TODO候補拒否
  const handleRejectCandidate = async (candidateId: string) => {
    try {
      // モック：候補を削除
      setTodoCandidates(prev => prev.filter(c => c.id !== candidateId));
    } catch (error) {
      console.error('TODO拒否エラー:', error);
    }
  };

  // 一括承認
  const handleBatchApproval = async () => {
    try {
      for (const candidateId of selectedCandidates) {
        await handleApproveCandidate(candidateId);
      }
      setSelectedCandidates([]);
      setBatchApprovalOpen(false);
    } catch (error) {
      console.error('一括承認エラー:', error);
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

  // 信頼度色取得
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* @MOCK_UI: モック表示 */}
      {isMockMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          [MOCK] TODO抽出確認ページ - モックデータで完全動作中
        </Alert>
      )}

      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <SmartToy sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            AI TODO抽出
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          {selectedCandidates.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<Check />}
              onClick={() => setBatchApprovalOpen(true)}
            >
              選択した{selectedCandidates.length}件を承認
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleStartExtraction}
            disabled={isExtracting}
          >
            {isExtracting ? 'AI抽出中...' : 'AI抽出開始'}
          </Button>
        </Box>
      </Box>

      {/* 抽出進行状況 */}
      {isExtracting && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            AI TODO抽出中...
          </Typography>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="textSecondary">
            メールを解析してTODO候補を抽出しています
          </Typography>
        </Paper>
      )}

      {/* 統計情報 */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  処理済みメール
                </Typography>
                <Typography variant="h6">{stats.messagesProcessedToday}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  TODO候補数
                </Typography>
                <Typography variant="h6">{todoCandidates.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  高信頼度候補
                </Typography>
                <Typography variant="h6">
                  {todoCandidates.filter(t => t.confidence >= 0.9).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  平均応答時間
                </Typography>
                <Typography variant="h6">{stats.averageResponseTime}時間</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TODO候補一覧 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedCandidates.length > 0 && selectedCandidates.length < todoCandidates.length}
                    checked={todoCandidates.length > 0 && selectedCandidates.length === todoCandidates.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCandidates(todoCandidates.map(c => c.id));
                      } else {
                        setSelectedCandidates([]);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>TODO候補</TableCell>
                <TableCell>優先度</TableCell>
                <TableCell>期限</TableCell>
                <TableCell>関連</TableCell>
                <TableCell>信頼度</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {todoCandidates.map((candidate) => (
                <TableRow key={candidate.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedCandidates.includes(candidate.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCandidates([...selectedCandidates, candidate.id]);
                        } else {
                          setSelectedCandidates(selectedCandidates.filter(id => id !== candidate.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {candidate.text}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        優先度: {candidate.priority} | 信頼度: {(candidate.confidence * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={getPriorityDisplayName(candidate.priority as any)}
                      color={getPriorityColor(candidate.priority as any) as any}
                    />
                  </TableCell>
                  <TableCell>
                    {(candidate as any).dueDate ? (
                      <Box>
                        <Typography variant="body2">
                          {new Date((candidate as any).dueDate).toLocaleDateString('ja-JP')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date((candidate as any).dueDate).toLocaleTimeString('ja-JP', { 
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
                      {(candidate as any).companyId && (
                        <Chip size="small" icon={<Business />} label="企業" variant="outlined" />
                      )}
                      {(candidate as any).isInternal && (
                        <Chip size="small" label="内部" color="info" variant="outlined" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={`${Math.round(candidate.confidence * 100)}%`}
                      color={getConfidenceColor(candidate.confidence) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="詳細表示">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setPreviewDialogOpen(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="承認">
                        <IconButton 
                          size="small"
                          color="success"
                          onClick={() => handleApproveCandidate(candidate.id)}
                        >
                          <Check />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="拒否">
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => handleRejectCandidate(candidate.id)}
                        >
                          <Close />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* TODO候補詳細ダイアログ */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>TODO候補詳細</DialogTitle>
        <DialogContent>
          {selectedCandidate && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedCandidate.title}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">優先度</Typography>
                  <Typography variant="body1">{getPriorityDisplayName(selectedCandidate.priority)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">信頼度</Typography>
                  <Typography variant="body1">{Math.round(selectedCandidate.confidence * 100)}%</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">説明</Typography>
                  <Typography variant="body1">{selectedCandidate.description}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">期限</Typography>
                  <Typography variant="body1">
                    {selectedCandidate.dueDate 
                      ? new Date(selectedCandidate.dueDate).toLocaleString('ja-JP')
                      : '期限なし'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">見積時間</Typography>
                  <Typography variant="body1">{selectedCandidate.estimatedHours}時間</Typography>
                </Grid>
                {selectedCandidate.tags && selectedCandidate.tags.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">タグ</Typography>
                    <Box display="flex" gap={1} mt={1}>
                      {selectedCandidate.tags.map((tag: string) => (
                        <Chip key={tag} size="small" label={tag} variant="outlined" />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>閉じる</Button>
          <Button 
            color="error" 
            onClick={() => {
              if (selectedCandidate) {
                handleRejectCandidate(selectedCandidate.id);
                setPreviewDialogOpen(false);
              }
            }}
          >
            拒否
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (selectedCandidate) {
                handleApproveCandidate(selectedCandidate.id);
                setPreviewDialogOpen(false);
              }
            }}
          >
            承認してTODO作成
          </Button>
        </DialogActions>
      </Dialog>

      {/* 一括承認確認ダイアログ */}
      <Dialog open={batchApprovalOpen} onClose={() => setBatchApprovalOpen(false)}>
        <DialogTitle>一括承認の確認</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            選択した{selectedCandidates.length}件のTODO候補を一括で承認し、TODOとして登録しますか？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchApprovalOpen(false)}>
            キャンセル
          </Button>
          <Button variant="contained" onClick={handleBatchApproval}>
            {selectedCandidates.length}件を承認
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};