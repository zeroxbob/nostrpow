/**
 * Utility functions for calculating Proof of Work (PoW) difficulty
 * Based on NIP-13 (https://github.com/nostr-protocol/nips/blob/master/13.md)
 */

/**
 * Count the number of leading zero bits in a hex string
 * @param hex Hexadecimal string (no 0x prefix)
 * @returns Number of leading zero bits
 */
export function countLeadingZeroBits(hex: string): number {
  let count = 0;

  for (let i = 0; i < hex.length; i++) {
    const nibble = parseInt(hex[i], 16);
    if (nibble === 0) {
      count += 4;
    } else {
      // Count remaining leading zeros in this nibble (0-3)
      // Math.clz32 counts leading zeros in a 32-bit integer
      // We subtract 28 because we're only interested in the 4 bits of the nibble
      count += Math.clz32(nibble) - 28;
      break;
    }
  }

  return count;
}

/**
 * Format PoW difficulty for display
 * @param difficulty Number of leading zero bits
 * @returns Formatted string
 */
export function formatPowDifficulty(difficulty: number): string {
  if (difficulty <= 0) {
    return "No PoW";
  }
  
  // For higher difficulty values, also show approximate work required
  if (difficulty >= 20) {
    // Each bit of difficulty doubles the work required
    // So 2^difficulty is the approximate work factor
    const workFactor = Math.pow(2, difficulty);
    
    // Format large numbers with appropriate suffix (K, M, B, T)
    if (workFactor >= 1e12) {
      return `${difficulty} bits (${(workFactor / 1e12).toFixed(1)}T hashes)`;
    } else if (workFactor >= 1e9) {
      return `${difficulty} bits (${(workFactor / 1e9).toFixed(1)}B hashes)`;
    } else if (workFactor >= 1e6) {
      return `${difficulty} bits (${(workFactor / 1e6).toFixed(1)}M hashes)`;
    } else if (workFactor >= 1e3) {
      return `${difficulty} bits (${(workFactor / 1e3).toFixed(1)}K hashes)`;
    }
    
    return `${difficulty} bits (${workFactor.toFixed(0)} hashes)`;
  }
  
  return `${difficulty} bits`;
}

/**
 * Extracts the target difficulty from a nonce tag if available
 * @param tags Event tags array
 * @returns Target difficulty or undefined if not found
 */
export function getTargetDifficulty(tags: string[][]): number | undefined {
  const nonceTag = tags.find(tag => tag[0] === 'nonce' && tag.length >= 3);
  if (nonceTag && nonceTag[2]) {
    const targetDiff = parseInt(nonceTag[2], 10);
    return isNaN(targetDiff) ? undefined : targetDiff;
  }
  return undefined;
}

/**
 * Get a CSS color class based on PoW difficulty
 * @param difficulty Number of leading zero bits
 * @returns Tailwind CSS color class
 */
export function getPowColorClass(difficulty: number): string {
  if (difficulty <= 0) return "text-gray-400";
  if (difficulty < 10) return "text-blue-400";
  if (difficulty < 15) return "text-green-500";
  if (difficulty < 20) return "text-yellow-500";
  if (difficulty < 25) return "text-orange-500";
  return "text-red-500 font-bold";
}