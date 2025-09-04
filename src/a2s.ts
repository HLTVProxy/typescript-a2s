import { A2SSocket, A2S_CHALLENGE_RESPONSE } from './socket.js';
import { ByteReader } from './byteio.js';
import { BrokenMessageError } from './exceptions.js';
import {
  DEFAULT_TIMEOUT,
  DEFAULT_ENCODING,
  DEFAULT_RETRIES,
} from './defaults.js';
import {
  InfoProtocol,
  PlayersProtocol,
  RulesProtocol,
  ProtocolHandler,
} from './protocols.js';
import { SourceInfo, GoldSrcInfo, Player, Rules } from './types.js';

/**
 * A2S client for querying game servers
 */
export class A2SClient {
  private encoding: string | null;
  private socket: A2SSocket;
  private closed = false;

  constructor(
    address: string,
    port: number,
    timeout = DEFAULT_TIMEOUT * 1000,
    encoding: string | null = DEFAULT_ENCODING
  ) {
    this.encoding = encoding;
    this.socket = new A2SSocket(address, port, timeout);
  }

  private ensureOpen() {
    if (this.closed) throw new Error('A2SClient socket already closed');
  }

  close() {
    if (!this.closed) {
      this.socket.close();
      this.closed = true;
    }
  }

  /**
   * Query server info
   */
  async info(): Promise<SourceInfo | GoldSrcInfo> {
    this.ensureOpen();
    const protocol = new InfoProtocol();
    return this.request(protocol);
  }

  /**
   * Query server players
   */
  async players(): Promise<Player[]> {
    this.ensureOpen();
    const protocol = new PlayersProtocol();
    return this.request(protocol);
  }

  /**
   * Query server rules
   */
  async rules(): Promise<Rules> {
    this.ensureOpen();
    const protocol = new RulesProtocol();
    return this.request(protocol);
  }

  /**
   * Generic request method
   */
  private async request<T>(
    protocol: ProtocolHandler<T>,
    challenge = 0,
    retries = 0
  ): Promise<T> {
    this.ensureOpen();
    const sendTime = Date.now();
    const responseData = await this.socket.request(
      protocol.serializeRequest(Number(challenge))
    );
    const receiveTime = Date.now();

    // Only calculate ping on first packet received
    const ping = retries === 0 ? (receiveTime - sendTime) / 1000 : 0;

    const reader = new ByteReader(responseData, true, this.encoding);
    const responseType = reader.readUint8();

    if (responseType === A2S_CHALLENGE_RESPONSE) {
      if (retries >= DEFAULT_RETRIES) {
        // Only close socket when the outermost request ends
        if (retries === 0) this.close();
        throw new BrokenMessageError(
          'Server keeps sending challenge responses'
        );
      }
      const newChallenge = Number(reader.readUint32());
      // Don't close socket during recursive calls
      return this.request(protocol, newChallenge, retries + 1);
    }

    if (!protocol.validateResponseType(responseType)) {
      if (retries === 0) this.close();
      throw new BrokenMessageError(
        `Invalid response type: 0x${responseType.toString(16)}`
      );
    }

    const result = protocol.deserializeResponse(reader, responseType, ping);
    if (retries === 0) this.close(); // Only close socket when outermost call ends
    return result;
  }
}

/**
 * Convenience function to get server info
 */
export async function info(
  address: string,
  port: number,
  timeout?: number,
  encoding?: string | null
): Promise<SourceInfo | GoldSrcInfo> {
  const client = new A2SClient(address, port, timeout, encoding);
  try {
    return await client.info();
  } finally {
    client.close();
  }
}

/**
 * Convenience function to get server players
 */
export async function players(
  address: string,
  port: number,
  timeout?: number,
  encoding?: string | null
): Promise<Player[]> {
  const client = new A2SClient(address, port, timeout, encoding);
  try {
    return await client.players();
  } finally {
    client.close();
  }
}

/**
 * Convenience function to get server rules
 */
export async function rules(
  address: string,
  port: number,
  timeout?: number,
  encoding?: string | null
): Promise<Rules> {
  const client = new A2SClient(address, port, timeout, encoding);
  try {
    return await client.rules();
  } finally {
    client.close();
  }
}
