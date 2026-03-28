import { useState, useEffect, useCallback } from "react";
import {
  getDaysInMonth,
  getDate,
  format,
  parseISO,
  differenceInCalendarDays,
  startOfDay,
  getMonth,
  getYear,
  isAfter,
  isBefore,
} from "date-fns";

export interface Expense {
  id: string;
  amount: number;
  date: string;
  note: string;
  isPositive: boolean;
  timestamp: number;
}

export interface SalaryEntry {
  id: string;
  date: string;
  amount: number;
}

export interface BudgetState {
  salaryEntries: SalaryEntry[];
  setSalaryEntries: React.Dispatch<React.SetStateAction<SalaryEntry[]>>;

  rolloverMode: boolean;
  setRolloverMode: (value: boolean) => void;

  remainingBudget: number;
  remainingDays: number;
  savings: number;
  dailyLimit: number;
  totalToday: number;
  streak: number;
  expenses: Expense[];
  totalSpent: number;
  budgetProgress: number;
  totalIncome: number;
  lastSalaryDate: string | null;
  nextSalaryDate: string | null;

  applyExpense: (amount: number, isPositive: boolean, note?: string) => { success: boolean; message?: string };
  undoLastExpense: () => void;
  recalc: () => void;

  daysInMonth: number;
  daysRemainingInMonth: number;
  daysRemainingInWeek: number;
}

const parseNum = (v: string | null, fb: number): number => {
  if (!v) return fb;
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

function calcBudget(
  entries: SalaryEntry[],
  expenses: Expense[],
  savings: number,
  rollover: boolean,
  lastUpdate: string
) {
  const now = new Date();
  const today = startOfDay(now);

  const totalIncome = entries.reduce((s, e) => s + e.amount, 0);

  // Last salary (today or before)
  const pastOrToday = entries
    .filter((e) => !isAfter(startOfDay(parseISO(e.date)), today))
    .sort((a, b) => b.date.localeCompare(a.date));
  const lastSalary = pastOrToday[0] || null;
  const lastSalaryDate = lastSalary?.date || null;

  // Next salary (after today)
  const future = entries
    .filter((e) => isAfter(startOfDay(parseISO(e.date)), today))
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextSalary = future[0] || null;
  const nextSalaryDate = nextSalary?.date || null;

  // Remaining days
  let remainingDays: number;
  if (nextSalary) {
    remainingDays = Math.max(1, differenceInCalendarDays(startOfDay(parseISO(nextSalary.date)), today));
  } else if (lastSalary) {
    remainingDays = Math.max(1, parseNum(localStorage.getItem("remainingDays"), 30));
  } else {
    remainingDays = 30;
  }

  // Remaining budget (from state, loaded from localStorage)
  let remainingBudget = parseNum(localStorage.getItem("remainingBudget"), totalIncome);

  // Spent since last salary
  let spent = 0;
  if (lastSalaryDate) {
    spent = expenses
      .filter((e) => !e.isPositive && e.date >= lastSalaryDate)
      .reduce((s, e) => s + e.amount, 0);
  }

  // Streak
  let streak = 0;
  if (lastSalaryDate) {
    const dailyL = remainingDays > 0 ? remainingBudget / remainingDays : 0;
    const periodExpenses = expenses
      .filter((e) => !e.isPositive && e.date >= lastSalaryDate)
      .sort((a, b) => b.timestamp - a.timestamp);
    for (const exp of periodExpenses) {
      if (exp.amount <= dailyL) streak++;
      else break;
    }
  }

  const dailyLimit = remainingDays > 0 ? remainingBudget / remainingDays : 0;
  const totalToday = dailyLimit + savings;
  const budgetProgress = totalIncome > 0 ? Math.min(100, (spent / totalIncome) * 100) : 0;

  return {
    remainingBudget,
    remainingDays,
    dailyLimit,
    totalToday,
    spent,
    budgetProgress,
    streak,
    totalIncome,
    lastSalaryDate,
    nextSalaryDate,
  };
}

export function useBudget(): BudgetState {
  const [salaryEntries, setSalaryEntries] = useState<SalaryEntry[]>(() => {
    try {
      const r = localStorage.getItem("salaryEntries");
      return r ? JSON.parse(r) : [];
    } catch {
      return [];
    }
  });
  const [rolloverMode, setRolloverMode] = useState<boolean>(() =>
    localStorage.getItem("rolloverMode") === "true"
  );
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const r = localStorage.getItem("expenses");
      return r ? JSON.parse(r) : [];
    } catch {
      return [];
    }
  });
  const [savings, setSavings] = useState<number>(() =>
    parseNum(localStorage.getItem("savings"), 0)
  );
  const [lastUpdateDate, setLastUpdateDate] = useState<string>(() =>
    localStorage.getItem("lastUpdateDate") || format(new Date(), "yyyy-MM-dd")
  );
  const [remainingBudget, setRemainingBudget] = useState<number>(() =>
    parseNum(localStorage.getItem("remainingBudget"), 0)
  );
  const [remainingDays, setRemainingDays] = useState<number>(() =>
    parseNum(localStorage.getItem("remainingDays"), 30)
  );

  // Persist
  useEffect(() => { localStorage.setItem("salaryEntries", JSON.stringify(salaryEntries)); }, [salaryEntries]);
  useEffect(() => { localStorage.setItem("rolloverMode", String(rolloverMode)); }, [rolloverMode]);
  useEffect(() => { localStorage.setItem("expenses", JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem("savings", savings.toString()); }, [savings]);
  useEffect(() => { localStorage.setItem("lastUpdateDate", lastUpdateDate); }, [lastUpdateDate]);
  useEffect(() => { localStorage.setItem("remainingBudget", remainingBudget.toString()); }, [remainingBudget]);
  useEffect(() => { localStorage.setItem("remainingDays", remainingDays.toString()); }, [remainingDays]);

  // Recalc budget
  const recalc = useCallback(() => {
    const b = calcBudget(salaryEntries, expenses, savings, rolloverMode, lastUpdateDate);
    setRemainingBudget(b.remainingBudget);
    setRemainingDays(b.remainingDays);
  }, [salaryEntries, expenses, savings, rolloverMode, lastUpdateDate]);

  // Auto-recalc on data changes
  useEffect(() => {
    const b = calcBudget(salaryEntries, expenses, savings, rolloverMode, lastUpdateDate);
    setRemainingBudget(b.remainingBudget);
    setRemainingDays(b.remainingDays);
  }, [salaryEntries, expenses, savings, rolloverMode, lastUpdateDate]);

  // Derived (recalculated each render)
  const totalIncome = salaryEntries.reduce((s, e) => s + e.amount, 0);

  const today = startOfDay(new Date());
  const pastOrToday = salaryEntries
    .filter((e) => !isAfter(startOfDay(parseISO(e.date)), today))
    .sort((a, b) => b.date.localeCompare(a.date));
  const lastSalaryDate = pastOrToday[0]?.date || null;

  const future = salaryEntries
    .filter((e) => isAfter(startOfDay(parseISO(e.date)), today))
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextSalaryDate = future[0]?.date || null;

  const dailyLimit = remainingDays > 0 ? remainingBudget / remainingDays : 0;
  const totalTodayCalc = dailyLimit + savings;

  let spent = 0;
  if (lastSalaryDate) {
    spent = expenses
      .filter((e) => !e.isPositive && e.date >= lastSalaryDate)
      .reduce((s, e) => s + e.amount, 0);
  }
  const budgetProgress = totalIncome > 0 ? Math.min(100, (spent / totalIncome) * 100) : 0;

  let streak = 0;
  if (lastSalaryDate) {
    const periodExpenses = expenses
      .filter((e) => !e.isPositive && e.date >= lastSalaryDate)
      .sort((a, b) => b.timestamp - a.timestamp);
    for (const exp of periodExpenses) {
      if (exp.amount <= dailyLimit) streak++;
      else break;
    }
  }

  const applyExpense = useCallback((amount: number, isPositive: boolean, note?: string) => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return { success: false, message: "Введите корректную сумму (> 0)" };
    }
    if (!isPositive && amt > remainingBudget) {
      return { success: false, message: "Недостаточно средств" };
    }

    const expense: Expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amount: amt,
      date: format(new Date(), "yyyy-MM-dd"),
      note: note || "",
      isPositive,
      timestamp: Date.now(),
    };

    setExpenses((prev) => [expense, ...prev]);

    if (isPositive) {
      setRemainingBudget((prev) => prev + amt);
    } else {
      const L = remainingDays > 0 ? remainingBudget / remainingDays : 0;
      const delta = L - amt;

      if (delta >= 0 && rolloverMode) {
        const saved = delta / 2;
        setSavings((prev) => prev + saved);
        setRemainingBudget((prev) => Math.max(0, prev - amt - saved));
      } else {
        setRemainingBudget((prev) => Math.max(0, prev - amt));
      }
    }

    setLastUpdateDate(format(new Date(), "yyyy-MM-dd"));
    return { success: true };
  }, [remainingBudget, remainingDays, rolloverMode]);

  const undoLastExpense = useCallback(() => {
    setExpenses((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[0];
      if (last.isPositive) {
        setRemainingBudget((r) => Math.max(0, r - last.amount));
      } else {
        setRemainingBudget((r) => r + last.amount);
      }
      return prev.slice(1);
    });
  }, []);

  // Date helpers
  const now = new Date();
  const daysInMonth = getDaysInMonth(now);
  const currentDay = getDate(now);
  const daysRemainingInMonth = daysInMonth - currentDay + 1;
  const dayOfWeek = now.getDay();
  const dayIndexMonStart = (dayOfWeek + 6) % 7;
  const daysRemainingInWeek = 7 - dayIndexMonStart;

  return {
    salaryEntries,
    setSalaryEntries,
    rolloverMode,
    setRolloverMode,
    remainingBudget,
    remainingDays,
    savings,
    dailyLimit,
    totalToday: totalTodayCalc,
    streak,
    expenses,
    totalSpent: spent,
    budgetProgress,
    totalIncome,
    lastSalaryDate,
    nextSalaryDate,
    applyExpense,
    undoLastExpense,
    recalc,
    daysInMonth,
    daysRemainingInMonth,
    daysRemainingInWeek,
  };
}
