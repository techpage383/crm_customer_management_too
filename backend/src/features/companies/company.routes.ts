/**
 * 企業管理機能 - ルート定義
 * P-002 企業管理ページのAPIルート定義
 * 
 * 企業・連絡先のRESTful APIエンドポイント
 * 型定義は/src/types/index.tsと完全同期
 */

import { Router } from 'express';
import { CompanyController, createCompanyController } from './company.controller.js';
import { companyService } from './company.service.js';
import { requireAuth, requireUpperRole } from '../auth/auth.middleware.js';
import { createCompanyTableSchema } from './company.model.js';
import { getAuthService } from '../auth/auth.service.js';

// コントローラーインスタンス作成
const companyController = createCompanyController(companyService);

/**
 * 企業管理ルートを作成
 */
export function createCompanyRoutes(): Router {
  const router = Router();
  
  // 認証サービス取得
  const authService = getAuthService();

  // データベーススキーマの初期化（開発段階でのみ実行）
  if (process.env.NODE_ENV === 'development') {
    createCompanyTableSchema().catch(error => {
      console.error('企業管理機能: データベーススキーマ初期化エラー:', error);
    });
  }

  console.log('企業管理機能: ルート設定開始');

  // ================== 企業管理エンドポイント ==================

  /**
   * GET /api/companies
   * 企業一覧・検索（ページネーション対応）
   * 
   * クエリパラメータ:
   * - query: 検索キーワード（企業名、業界等）
   * - status: ステータスフィルタ（カンマ区切り）
   * - size: 企業規模フィルタ（カンマ区切り）
   * - industry: 業界フィルタ（カンマ区切り）
   * - assigneeId: 担当者IDフィルタ（カンマ区切り）
   * - page: ページ番号（デフォルト: 1）
   * - limit: 取得件数（デフォルト: 20、最大: 100）
   * - sortBy: ソートフィールド
   * - sortOrder: ソート順序（asc/desc）
   */
  router.get('/', requireAuth(authService), (req, res) => {
    companyController.searchCompanies(req, res);
  });

  /**
   * POST /api/companies/search
   * 企業高度検索（複雑な検索条件をPOSTで送信）
   * 
   * リクエストボディ: CompanySearchRequest
   */
  router.post('/search', requireAuth(authService), (req, res) => {
    companyController.advancedSearch(req, res);
  });

  /**
   * GET /api/companies/stats
   * 企業統計情報取得
   * 
   * 権限: 上位権限者のみ
   */
  router.get('/stats', requireAuth(authService), requireUpperRole(authService), (req, res) => {
    companyController.getCompanyStats(req, res);
  });

  /**
   * GET /api/companies/export/csv
   * 企業データCSV出力
   * 
   * 権限: 上位権限者のみ
   * クエリパラメータ: 検索条件と同様
   */
  router.get('/export/csv', requireAuth(authService), requireUpperRole(authService), (req, res) => {
    companyController.exportCompaniesCSV(req, res);
  });

  /**
   * POST /api/companies
   * 企業作成
   * 
   * 権限: 上位権限者のみ
   * リクエストボディ: CompanyCreate
   */
  router.post('/', requireAuth(authService), requireUpperRole(authService), (req, res) => {
    companyController.createCompany(req, res);
  });

  /**
   * GET /api/companies/:id
   * 企業詳細取得
   * 
   * パラメータ:
   * - id: 企業ID（UUID）
   */
  router.get('/:id', requireAuth(authService), (req, res) => {
    companyController.getCompanyById(req, res);
  });

  /**
   * PUT /api/companies/:id
   * 企業更新
   * 
   * 権限: 上位権限者のみ（または担当者チェック）
   * パラメータ: id - 企業ID（UUID）
   * リクエストボディ: CompanyUpdate
   */
  router.put('/:id', requireAuth(authService), requireUpperRole(authService), (req, res) => {
    companyController.updateCompany(req, res);
  });

  /**
   * DELETE /api/companies/:id
   * 企業削除（ソフトデリート）
   * 
   * 権限: 上位権限者のみ
   * パラメータ: id - 企業ID（UUID）
   */
  router.delete('/:id', requireAuth(authService), requireUpperRole(authService), (req, res) => {
    companyController.deleteCompany(req, res);
  });

  /**
   * PUT /api/companies/:id/assign
   * 企業担当者変更
   * 
   * 権限: 上位権限者のみ
   * パラメータ: id - 企業ID（UUID）
   * リクエストボディ:
   * - primaryAssigneeId: 主担当者ID（必須）
   * - secondaryAssigneeIds: 副担当者ID配列（オプション）
   */
  router.put('/:id/assign', requireAuth(authService), requireUpperRole(authService), (req, res) => {
    companyController.assignCompany(req, res);
  });

  /**
   * GET /api/companies/:id/contacts
   * 企業の連絡先一覧取得
   * 
   * パラメータ: id - 企業ID（UUID）
   */
  router.get('/:id/contacts', requireAuth(authService), (req, res) => {
    companyController.getCompanyContacts(req, res);
  });

  // ================== 連絡先管理エンドポイント ==================

  /**
   * POST /api/contacts
   * 連絡先作成
   * 
   * 権限: 上位権限者のみ
   * リクエストボディ: ContactCreate
   */
  router.post('/contacts', requireAuth(authService), requireUpperRole(authService), (req, res) => {
    companyController.createContact(req, res);
  });

  /**
   * PUT /api/contacts/:id
   * 連絡先更新
   * 
   * 権限: 上位権限者のみ
   * パラメータ: id - 連絡先ID（UUID）
   * リクエストボディ: ContactUpdate
   */
  router.put('/contacts/:id', requireAuth(authService), requireUpperRole(authService), (req, res) => {
    companyController.updateContact(req, res);
  });

  /**
   * DELETE /api/contacts/:id
   * 連絡先削除（ソフトデリート）
   * 
   * 権限: 上位権限者のみ
   * パラメータ: id - 連絡先ID（UUID）
   */
  router.delete('/contacts/:id', requireAuth(authService), requireUpperRole(authService), (req, res) => {
    companyController.deleteContact(req, res);
  });

  console.log('企業管理機能: ルート設定完了');
  console.log('企業管理機能: 設定されたエンドポイント:');
  console.log('  GET    /api/companies              - 企業一覧・検索');
  console.log('  POST   /api/companies/search       - 企業高度検索');
  console.log('  GET    /api/companies/stats        - 企業統計情報（上位権限）');
  console.log('  GET    /api/companies/export/csv   - 企業CSV出力（上位権限）');
  console.log('  POST   /api/companies              - 企業作成（上位権限）');
  console.log('  GET    /api/companies/:id          - 企業詳細取得');
  console.log('  PUT    /api/companies/:id          - 企業更新（上位権限）');
  console.log('  DELETE /api/companies/:id          - 企業削除（上位権限）');
  console.log('  PUT    /api/companies/:id/assign   - 企業担当者変更（上位権限）');
  console.log('  GET    /api/companies/:id/contacts - 企業連絡先一覧');
  console.log('  POST   /api/contacts               - 連絡先作成（上位権限）');
  console.log('  PUT    /api/contacts/:id           - 連絡先更新（上位権限）');
  console.log('  DELETE /api/contacts/:id           - 連絡先削除（上位権限）');

  return router;
}

// デフォルトルーターエクスポート（メインアプリケーションで使用）
const companyRoutes = createCompanyRoutes();
export default companyRoutes;