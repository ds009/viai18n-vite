export const useI18nStore = defineStore('i18n', {
  state: () => ({
      locales: [{
        value: 'en_US',
        text: 'English'
      },
        {
          value: 'zh_Hans_CN',
          text: '简体中文'
        },
        {
          value: 'zh_Hant_HK',
          text: '繁体中文'
        },
      ], // available locales
      lang: 'zh_Hans_CN',
  }),
  actions: {
    setLang(lang) {
      this.lang = lang
    },
  },
  getters: {
    currentLang: state => state.lang,
    availableLocales: state => state.locales,
    currentLangText: state => {
      const lang = state.locales.find(l => l.value === state.lang);
      return lang ? lang.text : ''
    },
  },
})
