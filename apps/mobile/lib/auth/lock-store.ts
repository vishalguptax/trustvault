import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

const TAG = '[LockStore]';
const MPIN_HASH_KEY = 'trustvault_mpin_hash';
const LOCK_ENABLED_KEY = 'trustvault_lock_enabled';
const BIOMETRIC_ENABLED_KEY = 'trustvault_biometric_enabled';

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

async function getLocalAuth() {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-local-authentication') as typeof import('expo-local-authentication');
  } catch (err) {
    console.warn(`${TAG} LocalAuthentication unavailable:`, err);
    return null;
  }
}

async function storeItem(key: string, value: string): Promise<void> {
  const store = await getSecureStore();
  if (store) {
    await store.setItemAsync(key, value);
  } else {
    memoryStore[key] = value;
  }
}

async function getItem(key: string): Promise<string | null> {
  const store = await getSecureStore();
  return store
    ? await store.getItemAsync(key)
    : memoryStore[key] ?? null;
}

async function deleteItem(key: string): Promise<void> {
  const store = await getSecureStore();
  if (store) {
    await store.deleteItemAsync(key);
  } else {
    delete memoryStore[key];
  }
}

async function hashPin(pin: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin,
  );
  return digest;
}

export async function setMpin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  await storeItem(MPIN_HASH_KEY, hash);
  console.log(`${TAG} MPIN hash stored`);
}

export async function verifyMpin(pin: string): Promise<boolean> {
  const storedHash = await getItem(MPIN_HASH_KEY);
  if (!storedHash) {
    console.log(`${TAG} verifyMpin: no stored hash`);
    return false;
  }
  const inputHash = await hashPin(pin);
  const match = inputHash === storedHash;
  console.log(`${TAG} verifyMpin: ${match ? 'match' : 'mismatch'}`);
  return match;
}

export async function hasMpin(): Promise<boolean> {
  const hash = await getItem(MPIN_HASH_KEY);
  const exists = hash !== null;
  console.log(`${TAG} hasMpin: ${exists}`);
  return exists;
}

export async function clearMpin(): Promise<void> {
  await deleteItem(MPIN_HASH_KEY);
  await deleteItem(LOCK_ENABLED_KEY);
  await deleteItem(BIOMETRIC_ENABLED_KEY);
  console.log(`${TAG} MPIN and lock preferences cleared`);
}

export async function setLockEnabled(enabled: boolean): Promise<void> {
  await storeItem(LOCK_ENABLED_KEY, enabled ? '1' : '0');
  console.log(`${TAG} lock enabled: ${enabled}`);
}

export async function isLockEnabled(): Promise<boolean> {
  const value = await getItem(LOCK_ENABLED_KEY);
  const enabled = value === '1';
  console.log(`${TAG} isLockEnabled: ${enabled}`);
  return enabled;
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await storeItem(BIOMETRIC_ENABLED_KEY, enabled ? '1' : '0');
  console.log(`${TAG} biometric enabled: ${enabled}`);
}

export async function isBiometricEnabled(): Promise<boolean> {
  const value = await getItem(BIOMETRIC_ENABLED_KEY);
  const enabled = value === '1';
  console.log(`${TAG} isBiometricEnabled: ${enabled}`);
  return enabled;
}

export async function isBiometricAvailable(): Promise<boolean> {
  const localAuth = await getLocalAuth();
  if (!localAuth) {
    console.log(`${TAG} biometric: not available (no module)`);
    return false;
  }
  const compatible = await localAuth.hasHardwareAsync();
  if (!compatible) {
    console.log(`${TAG} biometric: no hardware`);
    return false;
  }
  const enrolled = await localAuth.isEnrolledAsync();
  console.log(`${TAG} biometric available: ${enrolled}`);
  return enrolled;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const localAuth = await getLocalAuth();
  if (!localAuth) {
    console.log(`${TAG} biometric auth: module unavailable`);
    return false;
  }
  try {
    const result = await localAuth.authenticateAsync({
      promptMessage: 'Unlock TrustVault',
      cancelLabel: 'Use PIN',
      disableDeviceFallback: true,
    });
    console.log(`${TAG} biometric auth: ${result.success ? 'success' : 'failed'}`);
    return result.success;
  } catch (err) {
    console.warn(`${TAG} biometric auth error:`, err);
    return false;
  }
}
