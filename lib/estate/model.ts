import type { Volume } from "@/lib/library/model";
import type { RoomObject } from "./world";

export type Spread = { key: string; object: string; label: string };
export type ExhibitMedia = { src: string; poster?: string; track?: string };
export type EstateProgram = {
  book: Volume;
  spreads: Spread[];
  scenes: { high: string; low: string } | null;
  portrait: string | null;
  desk: { project: string; main?: ExhibitMedia; side?: ExhibitMedia } | null;
  film: ExhibitMedia | null;
  /** Present when the house program is the continuous edition. */
  world: WorldProgram | null;
};
export type WorldProgram = {
  scenes: { high: string; low: string };
  /** The archival still the custodian is registered to. */
  portrait: string;
  /** Blender-authored furniture kit per tier, when one has been delivered. */
  kit: { high: string; low: string } | null;
  objects: RoomObject[];
  voice: { timeline: string | null; audio: Record<string, string> };
  placements: { book: string; shelf: string; position: number }[];
};
export type EstateData = {
  projects: Volume[];
  program: EstateProgram | null;
  review: boolean;
  admin: boolean;
  unavailable: boolean;
};
export const base = "/travellers-rest/";
export type Room = "approach" | "entry" | "library" | "desk";
