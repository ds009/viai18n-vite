// https://nuxt.com/docs/api/configuration/nuxt-config
import Inspect from 'vite-plugin-inspect'
import vitePluginVueViai18n from '../vite-plugin-vue-viai18n'

const languages = ['zh_Hans_CN' , 'en_US', 'zh_Hant_HK']

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    ['@pinia/nuxt',{
      autoImports: [
        'defineStore',
      ],
    },],
    '@element-plus/nuxt'
  ],
  vite: {
    plugins: [
      vitePluginVueViai18n({
        languages,
      }), Inspect()
    ],
  }
})
