import { defineConfig } from 'prisma/config'

// The datasource URL is only needed for migrate/deploy commands, not for `prisma generate`.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
