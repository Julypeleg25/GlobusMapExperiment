import type Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import type Geometry from 'ol/geom/Geometry';
import type Point from 'ol/geom/Point';
import type VectorSource from 'ol/source/Vector';
import type { MapSources } from './createSources';
import { createEntityStyle, createSelectedEntityStyle } from './entityStyle';
import { createLabelStyle } from './labelStyle';
import { createBulkWebglStyle } from './mapStyle';

export interface MapLayers {
  bulkCirclesLayer: WebGLVectorLayer;
  entitiesLayer: VectorLayer<VectorSource<Feature<Geometry>>>;
  labelsLayer: VectorLayer<VectorSource<Feature<Point>>>;
  selectedEntityLayer: VectorLayer<VectorSource<Feature<Geometry>>>;
}

export function createLayers(sources: MapSources): MapLayers {
  const bulkCirclesLayer = new WebGLVectorLayer({
    source: sources.bulkCirclesSource,
    style: createBulkWebglStyle() as never,
    minZoom: 0,
    maxZoom: 28,
  });

  const entitiesLayer = new VectorLayer({
    source: sources.entitiesSource,
    style: createEntityStyle(),
    updateWhileAnimating: false,
    updateWhileInteracting: false,
  });
  entitiesLayer.set('selectable', true);

  const labelsLayer = new VectorLayer({
    source: sources.labelsSource,
    style: createLabelStyle(),
    declutter: true,
    minZoom: 8,
    maxZoom: 28,
    updateWhileAnimating: false,
    updateWhileInteracting: false,
  });
  labelsLayer.set('selectable', false);

  const selectedEntityLayer = new VectorLayer({
    source: sources.selectedEntitySource,
    style: createSelectedEntityStyle(),
    zIndex: 1000,
  });
  selectedEntityLayer.set('selectable', true);

  bulkCirclesLayer.set('selectable', true);

  return {
    bulkCirclesLayer,
    entitiesLayer,
    labelsLayer,
    selectedEntityLayer,
  };
}
