import { useEffect, useMemo, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { createImageMarkerRecords } from '../map/imageMarkerFeatures';

interface ImageMarkersCanvasProps {
  map: MapLibreMap | null;
  missionId: string | null;
}

type SpriteVariant = 'amber' | 'cyan' | 'red';

const spriteSize = { width: 6, height: 8 };

export function ImageMarkersCanvas({ map, missionId }: ImageMarkersCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const markerRecords = useMemo(
    () => createImageMarkerRecords(missionId ?? 'default'),
    [missionId],
  );
  const sprites = useMemo(() => createSprites(), []);

  useEffect(() => {
    if (!map || !canvasRef.current) return;

    let animationFrameId = 0;

    const scheduleDraw = () => {
      if (animationFrameId) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = 0;
        drawRef.current?.();
      });
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = map.getContainer();
      const width = container.clientWidth;
      const height = container.clientHeight;
      const ratio = 1;
      const displayWidth = Math.max(1, Math.round(width));
      const displayHeight = Math.max(1, Math.round(height));
      const actualWidth = Math.round(displayWidth * ratio);
      const actualHeight = Math.round(displayHeight * ratio);

      if (canvas.width !== actualWidth || canvas.height !== actualHeight) {
        canvas.width = actualWidth;
        canvas.height = actualHeight;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
      }

      const context = canvas.getContext('2d');
      if (!context) return;

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, displayWidth, displayHeight);

      const zoom = map.getZoom();
      if (zoom < 7) {
        return;
      }

      const left = -spriteSize.width;
      const top = -spriteSize.height;
      const right = displayWidth + spriteSize.width;
      const bottom = displayHeight + spriteSize.height;

      for (const marker of markerRecords) {
        const pixel = map.project({
          lng: marker.coordinate[0],
          lat: marker.coordinate[1],
        });
        const x = pixel.x;
        const y = pixel.y;

        if (x < left || x > right || y < top || y > bottom) {
          continue;
        }

        context.drawImage(
          sprites[marker.iconVariant],
          Math.round(x - spriteSize.width / 2),
          Math.round(y - spriteSize.height),
          spriteSize.width,
          spriteSize.height,
        );
      }
    };
    drawRef.current = draw;

    const hideCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.style.opacity = '0';
    };

    const showAndDrawCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.style.opacity = '1';
      scheduleDraw();
    };

    showAndDrawCanvas();
    map.on('movestart', hideCanvas);
    map.on('moveend', showAndDrawCanvas);
    window.addEventListener('resize', showAndDrawCanvas);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      drawRef.current = null;
      map.off('movestart', hideCanvas);
      map.off('moveend', showAndDrawCanvas);
      window.removeEventListener('resize', showAndDrawCanvas);
    };
  }, [map, markerRecords, sprites]);

  return <canvas ref={canvasRef} className="image-markers-canvas" aria-hidden="true" />;
}

function createSprites(): Record<SpriteVariant, HTMLCanvasElement> {
  return {
    amber: createSprite({ fill: '#ff9f1c', stroke: '#8c4f00', glyph: '#fff3db' }),
    cyan: createSprite({ fill: '#118ab2', stroke: '#073b4c', glyph: '#d9f6ff' }),
    red: createSprite({ fill: '#ef476f', stroke: '#7a1630', glyph: '#ffe1e8' }),
  };
}

function createSprite(config: {
  fill: string;
  stroke: string;
  glyph: string;
}): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 12;
  canvas.height = 16;
  const context = canvas.getContext('2d');
  if (!context) {
    return canvas;
  }

  context.fillStyle = config.fill;
  context.strokeStyle = config.stroke;
  context.lineWidth = 1.25;
  context.beginPath();
  context.moveTo(6, 1);
  context.bezierCurveTo(3.3, 1, 1.2, 3.15, 1.2, 5.8);
  context.bezierCurveTo(1.2, 9.1, 6, 14.6, 6, 14.6);
  context.bezierCurveTo(6, 14.6, 10.8, 9.1, 10.8, 5.8);
  context.bezierCurveTo(10.8, 3.15, 8.7, 1, 6, 1);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = config.glyph;
  context.beginPath();
  context.arc(6, 5.8, 2.2, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = config.stroke;
  context.lineWidth = 1;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(6, 4.1);
  context.lineTo(6, 7.5);
  context.moveTo(4.3, 5.8);
  context.lineTo(7.7, 5.8);
  context.stroke();

  return canvas;
}
