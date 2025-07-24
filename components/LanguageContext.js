import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(null);

  // Load language from storage when app starts
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('selectedLanguage');
        if (storedLang) {
          setLanguage(storedLang);
        }
      } catch (e) {
        console.log('Failed to load language from storage:', e);
      }
    };

    loadLanguage();
  }, []);

  // Save language to storage when it changes
  const changeLanguage = async (lang) => {
    try {
      await AsyncStorage.setItem('selectedLanguage', lang);
      setLanguage(lang);
    } catch (e) {
      console.log('Failed to save language:', e);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
