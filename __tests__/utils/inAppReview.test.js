import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestReview } from 'react-native-rate-app';
import {
  maybeRequestReview,
  CHAPTERS_READ_THRESHOLD,
} from '../../utils/inAppReview';

beforeEach(async () => {
  await AsyncStorage.clear();
  requestReview.mockClear();
});

describe('maybeRequestReview', () => {
  it('does not prompt before the chapters-read threshold is reached', async () => {
    for (let i = 0; i < CHAPTERS_READ_THRESHOLD - 1; i++) {
      await maybeRequestReview();
    }

    expect(requestReview).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem('chaptersReadCount')).toBe(
      String(CHAPTERS_READ_THRESHOLD - 1),
    );
  });

  it('prompts exactly once, the call that reaches the threshold', async () => {
    for (let i = 0; i < CHAPTERS_READ_THRESHOLD; i++) {
      await maybeRequestReview();
    }

    expect(requestReview).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem('hasRequestedReviewPrompt')).toBe('true');
  });

  it('never prompts again after the first time, even with many more reads', async () => {
    for (let i = 0; i < CHAPTERS_READ_THRESHOLD + 10; i++) {
      await maybeRequestReview();
    }

    expect(requestReview).toHaveBeenCalledTimes(1);
  });

  it('does not throw if requestReview itself rejects', async () => {
    requestReview.mockRejectedValueOnce(new Error('store unavailable'));

    for (let i = 0; i < CHAPTERS_READ_THRESHOLD; i++) {
      await expect(maybeRequestReview()).resolves.toBeUndefined();
    }
  });
});
