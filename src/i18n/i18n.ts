import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { LANGUAGE_CONFIG } from '../config/app-config';

// Import translations
import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';

// Define resources
export const resources = {
  en: {
    translation: enTranslation,
  },
  zh: {
    translation: zhTranslation,
  },
};

// Configure i18n
const i18nInstance = i18n
  // Pass the i18n instance to react-i18next
  .use(initReactI18next);

// Only use language detector if configured to do so
if (LANGUAGE_CONFIG.detectBrowserLanguage) {
  i18nInstance.use(LanguageDetector);
}

// Initialize i18n
i18nInstance.init({
  resources,
  lng: LANGUAGE_CONFIG.defaultLanguage, // Set default language from config
  fallbackLng: LANGUAGE_CONFIG.fallbackLanguage, // Set fallback language from config
  debug: process.env.NODE_ENV === 'development',
  
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  
  // Language detection options - only used if detectBrowserLanguage is true
  detection: LANGUAGE_CONFIG.detectBrowserLanguage ? {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
  } : undefined,
});

export default i18n; 