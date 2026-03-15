import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  CheckCircle2, 
  Info, 
  Target, 
  CalendarDays, 
  Wallet,
  Flame,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { useBudget } from "@/hooks/use-budget";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/Card";

export default function Home() {
  const {
    budget,
    setBudget,
    daysInMonth,
    daysRemaining,
    dailyLimit,
    isLoggedToday,
    streak,
    markLogged,
  } = useBudget();

  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="min-h-screen w-full flex justify-center bg-background">
      <div className="w-full max-w-[480px] p-4 pt-8 pb-12 space-y-4">
        
        {/* 1. DAILY LIMIT HEADER */}
        <Card className="text-center py-8 relative overflow-hidden bg-gradient-to-b from-primary to-[#005bb5] text-white shadow-xl shadow-primary/20">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative z-10"
          >
            <p className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider mb-2">
              Дневной лимит бюджета
            </p>
            <div className="text-5xl font-bold tracking-tight mb-2 tabular-nums">
              {formatCurrency(dailyLimit)}
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium">
              <CalendarDays className="w-4 h-4" />
              <span>Осталось {daysRemaining} дн. в месяце</span>
            </div>
          </motion.div>
        </Card>

        {/* 2. MONTHLY BUDGET INPUT */}
        <Card className="space-y-3 relative">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
            <Target className="w-4 h-4 text-primary" />
            Общий бюджет на месяц
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold text-xl">
              $
            </div>
            <input
              type="number"
              value={budget || ""}
              onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="0.00"
              className="w-full bg-secondary text-foreground text-xl font-bold rounded-xl py-4 pl-9 pr-4 outline-none border-2 border-transparent transition-all focus:border-primary/30 focus:bg-white"
            />
          </div>
          <AnimatePresence>
            {isFocused && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-muted font-medium pt-1"
              >
                Обновляется мгновенно при вводе.
              </motion.p>
            )}
          </AnimatePresence>
        </Card>

        {/* 3. BUDGET BREAKDOWN */}
        <Card noPadding className="overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-bold flex items-center gap-2 text-foreground">
              <Wallet className="w-5 h-5 text-primary" />
              Разбивка бюджета
            </h3>
          </div>
          <div className="divide-y border-border/50 divide-border/50">
            <div className="p-4 flex justify-between items-center hover:bg-secondary/50 transition-colors">
              <span className="text-muted text-sm font-medium">Бюджет на месяц</span>
              <span className="font-bold text-foreground tabular-nums">{formatCurrency(budget)}</span>
            </div>
            <div className="p-4 flex justify-between items-center hover:bg-secondary/50 transition-colors">
              <span className="text-muted text-sm font-medium">Дней в месяце</span>
              <span className="font-bold text-foreground">{daysInMonth}</span>
            </div>
            <div className="p-4 flex justify-between items-center hover:bg-secondary/50 transition-colors">
              <span className="text-muted text-sm font-medium">Дней осталось</span>
              <span className="font-bold text-foreground">{daysRemaining}</span>
            </div>
          </div>
        </Card>

        {/* 4. DAILY REMINDER & STREAK */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold flex items-center gap-2 text-foreground mb-1">
                <Bell className="w-5 h-5 text-primary" />
                Ежедневное напоминание
              </h3>
              <p className="text-sm text-muted font-medium">
                Записывайте расходы каждый день, чтобы не выходить за рамки бюджета.
              </p>
            </div>
            {streak > 0 && (
              <div className="flex flex-col items-center justify-center bg-orange-50 text-orange-600 rounded-xl px-3 py-2 border border-orange-100 min-w-[64px]">
                <Flame className="w-5 h-5 mb-0.5 fill-orange-500 text-orange-500" />
                <span className="text-xs font-bold">{streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}</span>
              </div>
            )}
          </div>

          <button
            onClick={markLogged}
            disabled={isLoggedToday}
            className={`
              relative w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 
              transition-all duration-300 active:scale-[0.98] overflow-hidden
              ${
                isLoggedToday
                  ? "bg-success text-success-foreground shadow-lg shadow-success/20 cursor-default"
                  : "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-[#0066cc]"
              }
            `}
          >
            <AnimatePresence mode="wait">
              {isLoggedToday ? (
                <motion.div
                  key="logged"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Записано сегодня</span>
                </motion.div>
              ) : (
                <motion.div
                  key="not-logged"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <span>Отметить расходы за сегодня</span>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </Card>

        {/* 5. TIPS SECTION */}
        <Card className="bg-secondary/50 border border-border/50">
          <h3 className="font-bold flex items-center gap-2 text-foreground mb-3 text-sm uppercase tracking-wide">
            <Info className="w-4 h-4 text-muted" />
            Советы
          </h3>
          <ul className="space-y-3 text-sm text-foreground/80 font-medium">
            <li className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>Проверяйте расходы до конца дня, а не после — это помогает корректировать поведение.</span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>Если вы потратите меньше сегодня, дневной лимит автоматически увеличится завтра!</span>
            </li>
          </ul>
        </Card>

        <div className="text-center pb-6 pt-2">
          <p className="text-xs text-muted font-medium">
            Данные хранятся локально на вашем устройстве.
          </p>
        </div>

      </div>
    </div>
  );
}
