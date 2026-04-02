import type { FlatStyle } from 'ol/style/flat';

export function createBulkWebglStyle(): FlatStyle {
  return {
    'circle-radius': ['get', 'radius'],
    'circle-fill-color': ['get', 'colorCode'],
    'circle-opacity': 0.78,
    'circle-stroke-color': 'rgba(0,0,0,0)',
    'circle-stroke-width': 0,
  };
}
