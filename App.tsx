import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { setSessionExpiredHandler } from './src/services/api';
import { getSession } from './src/services/storage';
import { AuthUser } from './src/types/api';
import { checkForRequiredUpdate } from './src/services/appUpdate';
import { ForceUpdateScreen } from './src/components/ForceUpdateScreen';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [requiredUpdate, setRequiredUpdate] = useState<Awaited<ReturnType<typeof checkForRequiredUpdate>>>(null);
  const [updateCheckAttempt, setUpdateCheckAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;

    setSessionExpiredHandler(() => {
      if (mounted) {
        setUser(null);
      }
    });

    Promise.all([
      getSession().catch(() => ({ accessToken: null, refreshToken: null, user: null })),
      checkForRequiredUpdate(),
    ])
      .then(([session, update]) => {
        if (mounted) {
          setUser(
            session.accessToken && session.user
              ? session.user
              : null
          );
          setRequiredUpdate(update);
        }
      })
      .finally(async () => {
        if (mounted) {
          await SplashScreen.hideAsync();
          setBooting(false);
        }
      });

    return () => {
      mounted = false;
      setSessionExpiredHandler(null);
    };
  }, [updateCheckAttempt]);

  if (booting) {
    return (
      <SafeAreaProvider>
        <View style={styles.boot}>
          <Image
            source={require('./assets/worketa-employee-logo.png')}
            style={styles.splashImage}
            resizeMode="contain"
          />
        </View>
      </SafeAreaProvider>
    );
  }

  if (requiredUpdate) {
    return (
      <SafeAreaProvider>
        <ForceUpdateScreen
          update={requiredUpdate}
          onRetry={() => {
            setRequiredUpdate(null);
            setBooting(true);
            setUpdateCheckAttempt((attempt) => attempt + 1);
          }}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator
        user={user}
        onLogin={setUser}
        onLogout={() => setUser(null)}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },

  splashImage: {
    width: 220,
    height: 220,
  },
});
