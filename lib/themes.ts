export type ThemeId = 'atelier' | 'noir' | 'sage' | 'ocean' | 'custom';

interface ThemePalette {
  accent: string;
  accentSoft: string;
  accentStrong: string;
  luxury: string;
}

interface ThemePreset {
  id: Exclude<ThemeId, 'custom'>;
  label: string;
  description: string;
  light: ThemePalette;
  dark: ThemePalette;
}

export const DEFAULT_THEME_ID: ThemeId = 'atelier';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'atelier',
    label: 'Atelier',
    description: 'Warm editorial reds with gilded highlights',
    light: {
      accent: '#e63946',
      accentSoft: '#ff6b7a',
      accentStrong: '#c1121f',
      luxury: '#d4af37',
    },
    dark: {
      accent: '#ff6b7a',
      accentSoft: '#ff8fa3',
      accentStrong: '#ff8fa3',
      luxury: '#d4af37',
    },
  },
  {
    id: 'noir',
    label: 'Noir',
    description: 'Muted brass with cinematic depth',
    light: {
      accent: '#9c7a3a',
      accentSoft: '#c3a05a',
      accentStrong: '#7a5b25',
      luxury: '#e0b878',
    },
    dark: {
      accent: '#c3a05a',
      accentSoft: '#e0c48b',
      accentStrong: '#e0c48b',
      luxury: '#e0b878',
    },
  },
  {
    id: 'sage',
    label: 'Sage',
    description: 'Calm greens with soft botanical warmth',
    light: {
      accent: '#2f7d6a',
      accentSoft: '#5aa790',
      accentStrong: '#1f5b4c',
      luxury: '#c9b458',
    },
    dark: {
      accent: '#5aa790',
      accentSoft: '#7fc1ad',
      accentStrong: '#7fc1ad',
      luxury: '#c9b458',
    },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Coastal blues with mineral gold accents',
    light: {
      accent: '#2f6ea6',
      accentSoft: '#5d8fbe',
      accentStrong: '#1f4f7b',
      luxury: '#d4af37',
    },
    dark: {
      accent: '#5d8fbe',
      accentSoft: '#82aad0',
      accentStrong: '#82aad0',
      luxury: '#d4af37',
    },
  },
];

const THEME_PRESET_MAP = new Map(THEME_PRESETS.map((preset) => [preset.id, preset]));

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const hexToRgb = (value: string): { r: number; g: number; b: number } | null => {
  const normalized = value.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

const rgbToHsl = (r: number, g: number, b: number) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / delta + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      case bn:
        h = (rn - gn) / delta + 4;
        break;
      default:
        h = 0;
    }
    h *= 60;
  }

  return { h, s: s * 100, l: l * 100 };
};

const hslToRgb = (h: number, s: number, l: number) => {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const adjustLightness = (hex: string, delta: number) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const nextL = clamp(l + delta, 0, 100);
  const adjusted = hslToRgb(h, s, nextL);
  return rgbToHex(adjusted.r, adjusted.g, adjusted.b);
};

const buildCustomPalette = (hex: string): { light: ThemePalette; dark: ThemePalette } => {
  const base = hexToRgb(hex) ? hex : '#e63946';
  return {
    light: {
      accent: base,
      accentSoft: adjustLightness(base, 14),
      accentStrong: adjustLightness(base, -12),
      luxury: '#d4af37',
    },
    dark: {
      accent: adjustLightness(base, 18),
      accentSoft: adjustLightness(base, 28),
      accentStrong: adjustLightness(base, 24),
      luxury: '#d4af37',
    },
  };
};

export const resolveThemeId = (themePreset?: string | null, themeColor?: string | null): ThemeId => {
  if (themePreset === 'custom') return 'custom';
  if (themePreset && THEME_PRESET_MAP.has(themePreset as ThemePreset['id'])) {
    return themePreset as ThemePreset['id'];
  }
  if (themeColor) return 'custom';
  return DEFAULT_THEME_ID;
};

export const getThemeDefinition = (
  themePreset?: string | null,
  themeColor?: string | null
): { id: ThemeId; light: ThemePalette; dark: ThemePalette } => {
  const resolvedId = resolveThemeId(themePreset, themeColor);
  if (resolvedId === 'custom') {
    return { id: resolvedId, ...buildCustomPalette(themeColor || '#e63946') };
  }
  const preset = THEME_PRESET_MAP.get(resolvedId as ThemePreset['id']) || THEME_PRESET_MAP.get('atelier')!;
  return {
    id: preset.id,
    light: preset.light,
    dark: preset.dark,
  };
};

const toRgbString = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '230 57 70';
  return `${rgb.r} ${rgb.g} ${rgb.b}`;
};

export const themeToCssVars = (themePreset?: string | null, themeColor?: string | null) => {
  const theme = getThemeDefinition(themePreset, themeColor);
  return {
    '--ds-accent-rgb-light': toRgbString(theme.light.accent),
    '--ds-accent-soft-rgb-light': toRgbString(theme.light.accentSoft),
    '--ds-accent-strong-rgb-light': toRgbString(theme.light.accentStrong),
    '--ds-luxury-rgb-light': toRgbString(theme.light.luxury),
    '--ds-accent-rgb-dark': toRgbString(theme.dark.accent),
    '--ds-accent-soft-rgb-dark': toRgbString(theme.dark.accentSoft),
    '--ds-accent-strong-rgb-dark': toRgbString(theme.dark.accentStrong),
    '--ds-luxury-rgb-dark': toRgbString(theme.dark.luxury),
  } as const;
};
