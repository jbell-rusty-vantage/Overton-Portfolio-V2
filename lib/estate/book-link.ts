import 'server-only';
import { getEstate } from './catalog';
import { libraryPath } from '@/lib/library/paths';
import type { Volume } from '@/lib/library/types';

/** A reader can offer native entry only when the current authorized estate contains it. */
export async function estateBookLink(volume: Volume, admin = false) {
  if (volume.kind !== 'Project') return undefined;
  const estate = await getEstate(admin ? 'admin' : undefined);
  return estate.program?.world && estate.projects.some(v => v.slug === volume.slug)
    ? libraryPath(admin) + '#book/' + encodeURIComponent(volume.slug)
    : undefined;
}
