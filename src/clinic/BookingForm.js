import { useEffect, useState } from "react";
import { api, errorMessage, slotLabel } from "./api";

export default function BookingForm({ booking, onDone, onClose }) {
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api
      .get("/slots/?available=true")
      .then((r) => {
        if (active)
          setSlots(r.data.filter((s) => s.id !== booking.appointment));
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [booking.appointment]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.patch(`/appointments/${booking.id}/`, {
        appointment: Number(selected),
      });
      onDone("Appointment rescheduled. Your new time is confirmed.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="panel edit-panel"
      aria-label={`Reschedule appointment ${booking.id}`}
    >
      <div className="section-heading">
        <h3>Reschedule appointment #{booking.id}</h3>
        <button onClick={onClose} disabled={busy}>
          Close
        </button>
      </div>
      <p>Your current booking stays confirmed until the new time is saved.</p>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading available times…</p>
      ) : slots.length === 0 ? (
        <p>No alternative times are available. Please contact the clinic.</p>
      ) : (
        <form onSubmit={submit}>
          <label>
            New consultation time
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              required
            >
              <option value="">Choose an available time</option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {slotLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : "Confirm new time"}
          </button>
        </form>
      )}
    </section>
  );
}
