
const AppState = {
    currentScreen: 'screen1',
    sensorValues: { so2: 124, no2: 38, co: 0.8, o3: 72 },
    meteo:        { temp: 21.4, hum: 63, wind: 3.2 },
    prediction:   42.5,
    pm25:         18.3,
    r2:           0.84,
    confidence:   95.4,
    datasetRows:  8760,
    lastUpdate:   new Date()
};

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-screen]');
    navItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const target = item.dataset.screen;
            if (!target) return;
            switchScreen(target);
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(id);
    if (screen) {
        screen.classList.add('active');
        AppState.currentScreen = id;
    }
}

function initSliders() {
    [
        { id: 'so2', min: 0, max: 500,  step: 1   },
        { id: 'no2', min: 0, max: 300,  step: 1   },
        { id: 'co',  min: 0, max: 10,   step: 0.1 },
        { id: 'o3',  min: 0, max: 200,  step: 1   },
    ].forEach(({ id, min, max, step }) => initSlider(id, min, max, step));
}

function initSlider(id, min, max, step) {
    const slider  = document.getElementById(`${id}Slider`);
    const display = document.getElementById(`${id}Display`);
    const fill    = document.getElementById(`${id}Fill`);
    if (!slider) return;

    slider.addEventListener('input', e => {
        const val = parseFloat(e.target.value);
        const pct = ((val - min) / (max - min)) * 100;

        if (display) display.textContent = step < 1 ? val.toFixed(1) : Math.round(val);
        if (fill)    fill.style.width = `${pct}%`;

        AppState.sensorValues[id] = val;
        debouncedUpdate();
    });
}

function simulateMeteo() {
    AppState.meteo.temp += (Math.random() - 0.5) * 0.6;
    AppState.meteo.hum  += (Math.random() - 0.5) * 1.5;
    AppState.meteo.wind += (Math.random() - 0.5) * 0.4;
    AppState.meteo.temp  = Math.max(0,  Math.min(45, AppState.meteo.temp));
    AppState.meteo.hum   = Math.max(20, Math.min(99, AppState.meteo.hum));
    AppState.meteo.wind  = Math.max(0,  Math.min(15, AppState.meteo.wind));

    const t = document.getElementById('tempVal');
    const h = document.getElementById('humVal');
    const w = document.getElementById('windVal');
    if (t) t.textContent = `${AppState.meteo.temp.toFixed(1)}`;
    if (h) h.textContent = `${Math.round(AppState.meteo.hum)}`;
    if (w) w.textContent = AppState.meteo.wind.toFixed(1);
}

let _debTimer;
function debouncedUpdate() {
    clearTimeout(_debTimer);
    _debTimer = setTimeout(() => {
        if (typeof calculatePrediction === 'function') {
            calculatePrediction({ ...AppState.sensorValues, ...AppState.meteo });
            AppState.lastUpdate = new Date();
        }
    }, 500);
}

function initButtons() {
        const runBtn = document.getElementById('runSimulationBtn');
    if (runBtn) {
        runBtn.addEventListener('click', () => {
            runBtn.disabled = true;
            runBtn.innerHTML = `
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <circle cx="12" cy="12" r="10" opacity=".25"/>
                    <path d="M12 2a10 10 0 0 1 10 10">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur=".9s" repeatCount="indefinite"/>
                    </path>
                </svg>
                Computing...`;
            if (typeof calculatePrediction === 'function') {
                calculatePrediction({ ...AppState.sensorValues, ...AppState.meteo });
            }
            setTimeout(() => {
                runBtn.disabled = false;
                runBtn.innerHTML = `New Prediction`;
            }, 1600);
        });
    }

        const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', e => {
            e.preventDefault();
            resetSensorValues();
        });
    }

        const dataConfigBtn = document.getElementById('dataConfigBtn');
    const dataConfigModal = document.getElementById('dataConfigModal');
    const closeDataModalBtn = document.getElementById('closeDataModalBtn');

    if (dataConfigBtn && dataConfigModal) {
        dataConfigBtn.addEventListener('click', e => {
            e.preventDefault();
            dataConfigModal.style.display = 'flex';
        });

        const closeModal = () => { dataConfigModal.style.display = 'none'; };
        
        if (closeDataModalBtn) closeDataModalBtn.addEventListener('click', closeModal);
        dataConfigModal.addEventListener('click', e => {
            if (e.target === dataConfigModal) closeModal();
        });
    }

        const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', e => {
            e.preventDefault();
            exportBtn.style.visibility = 'hidden';

            const pm10   = document.getElementById('pm10Value')?.textContent   || '—';
            const pm25   = document.getElementById('pm25Value')?.textContent   || '—';
            const r2     = document.getElementById('r2Score')?.textContent      || '—';
            const conf   = document.getElementById('confidenceValue')?.textContent || '—';
            const so2    = document.getElementById('so2Display')?.textContent   || '—';
            const no2    = document.getElementById('no2Display')?.textContent   || '—';
            const temp   = document.getElementById('tempVal')?.textContent      || '—';
            const hum    = document.getElementById('humVal')?.textContent       || '—';
            const o3     = document.getElementById('o3Display')?.textContent    || '—';

            let chartImgSrc = '';
            try {
                const chartCanvas = document.getElementById('trendChart');
                if (chartCanvas) chartImgSrc = chartCanvas.toDataURL('image/png');
            } catch(_) {}

            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { day:'2-digit', month:'long', year:'numeric' });
            const timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

            const pm10Num = parseFloat(pm10);
            let aqiLabel = 'Unknown', aqiColor = '#6b7280', aqiBg = '#f3f4f6';
            if (!isNaN(pm10Num)) {
                if (pm10Num <= 50)       { aqiLabel = 'Good — Safe Level';                aqiColor = '#059669'; aqiBg = '#d1fae5'; }
                else if (pm10Num <= 100) { aqiLabel = 'Moderate';                         aqiColor = '#d97706'; aqiBg = '#fef3c7'; }
                else if (pm10Num <= 150) { aqiLabel = 'Unhealthy for Sensitive Groups';   aqiColor = '#dc2626'; aqiBg = '#fee2e2'; }
                else                     { aqiLabel = 'Unhealthy — High Risk';            aqiColor = '#7c3aed'; aqiBg = '#ede9fe'; }
            }

            const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AeroPredict ML — Air Quality Report</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  body { font-family:'Inter',sans-serif; background:#fff; color:#0f172a; font-size:13px; line-height:1.6; }

    .cover {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
    color:#fff; padding:40px 48px 32px;
    display:flex; justify-content:space-between; align-items:flex-start;
  }
  .cover-logo { display:flex; align-items:center; gap:14px; }
  .logo-icon {
    width:44px; height:44px; background:#0ea5e9; border-radius:10px;
    display:flex; align-items:center; justify-content:center;
  }
  .logo-icon svg { width:24px; height:24px; fill:#fff; }
  .brand-name { font-family:'Space Grotesk',sans-serif; font-size:1.5rem; font-weight:800; }
  .brand-sub  { font-size:0.7rem; color:#94a3b8; letter-spacing:2px; margin-top:2px; }
  .cover-meta { text-align:right; }
  .cover-meta .report-type { font-size:0.65rem; letter-spacing:2px; color:#0ea5e9; font-weight:700; margin-bottom:4px; }
  .cover-meta .date { font-size:0.85rem; color:#cbd5e1; }

  .cover-title { padding:28px 48px 36px; background:linear-gradient(135deg,#0f172a,#1e3a5f 50%,#0f172a); color:#fff; }
  .cover-title h1 { font-family:'Space Grotesk',sans-serif; font-size:2rem; font-weight:800; letter-spacing:-1px; }
  .cover-title p { color:#94a3b8; font-size:0.9rem; margin-top:8px; }

  .station-bar {
    background: #0ea5e9; color:#fff; padding:10px 48px;
    display:flex; gap:32px; font-size:0.75rem; font-weight:600; letter-spacing:0.5px;
  }
  .station-bar span { display:flex; align-items:center; gap:6px; }

    .content { padding:32px 48px; }

    .aqi-banner {
    border-radius:12px; padding:20px 28px; margin-bottom:28px;
    display:flex; align-items:center; justify-content:space-between;
    border: 1px solid currentColor;
  }
  .aqi-banner .label { font-size:0.7rem; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:4px; }
  .aqi-banner .status { font-family:'Space Grotesk',sans-serif; font-size:1.5rem; font-weight:800; }
  .aqi-banner .pm-val { font-family:'Space Grotesk',sans-serif; font-size:2.5rem; font-weight:800; }
  .aqi-banner .pm-unit { font-size:0.75rem; opacity:0.7; margin-top:4px; }

    .section-title {
    font-family:'Space Grotesk',sans-serif; font-size:0.65rem; font-weight:700;
    letter-spacing:2px; text-transform:uppercase; color:#64748b;
    border-bottom:2px solid #e2e8f0; padding-bottom:8px; margin-bottom:16px;
  }

    .kpi-grid { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:14px; margin-bottom:28px; }
  .kpi {
    background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;
    padding:16px 18px; position:relative; overflow:hidden;
  }
  .kpi::before {
    content:''; position:absolute; top:0; left:0; width:4px; height:100%;
    background: var(--kpi-color, #0ea5e9);
  }
  .kpi-label { font-size:0.65rem; font-weight:700; letter-spacing:1px; color:#94a3b8; text-transform:uppercase; margin-bottom:6px; }
  .kpi-val { font-family:'Space Grotesk',sans-serif; font-size:1.6rem; font-weight:800; color:#0f172a; }
  .kpi-unit { font-size:0.7rem; color:#94a3b8; margin-top:2px; }

    .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:28px; }

    .data-table { width:100%; border-collapse:collapse; }
  .data-table th {
    background:#f1f5f9; font-size:0.65rem; letter-spacing:1px; text-transform:uppercase;
    color:#64748b; font-weight:700; padding:10px 14px; text-align:left; border:none;
  }
  .data-table td { padding:10px 14px; border-bottom:1px solid #f1f5f9; font-size:0.8rem; }
  .data-table tr:last-child td { border-bottom:none; }
  .data-table .val { font-family:'Space Grotesk',sans-serif; font-weight:700; color:#0f172a; }
  .tag {
    display:inline-block; padding:2px 8px; border-radius:99px;
    font-size:0.65rem; font-weight:700; letter-spacing:0.5px;
  }
  .tag-blue { background:#dbeafe; color:#1d4ed8; }
  .tag-teal { background:#ccfbf1; color:#0f766e; }
  .tag-green { background:#d1fae5; color:#065f46; }

    .chart-box { border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; margin-bottom:28px; }
  .chart-box img { width:100%; display:block; }
  .chart-header { padding:14px 18px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
  .chart-header h3 { font-family:'Space Grotesk',sans-serif; font-size:0.95rem; font-weight:700; }
  .chart-header p { font-size:0.75rem; color:#64748b; margin-top:2px; }

    .footer {
    margin-top:32px; padding:20px 48px; border-top:1px solid #e2e8f0;
    display:flex; justify-content:space-between; align-items:center;
    font-size:0.7rem; color:#94a3b8;
  }
  .footer strong { color:#0f172a; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="cover">
  <div class="cover-logo">
    <div class="logo-icon">
      <svg viewBox="0 0 24 24"><path d="M4 14C4 18.4 7.6 22 12 22C16.4 22 20 18.4 20 14V8H4V14ZM12 2C8.69 2 6 4.69 6 8H18C18 4.69 15.31 2 12 2Z"/></svg>
    </div>
    <div>
      <div class="brand-name">AeroPredict ML</div>
      <div class="brand-sub">TUBITAK 2209-A RESEARCH PROJECT</div>
    </div>
  </div>
  <div class="cover-meta">
    <div class="report-type">AIR QUALITY REPORT</div>
    <div class="date">${dateStr} — ${timeStr}</div>
  </div>
</div>

<div class="cover-title">
  <h1>Air Quality Analysis Report</h1>
  <p>Kandilli Reference Station · Istanbul · Random Forest ML Model · TUBITAK 2209-A</p>
</div>

<div class="station-bar">
  <span>📍 Kandilli Observatory, Istanbul</span>
  <span>🕒 ${dateStr} ${timeStr}</span>
  <span>🤖 Random Forest · LSTM Inference Engine</span>
  <span>📊 160,107 Data Rows</span>
</div>

<!-- CONTENT -->
<div class="content">

  <!-- AQI Status Banner -->
  <div class="aqi-banner" style="background:${aqiBg}; color:${aqiColor}; border-color:${aqiColor};">
    <div>
      <div class="label">PM10 AIR QUALITY STATUS</div>
      <div class="status">${aqiLabel}</div>
    </div>
    <div style="text-align:right;">
      <div class="pm-val">${pm10}</div>
      <div class="pm-unit">µg/m³ — PM10</div>
    </div>
  </div>

  <!-- KPI Row -->
  <div class="section-title">Model Inference Outputs</div>
  <div class="kpi-grid">
    <div class="kpi" style="--kpi-color:#0ea5e9">
      <div class="kpi-label">Predicted PM10</div>
      <div class="kpi-val">${pm10}</div>
      <div class="kpi-unit">µg/m³</div>
    </div>
    <div class="kpi" style="--kpi-color:#14b8a6">
      <div class="kpi-label">Predicted PM2.5</div>
      <div class="kpi-val">${pm25}</div>
      <div class="kpi-unit">µg/m³</div>
    </div>
    <div class="kpi" style="--kpi-color:#6366f1">
      <div class="kpi-label">R² Score</div>
      <div class="kpi-val">${r2}</div>
      <div class="kpi-unit">Model accuracy</div>
    </div>
    <div class="kpi" style="--kpi-color:#22d3a0">
      <div class="kpi-label">Confidence</div>
      <div class="kpi-val">${conf}</div>
      <div class="kpi-unit">Inference bound</div>
    </div>
  </div>

  <!-- Two columns: Sensors + Model Metrics -->
  <div class="two-col">
    <div>
      <div class="section-title">Sensor Measurements</div>
      <table class="data-table">
        <thead>
          <tr><th>Parameter</th><th>Value</th><th>Unit</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr><td>SO₂ Concentration</td><td class="val">${so2}</td><td>ppb</td><td><span class="tag tag-blue">ACTIVE</span></td></tr>
          <tr><td>NO₂ Concentration</td><td class="val">${no2}</td><td>ppb</td><td><span class="tag tag-blue">ACTIVE</span></td></tr>
          <tr><td>Ambient Temp.</td><td class="val">${temp}</td><td>°C</td><td><span class="tag tag-green">NORMAL</span></td></tr>
          <tr><td>Relative Humidity</td><td class="val">${hum}</td><td>%</td><td><span class="tag tag-green">NORMAL</span></td></tr>
          <tr><td>O₃ Surface Level</td><td class="val">${o3}</td><td>ppb</td><td><span class="tag tag-teal">MONITORING</span></td></tr>
        </tbody>
      </table>
    </div>
    <div>
      <div class="section-title">Performance Metrics</div>
      <table class="data-table">
        <thead>
          <tr><th>Metric</th><th>Value</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>R² Score</td><td class="val">${r2}</td><td>Explained variance</td></tr>
          <tr><td>Confidence</td><td class="val">${conf}</td><td>Inference bounds</td></tr>
          <tr><td>Data Rows</td><td class="val">160,107</td><td>Total training set</td></tr>
          <tr><td>Model</td><td class="val">Random Forest</td><td>Ensemble learning</td></tr>
          <tr><td>Station</td><td class="val">Kandilli</td><td>Reference sensor</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  ${chartImgSrc ? `
  <!-- Forecast Chart -->
  <div class="section-title">24-Hour Forecast Trend</div>
  <div class="chart-box">
    <div class="chart-header">
      <h3>24-Hour PM10 / PM2.5 Forecast</h3>
      <p>LSTM based temporal analysis · Kandilli Observatory data</p>
    </div>
    <img src="${chartImgSrc}" alt="Trend Chart" />
  </div>
  ` : ''}

</div>

<!-- FOOTER -->
<div class="footer">
  <div>
    <strong>AeroPredict ML</strong> · TUBITAK 2209-A Research Project · Precision Lab, Air Quality
  </div>
  <div>
    Report Date: ${dateStr} ${timeStr} · Kandilli Station · system: ONLINE
  </div>
</div>

</body>
</html>`;

            let iframe = document.getElementById('_pdf_iframe');
            if (iframe) iframe.remove();
            iframe = document.createElement('iframe');
            iframe.id = '_pdf_iframe';
            iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:800px;height:600px;border:none;';
            document.body.appendChild(iframe);

            iframe.contentDocument.open();
            iframe.contentDocument.write(reportHtml);
            iframe.contentDocument.close();

            setTimeout(() => {
                try {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                } catch(err) {
                    console.error('Print failed:', err);
                }
                setTimeout(() => {
                    iframe.remove();
                    exportBtn.style.visibility = 'visible';
                }, 1200);
            }, 1000);
        });
    }

        const expandBtn = document.getElementById('expandTrendBtn');
    if (expandBtn) {
        expandBtn.addEventListener('click', e => {
            e.preventDefault();
            switchScreen('screen2');
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.getElementById('nav2')?.classList.add('active');
        });
    }

        ['updateBtn', 'refreshBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => {
            if (typeof calculatePrediction === 'function') {
                calculatePrediction({ ...AppState.sensorValues, ...AppState.meteo });
            }
            showToast('Sistem: Tahmin başarıyla güncellendi');
        });
    });

        const aboutModal = document.getElementById('aboutModal');
    const closeAboutModalBtn = document.getElementById('closeAboutModalBtn');

    const openAboutModal = (e) => {
        if (e) e.preventDefault();
        if (aboutModal) aboutModal.style.display = 'flex';
    };

    const closeAboutModal = () => {
        if (aboutModal) aboutModal.style.display = 'none';
    };

    document.getElementById('settingsBtn')?.addEventListener('click', openAboutModal);
    document.getElementById('settingsNavItem')?.addEventListener('click', openAboutModal);
    
    if (closeAboutModalBtn) closeAboutModalBtn.addEventListener('click', closeAboutModal);
    if (aboutModal) {
        aboutModal.addEventListener('click', e => {
            if (e.target === aboutModal) closeAboutModal();
        });
    }

    // --- SATELLITE SEARCH API INTEGRATION ---
    const stationSearch = document.getElementById('stationSearch');
    if (stationSearch) {
        const DISTRICTS = {
            'kadıköy': { lat: 40.9900, lon: 29.0200, name: 'Kadıköy' },
            'kadikoy': { lat: 40.9900, lon: 29.0200, name: 'Kadıköy' },
            'beşiktaş': { lat: 41.0422, lon: 29.0083, name: 'Beşiktaş' },
            'besiktas': { lat: 41.0422, lon: 29.0083, name: 'Beşiktaş' },
            'şişli': { lat: 41.0600, lon: 28.9800, name: 'Şişli' },
            'sisli': { lat: 41.0600, lon: 28.9800, name: 'Şişli' },
            'bakırköy': { lat: 40.9800, lon: 28.8700, name: 'Bakırköy' },
            'bakirkoy': { lat: 40.9800, lon: 28.8700, name: 'Bakırköy' },
            'kandilli': { lat: 41.0650, lon: 29.0570, name: 'Kandilli' },
            'üsküdar': { lat: 41.0200, lon: 29.0100, name: 'Üsküdar' },
            'uskudar': { lat: 41.0200, lon: 29.0100, name: 'Üsküdar' }
        };

        stationSearch.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.toLowerCase().trim();
                const dist = DISTRICTS[query];
                
                if (!dist) {
                    showToast('Bağlantı Hatası: İstasyon bulunamadı. Lütfen geçerli bir ilçe giriniz.');
                    return;
                }
                
                showToast(`Uydu telemetrisi: ${dist.name} frekansına bağlanıldı`);
                
                // Update Leaflet Map dynamically
                if (typeof map !== 'undefined' && kandilliMarker && kandilliLabel) {
                    const coords = [dist.lat, dist.lon];
                    map.setView(coords, 13, { animate: true, duration: 1.5 });
                    kandilliMarker.setLatLng(coords);
                    kandilliLabel.setLatLng(coords);
                    const lTitle = document.querySelector('.l-title');
                    if (lTitle) lTitle.textContent = dist.name.toUpperCase() + ' ST.';
                }

                // Fetch real Open-Meteo AQI data exactly for the searched district lat/lon
                try {
                    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${dist.lat}&longitude=${dist.lon}&current=carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
                    const res = await fetch(aqUrl);
                    const data = await res.json();
                    
                    if (data.current) {
                        const so2 = data.current.sulphur_dioxide || 2.0;
                        const no2 = data.current.nitrogen_dioxide || 25.0;
                        const co  = (data.current.carbon_monoxide || 300) / 1000.0;
                        const o3  = data.current.ozone || 45.0;
                        
                        // Set JS state and UI slider visuals automatically
                        const vals = { so2, no2, co, o3 };
                        Object.keys(vals).forEach(k => {
                            AppState.sensorValues[k] = vals[k];
                            const s = document.getElementById(`${k}Slider`);
                            const d = document.getElementById(`${k}Display`);
                            const f = document.getElementById(`${k}Fill`);
                            if(s) {
                                s.value = vals[k];
                                const min = parseFloat(s.min);
                                const max = parseFloat(s.max);
                                if(f) f.style.width = (((vals[k] - min)/(max - min)) * 100) + '%';
                            }
                            if(d) d.textContent = (k === 'co') ? vals[k].toFixed(2) : Math.round(vals[k]);
                        });

                        // Calculate Prediction immediately using the backend
                        if (typeof calculatePrediction === 'function') {
                            calculatePrediction({ ...AppState.sensorValues, ...AppState.meteo });
                            setTimeout(() => { showToast(`Sistem Hazır: ${dist.name} hava kalitesi verileri asimile edildi.`); }, 1500);
                        }
                    }
                } catch(err) {
                    console.error('AOI Fetch Error', err);
                    showToast('Telemetri Hatası: Canlı veri API kaynağına ulaşılamadı.');
                }
            }
        });
    }
}

function resetSensorValues() {
    const defaults = { so2: 124, no2: 38, co: 0.8, o3: 72 };
    const ranges   = { so2: [0,500], no2: [0,300], co: [0,10], o3: [0,200] };

    Object.entries(defaults).forEach(([id, val]) => {
        const slider = document.getElementById(`${id}Slider`);
        const display= document.getElementById(`${id}Display`);
        const fill   = document.getElementById(`${id}Fill`);
        if (slider) {
            slider.value = val;
            const [min, max] = ranges[id];
            const pct = ((val - min) / (max - min)) * 100;
            if (display) display.textContent = id === 'co' ? val.toFixed(1) : val;
            if (fill)    fill.style.width = `${pct}%`;
        }
        AppState.sensorValues[id] = val;
    });

    debouncedUpdate();
}

function updateMetrics() {
    const el = document.getElementById('lastUpdateValue');
    if (el) el.textContent = AppState.datasetRows.toLocaleString('tr-TR');

    const rmseEl = document.getElementById('rmseValue');
    if (rmseEl) {
        const rmse = (5.8 + Math.random() * 0.8).toFixed(1);
        rmseEl.textContent = rmse;
    }
}

function showToast(msg) {
    const t = document.createElement('div');
    t.className   = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity    = '0';
        t.style.transition = 'opacity .3s ease-out';
        setTimeout(() => t.remove(), 320);
    }, 2200);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 AQI Kalibratör — TÜBİTAK 2209-A hazır');

    initNavigation();
    initSliders();
    initButtons();

    if (typeof initCharts === 'function')  initCharts();
    if (typeof initMap === 'function')     initMap();

        if (typeof calculatePrediction === 'function') {
        calculatePrediction({ ...AppState.sensorValues, ...AppState.meteo });
    }

    updateMetrics();
    setInterval(updateMetrics, 10000);

        setInterval(() => {
        simulateMeteo();
                const noise = { ...AppState.sensorValues };
        Object.keys(noise).forEach(k => {
            noise[k] = Math.max(0, noise[k] + (Math.random() - 0.5) * noise[k] * 0.03);
        });
        if (typeof calculatePrediction === 'function') {
            calculatePrediction({ ...noise, ...AppState.meteo });
        }
    }, 30000);
});

let map = null;
let kandilliMarker = null;
let kandilliLabel = null;

function initMap() {
    const mapEl = document.getElementById('kandilliMap');
    if (!mapEl || typeof L === 'undefined') return;

    const coords = [41.0650, 29.0570]; 
    
    map = L.map('kandilliMap', {
        zoomControl: false,
        attributionControl: false,
        minZoom: 3,
        maxBounds: [ [-90, -180], [90, 180] ], 
        maxBoundsViscosity: 1.0
    }).setView(coords, 3); 

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    const iconHtml = `<div id="mapDot" class="cyan-glow-marker"></div>`;
    const pulseIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    const labelHtml = `
      <div class="custom-map-label">
         <div class="l-title">KANDILLI ST.</div>
         <div class="l-sub" id="mapLabelSub">PM10: -- | PM2.5: --</div>
      </div>
    `;
    const staticLabel = L.divIcon({
        html: labelHtml,
        className: 'custom-leaflet-label',
        iconSize: [160, 60],
        iconAnchor: [80, 0] 
    });

    kandilliMarker = L.marker(coords, { icon: pulseIcon }).addTo(map);
    kandilliLabel = L.marker(coords, { icon: staticLabel, interactive: false }).addTo(map);

    const mapTools = document.querySelectorAll('.map-tool');
    if (mapTools.length >= 2) {
        mapTools[0].addEventListener('click', e => {
            e.preventDefault();
            mapEl.classList.toggle('default-tiles');
        });
        
        const zoomBtn = mapTools[1];
        const iconZoomIn = `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line><line x1="11" y1="8" x2="11" y2="14"></line></svg>`;
        const iconZoomOut = `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`;

        zoomBtn.addEventListener('click', e => {
            e.preventDefault();
            if (map.getZoom() < 8) {
                map.setView(coords, 14, { animate: true, duration: 0.4 });
                zoomBtn.innerHTML = iconZoomOut;
            } else {
                map.setView(coords, 3, { animate: true, duration: 0.4 });
                zoomBtn.innerHTML = iconZoomIn;
            }
        });

        map.on('zoomend', () => {
            if (map.getZoom() < 8) {
                if (zoomBtn.innerHTML !== iconZoomIn) zoomBtn.innerHTML = iconZoomIn;
            } else {
                if (zoomBtn.innerHTML !== iconZoomOut) zoomBtn.innerHTML = iconZoomOut;
            }
        });
    }
}

window.updateMapStatus = function(pm10) {
    const subLabel = document.getElementById('mapLabelSub');
    if (!subLabel) return;

    const pm25Val = document.getElementById('pm25Value')?.textContent || '—';
    
    subLabel.innerHTML = `PM10: ${pm10} | PM2.5: ${pm25Val}`;
}

window.AppState  = AppState;
window.showToast = showToast;
