"use client";
import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// Keep the engraved binding visible while custom art loads or if the image fails.
export default function BookJacket({ cover, fallback }: { cover?: string; fallback: THREE.Texture }) {
  const [art, setArt] = useState<{ url: string; map: THREE.Texture } | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!cover) return;
    let map: THREE.CanvasTexture | undefined;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 384;
      canvas.height = 640;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Letterbox the original artwork instead of cropping a printed title.
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.fillStyle = "#26382d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      map = new THREE.CanvasTexture(canvas);
      map.colorSpace = THREE.SRGBColorSpace;
      setArt({ url: cover, map });
      invalidate();
    };
    img.src = cover;
    return () => { img.onload = null; map?.dispose(); };
  }, [cover, invalidate]);
  return <meshBasicMaterial map={art && art.url === cover ? art.map : fallback} toneMapped={false} />;
}
