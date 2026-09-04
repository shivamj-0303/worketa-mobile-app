import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme';
import { AuthUser } from '../types/api';
import { getInitials } from '../utils/format';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AttendanceScreen } from '../screens/AttendanceScreen';
import { AdvancesScreen } from '../screens/AdvancesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MainTabParamList, RootStackParamList } from './types';

const Tabs = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const tabs = {
  Dashboard: { label: 'Home', icon: '⌂' },
  Attendance: { label: 'Attendance', icon: '✓' },
  Advances: { label: 'Advances', icon: '₹' },
};

function WorkspaceTabs({ user }: { user: AuthUser }) {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused }) => (
          <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
            <Text style={[styles.tabIconText, focused && styles.tabIconTextActive]}>{tabs[route.name].icon}</Text>
          </View>
        ),
      })}
    >
      <Tabs.Screen name="Dashboard" options={{ title: tabs.Dashboard.label }}>{() => <DashboardScreen user={user} />}</Tabs.Screen>
      <Tabs.Screen name="Attendance" options={{ title: tabs.Attendance.label }}>{() => <AttendanceScreen user={user} />}</Tabs.Screen>
      <Tabs.Screen name="Advances" options={{ title: tabs.Advances.label }}>{() => <AdvancesScreen user={user} />}</Tabs.Screen>
    </Tabs.Navigator>
  );
}

export function MainNavigator({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 18, fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Workspace"
        options={({ navigation }) => ({
          headerTitle: 'Worketa',
          headerRight: () => (
            <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => navigation.navigate('Profile')} style={styles.profileButton}>
              <Text style={styles.profileButtonText}>{getInitials(user.fullName, user.email)}</Text>
            </Pressable>
          ),
        })}
      >
        {() => <WorkspaceTabs user={user} />}
      </Stack.Screen>
      <Stack.Screen name="Profile" options={{ title: 'My profile' }}>
        {() => <ProfileScreen user={user} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: { height: 70, paddingTop: 7, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  tabLabel: { fontSize: 11, fontWeight: '700' },
  tabIcon: { width: 32, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabIconActive: { backgroundColor: colors.primarySoft },
  tabIconText: { color: colors.textTertiary, fontSize: 17, fontWeight: '800' },
  tabIconTextActive: { color: colors.primary },
  profileButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.xs },
  profileButtonText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
});
