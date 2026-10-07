import pkg from './package.json' with { type: 'json' }

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],

  // The UI mockups are light only.
  // Follows the device (light or dark); light when the device does not say. The choice of the header switch is remembered in the browser.
  colorMode: { preference: 'system', fallback: 'light' },

  runtimeConfig: {
    public: {
      appVersion: pkg.version,
    },
  },

  // Single-process Node server, no cluster mode: keeps the memory footprint small on a Raspberry Pi.
  nitro: {
    preset: 'node-server',
  },

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'de',
    locales: [
      { code: 'de', language: 'de-CH', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'cardkeeper_locale',
      fallbackLocale: 'de',
    },
  },

  typescript: {
    strict: true,
    nodeTsConfig: {
      include: ['../tests/**/*', '../vitest.config.ts'],
    },
  },
})
