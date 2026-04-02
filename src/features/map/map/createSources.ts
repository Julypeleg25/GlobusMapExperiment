import type Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import type Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';

export interface MapSources {
  bulkCirclesSource: VectorSource<Feature<Point>>;
  entitiesSource: VectorSource<Feature<Geometry>>;
  labelsSource: VectorSource<Feature<Point>>;
  selectedEntitySource: VectorSource<Feature<Geometry>>;
}

export function createSources(): MapSources {
  return {
    bulkCirclesSource: new VectorSource(),
    entitiesSource: new VectorSource(),
    labelsSource: new VectorSource(),
    selectedEntitySource: new VectorSource(),
  };
}
