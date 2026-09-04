import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { setSessionExpiredHandler } from './src/services/api';
import { getSession } from './src/services/storage';
import { colors } from './src/theme';
import { AuthUser } from './src/types/api';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;
    setSessionExpiredHandler(() => { if (mounted) setUser(null); });

    getSession()
      .then((session) => { if (mounted) setUser(session.accessToken && session.user ? session.user : null); })
      .catch(() => { if (mounted) setUser(null); })
      .finally(() => { if (mounted) setBooting(false); });

    return () => {
      mounted = false;
      setSessionExpiredHandler(null);
    };
  }, []);

  if (booting) {
    return (
      <SafeAreaProvider>
        <View style={styles.boot}><View style={styles.logo}><Text style={styles.logoText}>W</Text></View><Text style={styles.title}>Worketa</Text><ActivityIndicator color={colors.primary} style={styles.spinner} /></View>
      </SafeAreaProvider>
    );
  }

  return <SafeAreaProvider><StatusBar style={user ? 'dark' : 'dark'} /><AppNavigator user={user} onLogin={setUser} onLogout={() => setUser(null)} /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  logo: { width: 58, height: 58, borderRadius: 16, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: colors.white, fontSize: 28, fontWeight: '900' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 12 },
  spinner: { marginTop: 20 },
});
