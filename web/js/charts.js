/* ─────────────────────────────────────
   AQI Calibrator – Charts
   TÜBİTAK 2209-A | PM10 + PM2.5 dual trend
───────────────────────────────────── */

const CC = {
    pm10:      '#6366f1',
    pm10Fill0: 'rgba(99,102,241,0.35)',
    pm10Fill1: 'rgba(99,102,241,0)',
    pm25:      '#0ea5e9',
    pm25Fill0: 'rgba(14,165,233,0.20)',
    pm25Fill1: 'rgba(14,165,233,0)',
    grid:      'rgba(255,255,255,0.05)',
    text:      '#64748b',
    tooltip:   'rgba(10,15,28,0.95)',
    font:      "'Inter', sans-serif",
    fontSize:  10
};

let trendChart     = null;
let historicalChart= null;
let pm10Series     = [];
let pm25Series     = [];

/* ── Zaman etiketleri ─── */
function makeTimeLabels(n = 12, intervalMin = 10) {
    const now = new Date();
    return Array.from({ length: n }, (_, i) => {
        if (i === n - 1) return 'ŞİMDİ';
        const t = new Date(now - (n - 1 - i) * intervalMin * 60000);
        return `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
    });
}

/* ── Başlangıç verisi ─── */
function initSeedData(n = 12) {
    pm10Series = Array.from({ length: n }, (_, i) => Math.max(10, 38 + Math.sin(i / 2.5) * 12 + Math.random() * 6));
    pm25Series = pm10Series.map(v => Math.max(4, v * 0.42 + (Math.random() - 0.5) * 3));
}

/* ── Gradyan yardımcısı ─── */
function makeGradient(ctx, h, c0, c1) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    return g;
}

/* ── Ortak chart seçenekleri ─── */
function baseOpts(extra = {}) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        interaction: { intersect: false, mode: 'index' },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                    color: CC.text,
                    font: { family: CC.font, size: 10 },
                    boxWidth: 8, boxHeight: 8,
                    padding: 12,
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: CC.tooltip,
                titleColor: '#fff',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                    label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} µg/m³`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: CC.text, font: { family: CC.font, size: CC.fontSize }, maxRotation: 0 }
            },
            y: {
                grid: { color: CC.grid },
                border: { display: false },
                beginAtZero: true,
                ticks: { color: CC.text, font: { family: CC.font, size: CC.fontSize }, callback: v => `${v}` }
            },
            ...extra
        }
    };
}

/* ── Trend Chart (Ekran 1) ─── */
function initTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const h   = canvas.parentElement.offsetHeight || 160;
    const lbl = makeTimeLabels(12);
    initSeedData(12);

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: lbl,
            datasets: [
                {
                    label: 'PM10',
                    data: [...pm10Series],
                    borderColor:     CC.pm10,
                    backgroundColor: makeGradient(ctx, h, CC.pm10Fill0, CC.pm10Fill1),
                    borderWidth: 2, fill: true, tension: 0.4,
                    pointRadius: 0, pointHoverRadius: 5,
                    pointHoverBackgroundColor: CC.pm10,
                    pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2
                },
                {
                    label: 'PM2.5',
                    data: [...pm25Series],
                    borderColor:     CC.pm25,
                    backgroundColor: makeGradient(ctx, h, CC.pm25Fill0, CC.pm25Fill1),
                    borderWidth: 2, fill: true, tension: 0.4,
                    borderDash: [4, 3],
                    pointRadius: 0, pointHoverRadius: 5,
                    pointHoverBackgroundColor: CC.pm25,
                    pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2
                }
            ]
        },
        options: baseOpts()
    });
}

/* ── Historical Chart (Ekran 2) ─── */
function initHistoricalChart() {
    const canvas = document.getElementById('historicalChart');
    if (!canvas) return;

    const ctx  = canvas.getContext('2d');
    const n    = 24;
    const lbl  = makeTimeLabels(n, 60);              // 24 saatlik
    const d10  = Array.from({ length: n }, (_, i) => Math.max(10, 40 + Math.sin(i / 4) * 18 + Math.random() * 8));
    const d25  = d10.map(v => Math.max(4, v * 0.42 + (Math.random() - 0.5) * 4));

    historicalChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: lbl,
            datasets: [
                {
                    label: 'PM10',
                    data: d10,
                    backgroundColor: d10.map((_, i) => i === n - 1 ? CC.pm10 : 'rgba(99,102,241,0.35)'),
                    borderRadius: 4,
                    borderSkipped: false,
                    barPercentage: 0.55
                },
                {
                    label: 'PM2.5',
                    data: d25,
                    backgroundColor: d25.map((_, i) => i === n - 1 ? CC.pm25 : 'rgba(14,165,233,0.25)'),
                    borderRadius: 4,
                    borderSkipped: false,
                    barPercentage: 0.55
                }
            ]
        },
        options: {
            ...baseOpts(),
            scales: {
                x: { grid: { display: false }, border: { display: false },
                     ticks: { color: CC.text, font: { family: CC.font, size: CC.fontSize }, maxTicksLimit: 8, maxRotation: 0 } },
                y: { grid: { color: CC.grid }, border: { display: false }, beginAtZero: true,
                     ticks: { color: CC.text, font: { family: CC.font, size: CC.fontSize }, callback: v => `${v}` } }
            }
        }
    });
}

/* ── Güncelleme (tahmin değiştiğinde) ─── */
function updateTrendChart(newPm10, newPm25) {
    if (!trendChart) return;

    pm10Series.shift(); pm10Series.push(newPm10 ?? 40);
    pm25Series.shift(); pm25Series.push(newPm25 ?? (newPm10 ?? 40) * 0.42);

    trendChart.data.labels = makeTimeLabels(12);
    trendChart.data.datasets[0].data = [...pm10Series];
    trendChart.data.datasets[1].data = [...pm25Series];
    trendChart.update('active');
}

/* ── Init ─── */
function initCharts() {
    console.log('📊 Chart motoru başlatılıyor...');
    setTimeout(() => {
        initTrendChart();
        initHistoricalChart();
    }, 120);
}

window.initCharts          = initCharts;
window.updateTrendChart    = updateTrendChart;
