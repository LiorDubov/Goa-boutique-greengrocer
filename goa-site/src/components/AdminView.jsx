import { useState, useRef } from "react";
import { addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { T, UNIT_KEYS, IL_CITIES, ADMIN_PIN } from "../constants.js";
import { fbApp, PRODUCTS_COL, CATEGORIES_COL, prodDoc, catDoc } from "../firebase.js";

const storage = getStorage(fbApp);

const AdminView = ({ products, categories, lang, onClose }) => {
  const t = T[lang];
  const rtl = lang === "he";
  const S = rtl ? "right" : "left";

  const [auth, setAuth] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState("products");
  const [modal, setModal] = useState(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [newCat, setNewCat] = useState({ id: "", icon: "", label: { en: "", he: "" } });

  const tryLogin = () => {
    if (pin === ADMIN_PIN) { setAuth(true); setPinError(false); }
    else { setPinError(true); setPin(""); }
  };

  const uploadImage = async (file, onDone) => {
    if (!file) return;
    setImgUploading(true);
    try {
      const r = storageRef(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      onDone(url);
    } catch (e) { console.error("Upload error:", e); }
    setImgUploading(false);
  };

  const openAddModal = () => {
    const mx = products.reduce((m, p) => Math.max(m, p.id), 0);
    setModal({ mode: "add", form: { id: mx + 1, n: { en: "", he: "" }, priceStr: "", stockStr: "50", u: "perKg", enabledUnits: { perKg: true }, prices: { perKg: "" }, cat: categories[0]?.id || "fruits", img: "🍏", organic: false, seasonal: false, pop: false, o: { en: "", he: "" }, stock: 50 } });
  };

  const openEditModal = (p) => {
    const enabledUnits = p.enabledUnits ? { ...p.enabledUnits } : { [p.u]: true };
    const unitPrices = p.unitPrices ? { ...p.unitPrices } : { [p.u || "perKg"]: p.price };
    const firstActive = UNIT_KEYS.find(k => enabledUnits[k]) || p.u || "perKg";
    setModal({ mode: "edit", form: { ...p, priceStr: String(unitPrices[firstActive] || p.price || ""), stockStr: String(p.stock ?? 50), enabledUnits, prices: unitPrices } });
  };

  const saveModal = async () => {
    if (!modal) return;
    const f = modal.form;
    if (!f.n.en.trim() || !f.n.he.trim()) return;
    const enabledUnits = f.enabledUnits || { [f.u || "perKg"]: true };
    const prices = f.prices || {};
    const activeUnits = UNIT_KEYS.filter(k => enabledUnits[k]);
    if (activeUnits.length === 0) return;
    const unitPrices = {};
    let primaryPrice = null;
    for (const uk of activeUnits) {
      const p = parseFloat(prices[uk] || f.priceStr || 0);
      if (isNaN(p) || p <= 0) return;
      unitPrices[uk] = p;
      if (!primaryPrice) primaryPrice = p;
    }
    const data = {
      id: f.id, n: f.n,
      price: primaryPrice, u: activeUnits[0],
      unitPrices, enabledUnits,
      stock: parseInt(f.stockStr) || 0,
      cat: f.cat, img: f.img || "🍏",
      organic: !!f.organic, seasonal: !!f.seasonal, pop: !!f.pop,
      o: f.o || { en: "", he: "" }
    };
    try {
      if (modal.mode === "add") await addDoc(PRODUCTS_COL, data);
      else if (f._docId) await updateDoc(prodDoc(f._docId), data);
    } catch (e) { console.error("Save error:", e); }
    setModal(null);
  };

  const delProduct = async (id) => {
    if (!window.confirm(lang === "en" ? "Delete this product?" : "למחוק את המוצר?")) return;
    const p = products.find(x => x.id === id);
    if (p && p._docId) { try { await deleteDoc(prodDoc(p._docId)); } catch (e) { console.error(e); } }
  };

  const addCategory = async () => {
    if (!newCat.id.trim() || !newCat.label.en.trim() || !newCat.label.he.trim() || !newCat.icon.trim()) return;
    if (categories.find(c => c.id === newCat.id)) return;
    const catData = { id: newCat.id.toLowerCase().replace(/\s+/g, "_"), icon: newCat.icon, label: newCat.label };
    try { await addDoc(CATEGORIES_COL, catData); } catch (e) { console.error(e); }
    setNewCat({ id: "", icon: "", label: { en: "", he: "" } });
  };

  const delCategory = async (id) => {
    if (products.some(p => p.cat === id)) return;
    const c = categories.find(x => x.id === id);
    if (c && c._docId) { try { await deleteDoc(catDoc(c._docId)); } catch (e) { console.error(e); } }
  };

  const btn = { cursor: "pointer", fontFamily: "inherit" };

  if (!auth) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(253,251,247,0.98)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 300, width: "100%", padding: 20 }}>
        <div style={{ fontSize: 36, marginBottom: 16 }} role="img" aria-label="Lock">🔐</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, marginBottom: 20 }}>{t.admin.title}</div>
        <input className="fi" type="password" placeholder={t.admin.pin} value={pin}
          onChange={e => { setPin(e.target.value); setPinError(false); }}
          onKeyDown={e => e.key === "Enter" && tryLogin()}
          aria-label="Admin PIN" aria-invalid={pinError}
          style={{ textAlign: "center", direction: "ltr", marginBottom: 8, ...(pinError ? { borderColor: "#D94F4F" } : {}) }} />
        {pinError && <div role="alert" style={{ color: "#D94F4F", fontSize: 11, marginBottom: 8 }}>{lang === "en" ? "Incorrect PIN" : "קוד שגוי"}</div>}
        <button className="mb" onClick={tryLogin}>{t.auth.login}</button>
        <button onClick={onClose} style={{ ...btn, marginTop: 10, background: "none", border: "none", fontSize: 12, opacity: 0.4, display: "block", width: "100%", minHeight: 36 }}>✕ {lang === "en" ? "Cancel" : "ביטול"}</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(253,251,247,0.98)", overflowY: "auto", animation: "fadeIn 0.2s", padding: 20 }}
      role="dialog" aria-modal="true" aria-label={t.admin.title}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24 }}>{t.admin.title}</h1>
          <button className="gb" style={{ width: "auto", padding: "8px 16px" }}
            onClick={onClose} aria-label={lang === "en" ? "Close admin dashboard" : "סגור לוח ניהול"}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: "2px solid #F0EBE3", paddingBottom: 8 }} role="tablist">
          {["products", "categories"].map(tabId => (
            <button key={tabId} role="tab" aria-selected={tab === tabId}
              onClick={() => setTab(tabId)}
              style={{ ...btn, padding: "8px 20px", background: tab === tabId ? "#2C2416" : "transparent", color: tab === tabId ? "#FDFBF7" : "#2C2416", border: tab === tabId ? "none" : "1px solid #E5DDD0", borderRadius: 8, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.5, minHeight: 44 }}>
              {tabId === "products" ? (lang === "en" ? "Products" : "מוצרים") : (lang === "en" ? "Categories" : "קטגוריות")}
            </button>
          ))}
        </div>

        {/* Products tab */}
        {tab === "products" && (
          <div role="tabpanel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="sl" style={{ margin: 0 }}>{t.admin.products} ({products.length})</div>
              <button className="cb on" style={{ fontSize: 12 }} onClick={openAddModal}
                aria-label={lang === "en" ? "Add new product" : "הוסף מוצר חדש"}>{t.admin.add}</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }} role="grid" aria-label="Products list">
                <thead>
                  <tr>
                    {["", lang === "en" ? "Name" : "שם", "₪", lang === "en" ? "Stock" : "מלאי", ""].map((h, i) => (
                      <th key={i} scope="col" style={{ textAlign: S, padding: "8px 10px", borderBottom: "2px solid #E5DDD0", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #F5F0E8", fontSize: 20 }} aria-hidden="true">{p.img}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #F5F0E8" }}>
                        <div style={{ fontWeight: 500 }}>{p.n[lang]}</div>
                        <div style={{ fontSize: 10, opacity: 0.4 }}>{p.n[lang === "en" ? "he" : "en"]}</div>
                      </td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #F5F0E8", fontWeight: 600 }}>₪{p.price}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #F5F0E8" }}>
                        {p.stock <= 0
                          ? <span style={{ color: "#D94F4F", fontSize: 11, fontWeight: 600 }} aria-label="Out of stock">✕ 0</span>
                          : <span style={{ color: "#3D6B3D", fontSize: 11, fontWeight: 600 }} aria-label={`${p.stock} in stock`}>✓ {p.stock}</span>}
                      </td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #F5F0E8", whiteSpace: "nowrap" }}>
                        <button style={{ ...btn, background: "transparent", border: "1px solid #E5DDD0", borderRadius: 6, padding: "4px 10px", fontSize: 11, marginInlineEnd: 4, minHeight: 36 }}
                          onClick={() => openEditModal(p)} aria-label={`Edit ${p.n[lang]}`}>{t.admin.edit}</button>
                        <button style={{ ...btn, background: "transparent", border: "1px solid #D94F4F", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#D94F4F", minHeight: 36 }}
                          onClick={() => delProduct(p.id)} aria-label={`Delete ${p.n[lang]}`}>{t.admin.del}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories tab */}
        {tab === "categories" && (
          <div role="tabpanel">
            <fieldset style={{ border: "1px solid #F0EBE3", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <legend style={{ fontSize: 12, opacity: 0.5, padding: "0 6px" }}>{lang === "en" ? "Add Category" : "הוסף קטגוריה"}</legend>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div><label style={{ fontSize: 9, opacity: 0.4, display: "block", marginBottom: 4 }}>ID</label><input className="fi" placeholder="e.g. bakery" value={newCat.id} onChange={e => setNewCat({ ...newCat, id: e.target.value })} style={{ width: 120, direction: "ltr" }} /></div>
                <div><label style={{ fontSize: 9, opacity: 0.4, display: "block", marginBottom: 4 }}>Icon</label><input className="fi" placeholder="🥖" value={newCat.icon} onChange={e => setNewCat({ ...newCat, icon: e.target.value })} style={{ width: 60, textAlign: "center" }} /></div>
                <div><label style={{ fontSize: 9, opacity: 0.4, display: "block", marginBottom: 4 }}>English</label><input className="fi" placeholder="Bakery" value={newCat.label.en} onChange={e => setNewCat({ ...newCat, label: { ...newCat.label, en: e.target.value } })} style={{ width: 140, direction: "ltr" }} /></div>
                <div><label style={{ fontSize: 9, opacity: 0.4, display: "block", marginBottom: 4 }}>עברית</label><input className="fi" placeholder="מאפייה" value={newCat.label.he} onChange={e => setNewCat({ ...newCat, label: { ...newCat.label, he: e.target.value } })} style={{ width: 140 }} /></div>
                <button className="mb" style={{ padding: "10px 20px", width: "auto", minHeight: 44 }} onClick={addCategory}>{t.admin.save}</button>
              </div>
            </fieldset>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
              {categories.map(c => {
                const cnt = products.filter(p => p.cat === c.id).length;
                return (
                  <div key={c.id} style={{ background: "#fff", border: "1px solid #F0EBE3", borderRadius: 10, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }} aria-hidden="true">{c.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.label[lang]}</div>
                      <div style={{ fontSize: 10, opacity: 0.4 }}>{c.id} · {cnt} {lang === "en" ? "products" : "מוצרים"}</div>
                    </div>
                    <button onClick={() => delCategory(c.id)} disabled={cnt > 0}
                      aria-label={`Delete ${c.label[lang]} category${cnt > 0 ? " (has products)" : ""}`}
                      style={{ ...btn, background: "none", border: `1px solid ${cnt > 0 ? "#E5DDD0" : "#D94F4F"}`, borderRadius: 6, padding: "4px 8px", fontSize: 10, color: cnt > 0 ? "#ccc" : "#D94F4F", opacity: cnt > 0 ? 0.4 : 1, cursor: cnt > 0 ? "not-allowed" : "pointer", minHeight: 36 }}>
                      {t.admin.del}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Product Add/Edit Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(44,36,22,0.5)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)", animation: "fadeIn 0.15s", padding: 20 }}
          onClick={() => setModal(null)}
          role="dialog" aria-modal="true" aria-label={modal.mode === "add" ? (lang === "en" ? "Add Product" : "הוסף מוצר") : (lang === "en" ? "Edit Product" : "ערוך מוצר")}>
          <div style={{ background: "#FDFBF7", borderRadius: 16, maxWidth: 520, width: "100%", padding: 28, animation: "scaleIn 0.25s", maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, marginBottom: 20 }}>
              {modal.mode === "add" ? (lang === "en" ? "Add Product" : "הוסף מוצר") : (lang === "en" ? "Edit Product" : "ערוך מוצר")}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["n.en", "Name (EN)", "ltr"], ["n.he", "שם (HE)", "rtl"], ["o.en", "Origin (EN)", "ltr"], ["o.he", "מקור (HE)", "rtl"]].map(([field, label, dir]) => {
                const [obj, key] = field.split(".");
                return (
                  <div key={field}>
                    <label style={{ fontSize: 9, opacity: 0.4, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>
                    <input className="fi" value={modal.form[obj]?.[key] || ""}
                      onChange={e => setModal({ ...modal, form: { ...modal.form, [obj]: { ...modal.form[obj], [key]: e.target.value } } })}
                      style={{ direction: dir }} />
                  </div>
                );
              })}
              <div>
                <label style={{ fontSize: 9, opacity: 0.4, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{t.admin.stock}</label>
                <input className="fi" type="number" min="0" value={modal.form.stockStr || ""}
                  onChange={e => setModal({ ...modal, form: { ...modal.form, stockStr: e.target.value } })} style={{ direction: "ltr" }} />
              </div>
              <div>
                <label style={{ fontSize: 9, opacity: 0.4, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{t.admin.cat}</label>
                <select className="fi" value={modal.form.cat} onChange={e => setModal({ ...modal, form: { ...modal.form, cat: e.target.value } })}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label[lang]}</option>)}
                </select>
              </div>
            </div>

            {/* Pricing */}
            <fieldset style={{ border: "none", padding: 0, margin: "14px 0 10px" }}>
              <legend style={{ fontSize: 9, opacity: 0.4, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                {lang === "en" ? "Pricing — enable unit types" : "תמחור — הפעל סוגי יחידות"}
              </legend>
              {[["perKg", lang === "en" ? "Per kg" : "לפי ק״ג"], ["perUnit", lang === "en" ? "Per unit" : "לפי יחידה"], ["perPack", lang === "en" ? "Per pack" : "לפי חבילה"]].map(([uKey, uLabel]) => {
                const enabled = modal.form.enabledUnits?.[uKey] ?? (modal.form.u === uKey);
                const priceVal = modal.form.prices?.[uKey] ?? "";
                return (
                  <div key={uKey} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "8px 10px", background: enabled ? "#FFF5E5" : "#F5F5F5", borderRadius: 8, border: `1px solid ${enabled ? "#C4A97D" : "#E5DDD0"}` }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", minWidth: 100 }}>
                      <input type="checkbox" checked={!!enabled} onChange={e => {
                        const eu = { ...(modal.form.enabledUnits || {}), [uKey]: e.target.checked };
                        const active = UNIT_KEYS.filter(k => eu[k]);
                        setModal({ ...modal, form: { ...modal.form, enabledUnits: eu, u: active.length === 1 ? active[0] : modal.form.u } });
                      }} />
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>{uLabel}</span>
                    </label>
                    {enabled && (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, opacity: 0.5 }}>₪</span>
                        <input className="fi" type="number" min="0" step="0.5" placeholder="0.00"
                          value={priceVal}
                          onChange={e => {
                            const newPrices = { ...(modal.form.prices || {}), [uKey]: e.target.value };
                            setModal({ ...modal, form: { ...modal.form, prices: newPrices } });
                          }}
                          aria-label={`Price ${uLabel}`}
                          style={{ direction: "ltr", padding: "6px 10px", fontSize: 13 }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </fieldset>

            {/* Image */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 9, opacity: 0.4, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>{t.admin.image}</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="fi" value={modal.form.img || ""} onChange={e => setModal({ ...modal, form: { ...modal.form, img: e.target.value } })} placeholder="🍏 or https://..." style={{ flex: 1 }} aria-label="Product image URL or emoji" />
                <label style={{ cursor: "pointer", padding: "8px 12px", background: "#2C2416", color: "#FDFBF7", borderRadius: 8, fontSize: 11.5, fontFamily: "inherit", whiteSpace: "nowrap", position: "relative", minHeight: 40, display: "flex", alignItems: "center" }}>
                  {imgUploading ? (lang === "en" ? "Uploading..." : "מעלה...") : (lang === "en" ? "Upload 📷" : "העלה 📷")}
                  <input type="file" accept="image/*" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                    onChange={e => { if (e.target.files[0]) uploadImage(e.target.files[0], (url) => setModal(prev => ({ ...prev, form: { ...prev.form, img: url } }))); }} />
                </label>
              </div>
              {modal.form.img && modal.form.img.startsWith("http") && (
                <img src={modal.form.img} alt={lang === "en" ? "Product preview" : "תצוגה מקדימה"} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, marginTop: 6, border: "1px solid #E5DDD0" }} />
              )}
              {modal.form.img && !modal.form.img.startsWith("http") && (
                <span role="img" aria-label="Product emoji" style={{ fontSize: 40, display: "block", marginTop: 6 }}>{modal.form.img}</span>
              )}
            </div>

            {/* Tags */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
              {[["organic", "🌿 Organic"], ["seasonal", "🍂 Seasonal"], ["pop", "⭐ Popular"]].map(([k, l]) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={!!modal.form[k]} onChange={e => setModal({ ...modal, form: { ...modal.form, [k]: e.target.checked } })} />
                  {l}
                </label>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="mb" style={{ flex: 1 }} onClick={saveModal}>{t.admin.save}</button>
              <button className="gb" style={{ flex: 1 }} onClick={() => setModal(null)}>{t.admin.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
