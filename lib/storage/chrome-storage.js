// InterviewAce Storage Manager
// Handles Chrome storage and IndexedDB for offline caching

class StorageManager {
  constructor() {
    this.dbName = 'InterviewAceDB';
    this.dbVersion = 1;
    this.db = null;
  }

  // Initialize IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Cache store for AI responses
        if (!db.objectStoreNames.contains('responseCache')) {
          const cacheStore = db.createObjectStore('responseCache', { keyPath: 'id' });
          cacheStore.createIndex('questionHash', 'questionHash', { unique: false });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Resume store
        if (!db.objectStoreNames.contains('resumes')) {
          const resumeStore = db.createObjectStore('resumes', { keyPath: 'id', autoIncrement: true });
          resumeStore.createIndex('name', 'name', { unique: false });
        }

        // Session history
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
          sessionStore.createIndex('date', 'date', { unique: false });
        }
      };
    });
  }

  // ============ CACHE OPERATIONS ============

  // Cache an AI response
  async cacheResponse(question, answer, context) {
    await this.init();

    const questionHash = this.hashString(question.toLowerCase());
    const cacheEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      questionHash,
      question: question.substring(0, 500),
      answer,
      context: {
        position: context?.jobDetails?.position || null,
        company: context?.jobDetails?.company || null
      },
      timestamp: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['responseCache'], 'readwrite');
      const store = transaction.objectStore('responseCache');
      const request = store.add(cacheEntry);

      request.onsuccess = () => resolve(cacheEntry);
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached response
  async getCachedResponse(question) {
    await this.init();

    const questionHash = this.hashString(question.toLowerCase());

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['responseCache'], 'readonly');
      const store = transaction.objectStore('responseCache');
      const index = store.index('questionHash');
      const request = index.getAll(questionHash);

      request.onsuccess = () => {
        const results = request.result.filter(r => r.expiresAt > Date.now());
        resolve(results.length > 0 ? results[0] : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clean expired cache
  async cleanExpiredCache() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['responseCache'], 'readwrite');
      const store = transaction.objectStore('responseCache');
      const request = store.openCursor();

      let deleted = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.expiresAt < Date.now()) {
            cursor.delete();
            deleted++;
          }
          cursor.continue();
        } else {
          resolve(deleted);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============ RESUME OPERATIONS ============

  // Save resume
  async saveResume(resume) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['resumes'], 'readwrite');
      const store = transaction.objectStore('resumes');
      const request = store.add(resume);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all resumes
  async getResumes() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['resumes'], 'readonly');
      const store = transaction.objectStore('resumes');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete resume
  async deleteResume(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['resumes'], 'readwrite');
      const store = transaction.objectStore('resumes');
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // ============ SESSION OPERATIONS ============

  // Save session
  async saveSession(session) {
    await this.init();

    const sessionData = {
      ...session,
      id: `session_${Date.now()}`,
      date: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.add(sessionData);

      request.onsuccess = () => resolve(sessionData);
      request.onerror = () => reject(request.error);
    });
  }

  // Get recent sessions
  async getRecentSessions(limit = 10) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const index = store.index('date');
      const request = index.openCursor(null, 'prev');

      const results = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============ CHROME STORAGE HELPERS ============

  // Sync to Chrome storage (for extension state)
  async syncToChrome(key, value) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(true);
        }
      });
    });
  }

  // Get from Chrome storage
  async getFromChrome(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key]);
        }
      });
    });
  }

  // ============ UTILITY ============

  // Hash string for cache keys
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Export all data (for backup)
  async exportAll() {
    const resumes = await this.getResumes();
    const sessions = await this.getRecentSessions(100);
    const cache = await this.getAllCache();

    return {
      resumes,
      sessions,
      cache,
      exportDate: new Date().toISOString()
    };
  }

  // Get all cache entries
  async getAllCache() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['responseCache'], 'readonly');
      const store = transaction.objectStore('responseCache');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data
  async clearAll() {
    await this.init();

    const stores = ['responseCache', 'resumes', 'sessions'];

    for (const storeName of stores) {
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}

window.StorageManager = StorageManager;