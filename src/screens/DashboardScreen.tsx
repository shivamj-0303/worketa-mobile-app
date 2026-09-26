import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen, SectionCard } from '../components/Screen';
import { LoadingView, ErrorView, EmptyView } from '../components/StateView';
import { StatCard } from '../components/StatCard';
import { colors, spacing, typography } from '../theme';
import { apiRequest } from '../services/api';
import { AuthUser, EmployeeSummary, PayrollRecord } from '../types/api';
import { formatCurrency, getFirstName } from '../utils/format';
import { formatDisplayDate } from '../utils/date';

export function DashboardScreen({ user }: { user: AuthUser }) {
  const [summary, setSummary] = useState<EmployeeSummary | null>(null);
  const [history, setHistory] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError('');
      const [summaryResult, historyResult] = await Promise.all([
        apiRequest<EmployeeSummary>(`/payroll/summary/${user.id}`),
        apiRequest<PayrollRecord[]>(`/payroll/employee/${user.id}`),
      ]);
      setSummary(summaryResult);
      setHistory(historyResult.slice(0, 4));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Screen><LoadingView label="Loading your dashboard…" /></Screen>;
  if (error && !summary) return <Screen><ErrorView message={error} onRetry={() => load()} /></Screen>;

  const present = summary?.presentDays ?? 0;
  const absent = summary?.absentDays ?? 0;
  const doubled = summary?.doubledDays ?? 0;

  return (
    <Screen refreshing={refreshing} onRefresh={() => load(true)}>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.eyebrow}>EMPLOYEE PORTAL</Text>
          <Text style={styles.title}>Hi, {getFirstName(user.fullName, user.email)}</Text>
          <Text style={styles.subtitle}>Here’s your latest work and payroll overview.</Text>
        </View>
        <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>₹</Text></View>
      </View>

      {error ? <Text style={styles.inlineError}>{error}</Text> : null}

      <View style={styles.grid}>
        <StatCard label="Present days" value={String(present)} tone="green" />
        <StatCard label="Absent days" value={String(absent)} tone="red" />
        <StatCard label="Monthly salary" value={formatCurrency(summary?.monthlySalary)} tone="blue" />
        <StatCard label="Bonus" value={formatCurrency(summary?.bonusAmount)} tone="amber" />
        <StatCard label="Advance" value={formatCurrency(summary?.advanceDeduction)} tone="purple" />
        <StatCard label="Double days" value={String(doubled)} tone="teal" />
      </View>

      <SectionCard>
        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Recent payroll</Text><Text style={styles.sectionHint}>Latest settled records</Text></View>
        </View>
        {history.length === 0 ? (
          <EmptyView title="No payroll history yet" message="Settled payroll records will appear here." />
        ) : history.map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <View style={styles.historyInfo}>
              <Text style={styles.itemTitle}>{item.month || item.periodEnd || 'Payroll'}</Text>
              <Text style={styles.itemMeta}>{item.settledAt ? `Settled ${formatDisplayDate(item.settledAt)}` : 'Settled'}</Text>
            </View>
            <Text style={styles.amount}>{formatCurrency(item.netAmount)}</Text>
          </View>
        ))}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.text, borderRadius: 20, padding: spacing.xl, marginBottom: spacing.xl },
  heroText: { flex: 1 },
  eyebrow: { color: '#93C5FD', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.white, ...typography.title, marginTop: spacing.xs },
  subtitle: { color: '#CBD5E1', ...typography.body, marginTop: spacing.xs },
  heroBadge: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', marginLeft: spacing.md },
  heroBadgeText: { color: '#93C5FD', fontSize: 22, fontWeight: '900' },
  inlineError: { color: colors.danger, ...typography.caption, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  sectionHeader: { marginBottom: spacing.sm },
  sectionTitle: { color: colors.text, ...typography.h3 },
  sectionHint: { color: colors.textSecondary, ...typography.caption, marginTop: 2 },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  historyInfo: { flex: 1, paddingRight: spacing.md },
  itemTitle: { color: colors.text, ...typography.bodyMedium },
  itemMeta: { color: colors.textSecondary, ...typography.caption, marginTop: 3 },
  amount: { color: colors.success, ...typography.bodyMedium },
});
