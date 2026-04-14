import requests
import time
import os

API_URL = "http://localhost:5000/api/predict"
LATITUDE = 41.0625
LONGITUDE = 29.0577

OPEN_METEO_AQ_URL = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={LATITUDE}&longitude={LONGITUDE}&current=carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"

def sensor_similasyonu():
    print("=====================================================")
    print("  AeroMetric XAI: REAL-TIME DATA ASSIMILATION")
    print(f"  Lokasyon: İstanbul, Kandilli (Lat: {LATITUDE}, Lon: {LONGITUDE})")
    print("=====================================================")
    
    while True:
        try:
            res = requests.get(OPEN_METEO_AQ_URL, timeout=5).json()
            current = res.get("current", {})
            
            if not current:
                print("Hata: Canlı veriler API'den alınamadı.")
                time.sleep(10)
                continue
            
            so2_live = current.get("sulphur_dioxide", 2.0)
            no2_live = current.get("nitrogen_dioxide", 25.0)
            co_live  = current.get("carbon_monoxide", 300.0) / 1000.0  
            o3_live  = current.get("ozone", 45.0)
            
            sensor_verileri = {
                "SO2": round(so2_live, 2),
                "NO2": round(no2_live, 2),
                "CO": round(co_live, 3),
                "O3": round(o3_live, 2)
            }
            
            response = requests.post(API_URL, json=sensor_verileri)
            
            if response.status_code == 200:
                res_json = response.json()
                print(f"🌍 CANLI (Kandilli) | Giden: SO2:{sensor_verileri['SO2']} NO2:{sensor_verileri['NO2']} CO:{sensor_verileri['CO']} | Tahmin Edilen PM10: {res_json.get('pm10_prediction', 'N/A')}")
            else:
                print(f"Sunucu hatası: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"Bağlantı hatası: ({e})")
            
        time.sleep(10)

if __name__ == "__main__":
    sensor_similasyonu()
