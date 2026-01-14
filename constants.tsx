import React from 'react';
import { CategoryItem, MacroCategory, TransactionType } from './types';
import { 
  Utensils, Bus, ShoppingBag, Gamepad2, Stethoscope, 
  GraduationCap, Home, Briefcase, TrendingUp, HeartHandshake,
  Wallet, Banknote, Car, Plane, Gift, Smartphone, Coffee, Dumbbell, PawPrint, Music,
  Zap, Droplet, Wifi, ShoppingCart, Film, Book, Wrench, Hammer, Baby, Beer, 
  Scissors, Shirt, Watch, Smile, Star, Heart, Sun, Moon, Cloud, Umbrella, Key,
  Laptop, Camera, Bike, Bed, Sofa, Bath
} from 'lucide-react';

// Icons available for user selection when creating a new category
export const AVAILABLE_ICONS = [
  'Utensils', 'Coffee', 'Beer', 'ShoppingBag', 'ShoppingCart', 'Shirt', 'Watch', 'Gift', 
  'Bus', 'Car', 'Plane', 'Bike', 'Home', 'Bed', 'Sofa', 'Bath', 'Zap', 'Droplet', 'Wifi',
  'Gamepad2', 'Film', 'Music', 'Camera', 'Dumbbell', 'PawPrint', 'Baby', 'Smile', 'Heart',
  'Stethoscope', 'GraduationCap', 'Book', 'Briefcase', 'Laptop', 'Smartphone', 'Wrench', 'Hammer',
  'TrendingUp', 'Banknote', 'Wallet', 'Key', 'Sun', 'Moon', 'Star', 'Cloud', 'Umbrella'
];

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  // 支出 (Expense)
  { id: 'food', name: '餐饮', icon: 'Utensils', type: TransactionType.EXPENSE, macroCategory: MacroCategory.DAILY_FOOD },
  { id: 'transport', name: '交通', icon: 'Bus', type: TransactionType.EXPENSE, macroCategory: MacroCategory.NECESSARY },
  { id: 'shopping', name: '购物', icon: 'ShoppingBag', type: TransactionType.EXPENSE, macroCategory: MacroCategory.ENJOYMENT },
  { id: 'entertainment', name: '娱乐', icon: 'Gamepad2', type: TransactionType.EXPENSE, macroCategory: MacroCategory.ENJOYMENT },
  { id: 'medical', name: '医疗', icon: 'Stethoscope', type: TransactionType.EXPENSE, macroCategory: MacroCategory.SURVIVAL },
  { id: 'learning', name: '学习', icon: 'GraduationCap', type: TransactionType.EXPENSE, macroCategory: MacroCategory.INVESTMENT },
  { id: 'rent', name: '房租', icon: 'Home', type: TransactionType.EXPENSE, macroCategory: MacroCategory.SURVIVAL },
  { id: 'invest_product', name: '理财', icon: 'TrendingUp', type: TransactionType.EXPENSE, macroCategory: MacroCategory.INVESTMENT },
  
  // 收入 (Income)
  { id: 'salary', name: '工资', icon: 'Briefcase', type: TransactionType.INCOME, macroCategory: MacroCategory.INCOME },
  { id: 'bonus', name: '奖金', icon: 'Banknote', type: TransactionType.INCOME, macroCategory: MacroCategory.INCOME },
  { id: 'invest_return', name: '投资回报', icon: 'TrendingUp', type: TransactionType.INCOME, macroCategory: MacroCategory.INCOME },
  { id: 'part_time', name: '兼职', icon: 'Wallet', type: TransactionType.INCOME, macroCategory: MacroCategory.INCOME },

  // 转账 (Transfer)
  { id: 'transfer', name: '转账', icon: 'HeartHandshake', type: TransactionType.TRANSFER, macroCategory: MacroCategory.TRANSFER },
];

export const getIconComponent = (iconName: string, size: number = 20, color?: string) => {
  const props = { size, color };
  // Default fallback
  const Icon = Wallet; 

  switch (iconName) {
    case 'Utensils': return <Utensils {...props} />;
    case 'Bus': return <Bus {...props} />;
    case 'ShoppingBag': return <ShoppingBag {...props} />;
    case 'Gamepad2': return <Gamepad2 {...props} />;
    case 'Stethoscope': return <Stethoscope {...props} />;
    case 'GraduationCap': return <GraduationCap {...props} />;
    case 'Home': return <Home {...props} />;
    case 'Briefcase': return <Briefcase {...props} />;
    case 'TrendingUp': return <TrendingUp {...props} />;
    case 'HeartHandshake': return <HeartHandshake {...props} />;
    case 'Banknote': return <Banknote {...props} />;
    case 'Car': return <Car {...props} />;
    case 'Plane': return <Plane {...props} />;
    case 'Gift': return <Gift {...props} />;
    case 'Smartphone': return <Smartphone {...props} />;
    case 'Coffee': return <Coffee {...props} />;
    case 'Dumbbell': return <Dumbbell {...props} />;
    case 'PawPrint': return <PawPrint {...props} />;
    case 'Zap': return <Zap {...props} />;
    case 'Droplet': return <Droplet {...props} />;
    case 'Wifi': return <Wifi {...props} />;
    case 'ShoppingCart': return <ShoppingCart {...props} />;
    case 'Film': return <Film {...props} />;
    case 'Book': return <Book {...props} />;
    case 'Wrench': return <Wrench {...props} />;
    case 'Hammer': return <Hammer {...props} />;
    case 'Baby': return <Baby {...props} />;
    case 'Beer': return <Beer {...props} />;
    case 'Scissors': return <Scissors {...props} />;
    case 'Shirt': return <Shirt {...props} />;
    case 'Watch': return <Watch {...props} />;
    case 'Smile': return <Smile {...props} />;
    case 'Star': return <Star {...props} />;
    case 'Heart': return <Heart {...props} />;
    case 'Sun': return <Sun {...props} />;
    case 'Moon': return <Moon {...props} />;
    case 'Cloud': return <Cloud {...props} />;
    case 'Umbrella': return <Umbrella {...props} />;
    case 'Key': return <Key {...props} />;
    case 'Laptop': return <Laptop {...props} />;
    case 'Camera': return <Camera {...props} />;
    case 'Bike': return <Bike {...props} />;
    case 'Bed': return <Bed {...props} />;
    case 'Sofa': return <Sofa {...props} />;
    case 'Bath': return <Bath {...props} />;
    case 'Music': return <Music {...props} />;
    default: return <Icon {...props} />;
  }
};
