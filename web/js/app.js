

const AppState = {
    currentScreen: 'screen1',
    sensorValues: {
        so2: 124,
        no2: 38,
        co: 0.8,
        o3: 72
    },
    prediction: 42.5,
    confidence: 95.4,
    lastUpdate: new Date()
};

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetScreen = item.getAttribute('data-screen');

            if (targetScreen) {
                switchScreen(targetScreen);

                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            }
        });
    });
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        AppState.currentScreen = screenId;

        setTimeout(() => {
            targetScreen.querySelectorAll('.fade-in, .slide-up').forEach(el => {
                el.style.animation = 'none';
                setTimeout(() => {
                    el.style.animation = '';
                }, 10);
            });
        }, 10);
    }
}

function initSliders() {
    initSlider('so2', 0, 500);
    initSlider('no2', 0, 300);
    initSlider('co', 0, 10, 0.1);
    initSlider('o3', 0, 200);
}

function initSlider(sensorId, min, max, step = 1) {
    const slider = document.getElementById(`${sensorId}Slider`);
    const display = document.getElementById(`${sensorId}Display`);
    const fill = document.getElementById(`${sensorId}Fill`);

    if (!slider || !display) return;

    slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        const percentage = ((value - min) / (max - min)) * 100;

        display.textContent = step < 1 ? value.toFixed(1) : Math.round(value);

        if (fill) {
            fill.style.width = `${percentage}%`;
        }

        AppState.sensorValues[sensorId] = value;

        debouncedPredictionUpdate();
    });
}

let predictionTimeout;
function debouncedPredictionUpdate() {
    clearTimeout(predictionTimeout);
    predictionTimeout = setTimeout(() => {
        updatePrediction();
    }, 500);
}

function updatePrediction() {
    if (typeof calculatePrediction === 'function') {
        calculatePrediction(AppState.sensorValues);
    }
}

function initButtons() {
    const runSimBtn = document.getElementById('runSimulationBtn');
    if (runSimBtn) {
        runSimBtn.addEventListener('click', () => {
            runSimBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                    <path d="M10 2a8 8 0 018 8" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="1s" repeatCount="indefinite"/>
                    </path>
                </svg>
                Running...
            `;

            setTimeout(() => {
                updatePrediction();
                runSimBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 10l2 2 4-4" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    RUN SIMULATION
                `;
            }, 1500);
        });
    }

    const updateBtn = document.getElementById('updateBtn');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            updatePrediction();
            showNotification('Prediction updated!');
        });
    }

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            resetSensorValues();
        });
    }

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            showNotification('Ayarlar paneli çok yakında eklenecektir.');
        });
    }

}

function resetSensorValues() {
    const defaults = {
        so2: 124,
        no2: 38,
        co: 0.8,
        o3: 72
    };

    Object.keys(defaults).forEach(sensor => {
        const slider = document.getElementById(`${sensor}Slider`);
        if (slider) {
            slider.value = defaults[sensor];
            slider.dispatchEvent(new Event('input'));
        }
    });

    showNotification('Sensör değerleri sıfırlandı');
}

function showNotification(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--color-bg-card);
        color: var(--color-text-primary);
        padding: var(--spacing-md) var(--spacing-lg);
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-border);
        box-shadow: var(--shadow-xl);
        z-index: 1000;
        animation: slideUp 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function updateTimeLabels() {
    const now = new Date();
    const diff = Math.floor((now - AppState.lastUpdate) / 1000 / 60);

    const timeLabels = document.querySelectorAll('.confidence-value');
    if (timeLabels[1]) {
        if (diff < 1) {
            timeLabels[1].textContent = 'Az önce';
        } else if (diff < 60) {
            timeLabels[1].textContent = `${diff} dakika önce`;
        } else {
            timeLabels[1].textContent = `${Math.floor(diff / 60)} saat önce`;
        }
    }
}


setInterval(updateTimeLabels, 60000);

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 AQI Predictor App Initialized');

    initNavigation();
    initSliders();
    initButtons();

    if (typeof initCharts === 'function') {
        initCharts();
    }

    updateTimeLabels();


    if (typeof calculatePrediction === 'function') {
        calculatePrediction(AppState.sensorValues);
    }

    const expandBtn = document.getElementById('expandTrendBtn');
    if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchScreen('screen2');

            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(nav => nav.classList.remove('active'));
            const historyNav = document.querySelector('.nav-item[data-screen="screen2"]');
            if (historyNav) historyNav.classList.add('active');
        });
    }


    setTimeout(() => {
        document.querySelectorAll('.screen.active .fade-in, .screen.active .slide-up').forEach(el => {
            el.style.opacity = '0';
            setTimeout(() => {
                el.style.opacity = '1';
            }, 10);
        });
    }, 100);
});

function updateLayout() {
    const width = window.innerWidth;
}

window.addEventListener('resize', updateLayout);

window.AppState = AppState;
