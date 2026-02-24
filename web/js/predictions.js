

const API_CONFIG = {

    endpoint: 'http://localhost:5000/api/predict',

    useMock: false
};

const AQI_LEVELS = {
    GOOD: { max: 50, color: 'good', text: 'SAĞLIK DURUMU: İYİ', description: 'Hava kalitesi tatmin edicidir ve hava kirliliği çok az risk oluşturur veya hiç risk oluşturmaz.' },
    MODERATE: { max: 100, color: 'moderate', text: 'ORTA', description: 'Hava kalitesi kabul edilebilir düzeydedir. Ancak bazı kirleticiler için hassas bireylerde orta düzeyde sağlık endişesi olabilir.' },
    UNHEALTHY: { max: 150, color: 'unhealthy', text: 'HASSAS GRUPLAR İÇİN SAĞLIKSIZ', description: 'Hassas gruplardaki kişiler sağlık etkileri yaşayabilir. Genel halk daha az etkilenme olasılığına sahiptir.' },
    VERY_UNHEALTHY: { max: 200, color: 'unhealthy', text: 'SAĞLIKSIZ', description: 'Herkes sağlık etkileri yaşamaya başlayabilir; hassas gruplardaki kişiler daha ciddi sağlık etkileri yaşayabilir.' }
};

function getHealthStatus(pm10Value) {
    if (pm10Value < AQI_LEVELS.GOOD.max) {
        return AQI_LEVELS.GOOD;
    } else if (pm10Value < AQI_LEVELS.MODERATE.max) {
        return AQI_LEVELS.MODERATE;
    } else if (pm10Value < AQI_LEVELS.UNHEALTHY.max) {
        return AQI_LEVELS.UNHEALTHY;
    } else {
        return AQI_LEVELS.VERY_UNHEALTHY;
    }
}

function mockPrediction(sensorValues) {

    const { so2, no2, co, o3 } = sensorValues;

    const pm10 = (
        (so2 * 0.15) +
        (no2 * 0.25) +
        (co * 5.0) +
        (o3 * 0.20) +
        Math.random() * 5 - 2.5
    );

    return {
        pm10: Math.max(0, pm10),
        confidence: 92 + Math.random() * 6
    };
}

async function fetchPrediction(sensorValues) {
    try {
        const response = await fetch(API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                SO2: sensorValues.so2,
                NO2: sensorValues.no2,
                CO: sensorValues.co,
                O3: sensorValues.o3
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        return {
            pm10: data.prediction,
            confidence: data.confidence || 95
        };
    } catch (error) {
        console.warn('API call failed, using mock prediction:', error);
        return mockPrediction(sensorValues);
    }
}

async function calculatePrediction(sensorValues) {
    let result;

    if (API_CONFIG.useMock) {
        result = mockPrediction(sensorValues);
    } else {
        result = await fetchPrediction(sensorValues);
    }

    updatePredictionUI(result.pm10, result.confidence);

    if (window.AppState) {
        window.AppState.prediction = result.pm10;
        window.AppState.confidence = result.confidence;
        window.AppState.lastUpdate = new Date();
    }

    return result;
}

function updatePredictionUI(pm10Value, confidence) {

    const pm10Displays = ['pm10Value', 'pm10Value2'];
    pm10Displays.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            animateValue(element, parseFloat(element.textContent), pm10Value, 500);
        }
    });

    const confidenceElements = document.querySelectorAll('.confidence-value');
    if (confidenceElements[0]) {
        confidenceElements[0].textContent = `${confidence.toFixed(1)}%`;
    }

    updateHealthStatus(pm10Value);

    updateCircularGauge(pm10Value);

    if (typeof updateTrendChart === 'function') {
        updateTrendChart(pm10Value);
    }
}


function updateHealthStatus(pm10Value) {
    const status = getHealthStatus(pm10Value);
    const statusBanners = document.querySelectorAll('.status-banner');

    statusBanners.forEach(banner => {

        banner.classList.remove('good', 'moderate', 'unhealthy');

        banner.classList.add(status.color);

        const icon = banner.querySelector('.status-icon');
        if (icon) {
            if (status.color === 'good') {
                icon.textContent = '✓';
            } else if (status.color === 'moderate') {
                icon.textContent = '⚠';
            } else {
                icon.textContent = '⚠';
            }
        }

        const content = banner.querySelector('.status-content h4');
        if (content) {
            content.textContent = status.text;
        }

        const description = banner.querySelector('.status-content p');
        if (description) {
            description.textContent = status.description;
        }
    });
}




function updateCircularGauge(pm10Value) {
    const gauge = document.querySelector('.circular-gauge');
    if (gauge) {

        const percentage = Math.min((pm10Value / 200) * 100, 100);
        gauge.style.setProperty('--gauge-percentage', `${percentage}%`);

        const gaugeValue = gauge.querySelector('.gauge-value');
        if (gaugeValue) {
            animateValue(gaugeValue, parseFloat(gaugeValue.textContent), pm10Value, 500);
        }
    }
}

function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;

        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }

        element.textContent = current.toFixed(1);
    }, 16);
}

function startRealtimeUpdates(interval = 30000) {

    setInterval(() => {
        if (window.AppState) {

            const newValues = { ...window.AppState.sensorValues };
            Object.keys(newValues).forEach(key => {
                const variance = newValues[key] * 0.05;
                newValues[key] += (Math.random() - 0.5) * variance;
                newValues[key] = Math.max(0, newValues[key]);
            });

            calculatePrediction(newValues);
        }
    }, interval);
}

window.calculatePrediction = calculatePrediction;
window.getHealthStatus = getHealthStatus;
