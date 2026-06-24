import csv

input_file = r"E:\wab\StyleSense\clothes\produts - Tshirts.tsv"
output_file = r"E:\wab\StyleSense\clean_tshirts.tsv"

cleaned_rows = []

with open(input_file, 'r', encoding='utf-8') as f:
    for line in f:
        # skip empty or header lines
        if "Product Tracker" in line or "Product Name" in line or not line.strip():
            continue
        
        parts = line.split('\t')
        
        # If the first part is a number or empty, and we have 8 parts, the first is probably an index column
        # Let's just drop the first column if it's 8 items long or starts with an empty/number
        if len(parts) >= 7:
            # If line starts with a number + tab, or just tab
            if parts[0].strip().isdigit() or parts[0] == '':
                cleaned_rows.append('\t'.join(parts[1:]).strip('\n'))
            else:
                cleaned_rows.append(line.strip('\n'))

with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(cleaned_rows))

print(f"Cleaned {len(cleaned_rows)} rows.")
