import type {
  CircleEntityDto,
  DoubleCircleEntityDto,
  LonLatCoordinate,
  MissionCategory,
  MissionDto,
  MissionEntityDto,
  MissionStatus,
  PointEntityDto,
  PolygonEntityDto,
  RouteEntityDto,
} from '@shared/types/mission.types';

interface Hub {
  name: string;
  lon: number;
  lat: number;
}

const bulkCircleCount = 5000;
const routeCount = 12;
const polygonCount = 18;
const pointCount = 28;
const doubleCircleCount = 20;
const categories: MissionCategory[] = ['friendly', 'neutral', 'hostile'];
const statuses: MissionStatus[] = ['active', 'idle', 'planned'];
const israelHubs: Hub[] = [
  { name: 'Haifa', lon: 34.9896, lat: 32.794 },
  { name: 'Acre', lon: 35.0818, lat: 32.9281 },
  { name: 'Tiberias', lon: 35.5312, lat: 32.794 },
  { name: 'Nazareth', lon: 35.3035, lat: 32.6996 },
  { name: 'Tel Aviv', lon: 34.7818, lat: 32.0853 },
  { name: 'Netanya', lon: 34.8563, lat: 32.3215 },
  { name: 'Jerusalem', lon: 35.2137, lat: 31.7683 },
  { name: 'Ashdod', lon: 34.6553, lat: 31.8044 },
  { name: 'Beersheba', lon: 34.7913, lat: 31.252 },
  { name: 'Arad', lon: 35.2192, lat: 31.2611 },
  { name: 'Mitzpe Ramon', lon: 34.8019, lat: 30.6093 },
  { name: 'Eilat', lon: 34.9519, lat: 29.5577 },
];
const categoryPalette: Record<MissionCategory, string> = {
  friendly: '#1971c2',
  neutral: '#f08c00',
  hostile: '#c92a2a',
};
const polygonPalette: Record<MissionCategory, { fill: string; stroke: string }> = {
  friendly: { fill: 'rgba(25,113,194,0.18)', stroke: '#1971c2' },
  neutral: { fill: 'rgba(240,140,0,0.18)', stroke: '#f08c00' },
  hostile: { fill: 'rgba(201,42,42,0.18)', stroke: '#c92a2a' },
};
const israelCenter: LonLatCoordinate = [35.0, 31.4];

export async function getMission(missionId: string): Promise<MissionDto> {
  await sleep(180);

  return {
    missionId,
    entities: [
      ...createCircleEntities(missionId),
      ...createDoubleCircleEntities(missionId),
      ...createPointEntities(missionId),
      ...createRouteEntities(missionId),
      ...createPolygonEntities(missionId),
    ],
  };
}

function createCircleEntities(seedInput: string): CircleEntityDto[] {
  const random = createSeededRandom(`circles-${seedInput}`);
  const entities: CircleEntityDto[] = [];
  const gridColumns = 50;
  const gridRows = 70;
  const overlapCount = 1800;
  const gridCount = bulkCircleCount - overlapCount;
  const lonStep = (35.85 - 34.2) / gridColumns;
  const latStep = (33.3 - 29.55) / gridRows;

  for (let index = 0; index < gridCount; index += 1) {
    const column = index % gridColumns;
    const row = Math.floor(index / gridColumns) % gridRows;
    const category = categories[index % categories.length];
    const status = statuses[index % statuses.length];
    const lon = 34.2 + column * lonStep + lonStep * (0.12 + random() * 0.76);
    const lat = 29.55 + row * latStep + latStep * (0.12 + random() * 0.76);

    entities.push({
      id: `circle-${index + 1}`,
      type: 'circle',
      lon,
      lat,
      label: `Israel Circle ${index + 1}`,
      category,
      status,
      priority: (index % 5) + 1,
      radius: 11 + Math.round(random() * 12),
      colorCode: withAlpha(categoryPalette[category], 0.66),
    });
  }

  for (let index = 0; index < overlapCount; index += 1) {
    const hub = israelHubs[index % israelHubs.length];
    const category = categories[(gridCount + index) % categories.length];
    const status = statuses[(gridCount + index) % statuses.length];
    const [lon, lat] = createPointNearHub(hub, random, 0.045, 0.035);

    entities.push({
      id: `circle-${gridCount + index + 1}`,
      type: 'circle',
      lon,
      lat,
      label: `${hub.name} Cluster ${index + 1}`,
      category,
      status,
      priority: ((gridCount + index) % 5) + 1,
      radius: 15 + Math.round(random() * 16),
      colorCode: withAlpha(categoryPalette[category], 0.7),
    });
  }

  return entities;
}

function createDoubleCircleEntities(seedInput: string): DoubleCircleEntityDto[] {
  const random = createSeededRandom(`double-circles-${seedInput}`);

  return Array.from({ length: doubleCircleCount }, (_, index) => {
    const hub = israelHubs[(index * 2) % israelHubs.length];
    const category = categories[(index + 1) % categories.length];
    const status = statuses[(index + 2) % statuses.length];
    const [lon, lat] = createPointNearHub(hub, random, 0.12, 0.09);

    return {
      id: `double-circle-${index + 1}`,
      type: 'doubleCircle',
      lon,
      lat,
      label: `${hub.name} Ring ${index + 1}`,
      category,
      status,
      priority: 2 + (index % 4),
      innerRadius: 6 + (index % 4),
      outerRadius: 12 + (index % 5),
      colorCode: categoryPalette[category],
    };
  });
}

function createPointEntities(seedInput: string): PointEntityDto[] {
  const random = createSeededRandom(`points-${seedInput}`);

  return Array.from({ length: pointCount }, (_, index) => {
    const hub = israelHubs[(index * 3) % israelHubs.length];
    const category = categories[(index + 2) % categories.length];
    const status = statuses[index % statuses.length];
    const [lon, lat] = createPointNearHub(hub, random, 0.11, 0.08);

    return {
      id: `point-${index + 1}`,
      type: 'point',
      lon,
      lat,
      label: `${hub.name} Point ${index + 1}`,
      category,
      status,
      priority: 1 + (index % 5),
      markerColor: categoryPalette[category],
    };
  });
}

function createRouteEntities(seedInput: string): RouteEntityDto[] {
  const random = createSeededRandom(`routes-${seedInput}`);

  return Array.from({ length: routeCount }, (_, index) => {
    const startHub = israelHubs[index % israelHubs.length];
    const endHub = israelHubs[(index + 4) % israelHubs.length];
    const category = categories[index % categories.length];
    const status = statuses[(index + 1) % statuses.length];
    const path = createRoutePath(startHub, endHub, random);
    const midpoint = path[Math.floor(path.length / 2)];

    return {
      id: `route-${index + 1}`,
      type: 'route',
      lon: midpoint[0],
      lat: midpoint[1],
      label: `${startHub.name} to ${endHub.name}`,
      category,
      status,
      priority: 2 + (index % 4),
      path,
      colorCode: categoryPalette[category],
    };
  });
}

function createPolygonEntities(seedInput: string): PolygonEntityDto[] {
  const random = createSeededRandom(`polygons-${seedInput}`);

  return Array.from({ length: polygonCount }, (_, index) => {
    const hub = israelHubs[(index + 5) % israelHubs.length];
    const category = categories[(index + 1) % categories.length];
    const status = statuses[index % statuses.length];
    const [lon, lat] = createPointNearHub(hub, random, 0.09, 0.07);
    const ring = createPolygonRing([lon, lat], random);
    const palette = polygonPalette[category];

    return {
      id: `polygon-${index + 1}`,
      type: 'polygon',
      lon,
      lat,
      label: `${hub.name} Sector ${index + 1}`,
      category,
      status,
      priority: 2 + (index % 3),
      ring,
      fillColor: palette.fill,
      strokeColor: palette.stroke,
    };
  });
}

function createPointNearHub(
  hub: Hub,
  random: () => number,
  lonSpread: number,
  latSpread: number,
): LonLatCoordinate {
  const lon = clamp(hub.lon + (random() - 0.5) * lonSpread, 34.15, 35.9);
  const lat = clamp(hub.lat + (random() - 0.5) * latSpread, 29.5, 33.35);
  return [lon, lat];
}

function createRoutePath(
  startHub: Hub,
  endHub: Hub,
  random: () => number,
): LonLatCoordinate[] {
  const path: LonLatCoordinate[] = [[startHub.lon, startHub.lat]];
  const segments = 4;

  for (let step = 1; step < segments; step += 1) {
    const t = step / segments;
    const lon = interpolate(startHub.lon, endHub.lon, t) + (random() - 0.5) * 0.18;
    const lat = interpolate(startHub.lat, endHub.lat, t) + (random() - 0.5) * 0.14;
    path.push([
      clamp(lon, 34.15, 35.9),
      clamp(lat, 29.5, 33.35),
    ]);
  }

  path.push([endHub.lon, endHub.lat]);
  return path;
}

function createPolygonRing(
  center: LonLatCoordinate,
  random: () => number,
): LonLatCoordinate[] {
  const [centerLon, centerLat] = center;
  const halfWidth = 0.03 + random() * 0.025;
  const halfHeight = 0.02 + random() * 0.02;

  return [
    [centerLon - halfWidth, centerLat - halfHeight],
    [centerLon + halfWidth * 0.8, centerLat - halfHeight * 0.9],
    [centerLon + halfWidth, centerLat + halfHeight * 0.7],
    [centerLon - halfWidth * 0.7, centerLat + halfHeight],
    [centerLon - halfWidth, centerLat - halfHeight],
  ];
}

function withAlpha(hexColor: string, alpha: number): string {
  const safeAlpha = Math.max(0, Math.min(alpha, 1));
  const alphaHex = Math.round(safeAlpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hexColor}${alphaHex}`;
}

function createSeededRandom(seedInput: string): () => number {
  let seed = 0;

  for (const character of seedInput) {
    seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
  }

  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function interpolate(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sleep(durationMs: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs));
}
