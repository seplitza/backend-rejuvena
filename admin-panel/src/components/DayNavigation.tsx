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
  const currentDayNumber = useMemo(() => {
    if (!startDate || marathonDays.length === 0) return -1;
    const now = new Date();
    const start = new Date(startDate);
    const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const calculated = daysPassed + 1;
    if (calculated < 1) return marathonDays[0].dayNumber;
    const last = marathonDays[marathonDays.length - 1].dayNumber;
    return Math.min(calculated, last);
  }, [startDate, marathonDays]);

  const learningDays = marathonDays.filter(d => d.dayNumber <= numberOfDays);
  const practiceDays = marathonDays.filter(d => d.dayNumber > numberOfDays);

  const buttonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '4px 9px',
    borderRadius: '6px',
    border: isActive ? '2px solid #4F46E5' : '1px solid #D1D5DB',
    background: isActive ? '#EEF2FF' : 'white',
    color: isActive ? '#4F46E5' : '#374151',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: isActive ? '700' : '500',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    lineHeight: '1.4',
  });

  const renderDay = (day: MarathonDay, displayNumber: number) => {
    const isActive = day.dayNumber === currentDayNumber;
    const isLocked = currentDayNumber > 0 && day.dayNumber > currentDayNumber;

    return (
      <button
        key={day._id || day.dayNumber}
        onClick={() => onDayClick(day.dayNumber)}
        style={{
          ...buttonStyle(isActive),
          color: isLocked ? '#9CA3AF' : (isActive ? '#4F46E5' : '#374151'),
          background: isLocked ? '#F9FAFB' : (isActive ? '#EEF2FF' : 'white'),
          borderColor: isLocked ? '#E5E7EB' : (isActive ? '#4F46E5' : '#D1D5DB'),
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          if (!isActive && !isLocked) {
            e.currentTarget.style.borderColor = '#A5B4FC';
            e.currentTarget.style.background = '#F5F3FF';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive && !isLocked) {
            e.currentTarget.style.borderColor = '#D1D5DB';
            e.currentTarget.style.background = 'white';
          }
        }}
      >
        {isLocked ? '🔒' : displayNumber}
      </button>
    );
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6B7280',
    whiteSpace: 'nowrap',
    alignSelf: 'flex-start',
    paddingTop: '4px',
    marginRight: '4px',
    flexShrink: 0,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    alignItems: 'center',
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '10px 16px',
        marginBottom: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {learningDays.length > 0 && (
        <div style={rowStyle}>
          <span style={labelStyle}>📚 Обучение</span>
          {learningDays.map((day, i) => renderDay(day, i + 1))}
        </div>
      )}
      {practiceDays.length > 0 && (
        <div style={rowStyle}>
          <span style={labelStyle}>🏋️ Практика</span>
          {practiceDays.map((day, i) => renderDay(day, i + 1))}
        </div>
      )}
    </div>
  );
}

