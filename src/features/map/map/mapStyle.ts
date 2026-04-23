import type { FlatStyle, FlatStyleLike } from 'ol/style/flat';
import { getCircleCenterIconSrc } from './imageMarkerStyle';

const transparentInteractiveFill = 'rgba(255,255,255,0.01)';
const bulkCircleOutlineStyle: FlatStyle = {
  'circle-radius': ['get', 'radius'],
  'circle-fill-color': transparentInteractiveFill,
  'circle-stroke-color': ['get', 'colorCode'],
  'circle-stroke-width': 1.8,
  'circle-opacity': 1,
};

export function createBulkWebglStyle(): FlatStyleLike {
  return [bulkCircleOutlineStyle, createCenterIconStyle()];
}

function createCenterIconStyle(): FlatStyle {
  // Kept as a helper so the same center-icon style can be reused consistently.
  return {
    'icon-src': getCircleCenterIconSrc(),
    'icon-anchor': [0.5, 0.5],
    'icon-anchor-x-units': 'fraction',
    'icon-anchor-y-units': 'fraction',
    'icon-scale': 0.72,
    'icon-opacity': 0.96,
  };
}
