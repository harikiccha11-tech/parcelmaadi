#!/usr/bin/env bash
# Sequential image fetcher with mandatory spacing + 429 backoff. Resumable.
# Designed to stay under the gateway rate limit.
set -u
mkdir -p /tmp/img-results

# Build pending list
declare -A QUERIES=(
  ["services_parcel-delivery"]="courier parcel delivery bike India"
  ["services_goods-transport"]="mini truck goods transport India"
  ["services_material-supply"]="construction sand cement steel material"
  ["services_machinery-rental"]="JCB excavator construction machinery"
  ["services_water-supply"]="water tanker truck India"
  ["services_supplier-shop"]="grocery shop warehouse India"
  ["services_outstation-booking"]="highway truck goods India"
  ["services_emergency-booking"]="urgent fast delivery logistics"
  ["vehicles_2-wheeler"]="motorcycle delivery bike India"
  ["vehicles_scooter"]="scooty two wheeler India"
  ["vehicles_e-loader"]="electric loader cargo vehicle India"
  ["vehicles_3-wheeler"]="three wheeler cargo auto India"
  ["vehicles_tata-ace"]="Tata Ace mini truck India"
  ["vehicles_pickup-8ft"]="pickup truck 8ft India"
  ["vehicles_pickup-9ft"]="pickup truck 9ft India"
  ["vehicles_407"]="Tata 407 truck India"
  ["vehicles_14ft"]="14 feet truck India"
  ["vehicles_17ft"]="17 feet truck India"
  ["vehicles_19ft"]="19 feet truck India"
  ["vehicles_20ft"]="20 feet truck India"
  ["vehicles_32ft"]="32 feet truck India"
  ["materials_sand"]="river sand construction"
  ["materials_m-sand"]="manufactured sand M-sand construction"
  ["materials_cement"]="cement bags construction"
  ["materials_steel"]="steel bars TMT construction"
  ["materials_bricks"]="red bricks construction"
  ["materials_blocks"]="concrete blocks construction"
  ["materials_jelly"]="jelly aggregate stone construction"
  ["materials_stone"]="construction stone aggregate"
  ["materials_soil"]="soil construction material"
  ["materials_other-materials"]="construction materials mix"
  ["machinery_jcb"]="JCB excavator machine"
  ["machinery_excavator"]="Hitachi excavator construction"
  ["machinery_tractor"]="farm tractor India"
  ["machinery_hydra"]="crane hydra truck India"
  ["machinery_forklift"]="forklift warehouse"
  ["machinery_concrete-mixer"]="concrete mixer machine"
  ["machinery_crane"]="mobile crane construction"
  ["machinery_other-machinery"]="construction machinery"
  ["water_2kl"]="small water tanker truck"
  ["water_4kl"]="water tanker truck India"
  ["water_6kl"]="water tanker truck India"
  ["water_12kl"]="large water tanker truck India"
  ["water_drinking-water"]="drinking water bottle can"
  ["water_borewell-water"]="borewell water pump"
  ["water_construction-water"]="construction water tanker"
)

KEYS=(
  services_parcel-delivery services_goods-transport services_material-supply services_machinery-rental
  services_water-supply services_supplier-shop services_outstation-booking services_emergency-booking
  vehicles_2-wheeler vehicles_scooter vehicles_e-loader vehicles_3-wheeler vehicles_tata-ace
  vehicles_pickup-8ft vehicles_pickup-9ft vehicles_407 vehicles_14ft vehicles_17ft vehicles_19ft vehicles_20ft vehicles_32ft
  materials_sand materials_m-sand materials_cement materials_steel materials_bricks materials_blocks
  materials_jelly materials_stone materials_soil materials_other-materials
  machinery_jcb machinery_excavator machinery_tractor machinery_hydra machinery_forklift machinery_concrete-mixer machinery_crane machinery_other-machinery
  water_2kl water_4kl water_6kl water_12kl water_drinking-water water_borewell-water water_construction-water
)

for key in "${KEYS[@]}"; do
  out="/tmp/img-results/${key}.url"
  if [ -s "$out" ]; then continue; fi
  query="${QUERIES[$key]}"
  attempt=0
  while [ $attempt -lt 8 ]; do
    attempt=$((attempt+1))
    raw=$(z-ai image-search -q "$query" --count 2 --gl us --no-rank 2>&1)
    if echo "$raw" | grep -q "429"; then
      echo "[$(date +%H:%M:%S)] 429 on $key attempt $attempt — sleep $((attempt*15))s"
      sleep $((attempt*15))
      continue
    fi
    if echo "$raw" | grep -qiE "502|503|Failed to make image search"; then
      echo "[$(date +%H:%M:%S)] upstream err on $key attempt $attempt — sleep $((attempt*5))s"
      sleep $((attempt*5))
      continue
    fi
    url=$(echo "$raw" | python3 -c '
import sys, json
data = sys.stdin.read()
idx = data.find("{")
if idx < 0: print("")
else:
    try:
        j = json.loads(data[idx:])
        print(j["results"][0]["original_url"] if j.get("success") and j.get("results") else "")
    except Exception: print("")
')
    if [ -n "$url" ]; then
      echo -n "$url" > "$out"
      echo "[$(date +%H:%M:%S)] OK: $key"
      break
    fi
    echo "[$(date +%H:%M:%S)] empty $key attempt $attempt — sleep ${attempt}s"
    sleep $attempt
  done
  # Mandatory spacing between successful calls to avoid 429
  sleep 12
done

echo "=== DONE: $(ls /tmp/img-results/*.url 2>/dev/null | wc -l) / 46 ==="
