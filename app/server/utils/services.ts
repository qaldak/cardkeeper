import { loadConfig } from '../lib/config'
import { createPrisma } from '../db'
import { createServices, type Services } from '../services'
import { createDefaultRegistry } from '../tcg/registry'

const globalForServices = globalThis as typeof globalThis & { __cardkeeperServices?: Services }

/** Lazily created application services, shared by all requests (and kept across dev hot reloads). */
export function useServices(): Services {
  if (!globalForServices.__cardkeeperServices) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set')
    }
    const config = loadConfig()
    globalForServices.__cardkeeperServices = createServices({
      db: createPrisma(databaseUrl),
      registry: createDefaultRegistry(config),
      config,
    })
  }
  return globalForServices.__cardkeeperServices
}

export function closeServices(): Promise<void> | undefined {
  const services = globalForServices.__cardkeeperServices
  globalForServices.__cardkeeperServices = undefined
  return services?.db.$disconnect()
}
