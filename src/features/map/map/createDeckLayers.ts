import type { LayersList } from '@deck.gl/core';
import {
  IconLayer,
  PathLayer,
  PolygonLayer,
  ScatterplotLayer,
  TextLayer,
} from '@deck.gl/layers';
import type {
  CircleEntityDto,
  DoubleCircleEntityDto,
  LonLatCoordinate,
  MissionEntityDto,
  PointEntityDto,
  PolygonEntityDto,
  RouteEntityDto,
} from '@shared/types/mission.types';
import { getEditHandles, type EditHandleDatum } from '../model/entityEditing';

interface CreateDeckLayersArgs {
  circleEntities: CircleEntityDto[];
  standardEntities: Exclude<MissionEntityDto, CircleEntityDto>[];
  selectedEntity: MissionEntityDto | null;
  editingEntity: MissionEntityDto | null;
  showLabels: boolean;
  zoom: number;
}

interface RouteVertexDatum {
  id: string;
  entity: RouteEntityDto;
  position: LonLatCoordinate;
}

const labelZoomThreshold = 9;

export function createDeckLayers({
  circleEntities,
  standardEntities,
  selectedEntity,
  editingEntity,
  showLabels,
  zoom,
}: CreateDeckLayersArgs): LayersList {
  const selectedEntityId = selectedEntity?.id ?? null;
  const visibleCircleEntities = selectedEntityId
    ? circleEntities.filter((entity) => entity.id !== selectedEntityId)
    : circleEntities;
  const visibleStandardEntities = selectedEntityId
    ? standardEntities.filter((entity) => entity.id !== selectedEntityId)
    : standardEntities;

  const pointEntities = visibleStandardEntities.filter(isPointEntity);
  const doubleCircleEntities = visibleStandardEntities.filter(isDoubleCircleEntity);
  const routeEntities = visibleStandardEntities.filter(isRouteEntity);
  const polygonEntities = visibleStandardEntities.filter(isPolygonEntity);
  const routeVertices = routeEntities.flatMap(createRouteVertices);
  const labelEntities = [...visibleCircleEntities, ...visibleStandardEntities];
  const layers: LayersList = [
    new ScatterplotLayer<CircleEntityDto>({
      id: 'bulk-circles',
      data: visibleCircleEntities,
      pickable: true,
      stroked: false,
      filled: true,
      radiusUnits: 'pixels',
      radiusMinPixels: 1,
      getPosition: (entity) => [entity.lon, entity.lat],
      getRadius: (entity) => entity.radius,
      getFillColor: (entity) => colorToArray(entity.colorCode),
    }),
    new ScatterplotLayer<DoubleCircleEntityDto>({
      id: 'double-circles-outer',
      data: doubleCircleEntities,
      pickable: true,
      stroked: true,
      filled: false,
      radiusUnits: 'pixels',
      lineWidthUnits: 'pixels',
      lineWidthMinPixels: 2,
      getPosition: (entity) => [entity.lon, entity.lat],
      getRadius: (entity) => entity.outerRadius,
      getLineColor: (entity) => colorToArray(entity.colorCode),
    }),
    new ScatterplotLayer<DoubleCircleEntityDto>({
      id: 'double-circles-inner',
      data: doubleCircleEntities,
      pickable: true,
      stroked: true,
      filled: true,
      radiusUnits: 'pixels',
      lineWidthUnits: 'pixels',
      lineWidthMinPixels: 2,
      getPosition: (entity) => [entity.lon, entity.lat],
      getRadius: (entity) => entity.innerRadius,
      getFillColor: () => [255, 255, 255, 14],
      getLineColor: (entity) => colorToArray(entity.colorCode),
    }),
    new IconLayer<DoubleCircleEntityDto>({
      id: 'double-circles-center-icon',
      data: doubleCircleEntities,
      pickable: false,
      getPosition: (entity) => [entity.lon, entity.lat],
      getIcon: (entity) => createDoubleCircleCenterIcon(entity.colorCode),
      getSize: 12,
      sizeUnits: 'pixels',
      sizeMinPixels: 12,
    }),
    new ScatterplotLayer<PointEntityDto>({
      id: 'points',
      data: pointEntities,
      pickable: true,
      stroked: true,
      filled: true,
      radiusUnits: 'pixels',
      lineWidthUnits: 'pixels',
      lineWidthMinPixels: 2,
      getPosition: (entity) => [entity.lon, entity.lat],
      getRadius: 6,
      getFillColor: (entity) => colorToArray(entity.markerColor),
      getLineColor: () => [255, 255, 255, 255],
    }),
    new PathLayer<RouteEntityDto>({
      id: 'routes',
      data: routeEntities,
      pickable: true,
      widthUnits: 'pixels',
      widthMinPixels: 3,
      rounded: true,
      getPath: (entity) => entity.path,
      getColor: (entity) => colorToArray(entity.colorCode),
      getWidth: 3,
    }),
    new ScatterplotLayer<RouteVertexDatum>({
      id: 'route-vertices',
      data: routeVertices,
      pickable: true,
      stroked: true,
      filled: true,
      radiusUnits: 'pixels',
      lineWidthUnits: 'pixels',
      lineWidthMinPixels: 2,
      getPosition: (datum) => datum.position,
      getRadius: 4,
      getFillColor: () => [255, 255, 255, 255],
      getLineColor: (datum) => colorToArray(datum.entity.colorCode),
    }),
    new PolygonLayer<PolygonEntityDto>({
      id: 'polygons',
      data: polygonEntities,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthUnits: 'pixels',
      lineWidthMinPixels: 2,
      getPolygon: (entity) => entity.ring,
      getFillColor: (entity) => colorToArray(entity.fillColor),
      getLineColor: (entity) => colorToArray(entity.strokeColor),
      getLineWidth: 2,
    }),
  ];

  if (showLabels && zoom >= labelZoomThreshold) {
    layers.push(
      new TextLayer<MissionEntityDto>({
        id: 'labels',
        data: labelEntities,
        pickable: false,
        billboard: true,
        sizeUnits: 'pixels',
        sizeMinPixels: 12,
        getText: (entity) => entity.label,
        getPosition: (entity) => [entity.lon, entity.lat],
        getSize: 12,
        getColor: () => [16, 42, 67, 255],
        getPixelOffset: () => [0, -18],
        getTextAnchor: () => 'middle',
        getAlignmentBaseline: () => 'bottom',
        background: true,
        getBackgroundColor: () => [255, 255, 255, 225],
        getBorderColor: () => [214, 224, 233, 255],
        getBorderWidth: 1,
      }),
    );
  }

  if (selectedEntity) {
    layers.push(...createSelectedLayers(selectedEntity));
  }

  if (editingEntity) {
    layers.push(
      new ScatterplotLayer<EditHandleDatum>({
        id: 'edit-handles',
        data: getEditHandles(editingEntity),
        pickable: true,
        stroked: true,
        filled: true,
        radiusUnits: 'pixels',
        lineWidthUnits: 'pixels',
        lineWidthMinPixels: 2,
        getPosition: (datum) => datum.position,
        getRadius: (datum) => (datum.kind === 'anchor' ? 8 : 7),
        getFillColor: () => [255, 255, 255, 255],
        getLineColor: (datum) =>
          datum.kind === 'anchor' ? [16, 42, 67, 255] : [245, 158, 11, 255],
      }),
    );
  }

  return layers;
}

function createSelectedLayers(entity: MissionEntityDto): LayersList {
  switch (entity.type) {
    case 'circle':
      return [
        new ScatterplotLayer<CircleEntityDto>({
          id: 'selected-circle',
          data: [entity],
          pickable: true,
          stroked: true,
          filled: true,
          radiusUnits: 'pixels',
          lineWidthUnits: 'pixels',
          lineWidthMinPixels: 3,
          getPosition: (item) => [item.lon, item.lat],
          getRadius: (item) => item.radius + 6,
          getFillColor: () => [245, 158, 11, 40],
          getLineColor: () => [245, 158, 11, 255],
        }),
      ];
    case 'doubleCircle':
      return [
        new ScatterplotLayer<DoubleCircleEntityDto>({
          id: 'selected-double-circle-outer',
          data: [entity],
          pickable: true,
          stroked: true,
          filled: false,
          radiusUnits: 'pixels',
          lineWidthUnits: 'pixels',
          lineWidthMinPixels: 4,
          getPosition: (item) => [item.lon, item.lat],
          getRadius: (item) => item.outerRadius + 3,
          getLineColor: () => [245, 158, 11, 255],
        }),
        new ScatterplotLayer<DoubleCircleEntityDto>({
          id: 'selected-double-circle-inner',
          data: [entity],
          pickable: true,
          stroked: true,
          filled: true,
          radiusUnits: 'pixels',
          lineWidthUnits: 'pixels',
          lineWidthMinPixels: 3,
          getPosition: (item) => [item.lon, item.lat],
          getRadius: (item) => item.innerRadius + 2,
          getFillColor: () => [245, 158, 11, 32],
          getLineColor: () => [245, 158, 11, 255],
        }),
        new IconLayer<DoubleCircleEntityDto>({
          id: 'selected-double-circle-center-icon',
          data: [entity],
          pickable: false,
          getPosition: (item) => [item.lon, item.lat],
          getIcon: () => selectedDoubleCircleCenterIcon,
          getSize: 14,
          sizeUnits: 'pixels',
          sizeMinPixels: 14,
        }),
      ];
    case 'point':
      return [
        new ScatterplotLayer<PointEntityDto>({
          id: 'selected-point',
          data: [entity],
          pickable: true,
          stroked: true,
          filled: true,
          radiusUnits: 'pixels',
          lineWidthUnits: 'pixels',
          lineWidthMinPixels: 4,
          getPosition: (item) => [item.lon, item.lat],
          getRadius: 10,
          getFillColor: () => [245, 158, 11, 36],
          getLineColor: () => [245, 158, 11, 255],
        }),
      ];
    case 'route':
      return [
        new PathLayer<RouteEntityDto>({
          id: 'selected-route',
          data: [entity],
          pickable: true,
          widthUnits: 'pixels',
          widthMinPixels: 6,
          rounded: true,
          getPath: (item) => item.path,
          getColor: () => [245, 158, 11, 255],
          getWidth: 6,
        }),
        new ScatterplotLayer<RouteVertexDatum>({
          id: 'selected-route-vertices',
          data: createRouteVertices(entity),
          pickable: true,
          stroked: true,
          filled: true,
          radiusUnits: 'pixels',
          lineWidthUnits: 'pixels',
          lineWidthMinPixels: 3,
          getPosition: (datum) => datum.position,
          getRadius: 7,
          getFillColor: () => [255, 255, 255, 255],
          getLineColor: () => [245, 158, 11, 255],
        }),
      ];
    case 'polygon':
      return [
        new PolygonLayer<PolygonEntityDto>({
          id: 'selected-polygon',
          data: [entity],
          pickable: true,
          stroked: true,
          filled: true,
          lineWidthUnits: 'pixels',
          lineWidthMinPixels: 4,
          getPolygon: (item) => item.ring,
          getFillColor: () => [245, 158, 11, 32],
          getLineColor: () => [245, 158, 11, 255],
          getLineWidth: 4,
        }),
      ];
  }
}

function createRouteVertices(entity: RouteEntityDto): RouteVertexDatum[] {
  return entity.path.map((position, index) => ({
    id: `${entity.id}-vertex-${index + 1}`,
    entity,
    position,
  }));
}

function isPointEntity(entity: Exclude<MissionEntityDto, CircleEntityDto>): entity is PointEntityDto {
  return entity.type === 'point';
}

function isDoubleCircleEntity(
  entity: Exclude<MissionEntityDto, CircleEntityDto>,
): entity is DoubleCircleEntityDto {
  return entity.type === 'doubleCircle';
}

function isRouteEntity(entity: Exclude<MissionEntityDto, CircleEntityDto>): entity is RouteEntityDto {
  return entity.type === 'route';
}

function isPolygonEntity(
  entity: Exclude<MissionEntityDto, CircleEntityDto>,
): entity is PolygonEntityDto {
  return entity.type === 'polygon';
}

function colorToArray(value: string): [number, number, number, number] {
  if (value.startsWith('#')) {
    const normalized = value.slice(1);
    if (normalized.length === 6) {
      return [
        Number.parseInt(normalized.slice(0, 2), 16),
        Number.parseInt(normalized.slice(2, 4), 16),
        Number.parseInt(normalized.slice(4, 6), 16),
        255,
      ];
    }

    if (normalized.length === 8) {
      return [
        Number.parseInt(normalized.slice(0, 2), 16),
        Number.parseInt(normalized.slice(2, 4), 16),
        Number.parseInt(normalized.slice(4, 6), 16),
        Number.parseInt(normalized.slice(6, 8), 16),
      ];
    }
  }

  const rgbaMatch = value.match(
    /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/i,
  );
  if (rgbaMatch) {
    return [
      Math.round(Number(rgbaMatch[1])),
      Math.round(Number(rgbaMatch[2])),
      Math.round(Number(rgbaMatch[3])),
      Math.round(((rgbaMatch[4] ? Number(rgbaMatch[4]) : 1) * 255)),
    ];
  }

  return [92, 103, 125, 255];
}

function createDoubleCircleCenterIcon(color: string) {
  return {
    url: createCenterIconDataUrl(color),
    width: 32,
    height: 32,
    anchorX: 16,
    anchorY: 16,
  };
}

function createCenterIconDataUrl(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="white" fill-opacity="0.9"/><path d="M16 6 19.2 12.8 26 16 19.2 19.2 16 26 12.8 19.2 6 16 12.8 12.8Z" fill="${normalizeIconColor(color)}" stroke="white" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeIconColor(value: string): string {
  if (value.startsWith('#')) {
    const normalized = value.slice(1);
    if (normalized.length === 6) {
      return value;
    }

    if (normalized.length === 8) {
      return `#${normalized.slice(0, 6)}`;
    }
  }

  const rgbaMatch = value.match(
    /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/i,
  );
  if (rgbaMatch) {
    return rgbToHex(
      Number(rgbaMatch[1]),
      Number(rgbaMatch[2]),
      Number(rgbaMatch[3]),
    );
  }

  return '#5c677d';
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0');
}

const selectedDoubleCircleCenterIcon = createDoubleCircleCenterIcon('#f59e0b');
