<script setup lang="ts">
// The copy for an AI of the overview: shows the selection and the options, previews the text that the server builds, and
// copies it to the clipboard or saves it as a text file.
interface AiResult {
  text: string
  fileName: string
  total: number
  distinct: number
}

const props = defineProps<{
  /** The selection as short texts: game, owner, status, sort order, search and further filters. */
  summary: string[]
  /** The filters and the sort order of the overview as a query string (every page). */
  query: string
}>()
const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()
const toast = useToast()

const onlyActive = ref(true)
const withText = ref(true)
const intro = ref(true)
const wish = ref('')
const WISH_MAX = 500

// Where the helper field of the old way of copying goes: inside the dialog, because the dialog keeps the focus.
const body = ref<HTMLElement>()
const result = ref<AiResult | null>(null)
const loading = ref(false)
const failed = ref(false)

// A newer request makes an older answer obsolete (the options change faster than the server answers).
let requestId = 0
async function load() {
  const id = ++requestId
  loading.value = true
  failed.value = false
  const params = new URLSearchParams(props.query)
  params.set('onlyActive', String(onlyActive.value))
  params.set('withText', String(withText.value))
  params.set('intro', String(intro.value))
  if (intro.value && wish.value.trim()) {
    params.set('wish', wish.value.trim())
  }
  try {
    const answer = await $fetch<AiResult>(`/api/export/ai?${params.toString()}`)
    if (id === requestId) {
      result.value = answer
    }
  }
  catch {
    if (id === requestId) {
      failed.value = true
      result.value = null
    }
  }
  finally {
    if (id === requestId) {
      loading.value = false
    }
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
watch([open, onlyActive, withText, intro, wish], () => {
  clearTimeout(timer)
  if (open.value) {
    // The wish is typed; the other options wait a moment as well, which does no harm.
    timer = setTimeout(load, 250)
  }
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(timer))

const PREVIEW_CHARS = 1500
const preview = computed(() => {
  const text = result.value?.text ?? ''
  return text.length > PREVIEW_CHARS ? `${text.slice(0, PREVIEW_CHARS)}\n…` : text
})
const characters = computed(() => result.value?.text.length ?? 0)
// A rough indication: one token is about four characters.
const tokens = computed(() => Math.round(characters.value / 4))
const empty = computed(() => !loading.value && !failed.value && (result.value?.total ?? 0) === 0)
const ready = computed(() => !loading.value && (result.value?.total ?? 0) > 0)

/** Copies text; the clipboard API needs https or localhost, so a plain http address falls back to the old way. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  }
  catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    const host = body.value ?? document.body
    host.appendChild(area)
    area.focus()
    area.select()
    try {
      return document.execCommand('copy')
    }
    catch {
      return false
    }
    finally {
      area.remove()
    }
  }
}

async function copy() {
  if (!result.value) {
    return
  }
  if (await copyText(result.value.text)) {
    toast.add({ title: t('export.ai.copied'), color: 'success' })
    open.value = false
  }
  else {
    toast.add({ title: t('export.ai.copyFailed'), color: 'warning' })
  }
}

function download() {
  if (!result.value) {
    return
  }
  const url = URL.createObjectURL(new Blob([result.value.text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = result.value.fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" :title="t('export.ai.title')">
    <template #body>
      <div ref="body" class="flex flex-col gap-4 text-sm">
        <div class="rounded-lg bg-elevated px-3 py-2.5" data-test="ai-selection">
          <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {{ t('export.selection') }}
          </p>
          <p>
            {{ summary.join(' · ') }}<template v-if="result"> · <strong>{{ t('export.cards', { n: result.total }, result.total) }}</strong></template>
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <UCheckbox v-model="onlyActive" :label="t('export.ai.onlyActive')" data-test="ai-only-active" />
          <UCheckbox v-model="withText" :label="t('export.ai.withText')" data-test="ai-with-text" />
          <UCheckbox v-model="intro" :label="t('export.ai.intro')" data-test="ai-intro" />
        </div>

        <UFormField v-if="intro" :label="t('export.ai.wish')" :hint="`${wish.length}/${WISH_MAX}`">
          <UTextarea v-model="wish" :rows="2" :maxlength="WISH_MAX" :placeholder="t('export.ai.wishPlaceholder')" class="w-full" data-test="ai-wish" />
        </UFormField>

        <UAlert v-if="failed" color="error" variant="subtle" :title="t('export.ai.loadFailed')" data-test="ai-failed" />
        <UAlert v-else-if="empty" color="warning" variant="subtle" :title="t('export.empty')" data-test="ai-empty" />
        <div v-else>
          <p class="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wide text-muted">
            <span>{{ t('export.ai.preview') }}</span>
            <span v-if="result" class="font-normal normal-case" data-test="ai-size">{{ t('export.ai.size', { characters, tokens }) }}</span>
          </p>
          <pre class="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-default bg-elevated p-3 text-xs" data-test="ai-preview">{{ loading && !result ? t('common.loading') : preview }}</pre>
        </div>
      </div>
    </template>
    <template #footer>
      <!-- On the right, the main action first. -->
      <div class="flex w-full justify-end gap-2">
        <UButton icon="i-lucide-copy" :disabled="!ready" data-test="ai-copy" @click="copy">
          {{ t('export.ai.copy') }}
        </UButton>
        <UButton color="neutral" variant="outline" icon="i-lucide-download" :disabled="!ready" data-test="ai-download" @click="download">
          {{ t('export.download') }}
        </UButton>
        <UButton color="neutral" variant="ghost" data-test="ai-cancel" @click="open = false">
          {{ t('common.cancel') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
