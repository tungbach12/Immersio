import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "./auth";

/**
 * The Java `ApiResponse` serialises as { success, data, message, errors, detail }.
 * The .NET envelope carried an `error` field (and `meta`) that no longer exists.
 *
 * `fetchWithAuth` intercepts response.json() and unwraps `.data` on success.
 * These tests drive that real code path against the real Java envelope shape.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("ApiResponse envelope contract", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("unwraps .data from the Java success envelope", async () => {
    // seed a session so fetchWithAuth does not redirect to /login
    localStorage.setItem("accessToken", "test-token");
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({
        success: true,
        data: { id: "u1", username: "linh" },
        message: null,
        errors: null,
        detail: null,
      }),
    );

    const res = await authService.fetchWithAuth("/api/auth/me");
    const body = await res.json();

    expect(body).toEqual({ id: "u1", username: "linh" });
  });

  it("carries no `error` field — the Java envelope uses message/detail", async () => {
    localStorage.setItem("accessToken", "test-token");
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse(
        { success: false, data: null, message: "Email already in use", errors: null, detail: "Email already in use" },
        400,
      ),
    );

    const res = await authService.fetchWithAuth("/api/auth/register", { method: "POST" });

    expect(res.ok).toBe(false);
    // the raw envelope is untouched on failure — callers read message/detail
    expect(Object.keys(await res.clone().json()).sort()).toEqual([
      "data",
      "detail",
      "errors",
      "message",
      "success",
    ]);
  });

  it("redirects to /login when there is no session", async () => {
    await expect(authService.fetchWithAuth("/api/auth/me")).rejects.toThrow(
      "No active session",
    );
  });
});