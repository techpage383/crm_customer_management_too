/**
 * ユニークデータ生成ファクトリー
 * ★9統合テスト成功請負人用のテストデータ分離ユーティリティ
 */

/**
 * ユニークデータ生成クラス
 */
class UniqueDataFactory {
  constructor() {
    this.counters = new Map();
    this.prefixes = new Map();
  }

  /**
   * ユニークID生成（タイムスタンプ + ランダム文字列）
   */
  generateUniqueId(prefix = '') {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    return `${prefix}${timestamp}-${randomStr}`;
  }

  /**
   * ユニークメールアドレス生成
   */
  generateUniqueEmail(domain = 'test.com', prefix = 'user') {
    const uniqueId = this.generateUniqueId();
    return `${prefix}-${uniqueId}@${domain}`;
  }

  /**
   * ユニークユーザー名生成
   */
  generateUniqueUsername(prefix = 'testuser') {
    const uniqueId = this.generateUniqueId().replace('-', '');
    return `${prefix}${uniqueId}`;
  }

  /**
   * シーケンシャルカウンター付きユニークID
   */
  generateSequentialId(category = 'default') {
    const current = this.counters.get(category) || 0;
    const next = current + 1;
    this.counters.set(category, next);
    
    const timestamp = Date.now();
    return `${category}-${timestamp}-${String(next).padStart(4, '0')}`;
  }

  /**
   * テスト用企業データ生成
   */
  generateUniqueCompanyData(overrides = {}) {
    const uniqueId = this.generateUniqueId();
    
    return {
      name: `テスト会社${uniqueId}`,
      nameKana: `テストカイシャ${uniqueId}`,
      industry: 'IT',
      status: 'prospect',
      size: 'medium',
      employeeCount: Math.floor(Math.random() * 1000) + 10,
      capital: Math.floor(Math.random() * 100000000) + 1000000,
      establishedYear: 2000 + Math.floor(Math.random() * 23),
      description: `これはテスト用の企業データです (${uniqueId})`,
      website: `https://test-company-${uniqueId}.example.com`,
      phone: `03-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      address: {
        prefecture: '東京都',
        city: '渋谷区',
        address1: `テスト町${Math.floor(Math.random() * 999) + 1}-${Math.floor(Math.random() * 99) + 1}`,
        postalCode: `${Math.floor(Math.random() * 900) + 100}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      },
      tags: [`test-${uniqueId}`, 'integration-test'],
      ...overrides
    };
  }

  /**
   * テスト用ユーザーデータ生成
   */
  generateUniqueUserData(overrides = {}) {
    const uniqueId = this.generateUniqueId();
    
    return {
      email: this.generateUniqueEmail(),
      username: this.generateUniqueUsername(),
      fullName: `テストユーザー ${uniqueId}`,
      password: 'TestPassword123!',
      role: 'user',
      isActive: true,
      department: `テスト部署${Math.floor(Math.random() * 10) + 1}`,
      phoneNumber: `090-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      gmailPersonalConnected: false,
      ...overrides
    };
  }

  /**
   * テスト用TODOデータ生成
   */
  generateUniqueTodoData(overrides = {}) {
    const uniqueId = this.generateUniqueId();
    
    return {
      title: `テストTODO ${uniqueId}`,
      description: `これはテスト用のTODOです。ユニークID: ${uniqueId}`,
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
      source: 'manual',
      isInternal: false,
      isApproved: true,
      tags: [`test-${uniqueId}`, 'integration-test'],
      estimatedHours: Math.floor(Math.random() * 8) + 1,
      ...overrides
    };
  }

  /**
   * テスト用商材データ生成
   */
  generateUniqueProductData(overrides = {}) {
    const uniqueId = this.generateUniqueId();
    
    return {
      name: `テスト商材 ${uniqueId}`,
      code: `TEST-PROD-${uniqueId.toUpperCase()}`,
      category: 'software',
      description: `これはテスト用の商材です (${uniqueId})`,
      price: Math.floor(Math.random() * 100000) + 1000,
      priceType: 'monthly',
      isActive: true,
      features: [
        `機能A-${uniqueId}`,
        `機能B-${uniqueId}`,
        `機能C-${uniqueId}`
      ],
      tags: [`test-${uniqueId}`, 'integration-test'],
      ...overrides
    };
  }

  /**
   * ランダム日付生成
   */
  generateRandomDate(daysFromNow = 0, rangeDays = 30) {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + daysFromNow);
    
    const randomDays = Math.floor(Math.random() * rangeDays) - Math.floor(rangeDays / 2);
    baseDate.setDate(baseDate.getDate() + randomDays);
    
    return baseDate;
  }

  /**
   * ランダム選択
   */
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * バルクテストデータ生成
   */
  generateBulkData(dataType, count, overrides = {}) {
    const generators = {
      user: this.generateUniqueUserData.bind(this),
      company: this.generateUniqueCompanyData.bind(this),
      todo: this.generateUniqueTodoData.bind(this),
      product: this.generateUniqueProductData.bind(this)
    };

    const generator = generators[dataType];
    if (!generator) {
      throw new Error(`未対応のデータタイプ: ${dataType}`);
    }

    const results = [];
    for (let i = 0; i < count; i++) {
      const indexOverrides = typeof overrides === 'function' ? overrides(i) : overrides;
      results.push(generator(indexOverrides));
    }

    console.log(`📦 バルクデータ生成完了: ${dataType} x ${count}`);
    return results;
  }

  /**
   * テストセッションIDの生成
   */
  generateTestSessionId() {
    return `test-session-${this.generateUniqueId()}`;
  }

  /**
   * カウンターリセット
   */
  resetCounters() {
    this.counters.clear();
    console.log('🔄 UniqueDataFactory カウンターリセット完了');
  }

  /**
   * プレフィックス設定
   */
  setPrefix(category, prefix) {
    this.prefixes.set(category, prefix);
  }

  /**
   * プレフィックス取得
   */
  getPrefix(category) {
    return this.prefixes.get(category) || category;
  }
}

// シングルトンインスタンス
const uniqueDataFactory = new UniqueDataFactory();

/**
 * レガシーサポート用のgenerateUniqueData関数
 */
function generateUniqueData() {
  return {
    id: uniqueDataFactory.generateUniqueId()
  };
}

module.exports = {
  UniqueDataFactory,
  uniqueDataFactory,
  generateUniqueData
};