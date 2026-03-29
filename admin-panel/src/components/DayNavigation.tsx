import { useMemo } from 'react';

interface MarathonDay {
  _id?: string;
  dayNumber: number;
  dayType: 'learning' | 'practice';
  description: string;
  exerciseGroups?: any[];
  exercises?: string[];
  newExerciseIds?: string[];
  order?: number;
}

interface DayNavigationProps {
  marathonDays: MarathonDay[];
  numberOfDays: number;
  startDate: string;
  onDayClick: (dayNumber: number) => void;
}

export default function DayNavigation({
  marathonDays,
  numberOfDays,
  startDate,
  onDayClick,
}: DayNavigationProps) {
  // Рассчитываем текущий день на основе startDate марафона
  const currentDayNumber = useMemo(() => {
    if (!startDate) return 1;
    
    const now = new Date();
    const start = new Date(startDate);
    const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const calculatedDay = daysPassed + 1;
    
    // Если марафон еще не начался
    if (calculatedDay < 1) return 1;
    
    // Ограничиваем на numberOfDays (дни обучения)
    return Math.min(calculatedDay, numberOfDays);
  }, [startDate, numberOfDays]);

  // Определяем тип дня (обучение или практика)
  const getDayType = (dayNumber: number): 'learning' | 'practice' => {
    return dayNumber <= numberOfDays ? 'learning' : 'practice';
  };

  // Получаем эмоджи для дня
  const getEmojiForDay = (dayNumber: number): string => {
    return getDayType(dayNumber) === 'learning' ? '📚' : '🏋️';
  };

  const handleDayClick = (dayNumber: number) => {
    onDayClick(dayNumber);
  };

  return (
    <div 
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 0',
        marginBottom: '24px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        paddingLeft: '16px',
        paddingRight: '16px',
        alignItems: 'center'
      }}>
        {marathonDays.map((day) => {
          const isCurrentDay = day.dayNumber === currentDayNumber;
          
          return (
            <button
              key={day._id || day.dayNumber}
              onClick={() => handleDayClick(day.dayNumber)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: isCurrentDay ? '2px solid #4F46E5' : '1px solid #D1D5DB',
                background: isCurrentDay ? '#EEF2FF' : 'white',
                color: isCurrentDay ? '#4F46E5' : '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: isCurrentDay ? '600' : '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (!isCurrentDay) {
                  e.currentTarget.style.borderColor = '#A5B4FC';
                  e.currentTarget.style.background = '#F5F3FF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrentDay) {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              <span>{getEmojiForDay(day.dayNumber)}</span>
              <span>{day.dayNumber}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
