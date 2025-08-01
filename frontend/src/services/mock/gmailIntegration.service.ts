// Gmail Integration Mock Service
export const mockGmailIntegrationService = {
  getGmailSettings: async () => {
    return {
      isConnected: false,
      email: null,
      lastSync: null
    };
  },

  connectGmail: async () => {
    return {
      success: true,
      message: 'Gmail接続が完了しました'
    };
  },

  disconnectGmail: async () => {
    return {
      success: true,
      message: 'Gmail接続を解除しました'
    };
  },

  syncEmails: async () => {
    return {
      success: true,
      syncedCount: 0,
      message: '同期が完了しました'
    };
  },

  searchEmailThreads: async (filters?: any) => {
    return {
      success: true,
      data: {
        threads: [],
        totalCount: 0,
        hasMore: false
      }
    };
  },

  getGmailStats: async () => {
    return {
      success: true,
      data: {
        totalEmails: 0,
        unreadCount: 0,
        todayEmails: 0,
        syncedEmails: 0
      }
    };
  },

  getEmailLabels: async () => {
    return {
      success: true,
      data: ['受信トレイ', '送信済み', '下書き']
    };
  },

  updateThreadStarStatus: async (threadId: string, isStarred: boolean) => {
    return {
      success: true,
      message: `スター${isStarred ? '追加' : '削除'}が完了しました`
    };
  },

  updateThreadReadStatus: async (threadId: string, isRead: boolean) => {
    return {
      success: true,
      message: `既読状態の${isRead ? '設定' : '解除'}が完了しました`
    };
  },

  markThreadsAsRead: async (threadIds: string[]) => {
    return {
      success: true,
      message: `${threadIds.length}件のスレッドを既読にしました`
    };
  }
};