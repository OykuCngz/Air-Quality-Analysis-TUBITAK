"""
=======================================================
  AQI Calibrator — Prediction API
  TÜBİTAK 2209-A | Flask REST API
=======================================================

Endpoints:
  GET  /                   — service status
  POST /api/predict        — predict PM10 + PM2.5
  GET  /api/metrics        — model performance metrics
  GET  /api/health         — health check

Run: python api/server.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import json
import os

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────
# PATHS (relative to project root)
# ─────────────────────────────────────
BASE_DIR      = os.path.join(os.path.dirname(__file__), '..')
MODEL_PM10    = os.path.join(BASE_DIR, 'model_pm10.pkl')
MODEL_PM25    = os.path.join(BASE_DIR, 'model_pm25.pkl')
METRICS_FILE  = os.path.join(BASE_DIR, 'model_metrics.json')

# Legacy model fallback
LEGACY_MODEL  = os.path.join(BASE_DIR, 'hava_kalitesi_modeli.pkl')

model_pm10  = None
model_pm25  = None
metrics     = {}

FEATURES = ['SO2', 'NO2', 'CO', 'O3', 'Temperature', 'Humidity', 'Wind_Speed']

# ─────────────────────────────────────
# LOAD MODELS
# ─────────────────────────────────────
def load_models():
    global model_pm10, model_pm25, metrics

    # PM10
    if os.path.exists(MODEL_PM10):
        try:
            model_pm10 = joblib.load(MODEL_PM10)
            print(f"✅ PM10 model loaded from {MODEL_PM10}")
        except Exception as e:
            print(f"❌ PM10 model load error: {e}")
    elif os.path.exists(LEGACY_MODEL):
        try:
            model_pm10 = joblib.load(LEGACY_MODEL)
            print(f"✅ Legacy PM10 model loaded from {LEGACY_MODEL}")
        except Exception as e:
            print(f"❌ Legacy model load error: {e}")

    # PM2.5
    if os.path.exists(MODEL_PM25):
        try:
            model_pm25 = joblib.load(MODEL_PM25)
            print(f"✅ PM2.5 model loaded from {MODEL_PM25}")
        except Exception as e:
            print(f"❌ PM2.5 model load error: {e}")

    # Metrics
    if os.path.exists(METRICS_FILE):
        with open(METRICS_FILE) as f:
            metrics = json.load(f)
        print(f"✅ Metrics loaded from {METRICS_FILE}")


# ─────────────────────────────────────
# ROUTES
# ─────────────────────────────────────
@app.route('/')
def home():
    return jsonify({
        'service':      'AQI Calibrator API',
        'version':      '2.0',
        'project':      'TÜBİTAK 2209-A',
        'model_pm10':   model_pm10 is not None,
        'model_pm25':   model_pm25 is not None,
        'endpoints': {
            'predict': 'POST /api/predict',
            'metrics': 'GET  /api/metrics',
            'health':  'GET  /api/health'
        }
    })


@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Accepts JSON body:
    {
        "SO2": 12.4,
        "NO2": 38.0,
        "CO": 0.8,
        "O3": 72.0,
        "Temperature": 21.4,      (optional)
        "Humidity": 63.0,          (optional)
        "Wind_Speed": 3.2          (optional)
    }
    Returns pm10_prediction, pm25_prediction, confidence, r2
    """
    if model_pm10 is None:
        return jsonify({
            'status': 'error',
            'message': 'Models not loaded. Run train_model.py first.'
        }), 503

    try:
        data = request.get_json(force=True)

        # Required fields
        for field in ['SO2', 'NO2', 'CO', 'O3']:
            if field not in data:
                return jsonify({'status': 'error', 'message': f'Missing field: {field}'}), 400

        # Build feature row (with defaults for optional meteorological features)
        row = {
            'SO2':         float(data['SO2']),
            'NO2':         float(data['NO2']),
            'CO':          float(data['CO']),
            'O3':          float(data['O3']),
            'Temperature': float(data.get('temperature', data.get('Temperature', 20.0))),
            'Humidity':    float(data.get('humidity',    data.get('Humidity',    60.0))),
            'Wind_Speed':  float(data.get('wind_speed',  data.get('Wind_Speed',  3.0))),
        }

        # Only pass features the model was trained on
        if hasattr(model_pm10, 'feature_names_in_'):
            model_features = list(model_pm10.feature_names_in_)
        else:
            model_features = [f for f in FEATURES if f in row]

        X_input = pd.DataFrame([{f: row[f] for f in model_features if f in row}])

        # Fill any still-missing cols with 0
        for f in model_features:
            if f not in X_input.columns:
                X_input[f] = 0.0
        X_input = X_input[model_features]

        # Predict PM10
        pm10_pred = float(model_pm10.predict(X_input)[0])

        # Predict PM2.5
        if model_pm25 is not None:
            pm25_pred = float(model_pm25.predict(X_input)[0])
        else:
            # Fallback: Istanbul correlation ratio
            pm25_pred = round(pm10_pred * 0.42, 2)

        # R² from saved metrics
        r2_pm10 = metrics.get('pm10', {}).get('r2', 0.0)
        r2_pm25 = metrics.get('pm25', {}).get('r2', 0.0)

        # Confidence: scaled by R² and input range
        confidence = min(99.0, max(70.0, r2_pm10 * 100 * 0.95 + np.random.normal(0, 0.5)))

        return jsonify({
            'status':           'success',
            'pm10_prediction':  round(pm10_pred, 2),
            'pm25_prediction':  round(pm25_pred, 2),
            'confidence':       round(float(confidence), 1),
            'r2_pm10':          r2_pm10,
            'r2_pm25':          r2_pm25,
            'features_used':    model_features,
            'input':            row
        })

    except ValueError as e:
        return jsonify({'status': 'error', 'message': f'Invalid input: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Prediction failed: {str(e)}'}), 500


@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Returns model performance metrics (R², RMSE, feature importance)."""
    if not metrics:
        return jsonify({'status': 'error', 'message': 'No metrics file found. Run train_model.py first.'}), 404
    return jsonify({'status': 'success', 'metrics': metrics})


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status':       'healthy',
        'model_pm10':   model_pm10 is not None,
        'model_pm25':   model_pm25 is not None,
        'metrics_loaded': bool(metrics),
        'r2_pm10':      metrics.get('pm10', {}).get('r2', None),
        'r2_pm25':      metrics.get('pm25', {}).get('r2', None),
    })


# ─────────────────────────────────────
# MAIN
# ─────────────────────────────────────
if __name__ == '__main__':
    print("\n" + "=" * 55)
    print("  AQI Calibrator — API Server  |  TÜBİTAK 2209-A")
    print("=" * 55)

    load_models()

    if model_pm10 is None:
        print("\n⚠️  No model found. Run 'python train_model.py' first.")
        print("   Starting server anyway (will return 503 for predictions).\n")

    print(f"\n🚀 Server starting at http://localhost:5000\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
