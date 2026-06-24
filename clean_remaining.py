import glob

files = [
    r"E:\wab\StyleSense\clothes\produts - Jeans.tsv",
    r"E:\wab\StyleSense\clothes\produts - POLO.tsv",
    r"E:\wab\StyleSense\clothes\produts - shirts.tsv"
]

output_file = r"E:\wab\StyleSense\clean_remaining.tsv"

cleaned_rows = []

for input_file in files:
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            # skip empty or header lines
            if "Product Tracker" in line or "Product Name" in line or not line.strip():
                continue
            
            parts = line.split('\t')
            
            if len(parts) >= 7:
                if parts[0].strip().isdigit() or parts[0] == '':
                    cleaned_rows.append('\t'.join(parts[1:]).strip('\n'))
                else:
                    cleaned_rows.append(line.strip('\n'))

with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(cleaned_rows))

print(f"Cleaned {len(cleaned_rows)} rows from remaining files.")
