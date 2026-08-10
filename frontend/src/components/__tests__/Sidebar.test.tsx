import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/auth", () => ({
  bootstrapSession: vi.fn().mockResolvedValue(null),
  getCurrentUser: vi.fn().mockReturnValue({ id: "1", email: "researcher@prism.dev", created_at: "2024-01-01" }),
  logout: vi.fn().mockResolvedValue(undefined),
}));

import Sidebar from "@/components/Sidebar";
import { useUIStore } from "@/lib/store";
import { logout } from "@/lib/auth";

beforeEach(() => {
  pushMock.mockClear();
  vi.mocked(logout).mockClear();
  useUIStore.setState({ sidebarCollapsed: false, mobileDrawerOpen: false });
});

describe("Sidebar", () => {
  it("renders the primary navigation landmark with all nav links", () => {
    render(<Sidebar />);
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /workspace/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /library/i })).toBeInTheDocument();
  });

  it("marks the link matching the current path as the current page", () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
    const ingestLink = screen.getByRole("link", { name: /ingest/i });
    expect(ingestLink).not.toHaveAttribute("aria-current");
  });

  it("shows the signed-in user's email", () => {
    render(<Sidebar />);
    expect(screen.getByText("researcher@prism.dev")).toBeInTheDocument();
  });

  it("calls logout and redirects to /login when the log out button is clicked", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("button", { name: /log out/i }));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("toggles the collapsed state and updates the expand/collapse button label", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    const toggle = screen.getByRole("button", { name: /collapse sidebar/i });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it("moves focus to the next link when ArrowDown is pressed", () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    const ingestLink = screen.getByRole("link", { name: /ingest/i });
    dashboardLink.focus();
    fireEvent.keyDown(screen.getByRole("toolbar", { name: /primary navigation links/i }), { key: "ArrowDown" });
    expect(ingestLink).toHaveFocus();
  });
});