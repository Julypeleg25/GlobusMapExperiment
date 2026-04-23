import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FeatureLike } from 'ol/Feature';
import type Map from 'ol/Map';
import type { Pixel } from 'ol/pixel';
import type { MapSources } from '../map/createSources';
import { mapAircraftLinkToFeatures, mapAircraftToFeatures } from '../map/featureMappers';
import {
  advanceAircraftFleet,
  createAircraftFleet,
  createAircraftLink,
  projectAircraftFleet,
  type AircraftSnapshot,
  type AircraftTrack,
} from '../model/airTraffic';

interface UseAirTrafficResult {
  selectedAircraft: AircraftSnapshot | null;
  mainAircraft: AircraftSnapshot | null;
  clearSelectedAircraft: () => void;
  handlePlaneClick: (pixel: Pixel) => boolean;
}

const aircraftUpdateIntervalMs = 1000 / 12;
const hudRefreshIntervalMs = 500;

export function useAirTraffic(
  map: Map | null,
  sources: MapSources | null,
): UseAirTrafficResult {
  const fleetRef = useRef<AircraftTrack[]>(createAircraftFleet());
  const snapshotsRef = useRef<AircraftSnapshot[]>([]);
  const animationFrameRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastHudRefreshTimeRef = useRef(0);
  const selectedAircraftIdRef = useRef<string | null>(null);
  const selectedAircraftStateRef = useRef<AircraftSnapshot | null>(null);
  const mainAircraftStateRef = useRef<AircraftSnapshot | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftSnapshot | null>(null);
  const [mainAircraft, setMainAircraft] = useState<AircraftSnapshot | null>(null);

  const renderFleet = useCallback(
    (
      focusedAircraftId: string | null,
      timestamp = performance.now(),
      forceHudRefresh = false,
    ) => {
      if (!sources) {
        return;
      }

      const snapshots = projectAircraftFleet(fleetRef.current, focusedAircraftId);
      snapshotsRef.current = snapshots;
      const leadAircraft = snapshots.find((aircraft) => aircraft.role === 'lead') ?? null;
      const focusedAircraft =
        snapshots.find((aircraft) => aircraft.id === focusedAircraftId) ?? null;
      const link = createAircraftLink(snapshots, focusedAircraftId);

      sources.aircraftSource.clear();
      sources.aircraftSource.addFeatures(mapAircraftToFeatures(snapshots));

      sources.aircraftLinksSource.clear();
      sources.aircraftLinksSource.addFeatures(mapAircraftLinkToFeatures(link));

      if ((leadAircraft?.id ?? null) !== (mainAircraftStateRef.current?.id ?? null)) {
        mainAircraftStateRef.current = leadAircraft;
        setMainAircraft(leadAircraft);
      }

      if (!focusedAircraft) {
        if (selectedAircraftStateRef.current) {
          selectedAircraftStateRef.current = null;
          setSelectedAircraft(null);
        }
        lastHudRefreshTimeRef.current = timestamp;
        return;
      }

      const shouldRefreshHud =
        forceHudRefresh ||
        selectedAircraftStateRef.current?.id !== focusedAircraft.id ||
        timestamp - lastHudRefreshTimeRef.current >= hudRefreshIntervalMs;

      if (shouldRefreshHud) {
        selectedAircraftStateRef.current = focusedAircraft;
        lastHudRefreshTimeRef.current = timestamp;
        setSelectedAircraft(focusedAircraft);
      }
    },
    [sources],
  );

  useEffect(() => {
    if (!sources) {
      return;
    }

    renderFleet(selectedAircraftIdRef.current, performance.now(), true);

    const animate = (timestamp: number) => {
      if (lastFrameTimeRef.current == null) {
        lastFrameTimeRef.current = timestamp;
        animationFrameRef.current = window.requestAnimationFrame(animate);
        return;
      }

      const lastTimestamp = lastFrameTimeRef.current;
      const elapsedMs = timestamp - lastTimestamp;

      if (elapsedMs >= aircraftUpdateIntervalMs) {
        const deltaSeconds = Math.min(elapsedMs / 1000, 0.08);
        lastFrameTimeRef.current = timestamp;
        fleetRef.current = advanceAircraftFleet(fleetRef.current, deltaSeconds);
        renderFleet(selectedAircraftIdRef.current, timestamp);
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      lastFrameTimeRef.current = null;
      lastHudRefreshTimeRef.current = 0;
      selectedAircraftStateRef.current = null;
      mainAircraftStateRef.current = null;
      sources.aircraftSource.clear();
      sources.aircraftLinksSource.clear();
    };
  }, [renderFleet, sources]);

  const clearSelectedAircraft = useCallback(() => {
    selectedAircraftIdRef.current = null;
    renderFleet(null, performance.now(), true);
  }, [renderFleet]);

  const handlePlaneClick = useCallback(
    (pixel: Pixel) => {
      if (!map) {
        return false;
      }

      const aircraftId =
        map.forEachFeatureAtPixel(
          pixel,
          (feature, layer) => {
            if (layer?.get('interactiveRole') !== 'aircraft') {
              return null;
            }

            return resolveAircraftId(feature);
          },
          {
            hitTolerance: 10,
            layerFilter: (layer) => layer.get('interactiveRole') === 'aircraft',
          },
        ) ?? null;

      if (!aircraftId) {
        return false;
      }

      selectedAircraftIdRef.current = aircraftId;
      renderFleet(aircraftId, performance.now(), true);
      return true;
    },
    [map, renderFleet],
  );

  return useMemo(
    () => ({
      selectedAircraft,
      mainAircraft,
      clearSelectedAircraft,
      handlePlaneClick,
    }),
    [clearSelectedAircraft, handlePlaneClick, mainAircraft, selectedAircraft],
  );
}

function resolveAircraftId(feature: FeatureLike): string | null {
  const aircraftId = feature.get('aircraftId');
  return typeof aircraftId === 'string' ? aircraftId : null;
}
