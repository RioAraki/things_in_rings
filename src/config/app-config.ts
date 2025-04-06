/**
 * Application configuration
 * This file contains global configuration settings that can be adjusted by developers
 */

// Language configuration
export const LANGUAGE_CONFIG = {
  // Default language for the application
  // Options: 'en' (English), 'zh' (Chinese), etc.
  defaultLanguage: 'zh',
  
  // Whether to allow language detection from browser
  // Set to false to always use the defaultLanguage
  detectBrowserLanguage: false,
  
  // Fallback language if the default language is not available
  fallbackLanguage: 'en',
};

// Other application configuration settings can be added here
export const APP_CONFIG = {
  // Debug mode - enables additional logging and features
  debugMode: false,
  
  // Other global settings...
}; 