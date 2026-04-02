import { create } from 'zustand';

export interface MapFiltersState {
  category: string | null;
  status: string | null;
  minPriority: number;
  showLabels: boolean;
  setCategory: (value: string | null) => void;
  setStatus: (value: string | null) => void;
  setMinPriority: (value: number) => void;
  setShowLabels: (value: boolean) => void;
}

export const useMapFiltersStore = create<MapFiltersState>((set) => ({
  category: null,
  status: null,
  minPriority: 0,
  showLabels: true,
  setCategory: (category) => set({ category }),
  setStatus: (status) => set({ status }),
  setMinPriority: (minPriority) => set({ minPriority }),
  setShowLabels: (showLabels) => set({ showLabels }),
}));
