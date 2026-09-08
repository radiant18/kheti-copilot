/**
 * Interface language.
 *
 * Scope, stated honestly: this covers the app's own chrome — navigation,
 * headings, buttons, the login and setup flow. It does NOT yet cover the
 * advice text itself, which the rules engine builds as English sentences in
 * lib/engine/, nor the 122 crop names, which exist only in English and Kannada.
 * Translating the advice means restructuring every Recommendation into a key
 * plus parameters instead of a prebuilt string — a real refactor, not a lookup
 * table.
 *
 * In the meantime the voice assistant is the bridge: it reads the same plan and
 * answers in whichever language is chosen here, so a Hindi or Marathi speaker
 * can hear today's actions even while the cards above are still in English.
 */

export type Lang = "en" | "hi" | "kn" | "mr";

export const LANGUAGES: { code: Lang; native: string; english: string; locale: string }[] = [
  { code: "en", native: "English", english: "English", locale: "en-IN" },
  { code: "hi", native: "हिंदी", english: "Hindi", locale: "hi-IN" },
  { code: "kn", native: "ಕನ್ನಡ", english: "Kannada", locale: "kn-IN" },
  { code: "mr", native: "मराठी", english: "Marathi", locale: "mr-IN" },
];

export const localeFor = (lang: Lang): string =>
  LANGUAGES.find((l) => l.code === lang)?.locale ?? "en-IN";

export const languageName = (lang: Lang): string =>
  LANGUAGES.find((l) => l.code === lang)?.english ?? "English";

type Dict = Record<string, string>;

const STRINGS: Record<Lang, Dict> = {
  en: {
    tagline: "Your farm's daily plan — what to water, what to spray, and where to sell.",
    chooseLanguage: "Choose your language",
    yourName: "Your name",
    mobile: "Mobile number",
    continue: "Continue",
    privacy: "Your number stays on this phone. It is not sent anywhere yet.",
    navToday: "Today",
    navSell: "Sell",
    navProfit: "Profit",
    navAsk: "Ask",
    navSettings: "Settings",
    yourFarmToday: "Your farm today",
    expectedProfit: "Expected profit this season",
    spentThisSeason: "Spent this season",
    next7days: "Next 7 days",
    refresh: "Refresh",
    whatDoYouGrow: "What do you grow?",
    addAnotherCrop: "Add another crop",
    searchCrops: "Search crops…",
    whereIsFarm: "Where is your farm?",
    useMyLocation: "Use my current location",
    orChooseManually: "or choose manually",
    state: "State",
    nearestTown: "Nearest town or taluk",
    back: "Back",
    next: "Next",
    seeMyPlan: "See my farm plan",
    settings: "Settings",
    account: "Account",
    yourCrops: "Your crops",
    logOut: "Log out",
    askYourFarm: "Ask your farm",
    askPlaceholder: "Or type your question",
    ask: "Ask",
  },
  hi: {
    tagline: "आपके खेत की रोज़ की योजना — कब पानी दें, कब छिड़काव करें, और कहाँ बेचें।",
    chooseLanguage: "अपनी भाषा चुनें",
    yourName: "आपका नाम",
    mobile: "मोबाइल नंबर",
    continue: "आगे बढ़ें",
    privacy: "आपका नंबर इसी फ़ोन में रहता है। अभी कहीं नहीं भेजा जाता।",
    navToday: "आज",
    navSell: "बेचें",
    navProfit: "मुनाफ़ा",
    navAsk: "पूछें",
    navSettings: "सेटिंग",
    yourFarmToday: "आज आपका खेत",
    expectedProfit: "इस मौसम का अनुमानित मुनाफ़ा",
    spentThisSeason: "इस मौसम में खर्च",
    next7days: "अगले ७ दिन",
    refresh: "ताज़ा करें",
    whatDoYouGrow: "आप क्या उगाते हैं?",
    addAnotherCrop: "दूसरी फ़सल जोड़ें",
    searchCrops: "फ़सल खोजें…",
    whereIsFarm: "आपका खेत कहाँ है?",
    useMyLocation: "मेरी वर्तमान जगह लें",
    orChooseManually: "या खुद चुनें",
    state: "राज्य",
    nearestTown: "नज़दीकी शहर या तालुका",
    back: "पीछे",
    next: "आगे",
    seeMyPlan: "मेरे खेत की योजना देखें",
    settings: "सेटिंग",
    account: "खाता",
    yourCrops: "आपकी फ़सलें",
    logOut: "लॉग आउट",
    askYourFarm: "अपने खेत से पूछें",
    askPlaceholder: "या अपना सवाल लिखें",
    ask: "पूछें",
  },
  kn: {
    tagline: "ನಿಮ್ಮ ಜಮೀನಿನ ದಿನದ ಯೋಜನೆ — ಯಾವಾಗ ನೀರು, ಯಾವಾಗ ಸಿಂಪರಣೆ, ಎಲ್ಲಿ ಮಾರಾಟ.",
    chooseLanguage: "ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ",
    yourName: "ನಿಮ್ಮ ಹೆಸರು",
    mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    continue: "ಮುಂದುವರಿಸಿ",
    privacy: "ನಿಮ್ಮ ಸಂಖ್ಯೆ ಈ ಫೋನಿನಲ್ಲೇ ಇರುತ್ತದೆ. ಇನ್ನೂ ಎಲ್ಲಿಗೂ ಕಳುಹಿಸಿಲ್ಲ.",
    navToday: "ಇಂದು",
    navSell: "ಮಾರಾಟ",
    navProfit: "ಲಾಭ",
    navAsk: "ಕೇಳಿ",
    navSettings: "ಸೆಟ್ಟಿಂಗ್ಸ್",
    yourFarmToday: "ಇಂದು ನಿಮ್ಮ ಜಮೀನು",
    expectedProfit: "ಈ ಋತುವಿನ ನಿರೀಕ್ಷಿತ ಲಾಭ",
    spentThisSeason: "ಈ ಋತುವಿನಲ್ಲಿ ಖರ್ಚು",
    next7days: "ಮುಂದಿನ ೭ ದಿನ",
    refresh: "ಹೊಸದಾಗಿ ಪಡೆಯಿರಿ",
    whatDoYouGrow: "ನೀವು ಏನು ಬೆಳೆಯುತ್ತೀರಿ?",
    addAnotherCrop: "ಇನ್ನೊಂದು ಬೆಳೆ ಸೇರಿಸಿ",
    searchCrops: "ಬೆಳೆ ಹುಡುಕಿ…",
    whereIsFarm: "ನಿಮ್ಮ ಜಮೀನು ಎಲ್ಲಿದೆ?",
    useMyLocation: "ನನ್ನ ಈಗಿನ ಸ್ಥಳ ಬಳಸಿ",
    orChooseManually: "ಅಥವಾ ನೀವೇ ಆಯ್ಕೆ ಮಾಡಿ",
    state: "ರಾಜ್ಯ",
    nearestTown: "ಹತ್ತಿರದ ಊರು ಅಥವಾ ತಾಲೂಕು",
    back: "ಹಿಂದೆ",
    next: "ಮುಂದೆ",
    seeMyPlan: "ನನ್ನ ಜಮೀನಿನ ಯೋಜನೆ ನೋಡಿ",
    settings: "ಸೆಟ್ಟಿಂಗ್ಸ್",
    account: "ಖಾತೆ",
    yourCrops: "ನಿಮ್ಮ ಬೆಳೆಗಳು",
    logOut: "ಲಾಗ್ ಔಟ್",
    askYourFarm: "ನಿಮ್ಮ ಜಮೀನನ್ನು ಕೇಳಿ",
    askPlaceholder: "ಅಥವಾ ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಬರೆಯಿರಿ",
    ask: "ಕೇಳಿ",
  },
  mr: {
    tagline: "तुमच्या शेताची रोजची योजना — कधी पाणी, कधी फवारणी, आणि कुठे विकायचे.",
    chooseLanguage: "तुमची भाषा निवडा",
    yourName: "तुमचे नाव",
    mobile: "मोबाइल नंबर",
    continue: "पुढे चला",
    privacy: "तुमचा नंबर याच फोनमध्ये राहतो. अजून कुठेही पाठवला जात नाही.",
    navToday: "आज",
    navSell: "विक्री",
    navProfit: "नफा",
    navAsk: "विचारा",
    navSettings: "सेटिंग",
    yourFarmToday: "आज तुमचे शेत",
    expectedProfit: "या हंगामाचा अपेक्षित नफा",
    spentThisSeason: "या हंगामातील खर्च",
    next7days: "पुढील ७ दिवस",
    refresh: "पुन्हा घ्या",
    whatDoYouGrow: "तुम्ही काय पिकवता?",
    addAnotherCrop: "दुसरे पीक जोडा",
    searchCrops: "पीक शोधा…",
    whereIsFarm: "तुमचे शेत कुठे आहे?",
    useMyLocation: "माझे सध्याचे ठिकाण घ्या",
    orChooseManually: "किंवा स्वतः निवडा",
    state: "राज्य",
    nearestTown: "जवळचे गाव किंवा तालुका",
    back: "मागे",
    next: "पुढे",
    seeMyPlan: "माझ्या शेताची योजना पहा",
    settings: "सेटिंग",
    account: "खाते",
    yourCrops: "तुमची पिके",
    logOut: "लॉग आउट",
    askYourFarm: "तुमच्या शेताला विचारा",
    askPlaceholder: "किंवा तुमचा प्रश्न लिहा",
    ask: "विचारा",
  },
};

/** Falls back to English rather than showing a raw key if a string is missing. */
export function t(lang: Lang, key: string): string {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}
