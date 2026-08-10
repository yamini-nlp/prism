import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth", () => ({
  login: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import LoginPage from "@/app/login/page";
import { login } from "@/lib/auth";
import { toast } from "@/lib/toast";

beforeEach(() => {
  pushMock.mockClear();
  vi.mocked(login).mockReset();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

describe("LoginPage", () => {
  it("renders the sign in form with accessible fields", () => {
    render(<LoginPage />);
    expect(screen.getByText(/sign in to prism/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows a validation error and does not submit for an invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.tab();
    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("submits valid credentials, shows a success toast, and redirects to the dashboard", async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValue({ id: "1", email: "researcher@prism.dev", created_at: "2024-01-01" });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email/i), "researcher@prism.dev");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.tab();
    await waitFor(() => expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith("researcher@prism.dev", "password123"));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
    expect(toast.success).toHaveBeenCalledWith("Signed in", "Welcome back to Prism.");
  });

  it("shows an error toast and does not redirect when login fails", async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockRejectedValue(new Error("Invalid email or password."));

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email/i), "researcher@prism.dev");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.tab();
    await waitFor(() => expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Could not sign in", "Invalid email or password."));
    expect(pushMock).not.toHaveBeenCalled();
  });
});