import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const initialRegisterState = {
  username: "",
  password: "",
  email: "",
  phone: "",
  verificationChannel: "email",
  verificationCode: "",
  verificationToken: "",
  verifiedChannel: "",
  verifiedValue: ""
};

const initialLoginState = {
  loginMethod: "email",
  identifier: "",
  password: ""
};

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const verificationValue = useMemo(() => {
    return registerForm.verificationChannel === "email"
      ? registerForm.email.trim()
      : registerForm.phone.trim();
  }, [registerForm.email, registerForm.phone, registerForm.verificationChannel]);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function switchTab(nextTab) {
    setTab(nextTab);
    setError("");
    setSuccess("");
  }

  function updateLoginField(field, value) {
    setLoginForm((current) => ({ ...current, [field]: value }));
  }

  function updateRegisterField(field, value) {
    setRegisterForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "verificationChannel") {
        next.verificationCode = "";
        next.verificationToken = "";
        next.verifiedChannel = "";
        next.verifiedValue = "";
      }

      if (
        (field === "email" && current.verifiedChannel === "email" && current.verifiedValue !== value.trim()) ||
        (field === "phone" && current.verifiedChannel === "phone" && current.verifiedValue !== value.trim())
      ) {
        next.verificationCode = "";
        next.verificationToken = "";
        next.verifiedChannel = "";
        next.verifiedValue = "";
      }

      return next;
    });
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    resetMessages();

    if (!loginForm.identifier.trim() || !loginForm.password.trim()) {
      setError("Enter your verified email or phone number and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginForm.identifier.trim(),
          password: loginForm.password
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Unable to sign in.");
        return;
      }

      localStorage.setItem("chatapp_token", data.token);
      localStorage.setItem("chatapp_user", JSON.stringify(data.user));
      navigate("/chat");
    } catch {
      setError("Cannot connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCode() {
    resetMessages();
    if (!verificationValue) {
      setError(`Enter your ${registerForm.verificationChannel} before requesting a code.`);
      return;
    }

    setSendingCode(true);
    try {
      const res = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: registerForm.verificationChannel,
          value: verificationValue
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Unable to send verification code.");
        return;
      }

      setSuccess(data.message || "Verification code sent.");
      setRegisterForm((current) => ({
        ...current,
        verificationCode: "",
        verificationToken: "",
        verifiedChannel: "",
        verifiedValue: ""
      }));
    } catch {
      setError("Cannot connect to server. Is the backend running?");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleVerifyCode() {
    resetMessages();
    if (!verificationValue || !registerForm.verificationCode.trim()) {
      setError("Enter the verification code you received.");
      return;
    }

    setVerifyingCode(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: registerForm.verificationChannel,
          value: verificationValue,
          code: registerForm.verificationCode.trim()
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Unable to verify code.");
        return;
      }

      setRegisterForm((current) => ({
        ...current,
        verificationToken: data.verificationToken,
        verifiedChannel: current.verificationChannel,
        verifiedValue: verificationValue
      }));
      setSuccess(data.message || "Verification complete.");
    } catch {
      setError("Cannot connect to server. Is the backend running?");
    } finally {
      setVerifyingCode(false);
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    resetMessages();

    if (!registerForm.username.trim() || !registerForm.password.trim()) {
      setError("Username and password are required.");
      return;
    }

    if (!registerForm.email.trim() && !registerForm.phone.trim()) {
      setError("Provide at least one contact method.");
      return;
    }

    if (!registerForm.verificationToken) {
      setError("Verify your email or phone number before creating the account.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerForm.username.trim(),
          password: registerForm.password,
          email: registerForm.email.trim(),
          phone: registerForm.phone.trim(),
          verificationToken: registerForm.verificationToken
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Unable to create account.");
        return;
      }

      localStorage.setItem("chatapp_token", data.token);
      localStorage.setItem("chatapp_user", JSON.stringify(data.user));
      setSuccess("Account created. Redirecting...");
      setTimeout(() => navigate("/chat"), 600);
    } catch {
      setError("Cannot connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  const verificationComplete =
    !!registerForm.verificationToken &&
    registerForm.verifiedChannel === registerForm.verificationChannel &&
    registerForm.verifiedValue === verificationValue;

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-logo">
          <div className="auth-logo-icon">CS</div>
          <div>
            <h1>ChatSphere</h1>
            <p className="auth-subtitle">Secure onboarding with email or phone verification</p>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => switchTab("login")}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => switchTab("register")}
            type="button"
          >
            Create Account
          </button>
        </div>

        {tab === "login" ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="auth-section">
              <div className="section-head">
                <h2>Login</h2>
                <p>Use a verified email address or verified phone number.</p>
              </div>

              <div className="choice-row">
                <button
                  type="button"
                  className={`choice-chip ${loginForm.loginMethod === "email" ? "active" : ""}`}
                  onClick={() => updateLoginField("loginMethod", "email")}
                >
                  Email
                </button>
                <button
                  type="button"
                  className={`choice-chip ${loginForm.loginMethod === "phone" ? "active" : ""}`}
                  onClick={() => updateLoginField("loginMethod", "phone")}
                >
                  Phone
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="identifier">
                  {loginForm.loginMethod === "email" ? "Email address" : "Phone number"}
                </label>
                <input
                  id="identifier"
                  type={loginForm.loginMethod === "email" ? "email" : "tel"}
                  className="form-input"
                  placeholder={
                    loginForm.loginMethod === "email"
                      ? "name@example.com"
                      : "+91 9876543210"
                  }
                  value={loginForm.identifier}
                  onChange={(e) => updateLoginField("identifier", e.target.value)}
                  autoComplete={loginForm.loginMethod === "email" ? "email" : "tel"}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="loginPassword">Password</label>
                <input
                  id="loginPassword"
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => updateLoginField("password", e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <div className="auth-grid">
              <section className="auth-section">
                <div className="section-head">
                  <h2>Profile</h2>
                  <p>Choose a public username and a password for chat.</p>
                </div>

                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    className="form-input"
                    placeholder="Choose a username"
                    value={registerForm.username}
                    onChange={(e) => updateRegisterField("username", e.target.value)}
                    autoComplete="username"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="registerPassword">Password</label>
                  <input
                    id="registerPassword"
                    type="password"
                    className="form-input"
                    placeholder="Create a password"
                    value={registerForm.password}
                    onChange={(e) => updateRegisterField("password", e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="registerEmail">Email address</label>
                  <input
                    id="registerEmail"
                    type="email"
                    className="form-input"
                    placeholder="name@example.com"
                    value={registerForm.email}
                    onChange={(e) => updateRegisterField("email", e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="registerPhone">Phone number</label>
                  <input
                    id="registerPhone"
                    type="tel"
                    className="form-input"
                    placeholder="+91 9876543210"
                    value={registerForm.phone}
                    onChange={(e) => updateRegisterField("phone", e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </section>

              <section className="auth-section">
                <div className="section-head">
                  <h2>Verification</h2>
                  <p>Verify either email or phone. One verified method is required to sign up.</p>
                </div>

                <div className="choice-row">
                  <button
                    type="button"
                    className={`choice-chip ${registerForm.verificationChannel === "email" ? "active" : ""}`}
                    onClick={() => updateRegisterField("verificationChannel", "email")}
                  >
                    Verify Email
                  </button>
                  <button
                    type="button"
                    className={`choice-chip ${registerForm.verificationChannel === "phone" ? "active" : ""}`}
                    onClick={() => updateRegisterField("verificationChannel", "phone")}
                  >
                    Verify Phone
                  </button>
                </div>

                <div className="verification-summary">
                  <span className={`status-pill ${verificationComplete ? "verified" : "pending"}`}>
                    {verificationComplete ? "Verified" : "Pending verification"}
                  </span>
                  <p>
                    {registerForm.verificationChannel === "email"
                      ? "Send a code to the email above."
                      : "Send a code to the phone number above in international format."}
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="verificationCode">Verification code</label>
                  <input
                    id="verificationCode"
                    type="text"
                    className="form-input"
                    placeholder="6-digit code"
                    value={registerForm.verificationCode}
                    onChange={(e) => updateRegisterField("verificationCode", e.target.value)}
                    inputMode="numeric"
                  />
                </div>

                <div className="action-row">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleSendCode}
                    disabled={sendingCode}
                  >
                    {sendingCode ? "Sending..." : "Send Code"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary accent"
                    onClick={handleVerifyCode}
                    disabled={verifyingCode}
                  >
                    {verifyingCode ? "Verifying..." : "Verify Code"}
                  </button>
                </div>
              </section>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <button type="submit" className="btn-primary" disabled={loading || !verificationComplete}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
