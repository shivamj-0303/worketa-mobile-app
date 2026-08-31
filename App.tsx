import React, { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const API_BASE_URL = 'http://10.0.2.2:8080/api/v1';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId?: string;
  email?: string;
  employeeId?: string;
}

interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
  dailyWage: number;
  presentDays: number;
  doubledDays: number;
  absentDays: number;
  requestedPresentDays?: number;
  requestedDoubledDays?: number;
  requestedAbsentDays?: number;
  grossAmount: number;
  bonusAmount: number;
  advanceDeduction: number;
  netAmount: number;
  requestedAdvanceAmount?: number;
  requestedBonusAmount?: number;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  attendanceDate: string;
  type: 'PRESENT' | 'ABSENT' | 'WORKED_DOUBLE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface AdvanceRecord {
  id: string;
  employeeId: string;
  amount: number;
  advanceDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  settled?: boolean;
}

interface PayrollRecord {
  id: string;
  month?: string;
  periodStart?: string;
  periodEnd?: string;
  netAmount?: number;
  settledAt?: string;
}

interface EmployeeProfile {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  employeeCode?: string;
  type?: string;
  joiningDate?: string;
  dailyWage?: number;
  active?: boolean;
}

async function getStoredSession() {
  const accessToken = await SecureStore.getItemAsync('accessToken');
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  const userJson = await SecureStore.getItemAsync('user');
  return {
    accessToken,
    refreshToken,
    user: userJson ? JSON.parse(userJson) : null,
  };
}

async function storeSession(accessToken: string, refreshToken: string, user: unknown) {
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('refreshToken', refreshToken);
  await SecureStore.setItemAsync('user', JSON.stringify(user));
}

async function clearSession() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
  await SecureStore.deleteItemAsync('user');
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = await getStoredSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }

  return data.data as T;
}

async function getEmployeeProfile(employeeId?: string) {
  if (!employeeId) return null;

  try {
    return await apiRequest<EmployeeProfile>(`/employees/${employeeId}`);
  } catch {
    return null;
  }
}

function isDoubleRequestWindow() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 17 || hour < 2;
}

function getBusinessDate(date = new Date()) {
  const businessDate = new Date(date);
  if (businessDate.getHours() < 3) {
    businessDate.setDate(businessDate.getDate() - 1);
  }
  return `${businessDate.getFullYear()}-${String(businessDate.getMonth() + 1).padStart(2, '0')}-${String(businessDate.getDate()).padStart(2, '0')}`;
}

function getBusinessDateObject() {
  return new Date(`${getBusinessDate()}T12:00:00`);
}

function getFirstName(name?: string, email?: string) {
  const source = name?.trim() || email?.split('@')[0] || 'Employee';
  return source.split(/\s+/)[0];
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<{ accessToken: string | null; user: any } | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      const stored = await getStoredSession();
      setSession({
        accessToken: stored.accessToken,
        user: stored.user,
      });
      setBooting(false);
    };

    bootstrap();
  }, []);

  if (booting) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Worketa</Text>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      {session?.accessToken ? (
        <MainTabs user={session.user} onLogout={() => setSession(null)} />
      ) : (
        <AuthStack onLogin={(user) => setSession({ accessToken: 'persisted', user })} />
      )}
    </NavigationContainer>
  );
}

function AuthStack({ onLogin }: { onLogin: (user: any) => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen">
        {(props) => <LoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function MainTabs({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Workspace" options={({ navigation }) => ({
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#ffffff',
        headerTitle: 'WORKETA',
        headerRight: () => <TouchableOpacity style={styles.accountButton} onPress={() => navigation.navigate('Profile')}><View style={styles.avatarSmall}><Text style={styles.avatarLetter}>{getFirstName(user?.fullName, user?.email).charAt(0).toUpperCase()}</Text></View></TouchableOpacity>,
      })}>
        {() => <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarActiveTintColor: '#22c55e', tabBarInactiveTintColor: '#94a3b8', tabBarLabelStyle: styles.tabLabel }}>
          <Tab.Screen name="Dashboard" options={{ tabBarIcon: ({ focused }) => <View style={[styles.tabIcon, focused && styles.tabIconActive]}><Text style={styles.tabIconText}>H</Text></View> }} children={() => <DashboardScreen user={user} />} />
          <Tab.Screen name="Attendance" options={{ tabBarIcon: ({ focused }) => <View style={[styles.tabIcon, focused && styles.tabIconActive]}><Text style={styles.tabIconText}>A</Text></View> }} children={() => <AttendanceScreen user={user} />} />
          <Tab.Screen name="Advances" options={{ tabBarIcon: ({ focused }) => <View style={[styles.tabIcon, focused && styles.tabIconActive]}><Text style={styles.tabIconText}>$</Text></View> }} children={() => <AdvancesScreen user={user} />} />
        </Tab.Navigator>}
      </Stack.Screen>
      <Stack.Screen name="Profile" options={{ title: 'Account', headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff' }}>
        {() => <ProfileScreen user={user} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      const result = (await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })) as LoginResponse;

      const employeeProfile = await getEmployeeProfile(result.employeeId || result.userId);

      const user = {
        id: result.employeeId || result.userId || 'employee-user',
        email,
        fullName: employeeProfile?.fullName || getFirstName(undefined, email),
        role: 'EMPLOYEE',
      };

      await storeSession(result.accessToken, result.refreshToken, user);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.loginCard}>
          <Text style={styles.title}>WORKETA</Text>
          <Text style={styles.subtitle}>Employee Portal</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.inputBox}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.inputBox}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter password"
            placeholderTextColor="#94a3b8"
            editable={!loading}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity onPress={handleLogin} disabled={loading}>
            <Text style={styles.primaryButton}>{loading ? 'Signing in...' : 'Login'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DashboardScreen({ user }: { user: any }) {
  const [summary, setSummary] = useState<EmployeeSummary | null>(null);
  const [history, setHistory] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadSummary = async () => {
    const employeeId = user?.id || 'demo-employee';
    try {
      setRefreshing(true);
      setError('');
        const data = await apiRequest<EmployeeSummary>(`/payroll/summary/${employeeId}`);
        setSummary(data);
    } catch (summaryError) {
      setSummary(null);
      setError(summaryError instanceof Error ? summaryError.message : 'Unable to load the latest payroll summary');
    }

    try {
        const historyRecords = await apiRequest<PayrollRecord[]>(`/payroll/employee/${employeeId}`);
        setHistory(historyRecords.slice(0, 4));
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [user]);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSummary} tintColor="#22c55e" />}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back, {getFirstName(user?.fullName, user?.email)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={styles.grid}>
          <StatCard label="Present" value={String(summary?.requestedPresentDays ?? summary?.presentDays ?? 0)} tone="green" />
          <StatCard label="Absent" value={String(summary?.requestedAbsentDays ?? summary?.absentDays ?? 0)} tone="red" />
          <StatCard label="Daily wage" value={`₹${Number(summary?.dailyWage ?? 0).toFixed(2)}`} tone="blue" />
          <StatCard label="Bonus" value={`₹${Number(summary?.requestedBonusAmount ?? summary?.bonusAmount ?? 0).toFixed(2)}`} tone="amber" />
          <StatCard label="Advance" value={`₹${Number(summary?.requestedAdvanceAmount ?? summary?.advanceDeduction ?? 0).toFixed(2)}`} tone="purple" />
          <StatCard label="Double" value={String(summary?.requestedDoubledDays ?? summary?.doubledDays ?? 0)} tone="teal" />
        </View>
      )}
      <View style={styles.historyCard}>
        <Text style={styles.sectionTitle}>Recent history</Text>
        {history.length === 0 ? <Text style={styles.emptyText}>No settled payroll history yet.</Text> : history.map((item) => <View key={item.id} style={styles.historyRow}><View><Text style={styles.itemTitle}>{item.month || item.periodEnd || 'Payroll'}</Text><Text style={styles.itemMeta}>{item.settledAt ? new Date(item.settledAt).toLocaleDateString() : 'Settled'}</Text></View><Text style={styles.historyAmount}>₹{Number(item.netAmount || 0).toFixed(2)}</Text></View>)}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AttendanceScreen({ user }: { user: any }) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getBusinessDateObject);
  const [requestError, setRequestError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const refreshAttendance = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      const records = await apiRequest<AttendanceRecord[]>(`/attendance/employee/${user?.id || 'demo-employee'}?month=${monthKey}`);
      setAttendance(records);
      setRequestError('');
    } catch (error) {
      setAttendance([]);
      setRequestError('Unable to load attendance requests');
    } finally {
      setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshAttendance();
  }, [user, month]);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const monthDays = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  const attendanceByDate = attendance.reduce<Record<string, AttendanceRecord>>((result, record) => {
    result[record.attendanceDate] = record;
    return result;
  }, {});
  const today = new Date();
  const todayKey = getBusinessDate(today);
  const businessDate = new Date(`${todayKey}T12:00:00`);
  const isCurrentMonth = month.getFullYear() === businessDate.getFullYear() && month.getMonth() === businessDate.getMonth();
  const hasPresentRequest = isCurrentMonth && attendance.some((item) => item.attendanceDate === todayKey && item.type === 'PRESENT');
  const hasDoubleRequest = isCurrentMonth && attendance.some((item) => item.attendanceDate === todayKey && item.type === 'WORKED_DOUBLE');
  const canRequestToday = isCurrentMonth;

  const submitAttendance = async (type: 'PRESENT' | 'WORKED_DOUBLE') => {
    const today = getBusinessDate();
    const existingRequest = attendance.find((item) => item.attendanceDate === today && item.type === type);
    if (existingRequest) {
      setRequestError(`A ${type === 'PRESENT' ? 'Present' : 'Double'} request already exists for today`);
      return;
    }

    try {
      setRequestError('');
      await apiRequest('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: user?.id || 'demo-employee',
          attendanceDate: today,
          type,
          status: 'PENDING',
        }),
      });
      await refreshAttendance();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to submit attendance request');
    }
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAttendance} tintColor="#22c55e" />}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Mark Attendance</Text>
        <Text style={styles.headerSubtitle}>Every request is reviewed by admin before approval.</Text>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Text style={styles.monthButton}>‹</Text></TouchableOpacity>
          <Text style={styles.monthTitle}>{month.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</Text>
          <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Text style={styles.monthButton}>›</Text></TouchableOpacity>
        </View>
        <View style={styles.weekRow}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>)}</View>
        <View style={styles.calendarGrid}>
          {monthDays.map((day, index) => {
            const date = day ? `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
            const record = date ? attendanceByDate[date] : undefined;
            return <View key={`${date}-${index}`} style={[styles.calendarDay, record?.status === 'APPROVED' && styles.calendarApproved, record?.status === 'PENDING' && styles.calendarPending]}><Text style={styles.calendarDayText}>{day || ''}</Text>{record ? <Text style={styles.calendarDot}>{record.type === 'WORKED_DOUBLE' ? '2x' : '•'}</Text> : null}</View>;
          })}
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionButton, (!canRequestToday || hasPresentRequest) && styles.disabledAction]} disabled={!canRequestToday || hasPresentRequest} onPress={() => submitAttendance('PRESENT')}><Text style={styles.actionText}>Request Present</Text><Text style={styles.actionHint}>{!isCurrentMonth ? 'Only available for today' : hasPresentRequest ? 'Request already submitted' : 'One present request per business day'}</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryAction, (!canRequestToday || hasDoubleRequest || !isDoubleRequestWindow()) && styles.disabledAction]} disabled={!canRequestToday || hasDoubleRequest || !isDoubleRequestWindow()} onPress={() => submitAttendance('WORKED_DOUBLE')}><Text style={styles.actionText}>Request Double</Text><Text style={styles.actionHint}>{!isCurrentMonth ? 'Only available for today' : hasDoubleRequest ? 'Request already submitted' : isDoubleRequestWindow() ? 'Available until 2:00 AM' : 'Available from 5:00 PM'}</Text></TouchableOpacity>
      </View>

      {requestError ? <Text style={styles.errorText}>{requestError}</Text> : null}

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : (
        <View style={styles.listCard}>
          {attendance.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <View>
                <Text style={styles.itemTitle}>{item.type === 'WORKED_DOUBLE' ? 'Double attendance' : 'Attendance'}</Text>
                <Text style={styles.itemMeta}>{item.attendanceDate}</Text>
              </View>
              <Text style={[styles.badge, item.status === 'APPROVED' ? styles.badgeApproved : item.status === 'REJECTED' ? styles.badgeRejected : styles.badgePending]}>
                {item.status}
              </Text>
            </View>
          ))}
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AdvancesScreen({ user }: { user: any }) {
  const [advances, setAdvances] = useState<AdvanceRecord[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadAdvances = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setAdvances(await apiRequest<AdvanceRecord[]>(`/advances/employee/${user?.id}`));
    } catch (err: any) {
      setError(err.message || 'Unable to load advances');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadAdvances(); }, [user]);

  const requestAdvance = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter an amount greater than zero');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await apiRequest('/advances', {
        method: 'POST',
        body: JSON.stringify({ employeeId: user?.id, amount: numericAmount, note }),
      });
      setAmount('');
      setNote('');
      setMessage('Advance request sent for admin approval');
      await loadAdvances();
    } catch (err: any) {
      setError(err.message || 'Unable to request advance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAdvances} tintColor="#22c55e" />}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Advances</Text>
          <Text style={styles.headerSubtitle}>Request financial help and track admin decisions.</Text>
        </View>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Request an advance</Text>
          <Text style={styles.label}>Amount</Text>
          <TextInput style={styles.inputBox} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Enter amount" placeholderTextColor="#94a3b8" />
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput style={[styles.inputBox, styles.noteInput]} value={note} onChangeText={setNote} placeholder="Add a short note" placeholderTextColor="#94a3b8" multiline />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {message ? <Text style={styles.successText}>{message}</Text> : null}
          <TouchableOpacity onPress={requestAdvance} disabled={submitting}><Text style={[styles.primaryButton, submitting && styles.disabledButton]}>{submitting ? 'Requesting...' : 'Request Advance'}</Text></TouchableOpacity>
        </View>
        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Request history</Text>
          {loading ? <ActivityIndicator color="#2563eb" /> : advances.length === 0 ? <Text style={styles.emptyText}>No advance requests yet.</Text> : advances.map((advance) => <View key={advance.id} style={styles.listItem}><View><Text style={styles.itemTitle}>₹{Number(advance.amount || 0).toFixed(2)}</Text><Text style={styles.itemMeta}>{advance.advanceDate}</Text></View><Text style={[styles.badge, advance.status === 'APPROVED' ? styles.badgeApproved : advance.status === 'REJECTED' ? styles.badgeRejected : styles.badgePending]}>{advance.status}</Text></View>)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileScreen({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const employee = await apiRequest<EmployeeProfile>(`/employees/${user?.id || 'demo-employee'}`);
        setProfile(employee);
      } catch (error) {
        setProfile({
          id: user?.id || 'demo-employee',
          fullName: user?.fullName || 'Demo Employee',
          email: user?.email || 'demo@worketa.com',
          phone: '+91 98765 43210',
          employeeCode: 'EMP-0001',
          type: 'Driver',
          joiningDate: '2024-06-15',
          dailyWage: 500,
          active: true,
        });
      }
    };

    loadProfile();
  }, [user]);

  const logout = async () => {
    await clearSession();
    onLogout();
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    try {
      setChangingPassword(true);
      await apiRequest('/users/me/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordDialogOpen(false);
    } catch (err: any) {
      setPasswordError(err.message || 'Unable to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Employee information</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHero}>
            <View style={styles.avatarLarge}><Text style={styles.avatarLargeText}>{getFirstName(profile?.fullName || user?.fullName, user?.email).charAt(0).toUpperCase()}</Text></View>
            <View style={styles.profileHeroText}><Text style={styles.profileName}>{profile?.fullName || user?.fullName || 'Employee'}</Text><Text style={styles.profileMeta}>{user?.email || 'Employee account'}</Text></View>
          </View>
          <Text style={styles.profileMeta}>Code: {profile?.employeeCode || 'EMP-0001'}</Text>
          <Text style={styles.profileMeta}>Phone: {profile?.phone || '+91 98765 43210'}</Text>
          <Text style={styles.profileMeta}>Type: {profile?.type || 'Driver'}</Text>
          <Text style={styles.profileMeta}>Daily wage: ₹{(profile?.dailyWage ?? 500).toFixed(2)}</Text>
          <Text style={styles.profileMeta}>Joining date: {profile?.joiningDate || '2024-06-15'}</Text>
        </View>

        <View style={styles.profileCard}><Text style={styles.sectionTitle}>Account security</Text><Text style={styles.profileMeta}>Keep your login password private and up to date.</Text><TouchableOpacity onPress={() => { setPasswordError(''); setPasswordMessage(''); setPasswordDialogOpen(true); }}><Text style={styles.primaryButton}>Change password</Text></TouchableOpacity></View>

        <Modal visible={passwordDialogOpen} transparent animationType="fade" onRequestClose={() => setPasswordDialogOpen(false)}>
          <View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.sectionTitle}>Change password</Text><TouchableOpacity onPress={() => setPasswordDialogOpen(false)}><Text style={styles.closeText}>×</Text></TouchableOpacity></View>
            <Text style={styles.label}>Current password</Text><TextInput style={styles.inputBox} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Current password" placeholderTextColor="#94a3b8" />
            <Text style={styles.label}>New password</Text><TextInput style={styles.inputBox} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="New password" placeholderTextColor="#94a3b8" />
            <Text style={styles.label}>Confirm new password</Text><TextInput style={styles.inputBox} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Confirm password" placeholderTextColor="#94a3b8" />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}{passwordMessage ? <Text style={styles.successText}>{passwordMessage}</Text> : null}
            <TouchableOpacity onPress={handlePasswordChange} disabled={changingPassword}><Text style={[styles.primaryButton, changingPassword && styles.disabledButton]}>{changingPassword ? 'Updating...' : 'Update password'}</Text></TouchableOpacity>
          </View></View>
        </Modal>

        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: 'green' | 'red' | 'blue' | 'amber' | 'purple' | 'teal' }) {
  const colors: Record<string, string> = {
    green: '#22c55e',
    red: '#ef4444',
    blue: '#3b82f6',
    amber: '#f59e0b',
    purple: '#8b5cf6',
    teal: '#14b8a6',
  };

  return (
    <View style={[styles.statCard, { borderLeftColor: colors[tone] }]}> 
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 18, color: '#0f172a' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  screenContainer: { flex: 1, backgroundColor: '#f8fafc' },
  appShell: { flex: 1, backgroundColor: '#f8fafc' },
  appHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#0f172a' },
  brandText: { color: '#86efac', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  headerGreeting: { color: '#cbd5e1', fontSize: 12, marginTop: 3 },
  accountButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#475569' },
  avatarSmall: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#052e16', fontSize: 15, fontWeight: '800' },
  tabBar: { height: 64, paddingBottom: 8, paddingTop: 6, backgroundColor: '#0f172a', borderTopWidth: 0 },
  tabLabel: { fontSize: 11, fontWeight: '700' },
  tabIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  tabIconActive: { backgroundColor: '#166534' },
  tabIconText: { color: '#f8fafc', fontSize: 14, fontWeight: '800' },
  loginCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 32, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 18, color: '#475569', marginBottom: 18 },
  label: { color: '#475569', marginTop: 12, marginBottom: 8, fontWeight: '600' },
  inputBox: { padding: 14, backgroundColor: '#f1f5f9', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  primaryButton: { backgroundColor: '#2563eb', color: '#ffffff', textAlign: 'center', paddingVertical: 14, borderRadius: 12, fontWeight: '700', marginTop: 18 },
  errorText: { color: '#dc2626', marginTop: 10 },
  successText: { color: '#15803d', marginTop: 10 },
  disabledButton: { backgroundColor: '#93c5fd' },
  headerCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  headerSubtitle: { color: '#64748b', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#fff', padding: 18, borderRadius: 16, marginBottom: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  statLabel: { color: '#64748b', marginTop: 6 },
  historyCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginTop: 8 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  historyAmount: { color: '#166534', fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  actionButton: { flex: 1, backgroundColor: '#2563eb', paddingVertical: 14, paddingHorizontal: 10, borderRadius: 12, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  actionHint: { color: '#dbeafe', fontSize: 10, marginTop: 4, textAlign: 'center' },
  secondaryAction: { backgroundColor: '#d97706' },
  disabledAction: { backgroundColor: '#cbd5e1' },
  calendarCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  monthTitle: { color: '#0f172a', fontSize: 17, fontWeight: '700' },
  monthButton: { color: '#2563eb', fontSize: 30, lineHeight: 30, paddingHorizontal: 8 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  weekDay: { width: '14.28%', textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: '14.28%', aspectRatio: 0.9, alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginBottom: 4 },
  calendarApproved: { backgroundColor: '#dcfce7' },
  calendarPending: { backgroundColor: '#fef3c7' },
  calendarDayText: { color: '#334155', fontWeight: '600' },
  calendarDot: { color: '#16a34a', fontSize: 11, fontWeight: '800' },
  formCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 18 },
  noteInput: { minHeight: 72, textAlignVertical: 'top' },
  emptyText: { color: '#64748b', paddingVertical: 12 },
  listCard: { backgroundColor: '#fff', borderRadius: 18, padding: 12 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingVertical: 12 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  itemMeta: { color: '#64748b', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontWeight: '700', fontSize: 12, overflow: 'hidden' },
  badgeApproved: { backgroundColor: '#dcfce7', color: '#166534' },
  badgeRejected: { backgroundColor: '#fee2e2', color: '#991b1b' },
  badgePending: { backgroundColor: '#fef3c7', color: '#92400e' },
  profileCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 18 },
  profileHero: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  profileHeroText: { flex: 1, marginLeft: 14 },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#86efac' },
  avatarLargeText: { color: '#166534', fontSize: 30, fontWeight: '800' },
  profileName: { fontSize: 26, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  profileMeta: { color: '#475569', fontSize: 15, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  logoutButton: { backgroundColor: '#ef4444', color: '#fff', textAlign: 'center', paddingVertical: 14, borderRadius: 12, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.58)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeText: { color: '#64748b', fontSize: 30, lineHeight: 30 },
});

