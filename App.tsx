
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Wallet, PieChart, Sparkles, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, ChevronDown, CalendarDays, FileText, Calendar, ArrowUp, ArrowDown, Palette, Check, X, Trash2 } from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip } from 'recharts';
import { Transaction, MonthlyStats, MacroCategory, CategoryItem, TransactionType } from './types';
import { 
    getTransactions, saveTransaction, calculateMonthlyStats, deleteTransaction, 
    getAvailableYears, calculateYearlyStats, getPreviousMonthStats,
    getCategories, addCategory, deleteCategory 
} from './services/storageService';
import { generateFinancialReport } from './services/geminiService';
import AddTransaction from './components/AddTransaction';
import { getIconComponent } from './constants';

const MACRO_COLORS: Record<string, string> = {
  [MacroCategory.SURVIVAL]: '#6B705C',
  [MacroCategory.DAILY_FOOD]: '#D4A373',
  [MacroCategory.ENJOYMENT]: '#BC4749',
  [MacroCategory.NECESSARY]: '#457B9D',
  [MacroCategory.INVESTMENT]: '#2A9D8F',
  [MacroCategory.INCOME]: '#6D597A',
  [MacroCategory.TRANSFER]: '#A5A58D',
};

const CATEGORY_ICON_COLORS = [
  '#E76F51', '#264653', '#E9C46A', '#F4A261', '#83C5BE', '#006D77',
  '#FFB4A2', '#B5838D', '#6D6875', '#5F0F40', '#9A031E', '#FB8B24',
];

const DEFAULT_THEME_COLOR = '#1C1917';

const hexToRgba = (hex: string, alpha: number) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getCategoryColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_ICON_COLORS[Math.abs(hash) % CATEGORY_ICON_COLORS.length];
};

interface SwipeableItemProps {
    transaction: Transaction;
    category: CategoryItem | undefined;
    trendIcon: React.ReactNode;
    onDelete: (id: string) => void;
    isOpen: boolean;
    onSwipeOpen: (id: string) => void;
    onSwipeClose: () => void;
    isLast: boolean;
}

const SwipeableTransactionItem: React.FC<SwipeableItemProps> = ({ 
    transaction: t, category, trendIcon, onDelete, isOpen, onSwipeOpen, onSwipeClose, isLast 
}) => {
    const icon = category ? category.icon : 'Wallet';
    const tDate = new Date(t.date);
    const formattedDate = `${tDate.getMonth() + 1}/${tDate.getDate()}`;
    const [dragOffset, setDragOffset] = useState(0);
    const touchStartX = useRef<number | null>(null);

    useEffect(() => { setDragOffset(0); }, [isOpen]);

    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const diff = e.touches[0].clientX - touchStartX.current;
        if (!isOpen) { if (diff < 0 && diff > -100) setDragOffset(diff); } 
        else { if (diff > 0 && diff < 100) setDragOffset(diff); }
    };
    const handleTouchEnd = () => {
        if (touchStartX.current === null) return;
        if (!isOpen) { if (dragOffset < -40) onSwipeOpen(t.id); else setDragOffset(0); } 
        else { if (dragOffset > 40) onSwipeClose(); else setDragOffset(0); }
        touchStartX.current = null;
    };

    const baseOffset = isOpen ? -80 : 0;
    let visualOffset = baseOffset + dragOffset;
    if (visualOffset < -80) visualOffset = -80;
    if (visualOffset > 0) visualOffset = 0;

    return (
        <div className="relative overflow-hidden w-full">
            <div className={`absolute inset-y-0 right-0 w-[80px] bg-red-500 flex items-center justify-center text-white z-0 ${isLast ? 'rounded-br-[32px]' : ''}`}>
                <button onClick={() => onDelete(t.id)} className="w-full h-full flex items-center justify-center"><Trash2 size={24} /></button>
            </div>
            <div 
                className={`bg-[#FDFCF8] relative z-10 w-full transition-transform duration-300 ease-out ${!isLast ? 'border-b border-gray-50' : ''}`}
                style={{ transform: `translateX(${visualOffset}px)` }}
                onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
            >
                <div className="p-5 flex items-center justify-between hover:bg-[#F9F8F6] group transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[18px] flex items-center justify-center text-white shadow-md transform group-hover:scale-105 transition-transform" style={{ backgroundColor: getCategoryColor(t.categoryId) }}>
                            {getIconComponent(icon, 20)}
                        </div>
                        <div>
                            <div className="font-bold text-gray-800 text-base flex items-center gap-1.5">{t.categoryName}{trendIcon}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5 font-medium">
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{formattedDate}</span>
                                {t.note && <span className="truncate max-w-[120px]">{t.note}</span>}
                            </div>
                        </div>
                    </div>
                    <div className={`font-serif font-bold text-base ${t.type === 'INCOME' ? 'text-[#2A9D8F]' : 'text-gray-900'}`}>{t.type === 'INCOME' ? '+' : '-'}{t.amount.toFixed(2)}</div>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report'>('dashboard');
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [userContext, setUserContext] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    setTransactions(getTransactions());
    setCategories(getCategories());
    
    // 强化 API Key 检测逻辑
    const key = process.env.API_KEY;
    const isMissing = !key || key === 'undefined' || key === 'null' || key.trim().length < 5;
    setApiKeyMissing(isMissing);
    
    const savedTheme = localStorage.getItem('wealthgrows_theme');
    if (savedTheme) setThemeColor(savedTheme);
  }, []);

  const dashboardStats = useMemo(() => calculateMonthlyStats(transactions, selectedDate), [transactions, selectedDate]);
  const prevDashboardStats = useMemo(() => getPreviousMonthStats(transactions, selectedDate), [transactions, selectedDate]);
  const displayTransactions = useMemo(() => transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
  }), [transactions, selectedDate]);
  const availableYears = useMemo(() => getAvailableYears(transactions), [transactions]);

  // Fix: Added handleSaveTransaction to fix missing name error
  const handleSaveTransaction = (t: Transaction) => {
    const updated = saveTransaction(t);
    setTransactions(updated);
  };

  // Fix: Added handleDeleteTransaction to fix missing name error
  const handleDeleteTransaction = (id: string) => {
    const updated = deleteTransaction(id);
    setTransactions(updated);
    if (openSwipeId === id) setOpenSwipeId(null);
  };

  const handleGenerateReport = async () => {
    if (apiKeyMissing) return;
    setLoadingReport(true);
    setReport(null); 
    try {
        let stats = reportType === 'monthly' ? dashboardStats : calculateYearlyStats(transactions, reportYear);
        let relevantTx = reportType === 'monthly' ? displayTransactions : transactions.filter(t => new Date(t.date).getFullYear() === reportYear);
        let dateLabel = reportType === 'monthly' ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月` : `${reportYear}年度`;

        const result = await generateFinancialReport({
            type: reportType, stats, prevStats: reportType === 'monthly' ? prevDashboardStats : undefined,
            transactions: relevantTx, dateLabel, userContext
        });
        setReport(result);
    } catch (e) {
        setReport("生成失败：请确认环境变量 API_KEY 已设置并在 Netlify 中重新部署。");
    } finally {
        setLoadingReport(false);
    }
  };

  // Fix: Cast Object.entries result to resolve 'unknown' vs 'number' comparison error
  const pieData = (Object.entries(dashboardStats.categoryBreakdown) as [string, number][])
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  const getTrendIcon = (current: number, previous: number) => {
      if (!previous || current === previous) return null;
      const isIncrease = current > previous;
      const Icon = isIncrease ? ArrowUpRight : ArrowDownRight;
      return <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${isIncrease ? 'bg-[#BC4749]' : 'bg-[#2A9D8F]'}`}><Icon size={10} strokeWidth={3} /></div>;
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#F2F0E9] flex flex-col relative shadow-2xl overflow-hidden font-sans">
      <header className="px-8 pt-12 pb-6 flex justify-between items-center z-10 sticky top-0 bg-[#F2F0E9]/95 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-serif font-bold tracking-tight" style={{ color: themeColor }}>这日子还过吗</h1>
            <button onClick={() => setShowColorPicker(true)} className="p-1.5 rounded-full hover:bg-black/5"><Palette size={16} style={{ color: themeColor, opacity: 0.8 }} /></button>
          </div>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-medium">Rational • Long-term</p>
        </div>
        <div className="relative group">
             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-black/5">
                <span className="text-sm font-bold text-gray-800 font-serif">{selectedDate.getFullYear()}.{String(selectedDate.getMonth() + 1).padStart(2, '0')}</span>
                <ChevronDown size={14} className="text-gray-400"/>
             </div>
             <input type="month" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => { if (e.target.value) { const [y, m] = e.target.value.split('-').map(Number); setSelectedDate(new Date(y, m - 1, 1)); setReportYear(y); } }} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-36 px-6">
        <div className="flex p-1.5 gap-2 bg-gray-200/50 rounded-full mb-6">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-2.5 rounded-full flex items-center justify-center gap-2 text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'text-white shadow-md' : 'text-gray-500'}`} style={activeTab === 'dashboard' ? { backgroundColor: themeColor } : {}}><Wallet size={16} />月度概览</button>
          <button onClick={() => setActiveTab('report')} className={`flex-1 py-2.5 rounded-full flex items-center justify-center gap-2 text-sm font-bold transition-all ${activeTab === 'report' ? 'text-white shadow-md' : 'text-gray-500'}`} style={activeTab === 'report' ? { backgroundColor: themeColor } : {}}><Sparkles size={16} />AI 分析师</button>
        </div>

        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            <div className="p-6 rounded-[32px] shadow-lg text-white relative overflow-hidden" style={{ backgroundColor: themeColor }}>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div><span className="text-xs font-bold tracking-widest text-white/70 uppercase">Net Saving</span><div className="text-4xl font-serif font-medium mt-1">{dashboardStats.savings.toFixed(2)}</div></div>
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-md"><TrendingUp size={24} /></div>
                    </div>
                    <div className="flex gap-8 border-t border-white/20 pt-4">
                        <div><div className="text-[10px] text-white/70 uppercase mb-1">Savings Rate</div><div className="font-serif text-xl">{(dashboardStats.savingsRate * 100).toFixed(0)}%</div></div>
                        <div><div className="text-[10px] text-white/70 uppercase mb-1">Invest Rate</div><div className="font-serif text-xl">{(dashboardStats.investmentRate * 100).toFixed(0)}%</div></div>
                    </div>
                  </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#FDFCF8] p-5 rounded-[28px] shadow-sm"><span className="text-xs text-gray-400 font-bold uppercase">Income</span><div className="text-2xl font-serif text-gray-800 mt-2 flex items-center gap-1"><span className="text-[#2A9D8F] text-sm bg-[#2A9D8F]/10 p-1 rounded-full"><ArrowUp size={12}/></span>{dashboardStats.totalIncome.toFixed(0)}</div></div>
               <div className="bg-[#FDFCF8] p-5 rounded-[28px] shadow-sm"><span className="text-xs text-gray-400 font-bold uppercase">Expense</span><div className="text-2xl font-serif text-gray-800 mt-2 flex items-center gap-1"><span className="text-[#BC4749] text-sm bg-[#BC4749]/10 p-1 rounded-full"><ArrowDown size={12}/></span>{dashboardStats.totalExpense.toFixed(0)}</div></div>
            </div>
            {dashboardStats.totalExpense > 0 && (
              <div className="bg-[#FDFCF8] p-6 rounded-[32px] shadow-sm">
                <h3 className="text-lg font-serif font-bold text-gray-800 mb-6">消费结构</h3>
                <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%"><RechartsPie><Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none" cornerRadius={4}>{pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={MACRO_COLORS[entry.name] || '#ccc'} />))}</Pie><Tooltip /></RechartsPie></ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center"><div><div className="text-[10px] text-gray-400 uppercase">Total</div><div className="font-serif font-bold text-gray-800 text-xl">{dashboardStats.totalExpense.toFixed(0)}</div></div></div>
                </div>
                <div className="mt-8 flex flex-wrap gap-2 justify-center">
                    {/* Fix: pieData values are now typed as number from casted Object.entries above */}
                    {pieData.map((d) => (<div key={d.name} className="flex items-center gap-2 text-xs text-gray-600 bg-[#F2F0E9] px-3 py-1.5 rounded-full border border-black/5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: MACRO_COLORS[d.name]}}></div><span className="font-medium">{d.name}</span><div className="flex items-center gap-1 pl-1 border-l border-gray-300 ml-1"><span className="font-bold">{(d.value / dashboardStats.totalExpense * 100).toFixed(0)}%</span>{getTrendIcon(dashboardStats.categoryBreakdown[d.name], prevDashboardStats.categoryBreakdown[d.name] || 0)}</div></div>))}
                </div>
              </div>
            )}
            <div className="bg-[#FDFCF8] rounded-[32px] shadow-sm overflow-hidden pb-4">
                <div className="p-6 border-b border-gray-100/50 flex justify-between items-center"><h3 className="font-serif font-bold text-lg">近期账单</h3></div>
                <div className="flex flex-col">
                    {displayTransactions.length === 0 ? (<div className="p-10 text-center text-gray-400 text-sm">本月暂无记录</div>) : (
                        displayTransactions.map((t, idx) => (<SwipeableTransactionItem key={t.id} transaction={t} category={categories.find(c => c.id === t.categoryId)} trendIcon={t.type === 'EXPENSE' ? getTrendIcon(dashboardStats.specificCategoryBreakdown[t.categoryId] || 0, prevDashboardStats.specificCategoryBreakdown[t.categoryId] || 0) : null} onDelete={handleDeleteTransaction} isOpen={openSwipeId === t.id} onSwipeOpen={setOpenSwipeId} onSwipeClose={() => setOpenSwipeId(null)} isLast={idx === displayTransactions.length - 1} />))
                    )}
                </div>
            </div>
          </div>
        ) : (
          <div className="pb-12">
            <div className="bg-[#FDFCF8] rounded-[32px] p-6 shadow-sm mb-6 space-y-5">
               <div className="flex bg-[#F2F0E9] p-1.5 rounded-2xl">
                   <button onClick={() => setReportType('monthly')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${reportType === 'monthly' ? 'bg-white shadow-sm' : 'text-gray-400'}`} style={reportType === 'monthly' ? { color: themeColor } : {}}>月度报告</button>
                   <button onClick={() => setReportType('yearly')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${reportType === 'yearly' ? 'bg-white shadow-sm' : 'text-gray-400'}`} style={reportType === 'yearly' ? { color: themeColor } : {}}>年度报告</button>
               </div>
               <div className="space-y-4">
                   <div className="flex items-center gap-3 text-sm bg-white px-4 py-4 rounded-2xl border border-gray-100">
                      <div className="bg-gray-100 p-2 rounded-full"><Calendar size={16} /></div>
                      <div><span className="block text-xs text-gray-400 uppercase">Target</span><span className="font-serif font-bold text-gray-900 text-lg">{reportType === 'monthly' ? `${selectedDate.getFullYear()}.${String(selectedDate.getMonth() + 1).padStart(2, '0')}` : reportYear}</span></div>
                   </div>
                   <textarea value={userContext} onChange={e => setUserContext(e.target.value)} placeholder="说说本月的大变动（如旅游、大病、意外之财）..." className="w-full bg-white rounded-2xl py-4 px-4 text-sm outline-none border border-gray-100 min-h-[100px] resize-none" />
               </div>
                {apiKeyMissing ? (
                    <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-3 border border-amber-100">
                        <AlertCircle className="shrink-0 text-amber-500" size={20} />
                        <div className="text-xs text-amber-800"><span className="font-bold block text-sm mb-1">API Key Missing</span>请在 Netlify 环境变量中设置 API_KEY 并重新部署。</div>
                    </div>
                ) : (
                    <button onClick={handleGenerateReport} disabled={loadingReport} className="w-full text-white font-bold py-4 rounded-2xl active:scale-95 transition-all shadow-xl flex justify-center items-center gap-3" style={{ backgroundColor: themeColor }}>{loadingReport ? '分析中...' : <><Sparkles size={20} /> 生成诊断报告</>}</button>
                )}
            </div>
            {report && (
                <div className="bg-[#FDFCF8] rounded-[32px] p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                     <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100"><div className="p-3 rounded-full" style={{ backgroundColor: hexToRgba(themeColor, 0.1), color: themeColor }}><TrendingUp size={24} /></div><h3 className="font-serif font-bold text-gray-800 text-2xl">Financial Analysis</h3></div>
                     <div className="prose prose-sm prose-stone max-w-none whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-base">{report}</div>
                </div>
            )}
          </div>
        )}
      </main>
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-50">
          <button onClick={() => setIsAddModalOpen(true)} className="pointer-events-auto text-white w-18 h-18 p-5 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform" style={{ backgroundColor: themeColor, boxShadow: `0 15px 35px -5px ${hexToRgba(themeColor, 0.5)}` }}><Plus size={36} /></button>
      </div>
      <AddTransaction isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveTransaction} categories={categories} onAddCategory={c => setCategories(addCategory(c))} onDeleteCategory={id => setCategories(deleteCategory(id))} currentMonthDate={selectedDate} themeColor={themeColor} />
    </div>
  );
};
export default App;
