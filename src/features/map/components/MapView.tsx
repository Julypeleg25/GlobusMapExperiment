import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  LonLatCoordinate,
  MissionEntityDto,
  MissionEntityType,
} from '@shared/types/mission.types';
import { useMapInstance } from '../hooks/useMapInstance';
import { useMissionEntitiesQuery } from '../hooks/useMissionEntitiesQuery';
import { MissionMapBinder } from './MissionMapBinder';
import { MapClickMenu } from './MapClickMenu';
import { MapFiltersPanel } from './MapFiltersPanel';
import {
  createMissionEntityCollection,
  emptyMissionEntityCollection,
} from '../model/missionEntityCollection';
import { FpsMeter } from './FpsMeter';
import { EntityEditController } from './EntityEditController';
import { AirTrafficHud } from './AirTrafficHud';
import {
  addVertexAtLocation,
  applyHandleDrag,
  createEntityAtLocation,
  insertVertexAtHandle,
  pinEntityToLocation,
  updateCircleRadius,
  updateDoubleCircleRadii,
  updateEntityLabel,
  updateEntityPrimaryColor,
  updatePolygonFillColor,
  type EditHandleDatum,
} from '../model/entityEditing';
import { useSelectedEntity } from '../hooks/useSelectedEntity';
import { useAirTraffic } from '../hooks/useAirTraffic';

interface MapViewProps {
  missionId: string | null;
}

export function MapView({ missionId }: MapViewProps) {
  const { containerRef, map, sources, layers, zoom, menu } = useMapInstance();
  const { selectedEntityId, setSelectedEntityId } = useSelectedEntity();
  const airTraffic = useAirTraffic(map, sources);
  const entitiesQuery = useMissionEntitiesQuery(missionId);
  const [editableEntities, setEditableEntities] = useState<MissionEntityDto[]>([]);
  const [hydratedMissionId, setHydratedMissionId] = useState<string | null>(null);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const creationCounterRef = useRef(0);

  useEffect(() => {
    if (!missionId) {
      setEditableEntities([]);
      setHydratedMissionId(null);
      setEditingEntityId(null);
      setSelectedEntityId(null);
      return;
    }

    if (!entitiesQuery.data || hydratedMissionId === missionId) {
      return;
    }

    setEditableEntities(entitiesQuery.data.entities);
    setHydratedMissionId(missionId);
    setEditingEntityId(null);
    setSelectedEntityId(null);
    creationCounterRef.current = 0;
  }, [entitiesQuery.data, hydratedMissionId, missionId, setSelectedEntityId]);

  const entityCollection = useMemo(
    () =>
      editableEntities.length
        ? createMissionEntityCollection(editableEntities)
        : emptyMissionEntityCollection,
    [editableEntities],
  );
  const editingEntity = useMemo(
    () => entityCollection.entities.find((entity) => entity.id === editingEntityId) ?? null,
    [editingEntityId, entityCollection.entities],
  );

  useEffect(() => {
    if (selectedEntityId && !entityCollection.entityLookup[selectedEntityId]) {
      setSelectedEntityId(null);
    }

    if (editingEntityId && !entityCollection.entityLookup[editingEntityId]) {
      setEditingEntityId(null);
    }
  }, [editingEntityId, entityCollection.entityLookup, selectedEntityId, setSelectedEntityId]);

  const handleBeginEdit = useCallback((entityId: string) => {
    setEditingEntityId(entityId);
  }, []);

  const handleEndEdit = useCallback(() => {
    setEditingEntityId(null);
  }, []);

  const handleUpdateLabel = useCallback((entityId: string, label: string) => {
    setEditableEntities((current) => updateEntityLabel(current, entityId, label));
  }, []);

  const handleUpdatePrimaryColor = useCallback((entityId: string, color: string) => {
    setEditableEntities((current) => updateEntityPrimaryColor(current, entityId, color));
  }, []);

  const handleUpdatePolygonFillColor = useCallback((entityId: string, color: string) => {
    setEditableEntities((current) => updatePolygonFillColor(current, entityId, color));
  }, []);

  const handleUpdateCircleRadius = useCallback((entityId: string, radius: number) => {
    setEditableEntities((current) => updateCircleRadius(current, entityId, radius));
  }, []);

  const handleUpdateDoubleCircleRadii = useCallback(
    (entityId: string, innerRadius: number, outerRadius: number) => {
      setEditableEntities((current) =>
        updateDoubleCircleRadii(current, entityId, innerRadius, outerRadius),
      );
    },
    [],
  );

  const handlePinEntity = useCallback((entityId: string, coordinate: LonLatCoordinate) => {
    setEditableEntities((current) => pinEntityToLocation(current, entityId, coordinate));
  }, []);

  const handleAddVertex = useCallback((entityId: string, coordinate: LonLatCoordinate) => {
    setEditableEntities((current) => addVertexAtLocation(current, entityId, coordinate));
  }, []);

  const handleApplyHandleDrag = useCallback(
    (handle: EditHandleDatum, coordinate: LonLatCoordinate) => {
      setEditableEntities((current) => applyHandleDrag(current, handle, coordinate));
    },
    [],
  );

  const handleInsertVertexAtHandle = useCallback((handle: EditHandleDatum) => {
    setEditableEntities((current) => insertVertexAtHandle(current, handle));
  }, []);

  const handleCreateEntity = useCallback(
    (entityType: MissionEntityType, coordinate: LonLatCoordinate) => {
      creationCounterRef.current += 1;
      const entityId = `created-${entityType}-${creationCounterRef.current}`;
      const entity = createEntityAtLocation(
        entityType,
        entityId,
        coordinate,
        creationCounterRef.current,
      );

      setEditableEntities((current) => [...current, entity]);
      setSelectedEntityId(entityId);
      setEditingEntityId(entityId);
      return entityId;
    },
    [setSelectedEntityId],
  );

  return (
    <div className="app-shell">
      <MapFiltersPanel
        entityCollection={entityCollection}
        isLoading={entitiesQuery.isFetching}
      />
      <div className="map-stage">
        <div ref={containerRef} className="map-canvas" />
        <MapClickMenu
          map={map}
          menu={menu}
          onPlaneClick={airTraffic.handlePlaneClick}
          entities={entityCollection.entities}
          editingEntityId={editingEntityId}
          onBeginEdit={handleBeginEdit}
          onEndEdit={handleEndEdit}
          onUpdateLabel={handleUpdateLabel}
          onUpdatePrimaryColor={handleUpdatePrimaryColor}
          onUpdatePolygonFillColor={handleUpdatePolygonFillColor}
          onUpdateCircleRadius={handleUpdateCircleRadius}
          onUpdateDoubleCircleRadii={handleUpdateDoubleCircleRadii}
          onPinEntity={handlePinEntity}
          onAddVertex={handleAddVertex}
          onInsertVertexAtHandle={handleInsertVertexAtHandle}
          onCreateEntity={handleCreateEntity}
        />
        <EntityEditController
          map={map}
          editingEntity={editingEntity}
          onApplyHandleDrag={handleApplyHandleDrag}
        />
        <AirTrafficHud
          aircraft={airTraffic.selectedAircraft}
          mainAircraft={airTraffic.mainAircraft}
          onClear={airTraffic.clearSelectedAircraft}
        />
        <FpsMeter />
        <div className="map-watermark">
          OpenLayers mission rendering with WebGL layers, plonter picking, and edit handles.
        </div>
      </div>
      <MissionMapBinder
        sources={sources}
        layers={layers}
        zoom={zoom}
        entities={entityCollection.entities}
        circleEntities={entityCollection.circleEntities}
        standardEntities={entityCollection.standardEntities}
        editingEntity={editingEntity}
      />
    </div>
  );
}
