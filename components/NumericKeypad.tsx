
import React from 'react';
import { Delete, Check, ChevronUp } from 'lucide-react';

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  value: string;
  isMinimized: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

const NumericKeypad: React.FC<KeypadProps> = ({ 
  onKeyPress, onDelete, onSubmit, value, isMinimized, onToggle, children 
}) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '+', '-'];

  return (
    <div 
      className={`bg-[#FDFCF8] rounded-t-[40px] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.15)] relative z-20 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
        isMinimized ? 'translate-y-[calc(100%-180px)]' : 'translate-y-0'
      }`}
    >
      {/* 绑定的编辑项部分 (Children) */}
      <div className="px-6 pt-4">
        {children}
      </div>

      {/* 金额栏与手柄部分 */}
      <div 
        className="pt-2 pb-4 px-6 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex justify-center mb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex justify-between items-center px-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            {isMinimized && <ChevronUp size={12} className="animate-bounce" />}
            {isMinimized ? 'Swipe up to input' : 'Amount'}
          </span>
          <span className={`font-serif font-bold text-gray-900 break-all transition-all duration-300 ${isMinimized ? 'text-xl' : 'text-4xl'}`}>
            {value || '0.00'}
          </span>
        </div>
      </div>

      {/* 实际按键面板 */}
      <div className={`px-6 pb-8 transition-opacity duration-300 ${isMinimized ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'opacity-100'}`}>
        <div className="grid grid-cols-4 gap-3">
          {keys.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className="h-14 rounded-[20px] bg-[#F2F0E9] text-2xl font-medium text-gray-700 active:bg-[#E5E2D9] active:scale-95 transition-all shadow-sm border border-black/5"
            >
              {key}
            </button>
          ))}
          
          <button
              onClick={onDelete}
              className="h-14 rounded-[20px] bg-[#F2F0E9] flex items-center justify-center text-gray-500 active:bg-[#E5E2D9] active:scale-95 transition-all shadow-sm border border-black/5"
            >
             <Delete size={24} />
          </button>

          <button
            onClick={onSubmit}
            className="col-span-2 h-14 rounded-[20px] bg-[#1C1917] text-white text-lg font-bold active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            <Check size={20} />
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default NumericKeypad;
