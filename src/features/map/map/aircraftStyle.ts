import type { FeatureLike } from 'ol/Feature';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import type { StyleFunction } from 'ol/style/Style';

const styleCache = new Map<string, Style>();

export function createAircraftStyle(): StyleFunction {
  return (feature: FeatureLike) => {
    const color = String(feature.get('colorCode') ?? '#22c55e');
    const isFocused = Boolean(feature.get('isFocused'));
    const role = String(feature.get('planeRole') ?? 'wing');
    const headingRad = Number(feature.get('headingRad') ?? 0);
    const cacheKey = `${role}-${isFocused ? 'focused' : 'normal'}-${color}-${headingRad.toFixed(2)}`;
    const cached = styleCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const style = new Style({
      image: new Icon({
        src: createAircraftSvgDataUri(isFocused ? '#22d3ee' : role === 'lead' ? '#f59e0b' : color),
        anchor: [0.5, 0.5],
        rotation: headingRad,
        scale: isFocused ? 0.92 : role === 'lead' ? 0.82 : 0.72,
      }),
    });

    styleCache.set(cacheKey, style);
    return style;
  };
}

function createAircraftSvgDataUri(color: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
      <path d="M15 2.8 18.5 11.2 27.2 15 18.5 18.8 15 27.2 11.5 18.8 2.8 15 11.5 11.2Z"
        fill="${color}" stroke="white" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="15" cy="15" r="2.1" fill="rgba(255,255,255,0.7)"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
