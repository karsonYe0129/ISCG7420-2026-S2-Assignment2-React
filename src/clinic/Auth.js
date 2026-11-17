import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, errorMessage } from "./api";

export default function Auth({ register = false, onLogin }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await api.post(
        `/auth/${register ? "register" : "login"}/`,
        data,
      );
      sessionStorage.setItem("piki-token", response.data.token);
      onLogin(response.data.user);
      navigate(response.data.user.is_staff ? "/admin" : "/appointments");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-layout">
      <div className="auth-copy">
        <span className="eyebrow">YOUR HEALTH, CONNECTED</span>
        <h1>
          Good care starts
          <br />
          with a conversation.
        </h1>
        <p>
          Find your doctor, choose a time, and manage your appointments in one
          place.
        </p>
        <div className="care-note">
          <span className="brand-cross" aria-hidden="true">
            +
          </span>
          <div>
            <strong>Piki Ora Medical Centre</strong>
            <p>Making everyday care a little easier.</p>
          </div>
        </div>
      </div>
      <div className="panel auth-panel">
        <span className="eyebrow">PATIENT PORTAL</span>
        <h2>{register ? "Create your account" : "Welcome back"}</h2>
        <p className="muted">
          {register
            ? "Register to book and manage your care."
            : "Sign in to your patient or staff account."}
        </p>
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={submit}>
          {register && (
            <div className="form-grid">
              <label>
                First name
                <input
                  name="first_name"
                  maxLength="150"
                  autoComplete="given-name"
                  required
                />
              </label>
              <label>
                Last name
                <input
                  name="last_name"
                  maxLength="150"
                  autoComplete="family-name"
                  required
                />
              </label>
            </div>
          )}
          <label>
            Username
            <input
              name="username"
              maxLength="150"
              autoComplete="username"
              required
            />
          </label>
          {register && (
            <label>
              Email address
              <input name="email" type="email" autoComplete="email" required />
            </label>
          )}
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={register ? 8 : undefined}
              required
            />
          </label>
          {register && (
            <p className="small muted">
              Use at least 8 characters. Avoid common passwords and personal
              information.
            </p>
          )}
          <button className="primary full" disabled={busy}>
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}{" "}
            <span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="small auth-switch">
          {register ? "Already registered?" : "New to Piki Ora?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </section>
  );
}
