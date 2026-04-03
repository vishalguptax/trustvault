import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const TAG = '[LockStore]';
const MPIN_HASH_KEY = 'trustilock_mpin_hash';
const LOCK_ENABLED_KEY = 'trustilock_lock_enabled';
const BIOMETRIC_ENABLED_KEY = 'trustilock_biometric_enabled';

// ── Storage helpers ──────────────────────────────────────────────

async function storeItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(key);
}

// ── PIN ──────────────────────────────────────────────────────────

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
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

// ── Lock toggle ──────────────────────────────────────────────────

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

// ── Biometric toggle ─────────────────────────────────────────────

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

// ── Biometric auth ───────────────────────────────────────────────

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) {
    console.log(`${TAG} biometric: no hardware`);
    return false;
  }
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  console.log(`${TAG} biometric available: ${enrolled}`);
  return enrolled;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock TrustiLock',
    cancelLabel: 'Use PIN',
    fallbackLabel: 'Use PIN',
    disableDeviceFallback: false,
  });
  const errorMsg = result.success ? 'none' : (result as { error?: string }).error ?? 'unknown';
  console.log(`${TAG} biometric auth: success=${result.success}, error=${errorMsg}`);
  return result.success;
}
