import { describe, it, expect } from 'vitest';
import { A2SClient, info, players, rules } from '../index.js';
import type {
  SourceInfo,
  GoldSrcInfo,
  Player,
  Rules,
  ServerInfo,
} from '../index.js';
import { BrokenMessageError, BufferExhaustedError } from '../index.js';
import {
  DEFAULT_TIMEOUT,
  DEFAULT_ENCODING,
  DEFAULT_RETRIES,
} from '../index.js';
import { ByteReader, ByteWriter } from '../index.js';

describe('Index exports', () => {
  describe('Main classes and functions', () => {
    it('should export A2SClient class', () => {
      expect(A2SClient).toBeDefined();
      expect(typeof A2SClient).toBe('function');
    });

    it('should export convenience functions', () => {
      expect(info).toBeDefined();
      expect(typeof info).toBe('function');

      expect(players).toBeDefined();
      expect(typeof players).toBe('function');

      expect(rules).toBeDefined();
      expect(typeof rules).toBe('function');
    });
  });

  describe('Type exports', () => {
    it('should export types that can be used in TypeScript', () => {
      // This test verifies that types are properly exported
      // by attempting to use them in type annotations

      const sourceInfo: SourceInfo = {
        ping: 50,
        protocol: 17,
        serverName: 'Test',
        mapName: 'map',
        folder: 'folder',
        game: 'game',
        appId: 1,
        playerCount: 0,
        maxPlayers: 0,
        botCount: 0,
        serverType: 'd',
        platform: 'l',
        passwordProtected: false,
        vacEnabled: false,
        version: '1.0',
        edf: 0,
      };

      const goldSrcInfo: GoldSrcInfo = {
        ping: 80,
        address: '127.0.0.1:27015',
        serverName: 'Test',
        mapName: 'map',
        folder: 'folder',
        game: 'game',
        playerCount: 0,
        maxPlayers: 0,
        protocol: 48,
        serverType: 'd',
        platform: 'l',
        passwordProtected: false,
        isMod: false,
        vacEnabled: false,
        botCount: 0,
      };

      const player: Player = {
        index: 0,
        name: 'Player',
        score: 100,
        duration: 300,
      };

      const rules: Rules = {
        rule1: 'value1',
        rule2: 'value2',
      };

      const serverInfo: ServerInfo = sourceInfo;

      // These assertions verify the types are working
      expect(sourceInfo.ping).toBe(50);
      expect(goldSrcInfo.ping).toBe(80);
      expect(player.name).toBe('Player');
      expect(rules.rule1).toBe('value1');
      expect(serverInfo.ping).toBe(50);
    });
  });

  describe('Exception exports', () => {
    it('should export exception classes', () => {
      expect(BrokenMessageError).toBeDefined();
      expect(typeof BrokenMessageError).toBe('function');

      expect(BufferExhaustedError).toBeDefined();
      expect(typeof BufferExhaustedError).toBe('function');
    });

    it('should create working exception instances', () => {
      const brokenError = new BrokenMessageError('test message');
      expect(brokenError).toBeInstanceOf(Error);
      expect(brokenError.name).toBe('BrokenMessageError');
      expect(brokenError.message).toBe('test message');

      const bufferError = new BufferExhaustedError('buffer error');
      expect(bufferError).toBeInstanceOf(BrokenMessageError);
      expect(bufferError.name).toBe('BufferExhaustedError');
      expect(bufferError.message).toBe('buffer error');
    });
  });

  describe('Constants exports', () => {
    it('should export default constants', () => {
      expect(DEFAULT_TIMEOUT).toBeDefined();
      expect(typeof DEFAULT_TIMEOUT).toBe('number');
      expect(DEFAULT_TIMEOUT).toBe(3.0);

      expect(DEFAULT_ENCODING).toBeDefined();
      expect(typeof DEFAULT_ENCODING).toBe('string');
      expect(DEFAULT_ENCODING).toBe('utf-8');

      expect(DEFAULT_RETRIES).toBeDefined();
      expect(typeof DEFAULT_RETRIES).toBe('number');
      expect(DEFAULT_RETRIES).toBe(5);
    });
  });

  describe('Utility classes exports', () => {
    it('should export ByteReader and ByteWriter', () => {
      expect(ByteReader).toBeDefined();
      expect(typeof ByteReader).toBe('function');

      expect(ByteWriter).toBeDefined();
      expect(typeof ByteWriter).toBe('function');
    });

    it('should create working ByteReader and ByteWriter instances', () => {
      const writer = new ByteWriter(true, 'utf-8');
      writer.writeUint8(42);
      writer.writeCString('test');

      const buffer = writer.toBuffer();
      expect(buffer).toBeInstanceOf(Buffer);

      const reader = new ByteReader(buffer, true, 'utf-8');
      expect(reader.readUint8()).toBe(42);
      expect(reader.readCString()).toBe('test');
    });
  });

  describe('Module structure', () => {
    it('should provide all necessary exports for A2S functionality', () => {
      // Verify that all essential exports are available
      const essentialExports = [
        'A2SClient',
        'info',
        'players',
        'rules',
        'BrokenMessageError',
        'BufferExhaustedError',
        'DEFAULT_TIMEOUT',
        'DEFAULT_ENCODING',
        'DEFAULT_RETRIES',
        'ByteReader',
        'ByteWriter',
      ];

      // Import all exports from the module
      const moduleExports = {
        A2SClient,
        info,
        players,
        rules,
        BrokenMessageError,
        BufferExhaustedError,
        DEFAULT_TIMEOUT,
        DEFAULT_ENCODING,
        DEFAULT_RETRIES,
        ByteReader,
        ByteWriter,
      };

      essentialExports.forEach((exportName) => {
        expect(
          moduleExports[exportName as keyof typeof moduleExports]
        ).toBeDefined();
      });
    });
  });
});
