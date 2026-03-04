import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';

// Initialize i18next
const resources = {
  'pt-BR': { translation: ptBR },
  'en': { translation: en },
  'es': { translation: es }
};

const savedLanguage = localStorage.getItem('app-language') || 'pt-BR';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: savedLanguage, // language to use
    fallbackLng: 'en', // use en if detected lng is not available
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
