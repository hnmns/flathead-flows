// --- Time series chart: fhr_out discharge vs. 2025 minimum flow requirement ---

const charts = {}; // containerId -> per-row scales/refs, so multiple chart rows don't overwrite each other

function initChart(containerId, dischargeSeries, minFlowData) {
  const container = document.getElementById(containerId);
  const margin = { top: 20, right: 20, bottom: 30, left: 55 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;

  const svg = d3.select(`#${containerId}`).append('svg')
    .attr('width', container.clientWidth)
    .attr('height', container.clientHeight);

  const chartInner = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleTime()
    .domain(d3.extent(dischargeSeries, d => new Date(d.time)))
    .range([0, width]);

  const maxY = Math.max(
    d3.max(dischargeSeries, d => d.value),
    d3.max(minFlowData, d => d.min_flow_cfs_actual)
  );
  const yScale = d3.scaleLinear().domain([0, maxY]).nice().range([height, 0]);

  chartInner.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(6));

  chartInner.append('g')
    .call(d3.axisLeft(yScale).ticks(6));

  chartInner.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height/2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .attr('class', 'chart-legend')
    .text('Discharge (cfs)');

  const dischargeLineGen = d3.line()
    .x(d => xScale(new Date(d.time)))
    .y(d => yScale(d.value));

  chartInner.append('path')
    .datum(dischargeSeries)
    .attr('class', 'discharge-line')
    .attr('d', dischargeLineGen);

  const minFlowLineGen = d3.line()
    .x(d => xScale(new Date(d.date)))
    .y(d => yScale(d.min_flow_cfs_actual));

  chartInner.append('path')
    .datum(minFlowData)
    .attr('class', 'min-flow-line')
    .attr('d', minFlowLineGen);

  chartInner.append('text')
    .attr('class', 'chart-title')
    .attr('x', 8).attr('y', 0)
    .text('Discharge out of Flathead River');

  chartInner.append('text')
    .attr('class', 'chart-legend')
    .attr('x', 8).attr('y', 14).attr('fill', '#2166ac')
    .text('River discharge after SKQ Dam');

  chartInner.append('text')
    .attr('class', 'chart-legend')
    .attr('x', 8).attr('y', 28).attr('fill', '#d6604d')
    .text('Minimum outflow schedule enacted for 2025');

  const vertLine = chartInner.append('line')
    .attr('class', 'date-indicator')
    .attr('y1', 0)
    .attr('y2', height);

  charts[containerId] = {
    xScale, yScale, chartInner, vertLine,
    series: [
      { data: dischargeSeries, lineGen: dischargeLineGen, selector: '.discharge-line', dateKey: 'time' },
      { data: minFlowData, lineGen: minFlowLineGen, selector: '.min-flow-line', dateKey: 'date' }
    ]
  };
}

function initHoldbackChart(containerId, holdbackSeries) {
  const container = document.getElementById(containerId);
  const margin = { top: 20, right: 20, bottom: 30, left: 55 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;

  const svg = d3.select(`#${containerId}`).append('svg')
    .attr('width', container.clientWidth)
    .attr('height', container.clientHeight);

  const chartInner = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleTime()
    .domain(d3.extent(holdbackSeries, d => new Date(d.time)))
    .range([0, width]);

  const yExtent = d3.extent(holdbackSeries, d => d.value);
  const yScale = d3.scaleLinear().domain(yExtent).nice().range([height, 0]);

  chartInner.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(6));

  chartInner.append('g').call(d3.axisLeft(yScale).ticks(6));

  chartInner.append('line')
    .attr('class', 'zero-line')
    .attr('x1', 0).attr('x2', width)
    .attr('y1', yScale(0)).attr('y2', yScale(0));

  const lineGen = d3.line()
    .x(d => xScale(new Date(d.time)))
    .y(d => yScale(d.value));

  chartInner.append('path')
    .datum(holdbackSeries)
    .attr('class', 'holdback-line')
    .attr('d', lineGen);

  chartInner.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height/2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .attr('class', 'chart-legend')
    .text('Discharge (cfs)');

  chartInner.append('text')
    .attr('class', 'chart-title')
    .attr('x', 8).attr('y', 0)
    .text('Maximum possible water holdback for Flathead Lake');
  chartInner.append('text')
    .attr('class', 'chart-legend')
    .attr('x', 8).attr('y', 14).attr('fill', '#1a9850')
    .text('Difference between total lake inflows and 2025 federal outflow minimum');

  const vertLine = chartInner.append('line')
    .attr('class', 'date-indicator')
    .attr('y1', 0).attr('y2', height);

  charts[containerId] = {
    xScale, yScale, chartInner, vertLine,
    series: [
      { data: holdbackSeries, lineGen, selector: '.holdback-line', dateKey: 'time' }
    ]
  };
}

function setChartDomain(startDate, endDate) {
  Object.values(charts).forEach(c => {
    c.xScale.domain([startDate, endDate]);
    c.chartInner.select('.x-axis').call(d3.axisBottom(c.xScale).ticks(6));

    c.series.forEach(s => {
      const inRange = s.data.filter(d => {
        const t = new Date(d[s.dateKey]);
        return t >= startDate && t <= endDate;
      });
      c.chartInner.select(s.selector).datum(inRange).attr('d', s.lineGen);
    });
  });
}

function updateChartDate(timeStr) {
  Object.values(charts).forEach(c => {
    const x = c.xScale(new Date(timeStr));
    c.vertLine.attr('x1', x).attr('x2', x);
  });
}