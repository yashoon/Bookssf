// FontSizeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const FontSizeContext = createContext();

export const FontSizeProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState(16); // Default font size

    // Load saved font size from AsyncStorage
    useEffect(() => {
        const loadFontSize = async () => {
          try {
            const savedSize = await AsyncStorage.getItem('fontSize');
            if (savedSize !== null) {
              setFontSize(Number(savedSize));
            }
          } catch (e) {
            console.error('Failed to load font size:', e);
          }
        };
        loadFontSize();
      }, []);
    
      // Save font size to AsyncStorage whenever it changes
      useEffect(() => {
        AsyncStorage.setItem('fontSize', fontSize.toString());
      }, [fontSize]);

//   const increaseFont = () => setFontSize(prev => prev + 2);
//   const decreaseFont = () => setFontSize(prev => (prev > 10 ? prev - 2 : prev));
const increaseFont = () => {
    setFontSize(prev => {
      const newSize = prev + 2;
      Toast.show({
        type: 'success',
        text1: `Font size increased to ${newSize}`,
        position: 'bottom',
      });
      return newSize;
    });
  };
  
  const decreaseFont = () => {
    setFontSize(prev => {
      if (prev > 10) {
        const newSize = prev - 2;
        Toast.show({
            type: 'error',
            text1: `Font size decreased to ${newSize}`,
            position: 'bottom',
          });
        return newSize;
      }
      return prev;
    });
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, increaseFont, decreaseFont  }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => useContext(FontSizeContext);
