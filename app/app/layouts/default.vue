<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const auth = useAuth()

// While the initial password is still set, nothing but the password change is available.
const restricted = computed(() => auth.user.value?.mustChangePassword === true)

async function logout() {
  await auth.logout()
  await navigateTo('/login')
}

const isOverview = computed(() => route.path === '/')

const navItems = computed(() => [
  { to: '/', label: t('nav.overview') },
  { to: '/users', label: t('nav.users') },
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

      <nav v-if="!restricted" class="flex flex-wrap items-center gap-6">
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
          v-if="isOverview && !restricted"
          v-model="search"
          type="search"
          icon="i-lucide-search"
          :placeholder="t('overview.searchPlaceholder')"
          :aria-label="t('overview.searchLabel')"
          class="w-[280px]"
        />
        <UButton v-if="!restricted" to="/cards/new" icon="i-lucide-plus">
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
        <div v-if="auth.user.value" class="flex items-center gap-2 text-sm" data-test="user-menu">
          <NuxtLink v-if="!restricted" to="/account" class="text-muted hover:text-primary-600" :title="t('nav.account')">
            {{ auth.user.value.name }}
          </NuxtLink>
          <span v-else class="text-muted">{{ auth.user.value.name }}</span>
          <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-log-out" :aria-label="t('nav.logout')" :title="t('nav.logout')" data-test="logout" @click="logout" />
        </div>
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
