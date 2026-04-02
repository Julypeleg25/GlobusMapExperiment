import type { FlatStyle, FlatStyleLike } from 'ol/style/flat';
import { getImageMarkerIconSrc } from './imageMarkerStyle';

const selectedHaloFill = 'rgba(245,158,11,0.16)';
const selectedHaloStroke = 'rgba(245,158,11,0.96)';

export function createEntityWebglStyle(): FlatStyleLike {
  return [
    {
      filter: ['==', ['get', 'renderRole'], 'point'],
      style: {
        'circle-radius': 7,
        'circle-fill-color': ['get', 'colorCode'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    },
    {
      filter: ['==', ['get', 'renderRole'], 'doubleCircle'],
      style: [
        {
          'circle-radius': ['get', 'outerRadius'],
          'circle-fill-color': 'rgba(255,255,255,0.04)',
          'circle-stroke-color': ['get', 'colorCode'],
          'circle-stroke-width': 2,
        },
        {
          'circle-radius': ['get', 'innerRadius'],
          'circle-fill-color': 'rgba(255,255,255,0.08)',
          'circle-stroke-color': ['get', 'colorCode'],
          'circle-stroke-width': 2,
        },
        {
          'shape-points': 4,
          'shape-radius': 4.5,
          'shape-angle': Math.PI / 4,
          'shape-fill-color': ['get', 'colorCode'],
          'shape-stroke-color': 'rgba(255,255,255,0.92)',
          'shape-stroke-width': 1.4,
        },
      ],
    },
    {
      filter: ['==', ['get', 'renderRole'], 'routeLine'],
      style: {
        'stroke-color': ['get', 'colorCode'],
        'stroke-width': 3,
        'stroke-line-cap': 'round',
        'stroke-line-join': 'round',
        'stroke-line-dash': [10, 8],
      },
    },
    {
      filter: ['==', ['get', 'renderRole'], 'routeVertex'],
      style: {
        'circle-radius': 4,
        'circle-fill-color': 'rgba(255,255,255,0)',
        'circle-stroke-color': ['get', 'colorCode'],
        'circle-stroke-width': 2,
      },
    },
    {
      filter: ['==', ['get', 'renderRole'], 'polygon'],
      style: {
        'fill-color': ['get', 'fillColor'],
        'stroke-color': ['get', 'strokeColor'],
        'stroke-width': 2,
      },
    },
  ];
}

export function createSelectedEntityWebglStyle(): FlatStyleLike {
  return [
    {
      filter: ['==', ['get', 'renderRole'], 'circle'],
      style: [
        {
          'circle-radius': ['+', ['get', 'radius'], 6],
          'circle-fill-color': selectedHaloFill,
          'circle-stroke-color': selectedHaloStroke,
          'circle-stroke-width': 3,
        },
        {
          'circle-radius': ['get', 'radius'],
          'circle-fill-color': ['get', 'colorCode'],
          'circle-stroke-color': '#1f2937',
          'circle-stroke-width': 1.5,
        },
      ],
    },
    {
      filter: ['==', ['get', 'renderRole'], 'point'],
      style: [
        {
          'circle-radius': 10,
          'circle-fill-color': selectedHaloFill,
          'circle-stroke-color': selectedHaloStroke,
          'circle-stroke-width': 3,
        },
        {
          'circle-radius': 7,
          'circle-fill-color': ['get', 'colorCode'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      ],
    },
    {
      filter: ['==', ['get', 'renderRole'], 'doubleCircle'],
      style: [
        {
          'circle-radius': ['+', ['get', 'outerRadius'], 3],
          'circle-fill-color': 'rgba(255,255,255,0.02)',
          'circle-stroke-color': selectedHaloStroke,
          'circle-stroke-width': 4,
        },
        {
          'circle-radius': ['+', ['get', 'innerRadius'], 2],
          'circle-fill-color': selectedHaloFill,
          'circle-stroke-color': selectedHaloStroke,
          'circle-stroke-width': 3,
        },
        {
          'shape-points': 4,
          'shape-radius': 5.5,
          'shape-angle': Math.PI / 4,
          'shape-fill-color': '#f59e0b',
          'shape-stroke-color': '#ffffff',
          'shape-stroke-width': 1.6,
        },
      ],
    },
    {
      filter: ['==', ['get', 'renderRole'], 'routeLine'],
      style: {
        'stroke-color': selectedHaloStroke,
        'stroke-width': 6,
        'stroke-line-cap': 'round',
        'stroke-line-join': 'round',
      },
    },
    {
      filter: ['==', ['get', 'renderRole'], 'routeVertex'],
      style: {
        'circle-radius': 7,
        'circle-fill-color': 'rgba(255,255,255,0)',
        'circle-stroke-color': selectedHaloStroke,
        'circle-stroke-width': 3,
      },
    },
    {
      filter: ['==', ['get', 'renderRole'], 'polygon'],
      style: {
        'fill-color': 'rgba(245,158,11,0.2)',
        'stroke-color': selectedHaloStroke,
        'stroke-width': 4,
      },
    },
  ];
}

export function createEditHandleWebglStyle(): FlatStyleLike {
  return [
    {
      filter: ['==', ['get', 'handleKind'], 'anchor'],
      style: {
        'circle-radius': 8,
        'circle-fill-color': '#ffffff',
        'circle-stroke-color': '#102a43',
        'circle-stroke-width': 3,
      },
    },
    {
      else: true,
      style: {
        'circle-radius': 7,
        'circle-fill-color': '#ffffff',
        'circle-stroke-color': '#f59e0b',
        'circle-stroke-width': 3,
      },
    },
  ];
}

export function createImageMarkerWebglStyle(): FlatStyleLike {
  return [
    {
      filter: ['==', ['get', 'iconVariant'], 'amber'],
      style: createImageMarkerIconStyle('amber'),
    },
    {
      filter: ['==', ['get', 'iconVariant'], 'cyan'],
      style: createImageMarkerIconStyle('cyan'),
    },
    {
      else: true,
      style: createImageMarkerIconStyle('red'),
    },
  ];
}

function createImageMarkerIconStyle(variant: 'amber' | 'cyan' | 'red') {
  const style: FlatStyle = {
    'icon-src': getImageMarkerIconSrc(variant),
    'icon-anchor': [0.5, 1],
    'icon-anchor-x-units': 'fraction',
    'icon-anchor-y-units': 'fraction',
    'icon-scale': 0.22,
    'icon-opacity': 0.95,
  };

  return style;
}
