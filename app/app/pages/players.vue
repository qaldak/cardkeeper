<script setup lang="ts">
import type { PlayerDto } from '#shared/types/api'

const { t } = useI18n()
const toast = useToast()
const apiError = useApiError()

useHead({ title: () => t('nav.players') })

const { data: players, refresh } = await useFetch<PlayerDto[]>('/api/players')

const newPlayer = reactive({ name: '', contact: '' })
const editingId = ref<number | null>(null)
const editForm = reactive({ name: '', contact: '' })
const deleting = ref<PlayerDto | null>(null)
const deleteOpen = computed({
  get: () => deleting.value !== null,
  set: (open: boolean) => {
    if (!open) {
      deleting.value = null
    }
  },
})

async function run(action: () => Promise<unknown>, successKey?: string) {
  try {
    await action()
    await refresh()
    if (successKey) {
      toast.add({ title: t(successKey), color: 'success' })
    }
    return true
  }
  catch (error) {
    toast.add({ title: apiError(error), color: 'error' })
    return false
  }
}

async function addPlayer() {
  const ok = await run(() => $fetch('/api/players', {
    method: 'POST',
    body: { name: newPlayer.name, contact: newPlayer.contact || null },
  }), 'players.created')
  if (ok) {
    newPlayer.name = ''
    newPlayer.contact = ''
  }
}

function startEdit(player: PlayerDto) {
  editingId.value = player.id
  editForm.name = player.name
  editForm.contact = player.contact ?? ''
}

async function saveEdit(player: PlayerDto) {
  const ok = await run(() => $fetch(`/api/players/${player.id}`, {
    method: 'PUT',
    body: { name: editForm.name, contact: editForm.contact || null },
  }), 'common.saved')
  if (ok) {
    editingId.value = null
  }
}

async function confirmDelete() {
  const player = deleting.value
  if (player) {
    await run(() => $fetch(`/api/players/${player.id}`, { method: 'DELETE' }), 'players.deleted')
    deleting.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1040px] px-8 pb-12 pt-6">
    <h1 class="mb-1 text-2xl font-semibold">
      {{ t('players.title') }}
    </h1>
    <p class="mb-6 text-sm text-muted">
      {{ t('players.intro') }}
    </p>

    <form class="mb-6 flex flex-wrap items-end gap-3" @submit.prevent="addPlayer">
      <UFormField :label="t('players.name')" class="w-56">
        <UInput v-model="newPlayer.name" required maxlength="80" class="w-full" />
      </UFormField>
      <UFormField :label="t('players.contact')" class="w-72">
        <UInput v-model="newPlayer.contact" maxlength="200" class="w-full" />
      </UFormField>
      <UButton type="submit" icon="i-lucide-plus" :disabled="!newPlayer.name.trim()">
        {{ t('players.add') }}
      </UButton>
    </form>

    <div class="overflow-hidden rounded-xl border border-default bg-default">
      <p v-if="!players?.length" class="px-4 py-6 text-center text-sm text-muted">
        {{ t('players.empty') }}
      </p>
      <ul v-else class="divide-y divide-default">
        <li v-for="player in players" :key="player.id" class="flex flex-wrap items-center gap-3 px-4 py-3">
          <template v-if="editingId === player.id">
            <UInput v-model="editForm.name" :aria-label="t('players.name')" maxlength="80" class="w-52" />
            <UInput v-model="editForm.contact" :aria-label="t('players.contact')" maxlength="200" class="w-64" />
            <UButton size="sm" @click="saveEdit(player)">
              {{ t('common.save') }}
            </UButton>
            <UButton size="sm" color="neutral" variant="ghost" @click="editingId = null">
              {{ t('common.cancel') }}
            </UButton>
          </template>
          <template v-else>
            <span class="w-52 font-medium">{{ player.name }}</span>
            <span class="min-w-0 flex-1 truncate text-sm text-muted">{{ player.contact ?? t('common.none') }}</span>
            <NuxtLink :to="{ path: '/', query: { player: player.id } }" class="text-sm">
              {{ t('players.cards', { n: player.cardCount }, player.cardCount) }}
            </NuxtLink>
            <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-pencil" :aria-label="t('common.edit')" @click="startEdit(player)" />
            <UButton size="sm" color="error" variant="ghost" icon="i-lucide-trash-2" :aria-label="t('common.delete')" @click="deleting = player" />
          </template>
        </li>
      </ul>
    </div>

    <UModal v-model:open="deleteOpen" :title="t('players.deleteTitle')">
      <template #body>
        <p class="text-sm">
          {{ t('players.deleteText', { name: deleting?.name }) }}
        </p>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="deleting = null">
          {{ t('common.cancel') }}
        </UButton>
        <UButton color="error" @click="confirmDelete">
          {{ t('common.delete') }}
        </UButton>
      </template>
    </UModal>
  </div>
</template>
