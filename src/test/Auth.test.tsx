import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import { StoreProvider } from "@/lib/store";
import * as apiModule from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    get: vi.fn(),
    post: vi.fn(),
  };
});

function renderWithRouter(ui: React.ReactNode, initialEntries = ["/login"]) {
  return render(
    <StoreProvider>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </StoreProvider>
  );
}

describe("Authentication & Reset Password", () => {
  beforeEach(() => {
    vi.mocked(apiModule.get).mockResolvedValue({ success: false, data: null });
  });

  it("renders login form and validates empty submission", async () => {
    renderWithRouter(<Auth mode="login" />);
    expect(screen.getByRole("heading", { name: /welcome back|sign in/i })).toBeInTheDocument();
    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(apiModule.post).not.toHaveBeenCalled();
    });
  });

  it("handles login API failure gracefully with error message", async () => {
    vi.mocked(apiModule.post).mockRejectedValueOnce({ message: "Incorrect email or password", status: 401 });
    renderWithRouter(<Auth mode="login" />);
    fireEvent.change(screen.getByPlaceholderText(/you@company\.com/i), { target: { value: "bad@test.com" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password|••••••••/i), { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument();
    });
  });

  it("renders registration mode without admin role option", () => {
    renderWithRouter(<Auth mode="register" />, ["/register"]);
    expect(screen.queryByRole("button", { name: /^admin$/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/attendee/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/exhibitor/i).length).toBeGreaterThan(0);
  });

  it("renders reset password form", async () => {
    renderWithRouter(
      <Routes>
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>,
      ["/reset-password/validtoken123"]
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /set a new password/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
    });
  });
});
