import json

# Baca file JSON
with open('data/questions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Mapping kategori
category_mapping = {
    'PU': 'Penalaran Umum',
    'PU-IND': 'Penalaran Induktif',
    'PU-DED': 'Penalaran Deduktif',
    'PPU': 'Pengetahuan & Pemahaman Umum',
    'PBM': 'Pemahaman Bacaan & Menulis',
    'PK': 'Pengetahuan Kuantitatif',
    'LB-INDO': 'Literasi Bahasa Indonesia',
    'LB-ING': 'Literasi Bahasa Inggris',
    'PM': 'Penalaran Matematika'
}

# Update semua kategori
changed = 0
for item in data:
    if 'category' in item and item['category'] in category_mapping:
        item['category'] = category_mapping[item['category']]
        changed += 1

# Simpan kembali ke file
with open('data/questions.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Refactor kategori selesai!')
print(f'Total soal yang diubah: {changed}')

# Ringkasan
categories = {}
for item in data:
    cat = item.get('category', 'Unknown')
    categories[cat] = categories.get(cat, 0) + 1

print('\nRingkasan per kategori:')
for cat, count in sorted(categories.items()):
    print(f'  {cat}: {count} soal')
