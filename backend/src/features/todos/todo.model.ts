/**
 * TODOデータモデル層
 * DB-TDD アプローチ - 実データベース直接操作
 * ★8 バックエンド実装エージェント担当
 */

import { pool } from '../../config/database';
import { Todo, TodoCreate, TodoUpdate, TodoStatus, TodoPriority, TodoSource } from '../../types/index.js';

export class TodoModel {
  /**
   * TODOテーブル作成スキーマ
   */
  static async createTodoTableSchema(): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS todos (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          priority VARCHAR(50) NOT NULL DEFAULT 'medium',
          due_date TIMESTAMP,
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          primary_assignee_id UUID NOT NULL REFERENCES users(id),
          source VARCHAR(50) NOT NULL,
          source_reference JSONB,
          is_internal BOOLEAN DEFAULT false,
          is_approved BOOLEAN DEFAULT false,
          approved_by UUID REFERENCES users(id),
          approved_at TIMESTAMP,
          completed_at TIMESTAMP,
          tags TEXT[],
          estimated_hours DECIMAL(5,2),
          actual_hours DECIMAL(5,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
          CONSTRAINT valid_priority CHECK (priority IN ('high', 'medium', 'low')),
          CONSTRAINT valid_source CHECK (source IN ('manual', 'ai_extracted', 'email_follow_up', 'email_forwarded', 'internal_request'))
        );

        CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
        CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
        CREATE INDEX IF NOT EXISTS idx_todos_company_id ON todos(company_id);
        CREATE INDEX IF NOT EXISTS idx_todos_primary_assignee_id ON todos(primary_assignee_id);
        CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
        CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
        CREATE INDEX IF NOT EXISTS idx_todos_tags ON todos USING GIN(tags);
      `);
      console.log('✅ TODOテーブルスキーマ作成完了');
    } finally {
      client.release();
    }
  }

  /**
   * TODO作成
   */
  static async create(data: TodoCreate): Promise<Todo> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO todos (
          title, description, status, priority, due_date,
          company_id, primary_assignee_id, source, source_reference,
          is_internal, is_approved, approved_by, approved_at,
          tags, estimated_hours
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          data.title,
          data.description || null,
          data.status,
          data.priority,
          data.dueDate || null,
          data.companyId || null,
          data.primaryAssigneeId,
          data.source,
          data.sourceReference ? JSON.stringify(data.sourceReference) : null,
          data.isInternal || false,
          data.isApproved || false,
          data.approvedBy || null,
          data.approvedAt || null,
          data.tags || [],
          data.estimatedHours || null
        ]
      );

      return this.rowToTodo(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * TODO取得（ID指定）
   */
  static async findById(id: string): Promise<Todo | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT t.*, 
          u.id as assignee_id, u.email as assignee_email, u.full_name as assignee_name,
          c.id as company_id, c.name as company_name,
          a.id as approver_id, a.email as approver_email, a.full_name as approver_name
        FROM todos t
        LEFT JOIN users u ON t.primary_assignee_id = u.id
        LEFT JOIN companies c ON t.company_id = c.id
        LEFT JOIN users a ON t.approved_by = a.id
        WHERE t.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.rowToTodoWithRelations(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * TODO検索（複合条件）
   */
  static async search(params: {
    query?: string;
    status?: TodoStatus | TodoStatus[];
    priority?: TodoPriority | TodoPriority[];
    assigneeId?: string;
    companyId?: string;
    isInternal?: boolean;
    isApproved?: boolean;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    tags?: string[];
    source?: TodoSource | TodoSource[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ todos: Todo[]; total: number }> {
    const client = await pool.connect();
    try {
      let query = `
        SELECT t.*, 
          u.id as assignee_id, u.email as assignee_email, u.full_name as assignee_name,
          c.id as company_id, c.name as company_name,
          a.id as approver_id, a.email as approver_email, a.full_name as approver_name
        FROM todos t
        LEFT JOIN users u ON t.primary_assignee_id = u.id
        LEFT JOIN companies c ON t.company_id = c.id
        LEFT JOIN users a ON t.approved_by = a.id
        WHERE 1=1
      `;

      let countQuery = `SELECT COUNT(*) FROM todos t WHERE 1=1`;
      const queryParams: any[] = [];
      let paramIndex = 1;

      // テキスト検索
      if (params.query) {
        query += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
        countQuery += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
        queryParams.push(`%${params.query}%`);
        paramIndex++;
      }

      // ステータスフィルタ
      if (params.status) {
        const statuses = Array.isArray(params.status) ? params.status : [params.status];
        query += ` AND t.status = ANY($${paramIndex})`;
        countQuery += ` AND t.status = ANY($${paramIndex})`;
        queryParams.push(statuses);
        paramIndex++;
      }

      // 優先度フィルタ
      if (params.priority) {
        const priorities = Array.isArray(params.priority) ? params.priority : [params.priority];
        query += ` AND t.priority = ANY($${paramIndex})`;
        countQuery += ` AND t.priority = ANY($${paramIndex})`;
        queryParams.push(priorities);
        paramIndex++;
      }

      // 担当者フィルタ
      if (params.assigneeId) {
        query += ` AND t.primary_assignee_id = $${paramIndex}`;
        countQuery += ` AND t.primary_assignee_id = $${paramIndex}`;
        queryParams.push(params.assigneeId);
        paramIndex++;
      }

      // 企業フィルタ
      if (params.companyId) {
        query += ` AND t.company_id = $${paramIndex}`;
        countQuery += ` AND t.company_id = $${paramIndex}`;
        queryParams.push(params.companyId);
        paramIndex++;
      }

      // 内部タスクフィルタ
      if (params.isInternal !== undefined) {
        query += ` AND t.is_internal = $${paramIndex}`;
        countQuery += ` AND t.is_internal = $${paramIndex}`;
        queryParams.push(params.isInternal);
        paramIndex++;
      }

      // 承認済みフィルタ
      if (params.isApproved !== undefined) {
        query += ` AND t.is_approved = $${paramIndex}`;
        countQuery += ` AND t.is_approved = $${paramIndex}`;
        queryParams.push(params.isApproved);
        paramIndex++;
      }

      // 期限日範囲フィルタ
      if (params.dueDateFrom) {
        query += ` AND t.due_date >= $${paramIndex}`;
        countQuery += ` AND t.due_date >= $${paramIndex}`;
        queryParams.push(params.dueDateFrom);
        paramIndex++;
      }

      if (params.dueDateTo) {
        query += ` AND t.due_date <= $${paramIndex}`;
        countQuery += ` AND t.due_date <= $${paramIndex}`;
        queryParams.push(params.dueDateTo);
        paramIndex++;
      }

      // タグフィルタ
      if (params.tags && params.tags.length > 0) {
        query += ` AND t.tags && $${paramIndex}`;
        countQuery += ` AND t.tags && $${paramIndex}`;
        queryParams.push(params.tags);
        paramIndex++;
      }

      // ソースフィルタ
      if (params.source) {
        const sources = Array.isArray(params.source) ? params.source : [params.source];
        query += ` AND t.source = ANY($${paramIndex})`;
        countQuery += ` AND t.source = ANY($${paramIndex})`;
        queryParams.push(sources);
        paramIndex++;
      }

      // カウント取得
      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].count);

      // ソート
      const sortBy = params.sortBy || 'created_at';
      const sortOrder = params.sortOrder || 'desc';
      query += ` ORDER BY t.${sortBy} ${sortOrder}`;

      // ページネーション
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      // データ取得
      const result = await client.query(query, queryParams);
      const todos = result.rows.map(row => this.rowToTodoWithRelations(row));

      return { todos, total };
    } finally {
      client.release();
    }
  }

  /**
   * TODO更新
   */
  static async update(id: string, data: TodoUpdate): Promise<Todo | null> {
    const client = await pool.connect();
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      // 更新フィールドの動的構築
      const fieldMap: { [key: string]: string } = {
        title: 'title',
        description: 'description',
        status: 'status',
        priority: 'priority',
        dueDate: 'due_date',
        companyId: 'company_id',
        primaryAssigneeId: 'primary_assignee_id',
        source: 'source',
        sourceReference: 'source_reference',
        isInternal: 'is_internal',
        isApproved: 'is_approved',
        approvedBy: 'approved_by',
        approvedAt: 'approved_at',
        completedAt: 'completed_at',
        tags: 'tags',
        estimatedHours: 'estimated_hours',
        actualHours: 'actual_hours'
      };

      for (const [key, dbField] of Object.entries(fieldMap)) {
        if (data[key as keyof TodoUpdate] !== undefined) {
          updateFields.push(`${dbField} = $${paramIndex}`);
          if (key === 'sourceReference') {
            updateValues.push(JSON.stringify(data[key as keyof TodoUpdate]));
          } else {
            updateValues.push(data[key as keyof TodoUpdate]);
          }
          paramIndex++;
        }
      }

      // ステータス完了時の特別処理
      if (data.status === TodoStatus.COMPLETED && !data.completedAt) {
        updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
      }

      if (updateFields.length === 0) {
        return null;
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);

      const updateQuery = `
        UPDATE todos 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(updateQuery, updateValues);

      if (result.rows.length === 0) {
        return null;
      }

      // 関連データも含めて返す
      return await this.findById(id);
    } finally {
      client.release();
    }
  }

  /**
   * TODO削除（物理削除）
   */
  static async delete(id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM todos WHERE id = $1',
        [id]
      );
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * TODO承認
   */
  static async approve(id: string, approverId: string): Promise<Todo | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE todos 
        SET is_approved = true, approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *`,
        [approverId, id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return await this.findById(id);
    } finally {
      client.release();
    }
  }

  /**
   * TODO統計情報取得
   */
  static async getStats(filters?: {
    assigneeId?: string;
    companyId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    totalCount: number;
    statusBreakdown: { status: string; count: number }[];
    priorityBreakdown: { priority: string; count: number }[];
    sourceBreakdown: { source: string; count: number }[];
    overdueTodos: number;
    todayDueTodos: number;
    weekDueTodos: number;
    averageCompletionTime: number;
  }> {
    const client = await pool.connect();
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.assigneeId) {
        whereClause += ` AND primary_assignee_id = $${paramIndex}`;
        params.push(filters.assigneeId);
        paramIndex++;
      }

      if (filters?.companyId) {
        whereClause += ` AND company_id = $${paramIndex}`;
        params.push(filters.companyId);
        paramIndex++;
      }

      if (filters?.dateFrom) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(filters.dateFrom);
        paramIndex++;
      }

      if (filters?.dateTo) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(filters.dateTo);
        paramIndex++;
      }

      // 総数
      const totalResult = await client.query(
        `SELECT COUNT(*) FROM todos ${whereClause}`,
        params
      );
      const totalCount = parseInt(totalResult.rows[0].count);

      // ステータス別集計
      const statusResult = await client.query(
        `SELECT status, COUNT(*) as count FROM todos ${whereClause} GROUP BY status`,
        params
      );
      const statusBreakdown = statusResult.rows;

      // 優先度別集計
      const priorityResult = await client.query(
        `SELECT priority, COUNT(*) as count FROM todos ${whereClause} GROUP BY priority`,
        params
      );
      const priorityBreakdown = priorityResult.rows;

      // ソース別集計
      const sourceResult = await client.query(
        `SELECT source, COUNT(*) as count FROM todos ${whereClause} GROUP BY source`,
        params
      );
      const sourceBreakdown = sourceResult.rows;

      // 期限超過TODO数
      const overdueResult = await client.query(
        `SELECT COUNT(*) FROM todos ${whereClause} AND due_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled')`,
        params
      );
      const overdueTodos = parseInt(overdueResult.rows[0].count);

      // 今日期限TODO数
      const todayResult = await client.query(
        `SELECT COUNT(*) FROM todos ${whereClause} AND DATE(due_date) = CURRENT_DATE AND status NOT IN ('completed', 'cancelled')`,
        params
      );
      const todayDueTodos = parseInt(todayResult.rows[0].count);

      // 1週間以内期限TODO数
      const weekResult = await client.query(
        `SELECT COUNT(*) FROM todos ${whereClause} AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status NOT IN ('completed', 'cancelled')`,
        params
      );
      const weekDueTodos = parseInt(weekResult.rows[0].count);

      // 平均完了時間（日数）
      const avgTimeResult = await client.query(
        `SELECT AVG(EXTRACT(DAY FROM (completed_at - created_at))) as avg_days 
        FROM todos ${whereClause} AND status = 'completed' AND completed_at IS NOT NULL`,
        params
      );
      const averageCompletionTime = avgTimeResult.rows[0].avg_days || 0;

      return {
        totalCount,
        statusBreakdown,
        priorityBreakdown,
        sourceBreakdown,
        overdueTodos,
        todayDueTodos,
        weekDueTodos,
        averageCompletionTime: Math.round(averageCompletionTime)
      };
    } finally {
      client.release();
    }
  }

  /**
   * データベース行をTodoオブジェクトに変換（基本）
   */
  private static rowToTodo(row: any): Todo {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date,
      companyId: row.company_id,
      primaryAssigneeId: row.primary_assignee_id,
      source: row.source,
      sourceReference: row.source_reference,
      isInternal: row.is_internal,
      isApproved: row.is_approved,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      completedAt: row.completed_at,
      tags: row.tags,
      estimatedHours: row.estimated_hours,
      actualHours: row.actual_hours,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * データベース行をTodoオブジェクトに変換（関連データ含む）
   */
  private static rowToTodoWithRelations(row: any): Todo {
    const todo = this.rowToTodo(row);

    // 担当者情報
    if (row.assignee_id) {
      todo.primaryAssignee = {
        id: row.assignee_id,
        email: row.assignee_email,
        fullName: row.assignee_name
      } as any;
    }

    // 企業情報
    if (row.company_id && row.company_name) {
      todo.company = {
        id: row.company_id,
        name: row.company_name
      } as any;
    }

    // 承認者情報
    if (row.approver_id) {
      todo.approver = {
        id: row.approver_id,
        email: row.approver_email,
        fullName: row.approver_name
      } as any;
    }

    return todo;
  }
}