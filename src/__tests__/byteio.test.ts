import { describe, it, expect, beforeEach } from 'vitest';
import { ByteReader, ByteWriter } from '../byteio.js';
import { BufferExhaustedError } from '../exceptions.js';

describe('ByteReader', () => {
  let reader: ByteReader;
  let testBuffer: Buffer;

  beforeEach(() => {
    // Create a test buffer with known values
    testBuffer = Buffer.from([
      // Uint8: 42
      42,
      // Int8: -1
      0xff,
      // Uint16 LE: 1234
      0xd2, 0x04,
      // Int16 LE: -1234
      0x2e, 0xfb,
      // Uint32 LE: 1234567890
      0xd2, 0x02, 0x96, 0x49,
      // Int32 LE: -1234567890
      0x2e, 0xfd, 0x69, 0xb6,
      // Float32 LE: 3.14159
      0xd0, 0x0f, 0x49, 0x40,
      // Bool: true
      0x01,
      // Bool: false
      0x00,
      // CString: "hello"
      0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00,
      // Char: 'A'
      0x41,
      // Uint64 LE: 1234567890123456789
      0x15, 0x81, 0xe9, 0x7d, 0xf4, 0x10, 0x22, 0x11,
    ]);
    reader = new ByteReader(testBuffer, true, 'utf-8');
  });

  describe('Basic reading operations', () => {
    it('should read uint8 correctly', () => {
      expect(reader.readUint8()).toBe(42);
    });

    it('should read int8 correctly', () => {
      reader.readUint8(); // Skip first byte
      expect(reader.readInt8()).toBe(-1);
    });

    it('should read uint16 little endian correctly', () => {
      reader.read(2); // Skip first two bytes
      expect(reader.readUint16()).toBe(1234);
    });

    it('should read int16 little endian correctly', () => {
      reader.read(4); // Skip first four bytes
      expect(reader.readInt16()).toBe(-1234);
    });

    it('should read uint32 little endian correctly', () => {
      reader.read(6); // Skip to uint32
      expect(reader.readUint32()).toBe(1234567890);
    });

    it('should read int32 little endian correctly', () => {
      reader.read(10); // Skip to int32
      expect(reader.readInt32()).toBe(-1234567890);
    });

    it('should read float correctly', () => {
      reader.read(14); // Skip to float
      const value = reader.readFloat();
      expect(value).toBeCloseTo(3.14159, 5);
    });

    it('should read uint64 correctly', () => {
      reader.read(testBuffer.length - 8); // Skip to uint64
      expect(reader.readUint64()).toBe(1234567890123456789n);
    });
  });

  describe('Boolean and character operations', () => {
    it('should read boolean true correctly', () => {
      reader.read(18); // Skip to first bool
      expect(reader.readBool()).toBe(true);
    });

    it('should read boolean false correctly', () => {
      reader.read(19); // Skip to second bool
      expect(reader.readBool()).toBe(false);
    });

    it('should read character correctly', () => {
      reader.read(26); // Skip to char
      expect(reader.readChar()).toBe('A');
    });

    it('should read null-terminated string correctly', () => {
      reader.read(20); // Skip to cstring
      expect(reader.readCString()).toBe('hello');
    });
  });

  describe('Buffer operations', () => {
    it('should read raw bytes correctly', () => {
      const data = reader.read(3);
      expect(data).toEqual(Buffer.from([42, 0xff, 0xd2]));
    });

    it('should peek without advancing position', () => {
      const peeked = reader.peek(3);
      expect(peeked).toEqual(Buffer.from([42, 0xff, 0xd2]));
      // Position should not have changed
      expect(reader.readUint8()).toBe(42);
    });

    it('should peek all remaining bytes when no size specified', () => {
      reader.read(3); // Advance position
      const remaining = reader.peek();
      expect(remaining.length).toBe(testBuffer.length - 3);
    });
  });

  describe('Big endian mode', () => {
    it('should read uint16 big endian correctly', () => {
      const beReader = new ByteReader(Buffer.from([0x04, 0xd2]), false);
      expect(beReader.readUint16()).toBe(1234);
    });

    it('should read uint32 big endian correctly', () => {
      const beReader = new ByteReader(
        Buffer.from([0x49, 0x96, 0x02, 0xd2]),
        false
      );
      expect(beReader.readUint32()).toBe(1234567890);
    });
  });

  describe('Error handling', () => {
    it('should throw BufferExhaustedError when reading beyond buffer', () => {
      reader.read(testBuffer.length); // Read all bytes
      expect(() => reader.readUint8()).toThrow(BufferExhaustedError);
    });

    it('should throw BufferExhaustedError with correct message', () => {
      reader.read(testBuffer.length - 1);
      expect(() => reader.read(2)).toThrow('Cannot read 2 bytes from position');
    });
  });

  describe('Encoding handling', () => {
    it('should return Buffer when encoding is null', () => {
      const noEncodingReader = new ByteReader(
        Buffer.from([0x41, 0x00]),
        true,
        null
      );
      const char = noEncodingReader.readChar();
      expect(char).toBeInstanceOf(Buffer);
      expect((char as Buffer)[0]).toBe(0x41);
    });

    it('should return string when encoding is specified', () => {
      const char = reader.readChar();
      expect(typeof char).toBe('string');
    });
  });
});

describe('ByteWriter', () => {
  let writer: ByteWriter;

  beforeEach(() => {
    writer = new ByteWriter(true, 'utf-8');
  });

  describe('Basic writing operations', () => {
    it('should write uint8 correctly', () => {
      writer.writeUint8(42);
      const buffer = writer.toBuffer();
      expect(buffer).toEqual(Buffer.from([42]));
    });

    it('should write int8 correctly', () => {
      writer.writeInt8(-1);
      const buffer = writer.toBuffer();
      expect(buffer).toEqual(Buffer.from([0xff]));
    });

    it('should write uint16 little endian correctly', () => {
      writer.writeUint16(1234);
      const buffer = writer.toBuffer();
      expect(buffer).toEqual(Buffer.from([0xd2, 0x04]));
    });

    it('should write int16 little endian correctly', () => {
      writer.writeInt16(-1234);
      const buffer = writer.toBuffer();
      expect(buffer).toEqual(Buffer.from([0x2e, 0xfb]));
    });

    it('should write uint32 little endian correctly', () => {
      writer.writeUint32(1234567890);
      const buffer = writer.toBuffer();
      expect(buffer).toEqual(Buffer.from([0xd2, 0x02, 0x96, 0x49]));
    });

    it('should write int32 little endian correctly', () => {
      writer.writeInt32(-1234567890);
      const buffer = writer.toBuffer();
      expect(buffer).toEqual(Buffer.from([0x2e, 0xfd, 0x69, 0xb6]));
    });

    it('should write uint64 correctly', () => {
      writer.writeUint64(1234567890123456789n);
      const buffer = writer.toBuffer();
      expect(buffer).toEqual(
        Buffer.from([0x15, 0x81, 0xe9, 0x7d, 0xf4, 0x10, 0x22, 0x11])
      );
    });

    it('should write float correctly', () => {
      writer.writeFloat(3.14159);
      const buffer = writer.toBuffer();
      // Allow some floating point precision tolerance
      const reader = new ByteReader(buffer);
      expect(reader.readFloat()).toBeCloseTo(3.14159, 5);
    });
  });

  describe('Boolean and character operations', () => {
    it('should write boolean true correctly', () => {
      writer.writeBool(true);
      const buffer = writer.toBuffer();
      expect(buffer).toEqual(Buffer.from([0x01]));
    });

    it('should write boolean false correctly', () => {
      writer.writeBool(false);
      const buffer = writer.toBuffer();
      expect(buffer).toEqual(Buffer.from([0x00]));
    });

    it('should write character correctly', () => {
      writer.writeChar('A');
      const buffer = writer.toBuffer();
      expect(buffer).toEqual(Buffer.from([0x41]));
    });

    it('should write null-terminated string correctly', () => {
      writer.writeCString('hello');
      const buffer = writer.toBuffer();
      expect(buffer).toEqual(Buffer.from([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00]));
    });

    it('should write null-terminated buffer correctly', () => {
      writer.writeCString(Buffer.from('world'));
      const buffer = writer.toBuffer();
      expect(buffer).toEqual(Buffer.from([0x77, 0x6f, 0x72, 0x6c, 0x64, 0x00]));
    });
  });

  describe('Big endian mode', () => {
    it('should write uint16 big endian correctly', () => {
      const beWriter = new ByteWriter(false);
      beWriter.writeUint16(1234);
      const buffer = beWriter.toBuffer();
      expect(buffer).toEqual(Buffer.from([0x04, 0xd2]));
    });

    it('should write uint32 big endian correctly', () => {
      const beWriter = new ByteWriter(false);
      beWriter.writeUint32(1234567890);
      const buffer = beWriter.toBuffer();
      expect(buffer).toEqual(Buffer.from([0x49, 0x96, 0x02, 0xd2]));
    });
  });

  describe('Raw buffer operations', () => {
    it('should write raw buffer correctly', () => {
      const rawData = Buffer.from([1, 2, 3, 4]);
      writer.write(rawData);
      const buffer = writer.toBuffer();
      expect(buffer).toEqual(rawData);
    });

    it('should concatenate multiple writes correctly', () => {
      writer.writeUint8(1);
      writer.writeUint16(2);
      writer.writeUint32(3);
      const buffer = writer.toBuffer();
      expect(buffer.length).toBe(7); // 1 + 2 + 4 bytes

      const reader = new ByteReader(buffer);
      expect(reader.readUint8()).toBe(1);
      expect(reader.readUint16()).toBe(2);
      expect(reader.readUint32()).toBe(3);
    });
  });

  describe('Round-trip operations', () => {
    it('should correctly round-trip all data types', () => {
      // Write various data types
      writer.writeUint8(42);
      writer.writeInt8(-1);
      writer.writeUint16(1234);
      writer.writeInt16(-1234);
      writer.writeUint32(1234567890);
      writer.writeInt32(-1234567890);
      writer.writeFloat(3.14159);
      writer.writeBool(true);
      writer.writeBool(false);
      writer.writeCString('hello');
      writer.writeChar('A');
      writer.writeUint64(1234567890123456789n);

      // Read back the data
      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      expect(reader.readUint8()).toBe(42);
      expect(reader.readInt8()).toBe(-1);
      expect(reader.readUint16()).toBe(1234);
      expect(reader.readInt16()).toBe(-1234);
      expect(reader.readUint32()).toBe(1234567890);
      expect(reader.readInt32()).toBe(-1234567890);
      expect(reader.readFloat()).toBeCloseTo(3.14159, 5);
      expect(reader.readBool()).toBe(true);
      expect(reader.readBool()).toBe(false);
      expect(reader.readCString()).toBe('hello');
      expect(reader.readChar()).toBe('A');
      expect(reader.readUint64()).toBe(1234567890123456789n);
    });
  });
});
