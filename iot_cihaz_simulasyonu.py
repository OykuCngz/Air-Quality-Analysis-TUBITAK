import requests
import time
import random

API_URL = "http://localhost:5000/api/predict"

def sensor_similasyonu():
    print("Sensör cihazı başlatıldı. Veriler gönderiliyor...")
    
    while True:
        sensor_verileri = {
            "SO2": round(random.uniform(5, 50), 2),     
            "NO2": round(random.uniform(10, 80), 2),    
            "CO": round(random.uniform(0.1, 2.5), 1),   
            "O3": round(random.uniform(20, 100), 2)     
        }
        
        try:
            response = requests.post(API_URL, json=sensor_verileri)
            
            if response.status_code == 200:
                print(f"Veri başarıyla gönderildi: {sensor_verileri} -> Tahmin: {response.json().get('prediction')}")
            else:
                print(f"Sunucu hatası: {response.status_code}")
                
        except Exception as e:
            print(f"Bağlantı hatası: Sunucu çalışıyor mu? ({e})")
            
        time.sleep(5)

if __name__ == "__main__":
    sensor_similasyonu()
