import { TufHistoryEntry, TaskState } from './types';

export const loadHistoryFromStorage = (): TufHistoryEntry[] => {
  const savedHistory = localStorage.getItem('tuf-history');
  if (savedHistory) {
    try {
      return JSON.parse(savedHistory);
    } catch (e) {
      console.error('Failed to load TUF history:', e);
      return [];
    }
  }
  return [];
};

export const saveToHistory = (
  entry: Omit<TufHistoryEntry, 'id'>,
  currentHistory: TufHistoryEntry[]
): TufHistoryEntry[] => {
  const newEntry: TufHistoryEntry = {
    ...entry,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  };
  const updatedHistory = [newEntry, ...currentHistory].slice(0, 20); // Keep last 20 entries
  localStorage.setItem('tuf-history', JSON.stringify(updatedHistory));
  return updatedHistory;
};

export const updateHistoryStatus = (
  taskId: string,
  state: TaskState,
  currentHistory: TufHistoryEntry[]
): TufHistoryEntry[] => {
  const updatedHistory = currentHistory.map(entry => {
    if (entry.taskId === taskId) {
      // Map TaskState to history status
      let newStatus: 'success' | 'failed' | 'pending' = 'pending';
      if (state === 'SUCCESS') {
        newStatus = 'success';
      } else if (state === 'FAILURE') {
        newStatus = 'failed';
      } else if (state === 'PENDING') {
        newStatus = 'pending';
      }
      
      return {
        ...entry,
        status: newStatus,
      };
    }
    return entry;
  });
  
  localStorage.setItem('tuf-history', JSON.stringify(updatedHistory));
  return updatedHistory;
};

export const clearHistory = (): TufHistoryEntry[] => {
  localStorage.removeItem('tuf-history');
  return [];
};
