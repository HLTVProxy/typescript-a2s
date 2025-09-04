/**
 * Exception thrown when a message is broken or malformed
 */
export class BrokenMessageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrokenMessageError';
  }
}

/**
 * Exception thrown when the buffer is exhausted during reading
 */
export class BufferExhaustedError extends BrokenMessageError {
  constructor(message: string = 'Buffer exhausted') {
    super(message);
    this.name = 'BufferExhaustedError';
  }
}
