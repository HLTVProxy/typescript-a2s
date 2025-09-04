import { describe, it, expect } from 'vitest';
import type {
  SourceInfo,
  GoldSrcInfo,
  Player,
  Rules,
  ServerInfo,
} from '../types.js';

describe('Type definitions', () => {
  describe('SourceInfo interface', () => {
    it('should accept valid SourceInfo object', () => {
      const sourceInfo: SourceInfo = {
        ping: 50,
        protocol: 17,
        serverName: 'Test Server',
        mapName: 'de_dust2',
        folder: 'cstrike',
        game: 'Counter-Strike: Source',
        appId: 240,
        playerCount: 16,
        maxPlayers: 32,
        botCount: 0,
        serverType: 'd',
        platform: 'l',
        passwordProtected: false,
        vacEnabled: true,
        version: '1.0.0.0',
        edf: 0,
      };

      expect(sourceInfo.ping).toBe(50);
      expect(sourceInfo.protocol).toBe(17);
      expect(sourceInfo.serverName).toBe('Test Server');
      expect(sourceInfo.passwordProtected).toBe(false);
      expect(sourceInfo.vacEnabled).toBe(true);
    });

    it('should accept SourceInfo with all optional fields', () => {
      const sourceInfo: SourceInfo = {
        ping: 75,
        protocol: 17,
        serverName: 'Full Server',
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
        edf: 0xff,
        // Optional fields
        port: 27015,
        steamId: 76561198000000000n,
        stvPort: 27020,
        stvName: 'GOTV',
        keywords: 'fun,casual',
        gameId: 240n,
      };

      expect(sourceInfo.port).toBe(27015);
      expect(sourceInfo.steamId).toBe(76561198000000000n);
      expect(sourceInfo.stvPort).toBe(27020);
      expect(sourceInfo.stvName).toBe('GOTV');
      expect(sourceInfo.keywords).toBe('fun,casual');
      expect(sourceInfo.gameId).toBe(240n);
    });

    it('should accept Buffer values for string fields', () => {
      const sourceInfo: SourceInfo = {
        ping: 30,
        protocol: 17,
        serverName: Buffer.from('Test Server'),
        mapName: Buffer.from('de_dust2'),
        folder: Buffer.from('cstrike'),
        game: Buffer.from('Counter-Strike'),
        appId: 240,
        playerCount: 0,
        maxPlayers: 0,
        botCount: 0,
        serverType: Buffer.from('d'),
        platform: Buffer.from('l'),
        passwordProtected: false,
        vacEnabled: false,
        version: Buffer.from('1.0'),
        edf: 0,
      };

      expect(Buffer.isBuffer(sourceInfo.serverName)).toBe(true);
      expect(Buffer.isBuffer(sourceInfo.mapName)).toBe(true);
    });
  });

  describe('GoldSrcInfo interface', () => {
    it('should accept valid GoldSrcInfo object', () => {
      const goldSrcInfo: GoldSrcInfo = {
        ping: 100,
        address: '192.168.1.1:27015',
        serverName: 'Half-Life Server',
        mapName: 'crossfire',
        folder: 'valve',
        game: 'Half-Life',
        playerCount: 8,
        maxPlayers: 16,
        protocol: 48,
        serverType: 'd',
        platform: 'l',
        passwordProtected: false,
        isMod: false,
        vacEnabled: true,
        botCount: 0,
      };

      expect(goldSrcInfo.ping).toBe(100);
      expect(goldSrcInfo.address).toBe('192.168.1.1:27015');
      expect(goldSrcInfo.isMod).toBe(false);
      expect(goldSrcInfo.vacEnabled).toBe(true);
    });

    it('should accept GoldSrcInfo with mod fields', () => {
      const goldSrcInfo: GoldSrcInfo = {
        ping: 80,
        address: '192.168.1.1:27015',
        serverName: 'Mod Server',
        mapName: 'map',
        folder: 'mod',
        game: 'Mod Game',
        playerCount: 0,
        maxPlayers: 0,
        protocol: 48,
        serverType: 'd',
        platform: 'l',
        passwordProtected: false,
        isMod: true,
        vacEnabled: false,
        botCount: 0,
        // Mod fields
        modWebsite: 'http://example.com',
        modDownload: 'http://download.example.com',
        modVersion: 100,
        modSize: 1024000,
        multiplayerOnly: true,
        usesCustomDll: false,
      };

      expect(goldSrcInfo.isMod).toBe(true);
      expect(goldSrcInfo.modWebsite).toBe('http://example.com');
      expect(goldSrcInfo.modVersion).toBe(100);
      expect(goldSrcInfo.multiplayerOnly).toBe(true);
    });
  });

  describe('Player interface', () => {
    it('should accept valid Player object with string name', () => {
      const player: Player<string> = {
        index: 0,
        name: 'Player1',
        score: 1500,
        duration: 300.5,
      };

      expect(player.index).toBe(0);
      expect(player.name).toBe('Player1');
      expect(player.score).toBe(1500);
      expect(player.duration).toBe(300.5);
    });

    it('should accept Player with Buffer name when generic type allows', () => {
      const player: Player<Buffer> = {
        index: 1,
        name: Buffer.from('Player2'),
        score: 2000,
        duration: 450.25,
      };

      expect(player.index).toBe(1);
      expect(Buffer.isBuffer(player.name)).toBe(true);
      expect(player.score).toBe(2000);
      expect(player.duration).toBe(450.25);
    });

    it('should accept Player with default string type', () => {
      const player: Player = {
        index: 2,
        name: 'DefaultPlayer',
        score: -100,
        duration: 0,
      };

      expect(typeof player.name).toBe('string');
      expect(player.score).toBe(-100);
      expect(player.duration).toBe(0);
    });
  });

  describe('Rules type', () => {
    it('should accept valid Rules object with string values', () => {
      const rules: Rules<string> = {
        mp_friendlyfire: '1',
        mp_timelimit: '20',
        sv_gravity: '800',
        empty_rule: '',
      };

      expect(rules.mp_friendlyfire).toBe('1');
      expect(rules.mp_timelimit).toBe('20');
      expect(rules.sv_gravity).toBe('800');
      expect(rules.empty_rule).toBe('');
    });

    it('should accept Rules with Buffer values when generic type allows', () => {
      const rules: Rules<Buffer> = {
        rule1: Buffer.from('value1'),
        rule2: Buffer.from('value2'),
      };

      expect(Buffer.isBuffer(rules.rule1)).toBe(true);
      expect(Buffer.isBuffer(rules.rule2)).toBe(true);
    });

    it('should accept Rules with default string type', () => {
      const rules: Rules = {
        default_rule: 'default_value',
        another_rule: 'another_value',
      };

      expect(typeof rules.default_rule).toBe('string');
      expect(typeof rules.another_rule).toBe('string');
    });

    it('should allow dynamic key assignment', () => {
      const rules: Rules = {};
      rules['dynamic_key'] = 'dynamic_value';
      rules.static_key = 'static_value';

      expect(rules.dynamic_key).toBe('dynamic_value');
      expect(rules.static_key).toBe('static_value');
    });
  });

  describe('ServerInfo union type', () => {
    it('should accept SourceInfo as ServerInfo', () => {
      const sourceInfo: SourceInfo = {
        ping: 50,
        protocol: 17,
        serverName: 'Source Server',
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

      const serverInfo: ServerInfo = sourceInfo;
      expect(serverInfo.ping).toBe(50);
    });

    it('should accept GoldSrcInfo as ServerInfo', () => {
      const goldSrcInfo: GoldSrcInfo = {
        ping: 80,
        address: '192.168.1.1:27015',
        serverName: 'GoldSrc Server',
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

      const serverInfo: ServerInfo = goldSrcInfo;
      expect(serverInfo.ping).toBe(80);
    });
  });

  describe('Type compatibility', () => {
    it('should handle mixed string and Buffer types appropriately', () => {
      // This tests that the type system allows for both string and Buffer
      // in the same interface when union types are used
      const mixedInfo: SourceInfo = {
        ping: 40,
        protocol: 17,
        serverName: 'String Name',
        mapName: Buffer.from('Buffer Map'),
        folder: 'String Folder',
        game: Buffer.from('Buffer Game'),
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

      expect(typeof mixedInfo.serverName).toBe('string');
      expect(Buffer.isBuffer(mixedInfo.mapName)).toBe(true);
      expect(typeof mixedInfo.folder).toBe('string');
      expect(Buffer.isBuffer(mixedInfo.game)).toBe(true);
    });
  });
});
