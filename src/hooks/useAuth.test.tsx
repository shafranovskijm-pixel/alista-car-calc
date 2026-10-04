import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./useAuth";

const mocks = vi.hoisted(() => ({
  eq: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("@/integrations/supabase/proxy-client", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signOut: mocks.signOut,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: mocks.eq })),
    })),
  },
}));

const session = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: {
    id: "00000000-0000-4000-8000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "manager@example.com",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-10-04T00:00:00.000Z",
  },
} as Session;

const AuthState = () => {
  const { loading, roles, rolesError, retryRoles } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="roles">{roles.join(",")}</span>
      <span data-testid="roles-error">{rolesError ?? ""}</span>
      <button type="button" onClick={() => void retryRoles()}>
        Повторить
      </button>
    </div>
  );
};

describe("useAuth role loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mocks.unsubscribe } },
    });
    mocks.signOut.mockResolvedValue(undefined);
  });

  it("keeps an empty role set distinct from a failed role query", async () => {
    mocks.eq.mockResolvedValue({ data: [], error: null });

    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("roles")).toBeEmptyDOMElement();
    expect(screen.getByTestId("roles-error")).toBeEmptyDOMElement();
  });

  it("surfaces a role query failure and can retry it", async () => {
    mocks.eq
      .mockResolvedValueOnce({ data: null, error: { message: "role query unavailable" } })
      .mockResolvedValueOnce({ data: [{ role: "manager" }], error: null });

    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("roles-error")).toHaveTextContent("role query unavailable"),
    );
    expect(screen.getByTestId("roles")).toBeEmptyDOMElement();

    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));

    await waitFor(() => expect(screen.getByTestId("roles")).toHaveTextContent("manager"));
    expect(screen.getByTestId("roles-error")).toBeEmptyDOMElement();
    expect(mocks.eq).toHaveBeenCalledTimes(2);
  });
});
