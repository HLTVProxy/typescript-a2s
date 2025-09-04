import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TIMEOUT,
  DEFAULT_ENCODING,
  DEFAULT_RETRIES,
} from '../defaults.js';

describe('Default constants', () => {
  describe('DEFAULT_TIMEOUT', () => {
    it('should have correct value', () => {
      expect(DEFAULT_TIMEOUT).toBe(3.0);
    });

    it('should be a number', () => {
      expect(typeof DEFAULT_TIMEOUT).toBe('number');
    });
  });

  describe('DEFAULT_ENCODING', () => {
    it('should have correct value', () => {
      expect(DEFAULT_ENCODING).toBe('utf-8');
    });

    it('should be a string', () => {
      expect(typeof DEFAULT_ENCODING).toBe('string');
    });
  });

  describe('DEFAULT_RETRIES', () => {
    it('should have correct value', () => {
      expect(DEFAULT_RETRIES).toBe(5);
    });

    it('should be a number', () => {
      expect(typeof DEFAULT_RETRIES).toBe('number');
    });

    it('should be a positive integer', () => {
      expect(DEFAULT_RETRIES).toBeGreaterThan(0);
      expect(Number.isInteger(DEFAULT_RETRIES)).toBe(true);
    });
  });

  describe('Constants consistency', () => {
    it('should have reasonable timeout value', () => {
      expect(DEFAULT_TIMEOUT).toBeGreaterThan(0);
      expect(DEFAULT_TIMEOUT).toBeLessThan(60); // Should be less than 1 minute
    });

    it('should have reasonable retry count', () => {
      expect(DEFAULT_RETRIES).toBeGreaterThanOrEqual(1);
      expect(DEFAULT_RETRIES).toBeLessThanOrEqual(20); // Should not retry too many times
    });

    it('should have valid encoding', () => {
      expect(DEFAULT_ENCODING).toMatch(/^utf-8$/i);
    });
  });
});
