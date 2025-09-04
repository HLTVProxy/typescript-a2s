import { createSocket, Socket, RemoteInfo } from 'node:dgram';
import { EventEmitter } from 'node:events';
import { BrokenMessageError } from './exceptions.js';
import { decodeFragment, A2SFragment } from './fragment.js';

export const HEADER_SIMPLE = Buffer.from([0xff, 0xff, 0xff, 0xff]);
export const HEADER_MULTI = Buffer.from([0xfe, 0xff, 0xff, 0xff]);
export const A2S_CHALLENGE_RESPONSE = 0x41;

/**
 * UDP socket wrapper for A2S communication
 */
export class A2SSocket extends EventEmitter {
  private socket: Socket;
  private closed = false;
  private address: string;
  private port: number;
  private timeout: number;
  private fragmentBuffer: A2SFragment[] = [];
  private ready: Promise<void>;

  constructor(address: string, port: number, timeout = 3000) {
    super();
    this.address = address;
    this.port = port;
    this.timeout = timeout;
    this.socket = createSocket('udp4');
    this.socket.bind({ port: 0, address: '0.0.0.0', exclusive: false });

    this.ready = new Promise((resolve) => {
      this.socket.once('listening', resolve);
    });

    this.setupSocketEvents();
  }

  private setupSocketEvents(): void {
    this.socket.on('message', (packet: Buffer, rinfo: RemoteInfo) => {
      this.handleMessage(packet, rinfo);
    });

    this.socket.on('error', (error: Error) => {
      this.emit('error', error);
    });

    this.socket.on('close', () => {
      this.emit('close');
    });

    this.socket.on('listening', () => {});
  }

  private handleMessage(packet: Buffer, _rinfo: RemoteInfo): void {
    if (packet.length < 4) {
      this.emit('error', new BrokenMessageError('Packet too short'));
      return;
    }

    const header = packet.subarray(0, 4);
    const data = packet.subarray(4);

    if (header.equals(HEADER_SIMPLE)) {
      this.emit('data', data);
    } else if (header.equals(HEADER_MULTI)) {
      this.handleMultiPacket(data);
    } else {
      this.emit(
        'error',
        new BrokenMessageError(
          `Invalid packet header: ${header.toString('hex')}`
        )
      );
    }
  }

  private handleMultiPacket(data: Buffer): void {
    const fragment = decodeFragment(data);
    this.fragmentBuffer.push(fragment);

    if (this.fragmentBuffer.length >= fragment.fragmentCount) {
      this.fragmentBuffer.sort((a, b) => a.fragmentId - b.fragmentId);

      const reassembled = Buffer.concat(
        this.fragmentBuffer.map((f) => f.payload)
      );

      const finalData = reassembled.subarray(0, 4).equals(HEADER_SIMPLE)
        ? reassembled.subarray(4)
        : reassembled;

      this.fragmentBuffer = [];
      this.emit('data', finalData);
    }
  }

  /**
   * Send data to the server
   */
  async send(payload: Buffer): Promise<void> {
    const packet = Buffer.concat([HEADER_SIMPLE, payload]);
    await this.ready;
    if (this.closed) {
      return;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        this.socket.send(packet, this.port, this.address, (err) => {
          if (err) {
            this.emit('error', err);
            this.close();
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (err) {
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
      this.close();
    }
  }

  /**
   * Send request and wait for response
   */
  async request(payload: Buffer): Promise<Buffer> {
    return await new Promise<Buffer>((resolve, reject) => {
      let finished = false;
      const safeCleanup = () => {
        if (!finished) {
          finished = true;
          this.removeAllListeners('data');
          this.removeAllListeners('error');
        }
      };
      const timeoutId = setTimeout(() => {
        if (!finished) {
          safeCleanup();
          reject(new Error('Request timeout'));
        }
      }, this.timeout);

      const onData = (data: Buffer) => {
        if (!finished) {
          clearTimeout(timeoutId);
          safeCleanup();
          resolve(data);
        }
      };

      const onError = (error: Error) => {
        if (!finished) {
          clearTimeout(timeoutId);
          safeCleanup();
          reject(error);
        }
      };

      this.once('data', onData);
      this.once('error', onError);

      this.send(payload).catch((err) => {
        this.close();
        reject(err);
      });
    });
  }

  /**
   * Close the socket
   */
  close(): void {
    if (!this.closed) {
      this.closed = true;
      this.socket.close();
    }
  }
}
