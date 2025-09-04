import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrokenMessageError } from '../exceptions.js';
import { DEFAULT_TIMEOUT, DEFAULT_RETRIES } from '../defaults.js';

// Mock the socket module
const mockSocket = {
  request: vi.fn(),
  close: vi.fn(),
};

vi.mock('../socket.js', () => ({
  A2SSocket: vi.fn(() => mockSocket),
  A2S_CHALLENGE_RESPONSE: 0x41,
  HEADER_SIMPLE: Buffer.from([0xff, 0xff, 0xff, 0xff]),
  HEADER_MULTI: Buffer.from([0xfe, 0xff, 0xff, 0xff]),
}));

// Mock the protocols
const mockInfoProtocol = {
  serializeRequest: vi.fn().mockReturnValue(Buffer.from('info_request')),
  validateResponseType: vi.fn().mockReturnValue(true),
  deserializeResponse: vi
    .fn()
    .mockReturnValue({ serverName: 'Test Server', ping: 50 }),
};

const mockPlayersProtocol = {
  serializeRequest: vi.fn().mockReturnValue(Buffer.from('players_request')),
  validateResponseType: vi.fn().mockReturnValue(true),
  deserializeResponse: vi
    .fn()
    .mockReturnValue([{ name: 'Player1', score: 100 }]),
};

const mockRulesProtocol = {
  serializeRequest: vi.fn().mockReturnValue(Buffer.from('rules_request')),
  validateResponseType: vi.fn().mockReturnValue(true),
  deserializeResponse: vi.fn().mockReturnValue({ mp_maxrounds: '30' }),
};

vi.mock('../protocols.js', () => ({
  InfoProtocol: vi.fn(() => mockInfoProtocol),
  PlayersProtocol: vi.fn(() => mockPlayersProtocol),
  RulesProtocol: vi.fn(() => mockRulesProtocol),
}));

import { A2SClient, info, players, rules } from '../a2s.js';
import { A2SSocket } from '../socket.js';
import { InfoProtocol, PlayersProtocol, RulesProtocol } from '../protocols.js';

const A2S_CHALLENGE_RESPONSE = 0x41;

describe('A2SClient', () => {
  let mockSocket: any;
  let mockInfoProtocol: any;
  let mockPlayersProtocol: any;
  let mockRulesProtocol: any;
  let client: A2SClient;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock socket
    mockSocket = {
      request: vi.fn(),
      close: vi.fn(),
    };
    vi.mocked(A2SSocket).mockImplementation(() => mockSocket);

    // Mock protocols
    mockInfoProtocol = {
      serializeRequest: vi.fn().mockReturnValue(Buffer.from('info_request')),
      validateResponseType: vi.fn().mockReturnValue(true),
      deserializeResponse: vi
        .fn()
        .mockReturnValue({ serverName: 'Test Server', ping: 50 }),
    };
    vi.mocked(InfoProtocol).mockImplementation(() => mockInfoProtocol);

    mockPlayersProtocol = {
      serializeRequest: vi.fn().mockReturnValue(Buffer.from('players_request')),
      validateResponseType: vi.fn().mockReturnValue(true),
      deserializeResponse: vi
        .fn()
        .mockReturnValue([{ name: 'Player1', score: 100 }]),
    };
    vi.mocked(PlayersProtocol).mockImplementation(() => mockPlayersProtocol);

    mockRulesProtocol = {
      serializeRequest: vi.fn().mockReturnValue(Buffer.from('rules_request')),
      validateResponseType: vi.fn().mockReturnValue(true),
      deserializeResponse: vi.fn().mockReturnValue({ mp_maxrounds: '30' }),
    };
    vi.mocked(RulesProtocol).mockImplementation(() => mockRulesProtocol);

    client = new A2SClient('127.0.0.1', 27015);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should create client with default parameters', () => {
      expect(A2SSocket).toHaveBeenCalledWith(
        '127.0.0.1',
        27015,
        DEFAULT_TIMEOUT * 1000
      );
    });

    it('should create client with custom parameters', () => {
      // Clear previous calls
      vi.mocked(A2SSocket).mockClear();

      new A2SClient('192.168.1.1', 27016, 5000, 'latin1');

      expect(A2SSocket).toHaveBeenCalledWith('192.168.1.1', 27016, 5000);
    });
  });

  describe('info method', () => {
    it('should query server info successfully', async () => {
      const mockResponse = Buffer.from([0x49, 0x01, 0x02, 0x03]); // Mock response
      mockSocket.request.mockResolvedValue(mockResponse);

      const result = await client.info();

      expect(InfoProtocol).toHaveBeenCalled();
      expect(mockInfoProtocol.serializeRequest).toHaveBeenCalledWith(0);
      expect(mockSocket.request).toHaveBeenCalledWith(
        Buffer.from('info_request')
      );
      expect(result).toEqual({ serverName: 'Test Server', ping: 50 });
    });

    it('should handle challenge response and retry', async () => {
      const challengeResponse = Buffer.from([
        A2S_CHALLENGE_RESPONSE,
        0x12,
        0x34,
        0x56,
        0x78,
      ]);
      const finalResponse = Buffer.from([0x49, 0x01, 0x02, 0x03]);

      mockSocket.request
        .mockResolvedValueOnce(challengeResponse)
        .mockResolvedValueOnce(finalResponse);

      const result = await client.info();

      expect(mockSocket.request).toHaveBeenCalledTimes(2);
      expect(mockInfoProtocol.serializeRequest).toHaveBeenCalledWith(0);
      expect(mockInfoProtocol.serializeRequest).toHaveBeenCalledWith(
        0x78563412
      );
      expect(result).toEqual({ serverName: 'Test Server', ping: 50 });
    });

    it('should throw error when exceeding max retries', async () => {
      const challengeResponse = Buffer.from([
        A2S_CHALLENGE_RESPONSE,
        0x12,
        0x34,
        0x56,
        0x78,
      ]);
      mockSocket.request.mockResolvedValue(challengeResponse);

      // Mock the close method to track calls
      const closeSpy = vi.spyOn(client, 'close');

      await expect(client.info()).rejects.toThrow(BrokenMessageError);
      expect(mockSocket.request).toHaveBeenCalledTimes(DEFAULT_RETRIES + 1);
      // Close is not called when exceeding retries in recursive calls
      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should throw error for invalid response type', async () => {
      const invalidResponse = Buffer.from([0x99, 0x01, 0x02, 0x03]);
      mockSocket.request.mockResolvedValue(invalidResponse);
      mockInfoProtocol.validateResponseType.mockReturnValue(false);

      await expect(client.info()).rejects.toThrow(BrokenMessageError);
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should throw error when client is closed', async () => {
      client.close();

      await expect(client.info()).rejects.toThrow(
        'A2SClient socket already closed'
      );
    });
  });

  describe('players method', () => {
    it('should query server players successfully', async () => {
      const mockResponse = Buffer.from([0x44, 0x01, 0x02, 0x03]);
      mockSocket.request.mockResolvedValue(mockResponse);

      const result = await client.players();

      expect(PlayersProtocol).toHaveBeenCalled();
      expect(mockPlayersProtocol.serializeRequest).toHaveBeenCalledWith(0);
      expect(mockSocket.request).toHaveBeenCalledWith(
        Buffer.from('players_request')
      );
      expect(result).toEqual([{ name: 'Player1', score: 100 }]);
    });
  });

  describe('rules method', () => {
    it('should query server rules successfully', async () => {
      const mockResponse = Buffer.from([0x45, 0x01, 0x02, 0x03]);
      mockSocket.request.mockResolvedValue(mockResponse);

      const result = await client.rules();

      expect(RulesProtocol).toHaveBeenCalled();
      expect(mockRulesProtocol.serializeRequest).toHaveBeenCalledWith(0);
      expect(mockSocket.request).toHaveBeenCalledWith(
        Buffer.from('rules_request')
      );
      expect(result).toEqual({ mp_maxrounds: '30' });
    });
  });

  describe('close method', () => {
    it('should close socket', () => {
      client.close();
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should not close socket multiple times', () => {
      client.close();
      client.close();
      expect(mockSocket.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should close socket after successful request', async () => {
      const mockResponse = Buffer.from([0x49, 0x01, 0x02, 0x03]);
      mockSocket.request.mockResolvedValue(mockResponse);

      await client.info();

      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should not close socket during recursive challenge handling', async () => {
      const challengeResponse = Buffer.from([
        A2S_CHALLENGE_RESPONSE,
        0x12,
        0x34,
        0x56,
        0x78,
      ]);
      const finalResponse = Buffer.from([0x49, 0x01, 0x02, 0x03]);

      mockSocket.request
        .mockResolvedValueOnce(challengeResponse)
        .mockResolvedValueOnce(finalResponse);

      const closeSpy = vi.spyOn(client, 'close');
      await client.info();

      // In recursive challenge handling, close is not called during the process
      // The socket stays open for the subsequent request with the challenge
      expect(closeSpy).not.toHaveBeenCalled();
      expect(mockSocket.request).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Convenience functions', () => {
  // Note: Convenience function tests are in a separate file (convenience.test.ts)
  // to avoid circular mocking issues
  it('should be available for import', () => {
    expect(info).toBeDefined();
    expect(players).toBeDefined();
    expect(rules).toBeDefined();
  });
});
