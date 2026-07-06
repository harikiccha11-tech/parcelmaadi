#!/usr/bin/env python3
"""Fetch real product images via z-ai image-search CLI in parallel."""
import subprocess
import json
import os
import sys
import concurrent.futures
from pathlib import Path

OUT_DIR = Path("/home/z/my-project/scripts/images")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# (search_query, product_id) pairs — product_id used as filename
# Each product gets a unique relevant image
PRODUCTS = [
    # === Electrical Shop (Shop 5) ===
    ("white ceiling fan electric", "electrical_ceiling_fan"),
    ("LED bulb 9W pack", "electrical_led_bulb"),
    ("electrical switches modular white", "electrical_switch"),
    ("copper electrical wire roll", "electrical_wire"),
    ("electrical extension cord socket", "electrical_extension"),
    ("tubelight LED 4ft", "electrical_tubelight"),
    ("MCB circuit breaker box", "electrical_mcb"),
    ("table fan electric", "electrical_table_fan"),
    
    # === Hardware Shop (Shop 6) ===
    ("hammer claw tool", "hardware_hammer"),
    ("screwdriver set kit", "hardware_screwdriver"),
    ("paint can gallon white", "hardware_paint"),
    ("steel nails box", "hardware_nails"),
    ("drill machine power tool", "hardware_drill"),
    ("pvc pipes fittings", "hardware_pvc_pipe"),
    ("door lock handle brass", "hardware_lock"),
    ("measuring tape steel", "hardware_tape"),
    
    # === Fashion Shop (Shop 7) ===
    ("mens cotton shirt blue", "fashion_mens_shirt"),
    ("womens saree silk red", "fashion_saree"),
    ("leather shoes mens brown", "fashion_shoes"),
    ("denim jeans mens blue", "fashion_jeans"),
    ("leather handbag womens", "fashion_handbag"),
    ("analog wrist watch men", "fashion_watch"),
    ("sunglasses aviator", "fashion_sunglasses"),
    ("cotton tshirt mens round neck", "fashion_tshirt"),
    
    # === Mobile Shop (Shop 8) ===
    ("smartphone android black", "mobile_smartphone"),
    ("phone case cover silicone", "mobile_case"),
    ("usb c charger fast charging", "mobile_charger"),
    ("wireless earbuds bluetooth", "mobile_earbuds"),
    ("power bank 20000mah", "mobile_powerbank"),
    ("phone screen protector tempered glass", "mobile_screenguard"),
    ("usb cable type c braided", "mobile_cable"),
    ("mobile phone stand holder", "mobile_stand"),
    
    # === Book Stall (Shop 9) ===
    ("notebook ruled 200 pages", "book_notebook"),
    ("ball pen blue pack", "book_pen"),
    ("english textbook school", "book_textbook"),
    ("pencil set hb pack", "book_pencil"),
    ("school bag backpack", "book_bag"),
    ("color pencil set art", "book_color_pencil"),
    ("diary leather journal", "book_diary"),
    ("eraser sharpener geometry box", "book_eraser"),
    
    # === Fancy Store (Shop 10) ===
    ("decorative vase glass", "fancy_vase"),
    ("wall clock analog", "fancy_wallclock"),
    ("photo frame wooden", "fancy_photoframe"),
    ("scented candle jar", "fancy_candle"),
    ("artificial flowers bouquet", "fancy_flowers"),
    ("showpiece figurine decorative", "fancy_showpiece"),
    ("curtain sofa cushion cover", "fancy_cushion"),
    ("led string fairy lights", "fancy_fairy_lights"),
    
    # === Household Shop (Shop 11) ===
    ("non stick frying pan", "household_pan"),
    ("rice cooker electric 1l", "household_rice_cooker"),
    ("pressure cooker aluminum", "household_pressure_cooker"),
    ("plastic storage container set", "household_container"),
    ("stainless steel lunch box", "household_lunchbox"),
    ("floor cleaning mop", "household_mop"),
    ("dish wash soap bar", "household_soap"),
    ("broom stick cleaning", "household_broom"),
    
    # === Gifts Shop (Shop 12) ===
    ("gift card happy birthday", "gifts_card"),
    ("teddy bear plush brown", "gifts_teddy"),
    ("chocolate box assorted", "gifts_chocolate"),
    ("gift basket hamper", "gifts_basket"),
    ("flower bouquet roses red", "gifts_bouquet"),
    ("greeting card pack", "gifts_greeting"),
    ("key chain metal fancy", "gifts_keychain"),
    ("gift wrapping paper roll", "gifts_wrapping"),
]

def search_one(item):
    query, key = item
    out_file = OUT_DIR / f"{key}.json"
    if out_file.exists() and out_file.stat().st_size > 50:
        # Already fetched
        try:
            d = json.loads(out_file.read_text())
            if d.get("results"):
                url = d["results"][0]["original_url"]
                return (key, url, "cached")
        except:
            pass
    
    # Try up to 3 times with exponential backoff
    import time
    for attempt in range(3):
        try:
            result = subprocess.run(
                ["z-ai", "image-search", "-q", query, "--count", "1", "--no-rank"],
                capture_output=True, text=True, timeout=120
            )
            output = result.stdout
            # Find first { and last }
            start = output.find("{")
            end = output.rfind("}") + 1
            if start < 0 or end <= 0:
                if attempt < 2:
                    time.sleep(3 + attempt * 3)
                    continue
                return (key, None, f"no JSON (attempts={attempt+1})")
            json_str = output[start:end]
            d = json.loads(json_str)
            if d.get("results") and len(d["results"]) > 0:
                out_file.write_text(json_str)
                url = d["results"][0]["original_url"]
                return (key, url, "fetched")
            if attempt < 2:
                time.sleep(3)
                continue
            return (key, None, d.get("error", "no results"))
        except subprocess.TimeoutExpired:
            if attempt < 2:
                time.sleep(5)
                continue
            return (key, None, "timeout")
        except Exception as e:
            if attempt < 2:
                time.sleep(3)
                continue
            return (key, None, str(e)[:80])
    return (key, None, "all attempts failed")

print(f"Fetching images for {len(PRODUCTS)} products sequentially (avoid rate limit)...")
all_results = {}
import time
done_count = 0
for p in PRODUCTS:
    key, url, status = search_one(p)
    done_count += 1
    all_results[key] = url
    marker = "✅" if url else "❌"
    print(f"  [{done_count}/{len(PRODUCTS)}] {marker} {key}: {status if not url else url[:70]}")
    if url:
        time.sleep(1.5)  # Be polite
    else:
        time.sleep(3)  # Backoff on failure

# Save final URL mapping
url_map_file = OUT_DIR / "url_map.json"
url_map_file.write_text(json.dumps(all_results, indent=2))
print(f"\n✅ Saved URL map to {url_map_file}")
print(f"   Total fetched: {sum(1 for v in all_results.values() if v)}/{len(all_results)}")
