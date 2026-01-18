import { GoogleGenAI } from "@google/genai";
import { MonthlyStats, Transaction, MacroCategory } from '../types';

interface GenerateReportParams {
  type: 'monthly' | 'yearly';
  stats: MonthlyStats;
  prevStats?: MonthlyStats; // For monthly comparison
  transactions: Transaction[];
  dateLabel: string; // "2023年10月" or "2023年"
  userContext?: string; // Supplementary content from user
}

export const generateFinancialReport = async (params: GenerateReportParams): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const { type, stats, prevStats, transactions, dateLabel, userContext } = params;

  // Find max transaction for "Abnormal Spending" detection
  const expenseTx = transactions.filter(t => t.type === 'EXPENSE');
  const maxTx = expenseTx.length > 0 ? expenseTx.reduce((prev, current) => (prev.amount > current.amount) ? prev : current) : null;
  
  // Prepare transaction sample (Top 30 by amount to identify large expenses)
  const sortedTransactions = [...transactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 30)
    .map(t => `${new Date(t.date).toLocaleDateString()} - ${t.categoryName}: ${t.amount} [${t.note}]`)
    .join('\n');

  let prompt = '';

  const commonRole = `你是一位顶级理财专家，同时也是一位深谙经济规律和宏观发展趋势的经济学家。你的风格理性、犀利、一针见血，杜绝空话套话。`;

  if (type === 'monthly') {
    prompt = `
    ${commonRole}
    请为我生成【${dateLabel}】的月度财务分析报告。

    【用户补充背景/上下文】（根据此信息修正建议）：
    ${userContext || "无"}

    【本月核心数据】
    - 总收入: ${stats.totalIncome.toFixed(2)}
    - 总支出: ${stats.totalExpense.toFixed(2)}
    - 投资/储蓄投入: ${stats.savings.toFixed(2)}
    - 净结余 (盈余/赤字): ${(stats.totalIncome - stats.totalExpense).toFixed(2)}
    
    【关键指标】 (括号内为上月数据，用于对比)
    - 储蓄率: ${(stats.savingsRate * 100).toFixed(1)}% (上月: ${prevStats ? (prevStats.savingsRate * 100).toFixed(1) + '%' : '无数据'})
    - 投资率: ${(stats.investmentRate * 100).toFixed(1)}% (上月: ${prevStats ? (prevStats.investmentRate * 100).toFixed(1) + '%' : '无数据'})
    - 享受消费率: ${stats.totalExpense > 0 ? ((stats.categoryBreakdown[MacroCategory.ENJOYMENT] / stats.totalExpense) * 100).toFixed(1) : 0}%

    【消费结构详情】
    - 固定生存成本: ${stats.categoryBreakdown[MacroCategory.SURVIVAL].toFixed(2)}
    - 吃喝日常: ${stats.categoryBreakdown[MacroCategory.DAILY_FOOD].toFixed(2)}
    - 享受型消费: ${stats.categoryBreakdown[MacroCategory.ENJOYMENT].toFixed(2)}
    - 必要支出: ${stats.categoryBreakdown[MacroCategory.NECESSARY].toFixed(2)}
    - 投资理财: ${stats.categoryBreakdown[MacroCategory.INVESTMENT].toFixed(2)}

    【单笔最大支出】
    ${maxTx ? `${maxTx.categoryName}: ${maxTx.amount} (${maxTx.note})` : '无'}

    【Top 30 大额账单样本】
    ${sortedTransactions}

    请严格按照以下格式输出：

    【收支概览】
    • 总收入：[金额]
    • 总支出：[金额]
    • 投资 / 储蓄：[金额]
    • 净结余：[盈余/赤字 金额]

    【消费结构分析】
    • 固定生存成本占比：[xx]%
    • 吃喝日常占比：[xx]%
    • 享受型消费占比：[xx]%
    • 必要支出占比：[xx]%
    • 投资理财占比：[xx]%
    **关键指标变化：**
    • 生存成本率：[xx]% (环比 [↑/↓])
    • 享受消费率：[xx]% (环比 [↑/↓])
    • 投资率：[xx]% (环比 [↑/↓])

    【异常消费识别】
    • 单笔最大支出：[项目名] [金额]
    • 本月突增类别：[分析哪个类别比平时高]
    • 显著差异项目：[指出与上月或常理相比差异>20%的项目]

    【投资行为快照】
    • 资金投入情况：[评价是否按计划投入]
    • 投资中断预警：[如有]
    • 投资收入比：[xx]%

    【下月行动建议】
    1. [具体建议，指出哪类支出必须砍]
    2. [具体建议，关于储蓄或投资]
    3. [具体建议，结合用户补充背景]
    `;
  } else {
    // YEARLY REPORT
    prompt = `
    ${commonRole}
    请为我生成【${dateLabel}】的年度财务深度复盘报告。

    【用户补充背景/上下文】（例如：今年有大额支出、跳槽、生病等）：
    ${userContext || "无"}

    【年度核心数据】
    - 年总收入: ${stats.totalIncome.toFixed(2)}
    - 年总支出: ${stats.totalExpense.toFixed(2)}
    - 年投资总额: ${stats.investmentAmount.toFixed(2)}
    - 年净资产增加 (收入-支出): ${stats.savings.toFixed(2)}
    
    【年度结构】
    - 生存成本: ${stats.categoryBreakdown[MacroCategory.SURVIVAL].toFixed(2)}
    - 享受消费: ${stats.categoryBreakdown[MacroCategory.ENJOYMENT].toFixed(2)}
    - 投资理财: ${stats.categoryBreakdown[MacroCategory.INVESTMENT].toFixed(2)}

    【Top 30 年度大额账单样本】
    ${sortedTransactions}

    请严格按照以下格式输出：

    【年度总览（全景视角）】
    • 年总收入：[金额]
    • 年总支出：[金额]
    • 年投资总额：[金额]
    • 年净资产变化：[↑/↓ 金额]

    【财富增长分析】
    • 资产增长额：[金额]
    • 增长来源简述：[基于数据分析是靠省出来的，还是赚出来的]

    【消费结构年度趋势】
    • 生存成本趋势：[评价是否上升]
    • 享受消费控制：[评价是否失控]
    • 投资占比变化：[评价]

    【投资表现与行为评估】
    • 年度投资执行力：[评价是否坚持投入]
    • 操作风格评估：[基于数据评价]

    【关键事件影响分析】
    • [识别大额消费如旅游、医疗、大件物品对财务的影响]
    • [结合用户提供的背景进行分析]

    【年度财富体检评分】
    • 消费结构健康度：[⭐星级]
    • 储蓄纪律：[⭐星级]
    • 投资执行力：[⭐星级]
    • 风险控制：[⭐星级]

    【下一年度目标与建议】
    • 明年投资率目标建议：[xx]%
    • 储蓄金额目标建议：[金额]
    • 阶段性建议：[是否需要优化资产配置或增加收入渠道]
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "无法生成报告。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "分析生成失败，请检查网络或 API Key。";
  }
};
