import React, { useState, useRef, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Plus, Save, Trash2, Settings, Eye } from 'lucide-react';
import { useFlowStore } from '../stores/flowStore';
import { FlowPhase } from '../types';
import { PhaseWindow } from './PhaseWindow';
import { FlowCanvas } from './FlowCanvas';
import { FlowToolbar } from './FlowToolbar';
import { PhaseEditModal } from './PhaseEditModal';

export function FlowDesigner() {
  const {
    flows,
    activeFlowId,
    getActiveFlow,
    createFlow,
    addPhase,
    updatePhase,
    deletePhase,
    setActiveFlow
  } = useFlowStore();
  
  const [draggedPhase, setDraggedPhase] = useState<FlowPhase | null>(null);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [editingPhase, setEditingPhase] = useState<FlowPhase | null>(null);
  const [showCreateFlowModal, setShowCreateFlowModal] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const activeFlow = getActiveFlow();
  
  // 新しいフロー作成
  const handleCreateFlow = (name: string, description?: string) => {
    const newFlow = createFlow(name, description);
    setShowCreateFlowModal(false);
    
    // デフォルトフェーズを追加
    setTimeout(() => {
      addPhase(newFlow.id, '開始', { x: 100, y: 100 });
      addPhase(newFlow.id, '完了', { x: 400, y: 100 });
    }, 100);
  };
  
  // キャンバスクリックでフェーズ追加
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (!activeFlow || event.target !== event.currentTarget) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const phaseName = prompt('フェーズ名を入力してください:');
    if (phaseName && phaseName.trim()) {
      addPhase(activeFlow.id, phaseName.trim(), { x, y });
    }
  }, [activeFlow, addPhase]);
  
  // ドラッグ開始
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const phase = activeFlow?.phases.find(p => p.id === active.id);
    setDraggedPhase(phase || null);
  };
  
  // ドラッグ終了
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    if (!activeFlow || !delta) {
      setDraggedPhase(null);
      return;
    }
    
    const phase = activeFlow.phases.find(p => p.id === active.id);
    if (phase) {
      updatePhase(activeFlow.id, phase.id, {
        position: {
          x: phase.position.x + delta.x,
          y: phase.position.y + delta.y
        }
      });
    }
    
    setDraggedPhase(null);
  };
  
  // フェーズ編集
  const handleEditPhase = (phase: FlowPhase) => {
    setEditingPhase(phase);
    setShowPhaseModal(true);
  };
  
  // フェーズ削除
  const handleDeletePhase = (phase: FlowPhase) => {
    if (!activeFlow) return;
    
    if (confirm(`フェーズ「${phase.name}」を削除しますか？`)) {
      deletePhase(activeFlow.id, phase.id);
    }
  };
  
  // モーダル保存
  const handleSavePhase = (updates: Partial<FlowPhase>) => {
    if (!activeFlow || !editingPhase) return;
    
    updatePhase(activeFlow.id, editingPhase.id, updates);
    setShowPhaseModal(false);
    setEditingPhase(null);
  };
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              フロー設計
            </h1>
            
            {/* フロー選択 */}
            <select
              value={activeFlowId || ''}
              onChange={(e) => setActiveFlow(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">フローを選択</option>
              {flows.map(flow => (
                <option key={flow.id} value={flow.id}>
                  {flow.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setShowCreateFlowModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>新規フロー</span>
            </button>
          </div>
          
          <FlowToolbar activeFlow={activeFlow} />
        </div>
        
        {activeFlow && (
          <div className="mt-2 text-sm text-gray-600">
            {activeFlow.description && (
              <p>{activeFlow.description}</p>
            )}
            <p>フェーズ数: {activeFlow.phases.length}</p>
          </div>
        )}
      </div>
      
      {/* メインコンテンツ */}
      <div className="flex-1 relative overflow-hidden">
        {activeFlow ? (
          <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <FlowCanvas
              ref={canvasRef}
              flow={activeFlow}
              onCanvasClick={handleCanvasClick}
            >
              {activeFlow.phases.map(phase => (
                <PhaseWindow
                  key={phase.id}
                  phase={phase}
                  onEdit={handleEditPhase}
                  onDelete={handleDeletePhase}
                />
              ))}
            </FlowCanvas>
            
            <DragOverlay>
              {draggedPhase && (
                <PhaseWindow
                  phase={draggedPhase}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isDragging
                />
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                フローを作成しましょう
              </h2>
              <p className="text-gray-600 mb-6">
                営業業務に合わせたカスタムフローを設計できます
              </p>
              <button
                onClick={() => setShowCreateFlowModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mx-auto"
              >
                <Plus className="h-5 w-5" />
                <span>最初のフローを作成</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 使い方ヒント */}
      <div className="bg-blue-50 border-t border-blue-200 px-6 py-3">
        <div className="flex items-center space-x-4 text-sm text-blue-800">
          <div className="flex items-center space-x-2">
            <span className="font-medium">💡 使い方:</span>
            <span>キャンバスをクリックしてフェーズを追加</span>
          </div>
          <div>|</div>
          <div>フェーズをドラッグして配置変更</div>
          <div>|</div>
          <div>右クリックで詳細編集</div>
        </div>
      </div>
      
      {/* モーダル */}
      {showCreateFlowModal && (
        <CreateFlowModal
          onClose={() => setShowCreateFlowModal(false)}
          onCreate={handleCreateFlow}
        />
      )}
      
      {showPhaseModal && editingPhase && (
        <PhaseEditModal
          phase={editingPhase}
          onClose={() => {
            setShowPhaseModal(false);
            setEditingPhase(null);
          }}
          onSave={handleSavePhase}
        />
      )}
    </div>
  );
}

// 新規フロー作成モーダル
function CreateFlowModal({ 
  onClose, 
  onCreate 
}: { 
  onClose: () => void;
  onCreate: (name: string, description?: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim() || undefined);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">新しいフロー作成</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                フロー名 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="例: 営業案件フロー"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="このフローの用途や特徴を記載"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}