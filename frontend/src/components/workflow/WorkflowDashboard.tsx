import React, { useState, useEffect } from 'react';
import { 
  WorkflowTemplate, 
  WorkflowSettings, 
  EffortTemplate, 
  TodoStatus,
  Todo
} from '../../types';
import { workflowApiService } from '../../services/api/workflow.service';
import { todoApiService } from '../../services/api/todo.service';
import { useAuth } from '../../hooks/useAuth';

interface WorkflowDashboardProps {
  className?: string;
}

interface WorkflowColumn {
  id: string;
  name: string;
  statusValue: TodoStatus;
  color: string;
  textColor: string;
  tasks: Todo[];
}

/**
 * ワークフロー統合メインダッシュボード
 * モックアップ機能をバックエンドAPIと統合
 */
export const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);
  const [availableWorkflows, setAvailableWorkflows] = useState<WorkflowTemplate[]>([]);
  const [workflowSettings, setWorkflowSettings] = useState<WorkflowSettings | null>(null);
  const [effortTemplates, setEffortTemplates] = useState<EffortTemplate[]>([]);
  const [workflowColumns, setWorkflowColumns] = useState<WorkflowColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 初期化：ワークフロー設定とテンプレート読み込み
   */
  useEffect(() => {
    initializeWorkflow();
  }, []);

  const initializeWorkflow = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 並行でデータ取得
      const [settings, templates, efforts] = await Promise.all([
        workflowApiService.getWorkflowSettings(),
        workflowApiService.getWorkflowTemplates({ isActive: true }),
        workflowApiService.getEffortTemplates()
      ]);

      setWorkflowSettings(settings.data || null);
      setAvailableWorkflows((templates.data as any)?.data || []);
      setEffortTemplates(Array.isArray(efforts.data) ? efforts.data : efforts.data?.data || []);

      // アクティブワークフローを設定
      const templatesArray = (templates.data as any)?.data || [];
      if (settings.data?.activeWorkflowId && templatesArray) {
        const activeTemplate = templatesArray.find((t: WorkflowTemplate) => t.id === settings.data?.activeWorkflowId);
        if (activeTemplate) {
          await selectWorkflow(activeTemplate);
        }
      } else if (templatesArray && templatesArray.length > 0) {
        // デフォルトワークフローを選択
        await selectWorkflow(templatesArray[0]);
      }
    } catch (err: any) {
      setError(err.message || 'ワークフローの初期化に失敗しました');
      console.error('Workflow initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ワークフロー選択処理
   */
  const selectWorkflow = async (workflow: WorkflowTemplate) => {
    setLoading(true);
    try {
      setSelectedWorkflow(workflow);
      
      // カラム別にタスク取得
      const columns: WorkflowColumn[] = [];
      for (const column of workflow.columns) {
        try {
          // TODO: todoService.getTodos に status フィルタ追加が必要
          const tasks = await todoApiService.searchTodos({
            status: [column.statusValue],
            page: 1,
            limit: 50
          });
          
          columns.push({
            id: column.id,
            name: column.name,
            statusValue: column.statusValue,
            color: column.color,
            textColor: column.textColor,
            tasks: tasks.data || []
          });
        } catch (err) {
          console.warn(`Failed to load tasks for column ${column.name}:`, err);
          columns.push({
            id: column.id,
            name: column.name,
            statusValue: column.statusValue,
            color: column.color,
            textColor: column.textColor,
            tasks: []
          });
        }
      }
      
      setWorkflowColumns(columns);

      // アクティブワークフロー設定を更新
      if (workflowSettings && workflow.id !== workflowSettings.activeWorkflowId) {
        await workflowApiService.updateWorkflowSettings({
          ...workflowSettings,
          activeWorkflowId: workflow.id
        });
      }
    } catch (err: any) {
      setError(err.message || 'ワークフローの選択に失敗しました');
      console.error('Workflow selection error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * タスクステータス変更処理
   */
  const handleTaskStatusChange = async (
    taskId: string, 
    fromStatus: TodoStatus, 
    toStatus: TodoStatus,
    reason?: string
  ) => {
    try {
      const success = await workflowApiService.applyWorkflow({
        todoId: taskId,
        fromStatus,
        toStatus,
        reason
      });

      if (success && selectedWorkflow) {
        // ワークフロー再読み込み
        await selectWorkflow(selectedWorkflow);
      }
    } catch (err: any) {
      setError(err.message || 'ステータス変更に失敗しました');
      console.error('Task status change error:', err);
    }
  };

  /**
   * ドラッグ&ドロップハンドラー
   */
  const handleDragStart = (e: React.DragEvent, taskId: string, currentStatus: TodoStatus) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId, currentStatus }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TodoStatus) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { taskId, currentStatus } = data;
      
      if (currentStatus !== targetStatus) {
        await handleTaskStatusChange(taskId, currentStatus, targetStatus);
      }
    } catch (err) {
      console.error('Drag and drop error:', err);
    }
  };

  if (loading && !selectedWorkflow) {
    return (
      <div className={`workflow-dashboard ${className || ''}`}>
        <div className="loading-container">
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
          <p>ワークフローを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`workflow-dashboard ${className || ''}`}>
        <div className="error-container">
          <div className="card-panel red lighten-4">
            <span className="red-text text-darken-2">
              <i className="material-icons left">error</i>
              {error}
            </span>
            <button 
              className="btn blue waves-effect waves-light right"
              onClick={initializeWorkflow}
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`workflow-dashboard ${className || ''}`}>
      {/* ワークフロー選択ヘッダー */}
      <div className="workflow-header">
        <div className="row">
          <div className="col s12 m6">
            <div className="input-field">
              <select
                value={selectedWorkflow?.id || ''}
                onChange={(e) => {
                  const workflow = availableWorkflows.find(w => w.id === e.target.value);
                  if (workflow) selectWorkflow(workflow);
                }}
              >
                <option value="" disabled>ワークフローを選択...</option>
                {availableWorkflows.map(workflow => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                    {workflow.isSystemDefault && ' (システム標準)'}
                  </option>
                ))}
              </select>
              <label>アクティブワークフロー</label>
            </div>
          </div>
          <div className="col s12 m6">
            <div className="workflow-stats">
              <span className="chip">
                <i className="material-icons left">view_column</i>
                {workflowColumns.length} カラム
              </span>
              <span className="chip">
                <i className="material-icons left">assignment</i>
                {workflowColumns.reduce((total, col) => total + col.tasks.length, 0)} タスク
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* カンバンボード */}
      <div className="kanban-board">
        <div className="columns-container">
          {workflowColumns.map(column => (
            <div
              key={column.id}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.statusValue)}
            >
              <div 
                className="column-header"
                style={{
                  backgroundColor: column.color,
                  color: column.textColor
                }}
              >
                <h6>{column.name}</h6>
                <span className="task-count">{column.tasks.length}</span>
              </div>
              
              <div className="column-content">
                {column.tasks.map(task => (
                  <div
                    key={task.id}
                    className="task-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id, column.statusValue)}
                  >
                    <div className="task-header">
                      <span className={`priority-indicator ${task.priority?.toUpperCase()}`}>
                        {task.priority === 'high' && <i className="material-icons tiny">priority_high</i>}
                        {task.priority === 'medium' && <i className="material-icons tiny">remove</i>}
                        {task.priority === 'low' && <i className="material-icons tiny">keyboard_arrow_down</i>}
                      </span>
                      <span className="task-title">{task.title}</span>
                    </div>
                    
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    
                    <div className="task-footer">
                      {task.dueDate && (
                        <span className="due-date">
                          <i className="material-icons tiny">schedule</i>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.estimatedHours && (
                        <span className="effort">
                          <i className="material-icons tiny">access_time</i>
                          {task.estimatedHours}h
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {column.tasks.length === 0 && (
                  <div className="empty-column">
                    <i className="material-icons grey-text">inbox</i>
                    <p className="grey-text">タスクがありません</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 読み込み中オーバーレイ */}
      {loading && selectedWorkflow && (
        <div className="loading-overlay">
          <div className="preloader-wrapper small active">
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
        </div>
      )}
    </div>
  );
};