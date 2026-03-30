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
});
