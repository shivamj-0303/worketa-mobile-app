import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { Field } from '../components/Field';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { apiRequest } from '../services/api';
import { saveSession } from '../services/storage';
import { AuthUser, EmployeeProfile, LoginResponse } from '../types/api';
import { getFirstName } from '../utils/format';

export function LoginScreen({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password }),
      }, false);

      let employee: EmployeeProfile | null = null;
      const employeeId = result.employeeId || result.userId;
      if (employeeId) {
        try {
          employee = await apiRequest<EmployeeProfile>(`/employees/${employeeId}`);
        } catch {
          // Login is still valid if the optional profile request fails.
        }
      }

      const user: AuthUser = {
        id: result.employeeId || result.userId || '',
        email: result.email || normalizedEmail,
        fullName: employee?.fullName || getFirstName(undefined, normalizedEmail),
        role: 'EMPLOYEE',
      };

      if (!user.id) throw new Error('Your account is missing an employee ID. Please contact an administrator.');
      await saveSession(result.accessToken, result.refreshToken, user);
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.brand}>
          <View style={styles.logo}><Text style={styles.logoText}>W</Text></View>
          <Text style={styles.appName}>Worketa</Text>
          <Text style={styles.tagline}>Employee portal</Text>
        </View>

        <View style={[styles.card, shadow]}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to manage your attendance, advances and payroll.</Text>

          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" editable={!loading} placeholder="you@example.com" onSubmitEditing={handleLogin} returnKeyType="next" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" editable={!loading} placeholder="Enter your password" onSubmitEditing={handleLogin} returnKeyType="done" />

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <AppButton label="Sign in" onPress={handleLogin} loading={loading} style={styles.button} />
        </View>

        <Text style={styles.footer}>Your session is securely stored on this device.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoText: { color: colors.white, fontSize: 30, fontWeight: '900' },
  appName: { color: colors.text, ...typography.title },
  tagline: { color: colors.textSecondary, ...typography.body, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xxl },
  title: { color: colors.text, ...typography.h2 },
  subtitle: { color: colors.textSecondary, ...typography.body, marginTop: spacing.xs, marginBottom: spacing.lg },
  error: { color: colors.danger, ...typography.caption, marginBottom: spacing.sm },
  button: { marginTop: spacing.sm },
  footer: { color: colors.textTertiary, ...typography.caption, textAlign: 'center', marginTop: spacing.xl },
});
