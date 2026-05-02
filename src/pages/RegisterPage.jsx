import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/authApi";

const initialForm = {
  username: "",
  method: "email",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  verificationCode: "",
  verificationToken: "",
  verifiedValue: ""
};

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const activeValue = useMemo(
    () => (form.method === "email" ? form.email.trim() : form.phone.trim()),
    [form.email, form.phone, form.method]
  );

  const passwordsMatch = form.password !== "" && form.password === form.confirmPassword;
  const isVerified = form.verificationToken && form.verifiedValue === activeValue;

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "method") {
        next.verificationCode = "";
        next.verificationToken = "";
        next.verifiedValue = "";
      }

      if ((field === "email" && current.method === "email") || (field === "phone" && current.method === "phone")) {
        next.verificationCode = "";
        next.verificationToken = "";
        next.verifiedValue = "";
      }

      return next;
    });
  }

  async function handleSendCode() {
    setError("");
    setSuccess("");

    if (!activeValue) {
      setError(`Enter your ${form.method} before requesting verification.`);
      return;
    }

    setSendingCode(true);
    try {
      const data = await apiRequest("/api/auth/send-verification-code", {
        method: "POST",
        body: JSON.stringify({
          channel: form.method,
          value: activeValue
        })
      });
      setSuccess(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSendingCode(false);
    }
  }

  async function handleVerifyCode() {
    setError("");
    setSuccess("");

    if (!activeValue || !form.verificationCode.trim()) {
      setError("Enter the verification code sent to your selected contact method.");
      return;
    }

    setVerifyingCode(true);
    try {
      const data = await apiRequest("/api/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({
          channel: form.method,
          value: activeValue,
          code: form.verificationCode.trim()
        })
      });

      setForm((current) => ({
        ...current,
        verificationToken: data.verificationToken,
        verifiedValue: activeValue
      }));
      setSuccess(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setVerifyingCode(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!passwordsMatch) {
      setError("Password and confirm password must match.");
      return;
    }

    if (!isVerified) {
      setError(`Verify your ${form.method} before creating the account.`);
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          email: form.method === "email" ? form.email.trim() : "",
          phone: form.method === "phone" ? form.phone.trim() : "",
          verificationToken: form.verificationToken
        })
      });

      navigate("/", {
        replace: true,
        state: { message: "Account created successfully. Please log in." }
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-copy">
          <p className="auth-eyebrow">ChatApp</p>
          <h1>Create account</h1>
          <p className="auth-lead">
            Choose email or phone registration, verify it first, and create your account only after verification is complete.
          </p>
        </div>

        <form className="auth-form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              className="form-input"
              type="text"
              value={form.username}
              onChange={(event) => updateField("username", event.target.value)}
              placeholder="Choose a username"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <span className="field-label">Create account with</span>
            <div className="segmented-control">
              <button
                type="button"
                className={form.method === "email" ? "segment active" : "segment"}
                onClick={() => updateField("method", "email")}
              >
                Email
              </button>
              <button
                type="button"
                className={form.method === "phone" ? "segment active" : "segment"}
                onClick={() => updateField("method", "phone")}
              >
                Phone number
              </button>
            </div>
          </div>

          {form.method === "email" ? (
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                className="form-input"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                className="form-input"
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+91 9876543210"
                autoComplete="tel"
              />
            </div>
          )}

          <div className="verification-box">
            <div>
              <strong>Verification required</strong>
              <p>
                {isVerified
                  ? `${form.method === "email" ? "Email" : "Phone number"} verified successfully.`
                  : `Verify your ${form.method} before the account can be created.`}
              </p>
            </div>
            <div className={isVerified ? "status-badge verified" : "status-badge pending"}>
              {isVerified ? "Verified" : "Pending"}
            </div>
          </div>

          <div className="inline-fields">
            <div className="form-group">
              <label htmlFor="verificationCode">Verification code</label>
              <input
                id="verificationCode"
                className="form-input"
                type="text"
                value={form.verificationCode}
                onChange={(event) => updateField("verificationCode", event.target.value)}
                placeholder="6-digit code"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="action-row">
            <button className="btn-secondary" type="button" onClick={handleSendCode} disabled={sendingCode}>
              {sendingCode ? "Sending..." : "Send code"}
            </button>
            <button className="btn-secondary" type="button" onClick={handleVerifyCode} disabled={verifyingCode}>
              {verifyingCode ? "Verifying..." : "Verify"}
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="registerPassword">Password</label>
            <input
              id="registerPassword"
              className="form-input"
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              className="form-input"
              type="password"
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
            {form.confirmPassword ? (
              <div className={passwordsMatch ? "field-hint success" : "field-hint error"}>
                {passwordsMatch ? "Passwords match." : "Passwords do not match."}
              </div>
            ) : null}
          </div>

          {error ? <div className="auth-error">{error}</div> : null}
          {success ? <div className="auth-success">{success}</div> : null}

          <button className="btn-primary" type="submit" disabled={submitting || !passwordsMatch || !isVerified}>
            {submitting ? "Creating account..." : "Create account"}
          </button>

          <div className="auth-links-row single">
            <Link className="text-link" to="/">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
