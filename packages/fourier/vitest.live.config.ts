import { defineConfig } from "vitest/config";

// The client against a running API: FOURIER_API_URL and FOURIER_ADMIN_TOKEN
// name it (a local one in development; see test/live/client.live.test.ts).
export default defineConfig({
    test: {
        environment: "node",
        include: ["test/live/*.test.ts"],
        testTimeout: 120_000,
    },
});
