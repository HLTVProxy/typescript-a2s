/**
 * Base interface for all server info responses
 */
export interface BaseServerInfo {
  ping: number;
}

/**
 * Source engine server information
 */
export interface SourceInfo extends BaseServerInfo {
  protocol: number;
  serverName: string | Buffer;
  mapName: string | Buffer;
  folder: string | Buffer;
  game: string | Buffer;
  appId: number;
  playerCount: number;
  maxPlayers: number;
  botCount: number;
  serverType: string | Buffer;
  platform: string | Buffer;
  passwordProtected: boolean;
  vacEnabled: boolean;
  version: string | Buffer;
  edf: number;
  
  // Optional fields
  port?: number;
  steamId?: bigint;
  stvPort?: number;
  stvName?: string | Buffer;
  keywords?: string | Buffer;
  gameId?: bigint;
}

/**
 * GoldSource engine server information
 */
export interface GoldSrcInfo extends BaseServerInfo {
  address: string | Buffer;
  serverName: string | Buffer;
  mapName: string | Buffer;
  folder: string | Buffer;
  game: string | Buffer;
  playerCount: number;
  maxPlayers: number;
  protocol: number;
  serverType: string | Buffer;
  platform: string | Buffer;
  passwordProtected: boolean;
  isMod: boolean;
  vacEnabled: boolean;
  botCount: number;
  
  // Optional mod fields
  modWebsite?: string | Buffer;
  modDownload?: string | Buffer;
  modVersion?: number;
  modSize?: number;
  multiplayerOnly?: boolean;
  usesCustomDll?: boolean;
}

/**
 * Player information
 */
export interface Player<T = string> {
  index: number;
  name: T;
  score: number;
  duration: number;
}

/**
 * Server rules (key-value pairs)
 */
export type Rules<T = string> = Record<T extends string ? string : string, T>;

/**
 * Union type for all possible server info types
 */
export type ServerInfo = SourceInfo | GoldSrcInfo;