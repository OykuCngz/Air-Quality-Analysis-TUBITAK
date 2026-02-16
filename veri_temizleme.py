import pandas as pd


df = pd.read_csv("global_air_quality_data_10000.csv", sep=";", encoding="cp1254")


ay_sozluk = {
    'Oca': '01', 'Şub': '02', 'Mar': '03', 'Nis': '04', 'May': '05', 'Haz': '06',
    'Tem': '07', 'Ağu': '08', 'Eyl': '09', 'Eki': '10', 'Kas': '11', 'Ara': '12'
}

def excel_tarih_duzelt(val):
    if pd.isna(val):
        return val
    s = str(val).strip().replace(',', '.') 
    
   
    for ay, num in ay_sozluk.items():
        if ay in s:
            s = s.replace(ay, num)
    return s


num_cols = ['PM2.5', 'PM10', 'NO2', 'SO2', 'CO', 'O3', 'Temperature', 'Humidity', 'Wind Speed']


for col in num_cols:
    df[col] = df[col].apply(excel_tarih_duzelt)
    df[col] = pd.to_numeric(df[col], errors='coerce')

df_istanbul = df[df['City'] == 'Istanbul'].copy()


df_istanbul.to_csv("istanbul_global_meteorolojik_temiz.csv", index=False)

print("Veri başarıyla temizlendi ve kaydedildi!")
print(df_istanbul.head())