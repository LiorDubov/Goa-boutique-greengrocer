export const WA_PHONE  = "972504445272";
export const STRIPE_PK   = "";   // pk_live_xxx or pk_test_xxx
export const STRIPE_LINK = "";   // https://buy.stripe.com/xxx
export const ADMIN_PIN = "1234";
export const EMP_PIN   = "5678";

export const LS = (k, v) => {
  try {
    if (v !== undefined) localStorage.setItem(k, JSON.stringify(v));
    const s = localStorage.getItem(k);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

export const UNIT_KEYS   = ["perKg", "perUnit", "perPack"];
export const UNIT_LABELS = {
  en: { perKg: "/kg", perUnit: "/unit", perPack: "/pack" },
  he: { perKg: "/ק״ג", perUnit: "/יחידה", perPack: "/חבילה" }
};
export const MAX_P = 80;

export const roundUp1  = (n) => Math.ceil(n * 10) / 10;
export const fmtPrice  = (n) => roundUp1(n).toFixed(1).replace(/\.0$/, "");
export const getDates  = () => {
  const o = [], d = new Date();
  for (let i = 1; i <= 7; i++) {
    const x = new Date(d); x.setDate(d.getDate() + i);
    if (x.getDay() !== 6) o.push(x);
  }
  return o;
};
export const fmtD = (d, l) =>
  d.toLocaleDateString(l === "he" ? "he-IL" : "en-US", { weekday: "short", month: "short", day: "numeric" });
export const SLOTS = ["morning", "afternoon", "evening"];

export const IL_CITIES = [
  "תל אביב","ירושלים","חיפה","ראשון לציון","פתח תקווה","אשדוד","נתניה",
  "באר שבע","בני ברק","רמת גן","גבעתיים","הרצליה","כפר סבא","רעננה",
  "הוד השרון","רחובות","בת ים","חולון","אשקלון","עפולה","נצרת עילית","קריות"
];

export const SUBS = [
  { id: "small",  price: 89,  items: "8–10",  icon: "🧺" },
  { id: "medium", price: 149, items: "14–18", icon: "🏡" },
  { id: "large",  price: 229, items: "20–25", icon: "✨" }
];

export const DEFAULT_CATS = [
  { id: "fruits",     icon: "🍊", label: { en: "Fruits",       he: "פירות" } },
  { id: "vegetables", icon: "🥬", label: { en: "Vegetables",   he: "ירקות" } },
  { id: "herbs",      icon: "🌿", label: { en: "Herbs & Spices", he: "תבלינים" } },
  { id: "dairy",      icon: "🧀", label: { en: "Dairy & Eggs", he: "חלב וביצים" } },
  { id: "pantry",     icon: "🫙", label: { en: "Pantry",       he: "מזווה" } },
];

export const T = {
  en: {
    nav:{ home:"Home", shop:"Shop", subscriptions:"Subscriptions", loyalty:"Rewards", about:"About", orders:"My Orders", login:"Login", logout:"Logout", profile:"Profile" },
    hero:{ subtitle:"BOUTIQUE GREENGROCER", tagline:"Where Nature Meets Luxury", cta:"Explore Collection", since:"King George 31, Tel Aviv" },
    banner:"Free delivery on orders over ₪250 · New weekly subscription boxes available",
    categories:{ all:"All", fruits:"Fruits", vegetables:"Vegetables", herbs:"Herbs & Spices", dairy:"Dairy & Eggs", pantry:"Pantry", organic:"Organic" },
    product:{ add:"Add", added:"✓", notes:"Special requests...", perKg:"/kg", perUnit:"/unit", perPack:"/pack", oos:"Out of Stock" },
    cart:{
      title:"Your Selection", empty:"Your cart is empty", emptyMsg:"Browse our collection and add your favorites",
      subtotal:"Subtotal", delivery:"Delivery", total:"Total", checkout:"Proceed to Checkout",
      minimum:"Minimum order ₪100", belowMin:"Add ₪{n} more to reach minimum",
      deliveryDate:"Delivery Date", timeSlot:"Time Slot",
      morning:"Morning (8–12)", afternoon:"Afternoon (12–17)", evening:"Evening (17–21)",
      cash:"Cash on Delivery", card:"Pay Online", payMethod:"Payment", placeOrder:"Place Order",
      freeOver:"Free over ₪250", back:"Back to Cart", items:"items", yourOrder:"Your Order",
      contact:"Contact Details", name:"Full Name", phone:"Phone Number",
      email:"Email (optional)", address:"Delivery Address", addressHint:"Street, building, apartment, floor",
      orderNote:"Order Notes (optional)", pickup:"Self Pickup",
      pickupNote:"Pickup from store: King George 31, Tel Aviv",
      deliveryMethod:"Delivery Method", deliver:"Home Delivery"
    },
    sub:{
      title:"Weekly Baskets", subtitle:"Curated selections delivered to your door every week",
      small:"Essential", medium:"Family", large:"Gourmet",
      smallD:"Seasonal fruits & veg for 1–2 people", mediumD:"A generous mix for the whole family",
      largeD:"Premium selection with exotic items", subscribe:"Subscribe", pw:"/week", items:"items/week"
    },
    loyalty:{
      title:"GOA Rewards", subtitle:"Every purchase earns points towards exclusive rewards",
      points:"Points", tier:"Tier", silver:"Silver", earn:"Earn 1 pt per ₪10 spent",
      redeem:"Redeem for discounts & free delivery", freeDel:"Free delivery at Gold tier",
      exclusive:"Exclusive member offers", toGold:"pts to Gold"
    },
    about:{
      title:"Our Story",
      text:"GOA Boutique Greengrocer brings the finest, freshest produce to the heart of Tel Aviv. Located on King George 31, we source directly from local farms and premium importers to deliver an unmatched grocery experience.",
      visit:"Visit Us", addr:"King George 31, Tel Aviv", wa:"Chat on WhatsApp",
      hours:"Sun–Thu 8AM–9PM · Fri 8AM–Shabbat · Sat Closed", open:"Open Chat",
      story1:"", story2:"", story3:""   // ← fill in your custom story paragraphs here
    },
    footer:{ rights:"All rights reserved", admin:"Admin", employee:"Staff" },
    search:"Search products...",
    sort:{ label:"Sort", pAsc:"Price ↑", pDesc:"Price ↓", name:"Name A–Z" },
    filter:{ showing:"Showing", of:"of", products:"products", clear:"Clear all", price:"Max price" },
    shopNow:"Shop Now", viewAll:"View All Products", freshToday:"FRESH TODAY", seasonal:"Seasonal Highlights",
    organic:"Organic", seasonalTag:"Seasonal", popular:"Popular", backTop:"↑", catQuick:"Shop by Category",
    orderDone:{ title:"Thank You!", msg:"Your order has been sent via WhatsApp", delivery:"Delivery", time:"Time Slot", total:"Total", dismiss:"Continue Shopping" },
    auth:{ login:"Login", signup:"Sign Up", email:"Email", password:"Password", noAcc:"Don't have an account?", haveAcc:"Already have an account?" },
    myOrders:{ title:"My Orders", empty:"No orders yet — start shopping!", reorder:"Reorder", date:"Date", items:"Items", total:"Total" },
    profile:{
      title:"My Profile", addresses:"Saved Addresses", addAddr:"+ Add Address", noAddr:"No saved addresses",
      street:"Street & Number", city:"City", floor:"Floor", apt:"Apartment", entry:"Entry Code",
      saveAddr:"Save Address", deleteAddr:"Delete", payment:"Payment Methods", addCard:"+ Add Card",
      noCards:"No saved cards", cardNum:"Card Number", cardName:"Cardholder Name", cardExp:"Expiry (MM/YY)",
      saveCard:"Save Card", deleteCard:"Delete", points:"Loyalty Points", tier:"Tier", silver:"Silver", gold:"Gold"
    },
    admin:{
      title:"Admin Dashboard", qty:"Quantity", pin:"Enter PIN", products:"Product Manager",
      name:"Name (EN)", nameHe:"Name (HE)", price:"Price", cat:"Category", unit:"Unit",
      image:"Image URL", origin:"Origin (EN)", originHe:"Origin (HE)", stock:"Stock",
      inStock:"In Stock", outOfStock:"Out of Stock", save:"Save", add:"+ Add Product",
      del:"Delete", edit:"Edit", cancel:"Cancel"
    },
    emp:{
      title:"Employee Dashboard", accept:"Accept", processing:"Processing", finalize:"Finalize Order",
      pending:"Pending", completed:"Completed", actualWt:"Actual Weight (kg)", recalc:"Recalculated",
      noOrders:"No orders yet", alertNew:"NEW!", liveOrders:"Live Orders", back:"← Back to Store"
    },
    chat:{
      title:"GOA Support", askHours:"What are your hours?", askZones:"Delivery zones?", askHuman:"Talk to a human",
      hoursA:"We're open Sun–Thu 08:00–21:00, Friday 08:00 until Shabbat. Closed Saturday 🕐",
      zonesA:"We deliver exclusively within Tel Aviv 🚚 Select your street at checkout.",
      humanA:"Connecting you to WhatsApp...", placeholder:"Type a message...", bot:"GOA Bot", you:"You"
    }
  },
  he: {
    nav:{ home:"בית", shop:"חנות", subscriptions:"מנויים", loyalty:"מועדון", about:"אודות", orders:"ההזמנות שלי", login:"התחברות", logout:"התנתקות", profile:"פרופיל" },
    hero:{ subtitle:"ירקניית בוטיק", tagline:"כשהטבע פוגש יוקרה", cta:"גלה את האוסף", since:"המלך ג׳ורג׳ 31, תל אביב" },
    banner:"משלוח חינם בהזמנות מעל ₪250 · חדש: סלים שבועיים במנוי",
    categories:{ all:"הכל", fruits:"פירות", vegetables:"ירקות", herbs:"תבלינים", dairy:"חלב וביצים", pantry:"מזווה", organic:"אורגני" },
    product:{ add:"הוסף", added:"✓", notes:"בקשות מיוחדות...", perKg:"/ק״ג", perUnit:"/יחידה", perPack:"/חבילה", oos:"אזל מהמלאי" },
    cart:{
      title:"הבחירה שלך", empty:"העגלה ריקה", emptyMsg:"גלו את המבחר שלנו",
      subtotal:"סכום ביניים", delivery:"משלוח", total:"סה״כ", checkout:"המשך לתשלום",
      minimum:"הזמנה מינימלית ₪100", belowMin:"הוסף עוד ₪{n} להזמנה מינימלית",
      deliveryDate:"תאריך משלוח", timeSlot:"שעת משלוח",
      morning:"בוקר (8–12)", afternoon:"צהריים (12–17)", evening:"ערב (17–21)",
      cash:"מזומן בעת משלוח", card:"תשלום אונליין", payMethod:"תשלום", placeOrder:"בצע הזמנה",
      freeOver:"חינם מעל ₪250", back:"חזרה לעגלה", items:"פריטים", yourOrder:"ההזמנה שלך",
      contact:"פרטי התקשרות", name:"שם מלא", phone:"מספר טלפון",
      email:"אימייל (אופציונלי)", address:"כתובת למשלוח", addressHint:"רחוב, בניין, דירה, קומה",
      orderNote:"הערות להזמנה (אופציונלי)", pickup:"איסוף עצמי",
      pickupNote:"איסוף מהחנות: המלך ג׳ורג׳ 31, תל אביב",
      deliveryMethod:"אופן קבלה", deliver:"משלוח עד הבית"
    },
    sub:{
      title:"סלים שבועיים", subtitle:"מבחר שנאסף במיוחד ומגיע אליך כל שבוע",
      small:"בסיסי", medium:"משפחתי", large:"גורמה",
      smallD:"פירות וירקות עונתיים ל-1-2 אנשים", mediumD:"מבחר נדיב לכל המשפחה",
      largeD:"מבחר פרימיום עם פריטים אקזוטיים", subscribe:"הירשם", pw:"/שבוע", items:"פריטים/שבוע"
    },
    loyalty:{
      title:"מועדון GOA", subtitle:"כל רכישה צוברת נקודות להטבות בלעדיות",
      points:"נקודות", tier:"דרגה", silver:"כסף", earn:"נקודה על כל ₪10",
      redeem:"מימוש להנחות ומשלוח חינם", freeDel:"משלוח חינם בדרגת זהב",
      exclusive:"הצעות בלעדיות לחברים", toGold:"נקודות לזהב"
    },
    about:{
      title:"הסיפור שלנו",
      text:"GOA ירקניית בוטיק מביאה את התוצרת הטרייה והמובחרת ביותר ללב תל אביב. ממוקמת ברחוב המלך ג׳ורג׳ 31, אנו עובדים ישירות עם חקלאים מקומיים ויבואנים מובחרים כדי להעניק חוויית קנייה ללא תחרות.",
      visit:"בקרו אותנו", addr:"המלך ג׳ורג׳ 31, תל אביב", wa:"וואטסאפ",
      hours:"א׳–ה׳ 08:00–21:00 · ו׳ 08:00 עד שבת · שבת סגור", open:"פתח צ׳אט",
      story1:"", story2:"", story3:""   // ← fill in your custom story paragraphs here
    },
    footer:{ rights:"כל הזכויות שמורות", admin:"ניהול", employee:"צוות" },
    search:"חפש מוצרים...",
    sort:{ label:"מיון", pAsc:"מחיר ↑", pDesc:"מחיר ↓", name:"שם א–ת" },
    filter:{ showing:"מציג", of:"מתוך", products:"מוצרים", clear:"נקה", price:"מחיר מקסימלי" },
    shopNow:"קנה עכשיו", viewAll:"כל המוצרים", freshToday:"טרי היום", seasonal:"מיוחדי העונה",
    organic:"אורגני", seasonalTag:"עונתי", popular:"פופולרי", backTop:"↑", catQuick:"קנייה לפי קטגוריה",
    orderDone:{ title:"תודה רבה!", msg:"ההזמנה שלך נשלחה בוואטסאפ", delivery:"משלוח", time:"שעת משלוח", total:"סה״כ", dismiss:"המשך קנייה" },
    auth:{ login:"התחברות", signup:"הרשמה", email:"אימייל", password:"סיסמה", noAcc:"אין לך חשבון?", haveAcc:"כבר יש לך חשבון?" },
    myOrders:{ title:"ההזמנות שלי", empty:"אין הזמנות עדיין — התחילו לקנות!", reorder:"הזמן שוב", date:"תאריך", items:"פריטים", total:"סה״כ" },
    profile:{
      title:"הפרופיל שלי", addresses:"כתובות שמורות", addAddr:"+ הוסף כתובת", noAddr:"אין כתובות שמורות",
      street:"רחוב ומספר", city:"עיר", floor:"קומה", apt:"דירה", entry:"קוד כניסה",
      saveAddr:"שמור כתובת", deleteAddr:"מחק", payment:"אמצעי תשלום", addCard:"+ הוסף כרטיס",
      noCards:"אין כרטיסים שמורים", cardNum:"מספר כרטיס", cardName:"שם בעל הכרטיס", cardExp:"תוקף (MM/YY)",
      saveCard:"שמור כרטיס", deleteCard:"מחק", points:"נקודות מועדון", tier:"דרגה", silver:"כסף", gold:"זהב"
    },
    admin:{
      title:"לוח ניהול", qty:"כמות", pin:"הזן PIN", products:"ניהול מוצרים",
      name:"שם (EN)", nameHe:"שם (HE)", price:"מחיר", cat:"קטגוריה", unit:"יחידה",
      image:"קישור תמונה", origin:"מקור (EN)", originHe:"מקור (HE)", stock:"מלאי",
      inStock:"במלאי", outOfStock:"אזל", save:"שמור", add:"+ הוסף מוצר",
      del:"מחק", edit:"ערוך", cancel:"ביטול"
    },
    emp:{
      title:"לוח עובדים", accept:"קבל", processing:"בעיבוד", finalize:"סיום הזמנה",
      pending:"ממתין", completed:"הושלם", actualWt:"משקל בפועל (ק״ג)", recalc:"חושב מחדש",
      noOrders:"אין הזמנות עדיין", alertNew:"חדש!", liveOrders:"הזמנות חיות", back:"→ חזרה לחנות"
    },
    chat:{
      title:"תמיכה GOA", askHours:"מה שעות הפעילות?", askZones:"אזורי משלוח?", askHuman:"דבר עם נציג",
      hoursA:"אנחנו פתוחים א׳–ה׳ 08:00–21:00, שישי 08:00 עד כניסת שבת. שבת סגור 🕐",
      zonesA:"אנחנו מגיעים לתל אביב בלבד 🚚 בחרו את הרחוב שלכם בעת ההזמנה.",
      humanA:"מעביר לוואטסאפ...", placeholder:"הקלד הודעה...", bot:"בוט GOA", you:"אתה"
    }
  }
};
