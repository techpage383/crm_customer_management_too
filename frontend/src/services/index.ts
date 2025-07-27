/**
 * サービス統合層
 * モック/実API切り替え管理の中心
 */

import { getMockAuthService } from './mock/auth.service';
import { apiAuthService } from './api/auth.service';

/**
 * 🔥 重要: @MARKシステム
 * Phase 2B時に以下の手順で実APIに切り替える：
 * 1. grep -r "@MOCK_TO_API" src/ で対象箇所特定
 * 2. モック呼び出しを実API呼び出しに置き換え
 * 3. この authService を実API版に変更
 */

// 🔥 Phase 2B: 実API実装
// 環境変数による切り替え: REACT_APP_USE_MOCK_API=true でモック使用
const USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API === 'true';

export const authService = USE_MOCK_API ? getMockAuthService() : apiAuthService;

console.log(`🔧 Auth Service Mode: ${USE_MOCK_API ? 'MOCK' : 'API'} (REACT_APP_USE_MOCK_API=${process.env.REACT_APP_USE_MOCK_API})`);

// 他の機能はまだモック（段階的切り替え）
// export const companyService = getMockCompanyService();  // ← まだモック
// export const todoService = getMockTodoService();        // ← まだモック

/**
 * モック使用状態表示用フラグ
 */
export const SERVICE_STATUS = {
  auth: USE_MOCK_API ? 'MOCK' : 'API',  // ← Phase 2B: 環境変数による動的切り替え
  company: 'MOCK',     // ← 将来的に 'API' に変更
  todo: 'MOCK',        // ← 将来的に 'API' に変更
  gmail: 'MOCK',       // ← 将来的に 'API' に変更
  product: 'MOCK',     // ← 将来的に 'API' に変更
  contract: 'MOCK',    // ← 将来的に 'API' に変更
  proposal: 'MOCK'     // ← 将来的に 'API' に変更
};

/**
 * 開発用: 現在のサービス状態確認
 */
export function getServiceStatus() {
  return {
    ...SERVICE_STATUS,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };
}

/**
 * 開発用: モック状態表示
 */
export function logServiceStatus() {
  const status = getServiceStatus();
  console.log('🔧 Service Status:', status);
  
  const mockServices = Object.entries(status)
    .filter(([key, value]) => key !== 'environment' && key !== 'timestamp' && value === 'MOCK')
    .map(([key]) => key);
    
  if (mockServices.length > 0) {
    console.log('🎭 Mock Services Active:', mockServices.join(', '));
  }
}