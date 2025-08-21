/**
 * ワークフロー管理機能 - 統合テスト
 * 最強タスク管理ツール
 */

const request = require('supertest');
const express = require('express');
const { createWorkflowRoutes } = require('../../../src/features/workflows/workflow.routes.js');

// テスト用アプリケーション設定
const app = express();
app.use(express.json());

// 認証ミドルウェアのモック（実際のプロジェクトでは実認証を使用）
app.use('/api/workflows', (req, res, next) => {
  // テスト用ユーザー情報を設定
  req.user = {
    id: `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    companyId: `test-company-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    role: 'COMPANY_LEADER', // 全権限でテスト
    email: `test@${Date.now()}.com`
  };
  next();
});

// ワークフローAPIをマウント
app.use('/api/workflows', createWorkflowRoutes(process.env.DATABASE_URL || 'postgresql://postgres.nbgtyfuxmplfaserjthr:d.X@ziw!NzZM9g4@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'));

describe('ワークフローテンプレート管理API統合テスト', () => {
  let testTemplateId;
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    console.log('\n=== ワークフロー管理API統合テスト開始 ===');
  });

  afterAll(async () => {
    // テストデータクリーンアップ（実装では自動ロールバック）
    console.log('=== ワークフロー管理API統合テスト完了 ===\n');
  });

  describe('1. ヘルスチェック', () => {
    it('ワークフローサービスのヘルスチェックが成功する', async () => {
      const response = await request(app)
        .get('/api/workflows/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.service).toBe('workflow-management');
      expect(response.body.data.status).toBe('healthy');
    });
  });

  describe('2. ワークフローテンプレート管理', () => {
    it('新規ワークフローテンプレートを作成できる', async () => {
      const templateData = {
        name: `テストワークフロー-${uniqueId}`,
        description: 'テスト用のワークフローテンプレート',
        type: 'STANDARD',
        scope: 'COMPANY',
        workflowData: {
          statuses: [
            { id: 'todo', name: 'TODO', color: '#6c757d' },
            { id: 'in_progress', name: '進行中', color: '#007bff' },
            { id: 'done', name: '完了', color: '#28a745' }
          ],
          transitions: [
            { from: 'todo', to: 'in_progress' },
            { from: 'in_progress', to: 'done' }
          ],
          defaultStatus: 'todo'
        },
        accessControl: {
          allowedRoles: ['COMPANY_LEADER', 'MANAGER'],
          inheritanceLevel: 'COMPANY'
        },
        isActive: true
      };

      const response = await request(app)
        .post('/api/workflows/templates')
        .send(templateData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(templateData.name);
      expect(response.body.data.type).toBe(templateData.type);
      expect(response.body.data.scope).toBe(templateData.scope);

      testTemplateId = response.body.data.id;
      console.log(`作成されたテンプレートID: ${testTemplateId}`);
    });

    it('ワークフローテンプレート一覧を取得できる', async () => {
      const response = await request(app)
        .get('/api/workflows/templates');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.total).toBeGreaterThan(0);
    });

    it('ワークフローテンプレート詳細を取得できる', async () => {
      const response = await request(app)
        .get(`/api/workflows/templates/${testTemplateId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testTemplateId);
      expect(response.body.data.workflowData.statuses).toBeDefined();
      expect(response.body.data.workflowData.transitions).toBeDefined();
    });

    it('ワークフローテンプレートを更新できる', async () => {
      const updateData = {
        name: `更新済みワークフロー-${uniqueId}`,
        description: '更新されたテスト用ワークフロー'
      };

      const response = await request(app)
        .put(`/api/workflows/templates/${testTemplateId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('ワークフローテンプレートを削除できる', async () => {
      const response = await request(app)
        .delete(`/api/workflows/templates/${testTemplateId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe(true);
    });
  });

  describe('3. 工数テンプレート管理', () => {
    let testEffortTemplateId;

    it('新規工数テンプレートを作成できる', async () => {
      const templateData = {
        name: `工数テンプレート-${uniqueId}`,
        category: 'development',
        estimatedHours: 8.5,
        description: 'テスト用の工数テンプレート',
        templateData: {
          taskTypes: ['coding', 'testing', 'review'],
          complexity: 'medium'
        },
        scope: 'COMPANY',
        accessControl: {
          allowedRoles: ['COMPANY_LEADER', 'MANAGER'],
          inheritanceLevel: 'COMPANY'
        },
        isActive: true
      };

      const response = await request(app)
        .post('/api/workflows/effort-templates')
        .send(templateData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(templateData.name);
      expect(response.body.data.category).toBe(templateData.category);
      expect(response.body.data.estimatedHours).toBe(templateData.estimatedHours);

      testEffortTemplateId = response.body.data.id;
      console.log(`作成された工数テンプレートID: ${testEffortTemplateId}`);
    });

    it('工数テンプレート一覧を取得できる', async () => {
      const response = await request(app)
        .get('/api/workflows/effort-templates');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });

    it('工数テンプレート統計を取得できる', async () => {
      const response = await request(app)
        .get('/api/workflows/effort-templates/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTemplates).toBeGreaterThan(0);
      expect(response.body.data.categories).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
    });

    it('工数テンプレートを更新できる', async () => {
      const updateData = {
        name: `更新済み工数テンプレート-${uniqueId}`,
        estimatedHours: 10.0
      };

      const response = await request(app)
        .put(`/api/workflows/effort-templates/${testEffortTemplateId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.estimatedHours).toBe(updateData.estimatedHours);
    });

    it('工数テンプレートを削除できる', async () => {
      const response = await request(app)
        .delete(`/api/workflows/effort-templates/${testEffortTemplateId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe(true);
    });
  });

  describe('4. ワークフロー設定管理', () => {
    it('ワークフロー設定を取得できる', async () => {
      const response = await request(app)
        .get('/api/workflows/settings');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBeDefined();
      expect(response.body.data.companyId).toBeDefined();
      expect(response.body.data.personalWorkflows).toBeDefined();
    });

    it('ワークフロー設定を更新できる', async () => {
      const updateData = {
        personalWorkflows: [
          { id: 'personal-1', name: '個人ワークフロー1' }
        ],
        privacySettings: {
          sharePersonalTemplates: true,
          allowWorkflowSuggestions: true,
          visibleToTeam: false
        }
      };

      const response = await request(app)
        .put('/api/workflows/settings')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.personalWorkflows).toEqual(updateData.personalWorkflows);
      expect(response.body.data.privacySettings.sharePersonalTemplates).toBe(true);
    });
  });

  describe('5. エラーハンドリング', () => {
    it('存在しないワークフローテンプレートの取得で404エラー', async () => {
      const response = await request(app)
        .get('/api/workflows/templates/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('見つかりません');
    });

    it('不正なデータでワークフローテンプレート作成時に400エラー', async () => {
      const invalidData = {
        name: '', // 必須項目が空
        type: 'INVALID_TYPE' // 無効なタイプ
      };

      const response = await request(app)
        .post('/api/workflows/templates')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('入力エラー');
    });
  });

  describe('6. パフォーマンステスト', () => {
    it('API応答時間が5秒以内であること', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/workflows/templates');

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5秒以内
      console.log(`API応答時間: ${responseTime}ms`);
    });

    it('大量データ取得時のパフォーマンス', async () => {
      const startTime = Date.now();

      // ページネーションなしで全データ取得
      const response = await request(app)
        .get('/api/workflows/templates?limit=100');

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // 3秒以内
      console.log(`大量データ取得時間: ${responseTime}ms`);
    });
  });
});

// テスト実行時の環境情報出力
console.log('\n=== テスト環境情報 ===');
console.log(`Node.js バージョン: ${process.version}`);
console.log(`データベース: ${process.env.DATABASE_URL ? 'PostgreSQL (実環境)' : 'テスト環境未設定'}`);
console.log(`テスト開始時刻: ${new Date().toISOString()}`);
console.log('========================\n');