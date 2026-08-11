import englishCatalog from '../../../public/locales/en/common.json'
import kyrgyzCatalog from '../../../public/locales/kg/common.json'
import russianCatalog from '../../../public/locales/ru/common.json'
import turkishCatalog from '../../../public/locales/tr/common.json'

import type {TranslationCatalogs} from './translation-service'

const STATIC_TRANSLATION_CATALOGS = Object.freeze({
  en: englishCatalog,
  ky: kyrgyzCatalog,
  ru: russianCatalog,
  tr: turkishCatalog,
}) satisfies TranslationCatalogs

export {STATIC_TRANSLATION_CATALOGS}
