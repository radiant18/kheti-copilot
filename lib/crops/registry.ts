import type { CropConfig, DiseaseRule, IrrigationMethod, PerennialYield, SeasonalYield } from "./types";

/**
 * The crop registry.
 *
 * READ THIS BEFORE TRUSTING A NUMBER HERE.
 *
 * Yield figures are conservative national ballparks, deliberately set nearer
 * the typical harvest than the headline one. Published "up to N quintals per
 * acre" figures are best-case demonstration plots; building them in would
 * inflate every farmer's revenue projection. Real yields swing by a factor of
 * three across variety, season, soil, spacing and management, so these are an
 * opening estimate the grower is expected to correct — see
 * Farm.expectedQtlPerAcre, which overrides all of this.
 *
 * Disease rules are only written where the pathogen genuinely follows the
 * "warm, wet, humid spell" shape this engine models. Powdery mildews (which
 * prefer dry weather) and insect pests (fall armyworm, fruit borer, tea
 * mosquito bug) do NOT fit it, and are deliberately absent rather than
 * shoehorned in. A crop can be economically important and still have no rule
 * here; that is honest, not incomplete.
 *
 * Everything below is pending review by an agronomist.
 */

const MONSOON = [6, 7, 8, 9, 10];
const RABI = [11, 12, 1, 2];

type Intervals = Record<IrrigationMethod, number>;

/** Water-hungry shallow-rooted vegetables. */
const VEG: Intervals = { drip: 2, sprinkler: 4, flood: 7, rainfed: Infinity };
/** Field crops and cereals. */
const FIELD: Intervals = { drip: 4, sprinkler: 7, flood: 10, rainfed: Infinity };
/** Deep-rooted orchard and plantation crops. */
const ORCHARD: Intervals = { drip: 4, sprinkler: 8, flood: 12, rainfed: Infinity };

function seasonal(qtlPerAcre: number, cycleDays: number): SeasonalYield {
  return { kind: "seasonal", qtlPerAcre, cycleDays };
}

function perennial(
  curve: { fromAge: number; qtlPerAcre: number }[],
  declineFromAge?: number,
  declinePerYear?: number,
): PerennialYield {
  return { kind: "perennial", curve, declineFromAge, declinePerYear };
}

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

/** A foliar fungus knocked back by a protectant spray on a short cycle. */
function foliar(
  id: string,
  en: string,
  kn: string,
  pathogen: string,
  band: { months: number[]; humidityPct: number; tempMinC: number; tempMaxC: number; wetDays: number },
  treatment: { en: string; kn: string; dryHours: number; protectionDays: number },
  lossShare: number,
): DiseaseRule {
  return {
    id,
    name: { en, kn },
    pathogen,
    ...band,
    treatment: {
      name: { en: treatment.en, kn: treatment.kn },
      dryHours: treatment.dryHours,
      protectionDays: treatment.protectionDays,
    },
    lossShare,
  };
}

const MANCOZEB = { en: "Mancozeb spray", kn: "ಮ್ಯಾಂಕೋಜೆಬ್ ಸಿಂಪರಣೆ" };
const COPPER = { en: "Copper oxychloride spray", kn: "ಕಾಪರ್ ಆಕ್ಸಿಕ್ಲೋರೈಡ್ ಸಿಂಪರಣೆ" };

export const CROPS: CropConfig[] = [
  // ---------------------------------------------------------------- plantation
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
    yield: perennial([
      { fromAge: 5, qtlPerAcre: 2.7 },
      { fromAge: 6, qtlPerAcre: 4.5 },
      { fromAge: 7, qtlPerAcre: 6.8 },
      { fromAge: 8, qtlPerAcre: 9 },
    ], 40, 0.3),
    diseases: [phytophthora({ id: "koleroga", name: { en: "Koleroga (fruit rot)", kn: "ಕೊಳೆರೋಗ" }, pathogen: "Phytophthora meadii" })],
    notes: "Yellow Leaf Disease has no cure. Photograph yellowing fronds to build a per-block record.",
    yieldNote: "Chali basis, well-managed garden. Coastal gardens on good soil exceed this; diseased blocks fall far below.",
  },
  {
    id: "coconut",
    name: { en: "Coconut", kn: "ತೆಂಗು" },
    agmarknetCommodity: "Coconut",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 4, sprinkler: 7, flood: 10, rainfed: Infinity }, rainSkipMm: 12 },
    yield: perennial([
      { fromAge: 6, qtlPerAcre: 3 },
      { fromAge: 8, qtlPerAcre: 6 },
      { fromAge: 10, qtlPerAcre: 8 },
    ], 50, 0.2),
    diseases: [phytophthora({
      id: "bud_rot",
      name: { en: "Bud rot", kn: "ಸುಳಿ ಕೊಳೆ" },
      pathogen: "Phytophthora palmivora",
      treatment: { name: { en: "Bordeaux mixture 1% to the crown", kn: "ಸುಳಿಗೆ ಬೋರ್ಡೊ ಮಿಶ್ರಣ ೧%" }, dryHours: 6, protectionDays: 45 },
      lossShare: 0.25,
    })],
    yieldNote: "Agmarknet quotes coconut by weight, so this is a rough conversion from nut counts.",
  },
  {
    id: "copra",
    name: { en: "Copra", kn: "ಕೊಬ್ಬರಿ" },
    agmarknetCommodity: "Copra",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: { drip: 4, sprinkler: 7, flood: 10, rainfed: Infinity }, rainSkipMm: 12 },
    yield: perennial([{ fromAge: 6, qtlPerAcre: 1.5 }, { fromAge: 8, qtlPerAcre: 3 }, { fromAge: 10, qtlPerAcre: 4 }], 50, 0.1),
    diseases: [],
    yieldNote: "Dried kernel, roughly half the fresh nut weight of the same garden.",
  },
  {
    id: "black_pepper",
    name: { en: "Black pepper", kn: "ಕರಿಮೆಣಸು" },
    agmarknetCommodity: "Black pepper",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 4, sprinkler: 7, flood: 10, rainfed: Infinity }, rainSkipMm: 10 },
    yield: perennial([{ fromAge: 3, qtlPerAcre: 0.8 }, { fromAge: 5, qtlPerAcre: 2 }, { fromAge: 7, qtlPerAcre: 2.8 }], 25, 0.1),
    diseases: [phytophthora({ id: "quick_wilt", name: { en: "Quick wilt (foot rot)", kn: "ಸೊರಗು ರೋಗ" }, pathogen: "Phytophthora capsici", wetDays: 2, lossShare: 0.4 })],
    yieldNote: "Dry pepper from vines on standards. Yield depends heavily on the standard tree and shade.",
  },
  {
    id: "cocoa",
    name: { en: "Cocoa", kn: "ಕೋಕೋ" },
    agmarknetCommodity: "Cocoa",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 4, sprinkler: 7, flood: 9, rainfed: Infinity }, rainSkipMm: 10 },
    yield: perennial([{ fromAge: 3, qtlPerAcre: 1.2 }, { fromAge: 5, qtlPerAcre: 3 }, { fromAge: 7, qtlPerAcre: 4 }]),
    diseases: [phytophthora({
      id: "black_pod",
      name: { en: "Black pod", kn: "ಕಪ್ಪು ಕಾಯಿ ಕೊಳೆ" },
      pathogen: "Phytophthora palmivora",
      treatment: { name: { en: "Bordeaux mixture 1%", kn: "ಬೋರ್ಡೊ ಮಿಶ್ರಣ ೧%" }, dryHours: 5, protectionDays: 30 },
    })],
    yieldNote: "Dry bean, usually intercropped under arecanut or coconut.",
  },
  {
    id: "cardamom",
    name: { en: "Cardamom", kn: "ಏಲಕ್ಕಿ" },
    agmarknetCommodity: "Cardamoms",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 3, sprinkler: 6, flood: 9, rainfed: Infinity }, rainSkipMm: 12 },
    yield: perennial([{ fromAge: 2, qtlPerAcre: 0.2 }, { fromAge: 3, qtlPerAcre: 0.5 }, { fromAge: 5, qtlPerAcre: 0.7 }]),
    diseases: [phytophthora({ id: "capsule_rot", name: { en: "Capsule rot (azhukal)", kn: "ಕಾಯಿ ಕೊಳೆ" }, lossShare: 0.35 })],
    yieldNote: "Cured capsules. A very wide range in practice — shade-grown estates differ sharply from open plots.",
  },
  {
    id: "coffee",
    name: { en: "Coffee", kn: "ಕಾಫಿ" },
    agmarknetCommodity: "Coffee",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: ORCHARD, rainSkipMm: 12 },
    yield: perennial([{ fromAge: 4, qtlPerAcre: 3 }, { fromAge: 6, qtlPerAcre: 6 }, { fromAge: 8, qtlPerAcre: 7 }], 30, 0.2),
    diseases: [foliar("leaf_rust", "Coffee leaf rust", "ಕಾಫಿ ತುಕ್ಕು ರೋಗ", "Hemileia vastatrix",
      { months: MONSOON, humidityPct: 88, tempMinC: 18, tempMaxC: 28, wetDays: 3 },
      { ...COPPER, dryHours: 5, protectionDays: 45 }, 0.25)],
    yieldNote: "Clean coffee. Arabica typically yields below robusta on the same acreage.",
  },
  {
    id: "cashew",
    name: { en: "Cashew", kn: "ಗೋಡಂಬಿ" },
    agmarknetCommodity: "Cashewnuts",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: ORCHARD, rainSkipMm: 12 },
    yield: perennial([{ fromAge: 4, qtlPerAcre: 2 }, { fromAge: 6, qtlPerAcre: 4 }, { fromAge: 8, qtlPerAcre: 5 }], 25, 0.15),
    diseases: [],
    notes: "The main cashew problem is tea mosquito bug, an insect pest. This app only models weather-driven diseases, so it will not warn you about it.",
    yieldNote: "Raw nut. Grafted varieties outyield seedling trees substantially.",
  },

  // ---------------------------------------------------------------- fruit
  {
    id: "grapes",
    name: { en: "Grapes", kn: "ದ್ರಾಕ್ಷಿ" },
    agmarknetCommodity: "Grapes",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 2, sprinkler: 5, flood: 9, rainfed: Infinity }, rainSkipMm: 8 },
    yield: perennial([{ fromAge: 3, qtlPerAcre: 40 }, { fromAge: 4, qtlPerAcre: 80 }, { fromAge: 6, qtlPerAcre: 100 }], 18, 4),
    diseases: [foliar("downy_mildew", "Downy mildew", "ಡೌನಿ ಶಿಲೀಂಧ್ರ", "Plasmopara viticola",
      { months: MONSOON, humidityPct: 85, tempMinC: 18, tempMaxC: 27, wetDays: 2 },
      { ...MANCOZEB, dryHours: 4, protectionDays: 10 }, 0.45)],
    notes: "Powdery mildew is the other major grape disease, but it spreads in dry weather, so this app's wet-spell rules will not catch it.",
    yieldNote: "Table grapes on a well-managed trellis. Raisin varieties and young vines yield considerably less.",
  },
  {
    id: "mango",
    name: { en: "Mango", kn: "ಮಾವು" },
    agmarknetCommodity: "Mango",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: ORCHARD, rainSkipMm: 12 },
    yield: perennial([{ fromAge: 5, qtlPerAcre: 8 }, { fromAge: 8, qtlPerAcre: 20 }, { fromAge: 12, qtlPerAcre: 30 }], 40, 0.5),
    diseases: [foliar("anthracnose", "Anthracnose", "ಆಂಥ್ರಾಕ್ನೋಸ್", "Colletotrichum gloeosporioides",
      { months: MONSOON, humidityPct: 90, tempMinC: 20, tempMaxC: 30, wetDays: 3 },
      { ...COPPER, dryHours: 5, protectionDays: 21 }, 0.3)],
    notes: "Mango alternates: a heavy year is usually followed by a light one, which this estimate does not model.",
    yieldNote: "Mature orchard average across on and off years.",
  },
  {
    id: "pomegranate",
    name: { en: "Pomegranate", kn: "ದಾಳಿಂಬೆ" },
    agmarknetCommodity: "Pomegranate",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 3, sprinkler: 6, flood: 10, rainfed: Infinity }, rainSkipMm: 10 },
    yield: perennial([{ fromAge: 3, qtlPerAcre: 20 }, { fromAge: 5, qtlPerAcre: 45 }, { fromAge: 7, qtlPerAcre: 55 }], 15, 3),
    diseases: [foliar("bacterial_blight", "Bacterial blight (telya)", "ತೆಲ್ಯಾ ರೋಗ", "Xanthomonas axonopodis",
      { months: MONSOON, humidityPct: 88, tempMinC: 20, tempMaxC: 32, wetDays: 2 },
      { en: "Copper oxychloride + streptocycline", kn: "ಕಾಪರ್ ಆಕ್ಸಿಕ್ಲೋರೈಡ್ + ಸ್ಟ್ರೆಪ್ಟೊಸೈಕ್ಲಿನ್", dryHours: 4, protectionDays: 14 }, 0.5)],
    yieldNote: "Telya can take an entire orchard, so realised yields vary far more than this figure suggests.",
  },
  {
    id: "banana",
    name: { en: "Banana", kn: "ಬಾಳೆ" },
    agmarknetCommodity: "Banana",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 2, sprinkler: 4, flood: 7, rainfed: Infinity }, rainSkipMm: 10 },
    yield: seasonal(120, 330),
    diseases: [foliar("sigatoka", "Sigatoka leaf spot", "ಎಲೆ ಚುಕ್ಕೆ ರೋಗ", "Mycosphaerella spp.",
      { months: MONSOON, humidityPct: 88, tempMinC: 20, tempMaxC: 32, wetDays: 3 },
      { en: "Propiconazole spray", kn: "ಪ್ರೊಪಿಕೊನಜೋಲ್ ಸಿಂಪರಣೆ", dryHours: 5, protectionDays: 30 }, 0.25)],
    yieldNote: "One full crop cycle at commercial spacing.",
  },
  {
    id: "sapota",
    name: { en: "Sapota", kn: "ಸಪೋಟ" },
    agmarknetCommodity: "Sapota",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: ORCHARD, rainSkipMm: 12 },
    yield: perennial([{ fromAge: 5, qtlPerAcre: 20 }, { fromAge: 8, qtlPerAcre: 45 }, { fromAge: 12, qtlPerAcre: 60 }], 40, 0.6),
    diseases: [],
    yieldNote: "Mature orchard. Bears over a long season rather than one harvest.",
  },
  {
    id: "papaya",
    name: { en: "Papaya", kn: "ಪಪ್ಪಾಯಿ" },
    agmarknetCommodity: "Papaya",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: VEG, rainSkipMm: 10 },
    yield: perennial([{ fromAge: 1, qtlPerAcre: 150 }, { fromAge: 2, qtlPerAcre: 250 }], 3, 80),
    diseases: [],
    notes: "Papaya ring spot is a virus spread by aphids, not weather, so no spray window is offered for it.",
    yieldNote: "Heaviest in the second year, then falls away sharply — most growers replant after three.",
  },
  {
    id: "watermelon",
    name: { en: "Watermelon", kn: "ಕಲ್ಲಂಗಡಿ" },
    agmarknetCommodity: "Water Melon",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: VEG, rainSkipMm: 8 },
    yield: seasonal(110, 90),
    diseases: [],
    yieldNote: "Summer crop on drip with mulch. Open flood-irrigated plots yield well below this.",
  },

  // ---------------------------------------------------------------- vegetables
  {
    id: "tomato",
    name: { en: "Tomato", kn: "ಟೊಮೇಟೊ" },
    agmarknetCommodity: "Tomato",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: VEG, rainSkipMm: 8 },
    yield: seasonal(90, 100),
    diseases: [foliar("late_blight", "Late blight", "ಅಂಗಮಾರಿ ರೋಗ", "Phytophthora infestans",
      { months: [6, 7, 8, 9, 10, 11, 12], humidityPct: 88, tempMinC: 12, tempMaxC: 25, wetDays: 2 },
      { ...MANCOZEB, dryHours: 4, protectionDays: 10 }, 0.5)],
    yieldNote: "Hybrid on stakes. Open-pollinated varieties give roughly half this.",
  },
  {
    id: "onion",
    name: { en: "Onion", kn: "ಈರುಳ್ಳಿ" },
    agmarknetCommodity: "Onion",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 3, sprinkler: 6, flood: 10, rainfed: Infinity }, rainSkipMm: 8 },
    yield: seasonal(100, 120),
    diseases: [foliar("purple_blotch", "Purple blotch", "ನೇರಳೆ ಮಚ್ಚೆ ರೋಗ", "Alternaria porri",
      { months: MONSOON, humidityPct: 80, tempMinC: 21, tempMaxC: 32, wetDays: 2 },
      { ...MANCOZEB, dryHours: 4, protectionDays: 12 }, 0.35)],
    notes: "Onion needs a sticker with the spray — the leaves shed plain water.",
    yieldNote: "Rabi crop. Kharif onion typically yields a fifth to a third less.",
  },
  {
    id: "potato",
    name: { en: "Potato", kn: "ಆಲೂಗಡ್ಡೆ" },
    agmarknetCommodity: "Potato",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 3, sprinkler: 5, flood: 8, rainfed: Infinity }, rainSkipMm: 8 },
    yield: seasonal(80, 100),
    diseases: [foliar("potato_late_blight", "Late blight", "ಅಂಗಮಾರಿ ರೋಗ", "Phytophthora infestans",
      { months: RABI, humidityPct: 85, tempMinC: 8, tempMaxC: 22, wetDays: 2 },
      { ...MANCOZEB, dryHours: 4, protectionDays: 10 }, 0.5)],
    yieldNote: "Cool-season crop on good seed. Late blight in a wet December can halve it.",
  },
  {
    id: "green_chilli",
    name: { en: "Green chilli", kn: "ಹಸಿಮೆಣಸಿನಕಾಯಿ" },
    agmarknetCommodity: "Green Chilli",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: VEG, rainSkipMm: 8 },
    yield: seasonal(60, 150),
    diseases: [foliar("chilli_anthracnose", "Fruit rot (anthracnose)", "ಹಣ್ಣು ಕೊಳೆ ರೋಗ", "Colletotrichum capsici",
      { months: MONSOON, humidityPct: 88, tempMinC: 20, tempMaxC: 30, wetDays: 2 },
      { ...MANCOZEB, dryHours: 4, protectionDays: 12 }, 0.4)],
    notes: "Leaf curl from thrips and mites causes more loss than any fungus in many seasons, and is not modelled here.",
    yieldNote: "Green harvest across multiple pickings. Dry chilli is roughly a quarter of this weight.",
  },
  {
    id: "brinjal",
    name: { en: "Brinjal", kn: "ಬದನೆಕಾಯಿ" },
    agmarknetCommodity: "Brinjal",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: VEG, rainSkipMm: 8 },
    yield: seasonal(100, 150),
    diseases: [],
    notes: "Shoot and fruit borer is the main brinjal problem. It is an insect, so this app offers no spray window for it.",
    yieldNote: "Across the full picking season, not a single harvest.",
  },
  {
    id: "bhindi",
    name: { en: "Okra", kn: "ಬೆಂಡೆಕಾಯಿ" },
    agmarknetCommodity: "Bhindi(Ladies Finger)",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: VEG, rainSkipMm: 8 },
    yield: seasonal(50, 120),
    diseases: [],
    notes: "Yellow vein mosaic is a whitefly-borne virus; controlling the whitefly matters more than any fungicide.",
    yieldNote: "Total across pickings.",
  },
  {
    id: "cabbage",
    name: { en: "Cabbage", kn: "ಎಲೆಕೋಸು" },
    agmarknetCommodity: "Cabbage",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: VEG, rainSkipMm: 8 },
    yield: seasonal(100, 90),
    diseases: [],
    yieldNote: "Heads at commercial spacing.",
  },
  {
    id: "cauliflower",
    name: { en: "Cauliflower", kn: "ಹೂಕೋಸು" },
    agmarknetCommodity: "Cauliflower",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: VEG, rainSkipMm: 8 },
    yield: seasonal(80, 90),
    diseases: [],
    yieldNote: "Curd weight. Very sensitive to sowing date — a late crop can fail to head at all.",
  },
  {
    id: "carrot",
    name: { en: "Carrot", kn: "ಕ್ಯಾರೆಟ್" },
    agmarknetCommodity: "Carrot",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: VEG, rainSkipMm: 8 },
    yield: seasonal(70, 100),
    diseases: [],
    yieldNote: "Needs deep loose soil; heavy soils give forked roots and lower marketable yield.",
  },
  {
    id: "cucumber",
    name: { en: "Cucumber", kn: "ಸೌತೆಕಾಯಿ" },
    agmarknetCommodity: "Cucumbar(Kheera)",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: VEG, rainSkipMm: 8 },
    yield: seasonal(70, 70),
    diseases: [foliar("cucurbit_downy", "Downy mildew", "ಡೌನಿ ಶಿಲೀಂಧ್ರ", "Pseudoperonospora cubensis",
      { months: MONSOON, humidityPct: 88, tempMinC: 18, tempMaxC: 30, wetDays: 2 },
      { ...MANCOZEB, dryHours: 3, protectionDays: 10 }, 0.4)],
    yieldNote: "Across pickings on a short cycle.",
  },
  {
    id: "beans",
    name: { en: "Beans", kn: "ಹುರುಳಿಕಾಯಿ" },
    agmarknetCommodity: "Beans",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: VEG, rainSkipMm: 8 },
    yield: seasonal(35, 90),
    diseases: [],
    yieldNote: "Green pods across pickings. Pole types outyield bush types.",
  },

  // ---------------------------------------------------------------- field crops
  {
    id: "paddy",
    name: { en: "Paddy", kn: "ಭತ್ತ" },
    agmarknetCommodity: "Paddy(Dhan)(Common)",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 5, sprinkler: 5, flood: 4, rainfed: Infinity }, rainSkipMm: 15 },
    yield: seasonal(20, 125),
    diseases: [foliar("blast", "Rice blast", "ಬೆಂಕಿ ರೋಗ", "Pyricularia oryzae",
      { months: [7, 8, 9, 10, 11], humidityPct: 90, tempMinC: 20, tempMaxC: 28, wetDays: 2 },
      { en: "Tricyclazole spray", kn: "ಟ್ರೈಸೈಕ್ಲಜೋಲ್ ಸಿಂಪರಣೆ", dryHours: 4, protectionDays: 21 }, 0.3)],
    yieldNote: "Irrigated crop. Rainfed paddy commonly yields half this.",
  },
  {
    id: "ragi",
    name: { en: "Ragi", kn: "ರಾಗಿ" },
    agmarknetCommodity: "Ragi (Finger Millet)",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: FIELD, rainSkipMm: 12 },
    yield: seasonal(12, 110),
    diseases: [foliar("ragi_blast", "Finger blast", "ಬೆಂಕಿ ರೋಗ", "Pyricularia grisea",
      { months: MONSOON, humidityPct: 90, tempMinC: 20, tempMaxC: 30, wetDays: 2 },
      { en: "Carbendazim spray", kn: "ಕಾರ್ಬೆಂಡಜಿಮ್ ಸಿಂಪರಣೆ", dryHours: 4, protectionDays: 20 }, 0.3)],
    yieldNote: "Mostly grown rainfed in Karnataka; irrigated plots do better.",
  },
  {
    id: "maize",
    name: { en: "Maize", kn: "ಮೆಕ್ಕೆಜೋಳ" },
    agmarknetCommodity: "Maize",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: FIELD, rainSkipMm: 12 },
    yield: seasonal(25, 100),
    diseases: [foliar("turcicum", "Turcicum leaf blight", "ಎಲೆ ಒಣಗು ರೋಗ", "Exserohilum turcicum",
      { months: MONSOON, humidityPct: 85, tempMinC: 18, tempMaxC: 28, wetDays: 3 },
      { ...MANCOZEB, dryHours: 4, protectionDays: 15 }, 0.25)],
    notes: "Fall armyworm is the bigger threat in most seasons and is an insect, so no spray window is given for it.",
    yieldNote: "Hybrid grain at 14% moisture.",
  },
  {
    id: "jowar",
    name: { en: "Jowar", kn: "ಜೋಳ" },
    agmarknetCommodity: "Jowar(Sorghum)",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: FIELD, rainSkipMm: 12 },
    yield: seasonal(12, 110),
    diseases: [],
    yieldNote: "Grain only. Rabi jowar on residual moisture yields less than the kharif crop.",
  },
  {
    id: "wheat",
    name: { en: "Wheat", kn: "ಗೋಧಿ" },
    agmarknetCommodity: "Wheat",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: FIELD, rainSkipMm: 12 },
    yield: seasonal(18, 120),
    diseases: [foliar("yellow_rust", "Yellow rust", "ಹಳದಿ ತುಕ್ಕು", "Puccinia striiformis",
      { months: RABI, humidityPct: 80, tempMinC: 5, tempMaxC: 18, wetDays: 2 },
      { en: "Propiconazole spray", kn: "ಪ್ರೊಪಿಕೊನಜೋಲ್ ಸಿಂಪರಣೆ", dryHours: 4, protectionDays: 21 }, 0.3)],
    yieldNote: "Irrigated crop with full fertiliser.",
  },
  {
    id: "groundnut",
    name: { en: "Groundnut", kn: "ಕಡಲೆಕಾಯಿ" },
    agmarknetCommodity: "Groundnut",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: FIELD, rainSkipMm: 10 },
    yield: seasonal(10, 110),
    diseases: [foliar("late_leaf_spot", "Late leaf spot (tikka)", "ಟಿಕ್ಕಾ ರೋಗ", "Phaeoisariopsis personata",
      { months: MONSOON, humidityPct: 85, tempMinC: 20, tempMaxC: 30, wetDays: 3 },
      { ...MANCOZEB, dryHours: 4, protectionDays: 15 }, 0.3)],
    yieldNote: "Dry pods. Published figures of 20-25 qtl/acre are demonstration plots, not field averages.",
  },
  {
    id: "sunflower",
    name: { en: "Sunflower", kn: "ಸೂರ್ಯಕಾಂತಿ" },
    agmarknetCommodity: "Sunflower",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: FIELD, rainSkipMm: 10 },
    yield: seasonal(6, 100),
    diseases: [],
    yieldNote: "Seed. Birds take a meaningful share in small plots.",
  },
  {
    id: "soyabean",
    name: { en: "Soyabean", kn: "ಸೋಯಾಬೀನ್" },
    agmarknetCommodity: "Soyabean",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: FIELD, rainSkipMm: 12 },
    yield: seasonal(10, 100),
    diseases: [],
    yieldNote: "Grain, largely rainfed.",
  },
  {
    id: "tur",
    name: { en: "Tur / red gram", kn: "ತೊಗರಿ" },
    agmarknetCommodity: "Arhar (Tur/Red Gram)(Whole)",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: FIELD, rainSkipMm: 12 },
    yield: seasonal(6, 180),
    diseases: [],
    notes: "Pod borer decides most tur harvests, and it is an insect pest this app does not model.",
    yieldNote: "Long-duration crop, usually rainfed.",
  },
  {
    id: "bengal_gram",
    name: { en: "Bengal gram", kn: "ಕಡಲೆ" },
    agmarknetCommodity: "Bengal Gram(Gram)(Whole)",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: FIELD, rainSkipMm: 12 },
    yield: seasonal(8, 110),
    diseases: [],
    yieldNote: "Rabi crop, often on residual moisture.",
  },
  {
    id: "green_gram",
    name: { en: "Green gram", kn: "ಹೆಸರುಕಾಳು" },
    agmarknetCommodity: "Green Gram (Moong)(Whole)",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: FIELD, rainSkipMm: 10 },
    yield: seasonal(4, 70),
    diseases: [],
    yieldNote: "Short-duration pulse, commonly grown as a catch crop.",
  },
  {
    id: "cotton",
    name: { en: "Cotton", kn: "ಹತ್ತಿ" },
    agmarknetCommodity: "Cotton",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: FIELD, rainSkipMm: 12 },
    yield: seasonal(10, 180),
    diseases: [],
    notes: "Pink bollworm governs cotton returns and is an insect pest, so no spray window is offered.",
    yieldNote: "Seed cotton (kapas), not lint.",
  },
  {
    id: "sugarcane",
    name: { en: "Sugarcane", kn: "ಕಬ್ಬು" },
    agmarknetCommodity: "Sugarcane",
    depth: "partial",
    grades: [],
    irrigation: { intervalDays: { drip: 4, sprinkler: 8, flood: 12, rainfed: Infinity }, rainSkipMm: 15 },
    yield: seasonal(350, 365),
    diseases: [],
    notes: "Red rot is managed by choosing resistant setts, not by spraying, so no spray window applies.",
    yieldNote: "Cane weight over a full twelve-month crop. Ratoon crops yield less than plant cane.",
  },
  {
    id: "turmeric",
    name: { en: "Turmeric", kn: "ಅರಿಶಿನ" },
    agmarknetCommodity: "Turmeric",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 3, sprinkler: 6, flood: 9, rainfed: Infinity }, rainSkipMm: 12 },
    yield: seasonal(80, 240),
    diseases: [foliar("rhizome_rot", "Rhizome rot", "ಗಡ್ಡೆ ಕೊಳೆ ರೋಗ", "Pythium spp.",
      { months: MONSOON, humidityPct: 90, tempMinC: 20, tempMaxC: 32, wetDays: 4 },
      { en: "Metalaxyl + mancozeb drench", kn: "ಮೆಟಲಾಕ್ಸಿಲ್ + ಮ್ಯಾಂಕೋಜೆಬ್ ಡ್ರೆಂಚ್", dryHours: 3, protectionDays: 30 }, 0.35)],
    yieldNote: "Fresh rhizome. Dry turmeric is roughly a fifth of this weight.",
  },
  {
    id: "ginger",
    name: { en: "Ginger", kn: "ಶುಂಠಿ" },
    agmarknetCommodity: "Ginger(Green)",
    depth: "modelled",
    grades: [],
    irrigation: { intervalDays: { drip: 3, sprinkler: 6, flood: 9, rainfed: Infinity }, rainSkipMm: 12 },
    yield: seasonal(70, 240),
    diseases: [foliar("soft_rot", "Soft rot", "ಮೃದು ಕೊಳೆ ರೋಗ", "Pythium aphanidermatum",
      { months: MONSOON, humidityPct: 90, tempMinC: 20, tempMaxC: 32, wetDays: 4 },
      { en: "Metalaxyl + mancozeb drench", kn: "ಮೆಟಲಾಕ್ಸಿಲ್ + ಮ್ಯಾಂಕೋಜೆಬ್ ಡ್ರೆಂಚ್", dryHours: 3, protectionDays: 30 }, 0.4)],
    notes: "Soft rot follows waterlogging. Drainage matters more than any drench.",
    yieldNote: "Fresh rhizome.",
  },
];

/**
 * Commodities Agmarknet quotes that the registry has no agronomy for.
 *
 * These are selectable and get live prices, selling advice and the cost book.
 * They get no yield estimate and no disease rules, and the crop picker labels
 * them "Prices only" so nobody mistakes silence for a clean bill of health.
 * Moving one up to "partial" means adding a real yield figure to CROPS above.
 */
export const OTHER_COMMODITIES: { id: string; en: string; kn: string; commodity: string }[] = [
  { id: "garlic", en: "Garlic", kn: "ಬೆಳ್ಳುಳ್ಳಿ", commodity: "Garlic" },
  { id: "drumstick", en: "Drumstick", kn: "ನುಗ್ಗೆಕಾಯಿ", commodity: "Drumstick" },
  { id: "bittergourd", en: "Bitter gourd", kn: "ಹಾಗಲಕಾಯಿ", commodity: "Bitter gourd" },
  { id: "bottlegourd", en: "Bottle gourd", kn: "ಸೋರೆಕಾಯಿ", commodity: "Bottle gourd" },
  { id: "pumpkin", en: "Pumpkin", kn: "ಕುಂಬಳಕಾಯಿ", commodity: "Pumpkin" },
  { id: "ridgegourd", en: "Ridge gourd", kn: "ಹೀರೆಕಾಯಿ", commodity: "Ridgeguard(Tori)" },
  { id: "capsicum", en: "Capsicum", kn: "ದೊಣ್ಣೆ ಮೆಣಸಿನಕಾಯಿ", commodity: "Capsicum" },
  { id: "radish", en: "Radish", kn: "ಮೂಲಂಗಿ", commodity: "Raddish" },
  { id: "beetroot", en: "Beetroot", kn: "ಬೀಟ್‌ರೂಟ್", commodity: "Beetroot" },
  { id: "spinach", en: "Spinach", kn: "ಪಾಲಕ್", commodity: "Spinach" },
  { id: "coriander", en: "Coriander", kn: "ಕೊತ್ತಂಬರಿ", commodity: "Coriander(Leaves)" },
  { id: "sweet_potato", en: "Sweet potato", kn: "ಸಿಹಿ ಗೆಣಸು", commodity: "Sweet Potato" },
  { id: "colocasia", en: "Colocasia", kn: "ಕೆಸು", commodity: "Colacasia" },
  { id: "tamarind", en: "Tamarind", kn: "ಹುಣಸೆಹಣ್ಣು", commodity: "Tamarind Fruit" },
  { id: "guava", en: "Guava", kn: "ಸೀಬೆಕಾಯಿ", commodity: "Guava" },
  { id: "pineapple", en: "Pineapple", kn: "ಅನಾನಸ್", commodity: "Pineapple" },
  { id: "orange", en: "Orange", kn: "ಕಿತ್ತಳೆ", commodity: "Orange" },
  { id: "lemon", en: "Lemon", kn: "ನಿಂಬೆಹಣ್ಣು", commodity: "Lemon" },
  { id: "jackfruit", en: "Jackfruit", kn: "ಹಲಸಿನಕಾಯಿ", commodity: "Jack Fruit" },
  { id: "castor", en: "Castor seed", kn: "ಹರಳು", commodity: "Castor Seed" },
  { id: "sesamum", en: "Sesamum", kn: "ಎಳ್ಳು", commodity: "Sesamum(Sesame,Gingelly,Til)" },
  { id: "bajra", en: "Bajra", kn: "ಸಜ್ಜೆ", commodity: "Bajra(Pearl Millet/Cumbu)" },
  { id: "barley", en: "Barley", kn: "ಬಾರ್ಲಿ", commodity: "Barley (Jau)" },
  { id: "urad", en: "Urad / black gram", kn: "ಉದ್ದು", commodity: "Black Gram (Urd Beans)(Whole)" },
  { id: "horse_gram", en: "Horse gram", kn: "ಹುರುಳಿ", commodity: "Horse Gram" },
  { id: "cowpea", en: "Cowpea", kn: "ಅಲಸಂದೆ", commodity: "Cowpea(Veg)" },
  { id: "mustard", en: "Mustard", kn: "ಸಾಸಿವೆ", commodity: "Mustard" },
  { id: "safflower", en: "Safflower", kn: "ಕುಸುಬೆ", commodity: "Safflower" },
  { id: "dry_chilli", en: "Dry chilli", kn: "ಒಣ ಮೆಣಸಿನಕಾಯಿ", commodity: "Dry Chillies" },
  { id: "betel_leaves", en: "Betel leaves", kn: "ವೀಳ್ಯದೆಲೆ", commodity: "Betal Leaves" },
];

/**
 * Fallback for a commodity with no agronomy in the registry.
 *
 * The irrigation interval here is a generic default and is NOT crop-specific —
 * that is exactly why these crops are labelled "Prices only" and why the yield
 * is zero rather than a guess. Anything that needs to be right for a particular
 * crop belongs in CROPS, not here.
 */
export function genericCrop(id: string, en: string, kn: string, commodity: string): CropConfig {
  return {
    id,
    name: { en, kn },
    agmarknetCommodity: commodity,
    depth: "basic",
    grades: [],
    irrigation: { intervalDays: FIELD, rainSkipMm: 10 },
    yield: seasonal(0, 120),
    diseases: [],
  };
}
