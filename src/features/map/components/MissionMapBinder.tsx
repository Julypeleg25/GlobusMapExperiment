import { useEffect, useMemo } from 'react';
import type { MapboxOverlay } from '@deck.gl/mapbox';
import { useSelectedEntity } from '../hooks/useSelectedEntity';
import { useMapFilters } from '../hooks/useMapFilters';
import { createDeckLayers } from '../map/createDeckLayers';
import type { CircleEntityDto, MissionEntityDto } from '@shared/types/mission.types';

interface MissionMapBinderProps {
  deckOverlay: MapboxOverlay | null;
  zoom: number;
  circleEntities: CircleEntityDto[];
  standardEntities: Exclude<MissionEntityDto, CircleEntityDto>[];
  entities: MissionEntityDto[];
  editingEntity: MissionEntityDto | null;
}

export function MissionMapBinder({
  deckOverlay,
  zoom,
  circleEntities,
  standardEntities,
  entities,
  editingEntity,
}: MissionMapBinderProps) {
  const { selectedEntityId } = useSelectedEntity();
  const { category, status, minPriority, showLabels } = useMapFilters();

  const selectedEntity = useMemo(
    () => entities.find((entity) => entity.id === selectedEntityId) ?? null,
    [entities, selectedEntityId],
  );
  const filteredCircleEntities = useMemo(
    () => filterEntities(circleEntities, category, status, minPriority),
    [circleEntities, category, status, minPriority],
  );
  const filteredStandardEntities = useMemo(
    () => filterEntities(standardEntities, category, status, minPriority),
    [standardEntities, category, status, minPriority],
  );
  const layers = useMemo(
    () =>
      createDeckLayers({
        circleEntities: filteredCircleEntities,
        standardEntities: filteredStandardEntities,
        selectedEntity,
        editingEntity,
        showLabels,
        zoom,
      }),
    [
      editingEntity,
      filteredCircleEntities,
      filteredStandardEntities,
      selectedEntity,
      showLabels,
      zoom,
    ],
  );

  useEffect(() => {
    if (!deckOverlay) return;

    deckOverlay.setProps({
      layers,
    });
  }, [deckOverlay, layers]);

  return null;
}

function filterEntities<TEntity extends MissionEntityDto>(
  entities: TEntity[],
  category: string | null,
  status: string | null,
  minPriority: number,
): TEntity[] {
  return entities.filter((entity) => {
    if (category && entity.category !== category) {
      return false;
    }

    if (status && entity.status !== status) {
      return false;
    }

    return entity.priority >= minPriority;
  });
}
