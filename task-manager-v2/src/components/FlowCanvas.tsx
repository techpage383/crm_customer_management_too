import React, { forwardRef } from 'react';
import { CustomFlow } from '../types';

interface FlowCanvasProps {
  flow: CustomFlow;
  onCanvasClick: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}

export const FlowCanvas = forwardRef<HTMLDivElement, FlowCanvasProps>(
  ({ flow, onCanvasClick, children }, ref) => {
    return (
      <div
        ref={ref}
        className="flow-canvas w-full h-full relative cursor-pointer"
        onClick={onCanvasClick}
        style={{
          minHeight: '600px',
          backgroundImage: `
            radial-gradient(circle, #e5e7eb 1px, transparent 1px),
            linear-gradient(90deg, rgba(229, 231, 235, 0.3) 1px, transparent 1px),
            linear-gradient(0deg, rgba(229, 231, 235, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px, 20px 20px, 20px 20px'
        }}
      >
        {/* 接続線を描画 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {flow.connections.map(connection => {
            const fromPhase = flow.phases.find(p => p.id === connection.fromPhaseId);
            const toPhase = flow.phases.find(p => p.id === connection.toPhaseId);
            
            if (!fromPhase || !toPhase) return null;
            
            // フェーズ中央の座標を計算
            const fromX = fromPhase.position.x + 100; // フェーズ幅の半分
            const fromY = fromPhase.position.y + 60;  // フェーズ高さの半分
            const toX = toPhase.position.x + 100;
            const toY = toPhase.position.y + 60;
            
            // ベジェ曲線の制御点
            const controlX1 = fromX + (toX - fromX) * 0.3;
            const controlY1 = fromY;
            const controlX2 = toX - (toX - fromX) * 0.3;
            const controlY2 = toY;
            
            return (
              <g key={connection.id}>
                {/* 接続線 */}
                <path
                  d={`M ${fromX} ${fromY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${toX} ${toY}`}
                  stroke="#6B7280"
                  strokeWidth={2}
                  fill="none"
                  className="transition-colors hover:stroke-primary-500"
                />
                
                {/* 矢印 */}
                <defs>
                  <marker
                    id={`arrowhead-${connection.id}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#6B7280"
                    />
                  </marker>
                </defs>
                <path
                  d={`M ${fromX} ${fromY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${toX} ${toY}`}
                  stroke="transparent"
                  strokeWidth={2}
                  fill="none"
                  markerEnd={`url(#arrowhead-${connection.id})`}
                />
              </g>
            );
          })}
        </svg>
        
        {/* フェーズウィンドウ */}
        {children}
        
        {/* キャンバス情報 */}
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-gray-600">
          <div className="font-medium">{flow.name}</div>
          <div>{flow.phases.length} フェーズ</div>
        </div>
        
        {/* グリッド切り替えボタン */}
        <div className="absolute top-4 right-4 space-y-2">
          <button
            className="bg-white/80 backdrop-blur-sm rounded-lg p-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="グリッド表示切り替え"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm8 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm8 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* キャンバスが空の場合のヒント */}
        {flow.phases.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">✨</div>
              <p className="text-lg">キャンバスをクリックして</p>
              <p className="text-lg">最初のフェーズを追加しましょう</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);