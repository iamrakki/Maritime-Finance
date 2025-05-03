/**
 * Hex Encoding Utilities
 * All string fields in XRPL credentials must be hex-encoded.
 * This implementation uses Node.js Buffer for robust conversion.
 */

/**
 * Convert a UTF-8 string to its uppercase hexadecimal representation.
 * @param str The input string.
 * @returns The uppercase hex string.
 */
export function toHex(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  return Buffer.from(str, 'utf8').toString('hex').toUpperCase();
}

/**
 * Convert a UTF-8 string to its lowercase hexadecimal representation.
 * @param str The input string.
 * @returns The lowercase hex string.
 */
export function toHexLower(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  return Buffer.from(str, 'utf8').toString('hex').toLowerCase();
}

/**
 * Convert an uppercase hexadecimal string back to its UTF-8 string representation.
 * @param hex The uppercase hex string.
 * @returns The decoded UTF-8 string.
 */
export function fromHex(hex: string): string {
  if (typeof hex !== 'string' || hex.length % 2 !== 0) {
    return '';
  }
  return Buffer.from(hex, 'hex').toString('utf8');
}

/**
 * Validate if a string is a valid hexadecimal.
 * @param hex The string to validate.
 * @returns True if the string is valid hex.
 */
export function isValidHex(hex: string): boolean {
  // Regex to check for valid hex characters, case-insensitive
  return /^[0-9A-F]*$/i.test(hex) && hex.length % 2 === 0;
}

/**
 * Validate if a string is a valid lowercase hexadecimal.
 * @param hex The string to validate.
 * @returns True if the string is valid lowercase hex.
 */
export function isLowerHex(hex: string): boolean {
  return /^[0-9a-f]*$/.test(hex) && hex.length % 2 === 0;
}
