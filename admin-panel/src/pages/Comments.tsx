import { useState, useEffect } from 'react';
import { API_URL, getAuthHeaders } from '../config';

interface Comment {
  _id: string;
  userId: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  exerciseId?: {
    _id: string;
    title: string;
  };
  marathonId?: {
    _id: string;
    title: string;
  };
  marathonDayNumber?: number;
  content: string;
  parentCommentId?: string;
  isPrivate: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  priority: 'normal' | 'urgent';
  adminResponseId?: any;
  respondedBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  respondedAt?: Date;
  likes: number;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  replies?: Comment[];
}

interface CommentThread {
  comment: Comment;
  replies: Comment[];
  parentComment?: Comment | null;
}

export default function Comments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [needsResponse, setNeedsResponse] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Statistics
  const [stats, setStats] = useState({ pending: 0, urgent: 0, needsResponse: 0 });
  
  // Modals
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [threadData, setThreadData] = useState<CommentThread | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  
  // Response form
  const [responseContent, setResponseContent] = useState('');
  const [responsePrivate, setResponsePrivate] = useState(false);
  
  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadComments();
  }, [statusFilter, priorityFilter, needsResponse, searchTerm]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (needsResponse) params.append('needsResponse', 'true');
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '100');

      const response = await fetch(`${API_URL}/api/admin/comments?${params}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        setComments(data.comments);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      alert('Ошибка загрузки комментариев');
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (commentId: string) => {
    try {
      setLoadingThread(true);
      const response = await fetch(`${API_URL}/api/admin/comments/${commentId}/thread`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        setThreadData(data.data);
      }
    } catch (error) {
      console.error('Error loading thread:', error);
      alert('Ошибка загрузки цепочки комментариев');
    } finally {
      setLoadingThread(false);
    }
  };

  const openCommentModal = async (comment: Comment) => {
    setSelectedComment(comment);
    await loadThread(comment._id);
  };

  const closeCommentModal = () => {
    setSelectedComment(null);
    setThreadData(null);
    setResponseContent('');
    setResponsePrivate(false);
    setAiSuggestions([]);
  };

  const updateStatus = async (commentId: string, status: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/comments/${commentId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (data.success) {
        loadComments();
        if (selectedComment?._id === commentId) {
          setSelectedComment({ ...selectedComment, status: status as any });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ошибка обновления статуса');
    }
  };

  const updatePriority = async (commentId: string, priority: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/comments/${commentId}/priority`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ priority })
      });

      const data = await response.json();
      if (data.success) {
        loadComments();
        if (selectedComment?._id === commentId) {
          setSelectedComment({ ...selectedComment, priority: priority as any });
        }
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      alert('Ошибка обновления приоритета');
    }
  };

  const respondToComment = async () => {
    if (!selectedComment || !responseContent.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/comments/${selectedComment._id}/respond`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: responseContent,
          isPrivate: responsePrivate
        })
      });

      const data = await response.json();
      if (data.success) {
        setResponseContent('');
        loadComments();
        await loadThread(selectedComment._id);
        alert('Ответ отправлен!');
      }
    } catch (error) {
      console.error('Error responding:', error);
      alert('Ошибка отправки ответа');
    }
  };

  const getAiSuggestions = async () => {
    if (!selectedComment) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/comments/${selectedComment._id}/ai-suggest`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        setAiSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Удалить комментарий и все ответы?')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        loadComments();
        closeCommentModal();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Ошибка удаления');
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: '#FEF3C7', color: '#92400E', text: 'На модерации' },
      approved: { bg: '#D1FAE5', color: '#065F46', text: 'Одобрен' },
      rejected: { bg: '#FEE2E2', color: '#991B1B', text: 'Отклонен' },
      spam: { bg: '#E5E7EB', color: '#374151', text: 'Спам' }
    }[status] || { bg: '#F3F4F6', color: '#6B7280', text: status };

    return (
      <span style={{
        padding: '4px 12px',
        background: styles.bg,
        color: styles.color,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {styles.text}
      </span>
    );
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>
        Модерация комментариев
      </h1>

      {/* Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>На модерации</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F59E0B' }}>{stats.pending}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Горящие</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#EF4444' }}>{stats.urgent}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Ждут ответа</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3B82F6' }}>{stats.needsResponse}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Всего комментариев</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1F2937' }}>{comments.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Поиск по тексту комментария..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '300px',
            padding: '10px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          <option value="all">Все статусы</option>
          <option value="pending">На модерации</option>
          <option value="approved">Одобренные</option>
          <option value="rejected">Отклоненные</option>
          <option value="spam">Спам</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          <option value="all">Все приоритеты</option>
          <option value="urgent">Горящие</option>
          <option value="normal">Обычные</option>
        </select>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: '#F3F4F6',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          <input
            type="checkbox"
            checked={needsResponse}
            onChange={(e) => setNeedsResponse(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          Только ждущие ответа
        </label>

        <button
          onClick={loadComments}
          style={{
            padding: '10px 20px',
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Обновить
        </button>
      </div>

      {/* Comments List */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
            Загрузка...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
            Комментарии не найдены
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#E5E7EB' }}>
            {comments.map((comment) => (
              <div
                key={comment._id}
                style={{
                  background: 'white',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onClick={() => openCommentModal(comment)}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    {/* User info */}
                    <div>
                      <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '2px' }}>
                        {comment.userId.firstName || comment.userId.lastName
                          ? `${comment.userId.firstName || ''} ${comment.userId.lastName || ''}`.trim()
                          : 'Без имени'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6B7280' }}>
                        {comment.userId.email}
                      </div>
                    </div>

                    {/* Context badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {comment.exerciseId && (
                        <span style={{
                          padding: '4px 10px',
                          background: '#DBEAFE',
                          color: '#1E40AF',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          📝 {comment.exerciseId.title}
                        </span>
                      )}
                      {comment.marathonId && (
                        <span style={{
                          padding: '4px 10px',
                          background: '#E0E7FF',
                          color: '#4338CA',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          🏃 {comment.marathonId.title}
                          {comment.marathonDayNumber && ` (День ${comment.marathonDayNumber})`}
                        </span>
                      )}
                      {comment.isPrivate && (
                        <span style={{
                          padding: '4px 10px',
                          background: '#FEF3C7',
                          color: '#92400E',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          🔒 Личное
                        </span>
                      )}
                      {comment.priority === 'urgent' && (
                        <span style={{
                          padding: '4px 10px',
                          background: '#FEE2E2',
                          color: '#991B1B',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          🔥 Горящее
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {getStatusBadge(comment.status)}
                    {comment.adminResponseId ? (
                      <span style={{
                        padding: '4px 10px',
                        background: '#D1FAE5',
                        color: '#065F46',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        ✓ Отвечено
                      </span>
                    ) : comment.status === 'approved' && (
                      <span style={{
                        padding: '4px 10px',
                        background: '#FEF3C7',
                        color: '#92400E',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        ⏳ Ждет ответа
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  fontSize: '14px',
                  color: '#1F2937',
                  marginBottom: '12px',
                  lineHeight: '1.6'
                }}>
                  {comment.content}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: '#9CA3AF'
                }}>
                  <div>
                    {formatDate(comment.createdAt)}
                    {comment.isEdited && ' (отредактировано)'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {comment.likes > 0 && <div>❤️ {comment.likes}</div>}
                    {comment.respondedAt && comment.respondedBy && (
                      <div>
                        Ответил: {comment.respondedBy.firstName || 'Admin'} ({formatDate(comment.respondedAt)})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Detail Modal */}
      {selectedComment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          overflow: 'auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #E5E7EB',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Комментарий от {selectedComment.userId.firstName || selectedComment.userId.email}
                  </h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                    {getStatusBadge(selectedComment.status)}
                    
                    <select
                      value={selectedComment.status}
                      onChange={(e) => updateStatus(selectedComment._id, e.target.value)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="pending">На модерации</option>
                      <option value="approved">Одобрить</option>
                      <option value="rejected">Отклонить</option>
                      <option value="spam">Спам</option>
                    </select>

                    <select
                      value={selectedComment.priority}
                      onChange={(e) => updatePriority(selectedComment._id, e.target.value)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="normal">Обычный</option>
                      <option value="urgent">🔥 Горящий</option>
                    </select>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteComment(selectedComment._id);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#FEE2E2',
                        color: '#991B1B',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <button
                  onClick={closeCommentModal}
                  style={{
                    padding: '8px 16px',
                    background: '#F3F4F6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✕ Закрыть
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {loadingThread ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                  Загрузка цепочки...
                </div>
              ) : threadData ? (
                <div>
                  {/* Parent comment if exists */}
                  {threadData.parentComment && (
                    <div style={{
                      padding: '16px',
                      background: '#F9FAFB',
                      borderRadius: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                        Ответ на комментарий:
                      </div>
                      <div style={{ fontSize: '14px', color: '#4B5563' }}>
                        {threadData.parentComment.content}
                      </div>
                    </div>
                  )}

                  {/* Main comment */}
                  <div style={{
                    padding: '20px',
                    background: '#FFFFFF',
                    border: '2px solid #3B82F6',
                    borderRadius: '12px',
                    marginBottom: '24px'
                  }}>
                    <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#1F2937' }}>
                      {threadData.comment.content}
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '13px', color: '#6B7280' }}>
                      {formatDate(threadData.comment.createdAt)}
                      {threadData.comment.isEdited && ' (отредактировано)'}
                    </div>
                  </div>

                  {/* Replies */}
                  {threadData.replies.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                        Ответы ({threadData.replies.length})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {threadData.replies.map((reply) => (
                          <div
                            key={reply._id}
                            style={{
                              padding: '16px',
                              background: '#F9FAFB',
                              borderRadius: '12px',
                              borderLeft: '3px solid #10B981'
                            }}
                          >
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
                              {reply.userId.firstName || reply.userId.email}
                              {reply.userId._id !== selectedComment.userId._id && (
                                <span style={{
                                  marginLeft: '8px',
                                  padding: '2px 8px',
                                  background: '#D1FAE5',
                                  color: '#065F46',
                                  borderRadius: '4px',
                                  fontSize: '11px'
                                }}>
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '14px', color: '#4B5563', marginBottom: '8px' }}>
                              {reply.content}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                              {formatDate(reply.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response form */}
                  <div style={{
                    padding: '20px',
                    background: '#F9FAFB',
                    borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
                        Ответить на комментарий
                      </h3>
                      <button
                        onClick={getAiSuggestions}
                        style={{
                          padding: '8px 16px',
                          background: '#8B5CF6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        🤖 AI подсказки
                      </button>
                    </div>

                    {aiSuggestions.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                          Предложения AI:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {aiSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => setResponseContent(suggestion)}
                              style={{
                                padding: '10px 14px',
                                background: 'white',
                                border: '1px solid #D1D5DB',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: '13px',
                                color: '#4B5563'
                              }}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <textarea
                      value={responseContent}
                      onChange={(e) => setResponseContent(e.target.value)}
                      placeholder="Введите ваш ответ..."
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        marginBottom: '12px',
                        resize: 'vertical'
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}>
                        <input
                          type="checkbox"
                          checked={responsePrivate}
                          onChange={(e) => setResponsePrivate(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        Личный ответ (только для автора)
                      </label>

                      <button
                        onClick={respondToComment}
                        disabled={!responseContent.trim()}
                        style={{
                          padding: '12px 24px',
                          background: responseContent.trim() ? '#10B981' : '#E5E7EB',
                          color: responseContent.trim() ? 'white' : '#9CA3AF',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: responseContent.trim() ? 'pointer' : 'not-allowed',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        Отправить ответ
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
