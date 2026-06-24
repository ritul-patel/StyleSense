import os
import re

files = [
    (r"E:\wab\StyleSense\clothes\produts - Tshirts.tsv", "Top"),
    (r"E:\wab\StyleSense\clothes\produts - POLO.tsv", "Top"),
    (r"E:\wab\StyleSense\clothes\produts - shirts.tsv", "Top"),
    (r"E:\wab\StyleSense\clothes\produts - Jeans.tsv", "Bottom")
]

products = []
pid = 1

for file_path, category in files:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            if "Product Tracker" in line or "Product Name" in line or not line.strip():
                continue
            
            parts = line.split('\t')
            if len(parts) >= 7:
                # If first column is an index, remove it
                if parts[0].strip().isdigit() or parts[0] == '':
                    parts = parts[1:]
                
                # Double check length
                if len(parts) < 7:
                    continue
                
                name = parts[0].strip()
                brand = parts[1].strip()
                
                # Parse price (e.g. "Rs 399.00", "1363")
                price_str = parts[2].strip().replace(',', '')
                price_match = re.search(r'\d+', price_str)
                price = float(price_match.group()) if price_match else 0
                
                image = parts[3].strip()
                storeUrl = parts[4].strip()
                affiliateLink = parts[5].strip()
                color = parts[6].strip().capitalize()
                
                # Basic season/occasion
                season = "Summer" if "T-shirt" in name or "Tee" in name else "All Seasons"
                occasion = "Casual"
                if "Formal" in name or "Office" in name:
                    occasion = "Formal"
                elif "Polo" in name:
                    occasion = "Smart Casual"
                
                products.append(f"""  {{
    id: "prod_{pid}",
    name: "{name.replace('"', '\\"')}",
    brand: "{brand.replace('"', '\\"')}",
    category: "{category}",
    image: "{image}",
    color: "{color}",
    season: "{season}",
    occasion: "{occasion}",
    price: {price},
    storeUrl: "{storeUrl}",
    affiliateLink: "{affiliateLink}"
  }}""")
                pid += 1

ts_content = f"""import {{ Product }} from "@/types/Product";

export const MOCK_PRODUCTS: Product[] = [
{",\\n".join(products)}
];
"""

with open(r"E:\wab\StyleSense\client\src\data\products.ts", "w", encoding="utf-8") as out:
    out.write(ts_content)

print(f"Generated {pid-1} products into products.ts")
