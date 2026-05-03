import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, saveSession } from "../lib/authApi";
import { useToast } from "../components/ToastContext";

/* ── SVG eye toggle ─────────────────────────────────────────── */
const EyeIcon = ({ open }) =>
  open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

export default function LoginPage({ defaultTab = "login" }) {
  const navigate  = useNavigate();
  const toast     = useToast();
  const [tab, setTab] = useState(defaultTab === "register" ? "register" : "login");

  /* ── Login form ─── */
  const [loginForm,  setLoginForm]  = useState({ identifier: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  /* ── Register form ─── */
  const [regForm, setRegForm] = useState({
    username: "", password: "", confirmPassword: "", email: "", phone: ""
  });
  const [regLoading,  setRegLoading]  = useState(false);
  const [showRegPwd,  setShowRegPwd]  = useState(false);

  /* ── OTP verification state ─── */
  const [regStep, setRegStep] = useState("form"); // "form" | "verify-email" | "verify-phone"
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  /* ── Login ─────────────────────────────────────────────── */
  async function handleLogin(e) {
    e.preventDefault();
    if (!loginForm.identifier.trim() || !loginForm.password) {
      toast.error("Enter your username, email, or phone number and password.");
      return;
    }
    setLoginLoading(true);
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: loginForm.identifier.trim(),
          password:   loginForm.password
        })
      });
      saveSession(data);
      navigate("/chat", { replace: true });
    } catch (err) {
      toast.error(err.message || "Sign-in failed. Check your credentials.");
    } finally {
      setLoginLoading(false);
    }
  }

  /* ── Register: Step 1 — Submit form & send email OTP ──── */
  async function handleRegisterSubmit(e) {
    e.preventDefault();
    const { username, password, confirmPassword, email, phone } = regForm;

    if (!username.trim()) { toast.error("Username is required."); return; }
    if (username.trim().length < 3) { toast.error("Username must be at least 3 characters."); return; }
    if (!email.trim()) { toast.error("Email is required."); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email.trim())) { toast.error("Invalid email address."); return; }
    if (!password) { toast.error("Password is required."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (confirmPassword && password !== confirmPassword) { toast.error("Passwords do not match."); return; }

    setRegLoading(true);
    try {
      await apiRequest("/api/auth/register/send-otp", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          password,
          confirmPassword,
          email: email.trim(),
          phone: phone.trim(),
          field: "email"
        })
      });
      toast.success("Verification code sent to your email!");
      setRegStep("verify-email");
      setOtpCode("");
    } catch (err) {
      toast.error(err.message || "Registration failed.");
    } finally {
      setRegLoading(false);
    }
  }

  /* ── Register: Verify OTP ─────────────────────────────── */
  async function handleVerifyOtp(field) {
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      toast.error("Enter the 6-digit verification code.");
      return;
    }
    setOtpSending(true);
    try {
      const data = await apiRequest("/api/auth/register/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          username: regForm.username.trim(),
          email: regForm.email.trim(),
          code: otpCode.trim(),
          field
        })
      });

      if (data.accountCreated) {
        // All verified — account created
        saveSession(data);
        toast.success("Account created! Welcome to ChatSphere 🎉");
        navigate("/chat", { replace: true });
        return;
      }

      // Partial verification
      if (field === "email") {
        setEmailVerified(true);
        toast.success("Email verified!");
        if (regForm.phone.trim() && !data.phoneVerified) {
          // Need to verify phone next
          setRegStep("verify-phone");
          setOtpCode("");
          // Send phone OTP
          await apiRequest("/api/auth/register/send-otp", {
            method: "POST",
            body: JSON.stringify({
              username: regForm.username.trim(),
              password: regForm.password,
              email: regForm.email.trim(),
              phone: regForm.phone.trim(),
              field: "phone"
            })
          });
          toast.success("Verification code sent to your phone!");
        }
      } else if (field === "phone") {
        setPhoneVerified(true);
        toast.success("Phone verified!");
      }
    } catch (err) {
      toast.error(err.message || "Verification failed.");
    } finally {
      setOtpSending(false);
    }
  }

  /* ── Resend OTP ─────────────────────────────────────────── */
  async function handleResendOtp(field) {
    setOtpSending(true);
    try {
      await apiRequest("/api/auth/register/send-otp", {
        method: "POST",
        body: JSON.stringify({
          username: regForm.username.trim(),
          password: regForm.password,
          email: regForm.email.trim(),
          phone: regForm.phone.trim(),
          field
        })
      });
      toast.success(`New code sent to your ${field}!`);
    } catch (err) {
      toast.error(err.message || "Failed to resend code.");
    } finally {
      setOtpSending(false);
    }
  }

  /* ── Animated orbs (decorative) ─── */
  const orbs = (
    <div className="auth-orbs" aria-hidden="true">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />
    </div>
  );

  /* ── OTP verification UI ─── */
  function renderOtpStep(field) {
    const isEmail = field === "email";
    const target = isEmail ? regForm.email : regForm.phone;

    return (
      <div className="auth-form" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <button
          type="button"
          className="text-link-inline"
          style={{ alignSelf: "flex-start", fontSize: "0.85rem", opacity: 0.7 }}
          onClick={() => { setRegStep("form"); setOtpCode(""); setEmailVerified(false); setPhoneVerified(false); }}
        >
          ← Back to form
        </button>

        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>{isEmail ? "📧" : "📱"}</div>
          <h3 style={{ margin: "0 0 8px", color: "var(--text-primary)", fontSize: "1.15rem" }}>
            Verify your {isEmail ? "email" : "phone"}
          </h3>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>
            We sent a 6-digit code to<br />
            <strong style={{ color: "var(--accent-strong)" }}>{target}</strong>
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="otp-input" className="field-label">Verification code</label>
          <input
            id="otp-input"
            className="form-input"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 6-digit code"
            autoFocus
            style={{ textAlign: "center", fontSize: "1.3rem", letterSpacing: "0.3em", fontWeight: 700 }}
          />
        </div>

        <button
          className="btn-primary auth-submit-btn"
          type="button"
          disabled={otpSending || otpCode.length !== 6}
          onClick={() => handleVerifyOtp(field)}
        >
          {otpSending ? <span className="btn-spinner" /> : "Verify →"}
        </button>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem", margin: 0 }}>
          Didn't receive the code?{" "}
          <button
            type="button"
            className="text-link-inline"
            onClick={() => handleResendOtp(field)}
            disabled={otpSending}
          >
            Resend
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      {orbs}

      <div className="auth-panel">
        {/* ── Left branding column ── */}
        <div className="auth-copy">
          <div className="auth-brand">
            <div className="auth-brand-icon">💬</div>
            <div>
              <h1>ChatSphere</h1>
              <p className="auth-brand-tagline">Real-time · Secure · Beautiful</p>
            </div>
          </div>

          <p className="auth-lead">
            Connect instantly with direct messages, group chats, and time-limited
            discussions — all in one place.
          </p>

          <ul className="auth-feature-list">
            <li><span className="auth-feature-icon">⚡</span>Real-time messaging</li>
            <li><span className="auth-feature-icon">🔒</span>Secure sessions</li>
            <li><span className="auth-feature-icon">👥</span>Groups & discussions</li>
            <li><span className="auth-feature-icon">✨</span>Liquid Glass UI</li>
          </ul>
        </div>

        {/* ── Right form column ── */}
        <div className="auth-form-card">
          {/* Tab switcher */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab${tab === "login" ? " active" : ""}`}
              onClick={() => { setTab("login"); setRegStep("form"); }}
              id="tab-login"
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab${tab === "register" ? " active" : ""}`}
              onClick={() => setTab("register")}
              id="tab-register"
            >
              Create Account
            </button>
          </div>

          {/* ══ LOGIN FORM ══════════════════════════════════ */}
          {tab === "login" && (
            <form className="auth-form" onSubmit={handleLogin} noValidate>
              <div className="form-group">
                <label htmlFor="login-identifier" className="field-label">
                  Username, email, or phone
                </label>
                <input
                  id="login-identifier"
                  className="form-input"
                  type="text"
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm((f) => ({ ...f, identifier: e.target.value }))}
                  placeholder="faaiz, name@example.com, or +91 9876543210"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password" className="field-label">Password</label>
                <div className="input-with-eye">
                  <input
                    id="login-password"
                    className="form-input"
                    type={showLoginPwd ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowLoginPwd((v) => !v)}
                    aria-label={showLoginPwd ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showLoginPwd} />
                  </button>
                </div>
              </div>

              <div className="auth-links-row">
                <Link className="text-link" to="/forgot-password">Forgot password?</Link>
              </div>

              <button
                className="btn-primary auth-submit-btn"
                type="submit"
                disabled={loginLoading}
                id="btn-login"
              >
                {loginLoading ? (
                  <span className="btn-spinner" />
                ) : "Sign In →"}
              </button>

              <p className="auth-switch-hint">
                No account?{" "}
                <button type="button" className="text-link-inline" onClick={() => setTab("register")}>
                  Create one free
                </button>
              </p>
            </form>
          )}

          {/* ══ REGISTER FORM ════════════════════════════════ */}
          {tab === "register" && regStep === "form" && (
            <form className="auth-form" onSubmit={handleRegisterSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="reg-username" className="field-label">Username <span className="required-star">*</span></label>
                <input
                  id="reg-username"
                  className="form-input"
                  type="text"
                  value={regForm.username}
                  onChange={(e) => setRegForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="Choose a unique username"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email" className="field-label">Email address <span className="required-star">*</span></label>
                <input
                  id="reg-email"
                  className="form-input"
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-phone" className="field-label">Phone number <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.75rem" }}>(optional)</span></label>
                <input
                  id="reg-phone"
                  className="form-input"
                  type="tel"
                  value={regForm.phone}
                  onChange={(e) => setRegForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 9876543210"
                  autoComplete="tel"
                />
                {regForm.phone.trim() && (
                  <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "var(--warning)", opacity: 0.8 }}>
                    ⚠ Phone will need to be verified via SMS
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reg-password" className="field-label">Password <span className="required-star">*</span></label>
                <div className="input-with-eye">
                  <input
                    id="reg-password"
                    className="form-input"
                    type={showRegPwd ? "text" : "password"}
                    value={regForm.password}
                    onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowRegPwd((v) => !v)}
                    aria-label={showRegPwd ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showRegPwd} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-confirm" className="field-label">Confirm password</label>
                <input
                  id="reg-confirm"
                  className="form-input"
                  type="password"
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
              </div>

              <button
                className="btn-primary auth-submit-btn"
                type="submit"
                disabled={regLoading}
                id="btn-register"
              >
                {regLoading ? (
                  <span className="btn-spinner" />
                ) : "Continue — Verify Email →"}
              </button>

              <p className="auth-switch-hint">
                Already have an account?{" "}
                <button type="button" className="text-link-inline" onClick={() => setTab("login")}>
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* ══ OTP VERIFICATION STEPS ═══════════════════════ */}
          {tab === "register" && regStep === "verify-email" && renderOtpStep("email")}
          {tab === "register" && regStep === "verify-phone" && renderOtpStep("phone")}
        </div>
      </div>
    </div>
  );
}
