<script setup lang="ts">
import { passwordProblem, PASSWORD_MIN_LENGTH } from '#shared/utils/users'

const { t } = useI18n()
const toast = useToast()
const apiError = useApiError()
const auth = useAuth()

useHead({ title: () => t('account.title') })

const forced = computed(() => auth.user.value?.mustChangePassword === true)

const current = ref('')
const next = ref('')
const repeat = ref('')
const saving = ref(false)
const error = ref('')

const problem = computed(() => (next.value === '' ? null : passwordProblem(next.value)))
const mismatch = computed(() => repeat.value !== '' && repeat.value !== next.value)

async function submit() {
  error.value = ''
  if (problem.value || mismatch.value || next.value !== repeat.value) {
    error.value = problem.value ? t(`errors.password_${problem.value}`, { min: PASSWORD_MIN_LENGTH }) : t('account.mismatch')
    return
  }
  saving.value = true
  try {
    await auth.changePassword(current.value, next.value)
    toast.add({ title: t('account.changed'), color: 'success' })
    current.value = next.value = repeat.value = ''
    await navigateTo('/')
  }
  catch (failure) {
    error.value = apiError(failure)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md px-4 pb-12 pt-8">
    <h1 class="mb-2 text-2xl font-semibold">
      {{ forced ? t('account.chooseTitle') : t('account.title') }}
    </h1>
    <p v-if="forced" class="mb-5 text-sm text-muted" data-test="forced-hint">
      {{ t('account.forcedHint', { min: PASSWORD_MIN_LENGTH }) }}
    </p>
    <p v-else class="mb-5 text-sm text-muted">
      {{ t('account.hint', { min: PASSWORD_MIN_LENGTH }) }}
    </p>

    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <UFormField :label="forced ? t('account.initial') : t('account.current')">
        <UInput v-model="current" type="password" autocomplete="current-password" required class="w-full" data-test="current-password" />
      </UFormField>
      <UFormField :label="t('account.new')">
        <UInput v-model="next" type="password" autocomplete="new-password" required class="w-full" data-test="new-password" />
      </UFormField>
      <UFormField :label="t('account.repeat')">
        <UInput v-model="repeat" type="password" autocomplete="new-password" required class="w-full" data-test="repeat-password" />
      </UFormField>
      <p v-if="error" class="text-sm text-error" role="alert" data-test="account-error">
        {{ error }}
      </p>
      <div>
        <UButton type="submit" :loading="saving" data-test="account-submit">
          {{ t('account.submit') }}
        </UButton>
      </div>
    </form>
  </div>
</template>
