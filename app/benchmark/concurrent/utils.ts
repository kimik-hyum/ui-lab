/**
 * Blocks the main thread for a specified amount of milliseconds.
 * This simulates a "Heavy Component" rendering or complex calculation.
 */
export function slowDown(ms: number) {
  const start = performance.now();
  while (performance.now() - start < ms) {
    // Artificial blocking
  }
}

/**
 * Generates dummy data for the list
 */
export function generateItems(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        text: `Item #${i + 1} - ${Math.random().toString(36).substring(7)}`,
        // Pre-calculate some complexity seeds
        complexitySeed: Math.random()
    }));
}
