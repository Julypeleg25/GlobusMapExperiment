import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import type { StyleFunction } from 'ol/style/Style';

export function createLabelStyle(): StyleFunction {
  const cache = new Map<string, Style>();

  return (feature) => {
    const label = String(feature.get('label') ?? '');
    const cachedStyle = cache.get(label);
    if (cachedStyle) {
      return cachedStyle;
    }

    const style = new Style({
      text: new Text({
        text: label,
        font: '600 12px "Trebuchet MS", "Segoe UI", sans-serif',
        offsetY: -18,
        padding: [4, 6, 4, 6],
        fill: new Fill({ color: '#102a43' }),
        backgroundFill: new Fill({ color: 'rgba(255,255,255,0.88)' }),
        stroke: new Stroke({ color: 'rgba(255,255,255,0.95)', width: 2 }),
        overflow: true,
      }),
    });

    cache.set(label, style);
    return style;
  };
}
