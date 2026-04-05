import requests
import time
import pandas as pd
import random
import os

API_URL = "http://localhost:5000/api/predict"
DATASET_FILE = "fused_training_set.csv"

def sensor_similasyonu():
    print("TÜBİTAK 2209-A - Sensör Veri Simülasyonu (Dataset Tabanlı)")
    
    if not os.path.exists(DATASET_FILE):
        print(f"Hata: {DATASET_FILE} bulunamadı! Lütfen önce 'python data_fusion.py' çalıştırın.")
        return

    print(f"{DATASET_FILE} yükleniyor...")
    df = pd.read_csv(DATASET_FILE)
    
    # Gereken sütunların olup olmadığını kontrol edelim
    required_cols = ["SO2", "NO2", "CO", "O3", "Temperature", "Humidity", "Wind_Speed"]
    available_cols = [c for c in required_cols if c in df.columns]
    
    if len(available_cols) == 0:
        print("Hata: Veri setinde gerekli sütunlar bulunamadı.")
        return

    print(f"Gerçek veri seti tabanlı simülasyon başlatıldı. Toplam satır: {len(df)}")
    
    while True:
        # Rastgele bir satır seçelim veya sırayla da gidebilirsiniz.
        # Burada rastgele bir anlık veri senaryosu canlandırıyoruz.
        row_idx = random.randint(0, len(df) - 1)
        row_data = df.iloc[row_idx]
        
        sensor_verileri = {}
        for col in available_cols:
            sensor_verileri[col] = float(row_data[col])
            
        try:
            response = requests.post(API_URL, json=sensor_verileri)
            
            if response.status_code == 200:
                res_json = response.json()
                print(f"Satır: {row_idx:^6} | Gönderilen: SO2:{sensor_verileri.get('SO2'):<5.1f} NO2:{sensor_verileri.get('NO2'):<5.1f} | Tahmin (PM10): {res_json.get('pm10_prediction', 'N/A')}")
            else:
                print(f"Sunucu hatası: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"Bağlantı hatası: Sunucu çalışıyor mu? (api/server.py çalıştırın) ({e})")
            
        time.sleep(5)

if __name__ == "__main__":
    sensor_similasyonu()
