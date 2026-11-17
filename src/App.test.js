import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Auth from "./clinic/Auth";
import { Appointments, Doctors } from "./clinic/Patient";
import { api } from "./clinic/api";

jest.mock("./clinic/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  errorMessage: () => "Server rejected the request",
  dateLabel: (d) => d,
  slotLabel: (s) => s.doctor_name,
}));
const wrap = (element) => render(<BrowserRouter>{element}</BrowserRouter>);
beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

test("successful sign-in stores the token and opens patient appointments", async () => {
  api.post.mockResolvedValue({
    data: {
      token: "test-token",
      user: { username: "patient", is_staff: false },
    },
  });
  const login = jest.fn();
  wrap(<Auth onLogin={login} />);
  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: "patient" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "test-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));
  await waitFor(() =>
    expect(login).toHaveBeenCalledWith({
      username: "patient",
      is_staff: false,
    }),
  );
  expect(sessionStorage.getItem("piki-token")).toBe("test-token");
  expect(window.location.pathname).toBe("/appointments");
});

test("failed login displays a useful error and allows retry", async () => {
  api.post.mockRejectedValue(new Error("failure"));
  wrap(<Auth onLogin={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Server rejected");
  expect(screen.getByRole("button", { name: /Sign in/ })).toBeEnabled();
});

test("registration has labelled personal details and password guidance", () => {
  wrap(<Auth register onLogin={jest.fn()} />);
  expect(screen.getByLabelText("First name")).toBeRequired();
  expect(screen.getByLabelText("Email address")).toHaveAttribute(
    "type",
    "email",
  );
  expect(screen.getByLabelText("Password")).toHaveAttribute("minLength", "8");
});

test("patient sees an empty booking state with a route to browse care", async () => {
  api.get.mockResolvedValue({ data: [] });
  wrap(<Appointments />);
  expect(
    await screen.findByText("You have no bookings yet."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Browse available times" }),
  ).toHaveAttribute("href", "/");
});

test("a visitor must sign in before booking", async () => {
  api.get.mockImplementation((url) =>
    Promise.resolve({
      data: url.startsWith("/doctors")
        ? [{ id: 1, name: "Dr Test", speciality: "General", is_active: true }]
        : [
            {
              id: 1,
              doctor: 1,
              doctor_name: "Dr Test",
              date: "2026-12-01",
              start_time: "09:00:00",
              end_time: "09:30:00",
            },
          ],
    }),
  );
  wrap(<Doctors user={null} />);
  expect(
    await screen.findByRole("link", { name: "Sign in to book" }),
  ).toHaveAttribute("href", "/login");
  expect(
    screen.queryByRole("button", { name: "Book appointment" }),
  ).not.toBeInTheDocument();
});

test("cancelled bookings have no reschedule or cancel action", async () => {
  api.get.mockResolvedValue({
    data: [
      {
        id: 1,
        status: "cancelled",
        can_change: false,
        slot: {
          doctor_name: "Dr Test",
          speciality: "General",
          date: "2026-12-01",
          start_time: "09:00:00",
          end_time: "09:30:00",
        },
      },
    ],
  });
  wrap(<Appointments />);
  expect(
    await screen.findByText("This appointment was cancelled."),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Reschedule" }),
  ).not.toBeInTheDocument();
});
