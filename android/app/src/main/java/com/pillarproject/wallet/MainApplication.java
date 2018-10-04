package com.pillarproject.wallet;

import android.app.Application;
import android.util.Log;

import com.crashlytics.android.Crashlytics;
import com.facebook.react.ReactApplication;
import io.sentry.RNSentryPackage;
import com.horcrux.svg.SvgPackage;
import lt.imas.react_native_signal.RNSignalClientPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.tradle.react.UdpSocketsModule;
import com.peel.react.TcpSocketsModule;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.crypho.scrypt.RNScryptPackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.peel.react.rnos.RNOSModule;
import com.BV.LinearGradient.LinearGradientPackage;
import com.robinpowered.react.Intercom.IntercomPackage;
import io.invertase.firebase.RNFirebasePackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import org.reactnative.camera.RNCameraPackage;
import com.airbnb.android.react.lottie.LottiePackage;
import cl.json.RNSharePackage;
import cl.json.ShareApplication;
import com.ocetnik.timer.BackgroundTimerPackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import io.fabric.sdk.android.Fabric;
import io.invertase.firebase.fabric.crashlytics.RNFirebaseCrashlyticsPackage;

import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import io.intercom.android.sdk.Intercom;
// react-native-splash-screen >= 0.3.1
import java.util.Arrays;
import java.util.List;


public class MainApplication extends Application implements ShareApplication, ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNSentryPackage(),
          new SvgPackage(),
          new UdpSocketsModule(),
          new TcpSocketsModule(),
          new RNScryptPackage(),
          new LottiePackage(),
          new RNSharePackage(),
          new BackgroundTimerPackage(),
          new SplashScreenReactPackage(),
          new RNFetchBlobPackage(),
          new RNCameraPackage(),
          new RNSignalClientPackage(),
          new VectorIconsPackage(),
          new RNOSModule(),
          new RNFirebasePackage(),
          new RNFirebaseMessagingPackage(),
          new RNFirebaseCrashlyticsPackage(),
          new RNDeviceInfo(),
          new IntercomPackage(),
          new LinearGradientPackage(),
          new RNFirebaseNotificationsPackage(),
          new RandomBytesPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }

    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    final Fabric fabric = new Fabric.Builder(this)
            .kits(new Crashlytics())
            .build();
    Fabric.with(fabric);
    if (BuildConfig.DEBUG) {
      Intercom.initialize(this, "android_sdk-e8448a61a33991a680742cf91d68aaae8652d012", "xbjzrshe");
    } else {
      Intercom.initialize(this, "android_sdk-b989462efb366f8046f5ca1a12c75d67ecb7592c", "s70dqvb2");
    }
    SoLoader.init(this, /* native exopackage */ false);
  }

  @Override
  public String getFileProviderAuthority() {
    return "com.pillarproject.wallet.provider";
  }
}
