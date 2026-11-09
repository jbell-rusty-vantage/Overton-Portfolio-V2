"use client";
/* eslint-disable react-hooks/immutability -- R3F exposes the mutable camera and GPU resources to its frame/effect lifecycle. */
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import ShelfPlaque from "./ShelfPlaque";
import BookJacket from "./BookJacket";
import {
  shelves,
  collectionShelves,
  zones,
  screenAnchors,
  type Collection,
  type CameraPreset,
  type Volume,
} from "@/lib/library/model";

type Pin = { id: string; label: string; at: number[]; action: () => void };
type Props = {
  collection: Collection;
  zone: string;
  shelf: string | null;
  selected: string | null;
  reduced: boolean;
  low: boolean;
  onZone: (slug: string) => void;
  onShelf: (slug: string) => void;
  onBook: (book: Volume) => void;
  onScreen: (slot: string) => void;
  onGuide: () => void;
  onError: () => void;
  paused: boolean;
};
function preset(
  zone: string,
  shelf: string | null,
  aspect: number,
  override?: CameraPreset,
) {
  const s = shelves.find((s) => s.slug === shelf && s.zone === zone);
  const z = zones.find((z) => z.slug === zone) ?? zones[0];
  if (!s)
    return {
      eye: new THREE.Vector3(...(override?.eye ?? z.eye)),
      target: new THREE.Vector3(...(override?.target ?? z.target)),
      fov: aspect < 0.8 ? 66 : 53,
    };
  const rad = (s.yaw * Math.PI) / 180,
    distance = aspect < 1 ? 6.9 : 4.55;
  return {
    eye: new THREE.Vector3(
      s.x + Math.sin(rad) * distance,
      2.05,
      s.z + Math.cos(rad) * distance,
    ),
    target: new THREE.Vector3(s.x, 1.92, s.z),
    fov: aspect < 1 ? 59 : 48,
  };
}
function Rig({
  zone,
  shelf,
  reduced,
  pins,
  overlay,
  paused,
  override,
}: {
  override?: CameraPreset;
  zone: string;
  shelf: string | null;
  reduced: boolean;
  pins: Pin[];
  overlay: RefObject<HTMLDivElement | null>;
  paused: boolean;
}) {
  const { camera, gl, size, invalidate } = useThree();
  const look = useRef(new THREE.Vector3());
  const route = useRef<{
    eye: THREE.Vector3;
    target: THREE.Vector3;
    start: THREE.Vector3;
    from: THREE.Vector3;
    via: THREE.Vector3;
    time: number;
    duration: number;
  } | null>(null);
  const first = useRef(true);
  const offset = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const view = preset(zone, shelf, size.width / size.height, override);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = view.fov;
    cam.updateProjectionMatrix();
    const start = camera.position.clone();
    // Keep diagonal travel inside the open aisle. Short refocuses use the direct path.
    const far = start.distanceTo(view.eye) > 7;
    const via = far
      ? new THREE.Vector3(0, 3, Math.min(0, view.eye.z / 2))
      : start.clone().lerp(view.eye, 0.5);
    route.current = {
      eye: view.eye,
      target: view.target,
      start,
      from: look.current.clone(),
      via,
      time: 0,
      duration: reduced || first.current ? 0 : far ? 1.55 : 0.85,
    };
    first.current = false;
    offset.current = { x: 0, y: 0 };
    invalidate();
  }, [
    zone,
    shelf,
    size.width,
    size.height,
    camera,
    reduced,
    invalidate,
    override,
  ]);
  useEffect(() => {
    const el = gl.domElement;
    let last: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => {
      if (!paused && e.button === 0) last = { x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!last || paused || !e.buttons) return;
      offset.current.x = THREE.MathUtils.clamp(
        offset.current.x - (e.clientX - last.x) * 0.002,
        -0.28,
        0.28,
      );
      offset.current.y = THREE.MathUtils.clamp(
        offset.current.y - (e.clientY - last.y) * 0.002,
        -0.16,
        0.16,
      );
      last = { x: e.clientX, y: e.clientY };
      invalidate();
    };
    const up = () => {
      last = null;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl, invalidate, paused]);
  useEffect(() => {
    invalidate();
  }, [pins, paused, invalidate]);
  useEffect(() => {
    const resume = () => {
      if (!document.hidden) invalidate();
    };
    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, [invalidate]);
  const point = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const r = route.current;
    if (!r || document.hidden || (paused && r.duration > 0)) return;
    r.time += Math.min(dt, 0.065);
    const t = r.duration ? Math.min(1, r.time / r.duration) : 1;
    const u = t * t * (3 - 2 * t);
    camera.position
      .copy(r.start)
      .multiplyScalar((1 - u) ** 2)
      .addScaledVector(r.via, 2 * (1 - u) * u)
      .addScaledVector(r.eye, u * u);
    look.current.lerpVectors(r.from, r.target, u);
    camera.lookAt(look.current);
    camera.rotateY(offset.current.x);
    camera.rotateX(offset.current.y);
    camera.updateMatrixWorld();
    if (overlay.current)
      for (const el of Array.from(
        overlay.current.children,
      ) as HTMLButtonElement[]) {
        const pin = pins.find((p) => p.id === el.dataset.pin);
        if (!pin) continue;
        point.fromArray(pin.at).project(camera);
        el.hidden =
          t < 0.93 ||
          point.z < 0 ||
          point.z > 1 ||
          Math.abs(point.x) > 0.89 ||
          Math.abs(point.y) > 0.79;
        el.style.left = (point.x + 1) * 50 + "%";
        el.style.top = (1 - point.y) * 50 + "%";
      }
    if (t < 1) invalidate();
  });
  return null;
}
function Binding({
  book,
  selected,
  onBook,
  reduced,
}: {
  book: Volume;
  selected: boolean;
  onBook: () => void;
  reduced: boolean;
}) {
  const s = shelves.find((s) => s.slug === book.shelf)!;
  const index = book.position - 1;
  const a = (s.yaw * Math.PI) / 180;
  const dx = ((index % 8) - 3.5) * (s.zone === "stacks" ? 0.51 : 0.405);
  const y = 2.64 - Math.floor(index / 8) * 0.91 + 0.34;
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const invalidate = useThree((state) => state.invalidate);
  const texture = useLoader(
    THREE.TextureLoader,
    "/library/plate-" + book.plate + ".webp",
  );
  const jacket = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 384;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return texture;
    ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f0dcaf";
    ctx.textAlign = "center";
    ctx.font = "23px Georgia";
    const words = book.title.split(/\s+/);
    let line = "";
    const lines: string[] = [];
    for (const word of words) {
      const next = (line + " " + word).trim();
      if (ctx.measureText(next).width > 310 && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
    lines
      .slice(0, 2)
      .forEach((l, i) =>
        ctx.fillText(l, 192, lines.length > 1 ? 52 + i * 23 : 65, 304),
      );
    ctx.font = "14px Georgia";
    ctx.fillText(book.kind.toUpperCase(), 192, 423, 240);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [texture, book.title, book.kind]);
  useEffect(
    () => () => {
      if (jacket !== texture) jacket.dispose();
    },
    [jacket, texture],
  );
  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = selected ? 0.83 : hover ? 0.71 : 0.61;
    const next = reduced
      ? target
      : THREE.MathUtils.damp(
          ref.current.position.z,
          target,
          12,
          Math.min(dt, 0.08),
        );
    ref.current.position.z = next;
    if (Math.abs(next - target) > 0.001) invalidate();
  });
  return (
    <group
      position={[s.x + Math.cos(a) * dx, y, s.z - Math.sin(a) * dx]}
      rotation={[0, a, 0]}
    >
      <group
        ref={ref}
        position={[0, 0, 0.61]}
        onClick={(e) => {
          if (e.delta < 5) {
            e.stopPropagation();
            onBook();
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={() => setHover(false)}
      >
        <mesh>
          <boxGeometry args={[0.385, 0.66, 0.09]} />
          <meshStandardMaterial color="#b9a681" />
        </mesh>
        <mesh position={[0, 0, 0.055]}>
          <boxGeometry args={[0.405, 0.69, 0.023]} />
          <meshStandardMaterial color="#48503b" />
        </mesh>
        <mesh position={[0, 0, 0.069]}>
          <planeGeometry args={[0.405, 0.69]} />
          <BookJacket cover={book.cover} fallback={jacket} />
        </mesh>
      </group>
    </group>
  );
}
function Hall({
  props,
  loaded,
  progress,
}: {
  props: Props;
  loaded: () => void;
  progress: (e: ProgressEvent) => void;
}) {
  const asset =
    props.low && props.collection.sceneUrl === "/library/hall.glb"
      ? "/library/hall-low.glb"
      : props.collection.sceneUrl;
  const { scene } = useLoader(
    GLTFLoader,
    asset,
    (loader) => loader.setMeshoptDecoder(MeshoptDecoder),
    progress,
  );
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    for (const anchor of [...zones, ...shelves, ...screenAnchors])
      if (!scene.getObjectByName(anchor.node))
        throw Error("Scene anchor missing");
    loaded();
    invalidate();
  }, [scene, loaded, invalidate]);
  return (
    <>
      <primitive object={scene} />
      <hemisphereLight args={["#fff2d8", "#806e56", 1.42]} />
      <directionalLight
        position={[-6, 8, 3]}
        color="#ffeed4"
        intensity={2.35}
      />
      <directionalLight position={[7, 4, -7]} color="#e1e5f1" intensity={0.9} />
      {[-6, 2, 8].map((z) => (
        <pointLight
          key={z}
          position={[0, 5.2, z]}
          color="#ffc583"
          intensity={35}
          distance={15}
        />
      ))}
      {props.collection.volumes
        .filter((v) => v.shelf)
        .map((b) => (
          <Binding
            key={b.kind + "/" + b.slug}
            book={b}
            selected={props.selected === b.slug}
            reduced={props.reduced}
            onBook={() => props.onBook(b)}
          />
        ))}
      {props.collection.zones.includes("entrance") && (
        <mesh
          position={[2.1, 1.25, 2.4]}
          onClick={(e) => {
            if (e.delta < 5) {
              e.stopPropagation();
              props.onGuide();
            }
          }}
        >
          <boxGeometry args={[3.9, 1.6, 1.5]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
      {screenAnchors
        .filter((s) => props.collection.screens.some((a) => a.slot === s.slot))
        .map((s) => (
          <mesh
            key={s.node}
            position={[s.pos[0] - 0.075, s.pos[1], s.pos[2]]}
            onClick={(e) => {
              if (e.delta < 5) {
                e.stopPropagation();
                props.onScreen(s.slot);
              }
            }}
          >
            <boxGeometry args={[0.09, 0.75, 1.16]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        ))}
      {collectionShelves(props.collection)
        .filter((s) => shelves.find((base) => base.slug === s.slug)?.title !== s.title)
        .map((s) => <ShelfPlaque key={s.slug} shelf={s} />)}
      {collectionShelves(props.collection)
        .map((s) => (
          <mesh
            key={s.node}
            position={[s.x, 1.88, s.z]}
            rotation={[0, (s.yaw * Math.PI) / 180, 0]}
            onClick={(e) => {
              if (e.delta < 5) {
                e.stopPropagation();
                props.onShelf(s.slug);
              }
            }}
          >
            <boxGeometry args={[s.zone === "stacks" ? 4.6 : 3.7, 3.8, 1]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        ))}
    </>
  );
}
export default function World(props: Props) {
  const overlay = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [percent, setPercent] = useState<number | null>(null);
  const progress = useMemo(
    () => (e: ProgressEvent) => {
      if (e.lengthComputable && e.total > 0)
        setPercent(Math.round((100 * e.loaded) / e.total));
    },
    [],
  );
  const markReady = useMemo(() => () => setReady(true), []);
  const pins: Pin[] = [];
  if (props.zone === "entrance") {
    for (const [id, at] of [
      ["stacks", [0, 4.06, -9.3]],
      ["computer-station", [8.4, 2, 5.5]],
      ["reading-room", [-7.4, 2, -6]],
    ] as [string, number[]][])
      if (props.collection.zones.includes(id))
        pins.push({
          id,
          label: zones.find((z) => z.slug === id)!.title,
          at,
          action: () => props.onZone(id),
        });
  } else if (props.zone === "computer-station") {
    for (const s of screenAnchors.filter((a) =>
      props.collection.screens.some((s) => s.slot === a.slot),
    ))
      pins.push({
        id: s.slot,
        label: s.slot === "main" ? "Main display" : "Side display",
        at: [s.pos[0] - 0.2, s.pos[1] + 0.47, s.pos[2]],
        action: () => props.onScreen(s.slot),
      });
  } else if (!props.shelf) {
    for (const s of collectionShelves(props.collection).filter((s) => s.zone === props.zone))
      pins.push({
        id: s.slug,
        label: s.title,
        at: [s.x, 3.66, s.z],
        action: () => props.onShelf(s.slug),
      });
  } else {
    for (const b of props.collection.volumes.filter(
      (b) => b.shelf === props.shelf,
    )) {
      const s = shelves.find((s) => s.slug === props.shelf)!;
      const a = (s.yaw * Math.PI) / 180,
        dx =
          (((b.position - 1) % 8) - 3.5) * (s.zone === "stacks" ? 0.51 : 0.405);
      pins.push({
        id: b.slug,
        label: b.title,
        at: [
          s.x + Math.cos(a) * dx + Math.sin(a) * 0.79,
          3.08 - Math.floor((b.position - 1) / 8) * 0.91,
          s.z - Math.sin(a) * dx + Math.cos(a) * 0.79,
        ],
        action: () => props.onBook(b),
      });
    }
  }
  useEffect(() => {
    if (ready) return;
    const timeout = window.setTimeout(props.onError, 35000);
    return () => clearTimeout(timeout);
  }, [ready, props.onError]);
  if (!supportsWebGL()) return <GraphicsFailure onError={props.onError} />;
  return (
    <div
      className="world-viewport"
      data-scene={ready ? "ready" : "loading"}
      aria-label="Interactive library interior"
    >
      <Canvas
        frameloop="demand"
        dpr={props.low ? 1 : [1, 1.5]}
        camera={{ near: 0.08, far: 65 }}
        gl={{ antialias: !props.low, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#392f23");
          gl.domElement.addEventListener("webglcontextlost", props.onError, {
            once: true,
          });
        }}
      >
        <Suspense fallback={null}>
          <Hall props={props} loaded={markReady} progress={progress} />
        </Suspense>
        <AdaptiveResolution />
        <Rig
          override={props.collection.cameras?.[props.zone]}
          zone={props.zone}
          shelf={props.shelf}
          reduced={props.reduced}
          paused={props.paused}
          overlay={overlay}
          pins={pins}
        />
      </Canvas>
      <div ref={overlay} className="world-pins">
        {ready &&
          pins.map((p) => (
            <button
              hidden
              key={p.id}
              data-pin={p.id}
              className={props.shelf ? "book-pin" : ""}
              aria-label={p.label}
              onClick={p.action}
            >
              <i />
              <span>{p.label}</span>
            </button>
          ))}
      </div>
      {!ready && (
        <div className="world-loading" role="status">
          Opening the hall{percent === null ? "…" : " · " + percent + "%"}
        </div>
      )}
    </div>
  );
}
function GraphicsFailure({ onError }: { onError: () => void }) {
  useEffect(() => {
    onError();
  }, [onError]);
  return null;
}

let webGLAvailable: boolean | undefined;
function supportsWebGL() {
  if (webGLAvailable !== undefined) return webGLAvailable;
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    webGLAvailable = !!context;
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webGLAvailable = false;
  }
  return webGLAvailable;
}

export function retryScene(url: string) {
  useLoader.clear(GLTFLoader, url);
  if (url === "/library/hall.glb")
    useLoader.clear(GLTFLoader, "/library/hall-low.glb");
  webGLAvailable = undefined;
}
function AdaptiveResolution() {
  const { setDpr, viewport } = useThree();
  const slow = useRef(0);
  useFrame((_, delta) => {
    if (document.hidden || viewport.dpr <= 1) return;
    slow.current = delta > 0.038 && delta < 0.18 ? slow.current + 1 : 0;
    if (slow.current >= 20) {
      setDpr(1);
      slow.current = 0;
    }
  });
  return null;
}
