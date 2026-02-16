import pandas as pd

print("Kandilli referans verisi okunuyor...")
df_kandilli = pd.read_csv("Marmara_THMOPEN_Hava_Kalitesi_2024 (1).csv", sep=";", encoding="latin1")

df_kandilli.columns = ['Bolge', 'Sehir', 'Istasyon', 'Tarih', 'PM10', 'SO2', 'NO2', 'NOX', 'NO']


ay_sozluk = {
    'Oca': '01', 'Þub': '02', 'Şub': '02', 'Mar': '03', 'Nis': '04', 
    'May': '05', 'Haz': '06', 'Tem': '07', 'Aðu': '08', 'Ağu': '08', 
    'Eyl': '09', 'Eki': '10', 'Kas': '11', 'Ara': '12'
}

def kandilli_duzelt(val):
    if pd.isna(val):
        return val
    s = str(val).strip().replace(',', '.')
    for ay, num in ay_sozluk.items():
        if ay in s:
            s = s.replace(ay, num)
    return s


hedef_kolonlar = ['PM10', 'SO2', 'NO2', 'NOX', 'NO']
for col in hedef_kolonlar:
    df_kandilli[col] = df_kandilli[col].apply(kandilli_duzelt)
    df_kandilli[col] = pd.to_numeric(df_kandilli[col], errors='coerce')


df_kandilli['Date'] = df_kandilli['Tarih'].str.split(' ').str[0]


print("Temizlenmiş meteoroloji verisi okunuyor...")
df_meteoroloji = pd.read_csv("istanbul_global_meteorolojik_temiz.csv")


print("İki veri seti tarihlerine göre birleştiriliyor (Data Fusion)...")
df_fuzyon = pd.merge(df_meteoroloji, df_kandilli, on='Date', how='inner')


df_fuzyon.to_csv("YAPAY_ZEKA_EGITIM_SETI.csv", index=False)

print("\nBAŞARILI! Nihai yapay zeka eğitim seti oluşturuldu.")
print(f"Toplam {len(df_fuzyon)} günlük referanslı veri elde edildi.")