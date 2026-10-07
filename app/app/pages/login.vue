<script setup lang="ts">
const { t } = useI18n()
const apiError = useApiError()
const auth = useAuth()
const route = useRoute()

definePageMeta({ layout: 'auth' })
useHead({ title: () => t('login.title') })

const name = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref('')

// Only paths of this app are followed after the login ("//host" and "http:" would leave it).
const target = computed(() => {
  const next = typeof route.query.next === 'string' ? route.query.next : '/'
  return next.startsWith('/') && !next.startsWith('//') ? next : '/'
})

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    const user = await auth.login(name.value, password.value)
    await navigateTo(user?.mustChangePassword ? '/account' : target.value)
  }
  catch (failure) {
    error.value = apiError(failure)
    password.value = ''
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="mx-auto flex max-w-sm flex-col gap-4 rounded-xl border border-default bg-default p-6" @submit.prevent="submit">
    <h2 class="text-lg font-semibold">
      {{ t('login.title') }}
    </h2>
    <UFormField :label="t('login.name')">
      <UInput v-model="name" autocomplete="username" autofocus required class="w-full" data-test="login-name" />
    </UFormField>
    <UFormField :label="t('login.password')">
      <UInput v-model="password" type="password" autocomplete="current-password" required class="w-full" data-test="login-password" />
    </UFormField>
    <p v-if="error" class="text-sm text-error" role="alert" data-test="login-error">
      {{ error }}
    </p>
    <UButton type="submit" :loading="submitting" block data-test="login-submit">
      {{ t('login.submit') }}
    </UButton>
    <p class="text-xs text-dimmed">
      {{ t('login.hint') }}
    </p>
  </form>
</template>
