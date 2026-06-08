import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  getBreathingDurationMs,
  getBreathingSnapshot,
  STEP_AWAY_BREATHING_CYCLES,
  STEP_AWAY_CONTINUED_BREATHING_CYCLES,
} from "./step-away-flow.vm";
import "./step-away-flow.css";

type StepAwayStage =
  | "idle"
  | "acknowledgment"
  | "breathing"
  | "releasePending"
  | "release"
  | "continuedBreathing"
  | "continuedComplete";

interface DissolutionFragment {
  id: string;
  style: CSSProperties & Record<`--${string}`, string>;
}

const FRAGMENT_COLUMNS = 12;
const FRAGMENT_ROWS = 9;
const FRAGMENT_BACKGROUNDS = [
  "linear-gradient(135deg, rgba(5, 7, 11, 0.94), rgba(18, 27, 38, 0.84))",
  "linear-gradient(145deg, rgba(10, 15, 22, 0.88), rgba(49, 77, 88, 0.62))",
  "linear-gradient(135deg, rgba(19, 24, 31, 0.84), rgba(214, 180, 103, 0.48))",
  "linear-gradient(145deg, rgba(134, 215, 242, 0.48), rgba(6, 16, 25, 0.78))",
  "linear-gradient(135deg, rgba(247, 247, 242, 0.3), rgba(10, 15, 22, 0.76))",
];
const FRAGMENT_CLIPS = [
  "polygon(0 8%, 93% 0, 100% 86%, 12% 100%)",
  "polygon(8% 0, 100% 13%, 91% 100%, 0 82%)",
  "polygon(0 0, 86% 7%, 100% 100%, 18% 91%)",
  "polygon(15% 0, 100% 0, 82% 100%, 0 90%)",
  "polygon(0 18%, 82% 0, 100% 74%, 22% 100%)",
];
const FLOW_EXIT_FADE_MS = 1_200;
const RELEASE_ENTRY_FADE_MS = 1_600;
const RELEASE_MESSAGE_DURATION_MS = 9_500;
interface ReleaseMessage {
  citation?: ReactNode;
  text: string;
}

const RELEASE_MESSAGES: ReleaseMessage[] = [
  {
    text: "Slow breathing can help your body shift toward calm, and regular practice may lower blood pressure.",
    citation: (
      <>
        Sources:{" "}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/29209423/"
          rel="noreferrer"
          target="_blank"
        >
          Russo et al.
        </a>
        ,{" "}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/31331557/"
          rel="noreferrer"
          target="_blank"
        >
          Chaddha et al.
        </a>
      </>
    ),
  },
  {
    text: "Now take a break from the screen. Go outside for a few minutes if you can.",
  },
];

export function StepAwayFlow({ className = "" }: { className?: string }) {
  const [stage, setStage] = useState<StepAwayStage>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isChimeEnabled, setIsChimeEnabled] = useState(true);
  const [isExitingFlow, setIsExitingFlow] = useState(false);
  const [isNatureOnlyRelease, setIsNatureOnlyRelease] = useState(false);
  const [releaseMessageIndex, setReleaseMessageIndex] = useState(0);
  const acknowledgmentRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const breathingRef = useRef<HTMLDivElement>(null);
  const lastChimeKeyRef = useRef("");
  const releaseEntryTimeoutRef = useRef<number | null>(null);
  const shouldRestoreTriggerFocusRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnRef = useRef<HTMLButtonElement>(null);
  const fragments = useMemo(createDissolutionFragments, []);
  const breathingCycleCount =
    stage === "continuedBreathing"
      ? STEP_AWAY_CONTINUED_BREATHING_CYCLES
      : STEP_AWAY_BREATHING_CYCLES;
  const breathingSnapshot = getBreathingSnapshot(
    elapsedMs,
    breathingCycleCount,
  );
  const stepAwayCycleClass =
    stage === "breathing" || stage === "releasePending"
      ? `step-away-cycle-${Math.min(breathingSnapshot.cycleIndex + 1, 3)}`
      : "";
  const shouldShowNatureBed =
    (stage === "breathing" && breathingSnapshot.cycleIndex >= 2) ||
    stage === "releasePending" ||
    stage === "release" ||
    stage === "continuedBreathing" ||
    stage === "continuedComplete";
  const fragmentPhase =
    (stage !== "breathing" && stage !== "releasePending") ||
    breathingSnapshot.cycleIndex === 0
      ? "waiting"
      : breathingSnapshot.cycleIndex === 1
        ? "forming"
        : "falling";
  const activeReleaseMessage = RELEASE_MESSAGES[releaseMessageIndex];
  const canContinueBreathing =
    stage === "release" && releaseMessageIndex === RELEASE_MESSAGES.length - 1;

  const clearReleaseEntryTimeout = useCallback(() => {
    if (releaseEntryTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(releaseEntryTimeoutRef.current);
    releaseEntryTimeoutRef.current = null;
  }, []);

  const resetFlow = useCallback(() => {
    clearReleaseEntryTimeout();
    setElapsedMs(0);
    setIsExitingFlow(false);
    setIsNatureOnlyRelease(false);
    setReleaseMessageIndex(0);
    lastChimeKeyRef.current = "";
    shouldRestoreTriggerFocusRef.current = true;
    setStage("idle");
  }, [clearReleaseEntryTimeout]);

  const closeFlow = useCallback(
    ({ fade = false }: { fade?: boolean } = {}) => {
      if (fade) {
        setIsExitingFlow(true);
        window.setTimeout(() => {
          void exitFullscreen();
          resetFlow();
        }, FLOW_EXIT_FADE_MS);
        return;
      }

      void exitFullscreen();
      resetFlow();
    },
    [resetFlow],
  );

  useEffect(() => {
    if (stage === "acknowledgment") {
      acknowledgmentRef.current?.focus();
    }

    if (stage === "breathing" || stage === "continuedBreathing") {
      breathingRef.current?.focus();
    }

    if (stage === "release") {
      setReleaseMessageIndex(0);
    }

    if (stage === "continuedComplete") {
      returnRef.current?.focus();
    }

    if (stage === "idle" && shouldRestoreTriggerFocusRef.current) {
      triggerRef.current?.focus();
      shouldRestoreTriggerFocusRef.current = false;
    }
  }, [closeFlow, stage]);

  useEffect(() => {
    if (stage !== "acknowledgment") {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeFlow();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage]);

  useEffect(() => {
    return () => {
      clearReleaseEntryTimeout();
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (stage !== "breathing" && stage !== "continuedBreathing") {
      return;
    }

    const durationMs = getBreathingDurationMs(breathingCycleCount);
    const startedAt = window.performance.now();
    setElapsedMs(0);
    const intervalId = window.setInterval(() => {
      const nextElapsedMs = window.performance.now() - startedAt;
      if (nextElapsedMs >= durationMs) {
        setElapsedMs(durationMs);
        if (stage === "continuedBreathing") {
          setStage("continuedComplete");
          return;
        }

        setStage("releasePending");
        releaseEntryTimeoutRef.current = window.setTimeout(() => {
          setStage("release");
          releaseEntryTimeoutRef.current = null;
        }, RELEASE_ENTRY_FADE_MS);
        return;
      }

      setElapsedMs(nextElapsedMs);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [breathingCycleCount, stage]);

  useEffect(() => {
    if (
      (stage !== "breathing" && stage !== "continuedBreathing") ||
      !isChimeEnabled ||
      (breathingSnapshot.phaseIndex !== 0 && breathingSnapshot.phaseIndex !== 2)
    ) {
      return;
    }

    const chimeKey = `${stage}-${breathingSnapshot.cycleIndex}-${breathingSnapshot.phaseIndex}`;
    if (lastChimeKeyRef.current === chimeKey) {
      return;
    }

    lastChimeKeyRef.current = chimeKey;
    void playBreathingChime(breathingSnapshot.phaseIndex === 0 ? "inhale" : "exhale");
  }, [
    breathingSnapshot.cycleIndex,
    breathingSnapshot.phaseIndex,
    isChimeEnabled,
    stage,
  ]);

  useEffect(() => {
    if (stage !== "release") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setReleaseMessageIndex((currentIndex) =>
        Math.min(currentIndex + 1, RELEASE_MESSAGES.length - 1),
      );
    }, RELEASE_MESSAGE_DURATION_MS);

    return () => window.clearInterval(intervalId);
  }, [stage]);

  useEffect(() => {
    if (
      stage !== "release" ||
      releaseMessageIndex !== RELEASE_MESSAGES.length - 1
    ) {
      setIsNatureOnlyRelease(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsNatureOnlyRelease(true);
    }, 8_000);

    return () => window.clearTimeout(timeoutId);
  }, [releaseMessageIndex, stage]);

  useEffect(() => {
    if (canContinueBreathing) {
      returnRef.current?.focus();
    }
  }, [canContinueBreathing]);

  function returnToDocuments() {
    closeFlow({ fade: true });
  }

  async function startBreathing() {
    prepareBreathingAudio();
    await enterFullscreen();
    setStage("breathing");
  }

  function startContinuedBreathing() {
    setElapsedMs(0);
    setIsNatureOnlyRelease(false);
    lastChimeKeyRef.current = "";
    setStage("continuedBreathing");
  }

  async function playBreathingChime(phase: "inhale" | "exhale") {
    const audioContext = audioContextRef.current;
    if (!audioContext) {
      return;
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const now = audioContext.currentTime;
    const baseFrequency = phase === "inhale" ? 196 : 174.6;
    const masterGain = audioContext.createGain();
    const lowpass = audioContext.createBiquadFilter();
    const highpass = audioContext.createBiquadFilter();
    const partials = [
      { decay: 5.6, gain: 0.034, ratio: 1 },
      { decay: 4.9, gain: 0.018, ratio: 2.04 },
      { decay: 4.2, gain: 0.012, ratio: 2.71 },
      { decay: 3.4, gain: 0.008, ratio: 3.82 },
      { decay: 2.7, gain: 0.005, ratio: 5.01 },
    ];

    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(90, now);
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(1_850, now);
    masterGain.gain.setValueAtTime(0.82, now);
    masterGain.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(audioContext.destination);

    partials.forEach((partial, index) => {
      const oscillator = audioContext.createOscillator();
      const partialGain = audioContext.createGain();
      const strikeOffset = index * 0.008;
      const startAt = now + strikeOffset;
      const detuneCents = phase === "inhale" ? index * 1.7 : -index * 1.4;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        baseFrequency * partial.ratio,
        startAt,
      );
      oscillator.detune.setValueAtTime(detuneCents, startAt);
      partialGain.gain.setValueAtTime(0.0001, startAt);
      partialGain.gain.exponentialRampToValueAtTime(
        partial.gain,
        startAt + 0.018,
      );
      partialGain.gain.exponentialRampToValueAtTime(
        0.0001,
        startAt + partial.decay,
      );

      oscillator.connect(partialGain);
      partialGain.connect(masterGain);
      oscillator.start(startAt);
      oscillator.stop(startAt + partial.decay + 0.1);
    });
  }

  function prepareBreathingAudio() {
    if (audioContextRef.current || typeof window.AudioContext === "undefined") {
      return;
    }

    audioContextRef.current = new window.AudioContext();
    void audioContextRef.current.resume();
  }

  async function enterFullscreen() {
    if (document.fullscreenElement || !document.documentElement.requestFullscreen) {
      return;
    }

    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Browser fullscreen can be denied; the overlay still provides the flow.
    }
  }

  async function exitFullscreen() {
    if (!document.fullscreenElement || !document.exitFullscreen) {
      return;
    }

    try {
      await document.exitFullscreen();
    } catch {
      // User/browser may already have left fullscreen.
    }
  }

  return (
    <>
      {stage === "idle" ? (
        <aside
          className={["step-away-entry", className].filter(Boolean).join(" ")}
          aria-label="Wellness break"
        >
          <div>
            <p>Feeling overwhelmed?</p>
            <span>Take a quiet break before reading more.</span>
          </div>
          <button
            ref={triggerRef}
            type="button"
            className="step-away-trigger"
            onClick={() => setStage("acknowledgment")}
          >
            Take a step away
          </button>
        </aside>
      ) : null}

      {stage === "acknowledgment" ? renderStepAwayOverlay(
        <div className="step-away-acknowledgment-backdrop">
          <div
            ref={acknowledgmentRef}
            className="step-away-acknowledgment"
            role="dialog"
            aria-modal="true"
            aria-labelledby="step-away-acknowledgment-title"
            tabIndex={-1}
          >
            <p id="step-away-acknowledgment-title">
              Medical information can feel overwhelming. That's completely
              normal. Before you go further, let's take a moment to just
              breathe.
            </p>
            <div className="step-away-acknowledgment-actions">
              <button
                type="button"
                className="step-away-primary-action"
                onClick={startBreathing}
              >
                Okay, I'm ready
              </button>
              <button
                type="button"
                className="step-away-subtle-action"
                onClick={() => closeFlow()}
              >
                Skip this
              </button>
            </div>
          </div>
        </div>,
      ) : null}

      {shouldShowNatureBed ? renderStepAwayOverlay(
        <div
          className={`step-away-nature-bed ${isExitingFlow ? "exiting" : ""}`}
          aria-hidden="true"
        />,
      ) : null}

      {stage === "breathing" || stage === "continuedBreathing" ? renderStepAwayOverlay(
        <section
          className={`step-away-takeover ${stepAwayCycleClass} ${stage === "continuedBreathing" ? "continued" : ""} ${breathingSnapshot.isDissolving ? "dissolving" : ""} ${isExitingFlow ? "exiting" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="step-away-breathing-cue"
        >
          {stage === "breathing" ? (
            <DissolutionLayer
              fragments={fragments}
              phase={fragmentPhase}
            />
          ) : null}
          <button
            type="button"
            className="step-away-sound-toggle"
            aria-label={isChimeEnabled ? "Mute breathing chime" : "Enable breathing chime"}
            onClick={() => setIsChimeEnabled((currentValue) => !currentValue)}
          >
            {isChimeEnabled ? "Mute" : "Sound"}
          </button>
          <div
            ref={breathingRef}
            className="step-away-breathing-panel"
            tabIndex={-1}
          >
            <div
              className={`step-away-breathing-shape step-away-breathing-phase-${breathingSnapshot.phaseIndex}`}
              aria-hidden="true"
            >
              <span />
            </div>
            <p className="step-away-breathing-detail">
              {breathingSnapshot.detail}
            </p>
            <h2 id="step-away-breathing-cue" aria-live="polite">
              {breathingSnapshot.cue}
            </h2>
            <p className="step-away-breathing-count">
              {stage === "continuedBreathing" ? "Continued breathing / " : ""}
              Cycle {breathingSnapshot.cycleIndex + 1} of{" "}
              {breathingSnapshot.totalCycles}
            </p>
            {stage === "continuedBreathing" ? (
              <button
                type="button"
                className="step-away-return-link step-away-breathing-return"
                onClick={returnToDocuments}
              >
                Return to my documents
              </button>
            ) : null}
          </div>
        </section>,
      ) : null}

      {stage === "releasePending" ? renderStepAwayOverlay(
        <section
          className={`step-away-takeover release-pending ${stepAwayCycleClass}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="step-away-breathing-cue"
        >
          <div
            ref={breathingRef}
            className="step-away-breathing-panel"
            tabIndex={-1}
          >
            <div
              className={`step-away-breathing-shape step-away-breathing-phase-${breathingSnapshot.phaseIndex}`}
              aria-hidden="true"
            >
              <span />
            </div>
            <p className="step-away-breathing-detail">
              {breathingSnapshot.detail}
            </p>
            <h2 id="step-away-breathing-cue" aria-live="polite">
              {breathingSnapshot.cue}
            </h2>
            <p className="step-away-breathing-count">
              Cycle {breathingSnapshot.cycleIndex + 1} of{" "}
              {breathingSnapshot.totalCycles}
            </p>
          </div>
        </section>,
      ) : null}

      {stage === "release" ? renderStepAwayOverlay(
        <section
          className={`step-away-release ${isNatureOnlyRelease ? "nature-only" : ""} ${isExitingFlow ? "exiting" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="step-away-release-title"
        >
          <div className="step-away-release-content">
            <h2
              id="step-away-release-title"
              className={
                [
                  "step-away-release-message",
                  activeReleaseMessage.citation ? "sourced" : "",
                  releaseMessageIndex === RELEASE_MESSAGES.length - 1
                    ? "final"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
              key={releaseMessageIndex}
              aria-live="polite"
            >
              {activeReleaseMessage.text}
            </h2>
            {activeReleaseMessage.citation ? (
              <p className="step-away-release-citation">
                {activeReleaseMessage.citation}
              </p>
            ) : null}
          </div>
          {canContinueBreathing ? (
            <div className="step-away-release-actions">
              <button
                type="button"
                className="step-away-continue-button"
                onClick={startContinuedBreathing}
              >
                Continue breathing for 4 minutes
              </button>
              <button
                ref={returnRef}
                type="button"
                className="step-away-return-link"
                onClick={returnToDocuments}
              >
                Return to my documents
              </button>
            </div>
          ) : null}
        </section>,
      ) : null}

      {stage === "continuedComplete" ? renderStepAwayOverlay(
        <section
          className={`step-away-release ${isExitingFlow ? "exiting" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="step-away-continued-complete-title"
        >
          <div className="step-away-release-content">
            <h2
              id="step-away-continued-complete-title"
              className="step-away-release-message final"
            >
              You can stop here. Take your time before returning.
            </h2>
          </div>
          <button
            ref={returnRef}
            type="button"
            className="step-away-return-link"
            onClick={returnToDocuments}
          >
            Return to my documents
          </button>
        </section>,
      ) : null}
    </>
  );
}

function renderStepAwayOverlay(content: ReactNode) {
  if (typeof document === "undefined") {
    return content;
  }

  return createPortal(content, document.body);
}

function DissolutionLayer({
  fragments,
  phase,
}: {
  fragments: DissolutionFragment[];
  phase: "waiting" | "forming" | "falling";
}) {
  return (
    <div
      className={`step-away-dissolution-layer ${phase}`}
      aria-hidden="true"
    >
      {fragments.map((fragment) => (
        <span
          className="step-away-fragment"
          key={fragment.id}
          style={fragment.style}
        />
      ))}
    </div>
  );
}

function createDissolutionFragments(): DissolutionFragment[] {
  const fragments: DissolutionFragment[] = [];
  const fragmentCount = FRAGMENT_ROWS * FRAGMENT_COLUMNS;

  for (let row = 0; row < FRAGMENT_ROWS; row += 1) {
    for (let column = 0; column < FRAGMENT_COLUMNS; column += 1) {
      const index = row * FRAGMENT_COLUMNS + column;
      const stagger = (
        (index / fragmentCount) * 31 +
        (index % 5) * 0.42
      ).toFixed(2);
      const driftX = ((column - FRAGMENT_COLUMNS / 2) * 1.8 + (index % 4) * 4.6)
        .toFixed(1);
      const driftY = (16 + row * 5.2 + (index % 6) * 3.2).toFixed(1);
      const rotate = (-5 + (index % 9) * 1.35).toFixed(1);
      const duration = (18 + (index % 7) * 1.15).toFixed(2);
      const fallDelay = (row * 0.18 + (index % 4) * 0.16).toFixed(2);
      const fallDuration = (11.4 + (index % 5) * 0.42).toFixed(2);

      fragments.push({
        id: `${row}-${column}`,
        style: {
          "--fragment-bg":
            FRAGMENT_BACKGROUNDS[index % FRAGMENT_BACKGROUNDS.length],
          "--fragment-delay": `${stagger}s`,
          "--fragment-duration": `${duration}s`,
          "--fragment-fall-delay": `${fallDelay}s`,
          "--fragment-fall-duration": `${fallDuration}s`,
          "--fragment-rotate": `${rotate}deg`,
          "--fragment-scale": `${0.92 + (index % 4) * 0.03}`,
          "--fragment-x": `${driftX}vw`,
          "--fragment-y": `${driftY}vh`,
          clipPath: FRAGMENT_CLIPS[index % FRAGMENT_CLIPS.length],
          height: `${100 / FRAGMENT_ROWS + 2.2}%`,
          left: `${(column / FRAGMENT_COLUMNS) * 100 - 0.8}%`,
          top: `${(row / FRAGMENT_ROWS) * 100 - 0.8}%`,
          width: `${100 / FRAGMENT_COLUMNS + 2.2}%`,
        },
      });
    }
  }

  return fragments;
}
