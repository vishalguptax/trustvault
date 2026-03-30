import { Injectable } from '@nestjs/common';
import * as pako from 'pako';

@Injectable()
export class BitstringStatusListService {
  createEmptyList(size: number = 131072): string {
    const byteLength = Math.ceil(size / 8);
    const bitstring = new Uint8Array(byteLength);
    return this.encode(bitstring);
  }

  encode(bitstring: Uint8Array): string {
    const compressed = pako.gzip(bitstring);
    return Buffer.from(compressed).toString('base64url');
  }

  decode(encodedList: string): Uint8Array {
    const compressed = Buffer.from(encodedList, 'base64url');
    return pako.ungzip(compressed);
  }

  getBit(encodedList: string, index: number): boolean {
    const bitstring = this.decode(encodedList);
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    return (bitstring[byteIndex] & (1 << (7 - bitIndex))) !== 0;
  }

  setBit(encodedList: string, index: number, value: boolean): string {
    const bitstring = this.decode(encodedList);
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;

    if (value) {
      bitstring[byteIndex] = bitstring[byteIndex] | (1 << (7 - bitIndex));
    } else {
      bitstring[byteIndex] = bitstring[byteIndex] & ~(1 << (7 - bitIndex));
    }

    return this.encode(bitstring);
  }
}
