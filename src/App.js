import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { api, errorMessage } from "./clinic/api";
import Auth from "./clinic/Auth";
import Admin from "./clinic/Admin";
import { Appointments, Doctors } from "./clinic/Patient";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    if (sessionStorage.getItem("piki-token"))
      api
        .get("/auth/me/")
        .then((r) => {
          if (active) setUser(r.data);
        })
        .catch(() => {
          sessionStorage.removeItem("piki-token");
        })
        .finally(() => {
          if (active) setReady(true);
        });
    else setReady(true);
    const expire = () => {
      setUser(null);
      setNotice("Your session ended. Please sign in again.");
    };
    window.addEventListener("piki-session-expired", expire);
    return () => {
      active = false;
      window.removeEventListener("piki-session-expired", expire);
    };
  }, []);
  async function logout() {
    try {
      await api.post("/auth/logout/");
      sessionStorage.removeItem("piki-token");
      setUser(null);
      setNotice("You have signed out.");
    } catch (e) {
      setNotice(errorMessage(e));
    }
  }
  const login = (u) => {
    setUser(u);
    setNotice("");
  };
  const protectedPage = (element, staff = false) =>
    !ready ? (
      <p role="status">Checking your session…</p>
    ) : !user ? (
      <Navigate to="/login" replace />
    ) : staff && !user.is_staff ? (
      <Navigate to="/appointments" replace />
    ) : (
      element
    );
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header>
        <div className="nav-inner">
          <Link className="brand" to="/">
            <span className="brand-cross" aria-hidden="true">
              +
            </span>
            <span>
              Piki Ora<small>MEDICAL CENTRE</small>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            <NavLink to="/" end>
              Find care
            </NavLink>
            {user && <NavLink to="/appointments">My appointments</NavLink>}
            {user?.is_staff && <NavLink to="/admin">Clinic dashboard</NavLink>}
          </nav>
          <div className="nav-account">
            {user ? (
              <>
                <span className="small user-name">
                  {user.first_name || user.username}
                  <small>
                    {user.is_staff ? "Staff account" : "Patient account"}
                  </small>
                </span>
                <button onClick={logout}>Sign out</button>
              </>
            ) : (
              <>
                <Link className="signin" to="/login">
                  Sign in
                </Link>
                <Link className="button primary" to="/register">
                  Join Piki Ora <span aria-hidden="true">↗</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main id="main" className="container">
        {notice && (
          <div className="notice" role="status">
            {notice}
            <button onClick={() => setNotice("")}>Dismiss</button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Doctors user={user} />} />
          <Route path="/login" element={<Auth onLogin={login} />} />
          <Route path="/register" element={<Auth register onLogin={login} />} />
          <Route
            path="/appointments"
            element={protectedPage(<Appointments />)}
          />
          <Route path="/admin" element={protectedPage(<Admin />, true)} />
          <Route
            path="*"
            element={
              <div className="empty">
                <h1>Page not found</h1>
                <Link to="/">Return to find care</Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer>
        <div className="container footer-inner">
          <span>
            <strong>Piki Ora</strong> Medical Centre
          </span>
          <span>Appointment portal · Pacific/Auckland</span>
        </div>
      </footer>
    </BrowserRouter>
  );
}
