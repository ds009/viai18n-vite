import { createFilter } from '@rollup/pluginutils';
import processI18n from "./processI18n";
import {chineseRegex} from "./utils";
const fileRegex = /((\.vue)|(\/composables\/.*\.js))$/

export default function vitePluginVueViai18n(options) {
  if (!options.languages || !options.languages.length) {
    // languages must be set
    throw new Error('no languages are given in options')
  }
  const filter = createFilter(null, [/(node_modules)|(\.nuxt)/].concat(options.exclude||[]));
  return {
    name: 'replace-i18n-text',
    enforce: 'pre',
    transform(src, fileId, viteOption) {
      const id = fileId.replace('?macro=true','')
      if (!filter(id)) return;
      if (!fileRegex.test(id)) return;
      if(/\/\*\s+viai18n-disable\s+\*\//.test(src)) {
        return;
      }

      // use regString to find targets
      const matchRegex = options.regex || chineseRegex

      if (!matchRegex.test(src)) return;

      const result = processI18n(src.slice(), id , options.languages, matchRegex, process.env.NODE_ENV === 'development' && !viteOption.ssr)
      return {
        code: result,
        map: { mappings: '' }
      }
    },
  }
}
