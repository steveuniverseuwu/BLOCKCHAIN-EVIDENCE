import { CID } from 'multiformats/cid';
import * as raw from 'multiformats/codecs/raw';
import { sha256 as sha256Digest } from 'multiformats/hashes/sha2';

const encoder = new TextEncoder();

export function arrayBufferToHex(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex) {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

export async function computeSha256Hex(input) {
  const buffer =
    input instanceof ArrayBuffer
      ? input
      : input instanceof Uint8Array
        ? input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
        : encoder.encode(String(input)).buffer;

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return arrayBufferToHex(hashBuffer);
}

export async function hashHexPair(leftHex, rightHex) {
  const leftBytes = hexToBytes(leftHex);
  const rightBytes = hexToBytes(rightHex);
  const merged = new Uint8Array(leftBytes.length + rightBytes.length);
  merged.set(leftBytes, 0);
  merged.set(rightBytes, leftBytes.length);
  const hashBuffer = await crypto.subtle.digest('SHA-256', merged);
  return arrayBufferToHex(hashBuffer);
}

export async function createIpfsCid(buffer) {
  const bytes =
    buffer instanceof Uint8Array
      ? buffer
      : new Uint8Array(
          buffer instanceof ArrayBuffer
            ? buffer
            : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        );

  const digest = await sha256Digest.digest(bytes);
  const cid = CID.createV1(raw.code, digest);
  return cid.toString();
}

export function generatePolygonTxHash() {
  const random = crypto.getRandomValues(new Uint8Array(32));
  return `0x${arrayBufferToHex(random)}`;
}

export function generateProofId() {
  const random = crypto.getRandomValues(new Uint8Array(8));
  return `ZKP-${arrayBufferToHex(random).toUpperCase()}`;
}

export function randomId(prefix = 'id') {
  if (typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  const random = crypto.getRandomValues(new Uint8Array(16));
  return `${prefix}-${arrayBufferToHex(random)}`;
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** exponent;
  return `${size.toFixed(size >= 10 || size % 1 === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function formatIsoTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'n/a';
  }
  return date.toLocaleString();
}
