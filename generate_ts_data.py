import os
import re
import csv

tshirts_raw = []
polos_raw = []
shirts_raw = []
jeans_raw = []
sneakers_raw = []

# 1. Parse Tshirts
tshirts_file = r"E:\wab\StyleSense\clothes\produts - Tshirts.tsv"
if os.path.exists(tshirts_file):
    with open(tshirts_file, 'r', encoding='utf-8') as f:
        for line in f:
            if "Product Tracker" in line or "Product Name" in line or not line.strip():
                continue
            parts = line.split('\t')
            if len(parts) >= 7:
                if parts[0].strip().isdigit() or parts[0] == '':
                    parts = parts[1:]
                if len(parts) < 7:
                    continue
                name = parts[0].strip()
                brand = parts[1].strip()
                price_str = parts[2].strip().replace(',', '')
                price_match = re.search(r'\d+', price_str)
                price = float(price_match.group()) if price_match else 0
                image = parts[3].strip()
                storeUrl = parts[4].strip()
                affiliateLink = parts[5].strip()
                color = parts[6].strip().capitalize()
                
                tshirts_raw.append({
                    "name": name,
                    "brand": brand,
                    "price": price,
                    "image": image,
                    "storeUrl": storeUrl,
                    "affiliateLink": affiliateLink,
                    "color": color,
                    "category": "tshirt"
                })

# 2. Parse POLO
polo_file = r"E:\wab\StyleSense\clothes\produts - POLO.tsv"
if os.path.exists(polo_file):
    with open(polo_file, 'r', encoding='utf-8') as f:
        for line in f:
            if "Product Tracker" in line or "Product Name" in line or not line.strip():
                continue
            parts = line.split('\t')
            if len(parts) >= 7:
                if parts[0].strip().isdigit() or parts[0] == '':
                    parts = parts[1:]
                if len(parts) < 7:
                    continue
                name = parts[0].strip()
                brand = parts[1].strip()
                price_str = parts[2].strip().replace(',', '')
                price_match = re.search(r'\d+', price_str)
                price = float(price_match.group()) if price_match else 0
                image = parts[3].strip()
                storeUrl = parts[4].strip()
                affiliateLink = parts[5].strip()
                color = parts[6].strip().capitalize()
                
                polos_raw.append({
                    "name": name,
                    "brand": brand,
                    "price": price,
                    "image": image,
                    "storeUrl": storeUrl,
                    "affiliateLink": affiliateLink,
                    "color": color,
                    "category": "polo"
                })

# 3. Parse shirts
shirts_file = r"E:\wab\StyleSense\clothes\produts - shirts.tsv"
if os.path.exists(shirts_file):
    with open(shirts_file, 'r', encoding='utf-8') as f:
        for line in f:
            if "Product Tracker" in line or "Product Name" in line or not line.strip():
                continue
            parts = line.split('\t')
            if len(parts) >= 7:
                if parts[0].strip().isdigit() or parts[0] == '':
                    parts = parts[1:]
                if len(parts) < 7:
                    continue
                name = parts[0].strip()
                brand = parts[1].strip()
                price_str = parts[2].strip().replace(',', '')
                price_match = re.search(r'\d+', price_str)
                price = float(price_match.group()) if price_match else 0
                image = parts[3].strip()
                storeUrl = parts[4].strip()
                affiliateLink = parts[5].strip()
                color = parts[6].strip().capitalize()
                
                shirts_raw.append({
                    "name": name,
                    "brand": brand,
                    "price": price,
                    "image": image,
                    "storeUrl": storeUrl,
                    "affiliateLink": affiliateLink,
                    "color": color,
                    "category": "shirt"
                })

# 4. Parse Jeans
jeans_file = r"E:\wab\StyleSense\clothes\produts - Jeans.tsv"
if os.path.exists(jeans_file):
    with open(jeans_file, 'r', encoding='utf-8') as f:
        for line in f:
            if "Product Tracker" in line or "Product Name" in line or not line.strip():
                continue
            parts = line.split('\t')
            if len(parts) >= 7:
                if parts[0].strip().isdigit() or parts[0] == '':
                    parts = parts[1:]
                if len(parts) < 7:
                    continue
                name = parts[0].strip()
                brand = parts[1].strip()
                price_str = parts[2].strip().replace(',', '')
                price_match = re.search(r'\d+', price_str)
                price = float(price_match.group()) if price_match else 0
                image = parts[3].strip()
                storeUrl = parts[4].strip()
                affiliateLink = parts[5].strip()
                color = parts[6].strip().capitalize()
                
                jeans_raw.append({
                    "name": name,
                    "brand": brand,
                    "price": price,
                    "image": image,
                    "storeUrl": storeUrl,
                    "affiliateLink": affiliateLink,
                    "color": color,
                    "category": "jeans"
                })

# 5. Parse Sneakers
shoes_file = r"E:\wab\StyleSense\products.tsv"
if os.path.exists(shoes_file):
    with open(shoes_file, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip() or "Product Name" in line:
                continue
            parts = line.split('\t')
            if len(parts) >= 7:
                name = parts[0].strip()
                if "sneaker" in name.lower() or "shoe" in name.lower():
                    brand = parts[1].strip()
                    price_str = parts[2].strip().replace(',', '')
                    price_match = re.search(r'\d+', price_str)
                    price = float(price_match.group()) if price_match else 0
                    image = parts[3].strip()
                    storeUrl = parts[4].strip()
                    affiliateLink = parts[5].strip()
                    color = parts[6].strip().capitalize()
                    
                    sneakers_raw.append({
                        "name": name,
                        "brand": brand,
                        "price": price,
                        "image": image,
                        "storeUrl": storeUrl,
                        "affiliateLink": affiliateLink,
                        "color": color,
                        "category": "sneakers"
                    })

print("Verify category counts after parsing:")
print(f"Tshirts: {len(tshirts_raw)}")
print(f"Polos: {len(polos_raw)}")
print(f"Shirts: {len(shirts_raw)}")
print(f"Jeans: {len(jeans_raw)}")
print(f"Sneakers: {len(sneakers_raw)}")

# Create catalog with stable sequential IDs
all_products = []
product_id_map = {}

def add_to_catalog(item):
    key = (item['category'], item['name'])
    if key not in product_id_map:
        pid = f"P{len(all_products) + 1:03d}"
        product_id_map[key] = pid
        item['id'] = pid
        all_products.append(item)
    return product_id_map[key]

for item in tshirts_raw: add_to_catalog(item)
for item in polos_raw: add_to_catalog(item)
for item in shirts_raw: add_to_catalog(item)
for item in jeans_raw: add_to_catalog(item)
for item in sneakers_raw: add_to_catalog(item)

# Build outfit products mappings
outfit_products = []
outfits_set = set()

white_sneakers = [s for s in sneakers_raw if s['color'].lower() == 'white']
other_sneakers = [s for s in sneakers_raw if s['color'].lower() != 'white']

if not white_sneakers:
    white_sneakers = sneakers_raw
if not other_sneakers:
    other_sneakers = sneakers_raw

for i in range(1, 31):
    oid = f"O{i:03d}"
    outfits_set.add(oid)
    
    # 1. Top selection (cycling for healthy mix)
    category_cycle = ["tshirt", "polo", "shirt"]
    chosen_cat = category_cycle[(i - 1) % 3]
    if chosen_cat == "tshirt":
        top_item = tshirts_raw[((i - 1) // 3) % len(tshirts_raw)]
    elif chosen_cat == "polo":
        top_item = polos_raw[((i - 1) // 3) % len(polos_raw)]
    else:
        top_item = shirts_raw[((i - 1) // 3) % len(shirts_raw)]
        
    top_id = product_id_map[(top_item['category'], top_item['name'])]
    outfit_products.append(f'  {{ outfit_id: "{oid}", product_id: "{top_id}", position: "top" }}')
    
    # 2. Bottom selection (Jeans)
    jean_item = jeans_raw[(i - 1) % len(jeans_raw)]
    jean_id = product_id_map[(jean_item['category'], jean_item['name'])]
    outfit_products.append(f'  {{ outfit_id: "{oid}", product_id: "{jean_id}", position: "bottom" }}')
    
    # 3. Shoe selection (white sneaker target distribution: 22 white / 8 other)
    if (i - 1) % 4 == 0:
        shoe_item = other_sneakers[((i - 1) // 4) % len(other_sneakers)]
    else:
        shoe_item = white_sneakers[(i - 1) % len(white_sneakers)]
        
    shoe_id = product_id_map[(shoe_item['category'], shoe_item['name'])]
    outfit_products.append(f'  {{ outfit_id: "{oid}", product_id: "{shoe_id}", position: "shoes" }}')
    
    # 4. Alternatives shoes mapping (max 4 alternative shoes)
    alternatives = [s for s in sneakers_raw if s['name'] != shoe_item['name']]
    for j in range(min(4, len(alternatives))):
        alt_shoe = alternatives[(i + j) % len(alternatives)]
        alt_id = product_id_map[(alt_shoe['category'], alt_shoe['name'])]
        outfit_products.append(f'  {{ outfit_id: "{oid}", product_id: "{alt_id}", position: "shoes" }}')

# Write products.ts
products_formatted = []
for p in all_products:
    products_formatted.append(f"""  {{
    id: "{p['id']}",
    name: "{p['name'].replace('"', '\\"')}",
    brand: "{p['brand'].replace('"', '\\"')}",
    category: "{p['category']}",
    image: "{p['image']}",
    color: "{p['color']}",
    price: {p['price']},
    storeUrl: "{p['storeUrl']}",
    affiliateLink: "{p['affiliateLink']}"
  }}""")

with open(r"E:\wab\StyleSense\client\src\data\products.ts", "w", encoding="utf-8") as out:
    out.write('export type Product = {\n  id: string;\n  name: string;\n  brand: string;\n  category: string;\n  image: string;\n  color: string;\n  price: number;\n  storeUrl: string;\n  affiliateLink: string;\n};\n\n')
    out.write("export const PRODUCTS: Product[] = [\n")
    out.write(",\n".join(products_formatted))
    out.write("\n];\n")

# Write outfitProducts.ts
with open(r"E:\wab\StyleSense\client\src\data\outfitProducts.ts", "w", encoding="utf-8") as out:
    out.write('import { PRODUCTS } from "./products";\n\n')
    out.write('export type OutfitProduct = {\n  outfit_id: string;\n  product_id: string;\n  position: "top" | "bottom" | "shoes";\n};\n\n')
    out.write("export const OUTFIT_PRODUCTS: OutfitProduct[] = [\n")
    out.write(",\n".join(outfit_products))
    out.write("\n];\n\n")
    out.write("""export function getProductsForOutfit(outfitId: string) {
  const mappings = OUTFIT_PRODUCTS.filter(op => op.outfit_id === outfitId);
  const getProds = (pos: string) => mappings.filter(op => op.position === pos).map(op => PRODUCTS.find(p => p.id === op.product_id)).filter((p): p is typeof PRODUCTS[0] => !!p);
  return {
    top: getProds("top"),
    bottom: getProds("bottom"),
    shoes: getProds("shoes")
  };
}
""")

# Write outfits.ts
outfit_images = {}
outfits_sheet_file = r"E:\wab\StyleSense\clothes\produts - Outfits_sheet.tsv"
if os.path.exists(outfits_sheet_file):
    with open(outfits_sheet_file, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip() or "outfit_id" in line:
                continue
            parts = line.split('\t')
            if len(parts) >= 3:
                oid = parts[0].strip()
                image_url = parts[1].strip()
                pinterest_url = parts[2].strip()
                outfit_images[oid] = {
                    "image_url": image_url,
                    "pinterest_url": pinterest_url
                }

outfits = []
for i in range(1, 31):
    oid = f"O{i:03d}"
    img_info = outfit_images.get(oid, {"image_url": "", "pinterest_url": ""})
    outfits.append(f"""  {{
    outfit_id: "{oid}",
    imageUrl: "{img_info['image_url']}",
    pinterestUrl: "{img_info['pinterest_url']}"
  }}""")

with open(r"E:\wab\StyleSense\client\src\data\outfits.ts", "w", encoding="utf-8") as out:
    out.write('export type Outfit = {\n  outfit_id: string;\n  imageUrl: string;\n  pinterestUrl: string;\n};\n\n')
    out.write("export const OUTFITS: Outfit[] = [\n")
    out.write(",\n".join(outfits))
    out.write("\n];\n")

print(f"Successfully generated data: {len(all_products)} unique products, 30 outfits.")
