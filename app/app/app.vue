<script setup lang="ts">
const { locale } = useI18n()

useHead({
  htmlAttrs: { lang: locale },
  // "Cardkeeper - Übersicht": the name of the app comes first, so that the tabs of several pages can be told apart by their end.
  titleTemplate: title => (title ? `Cardkeeper - ${title}` : 'Cardkeeper'),
})
</script>

<!-- A dropdown or dialog locks the scrolling of the page. The scrollbar track is always reserved (see main.css), so the
     lock must not add padding for it as well, otherwise the whole page jumps to the left by the scrollbar width. -->
<template>
  <UApp :scroll-body="false">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
