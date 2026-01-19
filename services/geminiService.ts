import { GoogleGenAI } from "@google/genai";
import { MonthlyStats, Transaction } from '../types';

interface GenerateReportParams {
  type: 'monthly' | 'yearly';
  stats: MonthlyStats;
  prevStats?: MonthlyStats;
  transactions: Transaction[];
  dateLabel: string;
  userContext?: string;
}

export const generateFinancialReport = async (params: GenerateReportParams): Promise<string> => {
  // Vite 在编译时会替换 process.env.API_KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return "错误：未检测到 API Key。请在 Cloudflare Pages 的 Environment Variables 中配置 API_KEY。";
  }

  const ai = new GoogleGenAI({ apiKey });
  const { type, stats, transactions, dateLabel, userContext } = params;

  const sortedTransactions = [...transactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 30)
    .map(t => `${new Date(t.date).toLocaleDateString()} - ${t.categoryName}: ${t.amount} [${t.note}]`)
    .join('\n');

  const commonRole = `你是一位顶级财务管家和理性消费分析师。`;

  let prompt = '';
  if (type === 'monthly') {
    prompt = `${commonRole} 分析【${dateLabel}】。收入:${stats.totalIncome}, 支出:${stats.totalExpense}, 储蓄率:${(stats.savingsRate*100).toFixed(1)}%。补充信息:${userContext || '无'}。账单样本:\n${sortedTransactions}`;
  } else {
    prompt = `${commonRole} 复盘【${dateLabel}】年度数据。年收入:${stats.totalIncome}, 年支出:${stats.totalExpense}。补充信息:${userContext || '无'}。账单样本:\n${sortedTransactions}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "AI 思考后没说话，请重试。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "分析请求失败，请检查 API Key 配置或网络连接。";
  }
};