import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { removeAuthToken } from '../utils/auth';

interface LayoutProps {
  onLogout: () => void;
}

export default function Layout({ onLogout }: LayoutProps) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // На мобильных меню по умолчанию закрыто
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Закрываем меню на мобильных при смене страницы
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = () => {
    removeAuthToken();
    onLogout();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden', 
      position: 'relative',
      width: '100vw',
      maxWidth: '100vw'
    }}>
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '250px',
        background: '#1F2937',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: isSidebarOpen ? 0 : '-270px',
        top: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 999,
        transition: 'left 0.3s ease-in-out',
        boxShadow: isMobile && isSidebarOpen ? '4px 0 12px rgba(0, 0, 0, 0.3)' : 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            Rejuvena Admin
          </h1>
          {isMobile && (
            <button
              onClick={toggleSidebar}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ✕
            </button>
          )}
        </div>
        
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
        marginLeft: isMobile ? 0 : (isSidebarOpen ? '250px' : 0),
        width: isMobile ? '100vw' : (isSidebarOpen ? 'calc(100% - 250px)' : '100%'),
        maxWidth: isMobile ? '100vw' : 'none',
        height: '100vh',
        background: '#F9FAFB', 
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out',
        position: 'relative',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* Hamburger Button */}
        <button
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: '16px',
            left: isMobile ? '16px' : (isSidebarOpen ? '266px' : '16px'),
            zIndex: 997,
            background: '#4F46E5',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            transition: 'left 0.3s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px'
          }}
          title={isSidebarOpen ? 'Скрыть меню' : 'Показать меню'}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '20px' }}>
            <div style={{
              width: '100%',
              height: '2px',
              background: 'white',
              borderRadius: '2px',
              transition: 'transform 0.3s, opacity 0.3s',
              transform: isSidebarOpen ? 'rotate(45deg) translateY(6px)' : 'none',
            }} />
            <div style={{
              width: '100%',
              height: '2px',
              background: 'white',
              borderRadius: '2px',
              transition: 'opacity 0.3s',
              opacity: isSidebarOpen ? 0 : 1
            }} />
            <div style={{
              width: '100%',
              height: '2px',
              background: 'white',
              borderRadius: '2px',
              transition: 'transform 0.3s, opacity 0.3s',
              transform: isSidebarOpen ? 'rotate(-45deg) translateY(-6px)' : 'none'
            }} />
          </div>
        </button>
        
        <Outlet />
      </main>
    </div>
  );
}
