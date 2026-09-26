import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { setSessionExpiredHandler } from './src/services/api';
import { getSession } from './src/services/storage';
import { AuthUser } from './src/types/api';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;

    setSessionExpiredHandler(() => {
      if (mounted) {
        setUser(null);
      }
    });

    getSession()
      .then((session) => {
        if (mounted) {
          setUser(
            session.accessToken && session.user
              ? session.user
              : null
          );
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
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
  }, []);

  if (booting) {
    return (
      <SafeAreaProvider>
        <View style={styles.boot}>
          <Image
            source={require('./assets/splash-icon.png')}
            style={styles.splashImage}
            resizeMode="cover"
          />
        </View>
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
    width: '100%',
    height: '100%',
  },
});
