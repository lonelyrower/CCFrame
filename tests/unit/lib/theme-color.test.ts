import { describe, it, expect } from 'vitest';
import { rgbToHsl } from '@/lib/theme-color';

describe('theme-color utilities', () => {
  describe('rgbToHsl', () => {
    it('should convert pure red to HSL', () => {
      const [h, s, l] = rgbToHsl(255, 0, 0);
      expect(h).toBe(0);
      expect(s).toBe(100);
      expect(l).toBe(50);
    });

    it('should convert pure green to HSL', () => {
      const [h, s, l] = rgbToHsl(0, 255, 0);
      expect(h).toBe(120);
      expect(s).toBe(100);
      expect(l).toBe(50);
    });

    it('should convert pure blue to HSL', () => {
      const [h, s, l] = rgbToHsl(0, 0, 255);
      expect(h).toBe(240);
      expect(s).toBe(100);
      expect(l).toBe(50);
    });

    it('should convert white to HSL', () => {
      const [h, s, l] = rgbToHsl(255, 255, 255);
      expect(h).toBe(0);
      expect(s).toBe(0);
      expect(l).toBe(100);
    });

    it('should convert black to HSL', () => {
      const [h, s, l] = rgbToHsl(0, 0, 0);
      expect(h).toBe(0);
      expect(s).toBe(0);
      expect(l).toBe(0);
    });

    it('should convert gray to HSL', () => {
      const [h, s, l] = rgbToHsl(128, 128, 128);
      expect(h).toBe(0);
      expect(s).toBe(0);
      expect(Math.round(l)).toBe(50);
    });

    it('should handle mid-range colors', () => {
      // Orange-ish color
      const [h, s, l] = rgbToHsl(255, 128, 0);
      expect(h).toBeCloseTo(30, 0);
      expect(s).toBe(100);
      expect(l).toBe(50);
    });
  });
});
