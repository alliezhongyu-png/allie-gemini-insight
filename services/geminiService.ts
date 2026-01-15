
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
  // 直接使用 process.env.API_KEY，由部署环境负责注入
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    return "诊断失败：未检测到 API 密钥。请确保您已在 Netlify 面板中设置了名为 API_KEY 的环境变量，并触发了 'Clear cache and deploy site' 以应用更改。";
  }

  const ai = new GoogleGenAI({ apiKey });
  const { stats, transactions, dateLabel, userContext } = params;

  const sortedTransactions = [...transactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 30)
    .map(t => `${new Date(t.date).toLocaleDateString()} - ${t.categoryName}: ${t.amount} [${t.note || '无备注'}]`)
    .join('\n');

  const systemInstruction = `
    你是一位顶级的私人财务管家和理性消费分析师。
    你的核心人设：理性、犀利、毒舌但有温度。你深度了解Z时代（Gen Z）的消费逻辑。
    
    任务目标：
    1. 根据财务数据进行深度“体检”，识别消费亮点或雷区。
    2. 提供具建设性且能引发共情的行动建议。
    
    格式要求：
    - 自行组织一个清晰、简洁、富有视觉层次感的 Markdown 报告。
  `;

  const dataPayload = `
    报告周期：${dateLabel}
    用户生活背景补充：${userContext || "无"}
    核心指标：
    - 总收入：${stats.totalIncome.toFixed(2)}
    - 总支出：${stats.totalExpense.toFixed(2)}
    - 净储蓄：${stats.savings.toFixed(2)} (储蓄率: ${(stats.savingsRate * 100).toFixed(1)}%)
    - 宏观分类: ${JSON.stringify(stats.categoryBreakdown)}
    账单数据预览:
    ${sortedTransactions}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: dataPayload,
      config: { systemInstruction, temperature: 0.8 }
    });
    return response.text || "AI 分析师暂时离线。";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `分析出错：${error.message || "未知错误"}。请确认 API Key 是否有效。`;
  }
};
