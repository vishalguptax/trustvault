"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitstringStatusListService = void 0;
const common_1 = require("@nestjs/common");
const pako = __importStar(require("pako"));
let BitstringStatusListService = class BitstringStatusListService {
    createEmptyList(size = 131072) {
        const byteLength = Math.ceil(size / 8);
        const bitstring = new Uint8Array(byteLength);
        return this.encode(bitstring);
    }
    encode(bitstring) {
        const compressed = pako.gzip(bitstring);
        return Buffer.from(compressed).toString('base64url');
    }
    decode(encodedList) {
        const compressed = Buffer.from(encodedList, 'base64url');
        return pako.ungzip(compressed);
    }
    getBit(encodedList, index) {
        const bitstring = this.decode(encodedList);
        const byteIndex = Math.floor(index / 8);
        const bitIndex = index % 8;
        return (bitstring[byteIndex] & (1 << (7 - bitIndex))) !== 0;
    }
    setBit(encodedList, index, value) {
        const bitstring = this.decode(encodedList);
        const byteIndex = Math.floor(index / 8);
        const bitIndex = index % 8;
        if (value) {
            bitstring[byteIndex] = bitstring[byteIndex] | (1 << (7 - bitIndex));
        }
        else {
            bitstring[byteIndex] = bitstring[byteIndex] & ~(1 << (7 - bitIndex));
        }
        return this.encode(bitstring);
    }
};
exports.BitstringStatusListService = BitstringStatusListService;
exports.BitstringStatusListService = BitstringStatusListService = __decorate([
    (0, common_1.Injectable)()
], BitstringStatusListService);
//# sourceMappingURL=bitstring-status-list.service.js.map