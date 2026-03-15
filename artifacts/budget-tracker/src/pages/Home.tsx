import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  CalendarDays,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { useBudget } from "@/hooks/use-budget";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/Card";

export default function Home() {
  const {
    budget,
    setBudget,
    daysRemaining,
    dailyLimit,
  } = useBudget();

  const [isFocused, setIsFocused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium">
                    <CalendarDays className="w-4 h-4" />
                    <span>Осталось {daysRemaining} дн. в месяце</span>
                  </div>
                </motion.div>
              </Card>

              {/* MONTHLY BUDGET INPUT */}
              <Card className="space-y-3 relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                  <Target className="w-4 h-4 text-primary" />
                  Общий бюджет на месяц
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold text-xl">
                    ₽
                  </div>
                  <input
                    type="number"
                    value={budget || ""}
                    onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="0.00"
                    className="w-full bg-secondary text-foreground text-xl font-bold rounded-xl py-4 pl-9 pr-4 outline-none border-2 border-transparent transition-all focus:border-primary/30 focus:bg-white/5"
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
              {/* Header */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-xl bg-card text-muted hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-foreground">Настройки</h2>
              </div>

              {/* Empty settings card */}
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
