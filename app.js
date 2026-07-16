// --- Basemap ---------------------------------------------------------
const map = L.map('map', {
  zoomControl: false, // Disable Leaflet zooming and UI features
  scrollWheelZoom: false,
  doubleClickZoom: false,
  touchZoom: false,
  boxZoom: false
}).setView([48.05, -114.15], 9);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  subdomains: 'abcd',
  maxZoom: 19,
}).addTo(map);

// --- D3 overlay synced to the Leaflet map -----------------------------
const svg = d3.select(map.getPanes().overlayPane).append('svg');
const g = svg.append('g').attr('class', 'leaflet-zoom-hide');

function arrowAngle(path) {
  const n = path.length;
  const windowSize = Math.max(2, Math.round(n * 0.01)); // last ~1% of points, min 2
  const backIdx = Math.max(0, n - 1 - windowSize);
  const p0 = projectPoint(...path[backIdx]);
  const p1 = projectPoint(...path[n - 1]);
  return Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * (180 / Math.PI);
}

function projectPoint(lon, lat) {
  const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
  return [point.x, point.y];
}

const curveInterpolator = d3.curveBasisOpen;

const lineGen = d3.line()
  .x(d => projectPoint(d[0], d[1])[0])
  .y(d => projectPoint(d[0], d[1])[1])
  .curve(curveInterpolator);

// --- Load data and build the chart ------------------------------------
let links = [];
let dates = [];
let currentDateIndex = 0;
let widthScale = d3.scaleSqrt().range([2, 14]);
let areaScale = d3.scaleSqrt().range([1, 5]);

d3.json('data/discharge/json/links.json').then(data => {
  links = data;

  // assumes all links share the same set of dates; use the first link's series as the timeline
  dates = links[0].series.map(d => d.time);

  const maxValue = d3.max(links, d => d3.max(d.series, s => s.value));
  widthScale.domain([0, maxValue]);
  areaScale.domain([0, maxValue]);

  const slider = d3.select('#date-slider')
    .attr('max', dates.length - 1)
    .property('value', dates.length - 1)
    // not .attr('value', ...), since rendered thumb pos controlled by property, not attr
    .on('input', function () { render(+this.value); });

  const paths = g.selectAll('path.river-path')
    .data(links, d => d.station_id)
    .join('path')
    .attr('class', 'river-path');

  const arrows = g.selectAll('path.arrowhead')
    .data(links, d => d.station_id)
    .join('path')
    .attr('class', 'arrowhead')
    .attr('d', 'M-7,-5 L7,0 L-7,5 Z') // tip points along +x; rotated below
    .attr('transform', 'scale(1)');

  map.on('moveend zoomend', reposition);
  reposition();
  render(dates.length - 1);
});

function arrowTransform(d) {
  const tip = projectPoint(...d.path[d.path.length - 1]);
  const angle = arrowAngle(d.path);
  const record = d.series[currentDateIndex];
  const scaleFactor = areaScale(record ? record.value : 0);
  return `translate(${tip[0]}, ${tip[1]}) rotate(${angle}) scale(${scaleFactor})`;
}

function reposition() {
  const bounds = map.getBounds();
  const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
  const bottomRight = map.latLngToLayerPoint(bounds.getSouthEast());

  svg
    .attr('width', bottomRight.x - topLeft.x)
    .attr('height', bottomRight.y - topLeft.y)
    .style('left', `${topLeft.x}px`)
    .style('top', `${topLeft.y}px`);

  g.attr('transform', `translate(${-topLeft.x}, ${-topLeft.y})`);

  g.selectAll('path.river-path').attr('d', d => lineGen(d.path));
  g.selectAll('path.arrowhead').attr('transform', arrowTransform);
}

function render(dateIndex) {
  currentDateIndex = dateIndex;
  const time = dates[dateIndex];
  d3.select('#date-label').text(time);

  g.selectAll('path.river-path')
    .attr('stroke-width', d => {
      const record = d.series[dateIndex];
      return widthScale(record ? record.value : 0);
    });

  g.selectAll('path.arrowhead').attr('transform', arrowTransform);
}
