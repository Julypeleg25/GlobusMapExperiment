import type {
  CircleEntityDto,
  DoubleCircleEntityDto,
  LonLatCoordinate,
  MissionCategory,
  MissionEntityDto,
  MissionEntityType,
  MissionStatus,
  PointEntityDto,
  PolygonEntityDto,
  RouteEntityDto,
} from '@shared/types/mission.types';

export interface EditHandleDatum {
  id: string;
  entityId: string;
  kind: 'anchor' | 'vertex' | 'midpoint';
  entityType: MissionEntityDto['type'];
  position: LonLatCoordinate;
  vertexIndex?: number;
  insertIndex?: number;
}

export function updateEntityLabel(
  entities: MissionEntityDto[],
  entityId: string,
  label: string,
): MissionEntityDto[] {
  return updateEntityById(entities, entityId, (entity) => ({
    ...entity,
    label,
  }));
}

export function updateEntityPrimaryColor(
  entities: MissionEntityDto[],
  entityId: string,
  color: string,
): MissionEntityDto[] {
  return updateEntityById(entities, entityId, (entity) => {
    switch (entity.type) {
      case 'circle':
        return { ...entity, colorCode: color };
      case 'doubleCircle':
        return { ...entity, colorCode: color };
      case 'point':
        return { ...entity, markerColor: color };
      case 'route':
        return { ...entity, colorCode: color };
      case 'polygon':
        return { ...entity, strokeColor: color };
    }
  });
}

export function updatePolygonFillColor(
  entities: MissionEntityDto[],
  entityId: string,
  fillColor: string,
): MissionEntityDto[] {
  return updateEntityById(entities, entityId, (entity) =>
    entity.type === 'polygon' ? { ...entity, fillColor } : entity,
  );
}

export function updateCircleRadius(
  entities: MissionEntityDto[],
  entityId: string,
  radius: number,
): MissionEntityDto[] {
  const nextRadius = Math.max(2, Math.round(radius));
  return updateEntityById(entities, entityId, (entity) =>
    entity.type === 'circle' ? { ...entity, radius: nextRadius } : entity,
  );
}

export function updateDoubleCircleRadii(
  entities: MissionEntityDto[],
  entityId: string,
  nextInnerRadius: number,
  nextOuterRadius: number,
): MissionEntityDto[] {
  const innerRadius = Math.max(2, Math.round(nextInnerRadius));
  const outerRadius = Math.max(innerRadius + 1, Math.round(nextOuterRadius));

  return updateEntityById(entities, entityId, (entity) =>
    entity.type === 'doubleCircle'
      ? {
          ...entity,
          innerRadius,
          outerRadius,
        }
      : entity,
  );
}

export function pinEntityToLocation(
  entities: MissionEntityDto[],
  entityId: string,
  coordinate: LonLatCoordinate,
): MissionEntityDto[] {
  return updateEntityById(entities, entityId, (entity) => moveEntityAnchor(entity, coordinate));
}

export function addVertexAtLocation(
  entities: MissionEntityDto[],
  entityId: string,
  coordinate: LonLatCoordinate,
): MissionEntityDto[] {
  return updateEntityById(entities, entityId, (entity) => {
    if (entity.type === 'route') {
      const path = [...entity.path, coordinate];
      return withUpdatedRouteAnchor({ ...entity, path });
    }

    if (entity.type === 'polygon') {
      const vertices = entity.ring.slice(0, -1);
      const ring = [...vertices, coordinate, vertices[0]];
      return withUpdatedPolygonAnchor({ ...entity, ring });
    }

    return entity;
  });
}

export function insertVertexAtHandle(
  entities: MissionEntityDto[],
  handle: EditHandleDatum,
): MissionEntityDto[] {
  if (handle.kind !== 'midpoint' || handle.insertIndex == null) {
    return entities;
  }
  const insertIndex = handle.insertIndex;

  return updateEntityById(entities, handle.entityId, (entity) => {
    if (entity.type !== 'route') {
      return entity;
    }

    const path = entity.path.slice();
    path.splice(insertIndex, 0, handle.position);
    return withUpdatedRouteAnchor({ ...entity, path });
  });
}

export function getEditHandles(entity: MissionEntityDto): EditHandleDatum[] {
  switch (entity.type) {
    case 'circle':
    case 'doubleCircle':
    case 'point':
      return [];
    case 'route':
      return [
        ...entity.path.map((position, index) => ({
          id: `${entity.id}-vertex-${index + 1}`,
          entityId: entity.id,
          entityType: entity.type,
          kind: 'vertex' as const,
          position,
          vertexIndex: index,
        })),
        ...entity.path.slice(0, -1).map((position, index) => ({
          id: `${entity.id}-midpoint-${index + 1}`,
          entityId: entity.id,
          entityType: entity.type,
          kind: 'midpoint' as const,
          position: getMidpoint(position, entity.path[index + 1]),
          insertIndex: index + 1,
        })),
      ];
    case 'polygon': {
      const vertices = entity.ring.slice(0, -1);
      return vertices.map((position, index) => ({
        id: `${entity.id}-vertex-${index + 1}`,
        entityId: entity.id,
        entityType: entity.type,
        kind: 'vertex',
        position,
        vertexIndex: index,
      }));
    }
  }
}

export function applyHandleDrag(
  entities: MissionEntityDto[],
  handle: EditHandleDatum,
  coordinate: LonLatCoordinate,
): MissionEntityDto[] {
  return updateEntityById(entities, handle.entityId, (entity) => {
    if (handle.kind === 'anchor') {
      return moveEntityAnchor(entity, coordinate);
    }

    if (handle.kind === 'midpoint') {
      return entity;
    }

    if (handle.vertexIndex == null) {
      return entity;
    }

    if (entity.type === 'route') {
      const path = entity.path.map((vertex, index) =>
        index === handle.vertexIndex ? coordinate : vertex,
      );
      return withUpdatedRouteAnchor({ ...entity, path });
    }

    if (entity.type === 'polygon') {
      const vertices = entity.ring.slice(0, -1).map((vertex, index) =>
        index === handle.vertexIndex ? coordinate : vertex,
      );
      const ring = [...vertices, vertices[0]];
      return withUpdatedPolygonAnchor({ ...entity, ring });
    }

    return entity;
  });
}

export function createEntityAtLocation(
  entityType: MissionEntityType,
  entityId: string,
  coordinate: LonLatCoordinate,
  seed = 1,
): MissionEntityDto {
  const base = createBaseEntity(entityType, entityId, coordinate, seed);

  switch (entityType) {
    case 'circle':
      return {
        ...base,
        type: 'circle',
        radius: 18,
        colorCode: '#f08c00aa',
      };
    case 'doubleCircle':
      return {
        ...base,
        type: 'doubleCircle',
        innerRadius: 8,
        outerRadius: 15,
        colorCode: '#1971c2',
      };
    case 'point':
      return {
        ...base,
        type: 'point',
        markerColor: '#2f9e44',
      };
    case 'route': {
      const path = createRoutePath(coordinate);
      return {
        ...base,
        type: 'route',
        lon: coordinate[0],
        lat: coordinate[1],
        path,
        colorCode: '#c92a2a',
      };
    }
    case 'polygon': {
      const ring = createPolygonRing(coordinate);
      return {
        ...base,
        type: 'polygon',
        lon: coordinate[0],
        lat: coordinate[1],
        ring,
        fillColor: 'rgba(25,113,194,0.18)',
        strokeColor: '#1971c2',
      };
    }
  }
}

function updateEntityById(
  entities: MissionEntityDto[],
  entityId: string,
  updater: (entity: MissionEntityDto) => MissionEntityDto,
): MissionEntityDto[] {
  return entities.map((entity) => (entity.id === entityId ? updater(entity) : entity));
}

function moveEntityAnchor(
  entity: MissionEntityDto,
  coordinate: LonLatCoordinate,
): MissionEntityDto {
  switch (entity.type) {
    case 'circle':
      return { ...entity, lon: coordinate[0], lat: coordinate[1] };
    case 'doubleCircle':
      return { ...entity, lon: coordinate[0], lat: coordinate[1] };
    case 'point':
      return { ...entity, lon: coordinate[0], lat: coordinate[1] };
    case 'route': {
      const deltaLon = coordinate[0] - entity.lon;
      const deltaLat = coordinate[1] - entity.lat;
      const path = entity.path.map(([lon, lat]) => [lon + deltaLon, lat + deltaLat] as LonLatCoordinate);
      return withUpdatedRouteAnchor({ ...entity, path });
    }
    case 'polygon': {
      const deltaLon = coordinate[0] - entity.lon;
      const deltaLat = coordinate[1] - entity.lat;
      const ring = entity.ring.map(([lon, lat]) => [lon + deltaLon, lat + deltaLat] as LonLatCoordinate);
      return withUpdatedPolygonAnchor({ ...entity, ring });
    }
  }
}

function withUpdatedRouteAnchor(entity: RouteEntityDto): RouteEntityDto {
  const midpoint = entity.path[Math.floor(entity.path.length / 2)] ?? [entity.lon, entity.lat];
  return {
    ...entity,
    lon: midpoint[0],
    lat: midpoint[1],
  };
}

function withUpdatedPolygonAnchor(entity: PolygonEntityDto): PolygonEntityDto {
  const vertices = entity.ring.slice(0, -1);
  const center = getCentroid(vertices);
  return {
    ...entity,
    lon: center[0],
    lat: center[1],
  };
}

function getCentroid(vertices: LonLatCoordinate[]): LonLatCoordinate {
  const totals = vertices.reduce(
    (accumulator, [lon, lat]) => [accumulator[0] + lon, accumulator[1] + lat] as LonLatCoordinate,
    [0, 0],
  );

  return [totals[0] / vertices.length, totals[1] / vertices.length];
}

function createBaseEntity(
  entityType: MissionEntityType,
  entityId: string,
  coordinate: LonLatCoordinate,
  seed: number,
): {
  id: string;
  lon: number;
  lat: number;
  label: string;
  category: MissionCategory;
  status: MissionStatus;
  priority: number;
} {
  return {
    id: entityId,
    lon: coordinate[0],
    lat: coordinate[1],
    label: `New ${toDisplayType(entityType)} ${seed}`,
    category: 'neutral',
    status: 'planned',
    priority: 3,
  };
}

function createRoutePath(center: LonLatCoordinate): LonLatCoordinate[] {
  const [lon, lat] = center;
  return [
    [lon - 0.06, lat - 0.03],
    [lon, lat],
    [lon + 0.06, lat + 0.03],
  ];
}

function createPolygonRing(center: LonLatCoordinate): LonLatCoordinate[] {
  const [lon, lat] = center;
  return [
    [lon - 0.04, lat - 0.025],
    [lon + 0.038, lat - 0.018],
    [lon + 0.05, lat + 0.026],
    [lon - 0.03, lat + 0.035],
    [lon - 0.04, lat - 0.025],
  ];
}

function getMidpoint(
  [startLon, startLat]: LonLatCoordinate,
  [endLon, endLat]: LonLatCoordinate,
): LonLatCoordinate {
  return [(startLon + endLon) / 2, (startLat + endLat) / 2];
}

function toDisplayType(entityType: MissionEntityType): string {
  switch (entityType) {
    case 'doubleCircle':
      return 'Double Circle';
    default:
      return entityType.charAt(0).toUpperCase() + entityType.slice(1);
  }
}
