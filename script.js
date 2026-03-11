// Global variables
let countryStats = {};

// Color scale for the map
const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateYlOrRd)
    .domain([0, 1]);

// ── Region zoom targets (center [lon, lat] and scale multiplier) ──
const regionZoomConfig = {
    'Africa':   { center: [20, 0],     scaleMult: 2.8 },
    'Americas': { center: [-80, 10],   scaleMult: 2.2 },
    'Asia':     { center: [85, 30],    scaleMult: 2.5 },
    'Europe':   { center: [15, 52],    scaleMult: 4.0 },
    'Oceania':  { center: [145, -25],  scaleMult: 3.2 }
};

// Region Stories
const regionStories = {
    'Africa': 'Africa sits at the intersection of two compounding crises: extreme income inequality and escalating terrorist violence. Sub-Saharan Africa recorded the second highest number of deaths from terrorism globally, surpassing even the Middle East and North Africa, with South Asia, MENA, and sub-Saharan Africa together accounting for 93% of all terrorism-related deaths between 2002 and 2018. The region is also among the most income-unequal in the world, second only to Latin America. Research finds that income inequality is a substantive predictor of domestic terrorism across African countries: where inequality is high and human capital is poor, frustration and grievance create fertile recruitment conditions for groups such as Boko Haram, Al-Shabaab, and Ansar Al-Shariya. Critically, higher educational attainment at the tertiary level appears to moderate this relationship, suggesting that investment in education alongside  reducing income gaps offers the most effective policy path toward reducing political violence.', 
    'Americas': 'The Americas present a stark illustration of how terrorism and inequality can reinforce one another. Latin American nations have historically ranked among the world\'s most unequal societies, and research suggests the relationship runs in both directions. While inequality fuels grievance and recruitment into violent groups, terrorism in turn drives income  inequality higher by disrupting redistribution: governments under terrorist pressure cut taxes and redirect spending toward security, reducing transfers to those who need them most. This trade-off between security and equality is especially acute in the region\'s democracies, which face stronger electoral pressure to respond to attacks — and consequently lose their "equality advantage" faster than non-democratic regimes when violence escalates.',
    'Asia': 'Asia illustrates one of the most complex relationships between economic development and political violence. Research finds that terrorism does not follow a simple linear path with prosperity, middle-income countries are more vulnerable to domestic terrorism than either the very poor or the very rich. As economies industrialize, rising inequality, urban disruption and the emergence of an educated but frustrated middle class create fertile conditions for political violence. Critically, this pattern is dramatically worsened by minority discrimination: where ethnic or religious groups are politically excluded from power, economic growth actually increases domestic terrorism rather than reducing it. This dynamic is visible across the region, from the Moro conflict in the Philippines, to India\'s Maoist insurgency tied to the displacement of tribal communities, to labor unrest in Bangladesh. Even wealthy Asian states remain vulnerable if minority populations are systematically excluded from political participation.',
    'Europe': 'Europe offers perhaps the clearest laboratory for studying how terrorism interacts with democratic governance and inequality. Research across 163 countries finds that democracies, the dominant political form in Western Europe, are uniquely vulnerable to the distributional  consequences of terrorism: while they tend to be more equal than non-democracies in peaceful  periods, they lose this "equality advantage" as terrorist activity grows. The mechanism is  fiscal rather than economic, terrorism does not measurably damage European macroeconomies at the national level, but it does prompt democratic governments to cut taxes and reduce transfers in ways that favor the wealthy, widening the income gap. From the ideological violence of the Cold War era to modern far-right and religiously motivated attacks, each wave of terrorism has quietly reshaped the continent\'s redistributive politics.',
    'Oceania': 'Oceania presents a security landscape fundamentally different from other world regions. Rather than organized terrorism driven by ideological extremism or inequality-fueled insurgency, the region\'s primary security challenges stem from fragile and failing states, ethnic tensions, and governance breakdowns, particularly across Melanesia. In Solomon Islands, Papua New Guinea and Fiji, the weakness of post-colonial state institutions has created conditions where law and order collapse rather than organized political violence. Conventional terrorism has had minimal presence, with no evidence of groups such as Al-Qaeda operating in the region. The most notable act of terrorism was state-sponsored, France\'s 1985 sinking of the Rainbow Warrior in Auckland. Where violence has occurred, it has been tied less to inequality in the classic sense and more to the exclusion of ethnic groups from state benefits, land disputes, and the fundamental fragility of states that were never natural fits for the societies they govern.'};

//Region Citations
const regionCitations = {
  'Africa': 'Ajide, K.B. & Alimi, O.Y. (2021). Income inequality, human capital and terrorism in Africa: Beyond exploratory analytics. <em>International Economics</em>, 165, 218–240. https://doi.org/10.1016/j.inteco.2021.01.003',
  'Americas': 'Meierrieks, D. (2025). The effect of terrorism on economic inequality in democracies and non-democracies. <em>European Journal of Political Economy</em>, 86, 102640. https://doi.org/10.1016/j.ejpoleco.2024.102640',
  'Asia': 'Ghatak, S. & Gold, A. (2017). Development, discrimination, and domestic terrorism: Looking beyond a linear relationship. <em>Conflict Management and Peace Science</em>, 34(6), 618-639. https://doi.org/10.1177/0738894215608511',
  'Europe': 'Meierrieks, D. (2025). The effect of terrorism on economic inequality in democracies and non-democracies. <em>European Journal of Political Economy</em>, 86, 102640. https://doi.org/10.1016/j.ejpoleco.2024.102640',
  'Oceania': 'McDougall, D. (2007). Insecurity in Oceania: An Australian perspective. <em>The Round Table</em>, 96(391), 415-427. https://doi.org/10.1080/00358530701564977',};

// Region colors (must match scatterplot)
const regionColorMap = {
    'Africa': '#e6c75a',
    'Americas': '#ff6b6b',
    'Asia': '#4ecdc4',
    'Europe': '#a78bfa',
    'Oceania': '#f97316'
};

// ── Map zoom state (stored globally so scatterplot can drive it) ──
let mapSvg = null;
let mapG = null;          // the <g> that holds all country paths
let mapProjection = null;
let mapWidth = 0;
let mapHeight = 0;
let baseScale = 0;

// Reference to popup elements
const regionPopup      = () => document.getElementById('region-popup');
const regionPopupTitle  = () => document.getElementById('region-popup-title');
const regionPopupBody   = () => document.getElementById('region-popup-body');
const regionPopupClose  = () => document.getElementById('region-popup-close');

// Initialize the visualization
async function init() {
    try {
        const [world, csvData] = await Promise.all([
            d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
            d3.csv('processed_gtd.csv')
        ]);

        processData(csvData);
        createMap(world);
        createLegend();
        displayStats();
        createScatterplot();

        // Wire up popup close button
        regionPopupClose().addEventListener('click', () => {
            hideRegionPopup();
            // Also tell the scatterplot to deselect
            if (window._clearScatterFocus) window._clearScatterFocus();
        });

    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('map-container').innerHTML =
            '<p style="padding: 20px; color: #ff6b6b;">Error loading data. Please check the console.</p>';
    }
}

// Process CSV data into country statistics
function processData(csvData) {
    csvData.forEach(row => {
        const country = row.country_txt;

        const attackTypes = [];
        if (row.attack_1_type && row.attack_1_type !== 'NA') attackTypes.push(row.attack_1_type);
        if (row.attack_2_type && row.attack_2_type !== 'NA') attackTypes.push(row.attack_2_type);
        if (row.attack_3_type && row.attack_3_type !== 'NA') attackTypes.push(row.attack_3_type);
        if (row.attack_4_type && row.attack_4_type !== 'NA') attackTypes.push(row.attack_4_type);
        if (row.attack_5_type && row.attack_5_type !== 'NA') attackTypes.push(row.attack_5_type);

        countryStats[country] = {
            name: country,
            totalEvents: parseInt(row.total_events) || 0,
            totalDeaths: parseInt(row.total_deaths) || 0,
            attackTypes: attackTypes
        };
    });

    const maxEvents = Math.max(...Object.values(countryStats).map(d => d.totalEvents));
    colorScale.domain([0, maxEvents]);
}

// Create the world map
function createMap(world) {
    const container = document.getElementById('map-container');
    mapWidth = container.clientWidth;
    mapHeight = container.clientHeight;

    mapSvg = d3.select('#map-container')
        .append('svg')
        .attr('width', mapWidth)
        .attr('height', mapHeight);

    baseScale = mapWidth / 9;

    mapProjection = d3.geoNaturalEarth1()
        .scale(baseScale)
        .translate([mapWidth / 2, mapHeight / 2]);

    const path = d3.geoPath().projection(mapProjection);

    const countries = topojson.feature(world, world.objects.countries).features;

    const countryNameMapping = {
        'United States of America': 'United States',
        'Bosnia and Herz.': 'Bosnia-Herzegovina',
        'Central African Rep.': 'Central African Republic',
        'Dem. Rep. Congo': 'Democratic Republic of the Congo',
        'Congo': 'Republic of the Congo',
        'Côte d\'Ivoire': 'Ivory Coast',
        'Czech Rep.': 'Czech Republic',
        'Dominican Rep.': 'Dominican Republic',
        'Eq. Guinea': 'Equatorial Guinea',
        'N. Korea': 'North Korea',
        'S. Korea': 'South Korea',
        'Lao PDR': 'Laos',
        'Palestine': 'West Bank and Gaza Strip',
        'S. Sudan': 'South Sudan',
        'Solomon Is.': 'Solomon Islands',
        'W. Sahara': 'Western Sahara'
    };

    // Wrap countries in a <g> so we can transform it for zoom
    mapG = mapSvg.append('g').attr('class', 'map-g');

    mapG.selectAll('.country')
        .data(countries)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', d => {
            const name = d.properties.name;
            const mappedName = countryNameMapping[name] || name;
            const stats = countryStats[mappedName];
            return stats ? colorScale(stats.totalEvents) : '#3a3d4a';
        })
        .on('mouseover', handleMouseOver)
        .on('mousemove', handleMouseMove)
        .on('mouseout', handleMouseOut);
}

// ── Map zoom helpers ──
function zoomMapToRegion(regionName) {
    if (!mapSvg || !mapG) return;

    const config = regionZoomConfig[regionName];
    if (!config) return;

    // Re-project: compute the pixel position of the region center at the base projection
    const projected = mapProjection(config.center);
    if (!projected) return;

    const scale = config.scaleMult;
    const tx = mapWidth / 2 - projected[0] * scale;
    const ty = mapHeight / 2 - projected[1] * scale;

    mapG.transition()
        .duration(750)
        .ease(d3.easeCubicInOut)
        .attr('transform', `translate(${tx},${ty}) scale(${scale})`);
}

function resetMapZoom() {
    if (!mapG) return;
    mapG.transition()
        .duration(750)
        .ease(d3.easeCubicInOut)
        .attr('transform', 'translate(0,0) scale(1)');
}

// ── Region popup helpers ──
function showRegionPopup(regionName) {
  const popup = regionPopup();
  const title = regionPopupTitle();
  const body  = regionPopupBody();
  const color = regionColorMap[regionName] || '#888';

  title.textContent = regionName;
  title.style.color = color;

  // Set story text
  body.textContent = regionStories[regionName] || 'No information available for this region.';

  // Remove any existing citation element
  const existingCitation = popup.querySelector('.region-popup-citation');
  if (existingCitation) existingCitation.remove();

  // Create and append citation
  const citationEl = document.createElement('p');
  citationEl.className = 'region-popup-citation';
  citationEl.innerHTML = regionCitations[regionName] || '';
  popup.appendChild(citationEl);

  popup.style.borderColor = color;
  popup.classList.add('visible');
}

function hideRegionPopup() {
    const popup = regionPopup();
    popup.classList.remove('visible');
}

// Tooltip event handlers
function handleMouseOver(event, d) {
    const countryName = d.properties.name;

    const countryNameMapping = {
        'United States of America': 'United States',
        'Bosnia and Herz.': 'Bosnia-Herzegovina',
        'Central African Rep.': 'Central African Republic',
        'Dem. Rep. Congo': 'Democratic Republic of the Congo',
        'Congo': 'Republic of the Congo',
        'Côte d\'Ivoire': 'Ivory Coast',
        'Czech Rep.': 'Czech Republic',
        'Dominican Rep.': 'Dominican Republic',
        'Palestine': 'West Bank and Gaza Strip',
        'S. Sudan': 'South Sudan',
        'S. Korea': 'South Korea',
        'N. Korea': 'North Korea'
    };

    const mappedName = countryNameMapping[countryName] || countryName;
    const stats = countryStats[mappedName];

    const tooltip = d3.select('#tooltip');

    if (stats) {
        let attackList = '';
        if (stats.attackTypes.length > 0) {
            attackList = stats.attackTypes.map((type, i) =>
                `<span><strong>${i + 1}.</strong> ${type}</span>`
            ).join('<br>');
        } else {
            attackList = '<span>No data</span>';
        }

        tooltip.html(`
            <h3>${stats.name}</h3>
            <p><strong>Events:</strong> ${stats.totalEvents.toLocaleString()}</p>
            <p><strong>Deaths:</strong> ${stats.totalDeaths.toLocaleString()}</p>
            <p><strong>Most common forms of attack:</strong></p>
            <div class="attack-list">${attackList}</div>
        `);
    } else {
        tooltip.html(`
            <h3>${countryName}</h3>
            <p>No data available</p>
        `);
    }

    tooltip.style('opacity', 1);
}

function handleMouseMove(event) {
    const tooltip = d3.select('#tooltip');
    const container = document.getElementById('map-container');
    const rect = container.getBoundingClientRect();
    const tooltipNode = tooltip.node();

    const tooltipWidth = tooltipNode.offsetWidth;
    const tooltipHeight = tooltipNode.offsetHeight;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let x, y;

    y = mouseY + 15;

    if (y + tooltipHeight > container.clientHeight) {
        y = container.clientHeight - tooltipHeight - 5;
    }

    if (mouseX + tooltipWidth + 15 <= container.clientWidth) {
        x = mouseX + 15;
    } else if (mouseX - tooltipWidth - 15 >= 0) {
        x = mouseX - tooltipWidth - 15;
    } else {
        x = Math.max(5, Math.min(container.clientWidth - tooltipWidth - 5, mouseX - tooltipWidth / 2));
    }

    tooltip
        .style('left', x + 'px')
        .style('top', y + 'px');
}

function handleMouseOut() {
    d3.select('#tooltip').style('opacity', 0);
}

// Create the legend
function createLegend() {
    const maxEvents = Math.max(...Object.values(countryStats).map(d => d.totalEvents));
    const legend = document.getElementById('legend');

    const legendHTML = `
        <h3>Attack Frequency</h3>
        <div class="legend-scale">
            <span>Low</span>
            <div class="legend-gradient" style="background: linear-gradient(to right,
                ${colorScale(0)},
                ${colorScale(maxEvents * 0.25)},
                ${colorScale(maxEvents * 0.5)},
                ${colorScale(maxEvents * 0.75)},
                ${colorScale(maxEvents)});">
            </div>
            <span>High</span>
        </div>
    `;

    legend.innerHTML = legendHTML;
}

// Display global statistics
function displayStats() {
    const totalEvents = Object.values(countryStats).reduce((sum, c) => sum + c.totalEvents, 0);
    const totalDeaths = Object.values(countryStats).reduce((sum, c) => sum + c.totalDeaths, 0);
    const countriesAffected = Object.keys(countryStats).length;

    const stats = document.getElementById('stats');

    const statsHTML = `
        <h3>Global Statistics</h3>
        <p>Total Events: <span class="stat-number">${totalEvents.toLocaleString()}</span></p>
        <p>Total Deaths: <span class="stat-number">${totalDeaths.toLocaleString()}</span></p>
        <p>Countries Affected: <span class="stat-number">${countriesAffected}</span></p>
    `;

    stats.innerHTML = statsHTML;
}

// Handle window resize
window.addEventListener('resize', () => {
    d3.select('#map-container svg').remove();
    d3.select('#scatter-container svg').remove();
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then(world => {
            createMap(world);
            createLegend();
        });
    createScatterplot();
});

// Create the scatterplot
function createScatterplot() {
    const container = document.getElementById('scatter-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    const margin = { top: 50, right: 30, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select('#scatter-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Region color palette (categorical)
    const regionColors = {
        'Africa': '#e6c75a',
        'Americas': '#ff6b6b',
        'Asia': '#4ecdc4',
        'Europe': '#a78bfa',
        'Oceania': '#f97316'
    };

    // Toggle state: 'events' or 'deaths' — defaults to events
    let currentMetric = 'events';

    // Track which region is currently "focused" (null = none)
    let focusedRegion = null;

    // Expose a way for the popup close button to clear focus
    window._clearScatterFocus = function() {
        focusedRegion = null;
        applyFocusState();
    };

    // Add toggle buttons container
    const toggleContainer = svg.append('g')
        .attr('class', 'toggle-container')
        .attr('transform', `translate(${width / 2}, 15)`);

    // Events toggle button (active by default)
    const eventsToggle = toggleContainer.append('g')
        .attr('class', 'toggle-btn events-toggle')
        .attr('transform', 'translate(-80, 0)')
        .style('cursor', 'pointer');

    eventsToggle.append('rect')
        .attr('width', 70)
        .attr('height', 24)
        .attr('rx', 4)
        .attr('fill', '#ffffff')
        .attr('class', 'toggle-rect');

    eventsToggle.append('text')
        .attr('x', 35)
        .attr('y', 16)
        .attr('text-anchor', 'middle')
        .attr('fill', '#1e1f26')
        .attr('font-size', '0.75rem')
        .attr('font-weight', '600')
        .text('Events');

    // Deaths toggle button (inactive by default)
    const deathsToggle = toggleContainer.append('g')
        .attr('class', 'toggle-btn deaths-toggle')
        .attr('transform', 'translate(10, 0)')
        .style('cursor', 'pointer');

    deathsToggle.append('rect')
        .attr('width', 70)
        .attr('height', 24)
        .attr('rx', 4)
        .attr('fill', '#555')
        .attr('class', 'toggle-rect');

    deathsToggle.append('text')
        .attr('x', 35)
        .attr('y', 16)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '0.75rem')
        .attr('font-weight', '600')
        .text('Deaths');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Load and process data
    d3.csv('processed_wiidgtd.csv').then(data => {
        // Parse numeric values
        data.forEach(d => {
            d.gini = +d.gini;
            d.tot_events = +d.tot_events;
            d.tot_deaths = +d.tot_deaths;
            d.region = d.region_un;
        });

        // Get unique regions
        const regions = [...new Set(data.map(d => d.region))].filter(r => r);

        // Filter out entries with 0 values (can't plot on log scale)
        const eventsData = data.filter(d => d.tot_events > 0);
        const deathsData = data.filter(d => d.tot_deaths > 0);

        // X scale (Gini coefficient)
        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.gini))
            .range([0, innerWidth])
            .nice();

        // Y scales — LOG scale
        const yScaleEvents = d3.scaleLog()
            .domain([1, d3.max(data, d => d.tot_events)])
            .range([innerHeight, 0])
            .nice();

        const yScaleDeaths = d3.scaleLog()
            .domain([1, d3.max(data, d => d.tot_deaths)])
            .range([innerHeight, 0])
            .nice();

        // X axis
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text, line, path')
            .attr('stroke', '#ffffff')
            .attr('fill', '#ffffff');

        // X axis label
        g.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 35)
            .attr('fill', '#ffffff')
            .attr('text-anchor', 'middle')
            .attr('font-size', '0.85rem')
            .text('Gini Coefficient (High Inequality)');

        // Y axis group (will be updated on toggle)
        const yAxisGroup = g.append('g').attr('class', 'y-axis');

        // Y axis label (will be updated on toggle)
        const yAxisLabel = g.append('text')
            .attr('class', 'y-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -45)
            .attr('fill', '#d0d0d0')
            .attr('text-anchor', 'middle')
            .attr('font-size', '0.85rem');

        // LOESS smoothing function — using log-space for exponential scale
        function loess(data, xAccessor, yAccessor, bandwidth) {
            bandwidth = bandwidth || 0.3;
            const sortedData = [...data].sort((a, b) => xAccessor(a) - xAccessor(b));
            const result = [];

            const xMin = d3.min(sortedData, xAccessor);
            const xMax = d3.max(sortedData, xAccessor);
            const numPoints = 50;

            for (let i = 0; i <= numPoints; i++) {
                const x = xMin + (xMax - xMin) * (i / numPoints);

                const weights = sortedData.map(d => {
                    const dist = Math.abs(xAccessor(d) - x);
                    const maxDist = (xMax - xMin) * bandwidth;
                    if (dist > maxDist) return 0;
                    const u = dist / maxDist;
                    return Math.pow(1 - Math.pow(u, 3), 3);
                });

                const totalWeight = d3.sum(weights);
                if (totalWeight === 0) continue;

                const weightedSum = d3.sum(sortedData, (d, j) =>
                    weights[j] * Math.log(yAccessor(d))
                );
                const smoothedLogY = weightedSum / totalWeight;

                result.push({ x: x, y: Math.exp(smoothedLogY) });
            }

            return result;
        }

        // Scatter tooltip reference
        const scatterTooltip = d3.select('#scatter-tooltip');

        // Create main plot group
        const plotGroup = g.append('g').attr('class', 'plot-group');

        // Line generator
        const lineGenerator = d3.line()
            .curve(d3.curveCatmullRom);

        // Function to apply focus styling based on focusedRegion state
        function applyFocusState() {
            if (focusedRegion === null) {
                // Reset everything to defaults
                plotGroup.selectAll('.region-dots')
                    .attr('opacity', 0.2);
                plotGroup.selectAll('.region-line')
                    .attr('opacity', 0.85)
                    .attr('stroke-width', 3);
                plotGroup.selectAll('.global-line')
                    .attr('opacity', 0.9)
                    .attr('stroke-width', 4);

                // Reset map zoom
                resetMapZoom();
                // Hide popup
                hideRegionPopup();
            } else {
                // Dim all region dots and lines first
                plotGroup.selectAll('.region-dots')
                    .attr('opacity', 0.05);
                plotGroup.selectAll('.region-line')
                    .attr('opacity', 0.15)
                    .attr('stroke-width', 2);
                plotGroup.selectAll('.global-line')
                    .attr('opacity', 0.25)
                    .attr('stroke-width', 3);

                // Highlight the focused region
                plotGroup.selectAll('.region-dots-' + focusedRegion.replace(/\s/g, ''))
                    .attr('opacity', 0.6);
                plotGroup.selectAll('.region-line-' + focusedRegion.replace(/\s/g, ''))
                    .attr('opacity', 1)
                    .attr('stroke-width', 4);

                // Zoom map to region
                zoomMapToRegion(focusedRegion);
                // Show popup
                showRegionPopup(focusedRegion);
            }
        }

        // Click handler on the background to deselect
        svg.on('click', function(event) {
            // Only reset if clicking on the SVG background (not on a line)
            if (event.target.tagName === 'svg' || event.target.tagName === 'rect') {
                focusedRegion = null;
                applyFocusState();
            }
        });

        // Render function — redraws everything for the current metric
        function render() {
            const isEvents = currentMetric === 'events';
            const currentData = isEvents ? eventsData : deathsData;
            const yScale = isEvents ? yScaleEvents : yScaleDeaths;
            const yAccessor = isEvents ? (d => d.tot_events) : (d => d.tot_deaths);
            const labelText = isEvents ? 'Total Events' : 'Total Deaths';

            // Update line generator with current yScale
            lineGenerator
                .x(d => xScale(d.x))
                .y(d => yScale(d.y));

            // Update Y axis with log formatting
            yAxisGroup.selectAll('*').remove();
            yAxisGroup.call(d3.axisLeft(yScale).ticks(5, '~s'))
                .selectAll('text, line, path')
                .attr('stroke', '#d0d0d0')
                .attr('fill', '#d0d0d0');

            // Update Y axis label
            yAxisLabel.text(labelText);

            // Update toggle button styles (radio behavior)
            eventsToggle.select('.toggle-rect')
                .attr('fill', isEvents ? '#ffffff' : '#555');
            eventsToggle.select('text')
                .attr('fill', isEvents ? '#1e1f26' : '#ffffff');
            deathsToggle.select('.toggle-rect')
                .attr('fill', isEvents ? '#555' : '#ffffff');
            deathsToggle.select('text')
                .attr('fill', isEvents ? '#ffffff' : '#1e1f26');

            // Clear previous plot elements
            plotGroup.selectAll('*').remove();

            // Reset focus on metric change
            focusedRegion = null;
            resetMapZoom();
            hideRegionPopup();

            // Draw region dots and smooth lines
            regions.forEach(region => {
                const regionData = currentData.filter(d => d.region === region);
                if (regionData.length < 3) return;

                const color = regionColors[region] || '#888';
                const regionClass = region.replace(/\s/g, '');

                // Dots — slightly bigger (r=2.5), low default opacity
                plotGroup.selectAll('.dot-' + regionClass)
                    .data(regionData)
                    .enter()
                    .append('circle')
                    .attr('class', 'region-dots region-dots-' + regionClass)
                    .attr('cx', d => xScale(d.gini))
                    .attr('cy', d => yScale(yAccessor(d)))
                    .attr('r', 2.5)
                    .attr('fill', color)
                    .attr('opacity', 0.2);

                // Smooth line for this region — SOLID
                const regionSmooth = loess(regionData, d => d.gini, yAccessor, 0.4);

                plotGroup.append('path')
                    .datum(regionSmooth)
                    .attr('class', 'region-line region-line-' + regionClass)
                    .attr('fill', 'none')
                    .attr('stroke', color)
                    .attr('stroke-width', 3)
                    .attr('opacity', 0.85)
                    .attr('d', lineGenerator);

                // Invisible wider hit area for hover and click
                plotGroup.append('path')
                    .datum(regionSmooth)
                    .attr('class', 'region-line-hover')
                    .attr('fill', 'none')
                    .attr('stroke', 'transparent')
                    .attr('stroke-width', 18)
                    .attr('d', lineGenerator)
                    .style('cursor', 'pointer')
                    .on('mouseover', function(event) {
                        if (focusedRegion === null) {
                            plotGroup.selectAll('.region-line-' + regionClass)
                                .attr('stroke-width', 4.5)
                                .attr('opacity', 1);
                        }

                        scatterTooltip
                            .style('border-color', color)
                            .html('<span style="color:' + color + '; font-weight:600;">' + region + '</span>')
                            .style('opacity', 1);
                    })
                    .on('mousemove', function(event) {
                        const containerRect = container.getBoundingClientRect();
                        const mx = event.clientX - containerRect.left;
                        const my = event.clientY - containerRect.top;
                        scatterTooltip
                            .style('left', (mx + 12) + 'px')
                            .style('top', (my - 28) + 'px');
                    })
                    .on('mouseout', function() {
                        if (focusedRegion === null) {
                            plotGroup.selectAll('.region-line-' + regionClass)
                                .attr('stroke-width', 3)
                                .attr('opacity', 0.85);
                        }
                        scatterTooltip.style('opacity', 0);
                    })
                    .on('click', function(event) {
                        event.stopPropagation();
                        // Toggle: click same region again to deselect
                        if (focusedRegion === region) {
                            focusedRegion = null;
                        } else {
                            focusedRegion = region;
                        }
                        applyFocusState();
                    });
            });

            // Global smooth line — DASHED
            const globalSmooth = loess(currentData, d => d.gini, yAccessor, 0.4);

            plotGroup.append('path')
                .datum(globalSmooth)
                .attr('class', 'global-line')
                .attr('fill', 'none')
                .attr('stroke', '#d0d0d0')
                .attr('stroke-width', 4)
                .attr('stroke-dasharray', '8,5')
                .attr('opacity', 0.9)
                .attr('d', lineGenerator);

            // Invisible wider hit area for global line hover
            plotGroup.append('path')
                .datum(globalSmooth)
                .attr('class', 'global-line-hover')
                .attr('fill', 'none')
                .attr('stroke', 'transparent')
                .attr('stroke-width', 18)
                .attr('d', lineGenerator)
                .style('cursor', 'pointer')
                .on('mouseover', function(event) {
                    if (focusedRegion === null) {
                        d3.select(this.previousSibling)
                            .attr('stroke-width', 6)
                            .attr('opacity', 1);
                    }

                    scatterTooltip
                        .style('border-color', '#d0d0d0')
                        .html('<span style="color:#d0d0d0; font-weight:600;">Global (All Regions)</span>')
                        .style('opacity', 1);
                })
                .on('mousemove', function(event) {
                    const containerRect = container.getBoundingClientRect();
                    const mx = event.clientX - containerRect.left;
                    const my = event.clientY - containerRect.top;
                    scatterTooltip
                        .style('left', (mx + 12) + 'px')
                        .style('top', (my - 28) + 'px');
                })
                .on('mouseout', function() {
                    if (focusedRegion === null) {
                        d3.select(this.previousSibling)
                            .attr('stroke-width', 4)
                            .attr('opacity', 0.9);
                    }
                    scatterTooltip.style('opacity', 0);
                })
                .on('click', function(event) {
                    event.stopPropagation();
                    // Clicking the global line resets focus
                    focusedRegion = null;
                    applyFocusState();
                });

            // Small region legend in top-right of plot
            const legendG = plotGroup.append('g')
                .attr('class', 'region-legend')
                .attr('transform', 'translate(' + (innerWidth - 110) + ', 5)');

            const allEntries = regions.filter(r => {
                return currentData.filter(d => d.region === r).length >= 3;
            }).concat(['Global']);

            allEntries.forEach((entry, i) => {
                const isGlobal = entry === 'Global';
                const color = isGlobal ? '#d0d0d0' : (regionColors[entry] || '#888');

                const row = legendG.append('g')
                    .attr('transform', 'translate(0,' + (i * 14) + ')')
                    .style('cursor', isGlobal ? 'default' : 'pointer')
                    .on('click', function(event) {
                        event.stopPropagation();
                        if (isGlobal) {
                            focusedRegion = null;
                        } else if (focusedRegion === entry) {
                            focusedRegion = null;
                        } else {
                            focusedRegion = entry;
                        }
                        applyFocusState();
                    });

                if (isGlobal) {
                    row.append('line')
                        .attr('x1', 0).attr('y1', 5)
                        .attr('x2', 16).attr('y2', 5)
                        .attr('stroke', color)
                        .attr('stroke-width', 3)
                        .attr('stroke-dasharray', '4,3');
                } else {
                    row.append('line')
                        .attr('x1', 0).attr('y1', 5)
                        .attr('x2', 16).attr('y2', 5)
                        .attr('stroke', color)
                        .attr('stroke-width', 2.5);
                }

                row.append('text')
                    .attr('x', 20)
                    .attr('y', 9)
                    .attr('fill', color)
                    .attr('font-size', '0.6rem')
                    .attr('font-weight', '400')
                    .text(isGlobal ? 'Global' : entry);
            });
        }

        // Toggle event handlers — radio button behavior
        eventsToggle.on('click', function() {
            if (currentMetric !== 'events') {
                currentMetric = 'events';
                render();
            }
        });

        deathsToggle.on('click', function() {
            if (currentMetric !== 'deaths') {
                currentMetric = 'deaths';
                render();
            }
        });

        // Initial render (defaults to events)
        render();
    });
}

// Initialize on load
init();