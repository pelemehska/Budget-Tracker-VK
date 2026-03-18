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

const SYNC_KEYS = ["monthlyBudget", "weekMode", "replaceMode", "isPositive", "lastLoggedDate", "streak"];

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

function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("sync");

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
          {activeTab === "sync" && <TabSync />}
          {activeTab === "about" && <TabAbout />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default function Home() {
  const {
    budget,
    setBudget,
    daysInMonth,
    daysRemaining,
    daysRemainingInWeek,
  } = useBudget();

  const [weekMode, setWeekMode] = useState(() =>
    localStorage.getItem("weekMode") === "true"
  );

  useEffect(() => {
    localStorage.setItem("weekMode", String(weekMode));
  }, [weekMode]);

  const dailyLimit = weekMode
    ? (budget / 7)
    : (daysInMonth > 0 ? budget / daysInMonth : budget);

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

              {/* DAILY LIMIT HEADER */}
              <Card className="text-center py-8 relative overflow-hidden bg-gradient-to-b from-[#7c3aed] to-[#4c1d95] text-white shadow-xl shadow-purple-900/40">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative z-10"
                >
                  <p className="text-primary-foreground/80 text-xs sm:text-sm font-medium uppercase tracking-wider mb-2">
                    Дневной лимит бюджета
                  </p>
                  <div className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-2 tabular-nums">
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
                    className="w-full bg-secondary text-foreground text-xl sm:text-2xl font-bold rounded-xl py-4 sm:py-5 pl-12 pr-4 outline-none border-2 border-transparent transition-all focus:border-primary/30 focus:bg-white/5"
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
            <SettingsScreen onBack={() => setShowSettings(false)} />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
