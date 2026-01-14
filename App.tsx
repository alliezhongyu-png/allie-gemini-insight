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

// COLORS for Macro Categories - Earthy/Vintage Tones
const MACRO_COLORS: Record<string, string> = {
  [MacroCategory.SURVIVAL]: '#6B705C',   // Olive (Survival/Stable)
  [MacroCategory.DAILY_FOOD]: '#D4A373', // Buff/Tan (Food/Warmth)
  [MacroCategory.ENJOYMENT]: '#BC4749',  // Muted Red (Enjoyment/Passion)
  [MacroCategory.NECESSARY]: '#457B9D',  // Steel Blue (Necessary/Cool)
  [MacroCategory.INVESTMENT]: '#2A9D8F', // Persian Green (Growth)
  [MacroCategory.INCOME]: '#6D597A',     // English Violet (Wealth)
  [MacroCategory.TRANSFER]: '#A5A58D',   // Artichoke (Neutral)
};

// Palette for Transaction Category Icons - Travel/Magazine Aesthetic
const CATEGORY_ICON_COLORS = [
  '#E76F51', // Burnt Sienna
  '#264653', // Charcoal
  '#E9C46A', // Maize
  '#F4A261', // Sandy Brown
  '#83C5BE', // Tiffany Blue
  '#006D77', // Deep Teal
  '#FFB4A2', // Melon
  '#B5838D', // English Lavender
  '#6D6875', // Old Lavender
  '#5F0F40', // Tyrian Purple
  '#9A031E', // Ruby Red
  '#FB8B24', // Spanish Orange
];

const DEFAULT_THEME_COLOR = '#1C1917'; // Warm Black/Dark Stone as default for this style

// Helper to create transparent colors from theme
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

// Helper to get consistent color for a category ID
const getCategoryColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CATEGORY_ICON_COLORS.length;
  return CATEGORY_ICON_COLORS[index];
};

// --- SUB-COMPONENT: Swipeable Transaction Item ---
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

    // Touch State
    const [dragOffset, setDragOffset] = useState(0);
    const touchStartX = useRef<number | null>(null);

    // Sync state with parent "isOpen" prop
    useEffect(() => {
        setDragOffset(0);
    }, [isOpen]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        if (!isOpen) {
             // Optional: Close others if touching this one?
             // onSwipeOpen(t.id); // This might cause jitter if we just want to scroll list.
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartX.current;
        
        // Logic:
        // If closed (isOpen=false): allow left swipe (diff < 0). Cap at -100.
        // If open (isOpen=true): allow right swipe (diff > 0). Cap at 100.
        
        if (!isOpen) {
             if (diff < 0 && diff > -100) setDragOffset(diff);
        } else {
             if (diff > 0 && diff < 100) setDragOffset(diff);
        }
    };

    const handleTouchEnd = () => {
        if (touchStartX.current === null) return;
        
        if (!isOpen) {
            // Was closed, trying to open
            if (dragOffset < -40) {
                onSwipeOpen(t.id); 
            } else {
                setDragOffset(0);
            }
        } else {
            // Was open, trying to close
            if (dragOffset > 40) { 
                onSwipeClose(); 
            } else {
                setDragOffset(0);
            }
        }
        
        touchStartX.current = null;
    };

    // Calculate visual transform
    const baseOffset = isOpen ? -80 : 0;
    let visualOffset = baseOffset + dragOffset;
    
    // Clamp
    if (visualOffset < -80) visualOffset = -80;
    if (visualOffset > 0) visualOffset = 0;

    const transformStyle = { transform: `translateX(${visualOffset}px)` };
    const transitionClass = touchStartX.current ? '' : 'transition-transform duration-300 ease-out';

    return (
        <div className="relative overflow-hidden w-full">
            {/* Background Action Layer (Delete Button) */}
            <div className={`absolute inset-y-0 right-0 w-[80px] bg-red-500 flex items-center justify-center text-white z-0 ${isLast ? 'rounded-br-[32px]' : ''}`}>
                <button onClick={() => onDelete(t.id)} className="w-full h-full flex items-center justify-center">
                    <Trash2 size={24} />
                </button>
            </div>

            {/* Foreground Content Layer */}
            <div 
                className={`bg-[#FDFCF8] relative z-10 w-full ${transitionClass} ${!isLast ? 'border-b border-gray-50' : ''}`}
                style={transformStyle}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="p-5 flex items-center justify-between hover:bg-[#F9F8F6] group transition-colors">
                    <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-[18px] flex items-center justify-center text-white shadow-md transform group-hover:scale-105 transition-transform duration-300"
                          style={{ backgroundColor: getCategoryColor(t.categoryId) }}
                        >
                            {getIconComponent(icon, 20)}
                        </div>
                        <div>
                            <div className="font-bold text-gray-800 text-base flex items-center gap-1.5">
                                {t.categoryName}
                                {trendIcon && <div className="ml-0.5 transform scale-90">{trendIcon}</div>}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5 font-medium">
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{formattedDate}</span>
                                {t.note && <span className="truncate max-w-[120px]">{t.note}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`font-serif font-bold text-base ${t.type === 'INCOME' ? 'text-[#2A9D8F]' : 'text-gray-900'}`}>
                            {t.type === 'INCOME' ? '+' : '-'}{t.amount.toFixed(2)}
                        </div>
                    </div>
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
  
  // Theme State
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Dashboard State
  const [selectedDate, setSelectedDate] = useState(new Date()); // For Dashboard & Monthly Report
  
  // Swipe State
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);

  // AI Report State
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [userContext, setUserContext] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    setTransactions(getTransactions());
    setCategories(getCategories());
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
    }
    
    // Load theme
    const savedTheme = localStorage.getItem('wealthgrows_theme');
    if (savedTheme) {
        setThemeColor(savedTheme);
    }
  }, []);

  const handleThemeChange = (color: string) => {
      setThemeColor(color);
      localStorage.setItem('wealthgrows_theme', color);
      setShowColorPicker(false);
  };

  // --- Derived Data ---
  
  const dashboardStats: MonthlyStats = useMemo(() => calculateMonthlyStats(transactions, selectedDate), [transactions, selectedDate]);
  const prevDashboardStats: MonthlyStats = useMemo(() => getPreviousMonthStats(transactions, selectedDate), [transactions, selectedDate]);

  const displayTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    });
  }, [transactions, selectedDate]);

  const availableYears = useMemo(() => getAvailableYears(transactions), [transactions]);


  // --- Handlers ---

  const handleSaveTransaction = (t: Transaction) => {
    const updated = saveTransaction(t);
    setTransactions(updated);
  };

  const handleDeleteTransaction = (id: string) => {
      const updated = deleteTransaction(id);
      setTransactions(updated);
      setOpenSwipeId(null);
  };

  const handleAddCategory = (c: CategoryItem) => {
      const updated = addCategory(c);
      setCategories(updated);
  };

  const handleDeleteCategory = (id: string) => {
      const updated = deleteCategory(id);
      setCategories(updated);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
        const [year, month] = e.target.value.split('-').map(Number);
        setSelectedDate(new Date(year, month - 1, 1));
        setReportYear(year); 
    }
  };

  const handleGenerateReport = async () => {
    if (apiKeyMissing) return;
    setLoadingReport(true);
    setReport(null); 

    try {
        let stats: MonthlyStats;
        let prevStats: MonthlyStats | undefined;
        let relevantTx: Transaction[] = [];
        let dateLabel = '';

        if (reportType === 'monthly') {
            stats = dashboardStats; 
            prevStats = prevDashboardStats;
            relevantTx = displayTransactions;
            dateLabel = `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月`;
        } else {
            stats = calculateYearlyStats(transactions, reportYear);
            relevantTx = transactions.filter(t => new Date(t.date).getFullYear() === reportYear);
            dateLabel = `${reportYear}年度`;
        }

        const result = await generateFinancialReport({
            type: reportType,
            stats,
            prevStats,
            transactions: relevantTx,
            dateLabel,
            userContext
        });

        setReport(result);
    } catch (e) {
        setReport("生成报告时出错，请重试。");
    } finally {
        setLoadingReport(false);
    }
  };

  const pieData = Object.entries(dashboardStats.categoryBreakdown)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  const getTrendIcon = (current: number, previous: number) => {
      if (!previous) return null;
      const diff = current - previous;
      if (diff === 0) return null;

      const isIncrease = diff > 0;
      
      // Increase (Red), Decrease (Green) - but slightly muted for this theme
      const bgColor = isIncrease ? 'bg-[#BC4749]' : 'bg-[#2A9D8F]';
      // Use ArrowUpRight/ArrowDownRight for the "folded" (bent) look
      const Icon = isIncrease ? ArrowUpRight : ArrowDownRight;

      return (
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${bgColor}`}>
              <Icon size={10} strokeWidth={3} />
          </div>
      );
  };

  // Predefined Palette - Matching the new aesthetic
  const PRESET_COLORS = [
      '#1C1917', // Warm Black
      '#264653', // Charcoal
      '#2A9D8F', // Persian Green
      '#BC4749', // Muted Red
      '#D4A373', // Buff
      '#6D597A', // English Violet
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#F2F0E9] flex flex-col relative shadow-2xl overflow-hidden font-sans">
      
      {/* Top Header */}
      <header className="px-8 pt-12 pb-6 flex justify-between items-center shadow-none z-10 sticky top-0 bg-[#F2F0E9]/95 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900" style={{ color: themeColor }}>这日子还过吗</h1>
            <button 
                onClick={() => setShowColorPicker(true)}
                className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
                title="Change Theme"
            >
                <Palette size={16} style={{ color: themeColor, opacity: 0.8 }} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-medium">Rational • Long-term</p>
        </div>
        
        {/* Month Selector - Pill Shape */}
        <div className="relative group">
             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-black/5 group-hover:border-black/10 transition-colors">
                <span className="text-sm font-bold text-gray-800 font-serif">
                    {selectedDate.getFullYear()}.{String(selectedDate.getMonth() + 1).padStart(2, '0')}
                </span>
                <ChevronDown size={14} className="text-gray-400"/>
             </div>
             <input 
                type="month" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleDateChange}
                value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`}
             />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-36 px-6">
        
        {/* View Switcher - Segmented Control Style */}
        <div className="flex p-1.5 gap-2 bg-gray-200/50 rounded-full mb-6">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2.5 rounded-full flex items-center justify-center gap-2 text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            style={activeTab === 'dashboard' ? { backgroundColor: themeColor } : {}}
          >
            <Wallet size={16} />
            月度概览
          </button>
          <button 
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-2.5 rounded-full flex items-center justify-center gap-2 text-sm font-bold transition-all ${activeTab === 'report' ? 'text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            style={activeTab === 'report' ? { backgroundColor: themeColor } : {}}
          >
            <Sparkles size={16} />
            AI 分析师
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            
            {/* Net Asset Card - Travel Ticket Style */}
            <div 
                className="p-6 rounded-[32px] shadow-lg text-white relative overflow-hidden group" 
                style={{ backgroundColor: themeColor }}
            >
                  {/* Texture/Pattern overlay */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                  <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-xs font-bold tracking-widest text-white/70 uppercase">Total Saving</span>
                            <div className="text-4xl font-serif font-medium mt-1">
                                {dashboardStats.savings >= 0 ? '+' : ''}{dashboardStats.savings.toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                            <TrendingUp size={24} className="text-white" />
                        </div>
                    </div>

                    <div className="flex gap-8 border-t border-white/20 pt-4">
                        <div>
                            <div className="text-[10px] text-white/70 uppercase tracking-wider mb-1">Savings Rate</div>
                            <div className="font-serif text-xl">{(dashboardStats.savingsRate * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-white/70 uppercase tracking-wider mb-1">Invest Rate</div>
                            <div className="font-serif text-xl">{(dashboardStats.investmentRate * 100).toFixed(0)}%</div>
                        </div>
                    </div>
                  </div>
            </div>

            {/* Income/Expense Cards */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#FDFCF8] p-5 rounded-[28px] shadow-sm">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Income</span>
                  <div className="text-2xl font-serif text-gray-800 mt-2 flex items-center gap-1">
                     <span className="text-[#2A9D8F] text-sm bg-[#2A9D8F]/10 p-1 rounded-full"><ArrowUp size={12}/></span>
                     {dashboardStats.totalIncome.toFixed(0)}
                  </div>
               </div>
               <div className="bg-[#FDFCF8] p-5 rounded-[28px] shadow-sm">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Expense</span>
                  <div className="text-2xl font-serif text-gray-800 mt-2 flex items-center gap-1">
                     <span className="text-[#BC4749] text-sm bg-[#BC4749]/10 p-1 rounded-full"><ArrowDown size={12}/></span>
                     {dashboardStats.totalExpense.toFixed(0)}
                  </div>
               </div>
            </div>

            {/* Chart Section */}
            {dashboardStats.totalExpense > 0 && (
              <div className="bg-[#FDFCF8] p-6 rounded-[32px] shadow-sm">
                <h3 className="text-lg font-serif font-bold text-gray-800 mb-6 flex items-center gap-2">
                   消费结构
                </h3>
                <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                        <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                        >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={MACRO_COLORS[entry.name] || '#ccc'} />
                        ))}
                        </Pie>
                        <Tooltip />
                    </RechartsPie>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Total</div>
                            <div className="font-serif font-bold text-gray-800 text-xl">{dashboardStats.totalExpense.toFixed(0)}</div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex flex-wrap gap-2 justify-center">
                    {pieData.map((d) => {
                        const currentAmount = dashboardStats.categoryBreakdown[d.name];
                        const prevAmount = prevDashboardStats.categoryBreakdown[d.name] || 0;
                        return (
                          <div key={d.name} className="flex items-center gap-2 text-xs text-gray-600 bg-[#F2F0E9] px-3 py-1.5 rounded-full border border-black/5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MACRO_COLORS[d.name]}}></div>
                              <span className="font-medium">{d.name}</span>
                              <div className="flex items-center gap-1 pl-1 border-l border-gray-300 ml-1">
                                <span className="font-bold">{(d.value / dashboardStats.totalExpense * 100).toFixed(0)}%</span>
                                {getTrendIcon(currentAmount, prevAmount)}
                              </div>
                          </div>
                        );
                    })}
                </div>
              </div>
            )}

            {/* Recent Transactions List - Clean Card Style with Swipe to Delete */}
            <div className="bg-[#FDFCF8] rounded-[32px] shadow-sm overflow-hidden pb-4 min-h-[200px]">
                <div className="p-6 border-b border-gray-100/50 flex justify-between items-center">
                    <h3 className="font-serif font-bold text-lg text-gray-800">近期账单</h3>
                    <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-md">Latest</span>
                </div>
                <div className="flex flex-col">
                    {displayTransactions.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                                <FileText size={20}/>
                            </div>
                            本月暂无记录
                        </div>
                    ) : (
                        displayTransactions.map((t, idx) => {
                            const category = categories.find(c => c.id === t.categoryId);
                            let trendIcon = null;
                            if (t.type === TransactionType.EXPENSE) {
                                const currentCatTotal = dashboardStats.specificCategoryBreakdown[t.categoryId] || 0;
                                const prevCatTotal = prevDashboardStats.specificCategoryBreakdown[t.categoryId] || 0;
                                trendIcon = getTrendIcon(currentCatTotal, prevCatTotal);
                            }

                            return (
                                <SwipeableTransactionItem
                                    key={t.id}
                                    transaction={t}
                                    category={category}
                                    trendIcon={trendIcon}
                                    onDelete={handleDeleteTransaction}
                                    isOpen={openSwipeId === t.id}
                                    onSwipeOpen={(id) => setOpenSwipeId(id)}
                                    onSwipeClose={() => setOpenSwipeId(null)}
                                    isLast={idx === displayTransactions.length - 1}
                                />
                            );
                        })
                    )}
                </div>
            </div>

          </div>
        ) : (
          <div className="pb-12">
            
            {/* AI Control Panel */}
            <div className="bg-[#FDFCF8] rounded-[32px] p-6 shadow-sm mb-6 space-y-5">
               
               {/* Report Type Toggle */}
               <div className="flex bg-[#F2F0E9] p-1.5 rounded-2xl">
                   <button 
                      onClick={() => setReportType('monthly')}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${reportType === 'monthly' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
                      style={reportType === 'monthly' ? { color: themeColor } : {}}
                   >
                     月度报告
                   </button>
                   <button 
                      onClick={() => setReportType('yearly')}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${reportType === 'yearly' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
                      style={reportType === 'yearly' ? { color: themeColor } : {}}
                   >
                     年度报告
                   </button>
               </div>

               {/* Configuration Inputs */}
               <div className="space-y-4">
                   {reportType === 'monthly' ? (
                       <div className="flex items-center gap-3 text-sm text-gray-600 bg-white px-4 py-4 rounded-2xl border border-gray-100">
                          <div className="bg-gray-100 p-2 rounded-full"><Calendar size={16} /></div>
                          <div>
                              <span className="block text-xs text-gray-400 uppercase tracking-wider">Target Period</span>
                              <span className="font-serif font-bold text-gray-900 text-lg">{selectedDate.getFullYear()}.{String(selectedDate.getMonth() + 1).padStart(2, '0')}</span>
                          </div>
                       </div>
                   ) : (
                       <div className="flex items-center gap-3 text-sm text-gray-600 bg-white px-4 py-4 rounded-2xl border border-gray-100 relative">
                          <div className="bg-gray-100 p-2 rounded-full"><CalendarDays size={16} /></div>
                          <div className="flex-1">
                              <span className="block text-xs text-gray-400 uppercase tracking-wider">Target Year</span>
                              <select 
                                value={reportYear} 
                                onChange={(e) => setReportYear(Number(e.target.value))}
                                className="bg-transparent font-serif font-bold text-gray-900 text-lg outline-none appearance-none w-full relative z-10"
                              >
                                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                          </div>
                          <ChevronDown size={14} className="absolute right-4 text-gray-400" />
                       </div>
                   )}

                   <div className="relative">
                       <textarea
                          value={userContext}
                          onChange={(e) => setUserContext(e.target.value)}
                          placeholder="Tell me about any big changes this month (e.g., travel, medical bills)..."
                          className="w-full bg-white rounded-2xl py-4 px-4 text-sm outline-none focus:ring-2 border border-gray-100 min-h-[100px] placeholder:text-gray-300 resize-none"
                          style={{ '--tw-ring-color': hexToRgba(themeColor, 0.2) } as React.CSSProperties}
                       />
                   </div>
               </div>

               {/* Action Button */}
                {apiKeyMissing ? (
                    <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-3 border border-amber-100">
                        <AlertCircle className="shrink-0 text-amber-500" size={20} />
                        <div className="text-xs text-amber-800 leading-relaxed">
                            <span className="font-bold block text-sm mb-1">API Key Missing</span>
                            Please configure your Google Gemini API Key to unlock the AI Analyst.
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={handleGenerateReport}
                        disabled={loadingReport}
                        className="w-full text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center gap-3 shadow-xl"
                        style={{ backgroundColor: themeColor }}
                    >
                        {loadingReport ? (
                            <>
                                <span className="animate-spin text-xl">◌</span> Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} /> 生成诊断报告
                            </>
                        )}
                    </button>
                )}

            </div>

            {/* Report Output */}
            {report && (
                <div className="bg-[#FDFCF8] rounded-[32px] p-8 shadow-sm markdown-body space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                     <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                        <div className="p-3 rounded-full" style={{ backgroundColor: hexToRgba(themeColor, 0.1), color: themeColor }}>
                           <TrendingUp size={24} />
                        </div>
                        <h3 className="font-serif font-bold text-gray-800 text-2xl">Analysis Report</h3>
                     </div>
                     <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600 leading-8 tracking-wide">
                        {report}
                     </pre>
                     <div className="pt-6 border-t border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Powered by Gemini AI</p>
                     </div>
                </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button (Sticky Bottom) */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-50">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="pointer-events-auto text-white w-18 h-18 p-5 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
            style={{ backgroundColor: themeColor, boxShadow: `0 15px 35px -5px ${hexToRgba(themeColor, 0.5)}` }}
          >
            <Plus size={36} />
          </button>
      </div>

      <AddTransaction 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        currentMonthDate={selectedDate}
        themeColor={themeColor}
      />
      
      {/* Color Picker Modal */}
      {showColorPicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#F2F0E9]/80 backdrop-blur-md" onClick={() => setShowColorPicker(false)}>
              <div className="bg-[#FDFCF8] p-8 rounded-[40px] shadow-2xl w-80 space-y-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center">
                      <h3 className="font-serif font-bold text-gray-800 text-xl">App Theme</h3>
                      <button onClick={() => setShowColorPicker(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                      {PRESET_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => handleThemeChange(color)}
                            className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-sm border border-gray-100"
                            style={{ backgroundColor: color }}
                          >
                              {themeColor.toLowerCase() === color.toLowerCase() && <Check size={24} className="text-white" />}
                          </button>
                      ))}
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                      <div className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">Custom Hex</div>
                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                          <input 
                            type="color" 
                            value={themeColor}
                            onChange={(e) => setThemeColor(e.target.value)}
                            className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-none p-0"
                          />
                          <span className="font-mono text-sm text-gray-600 font-medium">{themeColor}</span>
                          <button 
                            onClick={() => handleThemeChange(themeColor)}
                            className="ml-auto px-5 py-2 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
                            style={{ backgroundColor: themeColor }}
                          >
                            Apply
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default App;