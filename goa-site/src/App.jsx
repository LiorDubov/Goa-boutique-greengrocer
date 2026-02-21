import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./goa.css";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, increment, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

/* ═══ FIREBASE INIT ═══ */
const firebaseConfig = {
  apiKey: "AIzaSyClEGJ71kv39LIGTthR8Yua9DwWLqjs-YY",
  authDomain: "goa-boutique-greengrocer.firebaseapp.com",
  projectId: "goa-boutique-greengrocer",
  storageBucket: "goa-boutique-greengrocer.firebasestorage.app",
  messagingSenderId: "346864761258",
  appId: "1:346864761258:web:bb72c3f870e8194e1f53d3",
  measurementId: "G-YDLPET8TBK"
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);
const storage = getStorage(fbApp);
const PRODUCTS_COL = collection(db, "artifacts/goa-boutique-prod/public/data/products");
const ORDERS_COL = collection(db, "artifacts/goa-boutique-prod/public/data/orders");
const CATEGORIES_COL = collection(db, "artifacts/goa-boutique-prod/public/data/categories");
const prodDoc = (id) => doc(db, "artifacts/goa-boutique-prod/public/data/products", String(id));
const orderDoc = (id) => doc(db, "artifacts/goa-boutique-prod/public/data/orders", id);
const catDoc = (id) => doc(db, "artifacts/goa-boutique-prod/public/data/categories", id);

/* ═══ CONFIG ═══ */
const WA_PHONE = "972504445272";
// Stripe — set your publishable key here (starts with pk_live_ or pk_test_)
// Also set STRIPE_PAYMENT_LINK to a Stripe Payment Link URL you created in the dashboard
// e.g. "https://buy.stripe.com/xxxx"
const STRIPE_PK = "";   // leave empty to disable Stripe
const STRIPE_LINK = ""; // your Stripe Payment Link base URL
const ADMIN_PIN = "1234";
const EMP_PIN = "5678";
/* LS helper kept for non-critical data (user prefs) */
const LS = (k,v) => { try { if(v!==undefined) localStorage.setItem(k,JSON.stringify(v)); const s=localStorage.getItem(k); return s?JSON.parse(s):null; } catch{ return null; } };

/* ═══ i18n ═══ */
const T = {
  en: {
    nav:{home:"Home",shop:"Shop",subscriptions:"Subscriptions",loyalty:"Rewards",about:"About",orders:"My Orders",login:"Login",logout:"Logout",profile:"Profile"},
    hero:{subtitle:"BOUTIQUE GREENGROCER",tagline:"Where Nature Meets Luxury",cta:"Explore Collection",since:"King George 31, Tel Aviv"},
    banner:"Free delivery on orders over ₪250 · New weekly subscription boxes available",
    categories:{all:"All",fruits:"Fruits",vegetables:"Vegetables",herbs:"Herbs & Spices",dairy:"Dairy & Eggs",pantry:"Pantry",organic:"Organic"},
    product:{add:"Add",added:"✓",notes:"Special requests...",perKg:"/kg",perUnit:"/unit",perPack:"/pack",oos:"Out of Stock"},
    cart:{title:"Your Selection",empty:"Your cart is empty",emptyMsg:"Browse our collection and add your favorites",subtotal:"Subtotal",delivery:"Delivery",total:"Total",checkout:"Proceed to Checkout",minimum:"Minimum order ₪100",belowMin:"Add ₪{n} more to reach minimum",deliveryDate:"Delivery Date",timeSlot:"Time Slot",morning:"Morning (8–12)",afternoon:"Afternoon (12–17)",evening:"Evening (17–21)",cash:"Cash on Delivery",card:"Pay Online",payMethod:"Payment",placeOrder:"Place Order",freeOver:"Free over ₪250",back:"Back to Cart",items:"items",yourOrder:"Your Order",contact:"Contact Details",name:"Full Name",phone:"Phone Number",email:"Email (optional)",address:"Delivery Address",addressHint:"Street, building, apartment, floor",orderNote:"Order Notes (optional)",pickup:"Self Pickup",pickupNote:"Pickup from store: King George 31, Tel Aviv",deliveryMethod:"Delivery Method",deliver:"Home Delivery"},
    sub:{title:"Weekly Baskets",subtitle:"Curated selections delivered to your door every week",small:"Essential",medium:"Family",large:"Gourmet",smallD:"Seasonal fruits & veg for 1–2 people",mediumD:"A generous mix for the whole family",largeD:"Premium selection with exotic items",subscribe:"Subscribe",pw:"/week",items:"items/week"},
    loyalty:{title:"GOA Rewards",subtitle:"Every purchase earns points towards exclusive rewards",points:"Points",tier:"Tier",silver:"Silver",earn:"Earn 1 pt per ₪10 spent",redeem:"Redeem for discounts & free delivery",freeDel:"Free delivery at Gold tier",exclusive:"Exclusive member offers",toGold:"pts to Gold"},
    about:{title:"Our Story",text:"GOA Boutique Greengrocer brings the finest, freshest produce to the heart of Tel Aviv. Located on King George 31, we source directly from local farms and premium importers to deliver an unmatched grocery experience.",visit:"Visit Us",addr:"King George 31, Tel Aviv",wa:"Chat on WhatsApp",hours:"Sun–Thu 7AM–9PM · Fri 7AM–3PM",open:"Open Chat"},
    footer:{rights:"All rights reserved",admin:"Admin",employee:"Staff"},
    search:"Search products...",
    sort:{label:"Sort",pAsc:"Price ↑",pDesc:"Price ↓",name:"Name A–Z"},
    filter:{showing:"Showing",of:"of",products:"products",clear:"Clear all",price:"Max price"},
    shopNow:"Shop Now",viewAll:"View All Products",freshToday:"FRESH TODAY",seasonal:"Seasonal Highlights",
    organic:"Organic",seasonalTag:"Seasonal",popular:"Popular",backTop:"↑",catQuick:"Shop by Category",
    orderDone:{title:"Thank You!",msg:"Your order has been sent via WhatsApp",delivery:"Delivery",time:"Time Slot",total:"Total",dismiss:"Continue Shopping"},
    auth:{login:"Login",signup:"Sign Up",email:"Email",password:"Password",noAcc:"Don't have an account?",haveAcc:"Already have an account?"},
    myOrders:{title:"My Orders",empty:"No orders yet — start shopping!",reorder:"Reorder",date:"Date",items:"Items",total:"Total"},
    profile:{title:"My Profile",addresses:"Saved Addresses",addAddr:"+ Add Address",noAddr:"No saved addresses",street:"Street & Number",city:"City",floor:"Floor",apt:"Apartment",entry:"Entry Code",saveAddr:"Save Address",deleteAddr:"Delete",payment:"Payment Methods",addCard:"+ Add Card",noCards:"No saved cards",cardNum:"Card Number",cardName:"Cardholder Name",cardExp:"Expiry (MM/YY)",saveCard:"Save Card",deleteCard:"Delete",points:"Loyalty Points",tier:"Tier",silver:"Silver",gold:"Gold"},
    admin:{title:"Admin Dashboard",qty:"Quantity",pin:"Enter PIN",products:"Product Manager",name:"Name (EN)",nameHe:"Name (HE)",price:"Price",cat:"Category",unit:"Unit",image:"Image URL",origin:"Origin (EN)",originHe:"Origin (HE)",stock:"Stock",inStock:"In Stock",outOfStock:"Out of Stock",save:"Save",add:"+ Add Product",del:"Delete",edit:"Edit",cancel:"Cancel"},
    emp:{title:"Employee Dashboard",accept:"Accept",processing:"Processing",finalize:"Finalize Order",pending:"Pending",completed:"Completed",actualWt:"Actual Weight (kg)",recalc:"Recalculated",noOrders:"No orders yet",alertNew:"NEW!",liveOrders:"Live Orders",back:"← Back to Store"},
    chat:{title:"GOA Support",askHours:"What are your hours?",askZones:"Delivery zones?",askHuman:"Talk to a human",hoursA:"We're open Sun–Thu 7AM–9PM and Fri 7AM–3PM 🕐",zonesA:"We deliver across Tel Aviv, Ramat Gan, Givatayim, and Herzliya 🚚",humanA:"Connecting you to WhatsApp...",placeholder:"Type a message...",bot:"GOA Bot",you:"You"}
  },
  he: {
    nav:{home:"בית",shop:"חנות",subscriptions:"מנויים",loyalty:"מועדון",about:"אודות",orders:"ההזמנות שלי",login:"התחברות",logout:"התנתקות",profile:"פרופיל"},
    hero:{subtitle:"ירקניית בוטיק",tagline:"כשהטבע פוגש יוקרה",cta:"גלה את האוסף",since:"המלך ג׳ורג׳ 31, תל אביב"},
    banner:"משלוח חינם בהזמנות מעל ₪250 · חדש: סלים שבועיים במנוי",
    categories:{all:"הכל",fruits:"פירות",vegetables:"ירקות",herbs:"תבלינים",dairy:"חלב וביצים",pantry:"מזווה",organic:"אורגני"},
    product:{add:"הוסף",added:"✓",notes:"בקשות מיוחדות...",perKg:"/ק״ג",perUnit:"/יחידה",perPack:"/חבילה",oos:"אזל מהמלאי"},
    cart:{title:"הבחירה שלך",empty:"העגלה ריקה",emptyMsg:"גלו את המבחר שלנו",subtotal:"סכום ביניים",delivery:"משלוח",total:"סה״כ",checkout:"המשך לתשלום",minimum:"הזמנה מינימלית ₪100",belowMin:"הוסף עוד ₪{n} להזמנה מינימלית",deliveryDate:"תאריך משלוח",timeSlot:"שעת משלוח",morning:"בוקר (8–12)",afternoon:"צהריים (12–17)",evening:"ערב (17–21)",cash:"מזומן בעת משלוח",card:"תשלום אונליין",payMethod:"תשלום",placeOrder:"בצע הזמנה",freeOver:"חינם מעל ₪250",back:"חזרה לעגלה",items:"פריטים",yourOrder:"ההזמנה שלך",contact:"פרטי התקשרות",name:"שם מלא",phone:"מספר טלפון",email:"אימייל (אופציונלי)",address:"כתובת למשלוח",addressHint:"רחוב, בניין, דירה, קומה",orderNote:"הערות להזמנה (אופציונלי)",pickup:"איסוף עצמי",pickupNote:"איסוף מהחנות: המלך ג׳ורג׳ 31, תל אביב",deliveryMethod:"אופן קבלה",deliver:"משלוח עד הבית"},
    sub:{title:"סלים שבועיים",subtitle:"מבחר שנאסף במיוחד ומגיע אליך כל שבוע",small:"בסיסי",medium:"משפחתי",large:"גורמה",smallD:"פירות וירקות עונתיים ל-1-2 אנשים",mediumD:"מבחר נדיב לכל המשפחה",largeD:"מבחר פרימיום עם פריטים אקזוטיים",subscribe:"הירשם",pw:"/שבוע",items:"פריטים/שבוע"},
    loyalty:{title:"מועדון GOA",subtitle:"כל רכישה צוברת נקודות להטבות בלעדיות",points:"נקודות",tier:"דרגה",silver:"כסף",earn:"נקודה על כל ₪10",redeem:"מימוש להנחות ומשלוח חינם",freeDel:"משלוח חינם בדרגת זהב",exclusive:"הצעות בלעדיות לחברים",toGold:"נקודות לזהב"},
    about:{title:"הסיפור שלנו",text:"GOA ירקניית בוטיק מביאה את התוצרת הטרייה והמובחרת ביותר ללב תל אביב. ממוקמת ברחוב המלך ג׳ורג׳ 31, אנו עובדים ישירות עם חקלאים מקומיים ויבואנים מובחרים כדי להעניק חוויית קנייה ללא תחרות.",visit:"בקרו אותנו",addr:"המלך ג׳ורג׳ 31, תל אביב",wa:"וואטסאפ",hours:"א׳–ה׳ 7:00–21:00 · ו׳ 7:00–15:00",open:"פתח צ׳אט"},
    footer:{rights:"כל הזכויות שמורות",admin:"ניהול",employee:"צוות"},
    search:"חפש מוצרים...",
    sort:{label:"מיון",pAsc:"מחיר ↑",pDesc:"מחיר ↓",name:"שם א–ת"},
    filter:{showing:"מציג",of:"מתוך",products:"מוצרים",clear:"נקה",price:"מחיר מקסימלי"},
    shopNow:"קנה עכשיו",viewAll:"כל המוצרים",freshToday:"טרי היום",seasonal:"מיוחדי העונה",
    organic:"אורגני",seasonalTag:"עונתי",popular:"פופולרי",backTop:"↑",catQuick:"קנייה לפי קטגוריה",
    orderDone:{title:"תודה רבה!",msg:"ההזמנה שלך נשלחה בוואטסאפ",delivery:"משלוח",time:"שעת משלוח",total:"סה״כ",dismiss:"המשך קנייה"},
    auth:{login:"התחברות",signup:"הרשמה",email:"אימייל",password:"סיסמה",noAcc:"אין לך חשבון?",haveAcc:"כבר יש לך חשבון?"},
    myOrders:{title:"ההזמנות שלי",empty:"אין הזמנות עדיין — התחילו לקנות!",reorder:"הזמן שוב",date:"תאריך",items:"פריטים",total:"סה״כ"},
    profile:{title:"הפרופיל שלי",addresses:"כתובות שמורות",addAddr:"+ הוסף כתובת",noAddr:"אין כתובות שמורות",street:"רחוב ומספר",city:"עיר",floor:"קומה",apt:"דירה",entry:"קוד כניסה",saveAddr:"שמור כתובת",deleteAddr:"מחק",payment:"אמצעי תשלום",addCard:"+ הוסף כרטיס",noCards:"אין כרטיסים שמורים",cardNum:"מספר כרטיס",cardName:"שם בעל הכרטיס",cardExp:"תוקף (MM/YY)",saveCard:"שמור כרטיס",deleteCard:"מחק",points:"נקודות מועדון",tier:"דרגה",silver:"כסף",gold:"זהב"},
    admin:{title:"לוח ניהול",qty:"כמות",pin:"הזן PIN",products:"ניהול מוצרים",name:"שם (EN)",nameHe:"שם (HE)",price:"מחיר",cat:"קטגוריה",unit:"יחידה",image:"קישור תמונה",origin:"מקור (EN)",originHe:"מקור (HE)",stock:"מלאי",inStock:"במלאי",outOfStock:"אזל",save:"שמור",add:"+ הוסף מוצר",del:"מחק",edit:"ערוך",cancel:"ביטול"},
    emp:{title:"לוח עובדים",accept:"קבל",processing:"בעיבוד",finalize:"סיום הזמנה",pending:"ממתין",completed:"הושלם",actualWt:"משקל בפועל (ק״ג)",recalc:"חושב מחדש",noOrders:"אין הזמנות עדיין",alertNew:"חדש!",liveOrders:"הזמנות חיות",back:"→ חזרה לחנות"},
    chat:{title:"תמיכה GOA",askHours:"מה שעות הפעילות?",askZones:"אזורי משלוח?",askHuman:"דבר עם נציג",hoursA:"אנחנו פתוחים א׳–ה׳ 7:00–21:00 ו׳ 7:00–15:00 🕐",zonesA:"אנחנו מגיעים לכל תל אביב, רמת גן, גבעתיים והרצליה 🚚",humanA:"מעביר לוואטסאפ...",placeholder:"הקלד הודעה...",bot:"בוט GOA",you:"אתה"}
  }
};


const DEFAULT_P = [
  {id:1,n:{en:"Organic Medjool Dates",he:"תמרים מג׳הול אורגני"},price:45,u:"perKg",cat:"fruits",img:"🌴",organic:true,o:{en:"Jordan Valley",he:"בקעת הירדן"},pop:true,stock:50},
  {id:2,n:{en:"Avocado Hass",he:"אבוקדו האס"},price:22,u:"perKg",cat:"fruits",img:"🥑",o:{en:"Northern Israel",he:"צפון הארץ"},pop:true,stock:50},
  {id:3,n:{en:"Blood Oranges",he:"תפוזי דם"},price:18,u:"perKg",cat:"fruits",img:"🍊",seasonal:true,o:{en:"Sharon Valley",he:"עמק השרון"},stock:50},
  {id:4,n:{en:"Pomegranate",he:"רימון"},price:15,u:"perKg",cat:"fruits",img:"🍎",o:{en:"Upper Galilee",he:"גליל עליון"},stock:50},
  {id:5,n:{en:"Fresh Figs",he:"תאנים טריות"},price:38,u:"perKg",cat:"fruits",img:"🍐",seasonal:true,o:{en:"Judean Hills",he:"הרי יהודה"},stock:50},
  {id:6,n:{en:"Organic Bananas",he:"בננות אורגני"},price:14,u:"perKg",cat:"fruits",img:"🍌",organic:true,o:{en:"Jordan Valley",he:"בקעת הירדן"},stock:50},
  {id:7,n:{en:"Green Grapes",he:"ענבים ירוקים"},price:28,u:"perKg",cat:"fruits",img:"🍇",o:{en:"Negev",he:"הנגב"},stock:50},
  {id:8,n:{en:"Mango",he:"מנגו"},price:32,u:"perKg",cat:"fruits",img:"🥭",seasonal:true,o:{en:"Arava",he:"הערבה"},pop:true,stock:50},
  {id:9,n:{en:"Cherry Tomatoes",he:"עגבניות שרי"},price:16,u:"perKg",cat:"vegetables",img:"🍅",o:{en:"Arava",he:"הערבה"},pop:true,stock:50},
  {id:10,n:{en:"Persian Cucumbers",he:"מלפפונים"},price:10,u:"perKg",cat:"vegetables",img:"🥒",o:{en:"Central Israel",he:"מרכז הארץ"},stock:50},
  {id:11,n:{en:"Purple Eggplant",he:"חציל סגול"},price:12,u:"perKg",cat:"vegetables",img:"🍆",o:{en:"Jezreel Valley",he:"עמק יזרעאל"},stock:50},
  {id:12,n:{en:"Organic Kale",he:"קייל אורגני"},price:18,u:"perPack",cat:"vegetables",img:"🥬",organic:true,o:{en:"Golan Heights",he:"רמת הגולן"},stock:50},
  {id:13,n:{en:"Sweet Potato",he:"בטטה"},price:9,u:"perKg",cat:"vegetables",img:"🍠",o:{en:"Western Negev",he:"נגב מערבי"},stock:50},
  {id:14,n:{en:"Baby Spinach",he:"תרד בייבי"},price:15,u:"perPack",cat:"vegetables",img:"🌿",o:{en:"Sharon Valley",he:"עמק השרון"},stock:50},
  {id:15,n:{en:"Red Bell Pepper",he:"פלפל אדום"},price:18,u:"perKg",cat:"vegetables",img:"🌶️",o:{en:"Arava",he:"הערבה"},stock:50},
  {id:16,n:{en:"Artichoke",he:"ארטישוק"},price:25,u:"perKg",cat:"vegetables",img:"🌻",seasonal:true,o:{en:"Coastal Plain",he:"מישור החוף"},stock:50},
  {id:17,n:{en:"Fresh Basil",he:"בזיליקום טרי"},price:8,u:"perPack",cat:"herbs",img:"🌱",o:{en:"Local Farm",he:"חווה מקומית"},stock:50},
  {id:18,n:{en:"Za'atar Bundle",he:"צרור זעתר"},price:12,u:"perPack",cat:"herbs",img:"🌿",o:{en:"Galilee",he:"הגליל"},pop:true,stock:50},
  {id:19,n:{en:"Fresh Mint",he:"נענע טרייה"},price:7,u:"perPack",cat:"herbs",img:"🍃",o:{en:"Local Farm",he:"חווה מקומית"},stock:50},
  {id:20,n:{en:"Rosemary",he:"רוזמרין"},price:8,u:"perPack",cat:"herbs",img:"🪻",o:{en:"Carmel",he:"הכרמל"},stock:50},
  {id:21,n:{en:"Sumac",he:"סומאק"},price:22,u:"perPack",cat:"herbs",img:"🫙",o:{en:"Galilee",he:"הגליל"},stock:50},
  {id:22,n:{en:"Saffron (1g)",he:"זעפרן (1 גר׳)"},price:65,u:"perPack",cat:"herbs",img:"✨",o:{en:"Imported",he:"מיובא"},stock:50},
  {id:23,n:{en:"Free-Range Eggs",he:"ביצים חופש"},price:28,u:"perPack",cat:"dairy",img:"🥚",o:{en:"Kibbutz Farm",he:"משק קיבוצי"},pop:true,stock:50},
  {id:24,n:{en:"Goat Cheese",he:"גבינת עזים"},price:35,u:"perUnit",cat:"dairy",img:"🧀",o:{en:"Golan Heights",he:"רמת הגולן"},stock:50},
  {id:25,n:{en:"Organic Milk 1L",he:"חלב אורגני"},price:12,u:"perUnit",cat:"dairy",img:"🥛",organic:true,o:{en:"Kibbutz Farm",he:"משק קיבוצי"},stock:50},
  {id:26,n:{en:"Labane",he:"לבנה"},price:18,u:"perUnit",cat:"dairy",img:"🫙",o:{en:"Galilee",he:"הגליל"},stock:50},
  {id:27,n:{en:"Bulgarian Cheese",he:"גבינה בולגרית"},price:22,u:"perUnit",cat:"dairy",img:"🧀",o:{en:"Local Dairy",he:"מחלבה מקומית"},stock:50},
  {id:28,n:{en:"Premium Olive Oil",he:"שמן זית פרימיום"},price:58,u:"perUnit",cat:"pantry",img:"🫒",o:{en:"Galilee",he:"הגליל"},pop:true,stock:50},
  {id:29,n:{en:"Tahini",he:"טחינה"},price:32,u:"perUnit",cat:"pantry",img:"🫙",o:{en:"Nablus",he:"שכם"},pop:true,stock:50},
  {id:30,n:{en:"Raw Honey",he:"דבש גולמי"},price:48,u:"perUnit",cat:"pantry",img:"🍯",o:{en:"Carmel",he:"הכרמל"},stock:50},
  {id:31,n:{en:"Organic Quinoa",he:"קינואה אורגנית"},price:28,u:"perPack",cat:"pantry",img:"🌾",organic:true,o:{en:"Imported",he:"מיובא"},stock:50},
  {id:32,n:{en:"Sourdough Bread",he:"לחם מחמצת"},price:35,u:"perUnit",cat:"pantry",img:"🍞",o:{en:"Local Bakery",he:"מאפייה מקומית"},stock:50},
  {id:33,n:{en:"Date Spread",he:"ממרח תמרים"},price:28,u:"perUnit",cat:"pantry",img:"🫙",o:{en:"Jordan Valley",he:"בקעת הירדן"},stock:50},
  {id:34,n:{en:"Mixed Nuts",he:"תערובת אגוזים"},price:55,u:"perKg",cat:"pantry",img:"🥜",o:{en:"Local",he:"מקומי"},stock:50},
  {id:35,n:{en:"Dried Apricots",he:"משמש מיובש"},price:42,u:"perKg",cat:"pantry",img:"🍑",o:{en:"Turkey",he:"טורקיה"},stock:50},
];
const SUBS=[{id:"small",price:89,items:"8–10",icon:"🧺"},{id:"medium",price:149,items:"14–18",icon:"🏡"},{id:"large",price:229,items:"20–25",icon:"✨"}];
const DEFAULT_CATS = [
  {id:"fruits",icon:"🍊",label:{en:"Fruits",he:"פירות"}},
  {id:"vegetables",icon:"🥬",label:{en:"Vegetables",he:"ירקות"}},
  {id:"herbs",icon:"🌿",label:{en:"Herbs & Spices",he:"תבלינים"}},
  {id:"dairy",icon:"🧀",label:{en:"Dairy & Eggs",he:"חלב וביצים"}},
  {id:"pantry",icon:"🫙",label:{en:"Pantry",he:"מזווה"}},
];
const UNIT_KEYS=["perKg","perUnit","perPack"];
const UNIT_LABELS={en:{perKg:"/kg",perUnit:"/unit",perPack:"/pack"},he:{perKg:"/ק״ג",perUnit:"/יחידה",perPack:"/חבילה"}};
const MAX_P=80;

// Price rounding: always round UP to 1 decimal place (e.g. 8.82 → 8.9)
const roundUp1=(n)=>Math.ceil(n*10)/10;
const fmtPrice=(n)=>roundUp1(n).toFixed(1).replace(/\.0$/,"");

const IL_CITIES=["תל אביב","ירושלים","חיפה","ראשון לציון","פתח תקווה","אשדוד","נתניה","באר שבע","בני ברק","רמת גן","גבעתיים","הרצליה","כפר סבא","רעננה","הוד השרון","רחובות","בת ים","חולון","אשקלון","עפולה","נצרת עילית","קריות"];

const getDates=()=>{const o=[],d=new Date();for(let i=1;i<=7;i++){const x=new Date(d);x.setDate(d.getDate()+i);if(x.getDay()!==6)o.push(x);}return o;};
const fmtD=(d,l)=>d.toLocaleDateString(l==="he"?"he-IL":"en-US",{weekday:"short",month:"short",day:"numeric"});
const SLOTS=["morning","afternoon","evening"];

/* ═══ EXTERNAL SUB-COMPONENTS (defined OUTSIDE main function — fixes focus bug) ═══ */
const Inp = ({ val, set, ph, type="text", req, error, onBlur }) => (
  <input className="fi" type={type} placeholder={ph} value={val}
    onChange={e=>set(e.target.value)} onBlur={onBlur} required={req}
    style={{direction:type==="tel"?"ltr":undefined,width:"100%",
      ...(error?{borderColor:"#D94F4F",boxShadow:"0 0 0 3px rgba(217,79,79,0.08)"}:{})}}/>
);

const QtyBtn = ({q,onAdd,onDec,onInc,anim,addL,addedL,sm,oos,oosL,lowStock}) => {
  if(oos) return <div style={{textAlign:"center",fontSize:11,color:"#D94F4F",opacity:0.7,padding:"8px 0"}}>{oosL}</div>;
  const lowBadge=lowStock?<div style={{textAlign:"center",fontSize:9,color:"#B8860B",marginTop:3}}>{lowStock} left</div>:null;
  if(!q) return <div>{lowBadge}<button className="add-btn" style={sm?{padding:"8px 14px",fontSize:12}:{}} onClick={e=>{e.preventDefault();e.stopPropagation();onAdd();}}>{anim?addedL:addL}</button></div>;
  return <div style={{display:"flex",alignItems:"center",gap:sm?8:10,justifyContent:"center"}} onClick={e=>{e.preventDefault();e.stopPropagation();}}>
    <button className="qb" onClick={e=>{e.preventDefault();e.stopPropagation();onDec();}}>−</button>
    <span style={{fontWeight:600,minWidth:22,textAlign:"center",fontSize:sm?14:16}}>{q}</span>
    <button className="qb" onClick={e=>{e.preventDefault();e.stopPropagation();onInc();}}>+</button>
  </div>;
};

const PCard = ({p,i,sm,q,anim,onAdd,onDec,onInc,onQv,lang,t,S}) => (
  <div className="pcard" style={{animation:`fadeUp 0.4s ${i*0.05}s both`,opacity:(p.stock<=0)?0.5:1}} onClick={()=>onQv(p)}>
    {q>0&&<div className="cbadge">{q}</div>}
    <div className="pcard__img" style={{height:sm?118:152,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
      {p.img?.startsWith("http")
        ? <img src={p.img} alt={p.n[lang]} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        : <span className="pcard__img" style={{fontSize:sm?50:64,height:"auto",background:"none",display:"block",padding:sm?"16px":"20px"}}>{p.img}</span>
      }
      <div style={{position:"absolute",top:8,display:"flex",gap:4,flexWrap:"wrap",maxWidth:"75%",[S]:8}}>
        {p.organic&&<span className="tag otag">{t.organic}</span>}
        {p.seasonal&&<span className="tag stag">{t.seasonalTag}</span>}
        {p.pop&&<span className="tag ptag">{t.popular}</span>}
      </div>
    </div>
    <div className="pcard__body">
      <div className="pname" style={{fontSize:sm?12.5:14}}>{p.n[lang]}</div>
      <div className="porigin">{p.o?.[lang]||""}</div>
      <div className="pprice-wrap">
        {p.enabledUnits && Object.keys(p.enabledUnits).filter(k=>p.enabledUnits[k]).length>1 ? (
          <div style={{display:"flex",flexDirection:"column",gap:1}}>
            {UNIT_KEYS.filter(k=>p.enabledUnits?.[k]).map(k=>(
              <div key={k} style={{display:"flex",alignItems:"baseline",gap:2}}>
                <span className="pprice" style={{fontSize:sm?14:16}}>₪{fmtPrice(p.unitPrices?.[k]||p.price)}</span>
                <span className="punit">{UNIT_LABELS[lang]?.[k]||""}</span>
              </div>
            ))}
          </div>
        ):(
          <div style={{display:"flex",alignItems:"baseline",gap:2}}>
            <span className="pprice" style={{fontSize:sm?15:18}}>₪{fmtPrice(p.price)}</span>
            <span className="punit">{UNIT_LABELS[lang]?.[p.u]||t.product[p.u]||""}</span>
          </div>
        )}
      </div>
      <QtyBtn q={q} onAdd={onAdd} onDec={onDec} onInc={onInc} anim={anim}
        addL={t.product.add} addedL={t.product.added} sm={sm}
        oos={(p.stock<=0)} oosL={t.product.oos}
        lowStock={p.stock>0&&p.stock<=5?p.stock:0}/>
    </div>
  </div>
);

/* ═══ EMPLOYEE VIEW (external component) ═══ */
const EmployeeView = ({orders,setOrders,lang,onBack}) => {
  const t=T[lang];
  const [now,setNow]=useState(Date.now());
  const [checked,setChecked]=useState({});
  const [empAuth,setEmpAuth]=useState(false);
  const [empPin,setEmpPin]=useState("");
  const toggleCheck=(orderId,idx)=>setChecked(p=>({...p,[`${orderId}-${idx}`]:!p[`${orderId}-${idx}`]}));
  useEffect(()=>{const iv=setInterval(()=>setNow(Date.now()),2000);return()=>clearInterval(iv);},[]);

  if(!empAuth) return (
    <div style={{minHeight:"100vh",background:"#1a1a2e",color:"#eee",fontFamily:"'Segoe UI',sans-serif",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#16213e",border:"1px solid #333",borderRadius:16,padding:36,textAlign:"center",maxWidth:300,width:"100%"}}>
        <div style={{fontSize:40,marginBottom:12}}>🔐</div>
        <div style={{fontWeight:700,fontSize:18,marginBottom:6}}>Staff Access</div>
        <div style={{fontSize:12,opacity:0.4,marginBottom:20}}>Enter your employee PIN</div>
        <input type="password" placeholder="PIN" value={empPin} onChange={e=>setEmpPin(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&(empPin===EMP_PIN?setEmpAuth(true):setEmpPin(""))}
          style={{width:"100%",padding:"10px 14px",border:"1px solid #444",borderRadius:8,background:"#0f3460",color:"#eee",fontSize:16,textAlign:"center",outline:"none",marginBottom:10,fontFamily:"inherit",direction:"ltr"}}/>
        <button onClick={()=>{if(empPin===EMP_PIN)setEmpAuth(true);else setEmpPin("");}}
          style={{cursor:"pointer",width:"100%",padding:"11px",background:"#25D366",color:"#fff",border:"none",borderRadius:8,fontWeight:700,fontSize:14,fontFamily:"inherit",marginBottom:8}}>Enter</button>
        <button onClick={onBack} style={{cursor:"pointer",width:"100%",padding:"10px",background:"#333",color:"#eee",border:"none",borderRadius:8,fontSize:13,fontFamily:"inherit"}}>{t.emp.back}</button>
      </div>
    </div>
  );

  const acceptOrder=(id)=>{const o=orders.find(x=>x.id===id);if(o&&o._docId)updateDoc(orderDoc(o._docId),{status:"processing",acceptedAt:Date.now()});};
  const updateWeight=(orderId,itemIdx,wt)=>{
    const o=orders.find(x=>x.id===orderId);
    if(!o||!o._docId)return;
    const items=[...o.items];
    const it={...items[itemIdx]};
    it.actualWt=parseFloat(wt)||it.qty;
    if(it.u==="perKg") it.actualPrice=Math.round(it.price*it.actualWt*100)/100;
    else it.actualPrice=it.price*it.qty;
    items[itemIdx]=it;
    const newTotal=items.reduce((s,x)=>s+(x.actualPrice!==undefined?x.actualPrice:x.price*x.qty),0);
    updateDoc(orderDoc(o._docId),{items,total:newTotal+o.deliveryFee});
  };
  const finalizeOrder=(id)=>{const o=orders.find(x=>x.id===id);if(o&&o._docId)updateDoc(orderDoc(o._docId),{status:"completed",completedAt:Date.now()});};

  const pending=orders.filter(o=>o.status==="pending");
  const processing=orders.filter(o=>o.status==="processing");
  const completed=orders.filter(o=>o.status==="completed").slice(0,10);
  const bs={cursor:"pointer",padding:"8px 16px",border:"none",borderRadius:8,fontSize:12,fontFamily:"inherit",fontWeight:600};

  return (<div style={{minHeight:"100vh",background:"#1a1a2e",color:"#eee",fontFamily:"'Segoe UI',sans-serif",padding:20}}>
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h1 style={{fontSize:24,fontWeight:700}}>👨‍🍳 {t.emp.title}</h1>
        <button onClick={onBack} style={{...bs,background:"#333",color:"#fff"}}>{t.emp.back}</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
        {/* PENDING */}
        <div>
          <h3 style={{color:"#ff6b6b",marginBottom:12,fontSize:14,textTransform:"uppercase",letterSpacing:2}}>🔴 {t.emp.pending} ({pending.length})</h3>
          {pending.length===0&&<div style={{opacity:0.3,fontSize:13}}>{t.emp.noOrders}</div>}
          {pending.map(o=>{
            const age=(now-o.createdAt)/1000;
            const alert=age>30;
            return <div key={o.id} style={{background:alert?"#4a1a1a":"#16213e",border:alert?"2px solid #ff4444":"1px solid #333",borderRadius:12,padding:14,marginBottom:10,animation:"fadeIn 0.3s"}}>
              {alert&&<div style={{background:"#ff4444",color:"#fff",borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700,display:"inline-block",marginBottom:8,animation:"pulse 1s infinite"}}>⚠️ {Math.round(age)}s — MANAGER ALERT</div>}
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontWeight:600}}>{o.customerName}</span>
                <span style={{fontSize:11,opacity:0.5}}>#{o.id.toString().slice(-4)}</span>
              </div>
              <div style={{fontSize:12,opacity:0.6,marginBottom:8}}>{o.items.map(it=>`${it.img} ${it.n[lang]} ×${it.qty}`).join(", ")}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#C4A97D",marginBottom:10}}>₪{o.total}</div>
              <button onClick={()=>acceptOrder(o.id)} style={{...bs,background:"#25D366",color:"#fff",width:"100%"}}>{t.emp.accept}</button>
            </div>;
          })}
        </div>
        {/* PROCESSING */}
        <div>
          <h3 style={{color:"#ffd93d",marginBottom:12,fontSize:14,textTransform:"uppercase",letterSpacing:2}}>🟡 {t.emp.processing} ({processing.length})</h3>
          {processing.map(o=>(<div key={o.id} style={{background:"#16213e",border:"1px solid #444",borderRadius:12,padding:14,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontWeight:600}}>{o.customerName}</span>
              <span style={{fontSize:11,opacity:0.5}}>#{o.id.toString().slice(-4)}</span>
            </div>
            {o.items.map((it,idx)=>(<div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #222",fontSize:12,opacity:checked[`${o.id}-${idx}`]?0.4:1,textDecoration:checked[`${o.id}-${idx}`]?"line-through":"none"}}>
              <input type="checkbox" checked={!!checked[`${o.id}-${idx}`]} onChange={()=>toggleCheck(o.id,idx)} style={{accentColor:"#6BCB77",width:16,height:16,cursor:"pointer",flexShrink:0}}/>
              <span>{it.img}</span>
              <span style={{flex:1}}>{it.n[lang]} ×{it.qty}</span>
              {it.u==="perKg"&&<div style={{display:"flex",alignItems:"center",gap:4}}>
                <input type="number" step="0.1" min="0" placeholder={t.emp.actualWt} value={it.actualWt||""} onChange={e=>updateWeight(o.id,idx,e.target.value)}
                  style={{width:70,padding:"4px 6px",border:"1px solid #555",borderRadius:4,background:"#0f3460",color:"#eee",fontSize:11}}/>
                <span style={{fontSize:10,opacity:0.5}}>kg</span>
              </div>}
              <span style={{fontWeight:600,color:"#C4A97D",minWidth:50,textAlign:"right"}}>₪{it.actualPrice!==undefined?it.actualPrice.toFixed(0):it.price*it.qty}</span>
            </div>))}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:8,borderTop:"1px solid #333"}}>
              <span style={{fontWeight:700,fontSize:16,color:"#C4A97D"}}>₪{Math.round(o.total)}</span>
              <button onClick={()=>finalizeOrder(o.id)} style={{...bs,background:"#C4A97D",color:"#1a1a2e"}}>{t.emp.finalize}</button>
            </div>
          </div>))}
        </div>
        {/* COMPLETED */}
        <div>
          <h3 style={{color:"#6BCB77",marginBottom:12,fontSize:14,textTransform:"uppercase",letterSpacing:2}}>🟢 {t.emp.completed} ({completed.length})</h3>
          {completed.map(o=>(<div key={o.id} style={{background:"#16213e",border:"1px solid #2a4a2a",borderRadius:12,padding:14,marginBottom:10,opacity:0.7}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span>{o.customerName}</span>
              <span style={{color:"#6BCB77",fontWeight:600}}>₪{Math.round(o.total)}</span>
            </div>
          </div>))}
        </div>
      </div>
    </div>
  </div>);
};

/* ═══ CHAT WIDGET (external component) ═══ */
const ChatWidget = ({lang,open,onClose}) => {
  const t=T[lang].chat;
  const [msgs,setMsgs]=useState([{from:"bot",text:t.title+" 👋"}]);
  const [input,setInput]=useState("");
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=(text,isQuick)=>{
    const userMsg={from:"user",text:isQuick||text};
    setMsgs(p=>[...p,userMsg]);
    setTimeout(()=>{
      let reply="";
      const low=(isQuick||text).toLowerCase();
      if(low.includes("hour")||low.includes("שעות")) reply=t.hoursA;
      else if(low.includes("zone")||low.includes("deliver")||low.includes("משלוח")||low.includes("אזור")) reply=t.zonesA;
      else if(low.includes("human")||low.includes("נציג")){reply=t.humanA;setTimeout(()=>window.open(`https://wa.me/${WA_PHONE}`,"_blank"),1500);}
      else reply=lang==="en"?"I can help with hours, delivery zones, or connect you to a human!":"אני יכול לעזור עם שעות, אזורי משלוח, או לחבר אותך לנציג!";
      setMsgs(p=>[...p,{from:"bot",text:reply}]);
    },600);
    setInput("");
  };
  if(!open) return null;
  return (<div dir="ltr" style={{position:"fixed",bottom:80,right:20,width:320,maxHeight:420,background:"#FDFBF7",borderRadius:16,boxShadow:"0 10px 40px rgba(0,0,0,0.15)",zIndex:999,display:"flex",flexDirection:"column",overflow:"hidden",animation:"scaleIn 0.2s",border:"1px solid #E5DDD0"}}>
    <div style={{background:"#2C2416",color:"#FDFBF7",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontWeight:600,fontSize:14}}>💬 {t.title}</span>
      <button onClick={onClose} style={{background:"none",border:"none",color:"#FDFBF7",cursor:"pointer",fontSize:16}}>✕</button>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:8,maxHeight:250}}>
      {msgs.map((m,i)=>(<div key={i} style={{alignSelf:m.from==="user"?"flex-end":"flex-start",background:m.from==="user"?"#2C2416":"#F0EBE3",color:m.from==="user"?"#FDFBF7":"#2C2416",padding:"8px 12px",borderRadius:12,maxWidth:"80%",fontSize:13}}>{m.text}</div>))}
      <div ref={endRef}/>
    </div>
    <div style={{padding:"8px 12px",borderTop:"1px solid #F0EBE3",display:"flex",gap:4,flexWrap:"wrap"}}>
      {[t.askHours,t.askZones,t.askHuman].map((q,i)=>(<button key={i} onClick={()=>send(q,q)} style={{cursor:"pointer",padding:"5px 10px",border:"1px solid #E5DDD0",borderRadius:16,background:"#fff",fontSize:10.5,fontFamily:"inherit",color:"#2C2416"}}>{q}</button>))}
    </div>
    <div style={{padding:"8px 12px",display:"flex",gap:6}}>
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&input.trim()&&send(input)} placeholder={t.placeholder} style={{flex:1,padding:"8px 12px",border:"1px solid #E5DDD0",borderRadius:20,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
      <button onClick={()=>input.trim()&&send(input)} style={{cursor:"pointer",background:"#2C2416",color:"#fff",border:"none",borderRadius:"50%",width:32,height:32,fontSize:14}}>→</button>
    </div>
  </div>);
};
export default function GOA() {
  /* Products state — synced from Firestore */
  const [products,setProducts]=useState([]);
  const [categories,setCategories]=useState(DEFAULT_CATS);
  const [fbUser,setFbUser]=useState(null);
  const [fbReady,setFbReady]=useState(false);

  /* Firebase Auth — sign in anonymously for Firestore access, separately track email user */
  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,(u)=>{
      if(u){
        setFbUser(u);
        setFbReady(true);
        // If they have an email (real login), set user state
        if(u.email){
          setUser({email:u.email,uid:u.uid});
        }
      } else {
        // Sign in anonymously so Firestore rules still work
        signInAnonymously(auth).catch(console.error);
      }
    });
    return unsub;
  },[]);

  /* Firestore real-time listeners */
  useEffect(()=>{
    if(!fbReady)return;
    const unsubProducts=onSnapshot(PRODUCTS_COL,(snap)=>{
      if(!snap.empty){
        setProducts(snap.docs.map(d=>({...d.data(),_docId:d.id,id:(d.data().id ?? (parseInt(d.id) || 0))})));
      }
    },(err)=>console.error("Products listener error:",err));
    const unsubOrders=onSnapshot(ORDERS_COL,(snap)=>{
      if(!snap.empty){
        const all=snap.docs.map(d=>({...d.data(),_docId:d.id}));
        setOrderHistory(all);
      } else { setOrderHistory([]); }
    },(err)=>console.error("Orders listener error:",err));    const unsubCats=onSnapshot(CATEGORIES_COL,(snap)=>{
      if(!snap.empty){
        setCategories(snap.docs.map(d=>({...d.data(),_docId:d.id})));
      }
    },(err)=>console.error("Categories listener error:",err));
    return()=>{unsubProducts();unsubOrders();unsubCats();};
  },[fbReady]);

  const [lang,setLang] = useState("he");
  const [page,setPage] = useState("home");
  const [cat,setCat] = useState("all");
  const [cart,setCart] = useState([]);
  const [cartOpen,setCartOpen] = useState(false);
  const [step,setStep] = useState(0);
  const [search,setSearch] = useState("");
  const [sortBy,setSortBy] = useState("default");
  const [maxPrice,setMaxPrice] = useState(MAX_P);
  const [delDate,setDelDate] = useState(null);
  const [timeSlot,setTimeSlot] = useState("");
  const [payMethod,setPayMethod] = useState("stripe");
  const [deliveryMethod,setDeliveryMethod] = useState("deliver"); // "deliver" or "pickup"
  const [notes,setNotes] = useState({});
  const [addedAnim,setAddedAnim] = useState({});
  const [heroVis,setHeroVis] = useState(false);
  const [orderInfo,setOrderInfo] = useState(null);
  const [mobileMenu,setMobileMenu] = useState(false);
  const [qv,setQv] = useState(null);
  const [showSort,setShowSort] = useState(false);
  const [showBackTop,setShowBackTop] = useState(false);
  const [cName,setCName] = useState("");
  const [cPhone,setCPhone] = useState("");
  const [cEmail,setCEmail] = useState("");
  const [cAddr,setCAddr] = useState("");
  const [cNote,setCNote] = useState("");
  const [phoneTouched,setPhoneTouched] = useState(false);
  const searchRef = useRef(null);

  /* Auth state */
  const [user,setUser]=useState(null);
  const [authModal,setAuthModal]=useState(null);
  const [authEmail,setAuthEmail]=useState("");
  const [authPass,setAuthPass]=useState("");
  const [authErr,setAuthErr]=useState("");

  /* Profile state */
  const [profilePage,setProfilePage]=useState("orders"); // orders | addresses | payment | loyalty
  const [savedAddresses,setSavedAddresses]=useState(()=>{try{return JSON.parse(localStorage.getItem("goa_addresses")||"[]");}catch{return [];}});
  const [savedCards,setSavedCards]=useState(()=>{try{return JSON.parse(localStorage.getItem("goa_cards")||"[]");}catch{return [];}});
  const [newAddr,setNewAddr]=useState({street:"",city:"",floor:"",apt:"",entry:""});
  const [newCard,setNewCard]=useState({num:"",name:"",exp:""});
  const [showAddrForm,setShowAddrForm]=useState(false);
  const [showCardForm,setShowCardForm]=useState(false);
  const [emailTouched,setEmailTouched]=useState(false);
  const [addrCity,setAddrCity]=useState("");

  /* Order history — synced from Firestore (set by onSnapshot above) */
  const [orderHistory,setOrderHistory]=useState([]);

  /* Admin state */
  const [adminMode,setAdminMode]=useState(false);
  const [adminPin,setAdminPin]=useState("");
  const [adminAuth,setAdminAuth]=useState(false);
  const [addNew,setAddNew]=useState(false);
  const [adminTab,setAdminTab]=useState("products");
  const [prodModal,setProdModal]=useState(null);
  const [homeCount,setHomeCount] = useState(8);
  const [empMode,setEmpMode]=useState(false);
  const [chatOpen,setChatOpen]=useState(false);

  const rtl = lang==="he";
  const dir = rtl?"rtl":"ltr";
  const t = T[lang];
  const S = rtl?"right":"left";
  const E = rtl?"left":"right";

  useEffect(()=>{ setTimeout(()=>setHeroVis(true),150) },[]);

  // Lock body scroll when overlays are open
  useEffect(()=>{document.body.style.overflow=(cartOpen||qv||orderInfo||authModal||adminMode||empMode)?"hidden":"";return()=>{document.body.style.overflow="";};},[cartOpen,qv,orderInfo,authModal,adminMode,empMode]);

  // Escape key to close overlays
  useEffect(()=>{
    const h=(e)=>{
      if(e.key==="Escape"){
        if(empMode){setEmpMode(false);}
        else if(adminMode){setAdminMode(false);setAdminAuth(false);setAdminPin("");}
        else if(authModal) setAuthModal(null);
        else if(orderInfo) setOrderInfo(null);
        else if(qv) setQv(null);
        else if(cartOpen) setCartOpen(false);
        else if(mobileMenu) setMobileMenu(false);
      }
    };
    document.addEventListener("keydown",h);
    return ()=>document.removeEventListener("keydown",h);
  },[orderInfo,qv,cartOpen,mobileMenu,authModal,adminMode,empMode]);

  // Close sort dropdown on outside click
  useEffect(()=>{
    if(!showSort) return;
    const h=()=>setShowSort(false);
    setTimeout(()=>document.addEventListener("click",h),0);
    return ()=>document.removeEventListener("click",h);
  },[showSort]);

  // Close mobile menu on outside click
  useEffect(()=>{
    if(!mobileMenu) return;
    const h=(e)=>{ if(!e.target.closest(".mobile-menu, .hamburger")) setMobileMenu(false); };
    setTimeout(()=>document.addEventListener("click",h),0);
    return ()=>document.removeEventListener("click",h);
  },[mobileMenu]);

  // Back to top visibility
  useEffect(()=>{
    const h=()=>setShowBackTop(window.scrollY>400);
    window.addEventListener("scroll",h);
    return ()=>window.removeEventListener("scroll",h);
  },[]);

  const cQty=useCallback(id=>cart.find(i=>i.id===id)?.qty||0,[cart]);
  const addToCart=useCallback(p=>{if((p.stock<=0))return;setCart(pr=>{const x=pr.find(i=>i.id===p.id);return x?pr.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i):[...pr,{...p,qty:1}];});setAddedAnim(pr=>({...pr,[p.id]:true}));setTimeout(()=>setAddedAnim(pr=>({...pr,[p.id]:false})),800);},[]);
  const setQ=useCallback((id,q)=>{if(q<=0)setCart(pr=>pr.filter(i=>i.id!==id));else setCart(pr=>pr.map(i=>i.id===id?{...i,qty:q}:i));},[]);
  const sub = roundUp1(cart.reduce((s,i)=>s+i.price*i.qty,0));
  const delFee = deliveryMethod==="pickup" ? 0 : sub>=250?0:sub>=150?15:25;
  const tot = roundUp1(sub+delFee);
  const cc = cart.reduce((s,i)=>s+i.qty,0);

  // Browser back button — go to home instead of closing app
  useEffect(()=>{
    const handlePop = ()=>{ go("home"); };
    window.addEventListener("popstate", handlePop);
    return ()=>window.removeEventListener("popstate", handlePop);
  },[]);

  const filtered = useMemo(()=>products
    .filter(p=>{
      const mc = cat==="all"||p.cat===cat||(cat==="organic"&&p.organic);
      const ms = !search||p.n.en.toLowerCase().includes(search.toLowerCase())||p.n.he.includes(search);
      const mp = p.price<=maxPrice||(maxPrice>=MAX_P);
      return mc&&ms&&mp;
    })
    .sort((a,b)=>{
      if(sortBy==="pAsc") return a.price-b.price;
      if(sortBy==="pDesc") return b.price-a.price;
      if(sortBy==="name") return a.n[lang].localeCompare(b.n[lang],rtl?"he":"en");
      return 0;
    }),[products,cat,search,maxPrice,sortBy,lang,rtl]);

  const hasFilters = cat!=="all"||search||maxPrice<MAX_P||sortBy!=="default";
  const clearF=()=>{setCat("all");setSearch("");setMaxPrice(MAX_P);setSortBy("default");};
  const go=(p,keepCat)=>{setPage(p);setMobileMenu(false);if(p==="shop"&&!keepCat)clearF();window.scrollTo?.({top:0,behavior:"smooth"});};

  const emailValid = !cEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cEmail.trim());
  const emailError = emailTouched && cEmail.trim() && !emailValid;

  // Address & card helpers (stored in localStorage)
  const saveAddress=()=>{if(!newAddr.street.trim()||!addrCity)return;const a={...newAddr,city:addrCity,id:Date.now()};const updated=[...savedAddresses,a];setSavedAddresses(updated);localStorage.setItem("goa_addresses",JSON.stringify(updated));setNewAddr({street:"",city:"",floor:"",apt:"",entry:""});setAddrCity("");setShowAddrForm(false);};
  const deleteAddress=(id)=>{const updated=savedAddresses.filter(a=>a.id!==id);setSavedAddresses(updated);localStorage.setItem("goa_addresses",JSON.stringify(updated));};
  const saveCard=()=>{if(!newCard.num.trim()||!newCard.name.trim()||!newCard.exp.trim())return;const c={...newCard,last4:newCard.num.replace(/\s/g,"").slice(-4),id:Date.now()};const updated=[...savedCards,c];setSavedCards(updated);localStorage.setItem("goa_cards",JSON.stringify(updated));setNewCard({num:"",name:"",exp:""});setShowCardForm(false);};
  const deleteCard=(id)=>{const updated=savedCards.filter(c=>c.id!==id);setSavedCards(updated);localStorage.setItem("goa_cards",JSON.stringify(updated));};

  // Image upload to Firebase Storage
  const [imgUploading,setImgUploading]=useState(false);
  const uploadImage=async(file,onDone)=>{
    if(!file)return;
    setImgUploading(true);
    try{
      const r=storageRef(storage,`products/${Date.now()}_${file.name}`);
      await uploadBytes(r,file);
      const url=await getDownloadURL(r);
      onDone(url);
    }catch(e){console.error("Upload error:",e);}
    setImgUploading(false);
  };

  const placeOrder=()=>{
    const dateStr = delDate ? fmtD(delDate,lang) : "";
    const slotStr = timeSlot ? t.cart[timeSlot] : "";
    const itemsStr = cart.map(i=>`• ${i.n[lang]} ×${i.qty} — ₪${i.price*i.qty}`).join("\n");
    const payStr = payMethod==="stripe"
      ? (lang==="en"?"Credit Card (Stripe)":"כרטיס אשראי (Stripe)")
      : t.cart.cash;
    const methodStr = deliveryMethod==="pickup" ? (lang==="en"?"Self Pickup":"איסוף עצמי") : (lang==="en"?"Home Delivery":"משלוח עד הבית");
    const msg = [
      `🛒 *${lang==="en"?"New Order":"הזמנה חדשה"}*`,
      ``,
      `👤 *${t.cart.contact}*`,
      `${t.cart.name}: ${cName}`,
      `${t.cart.phone}: ${cPhone}`,
      cEmail ? `${lang==="en"?"Email":"אימייל"}: ${cEmail}` : null,
      deliveryMethod==="deliver" ? `${t.cart.address}: ${cAddr}${addrCity?", "+addrCity:""}` : `📍 ${lang==="en"?"Pickup from store":"איסוף מהחנות"}`,
      ``,
      `📦 *${t.cart.yourOrder}*`,
      itemsStr,
      ``,
      `${t.cart.subtotal}: ₪${sub}`,
      `${t.cart.delivery}: ${delFee===0?(lang==="en"?"Free":"חינם"):`₪${delFee}`}`,
      `*${t.cart.total}: ₪${tot}*`,
      ``,
      `🚚 ${t.cart.deliveryMethod}: ${methodStr}`,
      deliveryMethod==="deliver" ? `📅 ${t.cart.deliveryDate}: ${dateStr}` : null,
      deliveryMethod==="deliver" ? `⏰ ${t.cart.timeSlot}: ${slotStr}` : null,
      `💳 ${t.cart.payMethod}: ${payStr}`,
      cNote ? `\n📝 ${lang==="en"?"Notes":"הערות"}: ${cNote}` : null,
    ].filter(Boolean).join("\n");

    // Use wa.me for universal WhatsApp (works on desktop and mobile)
    window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`,"_blank");

    // Stripe redirect — if card payment and Stripe link configured
    if(payMethod==="stripe" && STRIPE_LINK){
      // Build Stripe prefilled params
      const stripeParams = new URLSearchParams({
        prefilled_email: cEmail||"",
        client_reference_id: `order_${Date.now()}`,
      });
      // Small delay so WhatsApp opens first
      setTimeout(()=>{
        window.location.href = `${STRIPE_LINK}?${stripeParams.toString()}`;
      },600);
    }

    // Save order to Firestore
    const orderObj={id:Date.now(),createdAt:Date.now(),date:new Date().toISOString(),items:cart.map(i=>({id:i.id,n:i.n,qty:i.qty,price:i.price,u:i.u,img:i.img})),total:tot,deliveryFee:delFee,deliveryMethod,customerName:cName,customerPhone:cPhone,status:"pending",uid:fbUser?.uid||null,userEmail:user?.email||null};
    addDoc(ORDERS_COL,orderObj).catch(console.error);

    // Deduct stock in Firestore
    for(const ci of cart){
      const p=products.find(x=>x.id===ci.id);
      if(p&&p._docId){updateDoc(prodDoc(p._docId),{stock:increment(-ci.qty)}).catch(console.error);}
    }

    const info = { date:delDate, slot:timeSlot, total:tot, name:cName, method:deliveryMethod, payMethod };
    setOrderInfo(info);
    setCart([]);setStep(0);setCartOpen(false);setNotes({});setCName("");setCPhone("");setCEmail("");setCAddr("");setCNote("");setDelDate(null);setTimeSlot("");setPhoneTouched(false);setDeliveryMethod("deliver");setAddrCity("");setEmailTouched(false);setPayMethod("stripe");
  };

  const phoneValid = /^05\d{8}$/.test(cPhone.replace(/[\s\-()]/g,""));
  const phoneError = phoneTouched && cPhone.trim() && !phoneValid;
  const canPlace = cName.trim() && phoneValid && emailValid && (deliveryMethod==="pickup" || (cAddr.trim() && addrCity && delDate && timeSlot));

  /* Auth helpers — Firebase */
  const doAuth=async(mode)=>{
    if(!authEmail.trim()||!authPass.trim()){setAuthErr(lang==="en"?"Fill all fields":"מלא את כל השדות");return;}
    try{
      if(mode==="signup"){
        await createUserWithEmailAndPassword(auth,authEmail.trim(),authPass);
      } else {
        await signInWithEmailAndPassword(auth,authEmail.trim(),authPass);
      }
      setAuthModal(null);setAuthEmail("");setAuthPass("");setAuthErr("");
    }catch(e){
      const code=e.code||"";
      if(code==="auth/email-already-in-use") setAuthErr(lang==="en"?"Email already in use":"אימייל כבר בשימוש");
      else if(code==="auth/user-not-found"||code==="auth/wrong-password"||code==="auth/invalid-credential") setAuthErr(lang==="en"?"Invalid email or password":"אימייל או סיסמה שגויים");
      else if(code==="auth/weak-password") setAuthErr(lang==="en"?"Password must be at least 6 characters":"סיסמה חייבת להיות לפחות 6 תווים");
      else if(code==="auth/invalid-email") setAuthErr(lang==="en"?"Invalid email address":"כתובת אימייל לא תקינה");
      else setAuthErr(lang==="en"?"Something went wrong. Try again.":"משהו השתבש. נסה שוב.");
    }
  };
  const doLogout=async()=>{
    await signOut(auth);
    setUser(null);
    if(page==="orders")setPage("home");
    // Re-sign-in anonymously so Firestore still works
    signInAnonymously(auth).catch(console.error);
  };
  const reorder=order=>{const nc=order.items.map(i=>{const lv=products.find(p=>p.id===i.id);return lv&&(lv.stock??0)>0?{...lv,qty:i.qty}:null;}).filter(Boolean);setCart(nc);setCartOpen(true);setStep(0);};
  const userOrderHistory = user ? orderHistory.filter(o=>o.userEmail===user.email) : [];

  /* Admin helpers — Firestore */
  const adminLogin=()=>{if(adminPin===ADMIN_PIN)setAdminAuth(true);else setAdminPin("");};
  const openEditModal=p=>{
    // Rebuild enabledUnits + prices from saved data
    // Support legacy products (no enabledUnits field) — use p.u as the single active unit
    const enabledUnits = p.enabledUnits
      ? {...p.enabledUnits}
      : {perKg: p.u==="perKg", perUnit: p.u==="perUnit", perPack: p.u==="perPack"};
    const unitPrices = p.unitPrices
      ? {...p.unitPrices}
      : {[p.u||"perKg"]: p.price};
    const firstActive = UNIT_KEYS.find(k=>enabledUnits[k]) || p.u || "perKg";
    const priceStr = String(unitPrices[firstActive]||p.price||"");
    setProdModal({mode:"edit",form:{...p,priceStr,stockStr:String(p.stock??50),enabledUnits,prices:unitPrices}});
  };
  const openAddModal=()=>{
    const mx=products.reduce((m,p)=>Math.max(m,p.id),0);
    setProdModal({mode:"add",form:{
      id:mx+1,n:{en:"",he:""},priceStr:"",stockStr:"50",
      u:"perKg",enabledUnits:{perKg:true},prices:{perKg:""},
      cat:categories[0]?.id||"fruits",img:"🍏",
      organic:false,seasonal:false,pop:false,o:{en:"",he:""},stock:50
    }});
  };
  const saveProdModal=async()=>{
    if(!prodModal)return;
    const f=prodModal.form;
    const stk=parseInt(f.stockStr)||0;
    if(!f.n.en.trim()||!f.n.he.trim())return;

    // Build prices object from enabledUnits + prices fields
    const enabledUnits = f.enabledUnits || {[f.u||"perKg"]:true};
    const prices = f.prices || {};
    const activeUnits = UNIT_KEYS.filter(k=>enabledUnits[k]);
    if(activeUnits.length===0)return;

    // For each active unit, get its price (fallback to priceStr for legacy)
    const unitPrices={};
    let primaryPrice=null;
    for(const uk of activeUnits){
      const p=parseFloat(prices[uk]||f.priceStr||0);
      if(isNaN(p)||p<=0)return; // all active units must have a valid price
      unitPrices[uk]=p;
      if(!primaryPrice)primaryPrice=p;
    }

    // primary unit = first active one (for backwards compat display)
    const primaryUnit=activeUnits[0];

    const data={
      id:f.id,n:f.n,
      price:primaryPrice,        // main price (legacy compat)
      u:primaryUnit,             // main unit (legacy compat)
      unitPrices,                // all prices per unit type
      enabledUnits,              // which unit types are on
      stock:stk,cat:f.cat,
      img:f.img||"🍏",
      organic:!!f.organic,seasonal:!!f.seasonal,pop:!!f.pop,
      o:f.o||{en:"",he:""}
    };
    try{
      if(prodModal.mode==="add"){await addDoc(PRODUCTS_COL,data);}
      else if(f._docId){await updateDoc(prodDoc(f._docId),data);}
    }catch(e){console.error("Save product error:",e);}
    setProdModal(null);
  };
  const delProduct=async(id)=>{const p=products.find(x=>x.id===id);if(p&&p._docId){try{await deleteDoc(prodDoc(p._docId));}catch(e){console.error("Delete product error:",e);}}};
  /* Category helpers — Firestore */
  const [newCat,setNewCat]=useState({id:"",icon:"",label:{en:"",he:""}});
  const addCategory=async()=>{if(!newCat.id.trim()||!newCat.label.en.trim()||!newCat.label.he.trim()||!newCat.icon.trim())return;if(categories.find(c=>c.id===newCat.id))return;
    const catData={id:newCat.id.toLowerCase().replace(/\s+/g,"_"),icon:newCat.icon,label:newCat.label};
    try{await addDoc(CATEGORIES_COL,catData);}catch(e){console.error("Add category error:",e);}
    setNewCat({id:"",icon:"",label:{en:"",he:""}});};
  const delCategory=async(id)=>{if(products.some(p=>p.cat===id))return;const c=categories.find(x=>x.id===id);if(c&&c._docId){try{await deleteDoc(catDoc(c._docId));}catch(e){console.error("Delete category error:",e);}}};

  /* Employee mode — render separate view (orders from Firestore real-time) */
  if(empMode) return <EmployeeView orders={orderHistory} setOrders={()=>{}} lang={lang} onBack={()=>setEmpMode(false)}/>;

  return (
    <div dir={dir} style={{fontFamily:rtl?"'Noto Sans Hebrew','Segoe UI',sans-serif":"'Cormorant Garamond',Georgia,serif",background:"#FDFBF7",color:"#2C2416",minHeight:"100vh",width:"100%"}}>

      {/* ═══ BANNER ═══ */}
      <div className="banner">
        <div className="banner-track">
          {[
            lang==="en"?"🌿 Fresh from local farms":"🌿 ישר מהחקלאים המקומיים",
            lang==="en"?"🍅 Seasonal & organic produce":"🍅 תוצרת עונתית ואורגנית",
            lang==="en"?"🚚 Free delivery over ₪250":"🚚 משלוח חינם מעל ₪250",
            lang==="en"?"🌿 Fresh from local farms":"🌿 ישר מהחקלאים המקומיים",
            lang==="en"?"🍅 Seasonal & organic produce":"🍅 תוצרת עונתית ואורגנית",
            lang==="en"?"🚚 Free delivery over ₪250":"🚚 משלוח חינם מעל ₪250",
          ].map((txt,i)=>(
            <span key={i}>{txt}</span>
          ))}
        </div>
      </div>

      {/* ═══ NAV ═══ */}
      <nav className="topnav">
        <div className="logo-wrap" onClick={()=>go("home")}>
          <div className="logo-mark">G</div>
          <div className="logo-text">
            <span className="logo-name">{rtl?"גואה":"GOA"}</span>
            <span className="logo-sub">{rtl?"ירקניית בוטיק":"boutique greengrocer"}</span>
          </div>
        </div>
        <div className="dn" style={{display:"flex",gap:22,alignItems:"center"}}>
          {["home","shop","subscriptions","loyalty","about"].map(p=>(
            <span key={p} className={`nl ${page===p?"on":""}`} onClick={()=>go(p)} style={{fontFamily:rtl?"'Noto Sans Hebrew',sans-serif":"'Cormorant Garamond',serif"}}>{t.nav[p]}</span>
          ))}
          {user&&<span className={`nl ${page==="orders"?"on":""}`} onClick={()=>go("orders")} style={{fontFamily:rtl?"'Noto Sans Hebrew',sans-serif":"'Cormorant Garamond',serif"}}>{t.nav.orders}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button style={{cursor:"pointer",padding:"4px 10px",border:"1px solid #E5DDD0",borderRadius:18,background:"transparent",fontSize:10.5,fontFamily:"inherit",color:"#2C2416",transition:"all 0.3s"}} onClick={()=>setLang(lang==="en"?"he":"en")}>{lang==="en"?"עברית":"EN"}</button>
          {user?<button style={{cursor:"pointer",padding:"4px 10px",border:"1px solid #E5DDD0",borderRadius:18,background:"transparent",fontSize:10,fontFamily:"inherit",color:"#8B7355"}} title={user.email} onClick={()=>go("profile")}>👤</button>
          :<button style={{cursor:"pointer",padding:"4px 10px",border:"1px solid #E5DDD0",borderRadius:18,background:"transparent",fontSize:10,fontFamily:"inherit",color:"#2C2416"}} onClick={()=>{setAuthModal("login");setAuthErr("");}}>{t.nav.login}</button>}
          <button className="cnb" onClick={()=>{setCartOpen(true);setStep(0)}}>🛒{cc>0&&<span className="nb">{cc}</span>}</button>
          <button className="ham" onClick={()=>setMobileMenu(!mobileMenu)}>☰</button>
        </div>
      </nav>

      {mobileMenu&&<div className="mm mobile-menu"><button onClick={()=>setMobileMenu(false)} style={{position:"absolute",top:20,right:20,left:"auto",cursor:"pointer",background:"none",border:"none",fontSize:22,opacity:0.4}}>✕</button>{["home","shop","subscriptions","loyalty","about"].map(p=>(<span key={p} className={`nl ${page===p?"on":""}`} onClick={()=>go(p)}>{t.nav[p]}</span>))}
        {user&&<span className={`nl ${page==="orders"?"on":""}`} onClick={()=>go("orders")}>{t.nav.orders}</span>}
        {!user&&<span className="nl" onClick={()=>{setMobileMenu(false);setAuthModal("login");}}>{t.nav.login}</span>}
        {user&&<span className="nl" onClick={()=>{setMobileMenu(false);doLogout();}}>{t.nav.logout}</span>}
        <div style={{borderTop:"1px solid #E5DDD0",marginTop:"auto",paddingTop:16,display:"flex",gap:12}}>
          <button onClick={()=>{setMobileMenu(false);setAdminMode(true);}} style={{cursor:"pointer",background:"none",border:"1px solid #E5DDD0",borderRadius:8,padding:"10px 16px",fontSize:12,fontFamily:"inherit",color:"#666",flex:1}}>{t.footer.admin}</button>
          <button onClick={()=>{setMobileMenu(false);setEmpMode(true);}} style={{cursor:"pointer",background:"none",border:"1px solid #E5DDD0",borderRadius:8,padding:"10px 16px",fontSize:12,fontFamily:"inherit",color:"#666",flex:1}}>{t.footer.employee}</button>
        </div>
      </div>}

      {/* FLOATING CHAT + BACK TO TOP */}
      <button className="wa" title="Support Chat" onClick={()=>setChatOpen(!chatOpen)}>💬</button>
      <ChatWidget lang={lang} open={chatOpen} onClose={()=>setChatOpen(false)}/>
      {showBackTop&&<button className="btt" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>{t.backTop}</button>}

      {/* ═══ AUTH MODAL ═══ */}
      {authModal&&(<div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(44,36,22,0.5)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(5px)",animation:"fadeIn 0.2s",padding:20}} onClick={()=>setAuthModal(null)}>
        <div style={{background:"#FDFBF7",borderRadius:18,maxWidth:440,width:"100%",padding:32,animation:"scaleIn 0.3s"}} onClick={e=>e.stopPropagation()}>
          <div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:32,marginBottom:10}}>🌿</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:22}}>{authModal==="login"?t.auth.login:t.auth.signup}</div></div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <input className="fi" type="email" placeholder={t.auth.email} value={authEmail} onChange={e=>setAuthEmail(e.target.value)} style={{direction:"ltr"}}/>
            <input className="fi" type="password" placeholder={t.auth.password} value={authPass} onChange={e=>setAuthPass(e.target.value)} style={{direction:"ltr"}}/>
            {authErr&&<div style={{color:"#D94F4F",fontSize:12,textAlign:"center"}}>{authErr}</div>}
            <button className="mb" onClick={()=>doAuth(authModal)}>{authModal==="login"?t.auth.login:t.auth.signup}</button>
            <div style={{textAlign:"center",fontSize:12,opacity:0.5}}>{authModal==="login"?t.auth.noAcc:t.auth.haveAcc}{" "}<span style={{color:"#8B7355",cursor:"pointer",textDecoration:"underline"}} onClick={()=>{setAuthModal(authModal==="login"?"signup":"login");setAuthErr("");}}>{authModal==="login"?t.auth.signup:t.auth.login}</span></div>
          </div>
        </div>
      </div>)}

      {/* ═══ ADMIN OVERLAY ═══ */}
      {adminMode&&(<div style={{position:"fixed",inset:0,zIndex:600,background:"rgba(253,251,247,0.98)",overflowY:"auto",animation:"fadeIn 0.2s",padding:20}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24}}>{t.admin.title}</h2>
            <button className="gb" style={{width:"auto",padding:"8px 16px"}} onClick={()=>{setAdminMode(false);setAdminAuth(false);setAdminPin("");setProdModal(null);setAdminTab("products");}}>✕</button>
          </div>
          {!adminAuth?(<div style={{maxWidth:300,margin:"0 auto",textAlign:"center"}}><div style={{fontSize:36,marginBottom:16}}>🔐</div>
            <input className="fi" type="password" placeholder={t.admin.pin} value={adminPin} onChange={e=>setAdminPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&adminLogin()} style={{textAlign:"center",direction:"ltr",marginBottom:12}}/>
            <button className="mb" onClick={adminLogin}>{t.auth.login}</button>
          </div>):(<div>
            {/* TABS */}
            <div style={{display:"flex",gap:6,marginBottom:20,borderBottom:"2px solid #F0EBE3",paddingBottom:8}}>
              {["products","categories"].map(tab=>(<button key={tab} onClick={()=>setAdminTab(tab)} style={{cursor:"pointer",padding:"8px 20px",background:adminTab===tab?"#2C2416":"transparent",color:adminTab===tab?"#FDFBF7":"#2C2416",border:adminTab===tab?"none":"1px solid #E5DDD0",borderRadius:8,fontSize:12.5,fontWeight:600,fontFamily:"inherit",letterSpacing:0.5}}>{tab==="products"?(lang==="en"?"Products":"מוצרים"):(lang==="en"?"Categories":"קטגוריות")}</button>))}
            </div>

            {adminTab==="products"&&(<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div className="sl" style={{margin:0}}>{t.admin.products} ({products.length})</div>
                <button className="cb on" style={{fontSize:12}} onClick={openAddModal}>{t.admin.add}</button>
              </div>
              <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}><thead><tr>
                {["","Name","₪","Stock",""].map((h,i)=>(<th key={i} style={{textAlign:S,padding:"8px 10px",borderBottom:"2px solid #E5DDD0",fontSize:10,textTransform:"uppercase",letterSpacing:1,opacity:0.5}}>{h}</th>))}
              </tr></thead><tbody>
                {products.map(p=>(<tr key={p.id} style={{transition:"background 0.2s"}}>
                  <td style={{padding:"8px 10px",borderBottom:"1px solid #F5F0E8",fontSize:20}}>{p.img}</td>
                  <td style={{padding:"8px 10px",borderBottom:"1px solid #F5F0E8"}}><div style={{fontWeight:500}}>{p.n[lang]}</div><div style={{fontSize:10,opacity:0.4}}>{p.n[lang==="en"?"he":"en"]}</div></td>
                  <td style={{padding:"8px 10px",borderBottom:"1px solid #F5F0E8",fontWeight:600}}>₪{p.price}</td>
                  <td style={{padding:"8px 10px",borderBottom:"1px solid #F5F0E8"}}>{p.stock<=0?<span style={{color:"#D94F4F",fontSize:11,fontWeight:600}}>✕ 0</span>:<span style={{color:"#3D6B3D",fontSize:11,fontWeight:600}}>✓ {p.stock}</span>}</td>
                  <td style={{padding:"8px 10px",borderBottom:"1px solid #F5F0E8",whiteSpace:"nowrap"}}><button style={{cursor:"pointer",background:"transparent",border:"1px solid #E5DDD0",borderRadius:6,padding:"4px 10px",fontSize:11,marginInlineEnd:4,fontFamily:"inherit"}} onClick={()=>openEditModal(p)}>{t.admin.edit}</button><button style={{cursor:"pointer",background:"transparent",border:"1px solid #D94F4F",borderRadius:6,padding:"4px 10px",fontSize:11,color:"#D94F4F",fontFamily:"inherit"}} onClick={()=>delProduct(p.id)}>{t.admin.del}</button></td>
                </tr>))}
              </tbody></table></div>
            </div>)}

            {adminTab==="categories"&&(<div>
              <div style={{marginBottom:20}}>
                <div className="sl" style={{marginBottom:12}}>{lang==="en"?"Add Category":"הוסף קטגוריה"}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
                  <div><div style={{fontSize:9,opacity:0.4,marginBottom:4}}>ID</div><input className="fi" placeholder="e.g. bakery" value={newCat.id} onChange={e=>setNewCat({...newCat,id:e.target.value})} style={{width:120,direction:"ltr"}}/></div>
                  <div><div style={{fontSize:9,opacity:0.4,marginBottom:4}}>Icon</div><input className="fi" placeholder="🥖" value={newCat.icon} onChange={e=>setNewCat({...newCat,icon:e.target.value})} style={{width:60,textAlign:"center"}}/></div>
                  <div><div style={{fontSize:9,opacity:0.4,marginBottom:4}}>English</div><input className="fi" placeholder="Bakery" value={newCat.label.en} onChange={e=>setNewCat({...newCat,label:{...newCat.label,en:e.target.value}})} style={{width:140,direction:"ltr"}}/></div>
                  <div><div style={{fontSize:9,opacity:0.4,marginBottom:4}}>עברית</div><input className="fi" placeholder="מאפייה" value={newCat.label.he} onChange={e=>setNewCat({...newCat,label:{...newCat.label,he:e.target.value}})} style={{width:140}}/></div>
                  <button className="mb" style={{padding:"10px 20px",width:"auto"}} onClick={addCategory}>{t.admin.save}</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
                {categories.map(c=>{const cnt=products.filter(p=>p.cat===c.id).length;return(<div key={c.id} style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:10,padding:14,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:24}}>{c.icon}</span>
                  <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{c.label[lang]}</div><div style={{fontSize:10,opacity:0.4}}>{c.id} · {cnt} {lang==="en"?"products":"מוצרים"}</div></div>
                  <button onClick={()=>delCategory(c.id)} disabled={cnt>0} style={{cursor:cnt>0?"not-allowed":"pointer",background:"none",border:"1px solid "+(cnt>0?"#E5DDD0":"#D94F4F"),borderRadius:6,padding:"4px 8px",fontSize:10,color:cnt>0?"#ccc":"#D94F4F",opacity:cnt>0?0.4:1,fontFamily:"inherit"}}>{t.admin.del}</button>
                </div>);})}
              </div>
            </div>)}
          </div>)}
        </div>
      </div>)}

      {/* ═══ PRODUCT MODAL (Add/Edit) ═══ */}
      {prodModal&&(<div style={{position:"fixed",inset:0,zIndex:700,background:"rgba(44,36,22,0.5)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(5px)",animation:"fadeIn 0.15s",padding:20}} onClick={()=>setProdModal(null)}>
        <div style={{background:"#FDFBF7",borderRadius:16,maxWidth:520,width:"100%",padding:28,animation:"scaleIn 0.25s",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:20}}>{prodModal.mode==="add"?(lang==="en"?"Add Product":"הוסף מוצר"):(lang==="en"?"Edit Product":"ערוך מוצר")}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><div style={{fontSize:9,opacity:0.4,marginBottom:4,textTransform:"uppercase",letterSpacing:0.8}}>Name (EN)</div><input className="fi" value={prodModal.form.n?.en||""} onChange={e=>setProdModal({...prodModal,form:{...prodModal.form,n:{...prodModal.form.n,en:e.target.value}}})} style={{direction:"ltr"}}/></div>
            <div><div style={{fontSize:9,opacity:0.4,marginBottom:4,textTransform:"uppercase",letterSpacing:0.8}}>שם (HE)</div><input className="fi" value={prodModal.form.n?.he||""} onChange={e=>setProdModal({...prodModal,form:{...prodModal.form,n:{...prodModal.form.n,he:e.target.value}}})}/></div>
            <div><div style={{fontSize:9,opacity:0.4,marginBottom:4,textTransform:"uppercase",letterSpacing:0.8}}>Origin (EN)</div><input className="fi" value={prodModal.form.o?.en||""} onChange={e=>setProdModal({...prodModal,form:{...prodModal.form,o:{...prodModal.form.o,en:e.target.value}}})} style={{direction:"ltr"}}/></div>
            <div><div style={{fontSize:9,opacity:0.4,marginBottom:4,textTransform:"uppercase",letterSpacing:0.8}}>מקור (HE)</div><input className="fi" value={prodModal.form.o?.he||""} onChange={e=>setProdModal({...prodModal,form:{...prodModal.form,o:{...prodModal.form.o,he:e.target.value}}})}/></div>
            <div><div style={{fontSize:9,opacity:0.4,marginBottom:4,textTransform:"uppercase",letterSpacing:0.8}}>{t.admin.stock} ({lang==="en"?"qty":"כמות"})</div><input className="fi" type="number" min="0" value={prodModal.form.stockStr||""} onChange={e=>setProdModal({...prodModal,form:{...prodModal.form,stockStr:e.target.value}})} style={{direction:"ltr"}}/></div>
            <div><div style={{fontSize:9,opacity:0.4,marginBottom:4,textTransform:"uppercase",letterSpacing:0.8}}>{t.admin.cat}</div><select className="fi" value={prodModal.form.cat} onChange={e=>setProdModal({...prodModal,form:{...prodModal.form,cat:e.target.value}})}>{categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label[lang]}</option>)}</select></div>
          </div>

          {/* Dual pricing — enable/disable per unit type */}
          <div style={{marginTop:14,marginBottom:10}}>
            <div style={{fontSize:9,opacity:0.4,marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>{lang==="en"?"Pricing (enable unit types)":"תמחור (הפעל סוגי יחידות)"}</div>
            {[["perKg",lang==="en"?"Per kg":"לפי ק״ג"],["perUnit",lang==="en"?"Per unit":"לפי יחידה"],["perPack",lang==="en"?"Per pack":"לפי חבילה"]].map(([uKey,uLabel])=>{
              const prices = prodModal.form.prices||{};
              const enabled = prodModal.form.enabledUnits?.[uKey] ?? (prodModal.form.u===uKey);
              return(
                <div key={uKey} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"8px 10px",background:enabled?"#FFF5E5":"#F5F5F5",borderRadius:8,border:`1px solid ${enabled?"#C4A97D":"#E5DDD0"}`}}>
                  <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",minWidth:90}}>
                    <input type="checkbox" checked={!!enabled} onChange={e=>{
                      const eu={...(prodModal.form.enabledUnits||{[prodModal.form.u||"perKg"]:true}),[uKey]:e.target.checked};
                      const active=UNIT_KEYS.filter(k=>eu[k]);
                      setProdModal({...prodModal,form:{...prodModal.form,enabledUnits:eu,u:active.length===1?active[0]:prodModal.form.u}});
                    }}/>
                    <span style={{fontSize:12.5,fontWeight:500}}>{uLabel}</span>
                  </label>
                  {enabled&&<div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:12,opacity:0.5}}>₪</span>
                    <input className="fi" type="number" min="0" step="0.5" placeholder="0.00"
                      value={prices[uKey]??""} 
                      onChange={e=>{
                        const newPrices={...prices,[uKey]:e.target.value};
                        // keep priceStr in sync with first active unit's price
                        const firstActive=UNIT_KEYS.find(k=>(prodModal.form.enabledUnits||{})[k]);
                        setProdModal({...prodModal,form:{...prodModal.form,prices:newPrices,priceStr:firstActive===uKey?e.target.value:prodModal.form.priceStr}});
                      }}
                      style={{direction:"ltr",padding:"6px 10px",fontSize:13}}/>
                  </div>}
                </div>
              );
            })}
          </div>

          {/* Image — URL or upload */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:9,opacity:0.4,marginBottom:6,textTransform:"uppercase",letterSpacing:0.8}}>{t.admin.image}</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <input className="fi" value={prodModal.form.img||""} onChange={e=>setProdModal({...prodModal,form:{...prodModal.form,img:e.target.value}})} placeholder="🍏 or https://..." style={{flex:1}}/>
              <label style={{cursor:"pointer",padding:"8px 12px",background:"#2C2416",color:"#FDFBF7",borderRadius:8,fontSize:11.5,fontFamily:"inherit",whiteSpace:"nowrap",position:"relative"}}>
                {imgUploading?(lang==="en"?"Uploading...":"מעלה..."):(lang==="en"?"Upload 📷":"העלה 📷")}
                <input type="file" accept="image/*" style={{position:"absolute",inset:0,opacity:0,cursor:"pointer"}} onChange={e=>{if(e.target.files[0])uploadImage(e.target.files[0],(url)=>setProdModal(prev=>({...prev,form:{...prev.form,img:url}})));}}/>
              </label>
            </div>
            {prodModal.form.img&&prodModal.form.img.startsWith("http")&&<img src={prodModal.form.img} alt="preview" style={{width:60,height:60,objectFit:"cover",borderRadius:8,marginTop:6,border:"1px solid #E5DDD0"}}/>}
            {prodModal.form.img&&!prodModal.form.img.startsWith("http")&&<span style={{fontSize:40,display:"block",marginTop:6}}>{prodModal.form.img}</span>}
          </div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[["organic","🌿 Organic"],["seasonal","🍂 Seasonal"],["pop","⭐ Popular"]].map(([k,l])=>(<label key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,cursor:"pointer"}}><input type="checkbox" checked={!!prodModal.form[k]} onChange={e=>setProdModal({...prodModal,form:{...prodModal.form,[k]:e.target.checked}})}/>{l}</label>))}
          </div>
          {(prodModal.form.priceStr&&parseFloat(prodModal.form.priceStr)<=0)&&<div style={{color:"#D94F4F",fontSize:11,marginTop:8}}>{lang==="en"?"Price must be positive":"מחיר חייב להיות חיובי"}</div>}
          <div style={{display:"flex",gap:8,marginTop:18}}><button className="mb" style={{flex:1}} onClick={saveProdModal}>{t.admin.save}</button><button className="gb" style={{flex:1}} onClick={()=>setProdModal(null)}>{t.admin.cancel}</button></div>
        </div>
      </div>)}

      {/* ═══ ORDER SUCCESS ═══ */}
      {orderInfo&&(
        <div className="suc" onClick={()=>setOrderInfo(null)}>
          <div className="succ" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:44,marginBottom:14,color:"#5C7C5C"}}>✓</div>
            <div style={{fontSize:20,fontFamily:"'Playfair Display',serif",marginBottom:8}}>{t.orderDone.title}</div>
            <div style={{color:"#8B7355",fontSize:13.5,marginBottom:12}}>{t.orderDone.msg}</div>
            <div style={{background:"#FFF5E5",border:"1px solid #E5D4B3",borderRadius:10,padding:14,marginBottom:16,fontSize:12.5,color:"#7A5C1E",textAlign:S}}>
              {orderInfo.payMethod==="stripe"
                ? (lang==="en"
                    ?"💳 You're being redirected to secure payment. If not redirected, contact us on WhatsApp."
                    :"💳 הנך מועבר לדף התשלום המאובטח. אם לא הועברת, צור קשר בוואטסאפ.")
                : (lang==="en"
                    ?"💵 Pay in cash upon delivery. Our team will confirm your order shortly."
                    :"💵 תשלום במזומן עם המשלוח. הצוות שלנו יאשר את ההזמנה בקרוב.")
              }
            </div>
            <div style={{background:"#FAF7F0",borderRadius:10,padding:16,marginBottom:20,fontSize:13,textAlign:S}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{opacity:0.5}}>{t.orderDone.delivery}</span><span>{orderInfo.date?fmtD(orderInfo.date,lang):""}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{opacity:0.5}}>{t.orderDone.time}</span><span>{orderInfo.slot?t.cart[orderInfo.slot]:""}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:600,borderTop:"1px solid #E5DDD0",paddingTop:8,marginTop:4}}><span>{t.orderDone.total}</span><span>₪{orderInfo.total}</span></div>
            </div>
            <button className="mb" onClick={()=>{setOrderInfo(null);go("home")}}>{t.orderDone.dismiss}</button>
          </div>
        </div>
      )}

      {/* ═══ QUICK VIEW ═══ */}
      {qv&&(()=>{
        const activeUnits = qv.enabledUnits ? UNIT_KEYS.filter(k=>qv.enabledUnits[k]) : [qv.u||"perKg"];
        const isMultiUnit = activeUnits.length > 1;
        const selectedUnit = notes[`${qv.id}_unit`] || activeUnits[0];
        const displayPrice = qv.unitPrices?.[selectedUnit] ?? qv.price;
        return(
          <div className="qov" onClick={()=>setQv(null)}>
            <div className="qc" onClick={e=>e.stopPropagation()}>
              {/* Image */}
              <div style={{height:200,position:"relative",overflow:"hidden",background:"linear-gradient(145deg,#FAF7F0,#EDE7DA,#F5EFE3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {qv.img?.startsWith("http")
                  ? <img src={qv.img} alt={qv.n[lang]} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{fontSize:72,filter:"drop-shadow(0 6px 12px rgba(44,36,22,0.1))"}}>{qv.img}</span>
                }
                <div style={{position:"absolute",top:12,display:"flex",gap:4,flexWrap:"wrap",[S]:12}}>
                  {qv.organic&&<span className="tag otag">{t.organic}</span>}
                  {qv.seasonal&&<span className="tag stag">{t.seasonalTag}</span>}
                  {qv.pop&&<span className="tag ptag">{t.popular}</span>}
                </div>
                <button onClick={()=>setQv(null)} style={{position:"absolute",top:12,[E]:12,cursor:"pointer",background:"rgba(255,255,255,0.85)",border:"none",borderRadius:"50%",width:32,height:32,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.12)"}}>✕</button>
              </div>

              <div style={{padding:"20px 24px 24px",overflowY:"auto"}}>
                <div style={{fontSize:19,fontFamily:"'Playfair Display',serif",marginBottom:3,fontWeight:400}}>{qv.n[lang]}</div>
                <div style={{fontSize:13,opacity:0.55,marginBottom:14,color:"#8B7355"}}>📍 {qv.o?.[lang]||""}</div>

                {/* Unit selector for multi-unit products, simple price for single */}
                {isMultiUnit ? (
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:9.5,opacity:0.4,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>
                      {lang==="en"?"Choose unit":"בחר יחידה"}
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {activeUnits.map(k=>{
                        const sel = selectedUnit===k;
                        return(
                          <button key={k}
                            onClick={e=>{e.stopPropagation();setNotes(n=>({...n,[`${qv.id}_unit`]:k}));}}
                            style={{padding:"10px 18px",borderRadius:22,border:`2px solid ${sel?"#8B7355":"#E5DDD0"}`,
                              background:sel?"#8B7355":"#fff",color:sel?"#fff":"#2C2416",
                              cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",
                              display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                            <span style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:600}}>
                              ₪{fmtPrice(qv.unitPrices?.[k]||qv.price)}
                            </span>
                            <span style={{fontSize:10.5,opacity:sel?0.85:0.5}}>
                              {UNIT_LABELS[lang]?.[k]||""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {cQty(qv.id)>0&&<div style={{fontSize:11.5,color:"#8B7355",marginTop:8,opacity:0.7}}>
                      {lang==="en"?"In cart":"בעגלה"}: {cQty(qv.id)} × ₪{fmtPrice(displayPrice)} = ₪{fmtPrice(displayPrice*cQty(qv.id))}
                    </div>}
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:16}}>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"#8B7355"}}>₪{fmtPrice(displayPrice)}</span>
                    <span style={{fontSize:11.5,opacity:0.4}}>{UNIT_LABELS[lang]?.[selectedUnit]||""}</span>
                    {cQty(qv.id)>1&&<span style={{fontSize:12,opacity:0.45,marginInlineStart:"auto"}}>
                      = ₪{fmtPrice(displayPrice*cQty(qv.id))}
                    </span>}
                  </div>
                )}

                {/* Special requests — all propagation stopped so typing doesn't close modal */}
                <div style={{marginBottom:16}} onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
                  <div style={{fontSize:9.5,opacity:0.4,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>
                    {lang==="en"?"Special requests (optional)":"בקשות מיוחדות (אופציונלי)"}
                  </div>
                  <textarea
                    value={notes[qv.id]||""}
                    placeholder={lang==="en"
                      ?"e.g. small zucchini for stuffing, very ripe, no stems..."
                      :"למשל: קישואים קטנים לממולאים, בשלים מאוד, בלי גבעולים..."}
                    rows={3}
                    onChange={e=>{e.stopPropagation();setNotes(n=>({...n,[qv.id]:e.target.value}));}}
                    onClick={e=>e.stopPropagation()}
                    onKeyDown={e=>e.stopPropagation()}
                    onFocus={e=>{e.stopPropagation();e.target.style.borderColor="#8B7355";e.target.style.boxShadow="0 0 0 3px rgba(139,115,85,0.1)";}}
                    onBlur={e=>{e.target.style.borderColor="#E5DDD0";e.target.style.boxShadow="none";}}
                    style={{width:"100%",padding:"10px 12px",border:"1.5px solid #E5DDD0",borderRadius:10,
                      fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",
                      background:"#FDFBF7",lineHeight:1.6,boxSizing:"border-box",
                      color:"#2C2416",transition:"border-color 0.2s, box-shadow 0.2s",
                      direction:rtl?"rtl":"ltr"}}
                  />
                  {notes[qv.id]&&(
                    <div style={{fontSize:11,color:"#5C7C5C",marginTop:4,display:"flex",alignItems:"center",gap:4}}>
                      ✓ {lang==="en"?"Request saved — shown in cart":"הבקשה נשמרת ומופיעה בעגלה"}
                    </div>
                  )}
                </div>

                <QtyBtn
                  q={cQty(qv.id)}
                  onAdd={()=>addToCart({...qv, u:selectedUnit, price:displayPrice})}
                  onDec={()=>setQ(qv.id,cQty(qv.id)-1)}
                  onInc={()=>setQ(qv.id,cQty(qv.id)+1)}
                  anim={addedAnim[qv.id]}
                  addL={t.product.add}
                  addedL={t.product.added}
                  oos={qv.stock<=0}
                  oosL={t.product.oos}
                  lowStock={qv.stock>0&&qv.stock<=5?qv.stock:0}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ CART ═══ */}
      {cartOpen&&(<>
        <div className="ov" onClick={()=>setCartOpen(false)}/>
        <div className={`cp ${rtl?"cp-rtl":"cp-ltr"}`}>
          <div style={{padding:"16px 22px",borderBottom:"1px solid #F0EBE3",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <div><span style={{fontSize:18,fontFamily:"'Playfair Display',serif"}}>{step===0?t.cart.title:t.cart.checkout}</span>{step===0&&cc>0&&<span style={{fontSize:11.5,opacity:0.35,marginInlineStart:8}}>{cc} {t.cart.items}</span>}</div>
            <button onClick={()=>setCartOpen(false)} style={{cursor:"pointer",background:"none",border:"none",fontSize:16,opacity:0.35,padding:"4px 6px"}}>✕</button>
          </div>

          {step===0?(<>
            <div style={{flex:1,overflowY:"auto",padding:"6px 22px"}}>
              {cart.length===0?(
                <div style={{textAlign:"center",padding:"48px 0"}}>
                  <div style={{fontSize:38,marginBottom:12,opacity:0.25}}>🧺</div>
                  <div style={{fontWeight:500,marginBottom:5,fontSize:14.5}}>{t.cart.empty}</div>
                  <div style={{fontSize:12.5,opacity:0.4,marginBottom:16}}>{t.cart.emptyMsg}</div>
                  <button className="mb" style={{maxWidth:180,margin:"0 auto"}} onClick={()=>{setCartOpen(false);go("shop")}}>{t.shopNow}</button>
                </div>
              ):cart.map(item=>(
                <div key={item.id} className="ci">
                  <div style={{width:44,height:44,borderRadius:9,overflow:"hidden",flexShrink:0,background:"linear-gradient(135deg,#FAF7F0,#EDE7DA)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{item.img}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:500,fontSize:13}}>{item.n[lang]}</div>
                    <div style={{fontSize:11.5,color:"#8B7355"}}>₪{item.price} {t.product[item.u]}</div>
                    {notes[item.id]&&<div style={{fontSize:10.5,opacity:0.35,marginTop:3,fontStyle:"italic"}}>"{notes[item.id]}"</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                    <span style={{fontWeight:600,fontSize:13.5,fontFamily:"'Playfair Display',serif"}}>₪{item.price*item.qty}</span>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <button className="qb" style={{width:32,height:32,fontSize:15}} onClick={()=>setQ(item.id,item.qty-1)}>−</button>
                      <span style={{fontWeight:600,fontSize:13,minWidth:16,textAlign:"center"}}>{item.qty}</span>
                      <button className="qb" style={{width:32,height:32,fontSize:15}} onClick={()=>setQ(item.id,item.qty+1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length>0&&(
              <div style={{padding:"16px 22px",borderTop:"1px solid #F0EBE3",background:"#FAF7F0",flexShrink:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13,opacity:0.6}}><span>{t.cart.subtotal}</span><span>₪{sub}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13,opacity:0.6}}><span>{t.cart.delivery}</span><span>{delFee===0?(lang==="en"?"Free ✨":"חינם ✨"):`₪${delFee}`}</span></div>
                {delFee>0&&<div style={{fontSize:10.5,opacity:0.3,marginBottom:4}}>{t.cart.freeOver} · {lang==="en"?`₪15 over ₪150`:`₪15 מעל ₪150`}</div>}
                <div style={{display:"flex",justifyContent:"space-between",fontWeight:600,fontSize:17,fontFamily:"'Playfair Display',serif",borderTop:"1px solid #E5DDD0",paddingTop:10,marginTop:6,marginBottom:14}}><span>{t.cart.total}</span><span>₪{tot}</span></div>
                {sub<100?<div style={{textAlign:"center",padding:10,background:"#FFF5E5",borderRadius:8,fontSize:12.5,color:"#8B7355"}}>{t.cart.belowMin.replace("{n}",100-sub)}</div>
                :<button className="mb" onClick={()=>setStep(1)}>{t.cart.checkout}</button>}
              </div>
            )}
          </>):(
            <div style={{flex:1,overflowY:"auto",padding:"16px 22px"}}>
              {/* Progress indicator */}
              <div style={{display:"flex",gap:4,marginBottom:20}}>
                {[cName.trim()&&phoneValid&&cAddr.trim(), delDate, timeSlot].map((done,i)=>(
                  <div key={i} style={{flex:1,height:3,borderRadius:2,background:done?"#8B7355":"#E5DDD0",transition:"background 0.3s"}}/>
                ))}
              </div>
              {/* Order summary */}
              <div style={{marginBottom:22}}>
                <div className="sl">{t.cart.yourOrder}</div>
                <div style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:10,padding:14}}>
                  {cart.map(item=>(
                    <div key={item.id} style={{display:"flex",justifyContent:"space-between",fontSize:12.5,padding:"5px 0",borderBottom:"1px solid #F8F5EF"}}>
                      <span>{item.n[lang]} ×{item.qty}</span><span style={{fontWeight:500}}>₪{item.price*item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Delivery Method Toggle */}
              <div style={{marginBottom:22}}>
                <div className="sl">{t.cart.deliveryMethod}</div>
                <div style={{display:"flex",gap:8}}>
                  <button className={`pb ${deliveryMethod==="deliver"?"on":""}`} onClick={()=>setDeliveryMethod("deliver")}>🚚 {t.cart.deliver}</button>
                  <button className={`pb ${deliveryMethod==="pickup"?"on":""}`} onClick={()=>setDeliveryMethod("pickup")}>🏪 {t.cart.pickup}</button>
                </div>
                {deliveryMethod==="pickup"&&<div style={{marginTop:8,fontSize:11.5,color:"#8B7355",background:"#FFF5E5",borderRadius:8,padding:"8px 12px"}}>{t.cart.pickupNote}</div>}
              </div>
              {/* Contact */}
              <div style={{marginBottom:22}}>
                <div className="sl">{t.cart.contact}</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <Inp val={cName} set={setCName} ph={t.cart.name} req/>
                  <div>
                    <input className="fi" type="tel" placeholder={t.cart.phone} value={cPhone}
                      onChange={e=>setCPhone(e.target.value)} onBlur={()=>setPhoneTouched(true)} required
                      style={{direction:"ltr",width:"100%",...(phoneError?{borderColor:"#D94F4F",boxShadow:"0 0 0 3px rgba(217,79,79,0.08)"}:{})}}/>
                    {phoneError&&<div style={{fontSize:10.5,color:"#D94F4F",marginTop:4}}>{lang==="en"?"Enter a valid Israeli mobile (05XXXXXXXX)":"הזן מספר נייד ישראלי (05XXXXXXXX)"}</div>}
                  </div>
                  <Inp val={cEmail} set={setCEmail} ph={t.cart.email} type="email" error={emailError} onBlur={()=>setEmailTouched(true)}/>
                  {emailError&&<div style={{fontSize:10.5,color:"#D94F4F",marginTop:-6}}>{lang==="en"?"Enter a valid email address":"כתובת אימייל לא תקינה"}</div>}
                  {deliveryMethod==="deliver"&&<>
                    <select className="fi" value={addrCity} onChange={e=>setAddrCity(e.target.value)} style={{color:addrCity?"#2C2416":"#B0A090"}}>
                      <option value="">{lang==="en"?"Select City":"בחר עיר"}</option>
                      {IL_CITIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                    <Inp val={cAddr} set={setCAddr} ph={t.cart.address} req/>
                    <div style={{fontSize:10.5,opacity:0.3,marginTop:-6}}>{t.cart.addressHint}</div>
                  </>}
                </div>
              </div>
              {/* Delivery date & time — only for home delivery */}
              {deliveryMethod==="deliver"&&<>
              <div style={{marginBottom:22}}>
                <div className="sl">{t.cart.deliveryDate}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{getDates().map((d,i)=>(<button key={i} className={`db ${delDate&&d.toDateString()===delDate.toDateString()?"on":""}`} onClick={()=>setDelDate(d)}>{fmtD(d,lang)}</button>))}</div>
              </div>
              <div style={{marginBottom:22}}>
                <div className="sl">{t.cart.timeSlot}</div>
                <div style={{display:"flex",gap:6}}>{SLOTS.map(s=>(<button key={s} className={`tb ${timeSlot===s?"on":""}`} onClick={()=>setTimeSlot(s)}>{t.cart[s]}</button>))}</div>
              </div>
              </>}
              {/* Payment */}
              <div style={{marginBottom:22}}>
                <div className="sl">{t.cart.payMethod}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button className={`pb ${payMethod==="stripe"?"on":""}`} onClick={()=>setPayMethod("stripe")}>
                    💳 {lang==="en"?"Credit Card":"כרטיס אשראי"}
                  </button>
                  <button className={`pb ${payMethod==="cash"?"on":""}`} onClick={()=>setPayMethod("cash")}>
                    💵 {t.cart.cash}
                  </button>
                </div>
                {payMethod==="stripe"&&(
                  <div style={{marginTop:12,background:"#F8F6FF",border:"1px solid #D4C5F9",borderRadius:10,padding:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <span style={{fontSize:18}}>🔒</span>
                      <span style={{fontSize:12,fontWeight:600,color:"#5B4FCF"}}>{lang==="en"?"Secure payment via Stripe":"תשלום מאובטח דרך Stripe"}</span>
                    </div>
                    <div style={{fontSize:11,opacity:0.6,lineHeight:1.6}}>
                      {lang==="en"
                        ?"After placing your order you'll be redirected to Stripe's secure payment page. Supports Visa, Mastercard, American Express."
                        :"לאחר הגשת ההזמנה תועבר לדף התשלום המאובטח של Stripe. תומך בכל סוגי כרטיסי האשראי."}
                    </div>
                    <div style={{display:"flex",gap:4,marginTop:8}}>
                      {["visa","mc","amex"].map(c=>(
                        <div key={c} style={{background:"#fff",border:"1px solid #E5DDD0",borderRadius:4,padding:"3px 7px",fontSize:10,fontWeight:700,color:"#444",letterSpacing:0.5}}>
                          {c==="visa"?"VISA":c==="mc"?"MC":"AMEX"}
                        </div>
                      ))}
                      <div style={{background:"#635BFF",borderRadius:4,padding:"3px 7px",fontSize:10,fontWeight:700,color:"#fff",letterSpacing:0.5}}>stripe</div>
                    </div>
                  </div>
                )}
                {payMethod==="cash"&&(
                  <div style={{marginTop:8,fontSize:11,opacity:0.45,lineHeight:1.5}}>
                    {lang==="en"?"Pay in cash when you receive your order.":"תשלום במזומן עם קבלת ההזמנה."}
                  </div>
                )}
              </div>
              {/* Order note */}
              <div style={{marginBottom:22}}>
                <textarea className="fi" placeholder={t.cart.orderNote} value={cNote} onChange={e=>setCNote(e.target.value)} rows={2} style={{resize:"none"}}/>
              </div>
              {/* Total */}
              <div style={{background:"#fff",borderRadius:10,padding:16,marginBottom:18,border:"1px solid #F0EBE3"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13}}><span>{t.cart.subtotal}</span><span>₪{sub}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13}}><span>{t.cart.delivery}</span><span>{delFee===0?(lang==="en"?"Free":"חינם"):`₪${delFee}`}</span></div>
                {delFee>0&&<div style={{fontSize:10,opacity:0.3,marginBottom:4}}>{t.cart.freeOver}</div>}
                <div style={{borderTop:"1px solid #F0EBE3",marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:600,fontSize:17,fontFamily:"'Playfair Display',serif"}}><span>{t.cart.total}</span><span>₪{tot}</span></div>
              </div>
              <button className="mb" onClick={placeOrder} disabled={!canPlace}>{t.cart.placeOrder} — ₪{tot}</button>
              {!canPlace&&<div style={{textAlign:"center",fontSize:11,opacity:0.4,marginTop:8}}>{lang==="en"?"Please fill in all required fields, select a delivery date and time":"נא למלא את כל השדות, לבחור תאריך ושעת משלוח"}</div>}
              <button className="gb" style={{marginTop:8}} onClick={()=>setStep(0)}>{rtl?"→":"←"} {t.cart.back}</button>
            </div>
          )}
        </div>
      </>)}

      {/* ═══ PAGES ═══ */}
      <div>
        {/* HOME */}
        {page==="home"&&(
          <div style={{animation:"fadeIn 0.5s"}}>
            <div className="hero">
              {/* Floating produce decorations — fixed positions, small & subtle */}
              <div className="hero-deco" style={{top:"10%",left:"6%",fontSize:40,animation:"float 7s ease-in-out infinite"}}>🍋</div>
              <div className="hero-deco" style={{bottom:"18%",right:"6%",fontSize:34,animation:"float 9s ease-in-out infinite 1s"}}>🌿</div>
              <div className="hero-deco" style={{top:"16%",right:"10%",fontSize:30,animation:"float 8s ease-in-out infinite 2s"}}>🍅</div>
              <div className="hero-deco" style={{bottom:"12%",left:"9%",fontSize:26,animation:"float 6s ease-in-out infinite 0.5s"}}>🥦</div>

              <div className="hero-content" style={{opacity:heroVis?1:0,transform:heroVis?"translateY(0)":"translateY(24px)",transition:"all 0.9s cubic-bezier(0.2,0,0,1)"}}>
                <div className="hero-eyebrow">{t.hero.subtitle}</div>
                <h1 className="hero-headline ht">
                  {rtl ? <>גואה <em>בוטיק</em></> : <>GOA <em>boutique</em></>}
                </h1>
                <p className="hero-sub">{t.hero.tagline}</p>
                <button className="hero-cta" onClick={()=>go("shop")}>
                  <span>🛒</span>
                  <span>{t.hero.cta}</span>
                </button>
              </div>
              <div style={{position:"absolute",bottom:14,letterSpacing:4,fontSize:8,opacity:0.15,textTransform:"uppercase",fontFamily:"'Lato',sans-serif",zIndex:1}}>{t.hero.since}</div>
            </div>

            {/* Trust badges */}
            <div className="hero-badges">
              {[
                {icon:"🌱",text:lang==="en"?"100% Fresh":"100% טרי"},
                {icon:"🏡",text:lang==="en"?"Local farmers":"חקלאים מקומיים"},
                {icon:"🚚",text:lang==="en"?"Same-day delivery":"משלוח ביום ההזמנה"},
                {icon:"♻️",text:lang==="en"?"Eco packaging":"אריזה ירוקה"},
              ].map((b,i)=>(
                <div key={i} className="hero-badge">
                  <span className="hero-badge-icon">{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>

            {/* Category quick links */}
            <div style={{maxWidth:680,margin:"0 auto",padding:"44px 24px 20px"}}>
              <div className="section-head">
                <div className="section-tag"><span className="section-divider"/>{t.catQuick}<span className="section-divider"/></div>
              </div>
              <div className="cql">
                {categories.map(c=>(
                  <div key={c.id} className="cqi" onClick={()=>{setCat(c.id);go("shop",true)}}>
                    <span className="cqi-icon">{c.icon}</span>
                    <div className="cqi-label">{c.label[lang]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured */}
            <div style={{maxWidth:1060,margin:"0 auto",padding:"36px 24px 60px"}}>
              <div className="section-head">
                <div className="section-tag"><span className="section-divider"/>{t.freshToday}<span className="section-divider"/></div>
                <h2 className="section-title">{t.seasonal}</h2>
              </div>
              {(()=>{
                const featured = products.filter(p=>(p.seasonal||p.organic)&&(p.stock??0)>0);
                return <>
                  <div className="pg" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                    {featured.slice(0,homeCount).map((p,i)=><PCard key={p.id} p={p} i={i} q={cQty(p.id)} anim={addedAnim[p.id]} onAdd={()=>addToCart(p)} onDec={()=>setQ(p.id,cQty(p.id)-1)} onInc={()=>setQ(p.id,cQty(p.id)+1)} onQv={setQv} lang={lang} t={t} S={S}/>)}
                  </div>
                  <div style={{textAlign:"center",marginTop:36,display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                    {homeCount<featured.length&&<button className="gb" style={{maxWidth:200,borderRadius:28,letterSpacing:1.2,textTransform:"uppercase",fontSize:11.5}} onClick={()=>setHomeCount(c=>c+8)}>{lang==="en"?"Load More ↓":"עוד מוצרים ↓"}</button>}
                    <button className="gb" style={{maxWidth:200,borderRadius:28,letterSpacing:1.2,textTransform:"uppercase",fontSize:11.5}} onClick={()=>go("shop")}>{t.viewAll}</button>
                  </div>
                </>;
              })()}
            </div>
          </div>
        )}

        {/* SHOP */}
        {page==="shop"&&(
          <div style={{maxWidth:1060,margin:"0 auto",padding:"32px 24px 60px",animation:"fadeIn 0.3s"}}>
            {/* Shop header */}
            <div style={{textAlign:"center",marginBottom:28}}>
              <div className="section-tag" style={{justifyContent:"center",marginBottom:8}}>
                <span className="section-divider"/>
                {lang==="en"?"Our Market":"השוק שלנו"}
                <span className="section-divider"/>
              </div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:400,color:"var(--ink)",marginBottom:18}}>{t.nav.shop}</h2>
              {/* Search */}
              <div style={{position:"relative",maxWidth:380,margin:"0 auto",display:"inline-block",width:"100%"}}>
                <span style={{position:"absolute",[S]:14,top:"50%",transform:"translateY(-50%)",fontSize:14,opacity:0.3,cursor:"pointer"}} onClick={()=>searchRef.current?.focus()}>🔍</span>
                <input ref={searchRef} className="si" type="text" placeholder={t.search} value={search} onChange={e=>setSearch(e.target.value)} style={{[`padding${rtl?"Right":"Left"}`]:42}}/>
                {search&&<button onClick={()=>{setSearch("");searchRef.current?.focus()}} style={{position:"absolute",[E]:14,top:"50%",transform:"translateY(-50%)",cursor:"pointer",background:"none",border:"none",fontSize:13,opacity:0.35}}>✕</button>}
              </div>
            </div>

            {/* Filter panel */}
            <div className="shop-filters">
              <div className="filter-cats">
                <div className="filter-cats-pills">
                  {[{id:"all",label:{en:"All",he:"הכל"}},{id:"organic",label:{en:"🌱 Organic",he:"🌱 אורגני"}},...categories.map(c=>({...c,label:{en:`${c.icon} ${c.label.en}`,he:`${c.icon} ${c.label.he}`}}))].map(c=>(
                    <button key={c.id} className={`cb ${cat===c.id?"on":""} ${c.id==="organic"?"organic-btn":""}`}
                      style={{flexShrink:0}}
                      onClick={()=>{setCat(c.id);if(c.id!=="all")setSearch("")}}>
                      {c.label[lang]}
                    </button>
                  ))}
                </div>
                <div style={{flexShrink:0,position:"relative",marginInlineStart:8}} onClick={e=>e.stopPropagation()}>
                  <button className="sb" onClick={()=>setShowSort(!showSort)}>{t.sort.label} ▾</button>
                  {showSort&&<div className="sd">{[["default","—"],["pAsc",t.sort.pAsc],["pDesc",t.sort.pDesc],["name",t.sort.name]].map(([v,l])=>(<button key={v} className={`so ${sortBy===v?"on":""}`} onClick={()=>{setSortBy(v);setShowSort(false)}}>{l}</button>))}</div>}
                </div>
              </div>
              <div className="filter-price-row">
                <span className="filter-price-label">{t.filter.price}:</span>
                <input type="range" className="ri" min={10} max={MAX_P} value={maxPrice} onChange={e=>setMaxPrice(+e.target.value)} style={{flex:1}}/>
                <span style={{fontSize:12,fontWeight:600,color:"var(--earth)",minWidth:38,fontFamily:"'Playfair Display',serif"}}>₪{maxPrice}{maxPrice>=MAX_P?"+":""}</span>
                <span className="filter-count">{filtered.length}/{products.length}</span>
                {hasFilters&&<button className="clb" onClick={clearF}>{t.filter.clear}</button>}
              </div>
            </div>
            <div className="pg" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {filtered.map((p,i)=><PCard key={p.id} p={p} i={i} sm q={cQty(p.id)} anim={addedAnim[p.id]} onAdd={()=>addToCart(p)} onDec={()=>setQ(p.id,cQty(p.id)-1)} onInc={()=>setQ(p.id,cQty(p.id)+1)} onQv={setQv} lang={lang} t={t} S={S}/>)}
            </div>
            {filtered.length===0&&<div style={{textAlign:"center",padding:"56px 0",opacity:0.3}}><div style={{fontSize:38,marginBottom:12}}>🔍</div><div style={{marginBottom:10}}>{lang==="en"?"No products found":"לא נמצאו מוצרים"}</div><button className="clb" onClick={clearF}>{t.filter.clear}</button></div>}
          </div>
        )}

        {/* SUBSCRIPTIONS */}
        {page==="subscriptions"&&(
          <div style={{maxWidth:900,margin:"0 auto",padding:"44px 24px 60px",animation:"fadeIn 0.3s"}}>
            <div style={{textAlign:"center",marginBottom:36}}>
              <div style={{letterSpacing:3,fontSize:9.5,textTransform:"uppercase",opacity:0.35,marginBottom:8}}>🌿</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:400,marginBottom:8}}>{t.sub.title}</h2>
              <p style={{opacity:0.5,maxWidth:420,margin:"0 auto",fontSize:14}}>{t.sub.subtitle}</p>
            </div>
            <div className="sr" style={{display:"flex",gap:16}}>
              {SUBS.map((s,i)=>(
                <div key={s.id} className="sc" style={{animation:`fadeUp 0.4s ${i*0.1}s both`}}>
                  <div style={{fontSize:36,marginBottom:12}}>{s.icon}</div>
                  <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:400,marginBottom:5}}>{t.sub[s.id]}</h3>
                  <p style={{fontSize:12,opacity:0.5,marginBottom:14,lineHeight:1.5}}>{t.sub[s.id+"D"]}</p>
                  <div style={{fontSize:10,opacity:0.35,marginBottom:12}}>{s.items} {t.sub.items}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:27,color:"#8B7355",marginBottom:18}}>₪{s.price}<span style={{fontSize:12.5,opacity:0.5}}>{t.sub.pw}</span></div>
                  <button className="scb" onClick={()=>window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(lang==="en"?`Hi! I'd like to subscribe to the ${t.sub[s.id]} basket (₪${s.price}/week)`:`היי! אשמח להירשם ל${t.sub[s.id]} (₪${s.price}/שבוע)`)}`,"_blank")}>{t.sub.subscribe}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOYALTY */}
        {page==="loyalty"&&(
          <div style={{maxWidth:620,margin:"0 auto",padding:"44px 24px 60px",animation:"fadeIn 0.3s"}}>
            <div style={{textAlign:"center",marginBottom:32}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:400,marginBottom:8}}>{t.loyalty.title}</h2>
              <p style={{opacity:0.5,fontSize:14}}>{t.loyalty.subtitle}</p>
            </div>
            <div className="lc" style={{marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
                <div><div style={{fontSize:9,letterSpacing:2.5,textTransform:"uppercase",opacity:0.4,marginBottom:5}}>{t.loyalty.tier}</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#C4A97D"}}>{t.loyalty.silver}</div></div>
                <div style={{textAlign:rtl?"left":"right"}}><div style={{fontSize:9,letterSpacing:2.5,textTransform:"uppercase",opacity:0.4,marginBottom:5}}>{t.loyalty.points}</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#C4A97D"}}>340</div></div>
              </div>
              <div className="pb2"><div className="pf" style={{width:"34%"}}/></div>
              <div style={{marginTop:6,fontSize:10,opacity:0.35}}>160 {t.loyalty.toGold}</div>
            </div>
            <div className="info-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[{i:"⭐",t:t.loyalty.earn},{i:"🎁",t:t.loyalty.redeem},{i:"🚚",t:t.loyalty.freeDel},{i:"💎",t:t.loyalty.exclusive}].map((x,j)=>(
                <div key={j} style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:12,padding:18,display:"flex",gap:12,alignItems:"flex-start",animation:`fadeUp 0.3s ${j*0.06}s both`}}>
                  <span style={{fontSize:20}}>{x.i}</span><span style={{fontSize:13,lineHeight:1.5}}>{x.t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABOUT */}
        {page==="about"&&(
          <div style={{maxWidth:620,margin:"0 auto",padding:"44px 24px 60px",animation:"fadeIn 0.3s"}}>
            <div style={{textAlign:"center",marginBottom:32}}>
              <div style={{fontSize:44,marginBottom:14}}>🌿</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:400,marginBottom:14}}>{t.about.title}</h2>
              <p style={{fontSize:14.5,lineHeight:1.8,opacity:0.6,maxWidth:490,margin:"0 auto"}}>{t.about.text}</p>
            </div>
            <div className="info-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:28}}>
              <div style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:12,padding:24,textAlign:"center"}}>
                <div style={{fontSize:26,marginBottom:8}}>📍</div>
                <div style={{fontWeight:600,marginBottom:3,fontSize:14}}>{t.about.visit}</div>
                <div
                  style={{fontSize:12.5,opacity:0.6,cursor:"pointer",color:"#8B7355",textDecoration:"underline"}}
                  onClick={()=>window.open("https://waze.com/ul?q=King+George+31+Tel+Aviv&navigate=yes","_blank")}
                >{t.about.addr}</div>
                <div style={{fontSize:11,opacity:0.3,marginTop:5}}>{t.about.hours}</div>
                <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:10}}>
                  <button onClick={()=>window.open("https://waze.com/ul?q=King+George+31+Tel+Aviv&navigate=yes","_blank")} style={{cursor:"pointer",padding:"6px 14px",background:"#00BFFF",color:"#fff",border:"none",borderRadius:16,fontSize:11,fontFamily:"inherit"}}>🚗 Waze</button>
                  <button onClick={()=>window.open("https://maps.google.com/?q=King+George+31+Tel+Aviv","_blank")} style={{cursor:"pointer",padding:"6px 14px",background:"#4285F4",color:"#fff",border:"none",borderRadius:16,fontSize:11,fontFamily:"inherit"}}>🗺 Maps</button>
                </div>
              </div>
              <div style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:12,padding:24,textAlign:"center"}}>
                <div style={{fontSize:26,marginBottom:8}}>💬</div>
                <div style={{fontWeight:600,marginBottom:3,fontSize:14}}>{t.about.wa}</div>
                <div style={{fontSize:12.5,opacity:0.5}}>+972-50-444-5272</div>
                <button onClick={()=>window.open(`https://wa.me/${WA_PHONE}`,"_blank")} style={{cursor:"pointer",marginTop:8,padding:"8px 20px",background:"#25D366",color:"#fff",border:"none",borderRadius:18,fontSize:12,fontFamily:"inherit"}}>{t.about.open}</button>
              </div>
            </div>
          </div>
        )}

        {/* MY ORDERS */}
        {page==="orders"&&(
          <div style={{maxWidth:620,margin:"0 auto",padding:"44px 24px 60px",animation:"fadeIn 0.3s"}}>
            <div style={{textAlign:"center",marginBottom:32}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:400,marginBottom:8}}>{t.myOrders.title}</h2>
              {user&&<div style={{fontSize:12,opacity:0.4}}>{t.auth.loggedAs||""} {user.email}</div>}
            </div>
            {userOrderHistory.length===0?(
              <div style={{textAlign:"center",padding:"48px 0"}}><div style={{fontSize:38,marginBottom:12,opacity:0.25}}>📦</div><div style={{fontSize:14,opacity:0.5}}>{t.myOrders.empty}</div><button className="mb" style={{maxWidth:200,margin:"20px auto 0"}} onClick={()=>go("shop")}>{t.shopNow}</button></div>
            ):userOrderHistory.map(order=>(
              <div key={order.id} style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:12,padding:18,marginBottom:12,animation:"fadeUp 0.3s"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:12,opacity:0.5}}>
                  <span>{new Date(order.date).toLocaleDateString(lang==="he"?"he-IL":"en-US",{day:"numeric",month:"short",year:"numeric"})}</span>
                  <span style={{fontWeight:600,color:"#8B7355"}}>₪{order.total}</span>
                </div>
                <div style={{marginBottom:12}}>
                  {order.items.map((item,j)=>(
                    <div key={j} style={{display:"flex",justifyContent:"space-between",fontSize:12.5,padding:"3px 0"}}>
                      <span>{item.img} {item.n[lang]} ×{item.qty}</span>
                      <span style={{opacity:0.5}}>₪{item.price*item.qty}</span>
                    </div>
                  ))}
                </div>
                <button className="gb" style={{fontSize:12,padding:"8px 16px"}} onClick={()=>reorder(order)}>🔄 {t.myOrders.reorder}</button>
              </div>
            ))}
          </div>
        )}
        {/* PROFILE */}
        {page==="profile"&&user&&(
          <div style={{maxWidth:680,margin:"0 auto",padding:"32px 24px 60px",animation:"fadeIn 0.3s"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontSize:40,marginBottom:8}}>👤</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:400,marginBottom:4}}>{t.profile.title}</h2>
              <div style={{fontSize:12,opacity:0.45}}>{user.email}</div>
              <button onClick={doLogout} style={{marginTop:10,cursor:"pointer",padding:"5px 14px",border:"1px solid #E5DDD0",borderRadius:18,background:"transparent",fontSize:11,fontFamily:"inherit",color:"#8B7355"}}>{t.nav.logout}</button>
            </div>
            {/* Tab nav */}
            <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap"}}>
              {[["orders",lang==="en"?"Orders":"הזמנות"],["addresses",lang==="en"?"Addresses":"כתובות"],["payment",lang==="en"?"Payment":"תשלום"],["loyalty",lang==="en"?"Loyalty":"מועדון"]].map(([tab,label])=>(
                <button key={tab} className={`cb ${profilePage===tab?"on":""}`} onClick={()=>setProfilePage(tab)}>{label}</button>
              ))}
            </div>

            {/* Orders tab */}
            {profilePage==="orders"&&(userOrderHistory.length===0?(
              <div style={{textAlign:"center",padding:"40px 0"}}><div style={{fontSize:34,opacity:0.2,marginBottom:10}}>📦</div><div style={{opacity:0.5}}>{t.myOrders.empty}</div><button className="mb" style={{maxWidth:200,margin:"16px auto 0"}} onClick={()=>go("shop")}>{t.shopNow}</button></div>
            ):userOrderHistory.map(order=>(
              <div key={order.id} style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:12,padding:18,marginBottom:12,animation:"fadeUp 0.3s"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:12,opacity:0.5}}>
                  <span>{new Date(order.date).toLocaleDateString(lang==="he"?"he-IL":"en-US",{day:"numeric",month:"short",year:"numeric"})}</span>
                  <span style={{fontWeight:600,color:"#8B7355"}}>₪{order.total}</span>
                </div>
                {order.items.map((item,j)=>(<div key={j} style={{display:"flex",justifyContent:"space-between",fontSize:12.5,padding:"3px 0"}}><span>{item.img} {item.n[lang]} ×{item.qty}</span><span style={{opacity:0.5}}>₪{fmtPrice(item.price*item.qty)}</span></div>))}
                <button className="gb" style={{fontSize:12,padding:"8px 16px",marginTop:10}} onClick={()=>reorder(order)}>🔄 {t.myOrders.reorder}</button>
              </div>
            )))}

            {/* Addresses tab */}
            {profilePage==="addresses"&&(<div>
              {savedAddresses.length===0&&!showAddrForm&&<div style={{textAlign:"center",padding:"32px 0",opacity:0.4,fontSize:13}}>{t.profile.noAddr}</div>}
              {savedAddresses.map(a=>(
                <div key={a.id} style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:12,padding:16,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><div style={{fontWeight:500,fontSize:13.5}}>{a.street}</div><div style={{fontSize:12,opacity:0.5,marginTop:3}}>{a.city}{a.floor?` · ${lang==="en"?"Floor":"קומה"} ${a.floor}`:""}{a.apt?` · ${lang==="en"?"Apt":"דירה"} ${a.apt}`:""}{a.entry?` · ${lang==="en"?"Code":"קוד"} ${a.entry}`:""}</div></div>
                  <button onClick={()=>deleteAddress(a.id)} style={{cursor:"pointer",background:"none",border:"1px solid #F0EBE3",borderRadius:6,padding:"4px 8px",fontSize:11,color:"#D94F4F",fontFamily:"inherit"}}>{t.profile.deleteAddr}</button>
                </div>
              ))}
              {showAddrForm?(
                <div style={{background:"#FAF7F0",borderRadius:12,padding:18,border:"1px solid #E5DDD0",marginTop:10}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <div style={{gridColumn:"1/-1"}}><input className="fi" placeholder={t.profile.street} value={newAddr.street} onChange={e=>setNewAddr({...newAddr,street:e.target.value})}/></div>
                    <select className="fi" value={addrCity} onChange={e=>setAddrCity(e.target.value)} style={{color:addrCity?"#2C2416":"#B0A090"}}>
                      <option value="">{t.profile.city}</option>
                      {IL_CITIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                    <input className="fi" placeholder={t.profile.floor} value={newAddr.floor} onChange={e=>setNewAddr({...newAddr,floor:e.target.value})}/>
                    <input className="fi" placeholder={t.profile.apt} value={newAddr.apt} onChange={e=>setNewAddr({...newAddr,apt:e.target.value})}/>
                    <input className="fi" placeholder={t.profile.entry} value={newAddr.entry} onChange={e=>setNewAddr({...newAddr,entry:e.target.value})}/>
                  </div>
                  <div style={{display:"flex",gap:8}}><button className="mb" style={{flex:1}} onClick={saveAddress}>{t.profile.saveAddr}</button><button className="gb" style={{flex:1}} onClick={()=>setShowAddrForm(false)}>{t.admin.cancel}</button></div>
                </div>
              ):<button className="gb" style={{width:"100%",marginTop:8}} onClick={()=>setShowAddrForm(true)}>{t.profile.addAddr}</button>}
            </div>)}

            {/* Payment tab */}
            {profilePage==="payment"&&(<div>
              <div style={{background:"#FFF5E5",border:"1px solid #E5D4B3",borderRadius:10,padding:12,marginBottom:16,fontSize:12,color:"#7A5C1E"}}>{lang==="en"?"Card details are stored locally on your device only — not on our servers.":"פרטי הכרטיס נשמרים רק במכשיר שלך — לא בשרתים שלנו."}</div>
              {savedCards.length===0&&!showCardForm&&<div style={{textAlign:"center",padding:"32px 0",opacity:0.4,fontSize:13}}>{t.profile.noCards}</div>}
              {savedCards.map(c=>(
                <div key={c.id} style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:12,padding:16,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontWeight:500,fontSize:13.5}}>•••• •••• •••• {c.last4}</div><div style={{fontSize:12,opacity:0.5,marginTop:3}}>{c.name} · {c.exp}</div></div>
                  <button onClick={()=>deleteCard(c.id)} style={{cursor:"pointer",background:"none",border:"1px solid #F0EBE3",borderRadius:6,padding:"4px 8px",fontSize:11,color:"#D94F4F",fontFamily:"inherit"}}>{t.profile.deleteCard}</button>
                </div>
              ))}
              {showCardForm?(
                <div style={{background:"#FAF7F0",borderRadius:12,padding:18,border:"1px solid #E5DDD0",marginTop:10}}>
                  <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
                    <input className="fi" placeholder={t.profile.cardNum} value={newCard.num} onChange={e=>setNewCard({...newCard,num:e.target.value})} style={{direction:"ltr"}} maxLength={19}/>
                    <input className="fi" placeholder={t.profile.cardName} value={newCard.name} onChange={e=>setNewCard({...newCard,name:e.target.value})}/>
                    <input className="fi" placeholder={t.profile.cardExp} value={newCard.exp} onChange={e=>setNewCard({...newCard,exp:e.target.value})} style={{direction:"ltr"}} maxLength={5}/>
                  </div>
                  <div style={{display:"flex",gap:8}}><button className="mb" style={{flex:1}} onClick={saveCard}>{t.profile.saveCard}</button><button className="gb" style={{flex:1}} onClick={()=>setShowCardForm(false)}>{t.admin.cancel}</button></div>
                </div>
              ):<button className="gb" style={{width:"100%",marginTop:8}} onClick={()=>setShowCardForm(true)}>{t.profile.addCard}</button>}
            </div>)}

            {/* Loyalty tab */}
            {profilePage==="loyalty"&&(
              <div>
                <div className="lc" style={{marginBottom:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                    <div><div style={{fontSize:9,letterSpacing:2.5,textTransform:"uppercase",opacity:0.4,marginBottom:5}}>{t.profile.tier}</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#C4A97D"}}>{t.profile.silver}</div></div>
                    <div style={{textAlign:rtl?"left":"right"}}><div style={{fontSize:9,letterSpacing:2.5,textTransform:"uppercase",opacity:0.4,marginBottom:5}}>{t.profile.points}</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#C4A97D"}}>{userOrderHistory.reduce((s,o)=>s+Math.floor((o.total||0)/10),0)}</div></div>
                  </div>
                  <div className="pb2"><div className="pf" style={{width:`${Math.min(100,userOrderHistory.reduce((s,o)=>s+Math.floor((o.total||0)/10),0)/5)}%`}}/></div>
                  <div style={{marginTop:6,fontSize:10,opacity:0.35}}>{Math.max(0,500-userOrderHistory.reduce((s,o)=>s+Math.floor((o.total||0)/10),0))} {lang==="en"?"pts to Gold":"נקודות לזהב"}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[{i:"⭐",t:t.loyalty.earn},{i:"🎁",t:t.loyalty.redeem},{i:"🚚",t:t.loyalty.freeDel},{i:"💎",t:t.loyalty.exclusive}].map((x,j)=>(
                    <div key={j} style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:12,padding:16,display:"flex",gap:10,alignItems:"flex-start"}}>
                      <span style={{fontSize:20}}>{x.i}</span><span style={{fontSize:12.5,lineHeight:1.5}}>{x.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="mob-nav">
        <div className="mob-nav__items">
          <button className={`mob-nav__btn ${page==="home"?"on":""}`} onClick={()=>go("home")}>
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>{t.nav.home}</span>
          </button>
          <button className={`mob-nav__btn ${page==="shop"?"on":""}`} onClick={()=>go("shop")}>
            <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
            <span>{t.nav.shop}</span>
          </button>
          <button className="mob-nav__btn" onClick={()=>{setCartOpen(true);setStep(0)}} style={{position:"relative"}}>
            <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            {cc>0&&<span className="mob-nav__badge">{cc}</span>}
            <span>{t.cart.title}</span>
          </button>
          <button className="mob-nav__btn" onClick={()=>window.open(`https://wa.me/${WA_PHONE}`,"_blank")}>
            <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{borderTop:"1px solid #F0EBE3",padding:"30px 24px",textAlign:"center"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,letterSpacing:2.5,marginBottom:6}}>GOA</div>
        <div style={{fontSize:10,opacity:0.3,marginBottom:8}}>© 2026 GOA Boutique Greengrocer. {t.footer.rights}.</div>
        <div style={{display:"flex",justifyContent:"center",gap:16}}>
          <button onClick={()=>setAdminMode(true)} style={{cursor:"pointer",background:"none",border:"none",fontSize:9,opacity:0.15,fontFamily:"inherit",color:"#2C2416"}}>{t.footer.admin}</button>
          <button onClick={()=>setEmpMode(true)} style={{cursor:"pointer",background:"none",border:"none",fontSize:9,opacity:0.15,fontFamily:"inherit",color:"#2C2416"}}>{t.footer.employee}</button>
        </div>
      </footer>
    </div>
  );
}