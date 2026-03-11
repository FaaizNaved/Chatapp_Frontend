import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
    const [tab, setTab] = useState("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const reset = () => { setError(""); setSuccess(""); };

    async function handleSubmit(e) {
        e.preventDefault();
        reset();
        if (!username.trim() || !password.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        setLoading(true);
        try {
            const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), password })
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Something went wrong.");
                return;
            }

            localStorage.setItem("chatapp_token", data.token);
            localStorage.setItem("chatapp_user", JSON.stringify(data.user));

            if (tab === "register") {
                setSuccess("Account created! Redirecting...");
                setTimeout(() => navigate("/chat"), 600);
            } else {
                navigate("/chat");
            }
        } catch {
            setError("Cannot connect to server. Is the backend running?");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">💬</div>
                    <h1>Chat<span>Sphere</span></h1>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${tab === "login" ? "active" : ""}`}
                        onClick={() => { setTab("login"); reset(); }}
                    >
                        Sign In
                    </button>
                    <button
                        className={`auth-tab ${tab === "register" ? "active" : ""}`}
                        onClick={() => { setTab("register"); reset(); }}
                    >
                        Create Account
                    </button>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            className="form-input"
                            placeholder={tab === "register" ? "Choose a username (min 3 chars)" : "Enter your username"}
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoComplete="username"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder={tab === "register" ? "Create a password (min 6 chars)" : "Enter your password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete={tab === "login" ? "current-password" : "new-password"}
                        />
                    </div>

                    {error && <div className="auth-error">{error}</div>}
                    {success && <div className="auth-success">{success}</div>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading
                            ? (tab === "login" ? "Signing in..." : "Creating account...")
                            : (tab === "login" ? "Sign In" : "Create Account")}
                    </button>
                </form>
            </div>
        </div>
    );
}
