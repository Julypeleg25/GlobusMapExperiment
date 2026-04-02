import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapboxOverlay } from '@deck.gl/mapbox';
import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import type { MenuOverlayApi, MenuOverlayState } from '../map/menuOverlay';

const initialCenter: [number, number] = [35.0, 31.4];
const initialZoom = 7.3;

export function useMapInstance() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [deckOverlay, setDeckOverlay] = useState<MapboxOverlay | null>(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [menuState, setMenuState] = useState<MenuOverlayState>({
    isOpen: false,
    lngLat: null,
    screenPosition: null,
  });

  const hideMenu = useCallback(() => {
    setMenuState({
      isOpen: false,
      lngLat: null,
      screenPosition: null,
    });
  }, []);

  const syncMenuPosition = useCallback(() => {
    const currentMap = mapRef.current;
    if (!currentMap) {
      return;
    }

    setMenuState((currentState) => {
      if (!currentState.isOpen || !currentState.lngLat) {
        return currentState;
      }

      const projected = currentMap.project({
        lng: currentState.lngLat[0],
        lat: currentState.lngLat[1],
      });

      return {
        ...currentState,
        screenPosition: { x: projected.x, y: projected.y },
      };
    });
  }, []);

  const showMenuAt = useCallback((lngLat: [number, number]) => {
    const currentMap = mapRef.current;
    if (!currentMap) return;

    const projected = currentMap.project({ lng: lngLat[0], lat: lngLat[1] });
    setMenuState({
      isOpen: true,
      lngLat,
      screenPosition: { x: projected.x, y: projected.y },
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const nextMap = new maplibregl.Map({
      container: containerRef.current,
      style: createBasemapStyle(),
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 5,
      maxZoom: 20,
      attributionControl: false,
      fadeDuration: 0,
    });

    const nextDeckOverlay = new MapboxOverlay({
      interleaved: false,
      useDevicePixels: false,
      layers: [],
    });

    const syncZoom = () => {
      setZoom(nextMap.getZoom());
    };

    nextMap.addControl(nextDeckOverlay);
    nextMap.on('load', syncZoom);
    nextMap.on('zoomend', syncZoom);
    nextMap.on('moveend', syncZoom);
    nextMap.on('move', syncMenuPosition);
    nextMap.on('zoom', syncMenuPosition);

    mapRef.current = nextMap;
    deckOverlayRef.current = nextDeckOverlay;
    setMap(nextMap);
    setDeckOverlay(nextDeckOverlay);

    return () => {
      nextMap.off('load', syncZoom);
      nextMap.off('zoomend', syncZoom);
      nextMap.off('moveend', syncZoom);
      nextMap.off('move', syncMenuPosition);
      nextMap.off('zoom', syncMenuPosition);
      nextMap.removeControl(nextDeckOverlay);
      nextMap.remove();
      mapRef.current = null;
      deckOverlayRef.current = null;
      setMap(null);
      setDeckOverlay(null);
    };
  }, [syncMenuPosition]);

  const menu = useMemo<MenuOverlayApi>(
    () => ({
      state: menuState,
      showAt: showMenuAt,
      hide: hideMenu,
    }),
    [menuState, showMenuAt, hideMenu],
  );

  return { containerRef, map, deckOverlay, zoom, menu };
}

function createBasemapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
      },
    ],
  };
}
