import { Response } from 'express';
import { db } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { 
  CreateCustomerRequest, 
  UpdateCustomerRequest, 
  SearchCustomersRequest,
  PaginatedResponse,
  Customer,
  CustomerStatus 
} from '../types';

export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { 
      name, 
      company, 
      email, 
      phone, 
      address, 
      industry, 
      status = CustomerStatus.PROSPECT, 
      notes 
    }: CreateCustomerRequest = req.body;

    if (!name || !email) {
      res.status(400).json({ error: '名前とメールアドレスは必須です' });
      return;
    }

    const existingCustomer = await db.query(
      'SELECT id FROM customers WHERE email = $1 AND user_id = $2',
      [email, userId]
    );

    if (existingCustomer.rows.length > 0) {
      res.status(400).json({ error: '同じメールアドレスの顧客が既に存在します' });
      return;
    }

    const result = await db.query(
      `INSERT INTO customers (name, company, email, phone, address, industry, status, notes, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [name, company, email, phone, address, industry, status, notes, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { 
      query, 
      status, 
      industry, 
      page = 1, 
      limit = 20 
    }: SearchCustomersRequest = req.query as any;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE user_id = $1';
    const queryParams: any[] = [userId];
    let paramCount = 1;

    if (query) {
      paramCount++;
      whereClause += ` AND (name ILIKE $${paramCount} OR company ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      queryParams.push(`%${query}%`);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      queryParams.push(status);
    }

    if (industry) {
      paramCount++;
      whereClause += ` AND industry = $${paramCount}`;
      queryParams.push(industry);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM customers ${whereClause}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].count);

    const customersResult = await db.query(
      `SELECT * FROM customers ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    const response: PaginatedResponse<Customer> = {
      data: customersResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };

    res.json(response);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM customers WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: '顧客が見つかりません' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get customer by ID error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updateData: UpdateCustomerRequest = req.body;

    const existingCustomer = await db.query(
      'SELECT id FROM customers WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingCustomer.rows.length === 0) {
      res.status(404).json({ error: '顧客が見つかりません' });
      return;
    }

    if (updateData.email) {
      const emailCheck = await db.query(
        'SELECT id FROM customers WHERE email = $1 AND user_id = $2 AND id != $3',
        [updateData.email, userId, id]
      );

      if (emailCheck.rows.length > 0) {
        res.status(400).json({ error: '同じメールアドレスの顧客が既に存在します' });
        return;
      }
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      res.status(400).json({ error: '更新するデータがありません' });
      return;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id, userId);

    const result = await db.query(
      `UPDATE customers SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount + 1} AND user_id = $${paramCount + 2} 
       RETURNING *`,
      updateValues
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM customers WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: '顧客が見つかりません' });
      return;
    }

    res.json({ message: '顧客を削除しました' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};