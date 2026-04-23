import type Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import type Geometry from 'ol/geom/Geometry';
import type Point from 'ol/geom/Point';
import type VectorSource from 'ol/source/Vector';
import type { MapSources } from './createSources';
import { createAircraftStyle } from './aircraftStyle';
import { createLabelStyle } from './labelStyle';
import { createBulkWebglStyle } from './mapStyle';
import { createRouteAnnotationStyle } from './routeAnnotationStyle';
import {
  createAircraftLinkWebglStyle,
  createEditHandleWebglStyle,
  createEntityWebglStyle,
  createImageMarkerWebglStyle,
  createSelectedEntityWebglStyle,
} from './webglStyles';

export interface MapLayers {
  bulkCirclesLayer: WebGLVectorLayer;
  entitiesLayer: WebGLVectorLayer<VectorSource<Feature<Geometry>>>;
  routeAnnotationsLayer: VectorLayer<VectorSource<Feature<Geometry>>>;
  imageMarkersLayer: WebGLVectorLayer<VectorSource<Feature<Point>>>;
  aircraftLinksLayer: WebGLVectorLayer<VectorSource<Feature<Geometry>>>;
  aircraftLayer: VectorLayer<VectorSource<Feature<Point>>>;
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
    zIndex: 100,
  });

  const entitiesLayer = new WebGLVectorLayer({
    source: sources.entitiesSource,
    style: createEntityWebglStyle(),
    disableHitDetection: false,
    minZoom: 0,
    maxZoom: 28,
    zIndex: 200,
  });
  entitiesLayer.set('selectable', true);
  entitiesLayer.set('interactiveRole', 'entity');

  const routeAnnotationsLayer = new VectorLayer({
    source: sources.routeAnnotationsSource,
    style: createRouteAnnotationStyle(),
    minZoom: 12,
    updateWhileAnimating: false,
    updateWhileInteracting: false,
    zIndex: 920,
  });
  routeAnnotationsLayer.set('selectable', false);

  const imageMarkersLayer = new WebGLVectorLayer({
    source: sources.imageMarkersSource,
    style: createImageMarkerWebglStyle(),
    disableHitDetection: true,
    minZoom: 0,
    maxZoom: 28,
    zIndex: 1005,
  });
  imageMarkersLayer.set('selectable', false);

  const aircraftLinksLayer = new WebGLVectorLayer({
    source: sources.aircraftLinksSource,
    style: createAircraftLinkWebglStyle(),
    disableHitDetection: true,
    zIndex: 950,
  });
  aircraftLinksLayer.set('selectable', false);

  const aircraftLayer = new VectorLayer({
    source: sources.aircraftSource,
    style: createAircraftStyle(),
    updateWhileAnimating: true,
    updateWhileInteracting: true,
    zIndex: 1020,
  });
  aircraftLayer.set('selectable', false);
  aircraftLayer.set('interactiveRole', 'aircraft');

  const labelsLayer = new VectorLayer({
    source: sources.labelsSource,
    style: createLabelStyle(),
    declutter: true,
    minZoom: 10,
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

  bulkCirclesLayer.set('selectable', false);

  return {
    bulkCirclesLayer,
    entitiesLayer,
    routeAnnotationsLayer,
    imageMarkersLayer,
    aircraftLinksLayer,
    aircraftLayer,
    labelsLayer,
    selectedEntityLayer,
    editHandlesLayer,
  };
}
