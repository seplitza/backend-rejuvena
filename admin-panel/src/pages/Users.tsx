import { useState, useEffect } from 'react';
import { API_URL, getAuthHeaders } from '../config';

interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  telegramUsername?: string;
  isPremium?: boolean;
  premiumEndDate?: Date;
  contactsEnabled?: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  stats: {
    totalPayments: number;
    totalSpent: number;
    lastPaymentDate?: Date;
    lastPaymentAmount?: number;
    totalOrders: number;
    totalOrdersAmount: number;
    paidOrders: number;
    lastOrderDate?: Date;
    activeMarathons: number;
    completedMarathons: number;
    totalMarathons: number;
    completedExercises: number;
    totalExercises: number;
    completionRate: number;
    exercisePurchases: number;
    notesCount: number;
    badgesCount: number;
    premiumDaysLeft: number;
  };
}

interface UserDetails {
  user: User & {
    personalDiscount?: number;
    personalDiscountExpiry?: Date;
  };
  payments: any[];
  marathons: any[];
  exercisePurchases: any[];
  notes: any[];
  badges: any[];
  orders: any[];
  summary: {
    totalSpent: number;
    totalPayments: number;
    successfulPayments: number;
    activeMarathons: number;
    completedMarathons: number;
    totalExercises: number;
    completedExercises: number;
    totalOrders: number;
    totalOrdersAmount: number;
    paidOrders: number;
  };
}

// Helper functions
const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ₽';
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPremium, setFilterPremium] = useState<string>('all');
  const [filterContacts, setFilterContacts] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'email' | 'telegram'>('note');
  const [activeTab, setActiveTab] = useState<'purchases' | 'marathons' | 'notes' | 'badges' | 'orders'>('orders');
  
  // Personal discount state
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountExpiry, setDiscountExpiry] = useState<string>('');
  
  // Multi-select state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    loadUsers();
  }, [searchTerm, filterPremium, filterContacts, sortBy, sortOrder]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterPremium !== 'all') params.append('isPremium', filterPremium);
      if (filterContacts !== 'all') params.append('contactsEnabled', filterContacts);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('limit', '100');

      const response = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/details`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        setUserDetails(data.data);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      alert('Ошибка загрузки деталей пользователя');
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleContacts = async (userId: string, enabled: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/contacts`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled })
      });

      const data = await response.json();
      if (data.success) {
        loadUsers();
        if (selectedUser?._id === userId) {
          setSelectedUser({ ...selectedUser, contactsEnabled: enabled });
        }
      }
    } catch (error) {
      console.error('Error toggling contacts:', error);
      alert('Ошибка обновления контактов');
    }
  };

  const addNote = async () => {
    if (!selectedUser || !noteContent.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${selectedUser._id}/notes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: noteContent,
          type: noteType
        })
      });

      const data = await response.json();
      if (data.success) {
        setNoteContent('');
        loadUserDetails(selectedUser._id);
        loadUsers(); // Refresh to update notes count
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Ошибка добавления заметки');
    }
  };

  const updatePersonalDiscount = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${selectedUser._id}/discount`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          personalDiscount: discountValue > 0 ? discountValue : null,
          personalDiscountExpiry: discountExpiry ? new Date(discountExpiry).toISOString() : null
        })
      });

      const data = await response.json();
      if (data.success) {
        setEditingDiscount(false);
        loadUserDetails(selectedUser._id);
        loadUsers();
        alert('Скидка обновлена успешно!');
      }
    } catch (error) {
      console.error('Error updating discount:', error);
      alert('Ошибка обновления скидки');
    }
  };

  const startEditingDiscount = () => {
    if (userDetails?.user) {
      setDiscountValue(userDetails.user.personalDiscount || 0);
      const expiry = userDetails.user.personalDiscountExpiry;
      if (expiry) {
        const date = new Date(expiry);
        setDiscountExpiry(date.toISOString().split('T')[0]);
      } else {
        setDiscountExpiry('');
      }
      setEditingDiscount(true);
    }
  };

  const openUserModal = (user: User) => {
    setSelectedUser(user);
    loadUserDetails(user._id);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setUserDetails(null);
    setNoteContent('');
  };

  // Multi-select handlers
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(u => u._id));
    }
  };

  const clearSelection = () => {
    setSelectedUserIds([]);
  };

  // Bulk actions
  const exportSelectedToCSV = () => {
    const selectedUsers = users.filter(u => selectedUserIds.includes(u._id));
    const csv = [
      ['Email', 'Имя', 'Telegram', 'Премиум', 'Контакты', 'Марафоны', 'Покупок', 'Сумма'].join(','),
      ...selectedUsers.map(u => [
        u.email,
        `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        u.telegramUsername || '',
        u.isPremium ? 'Да' : 'Нет',
        u.contactsEnabled ? 'Да' : 'Нет',
        u.stats.totalMarathons,
        u.stats.totalPayments,
        (u.stats.totalSpent / 100).toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const addSelectedToMailingList = () => {
    const selectedUsers = users.filter(u => selectedUserIds.includes(u._id));
    const emails = selectedUsers
      .filter(u => u.contactsEnabled)
      .map(u => u.email)
      .join(', ');
    
    if (emails) {
      navigator.clipboard.writeText(emails);
      alert(`${selectedUsers.filter(u => u.contactsEnabled).length} email-адресов скопированы в буфер обмена!`);
    } else {
      alert('Среди выбранных пользователей нет тех, кто разрешил контакты.');
    }
  };

  const sendBulkMessage = () => {
    const selectedUsers = users.filter(u => selectedUserIds.includes(u._id));
    const message = prompt(
      `Отправить сообщение ${selectedUsers.length} пользователям?\n\nВведите текст сообщения:`
    );
    
    if (message) {
      // TODO: Implement bulk messaging via API
      alert(`Функция массовой рассылки будет реализована в следующей версии.\n\nСообщение готово для отправки ${selectedUsers.length} пользователям.`);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>
        CRM - Управление пользователями
      </h1>

      {/* Bulk Actions Bar */}
      {selectedUserIds.length > 0 && (
        <div style={{
          background: '#EEF2FF',
          border: '2px solid #6366F1',
          padding: '16px 24px',
          borderRadius: '12px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>
              Выбрано: <span style={{ color: '#6366F1' }}>{selectedUserIds.length}</span> пользователей
            </div>
            <button
              onClick={clearSelection}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                color: '#6B7280',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              ✕ Снять выбор
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={addSelectedToMailingList}
              style={{
                padding: '10px 20px',
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ✉️ Скопировать email-ы
            </button>
            <button
              onClick={sendBulkMessage}
              style={{
                padding: '10px 20px',
                background: '#6366F1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              💬 Отправить сообщение
            </button>
            <button
              onClick={exportSelectedToCSV}
              style={{
                padding: '10px 20px',
                background: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📥 Экспорт CSV
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px',
        marginBottom: '24px',
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Поиск по имени или email..."
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
          value={filterPremium}
          onChange={(e) => setFilterPremium(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          <option value="all">Все пользователи</option>
          <option value="true">Премиум</option>
          <option value="false">Без премиума</option>
        </select>

        <select
          value={filterContacts}
          onChange={(e) => setFilterContacts(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          <option value="all">Все контакты</option>
          <option value="true">Контакты разрешены</option>
          <option value="false">Контакты запрещены</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          <option value="createdAt">По дате регистрации</option>
          <option value="lastLoginAt">По последнему заходу</option>
          <option value="email">По email</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          style={{
            padding: '10px 16px',
            background: '#F3F4F6',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {sortOrder === 'asc' ? '↑ По возрастанию' : '↓ По убыванию'}
        </button>

        <button
          onClick={loadUsers}
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

      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Всего пользователей</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1F2937' }}>{users.length}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Премиум</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10B981' }}>
            {users.filter(u => u.isPremium).length}
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Активных марафонов</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3B82F6' }}>
            {users.reduce((sum, u) => sum + u.stats.activeMarathons, 0)}
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Общая выручка</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8B5CF6' }}>
            {formatMoney(users.reduce((sum, u) => sum + u.stats.totalSpent + u.stats.totalOrdersAmount, 0))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
            Загрузка...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
            Пользователи не найдены
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6B7280', width: '50px' }}>
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selectedUserIds.length === users.length}
                      onChange={toggleAllUsers}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: '#3B82F6'
                      }}
                    />
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                    Пользователь
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                    Статус
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                    Марафоны
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                    Прогресс
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                    Покупки
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                    Последний заход
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                    Контакты
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                    Заметки
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr 
                    key={user._id} 
                    style={{ 
                      borderBottom: '1px solid #F3F4F6',
                      background: selectedUserIds.includes(user._id) ? '#F0F9FF' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user._id)}
                        onChange={() => toggleUserSelection(user._id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#3B82F6'
                        }}
                      />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                          {user.firstName || user.lastName 
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : 'Без имени'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6B7280' }}>{user.email}</div>
                        {user.telegramUsername && (
                          <div style={{ fontSize: '12px', color: '#3B82F6', marginTop: '2px' }}>
                            @{user.telegramUsername}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {user.isPremium ? (
                        <div>
                          <div style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            background: '#D1FAE5',
                            color: '#065F46',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            ПРЕМИУМ
                          </div>
                          {user.stats.premiumDaysLeft > 0 && (
                            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                              {user.stats.premiumDaysLeft} дн.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: '#F3F4F6',
                          color: '#6B7280',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          БАЗОВЫЙ
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', color: '#1F2937' }}>
                        {user.stats.totalMarathons > 0 ? (
                          <>
                            <div>Активных: <strong>{user.stats.activeMarathons}</strong></div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>
                              Завершено: {user.stats.completedMarathons}
                            </div>
                          </>
                        ) : '—'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {user.stats.totalExercises > 0 ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{
                              flex: 1,
                              height: '8px',
                              background: '#E5E7EB',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${user.stats.completionRate}%`,
                                background: user.stats.completionRate >= 70 ? '#10B981' : 
                                          user.stats.completionRate >= 40 ? '#F59E0B' : '#EF4444',
                                transition: 'width 0.3s'
                              }} />
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '600', minWidth: '40px' }}>
                              {user.stats.completionRate}%
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>
                            {user.stats.completedExercises} / {user.stats.totalExercises}
                          </div>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {user.stats.totalPayments > 0 || user.stats.totalOrders > 0 ? (
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>
                            {formatMoney(user.stats.totalSpent + user.stats.totalOrdersAmount)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>
                            {user.stats.totalPayments + user.stats.totalOrders} покупок
                          </div>
                          {(user.stats.lastPaymentDate || user.stats.lastOrderDate) && (
                            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                              {formatDate(user.stats.lastPaymentDate && user.stats.lastOrderDate 
                                ? (new Date(user.stats.lastPaymentDate) > new Date(user.stats.lastOrderDate) 
                                  ? user.stats.lastPaymentDate 
                                  : user.stats.lastOrderDate)
                                : (user.stats.lastPaymentDate || user.stats.lastOrderDate)
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#9CA3AF' }}>Нет покупок</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#6B7280' }}>
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleContacts(user._id, !user.contactsEnabled)}
                        style={{
                          padding: '6px 12px',
                          background: user.contactsEnabled ? '#D1FAE5' : '#FEE2E2',
                          color: user.contactsEnabled ? '#065F46' : '#991B1B',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {user.contactsEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                      </button>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {user.stats.notesCount > 0 ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          background: '#DBEAFE',
                          color: '#1E40AF',
                          borderRadius: '50%',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {user.stats.notesCount}
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        onClick={() => openUserModal(user)}
                        style={{
                          padding: '8px 16px',
                          background: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        Подробнее
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
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
            maxWidth: '1200px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
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
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {selectedUser.firstName || selectedUser.lastName
                      ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()
                      : 'Без имени'}
                  </h2>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>
                    {selectedUser.email}
                    {selectedUser.telegramUsername && (
                      <span style={{ marginLeft: '12px', color: '#3B82F6' }}>
                        @{selectedUser.telegramUsername}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#9CA3AF' }}>
                    Регистрация: {formatDate(selectedUser.createdAt)}
                  </div>
                </div>
                <button
                  onClick={closeUserModal}
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

            {loadingDetails ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
                Загрузка деталей...
              </div>
            ) : userDetails ? (
              <div style={{ padding: '24px' }}>
                {/* Summary Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                  marginBottom: '32px'
                }}>
                  <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Всего потрачено</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1F2937' }}>
                      {formatMoney(userDetails.summary?.totalSpent || 0)}
                    </div>
                  </div>
                  <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Заказов</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1F2937' }}>
                      {userDetails.summary?.paidOrders || 0} / {userDetails.summary?.totalOrders || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                      {formatMoney(userDetails.summary?.totalOrdersAmount || 0)}
                    </div>
                  </div>
                  <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Платежей</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1F2937' }}>
                      {userDetails.summary?.successfulPayments || 0} / {userDetails.summary?.totalPayments || 0}
                    </div>
                  </div>
                  <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Марафоны</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1F2937' }}>
                      {userDetails.summary?.activeMarathons || 0} / {userDetails.marathons?.length || 0}
                    </div>
                  </div>
                  <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Упражнения</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1F2937' }}>
                      {userDetails.summary?.completedExercises || 0} / {userDetails.summary?.totalExercises || 0}
                    </div>
                  </div>
                  <div style={{ 
                    background: userDetails.user?.personalDiscount ? '#FEF3C7' : '#F9FAFB', 
                    padding: '16px', 
                    borderRadius: '12px',
                    border: userDetails.user?.personalDiscount ? '2px solid #F59E0B' : 'none'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>Личная скидка 🎁</div>
                      <button
                        onClick={startEditingDiscount}
                        style={{
                          padding: '4px 8px',
                          background: 'white',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        ✏️ Изменить
                      </button>
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1F2937' }}>
                      {userDetails.user?.personalDiscount || 0}%
                    </div>
                    {userDetails.user?.personalDiscountExpiry && (
                      <div style={{ fontSize: '11px', color: '#92400E', marginTop: '4px' }}>
                        До {new Date(userDetails.user.personalDiscountExpiry).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Discount Editor */}
                {editingDiscount && (
                  <div style={{
                    background: '#FEF3C7',
                    border: '2px solid #F59E0B',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px'
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#78350F' }}>
                      🎁 Редактирование личной скидки
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                          Размер скидки (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                          Действует до (опционально)
                        </label>
                        <input
                          type="date"
                          value={discountExpiry}
                          onChange={(e) => setDiscountExpiry(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ 
                      background: '#FEF9C3', 
                      padding: '12px', 
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#713F12',
                      marginBottom: '16px'
                    }}>
                      ℹ️ Личная скидка применяется автоматически при оформлении заказа. 
                      Может быть начислена из колеса фортуны, промокода или вручную администратором.
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={updatePersonalDiscount}
                        style={{
                          padding: '10px 20px',
                          background: '#F59E0B',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        💾 Сохранить
                      </button>
                      <button
                        onClick={() => setEditingDiscount(false)}
                        style={{
                          padding: '10px 20px',
                          background: 'white',
                          color: '#6B7280',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                    borderBottom: '1px solid #E5E7EB',
                    marginBottom: '24px'
                  }}>
                    {(() => {
                      // Фильтруем заказы: курсы vs товары
                      const courseKeywords = [
                        'курс', 'консультац', 'индивидуальная', 'индивидуальный',
                        'марафон', 'тренинг', 'вебинар', 'обучение',
                        'доступ', 'подписка', 'premium', 'омолодись',
                        'заняти', 'тренер', 'коуч', 'сеанс'
                      ];
                      const orders = userDetails.orders || [];
                      const courseOrders = orders.filter((order: any) => 
                        order.items?.some((item: any) => {
                          const productName = (item.productName || '').toLowerCase();
                          return courseKeywords.some(keyword => productName.includes(keyword));
                        })
                      );
                      const productOrders = orders.filter((order: any) => 
                        !courseOrders.some((co: any) => co._id === order._id)
                      );
                      const totalCoursePurchases = (userDetails.summary?.totalPayments || 0) + courseOrders.length;
                      
                      return [
                        { key: 'orders', label: 'Заказы товаров', count: productOrders.length },
                        { key: 'purchases', label: 'Покупки курсов', count: totalCoursePurchases },
                        { key: 'marathons', label: 'Марафоны', count: userDetails.marathons?.length || 0 },
                        { key: 'notes', label: 'Заметки', count: userDetails.notes?.length || 0 },
                        { key: 'badges', label: 'Бейджи', count: userDetails.badges?.length || 0 }
                      ];
                    })().map((tab) => (
                      <div
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        style={{
                          padding: '12px 20px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          borderBottom: activeTab === tab.key ? '2px solid #3B82F6' : '2px solid transparent',
                          color: activeTab === tab.key ? '#3B82F6' : '#6B7280',
                          transition: 'all 0.2s'
                        }}
                      >
                        {tab.label}
                        {tab.count > 0 && (
                          <span style={{
                            marginLeft: '6px',
                            padding: '2px 6px',
                            background: activeTab === tab.key ? '#DBEAFE' : '#F3F4F6',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {tab.count}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'orders' && (() => {
                    // Фильтруем только заказы товаров (не курсов)
                    const courseKeywords = ['курс', 'консультац', 'марафон', 'тренинг', 'вебинар', 'обучение', 'доступ', 'подписка', 'premium', 'омолодись'];
                    const orders = userDetails.orders || [];
                    const productOrders = orders.filter((order: any) => 
                      !order.items?.some((item: any) => 
                        courseKeywords.some(keyword => item.productName?.toLowerCase().includes(keyword))
                      )
                    );
                    
                    return (
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                        Заказы товаров ({productOrders.length})
                      </h3>
                      {productOrders.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {productOrders.map((order: any) => (
                            <div
                              key={order._id}
                              style={{
                                background: 'white',
                                border: '2px solid #E5E7EB',
                                padding: '20px',
                                borderRadius: '12px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '700' }}>
                                      Заказ #{order.orderNumber}
                                    </div>
                                    {order.orderNumber.startsWith('CRM-') && (
                                      <span style={{
                                        padding: '3px 10px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        background: '#FEF3C7',
                                        color: '#92400E'
                                      }}>
                                        📦 Из старой CRM
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '13px', color: '#6B7280' }}>
                                    {new Date(order.createdAt).toLocaleString('ru-RU', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{
                                    padding: '4px 12px',
                                    background: order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? '#D1FAE5' : 
                                               order.paymentStatus === 'awaiting_payment' ? '#FEF3C7' : '#FEE2E2',
                                    color: order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? '#065F46' :
                                           order.paymentStatus === 'awaiting_payment' ? '#92400E' : '#991B1B',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    display: 'inline-block',
                                    marginBottom: '6px'
                                  }}>
                                    {order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? '✅ Оплачен' :
                                     order.paymentStatus === 'awaiting_payment' ? '⏳ Ожидает оплаты' : '❌ Не оплачен'}
                                  </div>
                                  <div style={{
                                    padding: '4px 12px',
                                    background: order.status === 'delivered' ? '#DBEAFE' :
                                               order.status === 'shipped' ? '#E0E7FF' :
                                               order.status === 'processing' ? '#FEF3C7' : '#F3F4F6',
                                    color: order.status === 'delivered' ? '#1E40AF' :
                                           order.status === 'shipped' ? '#4338CA' :
                                           order.status === 'processing' ? '#92400E' : '#6B7280',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    display: 'inline-block'
                                  }}>
                                    {order.status === 'delivered' ? '📦 Доставлен' :
                                     order.status === 'shipped' ? '🚚 Отправлен' :
                                     order.status === 'processing' ? '⏱️ В обработке' : 'Ожидает'}
                                  </div>
                                </div>
                              </div>

                              {/* Order Items */}
                              <div style={{ marginBottom: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                                {order.items && order.items.map((item: any, idx: number) => (
                                  <div key={idx} style={{ fontSize: '14px', color: '#374151', marginBottom: '6px' }}>
                                    • {item.productName} × {item.quantity} — {formatMoney(item.price * item.quantity)}
                                  </div>
                                ))}
                              </div>

                              {/* Order Total */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid #E5E7EB' }}>
                                <div>
                                  {order.discount > 0 && (
                                    <div style={{ fontSize: '13px', color: '#DC2626', marginBottom: '4px' }}>
                                      Скидка: -{formatMoney(order.discount)}
                                    </div>
                                  )}
                                  {order.shippingCost > 0 && (
                                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                                      Доставка: +{formatMoney(order.shippingCost)}
                                    </div>
                                  )}
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1F2937' }}>
                                  Итого: {formatMoney(order.total)}
                                </div>
                              </div>

                              {/* Notes for CRM orders */}
                              {order.notes && (
                                <div style={{
                                  marginTop: '12px',
                                  padding: '12px',
                                  background: '#FEF3C7',
                                  borderLeft: '4px solid #F59E0B',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  color: '#78350F'
                                }}>
                                  📝 {order.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#9CA3AF',
                          background: '#F9FAFB',
                          borderRadius: '12px'
                        }}>
                          Заказов товаров пока нет
                        </div>
                      )}
                    </div>
                    );
                  })()}
                  
                  {activeTab === 'purchases' && (() => {
                    // Собираем все покупки курсов: payments + заказы с курсами
                    const courseKeywords = [
                      'курс', 'консультац', 'индивидуальная', 'индивидуальный',
                      'марафон', 'тренинг', 'вебинар', 'обучение', 
                      'доступ', 'подписка', 'premium', 'омолодись',
                      'заняти', 'тренер', 'коуч', 'сеанс'
                    ];
                    const orders = userDetails.orders || [];
                    const payments = userDetails.payments || [];
                    
                    // Для отладки
                    console.log('DEBUG: Total orders:', orders.length);
                    orders.forEach((order: any) => {
                      console.log('Order:', order.orderNumber, 'Items:', order.items?.map((i: any) => i.productName));
                    });
                    
                    const courseOrders = orders.filter((order: any) => {
                      const hasCourseItem = order.items?.some((item: any) => {
                        const productName = (item.productName || '').toLowerCase();
                        const matches = courseKeywords.some(keyword => productName.includes(keyword));
                        console.log('  Item:', item.productName, '-> Match:', matches);
                        return matches;
                      });
                      console.log('Order', order.orderNumber, 'is course:', hasCourseItem);
                      return hasCourseItem;
                    });
                    
                    console.log('DEBUG: Course orders found:', courseOrders.length);
                    const totalPurchases = payments.length + courseOrders.length;
                    
                    return (
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                        Покупки курсов и услуг ({totalPurchases})
                      </h3>
                      {totalPurchases > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {/* Заказы с курсами из CRM */}
                          {courseOrders.map((order: any) => (
                            <div
                              key={`order-${order._id}`}
                              style={{
                                background: 'white',
                                border: '2px solid #E5E7EB',
                                padding: '20px',
                                borderRadius: '12px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '700' }}>
                                      {order.items[0]?.productName || 'Курс'}
                                    </div>
                                    <span style={{
                                      padding: '3px 10px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      background: '#FEF3C7',
                                      color: '#92400E'
                                    }}>
                                      📦 Из старой CRM
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '13px', color: '#6B7280' }}>
                                    Заказ #{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#1F2937', marginBottom: '6px' }}>
                                    {formatMoney(order.total)}
                                  </div>
                                  <div style={{
                                    padding: '4px 12px',
                                    background: order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? '#D1FAE5' : '#FEE2E2',
                                    color: order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? '#065F46' : '#991B1B',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    display: 'inline-block'
                                  }}>
                                    {order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? '✅ Оплачен' : '❌ Не оплачен'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Обычные платежи */}
                          {payments.slice(0, 10).map((payment: any) => (
                            <div
                              key={`payment-${payment._id}`}
                              style={{
                                background: 'white',
                                border: '1px solid #E5E7EB',
                                padding: '16px',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                                  {payment.description}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                  {formatDate(payment.createdAt)} • {payment.orderNumber}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                                  {formatMoney(payment.amount)}
                                </div>
                                <div style={{
                                  padding: '2px 8px',
                                  background: payment.status === 'succeeded' ? '#D1FAE5' : '#FEE2E2',
                                  color: payment.status === 'succeeded' ? '#065F46' : '#991B1B',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  display: 'inline-block'
                                }}>
                                  {payment.status === 'succeeded' ? 'УСПЕШНО' : 'ОТКЛОНЕН'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#9CA3AF',
                          background: '#F9FAFB',
                          borderRadius: '12px'
                        }}>
                          Покупок курсов пока нет
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {activeTab === 'notes' && (
                    <div>
                      {/* Add Note Section */}
                      <div style={{
                        background: '#F9FAFB',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '24px'
                      }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                          Добавить заметку
                        </h3>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      {(['note', 'email', 'telegram'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setNoteType(type)}
                          style={{
                            padding: '8px 16px',
                            background: noteType === type ? '#3B82F6' : 'white',
                            color: noteType === type ? 'white' : '#6B7280',
                            border: '1px solid #D1D5DB',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          {type === 'note' ? '📝 Заметка' : type === 'email' ? '✉️ Email' : '💬 Telegram'}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Введите текст заметки..."
                      rows={4}
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
                    <button
                      onClick={addNote}
                      disabled={!noteContent.trim()}
                      style={{
                        padding: '10px 20px',
                        background: noteContent.trim() ? '#3B82F6' : '#E5E7EB',
                        color: noteContent.trim() ? 'white' : '#9CA3AF',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: noteContent.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Добавить
                    </button>
                  </div>

                  {/* Notes List */}
                  {userDetails.notes && userDetails.notes.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                        История заметок ({userDetails.notes.length})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {userDetails.notes.map((note: any) => (
                          <div
                            key={note._id}
                            style={{
                              background: 'white',
                              border: '1px solid #E5E7EB',
                              padding: '16px',
                              borderRadius: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                  {note.adminId?.firstName || 'Admin'} • {formatDate(note.createdAt)}
                                </span>
                                <span style={{
                                  padding: '2px 8px',
                                  background: note.type === 'email' ? '#DBEAFE' : note.type === 'telegram' ? '#E0E7FF' : '#F3F4F6',
                                  color: note.type === 'email' ? '#1E40AF' : note.type === 'telegram' ? '#4338CA' : '#6B7280',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}>
                                  {note.type === 'email' ? 'EMAIL' : note.type === 'telegram' ? 'TELEGRAM' : 'ЗАМЕТКА'}
                                </span>
                              </div>
                            </div>
                            <div style={{ fontSize: '14px', color: '#1F2937', whiteSpace: 'pre-wrap' }}>
                              {note.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    </div>
                  )}

                  {activeTab === 'marathons' && (
                    <div>
                  {/* Marathons */}
                  {userDetails.marathons && userDetails.marathons.length > 0 ? (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                        Марафоны ({userDetails.marathons?.length || 0})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {userDetails.marathons.map((marathon: any) => (
                          <div
                            key={marathon._id}
                            style={{
                              background: 'white',
                              border: '1px solid #E5E7EB',
                              padding: '16px',
                              borderRadius: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div>
                                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                                  {marathon.marathonId?.title || 'Марафон'}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                                  День {marathon.currentDay} из {marathon.marathonId?.numberOfDays || '?'}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{
                                  padding: '4px 12px',
                                  background: marathon.status === 'active' ? '#D1FAE5' : 
                                             marathon.status === 'completed' ? '#DBEAFE' : '#FEE2E2',
                                  color: marathon.status === 'active' ? '#065F46' :
                                         marathon.status === 'completed' ? '#1E40AF' : '#991B1B',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  display: 'inline-block',
                                  marginBottom: '8px'
                                }}>
                                  {marathon.status === 'active' ? 'АКТИВЕН' :
                                   marathon.status === 'completed' ? 'ЗАВЕРШЕН' : 'ОТМЕНЕН'}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: '600' }}>
                                  {marathon.completionRate}% ({marathon.completedExercises}/{marathon.totalExercises})
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#9CA3AF',
                      background: '#F9FAFB',
                      borderRadius: '12px'
                    }}>
                      Марафонов пока нет
                    </div>
                  )}
                    </div>
                  )}

                  {activeTab === 'badges' && (
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                        Бейджи ({userDetails.badges?.length || 0})
                      </h3>
                      {userDetails.badges && userDetails.badges.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                          {userDetails.badges.map((badge: any) => (
                            <div
                              key={badge._id}
                              style={{
                                background: 'white',
                                border: '2px solid #E5E7EB',
                                padding: '20px',
                                borderRadius: '12px',
                                minWidth: '200px',
                                textAlign: 'center'
                              }}
                            >
                              <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                                {badge.icon || '🏆'}
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1F2937' }}>
                                {badge.name}
                              </div>
                              {badge.description && (
                                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
                                  {badge.description}
                                </div>
                              )}
                              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                                Получен: {new Date(badge.earnedAt || badge.createdAt).toLocaleDateString('ru-RU')}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: '#9CA3AF',
                          background: '#F9FAFB',
                          borderRadius: '12px'
                        }}>
                          Бейджей пока нет
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
