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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        background: '#1F2937',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        overflowY: 'auto'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '20px', marginBottom: '30px' }}>
          Rejuvena Admin
        </h1>
        
        <nav style={{ flex: 1, padding: '0 20px' }}>
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
            to="/themes"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/themes') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            🎨 Темы оформления
          </Link>

          <Link
            to="/offers"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/offers') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            🎁 Предложения
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
            to="/email-templates"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/email-templates') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            📧 Email-шаблоны
          </Link>

          <Link
            to="/email-campaigns"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              background: isActive('/email-campaigns') ? '#4F46E5' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            🚀 Email-кампании
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

          {/* Shop Section */}
          <div style={{
            borderTop: '1px solid #374151',
            margin: '16px 0',
            paddingTop: '16px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#9CA3AF',
              textTransform: 'uppercase',
              marginBottom: '12px',
              letterSpacing: '0.05em'
            }}>
              Магазин
            </div>

            <Link
              to="/products"
              style={{
                display: 'block',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'white',
                background: isActive('/products') ? '#4F46E5' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              📦 Товары
            </Link>

            <Link
              to="/product-categories"
              style={{
                display: 'block',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'white',
                background: isActive('/product-categories') ? '#4F46E5' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              📂 Категории товаров
            </Link>

            <Link
              to="/shop-orders"
              style={{
                display: 'block',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'white',
                background: isActive('/shop-orders') ? '#4F46E5' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              🛍️ Заказы магазина
            </Link>

            <Link
              to="/promo-codes"
              style={{
                display: 'block',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'white',
                background: isActive('/promo-codes') ? '#4F46E5' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              🎟️ Промокоды
            </Link>

            <Link
              to="/fortune-wheel"
              style={{
                display: 'block',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'white',
                background: isActive('/fortune-wheel') ? '#4F46E5' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              🎡 Колесо Фортуны
            </Link>

            <Link
              to="/wildberries"
              style={{
                display: 'block',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'white',
                background: isActive('/wildberries') ? '#4F46E5' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              🟣 Wildberries
            </Link>

            <Link
              to="/data-import"
              style={{
                display: 'block',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'white',
                background: isActive('/data-import') ? '#4F46E5' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              📥 Импорт данных
            </Link>
          </div>
        </nav>

        <button
          onClick={handleLogout}
          style={{
            margin: '20px',
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
      <main style={{ 
        marginLeft: '250px',
        width: 'calc(100% - 250px)',
        height: '100vh',
        background: '#F9FAFB', 
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <Outlet />
      </main>
    </div>
  );
}
