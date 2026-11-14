"use client";
/* The custodian's performance. One clock drives the voice, the captions, the mouth and
   the gaze: the audio element's playback time when sound is on, a silent timer when it
   is off or when audio fails. Pausing, buffering, a hidden tab and replay therefore
   stay in step without any second timeline to reconcile. */
import { useCallback, useEffect, useRef, useState } from "react";
import narration from "@/content/travellers-rest/narration.json";
import {
  anchor,
  captionLines,
  type Cue,
  type CueId,
} from "@/lib/estate/world";
import type { Engine } from "./engine/engine";

/** A cue that has text but no measured timeline: paced at a calm reading rate. */
function untimed(id: string, text: string): Cue {
  const words = text.split(/\s+/);
  let t = 0;
  const timed = words.map((w) => {
    const d = 0.2 + w.length * 0.045 + (/[.,;:!?]$/.test(w) ? 0.28 : 0);
    const out: [number, number, string] = [+t.toFixed(2), +(t + d).toFixed(2), w];
    t += d;
    return out;
  });
  let open = "";
  for (let f = 0; f < Math.ceil(t * 30) + 6; f++) {
    const at = f / 30;
    const w = timed.find(([s, e]) => at >= s && at < e);
    open += w ? String(Math.round(4 + 4 * Math.abs(Math.sin((at - w[0]) * 13)))) : "0";
  }
  return { id, text, duration: t + 0.2, words: timed, open, wide: "", gaze: [] };
}
export type Speech = {
  id: CueId;
  text: string;
  status: "playing" | "paused" | "done";
  quote?: string;
};

export function useCustodian(
  engine: Engine | null,
  voice: { timeline: string | null; audio: Record<string, string> },
  reduced: boolean,
) {
  const [timeline, setTimeline] = useState<Record<string, Cue & { quote?: string }>>({});
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [line, setLine] = useState("");
  /** `null` until the visitor makes an explicit choice about sound. */
  const [sound, setSound] = useState<boolean | null>(null);
  const [captions, setCaptions] = useState(true);
  const [notice, setNotice] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  const live = useRef<{
    cue: Cue;
    mode: "audio" | "silent";
    offset: number;
    since: number;
    playing: boolean;
    resume: boolean;
  } | null>(null);
  const soundRef = useRef(sound);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    if (!voice.timeline) return;
    let on = true;
    fetch(voice.timeline)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => on && setTimeline(d.cues ?? {}))
      .catch(() => {});
    return () => {
      on = false;
    };
  }, [voice.timeline]);

  const time = useCallback(() => {
    const s = live.current;
    if (!s) return 0;
    if (s.mode === "audio") return audio.current?.currentTime ?? 0;
    return s.offset + (s.playing ? (performance.now() - s.since) / 1000 : 0);
  }, []);
  const playing = useCallback(() => {
    const s = live.current;
    if (!s) return false;
    if (s.mode === "audio") {
      const a = audio.current;
      return !!a && !a.paused && a.readyState > 2;
    }
    return s.playing;
  }, []);
  const finish = useCallback(() => {
    const s = live.current;
    if (!s) return;
    s.playing = false;
    setSpeech((v) => (v ? { ...v, status: "done" } : v));
    engine?.speak(null, null);
  }, [engine]);
  /** Fall back to the silent clock at the present moment of the cue. */
  const silence = useCallback((message?: string) => {
    const s = live.current;
    if (!s || s.mode === "silent") return;
    s.offset = audio.current?.currentTime ?? 0;
    s.since = performance.now();
    s.mode = "silent";
    audio.current?.pause();
    if (message) setNotice(message);
  }, []);

  const start = useCallback(
    (id: CueId, from = 0) => {
      const authored = narration.cues.find((c) => c.id === id);
      const cue = timeline[id] ?? (authored ? untimed(id, authored.text) : null);
      if (!cue) return false;
      const quote = timeline[id]?.quote ?? (authored as { quote?: string } | undefined)?.quote;
      audio.current?.pause();
      document.querySelectorAll("video").forEach(video => video.pause());
      const src = voice.audio[id];
      const useAudio = soundRef.current === true && !!src && cue.duration > 0 && !!timeline[id];
      live.current = {
        cue,
        mode: useAudio ? "audio" : "silent",
        offset: from,
        since: performance.now(),
        playing: true,
        resume: false,
      };
      setNotice("");
      setLine("");
      setSpeech({ id, text: cue.text, status: "playing", quote });
      // Reduced motion keeps the whole text and still portrait, but preserves
      // the audio/reading clock so a guided tour waits for the cue to finish.
      if (reduced) setLine(cue.text);
      if (useAudio) {
        const a = (audio.current ??= new Audio());
        a.preload = "auto";
        a.src = src;
        a.currentTime = from;
        a.onended = finish;
        a.onerror = () => silence("The voice could not be loaded. Captions continue.");
        void a.play().catch(() => silence("Sound could not start. Captions continue."));
      }
      if (!reduced) engine?.speak({ cue, time, playing }, null);
      return true;
    },
    [timeline, voice.audio, engine, time, playing, finish, silence, reduced],
  );
  const stop = useCallback(() => {
    audio.current?.pause();
    live.current = null;
    setSpeech(null);
    setLine("");
    engine?.speak(null, null);
  }, [engine]);
  const pause = useCallback(() => {
    const s = live.current;
    if (!s || !s.playing) return;
    if (s.mode === "audio") audio.current?.pause();
    else s.offset = time();
    s.playing = false;
    setSpeech((v) => (v && v.status === "playing" ? { ...v, status: "paused" } : v));
  }, [time]);
  const resume = useCallback(() => {
    const s = live.current;
    if (!s || s.playing) return;
    s.playing = true;
    s.since = performance.now();
    if (s.mode === "audio")
      void audio.current?.play().catch(() => silence("Sound could not resume. Captions continue."));
    setSpeech((v) => (v ? { ...v, status: "playing" } : v));
    if (!reduced) engine?.speak({ cue: s.cue, time, playing }, null);
  }, [engine, time, playing, silence, reduced]);

  // Captions and gaze follow the clock.
  useEffect(() => {
    if (!speech || speech.status === "done") return;
    let frame = 0;
    let shown = "";
    let gazeIndex = -1;
    const tick = () => {
      const s = live.current;
      if (!s) return;
      const t = time();
      const lines = captionLines(s.cue);
      const at = lines.findLast((l) => t >= l.start - 0.05);
      const text = at ? at.text : "";
      if (!reduced && text !== shown) {
        shown = text;
        setLine(text);
      }
      const g = s.cue.gaze.findLastIndex(([when]) => t >= when);
      if (!reduced && g !== gazeIndex) {
        gazeIndex = g;
        const where = g >= 0 ? s.cue.gaze[g][1] : "visitor";
        engine?.attend(where === "visitor" ? null : (anchor[where] ?? null));
      }
      if (s.mode === "silent" && s.playing && t >= s.cue.duration) {
        finish();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [speech?.id, speech?.status, engine, time, finish, reduced]); // eslint-disable-line react-hooks/exhaustive-deps
  // A hidden tab pauses the performance and picks it up again on return.
  useEffect(() => {
    function visibility() {
      const s = live.current;
      if (!s) return;
      if (document.hidden && s.playing) {
        pause();
        s.resume = true;
      } else if (!document.hidden && s.resume) {
        s.resume = false;
        resume();
      }
    }
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [pause, resume]);
  useEffect(
    () => () => {
      audio.current?.pause();
      audio.current = null;
    },
    [],
  );
  /** Change the sound preference; a line in progress carries on in the new mode. */
  const choose = useCallback(
    (on: boolean) => {
      setSound(on);
      soundRef.current = on;
      const s = live.current;
      if (!s || !s.playing) return;
      const at = time();
      if (!on) silence();
      else if (s.mode === "silent") start(s.cue.id, at);
    },
    [time, silence, start],
  );
  return {
    speech,
    line,
    sound,
    captions,
    notice,
    choose,
    setCaptions,
    play: start,
    pause,
    resume,
    stop,
    replay: () => (live.current ? start(live.current.cue.id) : false),
    /** Other media takes the audio: the custodian yields. */
    yield: pause,
  };
}
