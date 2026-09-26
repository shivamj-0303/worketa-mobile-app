import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: ViewStyle;
}

export function AppButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && variant === 'primary' && styles.primaryDisabled,
        isDisabled && variant === 'secondary' && styles.secondaryDisabled,
        isDisabled && variant === 'danger' && styles.dangerDisabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary'
              ? colors.white
              : variant === 'danger'
                ? colors.white
                : colors.primary
          }
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'secondary' && styles.secondaryLabel,
            variant === 'ghost' && styles.ghostLabel,
            isDisabled && variant === 'primary' && styles.primaryDisabledLabel,
            isDisabled &&
              variant === 'secondary' &&
              styles.secondaryDisabledLabel,
            isDisabled && variant === 'danger' && styles.dangerDisabledLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  primary: {
    backgroundColor: colors.primary,
  },

  secondary: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },

  danger: {
    backgroundColor: colors.danger,
  },

  ghost: {
    backgroundColor: 'transparent',
  },

  label: {
    color: colors.white,
    ...typography.bodyMedium,
  },

  secondaryLabel: {
    color: colors.text,
  },

  ghostLabel: {
    color: colors.primary,
  },

  primaryDisabled: {
    backgroundColor: colors.primarySoft,
  },

  primaryDisabledLabel: {
    color: colors.primaryDark,
  },

  secondaryDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },

  secondaryDisabledLabel: {
    color: colors.textSecondary,
  },

  dangerDisabled: {
    backgroundColor: colors.dangerSoft,
  },

  dangerDisabledLabel: {
    color: colors.danger,
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
