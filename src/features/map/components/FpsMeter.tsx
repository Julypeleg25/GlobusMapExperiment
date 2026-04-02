import { useEffect, useState } from 'react';

const sampleWindowMs = 500;

export function FpsMeter() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let animationFrameId = 0;
    let lastSampleTime = performance.now();
    let frameCount = 0;

    const measure = (timestamp: number) => {
      frameCount += 1;

      const elapsed = timestamp - lastSampleTime;
      if (elapsed >= sampleWindowMs) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        lastSampleTime = timestamp;
      }

      animationFrameId = window.requestAnimationFrame(measure);
    };

    animationFrameId = window.requestAnimationFrame(measure);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fps-meter" aria-label={`Frames per second ${fps}`}>
      <span className="fps-label">FPS</span>
      <strong>{fps}</strong>
    </div>
  );
}
