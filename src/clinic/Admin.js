import { useCallback, useEffect, useState } from "react";
import { api, dateLabel, errorMessage } from "./api";
import BookingForm from "./BookingForm";

function ResourceForm({ kind, record, doctors, onClose, onSaved }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const isDoctor = kind === "doctors",
    isPatient = kind === "patients";
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget),
      data = Object.fromEntries(f);
    data.is_active = f.has("is_active");
    if (kind === "slots") data.doctor = Number(data.doctor);
    try {
      if (record.id) await api.patch(`/${kind}/${record.id}/`, data);
      else await api.post(`/${kind}/`, data);
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel edit-panel">
      <div className="section-heading">
        <h2>
          {record.id ? "Edit" : "Add"}{" "}
          {isDoctor
            ? "doctor"
            : isPatient
              ? "patient account"
              : "consultation slot"}
        </h2>
        <button disabled={busy} onClick={onClose}>
          Close editor
        </button>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={submit}>
        {isDoctor ? (
          <>
            <div className="form-grid">
              <label>
                Doctor name
                <input
                  name="name"
                  defaultValue={record.name || ""}
                  maxLength="100"
                  required
                />
              </label>
              <label>
                Speciality
                <input
                  name="speciality"
                  defaultValue={record.speciality || ""}
                  maxLength="100"
                  required
                />
              </label>
            </div>
            <label>
              Profile biography
              <textarea name="bio" defaultValue={record.bio || ""} rows="3" />
            </label>
          </>
        ) : isPatient ? (
          <>
            <p>
              Username: <strong>{record.username}</strong>
            </p>
            <div className="form-grid">
              <label>
                First name
                <input
                  name="first_name"
                  defaultValue={record.first_name || ""}
                  maxLength="150"
                />
              </label>
              <label>
                Last name
                <input
                  name="last_name"
                  defaultValue={record.last_name || ""}
                  maxLength="150"
                />
              </label>
            </div>
            <label>
              Email
              <input
                name="email"
                type="email"
                defaultValue={record.email || ""}
              />
            </label>
          </>
        ) : (
          <>
            <div className="form-grid">
              <label>
                Doctor
                <select
                  name="doctor"
                  defaultValue={record.doctor || ""}
                  required
                >
                  <option value="">Choose a doctor</option>
                  {doctors
                    .filter((d) => d.is_active || d.id === record.doctor)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Date
                <input
                  name="date"
                  type="date"
                  defaultValue={record.date || ""}
                  required
                />
              </label>
              <label>
                Start time
                <input
                  name="start_time"
                  type="time"
                  defaultValue={record.start_time?.slice(0, 5) || ""}
                  required
                />
              </label>
              <label>
                End time
                <input
                  name="end_time"
                  type="time"
                  defaultValue={record.end_time?.slice(0, 5) || ""}
                  required
                />
              </label>
            </div>
            <p className="small muted">
              Pacific/Auckland time. Slots cannot overlap. Slots with booking
              history are protected.
            </p>
          </>
        )}
        <label className="checkbox">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={record.is_active ?? true}
          />
          Active {isPatient ? "account" : isDoctor ? "doctor" : "slot"}
        </label>
        <button className="primary" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </section>
  );
}

const tabs = [
  ["doctors", "Doctors"],
  ["slots", "Consultation slots"],
  ["appointments", "Patient bookings"],
  ["patients", "Patients"],
];
export default function Admin() {
  const [tab, setTab] = useState("doctors"),
    [data, setData] = useState({
      doctors: [],
      slots: [],
      appointments: [],
      patients: [],
    }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [edit, setEdit] = useState(null),
    [reschedule, setReschedule] = useState(null),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const results = await Promise.all(
        tabs.map(([key]) => api.get(`/${key}/`)),
      );
      setData(
        Object.fromEntries(tabs.map(([key], i) => [key, results[i].data])),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  async function remove(kind, item) {
    if (
      !window.confirm(
        `Delete ${kind === "doctors" ? item.name : "consultation slot #" + item.id}? Records with booking history cannot be deleted.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api.delete(`/${kind}/${item.id}/`);
      setMessage("Record deleted.");
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function cancel(b) {
    if (!window.confirm(`Cancel booking #${b.id} for ${b.patient_name}?`))
      return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/appointments/${b.id}/cancel/`);
      setMessage(`Booking #${b.id} cancelled.`);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const rows = data[tab].filter((r) =>
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">STAFF WORKSPACE</span>
        <h1>Clinic overview</h1>
        <p>
          Manage your care team, consultation times and patient appointments.
        </p>
      </div>
      <div className="stats-grid">
        <div className="stat">
          <span>Doctors</span>
          <strong>{data.doctors.length}</strong>
          <small>Care team profiles</small>
        </div>
        <div className="stat">
          <span>Available times</span>
          <strong>{data.slots.filter((s) => s.available).length}</strong>
          <small>Ready for booking</small>
        </div>
        <div className="stat">
          <span>Confirmed bookings</span>
          <strong>
            {data.appointments.filter((b) => b.status === "confirmed").length}
          </strong>
          <small>All confirmed records</small>
        </div>
        <div className="stat">
          <span>Patients</span>
          <strong>{data.patients.length}</strong>
          <small>Registered accounts</small>
        </div>
      </div>
      <nav className="tabs" aria-label="Administration sections">
        {tabs.map(([key, title]) => (
          <button
            key={key}
            aria-current={tab === key ? "page" : undefined}
            className={tab === key ? "selected" : ""}
            onClick={() => {
              setTab(key);
              setEdit(null);
              setReschedule(null);
              setSearch("");
              setError("");
              setMessage("");
            }}
          >
            {title}
          </button>
        ))}
      </nav>
      {message && (
        <div className="notice success" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error}
          <button onClick={load}>Refresh</button>
        </div>
      )}
      {edit && (
        <ResourceForm
          key={`${tab}-${edit.id || "new"}`}
          kind={tab}
          record={edit}
          doctors={data.doctors}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            setMessage("Changes saved.");
            load();
          }}
        />
      )}
      {reschedule && (
        <BookingForm
          booking={reschedule}
          onClose={() => setReschedule(null)}
          onDone={(m) => {
            setReschedule(null);
            setMessage(m);
            load();
          }}
        />
      )}
      <div className="section-heading">
        <h2>{tabs.find(([key]) => key === tab)[1]}</h2>
        <div className="actions">
          <button onClick={load} disabled={loading || busy}>
            Refresh
          </button>
          {["doctors", "slots"].includes(tab) && (
            <button className="primary" onClick={() => setEdit({})}>
              + Add {tab === "doctors" ? "doctor" : "slot"}
            </button>
          )}
        </div>
      </div>
      <label className="search-label">
        Search {tabs.find(([key]) => key === tab)[1].toLowerCase()}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search records…"
        />
      </label>
      {loading ? (
        <p className="empty" role="status">
          Loading clinic records…
        </p>
      ) : rows.length === 0 ? (
        <div className="empty">
          <h3>No matching records</h3>
          <p>
            {search
              ? "Try another search."
              : "Records will appear here when they are created."}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {(tab === "doctors"
                  ? ["Doctor", "Speciality", "Status", "Actions"]
                  : tab === "slots"
                    ? ["Doctor", "Date", "Time (NZ)", "Status", "Actions"]
                    : tab === "appointments"
                      ? [
                          "Reference / patient",
                          "Doctor",
                          "Date / time (NZ)",
                          "Status",
                          "Actions",
                        ]
                      : ["Patient", "Email", "Status", "Actions"]
                ).map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {tab === "doctors" ? (
                    <>
                      <td>
                        <strong>{r.name}</strong>
                        <p className="small muted">{r.bio}</p>
                      </td>
                      <td>{r.speciality}</td>
                      <td>
                        <span
                          className={`pill ${r.is_active ? "" : "cancelled"}`}
                        >
                          {r.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button onClick={() => setEdit(r)}>Edit</button>
                          <button
                            className="danger"
                            disabled={busy}
                            onClick={() => remove(tab, r)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  ) : tab === "slots" ? (
                    <>
                      <td>{r.doctor_name}</td>
                      <td>{dateLabel(r.date)}</td>
                      <td>
                        {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
                      </td>
                      <td>
                        <span
                          className={`pill ${r.available ? "" : "cancelled"}`}
                        >
                          {r.available
                            ? "Available"
                            : r.is_active
                              ? "Unavailable"
                              : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button onClick={() => setEdit(r)}>Edit</button>
                          <button
                            className="danger"
                            disabled={busy}
                            onClick={() => remove(tab, r)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  ) : tab === "appointments" ? (
                    <>
                      <td>
                        <strong>
                          #{r.id} · {r.patient_name}
                        </strong>
                        <p className="small muted">{r.patient_email}</p>
                      </td>
                      <td>{r.slot.doctor_name}</td>
                      <td>
                        {dateLabel(r.slot.date)}
                        <p>
                          {r.slot.start_time.slice(0, 5)}–
                          {r.slot.end_time.slice(0, 5)}
                        </p>
                      </td>
                      <td>
                        <span
                          className={`pill ${r.status === "cancelled" ? "cancelled" : ""}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td>
                        {r.can_change ? (
                          <div className="actions">
                            <button
                              disabled={busy}
                              onClick={() => setReschedule(r)}
                            >
                              Reschedule
                            </button>
                            <button
                              className="danger"
                              disabled={busy}
                              onClick={() => cancel(r)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="muted small">
                            No changes available
                          </span>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <strong>
                          {r.first_name} {r.last_name}
                        </strong>
                        <p className="small muted">{r.username}</p>
                      </td>
                      <td>{r.email || "—"}</td>
                      <td>
                        <span
                          className={`pill ${r.is_active ? "" : "cancelled"}`}
                        >
                          {r.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => setEdit(r)}>
                          Manage account
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
