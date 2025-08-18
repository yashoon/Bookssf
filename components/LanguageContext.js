import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys constants
const STORAGE_KEYS = {
  SELECTED_LANGUAGE: 'selectedLanguage'
};

// Default configuration
const DEFAULT_LANGUAGE = 'english';
const SUPPORTED_LANGUAGES = ['english', 'telugu', 'nepali', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'];

// Create the context
export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load language from storage when app starts
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const storedLang = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_LANGUAGE);
        
        if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang)) {
          setLanguage(storedLang);
        } else {
          // If stored language is invalid or doesn't exist, set default
          setLanguage(DEFAULT_LANGUAGE);
          
          // Save default to storage for consistency
          await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_LANGUAGE, DEFAULT_LANGUAGE);
        }
      } catch (e) {
        console.error('Failed to load language from storage:', e);
        setError('Failed to load language settings');
        setLanguage(DEFAULT_LANGUAGE); // Fallback to default
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  // Save language to storage when it changes
  const changeLanguage = async (newLanguage) => {
    // Validate the language
    if (!SUPPORTED_LANGUAGES.includes(newLanguage)) {
      console.warn(`Unsupported language: ${newLanguage}. Using default: ${DEFAULT_LANGUAGE}`);
      newLanguage = DEFAULT_LANGUAGE;
    }

    try {
      setError(null);
      
      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_LANGUAGE, newLanguage);
      
      // Update state
      setLanguage(newLanguage);
      
      console.log(`Language changed to: ${newLanguage}`);
    } catch (e) {
      console.error('Failed to save language:', e);
      setError('Failed to save language settings');
      
      // Still update the state even if storage fails
      setLanguage(newLanguage);
    }
  };

  // Reset language to default
  const resetLanguage = async () => {
    await changeLanguage(DEFAULT_LANGUAGE);
  };

  // Clear all language data
  const clearLanguageData = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_LANGUAGE);
      setLanguage(DEFAULT_LANGUAGE);
      setError(null);
      console.log('Language data cleared');
    } catch (e) {
      console.error('Failed to clear language data:', e);
      setError('Failed to clear language data');
    }
  };

  // Get language info
  const getLanguageInfo = () => {
    const languageNames = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      zh: '中文',
      ja: '日本語',
      ko: '한국어',
      ar: 'العربية'
    };

    return {
      code: language,
      name: languageNames[language] || 'Unknown',
      isRTL: language === 'ar' // Add RTL support
    };
  };

  const contextValue = {
    // State
    language,
    isLoading,
    error,
    
    // Actions
    setLanguage: changeLanguage,
    resetLanguage,
    clearLanguageData,
    
    // Utilities
    getLanguageInfo,
    supportedLanguages: SUPPORTED_LANGUAGES,
    defaultLanguage: DEFAULT_LANGUAGE,
    
    // Helper function to check if language is supported
    isLanguageSupported: (lang) => SUPPORTED_LANGUAGES.includes(lang)
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for using the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};

// Higher-order component for class components (if needed)
export const withLanguage = (WrappedComponent) => {
  return (props) => {
    const languageContext = useLanguage();
    return <WrappedComponent {...props} languageContext={languageContext} />;
  };
};

// Hook for getting translations (optional - for more advanced usage)
export const useTranslations = (translations) => {
  const { language } = useLanguage();
  
  return translations[language] || translations[DEFAULT_LANGUAGE] || {};
};