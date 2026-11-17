import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, dateLabel, errorMessage, slotLabel } from "./api";
import BookingForm from "./BookingForm";

export function Doctors({ user }) {
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [d, s] = await Promise.all([
        api.get("/doctors/"),
        api.get("/slots/?available=true"),
      ]);
      setDoctors(d.data.filter((x) => x.is_active));
      setSlots(s.data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  async function book(slot) {
    if (!window.confirm(`Confirm this appointment?\n${slotLabel(slot)}`))
      return;
    setBusy(slot.id);
    setMessage("");
    setError("");
    try {
      const r = await api.post("/appointments/", { appointment: slot.id });
      setMessage(
        `${r.data.message} ${slotLabel(slot)}. Your booking reference is #${r.data.booking.id}.`,
      );
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }
  const visible = slots.filter(
    (s) =>
      (!doctor || String(s.doctor) === doctor) && (!date || s.date === date),
  );
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">PIKI ORA · PATIENT PORTAL</span>
          <h1>
            A little planning.
            <br />
            <span>Better everyday care.</span>
          </h1>
          <p>
            Choose a doctor and a time that works for you.
            <br />
            Your next step towards feeling better starts here.
          </p>
          <a className="primary button" href="#available">
            Find an appointment <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="hero-aside">
          <div className="abstract-cross" aria-hidden="true">
            +
          </div>
          <span className="eyebrow">CARE THAT FITS YOUR DAY</span>
          <h2>
            Your health.
            <br />
            Your time.
          </h2>
          <p>Book online. Manage with ease.</p>
          <span className="pill">Pacific/Auckland time</span>
        </div>
      </section>
      {message && (
        <div className="notice success" role="status">
          {message} <Link to="/appointments">View appointments →</Link>
        </div>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error} <button onClick={load}>Try again</button>
        </div>
      )}
      <div className="section-heading">
        <div>
          <span className="eyebrow">OUR PEOPLE</span>
          <h2>Meet your care team</h2>
        </div>
        <span className="muted small">{doctors.length} active doctors</span>
      </div>
      <div className="doctor-grid">
        {doctors.map((d, i) => (
          <article className="doctor-card" key={d.id}>
            <div className={`avatar avatar-${i % 3}`} aria-hidden="true">
              {d.name
                .replace(/^Dr\.?\s*/i, "")
                .split(" ")
                .map((x) => x[0])
                .slice(0, 2)
                .join("")}
            </div>
            <span className="pill">{d.speciality}</span>
            <h3>{d.name}</h3>
            <p>
              {d.bio || "Personal, considered care for your everyday health."}
            </p>
            <button
              onClick={() => {
                setDoctor(String(d.id));
                document
                  .getElementById("available")
                  .scrollIntoView({ behavior: "smooth" });
              }}
            >
              View available times <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </div>
      {!loading && doctors.length === 0 && (
        <div className="empty">
          No doctors are listed yet. Please check back soon.
        </div>
      )}
      <section id="available">
        <div className="section-heading">
          <div>
            <span className="eyebrow">MAKE TIME FOR YOU</span>
            <h2>Available appointments</h2>
          </div>
          <button onClick={load} disabled={loading || busy !== null}>
            Refresh times
          </button>
        </div>
        <div className="filter-bar">
          <label>
            Doctor
            <select value={doctor} onChange={(e) => setDoctor(e.target.value)}>
              <option value="">All doctors</option>
              {doctors.map((d) => (
                <option value={d.id} key={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Consultation date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <button
            onClick={() => {
              setDoctor("");
              setDate("");
            }}
          >
            Clear filters
          </button>
          <p className="small muted">All times are local to New Zealand.</p>
        </div>
        {loading ? (
          <p className="empty" role="status">
            Finding available appointments…
          </p>
        ) : visible.length === 0 ? (
          <div className="empty">
            <h3>No available times</h3>
            <p>
              Try another date or doctor, or check back when the clinic adds
              more times.
            </p>
          </div>
        ) : (
          <div className="slot-list">
            {visible.map((s) => (
              <article className="slot-row" key={s.id}>
                <div className="date-tile">
                  <strong>{new Date(`${s.date}T12:00:00`).getDate()}</strong>
                  <span>
                    {new Date(`${s.date}T12:00:00`).toLocaleDateString(
                      "en-NZ",
                      { month: "short" },
                    )}
                  </span>
                </div>
                <div className="slot-detail">
                  <h3>{s.doctor_name}</h3>
                  <p>
                    {s.speciality} · {dateLabel(s.date)}
                  </p>
                </div>
                <strong className="time">
                  {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                </strong>
                {user ? (
                  <button
                    className="primary"
                    onClick={() => book(s)}
                    disabled={busy !== null}
                  >
                    {busy === s.id ? "Booking…" : "Book appointment"}
                  </button>
                ) : (
                  <Link className="button primary" to="/login">
                    Sign in to book
                  </Link>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      <div className="bottom-note">
        <strong>Simple steps. Thoughtful care.</strong>
        <p>Need help finding a time? Speak with your clinic team.</p>
      </div>
    </>
  );
}

export function Appointments() {
  const [bookings, setBookings] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [editing, setEditing] = useState(null),
    [busy, setBusy] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setBookings((await api.get("/appointments/")).data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  async function cancel(b) {
    if (
      !window.confirm(
        `Cancel appointment #${b.id}? This will release your consultation time.`,
      )
    )
      return;
    setBusy(b.id);
    setError("");
    try {
      await api.post(`/appointments/${b.id}/cancel/`);
      setMessage(
        "Appointment cancelled. The time is available for other patients.",
      );
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">YOUR CARE, IN ONE PLACE</span>
        <h1>My appointments</h1>
        <p>
          View upcoming care and manage your bookings. All times are
          Pacific/Auckland.
        </p>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
          <button onClick={load}>Try again</button>
        </div>
      )}
      {message && (
        <div className="notice success" role="status">
          {message}
        </div>
      )}
      {editing && (
        <BookingForm
          booking={editing}
          onClose={() => setEditing(null)}
          onDone={(m) => {
            setEditing(null);
            setMessage(m);
            load();
          }}
        />
      )}
      {loading ? (
        <p role="status" className="empty">
          Loading your appointments…
        </p>
      ) : bookings.length === 0 ? (
        <div className="empty">
          <h2>Your next appointment starts here</h2>
          <p>You have no bookings yet.</p>
          <Link to="/" className="button primary">
            Browse available times
          </Link>
        </div>
      ) : (
        <div className="booking-grid">
          {bookings.map((b) => (
            <article className="panel booking-card" key={b.id}>
              <div className="section-heading">
                <span className="small muted">BOOKING #{b.id}</span>
                <span
                  className={`pill ${b.status === "cancelled" ? "cancelled" : ""}`}
                >
                  {b.status}
                </span>
              </div>
              <h2>{b.slot.doctor_name}</h2>
              <p>{b.slot.speciality}</p>
              <div className="booking-time">
                <strong>{dateLabel(b.slot.date)}</strong>
                <span>
                  {b.slot.start_time.slice(0, 5)}–{b.slot.end_time.slice(0, 5)}
                </span>
              </div>
              {b.can_change ? (
                <div className="actions">
                  <button
                    onClick={() => setEditing(b)}
                    disabled={busy !== null}
                  >
                    Reschedule
                  </button>
                  <button
                    className="danger"
                    onClick={() => cancel(b)}
                    disabled={busy !== null}
                  >
                    {busy === b.id ? "Cancelling…" : "Cancel appointment"}
                  </button>
                </div>
              ) : (
                <p className="small muted">
                  {b.status === "cancelled"
                    ? "This appointment was cancelled."
                    : "This appointment has already started."}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
