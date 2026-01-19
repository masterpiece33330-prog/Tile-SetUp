/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Design Tokens
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Design System Foundation based on "Chimera" Strategy:
 * - Visual DNA: Industrial Dark Mode (Construction-grade visibility)
 * - Typography DNA: Toss/KakaoBank (Big, Bold, Unmistakable)
 * - Grid System: 8px base unit for consistent spacing
 * 
 * @ref Chapter 1-11 Technical Specification
 * @target Professional tile installers (gloved hands, outdoor/dusty environments)
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Core color system designed for:
 * - High contrast in direct sunlight
 * - Reduced eye strain during extended use
 * - Clear visual hierarchy on dusty screens
 */
export const colors = {
  // ─────────────────────────────────────────────────────────────────────────
  // Background Layers (Dark → Light hierarchy)
  // ─────────────────────────────────────────────────────────────────────────
  background: {
    primary: '#1C1C1E',      // Deep Asphalt - Main app background
    secondary: '#2C2C2E',    // Elevated surfaces (cards, modals)
    tertiary: '#3A3A3C',     // Hover states, input backgrounds
    inverse: '#F2F2F7',      // Light mode fallback (accessibility)
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Surface Colors (Interactive elements)
  // ─────────────────────────────────────────────────────────────────────────
  surface: {
    default: '#2C2C2E',      // Card backgrounds
    elevated: '#3A3A3C',     // Floating elements (tooltips, dropdowns)
    pressed: '#48484A',      // Active/pressed state
    disabled: '#1C1C1E',     // Disabled elements (50% opacity applied)
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Brand & Accent Colors (High saturation for outdoor visibility)
  // ─────────────────────────────────────────────────────────────────────────
  primary: {
    lime: '#D4FF00',         // Safety Neon Lime - Primary CTA
    limeHover: '#E5FF4D',    // Hover state (+20% brightness)
    limePressed: '#AACC00',  // Pressed state (-20% brightness)
    limeMuted: '#D4FF0033',  // 20% opacity for backgrounds
  },

  accent: {
    orange: '#FF5F00',       // Construction Orange - Secondary accent
    orangeHover: '#FF7F33',
    orangePressed: '#CC4C00',
    orangeMuted: '#FF5F0033',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Semantic Colors (Feedback states)
  // ─────────────────────────────────────────────────────────────────────────
  semantic: {
    success: '#30D158',      // Completion, valid input
    successMuted: '#30D15833',
    warning: '#FFD60A',      // Caution states
    warningMuted: '#FFD60A33',
    error: '#FF453A',        // Errors, invalid input, overlap detection
    errorMuted: '#FF453A33',
    info: '#64D2FF',         // Informational highlights
    infoMuted: '#64D2FF33',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Text Colors (WCAG AA compliant on dark backgrounds)
  // ─────────────────────────────────────────────────────────────────────────
  text: {
    primary: '#FFFFFF',      // Main text - 100% white
    secondary: '#EBEBF5',    // 85% opacity equivalent
    tertiary: '#EBEBF599',   // 60% opacity - placeholders, hints
    disabled: '#EBEBF54D',   // 30% opacity
    inverse: '#1C1C1E',      // Text on light backgrounds
    onPrimary: '#1C1C1E',    // Text on lime background
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Border & Divider Colors
  // ─────────────────────────────────────────────────────────────────────────
  border: {
    default: '#48484A',      // Standard borders
    subtle: '#38383A',       // Subtle separators
    focus: '#D4FF00',        // Focus rings (uses primary lime)
    error: '#FF453A',        // Error state borders
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Tile-Specific Colors (Grid visualization)
  // ─────────────────────────────────────────────────────────────────────────
  tile: {
    gridLine: '#48484A',     // Tile grid lines
    gridLineFocus: '#D4FF00', // Active grid line
    fullTile: '#5E5CE6',     // Complete tile indicator
    largePiece: '#BF5AF2',   // Large cut piece (>50% area)
    smallPiece: '#FF9F0A',   // Small cut piece (<50% area)
    blankSpace: '#3A3A3C',   // Excluded areas (windows, doors)
    overlap: '#FF453A80',    // Overlap warning (50% opacity red)
    gap: '#1C1C1E',          // Gap/grout color
  },
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: TYPOGRAPHY SCALE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Typography system designed for:
 * - Gloved hand operation (large touch targets)
 * - Quick readability at arm's length
 * - "Digital LED Screen" aesthetic for numeric inputs
 * 
 * Base unit: 1rem = 16px
 * Hero Input: Dominates 50% of screen height (Toss-style)
 */
export const typography = {
  // ─────────────────────────────────────────────────────────────────────────
  // Font Families
  // ─────────────────────────────────────────────────────────────────────────
  fontFamily: {
    // System fonts for maximum compatibility and performance
    sans: [
      'Pretendard',
      '-apple-system',
      'BlinkMacSystemFont',
      'system-ui',
      'Roboto',
      'sans-serif',
    ].join(', '),
    
    // Monospace for numeric displays (LED aesthetic)
    mono: [
      'SF Mono',
      'JetBrains Mono',
      'Fira Code',
      'Consolas',
      'monospace',
    ].join(', '),
    
    // Numeric display font (Digital LED style)
    display: [
      'DSEG7 Classic',
      'Digital-7',
      'SF Mono',
      'monospace',
    ].join(', '),
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Font Sizes (rem-based for accessibility)
  // ─────────────────────────────────────────────────────────────────────────
  fontSize: {
    xs: 12,      // Captions, timestamps
    sm: 14,      // Secondary text
    base: 16,    // Body text
    lg: 18,      // Emphasized body
    xl: 20,      // Section headers
    '2xl': 24,   // Card titles
    '3xl': 30,   // Screen titles
    '4xl': 36,   // Large headers / Keypad buttons
    '5xl': 48,   // Hero text
    '6xl': 60,   // Hero input minimum
    '7xl': 72,   // Hero input standard
    '8xl': 96,   // Hero input maximum
    '9xl': 128,  // Full-screen numeric display
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Font Weights
  // ─────────────────────────────────────────────────────────────────────────
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Line Heights
  // ─────────────────────────────────────────────────────────────────────────
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Letter Spacing
  // ─────────────────────────────────────────────────────────────────────────
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,  // Hero inputs for digit separation
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Pre-composed Typography Styles
  // ─────────────────────────────────────────────────────────────────────────
  preset: {
    heroInput: {
      fontFamily: 'mono',
      fontSize: 96,
      fontWeight: '800',
      lineHeight: 1,
      letterSpacing: 1.6,
    },
    heroInputUnit: {
      fontFamily: 'sans',
      fontSize: 30,
      fontWeight: '400',
      lineHeight: 1,
      letterSpacing: 0,
    },
    keypadButton: {
      fontFamily: 'mono',
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 1,
      letterSpacing: 0,
    },
    screenTitle: {
      fontFamily: 'sans',
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 1.25,
      letterSpacing: -0.4,
    },
    cardTitle: {
      fontFamily: 'sans',
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.375,
      letterSpacing: 0,
    },
    body: {
      fontFamily: 'sans',
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    caption: {
      fontFamily: 'sans',
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    measurement: {
      fontFamily: 'mono',
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 1,
      letterSpacing: 0.4,
    },
  },
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: SPACING & LAYOUT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 8px grid system for consistent spatial rhythm
 * All spacing values are multiples of 8px
 */
export const spacing = {
  // ─────────────────────────────────────────────────────────────────────────
  // Base Spacing Scale (pixels)
  // ─────────────────────────────────────────────────────────────────────────
  px: 1,
  0: 0,
  0.5: 2,      // Hairline spacing
  1: 4,        // Micro spacing
  2: 8,        // Base unit
  3: 12,
  4: 16,       // Standard spacing
  5: 20,
  6: 24,       // Card padding
  8: 32,       // Section spacing
  10: 40,
  12: 48,      // Large spacing
  16: 64,
  20: 80,
  24: 96,      // Hero spacing
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,

  // ─────────────────────────────────────────────────────────────────────────
  // Semantic Spacing (Component-specific)
  // ─────────────────────────────────────────────────────────────────────────
  semantic: {
    // Touch targets (gloved hands - minimum 72px)
    touchTargetMin: 72,
    touchTargetComfort: 80,
    touchTargetLarge: 96,    // Keypad buttons

    // Screen margins
    screenPadding: 16,
    screenPaddingLg: 24,

    // Card spacing
    cardPadding: 24,
    cardGap: 16,
    cardMargin: 8,

    // Input spacing
    inputPadding: 16,
    inputGap: 8,
    inputLabelGap: 8,

    // Grid visualization
    tileGap: 2,
    gridPadding: 8,
  },
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: BORDER RADIUS SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Border radius scale following 8px grid
 * Industrial aesthetic: Prefer subtle rounding over pill shapes
 */
export const borderRadius = {
  none: 0,
  sm: 4,       // Subtle rounding
  DEFAULT: 8,  // Standard components
  md: 12,      // Cards, inputs
  lg: 16,      // Large cards, modals
  xl: 24,      // Bottom sheets
  '2xl': 32,   // Full-screen modals
  full: 9999,  // Circular elements only
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: SHADOW SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Shadow presets for dark mode
 * Using colored glows instead of black shadows
 */
export const shadows = {
  none: 'none',
  
  // Elevation shadows (subtle on dark mode)
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  DEFAULT: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },

  // Glow effects (for focus states)
  glow: {
    lime: {
      shadowColor: '#D4FF00',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 0,
    },
    orange: {
      shadowColor: '#FF5F00',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 0,
    },
    error: {
      shadowColor: '#FF453A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 0,
    },
  },
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Z-INDEX SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Z-index scale for layering consistency
 */
export const zIndex = {
  hide: -1,
  base: 0,
  raised: 1,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
  toast: 70,
  max: 9999,
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: BREAKPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Responsive breakpoints
 */
export const breakpoints = {
  sm: 640,     // Large phones
  md: 768,     // Tablets (portrait)
  lg: 1024,    // Tablets (landscape)
  xl: 1280,    // Small desktops
  '2xl': 1536, // Large desktops
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: ANIMATION DURATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Duration presets for animations
 * Note: For spring animations, use physics-constants.ts
 */
export const duration = {
  instant: 0,
  fastest: 50,
  faster: 100,
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 400,
  slowest: 500,
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: COMPONENT-SPECIFIC TOKENS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pre-defined component styles
 */
export const componentTokens = {
  // Button variants
  button: {
    primary: {
      background: colors.primary.lime,
      backgroundPressed: colors.primary.limePressed,
      text: colors.text.onPrimary,
      height: 56,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
    },
    secondary: {
      background: colors.surface.elevated,
      backgroundPressed: colors.surface.pressed,
      text: colors.text.primary,
      height: 56,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
    },
    ghost: {
      background: 'transparent',
      backgroundPressed: colors.surface.pressed,
      text: colors.primary.lime,
      height: 48,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
    },
    danger: {
      background: colors.semantic.error,
      backgroundPressed: '#CC352E',
      text: colors.text.primary,
      height: 56,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
    },
  },

  // Input styles
  input: {
    default: {
      background: colors.surface.elevated,
      border: colors.border.default,
      borderFocus: colors.border.focus,
      text: colors.text.primary,
      placeholder: colors.text.tertiary,
      height: 56,
      borderRadius: borderRadius.md,
      padding: spacing[4],
      fontSize: typography.fontSize.lg,
    },
    hero: {
      background: 'transparent',
      text: colors.text.primary,
      fontSize: typography.fontSize['8xl'],
      fontWeight: typography.fontWeight.extrabold,
      fontFamily: typography.fontFamily.mono,
    },
  },

  // Keypad styles
  keypad: {
    button: {
      background: colors.surface.elevated,
      backgroundPressed: colors.surface.pressed,
      text: colors.text.primary,
      size: spacing.semantic.touchTargetLarge,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
    },
    actionButton: {
      background: colors.primary.lime,
      backgroundPressed: colors.primary.limePressed,
      text: colors.text.onPrimary,
    },
    deleteButton: {
      background: colors.surface.elevated,
      text: colors.semantic.error,
    },
  },

  // Card styles
  card: {
    default: {
      background: colors.surface.default,
      borderRadius: borderRadius.lg,
      padding: spacing[6],
      ...shadows.md,
    },
    elevated: {
      background: colors.surface.elevated,
      borderRadius: borderRadius.lg,
      padding: spacing[6],
      ...shadows.lg,
    },
  },

  // Toolbar styles
  toolbar: {
    background: colors.background.secondary,
    height: 64,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },

  // Bottom sheet styles
  bottomSheet: {
    background: colors.background.secondary,
    borderRadius: borderRadius.xl,
    handleColor: colors.border.default,
    handleWidth: 40,
    handleHeight: 4,
  },
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type ZIndex = typeof zIndex;
export type Breakpoints = typeof breakpoints;
export type Duration = typeof duration;
export type ComponentTokens = typeof componentTokens;