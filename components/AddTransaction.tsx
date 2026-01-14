import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Edit3, Plus, ArrowLeft, Check, Trash2, MinusCircle } from 'lucide-react';
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

// Helper to create transparent colors
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
  // Main Flow State
  const [amountStr, setAmountStr] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [note, setNote] = useState('');
  const [dateStr, setDateStr] = useState('');
  
  // Add Category Flow State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(AVAILABLE_ICONS[0]);

  // Interaction State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmountStr('');
      setNote('');
      setIsCreatingCategory(false);
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
      } else {
        setSelectedCategory(null);
        setCustomCategoryName('');
      }
    }
  }, [isOpen, selectedType, categories, currentMonthDate]); 

  if (!isOpen) return null;

  // --- Handlers ---

  const handleCategorySelect = (cat: CategoryItem) => {
    if (editingCategoryId) {
        setEditingCategoryId(null); // Click anywhere cancels edit mode
        return;
    }
    setSelectedCategory(cat);
    setCustomCategoryName(cat.name);
  };

  const handleKeyPress = (key: string) => {
    if (key === '.' && amountStr.includes('.')) return;
    setAmountStr(prev => prev + key);
  };

  const handleDeleteDigit = () => {
    setAmountStr(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (!selectedCategory) {
      alert("Please select a category");
      return;
    }
    
    let finalAmount = 0;
    try {
      // eslint-disable-next-line no-eval
      finalAmount = eval(amountStr.replace(/[^-()\d/*+.]/g, '')); 
    } catch (e) {
      finalAmount = parseFloat(amountStr) || 0;
    }

    if (finalAmount <= 0) return;

    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); 

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount: Number(finalAmount.toFixed(2)),
      type: selectedType,
      categoryId: selectedCategory.id,
      categoryName: customCategoryName || selectedCategory.name, 
      macroCategory: selectedCategory.macroCategory,
      note,
      date: dateObj.getTime(),
    };

    onSave(newTransaction);
    onClose();
  };

  // --- Long Press Logic ---
  const startPress = (cat: CategoryItem) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
       isLongPressRef.current = true;
       setEditingCategoryId(cat.id); // Trigger Edit Mode
       // Haptic feedback if available
       if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const cancelPress = () => {
    if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
    }
  };

  const handleCategoryClick = (cat: CategoryItem, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent bubbling
      if (isLongPressRef.current) {
          // Long press just happened, swallow the click
          return;
      }
      handleCategorySelect(cat);
  };

  const confirmDeleteCategory = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onDeleteCategory(id);
      setEditingCategoryId(null);
      if (selectedCategory?.id === id) {
          setSelectedCategory(null);
          setCustomCategoryName('');
      }
  };

  const handleSaveNewCategory = () => {
      if (!newCatName.trim()) {
          alert('Please enter a name');
          return;
      }

      const newCat: CategoryItem = {
          id: Date.now().toString(),
          name: newCatName.trim(),
          icon: newCatIcon,
          type: selectedType,
          macroCategory: selectedType === TransactionType.INCOME ? MacroCategory.INCOME : 
                         selectedType === TransactionType.TRANSFER ? MacroCategory.TRANSFER : 
                         MacroCategory.NECESSARY 
      };

      onAddCategory(newCat);
      setIsCreatingCategory(false);
      setSelectedCategory(newCat);
      setCustomCategoryName(newCat.name);
  };

  const filteredCategories = categories.filter(c => c.type === selectedType);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F2F0E9] h-full font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-5 bg-[#F2F0E9] relative z-10">
        {isCreatingCategory ? (
            <button onClick={() => setIsCreatingCategory(false)} className="flex items-center text-gray-800 gap-2 font-bold hover:bg-black/5 p-2 rounded-xl transition-colors">
                <ArrowLeft size={20} /> <span className="text-sm">Back</span>
            </button>
        ) : (
            <button onClick={onClose} className="hover:bg-black/5 p-2 rounded-full transition-colors"><X size={24} className="text-gray-800" /></button>
        )}
        
        {/* Type Switcher */}
        {!isCreatingCategory && (
            <div className="flex bg-[#E5E2D9] rounded-2xl p-1.5">
            {[TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.TRANSFER].map(type => (
                <button
                key={type}
                onClick={() => { setSelectedType(type); setSelectedCategory(null); setEditingCategoryId(null); }}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${selectedType === type ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                {type === TransactionType.EXPENSE ? '支出' : type === TransactionType.INCOME ? '收入' : '转账'}
                </button>
            ))}
            </div>
        )}
        {isCreatingCategory && <div className="font-serif font-bold text-gray-800 text-lg">New Category</div>}
        
        <div className="w-6"></div> 
      </div>

      {/* BODY CONTENT */}
      
      {isCreatingCategory ? (
        // === CREATE CATEGORY VIEW ===
        <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
            
            <div className="flex items-center gap-4 bg-[#FDFCF8] p-5 rounded-[24px] shadow-sm">
                <div className="p-4 rounded-2xl" style={{ backgroundColor: hexToRgba(themeColor, 0.1), color: themeColor }}>
                    {getIconComponent(newCatIcon, 28)}
                </div>
                <input 
                    autoFocus
                    type="text" 
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Category Name"
                    className="flex-1 text-xl font-serif font-bold outline-none text-gray-800 placeholder:text-gray-300 bg-transparent"
                />
            </div>

            <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Select Icon</div>
                <div className="grid grid-cols-6 gap-3">
                    {AVAILABLE_ICONS.map(icon => (
                        <button
                           key={icon}
                           onClick={() => setNewCatIcon(icon)}
                           className={`aspect-square flex items-center justify-center rounded-2xl transition-all ${newCatIcon === icon ? 'text-white shadow-lg scale-105' : 'bg-white text-gray-400 hover:bg-[#E5E2D9]'}`}
                           style={newCatIcon === icon ? { backgroundColor: themeColor, boxShadow: `0 8px 20px -5px ${hexToRgba(themeColor, 0.4)}` } : {}}
                        >
                            {getIconComponent(icon, 20)}
                        </button>
                    ))}
                </div>
            </div>

            <button 
                onClick={handleSaveNewCategory}
                className="w-full py-4 text-white rounded-2xl font-bold text-lg mt-auto shadow-xl tracking-wide uppercase"
                style={{ backgroundColor: themeColor }}
            >
                Save Category
            </button>
        </div>
      ) : (
        // === MAIN TRANSACTION VIEW ===
        <>
            {/* Category Grid */}
            <div 
                className="flex-1 overflow-y-auto p-6"
                onClick={() => setEditingCategoryId(null)} // Click background to exit edit mode
            >
                <div className="grid grid-cols-4 gap-4 pb-20">
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
                                    onClick={(e) => handleCategoryClick(cat, e)}
                                    className={`w-full flex flex-col items-center gap-2 p-3 rounded-[20px] transition-all relative ${selectedCategory?.id === cat.id ? 'bg-white ring-2 ring-offset-2 ring-offset-[#F2F0E9] shadow-md' : 'hover:bg-white/60'} ${isEditing ? 'animate-shake' : ''}`}
                                    style={selectedCategory?.id === cat.id ? { borderColor: themeColor, '--tw-ring-color': themeColor } as React.CSSProperties : {}}
                                >
                                    <div 
                                        className={`p-3.5 rounded-[16px] transition-transform active:scale-95 ${selectedCategory?.id === cat.id ? 'text-white' : 'bg-[#FDFCF8] text-gray-400 shadow-sm'}`}
                                        style={selectedCategory?.id === cat.id ? { backgroundColor: themeColor } : {}}
                                    >
                                        {getIconComponent(cat.icon, 22)}
                                    </div>
                                    <span className={`text-xs text-center font-bold truncate w-full ${selectedCategory?.id === cat.id ? 'text-gray-900' : 'text-gray-500'}`}>{cat.name}</span>
                                    
                                    {/* Delete Badge (Pop-up Animation) - UPDATED to X */}
                                    {isEditing && (
                                        <div 
                                            className="absolute -top-2 -right-2 z-20 animate-in zoom-in duration-200"
                                            onClick={(e) => confirmDeleteCategory(e, cat.id)}
                                        >
                                            <div className="bg-red-500 text-white rounded-full p-1.5 shadow-md border-2 border-[#F2F0E9]">
                                                <X size={14} strokeWidth={3} />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                    
                    {/* Add Category Button */}
                    <button
                        onClick={() => { setIsCreatingCategory(true); setEditingCategoryId(null); }}
                        className="flex flex-col items-center gap-2 p-3 rounded-[20px] hover:bg-white/60 transition-colors"
                    >
                        <div className="p-3.5 rounded-[16px] bg-transparent text-gray-400 border-2 border-dashed border-gray-300">
                            <Plus size={22} />
                        </div>
                        <span className="text-xs text-center font-bold text-gray-400">Add</span>
                    </button>
                </div>
            </div>

            {/* Configuration Area - Floating Card */}
            <div className="px-6 py-4 bg-[#F2F0E9]">
                <div className="bg-[#FDFCF8] rounded-[28px] p-2 shadow-sm space-y-2">
                    {selectedCategory && (
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
                        <div style={{ color: themeColor }}>
                        {getIconComponent(selectedCategory.icon, 20)}
                        </div>
                        <input
                        type="text"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        className="bg-transparent text-sm font-bold w-full outline-none text-gray-800"
                        placeholder="Category Name"
                        />
                    </div>
                    )}

                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
                        <Edit3 size={18} className="text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Add a note..." 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="bg-transparent text-sm font-medium w-full outline-none placeholder:text-gray-400"
                        />
                        </div>
                        
                        <div className="relative flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 min-w-[140px]">
                        <Calendar size={18} className="text-gray-400 pointer-events-none" />
                        <input 
                            type="date"
                            required
                            value={dateStr}
                            onChange={(e) => setDateStr(e.target.value)}
                            className="bg-transparent text-sm font-bold text-gray-700 outline-none w-full appearance-none"
                        />
                        </div>
                    </div>
                </div>
            </div>

            {/* Keypad */}
            <NumericKeypad 
                onKeyPress={handleKeyPress}
                onDelete={handleDeleteDigit}
                onSubmit={handleSubmit}
                value={amountStr}
            />
        </>
      )}
    </div>
  );
};

export default AddTransaction;