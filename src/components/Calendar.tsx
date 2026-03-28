import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  getDate,
  getMonth,
  getYear,
  differenceInCalendarDays,
} from "date-fns";
import { ru } from "date-fns/locale";
import { Card } from "./Card";

interface CalendarProps {
  salaryDay: number;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function Calendar({ salaryDay }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [direction, setDirection] = useState(0);

  const today = new Date();

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });

    // Monday = 0, Sunday = 6
    const firstDayOfWeek = (getDay(start) + 6) % 7;
    const padding: (Date | null)[] = Array(firstDayOfWeek).fill(null);

    return [...padding, ...allDays];
  }, [currentMonth]);

  // Calculate next salary date
  const nextSalaryDate = useMemo(() => {
    const currentDay = getDate(today);
    const currentMonthNum = getMonth(today);
    const currentYear = getYear(today);

    if (currentDay < salaryDay) {
      // Salary this month
      return new Date(currentYear, currentMonthNum, salaryDay);
    } else {
      // Salary next month
      return new Date(currentYear, currentMonthNum + 1, salaryDay);
    }
  }, [today, salaryDay]);

  const daysUntilSalary = differenceInCalendarDays(nextSalaryDate, today);

  const goToPrev = () => {
    setDirection(-1);
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const monthLabel = format(currentMonth, "LLLL yyyy", { locale: ru });

  return (
    <Card className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
          <CalendarDays className="w-4 h-4 text-primary" />
          Календарь
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrev}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[130px] text-center capitalize">
            {monthLabel}
          </span>
          <button
            onClick={goToNext}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Salary info */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
          <span className="text-xs text-muted">
            Зарплата: <span className="text-foreground font-medium">{format(nextSalaryDate, "d MMMM", { locale: ru })}</span>
            {daysUntilSalary > 0 && (
              <span className="ml-1 text-primary">({daysUntilSalary} дн.)</span>
            )}
          </span>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`text-center text-[10px] font-semibold uppercase tracking-wider py-1 ${
              i >= 5 ? "text-rose-400/70" : "text-muted"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={format(currentMonth, "yyyy-MM")}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-7 gap-0.5"
        >
          {days.map((day, index) => {
            if (!day) {
              return <div key={`pad-${index}`} className="aspect-square" />;
            }

            const dayNum = getDate(day);
            const isSalaryDay = dayNum === salaryDay;
            const isTodayDate = isToday(day);
            const isPast = day < today && !isTodayDate;
            const isWeekend = getDay(day) === 0 || getDay(day) === 6;
            const isCurrentMonthView = isSameMonth(day, currentMonth);
            const isNextSalaryMarker = isSalaryDay && differenceInCalendarDays(day, today) > 0;

            return (
              <motion.div
                key={day.toISOString()}
                whileTap={{ scale: 0.9 }}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-xl text-xs relative cursor-default
                  transition-colors duration-150
                  ${!isCurrentMonthView ? "text-foreground/20" : ""}
                  ${isTodayDate ? "bg-primary text-white font-bold ring-2 ring-primary/40" : ""}
                  ${isPast && isCurrentMonthView ? "text-foreground/40" : ""}
                  ${isWeekend && !isTodayDate && isCurrentMonthView ? "text-rose-400/80" : ""}
                  ${!isTodayDate && !isPast && isCurrentMonthView ? "text-foreground hover:bg-secondary" : ""}
                `}
              >
                <span className="relative z-10">{dayNum}</span>
                {isSalaryDay && isCurrentMonthView && (
                  <div
                    className={`
                      absolute -bottom-0.5 w-1.5 h-1.5 rounded-full
                      ${isNextSalaryMarker ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" : "bg-amber-400/50"}
                    `}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center gap-4 px-1 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[10px] text-muted">Сегодня</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[10px] text-muted">Зарплата</span>
        </div>
      </div>
    </Card>
  );
}
