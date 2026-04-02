import type { LonLatCoordinate } from '@shared/types/mission.types';

export interface ImageMarkerRecord {
  id: string;
  coordinate: LonLatCoordinate;
  iconVariant: 'amber' | 'cyan' | 'red';
}

const israelBounds = {
  minLon: 34.2,
  maxLon: 35.85,
  minLat: 29.55,
  maxLat: 33.3,
};

const overlapCenters = [
  { lon: 34.7818, lat: 32.0853 },
  { lon: 35.2137, lat: 31.7683 },
  { lon: 34.9896, lat: 32.794 },
  { lon: 34.7913, lat: 31.252 },
  { lon: 34.9519, lat: 29.5577 },
] as const;

const imageMarkerCount = 7000;
const iconVariants = ['amber', 'cyan', 'red'] as const;
const gridColumns = 100;
const gridRows = 70;
const overlapCount = 1400;

export function createImageMarkerRecords(seedInput: string): ImageMarkerRecord[] {
  const random = createSeededRandom(`image-markers-${seedInput}`);
  const records: ImageMarkerRecord[] = [];
  const lonStep = (israelBounds.maxLon - israelBounds.minLon) / gridColumns;
  const latStep = (israelBounds.maxLat - israelBounds.minLat) / gridRows;
  const gridCount = imageMarkerCount - overlapCount;

  for (let index = 0; index < gridCount; index += 1) {
    const column = index % gridColumns;
    const row = Math.floor(index / gridColumns) % gridRows;
    const lon =
      israelBounds.minLon + column * lonStep + lonStep * (0.15 + random() * 0.7);
    const lat =
      israelBounds.minLat + row * latStep + latStep * (0.15 + random() * 0.7);

    records.push(createMarkerRecord(index + 1, lon, lat, index));
  }

  for (let index = 0; index < overlapCount; index += 1) {
    const center = overlapCenters[index % overlapCenters.length];
    const lon = center.lon + (random() - 0.5) * 0.01;
    const lat = center.lat + (random() - 0.5) * 0.01;

    records.push(createMarkerRecord(gridCount + index + 1, lon, lat, gridCount + index));
  }

  return records;
}

function createMarkerRecord(
  id: number,
  lon: number,
  lat: number,
  variantIndex: number,
): ImageMarkerRecord {
  return {
    id: `image-marker-${id}`,
    coordinate: [lon, lat],
    iconVariant: iconVariants[variantIndex % iconVariants.length],
  };
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
