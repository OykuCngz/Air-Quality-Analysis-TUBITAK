# 🌍 AeroPredict: High-Fidelity Air Quality Digital Twin & ML Analysis
**TÜBİTAK 2209-A Supported Research Project**

![Status](https://img.shields.io/badge/Status-Final_Phase-success?style=for-the-badge)
![TÜBİTAK](https://img.shields.io/badge/Supported_By-TÜBİTAK-red?style=for-the-badge)
![Accuracy](https://img.shields.io/badge/Accuracy-0.87_R2-blue?style=for-the-badge)

## 📌 Project Overview
AeroPredict is an advanced air quality monitoring and prediction ecosystem designed to bridge the gap between low-cost IoT sensors and high-precision environmental analytics. By utilizing a **Digital Twin** framework, the project fuses local sensor data with global satellite telemetry (Open-Meteo) to provide accurate, explainable, and actionable insights for urban air quality management.

## 🚀 Key Features

- **Extreme Data Fusion**: Trained on over **160,107 data points**, merging local measurements with international datasets for robust transfer learning.
- **Predictive Intelligence**: High-accuracy PM10 and PM2.5 forecasting using optimized Random Forest ensembles.
- **Explainable AI (XAI)**: Integrated **SHAP (TreeExplainer)** for real-time feature attribution, demystifying the model's decision-making process.
- **7-Day Dynamic Forecast**: Forward-looking air quality and meteorological projections powered by satellite data assimilation.
- **AeroReport Engine**: Professional PDF generation system for exporting data-rich analytical reports suitable for policy-making.
- **GIS Mapping**: Real-time spatial tracking of air quality nodes across Istanbul.

## 🛠️ Technical Architecture

### **Core Stack**
- **Machine Learning**: Python 🐍 (Scikit-learn, SHAP, Joblib, Pandas, NumPy)
- **API Engine**: Flask (REST API, CORS enabled, Latency < 50ms)
- **Frontend Dashboard**: HTML5, Vanilla JavaScript, CSS3 (Rich Dark Mode, Glassmorphism)
- **Visualization**: Chart.js 4.4.1 & Leaflet.js
- **Data Source**: Fused Local Sensors + Open-Meteo Satellite Feeds

### **Model Performance**
| Metric | Value |
| :--- | :--- |
| **R² Score** | 0.87 |
| **Data Rows** | 160,107 |
| **Inference Latency** | ~42 ms |
| **Feature Set** | SO2, NO2, CO, O3, Temp, Hum, Wind |

## 📅 Project Roadmap (Current State)

- [x] **Phase 1: Research & Planning**
- [x] **Phase 2: Hardware Sensor Integration & Data Collection**
- [x] **Phase 3: Dataset Fusion & Refinement (160k+ Rows)**
- [x] **Phase 4: ML Model Optimization & SHAP Implementation**
- [x] **Phase 5: High-Fidelity Dashboard Development (Current)**
- [ ] **Phase 6: Final Field Validation & TÜBİTAK Submission**

## 🔧 Getting Started

### **Backend Setup**
```bash
cd api
pip install -r requirements.txt
python server.py
```

### **Dashboard Setup**
Open `web/index.html` in any modern browser. 
*Note: Use authorization code `tubitak` to bypass the security gateway.*

---
*Developed by Öykü Cengiz as part of the TÜBİTAK 2209-A University Students Research Program.*
