// utils/inAppReview.js
//
// Prompts the user for a Play Store / App Store review at a natural
// milestone rather than immediately on launch or from a button — matching
// both Apple's and Google's guidelines ("ask after the user has completed a
// task or achieved a milestone", not on demand). Uses react-native-rate-app,
// which drives the native Play In-App Review API on Android and
// SKStoreReviewController / RequestReviewAction on iOS.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestReview } from 'react-native-rate-app';

const CHAPTERS_READ_KEY = 'chaptersReadCount';
const HAS_REQUESTED_REVIEW_KEY = 'hasRequestedReviewPrompt';

// Prompt once the reader has opened this many chapters. Deliberately not
// "first launch" or "every chapter" — a reader who's stuck around for a
// handful of chapters is a much better (and less annoying) moment to ask.
export const CHAPTERS_READ_THRESHOLD = 5;

/**
 * Call this each time a chapter is successfully read/navigated to. Counts
 * distinct reads towards the milestone and fires the native review prompt
 * exactly once per install, the first time the threshold is reached.
 *
 * Note: even when we call requestReview(), the OS itself silently rate-limits
 * how often the dialog can actually appear (Apple/Google both cap this), so
 * calling it doesn't guarantee the user sees anything — it just asks.
 */
export const maybeRequestReview = async () => {
  try {
    const alreadyRequested = await AsyncStorage.getItem(HAS_REQUESTED_REVIEW_KEY);
    if (alreadyRequested === 'true') {
      return;
    }

    const storedCount = await AsyncStorage.getItem(CHAPTERS_READ_KEY);
    const count = (storedCount ? parseInt(storedCount, 10) : 0) + 1;
    await AsyncStorage.setItem(CHAPTERS_READ_KEY, count.toString());

    if (count >= CHAPTERS_READ_THRESHOLD) {
      // Mark as requested before the actual call so a slow/hung review
      // dialog can't cause a second, overlapping call on a fast re-render.
      await AsyncStorage.setItem(HAS_REQUESTED_REVIEW_KEY, 'true');
      await requestReview();
    }
  } catch (e) {
    // A review prompt is a nice-to-have — never let it interrupt reading.
    console.log('In-app review prompt skipped:', e);
  }
};
