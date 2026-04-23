import type { FlatStyle, FlatStyleLike } from 'ol/style/flat';
import { getCircleCenterIconSrc, getCenteredMarkerIconSrc } from './imageMarkerStyle';

const selectedHaloFill = 'rgba(245,158,11,0.16)';
const selectedHaloStroke = 'rgba(245,158,11,0.96)';
const transparentInteractiveFill = 'rgba(255,255,255,0.01)';

export function createEntityWebglStyle(): FlatStyleLike {
  return [
    {
      filter: ['==', ['get', 'renderRole'], 'point'],
      style: {
        'circle-radius': 7,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    },
    {
      filter: ['==', ['get', 'renderRole'], 'doubleCircle'],
      style: [
        {
          'circle-radius': ['get', 'outerRadius'],
          'circle-fill-color': transparentInteractiveFill,
          'circle-stroke-color': ['get', 'colorCode'],
          'circle-stroke-width': 2.4,
        },
        {
          'circle-radius': ['get', 'innerRadius'],
          'circle-fill-color': transparentInteractiveFill,
          'circle-stroke-color': ['get', 'colorCode'],
          'circle-stroke-width': 2,
        },
        createCircleCenterIconStyle(),
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
        'circle-stroke-color': ['get', 'colorCode'],
        'circle-stroke-width': 2,
      },
    },
    {
      filter: ['==', ['get', 'renderRole'], 'routeDirectionMarker'],
      style: {
        'shape-points': 3,
        'shape-radius': 6,
        'shape-angle': ['-', ['get', 'headingRad'], Math.PI],
        'shape-stroke-color': 'rgba(255,255,255,0.78)',
        'shape-stroke-width': 1.2,
        'shape-opacity': 0.94,
      },
    },
    {
      filter: ['==', ['get', 'renderRole'], 'polygon'],
      style: {
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
        // First pass: a slightly larger halo ring to show selection.
        {
          'circle-radius': ['+', ['get', 'radius'], 5],
          'circle-fill-color': transparentInteractiveFill,
          'circle-stroke-color': selectedHaloStroke,
          'circle-stroke-width': 3,
        },
        // Second pass: redraw the real circle ring on top of the halo.
        {
          'circle-radius': ['get', 'radius'],
          'circle-fill-color': transparentInteractiveFill,
          'circle-stroke-color': ['get', 'colorCode'],
          'circle-stroke-width': 2.2,
        },
        createCircleCenterIconStyle(),
      ],
    },
    {
      filter: ['==', ['get', 'renderRole'], 'point'],
      style: [
        {
          'circle-radius': 10,
          'circle-stroke-color': selectedHaloStroke,
          'circle-stroke-width': 3,
        },
        {
          'circle-radius': 7,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      ],
    },
    {
      filter: ['==', ['get', 'renderRole'], 'doubleCircle'],
      style: [
        // First outer ring is not the "real" outer radius; it is a larger selection halo.
        {
          'circle-radius': ['+', ['get', 'outerRadius'], 3],
          'circle-fill-color': transparentInteractiveFill,
          'circle-stroke-color': selectedHaloStroke,
          'circle-stroke-width': 4,
        },
        // Second outer ring redraws the actual outer radius on top of the halo.
        {
          'circle-radius': ['get', 'outerRadius'],
          'circle-fill-color': transparentInteractiveFill,
          'circle-stroke-color': ['get', 'colorCode'],
          'circle-stroke-width': 2.4,
        },
        {
          'circle-radius': ['get', 'innerRadius'],
          'circle-fill-color': transparentInteractiveFill,
          'circle-stroke-color': ['get', 'colorCode'],
          'circle-stroke-width': 2,
        },
        createCircleCenterIconStyle(),
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
        'circle-stroke-color': selectedHaloStroke,
        'circle-stroke-width': 3,
      },
    },
    {
      filter: ['==', ['get', 'renderRole'], 'routeDirectionMarker'],
      style: {
        'shape-points': 3,
        'shape-radius': 7,
        'shape-angle': ['-', ['get', 'headingRad'], Math.PI],
        'shape-stroke-color': '#fff7ed',
        'shape-stroke-width': 1.4,
        'shape-opacity': 0.98,
      },
    },
    {
      filter: ['==', ['get', 'renderRole'], 'polygon'],
      style: {
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
        'circle-stroke-color': '#102a43',
        'circle-stroke-width': 3,
      },
    },
    {
      filter: ['==', ['get', 'handleKind'], 'vertex'],
      style: {
        'circle-radius': 7,
        'circle-stroke-color': '#ecfdf3',
        'circle-stroke-width': 2.5,
      },
    },
    {
      filter: ['==', ['get', 'handleKind'], 'midpoint'],
      style: {
        'circle-radius': 5.5,
        'circle-stroke-color': '#fee2e2',
        'circle-stroke-width': 2.2,
      },
    },
    {
      else: true,
      style: {
        'circle-radius': 7,
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

export function createAircraftLinkWebglStyle(): FlatStyleLike {
  return {
    'stroke-color': 'rgba(34,211,238,0.86)',
    'stroke-width': 2.4,
    'stroke-line-cap': 'round',
    'stroke-line-join': 'round',
    'stroke-line-dash': [8, 6],
  };
}

function createImageMarkerIconStyle(variant: 'amber' | 'cyan' | 'red') {
  const style: FlatStyle = {
    'icon-src': getCenteredMarkerIconSrc(variant),
    'icon-anchor': [0.5, 0.5],
    'icon-anchor-x-units': 'fraction',
    'icon-anchor-y-units': 'fraction',
    'icon-scale': 0.72,
    'icon-opacity': 0.97,
  };

  return style;
}

function createCircleCenterIconStyle(): FlatStyle {
  // Helper keeps the center-icon style identical anywhere we reuse it.
  return {
    'icon-src': getCircleCenterIconSrc(),
    'icon-anchor': [0.5, 0.5],
    'icon-anchor-x-units': 'fraction',
    'icon-anchor-y-units': 'fraction',
    'icon-scale': 0.72,
    'icon-opacity': 0.96,
  };
}
