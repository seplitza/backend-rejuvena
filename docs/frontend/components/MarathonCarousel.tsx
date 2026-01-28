/**
 * Marathon Carousel Component
 * Карусель марафонов для главной страницы ЛК
 * Показывает марафоны с флагом isDisplay: true
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Marathon {
  _id: string;
  title: string;
  description?: string;
  numberOfDays: number;
  cost: number;
  isPaid: boolean;
  startDate: string;
  language: string;
}

export default function MarathonCarousel() {
  const [marathons, setMarathons] = useState<Marathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMarathons();
  }, []);

  const fetchMarathons = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://37.252.20.170:9527';
      const response = await fetch(`${API_URL}/api/marathons`);
      const data = await response.json();
      
      if (data.success && data.marathons) {
        setMarathons(data.marathons);
      }
    } catch (error) {
      console.error('Failed to fetch marathons:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % marathons.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + marathons.length) % marathons.length);
  };

  const handleMarathonClick = (marathonId: string) => {
    navigate(`/marathons/${marathonId}`);
  };

  if (loading) {
    return (
      <div className="marathon-carousel-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (marathons.length === 0) {
    return null; // Не показываем карусель если нет марафонов
  }

  const currentMarathon = marathons[currentIndex];

  return (
    <div className="marathon-carousel">
      <h2 className="carousel-title">🏃 Марафоны</h2>
      
      <div className="carousel-container">
        {/* Кнопка назад */}
        {marathons.length > 1 && (
          <button 
            className="carousel-btn carousel-btn-prev"
            onClick={prevSlide}
            aria-label="Предыдущий марафон"
          >
            ←
          </button>
        )}

        {/* Карточка марафона */}
        <div 
          className="marathon-card"
          onClick={() => handleMarathonClick(currentMarathon._id)}
        >
          <div className="marathon-card-header">
            <span className="marathon-badge">
              {currentMarathon.isPaid ? '💎 Платный' : '🎁 Бесплатный'}
            </span>
            <span className="marathon-days">
              {currentMarathon.numberOfDays} {getDaysWord(currentMarathon.numberOfDays)}
            </span>
          </div>

          <h3 className="marathon-title">{currentMarathon.title}</h3>
          
          {currentMarathon.description && (
            <p className="marathon-description">
              {truncateText(currentMarathon.description, 100)}
            </p>
          )}

          <div className="marathon-footer">
            <div className="marathon-date">
              📅 Старт: {formatDate(currentMarathon.startDate)}
            </div>
            <div className="marathon-price">
              {currentMarathon.isPaid 
                ? `${currentMarathon.cost} ₽` 
                : 'Бесплатно'}
            </div>
          </div>

          <button className="marathon-cta">
            {currentMarathon.isPaid ? 'Записаться' : 'Присоединиться'}
          </button>
        </div>

        {/* Кнопка вперед */}
        {marathons.length > 1 && (
          <button 
            className="carousel-btn carousel-btn-next"
            onClick={nextSlide}
            aria-label="Следующий марафон"
          >
            →
          </button>
        )}
      </div>

      {/* Индикаторы */}
      {marathons.length > 1 && (
        <div className="carousel-indicators">
          {marathons.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Перейти к марафону ${index + 1}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .marathon-carousel {
          margin: 20px 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
        }

        .carousel-title {
          color: white;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: center;
        }

        .carousel-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
        }

        .carousel-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 24px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s;
          flex-shrink: 0;
        }

        .carousel-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .carousel-btn:active {
          transform: scale(0.95);
        }

        .marathon-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          flex: 1;
          max-width: 500px;
          cursor: pointer;
          transition: transform 0.3s;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .marathon-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
        }

        .marathon-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .marathon-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .marathon-days {
          color: #666;
          font-size: 14px;
        }

        .marathon-title {
          font-size: 22px;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }

        .marathon-description {
          color: #666;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 15px;
        }

        .marathon-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }

        .marathon-date {
          color: #666;
          font-size: 14px;
        }

        .marathon-price {
          color: #667eea;
          font-size: 18px;
          font-weight: bold;
        }

        .marathon-cta {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .marathon-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
        }

        .marathon-cta:active {
          transform: translateY(0);
        }

        .carousel-indicators {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 15px;
        }

        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          padding: 0;
        }

        .indicator.active {
          background: white;
          width: 24px;
          border-radius: 4px;
        }

        .marathon-carousel-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Мобильная адаптация */
        @media (max-width: 768px) {
          .marathon-carousel {
            padding: 15px;
            margin: 15px 0;
          }

          .carousel-title {
            font-size: 20px;
          }

          .marathon-card {
            padding: 15px;
          }

          .marathon-title {
            font-size: 18px;
          }

          .carousel-btn {
            width: 35px;
            height: 35px;
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}

// Утилиты
function getDaysWord(days: number): string {
  if (days % 10 === 1 && days % 100 !== 11) return 'день';
  if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return 'дня';
  return 'дней';
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
}
