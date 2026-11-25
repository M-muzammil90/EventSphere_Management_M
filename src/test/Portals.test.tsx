import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "@/App";
import * as apiModule from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    get: vi.fn(),
    post: vi.fn(),
  };
});

describe("Protected Routes & Role-Based Access", () => {
  beforeEach(() => {
    vi.mocked(apiModule.get).mockResolvedValue({ success: false, data: null });
  });

  it("redirects unauthenticated user from /admin to login", async () => {
    window.location.hash = "#/admin";
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /welcome back|sign in/i })).toBeInTheDocument();
    });
  });

  it("renders public home page without authentication", async () => {
    window.location.hash = "#/";
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText(/eventsphere/i).length).toBeGreaterThan(0);
    });
  });
});
