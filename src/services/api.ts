import { API_BASE_URL } from '../config/env';
import { ApiEnvelope } from '../types/api';
import { clearSession, getSession, updateAccessToken } from './storage';

let refreshPromise: Promise<string> | null = null;
let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

async function parseResponse(response: Response): Promise<ApiEnvelope<unknown>> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as ApiEnvelope<unknown>;
  } catch {
    return { message: 'The server returned an invalid response.' };
  }
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const { refreshToken } = await getSession();
    if (!refreshToken) throw new Error('Your session has expired. Please sign in again.');

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await parseResponse(response);
    const token = (data.data as { accessToken?: string; refreshToken?: string } | undefined)?.accessToken;

    if (!response.ok || data.success === false || !token) {
      throw new Error(data.message || 'Your session has expired. Please sign in again.');
    }

    await updateAccessToken(token, (data.data as { refreshToken?: string })?.refreshToken);
    return token;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, requiresAuth = true): Promise<T> {
  const makeRequest = async (token: string | null) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token && requiresAuth ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    return { response, data: await parseResponse(response) };
  };

  const session = await getSession();
  let result = await makeRequest(session.accessToken);

  if (result.response.status === 401 && requiresAuth && session.refreshToken) {
    try {
      result = await makeRequest(await refreshAccessToken());
    } catch (error) {
      await clearSession();
      sessionExpiredHandler?.();
      throw error;
    }
  }

  if (!result.response.ok || result.data.success === false) {
    throw new Error(result.data.message || getHttpError(result.response.status));
  }

  return result.data.data as T;
}

function getHttpError(status: number): string {
  if (status >= 500) return 'The server is temporarily unavailable. Please try again.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 400) return 'Please check the information and try again.';
  return 'Something went wrong. Please try again.';
}
