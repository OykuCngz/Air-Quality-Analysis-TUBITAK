# AQI Predictor Web Interface

Modern, dark-themed hava kalitesi tahmin uygulaması. PM10 seviyelerini tahmin etmek için makine öğrenmesi modeli kullanan web arayüzü.

## 🎨 Özellikler

- **3 Farklı Görünüm**: Ana tahmin ekranı, geçmiş veriler ve sensör detayları
- **Gerçek Zamanlı Tahminler**: Gaz sensörü değerlerine göre PM10 tahmini
- **İnteraktif Slider'lar**: SO₂, NO₂, CO, O₃ değerlerini ayarlayın
- **Görselleştirme**: Chart.js ile 24 saatlik trend grafikleri
- **Dark Theme**: Modern, mobil uyumlu tasarım
- **Durum Göstergeleri**: İyi, Orta, Kötü hava kalitesi uyarıları

## 📁 Proje Yapısı

```
web/
├── index.html              # Ana HTML dosyası (3 ekran)
├── css/
│   ├── styles.css          # Temel tasarım sistemi
│   └── components.css      # Komponent stilleri
└── js/
    ├── app.js              # Ana uygulama mantığı
    ├── predictions.js      # Tahmin ve API entegrasyonu
    └── charts.js           # Chart.js grafikleri

api/
├── server.py               # Flask API sunucusu
└── requirements.txt        # Python bağımlılıkları
```

## 🚀 Kullanım

### Web Arayüzünü Açma (Standalone)

Mock verilerle çalışır:

1. `web/index.html` dosyasını tarayıcınızda açın
2. Sensör değerlerini ayarlayın
3. "RUN SIMULATION" butonuna tıklayın

### Flask API ile Kullanma (Gerçek Model)

1. API bağımlılıklarını yükleyin:
```bash
cd api
pip install -r requirements.txt
```

2. Flask sunucusunu başlatın:
```bash
python server.py
```

3. `web/js/predictions.js` dosyasında `useMock: false` yapın

4. `web/index.html` dosyasını tarayıcınızda açın

## 🎮 Ekranlar

### Ekran 1: AQ Prediction
- Canlı akış göstergesi
- PM10 tahmin kartı
- 4 sensör parametresi (SO₂, NO₂, CO, O₃)
- 24 saatlik trend grafiği
- Simülasyon butonu

### Ekran 2: AQI Predictor (Geçmiş)
- Orta seviye durum göstergesi
- Gaz parametreleri
- 24 saatlik geçmiş trend

### Ekran 3: Sensör Detayları
- Dairesel gauge göstergesi
- Sensör parametreleri
- Batarya, sinyal, çalışma süresi bilgisi

## 🔧 API Endpoints

- `GET /` - Servis durumu
- `POST /api/predict` - PM10 tahmini
- `GET /api/health` - Detaylı sağlık kontrolü

### Örnek API İsteği

```javascript
fetch('http://localhost:5000/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    SO2: 124,
    NO2: 38,
    CO: 0.8,
    O3: 72
  })
})
```

## 📊 Teknolojiler

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Charts**: Chart.js 4.4.1
- **Backend**: Flask 3.0+
- **ML Model**: Scikit-learn (Random Forest)
- **Font**: Inter (Google Fonts)

## 🎨 Tasarım Özellikleri

- Dark blue color scheme (#0a0e1a, #1e90ff)
- Glassmorphism effects
- Smooth animations & transitions
- Mobile-first responsive design
- Custom range sliders
- Interactive charts

## 📝 Notlar

- Uygulama varsayılan olarak mock tahminlerle çalışır
- Gerçek ML model entegrasyonu için Flask API kullanın
- Tüm değerler µg/m³ cinsinden
