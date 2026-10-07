<script setup lang="ts">
const { t, locale } = useI18n()

useHead({
  htmlAttrs: { lang: locale },
  titleTemplate: title => (title ? `${title} · ${t('app.title')}` : t('app.title')),
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
