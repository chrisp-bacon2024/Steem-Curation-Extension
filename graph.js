/**
 * Sort votes in ascending order by time.
 * @param {Array} activeVotes - The list of active votes.
 * @returns {Array} - The sorted list of active votes.
 */
const sortVotesByTime = (activeVotes) => {
    return activeVotes.sort((a, b) => new Date(a.time) - new Date(b.time));
};

/**
 * Determine the appropriate time unit (minutes, hours, or days) for the X-axis.
 * @param {Date} postCreationTime - The creation time of the post.
 * @param {Array} activeVotes - The list of active votes.
 * @returns {string} - The time unit ('minutes', 'hours', or 'days').
 */
const getTimeUnit = (postCreationTime, activeVotes) => {
    const latestVoteTime = activeVotes.reduce((latest, vote) => {
        const voteTime = new Date(vote.time).getTime();
        return voteTime > latest ? voteTime : latest;
    }, postCreationTime.getTime());

    const elapsedMs = latestVoteTime - postCreationTime.getTime();

    if (elapsedMs < 2 * 60 * 60 * 1000) return 'minutes'; // Less than 2 hours
    if (elapsedMs < 2 * 24 * 60 * 60 * 1000) return 'hours'; // Less than 2 days
    return 'days'; // 2 days or more
};

/**
 * Format the elapsed time based on the given time unit.
 * @param {number} elapsedMs - The elapsed time in milliseconds since post creation.
 * @param {string} timeUnit - The time unit ('minutes', 'hours', or 'days').
 * @returns {string} - The formatted time label.
 */
const formatTimeLabel = (elapsedMs, timeUnit) => {
    if (timeUnit === 'minutes') return `${Math.floor(elapsedMs / (60 * 1000))} min`;
    if (timeUnit === 'hours') return `${(elapsedMs / (60 * 60 * 1000)).toFixed(1)} hr`;
    return `${(elapsedMs / (24 * 60 * 60 * 1000)).toFixed(1)} d`;
};


/**
 * Create a graph with Chart.js.
 * @param {string} containerClass - The class of the container where the graph will be appended.
 * @param {string} canvasId - The ID for the canvas element.
 * @param {string} title - The title of the graph.
 * @param {Array} labels - The labels for the X-axis.
 * @param {Array} data - The data for the Y-axis.
 * @param {string} yAxisLabel - The label for the Y-axis.
 * @param {boolean} showDollarSign - Whether to show a dollar sign with datapoints on mouseover.
 */
const createLineGraph = (containerClass, canvasId, title, labels, datasets, yAxisLabel, showDollarSign = true) => {
    const graphContainer = document.querySelector(`.${containerClass}`);
    const isDarkMode = document.body.classList.contains('theme-dark');
    const textColor = isDarkMode ? '#FFFFFF' : '#333333';

    if (graphContainer) {
        // Create a wrapper div for the graph
        const wrapper = document.createElement('div');
        wrapper.className = `${canvasId}-wrapper chart-container`;
        wrapper.style.marginTop = '20px';

        // Create a new canvas element for the graph
        const canvas = document.createElement('canvas');
        canvas.id = canvasId;
        canvas.style.width = '100%';
        canvas.style.height = '300px';

        // Append the canvas to the wrapper and the wrapper to the container
        wrapper.appendChild(canvas);
        graphContainer.appendChild(wrapper);

        // Determine whether to show data point dots based on the number of data points
        const showDots = datasets[0].data.length <= 20;

        // Generate a graph using Chart.js
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets.map((dataset) => ({
                    label: dataset.label,
                    data: dataset.data,
                    backgroundColor: dataset.color.replace('1)', '0.2)'), // Transparent fill
                    borderColor: dataset.color,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: showDots ? 3 : 0,
                })),
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#AAA',
                        },
                    },
                    title: {
                        display: true,
                        color: textColor,
                        text: title,
                        font: {
                            size: 18,
                            weight: 'bold',
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: function (tooltipItem) {
                                return showDollarSign ?
                                    `$${tooltipItem.raw.toFixed(2)}` :
                                    `${tooltipItem.raw.toFixed(0)}`;  // Remove decimal places for non-dollar values
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time',
                            font: {
                                size: 14,
                                weight: 'bold',
                            },
                        },
                        ticks: {
                            color: '#AAA', // Neutral dark gray for tick marks
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxisLabel,
                            font: {
                                size: 14,
                                weight: 'bold',
                            },
                        },
                        ticks: {
                            color: '#AAA', // Neutral dark gray for tick marks
                        },
                    },
                },
            },
        });
    } else {
        console.error(`Element with class "${containerClass}" not found!`);
    }
};


/**
 * Format the elapsed time for evenly scaled intervals.
 * @param {number} elapsedMs - The elapsed time in milliseconds since post creation.
 * @param {number} maxElapsedMs - The maximum elapsed time in milliseconds.
 * @returns {string} - The formatted time label.
 */
const formatScaledTimeLabel = (elapsedMs, maxElapsedMs) => {
    if (maxElapsedMs < 2 * 60 * 60 * 1000) {
        // If the total time is less than 2 hours, show in minutes
        return `${Math.floor(elapsedMs / (60 * 1000))} min`;
    } else if (maxElapsedMs < 2 * 24 * 60 * 60 * 1000) {
        // If the total time is less than 2 days, show in hours
        return `${(elapsedMs / (60 * 60 * 1000)).toFixed(1)} hr`;
    } else {
        // If the total time is more than 2 days, show in days
        return `${(elapsedMs / (24 * 60 * 60 * 1000)).toFixed(1)} d`;
    }
};

/**
 * Create a line graph with clickable dots using Chart.js.
 * Clicking a dot navigates to the corresponding post.
 * @param {string} containerClass - The class of the container where the graph will be appended.
 * @param {string} canvasId - The ID for the canvas element.
 * @param {string} title - The title of the graph.
 * @param {Array} labels - The labels for the X-axis (e.g., Post numbers).
 * @param {Array} data - The data for the Y-axis (e.g., payout values).
 * @param {string} yAxisLabel - The label for the Y-axis.
 * @param {Array} posts - Array of Post objects to map clickable dots to their URLs.
 */
const createLineGraphWithClickableDots = (containerClass, canvasId, title, labels, data, yAxisLabel, posts) => {
    const graphContainer = document.querySelector(`.${containerClass}`);
    if (!graphContainer) {
        console.error(`Graph container not found: ${containerClass}`);
        return;
    }

    const isDarkMode = document.body.classList.contains('theme-dark');
    const textColor = isDarkMode ? '#FFFFFF' : '#333333';

    // Remove existing chart if it exists
    const existingCanvas = document.getElementById(canvasId);
    if (existingCanvas) {
        existingCanvas.remove();
    }

    // Create a new canvas element for the graph
    const canvas = document.createElement('canvas');
    canvas.id = canvasId;

    // Wrap the canvas in a styled container
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('chart-container');
    containerDiv.style.marginTop = '20px';
    containerDiv.appendChild(canvas);
    graphContainer.appendChild(containerDiv);

    // Create a custom status bar element
    const statusBar = document.createElement('div');
    statusBar.id = 'custom-status-bar';
    statusBar.style.display = 'none'; // Initially hidden
    document.body.appendChild(statusBar);

    // Generate the graph using Chart.js
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: title,
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: true,
                    color: textColor,
                    text: title,
                    font: {
                        size: 18,
                        weight: 'bold',
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            const postIndex = tooltipItem.dataIndex;
                            return `Payout: $${data[postIndex].toFixed(2)}`;
                        },
                    },
                    bodyFont: {
                        size: 14,
                    },
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Post Number',
                        font: {
                            size: 14,
                            weight: 'bold',
                        },
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel,
                        font: {
                            size: 14,
                            weight: 'bold',
                        },
                    },
                },
            },
            onClick: (event, elements) => {
                // This handles left-clicks.
                // Opening new tabs with middle-clicks is ouside the Chart in "handleMouseUp".
                if (elements.length > 0) {
                    const elementIndex = elements[0].index;
                    const post = posts[elementIndex];
                    const postUrl = `/@${post.details.author}/${post.details.permlink}`;
                        window.location.href = postUrl;
                }
            },
        },
    });

    // Add custom event listeners for mouseover and mouseout
    const handleMouseMove = (event) => {
        const element = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
        if (element.length > 0) {
            const elementIndex = element[0].index;
            const post = posts[elementIndex];
            const postUrl = `/@${post.details.author}/${post.details.permlink}`;
            canvas.style.cursor = 'pointer';
            statusBar.textContent = postUrl; // Update the status bar content
            statusBar.style.display = 'block'; // Show the status bar
        } else {
            canvas.style.cursor = 'default';
            statusBar.style.display = 'none'; // Hide the status bar
        }
    };

    const handleMouseOut = () => {
        canvas.style.cursor = 'default';
        statusBar.style.display = 'none'; // Hide the status bar
    };

    const handleMouseUp = (event) => {
        const elements = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
        if (elements.length > 0) {
            const elementIndex = elements[0].index;
            const post = posts[elementIndex];
            const postUrl = `/@${post.details.author}/${post.details.permlink}`;
            
            if (event.button === 1) { // Middle mouse button
                event.preventDefault();
                window.open(postUrl, '_blank');
            }
        }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseout', handleMouseOut);
    canvas.addEventListener('mouseup', handleMouseUp );

    // Optionally, return a cleanup function to remove event listeners and the status bar
    return () => {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseout', handleMouseOut);
        document.body.removeChild(statusBar);
    };
};

/**
 * Creates a bar graph using Chart.js within a specified container.
 * 
 * @param {string} containerClass - The class of the container where the graph will be appended.
 * @param {string} canvasId - The ID for the canvas element that will be created for the graph.
 * @param {string} title - The title of the graph, displayed at the top.
 * @param {Array<string>} labels - An array of labels for the X-axis, representing categories or groups.
 * @param {Array<number>} data - An array of numerical data points corresponding to each label.
 * @param {string} yAxisLabel - The label for the Y-axis, describing the units of the data.
 * @param {Array<string>} colors - An array of color strings for each bar in the graph.
 * @returns {void}
 */
const createBarGraph = (containerClass, canvasId, title, labels, data, yAxisLabel, colors) => {
    const graphContainer = document.querySelector(`.${containerClass}`);
    if (!graphContainer) {
        console.error(`Graph container not found: ${containerClass}`);
        return;
    }

    const isDarkMode = document.body.classList.contains('theme-dark');
    const textColor = isDarkMode ? '#FFFFFF' : '#333333';

    // Remove existing chart if it exists
    const existingCanvas = document.getElementById(canvasId);
    if (existingCanvas) {
        existingCanvas.remove();
    }

    // Create a new canvas element for the graph
    const canvas = document.createElement('canvas');
    canvas.id = canvasId;

    // Wrap the canvas in a styled container
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('chart-container');
    containerDiv.style.marginTop = '20px';
    containerDiv.appendChild(canvas);
    graphContainer.appendChild(containerDiv);

    // Generate the graph using Chart.js
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: title,
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.7', '1.0')),
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: true,
                    color: textColor,
                    text: title,
                    font: {
                        size: 18,
                        weight: 'bold',
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            return `$${tooltipItem.raw.toFixed(2)}`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Category',
                        font: {
                            size: 14,
                            weight: 'bold',
                        },
                    },
                    ticks: {
                        color: '#AAA',
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel,
                        font: {
                            size: 14,
                            weight: 'bold',
                        },
                    },
                    ticks: {
                        color: '#AAA',
                    },
                },
            },
        },
    });
};

class EfficiencyScatter {
    static get ICONS() {
        return {
            feather: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.24 4.56c-2.34-2.34-6.14-2.34-8.48 0L3 13.32V21h7.68l8.56-8.76c2.34-2.34 2.34-6.14 0-8.48zM9.4 19H5v-4.4l6.02-6.17 4.37 4.37L9.4 19zm7.78-7.88-4.28-4.28c1.56-1.56 4.1-1.56 5.66 0s1.56 4.1 0 5.66z"/></svg>`,
            dumbbell: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 4h2v4h2v4h-2v4h-2V4zM2 8h2V4h2v16H4v-4H2V8zm6 4h8v-2H8v2z"/></svg>`
        };
    }

    constructor({
        anchorTs,
        days = 7,
        containerEl,
        label = '',
        yBaselineMin = 0,
        language
    }) {
        this.containerEl = containerEl;
        this.label = label;
        this.yBaselineMin = yBaselineMin;
        this.language = language;

        this.showWeighted = false;
        this._minPointTs = -Infinity;
        this.finalized = false;
        this._rawPoints = [];

        this.anchorMs = this._toMs(anchorTs ?? Date.now());
        this.startMs = new Date(this.anchorMs - (days + 1) * 24 * 60 * 60 * 1000).getTime();
        this.endMs = this._midnight(new Date(this.anchorMs)).getTime();
        this.createChart()
    }

    createChart() {
        this.containerEl.innerHTML = '';

        const languageData = getEfficiencyGraphInLang(this.language);
        this.langData = languageData;

        // toggle button pinned over chart
        this._toggleBtn = document.createElement('button');
        this._toggleBtn.className = 'eff-toggle';
        this.containerEl.appendChild(this._toggleBtn);
        this._renderToggle(); // set initial icon + title

        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.containerEl.appendChild(this.canvas);

        const ctx = this.canvas.getContext('2d');
        const isDark = document.body.classList.contains('theme-dark');
        const textColor = isDark ? '#fcfcfc' : '#373737'; // Set text color based on dark mode
        const oneDayMs = 24 * 60 * 60 * 1000;
        const steemitGreen = 'rgba(22, 216, 174, 0.40)'; // main points
        const authorColor  = 'rgba(180, 53, 42, 0.75)'; // amber-ish for same-author posts

        this.chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: `${this.label} Efficiency`,
                    data: [],
                    parsing: {
                        xAxisKey: 'x',
                        yAxisKey: 'y'
                    },
                    showLine: false,
                    backgroundColor: (ctx) => {
                        const raw = ctx.raw;
                        return raw?.sameAuthor
                            ? authorColor   
                        : steemitGreen;
                    },
                    borderColor: (ctx) => {
                        const raw = ctx. raw
                        return raw?.sameAuthor
                            ? authorColor
                        : steemitGreen;
                    },
                    pointRadius: 3,
                    pointHoverRadius: 5,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {duration: 200 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const ds = items[0].dataset;

                                if (ds._id === 'mean-line' || ds._id === 'median-line') return '';

                                const x = items[0].parsed.x;
                                return this._fmtDate(new Date(x));
                            },
                            label: (ctx) => {
                                const id = ctx.dataset._id;
                                const y = ctx.parsed.y;

                                if (id === 'mean-line') return `${languageData["mean"]}: ${y.toFixed(0)}%`;
                                if (id === 'median-line') return `${languageData["median"]} ${y.toFixed(0)}%`;

                                const d = new Date(ctx.parsed.x);
                                const r = ctx.raw;
                                const voterVal = r?.voterRewardValue;
                                const totalVal = r?.totalValue;

                                const main = this.showWeighted ? `${languageData['weightedEff']}: ${y}%` : `${languageData['efficiency']}: ${y}%`;

                                const alt  = this.showWeighted && Number.isFinite(r?.efficiency)
                                ? `${languageData["efficiency"]}: ${Math.round(r.efficiency)}%`
                                : (!this.showWeighted && Number.isFinite(r?.weightedEff)
                                    ? `${languageData["weightedEff"]}: ${Math.round(r.weightedEff)}%`
                                    : null);
                                
                                return [
                                    main,
                                    alt,
                                    voterVal != null ? `${languageData["voterReceived"]}: ${formatValueLanguage('$', voterVal, this.language)}` : null,
                                    totalVal != null ? `${languageData['totalValue']}: ${formatValueLanguage('$', totalVal, this.language)}` : null,
                                ];
                            }
                        }
                    }
                }, 
                scales: {
                    x: {
                        type: 'linear',
                        min: this.startMs,
                        max: this.endMs,
                        title: { display: true, text: `${languageData["date"]}`, color: textColor },
                        bounds: 'ticks',
                        ticks: {
                            autoSkip: false,
                            stepSize: oneDayMs,
                            maxTicksLimit: 1000,
                            color: '#c5c5c5',
                            callback: (v, idx, ticks) => {
                                const d = new Date(v);
                                const totalDays = Math.round((this.endMs - this.startMs) / oneDayMs) + 0.1;
                                const pxPerLabel = 48;
                                const needed = totalDays * pxPerLabel;
                                const have = this.canvas.clientWidth || 0;
                                const fmtDD = new Intl.DateTimeFormat(undefined, { day: '2-digit' });

                                const prev = idx > 0 ? new Date(ticks[idx - 1].value) : null;
                                const monthChanged = !prev || d.getMonth() !== prev.getMonth();
                                const isFirst = d.getDate() === 1;

                                if (monthChanged || isFirst) return formatDateLanguage(d, this.language);

                                return (needed > have) ? fmtDD.format(d) : formatDateLanguage(d, this.language);
                                },
                            }, 
                        grid: { display: true },
                    },
                    y: {
                        min: this.yBaselineMin,
                        title: { display: true, text: `${languageData["efficiency"]} (%)`, color: textColor },
                        ticks: { color: '#c5c5c5' },
                    }
                },
            }
        });
        this._toggleBtn.onclick = () => this.toggleMode();
    }

    pushPoint({
                tsMs,
                efficiency,
                weightedEff,
                voterRewardValue,
                totalValue,
                sameAuthor,
                pad = 5
            }) {
        if (!Number.isFinite(tsMs) || !Number.isFinite(efficiency)) {
            console.warn('Skipping non numeric point', {tsMs, efficiency })
            return
        }

        const rawPoint = { 
            tsMs, 
            efficiency, 
            weightedEff, 
            voterRewardValue, 
            totalValue, 
            sameAuthor 
        };
        
        this._rawPoints.push(rawPoint);

        if (!this.chart) return;

        const y = Math.round(this.showWeighted ? weightedEff : efficiency);

        const dataset = this.chart.data.datasets[0].data;
        dataset.push({ 
            x: tsMs, y,
            efficiency, // both for tool tip
            weightedEff,
            voterRewardValue,
            totalValue,
            sameAuthor
        });

        const yScale = this.chart.options.scales.y;
        const candidateMax = Math.ceil(y + pad);

        if (tsMs < this._minPointTs){
            this._minPointTs = tsMs;
            console.log(tsMs)
            this.chart.options.scales.x.min = tsMs - 5
        }

        if (!yScale.max || candidateMax > yScale.max) {
            yScale.max = candidateMax;
        }
        try {
            this.chart.update('none');
        } catch (e) {
            console.error('Chart update failed:', e);
        }
    }

    toggleMode() {
        this.showWeighted = !this.showWeighted;
        this._renderToggle();
        const languageData = this.langData;

        // labels
        this.chart.data.datasets[0].label =
            this.showWeighted ? `${this.label} Weighted Efficiency`
                : `${this.label} Efficiency`;
        this.chart.options.scales.y.title.text =
            this.showWeighted ?  `${languageData["weightedEff"]} (%)` : `${languageData["efficiency"]} (%)`;
        
        // remap every plotted point's y from the raw data
        const ds = this.chart.data.datasets[0];
        ds.data.forEach(p => {
            p.y = Math.round(this.showWeighted ? p.weightedEff : p.efficiency);
        });

        // reset y-axis max and stats
        this._resetGuideLines();
        const yVals = ds.data.map(p => p.y).filter(Number.isFinite);
        this.chart.options.scales.y.max = yVals.length ? Math.ceil(Math.max(...yVals, this.yBaselineMin) + 5) : undefined;
        this.addStatsLines(); // recompute mean/median on current view

        this.chart.update()
    }

    addStatsLines(){
        if (!this.chart) return;
        if (this.finalized){
            const { mean, median } = this._stats();

            if (mean) {
                const meanColor = 'rgba(107,114,128,0.8)';
                this._upsertLineDataset('mean-line', mean, meanColor, 'Mean')
            };
            if (median) {
                const medianColor = 'rgba(55,65,81,0.9)'
                this._upsertLineDataset('median-line', median, medianColor, 'Median');
            };

            const yMax = Math.max(
                this.chart.options.scales.y.max ?? -Infinity,
                mean ?? -Infinity,
                median ?? -Infinity
            );
            if (Number.isFinite(yMax)) {
                this.chart.options.scales.y.max = Math.ceil(yMax + 5);
            }

            this.chart.update();
            }
    }


    finalize() {
        this.finalized = true;
        this.chart.update();
    }

    destroy(){
        this.chart.destroy();
        this.containerEl.innerHTML = '';
    }

    _toMs(t) {
        if (t instanceof Date) return t.getTime();
        if (typeof t === 'number') return t < 1e12 ? t * 1000 : t;
        return new Date(t).getTime();
    }

    _midnight(d) {
        const m = new Date(d);
        m.setHours(0, 0, 0, 0);
        return m;
    }

    _fmtDate(d){
        const date = d.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        });
        const time = d.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${date}, ${time}`;
    }

     _yValues() {
        const ds = this.chart.data.datasets[0].data;
        return ds.map(p => p.y).filter(n => Number.isFinite(n));
    }

    _getY(p) {
        const v = this.showWeighted ? p.weightedEff : p.efficiency;
        return Number.isFinite(v) ? Math.round(v) : null;
    }

    _applyModeToDataset(updateMode = 'none') {
        if (!this.chart) return;
        const ds = this.chart.data.datasets[0];
        ds.data = this._rawPoints.map(p => {
            const y = this._getY(p);
            if (y == null) return null;
            return {
                x: p.tsMs, y,
                efficiency: p.efficiency,
                weightedEff: p.weightedEff,
                voterRewardValue: p.voterRewardValue,
                totalValue: p.totalValue,
                sameAuthor: p.sameAuthor
            };
        }).filter(Boolean);
        try { this.chart.update(updateMode); } catch {}
    }

    _resetGuideLines() {
        this.chart.data.datasets = this.chart.data.datasets.filter(d =>
            !['mean-line','median-line','weightedMean-line'].includes(d._id)
        );
    }

    _rebuildFromRaw() {
        this._applyModeToDataset('none');
        this._refreshYScaleAndStats();
    }

    _renderToggle() {
        const toggleLang = getEfficiencyToggle(this.language);
        const icon = this.showWeighted ? EfficiencyScatter.ICONS.dumbbell
                                        : EfficiencyScatter.ICONS.feather;
        this._toggleBtn.innerHTML = icon;
        this._toggleBtn.setAttribute('aria-pressed', this.showWeighted ? 'true' : 'false');
        this._toggleBtn.title = this.showWeighted
            ? toggleLang['dumbbell']
            : toggleLang['feather'];
    }

    _stats() {
        const ys = this._yValues().slice().sort((a,b) => a-b);
        if (!ys.length) return {mean: null, median: null };

        const mean = ys.reduce((s,n) => s+n, 0) / ys.length;
        const mid = Math.floor(ys.length / 2);
        const median = ys.length % 2 ? ys[mid] : (ys[mid-1] + ys[mid]) / 2;

        return { mean, median };
    }

    _upsertLineDataset(id, y, color, label) {
        if (y == null || !Number.isFinite(y)) return;

        const minX = this.chart.options.scales.x.min;
        const maxX = this.chart.options.scales.x.max;
        const midX = (minX + maxX) / 2;

        const lineData = [{ x: minX, y}, { x: midX, y }, { x: maxX, y }];

        const baseCfg = {
            _id: id,
            type: 'line',
            label,
            data: lineData,
            parsing: false,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 1.5,
            fill: false,
            tension: 0,

            pointRadius: 0,
            pointHoverRadius: 0,
            pointHitRadius: 12,
        };

        const ix = this.chart.data.datasets.findIndex(d => d._id === id);
        if (ix >= 0) {
            Object.assign(this.chart.data.datasets[ix], baseCfg)
        } else {
            this.chart.data.datasets.push(baseCfg);
        }

    }
};