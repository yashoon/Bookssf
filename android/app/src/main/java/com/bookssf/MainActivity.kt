package com.bookssf

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;
import android.os.Bundle
import androidx.core.view.WindowCompat

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Bookssf"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  /**override fun createReactActivityDelegate(): ReactActivityDelegate =
     * DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
     */
      override fun createReactActivityDelegate(): ReactActivityDelegate {
        return object : ReactActivityDelegate(this, mainComponentName) {
            override fun createRootView(): ReactRootView {
                return RNGestureHandlerEnabledRootView(this@MainActivity)
            }
        }
    }

/**change can resolve the Unable to instantiate fragment com.swmansion.rnscreens.Screen error
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        // FIX: targetSdkVersion is 36, so Android 15+ enforces edge-to-edge
        // rendering regardless — the old "opt out" flags no longer work at
        // that target SDK. This call keeps behavior consistent on older
        // Android versions too, per Google's own Play Console
        // recommendation. react-native-safe-area-context's
        // <SafeAreaProvider> (now added at the app root in App.js) is what
        // actually measures and reports the resulting insets back to JS so
        // content can pad itself correctly.
        //
        // NOTE: originally used androidx.activity's enableEdgeToEdge(), but
        // that needs androidx.activity-ktx explicitly on the classpath,
        // which this project doesn't declare and the build couldn't
        // resolve. WindowCompat.setDecorFitsSystemWindows(window, false) is
        // the lower-level call enableEdgeToEdge() wraps for the "draw
        // behind system bars" behavior — it lives in androidx.core, which
        // is already a proven dependency here (react-native-safe-area-context's
        // own native module relies on it to read window insets). Doesn't
        // also auto-adjust status/nav bar icon contrast the way
        // enableEdgeToEdge() does; can be added later with
        // WindowInsetsControllerCompat if icons end up hard to see against
        // the header/background.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        super.onCreate(null) // 🔥 This prevents fragment instantiation errors from react-native-screens
    }
}
