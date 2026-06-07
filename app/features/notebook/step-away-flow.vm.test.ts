import { describe, expect, it } from "vitest";
import {
  BOX_BREATHING_CYCLE_DURATION_MS,
  BOX_BREATHING_PHASE_DURATION_MS,
  getBreathingDurationMs,
  getBreathingSnapshot,
  STEP_AWAY_BREATHING_CYCLES,
  STEP_AWAY_BREATHING_DURATION_MS,
  STEP_AWAY_CONTINUED_BREATHING_CYCLES,
  STEP_AWAY_CONTINUED_BREATHING_DURATION_MS,
  STEP_AWAY_DISSOLUTION_START_MS,
} from "./step-away-flow.vm";

describe("step away breathing view model", () => {
  it("starts with the inhale cue before the dissolve begins", () => {
    expect(getBreathingSnapshot(0)).toMatchObject({
      cue: "Inhale",
      cycleIndex: 0,
      detail: "Breathe in gently",
      isComplete: false,
      isDissolving: false,
      phaseIndex: 0,
      totalCycles: STEP_AWAY_BREATHING_CYCLES,
    });
  });

  it("advances through the 4-4-4-4 phases", () => {
    expect(getBreathingSnapshot(BOX_BREATHING_PHASE_DURATION_MS)).toMatchObject({
      cue: "Hold",
      phaseIndex: 1,
    });
    expect(
      getBreathingSnapshot(BOX_BREATHING_PHASE_DURATION_MS * 2),
    ).toMatchObject({
      cue: "Exhale",
      phaseIndex: 2,
    });
    expect(
      getBreathingSnapshot(BOX_BREATHING_PHASE_DURATION_MS * 3),
    ).toMatchObject({
      cue: "Hold",
      phaseIndex: 3,
    });
  });

  it("starts the dissolution after one full breathing cycle", () => {
    expect(
      getBreathingSnapshot(STEP_AWAY_DISSOLUTION_START_MS - 1).isDissolving,
    ).toBe(false);
    expect(
      getBreathingSnapshot(STEP_AWAY_DISSOLUTION_START_MS).isDissolving,
    ).toBe(true);
    expect(
      getBreathingSnapshot(BOX_BREATHING_CYCLE_DURATION_MS).cycleIndex,
    ).toBe(1);
    expect(
      getBreathingSnapshot(BOX_BREATHING_CYCLE_DURATION_MS).isDissolving,
    ).toBe(true);
  });

  it("can opt into immediate dissolve timing for continued variants", () => {
    expect(getBreathingSnapshot(0, STEP_AWAY_BREATHING_CYCLES, 0)).toMatchObject(
      {
        isDissolving: true,
      },
    );
  });

  it("marks the flow complete after the third full cycle", () => {
    expect(
      getBreathingSnapshot(STEP_AWAY_BREATHING_DURATION_MS - 1).isComplete,
    ).toBe(false);
    expect(
      getBreathingSnapshot(STEP_AWAY_BREATHING_DURATION_MS).isComplete,
    ).toBe(true);
  });

  it("supports a longer continued breathing duration", () => {
    expect(getBreathingDurationMs(STEP_AWAY_CONTINUED_BREATHING_CYCLES)).toBe(
      STEP_AWAY_CONTINUED_BREATHING_DURATION_MS,
    );
    expect(
      getBreathingSnapshot(
        STEP_AWAY_BREATHING_DURATION_MS,
        STEP_AWAY_CONTINUED_BREATHING_CYCLES,
      ),
    ).toMatchObject({
      cycleIndex: STEP_AWAY_BREATHING_CYCLES,
      isComplete: false,
      totalCycles: STEP_AWAY_CONTINUED_BREATHING_CYCLES,
    });
  });
});
