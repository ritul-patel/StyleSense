import json
import urllib.request
import csv

requirements = {
    "Oversized T-Shirts": {"colors": ["White", "Black", "Beige", "Cream", "Olive Green", "Brown", "Navy Blue", "Grey"]},
    "Polo T-Shirts": {"colors": ["White", "Black", "Beige", "Navy Blue", "Olive Green"]},
    "Casual Shirts": {"colors": ["White", "Sky Blue", "Beige", "Olive", "Black"]},
    "Jeans": {"colors": ["Blue", "Black", "Grey"]},
    "Chinos": {"colors": ["Beige", "Cream", "Black", "Olive", "Navy"]},
    "Sneakers": {"colors": ["White", "Black", "Beige", "Brown", "Grey", "Blue", "Navy"]}
}

products_found = []
added_urls = set()

def add_product(name, brand, price, image_url, store_url, color):
    if store_url in added_urls: return False
    products_found.append({
        "Product Name": name,
        "Brand": brand,
        "Price": str(price),
        "Image URL": image_url,
        "Store URL": store_url,
        "Affiliate Link": "",
        "Color": color
    })
    added_urls.add(store_url)
    return True

sources = [
    ("Snitch", "https://www.snitch.co.in/products.json?limit=250"),
    ("US Polo Assn", "https://uspoloassn.in/products.json?limit=250")
]

for brand, url in sources:
    print(f"Fetching {brand} products...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read())['products']
        
        for category, reqs in requirements.items():
            for color in reqs['colors']:
                for p in data:
                    title = p['title']
                    tags = p['tags']
                    
                    cat_match = False
                    if "Oversized" in category and ("Oversized" in title or "Oversized" in tags): cat_match = True
                    elif "Polo" in category and ("Polo" in title or "Polo" in tags or "Polo" in p.get('product_type','')): cat_match = True
                    elif "Casual Shirts" in category and ("Shirt" in title and "Polo" not in title and "Oversized" not in title): cat_match = True
                    elif "Jeans" in category and ("Jeans" in title or "Denim" in title): cat_match = True
                    elif "Chinos" in category and ("Chino" in title or "Trousers" in title): cat_match = True
                    elif "Sneakers" in category and ("Sneaker" in title or "Shoe" in title): cat_match = True
                    
                    color_match = False
                    if color.lower() in title.lower(): color_match = True
                    else:
                        for t in tags:
                            if color.lower() == t.lower() or color.split()[0].lower() in t.lower():
                                color_match = True
                                break
                                
                    if cat_match and color_match:
                        price = p['variants'][0]['price']
                        image = p['images'][0]['src'].split('?')[0] if p['images'] else ""
                        handle_base = url.split('/products.json')[0]
                        p_url = f"{handle_base}/products/{p['handle']}"
                        if add_product(title, brand, price, image, p_url, color):
                            if category != "Sneakers":
                                break # Found one for this color/category combo for non-sneakers
    except Exception as e:
        print(f"Error fetching {brand}: {e}")

print(f"Total products found: {len(products_found)}")
with open('products.tsv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f, delimiter='\t')
    for p in products_found:
        writer.writerow([p['Product Name'], p['Brand'], p['Price'], p['Image URL'], p['Store URL'], p['Affiliate Link'], p['Color']])
