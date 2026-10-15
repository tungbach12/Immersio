import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addDeck, addCardsToDeck } from "./decks";

/**
 * Regression tests for "Your words could not be saved" in SaveToDeckDialog.
 *
 * The dialog asked `createDeck(user, body.get("name"))`, i.e. it expects a JSON
 * OBJECT with a `name` key. The client sent `JSON.stringify(name)` — a bare JSON
 * string — so Spring could not bind it and answered HTTP 500. Every save failed
 * with the generic "could not be saved" message.
 *
 * Note `fetchWithAuth` already unwraps the `{success, data}` envelope, so these
 * tests assert on the unwrapped deck object, not the raw envelope.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("decks service", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Seed a session so fetchWithAuth does not redirect to /login.
    localStorage.setItem("accessToken", "test-token");
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const mock = () => globalThis.fetch as ReturnType<typeof vi.fn>;

  describe("addDeck", () => {
    it("sends { name } — a JSON object, not a bare JSON string", async () => {
      mock().mockResolvedValue(
        jsonResponse({
          success: true,
          data: { id: "deck-1", name: "vocab", totalCards: 0, dueCardsCount: 0 },
        }),
      );

      await addDeck("vocab");

      const raw = mock().mock.calls[0][1].body as string;
      const parsed = JSON.parse(raw);
      expect(typeof parsed).toBe("object");
      expect(parsed).not.toBeNull();
      expect(Array.isArray(parsed)).toBe(false);
      expect(parsed).toEqual({ name: "vocab" });
    });

    it("returns the created deck so the dialog can save cards into it", async () => {
      mock().mockResolvedValue(
        jsonResponse({
          success: true,
          data: { id: "deck-1", name: "vocab", totalCards: 0, dueCardsCount: 0 },
        }),
      );

      const deck = await addDeck("vocab");

      expect(deck.id).toBe("deck-1");
      expect(deck.name).toBe("vocab");
      expect(deck.id).toBeTruthy();
    });

    it("throws when the server rejects the request", async () => {
      mock().mockResolvedValue(jsonResponse({ success: false, message: "nope" }, 500));

      await expect(addDeck("vocab")).rejects.toThrow();
    });
  });

  describe("addCardsToDeck", () => {
    it("POSTs the card list to the deck's cards endpoint", async () => {
      mock().mockResolvedValue(jsonResponse({ success: true, data: { count: 1 } }));

      await addCardsToDeck("deck-1", [
        { front: "journey", back: "hành trình", explanation: undefined, tag: undefined },
      ]);

      expect(mock().mock.calls[0][0]).toContain("/api/flashcards/decks/deck-1/cards");
      expect(JSON.parse(mock().mock.calls[0][1].body as string)).toEqual([
        { front: "journey", back: "hành trình", explanation: undefined, tag: undefined },
      ]);
    });

    it("throws so the dialog can surface its error", async () => {
      mock().mockResolvedValue(jsonResponse({ success: false, message: "nope" }, 500));

      await expect(addCardsToDeck("deck-1", [{ front: "a", back: "b" }])).rejects.toThrow();
    });
  });
});