import { Transaction, MonthlyStats, MacroCategory, TransactionType, CategoryItem } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

const STORAGE_KEY_TX = 'wealthgrows_transactions';
const STORAGE_KEY_CATS = 'wealthgrows_categories';

// --- Transactions ---

export const getTransactions = (): Transaction[] => {
  const stored = localStorage.getItem(STORAGE_KEY_TX);
  return stored ? JSON.parse(stored) : [];
};

export const saveTransaction = (transaction: Transaction) => {
  const current = getTransactions();
  // Sort by date descending
  const updated = [transaction, ...current].sort((a, b) => b.date - a.date);
  localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(updated));
  return updated;
};

export const deleteTransaction = (id: string) => {
  const current = getTransactions();
  const updated = current.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(updated));
  return updated;
};

// --- Categories ---

export const getCategories = (): CategoryItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY_CATS);
  if (!stored) {
    // Initialize with default if empty
    localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  }
  return JSON.parse(stored);
};

export const addCategory = (category: CategoryItem): CategoryItem[] => {
  const current = getCategories();
  const updated = [...current, category];
  localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(updated));
  return updated;
};

export const deleteCategory = (id: string): CategoryItem[] => {
  const current = getCategories();
  const updated = current.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(updated));
  return updated;
};

// --- Stats Helpers ---

const calculateStatsFromList = (filteredTx: Transaction[]): MonthlyStats => {
  let totalIncome = 0;
  let totalExpense = 0;
  let investmentAmount = 0;
  
  const categoryBreakdown: Record<string, number> = {
    [MacroCategory.SURVIVAL]: 0,
    [MacroCategory.DAILY_FOOD]: 0,
    [MacroCategory.ENJOYMENT]: 0,
    [MacroCategory.NECESSARY]: 0,
    [MacroCategory.INVESTMENT]: 0,
  };

  const specificCategoryBreakdown: Record<string, number> = {};

  filteredTx.forEach(t => {
    if (t.type === TransactionType.INCOME) {
      totalIncome += t.amount;
    } else if (t.type === TransactionType.EXPENSE) {
      totalExpense += t.amount;
      
      // Macro Breakdown
      if (categoryBreakdown[t.macroCategory] !== undefined) {
        categoryBreakdown[t.macroCategory] += t.amount;
      }
      
      // Specific Category Breakdown
      if (!specificCategoryBreakdown[t.categoryId]) {
        specificCategoryBreakdown[t.categoryId] = 0;
      }
      specificCategoryBreakdown[t.categoryId] += t.amount;
      
      if (t.macroCategory === MacroCategory.INVESTMENT) {
        investmentAmount += t.amount;
      }
    }
  });

  const investmentRate = totalIncome > 0 ? (investmentAmount / totalIncome) : 0;
  const consumption = totalExpense - investmentAmount;
  const trueSavings = totalIncome - consumption; 
  
  const savingsRate = totalIncome > 0 ? (trueSavings / totalIncome) : 0;

  return {
    totalIncome,
    totalExpense,
    savings: trueSavings,
    savingsRate,
    investmentAmount,
    investmentRate,
    categoryBreakdown,
    specificCategoryBreakdown
  };
};

export const calculateMonthlyStats = (transactions: Transaction[], targetDate: Date): MonthlyStats => {
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();

  const monthlyTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
  });

  return calculateStatsFromList(monthlyTx);
};

export const getPreviousMonthStats = (transactions: Transaction[], currentDate: Date): MonthlyStats => {
  const prevDate = new Date(currentDate);
  prevDate.setMonth(prevDate.getMonth() - 1);
  return calculateMonthlyStats(transactions, prevDate);
};

export const calculateYearlyStats = (transactions: Transaction[], year: number): MonthlyStats => {
  const yearlyTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year;
  });
  return calculateStatsFromList(yearlyTx);
};

export const getAvailableYears = (transactions: Transaction[]): number[] => {
  const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
  const currentYear = new Date().getFullYear();
  years.add(currentYear);
  return Array.from(years).sort((a, b) => b - a); // Descending
};
