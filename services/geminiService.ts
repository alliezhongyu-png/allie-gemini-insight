
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
  // 按规范直接读取 process.env.API_KEY
  const apiKey = process.env.API_KEY;
  
  // 增加更宽容的长度检测，并针对 Netlify 部署环境提供更具操作性的建议
  if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
    return "诊断失败：未检测到有效的 API 密钥。\n\n" +
           "排查步骤：\n" +
           "1. 检查 Netlify 面板中的变量名是否为 API_KEY。\n" +
           "2. 重要：前往 Deploys 页面，点击 'Trigger deploy' -> 'Clear cache and deploy site'。\n" +
           "3. 如果您是在本地运行，请确保设置了相应的环境变量。"+apiKey;
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
    你的核心人设：理性、犀利、毒舌但有温度。你深度了解年轻人的消费逻辑：
    - 追求情绪价值。
    - 警惕消费主义。
    - 目标是建立长期可持续的财富增长系统。
    
    任务目标：
    1. 根据财务数据进行深度“体检”，识别消费亮点或雷区。
    2. 提供具建设性的改进建议。
    
    格式要求：
    - 使用 Markdown 格式。
  `;

  const dataPayload = `
    报告周期：${dateLabel}
    用户备注：${userContext || "无"}
    总收入：${stats.totalIncome.toFixed(2)}
    总支出：${stats.totalExpense.toFixed(2)}
    净储蓄：${stats.savings.toFixed(2)} (储蓄率: ${(stats.savingsRate * 100).toFixed(1)}%)
    支出结构：${JSON.stringify(stats.categoryBreakdown)}
    账单记录：
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
    if (error.message?.includes('API_KEY_INVALID')) {
      return "分析失败：您的 API Key 无效，请重新检查 Netlify 中的变量设置。";
    }
    return `分析出错：${error.message || "未知网络错误"}。`;
  }
};
