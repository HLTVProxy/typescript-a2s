import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { A2SFragment, decodeFragment } from '../fragment.js';
import { ByteWriter } from '../byteio.js';
import * as zlib from 'node:zlib';

// Mock zlib for testing
vi.mock('node:zlib');

describe('A2SFragment', () => {
  describe('constructor', () => {
    it('should create fragment with required parameters', () => {
      const fragment = new A2SFragment(123, 4, 2, 1200);

      expect(fragment.messageId).toBe(123);
      expect(fragment.fragmentCount).toBe(4);
      expect(fragment.fragmentId).toBe(2);
      expect(fragment.mtu).toBe(1200);
      expect(fragment.decompressedSize).toBe(0);
      expect(fragment.crc).toBe(0);
      expect(fragment.payload).toEqual(Buffer.alloc(0));
    });

    it('should create fragment with all parameters', () => {
      const payload = Buffer.from('test payload');
      const fragment = new A2SFragment(
        123,
        4,
        2,
        1200,
        512,
        0x12345678,
        payload
      );

      expect(fragment.messageId).toBe(123);
      expect(fragment.fragmentCount).toBe(4);
      expect(fragment.fragmentId).toBe(2);
      expect(fragment.mtu).toBe(1200);
      expect(fragment.decompressedSize).toBe(512);
      expect(fragment.crc).toBe(0x12345678);
      expect(fragment.payload).toBe(payload);
    });
  });

  describe('isCompressed getter', () => {
    it('should return false for uncompressed fragment', () => {
      const fragment = new A2SFragment(123, 4, 2, 1200);
      expect(fragment.isCompressed).toBe(false);
    });

    it('should return true for compressed fragment', () => {
      // Set bit 15 (0x8000) to indicate compression
      const compressedMessageId = 123 | (1 << 15);
      const fragment = new A2SFragment(compressedMessageId, 4, 2, 1200);
      expect(fragment.isCompressed).toBe(true);
    });

    it('should correctly handle various message IDs', () => {
      // Test different values
      const tests = [
        { messageId: 0, expected: false },
        { messageId: 1, expected: false },
        { messageId: 0x7fff, expected: false },
        { messageId: 0x8000, expected: true },
        { messageId: 0x8001, expected: true },
        { messageId: 0xffff, expected: true },
      ];

      tests.forEach(({ messageId, expected }) => {
        const fragment = new A2SFragment(messageId, 1, 0, 1200);
        expect(fragment.isCompressed).toBe(expected);
      });
    });
  });
});

describe('decodeFragment', () => {
  let mockInflateSync: any;

  beforeEach(() => {
    mockInflateSync = vi.mocked(zlib.inflateSync);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should decode uncompressed fragment correctly', () => {
    // Create test data
    const writer = new ByteWriter(true, 'utf-8');
    writer.writeUint32(123); // messageId
    writer.writeUint8(4); // fragmentCount
    writer.writeUint8(2); // fragmentId
    writer.writeUint16(1200); // mtu

    const payload = Buffer.from('test payload');
    writer.write(payload);

    const testData = writer.toBuffer();

    const fragment = decodeFragment(testData);

    expect(fragment.messageId).toBe(123);
    expect(fragment.fragmentCount).toBe(4);
    expect(fragment.fragmentId).toBe(2);
    expect(fragment.mtu).toBe(1200);
    expect(fragment.payload).toEqual(payload);
    expect(fragment.isCompressed).toBe(false);
    expect(mockInflateSync).not.toHaveBeenCalled();
  });

  it('should decode compressed fragment with successful decompression', () => {
    // Create compressed fragment data
    const compressedMessageId = 123 | (1 << 15); // Set compression bit
    const writer = new ByteWriter(true, 'utf-8');
    writer.writeUint32(compressedMessageId);
    writer.writeUint8(4); // fragmentCount
    writer.writeUint8(2); // fragmentId
    writer.writeUint16(1200); // mtu
    writer.writeUint32(512); // decompressedSize
    writer.writeUint32(0x12345678); // crc

    const compressedPayload = Buffer.from('compressed data');
    const decompressedPayload = Buffer.from('decompressed data');
    writer.write(compressedPayload);

    mockInflateSync.mockReturnValue(decompressedPayload);

    const testData = writer.toBuffer();
    const fragment = decodeFragment(testData);

    expect(fragment.messageId).toBe(compressedMessageId);
    expect(fragment.fragmentCount).toBe(4);
    expect(fragment.fragmentId).toBe(2);
    expect(fragment.mtu).toBe(1200);
    expect(fragment.decompressedSize).toBe(512);
    expect(fragment.crc).toBe(0x12345678);
    expect(fragment.payload).toEqual(decompressedPayload);
    expect(fragment.isCompressed).toBe(true);
    expect(mockInflateSync).toHaveBeenCalledWith(compressedPayload);
  });

  it('should handle decompression failure gracefully', () => {
    // Create compressed fragment data
    const compressedMessageId = 123 | (1 << 15); // Set compression bit
    const writer = new ByteWriter(true, 'utf-8');
    writer.writeUint32(compressedMessageId);
    writer.writeUint8(4); // fragmentCount
    writer.writeUint8(2); // fragmentId
    writer.writeUint16(1200); // mtu
    writer.writeUint32(512); // decompressedSize
    writer.writeUint32(0x12345678); // crc

    const compressedPayload = Buffer.from('invalid compressed data');
    writer.write(compressedPayload);

    // Mock decompression failure
    mockInflateSync.mockImplementation(() => {
      throw new Error('Decompression failed');
    });

    const testData = writer.toBuffer();
    const fragment = decodeFragment(testData);

    expect(fragment.messageId).toBe(compressedMessageId);
    expect(fragment.fragmentCount).toBe(4);
    expect(fragment.fragmentId).toBe(2);
    expect(fragment.mtu).toBe(1200);
    expect(fragment.decompressedSize).toBe(512);
    expect(fragment.crc).toBe(0x12345678);
    // Should fall back to raw compressed data
    expect(fragment.payload).toEqual(compressedPayload);
    expect(fragment.isCompressed).toBe(true);
    expect(mockInflateSync).toHaveBeenCalledWith(compressedPayload);
  });

  it('should handle minimal fragment data', () => {
    // Create minimal fragment (only required fields)
    const writer = new ByteWriter(true, 'utf-8');
    writer.writeUint32(42); // messageId
    writer.writeUint8(1); // fragmentCount
    writer.writeUint8(0); // fragmentId
    writer.writeUint16(1500); // mtu
    // No payload

    const testData = writer.toBuffer();
    const fragment = decodeFragment(testData);

    expect(fragment.messageId).toBe(42);
    expect(fragment.fragmentCount).toBe(1);
    expect(fragment.fragmentId).toBe(0);
    expect(fragment.mtu).toBe(1500);
    expect(fragment.payload).toEqual(Buffer.alloc(0));
    expect(fragment.isCompressed).toBe(false);
  });

  it('should handle edge case message IDs', () => {
    const testCases = [
      0, // Minimum
      0x7fff, // Maximum uncompressed
      0x8000, // Minimum compressed
      0xffffffff, // Maximum 32-bit
    ];

    testCases.forEach((messageId) => {
      const writer = new ByteWriter(true, 'utf-8');
      writer.writeUint32(messageId);
      writer.writeUint8(1); // fragmentCount
      writer.writeUint8(0); // fragmentId
      writer.writeUint16(1500); // mtu

      if (messageId & (1 << 15)) {
        // Compressed fragment needs additional fields
        writer.writeUint32(0); // decompressedSize
        writer.writeUint32(0); // crc
      }

      const testData = writer.toBuffer();
      const fragment = decodeFragment(testData);

      expect(fragment.messageId).toBe(messageId);
      expect(fragment.isCompressed).toBe(Boolean(messageId & (1 << 15)));
    });
  });
});
