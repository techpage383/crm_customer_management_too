import React, { useState } from 'react';
import { Save, Eye, Download, Upload, Settings, Trash2 } from 'lucide-react';
import { CustomFlow } from '../types';
import { useFlowStore } from '../stores/flowStore';

interface FlowToolbarProps {
  activeFlow: CustomFlow | null;
}

export function FlowToolbar({ activeFlow }: FlowToolbarProps) {
  const { updateFlow, deleteFlow } = useFlowStore();
  const [showSettings, setShowSettings] = useState(false);
  
  if (!activeFlow) return null;
  
  const handleSaveFlow = () => {
    // TODO: バックエンドに保存
    console.log('フロー保存:', activeFlow);
    alert('フローを保存しました！');
  };
  
  const handleExportFlow = () => {
    const dataStr = JSON.stringify(activeFlow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${activeFlow.name}.flow.json`;
    link.click();
  };
  
  const handleDeleteFlow = () => {
    if (confirm(`フロー「${activeFlow.name}」を削除しますか？この操作は取り消せません。`)) {
      deleteFlow(activeFlow.id);
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleSaveFlow}
        className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        title="フローを保存"
      >
        <Save className="h-4 w-4" />
        <span className="hidden sm:inline">保存</span>
      </button>
      
      <button
        onClick={() => setShowSettings(true)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        title="フロー設定"
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">設定</span>
      </button>
      
      <button
        onClick={handleExportFlow}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        title="フローをエクスポート"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">エクスポート</span>
      </button>
      
      <div className="w-px h-6 bg-gray-300" />
      
      <button
        onClick={handleDeleteFlow}
        className="flex items-center space-x-2 px-3 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
        title="フローを削除"
      >
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">削除</span>
      </button>
      
      {/* フロー設定モーダル */}
      {showSettings && (
        <FlowSettingsModal
          flow={activeFlow}
          onClose={() => setShowSettings(false)}
          onSave={(updates) => {
            updateFlow(activeFlow.id, updates);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}

// フロー設定モーダル
function FlowSettingsModal({
  flow,
  onClose,
  onSave
}: {
  flow: CustomFlow;
  onClose: () => void;
  onSave: (updates: Partial<CustomFlow>) => void;
}) {
  const [name, setName] = useState(flow.name);
  const [description, setDescription] = useState(flow.description || '');
  const [businessType, setBusinessType] = useState(flow.businessType);
  const [isDefault, setIsDefault] = useState(flow.isDefault);
  
  const businessTypes = [
    { value: 'visit', label: '訪問・商談' },
    { value: 'document', label: '資料作成・送付' },
    { value: 'admin', label: '事務作業' },
    { value: 'follow_up', label: 'フォローアップ' },
    { value: 'meeting', label: '会議・打ち合わせ' },
    { value: 'other', label: 'その他' }
  ];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      businessType,
      isDefault
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">フロー設定</h2>
        
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
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                業務種類
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {businessTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                デフォルトフローに設定
              </label>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-sm text-blue-800">
                <strong>作成日:</strong> {new Date(flow.createdAt).toLocaleString('ja-JP')}
              </div>
              <div className="text-sm text-blue-800">
                <strong>更新日:</strong> {new Date(flow.updatedAt).toLocaleString('ja-JP')}
              </div>
              <div className="text-sm text-blue-800">
                <strong>フェーズ数:</strong> {flow.phases.length}
              </div>
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
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}