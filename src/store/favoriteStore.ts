import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FavoriteQuestion, Question } from '@/types';

interface FavoriteState {
  favorites: FavoriteQuestion[];
  
  // Actions
  addFavorite: (userId: string, question: Question) => void;
  removeFavorite: (userId: string, questionId: string) => void;
  isFavorite: (userId: string, questionId: string) => boolean;
  getFavorites: (userId: string) => FavoriteQuestion[];
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (userId, question) => {
        const existing = get().favorites.find(
          (f) => f.userId === userId && f.questionId === question.id
        );
        if (existing) return;

        const favorite: FavoriteQuestion = {
          id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          questionId: question.id,
          question,
          favoritedAt: new Date().toISOString(),
        };

        set((state) => ({
          favorites: [...state.favorites, favorite],
        }));
      },

      removeFavorite: (userId, questionId) => {
        set((state) => ({
          favorites: state.favorites.filter(
            (f) => !(f.userId === userId && f.questionId === questionId)
          ),
        }));
      },

      isFavorite: (userId, questionId) => {
        return get().favorites.some(
          (f) => f.userId === userId && f.questionId === questionId
        );
      },

      getFavorites: (userId) => {
        return get().favorites.filter((f) => f.userId === userId);
      },
    }),
    {
      name: 'favorite-storage',
    }
  )
);

