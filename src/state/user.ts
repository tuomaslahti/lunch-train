import { create } from 'zustand/react';
import { devtools } from 'zustand/middleware';
import { getUserInfo, saveNickname } from '@/lib/user-id';

interface UserState {
  userId: string;
  nickname: string | null;
  setNickname: (nickname: string | null) => void;
  loadUserInfo: () => void;
}

export const useUserStore = create<UserState>()(
  devtools((set) => ({
    userId: '',
    nickname: null,
    setNickname: (nickname: string | null) => {
      if (nickname) {
        saveNickname(nickname);
      }
      set({ nickname });
    },
    loadUserInfo: () => {
      const { userId, nickname } = getUserInfo();
      set({ userId, nickname });
    },
  }))
);
