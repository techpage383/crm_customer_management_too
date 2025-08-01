import React, { useState, useEffect } from 'react';
import { EffortTemplate, TodoStatus, PaginatedApiResponse } from '../../types';
import { workflowApiService } from '../../services/api/workflow.service';
import { useAuth } from '../../hooks/useAuth';

interface EffortTemplateSelectorProps {
  selectedTemplateId?: string;
  applicableStatus?: TodoStatus[];
  category?: string;
  onTemplateSelect: (template: EffortTemplate | null) => void;
  onCustomHours?: (hours: number) => void;
  className?: string;
}

/**
 * 工数テンプレート選択コンポーネント
 * タスク作成・編集時の工数設定に使用
 */
export const EffortTemplateSelector: React.FC<EffortTemplateSelectorProps> = ({
  selectedTemplateId,
  applicableStatus = [],
  category,
  onTemplateSelect,
  onCustomHours,
  className
}) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EffortTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EffortTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EffortTemplate | null>(null);
  const [customHours, setCustomHours] = useState<number>(0);
  const [useCustom, setUseCustom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEffortTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, applicableStatus, category, searchQuery]);

  useEffect(() => {
    if (selectedTemplateId && templates.length > 0) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setSelectedTemplate(template);
        setUseCustom(false);
      }
    }
  }, [selectedTemplateId, templates]);

  const loadEffortTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await workflowApiService.getEffortTemplates();
      setTemplates(response.data?.data || []);
    } catch (err: any) {
      setError(err.message || '工数テンプレートの読み込みに失敗しました');
      console.error('Failed to load effort templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates.filter(template => template.isActive);

    // ステータス適用フィルタ
    if (applicableStatus.length > 0) {
      filtered = filtered.filter(template =>
        template.statusApplicable.some(status => applicableStatus.includes(status))
      );
    }

    // カテゴリフィルタ
    if (category) {
      filtered = filtered.filter(template => 
        template.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // 検索フィルタ
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleTemplateSelect = (template: EffortTemplate) => {
    setSelectedTemplate(template);
    setUseCustom(false);
    onTemplateSelect(template);
  };

  const handleCustomToggle = () => {
    const newUseCustom = !useCustom;
    setUseCustom(newUseCustom);
    
    if (newUseCustom) {
      setSelectedTemplate(null);
      onTemplateSelect(null);
      if (customHours > 0) {
        onCustomHours?.(customHours);
      }
    } else {
      onCustomHours?.(0);
    }
  };

  const handleCustomHoursChange = (hours: number) => {
    setCustomHours(hours);
    if (useCustom) {
      onCustomHours?.(hours);
    }
  };

  const getCategoryIcon = (category: string): string => {
    const categoryMap: Record<string, string> = {
      '開発': 'code',
      '営業': 'business',
      'サポート': 'support_agent',
      '企画': 'lightbulb',
      '管理': 'admin_panel_settings',
      'その他': 'work'
    };
    return categoryMap[category] || 'work';
  };

  const getEstimatedHoursDisplay = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}分`;
    } else if (hours >= 8) {
      const days = Math.floor(hours / 8);
      const remainingHours = hours % 8;
      return remainingHours > 0 ? `${days}日${remainingHours}時間` : `${days}日`;
    } else {
      return `${hours}時間`;
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="center-align">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="card-panel red lighten-4">
          <span className="red-text text-darken-2">
            <i className="material-icons left">error</i>
            {error}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`effort-template-selector ${className || ''}`}>
      <div className="card">
        <div className="card-content">
          <span className="card-title">
            <i className="material-icons left">access_time</i>
            工数設定
          </span>

          {/* 検索バー */}
          <div className="row">
            <div className="col s12">
              <div className="input-field">
                <i className="material-icons prefix">search</i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="テンプレートを検索..."
                />
                <label htmlFor="search">検索</label>
              </div>
            </div>
          </div>

          {/* カスタム工数設定 */}
          <div className="row">
            <div className="col s12">
              <p>
                <label>
                  <input
                    type="checkbox"
                    checked={useCustom}
                    onChange={handleCustomToggle}
                  />
                  <span>カスタム工数を入力</span>
                </label>
              </p>
              
              {useCustom && (
                <div className="input-field">
                  <input
                    type="number"
                    min="0"
                    max="999"
                    step="0.5"
                    value={customHours}
                    onChange={(e) => handleCustomHoursChange(parseFloat(e.target.value) || 0)}
                  />
                  <label>工数 (時間)</label>
                  <span className="helper-text">
                    {customHours > 0 && `予想時間: ${getEstimatedHoursDisplay(customHours)}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* テンプレート選択 */}
          {!useCustom && (
            <>
              <div className="divider" style={{ margin: '20px 0' }}></div>
              <h6>テンプレートから選択</h6>
              
              {filteredTemplates.length === 0 ? (
                <div className="center-align grey-text">
                  <i className="material-icons large">inventory_2</i>
                  <p>該当する工数テンプレートがありません</p>
                  {searchQuery && (
                    <button 
                      className="btn-small blue waves-effect"
                      onClick={() => setSearchQuery('')}
                    >
                      検索をクリア
                    </button>
                  )}
                </div>
              ) : (
                <div className="collection">
                  {filteredTemplates.map(template => (
                    <div
                      key={template.id}
                      className={`collection-item waves-effect ${
                        selectedTemplate?.id === template.id ? 'active blue lighten-4' : ''
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="row valign-wrapper">
                        <div className="col s2">
                          <i className="material-icons circle blue lighten-1 white-text">
                            {getCategoryIcon(template.category)}
                          </i>
                        </div>
                        <div className="col s7">
                          <div className="template-info">
                            <span className="title">{template.name}</span>
                            <p className="grey-text">
                              {template.description}
                              <br />
                              <span className="chip tiny blue lighten-3">
                                {template.category}
                              </span>
                              {template.tags?.map(tag => (
                                <span key={tag} className="chip tiny grey lighten-3">
                                  {tag}
                                </span>
                              ))}
                            </p>
                          </div>
                        </div>
                        <div className="col s3 right-align">
                          <div className="estimated-hours">
                            <span className="blue-text text-darken-2">
                              <i className="material-icons tiny">schedule</i>
                              {getEstimatedHoursDisplay(template.estimatedHours)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* 選択中の情報表示 */}
          {(selectedTemplate || (useCustom && customHours > 0)) && (
            <>
              <div className="divider" style={{ margin: '20px 0' }}></div>
              <div className="selected-info">
                <h6>選択中</h6>
                {selectedTemplate && (
                  <div className="card-panel blue lighten-5">
                    <div className="row valign-wrapper">
                      <div className="col s2">
                        <i className="material-icons circle blue white-text">
                          {getCategoryIcon(selectedTemplate.category)}
                        </i>
                      </div>
                      <div className="col s10">
                        <span className="blue-text text-darken-2">
                          <strong>{selectedTemplate.name}</strong>
                        </span>
                        <p className="blue-text text-darken-1">
                          {selectedTemplate.description}
                          <br />
                          <span className="chip blue lighten-3">
                            {selectedTemplate.category}
                          </span>
                          <span className="right">
                            <i className="material-icons tiny">schedule</i>
                            {getEstimatedHoursDisplay(selectedTemplate.estimatedHours)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {useCustom && customHours > 0 && (
                  <div className="card-panel green lighten-5">
                    <div className="row valign-wrapper">
                      <div className="col s2">
                        <i className="material-icons circle green white-text">edit</i>
                      </div>
                      <div className="col s10">
                        <span className="green-text text-darken-2">
                          <strong>カスタム工数</strong>
                        </span>
                        <p className="green-text text-darken-1">
                          手動で設定した工数
                          <span className="right">
                            <i className="material-icons tiny">schedule</i>
                            {getEstimatedHoursDisplay(customHours)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};