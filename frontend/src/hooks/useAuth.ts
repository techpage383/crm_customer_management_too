/**
 * 認証フック
 * 認証関連の操作とユーティリティ関数を提供
 */

import { useCallback, useMemo } from 'react';
import { useAuth as useAuthContext } from '../contexts/AuthContext';
import { UserRole, isUpperRole } from '../types/index';

/**
 * 拡張認証フック
 * 基本的な認証機能に加えて、権限チェックやユーティリティ関数を提供
 */
export function useAuth() {
  const authContext = useAuthContext();

  /**
   * 権限チェック関数
   */
  const hasRole = useCallback((role: UserRole): boolean => {
    return authContext.user?.role === role;
  }, [authContext.user]);

  /**
   * 上位権限チェック
   */
  const hasUpperRole = useCallback((): boolean => {
    return authContext.user ? isUpperRole(authContext.user.role) : false;
  }, [authContext.user]);

  /**
   * 特定の権限以上をチェック
   */
  const hasRoleOrAbove = useCallback((minRole: UserRole): boolean => {
    if (!authContext.user) return false;

    const roleHierarchy = {
      [UserRole.USER]: 1,
      [UserRole.TEAM_LEADER]: 2,
      [UserRole.MANAGER]: 3,
      [UserRole.COMPANY_LEADER]: 4
    };

    const userLevel = roleHierarchy[authContext.user.role];
    const minLevel = roleHierarchy[minRole];

    return userLevel >= minLevel;
  }, [authContext.user]);

  /**
   * 複数ロールのいずれかをチェック
   */
  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return authContext.user ? roles.includes(authContext.user.role) : false;
  }, [authContext.user]);

  /**
   * Gmail連携状態チェック
   */
  const hasGmailAccess = useCallback((): boolean => {
    return authContext.user?.gmailPersonalConnected === true;
  }, [authContext.user]);

  /**
   * ユーザー表示名取得
   */
  const getDisplayName = useCallback((): string => {
    if (!authContext.user) return 'ゲスト';
    return authContext.user.fullName || authContext.user.username || authContext.user.email;
  }, [authContext.user]);

  /**
   * ユーザーアバター文字取得
   */
  const getAvatarInitials = useCallback((): string => {
    const displayName = getDisplayName();
    if (displayName === 'ゲスト') return 'G';
    
    // 日本語名の場合は姓名の最初の文字
    const nameParts = displayName.split(' ');
    if (nameParts.length >= 2) {
      return nameParts[0].charAt(0) + nameParts[1].charAt(0);
    }
    
    // 単一名または英語名の場合
    return displayName.charAt(0).toUpperCase();
  }, [getDisplayName]);

  /**
   * ロール表示名取得
   */
  const getRoleDisplayName = useCallback((role?: UserRole): string => {
    const targetRole = role || authContext.user?.role;
    
    switch (targetRole) {
      case UserRole.COMPANY_LEADER:
        return '会社代表';
      case UserRole.MANAGER:
        return 'マネージャー';
      case UserRole.TEAM_LEADER:
        return 'チームリーダー';
      case UserRole.USER:
        return '一般ユーザー';
      default:
        return '不明';
    }
  }, [authContext.user]);

  /**
   * リダイレクトURL取得
   */
  const getRedirectUrl = useCallback((): string => {
    if (!authContext.user) return '/login';

    switch (authContext.user.role) {
      case UserRole.COMPANY_LEADER:
      case UserRole.MANAGER:
        return '/admin/dashboard';
      case UserRole.TEAM_LEADER:
      case UserRole.USER:
        return '/user/dashboard';
      default:
        return '/dashboard';
    }
  }, [authContext.user]);

  /**
   * セッション有効期限チェック
   */
  const isSessionNearExpiry = useCallback((): boolean => {
    // 実装はトークンのexpを解析して判断
    // ここではモック実装
    return false;
  }, []);

  /**
   * 安全なログアウト（確認付き）
   */
  const safeLogout = useCallback(async (): Promise<void> => {
    const confirmed = window.confirm('ログアウトしますか？');
    if (confirmed) {
      await authContext.logout();
    }
  }, [authContext.logout]);

  /**
   * メモ化された計算値
   */
  const computedValues = useMemo(() => ({
    displayName: getDisplayName(),
    avatarInitials: getAvatarInitials(),
    roleDisplayName: getRoleDisplayName(),
    redirectUrl: getRedirectUrl(),
    isAdmin: hasRole(UserRole.COMPANY_LEADER),
    isManager: hasRole(UserRole.MANAGER) || hasRole(UserRole.COMPANY_LEADER),
    isTeamLeader: hasRole(UserRole.TEAM_LEADER),
    isUpperRole: hasUpperRole(),
    hasGmailAccess: hasGmailAccess()
  }), [
    getDisplayName,
    getAvatarInitials,
    getRoleDisplayName,
    getRedirectUrl,
    hasRole,
    hasUpperRole,
    hasGmailAccess
  ]);

  // 基本的な認証コンテキストに拡張機能を追加して返す
  return {
    ...authContext,
    // 権限チェック
    hasRole,
    hasUpperRole,
    hasRoleOrAbove,
    hasAnyRole,
    // ユーティリティ
    getDisplayName,
    getAvatarInitials,
    getRoleDisplayName,
    getRedirectUrl,
    isSessionNearExpiry,
    safeLogout,
    // 計算値
    ...computedValues
  };
}

/**
 * 認証が必要なページ用のフック
 */
export function useRequireAuth() {
  const auth = useAuth();

  // 認証チェックはAuthContextで実行済み
  return auth;
}

/**
 * 特定の権限が必要なページ用のフック
 */
export function useRequireRole(requiredRole: UserRole | UserRole[]) {
  const auth = useAuth();

  const hasRequiredRole = useMemo(() => {
    if (!auth.isAuthenticated || !auth.user) return false;

    if (Array.isArray(requiredRole)) {
      return auth.hasAnyRole(requiredRole);
    } else {
      return auth.hasRole(requiredRole);
    }
  }, [auth, requiredRole]);

  // 権限がない場合の処理（実際のアプリケーションでは403ページにリダイレクト等）
  if (auth.isAuthenticated && !hasRequiredRole) {
    console.warn('🚫 Insufficient permissions for this page');
  }

  return {
    ...auth,
    hasRequiredRole
  };
}

/**
 * 上位権限が必要なページ用のフック
 */
export function useRequireUpperRole() {
  return useRequireRole([
    UserRole.COMPANY_LEADER,
    UserRole.MANAGER,
    UserRole.TEAM_LEADER
  ]);
}