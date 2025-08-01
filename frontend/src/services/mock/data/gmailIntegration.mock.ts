// Gmail Integration Mock Data
export const mockGmailSettings = {
  isConnected: false,
  email: null,
  lastSync: null,
  autoSync: false,
  syncInterval: 30 // minutes
};

export const mockGmailEmails = [
  {
    id: '1',
    subject: 'サンプルメール1',
    from: 'example1@example.com',
    date: '2024-01-15T10:00:00Z',
    body: 'これはサンプルメールの内容です。',
    isRead: false
  },
  {
    id: '2',
    subject: 'サンプルメール2',
    from: 'example2@example.com',
    date: '2024-01-14T15:30:00Z',
    body: 'もう一つのサンプルメールです。',
    isRead: true
  }
];

export const MOCK_AI_TODO_CANDIDATES = [
  {
    id: '1',
    text: 'プロジェクトミーティングの準備',
    priority: 'high',
    source: 'email',
    confidence: 0.95
  },
  {
    id: '2',
    text: '資料の確認',
    priority: 'medium',
    source: 'email',
    confidence: 0.8
  }
];