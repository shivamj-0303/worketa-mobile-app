import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { colors } from '../theme';
import { AuthUser } from '../types/api';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, primary: colors.primary },
};

export function AppNavigator({ user, onLogin, onLogout }: { user: AuthUser | null; onLogin: (user: AuthUser) => void; onLogout: () => void }) {
  return <NavigationContainer theme={navigationTheme}>{user ? <MainNavigator user={user} onLogout={onLogout} /> : <AuthNavigator onLogin={onLogin} />}</NavigationContainer>;
}
