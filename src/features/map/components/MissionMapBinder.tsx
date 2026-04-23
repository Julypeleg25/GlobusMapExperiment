import { useEffect, useMemo } from 'react';
import { useSelectedEntity } from '../hooks/useSelectedEntity';
import { useMapFilters } from '../hooks/useMapFilters';
import type { MapLayers } from '../map/createLayers';
import type { MapSources } from '../map/createSources';
import {
  mapCircleEntitiesToFeatures,
  mapEditHandlesToFeatures,
  mapEntitiesToLabelFeatures,
  mapEntitiesToVectorFeatures,
  mapEntityToSelectedFeatures,
  mapRouteAnnotationsToFeatures,
} from '../map/featureMappers';
import type { CircleEntityDto, MissionEntityDto, RouteEntityDto } from '@shared/types/mission.types';

interface MissionMapBinderProps {
  sources: MapSources | null;
  layers: MapLayers | null;
  zoom: number;
  circleEntities: CircleEntityDto[];
  standardEntities: Exclude<MissionEntityDto, CircleEntityDto>[];
  entities: MissionEntityDto[];
  editingEntity: MissionEntityDto | null;
}

const labelZoomThreshold = 10;
const routeAnnotationZoomThreshold = 12;
const bulkCircleHideZoom = 12.5;

export function MissionMapBinder({
  sources,
  layers,
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
  const visibleCircleEntities = useMemo(
    () =>
      selectedEntityId
        ? filteredCircleEntities.filter((entity) => entity.id !== selectedEntityId)
        : filteredCircleEntities,
    [filteredCircleEntities, selectedEntityId],
  );
  const visibleStandardEntities = useMemo(
    () =>
      selectedEntityId
        ? filteredStandardEntities.filter((entity) => entity.id !== selectedEntityId)
        : filteredStandardEntities,
    [filteredStandardEntities, selectedEntityId],
  );
  const labelEntities = useMemo(
    () => [
      ...(zoom < bulkCircleHideZoom ? visibleCircleEntities : []),
      ...visibleStandardEntities,
    ],
    [visibleCircleEntities, visibleStandardEntities, zoom],
  );
  const routeAnnotationEntities = useMemo(() => {
    const visibleRoutes = visibleStandardEntities.filter(isRouteEntity);

    if (selectedEntity?.type === 'route') {
      return [...visibleRoutes, selectedEntity];
    }

    return visibleRoutes;
  }, [selectedEntity, visibleStandardEntities]);

  useEffect(() => {
    if (!sources) {
      return;
    }

    sources.bulkCirclesSource.clear();
    if (zoom < bulkCircleHideZoom) {
      sources.bulkCirclesSource.addFeatures(mapCircleEntitiesToFeatures(visibleCircleEntities));
    }

    sources.entitiesSource.clear();
    sources.entitiesSource.addFeatures(mapEntitiesToVectorFeatures(visibleStandardEntities));

    sources.routeAnnotationsSource.clear();
    if (zoom >= routeAnnotationZoomThreshold) {
      sources.routeAnnotationsSource.addFeatures(
        mapRouteAnnotationsToFeatures(routeAnnotationEntities),
      );
    }

    sources.imageMarkersSource.clear();

    sources.labelsSource.clear();
    if (showLabels && zoom >= labelZoomThreshold) {
      sources.labelsSource.addFeatures(mapEntitiesToLabelFeatures(labelEntities));
    }

    sources.selectedEntitySource.clear();
    if (selectedEntity && !(selectedEntity.type === 'circle' && zoom >= bulkCircleHideZoom)) {
      sources.selectedEntitySource.addFeatures(mapEntityToSelectedFeatures(selectedEntity));
    }

    sources.editHandlesSource.clear();
    if (editingEntity) {
      sources.editHandlesSource.addFeatures(mapEditHandlesToFeatures(editingEntity));
    }
  }, [
    editingEntity,
    labelEntities,
    selectedEntity,
    showLabels,
    sources,
    routeAnnotationEntities,
    visibleCircleEntities,
    visibleStandardEntities,
    zoom,
  ]);

  useEffect(() => {
    if (!layers) {
      return;
    }

    layers.bulkCirclesLayer.setVisible(zoom < bulkCircleHideZoom);
    layers.labelsLayer.setVisible(showLabels && zoom >= labelZoomThreshold);
    layers.routeAnnotationsLayer.setVisible(zoom >= routeAnnotationZoomThreshold);
  }, [layers, showLabels, zoom]);

  return null;
}

function isRouteEntity(
  entity: Exclude<MissionEntityDto, CircleEntityDto>,
): entity is RouteEntityDto {
  return entity.type === 'route';
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
