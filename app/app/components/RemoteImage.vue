<script setup lang="ts">
import { imageCandidates } from '#shared/utils/image-fallback'

// An image of the card database that may be missing: it tries the next format and, when none loads, leaves an empty
// box of the same size instead of the browser's broken-image icon.
defineOptions({ inheritAttrs: false })
const props = defineProps<{ src: string, alt?: string }>()

const candidates = computed(() => imageCandidates(props.src))
const attempt = ref(0)
watch(() => props.src, () => {
  attempt.value = 0
})
</script>

<template>
  <img
    v-if="attempt < candidates.length"
    v-bind="$attrs"
    :src="candidates[attempt]"
    :alt="alt ?? ''"
    referrerpolicy="no-referrer"
    @error="attempt++"
  >
  <span v-else v-bind="$attrs" class="inline-block" />
</template>
