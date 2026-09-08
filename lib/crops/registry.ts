import type { CropConfig, DiseaseRule } from "./types";

/**
 * The crop registry.
 *
 * Yield figures and irrigation intervals below are working estimates drawn from
 * published extension practice, not measured local data. They are good enough
 * to rank decisions and wrong enough that every one of them should be
 * calibrated against a real grower's book before anyone relies on the rupee
 * numbers. Same caveat as the agronomy: get an extension officer to read this
 * file.
 */

const MONSOON = [6, 7, 8, 9, 10];

/** Phytophthora rots share a shape: warm, soaked, humid, and Bordeaux answers them. */
function phytophthora(over: Partial<DiseaseRule> & Pick<DiseaseRule, "id" | "name">): DiseaseRule {
  return {
    pathogen: "Phytophthora spp.",
    months: MONSOON,
    humidityPct: 90,
    tempMinC: 20,
    tempMaxC: 30,
    wetDays: 3,
    treatment: {
      name: { en: "Bordeaux mixture 1%", kn: "ಬೋರ್ಡೊ ಮಿಶ್ರಣ ೧%" },
      dryHours: 6,
      protectionDays: 40,
    },
    lossShare: 0.3,
    ...over,
  };
}

export const CROPS: CropConfig[] = [
  {
    id: "arecanut",
    name: { en: "Arecanut", kn: "ಅಡಿಕೆ" },
    agmarknetCommodity: "Arecanut(Betelnut/Supari)",
    depth: "modelled",
    grades: [
      { id: "rashi", label: { en: "Rashi", kn: "ರಾಶಿ" }, aliases: ["rashi", "raashi", "rashi idi"] },
      { id: "hosa_chali", label: { en: "Hosa Chali", kn: "ಹೊಸ ಚಾಲಿ" }, aliases: ["hosa chali", "hosachali", "new variety"] },
      { id: "hale_chali", label: { en: "Hale Chali", kn: "ಹಳೆ ಚಾಲಿ" }, aliases: ["hale chali", "halechali", "old variety"] },
      { id: "chippu", label: { en: "Chippu", kn: "ಚಿಪ್ಪು" }, aliases: ["chippu"] },
      { id: "bilegotu", label: { en: "Bilegotu", kn: "ಬಿಳೆಗೋಟು" }, aliases: ["bilegotu", "bile gotu"] },
      { id: "cqca", label: { en: "CQCA", kn: "ಸಿಕ್ಯುಸಿಎ" }, aliases: ["cqca", "c q c a"] },
    ],
    irrigation: { intervalDays: { drip: 3, sprinkler: 6, flood: 8, rainfed: Infinity }, rainSkipMm: 10 },
    yield: {
      kind: "perennial",
      curve: [
        { fromAge: 5, qtlPerAcre: 2.7 },
        { fromAge: 6, qtlPerAcre: 4.5 },
        { fromAge: 7, qtlPerAcre: 6.8 },
        { fromAge: 8, qtlPerAcre: 9 },
      ],
      declineFromAge: 40,
      declinePerYear: 0.3,
    },
    diseases: [
      phytophthora({
        id: "koleroga",
        name: { en: "Koleroga (fruit rot)", kn: "ಕೊಳೆರೋಗ" },
        pathogen: "Phytophthora meadii",
      }),
    ],
    notes: "Yellow Leaf Disease has no cure. Photograph yellowing fronds to build a per-block record.",
  },

  {
    id: "coconut",
    name: { en: "Coconut", kn: "ತೆಂಗು" },
    agmarknetCommodity: "Coconut",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 4, sprinkler: 7, flood: 10, rainfed: Infinity }, rainSkipMm: 12 },
    yield: {
      kind: "perennial",
      curve: [
        { fromAge: 6, qtlPerAcre: 3 },
        { fromAge: 8, qtlPerAcre: 6 },
        { fromAge: 10, qtlPerAcre: 8 },
      ],
      declineFromAge: 50,
      declinePerYear: 0.2,
    },
    diseases: [
      phytophthora({
        id: "bud_rot",
        name: { en: "Bud rot", kn: "ಸುಳಿ ಕೊಳೆ" },
        pathogen: "Phytophthora palmivora",
        treatment: {
          name: { en: "Bordeaux mixture 1% to the crown", kn: "ಸುಳಿಗೆ ಬೋರ್ಡೊ ಮಿಶ್ರಣ ೧%" },
          dryHours: 6,
          protectionDays: 45,
        },
        lossShare: 0.25,
      }),
    ],
  },

  {
    id: "black_pepper",
    name: { en: "Black pepper", kn: "ಕರಿಮೆಣಸು" },
    agmarknetCommodity: "Black pepper",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 4, sprinkler: 7, flood: 10, rainfed: Infinity }, rainSkipMm: 10 },
    yield: {
      kind: "perennial",
      curve: [
        { fromAge: 3, qtlPerAcre: 0.8 },
        { fromAge: 5, qtlPerAcre: 2 },
        { fromAge: 7, qtlPerAcre: 2.8 },
      ],
      declineFromAge: 25,
      declinePerYear: 0.1,
    },
    diseases: [
      phytophthora({
        id: "quick_wilt",
        name: { en: "Quick wilt (foot rot)", kn: "ಸೊರಗು ರೋಗ" },
        pathogen: "Phytophthora capsici",
        wetDays: 2,
        lossShare: 0.4,
      }),
    ],
  },

  {
    id: "cocoa",
    name: { en: "Cocoa", kn: "ಕೋಕೋ" },
    agmarknetCommodity: "Cocoa",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 4, sprinkler: 7, flood: 9, rainfed: Infinity }, rainSkipMm: 10 },
    yield: {
      kind: "perennial",
      curve: [
        { fromAge: 3, qtlPerAcre: 1.2 },
        { fromAge: 5, qtlPerAcre: 3 },
        { fromAge: 7, qtlPerAcre: 4 },
      ],
    },
    diseases: [
      phytophthora({
        id: "black_pod",
        name: { en: "Black pod", kn: "ಕಪ್ಪು ಕಾಯಿ ಕೊಳೆ" },
        pathogen: "Phytophthora palmivora",
        treatment: {
          name: { en: "Bordeaux mixture 1%", kn: "ಬೋರ್ಡೊ ಮಿಶ್ರಣ ೧%" },
          dryHours: 5,
          protectionDays: 30,
        },
      }),
    ],
  },

  {
    id: "cardamom",
    name: { en: "Cardamom", kn: "ಏಲಕ್ಕಿ" },
    agmarknetCommodity: "Cardamoms",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 3, sprinkler: 6, flood: 9, rainfed: Infinity }, rainSkipMm: 12 },
    yield: {
      kind: "perennial",
      curve: [
        { fromAge: 2, qtlPerAcre: 0.2 },
        { fromAge: 3, qtlPerAcre: 0.5 },
        { fromAge: 5, qtlPerAcre: 0.7 },
      ],
    },
    diseases: [
      phytophthora({
        id: "capsule_rot",
        name: { en: "Capsule rot (azhukal)", kn: "ಕಾಯಿ ಕೊಳೆ" },
        lossShare: 0.35,
      }),
    ],
  },

  {
    id: "paddy",
    name: { en: "Paddy", kn: "ಭತ್ತ" },
    agmarknetCommodity: "Paddy(Dhan)(Common)",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 5, sprinkler: 5, flood: 4, rainfed: Infinity }, rainSkipMm: 15 },
    yield: { kind: "seasonal", qtlPerAcre: 20, cycleDays: 125 },
    diseases: [
      {
        id: "blast",
        name: { en: "Rice blast", kn: "ಬೆಂಕಿ ರೋಗ" },
        pathogen: "Pyricularia oryzae",
        months: [7, 8, 9, 10, 11],
        humidityPct: 90,
        tempMinC: 20,
        tempMaxC: 28,
        wetDays: 2,
        treatment: {
          name: { en: "Tricyclazole spray", kn: "ಟ್ರೈಸೈಕ್ಲಜೋಲ್ ಸಿಂಪರಣೆ" },
          dryHours: 4,
          protectionDays: 21,
        },
        lossShare: 0.3,
      },
    ],
  },

  {
    id: "tomato",
    name: { en: "Tomato", kn: "ಟೊಮೇಟೊ" },
    agmarknetCommodity: "Tomato",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 2, sprinkler: 4, flood: 6, rainfed: Infinity }, rainSkipMm: 8 },
    yield: { kind: "seasonal", qtlPerAcre: 90, cycleDays: 100 },
    diseases: [
      {
        id: "late_blight",
        name: { en: "Late blight", kn: "ಅಂಗಮಾರಿ ರೋಗ" },
        pathogen: "Phytophthora infestans",
        months: [6, 7, 8, 9, 10, 11, 12],
        humidityPct: 88,
        tempMinC: 12,
        tempMaxC: 25,
        wetDays: 2,
        treatment: {
          name: { en: "Mancozeb spray", kn: "ಮ್ಯಾಂಕೋಜೆಬ್ ಸಿಂಪರಣೆ" },
          dryHours: 4,
          protectionDays: 10,
        },
        lossShare: 0.5,
      },
    ],
  },

  {
    id: "banana",
    name: { en: "Banana", kn: "ಬಾಳೆ" },
    agmarknetCommodity: "Banana",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 2, sprinkler: 4, flood: 7, rainfed: Infinity }, rainSkipMm: 10 },
    yield: { kind: "seasonal", qtlPerAcre: 120, cycleDays: 330 },
    diseases: [
      {
        id: "sigatoka",
        name: { en: "Sigatoka leaf spot", kn: "ಎಲೆ ಚುಕ್ಕೆ ರೋಗ" },
        pathogen: "Mycosphaerella spp.",
        months: MONSOON,
        humidityPct: 88,
        tempMinC: 20,
        tempMaxC: 32,
        wetDays: 3,
        treatment: {
          name: { en: "Propiconazole spray", kn: "ಪ್ರೊಪಿಕೊನಜೋಲ್ ಸಿಂಪರಣೆ" },
          dryHours: 5,
          protectionDays: 30,
        },
        lossShare: 0.25,
      },
    ],
  },
];

/**
 * Any commodity Agmarknet publishes can be picked. These get market advice,
 * irrigation advice and a cost book — everything except disease rules.
 *
 * Commodity strings must match the feed exactly to use the fast filter; the
 * market route falls back to a loose match, so a near-miss degrades rather
 * than breaks. Verify against a live pull before trusting any one of them.
 */
export const OTHER_COMMODITIES: { id: string; en: string; kn: string; commodity: string }[] = [
  { id: "onion", en: "Onion", kn: "ಈರುಳ್ಳಿ", commodity: "Onion" },
  { id: "potato", en: "Potato", kn: "ಆಲೂಗಡ್ಡೆ", commodity: "Potato" },
  { id: "brinjal", en: "Brinjal", kn: "ಬದನೆಕಾಯಿ", commodity: "Brinjal" },
  { id: "cabbage", en: "Cabbage", kn: "ಎಲೆಕೋಸು", commodity: "Cabbage" },
  { id: "cauliflower", en: "Cauliflower", kn: "ಹೂಕೋಸು", commodity: "Cauliflower" },
  { id: "green_chilli", en: "Green chilli", kn: "ಹಸಿಮೆಣಸಿನಕಾಯಿ", commodity: "Green Chilli" },
  { id: "beans", en: "Beans", kn: "ಹುರುಳಿಕಾಯಿ", commodity: "Beans" },
  { id: "bhindi", en: "Okra", kn: "ಬೆಂಡೆಕಾಯಿ", commodity: "Bhindi(Ladies Finger)" },
  { id: "carrot", en: "Carrot", kn: "ಕ್ಯಾರೆಟ್", commodity: "Carrot" },
  { id: "cucumber", en: "Cucumber", kn: "ಸೌತೆಕಾಯಿ", commodity: "Cucumbar(Kheera)" },
  { id: "maize", en: "Maize", kn: "ಮೆಕ್ಕೆಜೋಳ", commodity: "Maize" },
  { id: "ragi", en: "Ragi", kn: "ರಾಗಿ", commodity: "Ragi (Finger Millet)" },
  { id: "wheat", en: "Wheat", kn: "ಗೋಧಿ", commodity: "Wheat" },
  { id: "jowar", en: "Jowar", kn: "ಜೋಳ", commodity: "Jowar(Sorghum)" },
  { id: "groundnut", en: "Groundnut", kn: "ಕಡಲೆಕಾಯಿ", commodity: "Groundnut" },
  { id: "sunflower", en: "Sunflower", kn: "ಸೂರ್ಯಕಾಂತಿ", commodity: "Sunflower" },
  { id: "cotton", en: "Cotton", kn: "ಹತ್ತಿ", commodity: "Cotton" },
  { id: "sugarcane", en: "Sugarcane", kn: "ಕಬ್ಬು", commodity: "Sugarcane" },
  { id: "turmeric", en: "Turmeric", kn: "ಅರಿಶಿನ", commodity: "Turmeric" },
  { id: "ginger", en: "Ginger", kn: "ಶುಂಠಿ", commodity: "Ginger(Green)" },
  { id: "cashew", en: "Cashew", kn: "ಗೋಡಂಬಿ", commodity: "Cashewnuts" },
  { id: "copra", en: "Copra", kn: "ಕೊಬ್ಬರಿ", commodity: "Copra" },
  { id: "mango", en: "Mango", kn: "ಮಾವು", commodity: "Mango" },
  { id: "grapes", en: "Grapes", kn: "ದ್ರಾಕ್ಷಿ", commodity: "Grapes" },
  { id: "pomegranate", en: "Pomegranate", kn: "ದಾಳಿಂಬೆ", commodity: "Pomegranate" },
  { id: "sapota", en: "Sapota", kn: "ಸಪೋಟ", commodity: "Sapota" },
  { id: "papaya", en: "Papaya", kn: "ಪಪ್ಪಾಯಿ", commodity: "Papaya" },
  { id: "watermelon", en: "Watermelon", kn: "ಕಲ್ಲಂಗಡಿ", commodity: "Water Melon" },
  { id: "tur", en: "Tur / red gram", kn: "ತೊಗರಿ", commodity: "Arhar (Tur/Red Gram)(Whole)" },
  { id: "bengal_gram", en: "Bengal gram", kn: "ಕಡಲೆ", commodity: "Bengal Gram(Gram)(Whole)" },
  { id: "green_gram", en: "Green gram", kn: "ಹೆಸರುಕಾಳು", commodity: "Green Gram (Moong)(Whole)" },
  { id: "soyabean", en: "Soyabean", kn: "ಸೋಯಾಬೀನ್", commodity: "Soyabean" },
  { id: "coffee", en: "Coffee", kn: "ಕಾಫಿ", commodity: "Coffee" },
];

/** Fallback for a crop the registry does not model. */
export function genericCrop(id: string, en: string, kn: string, commodity: string): CropConfig {
  return {
    id,
    name: { en, kn },
    agmarknetCommodity: commodity,
    depth: "basic",
    grades: [],
    irrigation: { intervalDays: { drip: 3, sprinkler: 6, flood: 8, rainfed: Infinity }, rainSkipMm: 10 },
    // Deliberately conservative: we do not know this crop's yield, so the
    // profit screen says so instead of inventing a number.
    yield: { kind: "seasonal", qtlPerAcre: 0, cycleDays: 120 },
    diseases: [],
  };
}
