// screens/SearchScreen.js
import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDBConnection_local, getPreDBConnection, getUsers } from '../database/Database';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppLayout from '../components/AppLayout';
import { useLanguage } from '../components/LanguageContext';
import { RenderHTML } from 'react-native-render-html';
import Icon from 'react-native-vector-icons/Ionicons';
// If using Expo instead of react-native-vector-icons, use this import:
// import Icon from '@expo/vector-icons/Ionicons';

const MIN_QUERY_LENGTH = 3;

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const { width } = useWindowDimensions();
  const [allChapters, setAllChapters] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);
  const [hasSearched, setHasSearched] = useState(false); // true once a valid (>=3 char) search has run
  const [isLoadingChapters, setIsLoadingChapters] = useState(false); // background fetch of source data
  const [isSearching, setIsSearching] = useState(false); // actively filtering after a keystroke
  const navigation = useNavigation();
  const { language, isLoading: isLanguageLoading } = useLanguage();
  const [chapterTitles, setChapterTitles] = useState({}); // chapters.id -> default_title

  // Search now lives in the root Stack.Navigator (opened from the header's
  // search icon), not inside the Tab.Navigator — so there's no tab bar to
  // clear here. useSafeAreaInsets() gives the device's actual bottom inset
  // (home indicator on iPhones, gesture bar on Android) instead.
  const insets = useSafeAreaInsets();


  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchData = async () => {
        if (!language || isLanguageLoading) return; // Wait for language to be loaded

        try {
          setIsLoadingChapters(true);
          console.log("Fetching chapters for language:", language);

          const db = await getDBConnection_local(language);
          const chapters = await getUsers(db, 'contents');
          // alongside your contents fetch:
          const chaptersList = await getUsers(db, 'chapters');
          const titleMap = {};
          chaptersList.forEach((ch) => {
            titleMap[ch.id] = ch.default_title;
          });
          setChapterTitles(titleMap);

          if (isActive) {
            setAllChapters(chapters);
            console.log("Fetched chapters:", chapters);
          }
        } catch (e) {
          console.log('Error fetching chapters:', e);
        } finally {
          if (isActive) {
            setIsLoadingChapters(false);
          }
        }
      };

      fetchData();

      return () => {
        isActive = false; // cleanup on unmount
      };
    }, [language, isLanguageLoading])
  );

  useEffect(() => {
    if (!language || isLanguageLoading) return;

    const fetchChapters = async () => {
      try {
        setIsLoadingChapters(true);
        console.log("Language changed, fetching chapters for:", language);
        const db = await getDBConnection_local(language);
        const chapters = await getUsers(db, 'contents');

        setAllChapters(chapters);
        console.log("Fetched chapters for language change:", chapters.length);
      } catch (e) {
        console.log('Error fetching chapters on language change:', e);
      } finally {
        setIsLoadingChapters(false);
      }
    };

    fetchChapters();
  }, [language]);

  // Only filter (and only show results) once the query hits the minimum length.
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < MIN_QUERY_LENGTH) {
      setFilteredChapters([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    const handle = setTimeout(() => {
      const filtered = allChapters.filter((item) =>
        item.content.toLowerCase().includes(trimmed.toLowerCase())
      );
      setFilteredChapters(filtered);
      setIsSearching(false);
    }, 150);

    return () => clearTimeout(handle);
  }, [query, allChapters]);

  const getSnippet = (html, keyword) => {
    const text = html.replace(/<[^>]+>/g, ''); // strip HTML
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());

    if (index === -1) return text.slice(0, 100) + '...';

    const start = Math.max(0, index - 40);
    const end = Math.min(text.length, index + 250);

    return text.slice(start, end) + '...';
  };

  const stripHtml = (html) => {
    if (!html) return "";
    return html
      // remove style/script tags and their content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      // remove all HTML tags
      .replace(/<\/?[^>]+(>|$)/g, "")
      // decode HTML entities like &nbsp; &amp;
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      // trim extra spaces/newlines
      .trim();
  };

  // Escapes regex special characters in the user's query so symbols like
  // "." or "(" in a search term don't break the highlight match.
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Wraps every case-insensitive occurrence of `keyword` in the plain-text
  // snippet with a <mark> tag, so RenderHTML can style it distinctly.
  const highlightSnippet = (snippetText, keyword) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return snippetText;

    const pattern = new RegExp(`(${escapeRegExp(trimmedKeyword)})`, 'gi');
    return snippetText.replace(pattern, '<mark>$1</mark>');
  };

  const charsRemaining = MIN_QUERY_LENGTH - query.trim().length;
  const matchCount = filteredChapters.length;

  const renderEmptyState = () => {
    if (query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="text-outline" size={40} color="#bbb" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>
            Type {charsRemaining} more character{charsRemaining === 1 ? '' : 's'} to search
          </Text>
        </View>
      );
    }

    if (!hasSearched && query.trim().length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="search-outline" size={40} color="#bbb" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>Search for a word or phrase to get started</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name="file-tray-outline" size={40} color="#bbb" style={styles.emptyIcon} />
        <Text style={styles.emptyText}>No content found. Try different keywords.</Text>
      </View>
    );
  };

  return (
    <AppLayout title="Search" showSearchIcon={false} showBackButton={true}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            placeholder={`Search (min. ${MIN_QUERY_LENGTH} characters)`}
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#4CAF50" style={styles.searchSpinner} />
          )}
          {!isSearching && query.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setQuery('')}>
              <Icon name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Match count badge — only shown once a real (>=3 char) search has resolved */}
        {hasSearched && !isSearching && (
          <View style={styles.matchCountContainer}>
            <View style={styles.matchCountBadge}>
              <Icon name="checkmark-done-outline" size={13} color="#4CAF50" style={styles.matchCountIcon} />
              <Text style={styles.matchCountText}>
                {matchCount} {matchCount === 1 ? 'match' : 'matches'} found
              </Text>
            </View>
          </View>
        )}

        {isLoadingChapters && !hasSearched ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="green" style={styles.spinner} />
            <Text style={styles.loadingText}>Preparing search index...</Text>
          </View>
        ) : (
          <FlatList
            data={hasSearched ? filteredChapters : []}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
            renderItem={({ item }) => {
              const plainSnippet = getSnippet(stripHtml(item.content), query);
              const highlightedSnippet = highlightSnippet(plainSnippet, query);

              return (
                <TouchableOpacity
                  style={styles.resultCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("Shepherd's Staff", {
                      screen: 'ChapterContent',
                      params: { chapterId: item.id, language: language },
                    })
                  }
                >
                  <View style={styles.resultHeader}>
                    <View style={styles.resultIconBadge}>
                      <Icon name="document-text-outline" size={16} color="#4CAF50" />
                    </View>
                    <Text style={styles.chapterTitle} numberOfLines={1}>
                          {chapterTitles[item.id] || `Chapter ${item.id}`}
                    </Text>
                    <Icon name="chevron-forward" size={18} color="#bbb" />
                  </View>
                  <View style={styles.snippetContainer}>
                    <RenderHTML
                      contentWidth={width - 64}
                      source={{ html: highlightedSnippet }}
                      baseStyle={styles.snippetBaseStyle}
                      tagsStyles={htmlTagStyles}
                    />
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
    </AppLayout>
  );
};

// Styles for HTML tags rendered inside RenderHTML. `mark` is the tag we
// inject around matched search terms in highlightSnippet().
const htmlTagStyles = {
  mark: {
    backgroundColor: '#4CAF5030',
    color: '#1b5e20',
    fontWeight: '700',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgb(255, 255, 255)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  searchSpinner: {
    marginLeft: 4,
  },
  clearButton: {
    padding: 6,
  },
  matchCountContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  matchCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF5015',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  matchCountIcon: {
    marginRight: 6,
  },
  matchCountText: {
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
  listContent: {
    flexGrow: 1,
  },
  resultCard: {
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF5020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  chapterTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: 'rgb(6, 103, 54)',
  },
  snippetContainer: {
    paddingLeft: 38, // aligns with the title text, past the icon badge
  },
  snippetBaseStyle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});

export default SearchScreen;