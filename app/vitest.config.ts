import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // `npm run test:coverage`: what the tests reach of the server code and the shared helpers (the Prisma client is generated).
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts', 'shared/**/*.ts'],
      exclude: ['server/generated/**'],
      reporter: ['text-summary', 'html'],
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        // Needs a PostgreSQL database (TEST_DATABASE_URL, migrated by the global setup); skipped without one.
        // Deliberately not DATABASE_URL: these tests truncate every table.
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          globalSetup: ['tests/integration/global-setup.ts'],
          environment: 'node',
          fileParallelism: false,
          testTimeout: 20_000,
        },
      },
    ],
  },
})
