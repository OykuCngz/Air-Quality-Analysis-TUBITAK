import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

print("1. TÜBİTAK B Planı Devrede: 1 Milyonluk Seul Verisi Yükleniyor...")
df = pd.read_csv("SEUL_PIVOT_TEMIZ_VERI.csv")

hedef_kolonlar = ['SO2', 'NO2', 'CO', 'O3', 'PM10']
df = df.dropna(subset=hedef_kolonlar)

print(f"Toplam {len(df)} adet tertemiz satır bulundu.\n")

X = df[['SO2', 'NO2', 'CO', 'O3']]


y = df['PM10']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("2. Yapay Zeka (Random Forest) Büyük Veri İle Eğitiliyor...")

model = RandomForestRegressor(n_estimators=50, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

print("3. Model Test Ediliyor ve Performans Ölçülüyor...\n")
y_pred = model.predict(X_test)


r2 = r2_score(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)

print("-" * 40)
print(" B PLANI: BÜYÜK VERİ MODEL SONUÇLARI ")
print("-" * 40)
print(f"R² Skoru (Açıklanan Varyans): {r2:.3f}")
print(f"Ortalama Karesel Hata (MSE): {mse:.3f}")
print(f"Kök Ortalama Karesel Hata (RMSE): {rmse:.3f}")
print("-" * 40)

if r2 >= 0.70:
    print("\nTÜBİTAK R² >= 0.70 hedefine devasa veri setiyle ULAŞILDI!")
    print("Risk yönetimi planı kusursuz çalıştı.")
else:
    print("\nModel skoru gelişti ancak hedef değerin biraz altında.")