<script setup lang="ts">
import type { UserDto } from '#shared/types/api'

const { t } = useI18n()
const { user: me } = useAuth()

useHead({ title: () => t('nav.users') })

const { data: users } = await useFetch<UserDto[]>('/api/users')
</script>

<template>
  <div class="mx-auto max-w-[760px] px-8 pb-12 pt-6">
    <h1 class="mb-1 text-2xl font-semibold">
      {{ t('users.title') }}
    </h1>
    <p class="mb-6 text-sm text-muted">
      {{ t('users.intro') }}
    </p>

    <ul v-if="users?.length" class="divide-y divide-default overflow-hidden rounded-xl border border-default bg-default">
      <li v-for="entry in users" :key="entry.id" class="flex items-center justify-between gap-3 px-4 py-3">
        <span class="font-medium">
          {{ entry.name }}
          <span v-if="entry.id === me?.id" class="ml-1.5 rounded bg-elevated px-1.5 py-0.5 text-[11px] font-normal text-muted">{{ t('users.you') }}</span>
        </span>
        <NuxtLink :to="{ path: '/', query: { owner: String(entry.id), game: 'all' } }" class="text-sm text-muted">
          {{ t('users.cards', entry.cardCount) }}
        </NuxtLink>
      </li>
    </ul>
    <p v-else class="text-sm text-muted">
      {{ t('users.empty') }}
    </p>
  </div>
</template>
