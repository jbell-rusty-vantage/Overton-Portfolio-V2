"use client";

import { useRef, useState } from "react";
import { kindLabel, type Clip } from "@/lib/performances";

export default function ClipPlayer({ clips }: { clips: Clip[] }) {
  const [index, setIndex] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const clip = clips[index];

  function select(i: number) {
    setIndex(i);
    // Play once React has swapped the source.
    requestAnimationFrame(() => video.current?.play().catch(() => {}));
  }

  return (
    <div className="perf-player">
      <div className="perf-stage">
        <video
          ref={video}
          key={clip.id}
          src={clip.src}
          poster={clip.poster}
          controls
          playsInline
          preload="metadata"
          onEnded={() => index < clips.length - 1 && select(index + 1)}
        />
        <div className="perf-now">
          <h2>
            {index + 1}. {clip.title}
          </h2>
          <p className="perf-tags">
            <span className={`perf-tag perf-${clip.kind}`}>{kindLabel[clip.kind]}</span>
            {clip.at && <span className="perf-tag">{clip.at} in full film</span>}
          </p>
          <p>{clip.note}</p>
        </div>
      </div>
      <ol className="perf-list" aria-label="Clips">
        {clips.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              className={i === index ? "active" : undefined}
              aria-current={i === index ? "true" : undefined}
              onClick={() => select(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- small static poster */}
              <img src={c.poster} alt="" loading="lazy" />
              <span>
                <b>
                  {i + 1}. {c.title}
                </b>
                <span className={`perf-tag perf-${c.kind}`}>{kindLabel[c.kind]}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
