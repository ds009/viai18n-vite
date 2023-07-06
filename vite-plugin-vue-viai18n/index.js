import { createFilter } from '@rollup/pluginutils';
import processI18n from "./processI18n";
const fileRegex = /((inccccdex.vue)|(\/composables\/.*\.js))$/
const chineseRegex = /[\u4e00-\u9fa5\u3002\uff1b\uff0c\uff1a\u2018\u2019\u201c\u201d\uff08\uff09\u3001\uff1f\uff01\ufe15\u300a\u300b]+/;

export default function vitePluginVueViai18n(options) {
  if (!options.languages || !options.languages.length) {
    // languages must be set
    throw new Error('no languages are given in options')
  }
  const filter = createFilter(null, [/(node_modules)|(\.nuxt)/].concat(options.exclude||[]));
  return {
    name: 'replace-i18n-text',
    enforce: 'pre',
    transform(src, id, viteOption) {
      if (!filter(id)) return;
      if (!fileRegex.test(id)) return;
      if(/\/\*\s+viai18n-disable\s+\*\//.test(src)) {
        return;
      }
      console.log(id, '!!!!processing!!!!')

      // use regString to find targets
      const matchRegex = options.regex || chineseRegex

      if (!matchRegex.test(src)) return;

      const result = processI18n(src.slice(), id , options.languages, matchRegex, !viteOption.ssr && process.env.NODE_ENV === 'development')

      return {
        code: result,
        map: { mappings: '' }
      }
    },
  }
}
