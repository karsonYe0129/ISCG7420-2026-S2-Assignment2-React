import axios from "axios";

export const api = axios.create({
  baseURL: (
    process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api"
  ).replace(/\/$/, ""),
  timeout: 30000,
});
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("piki-token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      sessionStorage.getItem("piki-token")
    ) {
      sessionStorage.removeItem("piki-token");
      window.dispatchEvent(new Event("piki-session-expired"));
    }
    return Promise.reject(error);
  },
);
export function errorMessage(error) {
  if (!error.response)
    return "Cannot reach the clinic. Check your connection and try again. A sleeping server may take a moment to start.";
  const flatten = (value) =>
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value.map(flatten).join(" ")
        : Object.entries(value)
            .map(
              ([key, val]) =>
                `${key === "detail" || key === "non_field_errors" ? "" : key + ": "}${flatten(val)}`,
            )
            .join(" ");
  return (
    flatten(error.response.data) || "Something went wrong. Please try again."
  );
}
export function dateLabel(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
export function slotLabel(slot) {
  return `${slot.doctor_name} · ${dateLabel(slot.date)} · ${slot.start_time.slice(0, 5)}–${slot.end_time.slice(0, 5)}`;
}
