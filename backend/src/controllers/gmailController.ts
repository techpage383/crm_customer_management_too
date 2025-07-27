import { Response } from 'express';
import { google } from 'googleapis';
import { db } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { GmailSyncRequest } from '../types';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const getAuthUrl = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Get auth URL error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const handleCallback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.query;
    const userId = req.user!.id;

    if (!code) {
      res.status(400).json({ error: '認証コードが必要です' });
      return;
    }

    const { tokens } = await oauth2Client.getToken(code as string);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      res.status(400).json({ error: 'トークンの取得に失敗しました' });
      return;
    }

    await db.query(
      'UPDATE users SET google_access_token = $1, google_refresh_token = $2 WHERE id = $3',
      [tokens.access_token, tokens.refresh_token, userId]
    );

    res.json({ message: 'Gmail連携が完了しました' });
  } catch (error) {
    console.error('Handle callback error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const syncMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { customerId, maxResults = 50 }: GmailSyncRequest = req.body;

    const userResult = await db.query(
      'SELECT google_access_token, google_refresh_token FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].google_access_token) {
      res.status(400).json({ error: 'Gmail連携が必要です' });
      return;
    }

    const user = userResult.rows[0];
    oauth2Client.setCredentials({
      access_token: user.google_access_token,
      refresh_token: user.google_refresh_token,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    let customerEmails: string[] = [];
    if (customerId) {
      const customerResult = await db.query(
        'SELECT email FROM customers WHERE id = $1 AND user_id = $2',
        [customerId, userId]
      );
      
      if (customerResult.rows.length === 0) {
        res.status(404).json({ error: '顧客が見つかりません' });
        return;
      }
      
      customerEmails = [customerResult.rows[0].email];
    } else {
      const customersResult = await db.query(
        'SELECT email FROM customers WHERE user_id = $1',
        [userId]
      );
      customerEmails = customersResult.rows.map(row => row.email);
    }

    let syncedCount = 0;

    for (const customerEmail of customerEmails) {
      try {
        const query = `from:${customerEmail} OR to:${customerEmail}`;
        
        const messagesResponse = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults,
        });

        if (!messagesResponse.data.messages) continue;

        for (const message of messagesResponse.data.messages) {
          try {
            const fullMessage = await gmail.users.messages.get({
              userId: 'me',
              id: message.id!,
            });

            const headers = fullMessage.data.payload?.headers || [];
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
            const from = headers.find((h: any) => h.name === 'From')?.value || '';
            const to = headers.find((h: any) => h.name === 'To')?.value || '';
            const date = new Date(parseInt(fullMessage.data.internalDate || '0'));

            const existingMessage = await db.query(
              'SELECT id FROM email_messages WHERE gmail_id = $1',
              [message.id]
            );

            if (existingMessage.rows.length === 0) {
              const customerResult = await db.query(
                'SELECT id FROM customers WHERE email = $1 AND user_id = $2',
                [customerEmail, userId]
              );

              if (customerResult.rows.length > 0) {
                await db.query(
                  `INSERT INTO email_messages 
                   (gmail_id, customer_id, subject, snippet, from_email, to_email, date, thread_id) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                  [
                    message.id,
                    customerResult.rows[0].id,
                    subject,
                    fullMessage.data.snippet || '',
                    from,
                    to,
                    date,
                    fullMessage.data.threadId,
                  ]
                );
                syncedCount++;
              }
            }
          } catch (messageError) {
            console.error('Message processing error:', messageError);
          }
        }
      } catch (customerError) {
        console.error(`Customer ${customerEmail} sync error:`, customerError);
      }
    }

    res.json({ 
      message: '同期が完了しました',
      syncedCount 
    });
  } catch (error) {
    console.error('Sync messages error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getCustomerMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { customerId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const customerCheck = await db.query(
      'SELECT id FROM customers WHERE id = $1 AND user_id = $2',
      [customerId, userId]
    );

    if (customerCheck.rows.length === 0) {
      res.status(404).json({ error: '顧客が見つかりません' });
      return;
    }

    const messagesResult = await db.query(
      `SELECT * FROM email_messages 
       WHERE customer_id = $1 
       ORDER BY date DESC 
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM email_messages WHERE customer_id = $1',
      [customerId]
    );

    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: messagesResult.rows,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('Get customer messages error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};