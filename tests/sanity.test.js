import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have localStorage mocked', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
  });
});
