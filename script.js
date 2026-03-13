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

// ── Additional global state ──
let wiidgtdData = [];
let countryRegionMap = {};
let openCountryPopups = [];   // [{ gtdName, el }]
let popupZCounter = 510;      // z-index above region popup (500)

// TopoJSON country name → GTD country name (used in map rendering and hover)
const topoToGtdNameMap = {
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

// Reference to popup elements
const regionPopup      = () => document.getElementById('region-popup');
const regionPopupTitle  = () => document.getElementById('region-popup-title');
const regionPopupBody   = () => document.getElementById('region-popup-body');
const regionPopupClose  = () => document.getElementById('region-popup-close');

// Initialize the visualization
async function init() {
    try {
        const [world, csvData, wiidData] = await Promise.all([
            d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
            d3.csv('data/processed_gtd.csv'),
            d3.csv('data/processed_wiidgtd.csv')
        ]);

        // Store wiidgtd globally and build country → region map
        wiidgtdData = wiidData;
        wiidData.forEach(d => {
            if (d.country_txt && d.region_un && !countryRegionMap[d.country_txt]) {
                countryRegionMap[d.country_txt] = d.region_un;
            }
        });

        processData(csvData);
        createMap(world);
        createLegend();
        displayStats();
        createScatterplot();

        // Wire up popup close buttons
        regionPopupClose().addEventListener('click', () => {
            hideRegionPopup();
            if (window._clearScatterFocus) window._clearScatterFocus();
        });
        // Country popups are self-contained — no global close button needed

    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('map-container').innerHTML =
            '<p style="padding: 20px; color: #D4821A;">Error loading data. Please check the console.</p>';
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
            const mappedName = topoToGtdNameMap[name] || name;
            const stats = countryStats[mappedName];
            return stats ? colorScale(stats.totalEvents) : '#1E2330';
        })
        .attr('data-region', d => {
            const mappedName = topoToGtdNameMap[d.properties.name] || d.properties.name;
            return countryRegionMap[mappedName] || '';
        })
        .on('mouseover', handleMouseOver)
        .on('mousemove', handleMouseMove)
        .on('mouseout', handleMouseOut)
        .on('click', function(event, d) {
            event.stopPropagation();
            const topoName = d.properties.name;
            const gtdName = topoToGtdNameMap[topoName] || topoName;
            showCountryPopup(gtdName, topoName);
        });
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

// ── Country detail popups — two fixed slots: left (0) and right (1) ──
function showCountryPopup(gtdName, topoName) {
    // If already open, bring to front and mark as recently used
    const existing = openCountryPopups.find(p => p.gtdName === gtdName);
    if (existing) {
        existing.el.style.zIndex = ++popupZCounter;
        existing.openedAt = Date.now();
        return;
    }

    // Determine which slot to use
    let slotIdx;
    if (openCountryPopups.length < 2) {
        // Use the first free slot
        const used = new Set(openCountryPopups.map(p => p.slotIdx));
        slotIdx = [0, 1].find(i => !used.has(i));
    } else {
        // Replace the least recently opened
        const oldest = openCountryPopups.reduce((a, b) => a.openedAt < b.openedAt ? a : b);
        slotIdx = oldest.slotIdx;
        oldest.el.remove();
        openCountryPopups = openCountryPopups.filter(p => p !== oldest);
    }

    const stats       = countryStats[gtdName];
    const countryData = wiidgtdData.filter(d => d.country_txt === gtdName);
    const region      = countryRegionMap[gtdName] || '';
    const color       = regionColorMap[region] || '#888';
    const displayName = (stats && stats.name) || gtdName || topoName;
    const uid         = 'cp' + Date.now();

    const popup = document.createElement('div');
    popup.className = 'country-popup';
    popup.style.top    = '20px';
    popup.style.zIndex = ++popupZCounter;
    popup.style.borderColor = color;

    if (slotIdx === 0) {
        popup.style.left = '20px';
    } else {
        popup.style.right = '20px';
        popup.classList.add('right-slot');
    }

    const hasTimeSeries = countryData.length >= 2;
    const hasGini = hasTimeSeries && countryData.some(d => +d.gini > 0);

    let body = '';
    if (region) body += `<span class="country-popup-region" style="color:${color}; border-color:${color}55;">${region}</span>`;

    if (stats) {
        body += `<div class="country-popup-stats">
            <p>Events 1970–2020: <span class="cp-stat-num">${stats.totalEvents.toLocaleString()}</span></p>
            <p>Deaths 1970–2020: <span class="cp-stat-num">${stats.totalDeaths.toLocaleString()}</span></p>
        </div>`;
    } else {
        body += '<p class="cp-no-data">No terrorism events recorded</p>';
    }

    if (hasTimeSeries) {
        body += `<p class="cp-chart-label">Attacks per year</p><div id="${uid}-events"></div>`;
        if (hasGini) body += `<p class="cp-chart-label">Gini coefficient</p><div id="${uid}-gini"></div>`;
    } else {
        body += '<p class="cp-no-data">No year-by-year data available</p>';
    }

    if (stats && stats.attackTypes.length > 0) {
        body += `<p class="cp-chart-label" style="margin-top:10px;">Top attack types</p>
            <p class="cp-attack-types">${stats.attackTypes.slice(0, 3).join(' · ')}</p>`;
    }

    popup.innerHTML = `
        <button class="country-popup-close">&times;</button>
        <h3 class="country-popup-title" style="color:${color};">${displayName}</h3>
        <div class="country-popup-body">${body}</div>`;

    document.querySelector('.map-section').appendChild(popup);
    openCountryPopups.push({ gtdName, el: popup, slotIdx, openedAt: Date.now() });

    // Force reflow so the initial CSS state is painted before the transition
    popup.offsetHeight;
    popup.classList.add('visible');

    // Render sparklines now that the elements are in the DOM
    if (hasTimeSeries) {
        const sorted = [...countryData].sort((a, b) => +a.iyear - +b.iyear);
        renderSparkline(`${uid}-events`, sorted, 'iyear', 'tot_events', color);
        if (hasGini) {
            const giniData = sorted.filter(d => +d.gini > 0);
            if (giniData.length >= 2) renderSparkline(`${uid}-gini`, giniData, 'iyear', 'gini', '#555B66');
        }
    }

    // Close button removes just this popup
    popup.querySelector('.country-popup-close').addEventListener('click', () => {
        popup.classList.remove('visible');
        setTimeout(() => {
            popup.remove();
            openCountryPopups = openCountryPopups.filter(p => p.el !== popup);
        }, 350);
    });

    // Click anywhere on popup to bring it to the front
    popup.addEventListener('mousedown', () => {
        popup.style.zIndex = ++popupZCounter;
    });
}

function hideCountryPopup() {
    openCountryPopups.forEach(({ el }) => el.remove());
    openCountryPopups = [];
}

function renderSparkline(containerId, data, xKey, yKey, color) {
    const el = document.getElementById(containerId);
    if (!el || data.length < 2) return;

    const W = 224, H = 54;
    const m = { top: 4, right: 4, bottom: 16, left: 32 };
    const iW = W - m.left - m.right;
    const iH = H - m.top - m.bottom;

    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);

    const xs = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[xKey]))
        .range([0, iW]);

    const yMax = d3.max(data, d => +d[yKey]);
    const ys = d3.scaleLinear()
        .domain([0, yMax])
        .range([iH, 0]);

    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    // Area fill
    g.append('path')
        .datum(data)
        .attr('fill', color + '22')
        .attr('d', d3.area().x(d => xs(+d[xKey])).y0(iH).y1(d => ys(+d[yKey])));

    // Line
    g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('d', d3.line().x(d => xs(+d[xKey])).y(d => ys(+d[yKey])));

    const fmtY = v => yMax >= 1000 ? (v / 1000).toFixed(1) + 'k' : (+v).toFixed(yKey === 'gini' ? 1 : 0);
    const labelStyle = sel => sel
        .attr('fill', '#555B66')
        .attr('font-size', '8px')
        .attr('font-family', 'Oswald, sans-serif');

    // Y labels
    labelStyle(svg.append('text').attr('x', m.left - 3).attr('y', m.top + 9).attr('text-anchor', 'end')).text(fmtY(yMax));
    labelStyle(svg.append('text').attr('x', m.left - 3).attr('y', H - m.bottom).attr('text-anchor', 'end')).text('0');

    // X labels
    const years = data.map(d => +d[xKey]);
    labelStyle(svg.append('text').attr('x', m.left).attr('y', H - 2)).text(d3.min(years));
    labelStyle(svg.append('text').attr('x', W - m.right).attr('y', H - 2).attr('text-anchor', 'end')).text(d3.max(years));
}

// Tooltip event handlers
function handleMouseOver(event, d) {
    const countryName = d.properties.name;
    const mappedName = topoToGtdNameMap[countryName] || countryName;
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

    const midVal = Math.round(maxEvents / 2).toLocaleString();
    const maxVal = maxEvents.toLocaleString();

    const legendHTML = `
        <h3>Total Attacks (1970–2020)</h3>
        <div class="legend-scale">
            <div>
                <div class="legend-gradient" style="background: linear-gradient(to right,
                    ${colorScale(0)},
                    ${colorScale(maxEvents * 0.25)},
                    ${colorScale(maxEvents * 0.5)},
                    ${colorScale(maxEvents * 0.75)},
                    ${colorScale(maxEvents)});">
                </div>
                <div class="legend-labels">
                    <span>0</span>
                    <span>${midVal}</span>
                    <span>${maxVal}</span>
                </div>
            </div>
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

    const margin = { top: 12, right: 30, bottom: 40, left: 60 };
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
        .attr('fill', '#C9D1D9')
        .attr('class', 'toggle-rect');

    eventsToggle.append('text')
        .attr('x', 35)
        .attr('y', 16)
        .attr('text-anchor', 'middle')
        .attr('fill', '#0D1117')
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
        .attr('fill', '#21262D')
        .attr('class', 'toggle-rect');

    deathsToggle.append('text')
        .attr('x', 35)
        .attr('y', 16)
        .attr('text-anchor', 'middle')
        .attr('fill', '#555B66')
        .attr('font-size', '0.75rem')
        .attr('font-weight', '600')
        .text('Deaths');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Load and process data
    d3.csv('data/processed_wiidgtd.csv').then(data => {
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
            .attr('stroke', '#8B949E')
            .attr('fill', '#8B949E');

        // X axis label
        g.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 35)
            .attr('fill', '#8B949E')
            .attr('text-anchor', 'middle')
            .attr('font-size', '0.85rem')
            .text('← Lower Inequality    Gini Coefficient    Higher Inequality →');

        // Y axis group (will be updated on toggle)
        const yAxisGroup = g.append('g').attr('class', 'y-axis');

        // Y axis label (will be updated on toggle)
        const yAxisLabel = g.append('text')
            .attr('class', 'y-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -45)
            .attr('fill', '#8B949E')
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

                // Reset map zoom and country highlighting
                resetMapZoom();
                if (mapG) {
                    mapG.selectAll('.country')
                        .transition().duration(600)
                        .attr('opacity', 1)
                        .attr('stroke', '#0D1117')
                        .attr('stroke-width', 0.2);
                }
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

                // Zoom map and cross-highlight countries in focused region
                zoomMapToRegion(focusedRegion);
                if (mapG) {
                    mapG.selectAll('.country')
                        .transition().duration(600)
                        .attr('opacity', 0.15)
                        .attr('stroke', '#0D1117')
                        .attr('stroke-width', 0.2);
                    mapG.selectAll(`.country[data-region="${focusedRegion}"]`)
                        .transition().duration(600)
                        .attr('opacity', 1)
                        .attr('stroke', regionColorMap[focusedRegion])
                        .attr('stroke-width', 0.8);
                }
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
                .attr('stroke', '#8B949E')
                .attr('fill', '#8B949E');

            // Update Y axis label
            yAxisLabel.text(labelText);

            // Update toggle button styles (radio behavior)
            eventsToggle.select('.toggle-rect')
                .attr('fill', isEvents ? '#C9D1D9' : '#21262D');
            eventsToggle.select('text')
                .attr('fill', isEvents ? '#0D1117' : '#555B66');
            deathsToggle.select('.toggle-rect')
                .attr('fill', isEvents ? '#21262D' : '#C9D1D9');
            deathsToggle.select('text')
                .attr('fill', isEvents ? '#555B66' : '#0D1117');

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

                // Dots — with enter animation and hover tooltip
                const regionSmooth = loess(regionData, d => d.gini, yAccessor, 0.4);

                plotGroup.selectAll('.dot-' + regionClass)
                    .data(regionData)
                    .enter()
                    .append('circle')
                    .attr('class', 'region-dots region-dots-' + regionClass)
                    .attr('cx', d => xScale(d.gini))
                    .attr('cy', innerHeight)
                    .attr('r', 2.5)
                    .attr('fill', color)
                    .attr('opacity', 0)
                    .style('cursor', 'crosshair')
                    .on('mouseover', function(_event, d) {
                        d3.select(this).raise()
                            .transition().duration(80)
                            .attr('r', 5)
                            .attr('opacity', 0.95);
                        const val = isEvents ? +d.tot_events : +d.tot_deaths;
                        const label = isEvents ? 'events' : 'deaths';
                        scatterTooltip
                            .style('border-color', color)
                            .html(`<span style="color:${color}; font-weight:600;">${d.country_txt}</span> <span style="color:#555B66; font-size:0.65rem;">${d.iyear}</span><br><span style="color:#8B949E; font-size:0.7rem;">Gini ${(+d.gini).toFixed(1)} &nbsp;·&nbsp; ${val.toLocaleString()} ${label}</span>`)
                            .style('opacity', 1);
                    })
                    .on('mousemove', function(event) {
                        const cr = container.getBoundingClientRect();
                        scatterTooltip
                            .style('left', (event.clientX - cr.left + 12) + 'px')
                            .style('top',  (event.clientY - cr.top  - 40) + 'px');
                    })
                    .on('mouseout', function() {
                        const targetOpacity = focusedRegion === null ? 0.2
                            : (focusedRegion === region ? 0.6 : 0.05);
                        d3.select(this)
                            .transition().duration(80)
                            .attr('r', 2.5)
                            .attr('opacity', targetOpacity);
                        scatterTooltip.style('opacity', 0);
                    })
                    .transition()
                    .duration(500)
                    .delay((d, i) => i * 3)
                    .attr('cy', d => yScale(yAccessor(d)))
                    .attr('opacity', 0.2);

                // Smooth line for this region — SOLID with draw animation
                const regionPath = plotGroup.append('path')
                    .datum(regionSmooth)
                    .attr('class', 'region-line region-line-' + regionClass)
                    .attr('fill', 'none')
                    .attr('stroke', color)
                    .attr('stroke-width', 3)
                    .attr('opacity', 0.85)
                    .attr('d', lineGenerator);

                // Animate the path drawing
                const totalLength = regionPath.node().getTotalLength();
                regionPath
                    .attr('stroke-dasharray', totalLength + ' ' + totalLength)
                    .attr('stroke-dashoffset', totalLength)
                    .transition()
                    .duration(800)
                    .ease(d3.easeCubicOut)
                    .attr('stroke-dashoffset', 0);

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

            const globalPath = plotGroup.append('path')
                .datum(globalSmooth)
                .attr('class', 'global-line')
                .attr('fill', 'none')
                .attr('stroke', '#555B66')
                .attr('stroke-width', 4)
                .attr('stroke-dasharray', '8,5')
                .attr('opacity', 0.9)
                .attr('d', lineGenerator);

            // No dash-offset animation for dashed line (conflicts with dash pattern)
            globalPath
                .attr('opacity', 0)
                .transition()
                .duration(800)
                .attr('opacity', 0.9);

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
                        .style('border-color', '#555B66')
                        .html('<span style="color:#555B66; font-weight:600;">Global (All Regions)</span>')
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
                const color = isGlobal ? '#555B66' : (regionColors[entry] || '#8B949E');

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
                    .attr('font-size', '0.65rem')
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