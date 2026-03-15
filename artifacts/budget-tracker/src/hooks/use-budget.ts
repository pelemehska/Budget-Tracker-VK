import { useState, useEffect } from "react";
import { getDaysInMonth, getDate, format, subDays } from "date-fns";

export function useBudget() {
  const [budget, setBudget] = useState<number>(() => {
    const saved = localStorage.getItem("monthlyBudget");
    return saved ? parseFloat(saved) : 0;
  });

  const [lastLoggedDate, setLastLoggedDate] = useState<string | null>(() => {
    return localStorage.getItem("lastLoggedDate") || null;
  });

  const [streak, setStreak] = useState<number>(() => {
    return parseInt(localStorage.getItem("streak") || "0", 10);
  });

  // Persist Budget
  useEffect(() => {
    localStorage.setItem("monthlyBudget", budget.toString());
  }, [budget]);

  // Persist Logging & Streak
  useEffect(() => {
    if (lastLoggedDate) {
      localStorage.setItem("lastLoggedDate", lastLoggedDate);
    }
    localStorage.setItem("streak", streak.toString());
  }, [lastLoggedDate, streak]);

  // Date Logic
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");

  const daysInMonth = getDaysInMonth(today);
  const currentDay = getDate(today);
  const daysRemaining = daysInMonth - currentDay + 1;

  // Days remaining in current week (Mon–Sun), including today
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const dayIndexMonStart = (dayOfWeek + 6) % 7; // Mon=0, ..., Sun=6
  const daysRemainingInWeek = 7 - dayIndexMonStart;

  const dailyLimit = daysRemaining > 0 ? budget / daysRemaining : budget;

  const isLoggedToday = lastLoggedDate === todayStr;

  const markLogged = () => {
    if (isLoggedToday) return;
    
    // If they logged yesterday, increment streak. Otherwise, reset to 1.
    if (lastLoggedDate === yesterdayStr) {
      setStreak((s) => s + 1);
    } else {
      setStreak(1);
    }
    setLastLoggedDate(todayStr);
  };

  return {
    budget,
    setBudget,
    daysInMonth,
    daysRemaining,
    daysRemainingInWeek,
    dailyLimit,
    isLoggedToday,
    streak,
    markLogged,
  };
}
