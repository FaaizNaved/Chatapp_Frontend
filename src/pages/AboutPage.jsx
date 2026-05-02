import { useState } from "react";
import { Link } from "react-router-dom";

/* ── Icons ─────────────────────────────────────────────────── */
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{width:18,height:18,flexShrink:0}}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const ArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{width:18,height:18}}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

/* ── Data ──────────────────────────────────────────────────── */
const FEATURES = [
  { icon: "💬", title: "Real-time Messaging", desc: "Instant message delivery powered by Socket.io with live typing indicators and online presence detection." },
  { icon: "✅", title: "Read Receipts", desc: "WhatsApp-style double-tick system — single tick (sent), double grey (delivered), double blue (read)." },
  { icon: "👥", title: "Group Chats", desc: "Create permanent or temporary groups with custom names, avatars, and member management." },
  { icon: "📅", title: "Scheduled Discussions", desc: "Time-limited discussion rooms that automatically open and close — perfect for meetings, AMAs, and events." },
  { icon: "📎", title: "File & Media Sharing", desc: "Send images, PDFs, Word documents, audio voice notes, and videos with in-app preview and download." },
  { icon: "🎨", title: "Liquid Glass UI", desc: "Premium frosted-glass design system with three themes (Teal, Light, Dark) and smooth micro-animations." },
  { icon: "📱", title: "Mobile Responsive", desc: "Fully adaptive layout with 100dvh support, iOS safe-area insets, and touch-optimized interactions." },
  { icon: "🔒", title: "Secure Authentication", desc: "JWT-based auth with bcrypt password hashing, email/phone OTP verification, and session management." },
  { icon: "🔔", title: "Push Notifications", desc: "Per-conversation notification preferences — control DM, group, and discussion notification granularity." },
  { icon: "📌", title: "Pin & Organize Chats", desc: "Pin important conversations to the top of your sidebar with persistent per-user pin storage." },
  { icon: "🌐", title: "Embeddable Widget", desc: "One-line embed script adds a floating chat button to any website with configurable server targeting." },
  { icon: "🖼️", title: "Custom Avatars", desc: "Upload a photo or use auto-generated coloured initials — colour picker with 10 preset accent colours." },
];

const USE_CASES = [
  { icon: "🛒", title: "E-commerce Support", desc: "Add live customer chat to your shop. Let buyers ask questions in real time." },
  { icon: "🏥", title: "Healthcare Platforms", desc: "Secure doctor-patient messaging within your medical portal." },
  { icon: "🎓", title: "EdTech / LMS", desc: "Student-teacher DMs, class group chats, and scheduled live Q&A sessions." },
  { icon: "🏢", title: "Internal Tools", desc: "Replace Slack for your team with a self-hosted, white-label instance." },
  { icon: "🎮", title: "Gaming Communities", desc: "Real-time party chat, lobby groups, and scheduled tournament discussions." },
  { icon: "🤝", title: "Freelance Platforms", desc: "Built-in messaging between clients and freelancers inside your marketplace." },
];

const HOW_TO_EMBED = `<!-- Paste this one snippet into your website's <body> -->
<div id="chatsphere-widget-root"></div>
<script
  type="module"
  src="https://your-server.com/assets/widget.js"
  data-server="https://your-server.com"
></script>`;

/* ── Contact Form ───────────────────────────────────────────── */
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.phone) {
      setErrorMsg("Email and phone are required.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setStatus("success");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div style={{
        padding: "32px 28px", textAlign: "center",
        background: "var(--accent-soft)", borderRadius: 16,
        border: "1px solid var(--border-accent)",
      }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎉</div>
        <h3 style={{ margin: "0 0 12px", color: "var(--accent-strong)", fontSize: "1.4rem" }}>
          Thank you! We'll reach out soon.
        </h3>
        <p style={{ color: "var(--text-secondary)", margin: 0, lineHeight: 1.7 }}>
          Your enquiry has been received. We've also sent a confirmation to <strong style={{ color: "var(--text-primary)" }}>{form.email}</strong>.
          Expect to hear from us within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="contact-grid">
        <div>
          <label style={{ display:"block", fontSize:"0.8rem", fontWeight:700, color:"var(--text-secondary)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>
            Name
          </label>
          <input
            className="about-input"
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={set("name")}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ display:"block", fontSize:"0.8rem", fontWeight:700, color:"var(--text-secondary)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>
            Email <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            className="about-input"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={set("email")}
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ display:"block", fontSize:"0.8rem", fontWeight:700, color:"var(--text-secondary)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>
            Phone <span style={{ color: "#f87171" }}>*</span>
          </label>
          <input
            className="about-input"
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={set("phone")}
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ display:"block", fontSize:"0.8rem", fontWeight:700, color:"var(--text-secondary)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>
            Message
          </label>
          <input
            className="about-input"
            type="text"
            placeholder="Tell us about your project…"
            value={form.message}
            onChange={set("message")}
            style={inputStyle}
          />
        </div>
      </div>

      {status === "error" && (
        <div style={{ padding:"12px 16px", background:"rgba(248,113,113,0.1)", borderRadius:8, color:"#fca5a5", fontSize:"0.88rem", border:"1px solid rgba(248,113,113,0.2)" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          padding: "14px 28px", borderRadius: 12,
          background: "linear-gradient(135deg, #14b8a6, #2dd4bf)",
          border: "none", color: "white", fontWeight: 700, fontSize: "0.95rem",
          cursor: status === "loading" ? "not-allowed" : "pointer",
          opacity: status === "loading" ? 0.7 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          boxShadow: "0 8px 24px rgba(20,184,166,0.35)",
        }}
        onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 12px 32px rgba(20,184,166,0.45)"; }}
        onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 8px 24px rgba(20,184,166,0.35)"; }}
      >
        {status === "loading" ? (
          <><span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid white", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }}/>  Sending…</>
        ) : "🚀 Send Enquiry"}
      </button>
    </form>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px",
  background: "var(--bg-soft)",
  border: "1px solid var(--border)",
  borderRadius: 10, color: "var(--text-primary)", fontSize: "0.9rem",
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s",
};

/* ── Main Page ──────────────────────────────────────────────── */
export default function AboutPage() {
  return (
    <div style={{
      minHeight: "100dvh",
      width: "100%",
      background: "var(--bg-base)",
      color: "var(--text-primary)",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Background orbs */}
      <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"var(--accent-glow)", filter:"blur(120px)", top:-200, left:-200 }}/>
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"rgba(99,102,241,0.07)", filter:"blur(120px)", bottom:-150, right:-100 }}/>
      </div>

      <div className="about-page-inner">

        {/* ── NAV ─────────────────────────────────────────────── */}
        <nav className="about-nav">
          <Link to="/chat" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none", color:"var(--text-secondary)",
            fontSize:"0.88rem", fontWeight:600, background:"var(--bg-soft)", padding:"8px 14px",
            borderRadius:8, border:"1px solid var(--border)", transition:"all 0.2s" }}>
            <ArrowLeft /> Back to Chat
          </Link>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginLeft:"auto" }}>
            <span style={{ fontSize:"1.4rem" }}>💬</span>
            <span style={{ fontWeight:800, fontSize:"1.1rem", background:"linear-gradient(135deg,var(--text-primary),var(--accent-strong))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>ChatSphere</span>
          </div>
        </nav>

        {/* ── HERO ────────────────────────────────────────────── */}
        <section className="about-hero">
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px",
            background:"var(--accent-soft)", borderRadius:999, border:"1px solid var(--border-accent)",
            fontSize:"0.8rem", fontWeight:700, color:"var(--accent-strong)", letterSpacing:"0.08em",
            textTransform:"uppercase", marginBottom:24 }}>
            ✨ About the Product
          </div>
          <h1 style={{ fontSize:"clamp(2rem,5vw,3.5rem)", fontWeight:900, lineHeight:1.15, margin:"0 0 20px",
            background:"linear-gradient(135deg,var(--text-primary),var(--accent-strong) 60%,#6366f1)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Real-time Chat, Reinvented
          </h1>
          <p style={{ fontSize:"1.15rem", color:"var(--text-secondary)", lineHeight:1.75, margin:"0 auto", maxWidth:600 }}>
            ChatSphere is a production-ready, embeddable real-time communication platform built with <strong style={{ color:"var(--text-primary)" }}>React</strong>, <strong style={{ color:"var(--text-primary)" }}>Node.js</strong>, and <strong style={{ color:"var(--text-primary)" }}>Socket.io</strong>. Drop it into any website in minutes.
          </p>
        </section>

        {/* ── FEATURES GRID ───────────────────────────────────── */}
        <section className="about-section">
          <h2 style={{ textAlign:"center", fontSize:"1.8rem", fontWeight:800, margin:"0 0 48px",
            background:"linear-gradient(135deg,var(--text-primary),var(--text-secondary))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Everything You Need
          </h2>
          <div className="about-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                padding: "24px", borderRadius:16,
                background: "var(--bg-soft)",
                border: "1px solid var(--border)",
                backdropFilter: "blur(10px)",
                transition: "transform 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.borderColor="var(--border-accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.borderColor="var(--border)"; }}>
                <div style={{ fontSize:"1.8rem", marginBottom:14 }}>{f.icon}</div>
                <h3 style={{ margin:"0 0 8px", fontSize:"1rem", fontWeight:700, color:"var(--text-primary)" }}>{f.title}</h3>
                <p style={{ margin:0, fontSize:"0.88rem", color:"var(--text-muted)", lineHeight:1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW TO INTEGRATE ────────────────────────────────── */}
        <section className="about-section-sm">
          <div className="about-card">
            <h2 style={{ margin:"0 0 16px", fontSize:"1.8rem", fontWeight:800, color:"var(--text-primary)" }}>
              Embed in Any Website — One Snippet
            </h2>
            <p style={{ color:"var(--text-secondary)", lineHeight:1.7, margin:"0 0 28px" }}>
              ChatSphere is architected as a standalone web application <em>and</em> an embeddable widget.
              Adding it to your existing project takes less than 60 seconds.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:12, margin:"0 0 32px" }}>
              {[
                "No framework dependency — works with React, Vue, plain HTML, or any backend",
                "Configurable server URL via data-server attribute",
                "Maintains full functionality: auth, real-time, groups, media",
                "Widget panel opens as a floating iframe — zero layout impact on host site",
                "Self-hostable on any VPS, Render, Railway, or Heroku",
              ].map((item) => (
                <div key={item} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  <span style={{ color:"var(--accent-strong)", marginTop:1 }}><CheckIcon /></span>
                  <span style={{ color:"var(--text-secondary)", fontSize:"0.9rem", lineHeight:1.6 }}>{item}</span>
                </div>
              ))}
            </div>
            <pre style={{
              background:"var(--bg-elevated)", borderRadius:12, padding:"20px 24px",
              fontSize:"0.82rem", color:"var(--accent-strong)", overflowX:"auto",
              border:"1px solid var(--border-accent)", margin:0, lineHeight:1.7,
            }}>
              <code>{HOW_TO_EMBED}</code>
            </pre>
          </div>
        </section>

        {/* ── USE CASES ───────────────────────────────────────── */}
        <section className="about-section">
          <h2 style={{ textAlign:"center", fontSize:"1.8rem", fontWeight:800, margin:"0 0 16px",
            background:"linear-gradient(135deg,var(--text-primary),var(--text-secondary))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Who Uses ChatSphere?
          </h2>
          <p style={{ textAlign:"center", color:"var(--text-muted)", fontSize:"0.95rem", margin:"0 0 40px" }}>
            Any product that needs real-time communication can plug in ChatSphere.
          </p>
          <div className="about-usecases-grid">
            {USE_CASES.map((uc) => (
              <div key={uc.title} style={{ padding:"22px 24px", borderRadius:14,
                background:"var(--bg-soft)", border:"1px solid var(--border)" }}>
                <div style={{ fontSize:"1.5rem", marginBottom:10 }}>{uc.icon}</div>
                <h3 style={{ margin:"0 0 6px", fontSize:"0.95rem", fontWeight:700, color:"var(--text-primary)" }}>{uc.title}</h3>
                <p style={{ margin:0, fontSize:"0.84rem", color:"var(--text-muted)", lineHeight:1.6 }}>{uc.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CONTACT / CTA ───────────────────────────────────── */}
        <section id="contact" className="about-section-cta">
          <div className="about-cta-card">
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
              <span style={{ fontSize:"1.8rem" }}>🤝</span>
              <h2 style={{ margin:0, fontSize:"1.6rem", fontWeight:800, color:"var(--text-primary)" }}>
                Want to Integrate ChatSphere?
              </h2>
            </div>
            <p style={{ color:"var(--text-secondary)", lineHeight:1.7, margin:"0 0 32px" }}>
              Fill in your details below and the developer will get back to you within 24 hours
              to discuss integration, pricing, and custom requirements.
            </p>
            <ContactForm />
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────── */}
        <footer style={{ borderTop:"1px solid var(--border)", padding:"32px 40px", textAlign:"center", color:"var(--text-muted)", fontSize:"0.84rem" }}>
          <p style={{ margin:"0 0 8px" }}>
            Built with ❤️ using React, Node.js & Socket.io &nbsp;·&nbsp;
            <a href="mailto:mfaaiznaved786@gmail.com" style={{ color:"var(--accent-strong)", textDecoration:"none" }}>mfaaiznaved786@gmail.com</a>
          </p>
          <p style={{ margin:0, fontSize:"0.78rem", color:"var(--text-muted)" }}>© 2025 ChatSphere. All rights reserved.</p>
        </footer>

      </div>

      <style>{`
        .about-page-inner { position: relative; z-index: 1; }

        /* Nav */
        .about-nav { padding: 16px 20px; display: flex; align-items: center; gap: 12;
          border-bottom: 1px solid var(--border); backdrop-filter: blur(12px); flex-wrap: wrap; }

        /* Hero */
        .about-hero { text-align: center; padding: 60px 20px 48px; max-width: 800px; margin: 0 auto; }

        /* Sections */
        .about-section { max-width: 1100px; margin: 0 auto; padding: 0 20px 64px; }
        .about-section-sm { max-width: 900px; margin: 0 auto 64px; padding: 0 20px; }
        .about-section-cta { max-width: 760px; margin: 0 auto 64px; padding: 0 20px; }

        /* Feature & use-case grids */
        .about-features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 16px; }
        .about-usecases-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 16px; }

        /* Contact form grid */
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* Card sections inner padding */
        .about-card { background: var(--accent-soft); border: 1px solid var(--border-accent);
          border-radius: 20px; padding: 40px 32px; }
        .about-cta-card { background: var(--bg-soft); border: 1px solid var(--border);
          border-radius: 20px; padding: 40px 32px; }

        /* Input focus */
        .about-input { width: 100%; padding: 11px 14px; background: var(--bg-soft);
          border: 1px solid var(--border); border-radius: 10px; color: var(--text-primary);
          font-size: 0.9rem; outline: none; box-sizing: border-box; transition: border-color 0.2s; }
        .about-input:focus { border-color: var(--accent) !important; }

        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .about-hero { padding: 40px 16px 32px; }
          .about-section, .about-section-sm, .about-section-cta { padding-left: 16px; padding-right: 16px; padding-bottom: 48px; }
          .about-card, .about-cta-card { padding: 28px 18px; }
          .about-features-grid { grid-template-columns: 1fr; }
          .about-usecases-grid { grid-template-columns: 1fr 1fr; }
          .contact-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .about-usecases-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

