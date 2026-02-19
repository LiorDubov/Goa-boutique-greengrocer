import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, doc, setDoc, getDoc, 
  onSnapshot, query, addDoc, updateDoc, deleteDoc, increment 
} from "firebase/firestore";
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken 
} from "firebase/auth";

/* ═══ FIREBASE CONFIG ═══ */
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
const appId = "goa-boutique-prod";

const PRODUCTS_COL = collection(db, "artifacts", appId, "public", "data", "products");
const ORDERS_COL = collection(db, "artifacts", appId, "public", "data", "orders");
const CATEGORIES_COL = collection(db, "artifacts", appId, "public", "data", "categories");

const prodDoc = (id) => doc(db, "artifacts", appId, "public", "data", "products", String(id));
const orderDoc = (id) => doc(db, "artifacts", appId, "public", "data", "orders", id);
const catDoc = (id) => doc(db, "artifacts", appId, "public", "data", "categories", id);

/* ═══ CONFIG ═══ */
const WA_PHONE = "972504445272";
const ADMIN_PIN = "1234";

const T = {
  he: {
    nav:{home:"בית",shop:"חנות",subscriptions:"מנויים",loyalty:"מועדון",about:"אודות",orders:"ההזמנות שלי",login:"התחברות",logout:"התנתקות"},
    hero:{subtitle:"ירקניית בוטיק",tagline:"כשהטבע פוגש יוקרה",cta:"גלה את האוסף",since:"המלך ג׳ורג׳ 31, תל אביב"},
    banner:"משלוח חינם בהזמנות מעל ₪250 · חדש: סלים שבועיים במנוי",
    categories:{all:"הכל",fruits:"פירות",vegetables:"ירקות",herbs:"תבלינים",dairy:"חלב וביצים",pantry:"מזווה",organic:"אורגני"},
    product:{add:"הוסף",added:"✓",notes:"בקשות מיוחדות...",perKg:"/ק״ג",perUnit:"/יחידה",perPack:"/חבילה",oos:"אזל"},
    cart:{title:"הבחירה שלך",empty:"העגלה ריקה",emptyMsg:"גלו את המבחר שלנו",subtotal:"סכום ביניים",delivery:"משלוח",total:"סה״כ",checkout:"המשך לתשלום",minimum:"הזמנה מינימלית ₪100",belowMin:"הוסף עוד ₪{n} להזמנה מינימלית",deliveryDate:"תאריך משלוח",timeSlot:"שעת משלוח",morning:"בוקר (8–12)",afternoon:"צהריים (12–17)",evening:"ערב (17–21)",cash:"מזומן בעת משלוח",card:"תשלום אונליין",payMethod:"תשלום",placeOrder:"בצע הזמנה",freeOver:"חינם מעל ₪250",back:"חזרה לעגלה",items:"פריטים",yourOrder:"ההזמנה שלך",contact:"פרטי התקשרות",name:"שם מלא",phone:"מספר טלפון",email:"אימייל (אופציונלי)",address:"כתובת למשלוח",addressHint:"רחוב, בניין, דירה, קומה",orderNote:"הערות להזמנה (אופציונלי)"},
    sub:{title:"סלים שבועיים",subtitle:"מבחר שנאסף במיוחד ומגיע אליך כל שבוע",small:"בסיסי",medium:"משפחתי",large:"גורמה",smallD:"פירות וירקות עונתיים ל-1-2 אנשים",mediumD:"מבחר נדיב לכל המשפחה",largeD:"מבחר פרימיום עם פריטים אקזוטיים",subscribe:"הירשם",pw:"/שבוע",items:"items/week"},
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
    myOrders:{title:"ההזמנות שלי",empty:"אין הזמנות עדיין",reorder:"הזמן שוב",date:"תאריך",items:"פריטים",total:"סה״כ"},
    admin:{title:"לוח ניהול",qty:"כמות",pin:"הזן PIN",products:"ניהול מוצרים",name:"שם (EN)",nameHe:"שם (HE)",price:"מחיר",cat:"קטגוריה",unit:"יחידה",image:"קישור תמונה",origin:"מקור (EN)",originHe:"מקור (HE)",stock:"מלאי",inStock:"במלאי",outOfStock:"אזל",save:"שמור",add:"+ הוסף מוצר",del:"מחק",edit:"ערוך",cancel:"ביטול"},
    emp:{title:"לוח עובדים",accept:"קבל",processing:"בעיבוד",finalize:"סיום",pending:"ממתין",completed:"הושלם",actualWt:"משקל",recalc:"חושב",noOrders:"אין הזמנות",alertNew:"חדש!",liveOrders:"הזמנות",back:"חזרה"},
    chat:{title:"תמיכה GOA",askHours:"שעות פעילות?",askZones:"אזורי משלוח?",askHuman:"נציג",hoursA:"א-ה 7:00-21:00",zonesA:"תל אביב והסביבה",humanA:"מעביר לוואטסאפ...",placeholder:"הודעה...",bot:"בוט",you:"אתה"}
  },
  en: { 
      nav:{home:"Home",shop:"Shop",subscriptions:"Subscriptions",loyalty:"Rewards",about:"About",orders:"My Orders",login:"Login",logout:"Logout"},
    hero:{subtitle:"BOUTIQUE GREENGROCER",tagline:"Where Nature Meets Luxury",cta:"Explore Collection",since:"King George 31, Tel Aviv"},
    banner:"Free delivery on orders over ₪250 · New weekly subscription boxes available",
    categories:{all:"All",fruits:"Fruits",vegetables:"Vegetables",herbs:"Herbs & Spices",dairy:"Dairy & Eggs",pantry:"Pantry",organic:"Organic"},
    product:{add:"Add",added:"✓",notes:"Special requests...",perKg:"/kg",perUnit:"/unit",perPack:"/pack",oos:"Out of Stock"},
    cart:{title:"Your Selection",empty:"Your cart is empty",emptyMsg:"Browse our collection and add your favorites",subtotal:"Subtotal",delivery:"Delivery",total:"Total",checkout:"Proceed to Checkout",minimum:"Minimum order ₪100",belowMin:"Add ₪{n} more to reach minimum",deliveryDate:"Delivery Date",timeSlot:"Time Slot",morning:"Morning (8–12)",afternoon:"Afternoon (12–17)",evening:"Evening (17–21)",cash:"Cash on Delivery",card:"Pay Online",payMethod:"Payment",placeOrder:"Place Order",freeOver:"Free over ₪250",back:"Back to Cart",items:"items",yourOrder:"Your Order",contact:"Contact Details",name:"Full Name",phone:"Phone Number",email:"Email (optional)",address:"Delivery Address",addressHint:"Street, building, apartment, floor",orderNote:"Order Notes (optional)"},
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
    admin:{title:"Admin Dashboard",qty:"Quantity",pin:"Enter PIN",products:"Product Manager",name:"Name (EN)",nameHe:"Name (HE)",price:"Price",cat:"Category",unit:"Unit",image:"Image URL",origin:"Origin (EN)",originHe:"Origin (HE)",stock:"Stock",inStock:"In Stock",outOfStock:"Out of Stock",save:"Save",add:"+ Add Product",del:"Delete",edit:"Edit",cancel:"Cancel"},
    emp:{title:"Employee Dashboard",accept:"Accept",processing:"Processing",finalize:"Finalize Order",pending:"Pending",completed:"Completed",actualWt:"Actual Weight (kg)",recalc:"Recalculated",noOrders:"No orders yet",alertNew:"NEW!",liveOrders:"Live Orders",back:"← Back to Store"},
    chat:{title:"GOA Support",askHours:"What are your hours?",askZones:"Delivery zones?",askHuman:"Talk to a human",hoursA:"We're open Sun–Thu 7AM–9PM and Fri 7AM–3PM 🕐",zonesA:"We deliver across Tel Aviv, Ramat Gan, Givatayim, and Herzliya 🚚",humanA:"Connecting you to WhatsApp...",placeholder:"Type a message...",bot:"GOA Bot",you:"You"}
  }
};

const DEFAULT_CATS = [
  {id:"fruits",icon:"🍊",label:{en:"Fruits",he:"פירות"}},
  {id:"vegetables",icon:"🥬",label:{en:"Vegetables",he:"ירקות"}},
  {id:"herbs",icon:"🌿",label:{en:"Herbs & Spices",he:"תבלינים"}},
  {id:"dairy",icon:"🧀",label:{en:"Dairy & Eggs",he:"חלב וביצים"}},
  {id:"pantry",icon:"🫙",label:{en:"Pantry",he:"מזווה"}},
];

/* ═══ SUB-COMPONENTS (Defined OUTSIDE for Focus stability) ═══ */
const Inp = ({ val, set, ph, type="text", req, error, onBlur }) => (
  <input className="fi" type={type} placeholder={ph} value={val || ""}
    onChange={e=>set(e.target.value)} onBlur={onBlur} required={req}
    style={{direction:type==="tel"?"ltr":undefined,width:"100%",
      ...(error?{borderColor:"#D94F4F",boxShadow:"0 0 0 3px rgba(217,79,79,0.08)"}:{})}}/>
);

const QtyBtn = ({q,onAdd,onDec,onInc,anim,addL,addedL,sm,oos,oosL}) => {
  if(oos) return <div style={{textAlign:"center",fontSize:11,color:"#D94F4F",opacity:0.7,padding:"8px 0"}}>{oosL}</div>;
  if(!q) return <button className="add-btn" style={sm?{padding:"8px 14px",fontSize:12}:{}} onClick={onAdd}>{anim?addedL:addL}</button>;
  return <div style={{display:"flex",alignItems:"center",gap:sm?8:10,justifyContent:"center"}}>
    <button className="qb" onClick={onDec}>−</button>
    <span style={{fontWeight:600,minWidth:22,textAlign:"center",fontSize:sm?14:16}}>{q}</span>
    <button className="qb" onClick={onInc}>+</button>
  </div>;
};

const PCard = ({p,i,sm,q,anim,onAdd,onDec,onInc,onQv,lang,t,S,E}) => (
  <div className="pcard" style={{animation:`fadeUp 0.4s ${i*0.04}s both`,opacity:(p.stock<=0)?0.5:1}} onClick={()=>onQv(p)}>
    {q>0&&<div className="cbadge" style={{[E]:8}}>{q}</div>}
    <div className="pcard__img" style={{height:sm?140:170,position:"relative",overflow:"hidden",background:"linear-gradient(145deg,#FAF7F0 0%,#EDE7DA 50%,#F5EFE3 100%)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <span style={{fontSize:sm?52:64,transition:"transform 0.4s"}}>{p.img}</span>
      <div style={{position:"absolute",top:8,display:"flex",gap:4,flexWrap:"wrap",maxWidth:"70%",[S]:8}}>
        {p.organic&&<span className="tag otag">{t.organic}</span>}
        {p.seasonal&&<span className="tag stag">{t.seasonalTag}</span>}
        {p.pop&&<span className="tag ptag">{t.popular}</span>}
      </div>
    </div>
    <div style={{padding:sm?"10px 12px 12px":"12px 16px 16px"}}>
      <div className="pname" style={{fontSize:sm?12.5:13.5,marginBottom:1}}>{p.n?.[lang] || ""}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:sm?15:17,color:"#8B7355"}}>₪{p.price}</span>
        <span style={{fontSize:9.5,opacity:0.4}}>{t.product?.[p.u]}</span>
      </div>
      <QtyBtn q={q} onAdd={(e)=>{e.stopPropagation(); onAdd()}} onDec={(e)=>{e.stopPropagation(); onDec()}} onInc={(e)=>{e.stopPropagation(); onInc()}} anim={anim} addL={t.product.add} addedL={t.product.added} sm={sm} oos={(p.stock<=0)} oosL={t.product.oos}/>
    </div>
  </div>
);

/* ═══ EMPLOYEE VIEW ═══ */
const EmployeeView = ({orders,lang,onBack}) => {
  const t=T[lang];
  const [now,setNow]=useState(Date.now());
  const [checked,setChecked]=useState({});
  const toggleCheck=(orderId,idx)=>setChecked(p=>({...p,[`${orderId}-${idx}`]:!p[`${orderId}-${idx}`]}));

  useEffect(()=>{const iv=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(iv);},[]);

  const acceptOrder=async (id)=>{
     if(id) await updateDoc(orderDoc(id), { status:"processing", acceptedAt:Date.now() });
  };
  const finalizeOrder=async (id)=>{
     if(id) await updateDoc(orderDoc(id), { status:"completed", completedAt:Date.now() });
  };

  const pending=orders.filter(o=>o.status==="pending");
  const processing=orders.filter(o=>o.status==="processing");
  const completed=orders.filter(o=>o.status==="completed").slice(0,10);
  const bs={cursor:"pointer",padding:"8px 16px",border:"none",borderRadius:8,fontSize:12,fontWeight:600};

  return (<div style={{minHeight:"100vh",background:"#1a1a2e",color:"#eee",padding:20, fontFamily:"sans-serif"}}>
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h1 style={{fontSize:24,fontWeight:700}}>👨‍🍳 {t.emp.title}</h1>
        <button onClick={onBack} style={{...bs,background:"#333",color:"#fff"}}>{t.emp.back}</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:16}}>
        <div style={{background:"rgba(255,255,255,0.03)", padding: 16, borderRadius: 16}}>
          <h3 style={{color:"#ff6b6b",marginBottom:12}}>🔴 {t.emp.pending} ({pending.length})</h3>
          {pending.map(o=>(
            <div key={o.id} style={{background:"#16213e",borderRadius:12,padding:14,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontWeight:600}}>{o.customerName}</span>
                <span style={{fontSize:11,opacity:0.5}}>#{String(o.id).slice(-4)}</span>
              </div>
              <div style={{fontSize:12,opacity:0.6,margin:"8px 0"}}>{o.items.map(it=>`${it.n[lang]} ×${it.qty}`).join(", ")}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#C4A97D",marginBottom:10}}>₪{o.total}</div>
              <button onClick={()=>acceptOrder(o._docId)} style={{...bs,background:"#25D366",color:"#fff",width:"100%"}}>{t.emp.accept}</button>
            </div>
          ))}
        </div>
        <div style={{background:"rgba(255,255,255,0.03)", padding: 16, borderRadius: 16}}>
          <h3 style={{color:"#ffd93d",marginBottom:12}}>🟡 {t.emp.processing} ({processing.length})</h3>
          {processing.map(o=>(
            <div key={o.id} style={{background:"#16213e",borderRadius:12,padding:14,marginBottom:10}}>
              <span style={{fontWeight:600}}>{o.customerName}</span>
              {o.items.map((it,idx)=>(
                <div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #222",fontSize:12,opacity:checked[`${o.id}-${idx}`]?0.4:1}}>
                  <input type="checkbox" checked={!!checked[`${o.id}-${idx}`]} onChange={()=>toggleCheck(o.id,idx)} />
                  <span style={{flex:1}}>{it.n[lang]} ×{it.qty}</span>
                </div>
              ))}
              <button onClick={()=>finalizeOrder(o._docId)} style={{...bs,background:"#C4A97D",color:"#1a1a2e",width:"100%",marginTop:10}}>{t.emp.finalize}</button>
            </div>
          ))}
        </div>
        <div style={{background:"rgba(255,255,255,0.03)", padding: 16, borderRadius: 16}}>
          <h3 style={{color:"#6BCB77",marginBottom:12}}>🟢 {t.emp.completed}</h3>
          {completed.map(o=>(<div key={o.id} style={{background:"#16213e", padding: 10, borderRadius: 10, marginBottom: 8, opacity:0.7, fontSize:12}}>{o.customerName} - ₪{o.total}</div>))}
        </div>
      </div>
    </div>
  </div>);
};

/* ═══ CHAT WIDGET ═══ */
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
  return (<div style={{position:"fixed",bottom:80,right:20,width:320,maxHeight:420,background:"#FDFBF7",borderRadius:16,boxShadow:"0 10px 40px rgba(0,0,0,0.15)",zIndex:999,display:"flex",flexDirection:"column",overflow:"hidden",border:"1px solid #E5DDD0", animation:"scaleIn 0.2s"}}>
    <div style={{background:"#2C2416",color:"#FDFBF7",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontWeight:600,fontSize:14}}>💬 {t.title}</span>
      <button onClick={onClose} style={{background:"none",border:"none",color:"#FDFBF7",cursor:"pointer"}}>✕</button>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:8,maxHeight:250}}>
      {msgs.map((m,i)=>(<div key={i} style={{alignSelf:m.from==="user"?"flex-end":"flex-start",background:m.from==="user"?"#2C2416":"#F0EBE3",color:m.from==="user"?"#FDFBF7":"#2C2416",padding:"8px 12px",borderRadius:12,maxWidth:"80%",fontSize:13}}>{m.text}</div>))}
      <div ref={endRef}/>
    </div>
    <div style={{padding:"8px 12px",borderTop:"1px solid #F0EBE3",display:"flex",gap:4,flexWrap:"wrap"}}>
      {[t.askHours,t.askZones,t.askHuman].map((q,i)=>(<button key={i} onClick={()=>send(q,q)} style={{cursor:"pointer",padding:"5px 10px",border:"1px solid #E5DDD0",borderRadius:16,background:"#fff",fontSize:10,color:"#2C2416", fontFamily:"inherit"}}>{q}</button>))}
    </div>
    <div style={{padding:"8px 12px",display:"flex",gap:6}}>
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&input.trim()&&send(input)} placeholder={t.placeholder} style={{flex:1,padding:"8px 12px",border:"1px solid #E5DDD0",borderRadius:20,fontSize:12,outline:"none", fontFamily:"inherit"}}/>
      <button onClick={()=>input.trim()&&send(input)} style={{background:"#2C2416",color:"#fff",border:"none",borderRadius:"50%",width:32,height:32}}>→</button>
    </div>
  </div>);
};

/* ═══ MAIN APP ═══ */
export default function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATS);
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState("he");
  const [page, setPage] = useState("home");
  const [cat, setCat] = useState("all");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [maxPrice, setMaxPrice] = useState(MAX_P);
  const [delDate, setDelDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState("");
  const [payMethod, setPayMethod] = useState("card");
  const [notes, setNotes] = useState({});
  const [addedAnim, setAddedAnim] = useState({});
  const [heroVis, setHeroVis] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [qv, setQv] = useState(null);
  const [showSort, setShowSort] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);
  
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cAddr, setCAddr] = useState("");
  const [cNote, setCNote] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const searchRef = useRef(null);

  /* Admin states */
  const [adminMode, setAdminMode] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminAuth, setAdminAuth] = useState(false);
  const [empMode, setEmpMode] = useState(false);

  // New Category State
  const [newCat, setNewCat] = useState({id:"", icon:"", label:{en:"", he:""}});
  // Admin Tabs
  const [adminTab, setAdminTab] = useState("products");
  // Product Modal
  const [prodModal, setProdModal] = useState(null);
  const [authModal,setAuthModal]=useState(null);
  const [authEmail,setAuthEmail]=useState("");
  const [authPass,setAuthPass]=useState("");
  const [authErr,setAuthErr]=useState("");

  const rtl = lang === "he";
  const dir = rtl ? "rtl" : "ltr";
  const t = T[lang];
  const S = rtl ? "right" : "left";
  const E = rtl ? "left" : "right";

  useEffect(() => { setTimeout(() => setHeroVis(true), 150) }, []);

  // 1. Auth Init - Mandatory Pattern
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { 
        console.error("Auth init fail:", err); 
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Sync - Mandatory Pattern
  useEffect(() => {
    if (!user) return;
    
    // Sync Products
    const unsubP = onSnapshot(PRODUCTS_COL, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, _docId: doc.id, ...doc.data() }));
      setProducts(items);
    }, (err) => console.error("Products sync error:", err));

    // Sync Orders
    const unsubO = onSnapshot(ORDERS_COL, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, _docId: doc.id, ...doc.data() }));
      setOrders(items.sort((a,b) => b.createdAt - a.createdAt));
    }, (err) => console.error("Orders sync error:", err));
    
    // Sync Categories
     const unsubC = onSnapshot(CATEGORIES_COL, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, _docId: doc.id, ...doc.data() }));
      if(items.length) setCategories(items);
    }, (err) => console.error("Categories sync error:", err));

    return () => { unsubP(); unsubO(); unsubC(); };
  }, [user]);

  // UI Handlers
  const addToCart = (p) => {
    if (p.stock <= 0) return;
    setCart(pr => {
      const x = pr.find(i => i.id === p.id);
      return x ? pr.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...pr, { ...p, qty: 1 }];
    });
    setAddedAnim(pr => ({ ...pr, [p.id]: true }));
    setTimeout(() => setAddedAnim(pr => ({ ...pr, [p.id]: false })), 800);
  };
  const setQ = (id, q) => {
    if (q <= 0) setCart(pr => pr.filter(i => i.id !== id));
    else setCart(pr => pr.map(i => i.id === id ? { ...i, qty: q } : i));
  };
  const subTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delFee = subTotal >= 250 ? 0 : 25;
  const totalAmount = subTotal + delFee;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const placeOrder = async () => {
    if (!user) return;
    const orderData = {
      customerName: cName,
      customerPhone: cPhone,
      address: cAddr,
      items: cart,
      total: totalAmount,
      status: "pending",
      createdAt: Date.now(),
      userId: user.uid
    };
    try {
      await addDoc(ORDERS_COL, orderData);
      setOrderInfo(orderData);
      setCart([]); setStep(0); setCartOpen(false); setCName(""); setCPhone(""); setCAddr("");
      window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent("הזמנה חדשה ב-GOA Boutique")}`, "_blank");
    } catch(e) { console.error("Order error:", e); }
  };

  const filteredProducts = useMemo(() => products
    .filter(p => (cat === "all" || p.cat === cat || (cat === "organic" && p.organic)))
    .sort((a, b) => {
      if (sortBy === "pAsc") return a.price - b.price;
      if (sortBy === "pDesc") return b.price - a.price;
      if (sortBy === "name") return a.n[lang].localeCompare(b.n[lang], rtl ? "he" : "en");
      return 0;
    }), [products, cat, sortBy, lang, rtl]);

  const go = (p) => { setPage(p); setMobileMenu(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  /* Admin Actions */
  const adminLogin = () => { if(adminPin === ADMIN_PIN) setAdminAuth(true); else setAdminPin(""); };
  const doLogout = () => { setUser(null); if(page === "orders") setPage("home"); };
  
  const delProduct = async (id) => {
    if(confirm("Delete?")) await deleteDoc(prodDoc(products.find(p=>p.id===id)._docId));
  };
  
  const openEditModal = (p) => {
    setProdModal({ mode: "edit", form: { ...p, priceStr: String(p.price), stockStr: String(p.stock) } });
  };
  
  const openAddModal = () => {
    setProdModal({ mode: "add", form: { n: { en: "", he: "" }, priceStr: "", u: "perKg", cat: "fruits", img: "🥑", stockStr: "50" } });
  };

  const saveProdModal = async () => {
    const { form, mode } = prodModal;
    const price = parseFloat(form.priceStr);
    const stock = parseInt(form.stockStr) || 0;
    if (!form.n.en || isNaN(price)) return;

    const pData = { ...form, price, stock };
    delete pData.priceStr; delete pData.stockStr;

    if (mode === "add") {
      await addDoc(PRODUCTS_COL, pData);
    } else {
      await updateDoc(prodDoc(form._docId), pData);
    }
    setProdModal(null);
  };

  // Category Management
  const addCategory = () => {
    if(newCat.id && newCat.label.en) {
      setCategories([...categories, newCat]);
      setNewCat({id:"", icon:"", label:{en:"", he:""}});
    }
  };
  const delCategory = (id) => { setCategories(categories.filter(c=>c.id!==id)); };

  if (empMode) return <EmployeeView orders={orders} lang={lang} onBack={() => setEmpMode(false)} />;

  return (
    <div dir={dir} style={{ fontFamily: rtl ? "'Noto Sans Hebrew',sans-serif" : "'Cormorant Garamond',serif", background: "#FDFBF7", color: "#2C2416", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Noto+Sans+Hebrew:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .banner{background:#2C2416;color:#E5D4B3;text-align:center;padding:8px 16px;font-size:11px;letter-spacing:1px}
        .topnav{position:sticky;top:0;z-index:50;background:rgba(253,251,247,0.95);backdrop-filter:blur(10px);border-bottom:1px solid #F0EBE3;height:65px;display:flex;align-items:center;justify-content:space-between;padding:0 32px}
        .nl{cursor:pointer;font-size:11px;text-transform:uppercase;letter-spacing:1px;transition:color 0.3s; font-weight: 500}
        .nl:hover,.nl.on{color:#8B7355}
        .pcard{background:#fff;border-radius:16px;overflow:hidden;border:1px solid #F0EBE3;transition:transform 0.3s, box-shadow 0.3s;cursor:pointer}
        .pcard:hover{transform:translateY(-5px);box-shadow:0 15px 40px rgba(44,36,22,0.06)}
        .cbadge{position:absolute;top:8px;background:#2C2416;color:#fff;border-radius:50%;width:22px;height:22px;font-size:10px;display:flex;align-items:center;justify-content:center; font-weight:700}
        .tag{padding:2px 8px;border-radius:10px;font-size:9px;text-transform:uppercase;font-weight:700}
        .otag{background:#E8F5E8;color:#3D6B3D} .stag{background:#FFF5E5;color:#8B7355} .ptag{background:#EDE8F5;color:#6B5CA5}
        .add-btn{cursor:pointer;padding:12px;background:#2C2416;color:#fff;border:none;border-radius:12px;width:100%;font-family:inherit;font-weight:600; transition: background 0.2s}
        .add-btn:hover{background:#8B7355}
        .qb{width:36px;height:36px;border-radius:50%;border:1px solid #E5DDD0;background:#fff;cursor:pointer; transition: all 0.2s}
        .qb:hover{background:#2C2416; color:#fff}
        .fi{width:100%;padding:14px;border:1px solid #E5DDD0;border-radius:12px;font-family:inherit; outline: none; transition: border 0.3s}
        .fi:focus{border-color:#C4A97D}
        .mb{width:100%;padding:18px;background:#2C2416;color:#fff;border:none;border-radius:14px;font-weight:600;cursor:pointer; transition: all 0.3s}
        .mb:hover{background:#8B7355}
        .mb:disabled{opacity:0.3;cursor:not-allowed}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
        @media(max-width:768px){.pg{grid-template-columns:repeat(2,1fr)!important}.dn{display:none!important}.topnav{padding:0 16px}}
      `}</style>

      <div className="banner">{t.banner}</div>

      <nav className="topnav">
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => go("home")}>
          <span style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Playfair Display',serif", letterSpacing: 2 }}>GOA</span>
          <span style={{ fontSize: 9, opacity: 0.4, textTransform: "uppercase", letterSpacing: 3 }}>boutique</span>
        </div>
        <div className="dn" style={{ display: "flex", gap: 32 }}>
          {["home", "shop", "subscriptions", "loyalty", "about"].map(p => (
            <span key={p} className={`nl ${page === p ? "on" : ""}`} onClick={() => go(p)}>{t.nav[p]}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button onClick={() => setLang(lang === "en" ? "he" : "en")} style={{ background: "none", border: "1px solid #E5DDD0", padding: "6px 12px", borderRadius: 16, fontSize: 10, fontFamily: "inherit", cursor:"pointer" }}>{lang === "en" ? "עברית" : "EN"}</button>
          <div className="relative" style={{ cursor: "pointer", display: "flex", alignItems:"center" }} onClick={() => setCartOpen(true)}>
            <ShoppingBasket size={24} />
            {cartCount > 0 && <span style={{ position: "absolute", top: -8, right: -8, background: "#8B7355", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{cartCount}</span>}
          </div>
        </div>
      </nav>

      {/* PAGE: HOME */}
      {page === "home" && (
        <div style={{ animation: "fadeIn 1.2s" }}>
          <div style={{ textAlign: "center", padding: "140px 24px", background: "linear-gradient(180deg,#FDFBF7,#F5EFE3,#FDFBF7)", position: "relative", overflow: "hidden" }}>
            <div style={{ textTransform: "uppercase", letterSpacing: 6, fontSize: 11, opacity: 0.4, marginBottom: 20 }}>{t.hero.subtitle}</div>
            <h1 style={{ fontSize: "max(10vw, 70px)", fontFamily: "'Playfair Display',serif", marginBottom: 24, letterSpacing: -2 }}>GOA</h1>
            <p style={{ fontSize: 22, fontStyle: "italic", opacity: 0.6, marginBottom: 48, maxWidth: 500, margin: "0 auto 48px" }}>{t.hero.tagline}</p>
            <button className="mb" style={{ maxWidth: 240, borderRadius: 40, letterSpacing: 2 }} onClick={() => go("shop")}>{t.hero.cta}</button>
          </div>
          <div style={{ padding: 60, textAlign: "center", fontSize: 11, opacity: 0.3, letterSpacing: 4, textTransform: "uppercase" }}>{t.hero.since}</div>
        </div>
      )}

      {/* PAGE: SHOP */}
      {page === "shop" && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px", animation: "fadeUp 0.6s" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontSize: 36, fontFamily: "'Playfair Display',serif", marginBottom: 24 }}>{t.nav.shop}</h2>
            <div style={{ position: "relative", maxWidth: 450, margin: "0 auto" }}>
              <input className="fi" style={{ borderRadius: 40, paddingLeft: 45, paddingRight: 45, textAlign: "center" }} placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 40, overflowX: "auto", paddingBottom: 15, scrollbarWidth: "none" }}>
            {[{ id: "all", label: { en: "All", he: "הכל" } }, ...categories].map(c => (
              <button key={c.id} style={{ padding: "10px 24px", borderRadius: 30, border: "1px solid #E5DDD0", background: cat === c.id ? "#2C2416" : "#fff", color: cat === c.id ? "#fff" : "#2C2416", whiteSpace: "nowrap", transition: "all 0.3s", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }} onClick={() => setCat(c.id)}>
                {c.label[lang]}
              </button>
            ))}
          </div>

          <div className="pg" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
            {filteredProducts.map((p, i) => (
              <PCard key={p.id} p={p} i={i} q={cart.find(it => it.id === p.id)?.qty || 0} lang={lang} t={t} S={S} E={E}
                onAdd={() => addToCart(p)} onDec={() => setQ(p.id, (cart.find(it => it.id === p.id)?.qty || 0) - 1)} onInc={() => addToCart(p)} onQv={setQv} />
            ))}
          </div>
        </div>
      )}

      {/* PAGE: SUBSCRIPTIONS */}
      {page === "subscriptions" && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px", textAlign: "center", animation: "fadeUp 0.6s" }}>
          <h2 style={{ fontSize: 40, fontFamily: "'Playfair Display',serif", marginBottom: 16 }}>{t.sub.title}</h2>
          <p style={{ opacity: 0.6, marginBottom: 60, maxWidth: 450, margin: "0 auto 60px" }}>{t.sub.subtitle}</p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            {SUBS.map((s, idx) => (
              <div key={s.id} style={{ background: "#fff", border: "1px solid #F0EBE3", padding: 40, borderRadius: 24, flex: 1, minWidth: 280, transition: "all 0.4s", animation: `fadeUp 0.5s ${idx*0.1}s both` }}>
                <div style={{ fontSize: 48, marginBottom: 24 }}>{s.icon}</div>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{t.sub[s.id]}</h3>
                <p style={{ fontSize: 14, opacity: 0.5, margin: "16px 0", lineHeight: 1.6 }}>{t.sub[s.id + "D"]}</p>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#8B7355", margin: "24px 0", fontFamily: "'Playfair Display',serif" }}>₪{s.price}</div>
                <button className="add-btn" style={{borderRadius: 40}} onClick={() => window.open(`https://wa.me/${WA_PHONE}`)}>{t.sub.subscribe}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ marginTop: 100, padding: 60, textAlign: "center", borderTop: "1px solid #F0EBE3", background: "#fff" }}>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 12 }}>GOA</div>
        <div style={{ opacity: 0.4, fontSize: 11, letterSpacing: 1 }}>© 2026 GOA BOUTIQUE GREENGROCER. ALL RIGHTS RESERVED.</div>
        <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 24, opacity: 0.2 }}>
           <button style={{ background: "none", border: "none", fontSize: 10, cursor: "pointer", fontFamily:"inherit" }} onClick={() => setAdminMode(true)}>ADMIN</button>
           <button style={{ background: "none", border: "none", fontSize: 10, cursor: "pointer", fontFamily:"inherit" }} onClick={() => setEmpMode(true)}>STAFF</button>
        </div>
      </footer>

      {/* OVERLAY: CART */}
      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(44,36,22,0.2)", backdropFilter: "blur(6px)" }} onClick={() => setCartOpen(false)} />
          <div style={{ position: "absolute", top: 0, [E]: 0, width: "min(420px, 95vw)", height: "100%", background: "#FDFBF7", padding: 32, display: "flex", flexDirection: "column", boxShadow: "-20px 0 60px rgba(0,0,0,0.1)", animation: `slide${rtl?"L":"R"} 0.4s cubic-bezier(0.2,0,0,1)` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
              <h2 style={{ fontSize: 28, fontFamily: "'Playfair Display',serif" }}>{t.cart.title}</h2>
              <button style={{ background: "none", border: "none", fontSize: 24, cursor:"pointer" }} onClick={() => setCartOpen(false)}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", marginTop: 140, opacity: 0.3 }}>
                  <div style={{ fontSize: 48, marginBottom: 20 }}>🧺</div>
                  <p>{t.cart.empty}</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 16, marginBottom: 24, borderBottom: "1px solid #F0EBE3", paddingBottom: 20 }}>
                  <div style={{ width: 60, height: 60, background: "#F5EFE3", borderRadius: 12, display:"flex", alignItems:"center", justifyContent:"center", fontSize: 32 }}>{item.img}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.n[lang]}</div>
                    <div style={{ fontSize: 13, opacity: 0.5 }}>₪{item.price}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button className="qb" style={{ width: 28, height: 28, fontSize: 14 }} onClick={() => setQ(item.id, item.qty - 1)}>-</button>
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                    <button className="qb" style={{ width: 28, height: 28, fontSize: 14 }} onClick={() => setQ(item.id, item.qty + 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div style={{ paddingTop: 24, borderTop: "2px solid #E5DDD0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, opacity: 0.6 }}><span>{t.cart.subtotal}</span><span>₪{subTotal}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32, fontWeight: 700, fontSize: 24, fontFamily: "'Playfair Display',serif" }}><span>{t.cart.total}</span><span>₪{totalAmount}</span></div>
                {step === 0 ? (
                  <button className="mb" style={{borderRadius: 40}} onClick={() => setStep(1)}>{t.cart.checkout}</button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Inp val={cName} set={setCName} ph={t.cart.name} req />
                    <Inp val={cPhone} set={setCPhone} ph={t.cart.phone} type="tel" req />
                    <Inp val={cAddr} set={setCAddr} ph={t.cart.address} req />
                    <button className="mb" style={{borderRadius: 40, marginTop: 10}} onClick={placeOrder} disabled={!cName || !cPhone || !cAddr}>{t.cart.placeOrder}</button>
                    <button style={{ background: "none", border: "none", fontSize: 12, opacity: 0.4, marginTop: 8, cursor: "pointer", fontFamily: "inherit" }} onClick={() => setStep(0)}>← {t.cart.back}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN PANEL */}
      {adminMode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#fff", padding: 40, overflowY: "auto", animation: "fadeIn 0.3s" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 50 }}>
              <h2 style={{ fontSize: 32, fontFamily: "'Playfair Display',serif" }}>{t.admin.title}</h2>
              <button style={{ background: "#f5f5f5", border: "none", padding: 12, borderRadius: "50%", cursor: "pointer" }} onClick={() => setAdminMode(false)}><X /></button>
            </div>
            {!adminAuth ? (
              <div style={{ maxWidth: 320, margin: "100px auto", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 24 }}>🔐</div>
                <input className="fi" type="password" placeholder={t.admin.pin} value={adminPin} onChange={e => setAdminPin(e.target.value)} style={{ marginBottom: 20, textAlign: "center", fontSize: 24, letterSpacing: 8 }} />
                <button className="mb" onClick={() => adminPin === ADMIN_PIN && setAdminAuth(true)}>Login</button>
              </div>
            ) : (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 32 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{t.admin.products} ({products.length})</h3>
                  <button className="mb" style={{ maxWidth: 200, borderRadius: 30, padding: "12px 24px" }} onClick={openAddModal}><Plus size={18} style={{verticalAlign:"middle", marginInlineEnd:8}} /> {t.admin.add}</button>
                </div>
                
                <div style={{ display: "grid", gap: 16 }}>
                  {products.map(p => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 20, background: "#f9f9f9", borderRadius: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span style={{ fontSize: 32 }}>{p.img}</span>
                        <div>
                          <div style={{ fontWeight: 700 }}>{p.n[lang]}</div>
                          <div style={{ fontSize: 13, opacity: 0.5 }}>₪{p.price} · Stock: {p.stock}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                         <button style={{ padding: 10, background: "#fff", border: "1px solid #eee", borderRadius: 10, cursor: "pointer" }} onClick={()=>openEditModal(p)}><Edit2 size={16} /></button>
                         <button style={{ padding: 10, background: "#fff", border: "1px solid #eee", borderRadius: 10, color: "red", cursor: "pointer" }} onClick={()=>delProduct(p.id)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ PRODUCT MODAL (Add/Edit) ═══ */}
      {prodModal&&(<div style={{position:"fixed",inset:0,zIndex:700,background:"rgba(44,36,22,0.5)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(5px)",animation:"fadeIn 0.15s",padding:20}} onClick={()=>setProdModal(null)}>
        <div style={{background:"#FDFBF7",borderRadius:16,maxWidth:520,width:"100%",padding:28,animation:"scaleIn 0.25s",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:20}}>{prodModal.mode==="add"?(lang==="en"?"Add Product":"הוסף מוצר"):(lang==="en"?"Edit Product":"ערוך מוצר")}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><div style={{fontSize:9,opacity:0.4,marginBottom:4,textTransform:"uppercase",letterSpacing:0.8}}>Name (EN)</div><Inp val={prodModal.form.n?.en} set={v=>setProdModal({...prodModal,form:{...prodModal.form,n:{...prodModal.form.n,en:v}}})} /></div>
            <div><div style={{fontSize:9,opacity:0.4,marginBottom:4,textTransform:"uppercase",letterSpacing:0.8}}>שם (HE)</div><Inp val={prodModal.form.n?.he} set={v=>setProdModal({...prodModal,form:{...prodModal.form,n:{...prodModal.form.n,he:v}}})} /></div>
            <div><div style={{fontSize:9,opacity:0.4,marginBottom:4,textTransform:"uppercase",letterSpacing:0.8}}>Origin (EN)</div><Inp val={prodModal.form.o?.en} set={v=>setProdModal({...prodModal,form:{...prodModal.form,o:{...prodModal.form.o,en:v}}})} /></div>
            <div><div style={{fontSize:9,opacity:0.4,marginBottom:4,textTransform:"uppercase",letterSpacing:0.8}}>מקור (HE)</div><Inp val={prodModal.form.o?.he} set={v=>setProdModal({...prodModal,form:{...prodModal.form,o:{...prodModal.form.o,he:v}}})} /></div>
            <div><div style={{fontSize:9,opacity:0.4,marginBottom:4,textTransform:"uppercase",letterSpacing:0.8}}>{t.admin.price} (₪)</div><Inp type="number" val={prodModal.form.priceStr} set={v=>setProdModal({...prodModal,form:{...prodModal.form,priceStr:v}})} /></div>
            <div><div style={{fontSize:9,opacity:0.4,marginBottom:4,textTransform:"uppercase",letterSpacing:0.8}}>{t.admin.stock}</div><Inp type="number" val={prodModal.form.stockStr} set={v=>setProdModal({...prodModal,form:{...prodModal.form,stockStr:v}})} /></div>
            <div style={{gridColumn:"1/-1"}}><div style={{fontSize:9,opacity:0.4,marginBottom:4,textTransform:"uppercase",letterSpacing:0.8}}>Emoji</div><Inp val={prodModal.form.img} set={v=>setProdModal({...prodModal,form:{...prodModal.form,img:v}})} /></div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:18}}><button className="mb" style={{flex:1}} onClick={saveProdModal}>{t.admin.save}</button><button className="gb" style={{flex:1}} onClick={()=>setProdModal(null)}>{t.admin.cancel}</button></div>
        </div>
      </div>)}

      {/* ORDER SUCCESS */}
      {orderInfo && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(44,36,22,0.6)", backdropFilter: "blur(12px)", animation: "fadeIn 0.4s" }}>
          <div style={{ background: "#fff", padding: 50, borderRadius: 32, textAlign: "center", maxWidth: 400, width: "90%", boxShadow: "0 30px 100px rgba(0,0,0,0.2)", animation: "scaleIn 0.5s cubic-bezier(0.2,0,0,1)" }}>
            <div style={{ fontSize: 64, color: "#3D6B3D", marginBottom: 24 }}>✓</div>
            <h3 style={{ fontSize: 28, fontFamily: "'Playfair Display',serif", marginBottom: 12 }}>{t.orderDone.title}</h3>
            <p style={{ opacity: 0.5, marginBottom: 40, lineHeight: 1.6 }}>{t.orderDone.msg}</p>
            <button className="mb" style={{borderRadius: 40}} onClick={() => setOrderInfo(null)}>{t.orderDone.dismiss}</button>
          </div>
        </div>
      )}

      {/* QUICK VIEW */}
      {qv && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.3s" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(44,36,22,0.3)", backdropFilter: "blur(10px)" }} onClick={() => setQv(null)} />
          <div style={{ position: "relative", background: "#FDFBF7", borderRadius: 32, width: "100%", maxWidth: 450, overflow: "hidden", animation: "fadeUp 0.4s cubic-bezier(0.2,0,0,1)", boxShadow: "0 40px 120px rgba(0,0,0,0.15)" }}>
            <button style={{ position: "absolute", top: 20, [E]: 20, zIndex: 10, background: "rgba(255,255,255,0.8)", border: "none", width: 40, height: 40, borderRadius: "50%", cursor: "pointer" }} onClick={() => setQv(null)}><X size={20} /></button>
            <div style={{ height: 280, background: "linear-gradient(180deg,#F5EFE3,#FDFBF7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100 }}>{qv.img}</div>
            <div style={{ padding: 40 }}>
              <h3 style={{ fontSize: 32, fontFamily: "'Playfair Display',serif", marginBottom: 8 }}>{qv.n[lang]}</h3>
              <div style={{ opacity: 0.4, fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} /> {qv.o?.[lang] || "Local Farm"}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: "#8B7355", fontFamily: "'Playfair Display',serif" }}>₪{qv.price}</span>
                <div style={{ width: 140 }}>
                  <QtyBtn q={cart.find(it => it.id === qv.id)?.qty || 0} onAdd={() => addToCart(qv)} onDec={() => setQ(qv.id, (cart.find(it => it.id === qv.id)?.qty || 0) - 1)} onInc={() => addToCart(qv)} sm={false} />
                </div>
              </div>
              <button className="mb" style={{borderRadius: 40}} onClick={() => setQv(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING CHAT */}
      <button style={{ position: "fixed", bottom: 24, [S]: 24, width: 60, height: 60, borderRadius: "50%", background: "#25D366", color: "#fff", border: "none", fontSize: 30, cursor: "pointer", boxShadow: "0 10px 30px rgba(37,211,102,0.3)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.3s" }} onClick={() => setChatOpen(!chatOpen)}>
        <MessageCircle size={28} />
      </button>
      <ChatWidget lang={lang} open={chatOpen} onClose={() => setChatOpen(false)} />

    </div>
  );
}