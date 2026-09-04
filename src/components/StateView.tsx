import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { AppButton } from './AppButton';

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  return <View style={styles.state}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.label}>{label}</Text></View>;
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.state}>
      <View style={styles.icon}><Text style={styles.iconText}>!</Text></View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <AppButton label="Try again" onPress={onRetry} style={styles.button} /> : null}
    </View>
  );
}

export function EmptyView({ title, message }: { title: string; message: string }) {
  return <View style={styles.empty}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.message}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  label: { marginTop: spacing.md, color: colors.textSecondary, ...typography.body },
  icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.danger, fontSize: 22, fontWeight: '800' },
  title: { color: colors.text, ...typography.h3, marginTop: spacing.md },
  message: { color: colors.textSecondary, ...typography.body, textAlign: 'center', marginTop: spacing.xs },
  button: { marginTop: spacing.lg, minWidth: 130 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyTitle: { color: colors.text, ...typography.bodyMedium },
});
