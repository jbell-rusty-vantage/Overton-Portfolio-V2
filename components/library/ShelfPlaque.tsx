"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Shelf } from "@/lib/library/model";

// Face the same way as the brass fascia in build.py: cabinet(). An opaque
// insert covers its baked lettering when the curator changes the shelf title.
export default function ShelfPlaque({ shelf }: { shelf: Shelf }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#243d31";
    ctx.fillRect(0, 0, 1024, 96);
    ctx.fillStyle = "#f5e0a7";
    ctx.font = "54px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(shelf.title.toUpperCase(), 512, 49, 970);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [shelf.title]);
  useEffect(() => () => texture?.dispose(), [texture]);
  const angle = THREE.MathUtils.degToRad(shelf.yaw);
  if (!texture) return null;
  return (
    <mesh position={[shelf.x + 0.59 * Math.sin(angle), 3.64, shelf.z + 0.59 * Math.cos(angle)]}
      rotation={[0, angle, 0]}>
      <planeGeometry args={[2.55, 0.215]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
