import { describe, it, expect, beforeEach } from 'vitest';
import {
  InfoProtocol,
  PlayersProtocol,
  RulesProtocol,
  A2S_INFO_RESPONSE,
  A2S_INFO_RESPONSE_LEGACY,
  A2S_PLAYER_RESPONSE,
  A2S_RULES_RESPONSE,
} from '../protocols.js';
import { ByteReader, ByteWriter } from '../byteio.js';
import { BrokenMessageError } from '../exceptions.js';
import type { SourceInfo, GoldSrcInfo } from '../types.js';

describe('InfoProtocol', () => {
  let protocol: InfoProtocol;

  beforeEach(() => {
    protocol = new InfoProtocol();
  });

  describe('validateResponseType', () => {
    it('should accept valid info response types', () => {
      expect(protocol.validateResponseType(A2S_INFO_RESPONSE)).toBe(true);
      expect(protocol.validateResponseType(A2S_INFO_RESPONSE_LEGACY)).toBe(
        true
      );
    });

    it('should reject invalid response types', () => {
      expect(protocol.validateResponseType(0x00)).toBe(false);
      expect(protocol.validateResponseType(A2S_PLAYER_RESPONSE)).toBe(false);
      expect(protocol.validateResponseType(A2S_RULES_RESPONSE)).toBe(false);
    });
  });

  describe('serializeRequest', () => {
    it('should serialize request without challenge', () => {
      const request = protocol.serializeRequest(0);
      const expectedHeader = Buffer.from([0x54]);
      const expectedQuery = Buffer.from('Source Engine Query\0', 'utf-8');
      const expected = Buffer.concat([expectedHeader, expectedQuery]);

      expect(request).toEqual(expected);
    });

    it('should serialize request with challenge', () => {
      const challenge = 0x12345678;
      const request = protocol.serializeRequest(challenge);

      const expectedHeader = Buffer.from([0x54]);
      const expectedQuery = Buffer.from('Source Engine Query\0', 'utf-8');
      const challengeBuffer = Buffer.alloc(4);
      challengeBuffer.writeUInt32LE(challenge, 0);
      const expected = Buffer.concat([
        expectedHeader,
        expectedQuery,
        challengeBuffer,
      ]);

      expect(request).toEqual(expected);
    });
  });

  describe('deserializeResponse - Source Engine', () => {
    it('should parse basic Source engine info response', () => {
      const writer = new ByteWriter(true, 'utf-8');

      // Write Source engine response data
      writer.writeUint8(17); // protocol
      writer.writeCString('Test Server'); // serverName
      writer.writeCString('de_dust2'); // mapName
      writer.writeCString('cstrike'); // folder
      writer.writeCString('Counter-Strike: Source'); // game
      writer.writeUint16(240); // appId
      writer.writeUint8(16); // playerCount
      writer.writeUint8(32); // maxPlayers
      writer.writeUint8(0); // botCount
      writer.writeChar('d'); // serverType (dedicated)
      writer.writeChar('l'); // platform (linux)
      writer.writeBool(false); // passwordProtected
      writer.writeBool(true); // vacEnabled
      writer.writeCString('1.0.0.0'); // version
      writer.writeUint8(0); // edf (no extra data)

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const info = protocol.deserializeResponse(
        reader,
        A2S_INFO_RESPONSE,
        50
      ) as SourceInfo;

      expect(info.protocol).toBe(17);
      expect(info.serverName).toBe('Test Server');
      expect(info.mapName).toBe('de_dust2');
      expect(info.folder).toBe('cstrike');
      expect(info.game).toBe('Counter-Strike: Source');
      expect(info.appId).toBe(240);
      expect(info.playerCount).toBe(16);
      expect(info.maxPlayers).toBe(32);
      expect(info.botCount).toBe(0);
      expect(info.serverType).toBe('d');
      expect(info.platform).toBe('l');
      expect(info.passwordProtected).toBe(false);
      expect(info.vacEnabled).toBe(true);
      expect(info.version).toBe('1.0.0.0');
      expect(info.edf).toBe(0);
      expect(info.ping).toBe(50);
    });

    it('should parse Source engine info with all EDF flags', () => {
      const writer = new ByteWriter(true, 'utf-8');

      // Write basic data
      writer.writeUint8(17); // protocol
      writer.writeCString('Test Server'); // serverName
      writer.writeCString('de_dust2'); // mapName
      writer.writeCString('cstrike'); // folder
      writer.writeCString('Counter-Strike: Source'); // game
      writer.writeUint16(240); // appId
      writer.writeUint8(16); // playerCount
      writer.writeUint8(32); // maxPlayers
      writer.writeUint8(0); // botCount
      writer.writeChar('d'); // serverType
      writer.writeChar('l'); // platform
      writer.writeBool(false); // passwordProtected
      writer.writeBool(true); // vacEnabled
      writer.writeCString('1.0.0.0'); // version

      const edf = 0x80 | 0x40 | 0x20 | 0x10 | 0x01; // All flags
      writer.writeUint8(edf);

      // EDF data
      writer.writeUint16(27015); // port
      writer.writeUint64(BigInt('76561198000000000')); // steamId
      writer.writeUint16(27020); // stvPort
      writer.writeCString('GOTV'); // stvName
      writer.writeCString('fun,casual'); // keywords
      writer.writeUint64(BigInt('240')); // gameId

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const info = protocol.deserializeResponse(
        reader,
        A2S_INFO_RESPONSE,
        50
      ) as SourceInfo;

      expect(info.edf).toBe(edf);
      expect(info.port).toBe(27015);
      expect(info.steamId).toBe(BigInt('76561198000000000'));
      expect(info.stvPort).toBe(27020);
      expect(info.stvName).toBe('GOTV');
      expect(info.keywords).toBe('fun,casual');
      expect(info.gameId).toBe(BigInt('240'));
    });

    it('should handle deprecated mac platform', () => {
      const writer = new ByteWriter(true, 'utf-8');

      // Write minimal data with deprecated mac platform
      writer.writeUint8(17);
      writer.writeCString('Test');
      writer.writeCString('map');
      writer.writeCString('folder');
      writer.writeCString('game');
      writer.writeUint16(1);
      writer.writeUint8(0);
      writer.writeUint8(0);
      writer.writeUint8(0);
      writer.writeChar('d');
      writer.writeChar('o'); // deprecated mac value
      writer.writeBool(false);
      writer.writeBool(false);
      writer.writeCString('1.0');

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const info = protocol.deserializeResponse(
        reader,
        A2S_INFO_RESPONSE,
        0
      ) as SourceInfo;

      expect(info.platform).toBe('m'); // Should be converted to 'm'
    });
  });

  describe('deserializeResponse - GoldSource Engine', () => {
    it('should parse basic GoldSource engine info response', () => {
      const writer = new ByteWriter(true, 'utf-8');

      // Write GoldSource response data
      writer.writeCString('192.168.1.1:27015'); // address
      writer.writeCString('Test Server'); // serverName
      writer.writeCString('crossfire'); // mapName
      writer.writeCString('valve'); // folder
      writer.writeCString('Half-Life'); // game
      writer.writeUint8(12); // playerCount
      writer.writeUint8(16); // maxPlayers
      writer.writeUint8(48); // protocol
      writer.writeChar('d'); // serverType
      writer.writeChar('l'); // platform
      writer.writeBool(false); // passwordProtected
      writer.writeBool(false); // isMod
      writer.writeBool(true); // vacEnabled
      writer.writeUint8(0); // botCount

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const info = protocol.deserializeResponse(
        reader,
        A2S_INFO_RESPONSE_LEGACY,
        75
      ) as GoldSrcInfo;

      expect(info.address).toBe('192.168.1.1:27015');
      expect(info.serverName).toBe('Test Server');
      expect(info.mapName).toBe('crossfire');
      expect(info.folder).toBe('valve');
      expect(info.game).toBe('Half-Life');
      expect(info.playerCount).toBe(12);
      expect(info.maxPlayers).toBe(16);
      expect(info.protocol).toBe(48);
      expect(info.serverType).toBe('d');
      expect(info.platform).toBe('l');
      expect(info.passwordProtected).toBe(false);
      expect(info.isMod).toBe(false);
      expect(info.vacEnabled).toBe(true);
      expect(info.botCount).toBe(0);
      expect(info.ping).toBe(75);
    });

    it('should parse GoldSource engine info with mod data', () => {
      const writer = new ByteWriter(true, 'utf-8');

      // Write basic data
      writer.writeCString('192.168.1.1:27015');
      writer.writeCString('Test Server');
      writer.writeCString('map');
      writer.writeCString('folder');
      writer.writeCString('game');
      writer.writeUint8(0);
      writer.writeUint8(0);
      writer.writeUint8(48);
      writer.writeChar('d');
      writer.writeChar('l');
      writer.writeBool(false);
      writer.writeBool(true); // isMod = true

      // Add mod data
      writer.writeCString('http://example.com'); // modWebsite
      writer.writeCString('http://dl.example.com'); // modDownload
      writer.write(Buffer.from([0])); // NULL byte
      writer.writeUint32(100); // modVersion
      writer.writeUint32(1024000); // modSize
      writer.writeBool(true); // multiplayerOnly
      writer.writeBool(false); // usesCustomDll

      writer.writeBool(true); // vacEnabled
      writer.writeUint8(2); // botCount

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const info = protocol.deserializeResponse(
        reader,
        A2S_INFO_RESPONSE_LEGACY,
        0
      ) as GoldSrcInfo;

      expect(info.isMod).toBe(true);
      expect(info.modWebsite).toBe('http://example.com');
      expect(info.modDownload).toBe('http://dl.example.com');
      expect(info.modVersion).toBe(100);
      expect(info.modSize).toBe(1024000);
      expect(info.multiplayerOnly).toBe(true);
      expect(info.usesCustomDll).toBe(false);
      expect(info.vacEnabled).toBe(true);
      expect(info.botCount).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should throw BrokenMessageError for invalid response type', () => {
      const buffer = Buffer.alloc(0);
      const reader = new ByteReader(buffer);

      expect(() => {
        protocol.deserializeResponse(reader, 0x99, 0);
      }).toThrow(BrokenMessageError);
    });

    it('should handle buffer exhaustion gracefully in Source response', () => {
      const writer = new ByteWriter(true, 'utf-8');

      // Write incomplete Source response (missing version and edf)
      writer.writeUint8(17);
      writer.writeCString('Test');
      writer.writeCString('map');
      writer.writeCString('folder');
      writer.writeCString('game');
      writer.writeUint16(1);
      writer.writeUint8(0);
      writer.writeUint8(0);
      writer.writeUint8(0);
      writer.writeChar('d');
      writer.writeChar('l');
      writer.writeBool(false);
      writer.writeBool(false);
      writer.writeCString('1.0');
      // Missing edf byte

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const info = protocol.deserializeResponse(
        reader,
        A2S_INFO_RESPONSE,
        0
      ) as SourceInfo;

      // Should parse successfully but with edf = 0
      expect(info.edf).toBe(0);
    });
  });
});

describe('PlayersProtocol', () => {
  let protocol: PlayersProtocol;

  beforeEach(() => {
    protocol = new PlayersProtocol();
  });

  describe('validateResponseType', () => {
    it('should accept valid player response type', () => {
      expect(protocol.validateResponseType(A2S_PLAYER_RESPONSE)).toBe(true);
    });

    it('should reject invalid response types', () => {
      expect(protocol.validateResponseType(A2S_INFO_RESPONSE)).toBe(false);
      expect(protocol.validateResponseType(A2S_RULES_RESPONSE)).toBe(false);
      expect(protocol.validateResponseType(0x00)).toBe(false);
    });
  });

  describe('serializeRequest', () => {
    it('should serialize request with challenge', () => {
      const challenge = 0x12345678;
      const request = protocol.serializeRequest(challenge);

      const expectedHeader = Buffer.from([0x55]);
      const challengeBuffer = Buffer.alloc(4);
      challengeBuffer.writeUInt32LE(challenge, 0);
      const expected = Buffer.concat([expectedHeader, challengeBuffer]);

      expect(request).toEqual(expected);
    });
  });

  describe('deserializeResponse', () => {
    it('should parse empty player list', () => {
      const writer = new ByteWriter(true, 'utf-8');
      writer.writeUint8(0); // playerCount = 0

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const players = protocol.deserializeResponse(
        reader,
        A2S_PLAYER_RESPONSE,
        0
      );

      expect(players).toEqual([]);
    });

    it('should parse single player', () => {
      const writer = new ByteWriter(true, 'utf-8');
      writer.writeUint8(1); // playerCount = 1
      writer.writeUint8(0); // index
      writer.writeCString('Player1'); // name
      writer.writeInt32(1500); // score
      writer.writeFloat(123.45); // duration

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const players = protocol.deserializeResponse(
        reader,
        A2S_PLAYER_RESPONSE,
        0
      );

      expect(players).toHaveLength(1);
      expect(players[0]).toEqual({
        index: 0,
        name: 'Player1',
        score: 1500,
        duration: expect.closeTo(123.45, 2),
      });
    });

    it('should parse multiple players', () => {
      const writer = new ByteWriter(true, 'utf-8');
      writer.writeUint8(3); // playerCount = 3

      // Player 1
      writer.writeUint8(0);
      writer.writeCString('Alice');
      writer.writeInt32(2500);
      writer.writeFloat(300.5);

      // Player 2
      writer.writeUint8(1);
      writer.writeCString('Bob');
      writer.writeInt32(1800);
      writer.writeFloat(250.0);

      // Player 3
      writer.writeUint8(2);
      writer.writeCString('Charlie');
      writer.writeInt32(-100);
      writer.writeFloat(45.25);

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const players = protocol.deserializeResponse(
        reader,
        A2S_PLAYER_RESPONSE,
        0
      );

      expect(players).toHaveLength(3);

      expect(players[0]).toEqual({
        index: 0,
        name: 'Alice',
        score: 2500,
        duration: expect.closeTo(300.5, 1),
      });

      expect(players[1]).toEqual({
        index: 1,
        name: 'Bob',
        score: 1800,
        duration: expect.closeTo(250.0, 1),
      });

      expect(players[2]).toEqual({
        index: 2,
        name: 'Charlie',
        score: -100,
        duration: expect.closeTo(45.25, 2),
      });
    });

    it('should handle special characters in player names', () => {
      const writer = new ByteWriter(true, 'utf-8');
      writer.writeUint8(1);
      writer.writeUint8(0);
      writer.writeCString('Player™©®'); // Special characters
      writer.writeInt32(0);
      writer.writeFloat(0.0);

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const players = protocol.deserializeResponse(
        reader,
        A2S_PLAYER_RESPONSE,
        0
      );

      expect(players[0].name).toBe('Player™©®');
    });
  });
});

describe('RulesProtocol', () => {
  let protocol: RulesProtocol;

  beforeEach(() => {
    protocol = new RulesProtocol();
  });

  describe('validateResponseType', () => {
    it('should accept valid rules response type', () => {
      expect(protocol.validateResponseType(A2S_RULES_RESPONSE)).toBe(true);
    });

    it('should reject invalid response types', () => {
      expect(protocol.validateResponseType(A2S_INFO_RESPONSE)).toBe(false);
      expect(protocol.validateResponseType(A2S_PLAYER_RESPONSE)).toBe(false);
      expect(protocol.validateResponseType(0x00)).toBe(false);
    });
  });

  describe('serializeRequest', () => {
    it('should serialize request with challenge', () => {
      const challenge = 0x87654321;
      const request = protocol.serializeRequest(challenge);

      const expectedHeader = Buffer.from([0x56]);
      const challengeBuffer = Buffer.alloc(4);
      challengeBuffer.writeUInt32LE(challenge, 0);
      const expected = Buffer.concat([expectedHeader, challengeBuffer]);

      expect(request).toEqual(expected);
    });
  });

  describe('deserializeResponse', () => {
    it('should parse empty rules', () => {
      const writer = new ByteWriter(true, 'utf-8');
      writer.writeUint16(0); // ruleCount = 0

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const rules = protocol.deserializeResponse(reader, A2S_RULES_RESPONSE, 0);

      expect(rules).toEqual({});
    });

    it('should parse single rule', () => {
      const writer = new ByteWriter(true, 'utf-8');
      writer.writeUint16(1); // ruleCount = 1
      writer.writeCString('mp_maxrounds'); // key
      writer.writeCString('30'); // value

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const rules = protocol.deserializeResponse(reader, A2S_RULES_RESPONSE, 0);

      expect(rules).toEqual({
        mp_maxrounds: '30',
      });
    });

    it('should parse multiple rules', () => {
      const writer = new ByteWriter(true, 'utf-8');
      writer.writeUint16(3); // ruleCount = 3

      writer.writeCString('mp_friendlyfire');
      writer.writeCString('1');

      writer.writeCString('mp_timelimit');
      writer.writeCString('20');

      writer.writeCString('sv_gravity');
      writer.writeCString('800');

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const rules = protocol.deserializeResponse(reader, A2S_RULES_RESPONSE, 0);

      expect(rules).toEqual({
        mp_friendlyfire: '1',
        mp_timelimit: '20',
        sv_gravity: '800',
      });
    });

    it('should handle empty string values', () => {
      const writer = new ByteWriter(true, 'utf-8');
      writer.writeUint16(2);

      writer.writeCString('empty_rule');
      writer.writeCString(''); // Empty value

      writer.writeCString('normal_rule');
      writer.writeCString('value');

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const rules = protocol.deserializeResponse(reader, A2S_RULES_RESPONSE, 0);

      expect(rules).toEqual({
        empty_rule: '',
        normal_rule: 'value',
      });
    });

    it('should handle special characters in rules', () => {
      const writer = new ByteWriter(true, 'utf-8');
      writer.writeUint16(1);
      writer.writeCString('server_name');
      writer.writeCString('Server™ [EU] ©2023'); // Special characters

      const buffer = writer.toBuffer();
      const reader = new ByteReader(buffer, true, 'utf-8');

      const rules = protocol.deserializeResponse(reader, A2S_RULES_RESPONSE, 0);

      expect(rules).toEqual({
        server_name: 'Server™ [EU] ©2023',
      });
    });
  });
});
