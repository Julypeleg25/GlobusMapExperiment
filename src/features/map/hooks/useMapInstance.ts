import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import { unByKey } from 'ol/Observable';
import type { EventsKey } from 'ol/events';
import type { MenuOverlayApi, MenuOverlayState } from '../map/menuOverlay';
import { createLayers, type MapLayers } from '../map/createLayers';
import { createMap } from '../map/createMap';
import { createSources, type MapSources } from '../map/createSources';

const initialZoom = 7.3;

export function useMapInstance() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [sources, setSources] = useState<MapSources | null>(null);
  const [layers, setLayers] = useState<MapLayers | null>(null);
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

      const pixel = currentMap.getPixelFromCoordinate(fromLonLat(currentState.lngLat));
      const nextPosition = { x: pixel[0], y: pixel[1] };
      if (
        currentState.screenPosition &&
        Math.round(currentState.screenPosition.x) === Math.round(nextPosition.x) &&
        Math.round(currentState.screenPosition.y) === Math.round(nextPosition.y)
      ) {
        return currentState;
      }

      return {
        ...currentState,
        screenPosition: nextPosition,
      };
    });
  }, []);

  const showMenuAt = useCallback((lngLat: [number, number]) => {
    const currentMap = mapRef.current;
    if (!currentMap) {
      return;
    }

    const pixel = currentMap.getPixelFromCoordinate(fromLonLat(lngLat));
    setMenuState({
      isOpen: true,
      lngLat,
      screenPosition: { x: pixel[0], y: pixel[1] },
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    containerRef.current.tabIndex = 0;
    const nextSources = createSources();
    const nextLayers = createLayers(nextSources);
    const nextMap = createMap(containerRef.current, nextLayers);
    const view = nextMap.getView();
    const eventKeys: EventsKey[] = [
      view.on('change:resolution', () => {
        setZoom(view.getZoom() ?? initialZoom);
        syncMenuPosition();
      }),
      view.on('change:center', syncMenuPosition),
    ];

    mapRef.current = nextMap;
    setMap(nextMap);
    setSources(nextSources);
    setLayers(nextLayers);
    setZoom(view.getZoom() ?? initialZoom);

    return () => {
      unByKey(eventKeys);
      hideMenu();
      nextMap.setTarget(undefined);
      for (const layer of Object.values(nextLayers)) {
        layer.dispose();
      }
      mapRef.current = null;
      setMap(null);
      setSources(null);
      setLayers(null);
    };
  }, [hideMenu, syncMenuPosition]);

  const menu = useMemo<MenuOverlayApi>(
    () => ({
      state: menuState,
      showAt: showMenuAt,
      hide: hideMenu,
    }),
    [menuState, showMenuAt, hideMenu],
  );

  return { containerRef, map, sources, layers, zoom, menu };
}
