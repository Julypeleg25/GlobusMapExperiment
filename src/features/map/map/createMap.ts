import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import type { MapLayers } from './createLayers';

export function createMap(target: HTMLElement, layers: MapLayers): Map {
  return new Map({
    target,
    pixelRatio: 1,
    controls: [],
    layers: [
      new TileLayer({ source: new OSM() }),
      layers.bulkCirclesLayer,
      layers.entitiesLayer,
      layers.imageMarkersLayer,
      layers.selectedEntityLayer,
      layers.editHandlesLayer,
      layers.labelsLayer,
    ],
    view: new View({
      center: fromLonLat([35.0, 31.4]),
      zoom: 7.3,
      minZoom: 5,
      maxZoom: 20,
    }),
  });
}
