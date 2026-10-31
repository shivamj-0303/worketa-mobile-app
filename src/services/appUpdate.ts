import { Linking } from 'react-native';

const CURRENT_VERSION_CODE = 4;
const UPDATE_MANIFEST_URL =
  'https://raw.githubusercontent.com/shivamj-0303/worketa-mobile-app/main/update-manifest.json';

export interface RequiredUpdate {
  versionName: string;
  apkUrl: string;
  releaseNotes: string;
}

interface UpdateManifest {
  latestVersionCode: number;
  minimumVersionCode: number;
  versionName: string;
  apkUrl: string;
  releaseNotes?: string;
}

function isUpdateManifest(value: unknown): value is UpdateManifest {
  if (!value || typeof value !== 'object') return false;

  const manifest = value as Partial<UpdateManifest>;
  return (
    typeof manifest.latestVersionCode === 'number' &&
    typeof manifest.minimumVersionCode === 'number' &&
    typeof manifest.versionName === 'string' &&
    typeof manifest.apkUrl === 'string' &&
    manifest.apkUrl.startsWith('https://')
  );
}

export async function checkForRequiredUpdate(): Promise<RequiredUpdate | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(UPDATE_MANIFEST_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const manifest: unknown = await response.json();
    if (!isUpdateManifest(manifest)) return null;

    const updateRequired =
      CURRENT_VERSION_CODE < manifest.minimumVersionCode ||
      CURRENT_VERSION_CODE < manifest.latestVersionCode;

    return updateRequired
      ? {
          versionName: manifest.versionName,
          apkUrl: manifest.apkUrl,
          releaseNotes: manifest.releaseNotes ?? 'A newer version is available.',
        }
      : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function openUpdateDownload(url: string): Promise<void> {
  await Linking.openURL(url);
}
