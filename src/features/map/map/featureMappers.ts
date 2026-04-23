import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import type {
  CircleEntityDto,
  DoubleCircleEntityDto,
  MissionEntityDto,
  PointEntityDto,
  PolygonEntityDto,
  RouteEntityDto,
} from '@shared/types/mission.types';
import { getEditHandles } from '../model/entityEditing';
import type { ImageMarkerRecord } from './imageMarkerFeatures';
import { getImageMarkerIconSrc } from './imageMarkerStyle';
import type { AircraftLinkSnapshot, AircraftSnapshot } from '../model/airTraffic';

type StandardEntityDto = Exclude<MissionEntityDto, CircleEntityDto>;
type RenderRole =
  | 'circle'
  | 'doubleCircle'
  | 'point'
  | 'routeLine'
  | 'routeVertex'
  | 'routeDirectionMarker'
  | 'polygon';

export function mapCircleEntitiesToFeatures(
  entities: CircleEntityDto[],
): Feature<Point>[] {
  return entities.map(mapCircleEntityToFeature);
}

export function mapEntitiesToVectorFeatures(
  entities: StandardEntityDto[],
): Feature<Geometry>[] {
  return entities.flatMap(mapEntityToVectorFeatures);
}

export function mapRouteAnnotationsToFeatures(
  entities: RouteEntityDto[],
): Feature<Geometry>[] {
  return entities.flatMap(mapRouteEntityToAnnotationFeatures);
}

export function mapEntityToSelectedFeatures(entity: MissionEntityDto): Feature<Geometry>[] {
  if (entity.type === 'circle') {
    return [mapCircleEntityToFeature(entity)];
  }

  return mapEntityToVectorFeatures(entity);
}

export function mapEntitiesToLabelFeatures(
  entities: MissionEntityDto[],
): Feature<Point>[] {
  return entities.map((entity) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([entity.lon, entity.lat])),
      entityId: entity.id,
      label: entity.label,
      type: entity.type,
    });
    feature.setId(`label-${entity.id}`);
    return feature;
  });
}

export function mapEditHandlesToFeatures(entity: MissionEntityDto): Feature<Point>[] {
  return getEditHandles(entity).map((handle) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat(handle.position)),
      entityId: handle.entityId,
      entityType: handle.entityType,
      handleKind: handle.kind,
      handleCoordinate: handle.position,
      vertexIndex: handle.vertexIndex,
      insertIndex: handle.insertIndex,
      featureKind: 'editHandle',
    });
    feature.setId(handle.id);
    return feature;
  });
}

export function mapImageMarkersToFeatures(records: ImageMarkerRecord[]): Feature<Point>[] {
  return records.map((record) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat(record.coordinate)),
      iconVariant: record.iconVariant,
      iconSrc: getImageMarkerIconSrc(record.iconVariant),
    });
    feature.setId(record.id);
    return feature;
  });
}

export function mapEntityMarkersToFeatures(entities: MissionEntityDto[]): Feature<Point>[] {
  return entities.flatMap((entity) => {
    if (entity.type !== 'circle' && entity.type !== 'doubleCircle') {
      return [];
    }

    const feature = new Feature({
      geometry: new Point(fromLonLat([entity.lon, entity.lat])),
      entityId: entity.id,
      iconVariant: getEntityIconVariant(entity.category),
    });
    feature.setId(`icon-${entity.id}`);
    return [feature];
  });
}

export function mapAircraftToFeatures(records: AircraftSnapshot[]): Feature<Point>[] {
  return records.map((record) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat(record.coordinate)),
      aircraftId: record.id,
      callsign: record.callsign,
      planeRole: record.role,
      headingRad: record.headingRad,
      speedKnots: record.speedKnots,
      altitudeFt: record.altitudeFt,
      colorCode: record.color,
      isFocused: record.isFocused,
    });
    feature.setId(record.id);
    return feature;
  });
}

export function mapAircraftLinkToFeatures(
  link: AircraftLinkSnapshot | null,
): Feature<Geometry>[] {
  if (!link) {
    return [];
  }

  const feature = new Feature({
    geometry: new LineString(link.path.map((coordinate) => fromLonLat(coordinate))),
    fromAircraftId: link.fromAircraftId,
    toAircraftId: link.toAircraftId,
  });
  feature.setId(link.id);
  return [feature];
}

function mapCircleEntityToFeature(entity: CircleEntityDto): Feature<Point> {
  const feature = new Feature({
    geometry: new Point(fromLonLat([entity.lon, entity.lat])),
    entityId: entity.id,
    label: entity.label,
    category: entity.category,
    status: entity.status,
    priority: entity.priority,
    type: entity.type,
    renderRole: 'circle' as RenderRole,
    radius: entity.radius,
    colorCode: entity.colorCode,
    iconVariant: getEntityIconVariant(entity.category),
  });
  feature.setId(entity.id);
  return feature;
}

function mapEntityToVectorFeatures(entity: StandardEntityDto): Feature<Geometry>[] {
  switch (entity.type) {
    case 'point':
      return [createPointFeature(entity)];
    case 'doubleCircle':
      return [createDoubleCircleFeature(entity)];
    case 'route':
      return createRouteFeatures(entity);
    case 'polygon':
      return [createPolygonFeature(entity)];
  }
}

function createPointFeature(entity: PointEntityDto): Feature<Point> {
  return createFeature(entity, new Point(fromLonLat([entity.lon, entity.lat])), 'point', {
    colorCode: entity.markerColor,
  });
}

function createDoubleCircleFeature(entity: DoubleCircleEntityDto): Feature<Point> {
  return createFeature(entity, new Point(fromLonLat([entity.lon, entity.lat])), 'doubleCircle', {
    colorCode: entity.colorCode,
    innerRadius: entity.innerRadius,
    outerRadius: entity.outerRadius,
    iconVariant: getEntityIconVariant(entity.category),
  });
}

function createRouteFeatures(entity: RouteEntityDto): Feature<Geometry>[] {
  const projectedPath = entity.path.map((coordinate) => fromLonLat(coordinate));
  const lineFeature = createFeature(
    entity,
    new LineString(projectedPath),
    'routeLine',
    { colorCode: entity.colorCode },
    entity.id,
  );

  const pointFeatures = projectedPath.map((coordinate, index) =>
    createFeature(
      entity,
      new Point(coordinate),
      'routeVertex',
      { colorCode: entity.colorCode, pointIndex: index },
      `${entity.id}-vertex-${index + 1}`,
    ),
  );

  const directionFeatures = entity.path.slice(0, -1).map((coordinate, index) =>
    createFeature(
      entity,
      new Point(fromLonLat(getMidpoint(coordinate, entity.path[index + 1]))),
      'routeDirectionMarker',
      {
        colorCode: entity.colorCode,
        headingRad: getHeadingRadians(coordinate, entity.path[index + 1]),
      },
      `${entity.id}-direction-${index + 1}`,
    ),
  );

  return [lineFeature, ...pointFeatures, ...directionFeatures];
}

function mapRouteEntityToAnnotationFeatures(entity: RouteEntityDto): Feature<Geometry>[] {
  const features: Feature<Geometry>[] = [];
  let annotationIndex = 1;

  for (let index = 0; index < entity.path.length - 1; index += 1) {
    const start = entity.path[index];
    const end = entity.path[index + 1];
    const segmentLength = getSegmentLength(start, end);
    const tickCount = Math.max(2, Math.min(6, Math.floor(segmentLength / 0.035)));

    for (let tickIndex = 1; tickIndex <= tickCount; tickIndex += 1) {
      const t = tickIndex / (tickCount + 1);
      const center = interpolateCoordinate(start, end, t);
      const dash = createPerpendicularDash(center, start, end, 0.0085);
      const feature = new Feature({
        geometry: new LineString(dash.map((coordinate) => fromLonLat(coordinate))),
        entityId: entity.id,
        colorCode: entity.colorCode,
        label: String(annotationIndex),
      });
      feature.setId(`${entity.id}-annotation-${annotationIndex}`);
      features.push(feature);
      annotationIndex += 1;
    }
  }

  return features;
}

function createPolygonFeature(entity: PolygonEntityDto): Feature<Polygon> {
  return createFeature(
    entity,
    new Polygon([entity.ring.map((coordinate) => fromLonLat(coordinate))]),
    'polygon',
    {
      fillColor: entity.fillColor,
      strokeColor: entity.strokeColor,
    },
  );
}

function createFeature<TGeometry extends Geometry>(
  entity: StandardEntityDto,
  geometry: TGeometry,
  renderRole: RenderRole,
  extraProperties: Record<string, unknown>,
  featureId = entity.id,
): Feature<TGeometry> {
  const feature = new Feature({
    geometry,
    entityId: entity.id,
    label: entity.label,
    category: entity.category,
    status: entity.status,
    priority: entity.priority,
    type: entity.type,
    renderRole,
    ...extraProperties,
  });
  feature.setId(featureId);
  return feature;
}

function getMidpoint(
  [startLon, startLat]: [number, number],
  [endLon, endLat]: [number, number],
): [number, number] {
  return [(startLon + endLon) / 2, (startLat + endLat) / 2];
}

function getHeadingRadians(
  [startLon, startLat]: [number, number],
  [endLon, endLat]: [number, number],
): number {
  return Math.atan2(endLon - startLon, endLat - startLat);
}

function getSegmentLength(
  [startLon, startLat]: [number, number],
  [endLon, endLat]: [number, number],
): number {
  return Math.hypot(endLon - startLon, endLat - startLat);
}

function interpolateCoordinate(
  [startLon, startLat]: [number, number],
  [endLon, endLat]: [number, number],
  t: number,
): [number, number] {
  return [
    startLon + (endLon - startLon) * t,
    startLat + (endLat - startLat) * t,
  ];
}

function createPerpendicularDash(
  center: [number, number],
  [startLon, startLat]: [number, number],
  [endLon, endLat]: [number, number],
  halfLength: number,
): [[number, number], [number, number]] {
  const deltaLon = endLon - startLon;
  const deltaLat = endLat - startLat;
  const segmentLength = Math.hypot(deltaLon, deltaLat) || 1;
  const normalLon = -deltaLat / segmentLength;
  const normalLat = deltaLon / segmentLength;

  return [
    [center[0] - normalLon * halfLength, center[1] - normalLat * halfLength],
    [center[0] + normalLon * halfLength, center[1] + normalLat * halfLength],
  ];
}

function getEntityIconVariant(
  category: MissionEntityDto['category'],
): 'amber' | 'cyan' | 'red' {
  switch (category) {
    case 'friendly':
      return 'cyan';
    case 'hostile':
      return 'red';
    default:
      return 'amber';
  }
}
