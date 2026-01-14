export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
  TRANSFER = 'TRANSFER',
}

export enum MacroCategory {
  SURVIVAL = '固定生存成本', // Fixed Survival Cost
  DAILY_FOOD = '吃喝日常',       // Eat & Drink
  ENJOYMENT = '享受型消费',          // Enjoyment
  NECESSARY = '必要支出',          // Necessary
  INVESTMENT = '投资理财',        // Investment
  INCOME = '收入',                // For income records
  TRANSFER = '转账',            // For transfers
}

export interface CategoryItem {
  id: string;
  name: string; // Default name
  icon: string;
  type: TransactionType;
  macroCategory: MacroCategory;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string; // Original category ID (to track macro category)
  categoryName: string; // User editable name
  macroCategory: MacroCategory;
  note: string;
  date: number; // timestamp
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  savings: number; // Income - Expense
  savingsRate: number;
  investmentAmount: number; // Amount spent in Investment category
  investmentRate: number; // Investment / Total Income
  categoryBreakdown: Record<string, number>; // Macro category totals
  specificCategoryBreakdown: Record<string, number>; // Specific category ID totals
}
