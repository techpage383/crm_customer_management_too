-- ========== 拡張データベーススキーマ ==========
-- 高度なCRM機能をサポートするテーブル群

-- Email Threads テーブル（メールスレッド管理）
CREATE TABLE email_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id VARCHAR(255) UNIQUE NOT NULL,  -- Gmailのthread ID
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    participants TEXT[] NOT NULL,            -- 参加者のメールアドレス配列
    message_count INTEGER DEFAULT 1,
    last_message_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    has_attachments BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_REPLY', 'WAITING_RESPONSE', 'COMPLETED', 'ARCHIVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer TODOs テーブル（TODO管理）
CREATE TABLE customer_todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    thread_id UUID REFERENCES email_threads(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(20) DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    estimated_hours DECIMAL(5,2),           -- 予想工数
    actual_hours DECIMAL(5,2),              -- 実工数
    assigned_to VARCHAR(255),               -- 担当者
    extracted_from VARCHAR(255),            -- 抽出元メッセージID
    created_by VARCHAR(10) DEFAULT 'USER' CHECK (created_by IN ('USER', 'AI')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 既存のemail_attachmentsテーブルを拡張
ALTER TABLE email_attachments ADD COLUMN IF NOT EXISTS local_path TEXT;
ALTER TABLE email_attachments ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;
ALTER TABLE email_attachments ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE email_attachments ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE email_attachments ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT FALSE;

-- Reply Templates テーブル（返信テンプレート）
CREATE TABLE reply_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    category VARCHAR(100),
    is_ai_generated BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reply Drafts テーブル（返信下書き）
CREATE TABLE reply_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_emails TEXT[] NOT NULL,
    cc_emails TEXT[] DEFAULT '{}',
    bcc_emails TEXT[] DEFAULT '{}',
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    confidence DECIMAL(3,2),                -- AI提案の信頼度（0-1）
    suggested_template_id UUID REFERENCES reply_templates(id) ON DELETE SET NULL,
    scheduled_send_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Activities テーブル（顧客活動追跡）
CREATE TABLE customer_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'EMAIL_SENT', 'EMAIL_RECEIVED', 'REPLY_SENT', 'TODO_CREATED', 
        'TODO_COMPLETED', 'MEETING_SCHEDULED', 'CUSTOMER_UPDATED', 
        'ATTACHMENT_DOWNLOADED'
    )),
    description TEXT NOT NULL,
    metadata JSONB,                         -- 関連データ
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Alerts テーブル（アラート管理）
CREATE TABLE customer_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'LONG_NO_CONTACT', 'PENDING_REPLY', 'OVERDUE_TODO', 
        'HIGH_PRIORITY_EMAIL', 'ATTACHMENT_NEEDS_REVIEW'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    is_read BOOLEAN DEFAULT FALSE,
    action_required BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Customer Metrics テーブル（統計情報）
CREATE TABLE customer_metrics (
    customer_id UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
    total_emails INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_received INTEGER DEFAULT 0,
    average_response_time DECIMAL(8,2) DEFAULT 0,  -- 時間
    response_rate DECIMAL(5,2) DEFAULT 0,          -- %
    last_contact_date TIMESTAMP WITH TIME ZONE,
    total_todos INTEGER DEFAULT 0,
    completed_todos INTEGER DEFAULT 0,
    total_work_hours DECIMAL(8,2) DEFAULT 0,       -- 総工数
    active_threads INTEGER DEFAULT 0,
    pending_replies INTEGER DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- email_messagesテーブルにthread_idを追加（既存テーブルの拡張）
ALTER TABLE email_messages ADD COLUMN IF NOT EXISTS thread_table_id UUID REFERENCES email_threads(id) ON DELETE SET NULL;

-- ========== インデックス作成 ==========
CREATE INDEX idx_email_threads_customer_id ON email_threads(customer_id);
CREATE INDEX idx_email_threads_thread_id ON email_threads(thread_id);
CREATE INDEX idx_email_threads_status ON email_threads(status);
CREATE INDEX idx_email_threads_priority ON email_threads(priority);
CREATE INDEX idx_email_threads_last_message_date ON email_threads(last_message_date DESC);

CREATE INDEX idx_customer_todos_customer_id ON customer_todos(customer_id);
CREATE INDEX idx_customer_todos_status ON customer_todos(status);
CREATE INDEX idx_customer_todos_priority ON customer_todos(priority);
CREATE INDEX idx_customer_todos_due_date ON customer_todos(due_date);
CREATE INDEX idx_customer_todos_thread_id ON customer_todos(thread_id);

CREATE INDEX idx_reply_templates_user_id ON reply_templates(user_id);
CREATE INDEX idx_reply_templates_category ON reply_templates(category);
CREATE INDEX idx_reply_templates_usage_count ON reply_templates(usage_count DESC);

CREATE INDEX idx_reply_drafts_thread_id ON reply_drafts(thread_id);
CREATE INDEX idx_reply_drafts_user_id ON reply_drafts(user_id);

CREATE INDEX idx_customer_activities_customer_id ON customer_activities(customer_id);
CREATE INDEX idx_customer_activities_type ON customer_activities(type);
CREATE INDEX idx_customer_activities_timestamp ON customer_activities(timestamp DESC);

CREATE INDEX idx_customer_alerts_customer_id ON customer_alerts(customer_id);
CREATE INDEX idx_customer_alerts_user_id ON customer_alerts(user_id);
CREATE INDEX idx_customer_alerts_type ON customer_alerts(type);
CREATE INDEX idx_customer_alerts_severity ON customer_alerts(severity);
CREATE INDEX idx_customer_alerts_is_read ON customer_alerts(is_read);

-- ========== トリガー関数 ==========
-- email_threadsのupdated_at自動更新
CREATE TRIGGER update_email_threads_updated_at 
    BEFORE UPDATE ON email_threads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- customer_todosのupdated_at自動更新
CREATE TRIGGER update_customer_todos_updated_at 
    BEFORE UPDATE ON customer_todos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- reply_templatesのupdated_at自動更新
CREATE TRIGGER update_reply_templates_updated_at 
    BEFORE UPDATE ON reply_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== メトリクス自動更新関数 ==========
CREATE OR REPLACE FUNCTION update_customer_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- メトリクスの再計算と更新
    INSERT INTO customer_metrics (customer_id)
    VALUES (COALESCE(NEW.customer_id, OLD.customer_id))
    ON CONFLICT (customer_id) DO UPDATE SET
        total_emails = (
            SELECT COUNT(*) FROM email_messages 
            WHERE customer_id = EXCLUDED.customer_id
        ),
        active_threads = (
            SELECT COUNT(*) FROM email_threads 
            WHERE customer_id = EXCLUDED.customer_id AND status = 'ACTIVE'
        ),
        pending_replies = (
            SELECT COUNT(*) FROM email_threads 
            WHERE customer_id = EXCLUDED.customer_id AND status = 'PENDING_REPLY'
        ),
        total_todos = (
            SELECT COUNT(*) FROM customer_todos 
            WHERE customer_id = EXCLUDED.customer_id
        ),
        completed_todos = (
            SELECT COUNT(*) FROM customer_todos 
            WHERE customer_id = EXCLUDED.customer_id AND status = 'COMPLETED'
        ),
        calculated_at = CURRENT_TIMESTAMP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- メトリクス更新トリガー
CREATE TRIGGER trigger_update_metrics_on_email 
    AFTER INSERT OR UPDATE OR DELETE ON email_messages 
    FOR EACH ROW EXECUTE FUNCTION update_customer_metrics();

CREATE TRIGGER trigger_update_metrics_on_thread 
    AFTER INSERT OR UPDATE OR DELETE ON email_threads 
    FOR EACH ROW EXECUTE FUNCTION update_customer_metrics();

CREATE TRIGGER trigger_update_metrics_on_todo 
    AFTER INSERT OR UPDATE OR DELETE ON customer_todos 
    FOR EACH ROW EXECUTE FUNCTION update_customer_metrics();