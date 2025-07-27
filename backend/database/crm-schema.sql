-- ========== BtoB CRM データベーススキーマ ==========
-- 本格的な企業向け顧客管理システム

-- Companies テーブル（企業情報）
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    employee_count INTEGER,
    website VARCHAR(255),
    main_phone_number VARCHAR(50),
    address TEXT,
    founded_year INTEGER,
    annual_revenue DECIMAL(15,2),
    company_size VARCHAR(20) DEFAULT 'SMALL' CHECK (company_size IN ('STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE')),
    status VARCHAR(20) DEFAULT 'PROSPECT' CHECK (status IN ('PROSPECT', 'ACTIVE', 'INACTIVE', 'CHURNED', 'BLACKLISTED')),
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    
    -- 自社情報
    our_account_manager VARCHAR(255) NOT NULL,
    relationship_start DATE,
    
    -- メタデータ
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contacts テーブル（担当者情報）
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    mobile_number VARCHAR(50),
    is_main_contact BOOLEAN DEFAULT FALSE,
    decision_maker BOOLEAN DEFAULT FALSE,
    
    -- コミュニケーション設定
    preferred_contact_method VARCHAR(20) DEFAULT 'EMAIL' CHECK (preferred_contact_method IN ('EMAIL', 'PHONE', 'CHAT', 'IN_PERSON')),
    timezone VARCHAR(50),
    
    -- 関係性
    relationship_level VARCHAR(20) DEFAULT 'COLD' CHECK (relationship_level IN ('COLD', 'WARM', 'HOT', 'CHAMPION')),
    last_contact_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products テーブル（商材マスタ）
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'JPY',
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY' CHECK (billing_cycle IN ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM')),
    features TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contracts テーブル（契約情報）
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    contract_name VARCHAR(255) NOT NULL,
    contract_type VARCHAR(20) DEFAULT 'NEW' CHECK (contract_type IN ('NEW', 'RENEWAL', 'EXPANSION', 'DOWNGRADE')),
    
    -- 契約期間
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renewal BOOLEAN DEFAULT FALSE,
    
    -- 金額情報
    contract_value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'JPY',
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY' CHECK (billing_cycle IN ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM')),
    
    -- ステータス
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PROPOSED', 'NEGOTIATING', 'SIGNED', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
    signed_date DATE,
    
    -- 担当者
    our_account_manager VARCHAR(255) NOT NULL,
    client_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Proposals テーブル（提案管理）
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- 提案内容
    proposed_value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'JPY',
    proposed_start_date DATE,
    
    -- ステータス
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'VIEWED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
    proposed_date DATE NOT NULL,
    response_date DATE,
    
    -- 担当者
    proposed_by VARCHAR(255) NOT NULL,
    proposed_to UUID REFERENCES contacts(id) ON DELETE SET NULL,
    
    -- 結果
    rejection_reason TEXT,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Proposal Products テーブル（提案商材の中間テーブル）
CREATE TABLE proposal_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12,2),
    discount_rate DECIMAL(5,2) DEFAULT 0,
    
    UNIQUE(proposal_id, product_id)
);

-- Custom Fields テーブル（カスタムフィールド定義）
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'DATETIME', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'URL', 'EMAIL', 'PHONE')),
    target_entity VARCHAR(20) NOT NULL CHECK (target_entity IN ('COMPANY', 'CONTACT', 'PRODUCT', 'CONTRACT', 'PROPOSAL')),
    
    -- フィールド設定
    is_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    -- バリデーション（JSONBで格納）
    validation JSONB,
    
    -- 権限
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    editable_by TEXT[] DEFAULT '{"ADMIN", "MANAGER"}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(name, target_entity)
);

-- Custom Field Options テーブル（選択肢）
CREATE TABLE custom_field_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    color VARCHAR(7),  -- HEXカラーコード
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    UNIQUE(custom_field_id, value)
);

-- Custom Field Values テーブル（カスタムフィールド値）
CREATE TABLE custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_type VARCHAR(20) NOT NULL,
    entity_id UUID NOT NULL,
    value TEXT,  -- JSON形式で様々な型の値を格納
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(custom_field_id, entity_type, entity_id)
);

-- Import Mappings テーブル（インポートマッピング）
CREATE TABLE import_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    target_entity VARCHAR(20) NOT NULL CHECK (target_entity IN ('COMPANY', 'CONTACT', 'PRODUCT', 'CONTRACT', 'PROPOSAL')),
    
    -- 設定
    has_header BOOLEAN DEFAULT TRUE,
    skip_rows INTEGER DEFAULT 0,
    encoding VARCHAR(20) DEFAULT 'UTF-8',
    
    -- マッピング定義（JSON形式）
    field_mappings JSONB NOT NULL,
    
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Import Jobs テーブル（インポートジョブ）
CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    mapping_id UUID NOT NULL REFERENCES import_mappings(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    
    -- 結果
    total_rows INTEGER DEFAULT 0,
    success_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    
    -- 実行情報
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    executed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- 既存のcustomersテーブルを更新（会社情報へのリンク追加）
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- ========== インデックス作成 ==========
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_company_name ON companies(company_name);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_our_account_manager ON companies(our_account_manager);

CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_is_main_contact ON contacts(is_main_contact);
CREATE INDEX idx_contacts_name ON contacts(name);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_product_name ON products(product_name);

CREATE INDEX idx_contracts_company_id ON contracts(company_id);
CREATE INDEX idx_contracts_product_id ON contracts(product_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_start_date ON contracts(start_date);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_contracts_our_account_manager ON contracts(our_account_manager);

CREATE INDEX idx_proposals_company_id ON proposals(company_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_proposed_date ON proposals(proposed_date);
CREATE INDEX idx_proposals_proposed_by ON proposals(proposed_by);

CREATE INDEX idx_proposal_products_proposal_id ON proposal_products(proposal_id);
CREATE INDEX idx_proposal_products_product_id ON proposal_products(product_id);

CREATE INDEX idx_custom_fields_target_entity ON custom_fields(target_entity);
CREATE INDEX idx_custom_fields_is_active ON custom_fields(is_active);

CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_type, entity_id);
CREATE INDEX idx_custom_field_values_custom_field_id ON custom_field_values(custom_field_id);

CREATE INDEX idx_import_mappings_target_entity ON import_mappings(target_entity);
CREATE INDEX idx_import_mappings_created_by ON import_mappings(created_by);

CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_executed_by ON import_jobs(executed_by);

-- ========== トリガー関数 ==========
-- 各テーブルのupdated_at自動更新
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at 
    BEFORE UPDATE ON contracts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at 
    BEFORE UPDATE ON proposals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_fields_updated_at 
    BEFORE UPDATE ON custom_fields 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_field_values_updated_at 
    BEFORE UPDATE ON custom_field_values 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_mappings_updated_at 
    BEFORE UPDATE ON import_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== ビュー作成 ==========
-- 企業詳細ビュー（よく使われる結合データ）
CREATE VIEW company_details AS
SELECT 
    c.*,
    -- メイン担当者情報
    mc.name as main_contact_name,
    mc.title as main_contact_title,
    mc.email as main_contact_email,
    mc.phone_number as main_contact_phone,
    
    -- アクティブ契約数
    (SELECT COUNT(*) FROM contracts WHERE company_id = c.id AND status = 'ACTIVE') as active_contracts,
    
    -- 提案中の件数
    (SELECT COUNT(*) FROM proposals WHERE company_id = c.id AND status IN ('SENT', 'UNDER_REVIEW')) as pending_proposals,
    
    -- 最終連絡日（メール履歴から）
    (SELECT MAX(em.date) FROM email_messages em 
     JOIN customers cust ON em.customer_id = cust.id 
     WHERE cust.company_id = c.id) as last_email_date
     
FROM companies c
LEFT JOIN contacts mc ON c.id = mc.company_id AND mc.is_main_contact = TRUE;

-- ========== 初期データ挿入 ==========
-- デフォルトの商材カテゴリ
INSERT INTO products (product_name, category, description, is_active) VALUES
('基本プラン', 'サブスクリプション', '基本的な機能を提供するプラン', true),
('プレミアムプラン', 'サブスクリプション', '高度な機能を提供するプラン', true),
('コンサルティング', 'サービス', '専門的なコンサルティングサービス', true)
ON CONFLICT DO NOTHING;

-- デフォルトのカスタムフィールド
INSERT INTO custom_fields (name, label, field_type, target_entity, created_by) 
SELECT 
    'priority_level', '優先度', 'SELECT', 'COMPANY', id
FROM users 
WHERE email = 'admin@example.com'  -- 管理者ユーザーがいる場合
LIMIT 1
ON CONFLICT DO NOTHING;