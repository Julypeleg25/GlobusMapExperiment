export interface MenuScreenPosition {
  x: number;
  y: number;
}

export interface MenuOverlayState {
  isOpen: boolean;
  lngLat: [number, number] | null;
  screenPosition: MenuScreenPosition | null;
}

export interface MenuOverlayApi {
  state: MenuOverlayState;
  showAt: (lngLat: [number, number]) => void;
  hide: () => void;
}
