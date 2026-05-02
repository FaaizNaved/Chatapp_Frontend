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

/* ── helpers ────────────────────────────────────────────────── */
const VERIFICATION_STUB = "stub"; // backend returns stub token when verification not required

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

  /* ── Register ───────────────────────────────────────────── */
  async function handleRegister(e) {
    e.preventDefault();
    const { username, password, confirmPassword, email, phone } = regForm;

    if (!username.trim()) { toast.error("Username is required."); return; }
    if (username.trim().length < 3) { toast.error("Username must be at least 3 characters."); return; }
    if (!password) { toast.error("Password is required."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (confirmPassword && password !== confirmPassword) { toast.error("Passwords do not match."); return; }

    setRegLoading(true);
    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username:  username.trim(),
          password,
          email:     email.trim(),
          phone:     phone.trim()
        })
      });
      saveSession(data);
      toast.success("Account created! Welcome to ChatSphere 🎉");
      navigate("/chat", { replace: true });
    } catch (err) {
      toast.error(err.message || "Registration failed. Try a different username.");
    } finally {
      setRegLoading(false);
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
              onClick={() => setTab("login")}
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
          {tab === "register" && (
            <form className="auth-form" onSubmit={handleRegister} noValidate>
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
                <label htmlFor="reg-email" className="field-label">Email address</label>
                <input
                  id="reg-email"
                  className="form-input"
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-phone" className="field-label">Phone number</label>
                <input
                  id="reg-phone"
                  className="form-input"
                  type="tel"
                  value={regForm.phone}
                  onChange={(e) => setRegForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 9876543210 (optional)"
                  autoComplete="tel"
                />
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
                ) : "Create Account →"}
              </button>

              <p className="auth-switch-hint">
                Already have an account?{" "}
                <button type="button" className="text-link-inline" onClick={() => setTab("login")}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
