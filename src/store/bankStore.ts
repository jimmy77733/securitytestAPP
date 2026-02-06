import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuestionBank } from '@/types';

export interface BankOption {
  id: string;
  name: string;
  value: QuestionBank | string; // 可以是已知的QuestionBank或自定義值
  isCustom: boolean;
  createdAt: string;
}

interface BankState {
  banks: BankOption[];
  
  // Actions
  getBanks: () => BankOption[];
  addBank: (name: string, value: string) => void;
  updateBank: (id: string, name: string) => void;
  deleteBank: (id: string) => void;
  getBankById: (id: string) => BankOption | undefined;
}

// 預設題庫選項
const defaultBanks: BankOption[] = [
  {
    id: 'primary',
    name: '初級題庫',
    value: 'primary',
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'intermediate',
    name: '中級題庫',
    value: 'intermediate',
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
];

export const useBankStore = create<BankState>()(
  persist(
    (set, get) => ({
      banks: defaultBanks,

      getBanks: () => {
        const state = get();
        // 如果沒有banks，初始化為預設值
        if (state.banks.length === 0) {
          set({ banks: defaultBanks });
          return defaultBanks;
        }
        return state.banks;
      },

      addBank: (name, value) => {
        const newBank: BankOption = {
          id: `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          value,
          isCustom: true,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          banks: [...state.banks, newBank],
        }));
      },

      updateBank: (id, name) => {
        set((state) => ({
          banks: state.banks.map((bank) =>
            bank.id === id ? { ...bank, name } : bank
          ),
        }));
      },

      deleteBank: (id) => {
        const bank = get().banks.find((b) => b.id === id);
        // 不允許刪除預設題庫
        if (bank && !bank.isCustom) {
          return;
        }
        set((state) => ({
          banks: state.banks.filter((bank) => bank.id !== id),
        }));
      },

      getBankById: (id) => {
        return get().banks.find((bank) => bank.id === id);
      },
    }),
    {
      name: 'bank-storage',
    }
  )
);

