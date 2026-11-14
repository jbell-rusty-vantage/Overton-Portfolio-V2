"use client";
import { Component, Suspense, useEffect, useRef, type ReactNode } from "react";
import {
  Canvas,
  useLoader,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

type Model = "house" | "library";

function Geometry({ model, enter }: { model: Model; enter: () => void }) {
  const gltf = useLoader(GLTFLoader, "/travellers-rest/" + model + ".glb");
  const activation =
    model === "house"
      ? /south.door|door.panels|doorsteps|porch.posts|pediment/i
      : /reports|writing.table|writing.surface|lines.of.type|page.edges/i;
  function isDestination(event: ThreeEvent<PointerEvent | MouseEvent>) {
    const nearest = event.intersections[0]?.object;
    return activation.test(String(nearest?.userData.name ?? nearest?.name));
  }
  return (
    <primitive
      object={gltf.scene}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        if (e.nativeEvent.target instanceof HTMLCanvasElement)
          e.nativeEvent.target.style.cursor = isDestination(e)
            ? "pointer"
            : "grab";
      }}
      onPointerLeave={(e: ThreeEvent<PointerEvent>) => {
        if (e.nativeEvent.target instanceof HTMLCanvasElement)
          e.nativeEvent.target.style.cursor = "";
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta < 4 && isDestination(e)) enter();
      }}
    />
  );
}

function ViewControls({ model, turn }: { model: Model; turn: number }) {
  const { camera, gl, invalidate, size } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  const lastTurn = useRef(turn);
  useEffect(() => {
    const exterior = model === "house";
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.target.set(
      ...((exterior ? [0, 3.7, -1] : [-6.52, 1.58, 0.28]) as [
        number,
        number,
        number,
      ]),
    );
    camera.position.set(
      ...((exterior ? [10, 8, 23] : [-2.42, 2.26, -1.89]) as [
        number,
        number,
        number,
      ]),
    );
    if (exterior && size.width < size.height)
      camera.position.multiplyScalar(1.32);
    orbit.enablePan = false;
    orbit.minDistance = exterior ? 14 : 2.6;
    orbit.maxDistance = exterior ? 45 : 4.95;
    orbit.minPolarAngle = exterior ? 0.35 : 1.17;
    orbit.maxPolarAngle = exterior ? 1.48 : 1.52;
    if (!exterior) {
      orbit.minAzimuthAngle = 1.24;
      orbit.maxAzimuthAngle = 2.21;
    }
    orbit.update();
    orbit.addEventListener("change", () => invalidate());
    controls.current = orbit;
    invalidate();
    return () => {
      orbit.dispose();
      controls.current = null;
    };
  }, [camera, gl, model, invalidate, size.width, size.height]);
  useEffect(() => {
    const orbit = controls.current;
    const delta = turn - lastTurn.current;
    lastTurn.current = turn;
    if (!orbit || !delta) return;
    const offset = camera.position.clone().sub(orbit.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), delta * 0.23);
    camera.position.copy(orbit.target).add(offset);
    orbit.update();
  }, [camera, turn]);
  return null;
}

class ModelBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p className="tr-fallback">
        3D is unavailable here. Choose the photograph to continue the visit.
      </p>
    ) : (
      this.props.children
    );
  }
}

export default function HouseModel({
  model,
  turn,
  enter,
}: {
  model: Model;
  turn: number;
  enter: () => void;
}) {
  return (
    <ModelBoundary>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.6]}
        camera={{ fov: model === "house" ? 43 : 61, near: 0.06, far: 180 }}
        fallback={
          <p className="tr-fallback">
            Choose the photograph to continue without 3D.
          </p>
        }
      >
        <color
          attach="background"
          args={[model === "house" ? "#dedbd0" : "#bdb7a7"]}
        />
        <hemisphereLight args={["#fff5db", "#a38c79", 1.65]} />
        <directionalLight
          position={[-4, 9, 8]}
          intensity={2.4}
          color="#fff1d0"
        />
        <directionalLight
          position={[7, 4, -4]}
          intensity={0.6}
          color="#e8efff"
        />
        <Suspense fallback={null}>
          <Geometry model={model} enter={enter} />
        </Suspense>
        <ViewControls model={model} turn={turn} />
      </Canvas>
    </ModelBoundary>
  );
}
