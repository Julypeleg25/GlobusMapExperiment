import { create } from 'zustand';

interface SelectedEntityState {
  selectedEntityId: string | null;
  setSelectedEntityId: (entityId: string | null) => void;
}

export const useSelectedEntityStore = create<SelectedEntityState>((set) => ({
  selectedEntityId: null,
  setSelectedEntityId: (selectedEntityId) => set({ selectedEntityId }),
}));
