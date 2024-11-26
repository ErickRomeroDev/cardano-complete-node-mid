/**
 * Provides utility and conversion functions.
 *
 * @module
 */

/**
 * Generates a buffer containing a series of randomly generated bytes.
 *
 * @param length The number of bytes to generate.
 * @returns A `Uint8Array` representing `length` randomly generated bytes.
 */
export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

export * from './conversion-utils.js';
