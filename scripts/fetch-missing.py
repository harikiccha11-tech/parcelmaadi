#!/usr/bin/env python3
"""Fetch ONLY the missing 36 images, one at a time."""
import subprocess
import json
import time
from pathlib import Path

OUT_DIR = Path("/home/z/my-project/scripts/images")

MISSING = [
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
]

def fetch_one(key, query):
    out_file = OUT_DIR / f"{key}.json"
    # 4 attempts
    for attempt in range(4):
        try:
            result = subprocess.run(
                ["z-ai", "image-search", "-q", query, "--count", "1", "--no-rank"],
                capture_output=True, text=True, timeout=90
            )
            output = result.stdout
            start = output.find("{")
            end = output.rfind("}") + 1
            if start < 0 or end <= 0:
                time.sleep(4 + attempt * 2)
                continue
            json_str = output[start:end]
            d = json.loads(json_str)
            if d.get("results") and len(d["results"]) > 0:
                out_file.write_text(json_str)
                return d["results"][0]["original_url"]
            time.sleep(3)
        except:
            time.sleep(4)
    return None

print(f"Fetching {len(MISSING)} missing images...")
got = 0
failed = []
for i, (key, query) in enumerate(MISSING, 1):
    url = fetch_one(key, query)
    if url:
        got += 1
        print(f"  [{i}/{len(MISSING)}] ✅ {key}")
        time.sleep(1.5)
    else:
        failed.append(key)
        print(f"  [{i}/{len(MISSING)}] ❌ {key}")
        time.sleep(3)

print(f"\n✅ Fetched: {got}/{len(MISSING)}")
if failed:
    print(f"❌ Failed: {failed}")
