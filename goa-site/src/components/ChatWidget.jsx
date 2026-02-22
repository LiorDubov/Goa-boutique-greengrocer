import { useState, useEffect, useRef } from "react";
import { T, WA_PHONE } from "../constants.js";

const ChatWidget = ({ lang, open, onClose }) => {
  const t = T[lang].chat;
  const [msgs, setMsgs] = useState([{ from: "bot", text: "GOA Support 👋" }]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = (text) => {
    if (!text.trim()) return;
    setMsgs(p => [...p, { from: "user", text }]);
    setTimeout(() => {
      const low = text.toLowerCase();
      let reply;
      if (low.includes("hour") || low.includes("שעות") || low.includes("open") || low.includes("פתוח") || low.includes("time") || low.includes("שעה"))
        reply = lang === "en"
          ? "We're open Sun–Thu 08:00–21:00, Friday 08:00 until Shabbat. Closed Saturday 🕐"
          : "אנחנו פתוחים א׳–ה׳ 08:00–21:00, שישי 08:00 עד כניסת שבת. שבת סגור 🕐";
      else if (low.includes("zone") || low.includes("deliver") || low.includes("משלוח") || low.includes("אזור") || low.includes("where") || low.includes("איפה"))
        reply = lang === "en"
          ? "We deliver exclusively within Tel Aviv 🚚 Select your street at checkout."
          : "אנחנו מגיעים לתל אביב בלבד 🚚 בחרו את הרחוב שלכם בעת ההזמנה.";
      else if (low.includes("human") || low.includes("נציג") || low.includes("person") || low.includes("speak") || low.includes("דבר")) {
        reply = lang === "en" ? "Connecting you to WhatsApp..." : "מעביר לוואטסאפ...";
        setTimeout(() => window.open(`https://wa.me/${WA_PHONE}`, "_blank"), 1500);
      } else {
        reply = lang === "en"
          ? "I can help with our hours, delivery zones (Tel Aviv only), or connect you to our team! 🌿"
          : "אני יכול לעזור עם שעות פתיחה, אזורי משלוח (תל אביב בלבד), או לחבר אותך לצוות שלנו! 🌿";
      }
      setMsgs(p => [...p, { from: "bot", text: reply }]);
    }, 600);
    setInput("");
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && open) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={lang === "en" ? "GOA Support Chat" : "צ׳אט תמיכה GOA"}
      dir="ltr"
      style={{
        position: "fixed", bottom: 80, right: 20, width: 320,
        maxHeight: 440, background: "#FDFBF7", borderRadius: 16,
        boxShadow: "0 10px 40px rgba(0,0,0,0.15)", zIndex: 999,
        display: "flex", flexDirection: "column", overflow: "hidden",
        animation: "scaleIn 0.2s", border: "1px solid #E5DDD0"
      }}>

      {/* Header */}
      <div style={{ background: "#2C2416", color: "#FDFBF7", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>💬 {lang === "en" ? "GOA Support" : "תמיכת GOA"}</span>
        <button
          onClick={onClose}
          aria-label={lang === "en" ? "Close support chat" : "סגור צ׳אט תמיכה"}
          style={{ background: "none", border: "none", color: "#FDFBF7", cursor: "pointer", fontSize: 16, minWidth: 32, minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 220 }}>
        {msgs.map((m, i) => (
          <div key={i}
            style={{
              alignSelf: m.from === "user" ? "flex-end" : "flex-start",
              background: m.from === "user" ? "#2C2416" : "#F0EBE3",
              color: m.from === "user" ? "#FDFBF7" : "#2C2416",
              padding: "8px 12px", borderRadius: 12, maxWidth: "82%", fontSize: 13, lineHeight: 1.4
            }}>
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Quick reply chips */}
      <div style={{ padding: "6px 12px", borderTop: "1px solid #F0EBE3", display: "flex", gap: 4, flexWrap: "wrap" }}>
        {[t.askHours, t.askZones, t.askHuman].map((q, i) => (
          <button key={i} onClick={() => send(q)}
            aria-label={q}
            style={{ cursor: "pointer", padding: "5px 10px", border: "1px solid #E5DDD0", borderRadius: 16, background: "#fff", fontSize: 10.5, fontFamily: "inherit", color: "#2C2416", minHeight: 32 }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "8px 12px", display: "flex", gap: 6 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send(input)}
          placeholder={t.placeholder}
          aria-label={lang === "en" ? "Type your message" : "הקלד הודעה"}
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #E5DDD0", borderRadius: 20, fontSize: 12, outline: "none", fontFamily: "inherit" }}
        />
        <button
          onClick={() => send(input)}
          aria-label={lang === "en" ? "Send message" : "שלח הודעה"}
          disabled={!input.trim()}
          style={{ cursor: "pointer", background: "#2C2416", color: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: input.trim() ? 1 : 0.4 }}>
          →
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
