import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, ArrowLeft, Check, Copy, Download, Upload, CloudOff,
  Plus, Minus, Flame, Undo2, TrendingUp, TrendingDown, AlertTriangle, CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useBudget, Expense } from "@/hooks/use-budget";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/Card";
import { Calendar } from "@/components/Calendar";

// ─── Sync Keys ───────────────────────────────────────────────────────
const SYNC_KEYS = [
  "salaryEntries", "remainingBudget", "remainingDays", "savings",
  "rolloverMode", "lastUpdateDate", "streak", "expenses",
];

function generateCode(): string {
  const data: Record<string, string> = {};
  for (const key of SYNC_KEYS) {
    const v = localStorage.getItem(key);
    if (v !== null) data[key] = v;
  }
  return btoa(JSON.stringify(data));
}

function applyCode(code: string): boolean {
  try {
    const data = JSON.parse(atob(code.trim()));
    if (typeof data !== "object" || data === null) return false;
    for (const key of SYNC_KEYS) {
      if (key in data) localStorage.setItem(key, data[key]);
    }
    return true;
  } catch { return false; }
}

// ─── Counter Animation ───────────────────────────────────────────────
function AnimatedCounter({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = displayed;
    const diff = value - start;
    if (Math.abs(diff) < 0.01) { setDisplayed(value); return; }
    const duration = 600;
    const startTime = performance.now();
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(start + diff * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <>{formatCurrency(Math.round(displayed * 100) / 100)}</>;
}

// ─── Progress Bar ────────────────────────────────────────────────────
function BudgetProgressBar({ spent, total }: { spent: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
  const color = pct < 60 ? "bg-emerald-500" : pct < 85 ? "bg-amber-400" : "bg-rose-500";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] text-muted">
        <span>Потрачено: {formatCurrency(spent)}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Quick Amount Chips ──────────────────────────────────────────────
const QUICK_AMOUNTS = [100, 200, 350, 500, 1000];
function QuickAmounts({ onSelect }: { onSelect: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_AMOUNTS.map((v) => (
        <motion.button
          key={v}
          whileTap={{ scale: 0.92 }}
          onClick={() => onSelect(v)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary text-foreground/70 hover:bg-primary/20 hover:text-primary transition-colors"
        >
          {v}₽
        </motion.button>
      ))}
    </div>
  );
}

// ─── Expense History ─────────────────────────────────────────────────
function ExpenseHistory({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return <Card className="text-center py-8"><p className="text-xs text-muted">Пока нет записей</p></Card>;
  }
  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});

  return (
    <Card className="space-y-3 max-h-64 overflow-y-auto">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
        <CalendarDays className="w-4 h-4 text-primary" />
        История
      </div>
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="space-y-1.5">
          <p className="text-[10px] text-muted font-medium uppercase tracking-wider sticky top-0 bg-card py-1">
            {format(new Date(date + "T00:00:00"), "d MMMM, EEEE", { locale: ru })}
          </p>
          {items.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/50"
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  e.isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                }`}>
                  {e.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <p className="text-xs text-foreground font-medium">
                    {e.isPositive ? "+" : "-"}{formatCurrency(e.amount)}
                  </p>
                  {e.note && <p className="text-[10px] text-muted">{e.note}</p>}
                </div>
              </div>
              <span className="text-[10px] text-muted">{format(new Date(e.timestamp), "HH:mm")}</span>
            </motion.div>
          ))}
        </div>
      ))}
    </Card>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, title, description }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string;
}) {
  if (!open) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{title}</p>
            <p className="text-xs text-muted mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-foreground/70 hover:text-foreground transition-colors">Отмена</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors">Подтвердить</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Settings Screen ─────────────────────────────────────────────────
function SettingsScreen({ onBack, rolloverMode, setRolloverMode, onReset }: {
  onBack: () => void;
  rolloverMode: boolean;
  setRolloverMode: (v: boolean) => void;
  onReset: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"sync" | "about">("sync");
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <motion.div key="settings" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }} transition={{ type: "spring", stiffness: 280, damping: 26 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl bg-card text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-foreground">Настройки</h2>
      </div>

      {/* Rollover & Reset */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <input id="rollover-mode" type="checkbox" checked={rolloverMode}
            onChange={(e) => setRolloverMode(e.target.checked)} className="accent-primary" />
          <label htmlFor="rollover-mode">Режим накопления</label>
        </div>
        <motion.button onClick={() => setShowConfirm(true)} whileTap={{ scale: 0.96 }}
          className="w-full py-3 rounded-xl font-bold text-sm bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 transition-colors">
          Сбросить данные периода
        </motion.button>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-2xl p-1">
        {(["sync", "about"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="relative flex-1 py-2 text-xs font-semibold rounded-xl transition-colors duration-200"
            style={{ color: activeTab === tab ? "#fff" : "#8b8ba7" }}>
            {activeTab === tab && (
              <motion.div layoutId="tab-pill" className="absolute inset-0 bg-primary rounded-xl"
                transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            )}
            <span className="relative z-10">{tab === "sync" ? "Синхронизация" : "О приложении"}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {activeTab === "sync" ? <TabSync /> : <TabAbout />}
        </motion.div>
      </AnimatePresence>

      <ConfirmDialog open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={onReset}
        title="Сбросить период?" description="Все записи трат и настройки бюджета будут очищены." />
    </motion.div>
  );
}

function TabSync() {
  const [code] = useState(() => generateCode());
  const [copied, setCopied] = useState(false);
  const [importVal, setImportVal] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "ok" | "error">("idle");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    if (applyCode(importVal)) {
      setImportStatus("ok");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setImportStatus("error");
      setTimeout(() => setImportStatus("idle"), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
          <Download className="w-4 h-4 text-primary" /> Экспорт
        </div>
        <p className="text-xs text-muted leading-relaxed">Скопируй код — он содержит все данные.</p>
        <div className="bg-secondary rounded-xl px-3 py-3 text-xs font-mono text-foreground/50 break-all leading-relaxed select-text max-h-20 overflow-auto">{code}</div>
        <motion.button onClick={handleCopy} whileTap={{ scale: 0.96 }}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${copied ? "bg-emerald-600 text-white" : "bg-primary text-white"}`}>
          {copied ? <><Check className="w-4 h-4" /> Скопировано!</> : <><Copy className="w-4 h-4" /> Копировать код</>}
        </motion.button>
      </Card>
      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
          <Upload className="w-4 h-4 text-primary" /> Импорт
        </div>
        <textarea value={importVal} onChange={(e) => { setImportVal(e.target.value); setImportStatus("idle"); }}
          placeholder="Вставь код сюда..." rows={3}
          className="w-full bg-secondary text-foreground text-xs font-mono rounded-xl px-3 py-3 outline-none border-2 border-transparent focus:border-primary/30 resize-none select-text" />
        {importStatus === "error" && <p className="text-xs text-rose-400 flex items-center gap-1"><CloudOff className="w-3 h-3" /> Неверный код</p>}
        <motion.button onClick={handleImport} whileTap={{ scale: 0.96 }} disabled={!importVal.trim()}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${importStatus === "ok" ? "bg-emerald-600 text-white" : importVal.trim() ? "bg-primary text-white" : "bg-secondary text-muted cursor-not-allowed"}`}>
          {importStatus === "ok" ? <><Check className="w-4 h-4" /> Восстановлено!</> : <><Upload className="w-4 h-4" /> Применить</>}
        </motion.button>
      </Card>
    </div>
  );
}

function TabAbout() {
  return (
    <Card className="space-y-4">
      <div className="flex flex-col items-center text-center gap-2 py-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-1"><span className="text-2xl">₽</span></div>
        <h3 className="font-bold text-foreground text-base">Budget Tracker</h3>
        <p className="text-xs text-muted leading-relaxed max-w-[220px]">Простой трекер бюджета с дневным лимитом.</p>
      </div>
      <div className="border-t border-white/5 pt-3 space-y-2">
        <div className="flex justify-between text-xs"><span className="text-muted">Версия</span><span className="text-foreground font-medium">2.0.0</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted">Данные</span><span className="text-foreground font-medium">Хранятся локально</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted">Валюта</span><span className="text-foreground font-medium">Российский рубль ₽</span></div>
      </div>
    </Card>
  );
}

// ─── Main Home Component ─────────────────────────────────────────────
export default function Home() {
  const {
    salaryEntries, setSalaryEntries,
    rolloverMode, setRolloverMode,
    remainingBudget, remainingDays, savings,
    dailyLimit, totalToday, streak, expenses,
    totalSpent, budgetProgress, totalIncome,
    applyExpense, undoLastExpense, recalc,
  } = useBudget();

  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [spendValue, setSpendValue] = useState("");
  const [isPositive, setIsPositive] = useState(false);
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    const amount = Number(spendValue);
    const result = applyExpense(amount, isPositive, note);
    if (!result.success) {
      toast({ title: "Ошибка", description: result.message, variant: "destructive" });
    } else {
      toast({ title: isPositive ? "Доход добавлен!" : "Расход записан!", description: `${isPositive ? "+" : "-"}${formatCurrency(amount)}` });
      setSpendValue("");
      setNote("");
    }
  };

  const handleReset = () => {
    localStorage.removeItem("expenses");
    localStorage.removeItem("savings");
    localStorage.removeItem("streak");
    localStorage.removeItem("remainingBudget");
    localStorage.removeItem("remainingDays");
    localStorage.removeItem("rolloverMode");
    window.location.reload();
  };

  return (
    <div className="h-screen w-full flex justify-center items-start bg-background overflow-auto pt-8 sm:pt-12 md:pt-16">
      <div className="w-full max-w-[340px] sm:max-w-md md:max-w-lg px-4 pb-8 relative">
        <AnimatePresence mode="wait">

          {/* ─── MAIN SCREEN ─── */}
          {!showSettings && (
            <motion.div key="main" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }} transition={{ type: "spring", stiffness: 280, damping: 26 }} className="space-y-4">

              {/* Header */}
              <div className="flex justify-between items-center">
                {streak > 0 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-400">
                    <Flame className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{streak}</span>
                  </motion.div>
                )}
                <div className="flex-1" />
                <button onClick={() => setShowSettings(true)}
                  className="p-2 rounded-xl bg-card text-muted hover:text-foreground transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              {/* Daily Limit Card */}
              <Card className="text-center py-10 relative overflow-hidden bg-gradient-to-b from-[#7c3aed] to-[#4c1d95] text-white shadow-xl shadow-purple-900/40">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }} className="relative z-10 space-y-3">
                  <p className="text-primary-foreground/80 text-xs sm:text-sm font-medium uppercase tracking-wider">Сегодня доступно</p>
                  <div className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight tabular-nums flex items-end justify-center gap-2">
                    <AnimatedCounter value={totalToday} />
                    {savings !== 0 && (
                      <sup className={`text-[30%] font-semibold ${savings > 0 ? "text-emerald-400" : "text-rose-400"}`}
                        style={{ verticalAlign: "super" }}>
                        {savings > 0 ? "+" : ""}{formatCurrency(savings)}
                      </sup>
                    )}
                  </div>
                  <p className="text-[11px] text-white/50">
                    {remainingDays} {remainingDays === 1 ? "день" : remainingDays < 5 ? "дня" : "дней"} · {formatCurrency(remainingBudget)} осталось
                  </p>
                </motion.div>
              </Card>

              {/* Progress Bar */}
              {totalIncome > 0 && <Card><BudgetProgressBar spent={totalSpent} total={totalIncome} /></Card>}

              {/* Calendar */}
              <Calendar salaryEntries={salaryEntries} onEntriesChange={setSalaryEntries} />

              {/* Record Entry */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    {isPositive ? "Получено" : "Потрачено"}
                  </label>
                  {/* +/- Toggle */}
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => setIsPositive(!isPositive)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                      isPositive ? "bg-emerald-500 shadow-emerald-500/30 text-white" : "bg-rose-500 shadow-rose-500/30 text-white"
                    }`}>
                    <AnimatePresence mode="wait">
                      {isPositive ? (
                        <motion.span key="plus" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                          <Plus className="w-4 h-4" />
                        </motion.span>
                      ) : (
                        <motion.span key="minus" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                          <Minus className="w-4 h-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>

                <QuickAmounts onSelect={(v) => setSpendValue(String(v))} />

                <label className="flex flex-col text-xs text-muted">
                  Сумма
                  <input type="number" min={0} value={spendValue} onChange={(e) => setSpendValue(e.target.value)}
                    className="mt-2 rounded-xl border border-secondary bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/40 transition-colors" placeholder="0" />
                </label>

                <label className="flex flex-col text-xs text-muted">
                  Заметка
                  <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                    className="mt-2 rounded-xl border border-secondary bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/40 transition-colors" placeholder="Обед, такси..." />
                </label>

                <motion.button onClick={handleSubmit} whileTap={{ scale: 0.96 }}
                  disabled={!spendValue || Number(spendValue) <= 0}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    isPositive ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : budgetProgress > 85 ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-green-500 text-white hover:bg-green-600"
                  }`}>
                  {isPositive ? "Добавить доход" : "Принять расход"}
                </motion.button>

                {expenses.length > 0 && (
                  <motion.button initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    onClick={undoLastExpense} whileTap={{ scale: 0.96 }}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground bg-secondary/50 hover:bg-secondary transition-colors flex items-center justify-center gap-1.5">
                    <Undo2 className="w-3.5 h-3.5" />
                    Отменить последнюю запись
                  </motion.button>
                )}
              </Card>

              {/* Expense History */}
              <ExpenseHistory expenses={expenses} />
            </motion.div>
          )}

          {/* ─── SETTINGS SCREEN ─── */}
          {showSettings && (
            <SettingsScreen onBack={() => setShowSettings(false)} rolloverMode={rolloverMode}
              setRolloverMode={setRolloverMode} onReset={handleReset} />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
