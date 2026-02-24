# Sensör Entegrasyon ve Donanım Rehberi

Bu doküman, Air Quality Analysis projesinin fiziksel sensörlerle nasıl birleştirileceğini adım adım açıklar.

## 1. Donanım Mimarisi
Proje, **IOT (Internet of Things)** tabanlı bir mimari kullanır. 
- **Veri Toplama:** ESP32 mikrodenetleyici sensörlerden veriyi okur.
- **İletişim:** Wi-Fi üzerinden Flask API sunucusuna (server.py) veriyi gönderir.
- **Analiz:** Sunucu veriyi alır, Random Forest modelinden geçirir ve web arayüzüne basar.

## 2. Devre Şeması (Basit Anlatım)
- **PMS5003:** ESP32'nin TX/RX (Serial) pinlerine bağlanır.
- **MQ-135:** ESP32'nin Analog (ADC) pinine bağlanır.
- **Güç:** ESP32, USB üzerinden veya 5V adaptörle beslenir.

## 3. ESP32 Kod Taslağı (Arduino IDE)
Aşağıdaki kod, sensörden okuduğu verileri benim çalıştırdığım sunucuya gönderen temel mantıktır:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "WIFI_ADINIZ";
const char* password = "WIFI_SIFRENIZ";
const char* serverUrl = "http://BILGISAYAR_IP_ADRESINIZ:5000/api/predict";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    // Örnek değerler
    float so2 = analogRead(34) / 10.0; 
    float no2 = analogRead(35) / 10.0;
    float co = analogRead(32) / 100.0;
    float o3 = analogRead(33) / 10.0;

    String jsonPayload = "{\"SO2\":" + String(so2) + ",\"NO2\":" + String(no2) + ",\"CO\":" + String(co) + ",\"O3\":" + String(o3) + "}";
    
    int httpResponseCode = http.POST(jsonPayload);
    http.end();
  }
  delay(10000); 
}
```

## 4. Saha Testi
- **Kalibrasyon:** MQ-135 gibi gaz sensörlerini ilk açtığınızda 24 saat "ısınma" (burn-in) süresi vermemiz gerekir.
- **Yerleşim:** Sensörleri yerden yaklaşık 1.5 - 2 metre yüksekliğe (insan nefes seviyesi), doğrudan rüzgar almayan ama hava akışı olan bir noktaya yerleştirelim.
- **Doğrulama:** Sensörden aldığımız verileri, [Hava İzleme](https://www.havaizleme.gov.tr/) adresindeki en yakın istasyon verileri ile karşılaştırarak projenin "Raporlama" kısmına ekleyelim.
