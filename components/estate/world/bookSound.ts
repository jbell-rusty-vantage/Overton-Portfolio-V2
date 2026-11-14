/* Paper and board sounds, made on the spot with WebAudio: a leaf going over, a book
   leaving or reaching its shelf. Nothing here is ever called unless the visitor has
   already chosen sound on for the custodian, and nothing plays until the browser has
   let the audio run (a context still suspended is asked to resume and the sound is
   dropped, not queued). */
let context: AudioContext | null = null;
let grain: AudioBuffer | null = null;

function running() {
  try {
    context ??= new AudioContext();
  } catch {
    return null;
  }
  if (context.state !== "running") {
    void context.resume().catch(() => {});
    return null;
  }
  if (!grain) {
    // One second of soft noise, the raw material of every paper sound.
    grain = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = grain.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = last * 0.55 + (Math.random() * 2 - 1) * 0.45;
      data[i] = last;
    }
  }
  return context;
}
function rush(at: number, length: number, from: number, peak: number, to: number, level: number) {
  const a = running();
  if (!a || !grain) return;
  const t = a.currentTime + at;
  const source = a.createBufferSource();
  source.buffer = grain;
  source.loop = true;
  const band = a.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.7;
  band.frequency.setValueAtTime(from, t);
  band.frequency.exponentialRampToValueAtTime(peak, t + length * 0.45);
  band.frequency.exponentialRampToValueAtTime(to, t + length);
  const gain = a.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(level, t + length * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  source.connect(band).connect(gain).connect(a.destination);
  source.start(t, Math.random() * 0.5);
  source.stop(t + length + 0.05);
}
function knock(at: number, level: number) {
  const a = running();
  if (!a) return;
  const t = a.currentTime + at;
  const tone = a.createOscillator();
  tone.type = "sine";
  tone.frequency.setValueAtTime(140, t);
  tone.frequency.exponentialRampToValueAtTime(62, t + 0.12);
  const gain = a.createGain();
  gain.gain.setValueAtTime(level, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  tone.connect(gain).connect(a.destination);
  tone.start(t);
  tone.stop(t + 0.2);
}
/** A leaf going over. */
export function leafSound() {
  rush(0, 0.62, 900, 3800, 1500, 0.05);
}
/** A leaf laid flat again. */
export function leafDown() {
  rush(0, 0.16, 2400, 1600, 900, 0.028);
}
/** A book drawn from its slot. */
export function drawSound() {
  rush(0, 0.42, 320, 700, 420, 0.06);
}
/** A book pushed home: the slide, then the boards meeting the back of the shelf. */
export function homeSound(after: number) {
  rush(after, 0.34, 520, 380, 240, 0.055);
  knock(after + 0.3, 0.07);
}
