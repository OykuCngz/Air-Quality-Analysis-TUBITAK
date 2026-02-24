
const CHART_CONFIG = {
    colors: {
        primary: '#1e90ff',
        primaryLight: '#4da6ff',
        gradient: {
            start: 'rgba(30, 144, 255, 0.3)',
            end: 'rgba(30, 144, 255, 0.05)'
        },
        grid: 'rgba(255, 255, 255, 0.1)',
        text: '#a0aec0'
    },
    font: {
        family: 'Inter, sans-serif',
        size: 11
    }
};

let trendChart = null;
let historicalChart = null;
let liveTrendData = Array(10).fill(42.5);


function generateTrendData(points = 10) {
    const data = [];
    const labels = [];
    const now = new Date();

    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 10 * 60 * 1000);
        const label = i === 0 ? 'ŞİMDİ' : `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
        labels.push(label);

        const baseValue = 40 + Math.sin(i / 2) * 10;
        data.push(Math.max(0, baseValue));
    }

    return { labels, data };
}


function generateBarData(points = 10) {
    const data = [];
    for (let i = 0; i < points; i++) {
        data.push(30 + Math.random() * 40);
    }
    return data;
}

function initTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { labels, data } = generateTrendData(10);

    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, CHART_CONFIG.colors.gradient.start);
    gradient.addColorStop(1, CHART_CONFIG.colors.gradient.end);

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'PM10 Prediction',
                data: data,
                borderColor: CHART_CONFIG.colors.primary,
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: CHART_CONFIG.colors.primary,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(21, 27, 39, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#a0aec0',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `PM10: ${context.parsed.y.toFixed(1)} µg/m³`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: CHART_CONFIG.colors.text,
                        font: {
                            family: CHART_CONFIG.font.family,
                            size: CHART_CONFIG.font.size
                        },
                        maxRotation: 0
                    },
                    border: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        color: CHART_CONFIG.colors.grid,
                        drawBorder: false
                    },
                    ticks: {
                        color: CHART_CONFIG.colors.text,
                        font: {
                            family: CHART_CONFIG.font.family,
                            size: CHART_CONFIG.font.size
                        },
                        callback: (value) => `${value}`
                    },
                    border: {
                        display: false
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function initHistoricalChart() {
    const canvas = document.getElementById('historicalChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = generateBarData(10);
    const labels = Array(10).fill('').map((_, i) => i === 9 ? 'NOW' : '');

    historicalChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'PM10 Historical',
                data: data,
                backgroundColor: data.map((value, index) => {
                    if (index === data.length - 1) {
                        return CHART_CONFIG.colors.primary;
                    }
                    return CHART_CONFIG.colors.gradient.start;
                }),
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(21, 27, 39, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#a0aec0',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: () => '',
                        label: (context) => `${context.parsed.y.toFixed(1)} µg/m³`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: CHART_CONFIG.colors.text,
                        font: {
                            family: CHART_CONFIG.font.family,
                            size: CHART_CONFIG.font.size
                        }
                    },
                    border: {
                        display: false
                    }
                },
                y: {
                    display: false,
                    beginAtZero: true
                }
            }
        }
    });
}

function updateTrendChart(newPrediction) {
    if (!trendChart) return;

    liveTrendData.shift();
    liveTrendData.push(newPrediction);

    const { labels } = generateTrendData(10);
    trendChart.data.labels = labels;

    trendChart.data.datasets[0].data = [...liveTrendData];
    trendChart.update();
}



function updateHistoricalChart(newData) {
    if (!historicalChart) return;

    historicalChart.data.datasets[0].data = newData;
    historicalChart.update('none');
}

function initCharts() {
    console.log('📊 Initializing charts...');
    setTimeout(() => {
        initTrendChart();
        initHistoricalChart();
    }, 100);
}

function startChartUpdates(interval = 60000) {
    setInterval(() => {
        const { data } = generateTrendData(10);
        updateTrendChart(data);

        const historicalData = generateBarData(10);
        updateHistoricalChart(historicalData);
    }, interval);
}

window.initCharts = initCharts;
window.updateTrendChart = updateTrendChart;
window.updateHistoricalChart = updateHistoricalChart;
