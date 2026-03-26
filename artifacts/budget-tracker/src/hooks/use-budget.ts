import { useState, useEffect } from "react";
import {
  getDaysInMonth,
  getDate,
  format,
  parseISO,
  differenceInCalendarDays,
  startOfDay,
} from "date-fns";

export interface BudgetState {
  incomeAmount: number;
  setIncomeAmount: (value: number) => void;
  incomePeriod: number;
  setIncomePeriod: (value: number) => void;

  remainingBudget: number;
  remainingDays: number;
  savings: number;
  rolloverMode: boolean;
  setRolloverMode: (value: boolean) => void;

  lastUpdateDate: string;
  dailyLimit: number;
  totalToday: number;

  startPeriod: () => void;
  applyExpense: (spentAmount: number) => { success: boolean; message?: string };
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

  useEffect(() => {
    localStorage.setItem("incomeAmount", incomeAmount.toString());
  }, [incomeAmount]);

  useEffect(() => {
    localStorage.setItem("incomePeriod", incomePeriod.toString());
  }, [incomePeriod]);

  useEffect(() => {
    localStorage.setItem("remainingBudget", remainingBudget.toString());
  }, [remainingBudget]);

  useEffect(() => {
    localStorage.setItem("remainingDays", remainingDays.toString());
  }, [remainingDays]);

  useEffect(() => {
    localStorage.setItem("savings", savings.toString());
  }, [savings]);

  useEffect(() => {
    localStorage.setItem("rolloverMode", String(rolloverMode));
  }, [rolloverMode]);

  useEffect(() => {
    localStorage.setItem("lastUpdateDate", lastUpdateDate);
  }, [lastUpdateDate]);

  const dailyLimit = remainingDays > 0 ? remainingBudget / remainingDays : 0;
  const totalToday = dailyLimit + savings;

  const startPeriod = () => {
    const r = incomeAmount;
    const d = Math.max(1, incomePeriod);
    setRemainingBudget(r);
    setRemainingDays(d);
    setSavings(0);
    setLastUpdateDate(format(new Date(), "yyyy-MM-dd"));
  };

  const applyExpense = (spentAmount: number) => {
    const spend = Number(spentAmount);
    if (!Number.isFinite(spend) || spend < 0) {
      return { success: false, message: "Введите корректную трату (>= 0)" };
    }

    if (spend > remainingBudget) {
      return { success: false, message: "Недостаточно средств" };
    }

    const L = dailyLimit;
    const E = spend;
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
    setLastUpdateDate(format(new Date(), "yyyy-MM-dd"));

    return { success: true };
  };

  const syncDeferredDays = () => {
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
      const delta = L;
      if (rolloverMode) {
        const savePart = delta / 2;
        S += savePart;
        R = R - savePart;
      }
      D -= 1;
    }

    setRemainingBudget(Math.max(0, R));
    setRemainingDays(Math.max(0, D));
    setSavings(Math.max(0, S));
    setLastUpdateDate(format(today, "yyyy-MM-dd"));
  };

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
  };
}
