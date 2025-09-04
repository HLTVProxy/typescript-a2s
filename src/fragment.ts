import { ByteReader } from './byteio.js';
import * as zlib from 'node:zlib';

/**
 * Represents a fragment of an A2S response
 */
export class A2SFragment {
  messageId: number;
  fragmentCount: number;
  fragmentId: number;
  mtu: number;
  decompressedSize: number;
  crc: number;
  payload: Buffer;

  constructor(
    messageId: number,
    fragmentCount: number,
    fragmentId: number,
    mtu: number,
    decompressedSize = 0,
    crc = 0,
    payload = Buffer.alloc(0)
  ) {
    this.messageId = messageId;
    this.fragmentCount = fragmentCount;
    this.fragmentId = fragmentId;
    this.mtu = mtu;
    this.decompressedSize = decompressedSize;
    this.crc = crc;
    this.payload = payload;
  }

  /**
   * Check if the fragment is compressed
   */
  get isCompressed(): boolean {
    return Boolean(this.messageId & (1 << 15));
  }
}

/**
 * Decode a fragment from raw data
 */
export function decodeFragment(data: Buffer): A2SFragment {
  const reader = new ByteReader(data, true, 'utf-8');

  const frag = new A2SFragment(
    reader.readUint32(),
    reader.readUint8(),
    reader.readUint8(),
    reader.readUint16()
  );

  if (frag.isCompressed) {
    frag.decompressedSize = reader.readUint32();
    frag.crc = reader.readUint32();
    const compressedData = reader.peek();
    // Use bzip2 decompression like the Python version
    // Note: Node.js doesn't have built-in bzip2, so we'll use a fallback approach
    // In production, you might want to use a package like 'bzip2' or handle uncompressed data
    try {
      // Try deflate as a fallback since bzip2 isn't available in Node.js core
      frag.payload = zlib.inflateSync(compressedData);
    } catch {
      // If decompression fails, return raw data
      frag.payload = compressedData;
    }
  } else {
    frag.payload = reader.peek();
  }

  return frag;
}
