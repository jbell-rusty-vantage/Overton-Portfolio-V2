"use client";
/* Browser side of the voice portrait. Audio flows directly between this page and Vercel AI
   Gateway's GPT-Live WebSocket; the site's serverless functions only admit, meter and mint
   a single-use token, and answer delegated questions through the grounded text agent.
   Nothing here records or uploads audio anywhere else. */

export type VoiceState = "connecting" | "listening" | "consulting" | "speaking" | "closing" | "ended" | "error";
export type VoiceSession = { voiceId: string; token: string; expiresAt: number; socketUrl: string; model: string; voice: string; maxSeconds: number; instructions: string };
export type VoiceHandlers = {
  state(state: VoiceState, detail?: string): void;
  /** Live captions: the visitor's current utterance and the portrait's current reply. */
  caption(role: "visitor" | "portrait", text: string): void;
  /** Answer one delegated question with the grounded agent; returns the words to speak. */
  delegate(question: string, signal: AbortSignal): Promise<string>;
  /** Mouth drive: a function returning the current output level 0..1, or null when silent. */
  level(read: (() => number) | null): void;
  remaining(seconds: number): void;
  ended(result: { seconds: number | null; reason: string }): void;
};

const CAPTURE = `class PortraitCapture extends AudioWorkletProcessor {
  constructor(){super();this.step=sampleRate/24000;this.pos=0;this.out=new Int16Array(480);this.n=0;}
  process(inputs){const ch=inputs[0]&&inputs[0][0];if(!ch)return true;
    for(;this.pos<ch.length;this.pos+=this.step){const i=Math.floor(this.pos),f=this.pos-i,a=ch[i],b=i+1<ch.length?ch[i+1]:a,v=a+(b-a)*f;
      this.out[this.n++]=Math.max(-32768,Math.min(32767,Math.round(v*32767)));
      if(this.n===480){this.port.postMessage(this.out.buffer.slice(0));this.n=0;}}
    this.pos-=ch.length;return true;}}
registerProcessor("portrait-capture",PortraitCapture);`;
const toBase64 = (buffer: ArrayBuffer) => { let s = ""; const b = new Uint8Array(buffer); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
const fromBase64 = (text: string) => { const s = atob(text), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; };

export class LiveVoice {
  private ws: WebSocket | null = null;
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private output: GainNode | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private playHead = 0;
  private started = false;
  private closing = false;
  private finished = false;
  private failed = false;
  private session: VoiceSession | null = null;
  /** What the visitor has said since the portrait last spoke: the question to delegate. */
  private utterance = "";
  /** The visitor's last complete utterance, kept when the portrait starts a filler reply. */
  private lastQuestion = "";
  private spoken = "";
  private speakingTimer: ReturnType<typeof setTimeout> | undefined;
  private tasks = new Set<AbortController>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private tick: ReturnType<typeof setInterval> | undefined;
  private usageSeconds: number | null = null;
  private startedAt = 0;
  private onMedia = (event: Event) => { if (event.target instanceof HTMLMediaElement) void this.stop("Another recording started."); };
  private onHide = () => { void this.stop("The page was hidden.", true); };
  constructor(private h: VoiceHandlers, private endpoint = "/api/portrait/voice") {}

  async start() {
    this.h.state("connecting");
    try {
      // Ask for the microphone first: no session is reserved for a visitor who declines.
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
      const response = await fetch(this.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "start" }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(data.reason ? `allowance:${data.reason}` : data.error ?? "Voice conversation is unavailable.");
      this.session = data as VoiceSession;
      const context = this.context = new AudioContext();
      await context.audioWorklet.addModule(URL.createObjectURL(new Blob([CAPTURE], { type: "text/javascript" })));
      this.output = context.createGain();
      this.analyser = context.createAnalyser(); this.analyser.fftSize = 512;
      this.output.connect(this.analyser); this.analyser.connect(context.destination);
      const capture = new AudioWorkletNode(context, "portrait-capture");
      context.createMediaStreamSource(this.stream).connect(capture);
      capture.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (this.started && !this.closing && this.ws?.readyState === WebSocket.OPEN) this.send({ type: "session.input_audio.append", audio: toBase64(event.data) });
      };
      const ws = this.ws = new WebSocket(this.session.socketUrl, ["ai-gateway-realtime.v1", `ai-gateway-auth.${this.session.token}`]);
      ws.onopen = () => this.send({ type: "session.start", session: { model: this.session!.model, store: false, delegation: { type: "client" },
        audio: { format: { type: "audio/pcm", rate: 24000 }, output: { voice: this.session!.voice } }, instructions: this.session!.instructions } });
      ws.onmessage = (event) => { try { this.receive(JSON.parse(String(event.data))); } catch { /* malformed frames are ignored */ } };
      ws.onerror = () => { if (!this.closing) void this.stop("The voice connection failed."); };
      ws.onclose = () => { void this.finish(this.closing ? "ended" : "The voice connection closed."); };
      document.addEventListener("play", this.onMedia, true);
      window.addEventListener("pagehide", this.onHide);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Voice conversation is unavailable.";
      this.failed = true;
      await this.finish(/NotAllowed|Permission/i.test(message) ? "Microphone permission was declined." : message, true);
    }
  }
  private send(event: object) { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(event)); }
  private receive(event: Record<string, unknown>) {
    const type = String(event.type ?? "");
    if (type === "session.started") {
      this.started = true; this.startedAt = Date.now(); this.h.state("listening");
      // GPT-Live streams output audio continuously (silence included); the mouth follows its
      // loudness for the whole session and rests when it is quiet.
      this.h.level(this.read);
      const max = this.session!.maxSeconds;
      this.timers.push(setTimeout(() => this.send({ type: "session.instructions.append", content: "Time is nearly up. Close the conversation graciously now, in one or two sentences, inviting the visitor to read on or return." }), Math.max(5, max - 20) * 1000));
      this.timers.push(setTimeout(() => void this.stop("The conversation reached its time allowance."), max * 1000));
      this.tick = setInterval(() => this.h.remaining(Math.max(0, Math.round(max - (Date.now() - this.startedAt) / 1000))), 1000);
    } else if (type === "session.input_transcript.delta") {
      if (this.spoken) this.spoken = "";
      this.utterance += String(event.delta ?? ""); this.h.caption("visitor", this.utterance.trim());
    } else if (type === "session.output_transcript.delta") {
      // A reply begins: the visitor's utterance is complete (it may still be delegated after
      // a brief filler such as "Permit me a moment"), and the next one starts fresh.
      if (this.utterance.trim()) { this.lastQuestion = this.utterance.trim(); this.utterance = ""; }
      this.spoken += String(event.delta ?? ""); this.h.caption("portrait", this.spoken.trim());
      this.h.state("speaking"); clearTimeout(this.speakingTimer);
      this.speakingTimer = setTimeout(() => { if (!this.closing) this.h.state(this.tasks.size ? "consulting" : "listening"); }, 1600);
    } else if (type === "session.output_audio.delta") {
      this.play(String(event.delta ?? ""));
    } else if (type === "session.delegation.created") {
      const id = String((event.delegation as Record<string, unknown> | undefined)?.id ?? "");
      if (id) void this.answer(id);
    } else if (type === "session.usage.updated" || type === "session.closed") {
      const seconds = Number((event.usage as Record<string, unknown> | undefined)?.seconds);
      if (Number.isFinite(seconds)) this.usageSeconds = seconds;
      if (type === "session.closed") this.ws?.close();
    } else if (/interrupt|truncat|output_audio\.(cleared|cancel)|speech_started/.test(type)) {
      this.flush();
    } else if (type === "error") {
      const error = event.error as Record<string, unknown> | undefined;
      void this.stop(String(error?.message ?? "The voice service reported an error."));
    }
  }
  private async answer(delegationId: string) {
    const question = (this.utterance.trim() || this.lastQuestion).slice(0, 1200);
    if (this.utterance.trim()) { this.lastQuestion = this.utterance.trim(); this.utterance = ""; }
    const task = new AbortController(); this.tasks.add(task);
    this.h.state("consulting");
    let words: string;
    try { words = question ? await this.h.delegate(question, task.signal) : "I did not catch the question. Would you ask it again?"; }
    catch { words = "I am sorry; the library could not be consulted just now. Perhaps ask me again in a moment."; }
    finally { this.tasks.delete(task); }
    if (task.signal.aborted || this.closing) return;
    // Each append is limited to about 500 tokens; validated answers are far shorter.
    this.send({ type: "session.commentary.append", delegation_id: delegationId, content: words.slice(0, 1800) });
    this.h.state("listening");
  }
  private play(base64: string) {
    const context = this.context, output = this.output; if (!context || !output || !base64) return;
    const bytes = fromBase64(base64), samples = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    if (!samples.length) return;
    const buffer = context.createBuffer(1, samples.length, 24000), channel = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) channel[i] = samples[i] / 32768;
    const source = context.createBufferSource(); source.buffer = buffer; source.connect(output);
    this.playHead = Math.max(this.playHead, context.currentTime + 0.03);
    source.start(this.playHead); this.playHead += buffer.duration;
    this.sources.add(source);
    source.onended = () => { this.sources.delete(source); };
  }
  private flush() { for (const s of this.sources) { try { s.stop(); } catch { /* already ended */ } } this.sources.clear(); this.playHead = 0; }
  private samples = new Uint8Array(512);
  /** RMS of the playing reply, shaped for a jaw: quiet consonants close, vowels open. */
  private read = () => {
    const a = this.analyser; if (!a) return 0;
    a.getByteTimeDomainData(this.samples);
    let sum = 0; for (const v of this.samples) { const x = (v - 128) / 128; sum += x * x; }
    return Math.min(1, Math.max(0, (Math.sqrt(sum / this.samples.length) - 0.015) * 5.5));
  };
  /** Graceful close: stop input and new work, ask the gateway to close, then settle. */
  async stop(reason = "ended", hidden = false) {
    if (this.closing || this.finished) return;
    this.closing = true; this.h.state("closing", reason === "ended" ? undefined : reason);
    for (const task of this.tasks) task.abort();
    this.stream?.getTracks().forEach(t => t.stop());
    if (this.started && this.ws?.readyState === WebSocket.OPEN && !hidden) {
      this.send({ type: "session.close" });
      this.timers.push(setTimeout(() => this.ws?.close(), 6000));
    } else { this.ws?.close(); await this.finish(reason, hidden); }
  }
  private async finish(reason: string, keepalive = false) {
    if (this.finished) return; this.finished = true; this.closing = true;
    this.timers.forEach(clearTimeout); clearInterval(this.tick); clearTimeout(this.speakingTimer); this.h.level(null);
    for (const task of this.tasks) task.abort();
    document.removeEventListener("play", this.onMedia, true); window.removeEventListener("pagehide", this.onHide);
    this.stream?.getTracks().forEach(t => t.stop()); this.flush();
    await this.context?.close().catch(() => {});
    if (this.session) await fetch(this.endpoint, { method: "POST", keepalive, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "end", voiceId: this.session.voiceId, ...(this.usageSeconds === null ? {} : { seconds: this.usageSeconds }) }) }).catch(() => {});
    this.h.state(this.failed ? "error" : "ended", reason === "ended" ? undefined : reason);
    this.h.ended({ seconds: this.usageSeconds, reason });
  }
}
