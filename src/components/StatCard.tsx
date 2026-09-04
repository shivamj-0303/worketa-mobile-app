import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../theme';

const tones = {
  green: { accent: colors.success, soft: colors.successSoft },
  red: { accent: colors.danger, soft: colors.dangerSoft },
  blue: { accent: colors.primary, soft: colors.primarySoft },
  amber: { accent: colors.warning, soft: colors.warningSoft },
  purple: { accent: colors.purple, soft: colors.purpleSoft },
  teal: { accent: colors.teal, soft: colors.tealSoft },
};

export function StatCard({ label, value, tone = 'blue' }: { label: string; value: string; tone?: keyof typeof tones }) {
  const palette = tones[tone];
  return (
    <View style={[styles.card, shadow]}>
      <View style={[styles.icon, { backgroundColor: palette.soft }]}><View style={[styles.dot, { backgroundColor: palette.accent }]} /></View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', minHeight: 132, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  dot: { width: 12, height: 12, borderRadius: 6 },
  value: { color: colors.text, ...typography.h2 },
  label: { color: colors.textSecondary, ...typography.caption, marginTop: spacing.xs },
});
