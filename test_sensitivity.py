import joblib
import pandas as pd
import os

model_path = r'c:\Users\Asus\Documents\Air-Quality-Analysis\hava_kalitesi_modeli.pkl'

try:
    model = joblib.load(model_path)
    
    test_cases = [
        {'SO2': 0.005, 'NO2': 0.02, 'CO': 0.5, 'O3': 0.03},  # Base
        {'SO2': 0.500, 'NO2': 0.02, 'CO': 0.5, 'O3': 0.03},  # High SO2
        {'SO2': 0.005, 'NO2': 0.300, 'CO': 0.5, 'O3': 0.03}, # High NO2
        {'SO2': 0.005, 'NO2': 0.02, 'CO': 5.0, 'O3': 0.03},  # High CO
        {'SO2': 0.005, 'NO2': 0.02, 'CO': 0.5, 'O3': 0.200}, # High O3
    ]
    
    for i, case in enumerate(test_cases):
        df = pd.DataFrame([case])
        pred = model.predict(df)[0]
        print(f"Case {i}: {case} -> Prediction: {pred}")

except Exception as e:
    print(f"Error: {e}")
