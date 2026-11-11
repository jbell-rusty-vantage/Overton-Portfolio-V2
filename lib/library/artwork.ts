// Approved image files bundled with the app. No hostnames, traversal, SVG or query strings.
export const artworkPrefix = "/library/artwork/";
export function artworkFilename(value: string) {
  return /^[a-z0-9][a-z0-9_-]{0,95}\.(webp|png|jpe?g|avif)$/.test(value);
}
export function bundledArtwork(value: unknown) {
  return typeof value === "string" && value.startsWith(artworkPrefix) &&
    artworkFilename(value.slice(artworkPrefix.length)) ? value : undefined;
}

// Short screen recordings bundled with the app (larger ones belong in Blob).
export const recordingPrefix = "/library/recordings/";
export function bundledRecording(value: unknown) {
  return typeof value === "string" && value.startsWith(recordingPrefix) &&
    /^[a-z0-9][a-z0-9_-]{0,95}.mp4$/.test(value.slice(recordingPrefix.length)) ? value : undefined;
}
