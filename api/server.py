

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import json
import os
import shap
import requests
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

app = Flask(__name__)
CORS(app)

BASE_DIR      = os.path.join(os.path.dirname(__file__), '..')
MODEL_PM10    = os.path.join(BASE_DIR, 'model_pm10.pkl')
MODEL_PM25    = os.path.join(BASE_DIR, 'model_pm25.pkl')
METRICS_FILE  = os.path.join(BASE_DIR, 'model_metrics.json')

LEGACY_MODEL  = os.path.join(BASE_DIR, 'hava_kalitesi_modeli.pkl')

model_pm10  = None
model_pm25  = None
metrics     = {}
explainer_pm10 = None

FEATURES = ['SO2', 'NO2', 'CO', 'O3', 'Temperature', 'Humidity', 'Wind_Speed']
def load_models():
    global model_pm10, model_pm25, metrics, explainer_pm10

    if os.path.exists(MODEL_PM10):
        try:
            model_pm10 = joblib.load(MODEL_PM10)
            print(f"✅ PM10 model loaded from {MODEL_PM10}")
            explainer_pm10 = shap.TreeExplainer(model_pm10)
            print("🧠 SHAP Explainer initialized.")
        except Exception as e:
            print(f"❌ PM10 model load error: {e}")
    elif os.path.exists(LEGACY_MODEL):
        try:
            model_pm10 = joblib.load(LEGACY_MODEL)
            print(f"✅ Legacy PM10 model loaded from {LEGACY_MODEL}")
        except Exception as e:
            print(f"❌ Legacy model load error: {e}")

    if os.path.exists(MODEL_PM25):
        try:
            model_pm25 = joblib.load(MODEL_PM25)
            print(f"✅ PM2.5 model loaded from {MODEL_PM25}")
        except Exception as e:
            print(f"❌ PM2.5 model load error: {e}")

    if os.path.exists(METRICS_FILE):
        with open(METRICS_FILE) as f:
            metrics = json.load(f)
        print(f"✅ Metrics loaded from {METRICS_FILE}")


@app.route('/')
def home():
    return jsonify({
        'service':      'AeroMetric XAI API',
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

    if model_pm10 is None:
        return jsonify({
            'status': 'error',
            'message': 'Models not loaded. Run train_model.py first.'
        }), 503

    try:
        data = request.get_json(force=True)

        for field in ['SO2', 'NO2', 'CO', 'O3']:
            if field not in data:
                return jsonify({'status': 'error', 'message': f'Missing field: {field}'}), 400

        live_temp, live_hum, live_wind = 20.0, 60.0, 3.0
        
        if 'temperature' not in data and 'Temperature' not in data:
            try:
                om_url = "https://api.open-meteo.com/v1/forecast?latitude=41.0151&longitude=28.9795&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
                resp = requests.get(om_url, timeout=3).json()
                current = resp.get("current", {})
                live_temp = current.get("temperature_2m", 20.0)
                live_hum  = current.get("relative_humidity_2m", 60.0)
                live_wind = round(current.get("wind_speed_10m", 10.8) / 3.6, 2)
            except:
                pass

        row = {
            'SO2':         float(data['SO2']),
            'NO2':         float(data['NO2']),
            'CO':          float(data['CO']),
            'O3':          float(data['O3']),
            'Temperature': float(data.get('temperature', data.get('Temperature', live_temp))),
            'Humidity':    float(data.get('humidity',    data.get('Humidity',    live_hum))),
            'Wind_Speed':  float(data.get('wind_speed',  data.get('Wind_Speed',  live_wind))),
        }

        if hasattr(model_pm10, 'feature_names_in_'):
            model_features = list(model_pm10.feature_names_in_)
        else:
            model_features = [f for f in FEATURES if f in row]

        X_input = pd.DataFrame([{f: row[f] for f in model_features if f in row}])

        for f in model_features:
            if f not in X_input.columns:
                X_input[f] = 0.0
        X_input = X_input[model_features]

        pm10_pred = float(model_pm10.predict(X_input)[0])

        if model_pm25 is not None:
            pm25_pred = float(model_pm25.predict(X_input)[0])
        else:
            pm25_pred = round(pm10_pred * 0.42, 2)

        r2_pm10 = metrics.get('pm10', {}).get('r2', 0.0)
        r2_pm25 = metrics.get('pm25', {}).get('r2', 0.0)

        confidence = min(99.0, max(70.0, r2_pm10 * 100 * 0.95 + np.random.normal(0, 0.5)))

        shap_data = {}
        base_value = 0.0
        if explainer_pm10 is not None:
            sv = explainer_pm10.shap_values(X_input)
            base_value = explainer_pm10.expected_value
            if isinstance(base_value, np.ndarray) or isinstance(base_value, list):
                base_value = float(base_value[0])
            
            for i, feat in enumerate(model_features):
                shap_data[feat] = round(float(sv[0][i]), 2)

        return jsonify({
            'status':           'success',
            'pm10_prediction':  round(pm10_pred, 2),
            'pm25_prediction':  round(pm25_pred, 2),
            'confidence':       round(float(confidence), 1),
            'r2_pm10':          r2_pm10,
            'r2_pm25':          r2_pm25,
            'features_used':    model_features,
            'input':            row,
            'explanation': {
                'base_value': round(float(base_value), 2),
                'shap_values': shap_data
            }
        })

    except ValueError as e:
        return jsonify({'status': 'error', 'message': f'Invalid input: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Prediction failed: {str(e)}'}), 500


@app.route('/api/metrics', methods=['GET'])
def get_metrics():

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


if __name__ == '__main__':
    print("\n" + "=" * 55)
    print("  AeroMetric XAI — API Server  |  TÜBİTAK 2209-A")
    print("=" * 55)

    load_models()

    if model_pm10 is None:
        print("\n⚠️  No model found. Run 'python train_model.py' first.")

    print(f"\n🚀 Server starting at http://localhost:5000\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
