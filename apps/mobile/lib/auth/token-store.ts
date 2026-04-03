import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TAG = '[TokenStore]';
const REFRESH_TOKEN_KEY = 'trustilock_refresh_token';

export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  console.log(`${TAG} getRefreshToken: ${token ? 'found' : 'none'}`);
  return token;
}

export async function setRefreshToken(token: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  console.log(`${TAG} setRefreshToken: stored`);
}

export async function clearRefreshToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  console.log(`${TAG} clearRefreshToken: cleared`);
}
