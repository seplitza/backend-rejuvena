/**
 * Countdown Timer Component
 * Displays time remaining until marathon starts
 */

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date | string;
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
}

export default function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isComplete: false
  });

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
          isComplete: false
        };
      } else {
        if (onComplete) onComplete();
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
      }
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (timeLeft.isComplete) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8 text-white text-center shadow-xl">
        <h3 className="text-3xl font-bold">🎉 Марафон начался!</h3>
        <p className="mt-2 text-lg opacity-90">Переходим к первому дню...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
      <div className="text-center mb-6">
        <h3 className="text-3xl font-bold mb-2">⏰ До старта марафона</h3>
        <p className="text-lg opacity-90">Приготовьтесь к началу вашего путешествия</p>
      </div>
      
      <div className="flex justify-center gap-3 md:gap-6 flex-wrap">
        <TimeUnit value={timeLeft.days} label="дней" />
        <TimeUnit value={timeLeft.hours} label="часов" />
        <TimeUnit value={timeLeft.minutes} label="минут" />
        <TimeUnit value={timeLeft.seconds} label="секунд" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 min-w-[70px] md:min-w-[90px] hover:bg-white/30 transition-all">
      <div className="text-3xl md:text-5xl font-bold tabular-nums">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-xs md:text-sm opacity-90 mt-1 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
