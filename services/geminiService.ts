
import { GoogleGenAI } from "@google/genai";
import { MonthlyStats, Transaction, MacroCategory } from '../types';

interface GenerateReportParams {
  type: 'monthly' | 'yearly';
  stats: MonthlyStats;
  prevStats?: MonthlyStats;
  transactions: Transaction[];
  dateLabel: string;
  userContext?: string;
}

export const generateFinancialReport = async (params: GenerateReportParams): Promise<string> => {
  // 确保 API KEY 存在
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  
  if (!apiKey) {
    return "错误：未检测到 API Key。请在部署环境中配置 API_KEY 环境变量。";
  }

  const ai = new GoogleGenAI({ apiKey });
  const { type, stats, prevStats, transactions, dateLabel, userContext } = params;

  const expenseTx = transactions.filter(t => t.type === 'EXPENSE');
  const sortedTransactions = [...transactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 30)
    .map(t => `${new Date(t.date).toLocaleDateString()} - ${t.categoryName}: ${t.amount} [${t.note}]`)
    .join('\n');

  const commonRole = `你是一位顶级理财专家，风格理性犀利。`;

  let prompt = '';
  if (type === 'monthly') {
    prompt = `${commonRole} 请分析【${dateLabel}】的数据。收入:${stats.totalIncome}, 支出:${stats.totalExpense}, 储蓄率:${(stats.savingsRate*100).toFixed(1)}%。补充信息:${userContext || '无'}。账单样本:${sortedTransactions}`;
  } else {
    prompt = `${commonRole} 请复盘【${dateLabel}】年度数据。年收入:${stats.totalIncome}, 年支出:${stats.totalExpense}。补充信息:${userContext || '无'}。`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "生成失败。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "分析失败，请检查 API Key 或网络。";
  }
};
