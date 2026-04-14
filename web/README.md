# AeroPredict ML — Air Quality Digital Twin
**TÜBİTAK 2209-A Destekli Yüksek Doğruluklu Hava Kalitesi Analiz ve Tahmin Platformu**

AeroPredict, düşük maliyetli sensör ağlarını (Low-Cost Sensors) yazılım tabanlı bir **Dijital İkiz (Digital Twin)** yaklaşımıyla optimize eden, makine öğrenmesi destekli profesyonel bir hava kalitesi izleme arayüzüdür.

## Yeni Nesil Özellikler

- **Güvenlik Geçidi (Security Gateway)**: Yetkisiz erişimi engelleyen, şifre korumalı (SSO-style) giriş sistemi.
- **Uydu Telemetrisi ve Veri Asimilasyonu**: Open-Meteo API entegrasyonu ile İstanbul'un farklı istasyonlarından (Kandilli, Beşiktaş, Kadıköy vb.) anlık meteorolojik verilerin otomatik çekilmesi.
- **7 Günlük Tahmini Projeksiyon**: Sadece anlık değil, gelecek 7 güne dair hava kalitesi ve meteorolojik durum tahminlerini içeren genişletilmiş panel.
- **XAI (Açıklanabilir Yapay Zeka)**: SHAP (TreeExplainer) kullanarak modelin hangi parametreye (SO2, Sıcaklık vb.) neden ağırlık verdiğini gerçek zamanlı gösteren karar analiz paneli.
- **GIS Harita Entegrasyonu**: Leaflet.js tabanlı interaktif harita üzerinde istasyon konumu ve canlı durum takibi.
- **PDF Rapor Motoru**: Tek tıkla profesyonel, TÜBİTAK raporlama standartlarına uygun, detaylı analiz çıktıları üreten motor.

## Proje Yapısı

```
web/
├── index.html              # Çok katmanlı Dijital İkiz arayüzü
├── css/
│   ├── styles.css          # Global tasarım sistemi (Variables, Keyframes)
│   └── components.css      # Panel, Buton ve Glassmorphism bileşenleri
└── js/
    ├── app.js              # Uygulama motoru, API senkronizasyonu ve Harita mantığı
    ├── predictions.js      # ML Tahmin boru hattı ve XAI (SHAP) render motoru
    └── charts.js           # Dual-trend (PM10/PM2.5) görselleştirme motoru
```

## Kurulum ve Kullanım

### 1. Backend (API) Kurulumu
Modelin ve XAI motorunun çalışması için Flask API gereklidir:
```bash
cd api
pip install -r requirements.txt
python server.py
```

### 2. Frontend Erişimi
`web/index.html` dosyasını tarayıcınızda açın. Başlangıçta sistem sizden yetki kodu isteyecektir (Varsayılan: `tubitak`).

## Teknik Spektrum

- **Model**: Hybrid Random Forest / LSTM Ensemble (160,107+ Veri Satırı)
- **Doğruluk**: 0.87 R² Score (Validasyon Seti)
- **XAI**: SHAP (Shapley Additive Explanations)
- **Teknolojiler**: Vanilla JS, CSS3 (Glassmorphism), Chart.js 4.4.1, Leaflet.js, html2pdf
- **Veri Kaynağı**: Open-Meteo Satellite Feed & Local Fused Sensors

## Tasarım Estetiği

- **Vibrant Dark Mode**: Göz yormayan, kontrastı yüksek laboratuvar estetiği.
- **Micro-Animations**: Kullanıcı etkileşimini artıran yumuşak geçişler ve pulse efektleri.
- **Data-Dense Layout**: Maksimum veriyi minimal alanda, hiyerarşik bir düzenle sunan profesyonel dashboard.

---
*Bu proje **TÜBİTAK 2209-A** programı kapsamında geliştirilmektedir.*
