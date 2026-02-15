import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9527';

interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  type: string;
}

interface Trigger {
  type: string;
  label: string;
  description: string;
  needsMarathon?: boolean;
  needsDayNumber?: boolean;
  marathons?: Array<{ id: string; title: string; days?: number }>;
}

interface CampaignStep {
  id: string;
  templateId: string;
  delay: number;
  delayUnit: 'hours' | 'days';
  condition?: {
    type: 'all' | 'opened' | 'clicked' | 'not_opened';
    stepId?: string;
  };
  position: { x: number; y: number };
}

interface Campaign {
  _id?: string;
  name: string;
  description?: string;
  trigger: {
    type: string;
    marathonId?: string;
    dayNumber?: number;
  };
  steps: CampaignStep[];
  isActive: boolean;
}

const EmailCampaignEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [campaign, setCampaign] = useState<Campaign>({
    name: '',
    description: '',
    trigger: { type: 'marathon_enrollment' },
    steps: [],
    isActive: false
  });

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showStepEditor, setShowStepEditor] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchTriggers();
    if (!isNew && id) {
      fetchCampaign(id);
    }
  }, [id]);

  const fetchCampaign = async (campaignId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/api/admin/email-campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaign(response.data.campaign);
    } catch (error) {
      console.error('Fetch campaign error:', error);
      alert('Ошибка загрузки кампании');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/api/admin/email-templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Fetch templates error:', error);
    }
  };

  const fetchTriggers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/api/admin/email-campaigns/meta/triggers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTriggers(response.data.triggers || []);
    } catch (error) {
      console.error('Fetch triggers error:', error);
    }
  };

  const handleSave = async () => {
    if (!campaign.name.trim()) {
      alert('Введите название кампании');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      if (isNew) {
        const response = await axios.post(`${API_URL}/api/admin/email-campaigns`, campaign, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate(`/email-campaigns/${response.data.campaign._id}`);
      } else {
        await axios.put(`${API_URL}/api/admin/email-campaigns/${id}`, campaign, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      alert('✓ Кампания сохранена');
    } catch (error) {
      console.error('Save campaign error:', error);
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = () => {
    const newStep: CampaignStep = {
      id: `step_${Date.now()}`,
      templateId: templates[0]?._id || '',
      delay: 1,
      delayUnit: 'days',
      position: { 
        x: 100 + campaign.steps.length * 50, 
        y: 100 + campaign.steps.length * 150 
      }
    };
    
    setCampaign({
      ...campaign,
      steps: [...campaign.steps, newStep]
    });
    setSelectedStep(newStep.id);
    setShowStepEditor(true);
  };

  const handleDeleteStep = (stepId: string) => {
    setCampaign({
      ...campaign,
      steps: campaign.steps.filter(s => s.id !== stepId)
    });
    setSelectedStep(null);
    setShowStepEditor(false);
  };

  const handleUpdateStep = (stepId: string, updates: Partial<CampaignStep>) => {
    setCampaign({
      ...campaign,
      steps: campaign.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
    });
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t._id === templateId);
    return template ? template.name : 'Не выбран';
  };

  const getTriggerInfo = () => {
    const trigger = triggers.find(t => t.type === campaign.trigger.type);
    return trigger || { label: campaign.trigger.type, description: '' };
  };

  const currentStep = campaign.steps.find(s => s.id === selectedStep);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/email-campaigns')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            ← Назад
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {isNew ? '✨ Новая кампания' : `✏️ ${campaign.name}`}
            </h1>
            <p className="text-gray-600 text-sm mt-1">{getTriggerInfo().label}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition shadow-lg disabled:opacity-50"
          >
            {saving ? '⏳ Сохранение...' : '💾 Сохранить'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Panel - Settings */}
        <div className="col-span-1 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">⚙️ Настройки</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название кампании
                </label>
                <input
                  type="text"
                  value={campaign.name}
                  onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: Онбординг новых участников"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание (опционально)
                </label>
                <textarea
                  value={campaign.description || ''}
                  onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Краткое описание цели кампании"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Триггер запуска
                </label>
                <select
                  value={campaign.trigger.type}
                  onChange={(e) => setCampaign({
                    ...campaign,
                    trigger: { type: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {triggers.map(trigger => (
                    <option key={trigger.type} value={trigger.type}>
                      {trigger.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">{getTriggerInfo().description}</p>
              </div>

              {getTriggerInfo().needsMarathon && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Марафон
                  </label>
                  <select
                    value={campaign.trigger.marathonId || ''}
                    onChange={(e) => setCampaign({
                      ...campaign,
                      trigger: { ...campaign.trigger, marathonId: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Выберите марафон</option>
                    {getTriggerInfo().marathons?.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {getTriggerInfo().needsDayNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    День марафона
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={campaign.trigger.dayNumber || 1}
                    onChange={(e) => setCampaign({
                      ...campaign,
                      trigger: { ...campaign.trigger, dayNumber: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="pt-4 border-t">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={campaign.isActive}
                    onChange={(e) => setCampaign({ ...campaign, isActive: e.target.checked })}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {campaign.isActive ? '✓ Кампания активна' : 'Кампания не активна'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Add Step Button */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <button
              onClick={handleAddStep}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
            >
              + Добавить письмо
            </button>
          </div>
        </div>

        {/* Center - Visual Flow */}
        <div className="col-span-2 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Визуальный Flow</h3>
          
          {campaign.steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-6xl mb-4">✉️</div>
              <p className="text-gray-500 text-lg mb-4">Добавьте первое письмо</p>
              <button
                onClick={handleAddStep}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
              >
                + Добавить письмо
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Trigger Node */}
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 border-2 border-purple-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    ⚡
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">ТРИГГЕР</div>
                    <div className="text-sm text-gray-600">{getTriggerInfo().label}</div>
                  </div>
                </div>
              </div>

              {/* Steps */}
              {campaign.steps.map((step, index) => (
                <div key={step.id}>
                  {/* Delay Arrow */}
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="h-8 w-0.5 bg-gray-300"></div>
                      <span className="bg-gray-100 px-3 py-1 rounded-full">
                        ⏱ Задержка: {step.delay} {step.delayUnit === 'hours' ? 'ч' : 'д'}
                      </span>
                      <div className="h-8 w-0.5 bg-gray-300"></div>
                    </div>
                  </div>

                  {/* Step Node */}
                  <div
                    className={`bg-white rounded-lg p-4 border-2 cursor-pointer transition ${
                      selectedStep === step.id
                        ? 'border-blue-500 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      setSelectedStep(step.id);
                      setShowStepEditor(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-800">
                            {getTemplateName(step.templateId)}
                          </div>
                          {step.condition && (
                            <div className="text-xs text-purple-600 mt-1">
                              📍 Условие: {step.condition.type}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStep(step.id);
                        }}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Step Editor Modal */}
      {showStepEditor && currentStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">✏️ Редактирование шага</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email шаблон
                </label>
                <select
                  value={currentStep.templateId}
                  onChange={(e) => handleUpdateStep(currentStep.id, { templateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {templates.map(template => (
                    <option key={template._id} value={template._id}>
                      {template.name} - {template.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Задержка
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentStep.delay}
                    onChange={(e) => handleUpdateStep(currentStep.id, { delay: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Единица
                  </label>
                  <select
                    value={currentStep.delayUnit}
                    onChange={(e) => handleUpdateStep(currentStep.id, { delayUnit: e.target.value as 'hours' | 'days' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hours">Часы</option>
                    <option value="days">Дни</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Условие отправки (необязательно)
                </label>
                <select
                  value={currentStep.condition?.type || 'all'}
                  onChange={(e) => {
                    if (e.target.value === 'all') {
                      const { condition, ...rest } = currentStep;
                      handleUpdateStep(currentStep.id, rest);
                    } else {
                      handleUpdateStep(currentStep.id, {
                        condition: {
                          type: e.target.value as any,
                          stepId: campaign.steps[Math.max(0, campaign.steps.indexOf(currentStep) - 1)]?.id
                        }
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Отправить всем</option>
                  <option value="opened">Только тем, кто открыл предыдущее</option>
                  <option value="clicked">Только тем, кто кликнул в предыдущем</option>
                  <option value="not_opened">Только тем, кто НЕ открыл предыдущее</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowStepEditor(false);
                  setSelectedStep(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Закрыть
              </button>
              <button
                onClick={() => handleDeleteStep(currentStep.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                🗑 Удалить шаг
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaignEditor;
