import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Field } from '../components/Field';
import { Screen, SectionCard } from '../components/Screen';
import { LoadingView, EmptyView } from '../components/StateView';
import { StatusBadge } from '../components/StatusBadge';
import { colors, radius, spacing, typography } from '../theme';
import { apiRequest } from '../services/api';
import { AdvanceRecord, AuthUser } from '../types/api';
import { formatCurrency } from '../utils/format';
import { formatDisplayDate } from '../utils/date';

export function AdvancesScreen({ user }: { user: AuthUser }) {
  const [advances, setAdvances] = useState<AdvanceRecord[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError('');
      setAdvances(await apiRequest<AdvanceRecord[]>(`/advances/employee/${user.id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load advance requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid amount greater than ₹0.');
      return;
    }
    if (numericAmount > 10000000) {
      setError('Enter a realistic advance amount or contact an administrator.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setMessage('');
      await apiRequest('/advances', { method: 'POST', body: JSON.stringify({ employeeId: user.id, amount: numericAmount, note: note.trim() }) });
      setAmount('');
      setNote('');
      setMessage('Your advance request has been submitted for review.');
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit the advance request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={() => load(true)}>
      <View style={styles.header}>
        <Text style={styles.title}>Advances</Text>
        <Text style={styles.subtitle}>Request an advance and track its approval status.</Text>
      </View>

      <SectionCard>
        <Text style={styles.sectionTitle}>Request an advance</Text>
        <Text style={styles.sectionHint}>The request will be reviewed by an administrator.</Text>
        <Field label="Amount" value={amount} onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="e.g. 5000" editable={!submitting} />
        <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Add a short reason" multiline textAlignVertical="top" style={styles.note} editable={!submitting} maxLength={250} />
        {error ? <View style={styles.messageBox}><Text style={styles.error}>{error}</Text></View> : null}
        {message ? <View style={styles.successBox}><Text style={styles.success}>{message}</Text></View> : null}
        <AppButton label="Submit request" onPress={submit} loading={submitting} />
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Request history</Text>
        {loading ? <LoadingView label="Loading requests…" /> : advances.length === 0 ? <EmptyView title="No advance requests" message="Your submitted requests will appear here." /> : advances.map((advance) => (
          <View key={advance.id} style={styles.listItem}>
            <View style={styles.info}><Text style={styles.amount}>{formatCurrency(advance.amount)}</Text><Text style={styles.meta}>{formatDisplayDate(advance.advanceDate)}{advance.settled ? ' • Settled' : ''}</Text></View>
            <StatusBadge status={advance.status} />
          </View>
        ))}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.xl },
  title: { color: colors.text, ...typography.title },
  subtitle: { color: colors.textSecondary, ...typography.body, marginTop: spacing.xs },
  sectionTitle: { color: colors.text, ...typography.h3 },
  sectionHint: { color: colors.textSecondary, ...typography.caption, marginTop: 2, marginBottom: spacing.lg },
  note: { minHeight: 90, paddingTop: spacing.md },
  messageBox: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  successBox: { backgroundColor: colors.successSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  error: { color: colors.danger, ...typography.caption },
  success: { color: colors.success, ...typography.caption },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  info: { flex: 1 },
  amount: { color: colors.text, ...typography.bodyMedium },
  meta: { color: colors.textSecondary, ...typography.caption, marginTop: 3 },
});
