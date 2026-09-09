/**
 * A picture for every crop in the picker.
 *
 * These are emoji, not photographs, and that is a deliberate trade rather than
 * a shortcut. The picker lists 122 crops; bundling 122 photographs would add
 * megabytes to a PWA that has to install over village 4G and work offline
 * afterwards, and loading them from a CDN would leave the list blank in exactly
 * the conditions this app is built for. At the size they render — a 40px chip
 * beside the name — a clean symbol is also easier to recognise at a glance than
 * a shrunken photo.
 *
 * Where a crop has no emoji of its own it takes its family's, so scanning still
 * works: 🌾 grains and millets, 🫘 pulses, 🌻 oilseeds, 🌿 spices and herbs,
 * 🥬 leafy vegetables, 🍈 fruits without a symbol of their own.
 *
 * To use real photographs instead, set `image` on a crop in registry.ts to a
 * path under /public — CropIcon prefers it and falls back to the emoji here, so
 * photos can be added a few at a time rather than all at once.
 */
export const CROP_ICONS: Record<string, string> = {
  // Plantation
  arecanut: "🌴", coconut: "🥥", copra: "🥥", oil_palm: "🌴", rubber: "🌳",
  cocoa: "🍫", coffee: "☕", tea: "🍵", cashew: "🥜",

  // Spices
  black_pepper: "🌿", cardamom: "🫛", turmeric: "🫚", ginger: "🫚",
  dry_chilli: "🌶️", green_chilli: "🌶️", garlic: "🧄", nutmeg: "🌰",
  clove: "🌿", cinnamon: "🌿", ajwain: "🌿", cumin: "🌿", fennel: "🌿",
  fenugreek: "🌿", coriander_seed: "🌿", coriander_leaves: "🌿",
  methi_leaves: "🌿", lemongrass: "🌿", mint: "🌿", tamarind: "🫘",

  // Grains and millets
  paddy: "🌾", wheat: "🌾", maize: "🌽", jowar: "🌾", bajra: "🌾",
  ragi: "🌾", barley: "🌾", oats: "🌾", foxtail_millet: "🌾",
  kodo_millet: "🌾", little_millet: "🌾",

  // Pulses
  tur: "🫘", urad: "🫘", lentil: "🫘", bengal_gram: "🫘", green_gram: "🫘",
  horse_gram: "🫘", cowpea: "🫘", moth_bean: "🫘", rajma: "🫘",
  soyabean: "🫘", beans: "🫘", cluster_beans: "🫘",
  field_pea: "🫛", green_peas: "🫛",

  // Oilseeds and fibres
  groundnut: "🥜", sunflower: "🌻", mustard: "🌻", sesamum: "🌻",
  castor: "🌻", safflower: "🌻", niger: "🌻", linseed: "🌻",
  cotton: "☁️", jute: "🌿", sugarcane: "🎋", tobacco: "🍃",

  // Fruit
  banana: "🍌", mango: "🥭", grapes: "🍇", watermelon: "🍉",
  pineapple: "🍍", orange: "🍊", sweet_lime: "🍊", lemon: "🍋",
  apple: "🍎", pear: "🍐", peach: "🍑", plum: "🍑", strawberry: "🍓",
  mulberry: "🫐", papaya: "🍈", sapota: "🍈", pomegranate: "🍈",
  guava: "🍈", jackfruit: "🍈", muskmelon: "🍈", litchi: "🍈",
  ber: "🍈", custard_apple: "🍈", fig: "🍈", amla: "🍈",

  // Vegetables
  tomato: "🍅", onion: "🧅", potato: "🥔", brinjal: "🍆", carrot: "🥕",
  cucumber: "🥒", capsicum: "🫑", pumpkin: "🎃", sweet_potato: "🍠",
  cabbage: "🥬", cauliflower: "🥦", broccoli: "🥦", lettuce: "🥬",
  spinach: "🥬", amaranthus: "🥬", radish: "🥬", beetroot: "🥬",
  turnip: "🥬", knol_khol: "🥬", bhindi: "🥬",
  bitter_gourd: "🥒", bottle_gourd: "🥒", ridge_gourd: "🥒",
  snake_gourd: "🥒", ash_gourd: "🥒",
  colocasia: "🥔", elephant_yam: "🥔", tapioca: "🥔",
  drumstick: "🌿", betel_leaves: "🍃", aloe_vera: "🌵",
};

/** Never blank: an unmapped crop still gets something plant-shaped. */
export function cropIcon(cropId: string): string {
  return CROP_ICONS[cropId] ?? "🌱";
}
