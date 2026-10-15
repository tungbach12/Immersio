import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Standalone vitest config.
 *
 * The `test` block lives inside `vite.config.ts`'s returned object, which Vite's
 * `UserConfig` type does not model — so vitest silently ignored it and ran every
 * suite in the default `node` environment. That left `localStorage` undefined and
 * failed every test that seeds an auth session, including the pre-existing
 * `envelope.test.ts`. Declaring the test config here makes the jsdom environment
 * and the setup file actually apply.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});