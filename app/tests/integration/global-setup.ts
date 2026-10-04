import { execFileSync } from 'node:child_process'

/** Applies all migrations to the test database before the integration tests run. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL
  if (!url) {
    return
  }
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  })
}
