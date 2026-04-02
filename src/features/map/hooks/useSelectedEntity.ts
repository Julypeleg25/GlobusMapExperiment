import { useSelectedEntityStore } from '../store/selectedEntity.store';

export function useSelectedEntity() {
  const selectedEntityId = useSelectedEntityStore((state) => state.selectedEntityId);
  const setSelectedEntityId = useSelectedEntityStore((state) => state.setSelectedEntityId);
  return { selectedEntityId, setSelectedEntityId };
}
