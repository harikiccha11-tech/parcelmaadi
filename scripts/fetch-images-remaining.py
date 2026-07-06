#!/usr/bin/env python3
"""Continue fetching missing images."""
import subprocess
import json
import time
from pathlib import Path

OUT_DIR = Path("/home/z/my-project/scripts/images")

# Re-declare product list
PRODUCTS = [
    ("electrical_ceiling_fan", "white ceiling fan electric"),
    ("electrical_led_bulb", "LED bulb 9W pack"),
    ("electrical_switch", "electrical switches modular white"),
    ("electrical_wire", "copper electrical wire roll"),
    ("electrical_extension", "electrical extension cord socket"),
    ("electrical_tubelight", "tubelight LED 4ft"),
    ("electrical_mcb", "MCB circuit breaker box"),
    ("electrical_table_fan", "table fan electric"),
    ("hardware_hammer", "hammer claw tool"),
    ("hardware_screwdriver", "screwdriver set kit"),
    ("hardware_paint", "paint can gallon white"),
    ("hardware_nails", "steel nails box"),
    ("hardware_drill", "drill machine power tool"),
    ("hardware_pvc_pipe", "pvc pipes fittings"),
    ("hardware_lock", "door lock handle brass"),
    ("hardware_tape", "measuring tape steel"),
    ("fashion_mens_shirt", "mens cotton shirt blue"),
    ("fashion_saree", "womens saree silk red"),
    ("fashion_shoes", "leather shoes mens brown"),
    ("fashion_jeans", "denim jeans mens blue"),
    ("fashion_handbag", "leather handbag womens"),
    ("fashion_watch", "analog wrist watch men"),
    ("fashion_sunglasses", "sunglasses aviator"),
    ("fashion_tshirt", "cotton tshirt mens round neck"),
    ("mobile_smartphone", "smartphone android black"),
    ("mobile_case", "phone case cover silicone"),
    ("mobile_charger", "usb c charger fast charging"),
    ("mobile_earbuds", "wireless earbuds bluetooth"),
    ("mobile_powerbank", "power bank 20000mah"),
    ("mobile_screenguard", "phone screen protector tempered glass"),
    ("mobile_cable", "usb cable type c braided"),
    ("mobile_stand", "mobile phone stand holder"),
    ("book_notebook", "notebook ruled 200 pages"),
    ("book_pen", "ball pen blue pack"),
    ("book_textbook", "english textbook school"),
    ("book_pencil", "pencil set hb pack"),
    ("book_bag", "school bag backpack"),
    ("book_color_pencil", "color pencil set art"),
    ("book_diary", "diary leather journal"),
    ("book_eraser", "eraser sharpener geometry box"),
    ("fancy_vase", "decorative vase glass"),
    ("fancy_wallclock", "wall clock analog"),
    ("fancy_photoframe", "photo frame wooden"),
    ("fancy_candle", "scented candle jar"),
    ("fancy_flowers", "artificial flowers bouquet"),
    ("fancy_showpiece", "showpiece figurine decorative"),
    ("fancy_cushion", "curtain sofa cushion cover"),
    ("fancy_fairy_lights", "led string fairy lights"),
    ("household_pan", "non stick frying pan"),
    ("household_rice_cooker", "rice cooker electric 1l"),
    ("household_pressure_cooker", "pressure cooker aluminum"),
    ("household_container", "plastic storage container set"),
    ("household_lunchbox", "stainless steel lunch box"),
    ("household_mop", "floor cleaning mop"),
    ("household_soap", "dish wash soap bar"),
    ("household_broom", "broom stick cleaning"),
    ("gifts_card", "gift card happy birthday"),
    ("gifts_teddy", "teddy bear plush brown"),
    ("gifts_chocolate", "chocolate box assorted"),
    ("gifts_basket", "gift basket hamper"),
    ("gifts_bouquet", "flower bouquet roses red"),
    ("gifts_greeting", "greeting card pack"),
    ("gifts_keychain", "key chain metal fancy"),
    ("gifts_wrapping", "gift wrapping paper roll"),
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

def search_one(key, query):
    out_file = OUT_DIR / f"{key}.json"
    for attempt in range(3):
        try:
            result = subprocess.run(
                ["z-ai", "image-search", "-q", query, "--count", "1", "--no-rank"],
                capture_output=True, text=True, timeout=120
            )
            output = result.stdout
            start = output.find("{")
            end = output.rfind("}") + 1
            if start < 0 or end <= 0:
                time.sleep(5)
                continue
            json_str = output[start:end]
            d = json.loads(json_str)
            if d.get("results") and len(d["results"]) > 0:
                out_file.write_text(json_str)
                return d["results"][0]["original_url"]
            time.sleep(3)
        except:
            time.sleep(5)
    return None

missing = [(k, q) for k, q in PRODUCTS if not is_fetched(k)]
print(f"Missing: {len(missing)}")

for i, (key, query) in enumerate(missing, 1):
    url = search_one(key, query)
    marker = "✅" if url else "❌"
    print(f"  [{i}/{len(missing)}] {marker} {key}: {url[:60] if url else 'failed'}")
    time.sleep(2)

# Rebuild url_map
url_map = {}
for key, _ in PRODUCTS:
    f = OUT_DIR / f"{key}.json"
    url = None
    if f.exists():
        try:
            d = json.loads(f.read_text())
            if d.get("results"):
                url = d["results"][0]["original_url"]
        except:
            pass
    url_map[key] = url

(OUT_DIR / "url_map.json").write_text(json.dumps(url_map, indent=2))
got = sum(1 for v in url_map.values() if v)
print(f"\nFinal: {got}/{len(url_map)} fetched")
