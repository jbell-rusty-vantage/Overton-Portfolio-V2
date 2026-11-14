"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Modal from "@/components/library/Modal";
import { base } from "@/lib/estate/model";
import { Icon } from "./Marks";

function motionListener(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
export function useReducedMotion() {
  return useSyncExternalStore(
    motionListener,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}
const lines = [
  "Welcome to the library. Look beside the two quills.",
  "These are the Tennessee Reports. The matching volumes are on the writing table.",
  "Open the reports, or follow the house book. Your marked leaf will be waiting.",
];
export default function Portrait({
  src,
  close,
  read,
  record,
  onAwake,
  sound,
  setSound,
  hasBook,
}: {
  src: string | null;
  close: () => void;
  read: () => void;
  record: () => void;
  onAwake: () => void;
  sound: boolean;
  setSound: (v: boolean) => void;
  hasBook: boolean;
}) {
  const reduced = useReducedMotion();
  const [state, setState] = useState<"still" | "playing" | "paused" | "ready">(
    "still",
  );
  const [part, setPart] = useState(0);
  const [failed, setFailed] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  const silentStill = reduced || !src || failed;
  function finish() {
    player.current?.pause();
    setState("ready");
    setPart(2);
    onAwake();
  }
  function start() {
    if (silentStill) {
      finish();
      return;
    }
    setState("playing");
    if (player.current)
      void player.current.play().catch(() => {
        setFailed(true);
        finish();
      });
  }
  useEffect(() => {
    if (silentStill) return;
    const timer = window.setTimeout(() => {
      const movie = player.current;
      if (movie)
        void movie
          .play()
          .then(() => setState("playing"))
          .catch(() => setState("still"));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [silentStill]);
  const narrating = sound && state !== "still";
  useEffect(() => {
    if (!narrating || !("speechSynthesis" in window)) return;
    const voice = new SpeechSynthesisUtterance(lines.join(" "));
    voice.lang = "en-US";
    voice.rate = 0.94;
    window.speechSynthesis.speak(voice);
    return () => window.speechSynthesis.cancel();
  }, [narrating]);
  useEffect(() => {
    if (!narrating || !("speechSynthesis" in window)) return;
    if (state === "paused") window.speechSynthesis.pause();
    else window.speechSynthesis.resume();
  }, [state, narrating]);
  return (
    <Modal wide title="Meet Judge Overton" onClose={close}>
      <div className="ea-portrait-exhibit">
        <div className="ea-portrait-wall">
          <div className="ea-picture-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={base + "archive/judge-overton.webp"}
              alt="Earl’s monochrome portrait of Judge John Overton beside his quills and books."
            />
            {!silentStill && (
              <video
                ref={player}
                src={src ?? undefined}
                muted
                playsInline
                preload="none"
                aria-label="Animated interpretation of Earl’s portrait"
                className={state === "still" ? "dormant" : ""}
                onError={() => {
                  setFailed(true);
                  finish();
                }}
                onEnded={finish}
                onTimeUpdate={(e) => {
                  if (!e.currentTarget.ended)
                    setPart(e.currentTarget.currentTime < 2.3 ? 0 : 1);
                }}
              />
            )}
          </div>
          <small>Ralph E. W. Earl · 1817</small>
        </div>
        <div className="ea-portrait-copy">
          <p className="ea-overline">The custodian</p>
          <h2>Judge John Overton</h2>
          <p>
            {state === "still"
              ? "Earl painted Overton seated beside his law reports. Meet the sitter to follow his gaze to the writing table."
              : silentStill
                ? lines.join(" ")
                : lines[part]}
          </p>
          <small>Interpretive guide · newly written narration</small>
          <div className="ea-portrait-buttons">
            {state === "still" && (
              <button className="ea-button dark" onClick={start}>
                <Icon name={silentStill ? "book" : "play"} />
                {silentStill ? "Read the introduction" : "Meet Judge Overton"}
              </button>
            )}
            {state === "playing" && (
              <button
                className="ea-button outline"
                onClick={() => {
                  player.current?.pause();
                  setState("paused");
                }}
              >
                <Icon name="pause" />
                Pause performance
              </button>
            )}
            {state === "paused" && (
              <button className="ea-button outline" onClick={start}>
                <Icon name="play" />
                Resume performance
              </button>
            )}
            {(state === "playing" || state === "paused") && (
              <button className="ea-text-button" onClick={finish}>
                Skip performance <Icon name="arrow" />
              </button>
            )}
            {state === "ready" && (
              <button className="ea-button dark" onClick={record}>
                Open the reports <Icon name="arrow" />
              </button>
            )}
            {hasBook && (
              <button className="ea-text-button" onClick={read}>
                Follow the house book <Icon name="arrow" />
              </button>
            )}
            <button className="ea-text-button" onClick={close}>
              Explore on my own <Icon name="arrow" />
            </button>
          </div>
          <button
            className="ea-voice"
            aria-pressed={sound}
            onClick={() => setSound(!sound)}
          >
            <Icon name={sound ? "volume" : "mute"} size={16} />
            {sound ? "Narration on" : "Read silently"} ·{" "}
            {sound ? "mute" : "enable voice"}
          </button>
          <details className="ea-citations">
            <summary>Portrait credit</summary>
            <p>
              Nell Savage Mahoney Papers, Tennessee Historical Society.
              Photographic copy of Earl’s 1817 painting at Travellers Rest. The
              movement is an animated interpretation.
            </p>
            <a
              href="https://teva.contentdm.oclc.org/digital/collection/p15138coll33/id/285/"
              target="_blank"
              rel="noreferrer"
            >
              Original photographic record ↗
            </a>
          </details>
        </div>
      </div>
    </Modal>
  );
}
