import {useI18nStore} from "~/stores/i18n";

export default defineNuxtPlugin({
  async setup (nuxtApp) {
    const i18nStore = useI18nStore();
    nuxtApp.provide('lang', computed(() => {
     return  i18nStore.lang
    }))
  },
})
