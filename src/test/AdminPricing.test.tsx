import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminPricing from "@/pages/admin/AdminPricing";
import { StoreProvider } from "@/lib/store";
import * as liveApi from "@/lib/liveApi";

vi.mock("@/lib/liveApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/liveApi")>("@/lib/liveApi");
  return {
    ...actual,
    fetchLiveExpos: vi.fn(),
    fetchAdminBoothPrices: vi.fn(),
    fetchAdminTicketTypes: vi.fn(),
    fetchAdminPricingSettings: vi.fn(),
    upsertAdminBoothPrice: vi.fn(),
    deleteAdminBoothPrice: vi.fn(),
  };
});

describe("AdminPricing Management Page", () => {
  beforeEach(() => {
    vi.mocked(liveApi.fetchLiveExpos).mockResolvedValue([
      { id: "expo-1", _id: "expo-1", title: "Global Tech Summit 2026" } as any,
    ]);
    vi.mocked(liveApi.fetchAdminBoothPrices).mockResolvedValue([
      {
        _id: "bp-1",
        expo: { _id: "expo-1", title: "Global Tech Summit 2026" },
        category: "Small",
        sqm: 12,
        basePrice: 2500,
        discountPercent: 10,
        effectivePrice: 2250,
        currency: "USD",
        status: "active",
      },
    ]);
    vi.mocked(liveApi.fetchAdminTicketTypes).mockResolvedValue([
      {
        _id: "tp-1",
        expo: { _id: "expo-1", title: "Global Tech Summit 2026" },
        name: "VIP",
        price: 299,
        currency: "USD",
        capacity: 100,
        soldCount: 24,
        perks: ["Lounge access"],
        status: "active",
      },
    ]);
    vi.mocked(liveApi.fetchAdminPricingSettings).mockResolvedValue({
      expo: "expo-1",
      currency: "USD",
      taxRate: 5,
      taxLabel: "VAT",
      earlyBirdEnabled: false,
      earlyBirdPercent: 0,
      multiBoothEnabled: false,
      multiBoothPercent: 0,
      multiBoothMinQty: 2,
      demoPaymentsEnabled: true,
    });
  });

  it("shows loading state then renders booth pricing and ticket tabs", async () => {
    render(
      <StoreProvider>
        <MemoryRouter>
          <AdminPricing />
        </MemoryRouter>
      </StoreProvider>
    );

    expect(screen.getByText(/loading pricing configurations/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Global Tech Summit 2026").length).toBeGreaterThan(0);
      expect(screen.getByText(/2,250 USD/i)).toBeInTheDocument();
    });

    // Switch to Ticket Types tab
    fireEvent.click(screen.getByRole("button", { name: /ticket types/i }));
    await waitFor(() => {
      expect(screen.getByText(/\$299 USD/i)).toBeInTheDocument();
    });
  });

  it("displays API error banner if loading fails", async () => {
    vi.mocked(liveApi.fetchAdminBoothPrices).mockRejectedValueOnce(new Error("Unauthorized: Admin role required"));
    render(
      <StoreProvider>
        <MemoryRouter>
          <AdminPricing />
        </MemoryRouter>
      </StoreProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/unauthorized: admin role required/i)).toBeInTheDocument();
    });
  });
});
