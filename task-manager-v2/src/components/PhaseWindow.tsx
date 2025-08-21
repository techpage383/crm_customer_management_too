import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Edit3, Trash2, MoreHorizontal } from 'lucide-react';
import { FlowPhase } from '../types';

interface PhaseWindowProps {
  phase: FlowPhase;
  onEdit: (phase: FlowPhase) => void;
  onDelete: (phase: FlowPhase) => void;
  isDragging?: boolean;
}

export function PhaseWindow({ phase, onEdit, onDelete, isDragging = false }: PhaseWindowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingFromKit
  } = useDraggable({
    id: phase.id,
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  
  const isCurrentlyDragging = isDragging || isDraggingFromKit;
  
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        left: `${phase.position.x}px`,
        top: `${phase.position.y}px`,
      }}
      className={`
        phase-window absolute
        ${isCurrentlyDragging ? 'dragging z-50' : 'z-10'}
        group
      `}
      {...attributes}
      {...listeners}
    >
      {/* フェーズヘッダー */}
      <div 
        className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200"
        style={{ borderColor: phase.color + '20' }}
      >
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: phase.color }}
          />
          <h3 className="font-medium text-gray-900 text-sm">
            {phase.name}
          </h3>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(phase);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="編集"
          >
            <Edit3 className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(phase);
            }}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="削除"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      {/* フェーズ内容エリア */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500">
          順序: {phase.order + 1}
        </div>
        
        {/* タスク表示エリア（後で実装） */}
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center text-xs text-gray-400">
          タスクをドロップ
        </div>
        
        {/* フェーズ統計（後で実装） */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>タスク: 0</span>
          <span>完了: 0</span>
        </div>
      </div>
      
      {/* 接続ポイント */}
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
        <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair"
             title="他のフェーズに接続" />
      </div>
      
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
        <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair"
             title="他のフェーズから接続" />
      </div>
      
      {/* ドラッグハンドル */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreHorizontal className="h-4 w-4 text-gray-400" />
      </div>
      
      {/* カラーインジケーター */}
      <div 
        className="absolute top-0 left-0 w-full h-1 rounded-t-lg"
        style={{ backgroundColor: phase.color }}
      />
    </div>
  );
}