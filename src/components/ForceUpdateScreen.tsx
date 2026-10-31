import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { openUpdateDownload, RequiredUpdate } from '../services/appUpdate';

interface ForceUpdateScreenProps {
  update: RequiredUpdate;
  onRetry: () => void;
}

export function ForceUpdateScreen({ update, onRetry }: ForceUpdateScreenProps) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  const downloadUpdate = async () => {
    setOpening(true);
    setError(null);
    try {
      await openUpdateDownload(update.apkUrl);
    } catch {
      setError('Could not open the download. Check your internet connection and try again.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>WORKETA</Text>
        <Text style={styles.title}>Update required</Text>
        <Text style={styles.message}>
          This version is no longer supported. Download version {update.versionName} to continue.
        </Text>
        <Text style={styles.notes}>{update.releaseNotes}</Text>

        <Pressable
          accessibilityRole="button"
          disabled={opening}
          onPress={downloadUpdate}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          {opening ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Download update</Text>}
        </Pressable>

        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>I have installed it, check again</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FB' },
  content: { flex: 1, justifyContent: 'center', padding: 28 },
  eyebrow: { color: '#2563EB', fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#0F172A', fontSize: 32, fontWeight: '800', marginTop: 12 },
  message: { color: '#334155', fontSize: 17, lineHeight: 25, marginTop: 16 },
  notes: { color: '#64748B', fontSize: 14, lineHeight: 21, marginTop: 18 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 32,
    minHeight: 52,
    paddingHorizontal: 20,
  },
  pressed: { opacity: 0.8 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  retryButton: { alignItems: 'center', marginTop: 20, padding: 10 },
  retryText: { color: '#2563EB', fontSize: 15, fontWeight: '700' },
  error: { color: '#B91C1C', fontSize: 14, marginTop: 16, textAlign: 'center' },
});
