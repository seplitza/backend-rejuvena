import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9527';

interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

interface Campaign {
  _id: string;
  name: string;
  description?: string;
  trigger: {
    type: string;
    marathonId?: { _id: string; title: string };
    dayNumber?: number;
  };
  steps: any[];
  isActive: boolean;
  stats: CampaignStats;
  createdAt: string;
}

const EmailCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/api/admin/email-campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data.campaigns || []);
    } catch (error) {
      console.error('Fetch campaigns error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API_URL}/api/admin/email-campaigns/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Toggle campaign error:', error);
      alert('Ошибка переключения статуса');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(`${API_URL}/api/admin/email-campaigns/${id}/duplicate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCampaigns();
      navigate(`/email-campaigns/${response.data.campaign._id}`);
    } catch (error) {
      console.error('Duplicate campaign error:', error);
      alert('Ошибка копирования кампании');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API_URL}/api/admin/email-campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCampaigns();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete campaign error:', error);
      alert('Ошибка удаления кампании');
    }
  };

  const getTriggerLabel = (trigger: Campaign['trigger']) => {
    const labels: Record<string, string> = {
      marathon_enrollment: '📝 Запись на марафон',
      marathon_start: '🚀 Старт марафона',
      marathon_day: '📅 День марафона',
      marathon_completion: '🎉 Завершение',
      premium_purchased: '💎 Покупка премиум',
      manual: '👤 Ручной запуск'
    };
    
    let label = labels[trigger.type] || trigger.type;
    if (trigger.marathonId) {
      label += ` - ${trigger.marathonId.title}`;
    }
    if (trigger.dayNumber) {
      label += ` (день ${trigger.dayNumber})`;
    }
    return label;
  };

  const calculateOpenRate = (stats: CampaignStats) => {
    if (stats.sent === 0) return '0';
    return ((stats.opened / stats.sent) * 100).toFixed(1);
  };

  const calculateClickRate = (stats: CampaignStats) => {
    if (stats.sent === 0) return '0';
    return ((stats.clicked / stats.sent) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🚀 Email Кампании</h1>
          <p className="text-gray-600 mt-1">Визуальный конструктор автоматических цепочек писем</p>
        </div>
        <button
          onClick={() => navigate('/email-campaigns/new')}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition shadow-lg"
        >
          + Создать кампанию
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📧</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Нет кампаний</h3>
          <p className="text-gray-500 mb-6">Создайте первую автоматическую цепочку писем</p>
          <button
            onClick={() => navigate('/email-campaigns/new')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            Создать кампанию
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign._id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{campaign.name}</h3>
                      {campaign.isActive ? (
                        <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                          ✓ Активна
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                          ⏸ Неактивна
                        </span>
                      )}
                    </div>
                    {campaign.description && (
                      <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{getTriggerLabel(campaign.trigger)}</span>
                      <span>•</span>
                      <span>{campaign.steps.length} шагов</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{campaign.stats.sent}</div>
                    <div className="text-xs text-gray-500">Отправлено</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{calculateOpenRate(campaign.stats)}%</div>
                    <div className="text-xs text-gray-500">Открытий</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{calculateClickRate(campaign.stats)}%</div>
                    <div className="text-xs text-gray-500">Кликов</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/email-campaigns/${campaign._id}`)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                  >
                    ✏️ Редактировать
                  </button>
                  <button
                    onClick={() => navigate(`/email-campaigns/${campaign._id}/analytics`)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                  >
                    📊
                  </button>
                  <button
                    onClick={() => handleToggleActive(campaign._id)}
                    className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
                      campaign.isActive
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {campaign.isActive ? '⏸' : '▶'}
                  </button>
                  <button
                    onClick={() => handleDuplicate(campaign._id)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                  >
                    📋
                  </button>
                  {deleteConfirm === campaign._id ? (
                    <>
                      <button
                        onClick={() => handleDelete(campaign._id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(campaign._id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailCampaigns;
