import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Trash2, ArrowRight, CalendarDays } from "lucide-react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, format,
  isToday, isSameMonth, addMonths, subMonths, getDate,
  getMonth, getYear, differenceInCalendarDays, startOfDay, parseISO, isAfter,
} from "date-fns";
import { ru } from "date-fns/locale";
import { Card } from "./Card";
import { formatCurrency } from "@/lib/utils";
import type { SalaryEntry } from "@/hooks/use-budget";

interface CalendarProps {
  salaryEntries: SalaryEntry[];
  onEntriesChange: React.Dispatch<React.SetStateAction<SalaryEntry[]>>;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function Calendar({ salaryEntries, onEntriesChange }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [direction, setDirection] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [salaryInput, setSalaryInput] = useState("");
  const [nextMonthOnly, setNextMonthOnly] = useState(false);

  const today = new Date();
  const todayDate = startOfDay(today);

  // Salary amounts per day number (for current view month)
  const salaryByDay = useMemo(() => {
    const map = new Map<number, number[]>();
    const monthStr = format(currentMonth, "yyyy-MM");
    salaryEntries
      .filter((e) => e.date.startsWith(monthStr))
      .forEach((e) => {
        const day = getDate(parseISO(e.date));
        const arr = map.get(day) || [];
        arr.push(e.amount);
        map.set(day, arr);
      });
    return map;
  }, [salaryEntries, currentMonth]);

  // Days grid
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });
    const firstDayOfWeek = (getDay(start) + 6) % 7;
    return [...Array(firstDayOfWeek).fill(null), ...allDays];
  }, [currentMonth]);

  // Next salary date
  const nextSalaryDate = useMemo(() => {
    const future = salaryEntries
      .filter((e) => isAfter(startOfDay(parseISO(e.date)), todayDate))
      .sort((a, b) => a.date.localeCompare(b.date));
    return future[0] ? parseISO(future[0].date) : null;
  }, [salaryEntries]);

  const daysUntilSalary = nextSalaryDate
    ? differenceInCalendarDays(nextSalaryDate, todayDate)
    : null;

  const goToPrev = () => { setDirection(-1); setCurrentMonth((p) => subMonths(p, 1)); };
  const goToNext = () => { setDirection(1); setCurrentMonth((p) => addMonths(p, 1)); };

  const selectedEntries = useMemo(() => {
    if (selectedDay === null) return [];
    const dateStr = format(
      new Date(getYear(currentMonth), getMonth(currentMonth), selectedDay),
      "yyyy-MM-dd"
    );
    return salaryEntries.filter((e) => e.date === dateStr);
  }, [selectedDay, salaryEntries, currentMonth]);

  const handleDayClick = (day: number) => {
    if (selectedDay === day) {
      setSelectedDay(null);
      setSalaryInput("");
    } else {
      setSelectedDay(day);
      const existing = salaryByDay.get(day);
      setSalaryInput("");
    }
  };

  const handleApply = () => {
    if (selectedDay === null || !salaryInput || Number(salaryInput) <= 0) return;
    const amt = Number(salaryInput);
    const targetMonth = nextMonthOnly
      ? addMonths(currentMonth, 1)
      : currentMonth;
    const dateStr = format(
      new Date(getYear(targetMonth), getMonth(targetMonth), selectedDay),
      "yyyy-MM-dd"
    );

    const entry: SalaryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: dateStr,
      amount: amt,
    };
    onEntriesChange((prev) => [...prev, entry]);
    setSalaryInput("");
  };

  const handleAddMore = () => {
    if (selectedDay === null) return;
    setSalaryInput("");
  };

  const handleClearDay = () => {
    if (selectedDay === null) return;
    const dateStr = format(
      new Date(getYear(currentMonth), getMonth(currentMonth), selectedDay),
      "yyyy-MM-dd"
    );
    onEntriesChange((prev) => prev.filter((e) => e.date !== dateStr));
    setSelectedDay(null);
    setSalaryInput("");
  };

  const handleRemoveEntry = (id: string) => {
    onEntriesChange((prev) => prev.filter((e) => e.id !== id));
  };

  const monthLabel = format(currentMonth, "LLLL yyyy", { locale: ru });

  // Check if selected day has entries
  const hasEntries = selectedEntries.length > 0;

  // Is selected day in the past?
  const selectedDate = selectedDay !== null
    ? new Date(getYear(currentMonth), getMonth(currentMonth), selectedDay)
    : null;
  const isSelectedPast = selectedDate
    ? startOfDay(selectedDate) < todayDate && !isToday(selectedDate)
    : false;

  return (
    <Card className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
          <CalendarDays className="w-4 h-4 text-primary" />
          Календарь
        </div>
        <div className="flex items-center gap-1">
          <button onClick={goToPrev} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[130px] text-center capitalize">
            {monthLabel}
          </span>
          <button onClick={goToNext} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Next salary info */}
      {nextSalaryDate && (
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
          <span className="text-xs text-muted">
            След. ЗП: <span className="text-foreground font-medium">
              {format(nextSalaryDate, "d MMMM", { locale: ru })}
            </span>
            {daysUntilSalary !== null && daysUntilSalary > 0 && (
              <span className="ml-1 text-primary">({daysUntilSalary} дн.)</span>
            )}
          </span>
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, i) => (
          <div key={day} className={`text-center text-[10px] font-semibold uppercase tracking-wider py-1 ${i >= 5 ? "text-rose-400/70" : "text-muted"}`}>
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
          className="grid grid-cols-7 gap-1"
        >
          {days.map((day, index) => {
            if (!day) return <div key={`pad-${index}`} className="aspect-square" />;

            const dayNum = getDate(day);
            const isTodayDate = isToday(day);
            const isPast = day < today && !isTodayDate;
            const isWeekend = getDay(day) === 0 || getDay(day) === 6;
            const isCurrentMonthView = isSameMonth(day, currentMonth);
            const isSelected = selectedDay === dayNum;
            const salaries = salaryByDay.get(dayNum);
            const hasSalary = salaries && salaries.length > 0;
            const totalSalary = hasSalary ? salaries.reduce((s, v) => s + v, 0) : 0;

            return (
              <motion.button
                key={day.toISOString()}
                whileTap={{ scale: 0.88 }}
                onClick={() => isCurrentMonthView && handleDayClick(dayNum)}
                disabled={!isCurrentMonthView}
                style={{ borderRadius: "9999px" }}
                className={`
                  aspect-square flex flex-col items-center justify-center text-xs relative
                  transition-all duration-150 cursor-pointer overflow-hidden
                  ${!isCurrentMonthView ? "text-foreground/15 cursor-default" : ""}
                  ${isSelected ? "bg-primary text-white font-bold ring-2 ring-primary/50 shadow-lg shadow-primary/20" : ""}
                  ${isTodayDate && !isSelected ? "bg-primary/15 text-primary font-bold" : ""}
                  ${isPast && isCurrentMonthView && !isSelected ? "text-foreground/35" : ""}
                  ${isWeekend && !isTodayDate && !isSelected && isCurrentMonthView ? "text-rose-400/70" : ""}
                  ${!isTodayDate && !isPast && isCurrentMonthView && !isSelected ? "text-foreground hover:bg-secondary/80" : ""}
                `}
              >
                <span className="relative z-10">{dayNum}</span>
                {hasSalary && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {salaries!.length === 1 ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
                    ) : (
                      salaries!.map((_, i) => (
                        <div key={i} className="w-1.25 h-1.25 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]" style={{ width: 5, height: 5 }} />
                      ))
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Selected day panel */}
      <AnimatePresence>
        {selectedDay !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2 border-t border-white/5">
              {/* Existing entries for selected day */}
              {hasEntries && (
                <div className="space-y-2">
                  <p className="text-xs text-muted font-medium">
                    Зарплата {selectedDay} {format(currentMonth, "LLLL", { locale: ru })}:
                  </p>
                  {selectedEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-2">
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(entry.amount)}
                      </span>
                      <button
                        onClick={() => handleRemoveEntry(entry.id)}
                        className="p-1 rounded-lg text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearDay}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-secondary text-muted hover:text-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      Очистить
                    </button>
                    <button
                      onClick={handleAddMore}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary/15 text-primary hover:bg-primary/25 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3 h-3" />
                      Добавить
                    </button>
                  </div>
                </div>
              )}

              {/* Next month toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNextMonthOnly(!nextMonthOnly)}
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    nextMonthOnly
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                      : "bg-secondary text-muted hover:text-foreground"
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {nextMonthOnly ? "Следующий месяц" : "Этот месяц"}
                  </p>
                  <p className="text-[10px] text-muted">
                    {nextMonthOnly
                      ? `ЗП будет ${selectedDay} ${format(addMonths(currentMonth, 1), "LLLL", { locale: ru })}`
                      : `ЗП будет ${selectedDay} ${format(currentMonth, "LLLL", { locale: ru })}`
                    }
                  </p>
                </div>
              </div>

              {/* Salary input */}
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  placeholder="Сумма ЗП"
                  className="flex-1 rounded-xl border border-secondary bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/40 transition-colors"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleApply}
                  disabled={!salaryInput || Number(salaryInput) <= 0}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Применить
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
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
