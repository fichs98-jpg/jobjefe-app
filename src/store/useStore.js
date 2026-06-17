import { create } from 'zustand'
export const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  toast: null,
  showToast: (msg, type = 'default') => {
    set({ toast: { msg, type } })
    setTimeout(() => set({ toast: null }), 3000)
  },
  isOnline: navigator.onLine,
  setOnline: (val) => set({ isOnline: val }),
  offlineQueue: [],
  addToOfflineQueue: (item) => set((s) => ({ offlineQueue: [...s.offlineQueue, item] })),
  clearOfflineQueue: () => set({ offlineQueue: [] }),
}))
