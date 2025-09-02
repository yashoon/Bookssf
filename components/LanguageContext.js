import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys constants
const STORAGE_KEYS = {
  SELECTED_LANGUAGE: 'selectedLanguage'
};

// Default configuration
const DEFAULT_LANGUAGE = null; // Set to null to indicate no default language
const SUPPORTED_LANGUAGES = ['english', 'telugu', 'nepali', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'];

// Create the context
export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(false); // Set to true when no valid language is found

  // Load language from storage when app starts
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const storedLang = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_LANGUAGE);
        
        if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang)) {
          setLanguage(storedLang);
          setIsFirstTime(false);
          console.log(`Loaded existing language: ${storedLang}`);
        } else {
          // If stored language is invalid or doesn't exist, set default
          // setLanguage(DEFAULT_LANGUAGE);
          setLanguage(null);
          setIsFirstTime(true);
          console.log('No language set - first time user or invalid language');
          

          // Clear any invalid data
          if (storedLang) {
            await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_LANGUAGE);
            console.log('Cleared invalid language data:', storedLang);
          }
          // Save default to storage for consistency
          // await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_LANGUAGE, DEFAULT_LANGUAGE);
        }
      } catch (e) {
        // console.error('Failed to load language from storage:', e);
        // setError('Failed to load language settings');
        // setLanguage(DEFAULT_LANGUAGE); // Fallback to default
        console.error('Failed to load language from storage:', e);
        setError('Failed to load language settings');
        setLanguage(null);
        setIsFirstTime(true);
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
      console.warn(`Unsupported language: ${newLanguage}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
      throw new Error(`Unsupported language: ${newLanguage}`);
    }

    try {
      setError(null);
      
      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_LANGUAGE, newLanguage);
      
      // Update state
      setLanguage(newLanguage);
      setIsFirstTime(false); // No longer first time after setting language
      
      console.log(`Language changed to: ${newLanguage}`);
    } catch (e) {
      console.error('Failed to save language:', e);
      setError('Failed to save language settings');
      throw e; // Re-throw so calling code can handle it
      // Still update the state even if storage fails
      // setLanguage(newLanguage);
    }
  };

  // Reset language to default
  const resetLanguage = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_LANGUAGE);
      setLanguage(null);
      setIsFirstTime(true);
      setError(null);
      console.log('Language reset - user will need to select again');
    } catch (e) {
      console.error('Failed to reset language:', e);
      setError('Failed to reset language');
    }
  };

  // Clear all language data
  const clearLanguageData = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_LANGUAGE);
      setLanguage(null);
      setIsFirstTime(true);
      setError(null);
      console.log('Language data cleared');
    } catch (e) {
      console.error('Failed to clear language data:', e);
      setError('Failed to clear language data');
    }
  };

  // Get language info
    // Get language info
    const getLanguageInfo = () => {
      if (!language) {
        return {
          code: null,
          name: 'No language selected',
          isRTL: false
        };
      }
  
      const languageNames = {
        english: 'English',
        nepali: 'नेपाली', // Nepali in Devanagari
        telugu: 'తెలుగు'  // Telugu in Telugu script
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
    isFirstTime,
    
    // Actions
    setLanguage: changeLanguage,
    resetLanguage,
    clearLanguageData,
    
    // Utilities
    getLanguageInfo,
    supportedLanguages: SUPPORTED_LANGUAGES,
    // defaultLanguage: DEFAULT_LANGUAGE,
    
    // Helper functions
    isLanguageSupported: (lang) => SUPPORTED_LANGUAGES.includes(lang),
    hasLanguageSet: !!language, // Boolean helper - true if language is set
    needsLanguageSelection: !language && !isLoading, // Helper for navigation logic
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
// Hook for automatic language navigation detection
export const useLanguageNavigation = () => {
  const { 
    language, 
    isLoading, 
    isFirstTime, 
    hasLanguageSet, 
    needsLanguageSelection 
  } = useLanguage();

  return {
    language,
    isLoading,
    isFirstTime,
    hasLanguageSet,
    needsLanguageSelection,
    shouldRedirectToLanguageSelector: needsLanguageSelection
  };
};