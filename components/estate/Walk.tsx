"use client";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import * as THREE from "three";
import positions from "@/assets/travellers-rest/anchors.json";
import type { Room } from "@/lib/estate/model";
import type { Leaf } from "@/lib/library/types";

const stops = ["approach", "entry", "library", "desk"] as const;
const vector = (xyz: number[]) => new THREE.Vector3(xyz[0], xyz[1], xyz[2]);
const eyes = stops.map((r) =>
  vector(positions[("camera." + r) as keyof typeof positions]),
);
const targets = [
  vector([0, 2.6, 0]),
  vector([0, 1.76, -2]),
  vector([-7.26, 2.1, 0]),
  vector([-5.15, 1.42, 0.83]),
];
const crossings = [
  [vector([0.1, 2.02, 7]), vector([0, 2.05, 3.8])],
  [vector([0.25, 2.05, 1.77]), vector([-1.55, 2.05, 1.77])],
  [vector([-3.74, 2.14, 1.71])],
];
function route(from: number, to: number, start: THREE.Vector3) {
  const points = [start.clone()];
  const dir = Math.sign(to - from);
  for (let i = from; i !== to; i += dir) {
    const segment = crossings[Math.min(i, i + dir)];
    points.push(...(dir > 0 ? segment : [...segment].reverse()), eyes[i + dir]);
  }
  if (points.length === 1) points.push(eyes[to]);
  const curve = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 1; i < points.length; i++)
    curve.add(new THREE.LineCurve3(points[i - 1], points[i]));
  return curve;
}
function Camera({
  room,
  instant,
  skip,
}: {
  room: Room;
  instant: boolean;
  skip: number;
}) {
  const { camera, invalidate, gl } = useThree();
  const current = useRef(0);
  const look = useRef(targets[0].clone());
  const travel = useRef<{
    path: THREE.CurvePath<THREE.Vector3>;
    origin: THREE.Vector3;
    to: number;
    time: number;
    duration: number;
  } | null>(null);
  const canvas = gl.domElement;
  useEffect(() => {
    const to = stops.indexOf(room);
    const from = current.current;
    const path = route(from, to, camera.position);
    if (instant || from === to) {
      camera.position.copy(eyes[to]);
      look.current.copy(targets[to]);
      camera.lookAt(look.current);
      travel.current = null;
    } else {
      travel.current = {
        path,
        origin: look.current.clone(),
        to,
        time: 0,
        duration: Math.min(3.2, Math.max(1.4, path.getLength() * 0.19)),
      };
    }
    current.current = to;
    invalidate();
  }, [room, instant, skip, camera, invalidate]);
  useFrame((_, delta) => {
    const path = travel.current;
    if (!path) return;
    path.time += Math.min(delta, 0.1);
    const t = Math.min(1, path.time / path.duration),
      ease = t * t * (3 - 2 * t);
    camera.position.copy(path.path.getPointAt(ease));
    look.current.lerpVectors(path.origin, targets[path.to], ease);
    camera.lookAt(look.current);
    if (t === 1) travel.current = null;
    else invalidate();
  });
  useEffect(() => {
    canvas.setAttribute("tabindex", "0");
    canvas.setAttribute(
      "aria-label",
      "House walkthrough. Drag or use arrow keys to look around. W and S move along the visit.",
    );
    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    let pointer: number | null = null,
      lastX = 0,
      lastY = 0;
    function turn(dx: number, dy: number) {
      if (travel.current) return;
      euler.setFromQuaternion(camera.quaternion, "YXZ");
      euler.y -= dx;
      euler.x = THREE.MathUtils.clamp(euler.x - dy, -1.15, 1.15);
      camera.quaternion.setFromEuler(euler);
      camera
        .getWorldDirection(look.current)
        .multiplyScalar(3)
        .add(camera.position);
      invalidate();
    }
    const down = (e: PointerEvent) => {
      pointer = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (pointer === e.pointerId) {
        turn((e.clientX - lastX) * 0.004, (e.clientY - lastY) * 0.004);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const up = () => {
      pointer = null;
    };
    const key = (e: KeyboardEvent) => {
      const dirs: Record<string, [number, number]> = {
        ArrowLeft: [-0.12, 0],
        ArrowRight: [0.12, 0],
        ArrowUp: [0, -0.09],
        ArrowDown: [0, 0.09],
      };
      if (dirs[e.key]) {
        e.preventDefault();
        turn(...dirs[e.key]);
      }
      if (e.key.toLowerCase() === "w" || e.key.toLowerCase() === "s") {
        e.preventDefault();
        const next = THREE.MathUtils.clamp(
          current.current + (e.key.toLowerCase() === "w" ? 1 : -1),
          0,
          3,
        );
        window.location.hash = next === 0 ? "walk" : stops[next];
      }
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    canvas.addEventListener("keydown", key);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      canvas.removeEventListener("keydown", key);
    };
  }, [canvas, camera, invalidate]);
  return null;
}
function Geometry({ url, awake }: { url: string; awake: boolean }) {
  const gltf = useLoader(GLTFLoader, url, (l) =>
    l.setMeshoptDecoder(MeshoptDecoder),
  );
  const object = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const { invalidate } = useThree();
  const { gl } = useThree();
  useEffect(() => {
    gl.domElement.setAttribute("data-scene", "ready");
  }, [gl]);
  useEffect(() => {
    const clip = gltf.animations[0];
    if (!clip || !awake) return;
    const mixer = new THREE.AnimationMixer(object);
    const action = mixer.clipAction(clip);
    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce, 1).play();
    mixer.setTime(clip.duration);
    invalidate();
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(object);
    };
  }, [gltf, object, awake, invalidate]);
  return <primitive object={object} />;
}
// The accessible reader and the moving leaf on the table use the same projected text.
function Paper({ leaf, instant }: { leaf: Leaf; instant: boolean }) {
  const mesh = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const { invalidate } = useThree();
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 724;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#f3e9c9";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#383e30";
    ctx.font = "15px Georgia";
    ctx.fillText("TRAVELLERS REST", 32, 47);
    ctx.font = "26px Georgia";
    ctx.fillText(
      leaf.blocks.find((b) => b.kind === "heading")?.text ?? leaf.title,
      32,
      100,
      445,
    );
    ctx.font = "20px Georgia";
    let y = 147;
    for (const block of leaf.blocks.filter((b) => b.kind === "text")) {
      let line = "";
      for (const word of block.text.split(/\s+/)) {
        const next = line ? line + " " + word : word;
        if (ctx.measureText(next).width > 442) {
          ctx.fillText(line, 32, y);
          y += 27;
          line = word;
        } else line = next;
      }
      if (line) {
        ctx.fillText(line, 32, y);
        y += 44;
      }
    }
    const page = new THREE.CanvasTexture(c);
    page.colorSpace = THREE.SRGBColorSpace;
    return page;
  }, [leaf]);
  useEffect(() => {
    elapsed.current = instant ? 1 : 0;
    invalidate();
    return () => texture.dispose();
  }, [texture, instant, invalidate]);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    elapsed.current = Math.min(1, elapsed.current + Math.min(0.1, delta) * 1.8);
    const f = elapsed.current;
    mesh.current.rotation.y = -Math.PI * (1 - f) * (1 - f);
    if (f < 1) invalidate();
  });
  return (
    <group position={[-4.86, 1.48, 0.72]} rotation={[-Math.PI / 2, 0, 0]}>
      <group ref={mesh}>
        <mesh position={[0.135, 0, 0]}>
          <planeGeometry args={[0.27, 0.38]} />
          <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
function Target({
  position,
  size,
  onSelect,
}: {
  position: number[];
  size: [number, number, number];
  onSelect: () => void;
}) {
  return (
    <mesh
      position={vector(position)}
      onClick={(e) => {
        if (e.delta < 5) {
          e.stopPropagation();
          onSelect();
        }
      }}
    >
      <boxGeometry args={size} />
      <meshBasicMaterial
        transparent
        opacity={0}
        depthWrite={false}
        colorWrite={false}
      />
    </mesh>
  );
}
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p className="ea-stage-fallback">
        The 3D view is unavailable. Select Room view or use the room directory
        below.
      </p>
    ) : (
      this.props.children
    );
  }
}
export default function Walk({
  room,
  url,
  awake,
  instant,
  skip,
  meet,
  read,
  examine,
  leaf,
  backend,
}: {
  room: Room;
  url: string;
  awake: boolean;
  instant: boolean;
  skip: number;
  meet: () => void;
  read: () => void;
  examine: (id: string) => void;
  leaf?: Leaf;
  backend: "webgl2" | "webgpu";
}) {
  return (
    <Boundary>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        gl={
          backend === "webgpu"
            ? async (props) => {
                const { WebGPURenderer } = await import("three/webgpu");
                const renderer = new WebGPURenderer({
                  canvas: props.canvas as HTMLCanvasElement,
                  antialias: true,
                });
                await renderer.init();
                renderer.domElement.setAttribute(
                  "data-backend",
                  (renderer.backend as { isWebGPUBackend?: boolean })
                    .isWebGPUBackend
                    ? "webgpu"
                    : "webgl2-fallback",
                );
                return renderer;
              }
            : undefined
        }
        onCreated={({ gl }) => {
          if (!gl.domElement.hasAttribute("data-backend"))
            gl.domElement.setAttribute("data-backend", "webgl2");
        }}
        camera={{ position: [4.6, 2.4, 18], fov: 61, near: 0.035, far: 100 }}
        fallback={
          <p className="ea-stage-fallback">
            Select Room view to continue without 3D.
          </p>
        }
      >
        <color attach="background" args={["#c8cbb4"]} />
        <hemisphereLight args={["#fff4da", "#776549", 1.35]} />
        <directionalLight
          position={[-7, 12, 16]}
          intensity={2.15}
          color="#ffdfa6"
        />
        <pointLight
          position={[-4, 2.5, 2.7]}
          intensity={7}
          color="#ffe3ac"
          distance={8}
        />
        <Suspense fallback={null}>
          <Geometry url={url} awake={awake} />
          <Camera room={room} instant={instant} skip={skip} />
          {leaf && <Paper leaf={leaf} instant={instant} />}
          {room === "approach" && (
            <Target
              position={positions["door.south"]}
              size={[1.5, 2.8, 0.8]}
              onSelect={() => {
                window.location.hash = "entry";
              }}
            />
          )}
          {room === "entry" && (
            <>
              <Target
                position={positions["door.library"]}
                size={[0.3, 2.4, 1.35]}
                onSelect={() => {
                  window.location.hash = "library";
                }}
              />
              <Target
                position={[1.18, 1.42, -0.38]}
                size={[0.8, 0.12, 1.4]}
                onSelect={() => examine("tennessee-map")}
              />
            </>
          )}
          {(room === "library" || room === "desk") && (
            <>
              <Target
                position={positions["portrait.judge"]}
                size={[0.2, 1.18, 0.95]}
                onSelect={meet}
              />
              <Target
                position={positions["book.companion"]}
                size={[0.62, 0.38, 0.55]}
                onSelect={read}
              />
              <Target
                position={positions["book.reports"]}
                size={[0.48, 0.28, 0.38]}
                onSelect={() => examine("murfree-leeper")}
              />
              <Target
                position={positions["shelf.reports"]}
                size={[0.65, 2, 1.4]}
                onSelect={() => examine("murfree-leeper")}
              />
              {awake && (
                <pointLight
                  position={[-5.3, 1.93, 1.05]}
                  intensity={2.8}
                  color="#ffcf78"
                  distance={2.2}
                />
              )}
            </>
          )}
        </Suspense>
      </Canvas>
    </Boundary>
  );
}
