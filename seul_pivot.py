import pandas as pd

print("1 Milyon satırlık devasa Seul verisi okunuyor (Bu işlem 10-15 saniye sürebilir)...")
# HATA ÇÖZÜMÜ BURADA: Her iki dosyaya da encoding='cp1254' eklendi!
df_seul = pd.read_csv("Measurement_info.csv", sep=";", encoding="cp1254")
df_sozluk = pd.read_csv("Measurement_item_info.csv", sep=";", encoding="cp1254")

# Sözlük dosyasından sadece ihtiyacımız olan 'Item code' ve 'Item name' kolonlarını alıyoruz
df_sozluk = df_sozluk[['Item code', 'Item name']]

# İki tabloyu birleştirip kodların yanına gerçek isimleri (PM10, SO2 vb.) yazdırıyoruz
df_seul = pd.merge(df_seul, df_sozluk, on='Item code', how='left')

print("Excel'in bozduğu tarihler ve sayılar temizleniyor...")
ay_sozluk = {
    'Oca': '01', 'Şub': '02', 'Mar': '03', 'Nis': '04', 
    'May': '05', 'Haz': '06', 'Tem': '07', 'Ağu': '08', 
    'Eyl': '09', 'Eki': '10', 'Kas': '11', 'Ara': '12'
}

def seul_duzelt(val):
    if pd.isna(val):
        return val
    s = str(val).strip().replace(',', '.')
    for ay, num in ay_sozluk.items():
        if ay in s:
            s = s.replace(ay, num)
    return s

# "Average value" kolonundaki '1.Şub' gibi hataları temizleyip sayıya zorluyoruz
df_seul['Average value'] = df_seul['Average value'].apply(seul_duzelt)
df_seul['Average value'] = pd.to_numeric(df_seul['Average value'], errors='coerce')

print("Veri Geniş (Pivot) formata dönüştürülüyor...")
# [cite_start]Araştırma önerisi raporundaki Ön Çalışma pivot işlemi[cite: 97]:
df_pivot = df_seul.pivot_table(
    index=['Measurement date', 'Station code'], 
    columns='Item name', 
    values='Average value',
    aggfunc='mean'
).reset_index()

df_pivot.columns.name = None 

print("Pivot işlemi tamamlandı! Temiz veri kaydediliyor...")
df_pivot.to_csv("SEUL_PIVOT_TEMIZ_VERI.csv", index=False)

print("\nBAŞARILI! Seul ön çalışması rapor için hazırlandı.")