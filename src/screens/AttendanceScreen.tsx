import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Screen, SectionCard } from '../components/Screen';
import { LoadingView, ErrorView, EmptyView } from '../components/StateView';
import { StatusBadge } from '../components/StatusBadge';
import { colors, radius, spacing, typography } from '../theme';
import { apiRequest } from '../services/api';
import { AttendanceRecord, AuthUser } from '../types/api';
import { formatDisplayDate, formatMonth, getBusinessDate, getMonthKey, isDoubleRequestWindow } from '../utils/date';

export function AttendanceScreen({ user }: { user: AuthUser }) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState<'PRESENT' | 'WORKED_DOUBLE' | null>(null);
  const [error, setError] = useState('');

  const currentBusinessDate = getBusinessDate();
  const currentBusinessDateObj = useMemo(() => new Date(`${currentBusinessDate}T12:00:00`), [currentBusinessDate]);
  const isCurrentMonth = month.getFullYear() === currentBusinessDateObj.getFullYear() && month.getMonth() === currentBusinessDateObj.getMonth();

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError('');
      setAttendance(await apiRequest<AttendanceRecord[]>(`/attendance/employee/${user.id}?month=${getMonthKey(month)}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load attendance.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month, user.id]);

  useEffect(() => { load(); }, [load]);

  const submit = async (type: 'PRESENT' | 'WORKED_DOUBLE') => {
    if (!isCurrentMonth) return;
    if (attendance.some((item) => item.attendanceDate === currentBusinessDate && item.type === type)) {
      setError(`A ${type === 'PRESENT' ? 'present' : 'double'} request has already been submitted for today.`);
      return;
    }
    try {
      setSubmitting(type);
      setError('');
      await apiRequest('/attendance', {
        method: 'POST',
        body: JSON.stringify({ employeeId: user.id, attendanceDate: currentBusinessDate, type, status: 'PENDING' }),
      });
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit the request.');
    } finally {
      setSubmitting(null);
    }
  };

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const calendar = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);
  const byDate = attendance.reduce<Record<string, AttendanceRecord>>((map, record) => {
    map[record.attendanceDate] = record;
    return map;
  }, {});

  if (loading) return <Screen><LoadingView label="Loading attendance…" /></Screen>;

  const presentRequested = attendance.some((item) => item.attendanceDate === currentBusinessDate && item.type === 'PRESENT');
  const doubleRequested = attendance.some((item) => item.attendanceDate === currentBusinessDate && item.type === 'WORKED_DOUBLE');
  const doubleAvailable = isCurrentMonth && isDoubleRequestWindow();
  const todaysRequests = attendance.filter(
    (item) => item.attendanceDate === currentBusinessDate
  );
  return (
    <Screen refreshing={refreshing} onRefresh={() => load(true)}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.subtitle}>Submit requests for today. An administrator reviews every request.</Text>
      </View>

      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

      <SectionCard>
        <View style={styles.monthHeader}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.monthArrow}><Text style={styles.arrow}>‹</Text></Pressable>
          <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={styles.monthArrow}><Text style={styles.arrow}>›</Text></Pressable>
        </View>
        <View style={styles.weekRow}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <Text key={`${day}-${i}`} style={styles.weekDay}>{day}</Text>)}</View>
        <View style={styles.calendar}>{calendar.map((day, index) => {
          const date = day ? `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
          const record = date ? byDate[date] : undefined;
          return (
            <View
              key={`${date}-${index}`}
              style={[
                styles.day,
                record?.type === 'ABSENT' && styles.absent,
                record?.type !== 'ABSENT' &&
                  record?.status === 'APPROVED' &&
                  styles.approved,
                record?.type !== 'ABSENT' &&
                  record?.status === 'PENDING' &&
                  styles.pending,
                date === currentBusinessDate && styles.today,
              ]}
            >
              <Text style={[styles.dayText, date === currentBusinessDate && styles.todayText]}>{day || ''}</Text>
              {record ? (
                <Text
                  style={[
                    styles.marker,
                    record.type === 'ABSENT' && styles.absentMarker,
                  ]}
                >
                  {record.type === 'WORKED_DOUBLE' ? '2×' : '•'}
                </Text>
              ) : null}
            </View>
          );
        })}</View>
        <View style={styles.legend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.successSoft }]} /><Text style={styles.legendText}>Approved</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.warningSoft }]} /><Text style={styles.legendText}>Pending</Text></View></View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Today’s requests</Text>
        <Text style={styles.sectionHint}>{isCurrentMonth ? `Business date: ${formatDisplayDate(currentBusinessDate)}` : 'Switch to the current month to submit a request.'}</Text>
        <View style={styles.actions}>
          <AppButton label={presentRequested ? 'Present requested' : 'Request present'} loading={submitting === 'PRESENT'} disabled={!isCurrentMonth || presentRequested} onPress={() => submit('PRESENT')} style={styles.action} />
          <AppButton label={doubleRequested ? 'Double requested' : doubleAvailable ? 'Request double' : 'Double unavailable'} loading={submitting === 'WORKED_DOUBLE'} disabled={!isCurrentMonth || doubleRequested || !doubleAvailable} onPress={() => submit('WORKED_DOUBLE')} variant="secondary" style={styles.action} />
        </View>
        <Text style={styles.hint}>{doubleAvailable ? 'Double attendance is currently available.' : 'Double attendance is available from 5:00 PM until 2:00 AM.'}</Text>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Today's requests</Text>

        {todaysRequests.length === 0 ? (
          <EmptyView
            title="No requests today"
            message="Your requests for today will appear here."
          />
        ) : (
          todaysRequests.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <View style={styles.listInfo}>
                <Text style={styles.itemTitle}>
                  {item.type === 'WORKED_DOUBLE'
                    ? 'Double attendance'
                    : item.type === 'ABSENT'
                      ? 'Absent'
                      : 'Present'}
                </Text>

                <Text style={styles.itemMeta}>
                  {formatDisplayDate(item.attendanceDate)}
                </Text>
              </View>

              <StatusBadge status={item.status} />
            </View>
          ))
        )}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.xl },
  title: { color: colors.text, ...typography.title },
  subtitle: { color: colors.textSecondary, ...typography.body, marginTop: spacing.xs },
  errorBox: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  errorText: { color: colors.danger, ...typography.caption },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  monthArrow: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  arrow: { color: colors.primary, fontSize: 28, lineHeight: 30 },
  monthTitle: { color: colors.text, ...typography.h3 },
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekDay: { width: '14.28%', textAlign: 'center', color: colors.textTertiary, ...typography.caption, fontWeight: '800' },
  calendar: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: '14.28%', aspectRatio: 0.92, alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginBottom: 4 },
  approved: {
    backgroundColor: colors.successSoft,
  },
  absent: {
    backgroundColor: colors.dangerSoft,
  },
  pending: {
    backgroundColor: colors.warningSoft,
  },
  today: { borderWidth: 1.5, borderColor: colors.primary },
  dayText: { color: colors.text, ...typography.caption, fontWeight: '700' },
  todayText: { color: colors.primary },
  marker: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 1,
  },

  absentMarker: {
    color: colors.danger,
  },
  legend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.xs },
  legendText: { color: colors.textSecondary, ...typography.caption },
  sectionTitle: { color: colors.text, ...typography.h3 },
  sectionHint: { color: colors.textSecondary, ...typography.caption, marginTop: 2, marginBottom: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  hint: { color: colors.textTertiary, ...typography.caption, textAlign: 'center', marginTop: spacing.md },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  listInfo: { flex: 1 },
  itemTitle: { color: colors.text, ...typography.bodyMedium },
  itemMeta: { color: colors.textSecondary, ...typography.caption, marginTop: 2 },
});
