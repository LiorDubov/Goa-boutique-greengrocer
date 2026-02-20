// ============================================================
// GOA Boutique — Firebase Product Seed Script
// הרץ אותו פעם אחת כדי להעלות את כל המוצרים ל-Firebase
// Usage: node seed_products.js
// ============================================================

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyClEGJ71kv39LIGTthR8Yua9DwWLqjs-YY",
  authDomain: "goa-boutique-greengrocer.firebaseapp.com",
  projectId: "goa-boutique-greengrocer",
  storageBucket: "goa-boutique-greengrocer.firebasestorage.app",
  messagingSenderId: "346864761258",
  appId: "1:346864761258:web:bb72c3f870e8194e1f53d3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const PRODUCTS_COL = collection(db, "artifacts/goa-boutique-prod/public/data/products");

// ============================================================
// רשימת כל המוצרים
// ============================================================
const PRODUCTS = [

  // ═══ ירקות ═══
  { id:1,  n:{he:"עגבנייה",         en:"Tomato"},             price:17.9, u:"perKg",   cat:"vegetables", img:"🍅", o:{he:"ישראל",en:"Israel"},         stock:50, pop:true },
  { id:2,  n:{he:"מלפפון",          en:"Cucumber"},           price:13.9, u:"perKg",   cat:"vegetables", img:"🥒", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:3,  n:{he:"פלפל גמבה",       en:"Bell Pepper"},        price:18.9, u:"perKg",   cat:"vegetables", img:"🫑", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:4,  n:{he:"שושקה",           en:"Shushka Pepper"},     price:29.9, u:"perKg",   cat:"vegetables", img:"🌶️", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:5,  n:{he:"חריף",            en:"Hot Pepper"},         price:19.9, u:"perKg",   cat:"vegetables", img:"🌶️", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:6,  n:{he:"זוקיני",          en:"Zucchini"},           price:19.9, u:"perKg",   cat:"vegetables", img:"🥬", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:7,  n:{he:"בטטה",            en:"Sweet Potato"},       price:19.9, u:"perKg",   cat:"vegetables", img:"🍠", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:8,  n:{he:"חציל",            en:"Eggplant"},           price:15.9, u:"perKg",   cat:"vegetables", img:"🍆", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:9,  n:{he:"קישוא",           en:"Squash"},             price:16.9, u:"perKg",   cat:"vegetables", img:"🥦", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:10, n:{he:"צנון",            en:"Radish"},             price:14.9, u:"perKg",   cat:"vegetables", img:"🌱", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:11, n:{he:"קולורבי",         en:"Kohlrabi"},           price:14.9, u:"perKg",   cat:"vegetables", img:"🥦", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:12, n:{he:"סלק",             en:"Beet"},               price:9.9,  u:"perKg",   cat:"vegetables", img:"🟣", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:13, n:{he:"בצל יבש",         en:"Onion"},              price:9.9,  u:"perKg",   cat:"vegetables", img:"🧅", o:{he:"ישראל",en:"Israel"},         stock:50, pop:true },
  { id:14, n:{he:"תפוח אדמה תפזורת",en:"Potato"},            price:9.9,  u:"perKg",   cat:"vegetables", img:"🥔", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:15, n:{he:"כרוב",            en:"Cabbage"},            price:10.9, u:"perKg",   cat:"vegetables", img:"🥬", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:16, n:{he:"גזר",             en:"Carrot"},             price:10.9, u:"perKg",   cat:"vegetables", img:"🥕", o:{he:"ישראל",en:"Israel"},         stock:50, pop:true },
  { id:17, n:{he:"באטר (תפוח אדמה)",en:"Butter Potato"},     price:11.9, u:"perKg",   cat:"vegetables", img:"🥔", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:18, n:{he:"דלורית",          en:"Butternut Squash"},   price:12.9, u:"perKg",   cat:"vegetables", img:"🎃", o:{he:"ישראל",en:"Israel"},         stock:50, seasonal:true },
  { id:19, n:{he:"עגבנית מגי",      en:"Magi Tomato"},        price:29.9, u:"perKg",   cat:"vegetables", img:"🍅", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:20, n:{he:"ארטישוק",         en:"Artichoke"},          price:29.9, u:"perKg",   cat:"vegetables", img:"🌻", o:{he:"ישראל",en:"Israel"},         stock:50, seasonal:true },
  { id:21, n:{he:"שום תפזורת",      en:"Garlic"},             price:29.9, u:"perKg",   cat:"vegetables", img:"🧄", o:{he:"ישראל",en:"Israel"},         stock:50, pop:true },

  // ═══ פירות ═══
  { id:22, n:{he:"אבוקדו אטינגר",   en:"Avocado Ettinger"},   price:19.9, u:"perKg",   cat:"fruits",     img:"🥑", o:{he:"צפון הארץ",en:"Northern Israel"}, stock:50, pop:true },
  { id:23, n:{he:"אבוקדו האס",       en:"Avocado Hass"},       price:23.9, u:"perKg",   cat:"fruits",     img:"🥑", o:{he:"צפון הארץ",en:"Northern Israel"}, stock:50 },
  { id:24, n:{he:"מלון",             en:"Melon"},              price:15.9, u:"perKg",   cat:"fruits",     img:"🍈", o:{he:"ישראל",en:"Israel"},         stock:50, seasonal:true },
  { id:25, n:{he:"אבטיח",            en:"Watermelon"},         price:12.9, u:"perKg",   cat:"fruits",     img:"🍉", o:{he:"ישראל",en:"Israel"},         stock:50, seasonal:true },
  { id:26, n:{he:"תפוז",             en:"Orange"},             price:14.9, u:"perKg",   cat:"fruits",     img:"🍊", o:{he:"עמק השרון",en:"Sharon Valley"}, stock:50 },
  { id:27, n:{he:"פומלה",            en:"Pomelo"},             price:14.9, u:"perKg",   cat:"fruits",     img:"🍋", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:28, n:{he:"אשכולית אדומה",    en:"Red Grapefruit"},     price:14.9, u:"perKg",   cat:"fruits",     img:"🍊", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:29, n:{he:"בננה",             en:"Banana"},             price:14.9, u:"perKg",   cat:"fruits",     img:"🍌", o:{he:"בקעת הירדן",en:"Jordan Valley"}, stock:50, pop:true },
  { id:30, n:{he:"רימון",            en:"Pomegranate"},        price:23.9, u:"perKg",   cat:"fruits",     img:"🍎", o:{he:"גליל עליון",en:"Upper Galilee"}, stock:50, seasonal:true },
  { id:31, n:{he:"תפוח פינק ליידי",  en:"Pink Lady Apple"},    price:23.9, u:"perKg",   cat:"fruits",     img:"🍎", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:32, n:{he:"לימון",            en:"Lemon"},              price:19.9, u:"perKg",   cat:"fruits",     img:"🍋", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:33, n:{he:"פומלית",           en:"Oroblanco"},          price:9.9,  u:"perKg",   cat:"fruits",     img:"🍋", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:34, n:{he:"תפוז ברשת",        en:"Net Oranges"},        price:9.9,  u:"perKg",   cat:"fruits",     img:"🍊", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:35, n:{he:"אגס",              en:"Pear"},               price:29.9, u:"perKg",   cat:"fruits",     img:"🍐", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:36, n:{he:"שרי (פירות יער)",  en:"Mixed Berries"},      price:34.9, u:"perKg",   cat:"fruits",     img:"🫐", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:37, n:{he:"אפרסמון",          en:"Persimmon"},          price:34.9, u:"perKg",   cat:"fruits",     img:"🍊", o:{he:"ישראל",en:"Israel"},         stock:50, seasonal:true },
  { id:38, n:{he:"קיווי ירוק",       en:"Green Kiwi"},         price:34.9, u:"perKg",   cat:"fruits",     img:"🥝", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:39, n:{he:"פפאיה",            en:"Papaya"},             price:34.9, u:"perKg",   cat:"fruits",     img:"🍈", o:{he:"הערבה",en:"Arava"},          stock:50 },
  { id:40, n:{he:"קיווי צהוב",       en:"Yellow Kiwi"},        price:46.9, u:"perKg",   cat:"fruits",     img:"🥝", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:41, n:{he:"תמר מג'הול 500 גר'",en:"Medjool Dates 500g"},price:25.9, u:"perUnit", cat:"fruits",     img:"🌴", o:{he:"בקעת הירדן",en:"Jordan Valley"}, stock:50, pop:true, organic:true },
  { id:42, n:{he:"תות שדה",          en:"Strawberries"},       price:30,   u:"perUnit", cat:"fruits",     img:"🍓", o:{he:"ישראל",en:"Israel"},         stock:50, pop:true, seasonal:true },

  // ═══ ירוקים ומארזים ═══
  { id:43, n:{he:"עשבי תיבול טריים",  en:"Fresh Herbs"},        price:4,    u:"perUnit", cat:"herbs",      img:"🌿", o:{he:"חווה מקומית",en:"Local Farm"}, stock:100, pop:true },
  { id:44, n:{he:"נענע",              en:"Fresh Mint"},          price:4,    u:"perUnit", cat:"herbs",      img:"🍃", o:{he:"חווה מקומית",en:"Local Farm"}, stock:50 },
  { id:45, n:{he:"שמיר",              en:"Fresh Dill"},          price:4,    u:"perUnit", cat:"herbs",      img:"🌿", o:{he:"חווה מקומית",en:"Local Farm"}, stock:50 },
  { id:46, n:{he:"פטרוזיליה",         en:"Parsley"},             price:4,    u:"perUnit", cat:"herbs",      img:"🌿", o:{he:"חווה מקומית",en:"Local Farm"}, stock:50 },
  { id:47, n:{he:"כוסברה",            en:"Cilantro"},            price:4,    u:"perUnit", cat:"herbs",      img:"🌿", o:{he:"חווה מקומית",en:"Local Farm"}, stock:50 },
  { id:48, n:{he:"מנגולד",            en:"Swiss Chard"},         price:10,   u:"perUnit", cat:"vegetables", img:"🥬", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:49, n:{he:"בצל ירוק",          en:"Spring Onion"},        price:10,   u:"perUnit", cat:"vegetables", img:"🌱", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:50, n:{he:"ראש סלרי",          en:"Celery"},              price:10,   u:"perUnit", cat:"vegetables", img:"🌿", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:51, n:{he:"כרישה",             en:"Leek"},                price:11.9, u:"perUnit", cat:"vegetables", img:"🌱", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:52, n:{he:"שורש פטרוזיליה",    en:"Parsley Root"},        price:11.9, u:"perUnit", cat:"vegetables", img:"🌱", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:53, n:{he:"פלפל בייבי",        en:"Baby Peppers"},        price:12,   u:"perUnit", cat:"vegetables", img:"🫑", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:54, n:{he:"בצל שאלוט",         en:"Shallots"},            price:12,   u:"perUnit", cat:"vegetables", img:"🧅", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:55, n:{he:"שום קלוף",          en:"Peeled Garlic"},       price:12.9, u:"perUnit", cat:"vegetables", img:"🧄", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:56, n:{he:"תפוח אדמה למיקרו",  en:"Microwave Potato"},    price:12.9, u:"perUnit", cat:"vegetables", img:"🥔", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:57, n:{he:"שורש סלרי נקי",     en:"Celeriac"},            price:14.9, u:"perUnit", cat:"vegetables", img:"🥬", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:58, n:{he:"ברוקולי",           en:"Broccoli"},            price:15,   u:"perUnit", cat:"vegetables", img:"🥦", o:{he:"ישראל",en:"Israel"},         stock:50, pop:true },
  { id:59, n:{he:"תרד",               en:"Spinach"},             price:15,   u:"perUnit", cat:"vegetables", img:"🥬", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:60, n:{he:"רוקולה",            en:"Arugula"},             price:15,   u:"perUnit", cat:"vegetables", img:"🥬", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:61, n:{he:"חסה קיסר",          en:"Caesar Lettuce"},      price:15,   u:"perUnit", cat:"vegetables", img:"🥬", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:62, n:{he:"פטריות",            en:"Mushrooms"},           price:15,   u:"perUnit", cat:"vegetables", img:"🍄", o:{he:"ישראל",en:"Israel"},         stock:50, pop:true },
  { id:63, n:{he:"כרובית",            en:"Cauliflower"},         price:16,   u:"perUnit", cat:"vegetables", img:"🥦", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:64, n:{he:"ארטישוק ירושלמי",   en:"Jerusalem Artichoke"}, price:21.9, u:"perUnit", cat:"vegetables", img:"🌻", o:{he:"ישראל",en:"Israel"},         stock:50, seasonal:true },
  { id:65, n:{he:"אפונת שלג",         en:"Snow Peas"},           price:24.9, u:"perUnit", cat:"vegetables", img:"🫛", o:{he:"ישראל",en:"Israel"},         stock:50 },

  // ═══ תבלינים (פרג) ═══
  { id:66, n:{he:"מלח לימון פרג",      en:"Lemon Salt"},          price:12,   u:"perUnit", cat:"herbs",      img:"🫙", o:{he:"פרג",en:"Parag"},           stock:50 },
  { id:67, n:{he:"מלח הימלאיה פרג",    en:"Himalayan Salt"},      price:12,   u:"perUnit", cat:"herbs",      img:"🫙", o:{he:"פרג",en:"Parag"},           stock:50 },
  { id:68, n:{he:"כורכום טחון פרג",    en:"Ground Turmeric"},     price:12,   u:"perUnit", cat:"herbs",      img:"🟡", o:{he:"פרג",en:"Parag"},           stock:50 },
  { id:69, n:{he:"פפריקה מתוקה פרג",   en:"Sweet Paprika"},       price:12,   u:"perUnit", cat:"herbs",      img:"🫙", o:{he:"פרג",en:"Parag"},           stock:50 },
  { id:70, n:{he:"קינמון טחון פרג",    en:"Ground Cinnamon"},     price:12,   u:"perUnit", cat:"herbs",      img:"🫙", o:{he:"פרג",en:"Parag"},           stock:50 },
  { id:71, n:{he:"קארי הודי פרג",      en:"Indian Curry"},        price:12,   u:"perUnit", cat:"herbs",      img:"🫙", o:{he:"פרג",en:"Parag"},           stock:50 },
  { id:72, n:{he:"פלפל שחור טחון פרג", en:"Black Pepper"},        price:12,   u:"perUnit", cat:"herbs",      img:"🫙", o:{he:"פרג",en:"Parag"},           stock:50 },
  { id:73, n:{he:"זעתר בלאדי פרג",     en:"Za'atar Baladi"},      price:12,   u:"perUnit", cat:"herbs",      img:"🌿", o:{he:"פרג",en:"Parag"},           stock:50, pop:true },
  { id:74, n:{he:"שום גבישי פרג",      en:"Garlic Granules"},     price:12,   u:"perUnit", cat:"herbs",      img:"🫙", o:{he:"פרג",en:"Parag"},           stock:50 },
  { id:75, n:{he:"בהרט לקובה פרג",     en:"Baharat Spice"},       price:12,   u:"perUnit", cat:"herbs",      img:"🫙", o:{he:"פרג",en:"Parag"},           stock:50 },
  { id:76, n:{he:"ראס אל חנות פרג",    en:"Ras El Hanout"},       price:12,   u:"perUnit", cat:"herbs",      img:"🫙", o:{he:"פרג",en:"Parag"},           stock:50 },
  { id:77, n:{he:"חוויג' למרק פרג",    en:"Hawaij for Soup"},     price:12,   u:"perUnit", cat:"herbs",      img:"🫙", o:{he:"פרג",en:"Parag"},           stock:50 },
  { id:78, n:{he:"תבלין לעוף בגריל",   en:"Grill Chicken Spice"}, price:12,   u:"perUnit", cat:"herbs",      img:"🫙", o:{he:"פרג",en:"Parag"},           stock:50 },
  { id:79, n:{he:"תבלין פוטטו פרג",    en:"Potato Spice"},        price:12,   u:"perUnit", cat:"herbs",      img:"🫙", o:{he:"פרג",en:"Parag"},           stock:50 },

  // ═══ מזווה, שימורים וכבושים ═══
  { id:80, n:{he:"מלפפון חמוץ",        en:"Pickled Cucumber"},    price:18,   u:"perUnit", cat:"pantry",     img:"🥒", o:{he:"ישראל",en:"Israel"},         stock:50, pop:true },
  { id:81, n:{he:"זיתים כבושים",       en:"Pickled Olives"},      price:18,   u:"perUnit", cat:"pantry",     img:"🫒", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:82, n:{he:"כרובית כבושה",       en:"Pickled Cauliflower"}, price:18,   u:"perUnit", cat:"pantry",     img:"🥦", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:83, n:{he:"חציל בייבי כבוש",    en:"Pickled Baby Eggplant"},price:22,  u:"perUnit", cat:"pantry",     img:"🍆", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:84, n:{he:"קטשופ היינץ",        en:"Heinz Ketchup"},       price:22,   u:"perUnit", cat:"pantry",     img:"🍅", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:85, n:{he:"טבסקו",              en:"Tabasco"},             price:18,   u:"perUnit", cat:"pantry",     img:"🌶️", o:{he:"מיובא",en:"Imported"},      stock:50 },
  { id:86, n:{he:"רוטב עגבניות ברילה", en:"Barilla Pasta Sauce"}, price:22,   u:"perUnit", cat:"pantry",     img:"🍝", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:87, n:{he:"רוטב סויה מופחת",    en:"Low Sodium Soy Sauce"},price:18,   u:"perUnit", cat:"pantry",     img:"🫙", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:88, n:{he:"טריאקי קיקומן",      en:"Kikkoman Teriyaki"},   price:22,   u:"perUnit", cat:"pantry",     img:"🫙", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:89, n:{he:"שמן שומשום",         en:"Sesame Oil"},          price:22,   u:"perUnit", cat:"pantry",     img:"🫙", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:90, n:{he:"קרם קוקוס",          en:"Coconut Cream"},       price:12,   u:"perUnit", cat:"pantry",     img:"🥥", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:91, n:{he:"קוסקוס",             en:"Couscous"},            price:14,   u:"perUnit", cat:"pantry",     img:"🌾", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:92, n:{he:"גרגרי חומוס",        en:"Chickpeas"},           price:12,   u:"perUnit", cat:"pantry",     img:"🫘", o:{he:"ישראל",en:"Israel"},         stock:50, pop:true },
  { id:93, n:{he:"שיבולת שועל",        en:"Oats"},                price:14,   u:"perUnit", cat:"pantry",     img:"🌾", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:94, n:{he:"טונה סטארקיסט",      en:"StarKist Tuna"},       price:16,   u:"perUnit", cat:"pantry",     img:"🐟", o:{he:"מיובא",en:"Imported"},       stock:50, pop:true },
  { id:95, n:{he:"טונה אורטיז",        en:"Ortiz Tuna"},          price:32,   u:"perUnit", cat:"pantry",     img:"🐟", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:96, n:{he:"סרדינים",            en:"Sardines"},            price:14,   u:"perUnit", cat:"pantry",     img:"🐟", o:{he:"מיובא",en:"Imported"},       stock:50 },

  // ═══ שמנים, מוצרי יסוד ושתייה ═══
  { id:97,  n:{he:"שמן זית אליעד",      en:"Elyad Olive Oil"},     price:48,   u:"perUnit", cat:"pantry",     img:"🫒", o:{he:"ישראל",en:"Israel"},         stock:50, pop:true },
  { id:98,  n:{he:"שמן חמניות",         en:"Sunflower Oil"},       price:18,   u:"perUnit", cat:"pantry",     img:"🌻", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:99,  n:{he:"דבש טהור",           en:"Pure Honey"},          price:38,   u:"perUnit", cat:"pantry",     img:"🍯", o:{he:"ישראל",en:"Israel"},         stock:50, pop:true },
  { id:100, n:{he:"סילאן",              en:"Date Syrup"},          price:28,   u:"perUnit", cat:"pantry",     img:"🍯", o:{he:"בקעת הירדן",en:"Jordan Valley"}, stock:50 },
  { id:101, n:{he:"סירופ מייפל",        en:"Maple Syrup"},         price:42,   u:"perUnit", cat:"pantry",     img:"🍁", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:102, n:{he:"חמאת בוטנים טבעית", en:"Natural Peanut Butter"},price:28,  u:"perUnit", cat:"pantry",     img:"🥜", o:{he:"מיובא",en:"Imported"},       stock:50, pop:true },
  { id:103, n:{he:"ביצי חופש כתום 15 יח'",en:"Free Range Eggs x15"},price:28, u:"perUnit", cat:"dairy",      img:"🥚", o:{he:"משק קיבוצי",en:"Kibbutz Farm"}, stock:50, pop:true },
  { id:104, n:{he:"טחינה הר בראכה",     en:"Har Bracha Tahini"},   price:28,   u:"perUnit", cat:"pantry",     img:"🫙", o:{he:"שכם",en:"Nablus"},           stock:50, pop:true },
  { id:105, n:{he:"פסטו",               en:"Pesto"},               price:22,   u:"perUnit", cat:"pantry",     img:"🌿", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:106, n:{he:"אריסה",              en:"Harissa"},             price:18,   u:"perUnit", cat:"pantry",     img:"🌶️", o:{he:"ישראל",en:"Israel"},        stock:50 },
  { id:107, n:{he:"סחוג ירוק",          en:"Green Schug"},         price:14,   u:"perUnit", cat:"pantry",     img:"🌿", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:108, n:{he:"מיץ רימון טבעי",     en:"Natural Pomegranate Juice"},price:28,u:"perUnit",cat:"pantry",   img:"🥤", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:109, n:{he:"מי קוקוס",           en:"Coconut Water"},       price:18,   u:"perUnit", cat:"pantry",     img:"🥥", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:110, n:{he:"מאצ'ה",              en:"Matcha"},              price:48,   u:"perUnit", cat:"pantry",     img:"🍵", o:{he:"מיובא",en:"Japan"},           stock:50 },
  { id:111, n:{he:"שיבולת שועל בריסטה", en:"Oat Milk Barista"},   price:22,   u:"perUnit", cat:"pantry",     img:"🥛", o:{he:"מיובא",en:"Imported"},       stock:50 },

  // ═══ פיצוחים וחטיפים ═══
  { id:112, n:{he:"פקאן",               en:"Pecans"},              price:65,   u:"perKg",   cat:"pantry",     img:"🌰", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:113, n:{he:"פיסטוק",             en:"Pistachios"},          price:72,   u:"perKg",   cat:"pantry",     img:"🌰", o:{he:"מיובא",en:"Imported"},       stock:50, pop:true },
  { id:114, n:{he:"קשיו קלוי",          en:"Roasted Cashews"},     price:58,   u:"perKg",   cat:"pantry",     img:"🥜", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:115, n:{he:"שקד קלוף",           en:"Peeled Almonds"},      price:55,   u:"perKg",   cat:"pantry",     img:"🥜", o:{he:"מיובא",en:"Imported"},       stock:50 },
  { id:116, n:{he:"בוטנים",             en:"Peanuts"},             price:18,   u:"perKg",   cat:"pantry",     img:"🥜", o:{he:"ישראל",en:"Israel"},         stock:50 },
  { id:117, n:{he:"מגש תמרים",          en:"Date Platter"},        price:55,   u:"perUnit", cat:"pantry",     img:"🌴", o:{he:"בקעת הירדן",en:"Jordan Valley"}, stock:30, pop:true },
  { id:118, n:{he:"חטיף אצות",          en:"Seaweed Snack"},       price:12,   u:"perUnit", cat:"pantry",     img:"🌊", o:{he:"מיובא",en:"Japan"},           stock:50 },
  { id:119, n:{he:"עוגיות עבאדי",       en:"Abadi Cookies"},       price:22,   u:"perUnit", cat:"pantry",     img:"🍪", o:{he:"ישראל",en:"Israel"},         stock:50 },
];

// ============================================================
// הרצת הסקריפט
// ============================================================
async function seedProducts() {
  console.log("🔄 מוחק מוצרים קיימים מ-Firebase...");
  const existing = await getDocs(PRODUCTS_COL);
  const deletePromises = existing.docs.map(d => deleteDoc(d.ref));
  await Promise.all(deletePromises);
  console.log(`🗑️  נמחקו ${existing.docs.length} מוצרים קיימים`);

  console.log("⬆️  מעלה מוצרים חדשים...");
  let count = 0;
  for (const product of PRODUCTS) {
    await addDoc(PRODUCTS_COL, product);
    count++;
    process.stdout.write(`\r✅ הועלו ${count}/${PRODUCTS.length} מוצרים`);
  }

  console.log(`\n🎉 הושלם! ${count} מוצרים הועלו ל-Firebase בהצלחה.`);
  process.exit(0);
}

seedProducts().catch(err => {
  console.error("❌ שגיאה:", err);
  process.exit(1);
});
