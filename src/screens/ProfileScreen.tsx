import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Field } from '../components/Field';
import { Screen, SectionCard } from '../components/Screen';
import { LoadingView } from '../components/StateView';
import { colors, radius, spacing, typography } from '../theme';
import { apiRequest } from '../services/api';
import { clearSession } from '../services/storage';
import { AuthUser, EmployeeProfile } from '../types/api';
import { formatCurrency, getInitials } from '../utils/format';
import { formatDisplayDate } from '../utils/date';

export function ProfileScreen({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setProfile(await apiRequest<EmployeeProfile>(`/employees/${user.id}`));
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const logout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out of this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await clearSession(); onLogout(); } },
    ]);
  };

  const changePassword = async () => {
    setPasswordError('');
    setPasswordMessage('');
    if (!currentPassword || !newPassword || !confirmPassword) return setPasswordError('Fill in all password fields.');
    if (newPassword.length < 8) return setPasswordError('New password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return setPasswordError('New password and confirmation do not match.');
    if (newPassword === currentPassword) return setPasswordError('New password must be different from your current password.');

    try {
      setChangingPassword(true);
      await apiRequest('/users/me/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password updated successfully.');
      setPasswordOpen(false);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <Screen><LoadingView label="Loading profile…" /></Screen>;

  return (
    <Screen>
      <SectionCard>
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(profile?.fullName || user.fullName, user.email)}</Text></View>
          <View style={styles.heroInfo}><Text style={styles.name}>{profile?.fullName || user.fullName}</Text><Text style={styles.email}>{profile?.email || user.email}</Text></View>
        </View>
        <View style={styles.divider} />
        <InfoRow label="Employee code" value={profile?.employeeCode || 'Not available'} />
        <InfoRow label="Employee type" value={profile?.type || 'Not available'} />
        <InfoRow label="Phone" value={profile?.phone || 'Not available'} />
        <InfoRow label="Daily wage" value={profile?.dailyWage != null ? formatCurrency(profile.dailyWage) : 'Not available'} />
        <InfoRow label="Joining date" value={profile?.joiningDate ? formatDisplayDate(profile.joiningDate) : 'Not available'} />
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Account security</Text>
        <Text style={styles.sectionHint}>Use a strong password and never share it with anyone.</Text>
        <AppButton label="Change password" onPress={() => { setPasswordError(''); setPasswordMessage(''); setPasswordOpen(true); }} variant="secondary" />
      </SectionCard>

      {passwordMessage ? <Text style={styles.success}>{passwordMessage}</Text> : null}

      <AppButton label="Sign out" onPress={logout} variant="danger" />

      <Modal visible={passwordOpen} transparent animationType="slide" onRequestClose={() => setPasswordOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}><Text style={styles.sectionTitle}>Change password</Text><Pressable onPress={() => setPasswordOpen(false)} accessibilityLabel="Close"><Text style={styles.close}>×</Text></Pressable></View>
            <Field label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoComplete="current-password" />
            <Field label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoComplete="new-password" />
            <Field label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" />
            {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
            <AppButton label="Update password" onPress={changePassword} loading={changingPassword} style={styles.modalButton} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primaryDark, fontSize: 22, fontWeight: '900' },
  heroInfo: { flex: 1, marginLeft: spacing.lg },
  name: { color: colors.text, ...typography.h2 },
  email: { color: colors.textSecondary, ...typography.caption, marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg, paddingVertical: spacing.sm },
  infoLabel: { color: colors.textSecondary, ...typography.caption, flex: 1 },
  infoValue: { color: colors.text, ...typography.bodyMedium, flex: 1, textAlign: 'right' },
  sectionTitle: { color: colors.text, ...typography.h3 },
  sectionHint: { color: colors.textSecondary, ...typography.caption, marginVertical: spacing.md },
  success: { color: colors.success, ...typography.caption, marginBottom: spacing.lg },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 32 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  close: { color: colors.textSecondary, fontSize: 32, lineHeight: 32 },
  error: { color: colors.danger, ...typography.caption, marginBottom: spacing.md },
  modalButton: { marginTop: spacing.sm },
});
