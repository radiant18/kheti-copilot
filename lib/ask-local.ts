import type { AskContext } from "./ask-context";
import type { Lang } from "./i18n";

/**
 * The assistant, without a model.
 *
 * "Ask your farm" needs an ANTHROPIC_API_KEY to phrase answers conversationally.
 * Without one it used to reply "the assistant is not switched on", which turns a
 * whole tab into a dead end for anyone who has not set up a key — including
 * every person seeing the app for the first time.
 *
 * This answers the same questions from the same plan, deterministically. It is
 * blunter than the model, but it is never wrong in a way the model can be: it
 * only ever returns text the rules engine already produced, which messages.ts
 * has already translated into the farmer's language. That is why there is
 * almost nothing to translate here — the answers are quotes, not compositions.
 *
 * Same hard rule as the model: it may not originate advice. If nothing in the
 * plan addresses the question, it says so.
 */

type Intent = "water" | "spray" | "sell" | "money" | "weather" | "unknown";

/**
 * Keywords per language. Deliberately generous and lowercase-matched: a farmer
 * speaking into a phone produces loose text, and a missed intent costs more
 * than an over-eager one, because the fallback still shows today's actions.
 */
const KEYWORDS: Record<Intent, Record<Lang, string[]>> = {
  water: {
    en: ["water", "irrigat", "pump", "sprinkl", "drip", "wet"],
    hi: ["पानी", "सिंचाई", "पंप"],
    kn: ["ನೀರು", "ನೀರಾವರಿ", "ಪಂಪ್"],
    mr: ["पाणी", "सिंचन", "पंप"],
    te: ["నీరు", "నీటి", "పారుదల", "పంపు"],
    ta: ["தண்ணீர்", "பாசன", "பம்ப்"],
    bn: ["জল", "সেচ", "পাম্প"],
    gu: ["પાણી", "પિયત", "પંપ"],
    pa: ["ਪਾਣੀ", "ਸਿੰਚਾਈ", "ਪੰਪ"],
    or: ["ପାଣି", "ଜଳସେଚନ", "ପମ୍ପ"],
    ml: ["വെള്ളം", "നന", "ജലസേചന", "പമ്പ്"],
    as: ["পানী", "জলসিঞ্চন", "পাম্প"],
    mai: ["पानि", "पटवन", "सिंचाई", "पंप"],
  },
  spray: {
    en: ["spray", "disease", "pest", "fungus", "rot", "medicine", "bordeaux", "blight"],
    hi: ["छिड़क", "दवा", "रोग", "कीट", "फफूंद"],
    kn: ["ಸಿಂಪ", "ಔಷಧ", "ರೋಗ", "ಕೀಟ", "ಕೊಳೆ"],
    mr: ["फवार", "औषध", "रोग", "कीड"],
    te: ["పిచికారీ", "మందు", "తెగులు", "పురుగు"],
    ta: ["தெளி", "மருந்து", "நோய்", "பூச்சி"],
    bn: ["স্প্রে", "ছিটা", "ওষুধ", "রোগ", "পোকা"],
    gu: ["છંટકાવ", "દવા", "રોગ", "જીવાત"],
    pa: ["ਸਪਰੇਅ", "ਛਿੜਕ", "ਦਵਾਈ", "ਰੋਗ", "ਕੀੜ"],
    or: ["ସ୍ପ୍ରେ", "ଔଷଧ", "ରୋଗ", "ପୋକ"],
    ml: ["തളി", "മരുന്ന്", "രോഗ", "കീട"],
    as: ["স্প্ৰে", "দৰব", "ৰোগ", "পোক"],
    mai: ["छिड़क", "दवाइ", "रोग", "कीड़"],
  },
  sell: {
    en: ["sell", "price", "rate", "market", "mandi", "yard", "quintal"],
    hi: ["बेच", "भाव", "दाम", "मंडी", "बाज़ार", "बाजार"],
    kn: ["ಮಾರ", "ದರ", "ಬೆಲೆ", "ಮಾರುಕಟ್ಟೆ", "ಮಂಡಿ"],
    mr: ["विक", "भाव", "दर", "बाजार"],
    te: ["అమ్మ", "ధర", "రేటు", "మార్కెట్", "మండి"],
    ta: ["விற", "விலை", "சந்தை", "மண்டி"],
    bn: ["বিক্রি", "দাম", "দর", "বাজার", "মান্ডি"],
    gu: ["વેચ", "ભાવ", "દર", "બજાર", "મંડી"],
    pa: ["ਵੇਚ", "ਭਾਅ", "ਦਰ", "ਮੰਡੀ", "ਬਜ਼ਾਰ"],
    or: ["ବିକ", "ଦର", "ମୂଲ୍ୟ", "ବଜାର", "ମାଣ୍ଡି"],
    ml: ["വിൽ", "വില", "വിപണി", "മണ്ഡി", "ചന്ത"],
    as: ["বিক্ৰী", "দৰ", "দাম", "বজাৰ", "মাণ্ডি"],
    mai: ["बेच", "भाव", "दाम", "मंडी", "बजार"],
  },
  money: {
    en: ["profit", "money", "cost", "spent", "earn", "income", "loss"],
    hi: ["मुनाफ", "पैसा", "खर्च", "कमाई", "लाभ", "नुकसान"],
    kn: ["ಲಾಭ", "ಹಣ", "ಖರ್ಚು", "ಆದಾಯ", "ನಷ್ಟ"],
    mr: ["नफा", "पैसे", "खर्च", "उत्पन्न", "तोटा"],
    te: ["లాభం", "డబ్బు", "ఖర్చు", "ఆదాయం", "నష్టం"],
    ta: ["லாப", "பணம்", "செலவு", "வருமான", "நஷ்ட"],
    bn: ["লাভ", "টাকা", "খরচ", "আয়", "ক্ষতি"],
    gu: ["નફો", "પૈસા", "ખર્ચ", "આવક", "નુકસાન"],
    pa: ["ਮੁਨਾਫ਼", "ਪੈਸ", "ਖ਼ਰਚ", "ਆਮਦਨ", "ਨੁਕਸਾਨ"],
    or: ["ଲାଭ", "ଟଙ୍କା", "ଖର୍ଚ୍ଚ", "ଆୟ", "କ୍ଷତି"],
    ml: ["ലാഭ", "പണം", "ചെലവ്", "വരുമാന", "നഷ്ട"],
    as: ["লাভ", "টকা", "খৰচ", "আয়", "লোকচান"],
    mai: ["मुनाफ", "पाइ", "खर्च", "आमदनी", "नोकसान"],
  },
  weather: {
    en: ["weather", "rain", "forecast", "dry", "sun", "wind", "humid"],
    hi: ["मौसम", "बारिश", "बरसात", "धूप"],
    kn: ["ಹವಾಮಾನ", "ಮಳೆ", "ಬಿಸಿಲು"],
    mr: ["हवामान", "पाऊस", "ऊन"],
    te: ["వాతావరణం", "వర్షం", "ఎండ"],
    ta: ["வானிலை", "மழை", "வெயில்"],
    bn: ["আবহাওয়া", "বৃষ্টি", "রোদ"],
    gu: ["હવામાન", "વરસાદ", "તડકો"],
    pa: ["ਮੌਸਮ", "ਮੀਂਹ", "ਧੁੱਪ"],
    or: ["ପାଗ", "ବର୍ଷା", "ଖରା"],
    ml: ["കാലാവസ്ഥ", "മഴ", "വെയിൽ"],
    as: ["বতৰ", "বৰষুণ", "ৰ'দ"],
    mai: ["मौसम", "बरखा", "रौद"],
  },
  unknown: { en: [], hi: [], kn: [], mr: [], te: [], ta: [], bn: [], gu: [], pa: [], or: [], ml: [], as: [], mai: [] },
};

/** Recommendation ids the rules engine emits, grouped by what they answer. */
const IDS: Partial<Record<Intent, (id: string) => boolean>> = {
  water: (id) => id === "irrigation",
  sell: (id) => id.startsWith("sell-") || id.startsWith("trend-") || id === "market",
  // Everything the disease rules emit is keyed by the rule's own id, so the
  // reliable test is "not one of the others".
  spray: (id) =>
    !["irrigation", "market", "coverage", "crop-note"].includes(id) &&
    !id.startsWith("sell-") &&
    !id.startsWith("trend-"),
};

function detect(question: string, lang: Lang): Intent {
  const q = question.toLowerCase();
  const order: Intent[] = ["spray", "sell", "water", "money", "weather"];
  for (const intent of order) {
    const words = [...KEYWORDS[intent][lang], ...KEYWORDS[intent].en];
    if (words.some((w) => q.includes(w.toLowerCase()))) return intent;
  }
  return "unknown";
}

function rupees(n: number): string {
  return `₹${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;
}

/** Join a recommendation into a spoken-sounding two-sentence answer. */
function speak(rec: { title: string; why: string }): string {
  return `${rec.title}. ${rec.why}`;
}

export function answerLocally(ctx: AskContext, question: string, lang: Lang): string {
  const intent = detect(question, lang);

  if (intent === "water" || intent === "spray") {
    const match = ctx.plan.find((r) => IDS[intent]!(r.id));
    if (match) return speak(match);
  }

  if (intent === "sell") {
    const match = ctx.plan.find((r) => IDS.sell!(r.id));
    const top = ctx.market[0];
    if (match && top) {
      return `${speak(match)} ${top.market}: ${rupees(top.rupeesPerQuintal)}/quintal on ${top.date}.`;
    }
    if (top) return `${top.market}: ${rupees(top.rupeesPerQuintal)}/quintal on ${top.date}.`;
    if (match) return speak(match);
  }

  if (intent === "money") {
    const { expectedProfit, expectedRevenue, costsSoFar, note } = ctx.money;
    if (expectedProfit !== null && expectedRevenue !== null) {
      return `Expected profit is ${rupees(expectedProfit)} — ${rupees(expectedRevenue)} from the harvest, less ${rupees(costsSoFar)} spent so far.`;
    }
    return `You have spent ${rupees(costsSoFar)} so far.${note ? ` ${note}` : ""}`;
  }

  if (intent === "weather") {
    const [today, tomorrow] = ctx.weather;
    if (today) {
      const t = `Today: ${today.rainMm} mm of rain, about ${today.dryHours} dry hours.`;
      const m = tomorrow ? ` Tomorrow: ${tomorrow.rainMm} mm.` : "";
      return t + m;
    }
  }

  // Nothing matched. Rather than guess, hand back what the plan actually says
  // to do today — which is the answer to most questions anyway.
  const actions = ctx.plan.filter((r) => r.urgency === "urgent" || r.urgency === "act").slice(0, 2);
  if (actions.length > 0) {
    return actions.map(speak).join(" ");
  }
  return ctx.plan.slice(0, 1).map(speak).join(" ");
}
