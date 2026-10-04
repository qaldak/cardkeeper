<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const isOverview = computed(() => route.path === '/')

const navItems = computed(() => [
  { to: '/', label: t('nav.overview') },
  { to: '/players', label: t('nav.players') },
])

const localeItems = computed(() =>
  locales.value.map(entry => ({ label: entry.name ?? entry.code, value: entry.code })),
)

// The search box lives in the header but filters the overview through the `q` query parameter.
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    const query = { ...route.query, page: undefined, q: value.trim() || undefined }
    router.replace({ query })
  }, 300)
})

watch(() => route.query.q, (value) => {
  const next = typeof value === 'string' ? value : ''
  if (next !== search.value) {
    search.value = next
  }
})

onBeforeUnmount(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="min-h-screen">
    <header class="flex flex-wrap items-center justify-between gap-4 border-b border-default bg-default px-8 py-4">
      <NuxtLink to="/" class="text-[19px] font-semibold">
        {{ t('app.title') }}
      </NuxtLink>

      <nav class="flex flex-wrap items-center gap-6">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="text-muted hover:text-primary-600"
          active-class="!font-semibold !text-primary"
          exact-active-class="!font-semibold !text-primary"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="flex flex-wrap items-center gap-3">
        <UInput
          v-if="isOverview"
          v-model="search"
          type="search"
          icon="i-lucide-search"
          :placeholder="t('overview.searchPlaceholder')"
          :aria-label="t('overview.searchLabel')"
          class="w-[220px]"
        />
        <UButton to="/cards/new" icon="i-lucide-plus">
          {{ t('nav.addCard') }}
        </UButton>
        <USelect
          :model-value="locale"
          :items="localeItems"
          :aria-label="t('nav.language')"
          size="sm"
          class="w-32"
          @update:model-value="(value: string) => setLocale(value as 'de' | 'en')"
        />
      </div>
    </header>

    <main>
      <slot />
    </main>

    <footer class="px-8 pb-6 text-xs text-dimmed">
      Cardkeeper v{{ config.public.appVersion }}
    </footer>
  </div>
</template>
