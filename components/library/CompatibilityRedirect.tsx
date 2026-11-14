"use client";
import { useEffect } from "react";
export default function CompatibilityRedirect({ destination }: { destination: string }) {
  useEffect(() => { location.replace(destination + location.hash); }, [destination]);
  return <p><a href={destination}>Continue to the preview</a></p>;
}
