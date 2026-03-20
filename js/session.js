/**
 * Session tracking logic — uses localStorage for persistence
 */

const STORAGE_KEY = 'melonTracker_sessions';
const ACTIVE_KEY = 'melonTracker_activeSession';

/**
 * Load all stored sessions from localStorage.
 * @returns {Array<object>}
 */
export function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save sessions array to localStorage.
 * @param {Array<object>} sessions
 */
function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * Load the currently active session (if any).
 * @returns {object|null}
 */
export function loadActiveSession() {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Save the active session to localStorage.
 * @param {object} session
 */
function saveActiveSession(session) {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
}

/**
 * Clear the active session from localStorage.
 */
function clearActiveSession() {
  localStorage.removeItem(ACTIVE_KEY);
}

/**
 * Start a new farming session.
 * @param {number} startMelonCount - Current melon collection count
 * @param {string} [profileName] - Optional profile name
 * @returns {object} The new active session object
 */
export function startSession(startMelonCount, profileName = '') {
  const session = {
    id: Date.now(),
    startTime: Date.now(),
    startMelonCount,
    profileName,
  };
  saveActiveSession(session);
  return session;
}

/**
 * Stop the active session, calculate stats, and persist to history.
 * @param {number} endMelonCount - Current melon collection count at end of session
 * @returns {object} The completed session with stats
 */
export function stopSession(endMelonCount) {
  const active = loadActiveSession();
  if (!active) throw new Error('No active session to stop.');

  const endTime = Date.now();
  const durationMs = endTime - active.startTime;
  const durationSeconds = Math.floor(durationMs / 1000);
  const melonsFarmed = Math.max(0, endMelonCount - active.startMelonCount);
  const durationHours = durationMs / 3600000;
  const melonsPerHour = durationHours > 0 ? Math.round(melonsFarmed / durationHours) : 0;

  const completed = {
    ...active,
    endTime,
    endMelonCount,
    durationSeconds,
    melonsFarmed,
    melonsPerHour,
  };

  // Save to history
  const sessions = loadSessions();
  sessions.unshift(completed); // most recent first
  saveSessions(sessions);
  clearActiveSession();

  return completed;
}

/**
 * Delete a session by its id.
 * @param {number} id
 */
export function deleteSession(id) {
  const sessions = loadSessions().filter((s) => s.id !== id);
  saveSessions(sessions);
}

/**
 * Clear all stored sessions.
 */
export function clearAllSessions() {
  localStorage.removeItem(STORAGE_KEY);
  clearActiveSession();
}
