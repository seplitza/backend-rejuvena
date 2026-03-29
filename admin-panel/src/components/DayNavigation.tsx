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
  startDate: string;
  onDayClick: (dayNumber: number) => void;
}

export default function DayNavigation({
  marathonDays,
  startDate,
  onDayClick,
}: DayNavigationProps) {
  // Рассчитываем текущий день на основе startDate марафона
  const currentDayNumber = useMemo(() => {
    if (!startDate || marathonDays.length === 0) return -1;

    const now = new Date();
    const start = new Date(startDate);
    const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const calculatedDay = daysPassed + 1;

    if (calculatedDay < 1) return marathonDays[0].dayNumber;
    if (calculatedDay > marathonDays[marathonDays.length - 1].dayNumber) {
      return marathonDays[marathonDays.length - 1].dayNumber;
    }
    return calculatedDay;
  }, [startDate, marathonDays]);

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '12px 16px',
        marginBottom: '24px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      <div style={{
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        minWidth: 'max-content',
      }}>
        {marathonDays.map((day) => {
          const isCurrentDay = day.dayNumber === currentDayNumber;
          const emoji = day.dayType === 'practice' ? '🏋️' : '📚';

          return (
            <button
              key={day._id || day.dayNumber}
              onClick={() => onDayClick(day.dayNumber)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: isCurrentDay ? '2px solid #4F46E5' : '1px solid #D1D5DB',
                background: isCurrentDay ? '#EEF2FF' : 'white',
                color: isCurrentDay ? '#4F46E5' : '#374151',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: isCurrentDay ? '700' : '500',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
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
              <span>{emoji}</span>
              <span>{day.dayNumber}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
