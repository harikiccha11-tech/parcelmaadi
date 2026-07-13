// Serviceable pincodes for ParcelMaadi — only these 4 cities can book
// Bengaluru, Davangere, Hosadurga, Chitradurga

export const SERVICEABLE_PINCODES = new Set([
  // Bengaluru (51 pincodes)
  "560001","560002","560003","560008","560010","560011","560015","560017","560019",
  "560020","560021","560022","560023","560024","560026","560027","560028","560032",
  "560034","560037","560038","560040","560041","560047","560050","560055","560057",
  "560060","560061","560062","560063","560064","560066","560068","560070","560072",
  "560073","560075","560076","560077","560078","560079","560082","560085","560086",
  "560087","560091","560092","560095","560100","560103","560106",
  // Davangere (12 pincodes)
  "577001","577002","577003","577004","577005","577006","577007","577211","577217",
  "577223","577551","577552",
  // Chitradurga (9 pincodes)
  "577501","577502","577503","577522","577527","577528","577532","577535","577551",
  // Hosadurga (6 pincodes)
  "577515","577524","577527","577533","577542",
]);

export const SERVICEABLE_CITIES = [
  { name: "Bengaluru", pincodes: "560001-560106" },
  { name: "Davangere", pincodes: "577001-577552" },
  { name: "Chitradurga", pincodes: "577501-577551" },
  { name: "Hosadurga", pincodes: "577515-577542" },
];

export function isPincodeServiceable(pincode: string): boolean {
  if (!pincode || pincode.length !== 6) return false;
  return SERVICEABLE_PINCODES.has(pincode);
}

export function getCityForPincode(pincode: string): string | null {
  if (!pincode || pincode.length !== 6) return null;
  if (pincode.startsWith("560")) return "Bengaluru";
  if (pincode.startsWith("5770") || pincode.startsWith("5772") || pincode.startsWith("5775") && pincode <= "577552") {
    if (pincode.startsWith("5775") && pincode >= "577501" && pincode <= "577535") return "Chitradurga";
    if (pincode.startsWith("5775") && pincode >= "577515" && pincode <= "577542") return "Hosadurga";
    return "Davangere";
  }
  return null;
}
