import { describe, it, expect, beforeEach } from 'vitest';
import { BitstringStatusListService } from '../../src/modules/status/bitstring-status-list.service';

describe('BitstringStatusListService', () => {
  let service: BitstringStatusListService;

  beforeEach(() => {
    service = new BitstringStatusListService();
  });

  it('should create an empty status list', () => {
    const encodedList = service.createEmptyList(1024);
    expect(encodedList).toBeDefined();
    expect(encodedList.length).toBeGreaterThan(0);
  });

  it('should encode and decode a bitstring', () => {
    const original = new Uint8Array(128);
    original[0] = 0b10101010;
    original[10] = 0b11001100;

    const encoded = service.encode(original);
    const decoded = service.decode(encoded);

    expect(decoded[0]).toBe(0b10101010);
    expect(decoded[10]).toBe(0b11001100);
  });

  it('should get and set individual bits', () => {
    const encodedList = service.createEmptyList(256);

    expect(service.getBit(encodedList, 0)).toBe(false);
    expect(service.getBit(encodedList, 42)).toBe(false);

    const updated1 = service.setBit(encodedList, 42, true);
    expect(service.getBit(updated1, 42)).toBe(true);
    expect(service.getBit(updated1, 0)).toBe(false);
    expect(service.getBit(updated1, 43)).toBe(false);

    const updated2 = service.setBit(updated1, 42, false);
    expect(service.getBit(updated2, 42)).toBe(false);
  });

  it('should handle multiple revocations', () => {
    let list = service.createEmptyList(256);

    list = service.setBit(list, 10, true);
    list = service.setBit(list, 20, true);
    list = service.setBit(list, 30, true);

    expect(service.getBit(list, 10)).toBe(true);
    expect(service.getBit(list, 20)).toBe(true);
    expect(service.getBit(list, 30)).toBe(true);
    expect(service.getBit(list, 15)).toBe(false);

    list = service.setBit(list, 20, false);
    expect(service.getBit(list, 10)).toBe(true);
    expect(service.getBit(list, 20)).toBe(false);
    expect(service.getBit(list, 30)).toBe(true);
  });

  it('should handle revocation check flow under 10 seconds', () => {
    const start = Date.now();

    let list = service.createEmptyList(131072);

    list = service.setBit(list, 42, true);
    const isRevoked = service.getBit(list, 42);
    const isActive = !isRevoked;

    expect(Date.now() - start).toBeLessThan(10000);
    expect(isRevoked).toBe(true);
    expect(isActive).toBe(false);
  });

  it('should handle boundary indices (first and last bit)', () => {
    const size = 256;
    let list = service.createEmptyList(size);

    list = service.setBit(list, 0, true);
    list = service.setBit(list, 255, true);

    expect(service.getBit(list, 0)).toBe(true);
    expect(service.getBit(list, 255)).toBe(true);
    expect(service.getBit(list, 1)).toBe(false);
    expect(service.getBit(list, 254)).toBe(false);
  });

  it('should not corrupt adjacent bits when setting a bit', () => {
    let list = service.createEmptyList(256);

    list = service.setBit(list, 7, true);

    for (let i = 0; i < 16; i++) {
      if (i === 7) {
        expect(service.getBit(list, i)).toBe(true);
      } else {
        expect(service.getBit(list, i)).toBe(false);
      }
    }
  });

  it('should handle setting the same bit to true twice (idempotent)', () => {
    let list = service.createEmptyList(256);

    list = service.setBit(list, 50, true);
    list = service.setBit(list, 50, true);

    expect(service.getBit(list, 50)).toBe(true);
  });

  it('should handle setting a bit to false when already false (idempotent)', () => {
    const list = service.createEmptyList(256);
    const updated = service.setBit(list, 50, false);

    expect(service.getBit(updated, 50)).toBe(false);
  });

  it('should produce a valid base64url-encoded string', () => {
    const list = service.createEmptyList(1024);
    expect(list).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('should roundtrip encode/decode for large lists', () => {
    const size = 131072;
    let list = service.createEmptyList(size);

    list = service.setBit(list, 0, true);
    list = service.setBit(list, 65535, true);
    list = service.setBit(list, 131071, true);

    expect(service.getBit(list, 0)).toBe(true);
    expect(service.getBit(list, 65535)).toBe(true);
    expect(service.getBit(list, 131071)).toBe(true);
    expect(service.getBit(list, 1)).toBe(false);
    expect(service.getBit(list, 65536)).toBe(false);
  });

  it('should create lists of specified default size', () => {
    const list = service.createEmptyList();
    const decoded = service.decode(list);
    expect(decoded.length).toBe(Math.ceil(131072 / 8));
  });

  it('should handle batch revocation and reinstatement', () => {
    let list = service.createEmptyList(1024);
    const indices = [100, 200, 300, 400, 500];

    for (const idx of indices) {
      list = service.setBit(list, idx, true);
    }

    for (const idx of indices) {
      expect(service.getBit(list, idx)).toBe(true);
    }

    list = service.setBit(list, 200, false);
    list = service.setBit(list, 400, false);

    expect(service.getBit(list, 100)).toBe(true);
    expect(service.getBit(list, 200)).toBe(false);
    expect(service.getBit(list, 300)).toBe(true);
    expect(service.getBit(list, 400)).toBe(false);
    expect(service.getBit(list, 500)).toBe(true);
  });
});
