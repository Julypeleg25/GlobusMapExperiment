import type { FeatureLike } from 'ol/Feature';
import type { StyleFunction } from 'ol/style/Style';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';

const iconStyleCache = new Map<string, Style>();
const iconSourceCache = new Map<string, string>();
const centeredIconSourceCache = new Map<string, string>();
let circleCenterIconSource: string | null = null;

export function createImageMarkerStyle(): StyleFunction {
  return (feature: FeatureLike) => {
    const variant = String(feature.get('iconVariant') ?? 'amber');
    const cached = iconStyleCache.get(variant);
    if (cached) {
      return cached;
    }

    const style = new Style({
      image: new Icon({
        src: getImageMarkerIconSrc(variant),
        anchor: [0.5, 1],
        scale: 0.22,
      }),
    });

    iconStyleCache.set(variant, style);
    return style;
  };
}

export function getImageMarkerIconSrc(variant: string): string {
  const cached = iconSourceCache.get(variant);
  if (cached) {
    return cached;
  }

  const iconSource = createSvgDataUri(getVariantConfig(variant));
  iconSourceCache.set(variant, iconSource);
  return iconSource;
}

export function getCenteredMarkerIconSrc(variant: string): string {
  const cached = centeredIconSourceCache.get(variant);
  if (cached) {
    return cached;
  }

  const iconSource = createCenteredSvgDataUri(getVariantConfig(variant));
  centeredIconSourceCache.set(variant, iconSource);
  return iconSource;
}

export function getCircleCenterIconSrc(): string {
  if (circleCenterIconSource) {
    return circleCenterIconSource;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="2.3" fill="none" stroke="white" stroke-width="2.8"/>
      <path d="M9 1.7v3.1M9 13.2v3.1M1.7 9h3.1M13.2 9h3.1" stroke="white" stroke-width="2.8" stroke-linecap="round"/>
      <circle cx="9" cy="9" r="2.3" fill="none" stroke="#0f172a" stroke-width="1.3"/>
      <path d="M9 1.7v3.1M9 13.2v3.1M1.7 9h3.1M13.2 9h3.1" stroke="#0f172a" stroke-width="1.3" stroke-linecap="round"/>
    </svg>
  `.trim();

  circleCenterIconSource = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return circleCenterIconSource;
}

function getVariantConfig(variant: string): {
  fill: string;
  stroke: string;
  glyph: string;
} {
  switch (variant) {
    case 'cyan':
      return { fill: '#118ab2', stroke: '#073b4c', glyph: '#d9f6ff' };
    case 'red':
      return { fill: '#ef476f', stroke: '#7a1630', glyph: '#ffe1e8' };
    default:
      return { fill: '#ff9f1c', stroke: '#8c4f00', glyph: '#fff3db' };
  }
}

function createSvgDataUri(config: {
  fill: string;
  stroke: string;
  glyph: string;
}): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">
      <path d="M13 1.5C6.65 1.5 1.5 6.65 1.5 13c0 9.14 11.5 19.5 11.5 19.5S24.5 22.14 24.5 13C24.5 6.65 19.35 1.5 13 1.5Z"
        fill="${config.fill}" stroke="${config.stroke}" stroke-width="2"/>
      <circle cx="13" cy="13" r="5.3" fill="${config.glyph}" opacity="0.96"/>
      <path d="M13 9.4v7.2M9.4 13h7.2" stroke="${config.stroke}" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createCenteredSvgDataUri(config: {
  fill: string;
  stroke: string;
  glyph: string;
}): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="8.2" fill="${config.fill}" stroke="${config.stroke}" stroke-width="2"/>
      <path d="M11 6.4v9.2M6.4 11h9.2" stroke="${config.glyph}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="11" cy="11" r="1.6" fill="${config.stroke}" opacity="0.84"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
