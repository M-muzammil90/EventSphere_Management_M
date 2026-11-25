import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import { StoreProvider } from "@/lib/store";
import * as liveApi from "@/lib/liveApi";

vi.mock("@/lib/liveApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/liveApi")>("@/lib/liveApi");
  return {
    ...actual,
    fetchLiveExpos: vi.fn(),
    fetchLiveAnalyticsOverview: vi.fn(),
    fetchLiveAttendeeAnalytics: vi.fn(),
    fetchLiveBoothAnalytics: vi.fn(),
    fetchLiveSessionAnalytics: vi.fn(),
    fetchLiveEventAnalytics: vi.fn(),
    fetchLiveRevenueAnalytics: vi.fn(),
  };
});

describe("AdminAnalytics Page (MongoDB Aggregation)", () => {
  beforeEach(() => {
    vi.mocked(liveApi.fetchLiveExpos).mockResolvedValue([
      { id: "e1", _id: "e1", title: "AI World Expo" } as any,
    ]);
    vi.mocked(liveApi.fetchLiveAnalyticsOverview).mockResolvedValue({
      expos: { total: 3, live: 1, upcoming: 2 },
      users: { attendees: 45, exhibitors: 12 },
      applications: { pending: 2, approved: 10 },
      booths: { total: 40, booked: 20, reserved: 4, available: 16, occupancy: 60 },
      revenue: { total: 15400, transactions: 8, currency: "USD" },
      trends: { registrations: [{ _id: "2026-11-20", count: 10 }], revenue: [] },
    });
    vi.mocked(liveApi.fetchLiveAttendeeAnalytics).mockResolvedValue({
      summary: { total: 45, checkedIn: 18, checkInRate: 40 },
      byTicket: [{ _id: "VIP", count: 15 }, { _id: "Standard", count: 30 }],
      byStatus: [{ _id: "confirmed", count: 27 }, { _id: "attended", count: 18 }],
    });
    vi.mocked(liveApi.fetchLiveBoothAnalytics).mockResolvedValue({
      summary: { total: 40, occupancy: 60, totalRevenue: 15400 },
      byZone: [{ _id: "A", total: 10, booked: 6, occupancy: 60 }],
    });
    vi.mocked(liveApi.fetchLiveSessionAnalytics).mockResolvedValue({
      summary: { total: 10, registrations: 120, avgFillRate: 80 },
      byType: [{ _id: "Keynote", registrations: 80 }],
      topSessions: [],
    });
    vi.mocked(liveApi.fetchLiveEventAnalytics).mockResolvedValue([]);
    vi.mocked(liveApi.fetchLiveRevenueAnalytics).mockResolvedValue({
      summary: { grandTotal: 15400, demoMode: true },
      byMonth: [{ _id: "2026-11", total: 15400 }],
      byStatus: [{ _id: "PAID", count: 8, total: 15400 }],
    });
  });

  it("renders aggregated MongoDB KPIs and updates on filter change", async () => {
    render(
      <StoreProvider>
        <MemoryRouter>
          <AdminAnalytics />
        </MemoryRouter>
      </StoreProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/verified revenue/i).length).toBeGreaterThan(0);
      expect(screen.getByText("60%")).toBeInTheDocument();
    });

    // Change range filter
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "7d" } });

    await waitFor(() => {
      expect(liveApi.fetchLiveAnalyticsOverview).toHaveBeenCalledWith(expect.objectContaining({ range: "7d" }));
    });
  });

  it("shows error state when analytics API fails", async () => {
    vi.mocked(liveApi.fetchLiveAnalyticsOverview).mockRejectedValueOnce(new Error("Aggregation failed"));
    render(
      <StoreProvider>
        <MemoryRouter>
          <AdminAnalytics />
        </MemoryRouter>
      </StoreProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/aggregation failed/i)).toBeInTheDocument();
    });
  });
});
