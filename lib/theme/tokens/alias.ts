import { baseTokens } from './base'

export type ThemeMode = 'light' | 'dark'

const { color, gradient, typography, spacing, radius, shadow, motion } = baseTokens

export const aliasTokens = {
  light: {
    color: {
      text: {
        primary: '225 21% 8%',
        secondary: '225 16% 32%',
        muted: '225 12% 48%',
        inverted: '0 0% 100%',
      },
      brand: {
        primary: '237 100% 65%',
        primaryStrong: '238 63% 50%',
        accent: '198 77% 56%',
      },
      surface: {
        canvas: '216 29% 97%',
        panel: '0 0% 100% / 0.72',
        glass: '0 0% 100% / 0.56',
        outline: '225 20% 92%',
      },
      interaction: {
        background: '0 0% 100% / 0.88',
        muted: '237 100% 65% / 0.08',
        border: '225 18% 82%',
        borderStrong: '238 63% 50% / 0.35',
        ring: '237 100% 65%',
        focus: '235 100% 94%',
      },
      contrast: {
        surface: '216 24% 99%',
        outline: '238 63% 48%',
        text: '225 24% 6%',
      },
      state: {
        success: color.emerald[500],
        warning: color.saffron[500],
        danger: color.crimson[500],
      },
      overlay: {
        backdrop: '225 40% 10% / 0.32',
      },
    },
    gradient: {
      glowPrimary: gradient['glow-iris'],
      glowSecondary: gradient['glow-cerulean'],
      veilDeep: gradient['veil-deep'],
    },
    typography: {
      display: {
        fontFamily: typography['font-family'].display,
        fontSize: typography['font-size']['display-1'],
        lineHeight: typography['line-height'].tight,
        letterSpacing: typography['letter-spacing'].tighter,
        fontWeight: typography['font-weight'].light,
      },
      headline: {
        fontFamily: typography['font-family'].sans,
        fontSize: typography['font-size'].headline,
        lineHeight: typography['line-height'].snug,
        letterSpacing: typography['letter-spacing'].normal,
        fontWeight: typography['font-weight'].semibold,
      },
      body: {
        fontFamily: typography['font-family'].sans,
        fontSize: typography['font-size'].body,
        lineHeight: typography['line-height'].normal,
        letterSpacing: typography['letter-spacing'].normal,
        fontWeight: typography['font-weight'].regular,
      },
      caption: {
        fontFamily: typography['font-family'].sans,
        fontSize: typography['font-size'].caption,
        lineHeight: typography['line-height'].normal,
        letterSpacing: typography['letter-spacing'].wide,
        fontWeight: typography['font-weight'].medium,
      },
    },
    spacing: {
      sectionX: spacing[10],
      sectionY: spacing[12],
      gridGap: spacing[6],
      controlPaddingX: spacing[4],
      controlPaddingY: spacing[2],
    },
    radius: {
      surface: radius.lg,
      control: radius.md,
      pill: radius.full,
    },
    shadow: {
      surface: shadow.soft,
      floating: shadow.ambient,
      subtle: shadow.subtle,
      focus: shadow.focus,
    },
    motion: {
      button: {
        duration: motion.duration.sm,
        curve: motion.curve['ease-out'],
      },
      reveal: {
        duration: motion.duration.md,
        curve: motion.curve['ease-soft'],
      },
      overlay: {
        duration: motion.duration.lg,
        curve: motion.curve['ease-soft'],
      },
      commandPalette: {
        duration: motion.duration.md,
        curve: motion.curve['ease-out'],
      },
    },
    layout: {
      container: {
        xs: '100%',
        sm: '440px',
        md: '704px',
        lg: '960px',
        xl: '1200px',
      },
      gutter: {
        xs: '16px',
        sm: '20px',
        md: '24px',
        lg: '32px',
        xl: '40px',
      },
      sidebar: {
        base: '240px',
        lg: '280px',
      },
      breakpoint: {
        sm: '480px',
        md: '768px',
        lg: '1024px',
        xl: '1440px',
      },
      content: {
        heroMaxWidth: '1200px',
        railGap: '24px',
      },
    },
  },
  dark: {
    color: {
      text: {
        primary: '216 29% 97%',
        secondary: '216 20% 84%',
        muted: '216 15% 68%',
        inverted: '225 21% 8%',
      },
      brand: {
        primary: '238 63% 68%',
        primaryStrong: '237 100% 65%',
        accent: '198 77% 56%',
      },
      surface: {
        canvas: '225 21% 7%',
        panel: '228 24% 12% / 0.88',
        glass: '225 30% 10% / 0.68',
        outline: '225 18% 30% / 0.8',
      },
      interaction: {
        background: '228 24% 12% / 0.72',
        muted: '238 63% 68% / 0.12',
        border: '225 22% 28% / 0.9',
        borderStrong: '238 63% 68% / 0.4',
        ring: '238 63% 68%',
        focus: '238 63% 82% / 0.95',
      },
      contrast: {
        surface: '224 28% 12%',
        outline: '238 63% 62%',
        text: '216 32% 98%',
      },
      state: {
        success: color.emerald[500],
        warning: color.saffron[500],
        danger: color.crimson[500],
      },
      overlay: {
        backdrop: '225 40% 6% / 0.45',
      },
    },
    gradient: {
      glowPrimary: gradient['glow-iris'],
      glowSecondary: gradient['glow-cerulean'],
      veilDeep: gradient['veil-deep'],
    },
    typography: {
      display: {
        fontFamily: typography['font-family'].display,
        fontSize: typography['font-size']['display-1'],
        lineHeight: typography['line-height'].tight,
        letterSpacing: typography['letter-spacing'].tighter,
        fontWeight: typography['font-weight'].light,
      },
      headline: {
        fontFamily: typography['font-family'].sans,
        fontSize: typography['font-size'].headline,
        lineHeight: typography['line-height'].snug,
        letterSpacing: typography['letter-spacing'].normal,
        fontWeight: typography['font-weight'].semibold,
      },
      body: {
        fontFamily: typography['font-family'].sans,
        fontSize: typography['font-size'].body,
        lineHeight: typography['line-height'].normal,
        letterSpacing: typography['letter-spacing'].normal,
        fontWeight: typography['font-weight'].regular,
      },
      caption: {
        fontFamily: typography['font-family'].sans,
        fontSize: typography['font-size'].caption,
        lineHeight: typography['line-height'].normal,
        letterSpacing: typography['letter-spacing'].wide,
        fontWeight: typography['font-weight'].medium,
      },
    },
    spacing: {
      sectionX: spacing[9],
      sectionY: spacing[11],
      gridGap: spacing[5],
      controlPaddingX: spacing[4],
      controlPaddingY: spacing[2],
    },
    radius: {
      surface: radius.lg,
      control: radius.md,
      pill: radius.full,
    },
    shadow: {
      surface: shadow.ambient,
      floating: `${shadow.ambient}, 0 0 30px rgba(12, 10, 25, 0.55)`,
      subtle: '0 2px 8px rgba(5, 6, 12, 0.45)',
      focus: '0 0 0 3px rgba(140, 144, 255, 0.45)',
    },
    motion: {
      button: {
        duration: motion.duration.sm,
        curve: motion.curve['ease-out'],
      },
      reveal: {
        duration: motion.duration.md,
        curve: motion.curve['ease-soft'],
      },
      overlay: {
        duration: motion.duration.lg,
        curve: motion.curve['ease-soft'],
      },
      commandPalette: {
        duration: motion.duration.md,
        curve: motion.curve['ease-out'],
      },
    },
    layout: {
      container: {
        xs: '100%',
        sm: '440px',
        md: '704px',
        lg: '960px',
        xl: '1200px',
      },
      gutter: {
        xs: '16px',
        sm: '20px',
        md: '24px',
        lg: '32px',
        xl: '40px',
      },
      sidebar: {
        base: '240px',
        lg: '280px',
      },
      breakpoint: {
        sm: '480px',
        md: '768px',
        lg: '1024px',
        xl: '1440px',
      },
      content: {
        heroMaxWidth: '1200px',
        railGap: '24px',
      },
    },
  },
} as const

export type AliasTokens = typeof aliasTokens[ThemeMode]
