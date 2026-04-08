export declare class BitstringStatusListService {
    createEmptyList(size?: number): string;
    encode(bitstring: Uint8Array): string;
    decode(encodedList: string): Uint8Array;
    getBit(encodedList: string, index: number): boolean;
    setBit(encodedList: string, index: number, value: boolean): string;
}
//# sourceMappingURL=bitstring-status-list.service.d.ts.map