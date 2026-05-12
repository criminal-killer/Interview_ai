// Shared users store - in production, use Turso DB
const usersStore = new Map();

// Sample users for testing
usersStore.set('admin@interviewace.com', {
  id: 'admin_001',
  email: 'admin@interviewace.com',
  name: 'Admin',
  plan: 'enterprise',
  referralCode: 'ADMIN001',
  referralEarnings: 150,
  createdAt: '2024-01-01T00:00:00Z'
});

module.exports = { usersStore };