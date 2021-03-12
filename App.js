// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import 'utils/setup';
import { setupEnv, switchEnvironments, getEnv } from 'configs/envConfig';
import React, { Suspense } from 'react';
import Intercom from 'react-native-intercom';
import { StatusBar, Platform, Linking, View, UIManager } from 'react-native';
import { Provider, connect } from 'react-redux';
import * as Sentry from '@sentry/react-native';
import { PersistGate } from 'redux-persist/lib/integration/react';
import styled, { ThemeProvider } from 'styled-components/native';
import { AppearanceProvider } from 'react-native-appearance';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';
import { withTranslation } from 'react-i18next';
import t from 'translations/translate';
import { NavigationActions } from 'react-navigation';
import remoteConfig from '@react-native-firebase/remote-config';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from 'react-query';

import 'services/localisation/translations';
import localeConfig from 'configs/localeConfig';

// actions
import { initAppAndRedirectAction } from 'actions/appActions';
import { updateSessionNetworkStatusAction } from 'actions/sessionActions';
import { updateOfflineQueueNetworkStatusAction } from 'actions/offlineApiActions';
import {
  startListeningOnOpenNotificationAction,
  stopListeningOnOpenNotificationAction,
} from 'actions/notificationsActions';
import { executeDeepLinkAction } from 'actions/deepLinkActions';
import { startReferralsListenerAction, stopReferralsListenerAction } from 'actions/referralsActions';
import { setAppThemeAction, handleSystemDefaultThemeChangeAction } from 'actions/appSettingsActions';
import { changeLanguageAction, updateTranslationResourceOnContextChangeAction } from 'actions/localisationActions';

// constants
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';
import { STAGING } from 'constants/envConstants';
import { REMOTE_CONFIG, INITIAL_REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// components
import { Container } from 'components/Layout';
import Root from 'components/Root';
import Toast from 'components/Toast';
import Spinner from 'components/Spinner';
import Walkthrough from 'components/Walkthrough';
import Button from 'components/Button';
import PercentsInputAccessoryHolder from 'components/PercentsInputAccessory/PercentsInputAccessoryHolder';
import Modal from 'components/Modal';

// utils
import { getThemeByType, defaultTheme } from 'utils/themes';
import { getActiveRouteName } from 'utils/navigation';
import { log } from 'utils/logger';

// services
import { setTopLevelNavigator } from 'services/navigation';
import { firebaseRemoteConfig } from 'services/firebase';
import { logScreenViewAction } from 'actions/analyticsActions';

// types
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Steps } from 'reducers/walkthroughsReducer';
import type { I18n } from 'models/Translations';

// other
import RootNavigation from 'navigation/rootNavigation';
import Storybook from 'screens/Storybook';
import configureStore from './src/configureStore';

const { store, persistor } = configureStore();

const queryClient = new QueryClient();

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const LoadingSpinner = styled(Spinner)`
  padding: 10px;
  align-items: center;
  justify-content: center;
`;

type Props = {
  dispatch: Dispatch,
  isFetched: boolean,
  fetchAppSettingsAndRedirect: () => void,
  updateSessionNetworkStatus: (isOnline: boolean) => void,
  updateOfflineQueueNetworkStatus: (isOnline: boolean) => void,
  startListeningOnOpenNotification: () => void,
  stopListeningOnOpenNotification: () => void,
  executeDeepLink: (deepLinkUrl: string) => void,
  activeWalkthroughSteps: Steps,
  themeType: string,
  startReferralsListener: () => void,
  stopReferralsListener: () => void,
  setAppTheme: (themeType: string) => void,
  isManualThemeSelection: boolean,
  handleSystemDefaultThemeChange: () => void,
  i18n: I18n,
  changeLanguage: (language: string) => void,
  translationsInitialised: boolean,
  updateTranslationResourceOnContextChange: () => void,
  initialDeeplinkExecuted: boolean,
  sessionLanguageVersion: ?string,
  logScreenView: (screenName: string) => void,
}


class App extends React.Component<Props, *> {
  removeNetInfoEventListener: NetInfoSubscription;
  offlineToastId: null | string = null;

  constructor(props: Props) {
    super(props);
    if (!__DEV__) {
      const dist = DeviceInfo.getBuildNumber();
      const release = `${DeviceInfo.getBundleId()}@${DeviceInfo.getVersion()}+${dist}`;
      Sentry.init({ dsn: getEnv().SENTRY_DSN });
      Sentry.setRelease(release);
      Sentry.setDist(dist);
      Sentry.setTags({ environment: getEnv().BUILD_TYPE });
    }
    this.state = {
      env: null,
    };
  }

  // https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path
  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    Intercom.setInAppMessageVisibility('GONE'); // prevent messanger launcher to appear
  }

  componentWillUnmount() {
    const { stopListeningOnOpenNotification, stopReferralsListener } = this.props;
    stopReferralsListener();
    stopListeningOnOpenNotification();
    if (this.removeNetInfoEventListener) {
      this.removeNetInfoEventListener();
      delete this.removeNetInfoEventListener;
    }
    Linking.removeEventListener('url', this.handleDeepLinkEvent);
  }

  async componentDidMount() {
    const {
      fetchAppSettingsAndRedirect,
      startListeningOnOpenNotification,
      startReferralsListener,
      sessionLanguageVersion,
      updateTranslationResourceOnContextChange,
    } = this.props;

    const env = await setupEnv();
    log.info('Environment: ', env);
    this.setState({ env });

    /**
     * First, we need to set the defaults for Remote Config.
     * This makes the default values immediately available
     * on app load and can be used.
     *
     * @url https://rnfirebase.io/reference/remote-config#setDefaults
     */

    remoteConfig()
      .setDefaults(INITIAL_REMOTE_CONFIG)
      .then(() => log.info('Firebase Config: Defaults loaded and available.'))
      .catch(e => log.error('Firebase Config: An error occurred loading defaults:', e));

    await remoteConfig().ensureInitialized();

    /**
     * Secondly, we need to activate any remotely fetched values
     * if they exist at all. The values that have been fetched
     * and activated override the default values above (see @url
     * above).
     *
     * @url https://rnfirebase.io/reference/remote-config#activate
     */

    remoteConfig()
      .activate()
      .then((r) => {
        log.info('Firebase Config: Activation result was:', r);
        if (sessionLanguageVersion !== firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_LOCALES_LATEST_TIMESTAMP)) {
          updateTranslationResourceOnContextChange();
        }
      })
      .catch(e => log.error('Firebase Config: An error occurred while activating:', e));

    // hold the UI and wait until network status finished for later app connectivity checks
    await NetInfo.fetch()
      .then((netInfoState) => this.setOnlineStatus(netInfoState.isInternetReachable))
      .catch(() => null);
    this.removeNetInfoEventListener = NetInfo.addEventListener(this.handleConnectivityChange);
    startReferralsListener();
    fetchAppSettingsAndRedirect();
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    }
    Linking.addEventListener('url', this.handleDeepLinkEvent);
    startListeningOnOpenNotification();
  }

  componentDidUpdate(prevProps: Props) {
    const { isFetched, handleSystemDefaultThemeChange, themeType } = this.props;
    const { isFetched: prevIsFetched, themeType: prevThemeType } = prevProps;
    if (isFetched && !prevIsFetched) {
      handleSystemDefaultThemeChange();
    }

    if (themeType !== prevThemeType) {
      if (themeType === DARK_THEME) {
        StatusBar.setBarStyle('light-content');
      } else {
        StatusBar.setBarStyle('dark-content');
      }
    }
  }

  setOnlineStatus = isOnline => {
    const {
      updateSessionNetworkStatus,
      updateOfflineQueueNetworkStatus,
    } = this.props;
    updateSessionNetworkStatus(isOnline);
    updateOfflineQueueNetworkStatus(isOnline);
  };

  handleConnectivityChange = (state: NetInfoState) => {
    const { updateTranslationResourceOnContextChange } = this.props;
    const isOnline = state.isInternetReachable;
    this.setOnlineStatus(isOnline);

    if (!isOnline) {
      if (this.offlineToastId === null) {
        this.offlineToastId = Toast.show({
          message: t('toast.userIsOffline'),
          emoji: 'satellite_antenna',
          autoClose: false,
          onClose: () => { this.offlineToastId = null; },
        });
      }
    } else {
      if (this.offlineToastId !== null) Toast.close(this.offlineToastId);
      updateTranslationResourceOnContextChange();
    }
  };

  handleDeepLinkEvent = (event: { url: string }) => {
    // prevents invoking upon app launch, before login
    if (this.props.initialDeeplinkExecuted) {
      const { executeDeepLink } = this.props;
      const { url: deepLink } = event;
      if (deepLink === undefined) return;
      executeDeepLink(deepLink);
    }
  };

  handleNavigationStateChange = (prevState, nextState, action) => {
    if (action.type === NavigationActions.NAVIGATE) Modal.closeAll();

    const nextRouteName = getActiveRouteName(nextState);
    const previousRouteName = getActiveRouteName(prevState);
    if (!!nextRouteName && nextRouteName !== previousRouteName) {
      this.props.logScreenView(nextRouteName);
    }
  }

  render() {
    const {
      isFetched,
      themeType,
      setAppTheme,
      activeWalkthroughSteps,
      i18n: i18next,
      changeLanguage,
      translationsInitialised,
    } = this.props;
    const theme = getThemeByType(themeType);
    const { current } = theme;

    if (!isFetched || (localeConfig.isEnabled && !translationsInitialised)) return null;

    return (
      <AppearanceProvider>
        <ThemeProvider theme={theme}>
          <React.Fragment>
            <Root>
              <RootNavigation
                ref={(node) => {
                  if (!node) return;
                  setTopLevelNavigator(node);
                }}
                theme={current === LIGHT_THEME ? 'light' : 'dark'} // eslint-disable-line i18next/no-literal-string
                language={i18next.language}
                onNavigationStateChange={this.handleNavigationStateChange}
              />
              {!!getEnv().SHOW_THEME_TOGGLE &&
              <Button
                title={`THEME: ${current}`} // eslint-disable-line i18next/no-literal-string
                onPress={() => {
                  const themeToChangeTo = current === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
                  setAppTheme(themeToChangeTo);
                }}
              />}
              {!!getEnv().SHOW_LANG_TOGGLE && <Button
                title={`Change lang (current: ${i18next.language})`} // eslint-disable-line i18next/no-literal-string
                // eslint-disable-next-line i18next/no-literal-string
                onPress={() => changeLanguage(i18next.language === 'am' ? localeConfig.defaultLanguage : 'am')}
              />}
              {!!activeWalkthroughSteps.length && <Walkthrough steps={activeWalkthroughSteps} />}
              {this.state.env === STAGING &&
                <Button
                  title={`Environment: ${this.state.env}`} // eslint-disable-line i18next/no-literal-string
                  onPress={() => switchEnvironments()}
                />
              }
              <PercentsInputAccessoryHolder
                ref={c => {
                  if (c && !PercentsInputAccessoryHolder.instances.includes(c)) {
                    PercentsInputAccessoryHolder.instances.push(c);
                  }
                }}
              />
            </Root>
          </React.Fragment>
        </ThemeProvider>
      </AppearanceProvider>
    );
  }
}

const mapStateToProps = ({
  appSettings: { isFetched, data: { themeType, isManualThemeSelection, initialDeeplinkExecuted } },
  walkthroughs: { steps: activeWalkthroughSteps },
  session: { data: { translationsInitialised, sessionLanguageVersion } },
}: RootReducerState): $Shape<Props> => ({
  isFetched,
  themeType,
  isManualThemeSelection,
  activeWalkthroughSteps,
  translationsInitialised,
  initialDeeplinkExecuted,
  sessionLanguageVersion,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchAppSettingsAndRedirect: () => dispatch(initAppAndRedirectAction()),
  updateSessionNetworkStatus: (isOnline: boolean) => dispatch(updateSessionNetworkStatusAction(isOnline)),
  updateOfflineQueueNetworkStatus: (isOnline: boolean) => dispatch(updateOfflineQueueNetworkStatusAction(isOnline)),
  startListeningOnOpenNotification: () => dispatch(startListeningOnOpenNotificationAction()),
  stopListeningOnOpenNotification: () => dispatch(stopListeningOnOpenNotificationAction()),
  startReferralsListener: () => dispatch(startReferralsListenerAction()),
  stopReferralsListener: () => dispatch(stopReferralsListenerAction()),
  executeDeepLink: (deepLink: string) => dispatch(executeDeepLinkAction(deepLink)),
  setAppTheme: (themeType: string) => dispatch(setAppThemeAction(themeType)),
  handleSystemDefaultThemeChange: () => dispatch(handleSystemDefaultThemeChangeAction()),
  changeLanguage: (language) => dispatch(changeLanguageAction(language)),
  updateTranslationResourceOnContextChange: () => dispatch(updateTranslationResourceOnContextChangeAction()),
  logScreenView: (screenName: string) => dispatch(logScreenViewAction(screenName)),
});

const AppWithNavigationState = withTranslation()(connect(mapStateToProps, mapDispatchToProps)(App));

const AppRoot = () => (
  <Suspense
    fallback={(
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Spinner theme={defaultTheme} />
      </View>
    )}
  >
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate
          loading={<Container defaultTheme={defaultTheme}><LoadingSpinner theme={defaultTheme} /></Container>}
          persistor={persistor}
        >
          <QueryClientProvider client={queryClient}>
            {getEnv().SHOW_ONLY_STORYBOOK ? <Storybook /> : <AppWithNavigationState />}
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  </Suspense>
);

export default AppRoot;
