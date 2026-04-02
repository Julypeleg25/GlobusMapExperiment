export const missionEntityTypes = [
  'circle',
  'doubleCircle',
  'point',
  'route',
  'polygon',
] as const;
export const missionCategories = ['friendly', 'neutral', 'hostile'] as const;
export const missionStatuses = ['active', 'idle', 'planned'] as const;

export type MissionEntityType = (typeof missionEntityTypes)[number];
export type MissionCategory = (typeof missionCategories)[number];
export type MissionStatus = (typeof missionStatuses)[number];
export type LonLatCoordinate = [number, number];

export interface MissionEntityBaseDto {
  id: string;
  lon: number;
  lat: number;
  label: string;
  category: MissionCategory;
  status: MissionStatus;
  priority: number;
  type: MissionEntityType;
}

export interface CircleEntityDto extends MissionEntityBaseDto {
  type: 'circle';
  radius: number;
  colorCode: string;
}

export interface DoubleCircleEntityDto extends MissionEntityBaseDto {
  type: 'doubleCircle';
  innerRadius: number;
  outerRadius: number;
  colorCode: string;
}

export interface PointEntityDto extends MissionEntityBaseDto {
  type: 'point';
  markerColor: string;
}

export interface RouteEntityDto extends MissionEntityBaseDto {
  type: 'route';
  path: LonLatCoordinate[];
  colorCode: string;
}

export interface PolygonEntityDto extends MissionEntityBaseDto {
  type: 'polygon';
  ring: LonLatCoordinate[];
  fillColor: string;
  strokeColor: string;
}

export type MissionEntityDto =
  | CircleEntityDto
  | DoubleCircleEntityDto
  | PointEntityDto
  | RouteEntityDto
  | PolygonEntityDto;

export interface MissionDto {
  missionId: string;
  entities: MissionEntityDto[];
}

export function isCircleEntity(entity: MissionEntityDto): entity is CircleEntityDto {
  return entity.type === 'circle';
}

export function isStandardEntity(
  entity: MissionEntityDto,
): entity is Exclude<MissionEntityDto, CircleEntityDto> {
  return entity.type !== 'circle';
}
