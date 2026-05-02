import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/authApi";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";
  const passwordsMatch = useMemo(
    () => password !== "" && confirmPassword !== "" && password === confirmPassword,
    [password, confirmPassword]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("This reset link is missing or invalid.");
      return;
    }

    if (!passwordsMatch) {
      setError("Password and confirm password must match.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          password,
          confirmPassword
        })
      });
      setSuccess(data.message);
      window.setTimeout(() => navigate("/", { replace: true }), 1200);
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
          <h1>Reset password</h1>
          <p className="auth-lead">
            Create a new password for your account. Use the reset link only on a trusted device.
          </p>
        </div>

        <form className="auth-form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              className="form-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter a new password"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="resetConfirmPassword">Confirm password</label>
            <input
              id="resetConfirmPassword"
              className="form-input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
            />
            {confirmPassword ? (
              <div className={passwordsMatch ? "field-hint success" : "field-hint error"}>
                {passwordsMatch ? "Passwords match." : "Passwords do not match."}
              </div>
            ) : null}
          </div>

          {error ? <div className="auth-error">{error}</div> : null}
          {success ? <div className="auth-success">{success}</div> : null}

          <button className="btn-primary" type="submit" disabled={submitting || !passwordsMatch}>
            {submitting ? "Updating..." : "Reset password"}
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
