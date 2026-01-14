import React from 'react';
import { Delete, Check } from 'lucide-react';

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  value: string;
}

const NumericKeypad: React.FC<KeypadProps> = ({ onKeyPress, onDelete, onSubmit, value }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '+', '-'];

  return (
    <div className="bg-[#FDFCF8] pb-8 pt-4 px-6 rounded-t-[40px] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative z-20">
      <div className="flex justify-between items-center mb-6 px-4">
         <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</span>
         <span className="text-4xl font-serif font-bold text-gray-900 break-all">
           {value || '0.00'}
         </span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="h-16 rounded-[24px] bg-[#F2F0E9] text-2xl font-medium text-gray-700 active:bg-[#E5E2D9] active:scale-95 transition-all shadow-sm border border-black/5"
          >
            {key}
          </button>
        ))}
        
        <button
            onClick={onDelete}
            className="h-16 rounded-[24px] bg-[#F2F0E9] flex items-center justify-center text-gray-500 active:bg-[#E5E2D9] active:scale-95 transition-all shadow-sm border border-black/5"
          >
           <Delete size={26} />
        </button>

        <button
          onClick={onSubmit}
          className="col-span-2 h-16 rounded-[24px] bg-[#1C1917] text-white text-lg font-bold active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg"
        >
          <Check size={24} />
          Done
        </button>
      </div>
    </div>
  );
};

export default NumericKeypad;