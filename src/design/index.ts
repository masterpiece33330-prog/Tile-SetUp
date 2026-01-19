/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Design System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Unified export for all design system modules
 * 
 * Usage:
 * ```typescript
 * import { colors, typography, spacing } from '@/design';
 * import { SPRING_CONFIGS, GESTURE_THRESHOLDS } from '@/design';
 * import { triggerSnapFeedback, triggerErrorFeedback } from '@/design';
 * ```
 */

// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Color system
  colors,
  
  // Typography system
  typography,
  
  // Spacing & layout
  spacing,
  borderRadius,
  
  // Elevation
  shadows,
  zIndex,
  
  // Responsive
  breakpoints,
  
  // Animation timing
  duration,
  
  // Pre-built component tokens
  componentTokens,
  
  // Types
  type Colors,
  type Typography,
  type Spacing,
  type BorderRadius,
  type Shadows,
  type ZIndex,
  type Breakpoints,
  type Duration,
  type ComponentTokens,
} from './tokens';


// ─────────────────────────────────────────────────────────────────────────────
// Physics & Animation Constants
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Spring configurations
  SPRING_CONFIGS,
  
  // Decay configurations
  DECAY_CONFIGS,
  
  // Rotation physics
  ROTATION_CONFIGS,
  
  // Gesture recognition
  GESTURE_THRESHOLDS,
  
  // View/camera limits
  VIEW_LIMITS,
  
  // Animation timing
  TIMING,
  
  // Utility functions
  calculateRubberBand,
  applyFriction,
  calculateSnapPoint,
  calculateAngularVelocity,
  toFramerSpring,
  toReactSpring,
  toReanimatedSpring,
  
  // Pre-built presets
  reactSpringPresets,
  framerPresets,
  reanimatedPresets,
  
  // Types
  type SpringConfig,
  type DecayConfig,
  type InertiaConfig,
  type SpringConfigKey,
  type DecayConfigKey,
  type RotationConfigKey,
} from './physics-constants';


// ─────────────────────────────────────────────────────────────────────────────
// Haptic Feedback
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Enums
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  
  // Global controls
  setHapticsEnabled,
  isHapticsEnabled,
  setHapticContext,
  getHapticContext,
  checkHapticSupport,
  
  // Core haptic functions
  triggerSnapFeedback,
  triggerSnapFeedbackDouble,
  triggerSliderFeedback,
  triggerErrorFeedback,
  triggerSuccessFeedback,
  triggerWarningFeedback,
  
  // Specialized haptics
  triggerTilePlacementFeedback,
  triggerRotationDetentFeedback,
  triggerButtonPressFeedback,
  triggerToggleFeedback,
  triggerLongPressFeedback,
  triggerDeleteFeedback,
  triggerBoundaryFeedback,
  triggerUndoRedoFeedback,
  
  // Pattern system
  HAPTIC_PATTERNS,
  playHapticPattern,
  
  // Utilities
  createSliderHapticController,
  createDebouncedHaptic,
  createThrottledHaptic,
  
  // Types
  type HapticCategory,
  type HapticIntensity,
  type HapticEvent,
  type HapticContext,
} from './haptic-patterns';


// ─────────────────────────────────────────────────────────────────────────────
// Convenience Re-exports
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Commonly used design value combinations
 */
export const Design = {
  // Quick access to component-specific values
  button: {
    minHeight: 56,
    minTouchTarget: 72,
    borderRadius: 12,
  },
  input: {
    height: 56,
    borderRadius: 12,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
  },
  keypad: {
    buttonSize: 96,
    gap: 8,
  },
  screen: {
    padding: 16,
    paddingLg: 24,
  },
} as const;
