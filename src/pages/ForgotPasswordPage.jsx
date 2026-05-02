import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/authApi";

const initialForm = {
  method: "email",
  email: "",
  phone: ""
};

export default function ForgotPasswordPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeValue = form.method === "email" ? form.email.trim() : form.phone.trim();

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!activeValue) {
      setError(`Enter your ${form.method} to continue.`);
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest("/api/auth/forgot-password", {
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
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-copy">
          <p className="auth-eyebrow">ChatApp</p>
          <h1>Forgot password</h1>
          <p className="auth-lead">
            Enter your verified email address or phone number. We will send you a secure reset link.
          </p>
        </div>

        <form className="auth-form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <span className="field-label">Send reset link using</span>
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
              <label htmlFor="resetEmail">Email address</label>
              <input
                id="resetEmail"
                className="form-input"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="name@example.com"
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="resetPhone">Phone number</label>
              <input
                id="resetPhone"
                className="form-input"
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+91 9876543210"
              />
            </div>
          )}

          {error ? <div className="auth-error">{error}</div> : null}
          {success ? <div className="auth-success">{success}</div> : null}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send reset link"}
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
