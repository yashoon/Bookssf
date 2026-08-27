import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
// If using Expo instead of react-native-vector-icons, use this import:
// import Icon from '@expo/vector-icons/Ionicons';

const WelcomeScreen = ({ navigation }) => {
  return (
    // FIX ("looks empty and lifeless"): a flat white background across all
    // three pre-auth screens (Welcome/Login/Signup) had no visual identity.
    // A soft, capped-saturation green (rather than the full-strength brand
    // #4CAF50) keeps this readable behind the existing dark-gray (#333)
    // text regardless of where it lands, since content is vertically
    // centered and its exact position over the gradient varies by device.
    <LinearGradient
      colors={['#A5D6A7', '#E8F5E9', '#FFFFFF']}
      locations={[0, 0.4, 0.75]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.container}>
      {/* FIX (iOS-only "white space left/right, content cut on right"):
          react-native-linear-gradient's native view doesn't correctly honor
          padding/alignItems applied directly to itself under Fabric/New
          Architecture on iOS (its CAGradientLayer bounds don't track that
          layout the same way Yoga computes it for a plain View) — see
          react-native-linear-gradient#575. Login/Signup were unaffected
          because their padding already lives on an inner ScrollView, not on
          the gradient itself; Welcome had it directly on the gradient, so
          it's moved to this inner plain View instead. */}
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={require('../assets/SS_Icon.png')} style={styles.image} />
        </View>

        <Text style={styles.appName}>Shepherd's Staff</Text>
        {/* LOGO THEME: same gold accent rule used on Login, for
            consistency across the pre-auth flow. */}
        <View style={styles.titleAccent} />
        <Text style={styles.tagline}>A resource for every season of ministry</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="shield-checkmark-outline" size={16} color="#4CAF50" style={styles.infoIcon} />
            <Text style={styles.bookMeta}>© World MAP, 1993. All rights reserved.</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Icon name="people-outline" size={16} color="#4CAF50" style={styles.infoIcon} />
            <View style={styles.infoTextGroup}>
              <Text style={styles.publishLabel}>Facilitated By</Text>
              <Text style={styles.publishHouse}>The True Grace Ministries</Text>
              <Text style={styles.publishLink}>www.ttgm.org</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Icon name="information-circle-outline" size={16} color="#999" style={styles.infoIcon} />
            <Text style={styles.publishNote}>
              This app is copyright protected and authorized by the World Map organization.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Shepherd's Staff")}
        >
          <Text style={styles.buttonText}>Start Reading</Text>
          <Icon name="arrow-forward" size={18} color="#fff" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  image: {
    width: 160,
    height: 160,
    resizeMode: 'cover',
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    // LOGO THEME: near-opaque white fill + gold ring (matches Login) so the
    // badge stays legible against the gradient at any scroll/device size,
    // instead of the old translucent-green tint that was designed for a
    // plain white backdrop.
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 2,
    borderColor: '#D4AF37',
    boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 6, color: 'rgba(0, 0, 0, 0.15)' }],
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  titleAccent: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 18,
    marginBottom: 24,
    width: '100%',
    // FIX: elevation + borderRadius is a known RN 0.77 Android bug — the
    // shadow renders as a distorted rectangle instead of following the
    // rounded corners, showing up as a dark box around the card. boxShadow
    // (New Architecture, already enabled) is correct on both platforms.
    boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 4, color: 'rgba(0, 0, 0, 0.08)' }],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoTextGroup: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  bookMeta: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  publishLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  publishHouse: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  publishLink: {
    fontSize: 13,
    color: '#4CAF50',
    marginTop: 2,
  },
  publishNote: {
    flex: 1,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 20,
    width: '100%',
    boxShadow: [{ offsetX: 0, offsetY: 3, blurRadius: 6, color: 'rgba(76, 175, 80, 0.3)' }],
  },
  buttonIcon: {
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default WelcomeScreen;