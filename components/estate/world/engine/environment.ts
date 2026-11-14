/** Optional atmosphere controls for the continuous scene. No audio is created until
 * a visitor explicitly enables it; report suspension silences the entire graph.
 * Daylight presets are an artistic study, not an astronomical simulation: the
 * surveyed afternoon shadow direction stays fixed, including painted exterior shade.
 */
import * as THREE from "three";

export type EnvironmentState = { daylight: "morning" | "afternoon" | "dusk"; season: "summer" | "autumn" | "winter"; sound: boolean };
export const DEFAULT_ENVIRONMENT: EnvironmentState = { daylight: "afternoon", season: "summer", sound: false };
export type EnvironmentPalette = { sun: string; strength: number; sky: string; foliage: string; grass: string; wind: number };
export function environmentPalette(state: EnvironmentState): EnvironmentPalette {
  const day = { morning: { sun: "#fff0d6", strength: 5.7, sky: "#dbeaff" }, afternoon: { sun: "#ffcf94", strength: 7.5, sky: "#ffffff" }, dusk: { sun: "#ffa876", strength: 2.8, sky: "#ad9bb6" } }[state.daylight];
  const season = { summer: { foliage: "#ffffff", grass: "#ffffff", wind: 1 }, autumn: { foliage: "#dca15a", grass: "#d4caa4", wind: 1.15 }, winter: { foliage: "#a7aa97", grass: "#b3b3a3", wind: .65 } }[state.season];
  return { ...day, ...season };
}
export function environmentState(previous: EnvironmentState, change: Partial<EnvironmentState>): EnvironmentState {
  return {
    daylight: ["morning", "afternoon", "dusk"].includes(change.daylight ?? "") ? change.daylight! : previous.daylight,
    season: ["summer", "autumn", "winter"].includes(change.season ?? "") ? change.season! : previous.season,
    sound: typeof change.sound === "boolean" ? change.sound : previous.sound,
  };
}

export class Environment {
  private current = { ...DEFAULT_ENVIRONMENT };
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private windGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private suspended = false;
  private disposed = false;
  private previous: THREE.Vector3 | null = null;
  private distance = 0;
  private nextBird = 0;
  constructor(private sun: THREE.DirectionalLight, private applyGrounds: (palette: EnvironmentPalette) => void, private invalidate: () => void) {}
  state(): EnvironmentState { return { ...this.current }; }
  refresh() { const p = environmentPalette(this.current); this.sun.color.set(p.sun); this.sun.intensity = p.strength; this.applyGrounds(p); this.invalidate(); }
  /** Call directly from a visitor gesture when enabling sound. Rejections leave it off. */
  async set(change: Partial<EnvironmentState>) {
    if (this.disposed) return;
    this.current = environmentState(this.current, change);
    if (this.current.sound) {
      try {
        this.startAudio();
        await this.context!.resume();
      } catch { this.current.sound = false; }
    }
    this.gain(); this.refresh();
  }
  suspend(value: boolean) { this.suspended = value; this.previous = null; this.distance = 0; this.gain(); }
  private gain() {
    if (this.master && this.context) this.master.gain.setTargetAtTime(this.current.sound && !this.suspended ? .16 : 0, this.context.currentTime, .035);
  }
  private startAudio() {
    if (this.context) return;
    const context = new AudioContext(); this.context = context;
    const master = context.createGain(); master.gain.value = 0; master.connect(context.destination); this.master = master;
    const noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate); this.noise = noise;
    const values = noise.getChannelData(0); let low = 0;
    for (let i=0;i<values.length;i++) { low = .97 * low + .03 * (Math.random()*2-1); values[i]=low*3; }
    const source = context.createBufferSource(); source.buffer = noise; source.loop = true;
    const filter = context.createBiquadFilter(); filter.type="lowpass"; filter.frequency.value=950;
    const wind = context.createGain(); wind.gain.value=.08; this.windGain=wind;
    source.connect(filter).connect(wind).connect(master); source.start();
  }
  /** Walking sound follows travelled distance, never frame rate or scripted time. */
  update(position: THREE.Vector3, walking: boolean) {
    const previous = this.previous; this.previous = position.clone();
    if (!this.current.sound || this.suspended || !this.context || !this.master || !this.noise) return;
    const outside = position.z > 3.15 || position.x < -7.93 || position.x > 7.93 || position.z < -3.15;
    this.windGain?.gain.setTargetAtTime(outside ? .18 : .025, this.context.currentTime, .3);
    if (outside && this.context.currentTime > this.nextBird) {
      this.nextBird = this.context.currentTime + (this.current.season === "winter" ? 24 : 11) + Math.random()*9;
      // A quiet synthetic chirp, explicitly not a claimed site/species recording.
      for(let i=0;i<3;i++){
        const bird=this.context.createOscillator(),gain=this.context.createGain(),at=this.context.currentTime+i*.18;
        bird.type="sine";bird.frequency.setValueAtTime(2800+i*170,at);bird.frequency.exponentialRampToValueAtTime(4200,at+.045);bird.frequency.exponentialRampToValueAtTime(2600,at+.11);
        gain.gain.setValueAtTime(.001,at);gain.gain.exponentialRampToValueAtTime(.035,at+.02);gain.gain.exponentialRampToValueAtTime(.001,at+.12);
        bird.connect(gain).connect(this.master);bird.start(at);bird.stop(at+.13);bird.onended=()=>{bird.disconnect();gain.disconnect();};
      }
    }
    if (!previous || !walking) { this.distance=0; return; }
    const step = Math.hypot(position.x-previous.x,position.z-previous.z);
    if (step>1) { this.distance=0; return; }
    this.distance+=step;
    if(this.distance<.68)return;
    this.distance%=.68;
    const source=this.context.createBufferSource();source.buffer=this.noise;
    const filter=this.context.createBiquadFilter();filter.type="lowpass";filter.frequency.value=outside?2800:700;
    const envelope=this.context.createGain(),now=this.context.currentTime;
    envelope.gain.setValueAtTime(.001,now);envelope.gain.exponentialRampToValueAtTime(outside?.35:.25,now+.006);envelope.gain.exponentialRampToValueAtTime(.001,now+.12);
    source.connect(filter).connect(envelope).connect(this.master);source.start(now,Math.random());source.stop(now+.13);
    source.onended=()=>{source.disconnect();filter.disconnect();envelope.disconnect();};
  }
  dispose() { this.disposed=true; this.master?.disconnect(); void this.context?.close(); this.context=null; this.noise=null; }
}
