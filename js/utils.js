/**
 * Utility / helper functions
 */

/**
 * Format a large number with commas (e.g. 1234567 → "1,234,567")
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Math.floor(num).toLocaleString('en-US');
}

/**
 * Format a decimal number to a fixed number of decimal places
 * @param {number} num
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatDecimal(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return Number(num).toFixed(decimals);
}

/**
 * Format seconds into a human-readable duration string
 * @param {number} totalSeconds
 * @returns {string} e.g. "1h 23m 45s"
 */
export function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return '0s';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

/**
 * Format a Date object or timestamp to a readable string
 * @param {Date|number} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Compute the percentage (0–100), capped at 100
 * @param {number} current
 * @param {number} max
 * @returns {number}
 */
export function calcPercent(current, max) {
  if (!max || max <= 0) return 0;
  return Math.min(100, (current / max) * 100);
}

/**
 * Melon collection milestones (approximate SkyBlock tier thresholds)
 */
export const MELON_MILESTONES = [
  { tier: 1, required: 250 },
  { tier: 2, required: 2500 },
  { tier: 3, required: 25000 },
  { tier: 4, required: 100000 },
  { tier: 5, required: 300000 },
  { tier: 6, required: 1500000 },
  { tier: 7, required: 5000000 },
  { tier: 8, required: 20000000 },
  { tier: 9, required: 100000000 },
];

/**
 * Return the current milestone tier and progress for a given melon count
 * @param {number} melonCount
 * @returns {{ currentTier: number, nextTier: number|null, required: number|null, progress: number }}
 */
export function getMelonMilestone(melonCount) {
  let currentTier = 0;
  let nextMilestone = MELON_MILESTONES[0];

  for (let i = 0; i < MELON_MILESTONES.length; i++) {
    if (melonCount >= MELON_MILESTONES[i].required) {
      currentTier = MELON_MILESTONES[i].tier;
      nextMilestone = MELON_MILESTONES[i + 1] || null;
    } else {
      nextMilestone = MELON_MILESTONES[i];
      break;
    }
  }

  const prevRequired = currentTier > 1 ? MELON_MILESTONES[currentTier - 2].required : 0;
  const nextRequired = nextMilestone ? nextMilestone.required : MELON_MILESTONES[MELON_MILESTONES.length - 1].required;
  const progress = calcPercent(melonCount - prevRequired, nextRequired - prevRequired);

  return {
    currentTier,
    nextTier: nextMilestone ? nextMilestone.tier : null,
    required: nextMilestone ? nextMilestone.required : null,
    progress,
  };
}

/**
 * Clamp a number between min and max
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}
