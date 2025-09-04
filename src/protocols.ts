import { ByteReader } from './byteio.js';
import { BrokenMessageError, BufferExhaustedError } from './exceptions.js';
import { SourceInfo, GoldSrcInfo, Player, Rules } from './types.js';

// Response type constants
export const A2S_INFO_RESPONSE = 0x49;
export const A2S_INFO_RESPONSE_LEGACY = 0x6d;
export const A2S_PLAYER_RESPONSE = 0x44;
export const A2S_RULES_RESPONSE = 0x45;

/**
 * Base protocol handler interface
 */
export interface ProtocolHandler<T> {
  validateResponseType(responseType: number): boolean;
  serializeRequest(challenge: number): Buffer;
  deserializeResponse(
    reader: ByteReader,
    responseType: number,
    ping: number
  ): T;
}

/**
 * Info protocol handler
 */
export class InfoProtocol implements ProtocolHandler<SourceInfo | GoldSrcInfo> {
  validateResponseType(responseType: number): boolean {
    return (
      responseType === A2S_INFO_RESPONSE ||
      responseType === A2S_INFO_RESPONSE_LEGACY
    );
  }

  serializeRequest(challenge: number): Buffer {
    const request = Buffer.from('Source Engine Query\0', 'utf-8');
    const header = Buffer.from([0x54]);

    if (challenge) {
      const challengeBuffer = Buffer.alloc(4);
      challengeBuffer.writeUInt32LE(challenge, 0);
      return Buffer.concat([header, request, challengeBuffer]);
    }

    return Buffer.concat([header, request]);
  }

  deserializeResponse(
    reader: ByteReader,
    responseType: number,
    ping: number
  ): SourceInfo | GoldSrcInfo {
    if (responseType === A2S_INFO_RESPONSE) {
      return this.parseSource(reader, ping);
    } else if (responseType === A2S_INFO_RESPONSE_LEGACY) {
      return this.parseGoldSrc(reader, ping);
    } else {
      throw new BrokenMessageError(
        `Invalid info response type: ${responseType}`
      );
    }
  }

  private parseSource(reader: ByteReader, ping: number): SourceInfo {
    const protocol = reader.readUint8();
    const serverName = reader.readCString();
    const mapName = reader.readCString();
    const folder = reader.readCString();
    const game = reader.readCString();
    const appId = reader.readUint16();
    const playerCount = reader.readUint8();
    const maxPlayers = reader.readUint8();
    const botCount = reader.readUint8();
    const serverType = (reader.readChar() as string).toLowerCase();
    let platform = (reader.readChar() as string).toLowerCase();

    // Handle deprecated mac value
    if (platform === 'o') {
      platform = 'm';
    }

    const passwordProtected = reader.readBool();
    const vacEnabled = reader.readBool();
    const version = reader.readCString();

    let edf = 0;
    try {
      edf = reader.readUint8();
    } catch (error) {
      if (!(error instanceof BufferExhaustedError)) {
        throw error;
      }
    }

    const info: SourceInfo = {
      protocol,
      serverName,
      mapName,
      folder,
      game,
      appId,
      playerCount,
      maxPlayers,
      botCount,
      serverType,
      platform,
      passwordProtected,
      vacEnabled,
      version,
      edf,
      ping,
    };

    // Parse optional fields based on EDF flags
    if (edf & 0x80) {
      // has_port
      info.port = reader.readUint16();
    }
    if (edf & 0x10) {
      // has_steam_id
      info.steamId = reader.readUint64();
    }
    if (edf & 0x40) {
      // has_stv
      info.stvPort = reader.readUint16();
      info.stvName = reader.readCString();
    }
    if (edf & 0x20) {
      // has_keywords
      info.keywords = reader.readCString();
    }
    if (edf & 0x01) {
      // has_game_id
      info.gameId = reader.readUint64();
    }

    return info;
  }

  private parseGoldSrc(reader: ByteReader, ping: number): GoldSrcInfo {
    const address = reader.readCString();
    const serverName = reader.readCString();
    const mapName = reader.readCString();
    const folder = reader.readCString();
    const game = reader.readCString();
    const playerCount = reader.readUint8();
    const maxPlayers = reader.readUint8();
    const protocol = reader.readUint8();
    const serverType = reader.readChar();
    const platform = reader.readChar();
    const passwordProtected = reader.readBool();
    const isMod = reader.readBool();

    const info: GoldSrcInfo = {
      address,
      serverName,
      mapName,
      folder,
      game,
      playerCount,
      maxPlayers,
      protocol,
      serverType,
      platform,
      passwordProtected,
      isMod,
      vacEnabled: false, // Will be set later
      botCount: 0, // Will be set later
      ping,
    };

    // Some games don't send mod section
    if (isMod && reader.peek().length > 2) {
      info.modWebsite = reader.readCString();
      info.modDownload = reader.readCString();
      reader.read(1); // Skip NULL byte
      info.modVersion = reader.readUint32();
      info.modSize = reader.readUint32();
      info.multiplayerOnly = reader.readBool();
      info.usesCustomDll = reader.readBool();
    }

    info.vacEnabled = reader.readBool();
    info.botCount = reader.readUint8();

    return info;
  }
}

/**
 * Players protocol handler
 */
export class PlayersProtocol implements ProtocolHandler<Player[]> {
  validateResponseType(responseType: number): boolean {
    return responseType === A2S_PLAYER_RESPONSE;
  }

  serializeRequest(challenge: number): Buffer {
    const header = Buffer.from([0x55]);
    const challengeBuffer = Buffer.alloc(4);
    challengeBuffer.writeUInt32LE(challenge, 0);
    return Buffer.concat([header, challengeBuffer]);
  }

  deserializeResponse(
    reader: ByteReader,
    _responseType: number,
    _ping: number
  ): Player[] {
    const playerCount = reader.readUint8();
    const players: Player[] = [];

    for (let i = 0; i < playerCount; i++) {
      players.push({
        index: reader.readUint8(),
        name: reader.readCString() as string,
        score: reader.readInt32(),
        duration: reader.readFloat(),
      });
    }

    return players;
  }
}

/**
 * Rules protocol handler
 */
export class RulesProtocol implements ProtocolHandler<Rules> {
  validateResponseType(responseType: number): boolean {
    return responseType === A2S_RULES_RESPONSE;
  }

  serializeRequest(challenge: number): Buffer {
    const header = Buffer.from([0x56]);
    const challengeBuffer = Buffer.alloc(4);
    challengeBuffer.writeUInt32LE(challenge, 0);
    const buf = Buffer.concat([header, challengeBuffer]);
    return buf;
  }

  deserializeResponse(
    reader: ByteReader,
    _responseType: number,
    _ping: number
  ): Rules {
    const ruleCount = reader.readUint16();
    const rules: Rules = {};

    for (let i = 0; i < ruleCount; i++) {
      const key = reader.readCString() as string;
      const value = reader.readCString() as string;
      rules[key] = value;
    }

    return rules;
  }
}
