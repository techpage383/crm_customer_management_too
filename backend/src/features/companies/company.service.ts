/**
 * 企業管理機能 - サービス層
 * P-002 企業管理ページのビジネスロジック
 * 
 * 企業・連絡先の管理、検索、担当者管理のビジネスロジック
 */

import { 
  Company, 
  CompanyCreate, 
  CompanyUpdate, 
  CompanySearchRequest,
  CompanySearchResponse,
  CompanyStatus,
  Contact,
  ContactCreate,
  ContactUpdate,
  ID 
} from '../../types/index.js';
import { CompanyModel, ContactModel } from './company.model.js';
// import { auditLogger } from '../../common/utils/audit.js';
import { 
  validateCompanyCreate,
  validateCompanyUpdate,
  validateContactCreate,
  validateContactUpdate,
  validateCompanySearchRequest,
  validateCompanyAssignment
} from './company.validator.js';

export class CompanyService {

  /**
   * 企業検索・一覧取得
   */
  async searchCompanies(searchRequest: CompanySearchRequest): Promise<CompanySearchResponse> {
    console.log('🏢 企業検索開始:', searchRequest);

    try {
      // バリデーション
      const validation = validateCompanySearchRequest(searchRequest);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).flat();
        throw new Error(`入力データが無効です: ${errorMessages.join(', ')}`);
      }

      const result = await CompanyModel.searchCompanies(searchRequest);
      
      // 検索操作の監査ログ (一時的に無効化)
      // await auditLogger.log('COMPANY_SEARCH', {
      console.log('📝 Audit log: COMPANY_SEARCH', {
        searchRequest,
        resultCount: result.companies.length,
        totalCount: result.totalCount
      });

      console.log(`✅ 企業検索完了: ${result.companies.length}件 / ${result.totalCount}件`);
      return result;
      
    } catch (error) {
      console.error('❌ 企業検索に失敗しました:', error);
      
      // エラーの監査ログ (一時的に無効化)
      // await auditLogger.log('COMPANY_SEARCH_ERROR', {
      console.log('📝 Audit log: COMPANY_SEARCH_ERROR', {
        searchRequest,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * 企業詳細取得
   */
  async getCompanyById(id: ID): Promise<Company | null> {
    console.log(`🏢 企業詳細取得開始: ${id}`);

    try {
      const company = await CompanyModel.getCompanyById(id);
      
      if (!company) {
        console.log(`企業が見つかりません: ${id}`);
        return null;
      }

      // 企業詳細取得の監査ログ
      // await auditLogger.log('COMPANY_VIEWED', {
      console.log('📝 Audit log: COMPANY_VIEWED', {
        companyId: company.id,
        companyName: company.name
      });

      console.log(`✅ 企業詳細取得完了: ${company.name}`);
      return company;
      
    } catch (error) {
      console.error('❌ 企業詳細取得に失敗しました:', error);
      throw error;
    }
  }

  /**
   * 企業作成
   */
  async createCompany(companyData: CompanyCreate, createdBy: ID): Promise<Company> {
    console.log('🏢 企業作成開始:', companyData.name);

    try {
      // 入力バリデーション
      const validation = validateCompanyCreate(companyData);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).flat();
        throw new Error(`入力データが無効です: ${errorMessages.join(', ')}`);
      }

      // 企業名の重複チェック
      const existingCompanies = await CompanyModel.searchCompanies({
        query: companyData.name,
        page: 1,
        limit: 1
      });

      const duplicateCompany = existingCompanies.companies.find(
        c => c.name.toLowerCase() === companyData.name.toLowerCase()
      );

      if (duplicateCompany) {
        throw new Error(`企業名「${companyData.name}」は既に登録されています`);
      }

      // 企業作成
      const company = await CompanyModel.createCompany(companyData);

      // 企業作成の監査ログ
      // await auditLogger.log('COMPANY_CREATED', {
      console.log('📝 Audit log: COMPANY_CREATED', {
        companyId: company.id,
        companyName: company.name,
        status: company.status,
        primaryAssigneeId: company.primaryAssigneeId,
        createdBy
      });

      console.log(`✅ 企業作成完了: ${company.name} (${company.id})`);
      return company;
      
    } catch (error) {
      console.error('❌ 企業作成に失敗しました:', error);
      
      // エラーの監査ログ
      // await auditLogger.log('COMPANY_CREATE_ERROR', {
      console.log('📝 Audit log: COMPANY_CREATE_ERROR', {
        companyName: companyData.name,
        error: error.message,
        createdBy
      });
      
      throw error;
    }
  }

  /**
   * 企業更新
   */
  async updateCompany(id: ID, updateData: CompanyUpdate, updatedBy: ID): Promise<Company | null> {
    console.log(`🏢 企業更新開始: ${id}`);

    try {
      // 既存企業の確認
      const existingCompany = await CompanyModel.getCompanyById(id);
      if (!existingCompany) {
        throw new Error('更新対象の企業が見つかりません');
      }

      // 入力バリデーション（部分更新のため、定義されたフィールドのみ）
      const validation = validateCompanyUpdate(updateData);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).flat();
        throw new Error(`入力データが無効です: ${errorMessages.join(', ')}`);
      }

      // 企業名の重複チェック（名前が変更される場合）
      if (updateData.name && updateData.name !== existingCompany.name) {
        const existingCompanies = await CompanyModel.searchCompanies({
          query: updateData.name,
          page: 1,
          limit: 1
        });

        const duplicateCompany = existingCompanies.companies.find(
          c => c.name.toLowerCase() === updateData.name!.toLowerCase() && c.id !== id
        );

        if (duplicateCompany) {
          throw new Error(`企業名「${updateData.name}」は既に登録されています`);
        }
      }

      // ステータス変更の妥当性チェック
      if (updateData.status && updateData.status !== existingCompany.status) {
        this.validateStatusTransition(existingCompany.status, updateData.status);
      }

      // 企業更新
      const updatedCompany = await CompanyModel.updateCompany(id, updateData);

      if (!updatedCompany) {
        throw new Error('企業の更新に失敗しました');
      }

      // 企業更新の監査ログ
      // await auditLogger.log(
      console.log('📝 Audit log:','COMPANY_UPDATED', {
        companyId: updatedCompany.id,
        companyName: updatedCompany.name,
        changes: updateData,
        previousStatus: existingCompany.status,
        newStatus: updatedCompany.status,
        updatedBy
      });

      // ステータス変更時の追加ログ
      if (updateData.status && updateData.status !== existingCompany.status) {
        // await auditLogger.log(
      console.log('📝 Audit log:','COMPANY_STATUS_CHANGED', {
          companyId: updatedCompany.id,
          companyName: updatedCompany.name,
          fromStatus: existingCompany.status,
          toStatus: updatedCompany.status,
          updatedBy
        });
      }

      console.log(`✅ 企業更新完了: ${updatedCompany.name}`);
      return updatedCompany;
      
    } catch (error) {
      console.error('❌ 企業更新に失敗しました:', error);
      
      // エラーの監査ログ
      // await auditLogger.log(
      console.log('📝 Audit log:','COMPANY_UPDATE_ERROR', {
        companyId: id,
        error: error.message,
        updatedBy
      });
      
      throw error;
    }
  }

  /**
   * 企業削除（ソフトデリート）
   */
  async deleteCompany(id: ID, deletedBy: ID): Promise<boolean> {
    console.log(`🏢 企業削除開始: ${id}`);

    try {
      // 既存企業の確認
      const existingCompany = await CompanyModel.getCompanyById(id);
      if (!existingCompany) {
        throw new Error('削除対象の企業が見つかりません');
      }

      // 既にinactiveの場合はエラー
      if (existingCompany.status === CompanyStatus.INACTIVE) {
        throw new Error('この企業は既に削除されています');
      }

      // 関連データのチェック（契約、TODO等がある場合は警告）
      // TODO: 実際の運用では関連データの確認が必要

      const success = await CompanyModel.deleteCompany(id);

      if (success) {
        // 企業削除の監査ログ
        // await auditLogger.log(
      console.log('📝 Audit log:','COMPANY_DELETED', {
          companyId: existingCompany.id,
          companyName: existingCompany.name,
          previousStatus: existingCompany.status,
          deletedBy
        });

        console.log(`✅ 企業削除完了: ${existingCompany.name}`);
      }

      return success;
      
    } catch (error) {
      console.error('❌ 企業削除に失敗しました:', error);
      
      // エラーの監査ログ
      // await auditLogger.log(
      console.log('📝 Audit log:','COMPANY_DELETE_ERROR', {
        companyId: id,
        error: error.message,
        deletedBy
      });
      
      throw error;
    }
  }

  /**
   * 企業統計情報取得
   */
  async getCompanyStats(): Promise<{
    total: number;
    byStatus: Record<CompanyStatus, number>;
    bySize: Record<string, number>;
    byIndustry: Record<string, number>;
    recentlyAdded: number;
    followUpRequired: number;
  }> {
    console.log('📊 企業統計情報取得開始');

    try {
      const stats = await CompanyModel.getCompanyStats();
      
      // 統計情報取得の監査ログ
      // await auditLogger.log(
      console.log('📝 Audit log:','COMPANY_STATS_ACCESSED', {
        totalCompanies: stats.total,
        timestamp: new Date()
      });

      console.log('✅ 企業統計情報取得完了:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ 企業統計情報取得に失敗しました:', error);
      throw error;
    }
  }

  /**
   * 企業担当者変更
   */
  async assignCompany(
    companyId: ID, 
    primaryAssigneeId: ID, 
    secondaryAssigneeIds: ID[] = [],
    assignedBy: ID
  ): Promise<boolean> {
    console.log(`👥 企業担当者変更開始: ${companyId}`);

    try {
      // 既存企業の確認
      const existingCompany = await CompanyModel.getCompanyById(companyId);
      if (!existingCompany) {
        throw new Error('担当者変更対象の企業が見つかりません');
      }

      // 入力バリデーション
      const validation = validateCompanyAssignment({
        primaryAssigneeId,
        secondaryAssigneeIds
      });
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).flat();
        throw new Error(`入力データが無効です: ${errorMessages.join(', ')}`);
      }

      // 副担当者の重複を排除
      const uniqueSecondaryIds = [...new Set(secondaryAssigneeIds)];

      const success = await CompanyModel.assignCompany(companyId, primaryAssigneeId, uniqueSecondaryIds);

      if (success) {
        // 担当者変更の監査ログ
        // await auditLogger.log(
      console.log('📝 Audit log:','COMPANY_ASSIGNED', {
          companyId,
          companyName: existingCompany.name,
          previousPrimaryAssignee: existingCompany.primaryAssigneeId,
          newPrimaryAssignee: primaryAssigneeId,
          previousSecondaryAssignees: existingCompany.secondaryAssigneeIds || [],
          newSecondaryAssignees: uniqueSecondaryIds,
          assignedBy
        });

        console.log(`✅ 企業担当者変更完了: ${existingCompany.name}`);
      }

      return success;
      
    } catch (error) {
      console.error('❌ 企業担当者変更に失敗しました:', error);
      
      // エラーの監査ログ
      // await auditLogger.log(
      console.log('📝 Audit log:','COMPANY_ASSIGN_ERROR', {
        companyId,
        error: error.message,
        assignedBy
      });
      
      throw error;
    }
  }

  /**
   * 企業の連絡先一覧取得
   */
  async getCompanyContacts(companyId: ID): Promise<Contact[]> {
    console.log(`📞 企業連絡先一覧取得開始: ${companyId}`);

    try {
      // 企業の存在確認
      const company = await CompanyModel.getCompanyById(companyId);
      if (!company) {
        throw new Error('指定された企業が見つかりません');
      }

      const contacts = await ContactModel.getContactsByCompanyId(companyId);

      console.log(`✅ 企業連絡先一覧取得完了: ${contacts.length}件`);
      return contacts;
      
    } catch (error) {
      console.error('❌ 企業連絡先一覧取得に失敗しました:', error);
      throw error;
    }
  }

  /**
   * 連絡先作成
   */
  async createContact(contactData: ContactCreate, createdBy: ID): Promise<Contact> {
    console.log('📞 連絡先作成開始:', contactData.name);

    try {
      // 企業の存在確認
      const company = await CompanyModel.getCompanyById(contactData.companyId);
      if (!company) {
        throw new Error('指定された企業が見つかりません');
      }

      // 入力バリデーション
      const validation = validateContactCreate(contactData);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).flat();
        throw new Error(`入力データが無効です: ${errorMessages.join(', ')}`);
      }

      // メールアドレスの重複チェック（同一企業内）
      if (contactData.email) {
        const existingContacts = await ContactModel.getContactsByCompanyId(contactData.companyId);
        const duplicateContact = existingContacts.find(
          c => c.email && c.email.toLowerCase() === contactData.email!.toLowerCase()
        );

        if (duplicateContact) {
          throw new Error(`メールアドレス「${contactData.email}」は既に同一企業内で登録されています`);
        }
      }

      const contact = await ContactModel.createContact(contactData);

      // 連絡先作成の監査ログ
      // await auditLogger.log(
      console.log('📝 Audit log:','CONTACT_CREATED', {
        contactId: contact.id,
        contactName: contact.name,
        companyId: contact.companyId,
        companyName: company.name,
        contactType: contact.type,
        createdBy
      });

      console.log(`✅ 連絡先作成完了: ${contact.name} (${contact.id})`);
      return contact;
      
    } catch (error) {
      console.error('❌ 連絡先作成に失敗しました:', error);
      
      // エラーの監査ログ
      // await auditLogger.log(
      console.log('📝 Audit log:','CONTACT_CREATE_ERROR', {
        contactName: contactData.name,
        companyId: contactData.companyId,
        error: error.message,
        createdBy
      });
      
      throw error;
    }
  }

  /**
   * 連絡先更新
   */
  async updateContact(id: ID, updateData: ContactUpdate, updatedBy: ID): Promise<Contact | null> {
    console.log(`📞 連絡先更新開始: ${id}`);

    try {
      // 既存連絡先の確認
      const existingContact = await ContactModel.getContactById(id);
      if (!existingContact) {
        throw new Error('更新対象の連絡先が見つかりません');
      }

      // 入力バリデーション（部分更新のため、定義されたフィールドのみ）
      const validation = validateContactUpdate(updateData);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).flat();
        throw new Error(`入力データが無効です: ${errorMessages.join(', ')}`);
      }

      // メールアドレスの重複チェック（メールが変更される場合）
      if (updateData.email && updateData.email !== existingContact.email) {
        const existingContacts = await ContactModel.getContactsByCompanyId(existingContact.companyId);
        const duplicateContact = existingContacts.find(
          c => c.email && c.email.toLowerCase() === updateData.email!.toLowerCase() && c.id !== id
        );

        if (duplicateContact) {
          throw new Error(`メールアドレス「${updateData.email}」は既に同一企業内で登録されています`);
        }
      }

      const updatedContact = await ContactModel.updateContact(id, updateData);

      if (!updatedContact) {
        throw new Error('連絡先の更新に失敗しました');
      }

      // 連絡先更新の監査ログ
      // await auditLogger.log(
      console.log('📝 Audit log:','CONTACT_UPDATED', {
        contactId: updatedContact.id,
        contactName: updatedContact.name,
        companyId: updatedContact.companyId,
        changes: updateData,
        updatedBy
      });

      console.log(`✅ 連絡先更新完了: ${updatedContact.name}`);
      return updatedContact;
      
    } catch (error) {
      console.error('❌ 連絡先更新に失敗しました:', error);
      
      // エラーの監査ログ
      // await auditLogger.log(
      console.log('📝 Audit log:','CONTACT_UPDATE_ERROR', {
        contactId: id,
        error: error.message,
        updatedBy
      });
      
      throw error;
    }
  }

  /**
   * 連絡先削除（ソフトデリート）
   */
  async deleteContact(id: ID, deletedBy: ID): Promise<boolean> {
    console.log(`📞 連絡先削除開始: ${id}`);

    try {
      // 既存連絡先の確認
      const existingContact = await ContactModel.getContactById(id);
      if (!existingContact) {
        throw new Error('削除対象の連絡先が見つかりません');
      }

      if (!existingContact.isActive) {
        throw new Error('この連絡先は既に削除されています');
      }

      const success = await ContactModel.deleteContact(id);

      if (success) {
        // 連絡先削除の監査ログ
        // await auditLogger.log(
      console.log('📝 Audit log:','CONTACT_DELETED', {
          contactId: existingContact.id,
          contactName: existingContact.name,
          companyId: existingContact.companyId,
          deletedBy
        });

        console.log(`✅ 連絡先削除完了: ${existingContact.name}`);
      }

      return success;
      
    } catch (error) {
      console.error('❌ 連絡先削除に失敗しました:', error);
      
      // エラーの監査ログ
      // await auditLogger.log(
      console.log('📝 Audit log:','CONTACT_DELETE_ERROR', {
        contactId: id,
        error: error.message,
        deletedBy
      });
      
      throw error;
    }
  }

  /**
   * 企業データのバリデーション
   */
  private validateCompanyData(data: CompanyCreate): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('企業名は必須です');
    }

    if (data.name.length > 255) {
      throw new Error('企業名は255文字以内で入力してください');
    }

    if (!data.industry || data.industry.trim().length === 0) {
      throw new Error('業界は必須です');
    }

    if (!data.status) {
      throw new Error('ステータスは必須です');
    }

    if (!Object.values(CompanyStatus).includes(data.status)) {
      throw new Error('無効なステータスです');
    }

    if (!data.size) {
      throw new Error('企業規模は必須です');
    }

    if (!data.primaryAssigneeId) {
      throw new Error('主担当者は必須です');
    }

    // 従業員数の妥当性チェック
    if (data.employeeCount !== undefined && (data.employeeCount < 0 || data.employeeCount > 1000000)) {
      throw new Error('従業員数は0から1,000,000の間で入力してください');
    }

    // 資本金の妥当性チェック
    if (data.capital !== undefined && data.capital < 0) {
      throw new Error('資本金は0以上で入力してください');
    }

    // 設立年の妥当性チェック
    if (data.establishedYear !== undefined) {
      const currentYear = new Date().getFullYear();
      if (data.establishedYear < 1800 || data.establishedYear > currentYear) {
        throw new Error(`設立年は1800年から${currentYear}年の間で入力してください`);
      }
    }

    // メールアドレスの形式チェック（websiteがメール形式で入力された場合のチェック）
    if (data.website && data.website.includes('@')) {
      throw new Error('ウェブサイトにはURLを入力してください');
    }
  }

  /**
   * 連絡先データのバリデーション
   */
  private validateContactData(data: ContactCreate): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('連絡先名は必須です');
    }

    if (data.name.length > 255) {
      throw new Error('連絡先名は255文字以内で入力してください');
    }

    if (!data.companyId) {
      throw new Error('企業IDは必須です');
    }

    if (!data.type) {
      throw new Error('連絡先タイプは必須です');
    }

    // メールアドレスの形式チェック
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('有効なメールアドレスを入力してください');
      }
    }

    // 電話番号の形式チェック（基本的な形式のみ）
    if (data.phone) {
      const phoneRegex = /^[\d\-\(\)\+\s]+$/;
      if (!phoneRegex.test(data.phone)) {
        throw new Error('有効な電話番号を入力してください');
      }
    }

    if (data.mobile) {
      const phoneRegex = /^[\d\-\(\)\+\s]+$/;
      if (!phoneRegex.test(data.mobile)) {
        throw new Error('有効な携帯電話番号を入力してください');
      }
    }
  }

  /**
   * ステータス遷移の妥当性チェック
   */
  private validateStatusTransition(fromStatus: CompanyStatus, toStatus: CompanyStatus): void {
    // 現在は全ての遷移を許可するが、将来的に制限を加える可能性がある
    const allowedTransitions: Record<CompanyStatus, CompanyStatus[]> = {
      [CompanyStatus.LEAD]: [CompanyStatus.PROSPECT, CompanyStatus.INACTIVE],
      [CompanyStatus.PROSPECT]: [CompanyStatus.ACTIVE_CUSTOMER, CompanyStatus.LEAD, CompanyStatus.INACTIVE],
      [CompanyStatus.ACTIVE_CUSTOMER]: [CompanyStatus.INACTIVE],
      [CompanyStatus.INACTIVE]: [CompanyStatus.LEAD, CompanyStatus.PROSPECT, CompanyStatus.ACTIVE_CUSTOMER]
    };

    if (!allowedTransitions[fromStatus].includes(toStatus)) {
      throw new Error(`ステータス「${fromStatus}」から「${toStatus}」への変更はできません`);
    }
  }
}

// シングルトンインスタンス
export const companyService = new CompanyService();