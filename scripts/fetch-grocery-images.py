#!/usr/bin/env python3
"""Fetch real images for grocery products via z-ai image-search."""
import subprocess
import json
import time
from pathlib import Path

OUT_DIR = Path("/home/z/my-project/scripts/images/grocery")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Grocery products with search queries — generic product photos
PRODUCTS = [
    # Staples
    ("grocery_rice_basmati", "basmati rice 5kg bag pack"),
    ("grocery_rice_sona", "sona masoori rice bag"),
    ("grocery_atta_aashirvaad", "whole wheat atta flour 10kg bag"),
    ("grocery_atta_pillsbury", "pillsbury atta 5kg bag"),
    ("grocery_maida", "maida refined flour 1kg pack"),
    ("grocery_besan", "besan gram flour 1kg pack"),
    ("grocery_rava", "rava sooji semolina 1kg"),
    ("grocery_poha", "poha flattened rice 500g pack"),
    # Pulses & Lentils
    ("grocery_toor_dal", "toor dal arhar 1kg pack"),
    ("grocery_moong_dal", "moong dal yellow 500g pack"),
    ("grocery_chana_dal", "chana dal bengal gram 1kg"),
    ("grocery_urad_dal", "urad dal black 1kg pack"),
    ("grocery_rajma", "rajma red kidney beans 500g"),
    ("grocery_chickpeas", "kabuli chana white chickpeas 500g"),
    # Oils & Ghee
    ("grocery_sunflower_oil", "sunflower oil 1l bottle fortune"),
    ("grocery_groundnut_oil", "groundnut oil 1l bottle"),
    ("grocery_mustard_oil", "mustard oil 1l bottle"),
    ("grocery_ghee", "amul ghee 1l tin"),
    ("grocery_coconut_oil", "coconut oil 500ml bottle"),
    # Sugar & Salt
    ("grocery_sugar", "sugar 1kg pack madhur"),
    ("grocery_jaggery", "jaggery gur block 1kg"),
    ("grocery_salt_tata", "tata salt 1kg pack"),
    ("grocery_rock_salt", "sendha namak rock salt 500g"),
    # Tea & Coffee
    ("grocery_tea_tata", "tata tea premium 500g pack"),
    ("grocery_tea_red_label", "brooke bond red label tea 500g"),
    ("grocery_coffee_bru", "bru instant coffee 100g jar"),
    ("grocery_coffee_nescafe", "nescafe instant coffee 100g"),
    # Dairy
    ("grocery_milk_powder", "amul milk powder 500g tin"),
    ("grocery_milk_pouch", "amul toned milk 500ml pouch"),
    ("grocery_curD", "amul dahi curd 200g cup"),
    ("grocery_paneer", "amul paneer 200g pack"),
    ("grocery_butter", "amul butter 100g pack"),
    ("grocery_cheese", "amul cheese slices 200g"),
    # Spices
    ("grocery_turmeric", "turmeric powder haldi 200g"),
    ("grocery_chilli_powder", "red chilli powder 200g"),
    ("grocery_coriander_powder", "coriander powder dhania 200g"),
    ("grocery_garam_masala", "garam masala 100g pack"),
    ("grocery_cumin_seeds", "jeera cumin seeds 100g"),
    ("grocery_mustard_seeds", "rai mustard seeds 100g"),
    # Snacks & Biscuits
    ("grocery_biscuit_parity", "parle g glucose biscuits pack"),
    ("grocery_biscuit_marie", "marie gold biscuits pack"),
    ("grocery_rusk", "rusk toast bread 200g"),
    ("grocery_noodles", "maggi noodles 4 pack"),
    ("grocery_pasta", "pasta macaroni 500g"),
    # Cleaning
    ("grocery_soap_surf", "surf excel detergent 1kg"),
    ("grocery_soap_wheel", "wheel detergent soap bar"),
    ("grocery_shampoo", "shampoo sachet clinic plus"),
    ("grocery_toothpaste", "colgate toothpaste 200g"),
    ("grocery_hair_oil", "parachute coconut hair oil 200ml"),
    # Beverages
    ("grocery_soft_drink", "coca cola 750ml bottle"),
    ("grocery_juice", "real mixed fruit juice 1l"),
    ("grocery_water_bottle", "bisleri mineral water 1l"),
]

def is_fetched(key):
    f = OUT_DIR / f"{key}.json"
    if not f.exists() or f.stat().st_size < 50:
        return False
    try:
        d = json.loads(f.read_text())
        return bool(d.get("results"))
    except:
        return False

def fetch_one(key, query):
    out_file = OUT_DIR / f"{key}.json"
    for attempt in range(3):
        try:
            result = subprocess.run(
                ["z-ai", "image-search", "-q", query, "--count", "1", "--no-rank"],
                capture_output=True, text=True, timeout=90
            )
            output = result.stdout
            start = output.find("{")
            end = output.rfind("}") + 1
            if start < 0 or end <= 0:
                time.sleep(3)
                continue
            json_str = output[start:end]
            d = json.loads(json_str)
            if d.get("results") and len(d["results"]) > 0:
                out_file.write_text(json_str)
                return d["results"][0]["original_url"]
            time.sleep(2)
        except:
            time.sleep(3)
    return None

# Filter to missing only
missing = [(k, q) for k, q in PRODUCTS if not is_fetched(k)]
print(f"Total: {len(PRODUCTS)}, already fetched: {len(PRODUCTS) - len(missing)}, missing: {len(missing)}")

got = 0
failed = []
for i, (key, query) in enumerate(missing, 1):
    url = fetch_one(key, query)
    if url:
        got += 1
        print(f"  [{i}/{len(missing)}] ✅ {key}")
        time.sleep(1.5)
    else:
        failed.append(key)
        print(f"  [{i}/{len(missing)}] ❌ {key}")
        time.sleep(2)

print(f"\n✅ Fetched: {got}/{len(missing)}")
if failed:
    print(f"❌ Failed: {failed}")

# Build URL map
url_map = {}
for key, _ in PRODUCTS:
    f = OUT_DIR / f"{key}.json"
    if f.exists():
        try:
            d = json.loads(f.read_text())
            if d.get("results"):
                url_map[key] = d["results"][0]["original_url"]
        except:
            pass
(OUT_DIR / "url_map.json").write_text(json.dumps(url_map, indent=2))
print(f"\nFinal URL map: {len(url_map)}/{len(PRODUCTS)} fetched")
