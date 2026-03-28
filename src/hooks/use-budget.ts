import { useState, useEffect, useCallback } from "react";
import {
  getDaysInMonth,
  getDate,
  format,
  parseISO,
  differenceInCalendarDays,
  startOfDay,
} from "date-fns";

export interface Expense {
  id: string;
  amount: number;
  date: string;
  note: string;
  isPositive: boolean;
  timestamp: number;
}

export interface BudgetState {
  incomeAmount: number;
  setIncomeAmount: (value: number) => void;
  incomePeriod: number;
  setIncomePeriod: (value: number) => void;
  salaryDay: number;
  setSalaryDay: (value: number) => void;

  remainingBudget: number;
  remainingDays: number;
  savings: number;
  rolloverMode: boolean;
  setRolloverMode: (value: boolean) => void;

  lastUpdateDate: string;
  dailyLimit: number;
  totalToday: number;
  streak: number;
  expenses: Expense[];
  totalSpent: number;
  budgetProgress: number;

  startPeriod: () => void;
  applyExpense: (spentAmount: number, isPositive: boolean, note?: string) => { success: boolean; message?: string };
  undoLastExpense: () => void;
  syncDeferredDays: () => void;

  daysInMonth: number;
  daysRemainingInMonth: number;
  daysRemainingInWeek: number;
}

const parseNumeric = (value: string | null, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function useBudget(): BudgetState {
  const [incomeAmount, setIncomeAmount] = useState<number>(() =>
    parseNumeric(localStorage.getItem("incomeAmount"), 0)
  );
  const [incomePeriod, setIncomePeriod] = useState<number>(() =>
    Math.max(1, parseNumeric(localStorage.getItem("incomePeriod"), 14))
  );
  const [salaryDay, setSalaryDay] = useState<number>(() =>
    Math.min(31, Math.max(1, parseNumeric(localStorage.getItem("salaryDay"), 15)))
  );

  const [remainingBudget, setRemainingBudget] = useState<number>(() =>
    parseNumeric(localStorage.getItem("remainingBudget"), incomeAmount)
  );
  const [remainingDays, setRemainingDays] = useState<number>(() =>
    Math.max(1, parseNumeric(localStorage.getItem("remainingDays"), incomePeriod))
  );
  const [savings, setSavings] = useState<number>(() =>
    parseNumeric(localStorage.getItem("savings"), 0)
  );
  const [rolloverMode, setRolloverMode] = useState<boolean>(() =>
    localStorage.getItem("rolloverMode") === "true"
  );
  const [lastUpdateDate, setLastUpdateDate] = useState<string>(() =>
    localStorage.getItem("lastUpdateDate") || format(new Date(), "yyyy-MM-dd")
  );
  const [streak, setStreak] = useState<number>(() =>
    parseNumeric(localStorage.getItem("streak"), 0)
  );
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const raw = localStorage.getItem("expenses");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Sync all to localStorage
  useEffect(() => { localStorage.setItem("incomeAmount", incomeAmount.toString()); }, [incomeAmount]);
  useEffect(() => { localStorage.setItem("incomePeriod", incomePeriod.toString()); }, [incomePeriod]);
  useEffect(() => { localStorage.setItem("salaryDay", salaryDay.toString()); }, [salaryDay]);
  useEffect(() => { localStorage.setItem("remainingBudget", remainingBudget.toString()); }, [remainingBudget]);
  useEffect(() => { localStorage.setItem("remainingDays", remainingDays.toString()); }, [remainingDays]);
  useEffect(() => { localStorage.setItem("savings", savings.toString()); }, [savings]);
  useEffect(() => { localStorage.setItem("rolloverMode", String(rolloverMode)); }, [rolloverMode]);
  useEffect(() => { localStorage.setItem("lastUpdateDate", lastUpdateDate); }, [lastUpdateDate]);
  useEffect(() => { localStorage.setItem("streak", streak.toString()); }, [streak]);
  useEffect(() => { localStorage.setItem("expenses", JSON.stringify(expenses)); }, [expenses]);

  const dailyLimit = remainingDays > 0 ? remainingBudget / remainingDays : 0;
  const totalToday = dailyLimit + savings;
  const totalSpent = incomeAmount > 0 ? incomeAmount - remainingBudget : 0;
  const budgetProgress = incomeAmount > 0 ? Math.min(100, (totalSpent / incomeAmount) * 100) : 0;

  const startPeriod = useCallback(() => {
    setRemainingBudget(incomeAmount);
    setRemainingDays(Math.max(1, incomePeriod));
    setSavings(0);
    setLastUpdateDate(format(new Date(), "yyyy-MM-dd"));
    setStreak(0);
    setExpenses([]);
  }, [incomeAmount, incomePeriod]);

  const applyExpense = useCallback((spentAmount: number, isPositive: boolean, note?: string) => {
    const amount = Number(spentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: "Введите корректную сумму (> 0)" };
    }

    if (!isPositive && amount > remainingBudget) {
      return { success: false, message: "Недостаточно средств" };
    }

    const expense: Expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amount,
      date: format(new Date(), "yyyy-MM-dd"),
      note: note || "",
      isPositive,
      timestamp: Date.now(),
    };

    setExpenses((prev) => [expense, ...prev]);

    if (isPositive) {
      setRemainingBudget((prev) => prev + amount);
      setRemainingDays((prev) => prev + 1);
    } else {
      const L = dailyLimit;
      const E = amount;
      const delta = L - E;

      if (delta >= 0) {
        if (rolloverMode) {
          const saved = delta / 2;
          setSavings((prev) => prev + saved);
          setRemainingBudget((prev) => Math.max(0, prev - E - saved));
        } else {
          setRemainingBudget((prev) => Math.max(0, prev - E));
        }
      } else {
        setRemainingBudget((prev) => Math.max(0, prev - E));
      }
      setRemainingDays((prev) => Math.max(0, prev - 1));
    }

    setLastUpdateDate(format(new Date(), "yyyy-MM-dd"));

    // Update streak
    if (!isPositive && amount <= dailyLimit) {
      setStreak((prev) => prev + 1);
    } else if (!isPositive) {
      setStreak(0);
    }

    return { success: true };
  }, [remainingBudget, dailyLimit, rolloverMode]);

  const undoLastExpense = useCallback(() => {
    setExpenses((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[0];

      if (last.isPositive) {
        setRemainingBudget((r) => Math.max(0, r - last.amount));
        setRemainingDays((d) => Math.max(0, d - 1));
      } else {
        setRemainingBudget((r) => r + last.amount);
        setRemainingDays((d) => d + 1);
      }

      return prev.slice(1);
    });
  }, []);

  const syncDeferredDays = useCallback(() => {
    const today = startOfDay(new Date());
    const last = lastUpdateDate ? startOfDay(parseISO(lastUpdateDate)) : today;
    const diff = differenceInCalendarDays(today, last);

    if (diff <= 0 || remainingDays <= 0) {
      setLastUpdateDate(format(today, "yyyy-MM-dd"));
      return;
    }

    let R = remainingBudget;
    let D = remainingDays;
    let S = savings;

    for (let i = 0; i < diff && D > 0; i += 1) {
      const L = R / D;
      if (rolloverMode) {
        const savePart = L / 2;
        S += savePart;
        R = R - savePart;
      }
      D -= 1;
    }

    setRemainingBudget(Math.max(0, R));
    setRemainingDays(Math.max(0, D));
    setSavings(Math.max(0, S));
    setLastUpdateDate(format(today, "yyyy-MM-dd"));
  }, [lastUpdateDate, remainingBudget, remainingDays, savings, rolloverMode]);

  const today = new Date();
  const daysInMonth = getDaysInMonth(today);
  const currentDay = getDate(today);
  const daysRemainingInMonth = daysInMonth - currentDay + 1;

  const dayOfWeek = today.getDay();
  const dayIndexMonStart = (dayOfWeek + 6) % 7;
  const daysRemainingInWeek = 7 - dayIndexMonStart;

  return {
    incomeAmount,
    setIncomeAmount,
    incomePeriod,
    setIncomePeriod,
    salaryDay,
    setSalaryDay,

    remainingBudget,
    remainingDays,
    savings,
    rolloverMode,
    setRolloverMode,

    lastUpdateDate,
    dailyLimit,
    totalToday,
    streak,
    expenses,
    totalSpent,
    budgetProgress,

    startPeriod,
    applyExpense,
    undoLastExpense,
    syncDeferredDays,

    daysInMonth,
    daysRemainingInMonth,
    daysRemainingInWeek,
  };
}
