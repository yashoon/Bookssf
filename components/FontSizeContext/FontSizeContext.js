// FontSizeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';

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
        // Alert.alert(
        //     'Font Size Changed first',
        //     `Font size has been changed to ${fontSize}`,
        //     [{ text: 'OK' }],
        //   );
      }, []);
    
      // Save font size to AsyncStorage whenever it changes
      useEffect(() => {
        // Alert.alert(
        //   'Font Size Changed',
        //   `Font size has been changed to ${fontSize}`,
        //   [{ text: 'OK' }],
        // );
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
