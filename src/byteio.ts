import { BufferExhaustedError } from './exceptions.js';

/**
 * Utility class for reading binary data from a Buffer
 */
export class ByteReader {
  private buffer: Buffer;
  private position: number;
  private encoding: string | null;
  private littleEndian: boolean;

  constructor(
    buffer: Buffer,
    littleEndian = true,
    encoding: string | null = null
  ) {
    this.buffer = buffer;
    this.position = 0;
    this.encoding = encoding;
    this.littleEndian = littleEndian;
  }

  /**
   * Read bytes from the buffer
   */
  read(size: number): Buffer {
    if (this.position + size > this.buffer.length) {
      throw new BufferExhaustedError(
        `Cannot read ${size} bytes from position ${this.position}`
      );
    }
    const data = this.buffer.subarray(this.position, this.position + size);
    this.position += size;
    return data;
  }

  /**
   * Peek at bytes without advancing position
   */
  peek(size?: number): Buffer {
    const endPos =
      size !== undefined
        ? Math.min(this.position + size, this.buffer.length)
        : this.buffer.length;
    return this.buffer.subarray(this.position, endPos);
  }

  /**
   * Read a signed 8-bit integer
   */
  readInt8(): number {
    const data = this.read(1);
    return data.readInt8(0);
  }

  /**
   * Read an unsigned 8-bit integer
   */
  readUint8(): number {
    const data = this.read(1);
    return data.readUInt8(0);
  }

  /**
   * Read a signed 16-bit integer
   */
  readInt16(): number {
    const data = this.read(2);
    return this.littleEndian ? data.readInt16LE(0) : data.readInt16BE(0);
  }

  /**
   * Read an unsigned 16-bit integer
   */
  readUint16(): number {
    const data = this.read(2);
    return this.littleEndian ? data.readUInt16LE(0) : data.readUInt16BE(0);
  }

  /**
   * Read a signed 32-bit integer
   */
  readInt32(): number {
    const data = this.read(4);
    return this.littleEndian ? data.readInt32LE(0) : data.readInt32BE(0);
  }

  /**
   * Read an unsigned 32-bit integer
   */
  readUint32(): number {
    const data = this.read(4);
    return this.littleEndian ? data.readUInt32LE(0) : data.readUInt32BE(0);
  }

  /**
   * Read a signed 64-bit integer (BigInt)
   */
  readInt64(): bigint {
    const data = this.read(8);
    return this.littleEndian ? data.readBigInt64LE(0) : data.readBigInt64BE(0);
  }

  /**
   * Read an unsigned 64-bit integer (BigInt)
   */
  readUint64(): bigint {
    const data = this.read(8);
    return this.littleEndian
      ? data.readBigUInt64LE(0)
      : data.readBigUInt64BE(0);
  }

  /**
   * Read a 32-bit float
   */
  readFloat(): number {
    const data = this.read(4);
    return this.littleEndian ? data.readFloatLE(0) : data.readFloatBE(0);
  }

  /**
   * Read a 64-bit double
   */
  readDouble(): number {
    const data = this.read(8);
    return this.littleEndian ? data.readDoubleLE(0) : data.readDoubleBE(0);
  }

  /**
   * Read a boolean (1 byte)
   */
  readBool(): boolean {
    return this.readInt8() !== 0;
  }

  /**
   * Read a single character
   */
  readChar(): string | Buffer {
    const data = this.read(1);
    if (this.encoding !== null) {
      return data.toString(this.encoding as BufferEncoding);
    }
    return data;
  }

  /**
   * Read a null-terminated string
   */
  readCString(): string | Buffer {
    const bytes: number[] = [];
    let byte: number;

    do {
      byte = this.readUint8();
      if (byte !== 0) {
        bytes.push(byte);
      }
    } while (byte !== 0);

    const buffer = Buffer.from(bytes);
    if (this.encoding !== null) {
      return buffer.toString(this.encoding as BufferEncoding);
    }
    return buffer;
  }
}

/**
 * Utility class for writing binary data to a Buffer
 */
export class ByteWriter {
  private buffers: Buffer[] = [];
  private encoding: string | null;
  private littleEndian: boolean;

  constructor(littleEndian = true, encoding: string | null = null) {
    this.encoding = encoding;
    this.littleEndian = littleEndian;
  }

  /**
   * Write raw bytes
   */
  write(data: Buffer): void {
    this.buffers.push(data);
  }

  /**
   * Write a signed 8-bit integer
   */
  writeInt8(value: number): void {
    const buffer = Buffer.alloc(1);
    buffer.writeInt8(value, 0);
    this.write(buffer);
  }

  /**
   * Write an unsigned 8-bit integer
   */
  writeUint8(value: number): void {
    const buffer = Buffer.alloc(1);
    buffer.writeUInt8(value, 0);
    this.write(buffer);
  }

  /**
   * Write a signed 16-bit integer
   */
  writeInt16(value: number): void {
    const buffer = Buffer.alloc(2);
    if (this.littleEndian) {
      buffer.writeInt16LE(value, 0);
    } else {
      buffer.writeInt16BE(value, 0);
    }
    this.write(buffer);
  }

  /**
   * Write an unsigned 16-bit integer
   */
  writeUint16(value: number): void {
    const buffer = Buffer.alloc(2);
    if (this.littleEndian) {
      buffer.writeUInt16LE(value, 0);
    } else {
      buffer.writeUInt16BE(value, 0);
    }
    this.write(buffer);
  }

  /**
   * Write a signed 32-bit integer
   */
  writeInt32(value: number): void {
    const buffer = Buffer.alloc(4);
    if (this.littleEndian) {
      buffer.writeInt32LE(value, 0);
    } else {
      buffer.writeInt32BE(value, 0);
    }
    this.write(buffer);
  }

  /**
   * Write an unsigned 32-bit integer
   */
  writeUint32(value: number): void {
    const buffer = Buffer.alloc(4);
    if (this.littleEndian) {
      buffer.writeUInt32LE(value, 0);
    } else {
      buffer.writeUInt32BE(value, 0);
    }
    this.write(buffer);
  }

  /**
   * Write a signed 64-bit integer (BigInt)
   */
  writeInt64(value: bigint): void {
    const buffer = Buffer.alloc(8);
    if (this.littleEndian) {
      buffer.writeBigInt64LE(value, 0);
    } else {
      buffer.writeBigInt64BE(value, 0);
    }
    this.write(buffer);
  }

  /**
   * Write an unsigned 64-bit integer (BigInt)
   */
  writeUint64(value: bigint): void {
    const buffer = Buffer.alloc(8);
    if (this.littleEndian) {
      buffer.writeBigUInt64LE(value, 0);
    } else {
      buffer.writeBigUInt64BE(value, 0);
    }
    this.write(buffer);
  }

  /**
   * Write a 32-bit float
   */
  writeFloat(value: number): void {
    const buffer = Buffer.alloc(4);
    if (this.littleEndian) {
      buffer.writeFloatLE(value, 0);
    } else {
      buffer.writeFloatBE(value, 0);
    }
    this.write(buffer);
  }

  /**
   * Write a 64-bit double
   */
  writeDouble(value: number): void {
    const buffer = Buffer.alloc(8);
    if (this.littleEndian) {
      buffer.writeDoubleLE(value, 0);
    } else {
      buffer.writeDoubleBE(value, 0);
    }
    this.write(buffer);
  }

  /**
   * Write a boolean as a byte
   */
  writeBool(value: boolean): void {
    this.writeInt8(value ? 1 : 0);
  }

  /**
   * Write a character
   */
  writeChar(value: string): void {
    const buffer =
      this.encoding !== null
        ? Buffer.from(value, this.encoding as BufferEncoding)
        : Buffer.from(value);
    this.write(buffer);
  }

  /**
   * Write a null-terminated string
   */
  writeCString(value: string | Buffer): void {
    let buffer: Buffer;
    if (typeof value === 'string') {
      buffer =
        this.encoding !== null
          ? Buffer.from(value, this.encoding as BufferEncoding)
          : Buffer.from(value);
    } else {
      buffer = value;
    }
    this.write(buffer);
    this.writeUint8(0);
  }

  /**
   * Get the final buffer
   */
  toBuffer(): Buffer {
    return Buffer.concat(this.buffers);
  }
}
