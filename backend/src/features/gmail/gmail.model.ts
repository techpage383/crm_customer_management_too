import { Pool } from 'pg';
import { 
  EmailThread, 
  EmailThreadCreate, 
  EmailThreadUpdate,
  EmailThreadSearchParams,
  EmailMessage,
  EmailMessageCreate,
  EmailMessageUpdate,
  GmailSyncStatus,
  SystemSettings,
  ID
} from '../../types/index.js';

export class GmailModel {
  private pool: Pool;
  
  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ========== データベーススキーマ初期化 ==========
  
  async createGmailTables(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. email_threads テーブル
      await client.query(`
        CREATE TABLE IF NOT EXISTS email_threads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          thread_gmail_id VARCHAR(255) UNIQUE NOT NULL,
          subject TEXT NOT NULL,
          snippet TEXT NOT NULL,
          company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
          last_message_date TIMESTAMP WITH TIME ZONE NOT NULL,
          message_count INTEGER NOT NULL DEFAULT 1,
          has_attachment BOOLEAN DEFAULT FALSE,
          is_read BOOLEAN DEFAULT FALSE,
          is_starred BOOLEAN DEFAULT FALSE,
          labels TEXT[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. email_messages テーブル
      await client.query(`
        CREATE TABLE IF NOT EXISTS email_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
          message_gmail_id VARCHAR(255) UNIQUE NOT NULL,
          from_address VARCHAR(255) NOT NULL,
          to_addresses TEXT[] NOT NULL,
          cc_addresses TEXT[] DEFAULT '{}',
          bcc_addresses TEXT[] DEFAULT '{}',
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          body_html TEXT,
          sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
          is_inbound BOOLEAN NOT NULL,
          has_attachment BOOLEAN DEFAULT FALSE,
          attachments JSONB DEFAULT '[]',
          ai_analysis JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. gmail_sync_status テーブル（ユーザーごとの同期状態）
      await client.query(`
        CREATE TABLE IF NOT EXISTS gmail_sync_status (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
          last_sync_at TIMESTAMP WITH TIME ZONE,
          next_sync_at TIMESTAMP WITH TIME ZONE,
          sync_history_token VARCHAR(255),
          error_message TEXT,
          error_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        );
      `);

      // 4. shared_gmail_accounts テーブル（共有Gmail設定）
      await client.query(`
        CREATE TABLE IF NOT EXISTS shared_gmail_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          display_name VARCHAR(255) NOT NULL,
          access_token TEXT NOT NULL, -- 暗号化保存予定
          refresh_token TEXT NOT NULL, -- 暗号化保存予定
          allowed_roles TEXT[] NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          sync_enabled BOOLEAN DEFAULT TRUE,
          last_sync_at TIMESTAMP WITH TIME ZONE,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // インデックス作成
      await client.query('CREATE INDEX IF NOT EXISTS idx_email_threads_user_id ON email_threads(user_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_email_threads_company_id ON email_threads(company_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_email_threads_gmail_id ON email_threads(thread_gmail_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_email_messages_thread_id ON email_messages(thread_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_email_messages_gmail_id ON email_messages(message_gmail_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_gmail_sync_status_user_id ON gmail_sync_status(user_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_shared_gmail_accounts_email ON shared_gmail_accounts(email);');

      await client.query('COMMIT');
      console.log('✅ Gmail関連テーブルの初期化が完了しました');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Gmail関連テーブルの初期化に失敗しました:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ========== EmailThread CRUD操作 ==========

  async createEmailThread(threadData: EmailThreadCreate): Promise<EmailThread> {
    const query = `
      INSERT INTO email_threads (
        user_id, thread_gmail_id, subject, snippet, company_id,
        last_message_date, message_count, has_attachment, is_read, is_starred, labels
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    
    const values = [
      threadData.userId,
      threadData.threadGmailId,
      threadData.subject,
      threadData.snippet,
      threadData.companyId || null,
      threadData.lastMessageDate,
      threadData.messageCount,
      threadData.hasAttachment || false,
      threadData.isRead || false,
      threadData.isStarred || false,
      threadData.labels || []
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToEmailThread(result.rows[0]);
  }

  async getEmailThreadById(threadId: ID): Promise<EmailThread | null> {
    const query = `
      SELECT et.*, 
             u.email as user_email, u.full_name as user_name,
             c.name as company_name
      FROM email_threads et
      LEFT JOIN users u ON et.user_id = u.id
      LEFT JOIN companies c ON et.company_id = c.id
      WHERE et.id = $1;
    `;
    
    const result = await this.pool.query(query, [threadId]);
    return result.rows.length > 0 ? this.mapRowToEmailThread(result.rows[0]) : null;
  }

  async getEmailThreadsByUserId(
    userId: ID, 
    options: { 
      page?: number; 
      limit?: number; 
      companyId?: ID;
      isRead?: boolean;
    } = {}
  ): Promise<{ threads: EmailThread[]; totalCount: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions = ['et.user_id = $1'];
    let params: any[] = [userId];
    let paramIndex = 2;

    if (options.companyId) {
      whereConditions.push(`et.company_id = $${paramIndex}`);
      params.push(options.companyId);
      paramIndex++;
    }

    if (options.isRead !== undefined) {
      whereConditions.push(`et.is_read = $${paramIndex}`);
      params.push(options.isRead);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // カウント取得
    const countQuery = `
      SELECT COUNT(*) as total
      FROM email_threads et
      WHERE ${whereClause};
    `;
    const countResult = await this.pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].total);

    // データ取得
    const dataQuery = `
      SELECT et.*, 
             u.email as user_email, u.full_name as user_name,
             c.name as company_name
      FROM email_threads et
      LEFT JOIN users u ON et.user_id = u.id
      LEFT JOIN companies c ON et.company_id = c.id
      WHERE ${whereClause}
      ORDER BY et.last_message_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    
    params.push(limit, offset);
    const dataResult = await this.pool.query(dataQuery, params);
    
    const threads = dataResult.rows.map(row => this.mapRowToEmailThread(row));

    return { threads, totalCount };
  }

  // P-003: Gmail高度検索機能
  async searchEmailThreads(
    userId: ID, 
    searchParams: EmailThreadSearchParams
  ): Promise<{ threads: EmailThread[]; totalCount: number }> {
    const page = searchParams.page || 1;
    const limit = searchParams.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions = ['et.user_id = $1'];
    let params: any[] = [userId];
    let paramIndex = 2;

    // 企業フィルタ
    if (searchParams.companyId) {
      whereConditions.push(`et.company_id = $${paramIndex}`);
      params.push(searchParams.companyId);
      paramIndex++;
    }

    // 既読フィルタ
    if (searchParams.isRead !== undefined) {
      whereConditions.push(`et.is_read = $${paramIndex}`);
      params.push(searchParams.isRead);
      paramIndex++;
    }

    // 日付範囲フィルタ
    if (searchParams.dateFrom) {
      whereConditions.push(`et.received_at >= $${paramIndex}`);
      params.push(searchParams.dateFrom);
      paramIndex++;
    }

    if (searchParams.dateTo) {
      whereConditions.push(`et.received_at <= $${paramIndex}`);
      params.push(searchParams.dateTo);
      paramIndex++;
    }

    // 件名検索
    if (searchParams.subject) {
      whereConditions.push(`et.subject ILIKE $${paramIndex}`);
      params.push(`%${searchParams.subject}%`);
      paramIndex++;
    }

    // 送信者検索（メッセージテーブルをJOIN）
    let joinClause = '';
    if (searchParams.sender) {
      joinClause = 'LEFT JOIN email_messages em ON et.id = em.thread_id';
      whereConditions.push(`em.from ILIKE $${paramIndex}`);
      params.push(`%${searchParams.sender}%`);
      paramIndex++;
    }

    // 添付ファイル有無フィルタ
    if (searchParams.hasAttachments !== undefined) {
      if (!joinClause) {
        joinClause = 'LEFT JOIN email_messages em ON et.id = em.thread_id';
      }
      if (searchParams.hasAttachments) {
        whereConditions.push('em.has_attachment = true');
      } else {
        whereConditions.push('(em.has_attachment = false OR em.has_attachment IS NULL)');
      }
    }

    // ラベルフィルタ
    if (searchParams.labels && searchParams.labels.length > 0) {
      const labelsArray = searchParams.labels.map((_, index) => `$${paramIndex + index}`).join(', ');
      whereConditions.push(`et.labels && ARRAY[${labelsArray}]`);
      params.push(...searchParams.labels);
      paramIndex += searchParams.labels.length;
    }

    const whereClause = whereConditions.join(' AND ');

    // ソート順設定
    const sortBy = searchParams.sortBy || 'receivedAt';
    const sortOrder = searchParams.sortOrder || 'desc';
    const dbSortField = this.mapSortFieldToDb(sortBy);
    const orderClause = `ORDER BY ${dbSortField} ${sortOrder.toUpperCase()}`;

    // カウント取得
    const countQuery = `
      SELECT COUNT(DISTINCT et.id) as total
      FROM email_threads et
      ${joinClause}
      WHERE ${whereClause};
    `;
    const countResult = await this.pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].total);

    // データ取得
    const dataQuery = `
      SELECT DISTINCT et.*, 
             u.email as user_email, u.full_name as user_name,
             c.name as company_name
      FROM email_threads et
      ${joinClause}
      LEFT JOIN users u ON et.user_id = u.id
      LEFT JOIN companies c ON et.company_id = c.id
      WHERE ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    
    params.push(limit, offset);
    const dataResult = await this.pool.query(dataQuery, params);
    
    const threads = dataResult.rows.map(row => this.mapRowToEmailThread(row));

    return { threads, totalCount };
  }

  // ソートフィールドをDBカラム名にマッピング
  private mapSortFieldToDb(sortBy: string): string {
    const mapping: { [key: string]: string } = {
      'receivedAt': 'et.received_at',
      'subject': 'et.subject',
      'sender': 'et.snippet',  // 送信者直接ソート不可の場合はsnippetで代用
      'createdAt': 'et.created_at'
    };
    return mapping[sortBy] || 'et.received_at';
  }

  async updateEmailThread(threadId: ID, updates: EmailThreadUpdate): Promise<EmailThread | null> {
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = this.camelToSnake(key);
        updateFields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return this.getEmailThreadById(threadId);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(threadId);

    const query = `
      UPDATE email_threads 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? this.mapRowToEmailThread(result.rows[0]) : null;
  }

  // ========== EmailMessage CRUD操作 ==========

  async createEmailMessage(messageData: EmailMessageCreate): Promise<EmailMessage> {
    const query = `
      INSERT INTO email_messages (
        thread_id, message_gmail_id, from_address, to_addresses, cc_addresses, bcc_addresses,
        subject, body, body_html, sent_at, is_inbound, has_attachment, attachments, ai_analysis
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;
    
    const values = [
      messageData.threadId,
      messageData.messageGmailId,
      messageData.from,
      messageData.to,
      messageData.cc || [],
      messageData.bcc || [],
      messageData.subject,
      messageData.body,
      messageData.bodyHtml || null,
      messageData.sentAt,
      messageData.isInbound,
      messageData.hasAttachment || false,
      JSON.stringify(messageData.attachments || []),
      messageData.aiAnalysis ? JSON.stringify(messageData.aiAnalysis) : null
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToEmailMessage(result.rows[0]);
  }

  async getMessagesByThreadId(threadId: ID): Promise<EmailMessage[]> {
    const query = `
      SELECT * FROM email_messages 
      WHERE thread_id = $1 
      ORDER BY sent_at ASC;
    `;
    
    const result = await this.pool.query(query, [threadId]);
    return result.rows.map(row => this.mapRowToEmailMessage(row));
  }

  // ========== Gmail同期状態管理 ==========

  async getGmailSyncStatus(userId: ID): Promise<{
    userId: ID;
    status: GmailSyncStatus;
    lastSyncAt?: Date;
    nextSyncAt?: Date;
    errorMessage?: string;
    errorCount: number;
  } | null> {
    const query = `
      SELECT * FROM gmail_sync_status WHERE user_id = $1;
    `;
    
    const result = await this.pool.query(query, [userId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      userId: row.user_id,
      status: row.status as GmailSyncStatus,
      lastSyncAt: row.last_sync_at,
      nextSyncAt: row.next_sync_at,
      errorMessage: row.error_message,
      errorCount: row.error_count
    };
  }

  async upsertGmailSyncStatus(
    userId: ID, 
    status: GmailSyncStatus, 
    options: {
      lastSyncAt?: Date;
      nextSyncAt?: Date;
      historyToken?: string;
      errorMessage?: string;
      incrementErrorCount?: boolean;
    } = {}
  ): Promise<void> {
    const query = `
      INSERT INTO gmail_sync_status (
        user_id, status, last_sync_at, next_sync_at, sync_history_token, error_message, error_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        status = $2,
        last_sync_at = COALESCE($3, gmail_sync_status.last_sync_at),
        next_sync_at = COALESCE($4, gmail_sync_status.next_sync_at),
        sync_history_token = COALESCE($5, gmail_sync_status.sync_history_token),
        error_message = $6,
        error_count = CASE 
          WHEN $8 THEN gmail_sync_status.error_count + 1 
          ELSE COALESCE($7, 0) 
        END,
        updated_at = CURRENT_TIMESTAMP;
    `;

    const values = [
      userId,
      status,
      options.lastSyncAt || null,
      options.nextSyncAt || null,
      options.historyToken || null,
      options.errorMessage || null,
      options.incrementErrorCount ? null : 0,
      options.incrementErrorCount || false
    ];

    await this.pool.query(query, values);
  }

  // ========== 共有Gmail設定管理 ==========

  async getSharedGmailAccounts(): Promise<Array<{
    id: ID;
    email: string;
    displayName: string;
    allowedRoles: string[];
    isActive: boolean;
    syncEnabled: boolean;
    lastSyncAt?: Date;
    createdBy?: ID;
    createdAt: Date;
  }>> {
    const query = `
      SELECT id, email, display_name, allowed_roles, is_active, sync_enabled, 
             last_sync_at, created_by, created_at
      FROM shared_gmail_accounts 
      ORDER BY created_at DESC;
    `;
    
    const result = await this.pool.query(query);
    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      allowedRoles: row.allowed_roles,
      isActive: row.is_active,
      syncEnabled: row.sync_enabled,
      lastSyncAt: row.last_sync_at,
      createdBy: row.created_by,
      createdAt: row.created_at
    }));
  }

  async createSharedGmailAccount(accountData: {
    email: string;
    displayName: string;
    accessToken: string;
    refreshToken: string;
    allowedRoles: string[];
    createdBy: ID;
  }): Promise<ID> {
    const query = `
      INSERT INTO shared_gmail_accounts (
        email, display_name, access_token, refresh_token, allowed_roles, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;
    
    const values = [
      accountData.email,
      accountData.displayName,
      accountData.accessToken,
      accountData.refreshToken,
      accountData.allowedRoles,
      accountData.createdBy
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0].id;
  }

  async updateSharedGmailAccount(
    accountId: ID, 
    updates: {
      displayName?: string;
      allowedRoles?: string[];
      isActive?: boolean;
      syncEnabled?: boolean;
    }
  ): Promise<boolean> {
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = this.camelToSnake(key);
        updateFields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) return false;

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(accountId);

    const query = `
      UPDATE shared_gmail_accounts 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex};
    `;

    const result = await this.pool.query(query, values);
    return result.rowCount > 0;
  }

  async deleteSharedGmailAccount(accountId: ID): Promise<boolean> {
    const query = 'DELETE FROM shared_gmail_accounts WHERE id = $1;';
    const result = await this.pool.query(query, [accountId]);
    return result.rowCount > 0;
  }

  // ========== ユーティリティメソッド ==========

  private mapRowToEmailThread(row: any): EmailThread {
    return {
      id: row.id,
      threadGmailId: row.thread_gmail_id,
      subject: row.subject,
      snippet: row.snippet,
      companyId: row.company_id,
      lastMessageDate: row.last_message_date,
      messageCount: row.message_count,
      hasAttachment: row.has_attachment,
      isRead: row.is_read,
      isStarred: row.is_starred,
      labels: row.labels,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Relations (if joined)
      user: row.user_email ? {
        id: row.user_id,
        email: row.user_email,
        fullName: row.user_name
      } : undefined,
      company: row.company_name ? {
        id: row.company_id,
        name: row.company_name
      } : undefined
    };
  }

  private mapRowToEmailMessage(row: any): EmailMessage {
    return {
      id: row.id,
      threadId: row.thread_id,
      messageGmailId: row.message_gmail_id,
      from: row.from_address,
      to: row.to_addresses,
      cc: row.cc_addresses,
      bcc: row.bcc_addresses,
      subject: row.subject,
      body: row.body,
      bodyHtml: row.body_html,
      sentAt: row.sent_at,
      isInbound: row.is_inbound,
      hasAttachment: row.has_attachment,
      attachments: typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments,
      aiAnalysis: row.ai_analysis ? (typeof row.ai_analysis === 'string' ? JSON.parse(row.ai_analysis) : row.ai_analysis) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // ========== データクリーンアップ ==========

  async cleanupOldEmailData(daysToKeep: number = 90): Promise<{ deletedThreads: number; deletedMessages: number }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 古いメッセージを削除
      const deleteMessagesQuery = `
        DELETE FROM email_messages 
        WHERE created_at < NOW() - INTERVAL '${daysToKeep} days';
      `;
      const messagesResult = await client.query(deleteMessagesQuery);

      // メッセージがないスレッドを削除
      const deleteThreadsQuery = `
        DELETE FROM email_threads 
        WHERE id NOT IN (SELECT DISTINCT thread_id FROM email_messages);
      `;
      const threadsResult = await client.query(deleteThreadsQuery);

      await client.query('COMMIT');

      return {
        deletedThreads: threadsResult.rowCount,
        deletedMessages: messagesResult.rowCount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}