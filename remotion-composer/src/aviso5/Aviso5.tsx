import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {useFonts} from '../gymevo/Fonts';
import tlRaw from './timeline5.json';

/* AVISO 5 - look propio: carril de semanas arriba, subtitulos en MAYUSCULAS con marcador lima,
   narrador en circulo, golpe de camara en cada corte, cierre con telefono. */
const tl: any = tlRaw;
const FPS = 24;
const LIME = '#97d131', INK = '#12161c', TXT = '#f2f4f0', GRAY = '#7b8493';
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pop = (l: number, d = 11, s = 200) => spring({frame: Math.max(0, l), fps: FPS, config: {damping: d, stiffness: s, mass: 0.7}});
const SH: any[] = tl.shots;
const shotAt = (f: number) => SH.find((s) => f >= s.f0 && f < s.f1) || SH[SH.length - 1];
const DESC: Record<string, string> = {
  L01: 'Lia · press de banca', L02a: 'Lia · rutinas copiadas', L03: 'Lia · mira el telefono', L04: 'Lia · sorpresa',
  L05: 'Lia · dolor bueno', L06: 'Lia · ajusta y sigue', L07a: 'Lia · sentadilla', L08: 'Lia · cocina', L09: 'Lia · actitud',
  L10: 'Lia · press de hombro', L11: 'Lia · pulgar arriba', L12: 'Lia · telefono (Plan de hoy)',
};

/* ------------ escena: clip de Flow (si ya llego) o placeholder ------------ */
// clip por escena y segundo de inicio dentro del clip
const HAVE: Record<string, {src: string; ss: number}> = {
  L01: {src: 'aviso5/scenes/L01.mp4', ss: 2.8},
  L02a: {src: 'aviso5/scenes/L02a_v1.mp4', ss: 0.3},
  L03: {src: 'aviso5/scenes/L03.mp4', ss: 0.2},
  L04: {src: 'aviso5/scenes/L04.mp4', ss: 0.3},
  L05: {src: 'aviso5/scenes/L05.mp4', ss: 0.3},
  L06: {src: 'aviso5/scenes/L06.mp4', ss: 0.5},
};
const L02B = {src: 'aviso5/scenes/L02b.mp4', ss: 1.0};
const cardioF = (tl.words['V02'].find((x: any) => x.t.toLowerCase().startsWith('cardio')) || {f: SH[1].f0 + 90}).f - 6;
const Scene = ({s}: {s: any}) => {
  const f = useCurrentFrame();
  const l = f - s.f0;
  const drift = interpolate(l, [0, s.f1 - s.f0], [1.0, 1.05]);
  const h = HAVE[s.scene];
  if (h) {
    return (
      <AbsoluteFill style={{background: INK, overflow: 'hidden'}}>
        <AbsoluteFill style={{transform: `scale(${drift})`}}>
          <Sequence from={s.f0} durationInFrames={s.f1 - s.f0}>
            <OffthreadVideo src={staticFile(h.src)} startFrom={Math.round(h.ss * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </Sequence>
          {s.scene === 'L02a' && (
            <Sequence from={cardioF} durationInFrames={s.f1 - cardioF}>
              <OffthreadVideo src={staticFile(L02B.src)} startFrom={Math.round(L02B.ss * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </Sequence>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  const d2 = interpolate(l, [0, s.f1 - s.f0], [1.04, 1.1]);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(165deg,#222c3d 0%,#161c27 55%,#10141b 100%)', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${d2})`, opacity: 0.5, backgroundImage: 'linear-gradient(#ffffff10 2px,transparent 2px),linear-gradient(90deg,#ffffff10 2px,transparent 2px)', backgroundSize: '90px 90px'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontFamily: 'Poppins', color: '#ffffff35'}}>
        <div style={{fontSize: 150, fontWeight: 800, letterSpacing: 6}}>{s.scene}</div>
        <div style={{fontSize: 40, fontWeight: 600}}>{DESC[s.scene] || ''}</div>
        <div style={{fontSize: 28, marginTop: 14}}>(aqui va el clip de Flow)</div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------ carril de semanas ------------ */
const WEEK_START: Record<number, number> = {};
SH.forEach((s) => { if (s.week > 0 && WEEK_START[s.week] === undefined) WEEK_START[s.week] = s.f0; });
const Rail = () => {
  const f = useCurrentFrame();
  const GAP = 112, X0 = 560;
  const xs = [0, 1, 2, 3, 4].map((i) => X0 + i * GAP);
  const cur = [1, 2, 3, 4, 5].filter((w) => WEEK_START[w] !== undefined && f >= WEEK_START[w]).length;
  const o = clamp(f / 10);
  return (
    <div style={{position: 'absolute', left: 0, top: 1228, width: 1080, height: 70, opacity: o}}>
      <div style={{position: 'absolute', left: X0, top: 31, width: GAP * 4, height: 7, borderRadius: 4, background: '#ffffff30'}} />
      <div style={{position: 'absolute', left: X0, top: 31, width: Math.max(0, (cur - 1) * GAP), height: 7, borderRadius: 4, background: LIME}} />
      {xs.map((x, i) => {
        const w = i + 1; const done = cur >= w; const st = WEEK_START[w];
        const sc = st !== undefined && f >= st ? 1 + 0.35 * Math.max(0, 1 - (f - st) / 14) : 1;
        return (
          <div key={i} style={{position: 'absolute', left: x - 24, top: 10, width: 48, height: 48, borderRadius: 24, transform: `scale(${sc})`, background: done ? LIME : INK, border: `4px solid ${done ? LIME : '#ffffff55'}`, color: done ? INK : '#c8cfd9', fontFamily: 'Poppins', fontWeight: 800, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: done ? '0 0 22px #97d13170' : '0 4px 14px #0008'}}>
            {w}
          </div>
        );
      })}
    </div>
  );
};

/* ------------ narrador en circulo ------------ */
const Narrator = ({s}: {s: any}) => {
  const f = useCurrentFrame();
  const l = f - s.f0;
  const y = (1 - pop(l, 13, 200)) * 200;
  const pad = String(f).padStart(5, '0');
  return (
    <div style={{position: 'absolute', left: 0, top: 1292, width: 470, height: 628, transform: `translateY(${y}px)`}}>
      <Img src={staticFile(`aviso5/pip/${pad}.png`)} style={{width: 470, height: 628}} />
    </div>
  );
};

/* ------------ subtitulos ------------ */
type W = {t: string; imp: boolean; f: number};
type Chunk = {v: string; words: W[]; f0: number; f1: number};
const CHUNKS: Chunk[] = [];
Object.keys(tl.words).forEach((v) => {
  let cur: W[] = [];
  const flush = () => { if (cur.length) { CHUNKS.push({v, words: cur, f0: cur[0].f, f1: 0}); cur = []; } };
  const ws: W[] = tl.words[v];
  ws.forEach((w, i) => {
    if (w.t === 'Evo' || w.t === 'App') return;
    if (w.t === 'A' && ws[i - 1] && ws[i - 1].t === 'I') return;
    cur.push(w);
    if (/[,.:]$/.test(w.t) || cur.length >= 3 || (cur.length >= 2 && w.t.length > 8)) flush();
  });
  flush();
});
const vEnd = (v: string) => Math.round((tl.voices[v].T + tl.voices[v].dv) * FPS);
CHUNKS.forEach((c, i) => { const n = CHUNKS[i + 1]; c.f1 = n && n.v === c.v ? n.f0 : vEnd(c.v) + 10; });
const disp = (w: W) => (w.t === 'Yim' ? 'GymEvoApp' : w.t === 'I' ? 'IA' : w.t).toUpperCase();

const Captions = () => {
  const f = useCurrentFrame();
  const s = shotAt(f);
  if (s.scene === 'FIN') return null;
  const c = CHUNKS.find((k) => f >= k.f0 - 1 && f < k.f1);
  if (!c) return null;
  const l = f - c.f0;
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 930, height: 260, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: '8px 16px', transform: `scale(${0.94 + 0.06 * pop(l, 14, 240)})`, opacity: clamp(l / 3 + 0.4)}}>
      {c.words.map((w, i) => {
        if (f < w.f - 1) return null;
        const nxt = c.words[i + 1];
        const active = f >= w.f && (!nxt || f < nxt.f);
        const p = pop(f - w.f, 10, 260);
        return (
          <span key={i} style={{display: 'inline-block', position: 'relative', fontFamily: 'Poppins', fontWeight: 800, fontSize: w.imp ? 96 : 82, lineHeight: 1.05, letterSpacing: 1, padding: '4px 8px', transform: `scale(${0.75 + 0.25 * p * (active ? 1.08 : 1)})`, color: active || w.imp ? LIME : TXT, WebkitTextStroke: '12px ' + INK, paintOrder: 'stroke fill', textShadow: '0 8px 22px #000b'}}>
            {disp(w)}
          </span>
        );
      })}
    </div>
  );
};

/* ------------ cartel SEMANA n ------------ */
const WeekCard = () => {
  const f = useCurrentFrame();
  const hits: {f: number; n: number}[] = [];
  const first = (v: string, p: string, n: number) => { const w = tl.words[v].find((x: W) => x.t.toLowerCase().startsWith(p)); if (w) hits.push({f: w.f, n}); };
  first('V02', 'semana', 1); first('V04', 'semana', 2); first('V07', 'semana', 3); first('V09', 'semana', 4); first('V10', 'quinta', 5);
  const h = hits.find((x) => f >= x.f && f < x.f + 40);
  if (!h) return null;
  const l = f - h.f;
  const o = clamp(l / 4) * clamp((40 - l) / 6);
  const x = interpolate(l, [0, 12], [-420, 0], {easing: ease, extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 740, textAlign: 'center', opacity: o, transform: `translateX(${x}px)`, fontFamily: 'Poppins', fontWeight: 800}}>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 26, background: LIME, color: INK, padding: '10px 54px 10px 36px', borderRadius: 24, boxShadow: '0 16px 60px #97d13160'}}>
        <span style={{fontSize: 70, letterSpacing: 3}}>SEMANA</span>
        <span style={{fontSize: 170, lineHeight: 1}}>{h.n}</span>
      </div>
    </div>
  );
};

/* ------------ cierre ------------ */
const Chip = ({s}: {s: any}) => {
  const f = useCurrentFrame(); const l = f - (s.f0 + 20);
  if (s.scene !== 'L12' || l < 0) return null;
  const y = interpolate(l, [0, 12], [80, 0], {easing: ease, extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center', opacity: clamp(l / 5), transform: `translateY(${y}px)`}}>
      <span style={{display: 'inline-block', fontFamily: 'Poppins', fontWeight: 800, fontSize: 54, color: INK, background: LIME, padding: '14px 40px', borderRadius: 60, boxShadow: '0 10px 40px #97d13170'}}>7 DÍAS GRATIS · SIN TARJETA</span>
    </div>
  );
};
const EndCard = ({s}: {s: any}) => {
  const f = useCurrentFrame(); const l = f - s.f0;
  const a = pop(l, 13, 160), b = pop(l - 8, 13, 160), c = pop(l - 18, 12, 190);
  const float = Math.sin(l / 14) * 10;
  const pulse = 1 + 0.035 * Math.sin(l / 5);
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 38%,#2a3a14 0%,${INK} 62%)`, fontFamily: 'Poppins'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 240, textAlign: 'center', transform: `scale(${a})`}}>
        <Img src={staticFile('gymevo/logo_full.png')} style={{width: 470}} />
      </div>
      <div style={{position: 'absolute', left: 340, top: 600, width: 400, height: 650, borderRadius: 54, background: '#0b0e13', border: '8px solid #2c3442', boxShadow: '0 40px 90px #000a, 0 0 70px #97d13125', overflow: 'hidden', transform: `translateY(${float + (1 - b) * 120}px) rotate(${-4 + 2 * (1 - b)}deg) scale(${0.86 + 0.14 * b})`, opacity: clamp(b)}}>
        <Img src={staticFile('aviso5/plan.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1275, textAlign: 'center', opacity: clamp(c), transform: `translateY(${(1 - c) * 50}px)`}}>
        <div style={{display: 'inline-block', transform: `scale(${pulse})`, background: LIME, color: INK, fontWeight: 800, fontSize: 56, padding: '20px 62px', borderRadius: 70, boxShadow: '0 12px 50px #97d13180'}}>DESCARGAR GRATIS</div>
        <div style={{color: TXT, fontWeight: 700, fontSize: 42, marginTop: 28}}>Pago único · tú eliges el tiempo</div>
        <div style={{color: GRAY, fontWeight: 600, fontSize: 36, marginTop: 8}}>gymevoapp.com</div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------ composicion ------------ */
export const Aviso5 = () => {
  useFonts();
  const f = useCurrentFrame();
  const s = shotAt(f);
  const l = f - s.f0;
  const punch = s.i > 1 ? 0.06 * Math.max(0, 1 - l / 9) ** 2 : 0;
  const flash = s.i > 1 ? 0.35 * Math.max(0, 1 - l / 4) : 0;
  const fin = s.scene === 'FIN';
  return (
    <AbsoluteFill style={{background: INK}}>
      <AbsoluteFill style={{transform: `scale(${1 + punch})`}}>
        {fin ? <EndCard s={s} /> : <Scene s={s} />}
      </AbsoluteFill>
      {!fin && <Rail />}
      {!fin && <Narrator s={s} />}
      <WeekCard />
      <Chip s={s} />
      <Captions />
      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
