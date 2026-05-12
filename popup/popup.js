// InterviewAce Popup - Simple sync UI
// Opens dashboard and syncs user data

document.addEventListener('DOMContentLoaded', async () => {
  // Load state from storage
  const state = await chrome.storage.local.get(['interviewAceState', 'userData']);

  // Update UI based on state
  updateSyncStatus(state);

  // Open dashboard button
  document.getElementById('openDashboard').addEventListener('click', () => {
    // Open the web dashboard
    chrome.tabs.create({ url: 'https://interviewace.com/dashboard' });
  });

  // Sync button to pull latest from dashboard
  document.getElementById('syncStatus').addEventListener('click', syncData);

  // Help link
  document.getElementById('helpLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://interviewace.com/help' });
  });
});

// Sync data from web dashboard
async function syncData() {
  const statusEl = document.getElementById('syncStatus');
  statusEl.textContent = 'Syncing...';
  statusEl.classList.remove('synced');

  try {
    // Get auth token from storage
    const state = await chrome.storage.local.get(['userData']);
    const userData = state.userData || {};

    if (!userData.token) {
      statusEl.textContent = 'Not signed in - Open dashboard to login';
      return;
    }

    // Fetch user data from backend API
    const response = await fetch('https://api.interviewace.com/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${userData.token}`
      }
    });

    if (!response.ok) throw new Error('Sync failed');

    const profile = await response.json();

    // Store synced data
    await chrome.storage.local.set({
      interviewAceState: {
        resumes: profile.resumes || [],
        jobDetails: profile.jobDetails || {},
        settings: profile.settings || {}
      },
      userData: {
        ...userData,
        plan: profile.subscriptionTier,
        lastSync: Date.now()
      }
    });

    statusEl.textContent = 'Synced successfully';
    statusEl.classList.add('synced');

    // Update plan badge
    document.getElementById('planBadge').textContent = `${profile.subscriptionTier || 'Free'} Plan`;

    setTimeout(() => {
      statusEl.textContent = 'Last sync: just now';
    }, 3000);

  } catch (error) {
    console.error('Sync error:', error);
    statusEl.textContent = 'Sync failed - click to retry';
  }
}

// Update UI based on stored state
async function updateSyncStatus(state) {
  const statusEl = document.getElementById('syncStatus');
  const planBadge = document.getElementById('planBadge');

  const userData = state.userData || {};
  const interviewState = state.interviewAceState || {};

  if (userData.plan) {
    planBadge.textContent = `${userData.plan} Plan`;
  }

  if (userData.lastSync) {
    const mins = Math.floor((Date.now() - userData.lastSync) / 60000);
    if (mins < 1) {
      statusEl.textContent = 'Synced just now';
    } else {
      statusEl.textContent = `Synced ${mins}m ago`;
    }
    statusEl.classList.add('synced');
  }

  if (!userData.token) {
    statusEl.textContent = 'Click to sync';
  }
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SYNC_COMPLETE') {
    syncData();
  }
});