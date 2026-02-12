import { Outlet, Link, useLocation } from 'react-router-dom';
import { removeAuthToken } from '../utils/auth';

interface LayoutProps {
  onLogout: () => void;
}

export default function Layout({ onLogout }: LayoutProps) {
  const location = useLocation();

  const handleLogout = () => {
    removeAuthToken();
    onLogout();
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        background: '#1F2937',
        color: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>
          Rejuvena Admin
        </h1>
        
        <nav style={{ flex: 1 }}>
          <Link
            to="/dashboard"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/dashboard') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            📊 Dashboard
          </Link>
          
          <Link
            to="/exercises"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/exercises') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            💪 Упражнения
          </Link>

          <Link
            to="/exercise-categories"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/exercise-categories') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            🏷️ Категории упражнений
          </Link>

          <Link
            to="/marathons"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/marathons') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            🏃 Марафоны
          </Link>

          <Link
            to="/landings"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/landings') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            🎨 Лендинги
          </Link>

          <Link
            to="/media"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/media') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            📚 Медиабиблиотека
          </Link>

          <Link
            to="/comments"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/comments') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            💬 Управление комментариями
          </Link>

          <Link
            to="/users"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/users') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            👥 Пользователи
          </Link>

          <Link
            to="/notifications"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/notifications') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            🔔 Уведомления
          </Link>

          <Link
            to="/orders"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/orders') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            🛒 Заказы
          </Link>

          <Link
            to="/revenue"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/revenue') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            💰 Доходы
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#DC2626',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Выйти
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, background: '#F9FAFB', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
