import { useState, useEffect } from "react";
import { updateDoc } from "firebase/firestore";
import { T, WA_PHONE } from "../constants.js";
import { orderDoc } from "../firebase.js";

const EmployeeView = ({ orders, lang, onBack }) => {
  const t = T[lang];
  const [now, setNow] = useState(Date.now());
  const [checked, setChecked] = useState({});
  const [empAuth, setEmpAuth] = useState(false);
  const [empPin, setEmpPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const EMP_PIN = "5678";

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(iv);
  }, []);

  const tryLogin = () => {
    if (empPin === EMP_PIN) { setEmpAuth(true); setPinError(false); }
    else { setPinError(true); setEmpPin(""); }
  };

  const toggleCheck = (orderId, idx) =>
    setChecked(p => ({ ...p, [`${orderId}-${idx}`]: !p[`${orderId}-${idx}`] }));

  const acceptOrder = (id) => {
    const o = orders.find(x => x.id === id);
    if (o && o._docId) updateDoc(orderDoc(o._docId), { status: "processing", acceptedAt: Date.now() });
  };

  const updateWeight = (orderId, itemIdx, wt) => {
    const o = orders.find(x => x.id === orderId);
    if (!o || !o._docId) return;
    const items = [...o.items];
    const it = { ...items[itemIdx] };
    it.actualWt = parseFloat(wt) || it.qty;
    it.actualPrice = it.u === "perKg"
      ? Math.round(it.price * it.actualWt * 100) / 100
      : it.price * it.qty;
    items[itemIdx] = it;
    const newTotal = items.reduce((s, x) => s + (x.actualPrice !== undefined ? x.actualPrice : x.price * x.qty), 0);
    updateDoc(orderDoc(o._docId), { items, total: newTotal + (o.deliveryFee || 0) });
  };

  const finalizeOrder = (id) => {
    const o = orders.find(x => x.id === id);
    if (o && o._docId) updateDoc(orderDoc(o._docId), { status: "completed", completedAt: Date.now() });
  };

  const bs = { cursor: "pointer", padding: "8px 16px", border: "none", borderRadius: 8, fontSize: 12, fontFamily: "inherit", fontWeight: 600 };

  if (!empAuth) return (
    <div style={{ minHeight: "100vh", background: "#1a1a2e", color: "#eee", fontFamily: "'Segoe UI',sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#16213e", border: "1px solid #333", borderRadius: 16, padding: 36, textAlign: "center", maxWidth: 300, width: "100%" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }} role="img" aria-label="Lock">🔐</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Staff Access</div>
        <div style={{ fontSize: 12, opacity: 0.4, marginBottom: 20 }}>Enter your employee PIN</div>
        <input
          type="password" placeholder="PIN" value={empPin}
          onChange={e => { setEmpPin(e.target.value); setPinError(false); }}
          onKeyDown={e => e.key === "Enter" && tryLogin()}
          aria-label="Employee PIN"
          aria-invalid={pinError}
          style={{ width: "100%", padding: "10px 14px", border: `1px solid ${pinError ? "#ff4444" : "#444"}`, borderRadius: 8, background: "#0f3460", color: "#eee", fontSize: 16, textAlign: "center", outline: "none", marginBottom: 6, fontFamily: "inherit", direction: "ltr" }}
        />
        {pinError && <div role="alert" style={{ color: "#ff6b6b", fontSize: 11, marginBottom: 8 }}>Incorrect PIN. Try again.</div>}
        <button onClick={tryLogin} style={{ cursor: "pointer", width: "100%", padding: "11px", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, fontFamily: "inherit", marginBottom: 8, minHeight: 44 }}>Enter</button>
        <button onClick={onBack} style={{ cursor: "pointer", width: "100%", padding: "10px", background: "#333", color: "#eee", border: "none", borderRadius: 8, fontSize: 13, fontFamily: "inherit", minHeight: 44 }}>
          {t.emp.back}
        </button>
      </div>
    </div>
  );

  const pending = orders.filter(o => o.status === "pending");
  const processing = orders.filter(o => o.status === "processing");
  const completed = orders.filter(o => o.status === "completed").slice(0, 10);

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a2e", color: "#eee", fontFamily: "'Segoe UI',sans-serif", padding: 20 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>👨‍🍳 {t.emp.title}</h1>
          <button onClick={onBack} style={{ ...bs, background: "#333", color: "#fff" }} aria-label="Back to store">{t.emp.back}</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
          {/* PENDING */}
          <section aria-label={`${t.emp.pending} orders`}>
            <h2 style={{ color: "#ff6b6b", marginBottom: 12, fontSize: 14, textTransform: "uppercase", letterSpacing: 2 }}>
              🔴 {t.emp.pending} ({pending.length})
            </h2>
            {pending.length === 0 && <div style={{ opacity: 0.3, fontSize: 13 }}>{t.emp.noOrders}</div>}
            {pending.map(o => {
              const age = (now - o.createdAt) / 1000;
              const alert = age > 30;
              return (
                <div key={o.id} style={{ background: alert ? "#4a1a1a" : "#16213e", border: alert ? "2px solid #ff4444" : "1px solid #333", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  {alert && (
                    <div role="alert" style={{ background: "#ff4444", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700, display: "inline-block", marginBottom: 8 }}>
                      ⚠️ {Math.round(age)}s — MANAGER ALERT
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{o.customerName}</span>
                    <span style={{ fontSize: 11, opacity: 0.5 }}>#{o.id.toString().slice(-4)}</span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
                    {o.items.map(it => `${it.img} ${it.n[lang]} ×${it.qty}`).join(", ")}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#C4A97D", marginBottom: 10 }}>₪{o.total}</div>
                  <button onClick={() => acceptOrder(o.id)} style={{ ...bs, background: "#25D366", color: "#fff", width: "100%", minHeight: 44 }}
                    aria-label={`Accept order from ${o.customerName}`}>
                    {t.emp.accept}
                  </button>
                </div>
              );
            })}
          </section>

          {/* PROCESSING */}
          <section aria-label={`${t.emp.processing} orders`}>
            <h2 style={{ color: "#ffd93d", marginBottom: 12, fontSize: 14, textTransform: "uppercase", letterSpacing: 2 }}>
              🟡 {t.emp.processing} ({processing.length})
            </h2>
            {processing.length === 0 && <div style={{ opacity: 0.3, fontSize: 13 }}>{t.emp.noOrders}</div>}
            {processing.map(o => (
              <div key={o.id} style={{ background: "#16213e", border: "1px solid #444", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{o.customerName}</span>
                  <span style={{ fontSize: 11, opacity: 0.5 }}>#{o.id.toString().slice(-4)}</span>
                </div>
                {o.items.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #222", fontSize: 12, opacity: checked[`${o.id}-${idx}`] ? 0.4 : 1, textDecoration: checked[`${o.id}-${idx}`] ? "line-through" : "none" }}>
                    <input type="checkbox" checked={!!checked[`${o.id}-${idx}`]} onChange={() => toggleCheck(o.id, idx)}
                      aria-label={`Mark ${it.n[lang]} as picked`}
                      style={{ accentColor: "#6BCB77", width: 20, height: 20, cursor: "pointer", flexShrink: 0 }} />
                    <span aria-hidden="true">{it.img}</span>
                    <span style={{ flex: 1 }}>{it.n[lang]} ×{it.qty}</span>
                    {it.u === "perKg" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input type="number" step="0.1" min="0" placeholder={t.emp.actualWt} value={it.actualWt || ""}
                          onChange={e => updateWeight(o.id, idx, e.target.value)}
                          aria-label={`Actual weight for ${it.n[lang]} in kg`}
                          style={{ width: 70, padding: "4px 6px", border: "1px solid #555", borderRadius: 4, background: "#0f3460", color: "#eee", fontSize: 11, direction: "ltr" }} />
                        <span style={{ fontSize: 10, opacity: 0.5 }}>kg</span>
                      </div>
                    )}
                    <span style={{ fontWeight: 600, color: "#C4A97D", minWidth: 50, textAlign: "right" }}>
                      ₪{it.actualPrice !== undefined ? it.actualPrice.toFixed(0) : it.price * it.qty}
                    </span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid #333" }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: "#C4A97D" }}>₪{Math.round(o.total)}</span>
                  <button onClick={() => finalizeOrder(o.id)} style={{ ...bs, background: "#C4A97D", color: "#1a1a2e", minHeight: 44 }}
                    aria-label={`Mark order for ${o.customerName} as complete`}>
                    {t.emp.finalize}
                  </button>
                </div>
              </div>
            ))}
          </section>

          {/* COMPLETED */}
          <section aria-label="Completed orders">
            <h2 style={{ color: "#6BCB77", marginBottom: 12, fontSize: 14, textTransform: "uppercase", letterSpacing: 2 }}>
              🟢 {t.emp.completed} ({completed.length})
            </h2>
            {completed.length === 0 && <div style={{ opacity: 0.3, fontSize: 13 }}>{t.emp.noOrders}</div>}
            {completed.map(o => (
              <div key={o.id} style={{ background: "#16213e", border: "1px solid #2a4a2a", borderRadius: 12, padding: 14, marginBottom: 10, opacity: 0.7 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{o.customerName}</span>
                  <span style={{ color: "#6BCB77", fontWeight: 600 }}>₪{Math.round(o.total)}</span>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
};

export default EmployeeView;
