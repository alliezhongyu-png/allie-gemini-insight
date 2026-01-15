
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Edit3, Plus, ArrowLeft, Check, Trash2 } from 'lucide-react';
import { CategoryItem, Transaction, TransactionType, MacroCategory } from '../types';
import { AVAILABLE_ICONS, getIconComponent } from '../constants';
import NumericKeypad from './NumericKeypad';

interface AddTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (t: Transaction) => void;
  categories: CategoryItem[];
  onAddCategory: (cat: CategoryItem) => void;
  onDeleteCategory: (id: string) => void;
  currentMonthDate: Date;
  themeColor: string;
}

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

const AddTransaction: React.FC<AddTransactionProps> = ({ 
  isOpen, onClose, onSave, categories, onAddCategory, onDeleteCategory, currentMonthDate, themeColor
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [note, setNote] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isKeyboardMinimized, setIsKeyboardMinimized] = useState(false);
  
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(AVAILABLE_ICONS[0]);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setAmountStr('');
      setNote('');
      setIsCreatingCategory(false);
      setIsKeyboardMinimized(false);
      setNewCatName('');
      setEditingCategoryId(null);
      
      const now = new Date();
      const isSameMonth = now.getFullYear() === currentMonthDate.getFullYear() && 
                          now.getMonth() === currentMonthDate.getMonth();
      let initialDate = isSameMonth ? now : new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1, 12);
      
      const yyyy = initialDate.getFullYear();
      const mm = String(initialDate.getMonth() + 1).padStart(2, '0');
      const dd = String(initialDate.getDate()).padStart(2, '0');
      setDateStr(`${yyyy}-${mm}-${dd}`);
      
      const first = categories.find(c => c.type === selectedType);
      if (first) {
        setSelectedCategory(first);
        setCustomCategoryName(first.name);
      }
    }
  }, [isOpen, selectedType, categories, currentMonthDate]); 

  if (!isOpen) return null;

  const handleCategorySelect = (cat: CategoryItem) => {
    if (editingCategoryId) {
        setEditingCategoryId(null);
        return;
    }
    setSelectedCategory(cat);
    setCustomCategoryName(cat.name);
    // 自动滑动收起键盘，露出更多分类区域
    setIsKeyboardMinimized(true);
  };

  const handleKeyPress = (key: string) => {
    if (key === '.' && amountStr.includes('.')) return;
    setAmountStr(prev => prev + key);
    // 输入数字时自动唤起键盘
    if (isKeyboardMinimized) setIsKeyboardMinimized(false);
  };

  const handleDeleteDigit = () => setAmountStr(prev => prev.slice(0, -1));

  const handleSubmit = () => {
    if (!selectedCategory) return alert("请选择分类");
    
    let finalAmount = 0;
    try {
      finalAmount = eval(amountStr.replace(/[^-()\d/*+.]/g, '')); 
    } catch (e) {
      finalAmount = parseFloat(amountStr) || 0;
    }

    if (finalAmount <= 0) return;

    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); 

    onSave({
      id: Date.now().toString(),
      amount: Number(finalAmount.toFixed(2)),
      type: selectedType,
      categoryId: selectedCategory.id,
      categoryName: customCategoryName || selectedCategory.name, 
      macroCategory: selectedCategory.macroCategory,
      note,
      date: dateObj.getTime(),
    });
    onClose();
  };

  const startPress = (cat: CategoryItem) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
       isLongPressRef.current = true;
       setEditingCategoryId(cat.id);
       if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const cancelPress = () => {
    if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
    }
  };

  const filteredCategories = categories.filter(c => c.type === selectedType);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F2F0E9] h-full font-sans overflow-hidden">
      
      <div className="flex justify-between items-center px-6 py-5 bg-[#F2F0E9] relative z-10">
        {isCreatingCategory ? (
            <button onClick={() => setIsCreatingCategory(false)} className="flex items-center text-gray-800 gap-2 font-bold hover:bg-black/5 p-2 rounded-xl transition-colors">
                <ArrowLeft size={20} /> <span className="text-sm">返回</span>
            </button>
        ) : (
            <button onClick={onClose} className="hover:bg-black/5 p-2 rounded-full transition-colors"><X size={24} className="text-gray-800" /></button>
        )}
        
        {!isCreatingCategory && (
            <div className="flex bg-[#E5E2D9] rounded-2xl p-1.5">
            {[TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.TRANSFER].map(type => (
                <button
                key={type}
                onClick={() => { setSelectedType(type); setSelectedCategory(null); setEditingCategoryId(null); setIsKeyboardMinimized(false); }}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${selectedType === type ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                {type === TransactionType.EXPENSE ? '支出' : type === TransactionType.INCOME ? '收入' : '转账'}
                </button>
            ))}
            </div>
        )}
        {isCreatingCategory && <div className="font-serif font-bold text-gray-800 text-lg">新建分类</div>}
        <div className="w-6"></div> 
      </div>

      {isCreatingCategory ? (
        <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-4 bg-[#FDFCF8] p-5 rounded-[24px] shadow-sm">
                <div className="p-4 rounded-2xl" style={{ backgroundColor: hexToRgba(themeColor, 0.1), color: themeColor }}>
                    {getIconComponent(newCatIcon, 28)}
                </div>
                <input 
                    autoFocus
                    type="text" 
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="分类名称"
                    className="flex-1 text-xl font-serif font-bold outline-none text-gray-800 placeholder:text-gray-300 bg-transparent"
                />
            </div>
            <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">选择图标</div>
                <div className="grid grid-cols-6 gap-3">
                    {AVAILABLE_ICONS.map(icon => (
                        <button
                           key={icon}
                           onClick={() => setNewCatIcon(icon)}
                           className={`aspect-square flex items-center justify-center rounded-2xl transition-all ${newCatIcon === icon ? 'text-white shadow-lg scale-105' : 'bg-white text-gray-400 hover:bg-[#E5E2D9]'}`}
                           style={newCatIcon === icon ? { backgroundColor: themeColor } : {}}
                        >
                            {getIconComponent(icon, 20)}
                        </button>
                    ))}
                </div>
            </div>
            <button 
                onClick={() => {
                    if (!newCatName.trim()) return alert('请输入名称');
                    onAddCategory({
                        id: Date.now().toString(),
                        name: newCatName.trim(),
                        icon: newCatIcon,
                        type: selectedType,
                        macroCategory: selectedType === TransactionType.INCOME ? MacroCategory.INCOME : 
                                       selectedType === TransactionType.TRANSFER ? MacroCategory.TRANSFER : MacroCategory.NECESSARY 
                    });
                    setIsCreatingCategory(false);
                }}
                className="w-full py-4 text-white rounded-2xl font-bold text-lg mt-auto shadow-xl tracking-wide uppercase"
                style={{ backgroundColor: themeColor }}
            >
                保存分类
            </button>
        </div>
      ) : (
        <>
            {/* 分类网格区域 */}
            <div 
                className="flex-1 overflow-y-auto p-6 no-scrollbar"
                onClick={() => { setEditingCategoryId(null); setIsKeyboardMinimized(true); }}
            >
                <div className="grid grid-cols-4 gap-4 pb-12">
                    {filteredCategories.map(cat => {
                        const isEditing = editingCategoryId === cat.id;
                        return (
                            <div
                                key={cat.id}
                                className="relative group select-none"
                                onMouseDown={() => startPress(cat)}
                                onMouseUp={cancelPress}
                                onMouseLeave={cancelPress}
                                onTouchStart={() => startPress(cat)}
                                onTouchEnd={cancelPress}
                                onTouchMove={cancelPress} 
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); if (!isLongPressRef.current) handleCategorySelect(cat); }}
                                    className={`w-full flex flex-col items-center gap-2 p-3 rounded-[20px] transition-all relative ${selectedCategory?.id === cat.id ? 'bg-white ring-2 ring-offset-2 ring-offset-[#F2F0E9] shadow-md' : 'hover:bg-white/60'} ${isEditing ? 'animate-shake' : ''}`}
                                    style={selectedCategory?.id === cat.id ? { borderColor: themeColor, '--tw-ring-color': themeColor } as any : {}}
                                >
                                    <div 
                                        className={`p-3.5 rounded-[16px] transition-transform active:scale-95 ${selectedCategory?.id === cat.id ? 'text-white' : 'bg-[#FDFCF8] text-gray-400 shadow-sm'}`}
                                        style={selectedCategory?.id === cat.id ? { backgroundColor: themeColor } : {}}
                                    >
                                        {getIconComponent(cat.icon, 22)}
                                    </div>
                                    <span className={`text-[10px] text-center font-bold truncate w-full ${selectedCategory?.id === cat.id ? 'text-gray-900' : 'text-gray-500'}`}>{cat.name}</span>
                                    {isEditing && (
                                        <div className="absolute -top-2 -right-2 z-20 animate-in zoom-in duration-200" onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); setEditingCategoryId(null); }}>
                                            <div className="bg-red-500 text-white rounded-full p-1.5 shadow-md border-2 border-[#F2F0E9]"><X size={10} strokeWidth={3} /></div>
                                        </div>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                    <button onClick={() => setIsCreatingCategory(true)} className="flex flex-col items-center gap-2 p-3 rounded-[20px] hover:bg-white/60 transition-colors">
                        <div className="p-3.5 rounded-[16px] bg-transparent text-gray-400 border-2 border-dashed border-gray-300"><Plus size={22} /></div>
                        <span className="text-[10px] text-center font-bold text-gray-400">添加</span>
                    </button>
                </div>
            </div>

            {/* 绑定在键盘上的编辑栏 */}
            <NumericKeypad 
                onKeyPress={handleKeyPress}
                onDelete={handleDeleteDigit}
                onSubmit={handleSubmit}
                value={amountStr}
                isMinimized={isKeyboardMinimized}
                onToggle={() => setIsKeyboardMinimized(!isKeyboardMinimized)}
            >
                <div className="bg-[#FDFCF8] rounded-[28px] p-2 shadow-sm space-y-2 border border-black/5">
                    {selectedCategory && (
                    <div className="flex items-center gap-3 bg-gray-50/50 px-4 py-3 rounded-2xl border border-gray-100">
                        <div style={{ color: themeColor }}>{getIconComponent(selectedCategory.icon, 18)}</div>
                        <input type="text" value={customCategoryName} onChange={(e) => setCustomCategoryName(e.target.value)} className="bg-transparent text-sm font-bold w-full outline-none text-gray-800" placeholder="分类名称" />
                    </div>
                    )}
                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-3 bg-gray-50/50 px-4 py-3 rounded-2xl border border-gray-100">
                            <Edit3 size={16} className="text-gray-400" />
                            <input type="text" placeholder="备注..." value={note} onChange={(e) => setNote(e.target.value)} className="bg-transparent text-xs font-medium w-full outline-none placeholder:text-gray-300" />
                        </div>
                        <div className="relative flex items-center gap-2 bg-gray-50/50 px-4 py-3 rounded-2xl border border-gray-100 min-w-[120px]">
                            <Calendar size={16} className="text-gray-400 pointer-events-none" />
                            <input type="date" required value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="bg-transparent text-[10px] font-bold text-gray-700 outline-none w-full appearance-none" />
                        </div>
                    </div>
                </div>
            </NumericKeypad>
        </>
      )}
    </div>
  );
};

export default AddTransaction;
