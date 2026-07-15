// --- Basemap ---------------------------------------------------------
const map = L.map('map').setView([48.05, -114.15], 9);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  subdomains: 'abcd',
  maxZoom: 19,
}).addTo(map);

// --- D3 overlay synced to the Leaflet map -----------------------------
const svg = d3.select(map.getPanes().overlayPane).append('svg');
const g = svg.append('g').attr('class', 'leaflet-zoom-hide');

// arrowhead marker, reused by every river path
svg.append('defs').append('marker')
  .attr('id', 'arrowhead')
  .attr('viewBox', '0 0 10 10')
  .attr('refX', 8)
  .attr('refY', 5)
  .attr('markerWidth', 6)
  .attr('markerHeight', 6)
  .attr('orient', 'auto-start-reverse')
  .append('path')
  .attr('d', 'M0,0 L10,5 L0,10 z')
  .attr('fill', '#2166ac');

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
let widthScale = d3.scaleSqrt().range([1, 14]);

d3.json('data/discharge/json/links.json').then(data => {
  links = data;

  // assumes all links share the same set of dates; use the first link's series as the timeline
  dates = links[0].series.map(d => d.time);

  const maxValue = d3.max(links, d => d3.max(d.series, s => s.value));
  widthScale.domain([0, maxValue]);

  const slider = d3.select('#date-slider')
    .attr('max', dates.length - 1)
    .property('value', dates.length - 1)
    // not .attr('value', ...), since rendered thumb pos controlled by property, not attr
    .on('input', function () { render(+this.value); });

  const paths = g.selectAll('path.river-path')
    .data(links, d => d.station_id)
    .join('path')
    .attr('class', 'river-path');

  map.on('moveend zoomend', reposition);
  reposition();
  render(dates.length - 1);
});

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
}

function render(dateIndex) {
  const time = dates[dateIndex];
  d3.select('#date-label').text(time);

  g.selectAll('path.river-path')
    .attr('marker-end', 'url(#arrowhead)')
    .attr('stroke-width', d => {
      const record = d.series[dateIndex];
      return widthScale(record ? record.value : 0);
    });
}
