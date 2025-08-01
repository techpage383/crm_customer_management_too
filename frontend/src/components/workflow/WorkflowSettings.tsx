import React, { useState, useEffect } from 'react';
import {
  WorkflowTemplate,
  WorkflowType,
  WorkflowSettings as IWorkflowSettings,
  WorkflowStatus,
  UserRole,
  TodoStatus
} from '../../types';
import { workflowApiService } from '../../services/api/workflow.service';
import { useAuth } from '../../hooks/useAuth';

interface WorkflowSettingsProps {
  className?: string;
  onSettingsChange?: (settings: IWorkflowSettings) => void;
}

/**
 * ワークフロー設定管理画面
 * モックアップ: workflow-master.html の機能実装
 */
export const WorkflowSettings: React.FC<WorkflowSettingsProps> = ({ 
  className, 
  onSettingsChange 
}) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<IWorkflowSettings | null>(null);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [customStatuses, setCustomStatuses] = useState<WorkflowStatus[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'templates' | 'statuses' | 'permissions'>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // 新しいテンプレート作成用フォーム
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: WorkflowType.CUSTOM,
    columns: [] as any[]
  });

  // 新しいカスタムステータス作成用フォーム
  const [newStatus, setNewStatus] = useState({
    name: '',
    displayName: '',
    description: '',
    color: '#2196F3',
    textColor: '#FFFFFF',
    icon: '',
    scope: 'PERSONAL' as 'PERSONAL' | 'TEAM' | 'COMPANY'
  });

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [settingsData, templatesData, statusesData] = await Promise.all([
        workflowApiService.getWorkflowSettings(),
        workflowApiService.getWorkflowTemplates({ isActive: true }),
        workflowApiService.getCustomStatuses()
      ]);

      setSettings(settingsData.data || null);
      setTemplates((templatesData.data as any)?.data || []);
      setCustomStatuses((statusesData as any)?.data || []);
    } catch (err: any) {
      setError(err.message || 'ワークフロー設定の読み込みに失敗しました');
      console.error('Failed to load workflow data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (updates: Partial<IWorkflowSettings>) => {
    if (!settings) return;

    try {
      const updatedSettings = { ...settings, ...updates };
      const result = await workflowApiService.updateWorkflowSettings(updatedSettings);
      
      const newSettings = result.data || null;
      setSettings(newSettings);
      setIsDirty(false);
      if (newSettings) {
        onSettingsChange?.(newSettings);
      }
      
      // 成功通知
      (window as any).M?.toast({ html: '設定を保存しました', classes: 'green' });
    } catch (err: any) {
      setError(err.message || '設定の保存に失敗しました');
      (window as any).M?.toast({ html: '設定の保存に失敗しました', classes: 'red' });
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      (window as any).M?.toast({ html: 'テンプレート名を入力してください', classes: 'orange' });
      return;
    }

    try {
      const created = await workflowApiService.createWorkflowTemplate({
        name: newTemplate.name,
        description: newTemplate.description,
        type: newTemplate.type,
        columns: newTemplate.columns,
        isActive: true
      });

      setTemplates(prev => [...prev, (created as any)?.data || created]);
      setNewTemplate({
        name: '',
        description: '',
        type: WorkflowType.CUSTOM,
        columns: []
      });

      (window as any).M?.toast({ html: 'ワークフローテンプレートを作成しました', classes: 'green' });
    } catch (err: any) {
      setError(err.message || 'テンプレートの作成に失敗しました');
      (window as any).M?.toast({ html: 'テンプレートの作成に失敗しました', classes: 'red' });
    }
  };

  const handleCreateCustomStatus = async () => {
    if (!newStatus.name.trim() || !newStatus.displayName.trim()) {
      (window as any).M?.toast({ html: 'ステータス名と表示名を入力してください', classes: 'orange' });
      return;
    }

    try {
      const created = await workflowApiService.createCustomStatus(newStatus);
      setCustomStatuses(prev => [...prev, (created as any)?.data || created]);
      setNewStatus({
        name: '',
        displayName: '',
        description: '',
        color: '#2196F3',
        textColor: '#FFFFFF',
        icon: '',
        scope: 'PERSONAL'
      });

      (window as any).M?.toast({ html: 'カスタムステータスを作成しました', classes: 'green' });
    } catch (err: any) {
      setError(err.message || 'カスタムステータスの作成に失敗しました');
      (window as any).M?.toast({ html: 'カスタムステータスの作成に失敗しました', classes: 'red' });
    }
  };

  const addColumnToNewTemplate = () => {
    const newColumn = {
      id: `col-${Date.now()}`,
      name: '新しいカラム',
      statusValue: TodoStatus.PENDING,
      color: '#E3F2FD',
      textColor: '#1976D2',
      order: newTemplate.columns.length,
      isDefault: false
    };

    setNewTemplate(prev => ({
      ...prev,
      columns: [...prev.columns, newColumn]
    }));
  };

  if (loading && !settings) {
    return (
      <div className={className}>
        <div className="center-align" style={{ padding: '40px' }}>
          <div className="preloader-wrapper big active">
            <div className="spinner-layer spinner-blue-only">
              <div className="circle-clipper left">
                <div className="circle"></div>
              </div>
              <div className="gap-patch">
                <div className="circle"></div>
              </div>
              <div className="circle-clipper right">
                <div className="circle"></div>
              </div>
            </div>
          </div>
          <p>ワークフロー設定を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`workflow-settings ${className || ''}`}>
      {/* エラー表示 */}
      {error && (
        <div className="card-panel red lighten-4">
          <span className="red-text text-darken-2">
            <i className="material-icons left">error</i>
            {error}
          </span>
          <button 
            className="btn-flat red-text right"
            onClick={() => setError(null)}
          >
            <i className="material-icons">close</i>
          </button>
        </div>
      )}

      {/* タブナビゲーション */}
      <div className="row">
        <div className="col s12">
          <ul className="tabs">
            <li className="tab col s3">
              <a 
                href="#general" 
                className={activeTab === 'general' ? 'active' : ''}
                onClick={() => setActiveTab('general')}
              >
                <i className="material-icons left">settings</i>
                基本設定
              </a>
            </li>
            <li className="tab col s3">
              <a 
                href="#templates" 
                className={activeTab === 'templates' ? 'active' : ''}
                onClick={() => setActiveTab('templates')}
              >
                <i className="material-icons left">view_column</i>
                テンプレート
              </a>
            </li>
            <li className="tab col s3">
              <a 
                href="#statuses" 
                className={activeTab === 'statuses' ? 'active' : ''}
                onClick={() => setActiveTab('statuses')}
              >
                <i className="material-icons left">label</i>
                ステータス
              </a>
            </li>
            {user?.role && ['company_leader', 'manager'].includes(user.role) && (
              <li className="tab col s3">
                <a 
                  href="#permissions" 
                  className={activeTab === 'permissions' ? 'active' : ''}
                  onClick={() => setActiveTab('permissions')}
                >
                  <i className="material-icons left">security</i>
                  権限管理
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* 基本設定タブ */}
      {activeTab === 'general' && settings && (
        <div className="row">
          <div className="col s12">
            <div className="card">
              <div className="card-content">
                <span className="card-title">
                  <i className="material-icons left">settings</i>
                  基本設定
                </span>
                
                <div className="row">
                  <div className="col s12 m6">
                    <div className="input-field">
                      <select
                        value={settings.activeWorkflowId}
                        onChange={(e) => {
                          handleSettingsUpdate({ activeWorkflowId: e.target.value });
                        }}
                      >
                        <option value="" disabled>ワークフローを選択...</option>
                        {templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                            {template.isSystemDefault && ' (システム標準)'}
                          </option>
                        ))}
                      </select>
                      <label>デフォルトワークフロー</label>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col s12">
                    <h6>自動化設定</h6>
                    <p>
                      <label>
                        <input
                          type="checkbox"
                          checked={settings.settings.autoTransition || false}
                          onChange={(e) => {
                            handleSettingsUpdate({
                              settings: {
                                ...settings.settings,
                                autoTransition: e.target.checked
                              }
                            });
                          }}
                        />
                        <span>自動ステータス遷移を有効にする</span>
                      </label>
                    </p>
                    <p>
                      <label>
                        <input
                          type="checkbox"
                          checked={settings.settings.notificationEnabled || false}
                          onChange={(e) => {
                            handleSettingsUpdate({
                              settings: {
                                ...settings.settings,
                                notificationEnabled: e.target.checked
                              }
                            });
                          }}
                        />
                        <span>通知を有効にする</span>
                      </label>
                    </p>
                    <p>
                      <label>
                        <input
                          type="checkbox"
                          checked={settings.settings.allowCustomStatus || false}
                          onChange={(e) => {
                            handleSettingsUpdate({
                              settings: {
                                ...settings.settings,
                                allowCustomStatus: e.target.checked
                              }
                            });
                          }}
                        />
                        <span>カスタムステータスの作成を許可する</span>
                      </label>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* テンプレート管理タブ */}
      {activeTab === 'templates' && (
        <div className="row">
          <div className="col s12">
            <div className="card">
              <div className="card-content">
                <span className="card-title">
                  <i className="material-icons left">view_column</i>
                  ワークフローテンプレート
                </span>

                {/* 既存テンプレート一覧 */}
                <div className="collection">
                  {templates.map(template => (
                    <div key={template.id} className="collection-item">
                      <div className="row valign-wrapper">
                        <div className="col s8">
                          <h6>{template.name}</h6>
                          <p className="grey-text">
                            {template.description || '説明なし'} | 
                            {template.columns.length} カラム | 
                            {template.type}
                            {template.isSystemDefault && ' | システム標準'}
                          </p>
                        </div>
                        <div className="col s4 right-align">
                          <button className="btn-small blue waves-effect">
                            <i className="material-icons left">edit</i>
                            編集
                          </button>
                          {!template.isSystemDefault && (
                            <button className="btn-small red waves-effect" style={{ marginLeft: '8px' }}>
                              <i className="material-icons left">delete</i>
                              削除
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 新しいテンプレート作成 */}
                <div className="divider" style={{ margin: '20px 0' }}></div>
                <h6>新しいテンプレートを作成</h6>
                
                <div className="row">
                  <div className="col s12 m6">
                    <div className="input-field">
                      <input
                        type="text"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <label>テンプレート名</label>
                    </div>
                  </div>
                  <div className="col s12 m6">
                    <div className="input-field">
                      <select
                        value={newTemplate.type}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value as WorkflowType }))}
                      >
                        <option value={WorkflowType.STANDARD}>標準</option>
                        <option value={WorkflowType.APPROVAL_PROCESS}>承認プロセス</option>
                        <option value={WorkflowType.CLIENT_COMMUNICATION}>クライアント対応</option>
                        <option value={WorkflowType.CUSTOM}>カスタム</option>
                      </select>
                      <label>テンプレートタイプ</label>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col s12">
                    <div className="input-field">
                      <textarea
                        className="materialize-textarea"
                        value={newTemplate.description}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      />
                      <label>説明</label>
                    </div>
                  </div>
                </div>

                {/* カラム設定 */}
                <div className="row">
                  <div className="col s12">
                    <h6>カラム設定</h6>
                    {newTemplate.columns.map((column, index) => (
                      <div key={column.id} className="card-panel grey lighten-5">
                        <div className="row">
                          <div className="col s6">
                            <div className="input-field">
                              <input
                                type="text"
                                value={column.name}
                                onChange={(e) => {
                                  const updatedColumns = [...newTemplate.columns];
                                  updatedColumns[index].name = e.target.value;
                                  setNewTemplate(prev => ({ ...prev, columns: updatedColumns }));
                                }}
                              />
                              <label>カラム名</label>
                            </div>
                          </div>
                          <div className="col s4">
                            <div className="input-field">
                              <input
                                type="color"
                                value={column.color}
                                onChange={(e) => {
                                  const updatedColumns = [...newTemplate.columns];
                                  updatedColumns[index].color = e.target.value;
                                  setNewTemplate(prev => ({ ...prev, columns: updatedColumns }));
                                }}
                              />
                              <label>背景色</label>
                            </div>
                          </div>
                          <div className="col s2">
                            <button
                              className="btn-small red waves-effect"
                              onClick={() => {
                                const updatedColumns = newTemplate.columns.filter((_, i) => i !== index);
                                setNewTemplate(prev => ({ ...prev, columns: updatedColumns }));
                              }}
                            >
                              <i className="material-icons">delete</i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      className="btn-small blue waves-effect"
                      onClick={addColumnToNewTemplate}
                    >
                      <i className="material-icons left">add</i>
                      カラム追加
                    </button>
                  </div>
                </div>

                <div className="row">
                  <div className="col s12 right-align">
                    <button
                      className="btn green waves-effect waves-light"
                      onClick={handleCreateTemplate}
                      disabled={!newTemplate.name.trim()}
                    >
                      <i className="material-icons left">save</i>
                      テンプレート作成
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* カスタムステータス管理タブ */}
      {activeTab === 'statuses' && (
        <div className="row">
          <div className="col s12">
            <div className="card">
              <div className="card-content">
                <span className="card-title">
                  <i className="material-icons left">label</i>
                  カスタムステータス
                </span>

                {/* 既存ステータス一覧 */}
                <div className="collection">
                  {customStatuses.map(status => (
                    <div key={status.id} className="collection-item">
                      <div className="row valign-wrapper">
                        <div className="col s8">
                          <span 
                            className="chip"
                            style={{
                              backgroundColor: status.color,
                              color: status.textColor
                            }}
                          >
                            {status.icon && <i className="material-icons left">{status.icon}</i>}
                            {status.displayName}
                          </span>
                          <p className="grey-text">
                            {status.description || '説明なし'} | スコープ: {status.scope}
                          </p>
                        </div>
                        <div className="col s4 right-align">
                          <button className="btn-small blue waves-effect">
                            <i className="material-icons left">edit</i>
                            編集
                          </button>
                          <button className="btn-small red waves-effect" style={{ marginLeft: '8px' }}>
                            <i className="material-icons left">delete</i>
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 新しいステータス作成 */}
                <div className="divider" style={{ margin: '20px 0' }}></div>
                <h6>新しいステータスを作成</h6>
                
                <div className="row">
                  <div className="col s12 m6">
                    <div className="input-field">
                      <input
                        type="text"
                        value={newStatus.name}
                        onChange={(e) => setNewStatus(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <label>ステータス名 (内部ID)</label>
                    </div>
                  </div>
                  <div className="col s12 m6">
                    <div className="input-field">
                      <input
                        type="text"
                        value={newStatus.displayName}
                        onChange={(e) => setNewStatus(prev => ({ ...prev, displayName: e.target.value }))}
                      />
                      <label>表示名</label>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col s12">
                    <div className="input-field">
                      <textarea
                        className="materialize-textarea"
                        value={newStatus.description}
                        onChange={(e) => setNewStatus(prev => ({ ...prev, description: e.target.value }))}
                      />
                      <label>説明</label>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col s12 m4">
                    <div className="input-field">
                      <input
                        type="color"
                        value={newStatus.color}
                        onChange={(e) => setNewStatus(prev => ({ ...prev, color: e.target.value }))}
                      />
                      <label>背景色</label>
                    </div>
                  </div>
                  <div className="col s12 m4">
                    <div className="input-field">
                      <input
                        type="color"
                        value={newStatus.textColor}
                        onChange={(e) => setNewStatus(prev => ({ ...prev, textColor: e.target.value }))}
                      />
                      <label>テキスト色</label>
                    </div>
                  </div>
                  <div className="col s12 m4">
                    <div className="input-field">
                      <select
                        value={newStatus.scope}
                        onChange={(e) => setNewStatus(prev => ({ ...prev, scope: e.target.value as any }))}
                      >
                        <option value="PERSONAL">個人</option>
                        <option value="TEAM">チーム</option>
                        {user?.role && ['company_leader', 'manager'].includes(user.role) && (
                          <option value="COMPANY">企業</option>
                        )}
                      </select>
                      <label>スコープ</label>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col s12 right-align">
                    <button
                      className="btn green waves-effect waves-light"
                      onClick={handleCreateCustomStatus}
                      disabled={!newStatus.name.trim() || !newStatus.displayName.trim()}
                    >
                      <i className="material-icons left">save</i>
                      ステータス作成
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 変更保存用フローティングボタン */}
      {isDirty && (
        <div className="fixed-action-btn">
          <button
            className="btn-floating btn-large green pulse"
            onClick={() => settings && handleSettingsUpdate(settings)}
          >
            <i className="large material-icons">save</i>
          </button>
        </div>
      )}
    </div>
  );
};