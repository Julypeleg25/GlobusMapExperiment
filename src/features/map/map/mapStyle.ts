export function createBulkWebglStyle() {
  return {
    variables: {
      selectedCategory: '',
      selectedStatus: '',
      minPriority: 0,
      radiusScale: 1,
    },
    filter: [
      'all',
      ['any', ['==', ['var', 'selectedCategory'], ''], ['==', ['get', 'category'], ['var', 'selectedCategory']]],
      ['any', ['==', ['var', 'selectedStatus'], ''], ['==', ['get', 'status'], ['var', 'selectedStatus']]],
      ['>=', ['get', 'priority'], ['var', 'minPriority']],
      ['==', ['get', 'type'], 'circle'],
    ],
    'circle-radius': ['*', ['get', 'radius'], ['var', 'radiusScale']],
    'circle-fill-color': ['get', 'colorCode'],
    'circle-opacity': 0.78,
    'circle-stroke-color': 'rgba(0,0,0,0)',
    'circle-stroke-width': 0,
  };
}
