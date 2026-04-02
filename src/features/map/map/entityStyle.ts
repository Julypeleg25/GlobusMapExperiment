import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import CircleStyle from 'ol/style/Circle';
import type { StyleFunction } from 'ol/style/Style';
import type { FeatureLike } from 'ol/Feature';

export function createEntityStyle(): StyleFunction {
  return (feature) => createStyles(feature, false);
}

export function createSelectedEntityStyle(): StyleFunction {
  return (feature) => createStyles(feature, true);
}

function createStyles(feature: FeatureLike, selected: boolean): Style | Style[] {
  const renderRole = String(feature.get('renderRole') ?? '');
  const colorCode = String(feature.get('colorCode') ?? '#5c677d');
  const strokeColor = String(feature.get('strokeColor') ?? colorCode);
  const fillColor = String(feature.get('fillColor') ?? 'rgba(92,103,125,0.18)');
  const haloColor = selected ? 'rgba(245,158,11,0.95)' : 'rgba(16,42,67,0.75)';

  switch (renderRole) {
    case 'circle':
      return new Style({
        image: new CircleStyle({
          radius: Number(feature.get('radius') ?? 8) + (selected ? 4 : 0),
          fill: new Fill({ color: selected ? colorCode : `${colorCode}` }),
          stroke: new Stroke({ color: selected ? haloColor : '#1f2937', width: selected ? 3 : 1.5 }),
        }),
      });
    case 'point':
      return new Style({
        image: new CircleStyle({
          radius: selected ? 10 : 7,
          fill: new Fill({ color: colorCode }),
          stroke: new Stroke({ color: selected ? haloColor : '#ffffff', width: selected ? 3 : 2 }),
        }),
      });
    case 'doubleCircle':
      return [
        new Style({
          image: new CircleStyle({
            radius: Number(feature.get('outerRadius') ?? 12) + (selected ? 3 : 0),
            fill: new Fill({ color: 'rgba(255,255,255,0.04)' }),
            stroke: new Stroke({ color: selected ? haloColor : colorCode, width: selected ? 3 : 2 }),
          }),
        }),
        new Style({
          image: new CircleStyle({
            radius: Number(feature.get('innerRadius') ?? 6) + (selected ? 2 : 0),
            fill: new Fill({ color: selected ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.08)' }),
            stroke: new Stroke({ color: selected ? '#f59e0b' : colorCode, width: selected ? 3 : 2 }),
          }),
        }),
      ];
    case 'routeLine':
      return new Style({
        stroke: new Stroke({
          color: selected ? haloColor : colorCode,
          width: selected ? 5 : 3,
          lineDash: selected ? undefined : [10, 8],
        }),
      });
    case 'routeVertex':
      return new Style({
        image: new CircleStyle({
          radius: selected ? 7 : 4,
          fill: new Fill({ color: '#ffffff' }),
          stroke: new Stroke({ color: selected ? haloColor : colorCode, width: selected ? 3 : 2 }),
        }),
      });
    case 'polygon':
      return new Style({
        fill: new Fill({ color: selected ? 'rgba(245,158,11,0.2)' : fillColor }),
        stroke: new Stroke({ color: selected ? haloColor : strokeColor, width: selected ? 4 : 2 }),
      });
    default:
      return new Style({
        stroke: new Stroke({ color: haloColor, width: 3 }),
      });
  }
}
