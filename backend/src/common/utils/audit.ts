import { AuditActionType } from '../../types/index.js';
import { DatabaseService } from './database.js';

export interface AuditLogEntry {
  userId: string;
  actionType: AuditActionType;
  action: string;
  entityType: string;
  entityId: string;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    riskScore?: number;
    [key: string]: any;
  };
}

/**
 * 監査ログサービス
 */
export class AuditService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * 監査ログを記録
   */
  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      const auditLog = {
        ...entry,
        timestamp: new Date(),
        id: this.generateAuditId()
      };

      console.log('Audit log:', auditLog);
      
      // 実際の実装ではデータベースに保存
      // await this.databaseService.insertAuditLog(auditLog);
      
      // 高リスクアクションの場合は即座にアラート
      if (this.isHighRiskAction(entry)) {
        await this.sendSecurityAlert(auditLog);
      }
      
    } catch (error) {
      console.error('Failed to log audit action:', error);
      // 監査ログの失敗は致命的ではないが、エラーログは残す
    }
  }

  /**
   * 高リスクアクション判定
   */
  private isHighRiskAction(entry: AuditLogEntry): boolean {
    const highRiskActions = [
      AuditActionType.LOGIN_FAILED,
      AuditActionType.ROLE_CHANGED,
      AuditActionType.DATA_EXPORTED,
      AuditActionType.BULK_OPERATION
    ];

    return highRiskActions.includes(entry.actionType) ||
           (entry.metadata?.riskScore && entry.metadata.riskScore > 8);
  }

  /**
   * セキュリティアラート送信
   */
  private async sendSecurityAlert(auditLog: any): Promise<void> {
    console.warn('Security alert:', {
      action: auditLog.action,
      userId: auditLog.userId,
      timestamp: auditLog.timestamp,
      metadata: auditLog.metadata
    });
    
    // 実際の実装では管理者へのメール通知、Slack通知等
  }

  /**
   * 監査ID生成
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}