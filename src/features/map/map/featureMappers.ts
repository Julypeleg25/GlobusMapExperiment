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

type StandardEntityDto = Exclude<MissionEntityDto, CircleEntityDto>;
type RenderRole = 'circle' | 'doubleCircle' | 'point' | 'routeLine' | 'routeVertex' | 'polygon';

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

  return [lineFeature, ...pointFeatures];
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
