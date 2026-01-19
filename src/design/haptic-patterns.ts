/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Haptic Patterns
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Haptic Symphony DNA based on Apple Native/iOS feedback philosophy:
 * - Physical feedback for digital actions
 * - Context-appropriate intensity levels
 * - Consistent patterns across the app
 * 
 * Built on expo-haptics for cross-platform compatibility
 * 
 * @ref Chapter 1 - Quantity Input (slider haptics)
 * @ref Chapter 4 - 3D View (rotation haptics)
 * @ref Chapter 5 - Editing Tools (snap haptics)
 * @ref Chapter 7 - Tile Editing (error haptics for overlap)
 */

// Note: In actual implementation, import from expo-haptics
// import * as Haptics from 'expo-haptics';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Haptic feedback styles matching expo-haptics
 */
export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
  Rigid = 'rigid',
  Soft = 'soft',
}

export enum NotificationFeedbackType {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

/**
 * Categories of haptic feedback in the app
 */
export type HapticCategory =
  | 'snap'           // Grid alignment, tile placement
  | 'selection'      // UI selection, slider movement
  | 'notification'   // Success, warning, error states
  | 'impact'         // Physical interactions (drop, collision)
  | 'pattern';       // Custom sequences

/**
 * Intensity levels for haptic feedback
 */
export type HapticIntensity = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';

/**
 * Haptic event context for logging/analytics
 */
export interface HapticEvent {
  category: HapticCategory;
  action: string;
  timestamp: number;
}

/**
 * Haptic context for app-wide state
 */
export interface HapticContext {
  intensityMultiplier: number;
  category: HapticCategory | null;
}


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: HAPTIC AVAILABILITY & CONTROL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Global flag to disable haptics (for user preference or unsupported devices)
 */
let hapticsEnabled = true;

/**
 * Global haptic context
 */
let hapticContext: HapticContext = {
  intensityMultiplier: 1.0,
  category: null,
};

/**
 * Enable or disable haptic feedback globally
 */
export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

/**
 * Check if haptics are currently enabled
 */
export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

/**
 * Set global haptic context
 */
export function setHapticContext(context: Partial<HapticContext>): void {
  hapticContext = { ...hapticContext, ...context };
}

/**
 * Get current haptic context
 */
export function getHapticContext(): HapticContext {
  return { ...hapticContext };
}

/**
 * Check if the device supports haptic feedback
 * Note: expo-haptics handles this internally, but we expose it for UI purposes
 */
export async function checkHapticSupport(): Promise<boolean> {
  // In actual implementation, try triggering a light haptic
  // and catch any errors for unsupported devices
  try {
    // await Haptics.impactAsync(ImpactFeedbackStyle.Light);
    return true;
  } catch {
    return false;
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: CORE HAPTIC FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Delay helper for haptic sequences
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  SNAP FEEDBACK                                                          │
 * │  "Lego block clicking into place"                                       │
 * │                                                                         │
 * │  Use Cases:                                                             │
 * │  - Tile snaps to grid position                                          │
 * │  - Pattern aligns correctly                                             │
 * │  - Start line locks to edge                                             │
 * │  - Dimension rounds to whole number                                     │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export async function triggerSnapFeedback(
  intensity: 'light' | 'medium' | 'heavy' = 'heavy'
): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    const _style = {
      light: ImpactFeedbackStyle.Light,
      medium: ImpactFeedbackStyle.Medium,
      heavy: ImpactFeedbackStyle.Heavy,
    }[intensity];

    // In actual implementation:
    // await Haptics.impactAsync(style);
    console.log(`[Haptics] Snap feedback: ${intensity}`);
  } catch (error) {
    console.warn('[Haptics] Snap feedback failed:', error);
  }
}

/**
 * Enhanced snap with double-tap feel
 * Used for major alignment events (e.g., pattern fully applied)
 */
export async function triggerSnapFeedbackDouble(): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    // await Haptics.impactAsync(ImpactFeedbackStyle.Heavy);
    await delay(50);
    // await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
    console.log('[Haptics] Double snap feedback');
  } catch (error) {
    console.warn('[Haptics] Double snap feedback failed:', error);
  }
}


/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  SLIDER FEEDBACK                                                        │
 * │  "Safe dial turning with notches"                                       │
 * │                                                                         │
 * │  Use Cases:                                                             │
 * │  - Adjusting tile dimensions (W, H)                                     │
 * │  - Changing gap size                                                    │
 * │  - Scrubbing through pattern options                                    │
 * │  - 3D camera rotation                                                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export async function triggerSliderFeedback(): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    // Selection feedback gives rapid, light taps
    // await Haptics.selectionAsync();
    console.log('[Haptics] Slider feedback');
  } catch (error) {
    console.warn('[Haptics] Slider feedback failed:', error);
  }
}

/**
 * Continuous slider feedback controller for smooth dragging
 * Call update() repeatedly at throttled intervals (e.g., every 50ms)
 * 
 * @param stepSize - Value change per haptic tick
 */
export function createSliderHapticController(stepSize: number = 10) {
  let lastHapticValue = 0;

  return {
    /**
     * Update with new value, triggers haptic if threshold crossed
     */
    update: async (currentValue: number): Promise<boolean> => {
      const crossedStep = Math.floor(currentValue / stepSize) !== 
                          Math.floor(lastHapticValue / stepSize);
      
      if (crossedStep) {
        lastHapticValue = currentValue;
        await triggerSliderFeedback();
        return true;
      }
      return false;
    },

    /**
     * Reset the controller (call when slider interaction ends)
     */
    reset: () => {
      lastHapticValue = 0;
    },
  };
}


/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ERROR FEEDBACK                                                         │
 * │  "Double thud warning" (U-Uung)                                         │
 * │                                                                         │
 * │  Use Cases:                                                             │
 * │  - Tile overlap detected                                                │
 * │  - Invalid input value                                                  │
 * │  - Action not permitted                                                 │
 * │  - Boundary collision                                                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export async function triggerErrorFeedback(): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    // await Haptics.notificationAsync(NotificationFeedbackType.Error);
    console.log('[Haptics] Error feedback');
  } catch (error) {
    console.warn('[Haptics] Error feedback failed:', error);
  }
}


/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  SUCCESS FEEDBACK                                                       │
 * │  "Accomplishment pulse"                                                 │
 * │                                                                         │
 * │  Use Cases:                                                             │
 * │  - Calculation complete                                                 │
 * │  - File saved successfully                                              │
 * │  - Pattern applied                                                      │
 * │  - Export finished                                                      │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export async function triggerSuccessFeedback(): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    // await Haptics.notificationAsync(NotificationFeedbackType.Success);
    console.log('[Haptics] Success feedback');
  } catch (error) {
    console.warn('[Haptics] Success feedback failed:', error);
  }
}


/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  WARNING FEEDBACK                                                       │
 * │  "Cautionary attention getter"                                          │
 * │                                                                         │
 * │  Use Cases:                                                             │
 * │  - Approaching boundary limits                                          │
 * │  - Unsaved changes warning                                              │
 * │  - Large operation about to start                                       │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export async function triggerWarningFeedback(): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    // await Haptics.notificationAsync(NotificationFeedbackType.Warning);
    console.log('[Haptics] Warning feedback');
  } catch (error) {
    console.warn('[Haptics] Warning feedback failed:', error);
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: SPECIALIZED HAPTIC PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tile placement haptic - complete drop sequence
 * Simulates the weight of a tile being placed
 */
export async function triggerTilePlacementFeedback(): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    // Initial contact (light)
    // await Haptics.impactAsync(ImpactFeedbackStyle.Light);
    await delay(30);
    // Full placement (heavy)
    // await Haptics.impactAsync(ImpactFeedbackStyle.Heavy);
    console.log('[Haptics] Tile placement feedback');
  } catch (error) {
    console.warn('[Haptics] Tile placement feedback failed:', error);
  }
}

/**
 * Rotation haptic - detent feedback at snap angles
 * Called when rotation crosses a snap angle (0°, 90°, 180°, 270°)
 */
export async function triggerRotationDetentFeedback(): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    // await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
    console.log('[Haptics] Rotation detent feedback');
  } catch (error) {
    console.warn('[Haptics] Rotation detent feedback failed:', error);
  }
}

/**
 * Button press haptic - standard interaction feedback
 */
export async function triggerButtonPressFeedback(): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    // await Haptics.impactAsync(ImpactFeedbackStyle.Light);
    console.log('[Haptics] Button press feedback');
  } catch (error) {
    console.warn('[Haptics] Button press feedback failed:', error);
  }
}

/**
 * Toggle switch haptic - on/off state change
 */
export async function triggerToggleFeedback(): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    // await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
    console.log('[Haptics] Toggle feedback');
  } catch (error) {
    console.warn('[Haptics] Toggle feedback failed:', error);
  }
}

/**
 * Long press recognized haptic
 * Confirms that a long press gesture has been detected
 */
export async function triggerLongPressFeedback(): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    // await Haptics.impactAsync(ImpactFeedbackStyle.Heavy);
    console.log('[Haptics] Long press feedback');
  } catch (error) {
    console.warn('[Haptics] Long press feedback failed:', error);
  }
}

/**
 * Delete/destructive action haptic
 * Used before confirming irreversible actions
 */
export async function triggerDeleteFeedback(): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    // await Haptics.impactAsync(ImpactFeedbackStyle.Heavy);
    await delay(100);
    // await Haptics.notificationAsync(NotificationFeedbackType.Warning);
    console.log('[Haptics] Delete feedback');
  } catch (error) {
    console.warn('[Haptics] Delete feedback failed:', error);
  }
}

/**
 * Rubber-band limit haptic
 * Indicates reaching the edge of scrollable/pannable content
 */
export async function triggerBoundaryFeedback(): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    // await Haptics.impactAsync(ImpactFeedbackStyle.Rigid);
    console.log('[Haptics] Boundary feedback');
  } catch (error) {
    console.warn('[Haptics] Boundary feedback failed:', error);
  }
}

/**
 * Undo/Redo action haptic
 * Provides confirmation of history navigation
 */
export async function triggerUndoRedoFeedback(): Promise<void> {
  if (!hapticsEnabled) return;

  try {
    // await Haptics.impactAsync(ImpactFeedbackStyle.Soft);
    console.log('[Haptics] Undo/Redo feedback');
  } catch (error) {
    console.warn('[Haptics] Undo/Redo feedback failed:', error);
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: CUSTOM PATTERN SEQUENCES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pattern step definition for custom sequences
 */
interface HapticStep {
  type: 'impact' | 'notification' | 'selection';
  style?: ImpactFeedbackStyle | NotificationFeedbackType;
  delay?: number;  // ms to wait after this step
}

/**
 * Pre-defined haptic patterns for specific scenarios
 */
export const HAPTIC_PATTERNS: Record<string, HapticStep[]> = {
  // Tile drop with bounce
  TILE_DROP: [
    { type: 'impact', style: ImpactFeedbackStyle.Light, delay: 30 },
    { type: 'impact', style: ImpactFeedbackStyle.Heavy, delay: 60 },
    { type: 'impact', style: ImpactFeedbackStyle.Light },
  ],

  // Pattern application complete
  PATTERN_COMPLETE: [
    { type: 'impact', style: ImpactFeedbackStyle.Heavy, delay: 80 },
    { type: 'notification', style: NotificationFeedbackType.Success },
  ],

  // Grid alignment success
  GRID_ALIGN: [
    { type: 'impact', style: ImpactFeedbackStyle.Medium, delay: 50 },
    { type: 'impact', style: ImpactFeedbackStyle.Heavy },
  ],

  // Save confirmation
  SAVE_COMPLETE: [
    { type: 'impact', style: ImpactFeedbackStyle.Light, delay: 50 },
    { type: 'notification', style: NotificationFeedbackType.Success },
  ],

  // Export complete
  EXPORT_COMPLETE: [
    { type: 'impact', style: ImpactFeedbackStyle.Medium, delay: 100 },
    { type: 'impact', style: ImpactFeedbackStyle.Heavy, delay: 100 },
    { type: 'notification', style: NotificationFeedbackType.Success },
  ],

  // Collision detected
  COLLISION: [
    { type: 'notification', style: NotificationFeedbackType.Error, delay: 50 },
    { type: 'impact', style: ImpactFeedbackStyle.Heavy },
  ],

  // Counting/calculating
  COUNTING: [
    { type: 'selection', delay: 80 },
    { type: 'selection', delay: 80 },
    { type: 'selection', delay: 80 },
    { type: 'impact', style: ImpactFeedbackStyle.Light },
  ],

  // Achievement/milestone
  ACHIEVEMENT: [
    { type: 'impact', style: ImpactFeedbackStyle.Light, delay: 100 },
    { type: 'impact', style: ImpactFeedbackStyle.Medium, delay: 100 },
    { type: 'impact', style: ImpactFeedbackStyle.Heavy, delay: 100 },
    { type: 'notification', style: NotificationFeedbackType.Success },
  ],
};

/**
 * Play a custom haptic pattern
 */
export async function playHapticPattern(
  patternName: keyof typeof HAPTIC_PATTERNS
): Promise<void> {
  if (!hapticsEnabled) return;

  const pattern = HAPTIC_PATTERNS[patternName];
  if (!pattern) {
    console.warn(`[Haptics] Unknown pattern: ${patternName}`);
    return;
  }

  try {
    for (const step of pattern) {
      // In actual implementation:
      // if (step.type === 'impact') {
      //   await Haptics.impactAsync(step.style as ImpactFeedbackStyle);
      // } else if (step.type === 'notification') {
      //   await Haptics.notificationAsync(step.style as NotificationFeedbackType);
      // } else if (step.type === 'selection') {
      //   await Haptics.selectionAsync();
      // }
      
      console.log(`[Haptics] Pattern step: ${step.type} - ${step.style}`);

      if (step.delay) {
        await delay(step.delay);
      }
    }
  } catch (error) {
    console.warn(`[Haptics] Pattern ${patternName} failed:`, error);
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Debounced haptic trigger to prevent rapid firing
 */
export function createDebouncedHaptic(
  hapticFn: () => Promise<void>,
  minInterval: number = 50
) {
  let lastTrigger = 0;

  return async () => {
    const now = Date.now();
    if (now - lastTrigger >= minInterval) {
      lastTrigger = now;
      await hapticFn();
    }
  };
}

/**
 * Throttled haptic trigger for continuous gestures
 */
export function createThrottledHaptic(
  hapticFn: () => Promise<void>,
  interval: number = 100
) {
  let pending = false;

  return async () => {
    if (!pending) {
      pending = true;
      await hapticFn();
      setTimeout(() => {
        pending = false;
      }, interval);
    }
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

/*
 * PRIMARY EXPORTS (Most commonly used):
 * 
 * triggerSnapFeedback()       - Tile/element snaps to grid
 * triggerSliderFeedback()     - Slider/dial movement
 * triggerErrorFeedback()      - Invalid action or overlap
 * triggerSuccessFeedback()    - Operation completed
 * triggerWarningFeedback()    - Caution state
 * 
 * SPECIALIZED EXPORTS:
 * 
 * triggerTilePlacementFeedback()  - Full tile drop sequence
 * triggerRotationDetentFeedback() - Rotation snap points
 * triggerBoundaryFeedback()       - Edge of scrollable area
 * playHapticPattern()             - Custom pattern sequences
 * 
 * UTILITIES:
 * 
 * createSliderHapticController()  - For continuous slider haptics
 * createDebouncedHaptic()         - Prevent rapid firing
 * createThrottledHaptic()         - Rate-limited continuous haptics
 * setHapticsEnabled()             - Global enable/disable
 */
