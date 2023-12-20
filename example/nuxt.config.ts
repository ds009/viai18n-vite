// https://nuxt.com/docs/api/configuration/nuxt-config
import Inspect from 'vite-plugin-inspect'
import vitePluginVueViai18n from '../vite-plugin-vue-viai18n'
import chineseS2T from 'chinese-s2t';

const languages = [
    {key: 'zh_Hans_CN'},
    {key: 'en_US'},
    {
        key: 'zh_Hant_HK', translator: matched => {
            // example to auto translate simplified chinese to traditional
            return chineseS2T.s2t(matched.replace(/^\[R\]+/, ''));
        },
    }]

export default defineNuxtConfig({
    devtools: {enabled: true},
    modules: [
        '@nuxtjs/tailwindcss',
        ['@pinia/nuxt', {
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
