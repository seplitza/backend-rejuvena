import { useState } from 'react';

interface AIDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (result: EnhancedDescription) => void;
  onRegenerate: (additionalPrompt: string) => void;
  result: EnhancedDescription | null;
  loading: boolean;
  error: string | null;
}

interface EnhancedDescription {
  description: string;
  shortDescription: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export default function AIDescriptionModal({
  isOpen,
  onClose,
  onAccept,
  onRegenerate,
  result,
  loading,
  error
}: AIDescriptionModalProps) {
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'description' | 'short' | 'seo'>('description');

  if (!isOpen) return null;

  const handleAccept = () => {
    if (result) {
      onAccept(result);
      onClose();
    }
  };

  const handleRegenerate = () => {
    if (additionalPrompt.trim()) {
      onRegenerate(additionalPrompt);
      setAdditionalPrompt('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1F2937' }}>
            ✨ Улучшенное описание от ИИ
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              color: '#6B7280'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid #E5E7EB',
                borderTopColor: '#4F46E5',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }} />
              <p style={{ fontSize: '16px', fontWeight: '500' }}>
                Генерирую улучшенное описание...
              </p>
              <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '8px' }}>
                Это может занять 10-30 секунд
              </p>
            </div>
          )}

          {error && (
            <div style={{
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '16px',
              color: '#991B1B',
              marginBottom: '16px'
            }}>
              <strong>Ошибка:</strong> {error}
            </div>
          )}

          {result && !loading && (
            <>
              {/* Tabs */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                borderBottom: '2px solid #E5E7EB'
              }}>
                {[
                  { key: 'description', label: '📄 Полное описание' },
                  { key: 'short', label: '📝 Краткое описание' },
                  { key: 'seo', label: '🔍 SEO метаданные' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    style={{
                      padding: '12px 20px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === tab.key ? '2px solid #4F46E5' : '2px solid transparent',
                      color: activeTab === tab.key ? '#4F46E5' : '#6B7280',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '-2px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Description Tab */}
              {activeTab === 'description' && (
                <div style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '20px',
                  background: '#F9FAFB',
                  minHeight: '300px'
                }}>
                  <div dangerouslySetInnerHTML={{ __html: result.description }} />
                </div>
              )}

              {/* Short Description Tab */}
              {activeTab === 'short' && (
                <div style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '20px',
                  background: '#F9FAFB'
                }}>
                  <p style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#1F2937',
                    margin: 0
                  }}>
                    {result.shortDescription}
                  </p>
                  <div style={{
                    marginTop: '12px',
                    fontSize: '12px',
                    color: '#6B7280'
                  }}>
                    Длина: {result.shortDescription.length} символов
                  </div>
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Title */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      SEO Title
                    </label>
                    <div style={{
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      background: '#F9FAFB',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {result.seo.title}
                      <div style={{
                        marginTop: '4px',
                        fontSize: '12px',
                        color: result.seo.title.length <= 60 ? '#10B981' : '#EF4444'
                      }}>
                        {result.seo.title.length} / 60 символов
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      SEO Description
                    </label>
                    <div style={{
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      background: '#F9FAFB',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {result.seo.description}
                      <div style={{
                        marginTop: '4px',
                        fontSize: '12px',
                        color: result.seo.description.length <= 160 ? '#10B981' : '#EF4444'
                      }}>
                        {result.seo.description.length} / 160 символов
                      </div>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Keywords
                    </label>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      {result.seo.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          style={{
                            padding: '6px 12px',
                            background: '#EEF2FF',
                            color: '#4F46E5',
                            borderRadius: '16px',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Prompt */}
              <div style={{ marginTop: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  💡 Дополнительные уточнения для ИИ
                </label>
                <textarea
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                  placeholder="Например: Сделай описание более эмоциональным, добавь больше технических деталей..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '80px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {result && !loading && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleRegenerate}
              disabled={!additionalPrompt.trim()}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: additionalPrompt.trim() ? '#F59E0B' : '#E5E7EB',
                color: additionalPrompt.trim() ? 'white' : '#9CA3AF',
                fontSize: '14px',
                fontWeight: '600',
                cursor: additionalPrompt.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              🔄 Генерировать новый вариант
            </button>
            <button
              onClick={handleAccept}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: '#10B981',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✅ Принять и применить
            </button>
          </div>
        )}
      </div>

      {/* Animation CSS */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
