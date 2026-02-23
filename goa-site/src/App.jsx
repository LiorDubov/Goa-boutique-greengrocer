import { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from "react";
import "./goa.css";

// Firebase — only what the main bundle needs
import { onSnapshot, addDoc, updateDoc, increment, deleteDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInAnonymously, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

// Shared modules
import { db, auth, storage, PRODUCTS_COL, ORDERS_COL, CATEGORIES_COL, prodDoc, orderDoc, catDoc } from "./firebase.js";
import { T, WA_PHONE, STRIPE_LINK, UNIT_KEYS, UNIT_LABELS, MAX_P, fmtPrice, getDates, fmtD, SLOTS, IL_CITIES, SUBS, DEFAULT_CATS, ADMIN_PIN } from "./constants.js";
const roundUp1 = (n) => Math.ceil(n * 10) / 10;

// Lazy-loaded chunks — Admin, Employee, Chat load only when accessed
const AdminView    = lazy(() => import("./components/AdminView.jsx"));
const EmployeeView = lazy(() => import("./components/EmployeeView.jsx"));
const ChatWidget   = lazy(() => import("./components/ChatWidget.jsx"));

/* ═══ TEL AVIV STREETS — delivery area ═══ */
const TEL_AVIV_STREETS = [
  "אבן גבירול","אחד העם","אלנבי","ארלוזורוב","בוגרשוב","בן יהודה","בן צבי","בן גוריון",
  "דיזנגוף","דרך מנחם בגין","דרך פתח תקווה","האירוסים","הארבעה","הברון הירש",
  "הגליל","הירקון","הכרמל","המלך ג׳ורג׳","הנביאים","הרצל","השל״ה","ויצמן",
  "זמנהוף","חיים לבנון","טשרניחובסקי","יהודה הלוי","יהודה המכבי","יוני נתניהו",
  "ילין","כיכר דיזנגוף","כצנלסון","לה גווארדיה","לוינסקי","לילינבלום",
  "מזא״ה","מרכז בעלי מלאכה","נחלת בנימין","נחלת יצחק","נורדאו","סוקולוב",
  "סינגלובסקי","פינסקר","פלורנטין","פרישמן","צ׳לנוב","קינג׳ ג׳ורג׳","קפלן",
  "רוטשילד","רמב״ם","שד׳ ירושלים","שד׳ לה גווארדיה","שד׳ שאול המלך","שינקין",
  "שלמה המלך","שמואל הנגיד","תובל"
].sort();

/* ═══ LOCAL HELPERS (not in constants.js) ═══ */
/* ═══ EXTERNAL SUB-COMPONENTS (defined OUTSIDE main function — fixes focus bug) ═══ */
const Inp = ({ val, set, ph, type="text", req, error, onBlur }) => (
  <input className="fi" type={type} placeholder={ph} value={val}
    onChange={e=>set(e.target.value)} onBlur={onBlur} required={req}
    style={{direction:type==="tel"?"ltr":undefined,width:"100%",
      ...(error?{borderColor:"#D94F4F",boxShadow:"0 0 0 3px rgba(217,79,79,0.08)"}:{})}}/>
);

/* ═══ PAGE LOADING SPINNER ═══ */
const PageSpinner = () => (
  <div role="status" aria-label="Loading" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"40vh",opacity:0.4}}>
    <div style={{width:32,height:32,border:"2.5px solid var(--parchment)",borderTopColor:"var(--earth)",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
  </div>
);

const QtyBtn = ({q,onAdd,onDec,onInc,anim,addL,addedL,sm,oos,oosL,lowStock,productName=""}) => {
  if(oos) return <div style={{textAlign:"center",fontSize:11,color:"#D94F4F",opacity:0.7,padding:"8px 0"}} role="status" aria-label={oosL}>{oosL}</div>;
  const lowBadge=lowStock?<div style={{textAlign:"center",fontSize:9,color:"#B8860B",marginTop:3}} role="status" aria-live="polite">{lowStock} left</div>:null;
  if(!q) return <div>{lowBadge}<button className={`add-btn${anim?" added":""}`} style={sm?{padding:"8px 14px",fontSize:12}:{}} onClick={e=>{e.preventDefault();e.stopPropagation();onAdd();}} aria-label={`${addL}${productName?" — "+productName:""}`}>{anim?addedL:addL}</button></div>;
  return <div style={{display:"flex",alignItems:"center",gap:sm?8:10,justifyContent:"center"}} role="group" aria-label={`Quantity for ${productName}`} onClick={e=>{e.preventDefault();e.stopPropagation();}}>
    <button className="qb" onClick={e=>{e.preventDefault();e.stopPropagation();onDec();}} aria-label={`Remove one ${productName}`} style={{minWidth:44,minHeight:44}}>−</button>
    <span style={{fontWeight:600,minWidth:22,textAlign:"center",fontSize:sm?14:16}} aria-live="polite" aria-atomic="true" aria-label={`${q} in cart`}>{q}</span>
    <button className="qb" onClick={e=>{e.preventDefault();e.stopPropagation();onInc();}} aria-label={`Add one more ${productName}`} style={{minWidth:44,minHeight:44}}>+</button>
  </div>;
};

const PCard = ({p,i,sm,q,anim,onAdd,onDec,onInc,onQv,lang,t,S}) => {
  const name = p.n[lang];
  const origin = p.o?.[lang]||"";
  const badges = [p.organic&&t.organic,p.seasonal&&t.seasonalTag,p.pop&&t.popular].filter(Boolean).join(", ");
  const priceLabel = `₪${fmtPrice(p.price)}${t.product[p.u]||""}`;
  const cardLabel = `${name}${origin?" — "+origin:""}, ${priceLabel}${badges?", "+badges:""}${p.stock<=0?" — "+t.product.oos:""}`;
  return (
  <article className="pcard"
    style={{animation:`fadeUp 0.4s ${i*0.05}s both`,opacity:(p.stock<=0)?0.5:1}}
    onClick={()=>onQv(p)}
    onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onQv(p);}}}
    tabIndex={0} role="button" aria-label={cardLabel}>
    {q>0&&<div className="cbadge" aria-hidden="true">{q}</div>}
    <div className="pcard__img" style={{height:sm?118:152,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
      {p.img?.startsWith("http")
        ? <img src={p.img} alt={`${name}${origin?" from "+origin:""}`} loading="lazy" decoding="async" width="200" height={sm?118:152} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        : <span role="img" aria-label={name} style={{fontSize:sm?50:64,display:"block",padding:sm?"16px":"20px"}}>{p.img}</span>
      }
      <div style={{position:"absolute",top:8,display:"flex",gap:4,flexWrap:"wrap",maxWidth:"75%",[S]:8}} aria-hidden="true">
        {p.organic&&<span className="tag otag">{t.organic}</span>}
        {p.seasonal&&<span className="tag stag">{t.seasonalTag}</span>}
        {p.pop&&<span className="tag ptag">{t.popular}</span>}
      </div>
    </div>
    <div className="pcard__body">
      <h3 className="pname" style={{fontSize:sm?12.5:14}}>{name}</h3>
      {origin&&<div className="porigin">{origin}</div>}
      <div className="pprice-wrap" aria-label={priceLabel}>
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
        lowStock={p.stock>0&&p.stock<=5?p.stock:0}
        productName={name}/>
    </div>
  </article>
  );
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
      } else {
        setProducts([]);
      }
    },(err)=>console.error("Products listener error:",err));
    const unsubOrders=onSnapshot(ORDERS_COL,(snap)=>{
      if(!snap.empty){
        const all=snap.docs.map(d=>({...d.data(),_docId:d.id}));
        setOrderHistory(all);
      } else { setOrderHistory([]); }
    },(err)=>console.error("Orders listener error:",err));
    const unsubCats=onSnapshot(CATEGORIES_COL,(snap)=>{
      if(!snap.empty){
        setCategories(snap.docs.map(d=>({...d.data(),_docId:d.id})));
      } else {
        setCategories(DEFAULT_CATS);
      }
    },(err)=>console.error("Categories listener error:",err));
    return()=>{unsubProducts();unsubOrders();unsubCats();};
  },[fbReady]);

  const [lang,setLang] = useState("he");
  const [page,setPage] = useState("home");
  // Track which pages have been mounted — avoids re-rendering heavy pages
  const [mountedPages,setMountedPages] = useState(new Set(["home"]));
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
  const [cAddrNum,setCAddrNum] = useState("");
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
    const h=(e)=>{ if(!e.target.closest("#mobile-menu, .ham")) setMobileMenu(false); };
    setTimeout(()=>document.addEventListener("click",h),0);
    return ()=>document.removeEventListener("click",h);
  },[mobileMenu]);

  // Back to top visibility (passive for scroll perf)
  useEffect(()=>{
    const h=()=>setShowBackTop(window.scrollY>400);
    window.addEventListener("scroll",h,{passive:true});
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
  const go=(p,keepCat)=>{
    setPage(p);
    setMountedPages(prev=>new Set([...prev,p]));
    setMobileMenu(false);
    if(p==="shop"&&!keepCat)clearF();
    window.scrollTo?.({top:0,behavior:"smooth"});
  };

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
    const itemsStr = cart.map(i=>{
      const note = notes[i.id];
      const line = `• ${i.n[lang]} ×${i.qty} — ₪${fmtPrice(i.price*i.qty)}`;
      return note ? `${line}\n  📌 ${note}` : line;
    }).join("\n");
    const payStr = payMethod==="stripe"
      ? (lang==="en"?"Credit Card (Stripe)":"כרטיס אשראי (Stripe)")
      : t.cart.cash;
    const methodStr = deliveryMethod==="pickup" ? (lang==="en"?"Self Pickup":"איסוף עצמי") : (lang==="en"?"Home Delivery":"משלוח עד הבית");

    const msg = lang==="en" ? [
      `🛒 *New Order — GOA Boutique*`,
      ``,
      `👤 *Customer Details*`,
      `Name: ${cName}`,
      `Phone: ${cPhone}`,
      cEmail ? `Email: ${cEmail}` : null,
      deliveryMethod==="deliver"
        ? `Address: ${cAddr}${cAddrNum?", "+cAddrNum:""}, Tel Aviv`
        : `📍 Store pickup — King George 31, Tel Aviv`,
      ``,
      `📦 *Order Summary*`,
      itemsStr,
      ``,
      `Subtotal: ₪${sub}`,
      `Delivery: ${delFee===0?"Free 🎉":`₪${delFee}`}`,
      `*TOTAL: ₪${tot}*`,
      ``,
      `🚚 Method: ${methodStr}`,
      deliveryMethod==="deliver" ? `📅 Date: ${dateStr}` : null,
      deliveryMethod==="deliver" ? `⏰ Time: ${slotStr}` : null,
      `💳 Payment: ${payStr}`,
      cNote ? `\n📝 Notes: ${cNote}` : null,
      ``,
      `─────────────────`,
      `✅ *What happens next?*`,
      `We'll confirm your order within 30 minutes.`,
      `You'll receive a WhatsApp message once your order is packed and on its way.`,
      deliveryMethod==="pickup" ? `Please arrive at King George 31 during your selected time.` : `Our driver will contact you before delivery.`,
    ].filter(Boolean).join("\n")
    : [
      `🛒 *הזמנה חדשה — GOA בוטיק*`,
      ``,
      `👤 *פרטי לקוח*`,
      `שם: ${cName}`,
      `טלפון: ${cPhone}`,
      cEmail ? `אימייל: ${cEmail}` : null,
      deliveryMethod==="deliver"
        ? `כתובת: ${cAddr}${cAddrNum?", "+cAddrNum:""}, תל אביב`
        : `📍 איסוף עצמי — המלך ג׳ורג׳ 31, תל אביב`,
      ``,
      `📦 *סיכום ההזמנה*`,
      itemsStr,
      ``,
      `סכום ביניים: ₪${sub}`,
      `משלוח: ${delFee===0?"חינם 🎉":`₪${delFee}`}`,
      `*סה״כ לתשלום: ₪${tot}*`,
      ``,
      `🚚 שיטה: ${methodStr}`,
      deliveryMethod==="deliver" ? `📅 תאריך: ${dateStr}` : null,
      deliveryMethod==="deliver" ? `⏰ שעה: ${slotStr}` : null,
      `💳 תשלום: ${payStr}`,
      cNote ? `\n📝 הערות: ${cNote}` : null,
      ``,
      `─────────────────`,
      `✅ *מה קורה עכשיו?*`,
      `נאשר את הזמנתך תוך 30 דקות.`,
      `תקבל/י הודעת WhatsApp כשההזמנה תהיה מוכנה ובדרך.`,
      deliveryMethod==="pickup" ? `אנא הגע/י לחנות בשעה שבחרת — המלך ג׳ורג׳ 31.` : `השליח שלנו יצור קשר לפני ההגעה.`,
    ].filter(Boolean).join("\n");

    window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`,"_blank");

    if(payMethod==="stripe" && STRIPE_LINK){
      const stripeParams = new URLSearchParams({prefilled_email:cEmail||"",client_reference_id:`order_${Date.now()}`});
      setTimeout(()=>{ window.location.href = `${STRIPE_LINK}?${stripeParams.toString()}`; },600);
    }

    const orderObj={id:Date.now(),createdAt:Date.now(),date:new Date().toISOString(),items:cart.map(i=>({id:i.id,n:i.n,qty:i.qty,price:i.price,u:i.u,img:i.img})),total:tot,deliveryFee:delFee,deliveryMethod,customerName:cName,customerPhone:cPhone,status:"pending",uid:fbUser?.uid||null,userEmail:user?.email||null};
    addDoc(ORDERS_COL,orderObj).catch(console.error);

    for(const ci of cart){
      const p=products.find(x=>x.id===ci.id);
      if(p&&p._docId){updateDoc(prodDoc(p._docId),{stock:increment(-ci.qty)}).catch(console.error);}
    }

    const info = { date:delDate, slot:timeSlot, total:tot, name:cName, method:deliveryMethod, payMethod };
    setOrderInfo(info);
    setCart([]);setStep(0);setCartOpen(false);setNotes({});setCName("");setCPhone("");setCEmail("");setCAddr("");setCAddrNum("");setCNote("");setDelDate(null);setTimeSlot("");setPhoneTouched(false);setDeliveryMethod("deliver");setAddrCity("");setEmailTouched(false);setPayMethod("stripe");
  };

  const phoneValid = /^05\d{8}$/.test(cPhone.replace(/[\s\-()]/g,""));
  const phoneError = phoneTouched && cPhone.trim() && !phoneValid;
  const canPlace = cName.trim() && phoneValid && emailValid && (deliveryMethod==="pickup" || (cAddr && cAddrNum.trim() && delDate && timeSlot));

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
  const reorder=order=>{const nc=order.items.map(i=>{const lv=products.find(p=>String(p.id)===String(i.id));return lv&&(lv.stock??0)>0?{...lv,qty:Math.min(i.qty,lv.stock)}:null;}).filter(Boolean);setCart(nc);setCartOpen(true);setStep(0);};
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
  if(empMode) return (
    <Suspense fallback={<div style={{minHeight:"100vh",background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",color:"#eee",fontSize:14}}>Loading...</div>}>
      <EmployeeView orders={orderHistory} lang={lang} onBack={()=>setEmpMode(false)}/>
    </Suspense>
  );

  return (
    <div dir={dir} style={{fontFamily:rtl?"'Noto Sans Hebrew','Segoe UI',sans-serif":"'Cormorant Garamond',Georgia,serif",background:"#FDFBF7",color:"#2C2416",minHeight:"100vh",width:"100%"}}>

      {/* Skip to main content — keyboard accessibility */}
      <a href="#main-content" className="skip-link">
        {lang==="en"?"Skip to main content":"דלג לתוכן הראשי"}
      </a>

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
      <nav className="topnav" role="navigation" aria-label={lang==="en"?"Main navigation":"ניווט ראשי"}>
        <button className="logo-wrap" style={{display:"flex",flexDirection:"row",alignItems:"center",gap:10,cursor:"pointer",background:"none",border:"none",padding:0}} onClick={()=>go("home")} aria-label={lang==="en"?"GOA Boutique — Home":"GOA בוטיק — דף הבית"}>
          <div className="logo-mark" style={{flexShrink:0}} aria-hidden="true">G</div>
          <div className="logo-text" style={{display:"flex",flexDirection:"column",gap:1}}>
            <span className="logo-name">{rtl?"גואה":"GOA"}</span>
            <span className="logo-sub">{rtl?"ירקניית בוטיק":"boutique greengrocer"}</span>
          </div>
        </button>
        <div className="dn" style={{display:"flex",gap:22,alignItems:"center"}} role="list">
          {["home","shop","subscriptions","loyalty","about"].map(p=>(
            <button key={p} role="listitem" className={`nl ${page===p?"on":""}`} onClick={()=>go(p)}
              aria-current={page===p?"page":undefined}
              style={{background:"none",border:"none",fontFamily:rtl?"'Noto Sans Hebrew',sans-serif":"'Cormorant Garamond',serif"}}>
              {t.nav[p]}
            </button>
          ))}
          {user&&<button role="listitem" className={`nl ${page==="orders"?"on":""}`} onClick={()=>go("orders")} aria-current={page==="orders"?"page":undefined} style={{background:"none",border:"none",fontFamily:rtl?"'Noto Sans Hebrew',sans-serif":"'Cormorant Garamond',serif"}}>{t.nav.orders}</button>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button style={{cursor:"pointer",padding:"6px 12px",border:"1px solid var(--parchment)",borderRadius:18,background:"transparent",fontSize:10.5,fontFamily:"inherit",color:"var(--ink)",transition:"all 0.3s",minHeight:36}} onClick={()=>setLang(lang==="en"?"he":"en")} aria-label={lang==="en"?"Switch to Hebrew":"Switch to English"}>{lang==="en"?"עברית":"EN"}</button>
          {user
            ?<button style={{cursor:"pointer",padding:"6px 12px",border:"1px solid var(--parchment)",borderRadius:18,background:"transparent",fontSize:13,fontFamily:"inherit",color:"var(--earth)",minHeight:36}} aria-label={`${t.nav.profile}: ${user.email}`} onClick={()=>go("profile")}>👤</button>
            :<button style={{cursor:"pointer",padding:"6px 12px",border:"1px solid var(--parchment)",borderRadius:18,background:"transparent",fontSize:10.5,fontFamily:"inherit",color:"var(--ink)",minHeight:36}} onClick={()=>{setAuthModal("login");setAuthErr("");}}>
              {t.nav.login}
            </button>
          }
          <button className="cnb" onClick={()=>{setCartOpen(true);setStep(0)}}
            aria-label={lang==="en"?`Shopping cart, ${cc} item${cc!==1?"s":""}`:`עגלת קניות, ${cc} פריטים`}
            aria-haspopup="true" aria-expanded={cartOpen}>
            🛒{cc>0&&<span className="nb" aria-hidden="true">{cc}</span>}
          </button>
          <button className="ham" onClick={()=>setMobileMenu(!mobileMenu)}
            aria-label={mobileMenu?(lang==="en"?"Close menu":"סגור תפריט"):(lang==="en"?"Open menu":"פתח תפריט")}
            aria-expanded={mobileMenu} aria-controls="mobile-menu">
            {mobileMenu?"✕":"☰"}
          </button>
        </div>
      </nav>

      {mobileMenu&&<nav id="mobile-menu" className="mm" role="navigation" aria-label={lang==="en"?"Mobile menu":"תפריט נייד"}>
        <button onClick={()=>setMobileMenu(false)} style={{position:"absolute",top:20,right:20,left:"auto",cursor:"pointer",background:"none",border:"none",fontSize:22,opacity:0.4,minWidth:44,minHeight:44}} aria-label={lang==="en"?"Close menu":"סגור תפריט"}>✕</button>
        {["home","shop","subscriptions","loyalty","about"].map(p=>(<button key={p} className={`nl ${page===p?"on":""}`} onClick={()=>go(p)} aria-current={page===p?"page":undefined} style={{background:"none",border:"none",textAlign:rtl?"right":"left"}}>{t.nav[p]}</button>))}
        {user&&<button className={`nl ${page==="orders"?"on":""}`} onClick={()=>go("orders")} aria-current={page==="orders"?"page":undefined} style={{background:"none",border:"none",textAlign:rtl?"right":"left"}}>{t.nav.orders}</button>}
        {!user&&<button className="nl" onClick={()=>{setMobileMenu(false);setAuthModal("login");}} style={{background:"none",border:"none",textAlign:rtl?"right":"left"}}>{t.nav.login}</button>}
        {user&&<button className="nl" onClick={()=>{setMobileMenu(false);doLogout();}} style={{background:"none",border:"none",textAlign:rtl?"right":"left"}}>{t.nav.logout}</button>}
        <div style={{borderTop:"1px solid var(--parchment)",marginTop:"auto",paddingTop:16,display:"flex",gap:12}}>
          <button onClick={()=>{setMobileMenu(false);setAdminMode(true);}} style={{cursor:"pointer",background:"none",border:"1px solid var(--parchment)",borderRadius:8,padding:"10px 16px",fontSize:12,fontFamily:"inherit",color:"#666",flex:1,minHeight:44}}>{t.footer.admin}</button>
          <button onClick={()=>{setMobileMenu(false);setEmpMode(true);}} style={{cursor:"pointer",background:"none",border:"1px solid var(--parchment)",borderRadius:8,padding:"10px 16px",fontSize:12,fontFamily:"inherit",color:"#666",flex:1,minHeight:44}}>{t.footer.employee}</button>
        </div>
      </nav>}

      {/* FLOATING CHAT + BACK TO TOP */}
      <button className="wa" onClick={()=>setChatOpen(!chatOpen)}
        aria-label={lang==="en"?"Open support chat":"פתח צ׳אט תמיכה"}
        aria-haspopup="true" aria-expanded={chatOpen}>💬</button>
      <Suspense fallback={null}>
        <ChatWidget lang={lang} open={chatOpen} onClose={()=>setChatOpen(false)}/>
      </Suspense>
      {showBackTop&&<button className="btt" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
        aria-label={lang==="en"?"Back to top":"חזור לראש הדף"}>{t.backTop}</button>}

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
      {/* ═══ ADMIN ═══ */}
      {adminMode&&(
        <Suspense fallback={<div style={{position:"fixed",inset:0,zIndex:600,background:"rgba(253,251,247,0.98)",display:"flex",alignItems:"center",justifyContent:"center"}}><PageSpinner/></div>}>
          <AdminView
            products={products}
            categories={categories}
            lang={lang}
            onClose={()=>{setAdminMode(false);}}
          />
        </Suspense>
      )}

      {/* ═══ ORDER SUCCESS ═══ */}
      {orderInfo&&(
        <div className="suc" onClick={()=>setOrderInfo(null)} role="dialog" aria-modal="true" aria-label={lang==="en"?"Order confirmed":"הזמנה אושרה"}>
          <div className="succ" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:44,marginBottom:8}} role="img" aria-label="Success">✅</div>
            <div style={{fontSize:20,fontFamily:"'Playfair Display',serif",marginBottom:6}}>{t.orderDone.title}</div>
            <div style={{color:"var(--ink-soft)",fontSize:13.5,marginBottom:16,opacity:0.7}}>{t.orderDone.msg}</div>

            {/* What happens next */}
            <div style={{background:"var(--sage-pale)",border:"1px solid rgba(92,122,92,0.2)",borderRadius:12,padding:16,marginBottom:14,fontSize:12.5,color:"var(--sage)",textAlign:"start"}}>
              <div style={{fontWeight:700,marginBottom:8,fontSize:13}}>
                {lang==="en"?"✅ What happens next?":"✅ מה קורה עכשיו?"}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6,opacity:0.9}}>
                <div>📱 {lang==="en"?"We'll confirm your order on WhatsApp within 30 minutes":"נאשר את הזמנתך בוואטסאפ תוך 30 דקות"}</div>
                <div>📦 {lang==="en"?"You'll get a message when it's packed and ready":"תקבל הודעה כשהסחורה ארוזה ומוכנה"}</div>
                {orderInfo.method==="pickup"
                  ? <div>🏪 {lang==="en"?"Come to King George 31 at your chosen time":"הגע/י לחנות בשעה שבחרת — המלך ג׳ורג׳ 31"}</div>
                  : <div>🚚 {lang==="en"?"Our driver will call before arrival":"השליח יתקשר לפני ההגעה"}</div>
                }
                {orderInfo.payMethod!=="stripe"&&<div>💵 {lang==="en"?"Pay cash to the driver on delivery":"תשלם/י במזומן לשליח עם קבלת הסחורה"}</div>}
              </div>
            </div>

            {orderInfo.payMethod==="stripe"&&(
              <div style={{background:"var(--gold-pale)",border:"1px solid rgba(196,169,125,0.3)",borderRadius:10,padding:12,marginBottom:14,fontSize:12,color:"var(--earth)"}}>
                💳 {lang==="en"?"You're being redirected to secure payment. If not redirected, contact us on WhatsApp.":"הנך מועבר לדף התשלום המאובטח. אם לא הועברת, צור קשר בוואטסאפ."}
              </div>
            )}

            <div style={{background:"var(--cream-dark)",borderRadius:10,padding:14,marginBottom:20,fontSize:13,textAlign:"start"}}>
              {orderInfo.method==="deliver"&&orderInfo.date&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{opacity:0.5}}>{t.orderDone.delivery}</span><span>{fmtD(orderInfo.date,lang)}</span></div>}
              {orderInfo.method==="deliver"&&orderInfo.slot&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{opacity:0.5}}>{t.orderDone.time}</span><span>{t.cart[orderInfo.slot]||""}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:600,borderTop:"1px solid var(--parchment)",paddingTop:8,marginTop:4}}><span>{t.orderDone.total}</span><span style={{color:"var(--earth)"}}>₪{orderInfo.total}</span></div>
            </div>
            <button className="mb" onClick={()=>{setOrderInfo(null);go("home")}} autoFocus>{t.orderDone.dismiss}</button>
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
                  ? <img src={qv.img} alt={qv.n[lang]} loading="lazy" decoding="async" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{fontSize:72,filter:"drop-shadow(0 6px 12px rgba(44,36,22,0.1))"}}>{qv.img}</span>
                }
                <div style={{position:"absolute",top:12,display:"flex",gap:4,flexWrap:"wrap",[S]:12}}>
                  {qv.organic&&<span className="tag otag">{t.organic}</span>}
                  {qv.seasonal&&<span className="tag stag">{t.seasonalTag}</span>}
                  {qv.pop&&<span className="tag ptag">{t.popular}</span>}
                </div>
                <button onClick={()=>setQv(null)} aria-label={lang==="en"?"Close product view":"סגור תצוגת מוצר"} style={{position:"absolute",top:12,[E]:12,cursor:"pointer",background:"rgba(44,36,22,0.82)",border:"none",borderRadius:"50%",width:34,height:34,fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.25)",color:"#fff",fontWeight:700}}>✕</button>
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
                    {notes[item.id]&&<div style={{fontSize:14,opacity:0.9,marginTop:4,fontStyle:"italic",color:"var(--earth)"}}>📌 {notes[item.id]}</div>}
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
              <div style={{padding:"16px 22px",borderTop:"1px solid var(--parchment)",background:"var(--cream-dark)",flexShrink:0}}>
                {/* Delivery progress toward free shipping */}
                {deliveryMethod!=="pickup"&&sub<250&&(
                  <div className="delivery-progress" role="status" aria-live="polite">
                    <span>🚚</span>
                    <div style={{flex:1}}>
                      <div>{lang==="en"?`Add ₪${fmtPrice(250-sub)} more for free delivery`:`הוסף ₪${fmtPrice(250-sub)} למשלוח חינם`}</div>
                      <div className="delivery-progress-bar">
                        <div className="delivery-progress-fill" style={{width:`${Math.min(100,(sub/250)*100)}%`}}/>
                      </div>
                    </div>
                  </div>
                )}
                {deliveryMethod!=="pickup"&&sub>=250&&(
                  <div className="delivery-progress" role="status">
                    <span>🎉</span>
                    <span>{lang==="en"?"You've unlocked free delivery!":"זכית במשלוח חינם!"}</span>
                  </div>
                )}
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13,opacity:0.6}}><span>{t.cart.subtotal}</span><span>₪{sub}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13,opacity:0.6}}>
                  <span>{t.cart.delivery}</span>
                  <span>{delFee===0?(lang==="en"?"Free ✨":"חינם ✨"):`₪${delFee}`}</span>
                </div>
                {delFee>0&&<div style={{fontSize:10.5,opacity:0.35,marginBottom:4}}>{lang==="en"?"Free delivery over ₪250":"משלוח חינם מעל ₪250"}</div>}
                <div style={{display:"flex",justifyContent:"space-between",fontWeight:600,fontSize:17,fontFamily:"'Playfair Display',serif",borderTop:"1px solid var(--parchment)",paddingTop:10,marginTop:6,marginBottom:14}}>
                  <span>{t.cart.total}</span><span>₪{tot}</span>
                </div>
                {/* No minimum order */}
                <button className="mb" onClick={()=>setStep(1)} aria-label={lang==="en"?`Proceed to checkout, total ₪${tot}`:`המשך לתשלום, סה"כ ₪${tot}`}>{t.cart.checkout}</button>
              </div>
            )}
          </>):(
            <div style={{flex:1,overflowY:"auto",padding:"16px 22px"}}>
              {/* Step indicator */}
              {(()=>{
                const steps = deliveryMethod==="pickup"
                  ? [t.cart.yourOrder, t.cart.contact, lang==="en"?"Confirm":"אישור"]
                  : [t.cart.yourOrder, t.cart.contact, lang==="en"?"Delivery":"משלוח", lang==="en"?"Confirm":"אישור"];
                const doneCount = [
                  cart.length>0,
                  cName.trim()&&phoneValid&&emailValid,
                  deliveryMethod==="pickup"||(delDate&&timeSlot)
                ].filter(Boolean).length;
                return(
                  <nav className="checkout-steps" aria-label={lang==="en"?"Checkout steps":"שלבי תשלום"}>
                    {steps.map((label,i)=>{
                      const isDone = i < doneCount;
                      const isActive = i === doneCount;
                      return(
                        <div key={i} className={`checkout-step ${isDone?"done":""} ${isActive?"active":""}`}>
                          <div className="checkout-step-dot" aria-current={isActive?"step":undefined}>
                            {isDone?"✓":(i+1)}
                          </div>
                          <span className="checkout-step-label">{label}</span>
                        </div>
                      );
                    })}
                  </nav>
                );
              })()}
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
                    <div style={{background:"var(--sage-pale)",border:"1px solid var(--sage-light)",borderRadius:8,padding:"8px 12px",fontSize:14,color:"var(--sage)",marginBottom:2}}>
                      📍 {lang==="en"?"Delivery available in Tel Aviv only":"משלוח זמין בתל אביב בלבד"}
                    </div>
                    <select className="fi" value={cAddr} onChange={e=>setCAddr(e.target.value)} style={{color:cAddr?"#2C2416":"#B0A090"}}>
                      <option value="">{lang==="en"?"Select Street":"בחר רחוב"}</option>
                      {TEL_AVIV_STREETS.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                    <Inp val={cAddrNum} set={setCAddrNum} ph={lang==="en"?"Building no., Apt., Floor":"מספר בניין, דירה, קומה"} req/>
                  </>}
                </div>
              </div>
              {/* Delivery date & time — only for home delivery */}
              {deliveryMethod==="deliver"&&<>
              <div style={{marginBottom:22}}>
                <div className="sl">{t.cart.deliveryDate}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{(()=>{
                  // Same-day available if before 14:00; show next 7 days excluding Saturdays
                  const now=new Date();
                  const cutoffHour=14;
                  const dates=[];
                  const sameDayOk=now.getHours()<cutoffHour && now.getDay()!==6;
                  if(sameDayOk) dates.push(new Date(now));
                  for(let i=1;dates.length<7;i++){
                    const x=new Date(now);x.setDate(now.getDate()+i);
                    if(x.getDay()!==6) dates.push(x);
                  }
                  return dates.map((d,i)=>{
                    const isToday=d.toDateString()===now.toDateString();
                    const label=isToday?(lang==="en"?"Today — Same Day":"היום — אותו יום"):fmtD(d,lang);
                    return(<button key={i} className={`db ${delDate&&d.toDateString()===delDate.toDateString()?"on":""}`} onClick={()=>setDelDate(d)} style={isToday?{borderColor:"var(--sage)",color:"var(--sage)",fontWeight:600}:{}}>{label}</button>);
                  });
                })()}</div>
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
      <main id="main-content">
        {/* HOME */}
        {page==="home"&&(
          <div style={{animation:"fadeIn 0.5s"}}>
            <div className="hero" style={{alignItems:"center",textAlign:"center"}}>
              {/* Floating produce decorations */}
              <div className="hero-deco" style={{top:"10%",left:"6%",fontSize:38,animation:"float 7s ease-in-out infinite"}}>🍋</div>
              <div className="hero-deco" style={{bottom:"18%",right:"6%",fontSize:32,animation:"float 9s ease-in-out infinite 1s"}}>🌿</div>
              <div className="hero-deco" style={{top:"16%",right:"10%",fontSize:28,animation:"float 8s ease-in-out infinite 2s"}}>🍅</div>
              <div className="hero-deco" style={{bottom:"12%",left:"9%",fontSize:24,animation:"float 6s ease-in-out infinite 0.5s"}}>🥦</div>

              <div className="hero-content" style={{
                opacity:heroVis?1:0,
                transform:heroVis?"translateY(0)":"translateY(24px)",
                transition:"all 0.9s cubic-bezier(0.2,0,0,1)",
                alignItems:"center",
                textAlign:"center",
                margin:"0 auto",
              }}>
                <div className="hero-eyebrow" style={{justifyContent:"center",textAlign:"center"}}>{t.hero.subtitle}</div>
                <h1 className="hero-headline ht" style={{textAlign:"center",width:"100%"}}>
                  {rtl ? <>גואה <em>בוטיק</em></> : <>GOA <em>boutique</em></>}
                </h1>
                <p className="hero-sub" style={{textAlign:"center",width:"100%"}}>{t.hero.tagline}</p>
                <div style={{display:"flex",justifyContent:"center",width:"100%"}}>
                  <button className="hero-cta" onClick={()=>go("shop")}>
                    <span>🛒</span>
                    <span>{t.hero.cta}</span>
                  </button>
                </div>
              </div>
              <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",letterSpacing:4,fontSize:8,opacity:0.15,textTransform:"uppercase",fontFamily:"'Lato',sans-serif",zIndex:1,whiteSpace:"nowrap"}}>{t.hero.since}</div>
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
              <div className="cql" role="list">
                {categories.map(c=>(
                  <button key={c.id} className="cqi" role="listitem"
                    onClick={()=>{setCat(c.id);go("shop",true)}}
                    onKeyDown={e=>(e.key==="Enter"||e.key===" ")&&(setCat(c.id),go("shop",true))}
                    aria-label={lang==="en"?`Shop ${c.label.en}`:`קנה ${c.label.he}`}
                    style={{background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0}}>
                    <span className="cqi-icon" aria-hidden="true">{c.icon}</span>
                    <div className="cqi-label">{c.label[lang]}</div>
                  </button>
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
            <div className="shop-filters" role="search" aria-label={lang==="en"?"Product filters":"סינון מוצרים"}>
              <div className="filter-cats">
                <div className="filter-cats-pills" role="group" aria-label={lang==="en"?"Filter by category":"סינון לפי קטגוריה"}>
                  {[{id:"all",label:{en:"All",he:"הכל"}},{id:"organic",label:{en:"🌱 Organic",he:"🌱 אורגני"}},...categories.map(c=>({...c,label:{en:`${c.icon} ${c.label.en}`,he:`${c.icon} ${c.label.he}`}}))].map(c=>(
                    <button key={c.id} className={`cb ${cat===c.id?"on":""} ${c.id==="organic"?"organic-btn":""}`}
                      style={{flexShrink:0}}
                      onClick={()=>{setCat(c.id);if(c.id!=="all")setSearch("")}}
                      aria-pressed={cat===c.id}
                      aria-label={lang==="en"?`Filter by ${c.label.en}`:`סינון: ${c.label.he}`}>
                      {c.label[lang]}
                    </button>
                  ))}
                </div>
                <div style={{flexShrink:0,position:"relative",marginInlineStart:8}} onClick={e=>e.stopPropagation()}>
                  <button className="sb" onClick={()=>setShowSort(!showSort)}
                    aria-label={lang==="en"?"Sort products":"מיין מוצרים"}
                    aria-expanded={showSort} aria-haspopup="listbox">
                    {t.sort.label} ▾
                  </button>
                  {showSort&&<div className="sd" role="listbox" aria-label={lang==="en"?"Sort options":"אפשרויות מיון"}>
                    {[["default","—"],["pAsc",t.sort.pAsc],["pDesc",t.sort.pDesc],["name",t.sort.name]].map(([v,l])=>(
                      <button key={v} role="option" aria-selected={sortBy===v} className={`so ${sortBy===v?"on":""}`}
                        onClick={()=>{setSortBy(v);setShowSort(false)}}>{l}</button>
                    ))}
                  </div>}
                </div>
              </div>
              <div className="filter-price-row">
                <label htmlFor="price-range" className="filter-price-label">{t.filter.price}:</label>
                <input id="price-range" type="range" className="ri" min={10} max={MAX_P} value={maxPrice}
                  onChange={e=>setMaxPrice(+e.target.value)} style={{flex:1}}
                  aria-label={lang==="en"?`Maximum price: ₪${maxPrice}`:`מחיר מקסימלי: ₪${maxPrice}`}/>
                <span style={{fontSize:12,fontWeight:600,color:"var(--earth)",minWidth:38,fontFamily:"'Playfair Display',serif"}} aria-hidden="true">₪{maxPrice}{maxPrice>=MAX_P?"+":""}</span>
                <span className="filter-count" aria-live="polite" aria-label={`${filtered.length} of ${products.length} products`}>{filtered.length}/{products.length}</span>
                {hasFilters&&<button className="clb" onClick={clearF} aria-label={lang==="en"?"Clear all filters":"נקה כל הסינונים"}>{t.filter.clear}</button>}
              </div>
            </div>
            <div className="pg" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {filtered.map((p,i)=><PCard key={p.id} p={p} i={i} sm q={cQty(p.id)} anim={addedAnim[p.id]} onAdd={()=>addToCart(p)} onDec={()=>setQ(p.id,cQty(p.id)-1)} onInc={()=>setQ(p.id,cQty(p.id)+1)} onQv={setQv} lang={lang} t={t} S={S}/>)}
            </div>
            {filtered.length===0&&<div style={{textAlign:"center",padding:"56px 0",opacity:0.3}}><div style={{fontSize:38,marginBottom:12}}>🔍</div><div style={{marginBottom:10}}>{lang==="en"?"No products found":"לא נמצאו מוצרים"}</div><button className="clb" onClick={clearF}>{t.filter.clear}</button></div>}
          </div>
        )}

        {/* SUBSCRIPTIONS — deferred until first visit */}
        {mountedPages.has("subscriptions")&&(
        <div style={{display:page==="subscriptions"?"block":"none"}}>
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
        </div>)}

        {/* LOYALTY — deferred until first visit */}
        {mountedPages.has("loyalty")&&(
        <div style={{display:page==="loyalty"?"block":"none"}}>
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
        </div>)}

        {/* ABOUT — deferred until first visit */}
        {mountedPages.has("about")&&(
        <div style={{display:page==="about"?"block":"none"}}>
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
        </div>)}

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
      </main>
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