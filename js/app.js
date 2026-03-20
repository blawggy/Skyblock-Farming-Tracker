/**
 * app.js — Main application logic, DOM manipulation, event handlers
 */

import { getUsernameToUUID, getAccount, getFarmingWeight, getCrops } from './api.js';
import {
  startSession,
  stopSession,
  loadSessions,
  loadActiveSession,
  deleteSession,
  clearAllSessions,
} from './session.js';
import {
  formatNumber,
  formatDecimal,
  formatDuration,
  formatDate,
  calcPercent,
  getMelonMilestone,
  MELON_MILESTONES,
} from './utils.js';

// ── State ─────────────────────────────────────────────────────────────────────
let currentPlayerUuid = null;
let currentPlayerName = null;
let currentProfiles = [];
let selectedProfile = null;
let currentMelonCount = 0;
let activeSession = null;
let sessionTimerInterval = null;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const searchForm = document.getElementById('search-form');
const usernameInput = document.getElementById('username-input');
const searchBtn = document.getElementById('search-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const errorBanner = document.getElementById('error-banner');
const errorText = document.getElementById('error-text');

const playerCard = document.getElementById('player-card');
const playerAvatar = document.getElementById('player-avatar');
const playerNameEl = document.getElementById('player-name');
const profileList = document.getElementById('profile-list');

const dashboard = document.getElementById('dashboard');
const statMelonCollection = document.getElementById('stat-melon-collection');
const statFarmingLevel = document.getElementById('stat-farming-level');
const statFarmingXP = document.getElementById('stat-farming-xp');
const statFarmingWeight = document.getElementById('stat-farming-weight');
const statMelonWeight = document.getElementById('stat-melon-weight');
const milestoneBar = document.getElementById('milestone-bar');
const milestoneLabel = document.getElementById('milestone-label');
const milestoneNext = document.getElementById('milestone-next');
const allMilestonesContainer = document.getElementById('all-milestones');

const sessionSection = document.getElementById('session-section');
const startSessionBtn = document.getElementById('start-session-btn');
const stopSessionBtn = document.getElementById('stop-session-btn');
const sessionStatus = document.getElementById('session-status');
const sessionTimer = document.getElementById('session-timer');
const sessionHistoryBody = document.getElementById('session-history-body');
const clearSessionsBtn = document.getElementById('clear-sessions-btn');
const noSessionsRow = document.getElementById('no-sessions-row');
const refreshBtn = document.getElementById('refresh-btn');

// ── Helpers ───────────────────────────────────────────────────────────────────

function showLoading(on) {
  loadingSpinner.classList.toggle('hidden', !on);
  searchBtn.disabled = on;
}

function showError(msg) {
  errorText.textContent = msg;
  errorBanner.classList.remove('hidden');
}

function hideError() {
  errorBanner.classList.add('hidden');
}

function setDashboardVisible(on) {
  dashboard.classList.toggle('hidden', !on);
  sessionSection.classList.toggle('hidden', !on);
}

// ── Search ────────────────────────────────────────────────────────────────────

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) return;

  hideError();
  showLoading(true);
  playerCard.classList.add('hidden');
  setDashboardVisible(false);

  try {
    const mojang = await getUsernameToUUID(username);
    currentPlayerUuid = mojang.id;
    currentPlayerName = mojang.name;

    const account = await getAccount(currentPlayerUuid);
    renderPlayerCard(account, mojang.name);
    renderProfileList(account);
  } catch (err) {
    showError(err.message || 'An unexpected error occurred.');
  } finally {
    showLoading(false);
  }
});

// ── Player Card ───────────────────────────────────────────────────────────────

function renderPlayerCard(account, username) {
  playerAvatar.src = `https://mc-heads.net/avatar/${encodeURIComponent(username)}/100`;
  playerAvatar.alt = `${username}'s avatar`;
  playerNameEl.textContent = account?.name || username;
  playerCard.classList.remove('hidden');
}

// ── Profile List ──────────────────────────────────────────────────────────────

function renderProfileList(account) {
  profileList.innerHTML = '';

  const profiles = account?.profiles ?? [];

  if (!profiles.length) {
    profileList.innerHTML = '<p class="no-profiles">No SkyBlock profiles found.</p>';
    return;
  }

  currentProfiles = profiles;

  profiles.forEach((profile) => {
    const btn = document.createElement('button');
    btn.className = 'profile-btn';
    btn.dataset.profileId = profile.profileId || profile.id || '';
    const label = profile.profileName || profile.cute_name || profile.profileId || 'Unknown';
    btn.textContent = label;
    btn.addEventListener('click', () => selectProfile(profile));
    profileList.appendChild(btn);
  });
}

async function selectProfile(profile) {
  // Highlight selected
  document.querySelectorAll('.profile-btn').forEach((b) => b.classList.remove('active'));
  const profileId = profile.profileId || profile.id || '';
  const activeBtn = profileList.querySelector(`[data-profile-id="${profileId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  selectedProfile = profile;
  hideError();
  showLoading(true);
  setDashboardVisible(false);

  try {
    const [weightData, cropsData] = await Promise.all([
      getFarmingWeight(currentPlayerUuid, profileId),
      getCrops(currentPlayerUuid, profileId),
    ]);

    renderDashboard(profile, weightData, cropsData);
    setDashboardVisible(true);
    renderSessionSection();
  } catch (err) {
    showError(err.message || 'Failed to load profile data.');
  } finally {
    showLoading(false);
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function extractMelonCount(profile, cropsData) {
  // Try crops endpoint first
  if (cropsData) {
    // The API may return crops as an object keyed by crop name, or as an array
    if (Array.isArray(cropsData)) {
      const melonEntry = cropsData.find(
        (c) => (c.crop || c.name || '').toLowerCase().includes('melon')
      );
      if (melonEntry) return melonEntry.amount ?? melonEntry.count ?? melonEntry.collected ?? 0;
    } else if (typeof cropsData === 'object') {
      // Check for direct melon key
      for (const key of Object.keys(cropsData)) {
        if (key.toLowerCase().includes('melon')) {
          const val = cropsData[key];
          if (typeof val === 'number') return val;
          if (typeof val === 'object') return val.amount ?? val.collected ?? val.count ?? 0;
        }
      }
      // Some APIs wrap in data property
      if (cropsData.data) return extractMelonCount(profile, cropsData.data);
      if (cropsData.crops) return extractMelonCount(profile, cropsData.crops);
    }
  }

  // Fallback: try profile collections
  const members = profile?.members;
  if (members) {
    const memberData = Object.values(members)[0];
    const collections = memberData?.collection ?? memberData?.collections ?? {};
    for (const key of Object.keys(collections)) {
      if (key.toLowerCase().includes('melon')) return collections[key] ?? 0;
    }
  }

  return 0;
}

function extractFarmingInfo(profile) {
  const members = profile?.members;
  let farmingXP = 0;
  let farmingLevel = 0;

  if (members) {
    const memberData = Object.values(members)[0];
    const skills = memberData?.player_data?.experience ?? memberData?.skills ?? {};
    farmingXP = skills.SKILL_FARMING ?? skills.farming ?? 0;
    // Basic XP → level conversion (cumulative XP table approximation)
    farmingLevel = xpToFarmingLevel(farmingXP);
  }

  return { farmingXP, farmingLevel };
}

// Farming skill XP thresholds (SkyBlock cumulative XP per level 1–60)
const FARMING_XP_TABLE = [
  0, 50, 175, 375, 675, 1175, 1925, 2925, 4425, 6425, 9925, 14925, 22425, 32425, 47425, 67425,
  97425, 147425, 222425, 322425, 522425, 822425, 1222425, 1722425, 2322425, 3022425, 3822425,
  4722425, 5722425, 6822425, 8022425, 9322425, 10722425, 12222425, 13822425, 15522425, 17322425,
  19222425, 21222425, 23322425, 25522425, 27822425, 30222425, 32722425, 35322425, 38072425,
  40922425, 43872425, 46972425, 50172425, 53472425, 56972425, 60572425, 64372425, 68372425,
  72572425, 76972425, 81572425, 86372425, 91372425,
];

function xpToFarmingLevel(xp) {
  let level = 0;
  for (let i = 0; i < FARMING_XP_TABLE.length; i++) {
    if (xp >= FARMING_XP_TABLE[i]) level = i;
    else break;
  }
  return level;
}

function renderDashboard(profile, weightData, cropsData) {
  const melonCount = extractMelonCount(profile, cropsData);
  currentMelonCount = melonCount;

  // Farming info
  const { farmingXP, farmingLevel } = extractFarmingInfo(profile);

  // Weight
  let totalWeight = 0;
  let melonWeight = 0;
  if (weightData) {
    totalWeight = weightData.totalWeight ?? weightData.total_weight ?? weightData.weight ?? 0;
    // Look for melon-specific weight
    const cropWeights = weightData.cropWeight ?? weightData.crop_weight ?? weightData.crops ?? {};
    if (typeof cropWeights === 'object') {
      for (const key of Object.keys(cropWeights)) {
        if (key.toLowerCase().includes('melon')) {
          melonWeight = cropWeights[key] ?? 0;
          break;
        }
      }
    }
    // Fallback: check data sub-object
    if (!melonWeight && weightData.data) {
      const wd = weightData.data;
      totalWeight = wd.totalWeight ?? wd.total_weight ?? wd.weight ?? totalWeight;
      const cw = wd.cropWeight ?? wd.crop_weight ?? wd.crops ?? {};
      for (const key of Object.keys(cw)) {
        if (key.toLowerCase().includes('melon')) {
          melonWeight = cw[key] ?? 0;
          break;
        }
      }
    }
  }

  // Update stat cards
  statMelonCollection.textContent = formatNumber(melonCount);
  statFarmingLevel.textContent = farmingLevel;
  statFarmingXP.textContent = formatNumber(farmingXP) + ' XP';
  statFarmingWeight.textContent = formatDecimal(totalWeight, 2);
  statMelonWeight.textContent = formatDecimal(melonWeight, 2);

  // Milestone progress
  renderMilestoneProgress(melonCount);
}

function renderMilestoneProgress(melonCount) {
  const { currentTier, nextTier, required, progress } = getMelonMilestone(melonCount);

  milestoneBar.style.width = `${progress.toFixed(1)}%`;
  milestoneBar.setAttribute('aria-valuenow', progress.toFixed(1));

  if (nextTier) {
    milestoneLabel.textContent = `Tier ${currentTier} → Tier ${nextTier}`;
    milestoneNext.textContent = `${formatNumber(melonCount)} / ${formatNumber(required)} melons (${progress.toFixed(1)}%)`;
  } else {
    milestoneLabel.textContent = `Max Tier ${currentTier} reached! 🎉`;
    milestoneNext.textContent = `${formatNumber(melonCount)} melons collected`;
    milestoneBar.style.width = '100%';
  }

  // Render all milestone tiers
  allMilestonesContainer.innerHTML = '';
  MELON_MILESTONES.forEach((m) => {
    const done = melonCount >= m.required;
    const isCurrent = !done && nextTier === m.tier;
    const pct = done ? 100 : isCurrent ? calcPercent(melonCount, m.required) : 0;

    const row = document.createElement('div');
    row.className = `milestone-row${done ? ' done' : isCurrent ? ' active' : ''}`;
    row.innerHTML = `
      <span class="milestone-tier">Tier ${m.tier}</span>
      <div class="milestone-mini-bar-wrap">
        <div class="milestone-mini-bar" style="width:${pct.toFixed(1)}%"></div>
      </div>
      <span class="milestone-req">${formatNumber(m.required)}</span>
      <span class="milestone-check">${done ? '✅' : isCurrent ? '🍈' : '⬜'}</span>
    `;
    allMilestonesContainer.appendChild(row);
  });
}

// ── Session Section ───────────────────────────────────────────────────────────

function renderSessionSection() {
  activeSession = loadActiveSession();
  updateSessionButtons();
  renderSessionHistory();

  if (activeSession) {
    startSessionTimer();
  }
}

function updateSessionButtons() {
  if (activeSession) {
    startSessionBtn.disabled = true;
    stopSessionBtn.disabled = false;
    sessionStatus.textContent = `Session started — farming melons since ${formatDate(activeSession.startTime)}`;
    sessionStatus.className = 'session-status active';
  } else {
    startSessionBtn.disabled = false;
    stopSessionBtn.disabled = true;
    sessionStatus.textContent = 'No active session.';
    sessionStatus.className = 'session-status';
    sessionTimer.textContent = '';
  }
}

function startSessionTimer() {
  clearInterval(sessionTimerInterval);
  sessionTimerInterval = setInterval(() => {
    if (!activeSession) {
      clearInterval(sessionTimerInterval);
      return;
    }
    const elapsed = Math.floor((Date.now() - activeSession.startTime) / 1000);
    sessionTimer.textContent = `⏱ ${formatDuration(elapsed)}`;
  }, 1000);
}

startSessionBtn.addEventListener('click', () => {
  activeSession = startSession(currentMelonCount, selectedProfile?.profileName || selectedProfile?.cute_name || '');
  updateSessionButtons();
  startSessionTimer();
});

stopSessionBtn.addEventListener('click', async () => {
  if (!activeSession) return;
  clearInterval(sessionTimerInterval);

  // Optionally refresh melon count before stopping
  showLoading(true);
  try {
    if (selectedProfile && currentPlayerUuid) {
      const profileId = selectedProfile.profileId || selectedProfile.id || '';
      const cropsData = await getCrops(currentPlayerUuid, profileId);
      const fresh = extractMelonCount(selectedProfile, cropsData);
      if (fresh > 0) currentMelonCount = fresh;
    }
  } catch {
    // Use last known count
  } finally {
    showLoading(false);
  }

  const completed = stopSession(currentMelonCount);
  activeSession = null;
  updateSessionButtons();
  renderSessionHistory();

  // Show a quick summary
  sessionStatus.textContent = `Session ended! Farmed ${formatNumber(completed.melonsFarmed)} melons in ${formatDuration(completed.durationSeconds)} (${formatNumber(completed.melonsPerHour)}/hr)`;
  sessionStatus.className = 'session-status done';
});

refreshBtn.addEventListener('click', async () => {
  if (!selectedProfile || !currentPlayerUuid) return;
  hideError();
  showLoading(true);
  try {
    const profileId = selectedProfile.profileId || selectedProfile.id || '';
    const [weightData, cropsData] = await Promise.all([
      getFarmingWeight(currentPlayerUuid, profileId),
      getCrops(currentPlayerUuid, profileId),
    ]);
    renderDashboard(selectedProfile, weightData, cropsData);
  } catch (err) {
    showError(err.message || 'Failed to refresh data.');
  } finally {
    showLoading(false);
  }
});

clearSessionsBtn.addEventListener('click', () => {
  if (!confirm('Clear all session history?')) return;
  clearAllSessions();
  activeSession = null;
  clearInterval(sessionTimerInterval);
  updateSessionButtons();
  renderSessionHistory();
});

function renderSessionHistory() {
  const sessions = loadSessions();
  sessionHistoryBody.innerHTML = '';

  if (!sessions.length) {
    noSessionsRow.classList.remove('hidden');
    return;
  }
  noSessionsRow.classList.add('hidden');

  sessions.forEach((s) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(s.startTime)}</td>
      <td>${s.profileName || '—'}</td>
      <td>${formatDuration(s.durationSeconds)}</td>
      <td>${formatNumber(s.melonsFarmed)}</td>
      <td>${formatNumber(s.melonsPerHour)}/hr</td>
      <td><button class="delete-session-btn" data-id="${s.id}" title="Delete session">🗑</button></td>
    `;
    sessionHistoryBody.appendChild(tr);
  });

  // Wire delete buttons
  sessionHistoryBody.querySelectorAll('.delete-session-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      deleteSession(Number(btn.dataset.id));
      renderSessionHistory();
    });
  });
}

// ── Error banner dismiss ──────────────────────────────────────────────────────

document.getElementById('error-close').addEventListener('click', hideError);

// ── Init ──────────────────────────────────────────────────────────────────────
(function init() {
  setDashboardVisible(false);
  playerCard.classList.add('hidden');
  // If there is a persisted active session, show a note
  const persisted = loadActiveSession();
  if (persisted) {
    sessionStatus.textContent = `You have an active session from ${formatDate(persisted.startTime)} — load a profile to continue.`;
    sessionStatus.className = 'session-status active';
  }
})();
