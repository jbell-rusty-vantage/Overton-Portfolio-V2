"use client";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";

// The same video drives both the native player and the in-room projection.
// Draw only when the decoder supplies a frame or the visitor resizes the room.
export default function Projection({
  video,
  onFail,
  backend = "webgl2",
}: {
  video: RefObject<HTMLVideoElement | null>;
  onFail: () => void;
  backend?: "webgl2" | "webgpu";
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current,
      media = video.current;
    if (!el || !media) return;
    let cancelled = false,
      frame = 0,
      dispose: (() => void) | undefined;
    async function mount(container: HTMLDivElement, movie: HTMLVideoElement) {
      const renderer =
        backend === "webgpu"
          ? new (await import("three/webgpu")).WebGPURenderer({
              antialias: true,
              forceWebGL: false,
            })
          : new THREE.WebGLRenderer({ antialias: true });
      if ("init" in renderer) await renderer.init();
      if (cancelled) {
        renderer.dispose();
        return;
      }
      const canvas = renderer.domElement;
      container.appendChild(canvas);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#211d16");
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 35);
      camera.position.set(0.16, 0.15, 5.1);
      camera.lookAt(0, 0, 0);
      const texture = new THREE.VideoTexture(movie);
      texture.colorSpace = THREE.SRGBColorSpace;
      const geometries: THREE.BufferGeometry[] = [],
        materials: THREE.Material[] = [];
      function plane(
        w: number,
        h: number,
        z: number,
        mat: THREE.MeshBasicMaterial,
      ) {
        const g = new THREE.PlaneGeometry(w, h);
        geometries.push(g);
        materials.push(mat);
        const m = new THREE.Mesh(g, mat);
        m.position.z = z;
        scene.add(m);
        return m;
      }
      plane(
        5.58,
        3.22,
        -0.1,
        new THREE.MeshBasicMaterial({ color: "#62442e" }),
      );
      plane(
        5.46,
        3.11,
        -0.08,
        new THREE.MeshBasicMaterial({ color: "#b09462" }),
      );
      plane(
        5.43,
        3.08,
        -0.05,
        new THREE.MeshBasicMaterial({ color: "#201b17" }),
      );
      plane(
        5.32,
        2.993,
        0,
        new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
      );
      const render = () => {
        if (!cancelled) renderer.render(scene, camera);
      };
      const tick = () => {
        render();
        if (!cancelled) frame = movie.requestVideoFrameCallback(tick);
      };
      function size() {
        const w = container.clientWidth,
          h = container.clientHeight;
        if (!w || !h) return;
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        render();
      }
      const observer = new ResizeObserver(size);
      observer.observe(container);
      size();
      if ("requestVideoFrameCallback" in HTMLVideoElement.prototype)
        frame = movie.requestVideoFrameCallback(tick);
      movie.addEventListener("timeupdate", render);
      movie.addEventListener("loadeddata", render);
      movie.addEventListener("seeked", render);
      container.setAttribute(
        "data-backend",
        backend === "webgpu" &&
          "backend" in renderer &&
          !(renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend
          ? "webgl2-fallback"
          : backend,
      );
      dispose = () => {
        observer.disconnect();
        if (frame) movie.cancelVideoFrameCallback(frame);
        movie.removeEventListener("timeupdate", render);
        movie.removeEventListener("loadeddata", render);
        movie.removeEventListener("seeked", render);
        texture.dispose();
        geometries.forEach((v) => v.dispose());
        materials.forEach((v) => v.dispose());
        renderer.dispose();
        canvas.remove();
      };
    }
    void mount(el, media).catch(() => {
      if (!cancelled) onFail();
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [video, onFail, backend]);
  return (
    <div
      ref={host}
      className="ea-projection-surface"
      aria-label="Match film on the cabinet projection screen"
    />
  );
}
