import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  CalendarDays,
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

  return (
    <div className="h-screen w-full flex justify-center items-center bg-background">
      <div className="w-full max-w-[320px] p-4 space-y-4">
        
        {/* 1. DAILY LIMIT HEADER */}
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

        {/* 2. MONTHLY BUDGET INPUT */}
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

      </div>
    </div>
  );
}
