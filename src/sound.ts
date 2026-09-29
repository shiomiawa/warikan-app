// 保存時の「チャリーン」というレジの音。音声ファイルは使わず Web Audio で合成する。

type AudioCtor = typeof AudioContext;
let ctx: AudioContext | null = null;

export function playCoinSound(): void {
  try {
    const Ctor: AudioCtor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0.25;
    out.connect(ctx.destination);

    // 「チャッ」: 引き出しが開くような短いノイズ
    const noiseLen = Math.floor(ctx.sampleRate * 0.06);
    const buffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 3500;
    noise.connect(band).connect(out);
    noise.start(now);

    // 「リーン」: 金属的な高い音を2回
    const ring = (start: number, freqs: number[]) => {
      for (const [i, f] of freqs.entries()) {
        const osc = ctx!.createOscillator();
        const gain = ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(i === 0 ? 0.9 : 0.4, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
        osc.connect(gain).connect(out);
        osc.start(start);
        osc.stop(start + 1);
      }
    };
    ring(now + 0.05, [1568, 3136, 4700]);
    ring(now + 0.17, [2093, 4186, 6270]);
  } catch {
    // 音が出せない環境では何もしない
  }
}
