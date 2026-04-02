import { useEffect, useMemo } from 'react';
import { createImageMarkerRecords } from '../map/imageMarkerFeatures';
import { mapImageMarkersToFeatures } from '../map/featureMappers';
import type { MapSources } from '../map/createSources';

interface ImageMarkersCanvasProps {
  sources: MapSources | null;
  missionId: string | null;
}

export function ImageMarkersCanvas({ sources, missionId }: ImageMarkersCanvasProps) {
  const markerRecords = useMemo(
    () => createImageMarkerRecords(missionId ?? 'default'),
    [missionId],
  );

  useEffect(() => {
    if (!sources) {
      return;
    }

    sources.imageMarkersSource.clear();
    sources.imageMarkersSource.addFeatures(mapImageMarkersToFeatures(markerRecords));
  }, [markerRecords, sources]);

  return null;
}
