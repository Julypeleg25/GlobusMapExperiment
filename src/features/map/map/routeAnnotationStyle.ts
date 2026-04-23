import type { FeatureLike } from 'ol/Feature';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import type { StyleFunction } from 'ol/style/Style';

const annotationStyleCache = new Map<string, Style>();

export function createRouteAnnotationStyle(): StyleFunction {
  return (feature: FeatureLike) => {
    const label = String(feature.get('label') ?? '');
    const colorCode = String(feature.get('colorCode') ?? '#1d4ed8');
    const cacheKey = `${label}-${colorCode}`;
    const cachedStyle = annotationStyleCache.get(cacheKey);
    if (cachedStyle) {
      return cachedStyle;
    }

    const style = new Style({
      stroke: new Stroke({
        color: colorCode,
        width: 1.8,
        lineCap: 'round',
      }),
      text: new Text({
        text: label,
        font: '700 10px "Trebuchet MS", "Segoe UI", sans-serif',
        offsetY: -10,
        padding: [2, 4, 2, 4],
        stroke: new Stroke({ color: 'rgba(255,255,255,0.98)', width: 2 }),
        overflow: true,
      }),
    });

    annotationStyleCache.set(cacheKey, style);
    return style;
  };
}
