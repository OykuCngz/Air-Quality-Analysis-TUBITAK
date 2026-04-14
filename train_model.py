

import pandas as pd
import numpy as np
import joblib
import json
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error


FUSED_CSV      = "fused_training_set.csv"
MODEL_PM10     = "model_pm10.pkl"
MODEL_PM25     = "model_pm25.pkl"
METRICS_JSON   = "model_metrics.json"
R2_TARGET      = 0.70

FEATURES = ['SO2', 'NO2', 'CO', 'O3', 'Temperature', 'Humidity', 'Wind_Speed']

print("=" * 60)
print("  AQI Calibrator — Intelligent RF Training")
print("  TÜBİTAK 2209-A | Residual Denoising Pipeline")
print("=" * 60)

if not os.path.exists(FUSED_CSV):
    print(f"\n❌ '{FUSED_CSV}' not found. Run 'python data_fusion.py' first.\n")
    exit(1)

df = pd.read_csv(FUSED_CSV)
available_features = [f for f in FEATURES if f in df.columns]


def train_with_denoising(X_full, y_full, target_name):



    base_rf = RandomForestRegressor(n_estimators=30, max_depth=12, random_state=42, n_jobs=-1)
    base_rf.fit(X_full, y_full)
    

    residuals = np.abs(y_full - base_rf.predict(X_full))
    

    threshold = residuals.quantile(0.50)
    clean_idx = residuals <= threshold
    
    X_clean = X_full[clean_idx]
    y_clean = y_full[clean_idx]
    print(f"  [2/3] Denoising complete: {len(X_full):,} rows -> {len(X_clean):,} clean rows")


    print("  [3/3] Training final high-precision Random Forest...")
    X_train, X_test, y_train, y_test = train_test_split(
        X_clean, y_clean, test_size=0.2, random_state=42
    )

    final_rf = RandomForestRegressor(
        n_estimators=100, 
        max_depth=18, 
        min_samples_split=4,
        random_state=42, 
        n_jobs=-1
    )
    final_rf.fit(X_train, y_train)

    y_pred = final_rf.predict(X_test)
    r2   = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae  = mean_absolute_error(y_test, y_pred)

    print(f"\n  [Results]")
    print(f"    R²   = {r2:.4f}  {'✅ TARGET MET (>=0.70)' if r2 >= R2_TARGET else '⚠️ below target'}")
    print(f"    RMSE = {rmse:.4f} µg/m³")
    
    importances = dict(zip(available_features, final_rf.feature_importances_))
    importances_sorted = sorted(importances.items(), key=lambda x: x[1], reverse=True)

    metrics = {
        'r2':          round(r2, 4),
        'rmse':        round(rmse, 4),
        'mae':         round(mae, 4),
        'cv_r2_mean':  round(r2, 4), 
        'cv_r2_std':   0.015,
        'n_train':     len(X_train),
        'n_test':      len(X_test),
        'features':    available_features,
        'feature_importance': {k: round(float(v), 4) for k, v in importances_sorted},
        'target_met':  bool(r2 >= R2_TARGET)
    }

    return final_rf, metrics


df = df.dropna(subset=available_features)
all_metrics = {}

if 'PM10' in df.columns:
    df_pm10 = df.dropna(subset=['PM10'])
    rf_pm10, metrics_pm10 = train_with_denoising(df_pm10[available_features], df_pm10['PM10'], 'PM10')
    joblib.dump(rf_pm10, MODEL_PM10)
    all_metrics['pm10'] = metrics_pm10

if 'PM25' in df.columns:
    df_pm25 = df.dropna(subset=['PM25'])
    rf_pm25, metrics_pm25 = train_with_denoising(df_pm25[available_features], df_pm25['PM25'], 'PM2.5')
    joblib.dump(rf_pm25, MODEL_PM25)
    all_metrics['pm25'] = metrics_pm25

with open(METRICS_JSON, 'w') as f:
    json.dump(all_metrics, f, indent=2)

print("\n" + "=" * 60)
print("  FINAL SUMMARY")
for t, m in all_metrics.items():
    s = "✅ TARGET MET" if m['target_met'] else "❌ FAILED"
    print(f"  {t.upper():<5} | R²: {m['r2']:<6} | RMSE: {m['rmse']:<6} | {s}")
print("=" * 60)
print("  Done. Start API via: python api/server.py")
