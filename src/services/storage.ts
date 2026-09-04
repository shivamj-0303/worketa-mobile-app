import * as SecureStore from 'expo-secure-store';
import { AuthUser } from '../types/api';

const ACCESS_TOKEN = 'worketa.accessToken';
const REFRESH_TOKEN = 'worketa.refreshToken';
const USER = 'worketa.user';

export interface StoredSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}

export async function getSession(): Promise<StoredSession> {
  const [accessToken, refreshToken, userJson] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN),
    SecureStore.getItemAsync(REFRESH_TOKEN),
    SecureStore.getItemAsync(USER),
  ]);

  let user: AuthUser | null = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson) as AuthUser;
    } catch {
      user = null;
    }
  }
  return { accessToken, refreshToken, user };
}

export async function saveSession(accessToken: string, refreshToken: string, user: AuthUser): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN, refreshToken),
    SecureStore.setItemAsync(USER, JSON.stringify(user)),
  ]);
}

export async function updateAccessToken(accessToken: string, refreshToken?: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN, accessToken);
  if (refreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN, refreshToken);
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN),
    SecureStore.deleteItemAsync(REFRESH_TOKEN),
    SecureStore.deleteItemAsync(USER),
  ]);
}
