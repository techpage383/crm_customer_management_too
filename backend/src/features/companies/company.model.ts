/**
 * 企業管理機能 - データモデル層
 * P-002 企業管理ページのデータアクセス層
 * 
 * 企業情報、連絡先情報、企業検索のデータ層実装
 * 型定義は/src/types/index.tsと完全同期
 */

import * as dotenv from 'dotenv';
// 環境変数を最初に読み込み
dotenv.config();

import { Pool, PoolClient } from 'pg';
import { 
  Company, 
  CompanyCreate, 
  CompanyUpdate, 
  CompanySearchRequest,
  CompanySearchResponse,
  CompanyStatus,
  CompanySize,
  IndustryType,
  Contact,
  ContactCreate,
  ContactUpdate,
  ContactType,
  ID 
} from '../../types/index.js';

// データベース接続プール
let pool: Pool;

/**
 * データベース接続プールの初期化
 */
export function initializeDatabase(): void {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('企業管理機能: データベース接続プールでエラーが発生しました:', err);
    });

    console.log('企業管理機能: データベース接続プール初期化完了');
  }
}

/**
 * データベース接続プールの取得
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('データベースプールが初期化されていません');
  }
  return pool;
}

/**
 * 企業管理テーブルのスキーマ作成
 */
export async function createCompanyTableSchema(): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 企業テーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        name_kana VARCHAR(255),
        industry VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('lead', 'prospect', 'active_customer', 'inactive')),
        size VARCHAR(20) NOT NULL CHECK (size IN ('large', 'medium', 'small')),
        employee_count INTEGER,
        capital BIGINT,
        established_year INTEGER,
        description TEXT,
        website VARCHAR(500),
        phone VARCHAR(50),
        fax VARCHAR(50),
        address_prefecture VARCHAR(100),
        address_city VARCHAR(100),
        address_1 VARCHAR(255),
        address_2 VARCHAR(255),
        address_postal_code VARCHAR(20),
        tags TEXT[],
        custom_fields JSONB DEFAULT '{}',
        last_contact_at TIMESTAMP WITH TIME ZONE,
        next_follow_up_at TIMESTAMP WITH TIME ZONE,
        primary_assignee_id UUID NOT NULL,
        secondary_assignee_ids UUID[] DEFAULT ARRAY[]::UUID[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT fk_companies_primary_assignee 
          FOREIGN KEY (primary_assignee_id) REFERENCES users(id) ON DELETE RESTRICT
      );
    `);

    // 連絡先テーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        name_kana VARCHAR(255),
        position VARCHAR(100),
        department VARCHAR(100),
        type VARCHAR(20) NOT NULL DEFAULT 'other' CHECK (type IN ('decision_maker', 'technical', 'window', 'other')),
        email VARCHAR(255),
        phone VARCHAR(50),
        mobile VARCHAR(50),
        notes TEXT,
        is_primary BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT fk_contacts_company 
          FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );
    `);

    // インデックス作成
    await client.query(`
      -- 企業テーブルインデックス
      CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
      CREATE INDEX IF NOT EXISTS idx_companies_name_kana ON companies(name_kana);
      CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
      CREATE INDEX IF NOT EXISTS idx_companies_size ON companies(size);
      CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
      CREATE INDEX IF NOT EXISTS idx_companies_primary_assignee ON companies(primary_assignee_id);
      CREATE INDEX IF NOT EXISTS idx_companies_last_contact ON companies(last_contact_at DESC);
      CREATE INDEX IF NOT EXISTS idx_companies_next_follow_up ON companies(next_follow_up_at);
      CREATE INDEX IF NOT EXISTS idx_companies_tags ON companies USING GIN(tags);
      CREATE INDEX IF NOT EXISTS idx_companies_custom_fields ON companies USING GIN(custom_fields);
      
      -- 連絡先テーブルインデックス
      CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
      CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
      CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
      CREATE INDEX IF NOT EXISTS idx_contacts_is_primary ON contacts(company_id, is_primary) WHERE is_primary = true;
      CREATE INDEX IF NOT EXISTS idx_contacts_is_active ON contacts(is_active) WHERE is_active = true;
    `);

    // 更新日時自動更新トリガー
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
      CREATE TRIGGER update_companies_updated_at
        BEFORE UPDATE ON companies
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
      CREATE TRIGGER update_contacts_updated_at
        BEFORE UPDATE ON contacts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query('COMMIT');
    console.log('企業管理機能: データベーススキーマ作成完了');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('企業管理機能: スキーマ作成エラー:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * データベース行をCompanyオブジェクトに変換
 */
function mapRowToCompany(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    nameKana: row.name_kana,
    industry: row.industry,
    status: row.status as CompanyStatus,
    size: row.size as CompanySize,
    employeeCount: row.employee_count,
    capital: row.capital,
    establishedYear: row.established_year,
    description: row.description,
    website: row.website,
    phone: row.phone,
    fax: row.fax,
    address: row.address_prefecture ? {
      prefecture: row.address_prefecture,
      city: row.address_city,
      address1: row.address_1,
      address2: row.address_2,
      postalCode: row.address_postal_code
    } : undefined,
    tags: row.tags || [],
    customFields: row.custom_fields || {},
    lastContactAt: row.last_contact_at ? new Date(row.last_contact_at) : undefined,
    nextFollowUpAt: row.next_follow_up_at ? new Date(row.next_follow_up_at) : undefined,
    primaryAssigneeId: row.primary_assignee_id,
    secondaryAssigneeIds: row.secondary_assignee_ids || [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

/**
 * データベース行をContactオブジェクトに変換
 */
function mapRowToContact(row: any): Contact {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    nameKana: row.name_kana,
    position: row.position,
    department: row.department,
    type: row.type as ContactType,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    notes: row.notes,
    isPrimary: row.is_primary,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

/**
 * 企業管理データモデル操作クラス
 */
export class CompanyModel {
  /**
   * 企業一覧取得（検索・ページネーション対応）
   */
  static async searchCompanies(searchRequest: CompanySearchRequest): Promise<CompanySearchResponse> {
    try {
      console.log('[CompanyModel.searchCompanies] 企業検索開始:', searchRequest);
      
      const {
        query,
        status,
        size,
        industry,
        assigneeId,
        page = 1,
        limit = 20
      } = searchRequest;
      
      const offset = (page - 1) * limit;
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // 検索条件構築
      if (query) {
        conditions.push(`(
          c.name ILIKE $${paramIndex} OR 
          c.name_kana ILIKE $${paramIndex} OR 
          c.description ILIKE $${paramIndex}
        )`);
        values.push(`%${query}%`);
        paramIndex++;
      }

      if (status && status.length > 0) {
        conditions.push(`c.status = ANY($${paramIndex})`);
        values.push(status);
        paramIndex++;
      }

      if (size && size.length > 0) {
        conditions.push(`c.size = ANY($${paramIndex})`);
        values.push(size);
        paramIndex++;
      }

      if (industry && industry.length > 0) {
        conditions.push(`c.industry = ANY($${paramIndex})`);
        values.push(industry);
        paramIndex++;
      }

      if (assigneeId && assigneeId.length > 0) {
        conditions.push(`(
          c.primary_assignee_id = ANY($${paramIndex}) OR 
          c.secondary_assignee_ids && $${paramIndex}
        )`);
        values.push(assigneeId);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // 総件数取得
      const countQuery = `
        SELECT COUNT(*) as total
        FROM companies c
        ${whereClause}
      `;
      
      const countResult = await pool.query(countQuery, values);
      const totalCount = parseInt(countResult.rows[0].total);

      // 企業データ取得（担当者情報付き）
      const dataQuery = `
        SELECT 
          c.*,
          u_primary.username as primary_assignee_username,
          u_primary.full_name as primary_assignee_full_name
        FROM companies c
        LEFT JOIN users u_primary ON c.primary_assignee_id = u_primary.id
        ${whereClause}
        ORDER BY c.updated_at DESC, c.name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      values.push(limit, offset);
      const dataResult = await pool.query(dataQuery, values);
      
      const companies = dataResult.rows.map(row => {
        const company = mapRowToCompany(row);
        if (row.primary_assignee_username) {
          company.primaryAssignee = {
            id: company.primaryAssigneeId,
            username: row.primary_assignee_username,
            fullName: row.primary_assignee_full_name
          } as any;
        }
        return company;
      });

      const response: CompanySearchResponse = {
        companies,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      };

      console.log(`[CompanyModel.searchCompanies] 企業検索完了: ${companies.length}件`);
      return response;
      
    } catch (error) {
      console.error('[CompanyModel.searchCompanies] 企業検索エラー:', error);
      throw error;
    }
  }

  /**
   * 企業詳細取得
   */
  static async getCompanyById(id: ID): Promise<Company | null> {
    try {
      console.log(`[CompanyModel.getCompanyById] 企業詳細取得開始: ${id}`);
      
      const query = `
        SELECT 
          c.*,
          u_primary.username as primary_assignee_username,
          u_primary.full_name as primary_assignee_full_name,
          u_primary.email as primary_assignee_email,
          u_primary.role as primary_assignee_role
        FROM companies c
        LEFT JOIN users u_primary ON c.primary_assignee_id = u_primary.id
        WHERE c.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        console.log(`[CompanyModel.getCompanyById] 企業が見つかりません: ${id}`);
        return null;
      }
      
      const row = result.rows[0];
      const company = mapRowToCompany(row);
      
      // 主担当者情報追加
      if (row.primary_assignee_username) {
        company.primaryAssignee = {
          id: company.primaryAssigneeId,
          username: row.primary_assignee_username,
          fullName: row.primary_assignee_full_name,
          email: row.primary_assignee_email,
          role: row.primary_assignee_role
        } as any;
      }

      // 副担当者情報取得
      if (company.secondaryAssigneeIds && company.secondaryAssigneeIds.length > 0) {
        const secondaryQuery = `
          SELECT id, username, full_name, email, role
          FROM users 
          WHERE id = ANY($1)
        `;
        const secondaryResult = await pool.query(secondaryQuery, [company.secondaryAssigneeIds]);
        company.secondaryAssignees = secondaryResult.rows.map(u => ({
          id: u.id,
          username: u.username,
          fullName: u.full_name,
          email: u.email,
          role: u.role
        })) as any;
      }

      console.log(`[CompanyModel.getCompanyById] 企業詳細取得完了: ${company.name}`);
      return company;
      
    } catch (error) {
      console.error('[CompanyModel.getCompanyById] 企業詳細取得エラー:', error);
      throw error;
    }
  }

  /**
   * 企業作成
   */
  static async createCompany(companyData: CompanyCreate): Promise<Company> {
    try {
      console.log('[CompanyModel.createCompany] 企業作成開始:', companyData.name);
      
      const query = `
        INSERT INTO companies (
          name, name_kana, industry, status, size, employee_count, capital,
          established_year, description, website, phone, fax,
          address_prefecture, address_city, address_1, address_2, address_postal_code,
          tags, custom_fields, last_contact_at, next_follow_up_at,
          primary_assignee_id, secondary_assignee_ids
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING *
      `;
      
      const values = [
        companyData.name,
        companyData.nameKana,
        companyData.industry,
        companyData.status,
        companyData.size,
        companyData.employeeCount,
        companyData.capital,
        companyData.establishedYear,
        companyData.description,
        companyData.website,
        companyData.phone,
        companyData.fax,
        companyData.address?.prefecture,
        companyData.address?.city,
        companyData.address?.address1,
        companyData.address?.address2,
        companyData.address?.postalCode,
        companyData.tags || [],
        JSON.stringify(companyData.customFields || {}),
        companyData.lastContactAt,
        companyData.nextFollowUpAt,
        companyData.primaryAssigneeId,
        companyData.secondaryAssigneeIds || []
      ];
      
      const result = await pool.query(query, values);
      const company = mapRowToCompany(result.rows[0]);
      
      console.log(`[CompanyModel.createCompany] 企業作成完了: ${company.id}`);
      return company;
      
    } catch (error) {
      console.error('[CompanyModel.createCompany] 企業作成エラー:', error);
      throw error;
    }
  }

  /**
   * 企業更新
   */
  static async updateCompany(id: ID, updateData: CompanyUpdate): Promise<Company | null> {
    try {
      console.log(`[CompanyModel.updateCompany] 企業更新開始: ${id}`);
      
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // 動的にUPDATE文を構築
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          switch (key) {
            case 'nameKana':
              setClauses.push(`name_kana = $${paramIndex}`);
              break;
            case 'employeeCount':
              setClauses.push(`employee_count = $${paramIndex}`);
              break;
            case 'establishedYear':
              setClauses.push(`established_year = $${paramIndex}`);
              break;
            case 'lastContactAt':
              setClauses.push(`last_contact_at = $${paramIndex}`);
              break;
            case 'nextFollowUpAt':
              setClauses.push(`next_follow_up_at = $${paramIndex}`);
              break;
            case 'primaryAssigneeId':
              setClauses.push(`primary_assignee_id = $${paramIndex}`);
              break;
            case 'secondaryAssigneeIds':
              setClauses.push(`secondary_assignee_ids = $${paramIndex}`);
              break;
            case 'customFields':
              setClauses.push(`custom_fields = $${paramIndex}`);
              value = JSON.stringify(value);
              break;
            case 'address':
              if (value && typeof value === 'object') {
                setClauses.push(`
                  address_prefecture = $${paramIndex},
                  address_city = $${paramIndex + 1},
                  address_1 = $${paramIndex + 2},
                  address_2 = $${paramIndex + 3},
                  address_postal_code = $${paramIndex + 4}
                `);
                values.push(
                  value.prefecture,
                  value.city,
                  value.address1,
                  value.address2,
                  value.postalCode
                );
                paramIndex += 4; // 5つのパラメータを追加したが、最後に+1されるので-1
                break;
              }
              return; // addressが正しい形式でない場合はスキップ
            default:
              setClauses.push(`${key} = $${paramIndex}`);
          }
          
          if (key !== 'address') {
            values.push(value);
          }
          paramIndex++;
        }
      });

      if (setClauses.length === 0) {
        // 更新するフィールドがない場合は既存データを返す
        return await this.getCompanyById(id);
      }

      values.push(id); // WHERE条件用のID

      const query = `
        UPDATE companies 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        console.log(`[CompanyModel.updateCompany] 企業が見つかりません: ${id}`);
        return null;
      }
      
      const company = mapRowToCompany(result.rows[0]);
      console.log(`[CompanyModel.updateCompany] 企業更新完了: ${company.name}`);
      return company;
      
    } catch (error) {
      console.error('[CompanyModel.updateCompany] 企業更新エラー:', error);
      throw error;
    }
  }

  /**
   * 企業削除（ソフトデリート）
   */
  static async deleteCompany(id: ID): Promise<boolean> {
    try {
      console.log(`[CompanyModel.deleteCompany] 企業削除開始: ${id}`);
      
      // ソフトデリートの代わりに、ステータスをINACTIVEに変更
      const query = `
        UPDATE companies 
        SET status = 'inactive', updated_at = NOW()
        WHERE id = $1 AND status != 'inactive'
        RETURNING id
      `;
      
      const result = await pool.query(query, [id]);
      const success = result.rows.length > 0;
      
      if (success) {
        console.log(`[CompanyModel.deleteCompany] 企業削除完了: ${id}`);
      } else {
        console.log(`[CompanyModel.deleteCompany] 企業が見つからないか既に削除済み: ${id}`);
      }
      
      return success;
      
    } catch (error) {
      console.error('[CompanyModel.deleteCompany] 企業削除エラー:', error);
      throw error;
    }
  }

  /**
   * 企業統計情報取得
   */
  static async getCompanyStats(): Promise<{
    total: number;
    byStatus: Record<CompanyStatus, number>;
    bySize: Record<CompanySize, number>;
    byIndustry: Record<string, number>;
    recentlyAdded: number;
    followUpRequired: number;
  }> {
    try {
      console.log('[CompanyModel.getCompanyStats] 企業統計情報取得開始');
      
      const [totalResult, statusResult, sizeResult, industryResult, recentResult, followUpResult] = await Promise.all([
        // 総企業数
        pool.query('SELECT COUNT(*) as count FROM companies WHERE status != \'inactive\''),
        
        // ステータス別統計
        pool.query(`
          SELECT status, COUNT(*) as count 
          FROM companies 
          WHERE status != 'inactive'
          GROUP BY status
        `),
        
        // 規模別統計
        pool.query(`
          SELECT size, COUNT(*) as count 
          FROM companies 
          WHERE status != 'inactive'
          GROUP BY size
        `),
        
        // 業界別統計
        pool.query(`
          SELECT industry, COUNT(*) as count 
          FROM companies 
          WHERE status != 'inactive'
          GROUP BY industry 
          ORDER BY count DESC 
          LIMIT 10
        `),
        
        // 最近追加された企業数（7日以内）
        pool.query(`
          SELECT COUNT(*) as count 
          FROM companies 
          WHERE created_at >= NOW() - INTERVAL '7 days' AND status != 'inactive'
        `),
        
        // フォローアップが必要な企業数
        pool.query(`
          SELECT COUNT(*) as count 
          FROM companies 
          WHERE next_follow_up_at <= NOW() AND status != 'inactive'
        `)
      ]);

      // ステータス別統計を初期化
      const byStatus: Record<CompanyStatus, number> = {
        [CompanyStatus.LEAD]: 0,
        [CompanyStatus.PROSPECT]: 0,
        [CompanyStatus.ACTIVE_CUSTOMER]: 0,
        [CompanyStatus.INACTIVE]: 0
      };
      
      statusResult.rows.forEach(row => {
        byStatus[row.status as CompanyStatus] = parseInt(row.count);
      });

      // 規模別統計を初期化
      const bySize: Record<CompanySize, number> = {
        [CompanySize.LARGE]: 0,
        [CompanySize.MEDIUM]: 0,
        [CompanySize.SMALL]: 0
      };
      
      sizeResult.rows.forEach(row => {
        bySize[row.size as CompanySize] = parseInt(row.count);
      });

      // 業界別統計
      const byIndustry: Record<string, number> = {};
      industryResult.rows.forEach(row => {
        byIndustry[row.industry] = parseInt(row.count);
      });

      const stats = {
        total: parseInt(totalResult.rows[0].count),
        byStatus,
        bySize,
        byIndustry,
        recentlyAdded: parseInt(recentResult.rows[0].count),
        followUpRequired: parseInt(followUpResult.rows[0].count)
      };

      console.log('[CompanyModel.getCompanyStats] 企業統計情報取得完了:', stats);
      return stats;
      
    } catch (error) {
      console.error('[CompanyModel.getCompanyStats] 企業統計情報取得エラー:', error);
      throw error;
    }
  }

  /**
   * 企業担当者変更
   */
  static async assignCompany(
    companyId: ID, 
    primaryAssigneeId: ID, 
    secondaryAssigneeIds?: ID[]
  ): Promise<boolean> {
    try {
      console.log(`[CompanyModel.assignCompany] 企業担当者変更開始: ${companyId}`);
      
      const query = `
        UPDATE companies 
        SET 
          primary_assignee_id = $1,
          secondary_assignee_ids = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING id
      `;
      
      const result = await pool.query(query, [
        primaryAssigneeId,
        secondaryAssigneeIds || [],
        companyId
      ]);
      
      const success = result.rows.length > 0;
      
      if (success) {
        console.log(`[CompanyModel.assignCompany] 企業担当者変更完了: ${companyId}`);
      } else {
        console.log(`[CompanyModel.assignCompany] 企業が見つかりません: ${companyId}`);
      }
      
      return success;
      
    } catch (error) {
      console.error('[CompanyModel.assignCompany] 企業担当者変更エラー:', error);
      throw error;
    }
  }
}

// 連絡先管理用のモデルクラス
export class ContactModel {
  /**
   * 企業の連絡先一覧取得
   */
  static async getContactsByCompanyId(companyId: ID): Promise<Contact[]> {
    try {
      console.log(`[ContactModel.getContactsByCompanyId] 連絡先一覧取得開始: ${companyId}`);
      
      const query = `
        SELECT * FROM contacts 
        WHERE company_id = $1 AND is_active = true
        ORDER BY is_primary DESC, name ASC
      `;
      
      const result = await pool.query(query, [companyId]);
      const contacts = result.rows.map(mapRowToContact);
      
      console.log(`[ContactModel.getContactsByCompanyId] 連絡先一覧取得完了: ${contacts.length}件`);
      return contacts;
      
    } catch (error) {
      console.error('[ContactModel.getContactsByCompanyId] 連絡先一覧取得エラー:', error);
      throw error;
    }
  }

  /**
   * 連絡先作成
   */
  static async createContact(contactData: ContactCreate): Promise<Contact> {
    try {
      console.log('[ContactModel.createContact] 連絡先作成開始:', contactData.name);
      
      const query = `
        INSERT INTO contacts (
          company_id, name, name_kana, position, department, type,
          email, phone, mobile, notes, is_primary
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        contactData.companyId,
        contactData.name,
        contactData.nameKana,
        contactData.position,
        contactData.department,
        contactData.type,
        contactData.email,
        contactData.phone,
        contactData.mobile,
        contactData.notes,
        contactData.isPrimary || false
      ];
      
      const result = await pool.query(query, values);
      const contact = mapRowToContact(result.rows[0]);
      
      console.log(`[ContactModel.createContact] 連絡先作成完了: ${contact.id}`);
      return contact;
      
    } catch (error) {
      console.error('[ContactModel.createContact] 連絡先作成エラー:', error);
      throw error;
    }
  }

  /**
   * 連絡先更新
   */
  static async updateContact(id: ID, updateData: ContactUpdate): Promise<Contact | null> {
    try {
      console.log(`[ContactModel.updateContact] 連絡先更新開始: ${id}`);
      
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // 動的にUPDATE文を構築
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          switch (key) {
            case 'nameKana':
              setClauses.push(`name_kana = $${paramIndex}`);
              break;
            case 'isPrimary':
              setClauses.push(`is_primary = $${paramIndex}`);
              break;
            case 'isActive':
              setClauses.push(`is_active = $${paramIndex}`);
              break;
            default:
              setClauses.push(`${key} = $${paramIndex}`);
          }
          values.push(value);
          paramIndex++;
        }
      });

      if (setClauses.length === 0) {
        return await this.getContactById(id);
      }

      values.push(id);

      const query = `
        UPDATE contacts 
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        console.log(`[ContactModel.updateContact] 連絡先が見つかりません: ${id}`);
        return null;
      }
      
      const contact = mapRowToContact(result.rows[0]);
      console.log(`[ContactModel.updateContact] 連絡先更新完了: ${contact.name}`);
      return contact;
      
    } catch (error) {
      console.error('[ContactModel.updateContact] 連絡先更新エラー:', error);
      throw error;
    }
  }

  /**
   * 連絡先取得
   */
  static async getContactById(id: ID): Promise<Contact | null> {
    try {
      const query = 'SELECT * FROM contacts WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return mapRowToContact(result.rows[0]);
      
    } catch (error) {
      console.error('[ContactModel.getContactById] 連絡先取得エラー:', error);
      throw error;
    }
  }

  /**
   * 連絡先削除（ソフトデリート）
   */
  static async deleteContact(id: ID): Promise<boolean> {
    try {
      console.log(`[ContactModel.deleteContact] 連絡先削除開始: ${id}`);
      
      const query = `
        UPDATE contacts 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1 AND is_active = true
        RETURNING id
      `;
      
      const result = await pool.query(query, [id]);
      const success = result.rows.length > 0;
      
      console.log(`[ContactModel.deleteContact] 連絡先削除完了: ${success}`);
      return success;
      
    } catch (error) {
      console.error('[ContactModel.deleteContact] 連絡先削除エラー:', error);
      throw error;
    }
  }
}

// データベース初期化を自動実行
initializeDatabase();