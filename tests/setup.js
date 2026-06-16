// Mock localStorage for tests
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) { return this.store[key] || null; }
  setItem(key, value) { this.store[key] = String(value); }
  removeItem(key) { delete this.store[key]; }
  clear() { this.store = {}; }
  get length() { return Object.keys(this.store).length; }
  key(index) { return Object.keys(this.store)[index] || null; }
}

global.localStorage = new LocalStorageMock();
global.indexedDB = undefined; // Force fallback to localStorage
