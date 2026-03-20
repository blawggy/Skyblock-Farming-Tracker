/**
 * API service layer — Mojang + Elite Skyblock API
 */

const MOJANG_API = '/api/mojang/users/profiles/minecraft';
const ELITE_API = '/api/elite';

/**
 * Resolve a Minecraft username to a UUID using the Mojang API.
 * @param {string} username
 * @returns {Promise<{id: string, name: string}>}
 */
export async function getUsernameToUUID(username) {
  const res = await fetch(`${MOJANG_API}/${encodeURIComponent(username)}`);
  if (res.status === 204 || res.status === 404) {
    throw new Error(`Player "${username}" not found.`);
  }
  if (!res.ok) {
    throw new Error(`Mojang API error: ${res.status}`);
  }
  const data = await res.json();
  if (!data || !data.id) {
    throw new Error(`Player "${username}" not found.`);
  }
  return data; // { id, name }
}

/**
 * Fetch account data from the Elite Skyblock API.
 * @param {string} playerUuid
 * @returns {Promise<object>}
 */
export async function getAccount(playerUuid) {
  const res = await fetch(`${ELITE_API}/account/${encodeURIComponent(playerUuid)}`);
  if (res.status === 404) {
    throw new Error('Player account not found on Elite Skyblock API.');
  }
  if (!res.ok) {
    throw new Error(`Elite API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch farming weight breakdown for a player/profile.
 * @param {string} playerUuid
 * @param {string} profileUuid
 * @returns {Promise<object>}
 */
export async function getFarmingWeight(playerUuid, profileUuid) {
  const res = await fetch(
    `${ELITE_API}/weight/${encodeURIComponent(playerUuid)}/${encodeURIComponent(profileUuid)}`
  );
  if (!res.ok) {
    // Weight endpoint may 404 for new profiles — treat as empty
    if (res.status === 404) return null;
    throw new Error(`Elite API weight error: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch crop collection details for a player/profile.
 * @param {string} playerUuid
 * @param {string} profileUuid
 * @returns {Promise<object>}
 */
export async function getCrops(playerUuid, profileUuid) {
  const res = await fetch(
    `${ELITE_API}/crops/${encodeURIComponent(playerUuid)}/${encodeURIComponent(profileUuid)}`
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Elite API crops error: ${res.status}`);
  }
  return res.json();
}
