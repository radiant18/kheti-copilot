import type { Lang } from "./i18n";

/**
 * The advice text, in every interface language.
 *
 * The rules engine used to build finished English sentences, which meant a
 * Marathi farmer chose Marathi at sign-in and then read English on the one
 * screen that actually tells them what to do. Messages now live here as
 * templates and the engine fills in the numbers, so the language chosen at
 * sign-in holds all the way through.
 *
 * Rule for anyone adding a message: the engine still decides *which* key fires
 * and what the numbers are. This file only decides how that is worded. Never
 * put a threshold, a dose or a chemical name in here.
 */

type Params = Record<string, string | number>;

const TEMPLATES: Record<Lang, Record<string, string>> = {
  en: {
    "sev.urgent": "Do now",
    "sev.act": "Today",
    "sev.watch": "Keep an eye",
    "sev.info": "For info",
    "win.today": "Today",
    "win.weekly": "Weekly",

    "irr.rainfed.t": "Rainfed — nothing to irrigate",
    "irr.rainfed.w": "{rain} mm of rain expected over the next 2 days.",
    "irr.skip.t": "Do not irrigate today",
    "irr.skip.w": "{rain} mm of rain is expected in the next 48 hours — more than your {crop} needs.",
    "irr.due.t": "Irrigate today",
    "irr.due.w": "{since} days since your last irrigation and only {rain} mm of rain is expected. Your {method} system is on a {interval}-day cycle for {crop}.",
    "irr.next.t": "Next irrigation in {due} days",
    "irr.next1.t": "Next irrigation tomorrow",
    "irr.next.w": "Last irrigated {since} days ago on a {interval}-day cycle.",

    "dis.safe.t": "{disease} conditions present — you are still protected",
    "dis.safe.w": "{wetDays} wet days ahead with humidity above {humidity}%, but your spray from {since} days ago has about {left} days of cover left.",
    "dis.nowindow.t": "{disease} risk high — no dry window in the next 7 days",
    "dis.nowindow.w": "{wetDays} days of wet, humid weather ahead and no {hours}-hour dry gap in the forecast.",
    "dis.spray.t": "Spray {treatment} on {day}",
    "dis.spray.w": "{disease} weather is setting in ({wetDays} wet days, humidity above {humidity}%) and your protection has run out. {day} has about {dryHours} dry hours — the only workable window this week.",
    "dis.expired.t": "{treatment} cover has expired",
    "dis.expired.w": "Your last spray was {since} days ago; cover lasts about {days} days.",
    "dis.never.w": "No protective spray recorded this season for {disease}.",
    "dis.low.t": "{disease} risk low",
    "dis.low.w": "Only {wetDays} day(s) in the forecast meet the infection conditions.",
    "dis.off.w": "Outside the {disease} season.",

    "crop.note.t": "{crop}: worth knowing",
    "cover.t": "No disease rules for {crop} yet",
    "cover.w": "Market prices, irrigation timing and your cost book all work. Pest and disease advice needs this crop to be added to the registry.",

    "mkt.off.t": "Market prices are not switched on",
    "mkt.off.w": "The app has no key for the government price feed yet, so it has not asked for prices. Everything else on this screen is live.",
    "mkt.none.t": "No {crop} prices today",
    "mkt.none.w": "The mandi board had no quotes for this crop in your state today. Prices refresh through the day, and some yards report late.",
    "mkt.worth.t": "Your {grade} is worth ₹{net} today",
    "mkt.worth.w": "{qtl} quintals at {market}'s ₹{price}/qtl{transport}. No other yard is far enough ahead to be worth the extra distance.",
    "mkt.worth.transport": ", less ₹{cost} to get it there",
    "mkt.best.t": "{grade} at ₹{price}/qtl",
    "mkt.best.w": "Best quote today is {market}. Add your unsold stock to get selling advice.",
    "sell.move.t": "Take your {grade} to {best}, not {near}",
    "sell.move.w": "{best} is quoting ₹{bestPrice}/qtl against ₹{nearPrice} at {near}. On {qtl} quintals that is ₹{gain} more, and the extra distance costs about ₹{extra} in transport.",
    "sell.dated": "Prices dated {date}",
    "trend.down.t": "{grade} has fallen {pct}% this week",
    "trend.down.w": "Your {qtl} quintals are worth about ₹{loss} less than last week. Consider releasing part of the stock rather than waiting for a bounce.",
    "trend.up.t": "{grade} is up {pct}% this week",
    "trend.up.w": "Holding has paid off so far. Today {market} nets you ₹{net} for {qtl} quintals.",
  },

  hi: {
    "sev.urgent": "अभी करें",
    "sev.act": "आज",
    "sev.watch": "ध्यान रखें",
    "sev.info": "जानकारी",
    "win.today": "आज",
    "win.weekly": "हर हफ़्ते",

    "irr.rainfed.t": "बारिश पर निर्भर — सिंचाई की ज़रूरत नहीं",
    "irr.rainfed.w": "अगले 2 दिनों में {rain} मिमी बारिश की उम्मीद है।",
    "irr.skip.t": "आज सिंचाई न करें",
    "irr.skip.w": "अगले 48 घंटों में {rain} मिमी बारिश की उम्मीद है — आपकी {crop} की ज़रूरत से ज़्यादा।",
    "irr.due.t": "आज सिंचाई करें",
    "irr.due.w": "पिछली सिंचाई को {since} दिन हो गए और सिर्फ़ {rain} मिमी बारिश की उम्मीद है। {crop} के लिए आपका {method} सिस्टम {interval} दिन के चक्र पर है।",
    "irr.next.t": "अगली सिंचाई {due} दिन में",
    "irr.next1.t": "अगली सिंचाई कल",
    "irr.next.w": "पिछली सिंचाई {since} दिन पहले, {interval} दिन के चक्र पर।",

    "dis.safe.t": "{disease} का मौसम है — पर आप अभी सुरक्षित हैं",
    "dis.safe.w": "आगे {wetDays} दिन गीले रहेंगे और नमी {humidity}% से ऊपर, लेकिन {since} दिन पहले के छिड़काव की सुरक्षा अभी लगभग {left} दिन बची है।",
    "dis.nowindow.t": "{disease} का ख़तरा ज़्यादा — अगले 7 दिनों में सूखा मौका नहीं",
    "dis.nowindow.w": "आगे {wetDays} दिन गीले और नम रहेंगे, और मौसम में {hours} घंटे का सूखा अंतर नहीं है।",
    "dis.spray.t": "{day} को {treatment} का छिड़काव करें",
    "dis.spray.w": "{disease} का मौसम बन रहा है ({wetDays} गीले दिन, नमी {humidity}% से ऊपर) और आपकी सुरक्षा ख़त्म हो चुकी है। {day} को लगभग {dryHours} घंटे सूखे रहेंगे — इस हफ़्ते का एकमात्र सही मौका।",
    "dis.expired.t": "{treatment} की सुरक्षा ख़त्म हो गई",
    "dis.expired.w": "आपका पिछला छिड़काव {since} दिन पहले था; सुरक्षा लगभग {days} दिन चलती है।",
    "dis.never.w": "इस मौसम में {disease} के लिए कोई छिड़काव दर्ज नहीं है।",
    "dis.low.t": "{disease} का ख़तरा कम",
    "dis.low.w": "मौसम में सिर्फ़ {wetDays} दिन ही रोग फैलने की स्थिति में हैं।",
    "dis.off.w": "{disease} का मौसम अभी नहीं है।",

    "crop.note.t": "{crop}: जानने लायक बात",
    "cover.t": "{crop} के लिए अभी रोग के नियम नहीं हैं",
    "cover.w": "मंडी भाव, सिंचाई का समय और खर्च का हिसाब सब चलता है। कीट और रोग की सलाह के लिए यह फ़सल जोड़नी होगी।",

    "mkt.off.t": "मंडी भाव चालू नहीं हैं",
    "mkt.off.w": "ऐप के पास सरकारी भाव सेवा की चाबी नहीं है, इसलिए भाव मंगाए ही नहीं गए। बाकी सब कुछ चालू है।",
    "mkt.none.t": "आज {crop} के भाव नहीं हैं",
    "mkt.none.w": "आज आपके राज्य में इस फ़सल का कोई भाव दर्ज नहीं हुआ। भाव दिन भर आते रहते हैं, कुछ मंडियाँ देर से बताती हैं।",
    "mkt.worth.t": "आज आपकी {grade} की कीमत ₹{net} है",
    "mkt.worth.w": "{market} के ₹{price}/क्विंटल भाव पर {qtl} क्विंटल{transport}। कोई और मंडी इतनी आगे नहीं कि ज़्यादा दूरी सही बैठे।",
    "mkt.worth.transport": ", वहाँ पहुँचाने का ₹{cost} घटाकर",
    "mkt.best.t": "{grade} ₹{price}/क्विंटल",
    "mkt.best.w": "आज सबसे अच्छा भाव {market} में है। अपना बचा हुआ माल जोड़ें तो बेचने की सलाह मिलेगी।",
    "sell.move.t": "अपनी {grade} {near} नहीं, {best} ले जाएँ",
    "sell.move.w": "{best} में ₹{bestPrice}/क्विंटल चल रहा है, जबकि {near} में ₹{nearPrice}। {qtl} क्विंटल पर यह ₹{gain} ज़्यादा है, और अतिरिक्त दूरी का भाड़ा लगभग ₹{extra} पड़ेगा।",
    "sell.dated": "{date} के भाव",
    "trend.down.t": "इस हफ़्ते {grade} {pct}% गिरी",
    "trend.down.w": "आपके {qtl} क्विंटल पिछले हफ़्ते से लगभग ₹{loss} कम के हैं। भाव चढ़ने का इंतज़ार करने के बजाय कुछ माल निकालने पर सोचें।",
    "trend.up.t": "इस हफ़्ते {grade} {pct}% चढ़ी",
    "trend.up.w": "रोकना अब तक फ़ायदेमंद रहा। आज {market} में {qtl} क्विंटल के ₹{net} मिलते हैं।",
  },

  kn: {
    "sev.urgent": "ಈಗಲೇ ಮಾಡಿ",
    "sev.act": "ಇಂದು",
    "sev.watch": "ಗಮನಿಸಿ",
    "sev.info": "ಮಾಹಿತಿ",
    "win.today": "ಇಂದು",
    "win.weekly": "ವಾರಕ್ಕೊಮ್ಮೆ",

    "irr.rainfed.t": "ಮಳೆ ಆಶ್ರಿತ — ನೀರು ಹಾಯಿಸುವ ಅಗತ್ಯವಿಲ್ಲ",
    "irr.rainfed.w": "ಮುಂದಿನ 2 ದಿನಗಳಲ್ಲಿ {rain} ಮಿಮೀ ಮಳೆ ನಿರೀಕ್ಷೆ.",
    "irr.skip.t": "ಇಂದು ನೀರು ಹಾಯಿಸಬೇಡಿ",
    "irr.skip.w": "ಮುಂದಿನ 48 ಗಂಟೆಗಳಲ್ಲಿ {rain} ಮಿಮೀ ಮಳೆ ನಿರೀಕ್ಷೆ — ನಿಮ್ಮ {crop}ಗೆ ಬೇಕಾದದ್ದಕ್ಕಿಂತ ಹೆಚ್ಚು.",
    "irr.due.t": "ಇಂದು ನೀರು ಹಾಯಿಸಿ",
    "irr.due.w": "ಕೊನೆಯ ಬಾರಿ ನೀರು ಹಾಯಿಸಿ {since} ದಿನ ಆಯಿತು, ಕೇವಲ {rain} ಮಿಮೀ ಮಳೆ ನಿರೀಕ್ಷೆ. {crop}ಗೆ ನಿಮ್ಮ {method} ವ್ಯವಸ್ಥೆ {interval} ದಿನಗಳ ಚಕ್ರದಲ್ಲಿದೆ.",
    "irr.next.t": "ಮುಂದಿನ ನೀರು {due} ದಿನಗಳಲ್ಲಿ",
    "irr.next1.t": "ಮುಂದಿನ ನೀರು ನಾಳೆ",
    "irr.next.w": "{since} ದಿನಗಳ ಹಿಂದೆ ನೀರು ಹಾಯಿಸಲಾಗಿದೆ, {interval} ದಿನಗಳ ಚಕ್ರ.",

    "dis.safe.t": "{disease} ಹವಾಮಾನವಿದೆ — ಆದರೆ ನೀವು ಇನ್ನೂ ಸುರಕ್ಷಿತ",
    "dis.safe.w": "ಮುಂದೆ {wetDays} ದಿನ ತೇವ ಮತ್ತು ಆರ್ದ್ರತೆ {humidity}% ಮೇಲೆ, ಆದರೆ {since} ದಿನಗಳ ಹಿಂದಿನ ಸಿಂಪರಣೆಯ ರಕ್ಷಣೆ ಸುಮಾರು {left} ದಿನ ಉಳಿದಿದೆ.",
    "dis.nowindow.t": "{disease} ಅಪಾಯ ಹೆಚ್ಚು — ಮುಂದಿನ 7 ದಿನಗಳಲ್ಲಿ ಒಣ ಸಮಯವಿಲ್ಲ",
    "dis.nowindow.w": "ಮುಂದೆ {wetDays} ದಿನ ತೇವ ಮತ್ತು ಆರ್ದ್ರ ಹವಾಮಾನ, ಮತ್ತು {hours} ಗಂಟೆಗಳ ಒಣ ಅವಕಾಶ ಇಲ್ಲ.",
    "dis.spray.t": "{day} ರಂದು {treatment} ಸಿಂಪಡಿಸಿ",
    "dis.spray.w": "{disease} ಹವಾಮಾನ ಬರುತ್ತಿದೆ ({wetDays} ತೇವ ದಿನ, ಆರ್ದ್ರತೆ {humidity}% ಮೇಲೆ) ಮತ್ತು ನಿಮ್ಮ ರಕ್ಷಣೆ ಮುಗಿದಿದೆ. {day} ರಂದು ಸುಮಾರು {dryHours} ಗಂಟೆ ಒಣ — ಈ ವಾರದ ಏಕೈಕ ಅವಕಾಶ.",
    "dis.expired.t": "{treatment} ರಕ್ಷಣೆ ಮುಗಿದಿದೆ",
    "dis.expired.w": "ನಿಮ್ಮ ಕೊನೆಯ ಸಿಂಪರಣೆ {since} ದಿನಗಳ ಹಿಂದೆ; ರಕ್ಷಣೆ ಸುಮಾರು {days} ದಿನ ಇರುತ್ತದೆ.",
    "dis.never.w": "ಈ ಋತುವಿನಲ್ಲಿ {disease}ಗೆ ಯಾವುದೇ ಸಿಂಪರಣೆ ದಾಖಲಾಗಿಲ್ಲ.",
    "dis.low.t": "{disease} ಅಪಾಯ ಕಡಿಮೆ",
    "dis.low.w": "ಹವಾಮಾನದಲ್ಲಿ ಕೇವಲ {wetDays} ದಿನ ಮಾತ್ರ ರೋಗ ಹರಡುವ ಸ್ಥಿತಿಯಲ್ಲಿವೆ.",
    "dis.off.w": "{disease} ಋತು ಈಗ ಅಲ್ಲ.",

    "crop.note.t": "{crop}: ತಿಳಿಯಬೇಕಾದ ಸಂಗತಿ",
    "cover.t": "{crop}ಗೆ ಇನ್ನೂ ರೋಗ ನಿಯಮಗಳಿಲ್ಲ",
    "cover.w": "ಮಾರುಕಟ್ಟೆ ಬೆಲೆ, ನೀರಿನ ಸಮಯ ಮತ್ತು ಖರ್ಚಿನ ಪುಸ್ತಕ ಎಲ್ಲವೂ ಕೆಲಸ ಮಾಡುತ್ತವೆ. ಕೀಟ ಮತ್ತು ರೋಗ ಸಲಹೆಗೆ ಈ ಬೆಳೆಯನ್ನು ಸೇರಿಸಬೇಕು.",

    "mkt.off.t": "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು ಚಾಲನೆಯಲ್ಲಿಲ್ಲ",
    "mkt.off.w": "ಸರ್ಕಾರಿ ಬೆಲೆ ಸೇವೆಗೆ ಕೀ ಇಲ್ಲದ ಕಾರಣ ಬೆಲೆ ಕೇಳಲಾಗಿಲ್ಲ. ಉಳಿದದ್ದೆಲ್ಲ ಚಾಲನೆಯಲ್ಲಿದೆ.",
    "mkt.none.t": "ಇಂದು {crop} ಬೆಲೆ ಇಲ್ಲ",
    "mkt.none.w": "ಇಂದು ನಿಮ್ಮ ರಾಜ್ಯದಲ್ಲಿ ಈ ಬೆಳೆಗೆ ಯಾವುದೇ ಬೆಲೆ ದಾಖಲಾಗಿಲ್ಲ. ಬೆಲೆಗಳು ದಿನವಿಡೀ ಬರುತ್ತವೆ, ಕೆಲವು ಮಂಡಿಗಳು ತಡವಾಗಿ ವರದಿ ಮಾಡುತ್ತವೆ.",
    "mkt.worth.t": "ಇಂದು ನಿಮ್ಮ {grade} ಬೆಲೆ ₹{net}",
    "mkt.worth.w": "{market} ನ ₹{price}/ಕ್ವಿಂಟಾಲ್ ದರದಲ್ಲಿ {qtl} ಕ್ವಿಂಟಾಲ್{transport}. ಬೇರೆ ಯಾವ ಮಂಡಿಯೂ ಹೆಚ್ಚು ದೂರ ಹೋಗುವಷ್ಟು ಮುಂದಿಲ್ಲ.",
    "mkt.worth.transport": ", ಅಲ್ಲಿಗೆ ತಲುಪಿಸಲು ₹{cost} ಕಳೆದು",
    "mkt.best.t": "{grade} ₹{price}/ಕ್ವಿಂಟಾಲ್",
    "mkt.best.w": "ಇಂದು ಅತ್ಯುತ್ತಮ ದರ {market} ನಲ್ಲಿದೆ. ನಿಮ್ಮ ಉಳಿದ ದಾಸ್ತಾನು ಸೇರಿಸಿದರೆ ಮಾರಾಟದ ಸಲಹೆ ಸಿಗುತ್ತದೆ.",
    "sell.move.t": "ನಿಮ್ಮ {grade} {near} ಗೆ ಅಲ್ಲ, {best} ಗೆ ಒಯ್ಯಿರಿ",
    "sell.move.w": "{best} ನಲ್ಲಿ ₹{bestPrice}/ಕ್ವಿಂಟಾಲ್, {near} ನಲ್ಲಿ ₹{nearPrice}. {qtl} ಕ್ವಿಂಟಾಲ್‌ಗೆ ಇದು ₹{gain} ಹೆಚ್ಚು, ಹೆಚ್ಚುವರಿ ದೂರಕ್ಕೆ ಸುಮಾರು ₹{extra} ಸಾಗಾಣಿಕೆ ವೆಚ್ಚ.",
    "sell.dated": "{date} ರ ಬೆಲೆಗಳು",
    "trend.down.t": "ಈ ವಾರ {grade} {pct}% ಇಳಿದಿದೆ",
    "trend.down.w": "ನಿಮ್ಮ {qtl} ಕ್ವಿಂಟಾಲ್ ಕಳೆದ ವಾರಕ್ಕಿಂತ ಸುಮಾರು ₹{loss} ಕಡಿಮೆ. ಬೆಲೆ ಏರುವುದನ್ನು ಕಾಯುವ ಬದಲು ಸ್ವಲ್ಪ ಮಾರಾಟ ಮಾಡುವುದನ್ನು ಪರಿಗಣಿಸಿ.",
    "trend.up.t": "ಈ ವಾರ {grade} {pct}% ಏರಿದೆ",
    "trend.up.w": "ಇಟ್ಟುಕೊಂಡಿದ್ದು ಇಲ್ಲಿಯವರೆಗೆ ಲಾಭದಾಯಕ. ಇಂದು {market} ನಲ್ಲಿ {qtl} ಕ್ವಿಂಟಾಲ್‌ಗೆ ₹{net} ಸಿಗುತ್ತದೆ.",
  },

  mr: {
    "sev.urgent": "आत्ताच करा",
    "sev.act": "आज",
    "sev.watch": "लक्ष ठेवा",
    "sev.info": "माहिती",
    "win.today": "आज",
    "win.weekly": "दर आठवड्याला",

    "irr.rainfed.t": "पावसावर अवलंबून — पाणी देण्याची गरज नाही",
    "irr.rainfed.w": "पुढील 2 दिवसांत {rain} मिमी पाऊस अपेक्षित आहे.",
    "irr.skip.t": "आज पाणी देऊ नका",
    "irr.skip.w": "पुढील 48 तासांत {rain} मिमी पाऊस अपेक्षित आहे — तुमच्या {crop} ला लागतो त्यापेक्षा जास्त.",
    "irr.due.t": "आज पाणी द्या",
    "irr.due.w": "शेवटच्या पाण्याला {since} दिवस झाले आणि फक्त {rain} मिमी पाऊस अपेक्षित आहे. {crop} साठी तुमची {method} पद्धत {interval} दिवसांच्या चक्रावर आहे.",
    "irr.next.t": "पुढील पाणी {due} दिवसांत",
    "irr.next1.t": "पुढील पाणी उद्या",
    "irr.next.w": "शेवटचे पाणी {since} दिवसांपूर्वी, {interval} दिवसांच्या चक्रावर.",

    "dis.safe.t": "{disease} चे हवामान आहे — पण तुम्ही अजून सुरक्षित आहात",
    "dis.safe.w": "पुढे {wetDays} दिवस ओले राहतील आणि आर्द्रता {humidity}% वर, पण {since} दिवसांपूर्वीच्या फवारणीचे संरक्षण अजून सुमारे {left} दिवस आहे.",
    "dis.nowindow.t": "{disease} चा धोका जास्त — पुढील 7 दिवसांत कोरडी संधी नाही",
    "dis.nowindow.w": "पुढे {wetDays} दिवस ओले आणि दमट हवामान, आणि {hours} तासांची कोरडी संधी हवामानात नाही.",
    "dis.spray.t": "{day} रोजी {treatment} फवारा",
    "dis.spray.w": "{disease} चे हवामान तयार होत आहे ({wetDays} ओले दिवस, आर्द्रता {humidity}% वर) आणि तुमचे संरक्षण संपले आहे. {day} रोजी सुमारे {dryHours} तास कोरडे — या आठवड्यातील एकमेव योग्य संधी.",
    "dis.expired.t": "{treatment} चे संरक्षण संपले",
    "dis.expired.w": "तुमची शेवटची फवारणी {since} दिवसांपूर्वी होती; संरक्षण सुमारे {days} दिवस टिकते.",
    "dis.never.w": "या हंगामात {disease} साठी कोणतीही फवारणी नोंदलेली नाही.",
    "dis.low.t": "{disease} चा धोका कमी",
    "dis.low.w": "हवामानात फक्त {wetDays} दिवसच रोग पसरण्याच्या स्थितीत आहेत.",
    "dis.off.w": "{disease} चा हंगाम सध्या नाही.",

    "crop.note.t": "{crop}: जाणून घेण्यासारखे",
    "cover.t": "{crop} साठी अजून रोगाचे नियम नाहीत",
    "cover.w": "बाजारभाव, पाण्याची वेळ आणि खर्चाची नोंद सर्व चालते. कीड आणि रोगाच्या सल्ल्यासाठी हे पीक जोडावे लागेल.",

    "mkt.off.t": "बाजारभाव चालू नाहीत",
    "mkt.off.w": "अॅपकडे सरकारी भाव सेवेची किल्ली नाही, त्यामुळे भाव मागवलेच नाहीत. बाकी सर्व चालू आहे.",
    "mkt.none.t": "आज {crop} चे भाव नाहीत",
    "mkt.none.w": "आज तुमच्या राज्यात या पिकाचा कोणताही भाव नोंदला गेला नाही. भाव दिवसभर येत राहतात, काही बाजार समित्या उशिरा कळवतात.",
    "mkt.worth.t": "आज तुमच्या {grade} ची किंमत ₹{net} आहे",
    "mkt.worth.w": "{market} च्या ₹{price}/क्विंटल भावाने {qtl} क्विंटल{transport}. दुसरी कोणतीही बाजार समिती जास्त अंतर परवडेल इतकी पुढे नाही.",
    "mkt.worth.transport": ", तिथे पोहोचवण्याचे ₹{cost} वजा करून",
    "mkt.best.t": "{grade} ₹{price}/क्विंटल",
    "mkt.best.w": "आज सर्वोत्तम भाव {market} मध्ये आहे. तुमचा शिल्लक माल नोंदवा म्हणजे विक्रीचा सल्ला मिळेल.",
    "sell.move.t": "तुमची {grade} {near} ला नको, {best} ला न्या",
    "sell.move.w": "{best} मध्ये ₹{bestPrice}/क्विंटल चालू आहे, तर {near} मध्ये ₹{nearPrice}. {qtl} क्विंटलवर हे ₹{gain} जास्त आहे, आणि जास्तीच्या अंतराचे भाडे सुमारे ₹{extra} पडेल.",
    "sell.dated": "{date} चे भाव",
    "trend.down.t": "या आठवड्यात {grade} {pct}% घसरली",
    "trend.down.w": "तुमचे {qtl} क्विंटल गेल्या आठवड्यापेक्षा सुमारे ₹{loss} कमी आहेत. भाव वाढण्याची वाट पाहण्याऐवजी काही माल काढण्याचा विचार करा.",
    "trend.up.t": "या आठवड्यात {grade} {pct}% वाढली",
    "trend.up.w": "थांबणे आतापर्यंत फायद्याचे ठरले. आज {market} मध्ये {qtl} क्विंटलचे ₹{net} मिळतात.",
  },
};

/**
 * Fill a template. Missing keys fall back to English rather than rendering the
 * raw key at a farmer — a half-translated sentence is still readable, a bare
 * "dis.spray.t" is not.
 */
export function msg(lang: Lang, key: string, params: Params = {}): string {
  const template = TEMPLATES[lang]?.[key] ?? TEMPLATES.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] === undefined ? "" : String(params[name]),
  );
}
