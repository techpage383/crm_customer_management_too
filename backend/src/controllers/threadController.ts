import { Response } from 'express';
import { db } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { 
  EmailThread, 
  ThreadStatus, 
  ThreadPriority,
  PaginatedResponse 
} from '../types';

export const getThreads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { 
      customerId, 
      status, 
      priority, 
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereClause = `WHERE c.user_id = $1`;
    const queryParams: any[] = [userId];
    let paramCount = 1;

    if (customerId) {
      paramCount++;
      whereClause += ` AND et.customer_id = $${paramCount}`;
      queryParams.push(customerId);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND et.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (priority) {
      paramCount++;
      whereClause += ` AND et.priority = $${paramCount}`;
      queryParams.push(priority);
    }

    // スレッド一覧取得（顧客情報も含める）
    const threadsResult = await db.query(
      `SELECT 
         et.*,
         c.name as customer_name,
         c.company as customer_company,
         c.email as customer_email
       FROM email_threads et
       JOIN customers c ON et.customer_id = c.id
       ${whereClause}
       ORDER BY et.last_message_date DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    // 総数取得
    const countResult = await db.query(
      `SELECT COUNT(*) 
       FROM email_threads et
       JOIN customers c ON et.customer_id = c.id
       ${whereClause}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].count);

    const response: PaginatedResponse<EmailThread & { customerName: string; customerCompany?: string; customerEmail: string }> = {
      data: threadsResult.rows.map(row => ({
        id: row.id,
        threadId: row.thread_id,
        customerId: row.customer_id,
        subject: row.subject,
        participants: row.participants,
        messageCount: row.message_count,
        lastMessageDate: new Date(row.last_message_date),
        isRead: row.is_read,
        hasAttachments: row.has_attachments,
        tags: row.tags || [],
        priority: row.priority as ThreadPriority,
        status: row.status as ThreadStatus,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        customerName: row.customer_name,
        customerCompany: row.customer_company,
        customerEmail: row.customer_email,
      })),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };

    res.json(response);
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getThreadById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { threadId } = req.params;

    // スレッド情報取得
    const threadResult = await db.query(
      `SELECT 
         et.*,
         c.name as customer_name,
         c.company as customer_company,
         c.email as customer_email
       FROM email_threads et
       JOIN customers c ON et.customer_id = c.id
       WHERE et.id = $1 AND c.user_id = $2`,
      [threadId, userId]
    );

    if (threadResult.rows.length === 0) {
      res.status(404).json({ error: 'スレッドが見つかりません' });
      return;
    }

    const thread = threadResult.rows[0];

    // スレッド内のメッセージ取得
    const messagesResult = await db.query(
      `SELECT * FROM email_messages 
       WHERE thread_table_id = $1 
       ORDER BY date ASC`,
      [threadId]
    );

    // 添付ファイル取得
    const attachmentsResult = await db.query(
      `SELECT ea.* FROM email_attachments ea
       JOIN email_messages em ON ea.email_message_id = em.id
       WHERE em.thread_table_id = $1`,
      [threadId]
    );

    const response = {
      id: thread.id,
      threadId: thread.thread_id,
      customerId: thread.customer_id,
      subject: thread.subject,
      participants: thread.participants,
      messageCount: thread.message_count,
      lastMessageDate: new Date(thread.last_message_date),
      isRead: thread.is_read,
      hasAttachments: thread.has_attachments,
      tags: thread.tags || [],
      priority: thread.priority as ThreadPriority,
      status: thread.status as ThreadStatus,
      createdAt: new Date(thread.created_at),
      updatedAt: new Date(thread.updated_at),
      customer: {
        name: thread.customer_name,
        company: thread.customer_company,
        email: thread.customer_email,
      },
      messages: messagesResult.rows,
      attachments: attachmentsResult.rows,
    };

    res.json(response);
  } catch (error) {
    console.error('Get thread by ID error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const updateThreadStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { threadId } = req.params;
    const { status, priority, tags, isRead } = req.body;

    // 権限チェック
    const threadCheck = await db.query(
      `SELECT et.id FROM email_threads et
       JOIN customers c ON et.customer_id = c.id
       WHERE et.id = $1 AND c.user_id = $2`,
      [threadId, userId]
    );

    if (threadCheck.rows.length === 0) {
      res.status(404).json({ error: 'スレッドが見つかりません' });
      return;
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (status !== undefined) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(status);
    }

    if (priority !== undefined) {
      paramCount++;
      updateFields.push(`priority = $${paramCount}`);
      updateValues.push(priority);
    }

    if (tags !== undefined) {
      paramCount++;
      updateFields.push(`tags = $${paramCount}`);
      updateValues.push(tags);
    }

    if (isRead !== undefined) {
      paramCount++;
      updateFields.push(`is_read = $${paramCount}`);
      updateValues.push(isRead);
    }

    if (updateFields.length === 0) {
      res.status(400).json({ error: '更新するデータがありません' });
      return;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(threadId);

    const result = await db.query(
      `UPDATE email_threads SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount + 1} 
       RETURNING *`,
      updateValues
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update thread status error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getPendingReplies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // 返信待ちスレッド取得
    const threadsResult = await db.query(
      `SELECT 
         et.*,
         c.name as customer_name,
         c.company as customer_company,
         c.email as customer_email,
         (et.last_message_date < NOW() - INTERVAL '24 hours') as is_overdue
       FROM email_threads et
       JOIN customers c ON et.customer_id = c.id
       WHERE c.user_id = $1 AND et.status = 'PENDING_REPLY'
       ORDER BY et.priority DESC, et.last_message_date ASC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) 
       FROM email_threads et
       JOIN customers c ON et.customer_id = c.id
       WHERE c.user_id = $1 AND et.status = 'PENDING_REPLY'`,
      [userId]
    );

    const total = parseInt(countResult.rows[0].count);

    const response: PaginatedResponse<any> = {
      data: threadsResult.rows.map(row => ({
        id: row.id,
        threadId: row.thread_id,
        customerId: row.customer_id,
        subject: row.subject,
        lastMessageDate: new Date(row.last_message_date),
        priority: row.priority,
        isOverdue: row.is_overdue,
        customer: {
          name: row.customer_name,
          company: row.customer_company,
          email: row.customer_email,
        },
      })),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };

    res.json(response);
  } catch (error) {
    console.error('Get pending replies error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};