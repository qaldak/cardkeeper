<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
const { t } = useI18n()
const goHome = () => clearError({ redirect: '/' })
</script>

<template>
  <UApp>
    <div class="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p class="text-5xl font-semibold text-primary">
        {{ error.statusCode }}
      </p>
      <p class="text-muted">
        {{ error.statusCode === 404 ? t('errors.card_not_found') : t('errors.unknown') }}
      </p>
      <UButton @click="goHome">
        {{ t('common.back') }}
      </UButton>
    </div>
  </UApp>
</template>
