export type BreathingCue = "Inhale" | "Hold" | "Exhale";

export interface BreathingPhaseDefinition {
  cue: BreathingCue;
  detail: string;
}

export interface BreathingSnapshot {
  cue: BreathingCue;
  cycleIndex: number;
  detail: string;
  isComplete: boolean;
  isDissolving: boolean;
  phaseIndex: number;
  phaseProgress: number;
  totalCycles: number;
}

export const BOX_BREATHING_PHASE_DURATION_MS = 4_000;
export const BOX_BREATHING_PHASES: BreathingPhaseDefinition[] = [
  { cue: "Inhale", detail: "Breathe in gently" },
  { cue: "Hold", detail: "Let the breath rest" },
  { cue: "Exhale", detail: "Release slowly" },
  { cue: "Hold", detail: "Stay here softly" },
];
export const BOX_BREATHING_CYCLE_DURATION_MS =
  BOX_BREATHING_PHASE_DURATION_MS * BOX_BREATHING_PHASES.length;
export const STEP_AWAY_BREATHING_CYCLES = 3;
export const STEP_AWAY_CONTINUED_BREATHING_CYCLES = 15;
export const STEP_AWAY_BREATHING_DURATION_MS =
  getBreathingDurationMs(STEP_AWAY_BREATHING_CYCLES);
export const STEP_AWAY_CONTINUED_BREATHING_DURATION_MS =
  getBreathingDurationMs(STEP_AWAY_CONTINUED_BREATHING_CYCLES);
export const STEP_AWAY_DISSOLUTION_START_MS =
  BOX_BREATHING_CYCLE_DURATION_MS;

export function getBreathingDurationMs(totalCycles: number) {
  return BOX_BREATHING_CYCLE_DURATION_MS * totalCycles;
}

export function getBreathingSnapshot(
  elapsedMs: number,
  totalCycles = STEP_AWAY_BREATHING_CYCLES,
  dissolutionStartMs = STEP_AWAY_DISSOLUTION_START_MS,
): BreathingSnapshot {
  const elapsed = Math.max(0, elapsedMs);
  const durationMs = getBreathingDurationMs(totalCycles);
  const isComplete = elapsed >= durationMs;
  const displayElapsed = Math.min(elapsed, durationMs - 1);
  const cycleIndex = Math.floor(
    displayElapsed / BOX_BREATHING_CYCLE_DURATION_MS,
  );
  const cycleElapsed = displayElapsed % BOX_BREATHING_CYCLE_DURATION_MS;
  const phaseIndex = Math.floor(
    cycleElapsed / BOX_BREATHING_PHASE_DURATION_MS,
  );
  const phaseElapsed = cycleElapsed % BOX_BREATHING_PHASE_DURATION_MS;
  const phase = BOX_BREATHING_PHASES[phaseIndex];

  return {
    cue: phase.cue,
    cycleIndex,
    detail: phase.detail,
    isComplete,
    isDissolving: elapsed >= dissolutionStartMs,
    phaseIndex,
    phaseProgress: phaseElapsed / BOX_BREATHING_PHASE_DURATION_MS,
    totalCycles,
  };
}
