import type Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import type Geometry from 'ol/geom/Geometry';
import type Point from 'ol/geom/Point';
import type VectorSource from 'ol/source/Vector';
import type { MapSources } from './createSources';
import { createLabelStyle } from './labelStyle';
import { createBulkWebglStyle } from './mapStyle';
import {
  createEditHandleWebglStyle,
  createEntityWebglStyle,
  createImageMarkerWebglStyle,
  createSelectedEntityWebglStyle,
} from './webglStyles';

export interface MapLayers {
  bulkCirclesLayer: WebGLVectorLayer;
  entitiesLayer: WebGLVectorLayer<VectorSource<Feature<Geometry>>>;
  imageMarkersLayer: WebGLVectorLayer<VectorSource<Feature<Point>>>;
  labelsLayer: VectorLayer<VectorSource<Feature<Point>>>;
  selectedEntityLayer: WebGLVectorLayer<VectorSource<Feature<Geometry>>>;
  editHandlesLayer: WebGLVectorLayer<VectorSource<Feature<Point>>>;
}

export function createLayers(sources: MapSources): MapLayers {
  const bulkCirclesLayer = new WebGLVectorLayer({
    source: sources.bulkCirclesSource,
    style: createBulkWebglStyle(),
    minZoom: 0,
    maxZoom: 28,
  });

  const entitiesLayer = new WebGLVectorLayer({
    source: sources.entitiesSource,
    style: createEntityWebglStyle(),
    disableHitDetection: false,
    minZoom: 0,
    maxZoom: 28,
  });
  entitiesLayer.set('selectable', true);
  entitiesLayer.set('interactiveRole', 'entity');

  const imageMarkersLayer = new WebGLVectorLayer({
    source: sources.imageMarkersSource,
    style: createImageMarkerWebglStyle(),
    disableHitDetection: true,
    minZoom: 7,
    maxZoom: 28,
  });
  imageMarkersLayer.set('selectable', false);

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

  const selectedEntityLayer = new WebGLVectorLayer({
    source: sources.selectedEntitySource,
    style: createSelectedEntityWebglStyle(),
    disableHitDetection: false,
    zIndex: 1000,
  });
  selectedEntityLayer.set('selectable', true);
  selectedEntityLayer.set('interactiveRole', 'entity');

  const editHandlesLayer = new WebGLVectorLayer({
    source: sources.editHandlesSource,
    style: createEditHandleWebglStyle(),
    disableHitDetection: false,
    zIndex: 1100,
  });
  editHandlesLayer.set('selectable', false);
  editHandlesLayer.set('interactiveRole', 'editHandle');

  bulkCirclesLayer.set('selectable', true);
  bulkCirclesLayer.set('interactiveRole', 'entity');

  return {
    bulkCirclesLayer,
    entitiesLayer,
    imageMarkersLayer,
    labelsLayer,
    selectedEntityLayer,
    editHandlesLayer,
  };
}
