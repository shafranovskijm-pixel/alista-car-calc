import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("@/integrations/supabase/proxy-client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(async () => ({ data: { session: null } })),
      signOut: vi.fn(async () => undefined),
    },
  },
}));

describe("legacy calculator route", () => {
  it("redirects calculator visitors to the contact form", async () => {
    window.history.replaceState({}, "", "/calculator");

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe("/contacts"));
  });
});
