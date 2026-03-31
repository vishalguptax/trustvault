import { Platform } from 'react-native';

const TAG = '[TokenStore]';
const REFRESH_TOKEN_KEY = 'trustvault_refresh_token';

let memoryStore: Record<string, string> = {};

async function getSecureStore() {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-secure-store') as typeof import('expo-secure-store');
  } catch (err) {
    console.warn(`${TAG} SecureStore unavailable, using memory:`, err);
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await getSecureStore();
  const token = store
    ? await store.getItemAsync(REFRESH_TOKEN_KEY)
    : memoryStore[REFRESH_TOKEN_KEY] ?? null;
  console.log(`${TAG} getRefreshToken: ${token ? 'found' : 'none'} (${store ? 'secure' : 'memory'})`);
  return token;
}

export async function setRefreshToken(token: string): Promise<void> {
  const store = await getSecureStore();
  if (store) {
    await store.setItemAsync(REFRESH_TOKEN_KEY, token);
  } else {
    memoryStore[REFRESH_TOKEN_KEY] = token;
  }
  console.log(`${TAG} setRefreshToken: stored (${store ? 'secure' : 'memory'})`);
}

export async function clearRefreshToken(): Promise<void> {
  const store = await getSecureStore();
  if (store) {
    await store.deleteItemAsync(REFRESH_TOKEN_KEY);
  } else {
    delete memoryStore[REFRESH_TOKEN_KEY];
  }
  console.log(`${TAG} clearRefreshToken: cleared`);
}
