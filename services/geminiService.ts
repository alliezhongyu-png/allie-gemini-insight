
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
  // 更加健壮的 Key 获取方式
  const apiKey = (window as any).process?.env?.API_KEY || process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey.length < 10) {
    return "错误：AI 分析师未能启动。请在部署平台的 Environment Variables 中检查 API_KEY 是否配置正确，并确保重新部署了站点。";
  }

  const ai = new GoogleGenAI({ apiKey });
  const { type, stats, prevStats, transactions, dateLabel, userContext } = params;

  const expenseTx = transactions.filter(t => t.type === 'EXPENSE');
  
  const sortedTransactions = [...transactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 30)
    .map(t => `${new Date(t.date).toLocaleDateString()} - ${t.categoryName}: ${t.amount} [${t.note || '无备注'}]`)
    .join('\n');

  const systemInstruction = `
    你是一位顶级的私人财务管家和理性消费分析师。
    你的核心人设：理性、犀利、毒舌但有温度。你深度了解Z时代（Gen Z）的消费逻辑：
    - 追求“悦己”，愿意为情绪价值买单。
    - 警惕消费主义洗脑，追求“早日退休（FIRE）”。
    - 擅长发现生活中的各种“隐形贫穷”陷阱。
    
    任务目标：
    1. 根据财务数据进行深度“体检”，识别消费亮点或雷区。
    2. 提供具建设性且能引发共情的行动建议。
    
    格式要求：
    - 严禁使用死板的[收支概览][异常识别]这种老掉牙的大纲。
    - 请根据本月数据的实际特点，自行组织一个清晰、简洁、富有视觉层次感的报告。
    - 风格要现代，多用 Markdown 的加粗、标题和列表，让用户一眼看到重点。
  `;

  const dataPayload = `
    报告周期：${dateLabel}
    用户生活背景补充：${userContext || "无"}
    
    核心指标：
    - 总收入：${stats.totalIncome.toFixed(2)}
    - 总支出：${stats.totalExpense.toFixed(2)}
    - 净储蓄：${stats.savings.toFixed(2)} (储蓄率: ${(stats.savingsRate * 100).toFixed(1)}%)
    - 投资理财：${stats.investmentAmount.toFixed(2)} (投资率: ${(stats.investmentRate * 100).toFixed(1)}%)
    
    宏观分类金额：
    - 生存刚需: ${stats.categoryBreakdown[MacroCategory.SURVIVAL].toFixed(2)}
    - 吃喝日常: ${stats.categoryBreakdown[MacroCategory.DAILY_FOOD].toFixed(2)}
    - 悦己享受: ${stats.categoryBreakdown[MacroCategory.ENJOYMENT].toFixed(2)}
    - 投资成长: ${stats.categoryBreakdown[MacroCategory.INVESTMENT].toFixed(2)}
    
    样本账单：
    ${sortedTransactions}
    
    请以此开始你的深度诊断（使用 Markdown 格式）：
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: dataPayload,
      config: {
        systemInstruction,
        temperature: 0.8,
      }
    });
    
    return response.text || "AI 分析师暂时离线，请稍后再试。";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `分析失败：请确认环境变量 API_KEY 是否生效（Netlify 需要 Trigger Deploy 才能应用新变量）。`;
  }
};
