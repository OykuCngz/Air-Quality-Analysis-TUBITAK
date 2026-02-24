

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)  

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'hava_kalitesi_modeli.pkl')
model = None

def load_model():
    
    global model
    try:
        model = joblib.load(MODEL_PATH)
        print(f"✅ Model loaded successfully from {MODEL_PATH}")
        return True
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

@app.route('/')
def home():
    
    return jsonify({
        'status': 'online',
        'service': 'AQI Predictor API',
        'model_loaded': model is not None
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    
    try:
        
        data = request.get_json()

        required_fields = ['SO2', 'NO2', 'CO', 'O3']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }), 400

        input_data = pd.DataFrame([{
            'SO2': float(data['SO2']) / 2620.0,
            'NO2': float(data['NO2']) / 1880.0,
            'CO': float(data['CO']),
            'O3': float(data['O3']) / 1960.0
        }])


        if model is None:
            return jsonify({
                'status': 'error',
                'message': 'Model not loaded'
            }), 500
        
        prediction = model.predict(input_data)[0]

        confidence = 95.0  
        
        return jsonify({
            'status': 'success',
            'prediction': float(prediction),
            'confidence': confidence,
            'input': {
                'SO2': data['SO2'],
                'NO2': data['NO2'],
                'CO': data['CO'],
                'O3': data['O3']
            }
        })
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': f'Invalid input values: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Prediction failed: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health():
    
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'model_path': MODEL_PATH,
        'endpoints': [
            {'path': '/', 'method': 'GET', 'description': 'Service status'},
            {'path': '/api/predict', 'method': 'POST', 'description': 'Make PM10 predictions'},
            {'path': '/api/health', 'method': 'GET', 'description': 'Health check'}
        ]
    })

if __name__ == '__main__':
    
    if load_model():
        print("🚀 Starting AQI Predictor API server...")
        print("📡 API will be available at: http://localhost:5000")
        print("📊 Web UI available at: file:///web/index.html")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("❌ Failed to load model. Server not started.")
