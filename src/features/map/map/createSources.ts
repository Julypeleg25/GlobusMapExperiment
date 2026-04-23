import type Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import type Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';

export interface MapSources {
  bulkCirclesSource: VectorSource<Feature<Point>>;
  entitiesSource: VectorSource<Feature<Geometry>>;
  routeAnnotationsSource: VectorSource<Feature<Geometry>>;
  labelsSource: VectorSource<Feature<Point>>;
  selectedEntitySource: VectorSource<Feature<Geometry>>;
  editHandlesSource: VectorSource<Feature<Point>>;
  imageMarkersSource: VectorSource<Feature<Point>>;
  aircraftSource: VectorSource<Feature<Point>>;
  aircraftLinksSource: VectorSource<Feature<Geometry>>;
}

export function createSources(): MapSources {
  return {
    bulkCirclesSource: new VectorSource(),
    entitiesSource: new VectorSource(),
    routeAnnotationsSource: new VectorSource(),
    labelsSource: new VectorSource(),
    selectedEntitySource: new VectorSource(),
    editHandlesSource: new VectorSource(),
    imageMarkersSource: new VectorSource(),
    aircraftSource: new VectorSource(),
    aircraftLinksSource: new VectorSource(),
  };
}
