import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { createSocket } from 'node:dgram';
import {
  A2SSocket,
  HEADER_SIMPLE,
  HEADER_MULTI,
  A2S_CHALLENGE_RESPONSE,
} from '../socket.js';
import { BrokenMessageError } from '../exceptions.js';

// Mock dgram module
vi.mock('node:dgram');

describe('A2SSocket', () => {
  let mockSocket: any;
  let socket: A2SSocket;

  beforeEach(() => {
    // Create a mock socket that extends EventEmitter
    mockSocket = new EventEmitter();
    mockSocket.bind = vi.fn();
    mockSocket.send = vi.fn();
    mockSocket.close = vi.fn();

    // Mock createSocket to return our mock
    vi.mocked(createSocket).mockReturnValue(mockSocket);

    socket = new A2SSocket('127.0.0.1', 27015, 3000);
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (socket) {
      socket.close();
    }
  });

  describe('constructor', () => {
    it('should create socket with correct parameters', () => {
      expect(createSocket).toHaveBeenCalledWith('udp4');
      expect(mockSocket.bind).toHaveBeenCalledWith({
        port: 0,
        address: '0.0.0.0',
        exclusive: false,
      });
    });

    it('should set up event listeners', () => {
      // The socket should have exactly these listeners:
      // - 1 for 'message' (from handleMessage)
      // - 1 for 'error' (from setupSocketEvents)
      // - 1 for 'close' (from setupSocketEvents)
      // - 1 for 'listening' (from setupSocketEvents)
      // Note: The ready promise also adds a 'listening' listener temporarily
      expect(mockSocket.listenerCount('message')).toBe(1);
      expect(mockSocket.listenerCount('error')).toBe(1);
      expect(mockSocket.listenerCount('close')).toBe(1);
      expect(mockSocket.listenerCount('listening')).toBeGreaterThanOrEqual(1);
    });
  });

  describe('message handling', () => {
    beforeEach(() => {
      // Simulate socket ready
      mockSocket.emit('listening');
    });

    it('should handle simple packet correctly', async () => {
      const testData = Buffer.from('test response');
      const packet = Buffer.concat([HEADER_SIMPLE, testData]);

      const dataPromise = new Promise((resolve) => {
        socket.once('data', resolve);
      });

      mockSocket.emit('message', packet, { address: '127.0.0.1', port: 27015 });

      const receivedData = await dataPromise;
      expect(receivedData).toEqual(testData);
    });

    it('should handle multi-packet fragmentation', async () => {
      // Create mock fragment data without extra padding
      const fragmentData1 = Buffer.alloc(8);
      fragmentData1.writeUInt32LE(123, 0); // messageId
      fragmentData1.writeUInt8(2, 4); // fragmentCount
      fragmentData1.writeUInt8(0, 5); // fragmentId
      fragmentData1.writeUInt16LE(1200, 6); // mtu
      const payload1 = Buffer.from('first');

      const fragmentData2 = Buffer.alloc(8);
      fragmentData2.writeUInt32LE(123, 0); // messageId
      fragmentData2.writeUInt8(2, 4); // fragmentCount
      fragmentData2.writeUInt8(1, 5); // fragmentId
      fragmentData2.writeUInt16LE(1200, 6); // mtu
      const payload2 = Buffer.from('second');

      const packet1 = Buffer.concat([HEADER_MULTI, fragmentData1, payload1]);
      const packet2 = Buffer.concat([HEADER_MULTI, fragmentData2, payload2]);

      const dataPromise = new Promise((resolve) => {
        socket.once('data', resolve);
      });

      // Send first fragment
      mockSocket.emit('message', packet1, {
        address: '127.0.0.1',
        port: 27015,
      });

      // Send second fragment - should trigger reassembly
      mockSocket.emit('message', packet2, {
        address: '127.0.0.1',
        port: 27015,
      });

      const receivedData = await dataPromise;
      expect(receivedData).toEqual(Buffer.concat([payload1, payload2]));
    });

    it('should reject packets that are too short', () => {
      const shortPacket = Buffer.from([0xff, 0xff]); // Only 2 bytes

      const errorPromise = new Promise((resolve) => {
        socket.once('error', resolve);
      });

      mockSocket.emit('message', shortPacket, {
        address: '127.0.0.1',
        port: 27015,
      });

      return expect(errorPromise).resolves.toBeInstanceOf(BrokenMessageError);
    });

    it('should reject packets with invalid headers', () => {
      const invalidPacket = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x01, 0x02]);

      const errorPromise = new Promise((resolve) => {
        socket.once('error', resolve);
      });

      mockSocket.emit('message', invalidPacket, {
        address: '127.0.0.1',
        port: 27015,
      });

      return expect(errorPromise).resolves.toBeInstanceOf(BrokenMessageError);
    });

    it('should handle multi-packet with simple header in payload', async () => {
      // Create fragment with HEADER_SIMPLE at start of payload
      const fragmentData = Buffer.alloc(8);
      fragmentData.writeUInt32LE(123, 0); // messageId
      fragmentData.writeUInt8(1, 4); // fragmentCount
      fragmentData.writeUInt8(0, 5); // fragmentId
      fragmentData.writeUInt16LE(1200, 6); // mtu

      const payload = Buffer.concat([HEADER_SIMPLE, Buffer.from('data')]);
      const packet = Buffer.concat([HEADER_MULTI, fragmentData, payload]);

      const dataPromise = new Promise((resolve) => {
        socket.once('data', resolve);
      });

      mockSocket.emit('message', packet, { address: '127.0.0.1', port: 27015 });

      const receivedData = await dataPromise;
      expect(receivedData).toEqual(Buffer.from('data')); // Should strip HEADER_SIMPLE
    });
  });

  describe('send method', () => {
    beforeEach(() => {
      mockSocket.emit('listening');
    });

    it('should send packet with correct header', async () => {
      const testPayload = Buffer.from('test data');
      mockSocket.send.mockImplementation(
        (_packet: any, _port: any, _address: any, callback: any) => {
          callback(); // Simulate successful send
        }
      );

      await socket.send(testPayload);

      expect(mockSocket.send).toHaveBeenCalledWith(
        Buffer.concat([HEADER_SIMPLE, testPayload]),
        27015,
        '127.0.0.1',
        expect.any(Function)
      );
    });

    it('should handle send errors', async () => {
      const testPayload = Buffer.from('test data');
      const sendError = new Error('Send failed');

      mockSocket.send.mockImplementation(
        (_packet: any, _port: any, _address: any, callback: any) => {
          callback(sendError);
        }
      );

      const errorPromise = new Promise((resolve) => {
        socket.once('error', resolve);
      });

      try {
        await socket.send(testPayload);
      } catch (err) {
        // Expected to throw
      }

      const error = await errorPromise;
      expect(error).toBe(sendError);
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should not send when socket is closed', async () => {
      socket.close();

      const testPayload = Buffer.from('test data');
      await socket.send(testPayload);

      expect(mockSocket.send).not.toHaveBeenCalled();
    });
  });

  describe('request method', () => {
    beforeEach(() => {
      mockSocket.emit('listening');
    });

    it('should return response data', async () => {
      const testPayload = Buffer.from('request');
      const responseData = Buffer.from('response');

      mockSocket.send.mockImplementation(
        (_packet: any, _port: any, _address: any, callback: any) => {
          callback(); // Simulate successful send
          // Simulate response
          setTimeout(() => {
            socket.emit('data', responseData);
          }, 10);
        }
      );

      const result = await socket.request(testPayload);
      expect(result).toEqual(responseData);
    });

    it('should timeout when no response received', async () => {
      const shortTimeoutSocket = new A2SSocket('127.0.0.1', 27015, 100); // 100ms timeout

      mockSocket.send.mockImplementation(
        (_packet: any, _port: any, _address: any, callback: any) => {
          callback(); // Simulate successful send but no response
        }
      );

      const testPayload = Buffer.from('request');

      await expect(shortTimeoutSocket.request(testPayload)).rejects.toThrow(
        'Request timeout'
      );
    });

    it('should handle errors during request', async () => {
      const testPayload = Buffer.from('request');
      const error = new Error('Socket error');

      mockSocket.send.mockImplementation(
        (_packet: any, _port: any, _address: any, callback: any) => {
          callback(); // Simulate successful send
          // Simulate error
          setTimeout(() => {
            socket.emit('error', error);
          }, 10);
        }
      );

      await expect(socket.request(testPayload)).rejects.toThrow('Socket error');
    });

    it('should handle send failure during request', async () => {
      const testPayload = Buffer.from('request');
      const sendError = new Error('Send failed');

      mockSocket.send.mockImplementation(
        (_packet: any, _port: any, _address: any, callback: any) => {
          callback(sendError);
        }
      );

      await expect(socket.request(testPayload)).rejects.toThrow('Send failed');
    });
  });

  describe('close method', () => {
    it('should close socket', () => {
      socket.close();
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should not close socket multiple times', () => {
      socket.close();
      socket.close();
      expect(mockSocket.close).toHaveBeenCalledTimes(1);
    });

    it('should mark socket as closed', () => {
      socket.close();
      // Verify socket is marked as closed by trying to send
      const testPayload = Buffer.from('test');
      socket.send(testPayload); // Should not call mockSocket.send
      expect(mockSocket.send).not.toHaveBeenCalled();
    });
  });

  describe('error propagation', () => {
    it('should propagate socket errors', () => {
      const error = new Error('Socket error');
      const errorPromise = new Promise((resolve) => {
        socket.once('error', resolve);
      });

      mockSocket.emit('error', error);

      return expect(errorPromise).resolves.toBe(error);
    });

    it('should propagate close events', () => {
      const closePromise = new Promise((resolve) => {
        socket.once('close', resolve);
      });

      mockSocket.emit('close');

      return expect(closePromise).resolves.toBeUndefined();
    });
  });

  describe('constants', () => {
    it('should export correct header constants', () => {
      expect(HEADER_SIMPLE).toEqual(Buffer.from([0xff, 0xff, 0xff, 0xff]));
      expect(HEADER_MULTI).toEqual(Buffer.from([0xfe, 0xff, 0xff, 0xff]));
    });

    it('should export correct challenge response constant', () => {
      expect(A2S_CHALLENGE_RESPONSE).toBe(0x41);
    });
  });
});
