import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'trustvault_refresh_token';

let memoryStore: Record<string, string> = {};

async function getSecureStore() {
  if (Platform.OS === 'web') return null;
  return require('expo-secure-store') as typeof import('expo-secure-store');
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await getSecureStore();
  if (store) {
    return store.getItemAsync(REFRESH_TOKEN_KEY);
  }
  return memoryStore[REFRESH_TOKEN_KEY] ?? null;
}

export async function setRefreshToken(token: string): Promise<void> {
  const store = await getSecureStore();
  if (store) {
    await store.setItemAsync(REFRESH_TOKEN_KEY, token);
  } else {
    memoryStore[REFRESH_TOKEN_KEY] = token;
  }
}

export async function clearRefreshToken(): Promise<void> {
  const store = await getSecureStore();
  if (store) {
    await store.deleteItemAsync(REFRESH_TOKEN_KEY);
  } else {
    delete memoryStore[REFRESH_TOKEN_KEY];
  }
}
