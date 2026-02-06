import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface UserState {
  users: User[];
  currentUserId: string | null;
  currentUser: User | null;
  
  // Actions
  addUser: (name: string) => void;
  deleteUser: (userId: string) => void;
  updateUserName: (userId: string, newName: string) => void;
  setCurrentUser: (userId: string) => void;
  getCurrentUser: () => User | null;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUserId: null,
      currentUser: null,

      addUser: (name: string) => {
        const newUser: User = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          users: [...state.users, newUser],
          currentUserId: newUser.id,
          currentUser: newUser,
        }));
      },

      deleteUser: (userId: string) => {
        set((state) => {
          const newUsers = state.users.filter((u) => u.id !== userId);
          const newCurrentUserId =
            state.currentUserId === userId
              ? newUsers.length > 0
                ? newUsers[0].id
                : null
              : state.currentUserId;
          return {
            users: newUsers,
            currentUserId: newCurrentUserId,
            currentUser:
              newCurrentUserId
                ? newUsers.find((u) => u.id === newCurrentUserId) || null
                : null,
          };
        });
      },

      updateUserName: (userId: string, newName: string) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, name: newName } : u
          ),
          currentUser:
            state.currentUser?.id === userId
              ? { ...state.currentUser, name: newName }
              : state.currentUser,
        }));
      },

      setCurrentUser: (userId: string) => {
        const user = get().users.find((u) => u.id === userId);
        set({
          currentUserId: userId,
          currentUser: user || null,
        });
      },

      getCurrentUser: () => {
        return get().currentUser;
      },
    }),
    {
      name: 'user-storage',
    }
  )
);

