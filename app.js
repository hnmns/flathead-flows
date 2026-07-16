// --- Basemap ---------------------------------------------------------
const map = L.map('map', {
  dragging: false,
  keyboard: false,
  zoomControl: false,
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

function projectPoint(lon, lat) {
  const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
  return [point.x, point.y];
}

function arrowAngle(path) {
  const n = path.length;
  const windowSize = Math.max(2, Math.round(n * 0.01)); // last ~1% of points, min 2
  const backIdx = Math.max(0, n - 1 - windowSize);
  const p0 = projectPoint(...path[backIdx]);
  const p1 = projectPoint(...path[n - 1]);
  return Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * (180 / Math.PI);
}

function valueForDate(series, time) {
  const record = series.find(s => s.time === time);
  return record ? record.value : 0;
}

function arrowTransform(d) {
  const tip = projectPoint(...d.path[d.path.length - 1]);
  const angle = arrowAngle(d.path);
  const time = dates[currentDateIndex];
  const scaleFactor = areaScale(valueForDate(d.series, time));
  return `translate(${tip[0]}, ${tip[1]}) rotate(${angle}) scale(${scaleFactor})`;
}

const curveInterpolator = d3.curveBasisOpen;

const lineGen = d3.line()
  .x(d => projectPoint(d[0], d[1])[0])
  .y(d => projectPoint(d[0], d[1])[1])
  .curve(curveInterpolator);

// --- Load data and build the charts + map ------------------------------
let links = [];
let allDates = [];
let dates = []; // Filtered to currently selected season
let currentDateIndex = 0;
let widthScale = d3.scaleSqrt().range([1, 18]);
let areaScale = d3.scaleSqrt().range([1, 5]);

const INFLOW_STATIONS = ['fhr_n', 'fhr_m', 'fhr_s', 'stillwater', 'whitefish', 'swan'];

function computeHoldbackSeries(links, minFlowData) {
  const inflowLinks = links.filter(d => INFLOW_STATIONS.includes(d.station_shorthand));
  const minFlowByDate = new Map(minFlowData.map(d => [d.date, d.min_flow_cfs_actual]));

  return inflowLinks[0].series
    .map((_, i) => {
      const time = inflowLinks[0].series[i].time;
      const netInflow = inflowLinks.reduce((sum, link) => sum + (link.series[i]?.value || 0), 0);
      const minFlow = minFlowByDate.get(time);
      return minFlow === undefined ? null : { time, value: netInflow - minFlow };
    })
    .filter(d => d !== null);
}

function getSeasonDates(year) {
  return allDates.filter(t => {
    const m = new Date(t).getUTCMonth() + 1; // 1-12
    return new Date(t).getUTCFullYear() === year && m >= 4 && m <= 9;
  });
}

function populateSeasonSelect() {
  const years = [...new Set(allDates.map(t => new Date(t).getUTCFullYear()))];
  d3.select('#season-select')
    .selectAll('option')
    .data(years)
    .join('option')
    .attr('value', d => d)
    .text(d => d);

  d3.select('#season-select').on('change', function () {
    setSeason(+this.value);
  });
}

function setSeason(year) {
  dates = getSeasonDates(year);
  d3.select('#date-slider').attr('max', dates.length - 1).property('value', dates.length - 1);
  setChartDomain(new Date(dates[0]), new Date(dates[dates.length - 1]));
  render(dates.length - 1);
}

Promise.all([
  d3.json('data/discharge/json/links.json'),
  d3.csv('data/discharge/skq_min_flow_2025.csv', d => ({
    date: d.date,
    min_flow_cfs_license: +d.min_flow_cfs_license,
    min_flow_cfs_actual: +d.min_flow_cfs_actual,
    source: d.source
  }))
]).then(([linksData, minFlowData]) => {
  links = linksData;
  allDates = links[0].series.map(d => d.time);

  const maxValue = d3.max(links, d => d3.max(d.series, s => s.value));
  widthScale.domain([0, maxValue]);
  areaScale.domain([0, maxValue]);

  g.selectAll('path.river-path')
    .data(links, d => d.station_id)
    .join('path')
    .attr('class', 'river-path');

  g.selectAll('path.arrowhead')
    .data(links, d => d.station_id)
    .join('path')
    .attr('class', 'arrowhead')
    .attr('d', 'M-7,-5 L7,0 L-7,5 Z'); // tip points along +x; rotated/scaled via arrowTransform

  const outLink = links.find(d => d.station_shorthand === 'fhr_out');
  initChart('chart-outflow', outLink.series, minFlowData);

  const holdbackSeries = computeHoldbackSeries(links, minFlowData);
  initHoldbackChart('chart-holdback', holdbackSeries);

  d3.select('#date-slider').on('input', function () { render(+this.value); });

  populateSeasonSelect();
  d3.select('#season-select').property('value', 2025);
  setSeason(2025);

  map.on('moveend zoomend', reposition);
  reposition();
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
  g.selectAll('path.arrowhead').attr('transform', arrowTransform);
}

function render(dateIndex) {
  currentDateIndex = dateIndex;
  const time = dates[dateIndex];
  d3.select('#date-label').text(time);

  g.selectAll('path.river-path')
    .attr('stroke-width', d => widthScale(valueForDate(d.series, time)));
  g.selectAll('path.arrowhead').attr('transform', arrowTransform);

  updateChartDate(time);
}

window.addEventListener('resize', () => map.invalidateSize());
