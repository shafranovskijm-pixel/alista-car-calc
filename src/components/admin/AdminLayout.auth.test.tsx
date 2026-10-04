import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "./AdminLayout";

const mocks = vi.hoisted(() => ({
  retryRoles: vi.fn(),
  signOut: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: mocks.useAuth }));
vi.mock("@/integrations/supabase/proxy-client", () => ({ supabase: {} }));

describe("AdminLayout role errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({
      user: { id: "00000000-0000-4000-8000-000000000001", email: "manager@example.com" },
      roles: [],
      rolesError: "role query unavailable",
      loading: false,
      retryRoles: mocks.retryRoles,
      signOut: mocks.signOut,
    });
  });

  it("shows a retryable error instead of claiming that no role is assigned", () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminLayout />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Не удалось проверить права доступа");
    expect(screen.queryByText("Доступ не назначен")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(mocks.retryRoles).toHaveBeenCalledTimes(1);
  });
});
