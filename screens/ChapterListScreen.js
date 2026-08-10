import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { getDBConnection, getUsers, getUsers1, getPreDBConnection, getDBConnection_local } from '../database/Database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLayout from '../components/AppLayout';
import { useLanguage } from '../components/LanguageContext';
import { use } from 'i18next';
import Icon from 'react-native-vector-icons/Ionicons';
// If using Expo instead of react-native-vector-icons, use this import:
// import Icon from '@expo/vector-icons/Ionicons';

// Friendly display labels for language codes (keep in sync with other screens)
const LANGUAGE_LABELS = {
  english: 'English',
  nepali: 'Nepali',
  hindi: 'हिन्दी',
  telugu: 'తెలుగు',
  swahili: 'Kiswahili',
};

const getLanguageLabel = (code) => {
  if (!code) return '';
  return LANGUAGE_LABELS[code] || code.charAt(0).toUpperCase() + code.slice(1);
};

const ChapterListScreen = ({ navigation, route }) => {
  // const { t } = useTranslation();

  const { section = 1 } = route.params || {};
  console.log("This is chapter list screen: " + section)
  //   const { i18n } = useTranslation();
  const [chapters, setChapters] = useState([]);
  const [lastReadChapter, setLastReadChapter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { language, isLoading: isLanguageLoading, hasLanguageSet } = useLanguage();
  const [loading, setLoading] = useState(true);

  // Actual rendered height of the bottom tab bar (includes safe-area adjustments).
  // NOTE: this only works if ChapterListScreen is rendered inside a Tab.Navigator
  // (directly, or nested inside a Stack that itself sits inside the tab navigator).
  // If this screen is NOT under a Tab.Navigator, this hook will throw — see the
  // fallback note at the bottom of this file for what to use instead.
  const tabBarHeight = useBottomTabBarHeight();



  useEffect(() => {
    if (!language || isLanguageLoading) return;

    setLoading(true);

    // fetching from local database from firebase
    console.log("language from chapter list screen: " + language);
    getDBConnection_local(language).then((db) => {
      getUsers(db, 'chapters').then((users) => {
        // console.log("This is chapter List::::::: " + users)
        // console.log("chapter in Json: " + JSON.stringify(users))
        setChapters(users);
        setLoading(false);
        // console.log("This is chapter List::::::: " + users)
      });
    });

    // fetching from local database from firebase

    //code for fetching last read and showing modal
    const fetchLastRead = async () => {
      try {
        const stored = await AsyncStorage.getItem('lastReadChapter');
        if (stored) {
          setLastReadChapter(parseInt(stored, 10));
          setShowModal(false); // setting false temporarily to avoid showing modal on initial load
        }
      } catch (e) {
        console.log('Error loading last chapter:', e);
      }
    };

    fetchLastRead();
    //code for fetching last read and showing modal

  }, []);


  useEffect(() => {
    if (!language || isLanguageLoading) return;
    setLoading(true);
    // fetching from local database from firebase
    console.log("language from chapter list screen: " + language);
    getDBConnection_local(language).then((db) => {
      getUsers(db, 'chapters').then((users) => {
        setChapters(users);
        setLoading(false);
      });
    });

  }, [language, isLanguageLoading]);

  // Safety net: if this tab is reached directly (e.g. a first-time user taps
  // the ChapterList tab bar icon before ever selecting a language), redirect
  // to the Language selector instead of sitting on a spinner forever.
  useEffect(() => {
    if (isLanguageLoading) return;
    if (!hasLanguageSet) {
      console.log("ChapterListScreen: no language set, redirecting to Language tab");
      navigation.navigate('Language');
    }
  }, [hasLanguageSet, isLanguageLoading, navigation]);

  const handleContinue = () => {
    setShowModal(false);
    navigation.navigate('ChapterContent', { chapterId: lastReadChapter });
  };

  const filterChaptersBySection = (section) => {
    return chapters.filter((chapters) => chapters.section === section);
  };

  const handleStartFromBeginning = () => {
    setShowModal(false);
    navigation.navigate('ChapterContent', { chapterId: 1 });
  };


  console.log("this is rendering page")

  const sectionChapters = filterChaptersBySection(section);
  const isEmptyOrLoading = loading || sectionChapters.length === 0;

  return (
    <AppLayout>
      <View style={styles.container}>
        <Text style={styles.title}>Chapters</Text>

        {language && (
          <View style={styles.languageBadgeContainer}>
            <View style={styles.languageBadge}>
              <Icon name="language-outline" size={14} color="#4CAF50" style={styles.languageBadgeIcon} />
              <Text style={styles.languageBadgeText}>{getLanguageLabel(language)}</Text>
            </View>
          </View>
        )}

        {isEmptyOrLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="green" style={styles.spinner} />
            <Text style={styles.loadingText}>
              Loading chapters{language ? ` for ${getLanguageLabel(language)}` : ''}...
            </Text>
          </View>
        ) : (
          <FlatList
            data={sectionChapters}
            keyExtractor={(item) => String(item.id)}
            style={styles.liststyle}
            contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 20 }]}
            renderItem={({ item }) => {
              const isSubchapter = item.parent_chapter != null;
              return (
                <TouchableOpacity
                  style={[styles.chapter, isSubchapter && styles.subchapterCard]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('ChapterContent', { chapterId: item.id, language: language })}
                >
                  <View style={[styles.chapterIconBadge, isSubchapter && styles.subchapterIconBadge]}>
                    <Icon
                      name={isSubchapter ? 'document-text-outline' : 'book-outline'}
                      size={isSubchapter ? 14 : 18}
                      color="#4CAF50"
                    />
                  </View>
                  <Text
                    style={[
                      styles.chapterText,
                      isSubchapter ? styles.subchapter : styles.listTitle,
                    ]}
                  >
                    {(item.default_title).trim()}
                  </Text>
                  <Icon name="chevron-forward" size={18} color="#bbb" />
                </TouchableOpacity>
              );
            }}
          />
        )}

        <Modal
          visible={showModal}
          transparent
          animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalBox}>
              <View style={styles.modalIconBadge}>
                <Icon name="bookmark" size={22} color="#4CAF50" />
              </View>
              <Text style={styles.modalText}>
                Continue reading from Chapter {lastReadChapter}?
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.modalPrimaryButton}
                  activeOpacity={0.7}
                  onPress={handleContinue}
                >
                  <Icon name="play-outline" size={16} color="white" style={styles.modalButtonIcon} />
                  <Text style={styles.modalPrimaryButtonText}>Continue</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSecondaryButton}
                  activeOpacity={0.7}
                  onPress={handleStartFromBeginning}
                >
                  <Icon name="refresh-outline" size={16} color="#4CAF50" style={styles.modalButtonIcon} />
                  <Text style={styles.modalSecondaryButtonText}>Start Over</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalTertiaryButton}
                  activeOpacity={0.7}
                  onPress={() => setShowModal(false)}
                >
                  <Icon name="list-outline" size={16} color="#666" style={styles.modalButtonIcon} />
                  <Text style={styles.modalTertiaryButtonText}>Let Me Choose</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgb(255, 255, 255)',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 4,
    textAlign: 'center',
    color: '#333',
  },
  languageBadgeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF5020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  languageBadgeIcon: {
    marginRight: 6,
  },
  languageBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  liststyle: {
    flex: 1,
  },
  listContent: {
    // paddingBottom is applied inline using the live tab bar height (see contentContainerStyle above)
  },
  chapter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    // FIX: elevation + borderRadius is a known RN 0.77 Android bug — the
    // shadow renders as a distorted rectangle instead of following the
    // rounded corners, showing up as a dark box around the card. boxShadow
    // (New Architecture, already enabled) is correct on both platforms.
    boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 4, color: 'rgba(0, 0, 0, 0.1)' }],
  },
  subchapterCard: {
    marginLeft: 16,
    backgroundColor: '#fafafa',
  },
  chapterIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF5020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subchapterIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  chapterText: {
    flex: 1,
    fontSize: 18,
    textTransform: 'capitalize',
  },
  listTitle: {
    color: 'rgb(6, 103, 54)',
    fontWeight: 'bold',
  },
  subchapter: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 10, color: 'rgba(0, 0, 0, 0.15)' }],
  },
  modalIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF5020',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },
  modalButtonIcon: {
    marginRight: 6,
  },
  modalPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 20,
    boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 4, color: 'rgba(76, 175, 80, 0.3)' }],
  },
  modalPrimaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF5015',
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 20,
  },
  modalSecondaryButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalTertiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 20,
  },
  modalTertiaryButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default ChapterListScreen;