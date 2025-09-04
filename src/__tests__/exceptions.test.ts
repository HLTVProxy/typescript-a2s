import { describe, it, expect } from 'vitest';
import { BrokenMessageError, BufferExhaustedError } from '../exceptions.js';

describe('BrokenMessageError', () => {
  it('should create error with correct message', () => {
    const message = 'Test broken message';
    const error = new BrokenMessageError(message);

    expect(error.message).toBe(message);
    expect(error.name).toBe('BrokenMessageError');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BrokenMessageError);
  });

  it('should have correct prototype chain', () => {
    const error = new BrokenMessageError('test');
    expect(error.constructor).toBe(BrokenMessageError);
    expect(Object.getPrototypeOf(error)).toBe(BrokenMessageError.prototype);
  });

  it('should capture stack trace', () => {
    const error = new BrokenMessageError('test');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('BrokenMessageError');
  });
});

describe('BufferExhaustedError', () => {
  it('should create error with default message', () => {
    const error = new BufferExhaustedError();

    expect(error.message).toBe('Buffer exhausted');
    expect(error.name).toBe('BufferExhaustedError');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BrokenMessageError);
    expect(error).toBeInstanceOf(BufferExhaustedError);
  });

  it('should create error with custom message', () => {
    const message = 'Custom buffer exhausted message';
    const error = new BufferExhaustedError(message);

    expect(error.message).toBe(message);
    expect(error.name).toBe('BufferExhaustedError');
  });

  it('should inherit from BrokenMessageError', () => {
    const error = new BufferExhaustedError();
    expect(error).toBeInstanceOf(BrokenMessageError);
    expect(Object.getPrototypeOf(BufferExhaustedError.prototype)).toBe(
      BrokenMessageError.prototype
    );
  });

  it('should have correct prototype chain', () => {
    const error = new BufferExhaustedError('test');
    expect(error.constructor).toBe(BufferExhaustedError);
    expect(Object.getPrototypeOf(error)).toBe(BufferExhaustedError.prototype);
  });

  it('should capture stack trace', () => {
    const error = new BufferExhaustedError('test');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('BufferExhaustedError');
  });

  it('should be throwable and catchable', () => {
    expect(() => {
      throw new BufferExhaustedError('test error');
    }).toThrow(BufferExhaustedError);

    expect(() => {
      throw new BufferExhaustedError('test error');
    }).toThrow('test error');

    // Should also be catchable as BrokenMessageError
    expect(() => {
      throw new BufferExhaustedError('test error');
    }).toThrow(BrokenMessageError);
  });
});
