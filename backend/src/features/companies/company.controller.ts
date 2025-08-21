/**
 * 企業管理機能 - コントローラー層
 * P-002 企業管理ページのRESTfulコントローラー
 * 
 * 企業・連絡先のCRUD操作、検索、担当者管理のAPIエンドポイント
 */

import { Request, Response } from 'express';
import { CompanyService } from './company.service.js';
import { 
  CompanySearchRequest,
  CompanyCreate,
  CompanyUpdate,
  ContactCreate,
  ContactUpdate,
  CompanyStatus,
  CompanySize,
  ContactType
} from '../../types/index.js';
import { AuthRequest } from '../auth/auth.middleware.js';

export class CompanyController {
  constructor(private companyService: CompanyService) {}

  /**
   * GET /api/companies
   * 企業一覧・検索
   */
  async searchCompanies(req: Request, res: Response): Promise<void> {
    try {
      console.log('🏢 GET /api/companies - 企業検索リクエスト');
      console.log('🏢 リクエストクエリ:', req.query);

      const searchRequest: CompanySearchRequest = {
        query: req.query.query as string,
        status: req.query.status ? (req.query.status as string).split(',') as CompanyStatus[] : undefined,
        size: req.query.size ? (req.query.size as string).split(',') as CompanySize[] : undefined,
        industry: req.query.industry ? (req.query.industry as string).split(',') : undefined,
        assigneeId: req.query.assigneeId ? (req.query.assigneeId as string).split(',') : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      console.log('🏢 サービス呼び出し前:', JSON.stringify(searchRequest, null, 2));
      const result = await this.companyService.searchCompanies(searchRequest);
      console.log('🏢 サービス呼び出し後:', result ? 'データ取得成功' : 'データなし');

      res.json({
        success: true,
        data: result,
        message: `${result.companies.length}件の企業を取得しました`
      });

    } catch (error: any) {
      console.error('❌ 企業検索に失敗しました:', error);
      
      if (error.message.includes('limit') || error.message.includes('page')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'INVALID_PARAMETERS'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '企業検索に失敗しました',
        code: 'COMPANY_SEARCH_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/companies/:id
   * 企業詳細取得
   */
  async getCompanyById(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.params.id;
      console.log(`🏢 GET /api/companies/${companyId} - 企業詳細取得リクエスト`);

      const company = await this.companyService.getCompanyById(companyId);

      if (!company) {
        res.status(404).json({
          success: false,
          error: '指定された企業が見つかりません',
          code: 'COMPANY_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: company,
        message: '企業詳細を取得しました'
      });

    } catch (error: any) {
      console.error('❌ 企業詳細取得に失敗しました:', error);
      res.status(500).json({
        success: false,
        error: '企業詳細の取得に失敗しました',
        code: 'COMPANY_GET_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /api/companies
   * 企業作成
   */
  async createCompany(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('🏢 POST /api/companies - 企業作成リクエスト');

      const companyData: CompanyCreate = req.body;
      const createdBy = req.user!.userId;

      // 基本バリデーション
      if (!companyData.name || !companyData.industry || !companyData.status || 
          !companyData.size || !companyData.primaryAssigneeId) {
        res.status(400).json({
          success: false,
          error: '企業名、業界、ステータス、規模、主担当者は必須です',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const company = await this.companyService.createCompany(companyData, createdBy);

      res.status(201).json({
        success: true,
        data: company,
        message: '企業を作成しました'
      });

    } catch (error: any) {
      console.error('❌ 企業作成に失敗しました:', error);

      if (error.message.includes('既に登録されています') || 
          error.message.includes('必須です') ||
          error.message.includes('無効な')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '企業の作成に失敗しました',
        code: 'COMPANY_CREATE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUT /api/companies/:id
   * 企業更新
   */
  async updateCompany(req: AuthRequest, res: Response): Promise<void> {
    try {
      const companyId = req.params.id;
      const updateData: CompanyUpdate = req.body;
      const updatedBy = req.user!.userId;

      console.log(`🏢 PUT /api/companies/${companyId} - 企業更新リクエスト`);

      const company = await this.companyService.updateCompany(companyId, updateData, updatedBy);

      if (!company) {
        res.status(404).json({
          success: false,
          error: '更新対象の企業が見つかりません',
          code: 'COMPANY_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: company,
        message: '企業情報を更新しました'
      });

    } catch (error: any) {
      console.error('❌ 企業更新に失敗しました:', error);

      if (error.message.includes('見つかりません') || 
          error.message.includes('既に登録されています') ||
          error.message.includes('無効な') ||
          error.message.includes('変更はできません')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '企業情報の更新に失敗しました',
        code: 'COMPANY_UPDATE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * DELETE /api/companies/:id
   * 企業削除（ソフトデリート）
   */
  async deleteCompany(req: AuthRequest, res: Response): Promise<void> {
    try {
      const companyId = req.params.id;
      const deletedBy = req.user!.userId;

      console.log(`🏢 DELETE /api/companies/${companyId} - 企業削除リクエスト`);

      const success = await this.companyService.deleteCompany(companyId, deletedBy);

      if (!success) {
        res.status(404).json({
          success: false,
          error: '削除対象の企業が見つかりません',
          code: 'COMPANY_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        message: '企業を削除しました'
      });

    } catch (error: any) {
      console.error('❌ 企業削除に失敗しました:', error);

      if (error.message.includes('見つかりません') || 
          error.message.includes('既に削除されています')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '企業の削除に失敗しました',
        code: 'COMPANY_DELETE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/companies/stats
   * 企業統計情報取得
   */
  async getCompanyStats(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 GET /api/companies/stats - 企業統計情報取得リクエスト');

      const stats = await this.companyService.getCompanyStats();

      res.json({
        success: true,
        data: stats,
        message: '企業統計情報を取得しました'
      });

    } catch (error: any) {
      console.error('❌ 企業統計情報取得に失敗しました:', error);
      res.status(500).json({
        success: false,
        error: '企業統計情報の取得に失敗しました',
        code: 'COMPANY_STATS_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUT /api/companies/:id/assign
   * 企業担当者変更
   */
  async assignCompany(req: AuthRequest, res: Response): Promise<void> {
    try {
      const companyId = req.params.id;
      const { primaryAssigneeId, secondaryAssigneeIds } = req.body;
      const assignedBy = req.user!.userId;

      console.log(`👥 PUT /api/companies/${companyId}/assign - 企業担当者変更リクエスト`);

      // バリデーション
      if (!primaryAssigneeId) {
        res.status(400).json({
          success: false,
          error: '主担当者は必須です',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const success = await this.companyService.assignCompany(
        companyId, 
        primaryAssigneeId, 
        secondaryAssigneeIds || [],
        assignedBy
      );

      if (!success) {
        res.status(404).json({
          success: false,
          error: '担当者変更対象の企業が見つかりません',
          code: 'COMPANY_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        message: '企業担当者を変更しました'
      });

    } catch (error: any) {
      console.error('❌ 企業担当者変更に失敗しました:', error);

      if (error.message.includes('見つかりません') || 
          error.message.includes('重複') ||
          error.message.includes('同じユーザー')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '企業担当者の変更に失敗しました',
        code: 'COMPANY_ASSIGN_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/companies/:id/contacts
   * 企業の連絡先一覧取得
   */
  async getCompanyContacts(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.params.id;
      console.log(`📞 GET /api/companies/${companyId}/contacts - 企業連絡先一覧取得リクエスト`);

      const contacts = await this.companyService.getCompanyContacts(companyId);

      res.json({
        success: true,
        data: contacts,
        message: `${contacts.length}件の連絡先を取得しました`
      });

    } catch (error: any) {
      console.error('❌ 企業連絡先一覧取得に失敗しました:', error);

      if (error.message.includes('見つかりません')) {
        res.status(404).json({
          success: false,
          error: error.message,
          code: 'COMPANY_NOT_FOUND'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '企業連絡先一覧の取得に失敗しました',
        code: 'COMPANY_CONTACTS_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /api/contacts
   * 連絡先作成
   */
  async createContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📞 POST /api/contacts - 連絡先作成リクエスト');

      const contactData: ContactCreate = req.body;
      const createdBy = req.user!.userId;

      // 基本バリデーション
      if (!contactData.name || !contactData.companyId || !contactData.type) {
        res.status(400).json({
          success: false,
          error: '連絡先名、企業ID、連絡先タイプは必須です',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      // タイプの妥当性チェック
      if (!Object.values(ContactType).includes(contactData.type)) {
        res.status(400).json({
          success: false,
          error: '無効な連絡先タイプです',
          code: 'INVALID_CONTACT_TYPE'
        });
        return;
      }

      const contact = await this.companyService.createContact(contactData, createdBy);

      res.status(201).json({
        success: true,
        data: contact,
        message: '連絡先を作成しました'
      });

    } catch (error: any) {
      console.error('❌ 連絡先作成に失敗しました:', error);

      if (error.message.includes('見つかりません') || 
          error.message.includes('既に登録されています') ||
          error.message.includes('必須です') ||
          error.message.includes('有効な')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '連絡先の作成に失敗しました',
        code: 'CONTACT_CREATE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUT /api/contacts/:id
   * 連絡先更新
   */
  async updateContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const contactId = req.params.id;
      const updateData: ContactUpdate = req.body;
      const updatedBy = req.user!.userId;

      console.log(`📞 PUT /api/contacts/${contactId} - 連絡先更新リクエスト`);

      // タイプの妥当性チェック（更新される場合）
      if (updateData.type && !Object.values(ContactType).includes(updateData.type)) {
        res.status(400).json({
          success: false,
          error: '無効な連絡先タイプです',
          code: 'INVALID_CONTACT_TYPE'
        });
        return;
      }

      const contact = await this.companyService.updateContact(contactId, updateData, updatedBy);

      if (!contact) {
        res.status(404).json({
          success: false,
          error: '更新対象の連絡先が見つかりません',
          code: 'CONTACT_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: contact,
        message: '連絡先情報を更新しました'
      });

    } catch (error: any) {
      console.error('❌ 連絡先更新に失敗しました:', error);

      if (error.message.includes('見つかりません') || 
          error.message.includes('既に登録されています') ||
          error.message.includes('有効な')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '連絡先情報の更新に失敗しました',
        code: 'CONTACT_UPDATE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * DELETE /api/contacts/:id
   * 連絡先削除（ソフトデリート）
   */
  async deleteContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const contactId = req.params.id;
      const deletedBy = req.user!.userId;

      console.log(`📞 DELETE /api/contacts/${contactId} - 連絡先削除リクエスト`);

      const success = await this.companyService.deleteContact(contactId, deletedBy);

      if (!success) {
        res.status(404).json({
          success: false,
          error: '削除対象の連絡先が見つかりません',
          code: 'CONTACT_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        message: '連絡先を削除しました'
      });

    } catch (error: any) {
      console.error('❌ 連絡先削除に失敗しました:', error);

      if (error.message.includes('見つかりません') || 
          error.message.includes('既に削除されています')) {
        res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: '連絡先の削除に失敗しました',
        code: 'CONTACT_DELETE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /api/companies/search
   * 高度検索（POST版）
   */
  async advancedSearch(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 POST /api/companies/search - 企業高度検索リクエスト');

      const searchRequest: CompanySearchRequest = req.body;

      // 基本的なバリデーション
      if (searchRequest.limit && (searchRequest.limit < 1 || searchRequest.limit > 100)) {
        res.status(400).json({
          success: false,
          error: 'limit は 1 から 100 の間で指定してください',
          code: 'INVALID_LIMIT'
        });
        return;
      }

      const result = await this.companyService.searchCompanies(searchRequest);

      res.json({
        success: true,
        data: result,
        message: `${result.companies.length}件の企業を検索しました`
      });

    } catch (error: any) {
      console.error('❌ 企業高度検索に失敗しました:', error);
      res.status(500).json({
        success: false,
        error: '企業検索に失敗しました',
        code: 'COMPANY_ADVANCED_SEARCH_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/companies/export/csv
   * 企業データCSV出力
   */
  async exportCompaniesCSV(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 GET /api/companies/export/csv - 企業データCSV出力リクエスト');

      // 基本的な検索条件を適用
      const searchRequest: CompanySearchRequest = {
        query: req.query.query as string,
        status: req.query.status ? (req.query.status as string).split(',') as CompanyStatus[] : undefined,
        size: req.query.size ? (req.query.size as string).split(',') as CompanySize[] : undefined,
        industry: req.query.industry ? (req.query.industry as string).split(',') : undefined,
        assigneeId: req.query.assigneeId ? (req.query.assigneeId as string).split(',') : undefined,
        page: 1,
        limit: 1000 // CSV出力用に上限を設定
      };

      const result = await this.companyService.searchCompanies(searchRequest);

      // CSVヘッダー
      const csvHeaders = [
        'ID',
        '企業名',
        '企業名（カナ）',
        '業界',
        'ステータス',
        '規模',
        '従業員数',
        '資本金',
        '設立年',
        'ウェブサイト',
        '電話番号',
        'FAX',
        '都道府県',
        '市区町村',
        '住所1',
        '住所2',
        '郵便番号',
        '主担当者',
        '最終連絡日',
        '次回フォローアップ日',
        '作成日',
        '更新日'
      ].join(',');

      // CSVデータ
      const csvRows = result.companies.map(company => [
        company.id,
        `"${company.name || ''}"`,
        `"${company.nameKana || ''}"`,
        `"${company.industry || ''}"`,
        `"${company.status || ''}"`,
        `"${company.size || ''}"`,
        company.employeeCount || '',
        company.capital || '',
        company.establishedYear || '',
        `"${company.website || ''}"`,
        `"${company.phone || ''}"`,
        `"${company.fax || ''}"`,
        `"${company.address?.prefecture || ''}"`,
        `"${company.address?.city || ''}"`,
        `"${company.address?.address1 || ''}"`,
        `"${company.address?.address2 || ''}"`,
        `"${company.address?.postalCode || ''}"`,
        `"${company.primaryAssignee?.fullName || ''}"`,
        company.lastContactAt ? company.lastContactAt.toISOString().split('T')[0] : '',
        company.nextFollowUpAt ? company.nextFollowUpAt.toISOString().split('T')[0] : '',
        company.createdAt.toISOString().split('T')[0],
        company.updatedAt.toISOString().split('T')[0]
      ].join(','));

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      // CSVファイルとしてレスポンス
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="companies_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\uFEFF' + csvContent); // BOM付きでExcelでの文字化け防止

    } catch (error: any) {
      console.error('❌ 企業データCSV出力に失敗しました:', error);
      res.status(500).json({
        success: false,
        error: '企業データの出力に失敗しました',
        code: 'COMPANY_EXPORT_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

// サービスインスタンスを注入してコントローラーを作成
export function createCompanyController(companyService: CompanyService): CompanyController {
  return new CompanyController(companyService);
}