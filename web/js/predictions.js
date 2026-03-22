
const API_CONFIG = {
    endpoint: 'http://localhost:5000/api/predict',
    useMock: true     
};

const PM10_LEVELS = [
    { max:  50, cls: 'good',         icon: '✓', title: 'Good — Safe Level',                   desc: 'PM10 is below the WHO safe limit. Suitable for all individuals.' },
    { max: 100, cls: 'moderate',     icon: '⚠', title: 'Moderate',                            desc: 'Acceptable air quality. Sensitive individuals (asthma, COPD) should be cautious.' },
    { max: 150, cls: 'unhealthy',    icon: '⚠', title: 'Unhealthy for Sensitive Groups',      desc: 'Children, elderly, and those with chronic conditions should reduce outdoor exposure.' },
    { max: Infinity, cls: 'hazard',  icon: '✕', title: 'Unhealthy — High Risk',               desc: 'Everyone may experience health effects. Avoid outdoor activities.' }
];

function getHealthLevel(pm10) {
    return PM10_LEVELS.find(l => pm10 < l.max) || PM10_LEVELS[PM10_LEVELS.length - 1];
}

function mockPrediction(vals) {
    const { so2, no2, co, o3, temp = 20, hum = 60, wind = 3 } = vals;

    const intercept = 32.5;
    const pollutantLoad = (so2 * 0.45) + (no2 * 0.65) + (co * 8.5) + (o3 * 0.35);
    
    const meteoFactor = (1 + (hum - 50) * 0.005) * (1 - wind * 0.02) * (1 + (temp - 20) * 0.01);
    
    const pm10 = Math.max(0, (intercept + pollutantLoad) * meteoFactor + (Math.random() * 2 - 1));

    const pm25 = Math.max(0, pm10 * 0.45 + (Math.random() * 1.5 - 0.75));

    const r2   = 0.88 + Math.random() * 0.04;
    const conf = 95.5 + Math.random() * 3;

    return { pm10, pm25, r2, confidence: conf };
}

async function fetchPrediction(vals) {
    try {
        const res = await fetch(API_CONFIG.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                SO2: vals.so2, NO2: vals.no2, CO: vals.co, O3: vals.o3,
                temperature: vals.temp, humidity: vals.hum, wind_speed: vals.wind
            })
        });
        if (!res.ok) throw new Error('API error');
        const d = await res.json();
        return {
            pm10: d.pm10_prediction ?? d.prediction,
            pm25: d.pm25_prediction ?? d.pm10_prediction * 0.42,
            r2:   d.r2 ?? 0.82,
            confidence: d.confidence ?? 94
        };
    } catch {
        return mockPrediction(vals);
    }
}

async function calculatePrediction(vals) {
    const result = API_CONFIG.useMock ? mockPrediction(vals) : await fetchPrediction(vals);
    updatePredictionUI(result);

    if (window.AppState) {
        window.AppState.prediction = result.pm10;
        window.AppState.pm25       = result.pm25;
        window.AppState.r2         = result.r2;
        window.AppState.confidence = result.confidence;
        window.AppState.lastUpdate = new Date();
    }
    return result;
}

function updatePredictionUI(result) {
    const { pm10, pm25, r2, confidence } = result;

    animateVal('pm10Value',  pm10, 1, 1500);
    animateVal('pm10Value2', pm10, 1, 1500);
    animateVal('pm25Value',  pm25, 1, 1200);
    animateVal('gaugeVal',   pm10, 0, 1500);

    if (typeof window.updateMapStatus === 'function') {
        window.updateMapStatus(pm10);
    }

    setTextSafe('confidenceValue', `${confidence.toFixed(1)}%`);
    setTextSafe('r2Score',         r2.toFixed(2));
    setTextSafe('r2Pct',           r2.toFixed(2));

    const bar = document.getElementById('r2Bar');
    if (bar) bar.style.width = `${Math.min(100, r2 * 100).toFixed(0)}%`;

    const pm10Ring = document.getElementById('pm10RingBg');
    if (pm10Ring) pm10Ring.setAttribute('stroke-dasharray', `${Math.min((pm10 / 200) * 100, 100).toFixed(0)}, 100`);
    
    const pm25Ring = document.getElementById('pm25RingBg');
    if (pm25Ring) pm25Ring.setAttribute('stroke-dasharray', `${Math.min((pm25 / 100) * 100, 100).toFixed(0)}, 100`);

    const gauge = document.querySelector('.circular-gauge');
    if (gauge) gauge.style.setProperty('--gauge-pct', `${Math.min((pm10 / 200) * 100, 100).toFixed(1)}%`);

    const level = getHealthLevel(pm10);
    document.querySelectorAll('.status-banner').forEach(b => {
        b.className = `status-banner ${level.cls} slide-up`;
        const icon  = b.querySelector('.status-icon');
        const title = b.querySelector('.status-title');
        const desc  = b.querySelector('.status-desc');
        if (icon)  icon.textContent  = level.icon;
        if (title) title.textContent = level.title;
        if (desc)  desc.textContent  = level.desc;
    });

    if (typeof updateTrendChart === 'function') updateTrendChart(pm10, pm25);
}

function setTextSafe(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function animateVal(id, endVal, decimals, duration=1000) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseFloat(el.textContent) || 0;
    const startTime = performance.now();

    const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        let progress = Math.min(elapsed / duration, 1);
        progress = easeOutExpo(progress);

        const currentVal = start + (endVal - start) * progress;
        el.textContent = currentVal.toFixed(decimals);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = endVal.toFixed(decimals);
        }
    }
    requestAnimationFrame(update);
}

window.calculatePrediction = calculatePrediction;
window.getHealthLevel      = getHealthLevel;
