#!/usr/bin/env python3
"""Fetch real HD images for all UI upgrades - shop storefronts, LPG, parcel, water, categories."""
import subprocess
import json
import time
from pathlib import Path

OUT_DIR = Path("/home/z/my-project/scripts/images/ui-upgrade")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# All images needed for the UI upgrade
IMAGES = [
    # Shop storefronts by type
    ("store_electrical", "electrical shop storefront india bright"),
    ("store_hardware", "hardware tools shop storefront india"),
    ("store_fashion", "fashion clothing boutique storefront"),
    ("store_mobile", "mobile phone shop storefront modern"),
    ("store_books", "bookstore book shop interior india"),
    ("store_fancy", "gift fancy decorative shop interior"),
    ("store_household", "household kitchenware shop interior"),
    ("store_gifts", "gift shop colorful interior"),
    ("store_grocery", "grocery kirana store storefront india"),
    ("store_material", "construction material cement shop"),
    ("store_restaurant", "restaurant south indian food counter"),
    ("store_pharmacy", "pharmacy medical store interior"),
    ("store_bakery", "bakery cake shop interior"),
    ("store_meat", "meat chicken shop butcher india"),
    ("store_flowers", "flower shop bouquet arrangement"),
    ("store_pet", "pet shop dogs cats interior"),
    ("store_electronics", "electronics appliance shop tv"),
    ("store_stationery", "stationery office supplies shop"),
    ("store_fruits", "fruits vegetable shop fresh"),
    ("store_vegetables", "vegetable market fresh produce india"),

    # LPG Gas
    ("lpg_cylinder_red", "lpg gas cylinder red industrial"),
    ("lpg_cylinder_blue", "blue industrial gas cylinder"),
    ("lpg_cylinder_orange", "orange gas cylinder domestic"),
    ("lpg_truck_delivery", "lpg gas delivery truck"),
    ("lpg_delivery_executive", "delivery man uniform safety helmet"),
    ("lpg_safety_gear", "safety gloves helmet industrial worker"),
    ("lpg_kitchen_stove", "lpg gas stove kitchen cooking"),

    # Parcel delivery
    ("parcel_rider_scooter", "delivery rider scooter parcel box city"),
    ("parcel_rider_handing", "delivery man handing package customer door"),
    ("parcel_tracking_phone", "mobile phone tracking delivery map app"),
    ("parcel_logistics_hub", "logistics warehouse sorting parcels"),
    ("parcel_bike_rider", "bike delivery rider city traffic"),
    ("parcel_scooter_box", "scooter delivery box parcel side"),

    # Two wheeler
    ("scooter_modern_premium", "modern scooter premium white background"),
    ("scooter_delivery_urban", "scooter delivery urban city street"),
    ("bike_delivery_premium", "motorbike delivery rider premium uniform"),
    ("two_wheeler_hero", "scooter bike side view premium showroom"),

    # Water tanker
    ("water_tanker_truck", "water tanker truck blue large"),
    ("water_tanker_arriving", "water tanker truck arriving street"),
    ("water_tank_filling", "water tank filling industrial pipe"),
    ("water_can_delivery", "20 liter water can delivery man"),
    ("water_bottle_pack", "water bottle pack mineral delivery"),
    ("water_drinking_glass", "drinking water glass clean fresh"),
    ("water_hero_video", "water flowing pouring splash hd"),

    # Shop category tiles - need clean category images
    ("cat_grocery", "grocery staples rice atta dal bags"),
    ("cat_fruits", "fresh fruits apples bananas oranges"),
    ("cat_vegetables", "fresh vegetables tomatoes carrots"),
    ("cat_meat", "raw meat chicken fish butcher"),
    ("cat_bakery", "bakery bread cakes pastries"),
    ("cat_pharmacy", "pharmacy medicines tablets capsules"),
    ("cat_hardware", "hardware tools hammer drill",
),
    ("cat_electrical", "electrical bulb switch wire"),
    ("cat_stationery", "stationery notebook pen pencil"),
    ("cat_electronics", "electronics smartphone laptop gadgets"),
    ("cat_flowers", "flowers bouquet roses marigold"),
    ("cat_pet_shop", "pet shop dog cat food"),
    ("cat_restaurants", "restaurant food plate biryani"),

    # Service hero images
    ("svc_parcel_delivery", "parcel delivery service hero banner"),
    ("svc_goods_transport", "goods transport truck logistics highway"),
    ("svc_material_supply", "construction material sand cement"),
    ("svc_machinery_rental", "jcb excavator construction machinery"),
    ("svc_water_supply", "water tanker supply delivery"),
    ("svc_borewell_drilling", "borewell drilling rig machine"),
    ("svc_supplier_shop", "shop market supplies variety"),
    ("svc_outstation", "highway truck long distance travel"),
    ("svc_emergency", "emergency delivery fast urgent"),
    ("svc_grocery_ration", "grocery ration store delivery bag"),
    ("svc_lpg_gas", "lpg gas cylinder delivery service"),
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

# Filter to missing
missing = [(k, q) for k, q in IMAGES if not is_fetched(k)]
print(f"Total: {len(IMAGES)}, already fetched: {len(IMAGES) - len(missing)}, missing: {len(missing)}")

got = 0
failed = []
for i, (key, query) in enumerate(missing, 1):
    url = fetch_one(key, query)
    if url:
        got += 1
        print(f"  [{i}/{len(missing)}] ✅ {key}")
        time.sleep(1.2)
    else:
        failed.append(key)
        print(f"  [{i}/{len(missing)}] ❌ {key}")
        time.sleep(2)

print(f"\n✅ Fetched: {got}/{len(missing)}")
if failed:
    print(f"❌ Failed: {failed}")

# Build URL map
url_map = {}
for key, _ in IMAGES:
    f = OUT_DIR / f"{key}.json"
    if f.exists():
        try:
            d = json.loads(f.read_text())
            if d.get("results"):
                url_map[key] = d["results"][0]["original_url"]
        except:
            pass
(OUT_DIR / "url_map.json").write_text(json.dumps(url_map, indent=2))
print(f"\nFinal URL map: {len(url_map)}/{len(IMAGES)} fetched")
