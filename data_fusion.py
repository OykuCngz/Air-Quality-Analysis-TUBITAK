"""
=======================================================
  AQI Calibrator — Enhanced Data Fusion
  TÜBİTAK 2209-A | Multi-Source Data Strategy
=======================================================

DATA SOURCES AVAILABLE:
  A) Kandilli Reference  : Marmara_THMOPEN_Hava_Kalitesi_2024 (1).csv
                           → 36 rows, Dec 2023, PM10 + SO2 + NO2
  B) Istanbul Global     : global_air_quality_data_10000.csv
                           → 492 Istanbul rows, PM10 + PM2.5 + meteo
  C) Seoul Large Set     : SEUL_PIVOT_TEMIZ_VERI.csv
                           → 174,763 rows, SO2 + NO2 + CO + O3 + PM10 + PM2.5

FUSION STRATEGY:
  Primary:   Istanbul Global (B) — same city, has temperature/humidity/wind
  Reference: Kandilli (A)        — local ground truth for bias correction
  Supplement: Seoul (C)          — large-scale RF pre-training base

OUTPUT: fused_training_set.csv  (ready for train_model.py)

Run: python data_fusion.py
"""

import pandas as pd
import numpy as np
import os

# ─────────────────────────────────────
# UTILITY
# ─────────────────────────────────────
MONTH_MAP = {
    'Oca': '01', 'Sub': '02', 'Şub': '02', 'Þub': '02',
    'Mar': '03', 'Nis': '04', 'May': '05', 'Haz': '06',
    'Tem': '07', 'Agu': '08', 'Ağu': '08', 'Aðu': '08',
    'Eyl': '09', 'Eki': '10', 'Kas': '11', 'Ara': '12'
}

def fix_num(val):
    if pd.isna(val): return np.nan
    s = str(val).strip().replace(',', '.')
    for tr, num in MONTH_MAP.items():
        if tr in s: s = s.replace(tr, num)
    try:    return float(s)
    except: return np.nan

def parse_date(val, dayfirst=True):
    if pd.isna(val): return np.nan
    s = str(val).strip().split(' ')[0]   # keep date part only
    for tr, num in MONTH_MAP.items():
        s = s.replace(tr, num)
    for fmt in ['%d.%m.%Y', '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y',
                '%Y.%m.%d', '%d-%m-%Y']:
        try:
            return pd.to_datetime(s, format=fmt).strftime('%Y-%m-%d')
        except: pass
    try:
        return pd.to_datetime(s, dayfirst=dayfirst).strftime('%Y-%m-%d')
    except: return np.nan

def banner(title, step):
    print(f"\n{'='*58}")
    print(f"  STEP {step} — {title}")
    print(f"{'='*58}")

# ═══════════════════════════════════════════════════════════
# SOURCE A: Kandilli Reference Station
# ═══════════════════════════════════════════════════════════
banner("Kandilli Reference Station", "1/4")

KANDILLI_FILE = "Marmara_THMOPEN_Hava_Kalitesi_2024 (1).csv"
df_k = pd.read_csv(KANDILLI_FILE, sep=";", encoding="latin1", header=0)
df_k.columns = ['Region', 'City', 'Station', 'Date_Raw', 'PM10', 'SO2', 'NO2', 'NOX', 'NO']

for c in ['PM10', 'SO2', 'NO2', 'NOX', 'NO']:
    df_k[c] = df_k[c].apply(fix_num)

df_k['Date'] = df_k['Date_Raw'].apply(parse_date)
df_k = df_k.dropna(subset=['Date', 'PM10'])
df_k_daily = (df_k.groupby('Date')[['PM10', 'SO2', 'NO2']]
               .mean().reset_index()
               .rename(columns={'PM10':'PM10_knd','SO2':'SO2_knd','NO2':'NO2_knd'}))

print(f"  ✅ Kandilli daily rows : {len(df_k_daily)}")
print(f"     Date range          : {df_k_daily['Date'].min()} → {df_k_daily['Date'].max()}")

# ═══════════════════════════════════════════════════════════
# SOURCE B: Istanbul Global Dataset (492 rows, has meteo)
# ═══════════════════════════════════════════════════════════
banner("Istanbul — Global Air Quality Dataset", "2/4")

GLOBAL_FILE = "global_air_quality_data_10000.csv"
try:
    df_g = pd.read_csv(GLOBAL_FILE, sep=";", encoding="cp1254")
    if df_g.shape[1] < 5:
        raise ValueError
except Exception:
    df_g = pd.read_csv(GLOBAL_FILE, encoding="utf-8", errors='replace')

# Istanbul filter
df_g = df_g[df_g['City'].str.contains('Istanbul', case=False, na=False)].copy()

# Fix numeric columns
global_num = ['PM2.5', 'PM10', 'NO2', 'SO2', 'CO', 'O3',
              'Temperature', 'Humidity', 'Wind Speed']
rename_map = {
    'PM2.5': 'PM25', 'Wind Speed': 'Wind_Speed',
    'PM10':  'PM10_glb', 'NO2': 'NO2_glb',
    'SO2':   'SO2_glb',  'CO':  'CO',
    'O3':    'O3',       'Temperature': 'Temperature',
    'Humidity': 'Humidity'
}

for c in global_num:
    if c in df_g.columns:
        df_g[c] = df_g[c].apply(fix_num)

df_g = df_g.rename(columns={k: v for k, v in rename_map.items() if k in df_g.columns})

# Parse date
date_col = next((c for c in ['Date', 'date', 'DATE'] if c in df_g.columns), None)
if date_col:
    df_g['Date'] = df_g[date_col].apply(parse_date)
    df_g = df_g.dropna(subset=['Date'])
    keep_g = [c for c in ['Date','PM25','PM10_glb','NO2_glb','SO2_glb',
                           'CO','O3','Temperature','Humidity','Wind_Speed']
              if c in df_g.columns]
    df_g_daily = df_g.groupby('Date')[keep_g[1:]].mean().reset_index()
else:
    df_g['Date'] = pd.date_range('2023-01-01', periods=len(df_g), freq='D').strftime('%Y-%m-%d')
    keep_g = [c for c in ['Date','PM25','PM10_glb','CO','O3',
                           'Temperature','Humidity','Wind_Speed']
              if c in df_g.columns]
    df_g_daily = df_g[keep_g].copy()

print(f"  ✅ Istanbul global rows : {len(df_g_daily)}")
print(f"     Features             : {[c for c in df_g_daily.columns if c != 'Date']}")

# ═══════════════════════════════════════════════════════════
# SOURCE C: Seoul Large Dataset (174K rows — gas calibration base)
# ═══════════════════════════════════════════════════════════
banner("Seoul Large Dataset — Transfer Learning Base", "3/4")

SEOUL_FILE = "SEUL_PIVOT_TEMIZ_VERI.csv"
df_s = pd.read_csv(SEOUL_FILE)

# Find column names flexibly
col_map_s = {}
for col in df_s.columns:
    cl = col.strip().upper().replace('.', '').replace(' ', '_')
    if cl in ['SO2']:       col_map_s[col] = 'SO2'
    elif cl in ['NO2']:     col_map_s[col] = 'NO2'
    elif cl in ['CO']:      col_map_s[col] = 'CO'
    elif cl in ['O3']:      col_map_s[col] = 'O3'
    elif cl in ['PM10']:    col_map_s[col] = 'PM10'
    elif 'PM25' in cl or 'PM2_5' in cl or cl == 'PM25': col_map_s[col] = 'PM25'

df_s = df_s.rename(columns=col_map_s)
seoul_features = [c for c in ['SO2','NO2','CO','O3','PM10','PM25'] if c in df_s.columns]
df_s = df_s[seoul_features].apply(pd.to_numeric, errors='coerce')
df_s = df_s.dropna(subset=['PM10'] if 'PM10' in df_s.columns else [seoul_features[0]])

# Remove obvious outliers (keep within 99th percentile)
for col in seoul_features:
    p99 = df_s[col].quantile(0.99)
    p01 = df_s[col].quantile(0.01)
    df_s = df_s[(df_s[col] >= p01) & (df_s[col] <= p99)]

# Add placeholder meteo columns (Seoul medians as proxy — will be overridden by real data)
df_s['Temperature'] = 12.5   # Seoul annual avg
df_s['Humidity']    = 62.0
df_s['Wind_Speed']  = 2.8
df_s['source']      = 'seoul'

print(f"  ✅ Seoul rows (after outlier filter): {len(df_s):,}")
print(f"     Features: {seoul_features}")

# ═══════════════════════════════════════════════════════════
# FUSION: Merge B + A, then supplement with C
# ═══════════════════════════════════════════════════════════
banner("Bi-Source Fusion: Istanbul(B+A) + Seoul(C) blend", "4/4")

# --- Istanbul layer: merge Global (B) with Kandilli (A) ---
df_istanbul = df_g_daily.copy()

if len(df_k_daily) > 0:
    df_istanbul = pd.merge(df_istanbul, df_k_daily, on='Date', how='left')
    # Prefer Kandilli PM10 where available (ground truth), fallback to global
    if 'PM10_knd' in df_istanbul.columns:
        df_istanbul['PM10'] = df_istanbul['PM10_knd'].fillna(
            df_istanbul.get('PM10_glb', pd.Series(dtype=float)))
    if 'SO2_knd' in df_istanbul.columns:
        df_istanbul['SO2'] = df_istanbul['SO2_knd'].fillna(
            df_istanbul.get('SO2_glb', pd.Series(dtype=float)))
    if 'NO2_knd' in df_istanbul.columns:
        df_istanbul['NO2'] = df_istanbul['NO2_knd'].fillna(
            df_istanbul.get('NO2_glb', pd.Series(dtype=float)))
else:
    # No Kandilli merge possible — use global values directly
    for old, new in [('PM10_glb','PM10'),('SO2_glb','SO2'),('NO2_glb','NO2')]:
        if old in df_istanbul.columns:
            df_istanbul[new] = df_istanbul[old]

df_istanbul['source'] = 'istanbul'

# ── Build unified feature schema ──────────────────────────
FINAL_FEATURES = ['SO2', 'NO2', 'CO', 'O3',
                  'Temperature', 'Humidity', 'Wind_Speed',
                  'PM10', 'PM25', 'source']

# Istanbul
for feat in FINAL_FEATURES:
    if feat not in df_istanbul.columns:
        df_istanbul[feat] = np.nan

df_ist_final = df_istanbul[FINAL_FEATURES].copy()

# Seoul
df_s_final = df_s.reindex(columns=FINAL_FEATURES)

# Concatenate
df_combined = pd.concat([df_ist_final, df_s_final], ignore_index=True)

# Drop rows missing the target (PM10)
df_combined = df_combined.dropna(subset=['PM10'])

# Impute remaining NaN with median per source
for col in ['SO2','NO2','CO','O3','Temperature','Humidity','Wind_Speed','PM25']:
    if col in df_combined.columns and df_combined[col].isna().any():
        med = df_combined[col].median()
        df_combined[col] = df_combined[col].fillna(med)
        print(f"  ℹ️  Imputed '{col}' → median={med:.2f}")

# Save (without the source column)
df_out = df_combined.drop(columns=['source'])
OUT = "fused_training_set.csv"
df_out.to_csv(OUT, index=False)

print(f"\n  ✅ Final fused dataset → {OUT}")
print(f"     Total rows    : {len(df_out):,}")
print(f"     Istanbul rows : {(df_combined['source'] == 'istanbul').sum():,}")
print(f"     Seoul rows    : {(df_combined['source'] == 'seoul').sum():,}")
print(f"     Features      : {list(df_out.columns)}")
print(f"\n  📊 Summary statistics:")
print(df_out.describe().round(2).to_string())
print(f"\n  ✅ Run: python train_model.py")
