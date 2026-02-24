import streamlit as st
import pandas as pd
import joblib

st.set_page_config(page_title="Hava Kalitesi Yapay Zeka", page_icon="🌍", layout="centered")
st.title("🌍 Hava Kalitesi (PM10) Tahmin Arayüzü")
st.markdown("TÜBİTAK Projesi: Düşük maliyetli gaz sensörü verileriyle PM10 tahmini yapan Random Forest Modeli.")

@st.cache_resource 
def load_model():
    return joblib.load("hava_kalitesi_modeli.pkl")

model = load_model()

st.header("Sensör Verilerini Girin")
col1, col2 = st.columns(2)

with col1:
    so2_val = st.number_input("SO2 (Kükürtdioksit) Değeri:", min_value=0.0, max_value=2.0, value=0.05, format="%.3f")
    no2_val = st.number_input("NO2 (Azotdioksit) Değeri:", min_value=0.0, max_value=3.0, value=0.06, format="%.3f")

with col2:
    co_val = st.number_input("CO (Karbonmonoksit) Değeri:", min_value=0.0, max_value=50.0, value=1.5, format="%.1f")
    o3_val = st.number_input("O3 (Ozon) Değeri:", min_value=0.0, max_value=1.0, value=0.03, format="%.3f")

st.markdown("---")
if st.button("🚀 PM10 Kirliliğini Tahmin Et", use_container_width=True):
    girdi = pd.DataFrame([[so2_val, no2_val, co_val, o3_val]], columns=['SO2', 'NO2', 'CO', 'O3'])
    
    tahmin = model.predict(girdi)[0]
    
    st.success("Yapay Zeka Tahmini Tamamlandı!")
   
    st.metric(label="Tahmini PM10 Yoğunluğu (µg/m³)", value=f"{tahmin:.2f}")

    if tahmin < 50:
        st.info("🟢 Hava Kalitesi: İYİ (Hassas gruplar için risk yok)")
    elif tahmin < 100:
        st.warning("🟡 Hava Kalitesi: ORTA (Hassas gruplar için hafif riskli)")
    else:
        st.error("🔴 Hava Kalitesi: KÖTÜ (Sağlıksız durum!)")