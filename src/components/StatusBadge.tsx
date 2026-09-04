import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { RequestStatus } from '../types/api';

export function StatusBadge({ status }: { status: RequestStatus }) {
  const tone = status === 'APPROVED' ? { bg: colors.successSoft, fg: colors.success } : status === 'REJECTED' ? { bg: colors.dangerSoft, fg: colors.danger } : { bg: colors.warningSoft, fg: colors.warning };
  return <Text style={[styles.badge, { backgroundColor: tone.bg, color: tone.fg }]}>{status}</Text>;
}

const styles = StyleSheet.create({
  badge: { ...typography.caption, fontWeight: '800', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, overflow: 'hidden' },
});
