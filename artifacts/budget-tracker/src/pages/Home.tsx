import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  CalendarDays,
  Settings,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useBudget } from "@/hooks/use-budget";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/Card";

export default function Home() {
  const {
    budget,
    setBudget,
    daysRemaining,
    daysRemainingInWeek,
  } = useBudget();

  const [weekMode, setWeekMode] = useState(() =>
    localStorage.getItem("weekMode") === "true"
  );

  useEffect(() => {
    localStorage.setItem("weekMode", String(weekMode));
  }, [weekMode]);

  const activeDays = weekMode ? daysRemainingInWeek : daysRemaining;
  const dailyLimit = activeDays > 0 ? budget / activeDays : budget;

  const [rawValue, setRawValue] = useState(budget > 0 ? String(budget) : "");
  const [isFocused, setIsFocused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [replaceMode, setReplaceMode] = useState(() =>
    localStorage.getItem("replaceMode") !== "false"
  );
  const [isPositive, setIsPositive] = useState(() =>
    localStorage.getItem("isPositive") !== "false"
  );
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    localStorage.setItem("replaceMode", String(replaceMode));
  }, [replaceMode]);

  useEffect(() => {
    localStorage.setItem("isPositive", String(isPositive));
  }, [isPositive]);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setRawValue(raw);
    if (replaceMode) {
      const num = parseFloat(raw.replace(",", "."));
      if (!isNaN(num) && num >= 0) setBudget(num);
      else if (raw === "") setBudget(0);
    }
  };

  const applyDelta = () => {
    const abs = parseFloat(rawValue.replace(",", "."));
    if (!isNaN(abs) && abs > 0) {
      const delta = isPositive ? abs : -abs;
      const newVal = Math.max(0, budget + delta);
      setBudget(newVal);
      setRawValue("");
      setApplied(true);
      setTimeout(() => setApplied(false), 1500);
    }
  };

  const handleToggle = () => {
    setReplaceMode((prev) => !prev);
    setRawValue("");
    if (replaceMode === false) {
      setRawValue(budget > 0 ? String(budget) : "");
    }
  };

  return (
    <div className="h-screen w-full flex justify-center items-center bg-background overflow-hidden">
      <div className="w-full max-w-[320px] p-4 relative">

        <AnimatePresence mode="wait">

          {/* MAIN SCREEN */}
          {!showSettings && (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="space-y-4"
            >
              {/* Settings button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 rounded-xl bg-card text-muted hover:text-foreground transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              {/* DAILY LIMIT HEADER */}
              <Card className="text-center py-8 relative overflow-hidden bg-gradient-to-b from-[#7c3aed] to-[#4c1d95] text-white shadow-xl shadow-purple-900/40">
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
                  <motion.button
                    onClick={() => setWeekMode((w) => !w)}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium transition-colors hover:bg-white/30"
                  >
                    <CalendarDays className="w-4 h-4" />
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={weekMode ? "week" : "month"}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                      >
                        {weekMode
                          ? `Осталось ${daysRemainingInWeek} дн. в неделе`
                          : `Осталось ${daysRemaining} дн. в месяце`}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              </Card>

              {/* MONTHLY BUDGET INPUT */}
              <Card className="space-y-3 relative">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                    <Target className="w-4 h-4 text-primary" />
                    {replaceMode ? "Бюджет на месяц" : "Изменить сумму"}
                  </label>

                  {/* Toggle */}
                  <button
                    onClick={handleToggle}
                    className="flex items-center gap-2 group"
                  >
                    <span className="text-xs text-muted font-medium">
                      {replaceMode ? "Замена" : "Δ Разница"}
                    </span>
                    <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${replaceMode ? "bg-primary" : "bg-secondary"}`}>
                      <motion.div
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
                        animate={{ left: replaceMode ? "calc(100% - 18px)" : "2px" }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      />
                    </div>
                  </button>
                </div>

                {/* Current total shown in adjust mode */}
                <AnimatePresence>
                  {!replaceMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-muted font-medium"
                    >
                      Текущая сумма: <span className="text-foreground font-bold">{formatCurrency(budget)}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  {replaceMode ? (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold text-xl">
                      ₽
                    </div>
                  ) : (
                    <motion.button
                      onClick={() => setIsPositive((p) => !p)}
                      whileTap={{ scale: 0.88 }}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-base transition-colors duration-200 ${
                        isPositive
                          ? "bg-green-500/20 text-green-400 border border-green-500/40"
                          : "bg-red-500/20 text-red-400 border border-red-500/40"
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={isPositive ? "plus" : "minus"}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {isPositive ? "+" : "−"}
                        </motion.span>
                      </AnimatePresence>
                    </motion.button>
                  )}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rawValue}
                    onChange={handleBudgetChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={replaceMode ? "0" : "введи сумму"}
                    className="w-full bg-secondary text-foreground text-xl font-bold rounded-xl py-4 pl-12 pr-4 outline-none border-2 border-transparent transition-all focus:border-primary/30 focus:bg-white/5"
                  />
                </div>

                {/* Hint in replace mode */}
                <AnimatePresence>
                  {isFocused && replaceMode && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-muted font-medium"
                    >
                      Обновляется мгновенно при вводе.
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Apply button in adjust mode */}
                <AnimatePresence>
                  {!replaceMode && (
                    <motion.button
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onClick={applyDelta}
                      className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300
                        ${applied
                          ? "bg-green-600 text-white"
                          : "bg-primary text-white hover:bg-[#6d28d9]"
                        }`}
                    >
                      <AnimatePresence mode="wait">
                        {applied ? (
                          <motion.span key="ok" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                            <Check className="w-4 h-4" /> Применено!
                          </motion.span>
                        ) : (
                          <motion.span key="apply" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            Применить изменение
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )}
                </AnimatePresence>

              </Card>
            </motion.div>
          )}

          {/* SETTINGS SCREEN */}
          {showSettings && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-xl bg-card text-muted hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-foreground">Настройки</h2>
              </div>

              <Card className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                <Settings className="w-10 h-10 text-primary/40" />
                <p className="text-muted text-sm font-medium">Скоро здесь появятся настройки</p>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
