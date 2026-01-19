/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Physics Constants
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Motion Physics DNA based on Instagram/TikTok fluid interactions:
 * - Spring-based animations (NO linear easing)
 * - Rotational inertia with friction decay
 * - Rubber-band elasticity for boundary limits
 * 
 * Compatible with: react-spring, framer-motion, react-native-reanimated
 * 
 * @ref Chapter 4 - 2D/3D View System
 * @ref Chapter 7 - Navigation & Tile Editing
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Spring configuration interface
 * Compatible with react-spring's SpringConfig and framer-motion's Transition
 */
export interface SpringConfig {
  /** Stiffness of the spring (higher = faster response) */
  tension: number;
  /** Resistance to motion (higher = slower settling) */
  friction: number;
  /** Mass of the object (affects momentum) */
  mass?: number;
  /** Whether to clamp values to prevent overshoot */
  clamp?: boolean;
  /** Precision threshold for completion */
  precision?: number;
}

/**
 * Decay configuration for momentum-based motion
 * Used for flick gestures and momentum-based scrolling
 */
export interface DecayConfig {
  /** Initial velocity from gesture */
  velocity: number;
  /** Deceleration rate (0-1, lower = faster stop) */
  deceleration: number;
  /** Minimum velocity before stopping */
  restDelta?: number;
}

/**
 * Inertia configuration for rotational physics
 * Applied to tile rotation with "weight" feeling
 */
export interface InertiaConfig {
  /** Moment of inertia (higher = heavier feel) */
  momentOfInertia: number;
  /** Friction coefficient (0-1) */
  frictionCoefficient: number;
  /** Snap angles in degrees (e.g., [0, 90, 180, 270]) */
  snapAngles?: number[];
  /** Snap threshold in degrees */
  snapThreshold?: number;
}


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: CORE SPRING CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pre-configured spring behaviors for different interaction types
 * 
 * Physics Reference:
 * - tension: Spring stiffness (k). Higher = stiffer, faster oscillation
 * - friction: Damping coefficient (c). Higher = less bouncy, faster settling
 * - mass: Object mass (m). Higher = slower response, more momentum
 * 
 * Critical damping occurs when c² = 4mk
 * Under-damped (bouncy): c² < 4mk
 * Over-damped (sluggish): c² > 4mk
 */
export const SPRING_CONFIGS = {
  // ─────────────────────────────────────────────────────────────────────────
  // Snap/Alignment Springs (Quick, decisive)
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Standard snap - grid alignment, tile placement */
  SNAP: {
    tension: 300,
    friction: 26,
    mass: 1,
    clamp: false,
    precision: 0.01,
  } as SpringConfig,

  /** Tight snap - integer value snapping, rotation detents */
  SNAP_TIGHT: {
    tension: 400,
    friction: 30,
    mass: 0.8,
    clamp: false,
    precision: 0.001,
  } as SpringConfig,

  // ─────────────────────────────────────────────────────────────────────────
  // Drag/Pan Springs (Responsive, slightly bouncy)
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Standard drag - tile movement, pan gestures */
  DRAG: {
    tension: 200,
    friction: 20,
    mass: 1,
    clamp: false,
    precision: 0.1,
  } as SpringConfig,

  /** Heavy drag - large objects, multi-select groups */
  DRAG_HEAVY: {
    tension: 150,
    friction: 22,
    mass: 1.5,
    clamp: false,
    precision: 0.1,
  } as SpringConfig,

  // ─────────────────────────────────────────────────────────────────────────
  // Boundary Springs (Elastic resistance)
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Rubber-band - edge bounce, over-scroll */
  RUBBER_BAND: {
    tension: 400,
    friction: 40,
    mass: 1,
    clamp: true,
    precision: 0.01,
  } as SpringConfig,

  /** Inertia decay - momentum after flick */
  INERTIA_DECAY: {
    tension: 50,
    friction: 10,
    mass: 1,
    clamp: false,
    precision: 0.5,
  } as SpringConfig,

  // ─────────────────────────────────────────────────────────────────────────
  // UI Element Springs
  // ─────────────────────────────────────────────────────────────────────────
  
  /** Modal entry - bottom sheet, dialogs */
  MODAL_ENTER: {
    tension: 280,
    friction: 24,
    mass: 1,
    clamp: false,
    precision: 0.01,
  } as SpringConfig,

  /** Modal exit - dismissal animation */
  MODAL_EXIT: {
    tension: 350,
    friction: 30,
    mass: 1,
    clamp: true,
    precision: 0.01,
  } as SpringConfig,

  /** Button press - tactile feedback */
  BUTTON_PRESS: {
    tension: 600,
    friction: 20,
    mass: 0.5,
    clamp: false,
    precision: 0.001,
  } as SpringConfig,

  /** Tooltip appearance */
  TOOLTIP: {
    tension: 300,
    friction: 22,
    mass: 0.8,
    clamp: false,
    precision: 0.01,
  } as SpringConfig,

  /** Page/screen transition */
  PAGE_TRANSITION: {
    tension: 220,
    friction: 28,
    mass: 1,
    clamp: false,
    precision: 0.01,
  } as SpringConfig,

  /** Micro-interaction - icons, indicators */
  MICRO: {
    tension: 500,
    friction: 25,
    mass: 0.5,
    clamp: false,
    precision: 0.001,
  } as SpringConfig,
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: DECAY CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Decay configurations for momentum-based motion
 * Used with framer-motion's inertia transition type
 */
export const DECAY_CONFIGS = {
  /** Standard decay for most interactions */
  DEFAULT: {
    velocity: 0,
    deceleration: 0.995,
    restDelta: 0.5,
  } as DecayConfig,

  /** Fast decay for precise controls */
  FAST: {
    velocity: 0,
    deceleration: 0.98,
    restDelta: 0.1,
  } as DecayConfig,

  /** Slow decay for long-distance scrolling */
  SLOW: {
    velocity: 0,
    deceleration: 0.998,
    restDelta: 1,
  } as DecayConfig,

  /** Rotation-specific decay */
  ROTATION: {
    velocity: 0,
    deceleration: 0.992,
    restDelta: 0.1,
  } as DecayConfig,
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: ROTATIONAL INERTIA CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rotational inertia for tile rotation with "weight" feeling
 * 
 * Physics: Angular acceleration = Torque / Moment of Inertia
 * Higher momentOfInertia = "heavier" rotation feel
 */
export const ROTATION_CONFIGS = {
  /** Standard tile rotation (feels like moving a ceramic tile) */
  TILE: {
    momentOfInertia: 2.5,
    frictionCoefficient: 0.85,
    snapAngles: [0, 90, 180, 270],
    snapThreshold: 15,
  } as InertiaConfig,

  /** Camera orbit in 3D view */
  CAMERA_ORBIT: {
    momentOfInertia: 3.0,
    frictionCoefficient: 0.9,
    snapAngles: undefined,
    snapThreshold: 0,
  } as InertiaConfig,

  /** Pattern rotation preview */
  PATTERN_PREVIEW: {
    momentOfInertia: 1.5,
    frictionCoefficient: 0.8,
    snapAngles: [0, 45, 90, 135, 180, 225, 270, 315],
    snapThreshold: 10,
  } as InertiaConfig,
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: GESTURE THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gesture recognition thresholds
 * Calibrated for construction site conditions (gloves, dusty screens)
 */
export const GESTURE_THRESHOLDS = {
  // ─────────────────────────────────────────────────────────────────────────
  // Tap Gestures
  // ─────────────────────────────────────────────────────────────────────────
  tap: {
    /** Maximum movement for tap recognition (pixels) */
    maxDistance: 15,
    /** Maximum duration for tap (milliseconds) */
    maxDuration: 300,
    /** Double-tap window (milliseconds) */
    doubleTapWindow: 300,
    /** Long press threshold (milliseconds) */
    longPressDelay: 500,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Pan/Drag Gestures
  // ─────────────────────────────────────────────────────────────────────────
  pan: {
    /** Minimum movement to start pan (pixels) */
    minDistance: 10,
    /** Minimum velocity for flick recognition (px/ms) */
    flickVelocity: 0.5,
    /** Maximum velocity for controlled drag (px/ms) */
    maxVelocity: 3.0,
    /** Direction lock angle (degrees) - within this locks to axis */
    directionLockAngle: 20,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Pinch/Zoom Gestures
  // ─────────────────────────────────────────────────────────────────────────
  pinch: {
    /** Minimum scale change to recognize pinch */
    minScale: 0.1,
    /** Minimum finger distance (pixels) */
    minDistance: 50,
    /** Maximum zoom level */
    maxZoom: 5.0,
    /** Minimum zoom level */
    minZoom: 0.25,
    /** Zoom snap points */
    snapZoomLevels: [0.25, 0.5, 1.0, 2.0, 4.0],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Rotation Gestures
  // ─────────────────────────────────────────────────────────────────────────
  rotate: {
    /** Minimum rotation to start (degrees) */
    minAngle: 5,
    /** Snap angle increment (degrees) */
    snapAngle: 90,
    /** Snap threshold (degrees from snap point) */
    snapThreshold: 15,
    /** Free rotation enabled below this angle change rate */
    freeRotationThreshold: 2,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Swipe Gestures
  // ─────────────────────────────────────────────────────────────────────────
  swipe: {
    /** Minimum velocity for swipe (px/ms) */
    minVelocity: 0.3,
    /** Minimum distance for swipe (pixels) */
    minDistance: 50,
    /** Maximum vertical deviation for horizontal swipe */
    maxCrossAxisRatio: 0.3,
  },
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: ZOOM & PAN LIMITS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Camera/viewport limits for 2D and 3D views
 */
export const VIEW_LIMITS = {
  /** 2D Grid View limits */
  grid2D: {
    minZoom: 0.1,
    maxZoom: 10.0,
    defaultZoom: 1.0,
    zoomStep: 0.25,
    panBoundaryPadding: 100,  // Extra pan space beyond content
  },

  /** 3D Scene View limits */
  scene3D: {
    minDistance: 500,      // Minimum camera distance (mm)
    maxDistance: 20000,    // Maximum camera distance (mm)
    defaultDistance: 5000,
    minPolarAngle: 0.1,    // Radians from vertical (prevent flip)
    maxPolarAngle: Math.PI / 2 - 0.1,  // Near-horizontal limit
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
    orbitSpeed: 0.5,       // Orbit sensitivity multiplier
    panSpeed: 1.0,         // Pan sensitivity multiplier
    zoomSpeed: 1.2,        // Zoom sensitivity multiplier
  },
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: ANIMATION TIMING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Non-spring animation timings (for CSS/simple transitions)
 */
export const TIMING = {
  /** Instant feedback (no perceptible delay) */
  instant: 0,
  
  /** Micro-interactions (button press, icon toggle) */
  micro: 100,
  
  /** Fast transitions (dropdown, tooltip) */
  fast: 150,
  
  /** Standard transitions (most UI changes) */
  normal: 200,
  
  /** Slow transitions (complex state changes) */
  slow: 300,
  
  /** Page transitions */
  page: 400,
  
  /** Modal/overlay transitions */
  modal: 350,
  
  /** Stagger delay for sequential animations */
  staggerDelay: 50,
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate rubber-band resistance for over-scroll
 * 
 * @param overscroll - Amount beyond boundary (pixels)
 * @param maxOverscroll - Maximum visual overscroll (pixels)
 * @param coefficient - Resistance strength (0-1, lower = more resistance)
 */
export function calculateRubberBand(
  overscroll: number,
  maxOverscroll: number = 100,
  coefficient: number = 0.55
): number {
  const absOverscroll = Math.abs(overscroll);
  const resistance = 1 - 1 / ((absOverscroll * coefficient / maxOverscroll) + 1);
  return Math.sign(overscroll) * maxOverscroll * resistance;
}

/**
 * Apply friction to velocity for decay animation
 * 
 * @param velocity - Current velocity
 * @param friction - Friction coefficient (0-1)
 * @param deltaTime - Time since last frame (ms)
 */
export function applyFriction(
  velocity: number,
  friction: number,
  deltaTime: number
): number {
  const frictionFactor = Math.pow(friction, deltaTime / 16.67);  // Normalize to 60fps
  return velocity * frictionFactor;
}

/**
 * Calculate snap point for a given value
 * 
 * @param value - Current value
 * @param snapPoints - Array of snap values
 * @param threshold - Distance within which to snap
 */
export function calculateSnapPoint(
  value: number,
  snapPoints: number[],
  threshold: number
): number | null {
  for (const snap of snapPoints) {
    const distance = Math.abs(value - snap);
    if (distance <= threshold) {
      return snap;
    }
  }
  return null;
}

/**
 * Calculate angular velocity from gesture
 * 
 * @param startAngle - Starting angle (degrees)
 * @param endAngle - Ending angle (degrees)
 * @param duration - Gesture duration (ms)
 */
export function calculateAngularVelocity(
  startAngle: number,
  endAngle: number,
  duration: number
): number {
  // Normalize angle difference to -180 to 180
  let delta = endAngle - startAngle;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  
  return delta / Math.max(duration, 1);  // degrees per ms
}

/**
 * Convert spring config to framer-motion format
 */
export function toFramerSpring(config: SpringConfig): {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass: number;
} {
  return {
    type: 'spring',
    stiffness: config.tension,
    damping: config.friction,
    mass: config.mass ?? 1,
  };
}

/**
 * Convert spring config to react-spring format
 */
export function toReactSpring(config: SpringConfig): {
  tension: number;
  friction: number;
  mass?: number;
  clamp?: boolean;
  precision?: number;
} {
  return {
    tension: config.tension,
    friction: config.friction,
    mass: config.mass,
    clamp: config.clamp,
    precision: config.precision,
  };
}

/**
 * Convert spring config to react-native-reanimated format
 */
export function toReanimatedSpring(config: SpringConfig): {
  damping: number;
  stiffness: number;
  mass: number;
  overshootClamping: boolean;
  restDisplacementThreshold: number;
  restSpeedThreshold: number;
} {
  return {
    damping: config.friction,
    stiffness: config.tension,
    mass: config.mass ?? 1,
    overshootClamping: config.clamp ?? false,
    restDisplacementThreshold: config.precision ?? 0.01,
    restSpeedThreshold: config.precision ?? 0.01,
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: PRESET EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ready-to-use react-spring configurations
 */
export const reactSpringPresets = {
  snap: toReactSpring(SPRING_CONFIGS.SNAP),
  snapTight: toReactSpring(SPRING_CONFIGS.SNAP_TIGHT),
  drag: toReactSpring(SPRING_CONFIGS.DRAG),
  dragHeavy: toReactSpring(SPRING_CONFIGS.DRAG_HEAVY),
  rubberBand: toReactSpring(SPRING_CONFIGS.RUBBER_BAND),
  inertia: toReactSpring(SPRING_CONFIGS.INERTIA_DECAY),
  modalEnter: toReactSpring(SPRING_CONFIGS.MODAL_ENTER),
  modalExit: toReactSpring(SPRING_CONFIGS.MODAL_EXIT),
  buttonPress: toReactSpring(SPRING_CONFIGS.BUTTON_PRESS),
  pageTransition: toReactSpring(SPRING_CONFIGS.PAGE_TRANSITION),
  micro: toReactSpring(SPRING_CONFIGS.MICRO),
} as const;

/**
 * Ready-to-use framer-motion configurations
 */
export const framerPresets = {
  snap: toFramerSpring(SPRING_CONFIGS.SNAP),
  snapTight: toFramerSpring(SPRING_CONFIGS.SNAP_TIGHT),
  drag: toFramerSpring(SPRING_CONFIGS.DRAG),
  dragHeavy: toFramerSpring(SPRING_CONFIGS.DRAG_HEAVY),
  rubberBand: toFramerSpring(SPRING_CONFIGS.RUBBER_BAND),
  inertia: toFramerSpring(SPRING_CONFIGS.INERTIA_DECAY),
  modalEnter: toFramerSpring(SPRING_CONFIGS.MODAL_ENTER),
  modalExit: toFramerSpring(SPRING_CONFIGS.MODAL_EXIT),
  buttonPress: toFramerSpring(SPRING_CONFIGS.BUTTON_PRESS),
  pageTransition: toFramerSpring(SPRING_CONFIGS.PAGE_TRANSITION),
  micro: toFramerSpring(SPRING_CONFIGS.MICRO),
} as const;

/**
 * Ready-to-use react-native-reanimated configurations
 */
export const reanimatedPresets = {
  snap: toReanimatedSpring(SPRING_CONFIGS.SNAP),
  snapTight: toReanimatedSpring(SPRING_CONFIGS.SNAP_TIGHT),
  drag: toReanimatedSpring(SPRING_CONFIGS.DRAG),
  dragHeavy: toReanimatedSpring(SPRING_CONFIGS.DRAG_HEAVY),
  rubberBand: toReanimatedSpring(SPRING_CONFIGS.RUBBER_BAND),
  inertia: toReanimatedSpring(SPRING_CONFIGS.INERTIA_DECAY),
  modalEnter: toReanimatedSpring(SPRING_CONFIGS.MODAL_ENTER),
  modalExit: toReanimatedSpring(SPRING_CONFIGS.MODAL_EXIT),
  buttonPress: toReanimatedSpring(SPRING_CONFIGS.BUTTON_PRESS),
  pageTransition: toReanimatedSpring(SPRING_CONFIGS.PAGE_TRANSITION),
  micro: toReanimatedSpring(SPRING_CONFIGS.MICRO),
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type SpringConfigKey = keyof typeof SPRING_CONFIGS;
export type DecayConfigKey = keyof typeof DECAY_CONFIGS;
export type RotationConfigKey = keyof typeof ROTATION_CONFIGS;
