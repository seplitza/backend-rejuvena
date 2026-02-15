/**
 * Email Templates Management Page - Admin Panel
 * Edit and customize email notification templates
 */

import { useState, useEffect } from 'react';
import { getAuthHeaders, API_URL } from '../config';

interface EmailTemplate {
  _id: string;
  type: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  variables: string[];
  description: string;
  isActive: boolean;
  language: string;
}

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/email-templates`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      alert('Ошибка загрузки шаблонов');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate({ ...template });
    setShowModal(true);
    setPreview(null);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/email-templates/${selectedTemplate._id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedTemplate.name,
          subject: selectedTemplate.subject,
          htmlTemplate: selectedTemplate.htmlTemplate,
          variables: selectedTemplate.variables,
          description: selectedTemplate.description,
          isActive: selectedTemplate.isActive
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchTemplates();
        setShowModal(false);
        setSelectedTemplate(null);
        alert('Шаблон обновлён!');
      } else {
        alert(data.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Ошибка сохранения шаблона');
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;

    try {
      const sampleData: { [key: string]: string } = {};
      selectedTemplate.variables.forEach(v => {
        switch (v) {
          case 'marathonTitle':
            sampleData[v] = 'Омоложение за 21 день';
            break;
          case 'startDate':
            sampleData[v] = new Date().toLocaleDateString('ru-RU', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            });
            break;
          case 'numberOfDays':
          case 'totalDays':
            sampleData[v] = '21';
            break;
          case 'dayNumber':
            sampleData[v] = '5';
            break;
          case 'completedDays':
            sampleData[v] = '21';
            break;
          case 'progressPercent':
          case 'completionPercent':
            sampleData[v] = '75';
            break;
          case 'marathonUrl':
            sampleData[v] = 'https://seplitza.github.io/rejuvena/marathons';
            break;
          case 'telegramUrl':
            sampleData[v] = `<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 18px; color: #1976d2; font-weight: 600;">📱 Присоединяйтесь к нашему сообществу</p>
              <p style="margin: 0 0 15px 0; font-size: 14px; color: #1565c0;">Прямые эфиры, поддержка, обмен опытом</p>
              <a href="https://t.me/rejuvena_community" style="display: inline-block; background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Открыть Telegram →</a>
            </div>`;
            break;
        }
      });

      const response = await fetch(`${API_URL}/api/admin/email-templates/${selectedTemplate._id}/preview`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sampleData })
      });

      const data = await response.json();
      if (data.success) {
        setPreview(data.preview);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Ошибка генерации превью');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: { text: string; color: string } } = {
      enrollment: { text: 'Запись', color: '#10b981' },
      pre_start_reminder: { text: 'Напоминание', color: '#f59e0b' },
      start: { text: 'Старт', color: '#3b82f6' },
      daily_reminder: { text: 'Ежедневно', color: '#8b5cf6' },
      completion: { text: 'Завершение', color: '#ec4899' }
    };
    return labels[type] || { text: type, color: '#6b7280' };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#1f2937' }}>
          📧 Email-шаблоны
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '15px' }}>
          Настройка писем для марафонов
        </p>
      </div>

      <div style={{
        display: 'grid',
        gap: '20px',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
      }}>
        {templates.map(template => {
          const typeLabel = getTypeLabel(template.type);
          return (
            <div
              key={template._id}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onClick={() => handleEdit(template)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  background: typeLabel.color + '15',
                  color: typeLabel.color,
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {typeLabel.text}
                </span>
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '6px',
                  background: template.isActive ? '#10b981' : '#d1d5db',
                  display: 'inline-block'
                }} />
              </div>

              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1f2937' }}>
                {template.name}
              </h3>

              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                {template.description}
              </p>

              <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                Тема: <span style={{ color: '#4b5563' }}>{template.subject}</span>
              </div>

              {template.variables.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {template.variables.slice(0, 3).map(v => (
                    <span
                      key={v}
                      style={{
                        padding: '3px 8px',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                    >
                      {'{' + v + '}'}
                    </span>
                  ))}
                  {template.variables.length > 3 && (
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                      +{template.variables.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {showModal && selectedTemplate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 30px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#1f2937' }}>
                  {selectedTemplate.name}
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                  {selectedTemplate.description}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedTemplate(null);
                  setPreview(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Закрыть
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '30px', display: 'flex', gap: '30px' }}>
              {/* Left: Editor */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Тема письма
                  </label>
                  <input
                    type="text"
                    value={selectedTemplate.subject}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    HTML-шаблон
                  </label>
                  <textarea
                    value={selectedTemplate.htmlTemplate}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, htmlTemplate: e.target.value })}
                    style={{
                      width: '100%',
                      height: '400px',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedTemplate.isActive}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, isActive: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>Шаблон активен</span>
                  </label>
                </div>

                {selectedTemplate.variables.length > 0 && (
                  <div style={{
                    padding: '15px',
                    background: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '500', color: '#6b7280' }}>
                      Доступные переменные:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedTemplate.variables.map(v => (
                        <code
                          key={v}
                          style={{
                            padding: '4px 10px',
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#1f2937',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            navigator.clipboard.writeText(`{${v}}`);
                            alert('Скопировано!');
                          }}
                        >
                          {'{' + v + '}'}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Preview */}
              <div style={{ flex: 1, borderLeft: '1px solid #e5e7eb', paddingLeft: '30px' }}>
                <button
                  onClick={handlePreview}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '500',
                    marginBottom: '20px'
                  }}
                >
                  👁 Предпросмотр
                </button>

                {preview ? (
                  <div>
                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                        ТЕМА:
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#1f2937', padding: '10px', background: '#f9fafb', borderRadius: '6px' }}>
                        {preview.subject}
                      </p>
                    </div>

                    <div style={{ border: '2px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                      <iframe
                        srcDoc={preview.html}
                        style={{
                          width: '100%',
                          height: '600px',
                          border: 'none'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    height: '600px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    fontSize: '14px'
                  }}>
                    Нажмите "Предпросмотр" для отображения письма
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 30px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedTemplate(null);
                  setPreview(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
