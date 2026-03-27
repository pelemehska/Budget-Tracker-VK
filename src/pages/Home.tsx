import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  CalendarDays,
  Settings,
  ArrowLeft,
  Check,
  Copy,
  Download,
  Upload,
  CloudOff,
} from "lucide-react";
import { useBudget } from "@/hooks/use-budget";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/Card";

const SYNC_KEYS = [
  "monthlyBudget",
  "incomeAmount",
  "incomePeriod",
  "accumulatedBalance",
  "lastUpdateDate",
  "weekMode",
  "replaceMode",
  "isPositive",
  "lastLoggedDate",
  "streak",
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
  } catch {
    return false;
  }
}

const SETTINGS_TABS = [
  { id: "params", label: "Параметры", icon: "settings" },
  { id: "sync", label: "Синхронизация", icon: "sync" },
  { id: "about", label: "О приложении", icon: "info" },
] as const;
type SettingsTab = typeof SETTINGS_TABS[number]["id"];

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
    const ok = applyCode(importVal);
    if (ok) {
      setImportStatus("ok");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setImportStatus("error");
      setTimeout(() => setImportStatus("idle"), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* EXPORT */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
          <Download className="w-4 h-4 text-primary" />
          Экспорт
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Скопируй код — он содержит все твои данные. Вставь его на другом устройстве чтобы восстановить.
        </p>
        <div className="bg-secondary rounded-xl px-3 py-3 text-xs font-mono text-foreground/50 break-all leading-relaxed select-text max-h-20 overflow-auto">
          {code}
        </div>
        <motion.button
          onClick={handleCopy}
          whileTap={{ scale: 0.96 }}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors duration-300 ${
            copied ? "bg-green-600 text-white" : "bg-primary text-white"
          }`}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span key="ok" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Скопировано!
              </motion.span>
            ) : (
              <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <Copy className="w-4 h-4" /> Копировать код
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </Card>

      {/* IMPORT */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
          <Upload className="w-4 h-4 text-primary" />
          Импорт
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Вставь код с другого устройства чтобы восстановить все данные.
        </p>
        <textarea
          value={importVal}
          onChange={(e) => { setImportVal(e.target.value); setImportStatus("idle"); }}
          placeholder="Вставь код сюда..."
          rows={3}
          className="w-full bg-secondary text-foreground text-xs font-mono rounded-xl px-3 py-3 outline-none border-2 border-transparent focus:border-primary/30 resize-none select-text"
        />
        {importStatus === "error" && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <CloudOff className="w-3 h-3" /> Неверный код
          </p>
        )}
        <motion.button
          onClick={handleImport}
          whileTap={{ scale: 0.96 }}
          disabled={!importVal.trim()}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors duration-300 ${
            importStatus === "ok"
              ? "bg-green-600 text-white"
              : importVal.trim()
              ? "bg-primary text-white"
              : "bg-secondary text-muted cursor-not-allowed"
          }`}
        >
          <AnimatePresence mode="wait">
            {importStatus === "ok" ? (
              <motion.span key="ok" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Данные восстановлены!
              </motion.span>
            ) : (
              <motion.span key="imp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <Upload className="w-4 h-4" /> Применить
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </Card>
    </div>
  );
}

function TabAbout() {
  return (
    <Card className="space-y-4">
      <div className="flex flex-col items-center text-center gap-2 py-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-1">
          <span className="text-2xl">₽</span>
        </div>
        <h3 className="font-bold text-foreground text-base">Budget Tracker</h3>
        <p className="text-xs text-muted leading-relaxed max-w-[220px]">
          Простой трекер бюджета с дневным лимитом. Введи бюджет на месяц — и знай сколько можно тратить каждый день.
        </p>
      </div>
      <div className="border-t border-white/5 pt-3 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted">Версия</span>
          <span className="text-foreground font-medium">1.0.0</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted">Данные</span>
          <span className="text-foreground font-medium">Хранятся локально</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted">Валюта</span>
          <span className="text-foreground font-medium">Российский рубль ₽</span>
        </div>
      </div>
    </Card>
  );
}

function TabParams({ 
  incomeAmount, 
  setIncomeAmount, 
  incomePeriod, 
  setIncomePeriod, 
  rolloverMode, 
  setRolloverMode, 
  startPeriod, 
}: {
  incomeAmount: number;
  setIncomeAmount: (v: number) => void;
  incomePeriod: number;
  setIncomePeriod: (v: number) => void;
  rolloverMode: boolean;
  setRolloverMode: (v: boolean) => void;
  startPeriod: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* INCOME & BUDGET SETTINGS */}
      <Card className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
          <Target className="w-4 h-4 text-primary" />
          Доход и период
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col text-xs text-muted">
            Доход
            <input
              type="number"
              min={0}
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(Number(e.target.value))}
              className="mt-2 rounded-xl border border-secondary bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col text-xs text-muted">
            Период (дней)
            <input
              type="number"
              min={1}
              value={incomePeriod}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v > 0) setIncomePeriod(v);
              }}
              className="mt-2 rounded-xl border border-secondary bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <input
            id="rollover-mode"
            type="checkbox"
            checked={rolloverMode}
            onChange={(e) => setRolloverMode(e.target.checked)}
          />
          <label htmlFor="rollover-mode">Режим накопления (перенести остаток)</label>
        </div>

        <motion.button
          onClick={startPeriod}
          whileTap={{ scale: 0.96 }}
          className="w-full py-3 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Запустить новый период
        </motion.button>
      </Card>
    </div>
  );
}

function SettingsScreen({ 
  onBack,
  incomeAmount,
  setIncomeAmount,
  incomePeriod,
  setIncomePeriod,
  rolloverMode,
  setRolloverMode,
  startPeriod,
}: { 
  onBack: () => void;
  incomeAmount: number;
  setIncomeAmount: (v: number) => void;
  incomePeriod: number;
  setIncomePeriod: (v: number) => void;
  rolloverMode: boolean;
  setRolloverMode: (v: boolean) => void;
  startPeriod: () => void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("params");

  return (
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
          onClick={onBack}
          className="p-2 rounded-xl bg-card text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-foreground">Настройки</h2>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-card rounded-2xl p-1">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex-1 py-2 text-xs font-semibold rounded-xl transition-colors duration-200"
            style={{ color: activeTab === tab.id ? "#fff" : "#8b8ba7" }}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 bg-primary rounded-xl"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "params" && (
            <TabParams
              incomeAmount={incomeAmount}
              setIncomeAmount={setIncomeAmount}
              incomePeriod={incomePeriod}
              setIncomePeriod={setIncomePeriod}
              rolloverMode={rolloverMode}
              setRolloverMode={setRolloverMode}
              startPeriod={startPeriod}
            />
          )}
          {activeTab === "sync" && <TabSync />}
          {activeTab === "about" && <TabAbout />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default function Home() {
  const {
    incomeAmount,
    setIncomeAmount,
    incomePeriod,
    setIncomePeriod,
    remainingBudget,
    remainingDays,
    savings,
    rolloverMode,
    setRolloverMode,
    lastUpdateDate,
    dailyLimit,
    totalToday,
    startPeriod,
    applyExpense,
    syncDeferredDays,
    daysInMonth,
    daysRemainingInMonth,
    daysRemainingInWeek,
  } = useBudget();

  const [showSettings, setShowSettings] = useState(false);
  const [spendValue, setSpendValue] = useState("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  useEffect(() => {
    syncDeferredDays();
  }, []);

  const exportLocalStorage = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key);
      if (value !== null) data[key] = value;
    }
    const payload = JSON.stringify(
      { exportedAt: new Date().toISOString(), data },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-tracker-localstorage-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    navigator.clipboard.writeText(payload).catch(() => {});
  };

  return (
    <div className="h-screen w-full flex justify-center items-start bg-background overflow-auto pt-8 sm:pt-12 md:pt-16">
      <div className="w-full max-w-[340px] sm:max-w-md md:max-w-lg px-4 pb-8 relative">

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

              {/* DAILY LIMIT HEADER - Clean & Simple */}
              <Card className="text-center py-12 relative overflow-hidden bg-gradient-to-b from-[#7c3aed] to-[#4c1d95] text-white shadow-xl shadow-purple-900/40">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative z-10 space-y-2"
                >
                  <p className="text-primary-foreground/80 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    Сегодня доступно
                  </p>
                  <div className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight tabular-nums flex items-end justify-center gap-2">
                    {formatCurrency(totalToday)}
                    {savings !== 0 && (
                      <sup
                        className={`text-[30%] font-semibold ${
                          savings > 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                        style={{ verticalAlign: "super" }}
                      >
                        {savings > 0 ? "+" : ""}{formatCurrency(savings)}
                      </sup>
                    )}
                  </div>
                </motion.div>
              </Card>

              {/* RECORD EXPENSE */}
              <Card className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  Потрачено сегодня
                </label>

                <label className="flex flex-col text-xs text-muted">
                  Сумма
                  <input
                    type="number"
                    min={0}
                    value={spendValue}
                    onChange={(e) => setSpendValue(e.target.value)}
                    className="mt-2 rounded-xl border border-secondary bg-background px-3 py-2 text-sm"
                    placeholder="0"
                  />
                </label>

                <motion.button
                  onClick={() => {
                    const spent = Number(spendValue);
                    const result = applyExpense(spent);
                    if (!result.success) {
                      setErrorMsg(result.message || "Ошибка");
                      setSuccessMsg("");
                    } else {
                      setErrorMsg("");
                      setSuccessMsg("Трата зафиксирована!");
                      setSpendValue("");
                    }
                  }}
                  whileTap={{ scale: 0.96 }}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  Принять расход
                </motion.button>

                {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}
                {successMsg && <p className="text-xs text-emerald-500">{successMsg}</p>}
              </Card>
            </motion.div>
          )}

          {/* SETTINGS SCREEN */}
          {showSettings && (
            <SettingsScreen 
              onBack={() => setShowSettings(false)}
              incomeAmount={incomeAmount}
              setIncomeAmount={setIncomeAmount}
              incomePeriod={incomePeriod}
              setIncomePeriod={setIncomePeriod}
              rolloverMode={rolloverMode}
              setRolloverMode={setRolloverMode}
              startPeriod={startPeriod}
            />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
