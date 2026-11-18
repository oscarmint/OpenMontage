import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {useFonts} from '../gymevo/Fonts';
import tlRaw from './timeline5.json';
import matteRaw from './mattes.json';

/* AVISO 5 - capa grafica:
   texto gigante DETRAS de Lia (mascara por fotograma), subtitulos con revelado de mascara, carril de semanas con
   cartel que "vuela" al punto de la semana (movimiento encadenado), camara que sigue el telefono / la app,
   transicion con el logo como mascara y HUD anclado al cuerpo. Todo sincronizado con las palabras de la voz. */
const tl: any = tlRaw;
const MT: Record<string, {top: number; cx: number; bot: number; l: number; r: number}[]> = matteRaw as any;
const FPS = 24;
const LIME = '#97d131', INK = '#12161c', TXT = '#f2f4f0', GRAY = '#7b8493';
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pop = (l: number, d = 11, s = 200) => spring({frame: Math.max(0, l), fps: FPS, config: {damping: d, stiffness: s, mass: 0.7}});
const SH: any[] = tl.shots;
const shotAt = (f: number) => SH.find((s) => f >= s.f0 && f < s.f1) || SH[SH.length - 1];
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zñ]/g, '');
const wfind = (v: string, p: string): number => { const w = tl.words[v].find((x: any) => norm(x.t).startsWith(p)); return w ? w.f : SH[0].f0; };
const DESC: Record<string, string> = {L08: 'Lia · cocina'};

/* ------------ configuracion de escenas ------------ */
type Cfg = {
  src: string; ss: number; rate?: number; matte?: string;
  behind?: {text: string; v: string; w: string};
  follow?: {x: number; y: number; z: number; v: string; w: string};
  hud?: boolean;
};
const HAVE: Record<string, Cfg> = {
  L01: {src: 'aviso5/scenes/L01.mp4', ss: 2.8},
  L02a: {src: 'aviso5/scenes/L02a_v1.mp4', ss: 0.3},
  L03: {src: 'aviso5/scenes/L03.mp4', ss: 0.2, follow: {x: 540, y: 1150, z: 1.22, v: 'V03', w: 'plan'}},
  L04: {src: 'aviso5/scenes/L04.mp4', ss: 0.3},
  L05: {src: 'aviso5/scenes/L05.mp4', ss: 0.3},
  L06: {src: 'aviso5/scenes/L06.mp4', ss: 0.5},
  L07a: {src: 'aviso5/scenes/L07b.mp4', ss: 0, rate: 0.78, },
  L09: {src: 'aviso5/scenes/L09.mp4', ss: 0.3, },
  L10: {src: 'aviso5/scenes/L10.mp4', ss: 0.3, matte: 'L10', hud: true},
  L11: {src: 'aviso5/scenes/L11.mp4', ss: 0, rate: 0.8, },
  L12: {src: 'aviso5/scenes/L12.mp4', ss: 0.1, rate: 0.72, follow: {x: 270, y: 548, z: 1.85, v: 'V12', w: 'gratis'}},
};
const L02B = {src: 'aviso5/scenes/L02b.mp4', ss: 1.0};
const cardioF = (tl.words['V02'].find((x: any) => norm(x.t).startsWith('cardio')) || {f: SH[1].f0 + 90}).f - 6;

/* ------------ video de escena ------------ */
const Vid = ({cfg, s, shift = 0}: {cfg: Cfg; s: any; shift?: number}) => {
  const rate = cfg.rate || 1;
  return (
    <Sequence from={s.f0 - shift} durationInFrames={s.f1 - s.f0 + shift}>
      <OffthreadVideo src={staticFile(cfg.src)} startFrom={Math.max(0, Math.round(cfg.ss * FPS) - Math.round(shift * rate))} playbackRate={rate} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </Sequence>
  );
};
const clipIdx = (cfg: Cfg, s: any, f: number) => Math.round(cfg.ss * FPS + (f - s.f0) * (cfg.rate || 1));

/* HUD anclado al cuerpo (repeticiones) usando la mascara */
const REPS: Record<string, number[]> = {};
Object.keys(MT).forEach((k) => {
  const a = MT[k].map((x) => x.top); const lo = Math.min(...a), hi = Math.max(...a);
  const thr = lo + 0.28 * (hi - lo); const ev: number[] = []; let inside = false; let best = 0;
  a.forEach((v, i) => { if (v < thr) { if (!inside) { inside = true; best = i; } if (v < a[best]) best = i; } else if (inside) { ev.push(best); inside = false; } });
  if (inside) ev.push(best);
  REPS[k] = ev;
});
const Hud = ({cfg, s, f}: {cfg: Cfg; s: any; f: number}) => {
  const idx = Math.min(clipIdx(cfg, s, f), MT[cfg.matte!].length - 1);
  const m = MT[cfg.matte!][idx];
  const reps = REPS[cfg.matte!] || [];
  const n = reps.filter((r) => r <= idx).length;
  if (n === 0 || f - s.f0 < 6) return null;
  const x = Math.min(m.r + 175, 915), y = clamp(m.top + 20, 300, 800);
  return (
    <div style={{position: 'absolute', left: x - 150, top: y, width: 300, fontFamily: 'Poppins', fontWeight: 800}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, background: '#12161ce6', border: `3px solid ${LIME}`, borderRadius: 18, padding: '10px 18px', boxShadow: '0 0 30px #97d13160', color: TXT, fontSize: 34}}>
        <span style={{color: LIME, fontSize: 38}}>▲</span>
        <span>REP {String(n).padStart(2, '0')}</span>
        <span style={{marginLeft: 'auto', color: LIME}}>✓</span>
      </div>
      <div style={{width: 3, height: 34, background: LIME, margin: '0 auto', opacity: 0.9}} />
      <div style={{width: 16, height: 16, borderRadius: 8, background: LIME, margin: '0 auto', boxShadow: '0 0 18px #97d131'}} />
    </div>
  );
};

/* tarjeta holografica de la app que sale del telefono */
const AppCard = ({f, t0, tOut, from, to, label}: {f: number; t0: number; tOut: number; from: {x: number; y: number}; to: {x: number; y: number; w: number; h: number}; label?: string}) => {
  const l = f - t0;
  if (l < 0 || f > tOut + 14) return null;
  const pin = ease(clamp(l / 16)); const pout = ease(clamp((f - tOut) / 14));
  const p = pin * (1 - pout);
  const sc = 0.1 + 0.9 * p; const x = from.x + (to.x - from.x) * pin; const y = from.y + (to.y - from.y) * pin;
  const flo = Math.sin(l / 12) * 8;
  const scan = clamp((l - 10) / 26);
  return (
    <>
      <svg width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0, opacity: p * 0.9}}>
        <line x1={from.x} y1={from.y} x2={x} y2={y + flo} stroke={LIME} strokeWidth={4} strokeDasharray="14 10" />
        <circle cx={from.x} cy={from.y} r={10 + 4 * Math.sin(l / 4)} fill={LIME} />
      </svg>
      <div style={{position: 'absolute', left: x - to.w / 2, top: y - to.h / 2 + flo, width: to.w, height: to.h, transform: `scale(${sc}) rotate(${-4 * (1 - pin) - 2}deg)`, opacity: clamp(p * 1.6), borderRadius: 38, border: `6px solid ${LIME}`, boxShadow: '0 30px 80px #000b, 0 0 70px #97d13160', overflow: 'hidden', background: '#0b0e13'}}>
        <Img src={staticFile('aviso5/plan.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: `${scan * 100}%`, height: 6, background: LIME, boxShadow: '0 0 24px #97d131', opacity: scan < 1 ? 1 : 0}} />
      </div>
      {label && (
        <div style={{position: 'absolute', left: x - to.w / 2, top: y - to.h / 2 + flo - 74, width: to.w, textAlign: 'center', opacity: clamp(p * 1.6), transform: `translateY(${(1 - pin) * 30}px)`, fontFamily: 'Poppins', fontWeight: 800, fontSize: 40, color: INK}}>
          <span style={{background: LIME, padding: '8px 24px', borderRadius: 14, boxShadow: '0 10px 30px #97d13160'}}>{label}</span>
        </div>
      )}
    </>
  );
};

/* ------------ escena ------------ */
const SceneBody = ({s, f, shift = 0}: {s: any; f: number; shift?: number}) => {
  const cfg = HAVE[s.scene];
  if (!cfg) {
    const l = f - s.f0; const d2 = interpolate(l, [0, s.f1 - s.f0], [1.04, 1.1]);
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
  }
  return (
    <AbsoluteFill style={{background: INK, overflow: 'hidden'}}>
      <AbsoluteFill><Vid cfg={cfg} s={s} shift={shift} /></AbsoluteFill>
      {s.scene === 'L02a' && (
        <Sequence from={cardioF} durationInFrames={s.f1 - cardioF}>
          <OffthreadVideo src={staticFile(L02B.src)} startFrom={Math.round(L02B.ss * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
const Scene = ({s}: {s: any}) => {
  const f = useCurrentFrame();
  const cfg = HAVE[s.scene];
  const l = f - s.f0;
  let z = 1 + 0.04 * (l / (s.f1 - s.f0)); let ox = 540, oy = 960;
  if (cfg && cfg.follow) {
    const t0 = wfind(cfg.follow.v, cfg.follow.w) - 4;
    const k = ease(clamp((f - t0) / 18));
    z = 1 + (cfg.follow.z - 1) * k + 0.04 * clamp((f - t0 - 18) / 60); ox = cfg.follow.x; oy = cfg.follow.y;
  } else {
    // golpe de zoom al empezar cada frase (ritmo de corte sin cortar la escena)
    const mine = CHUNKS.filter((c) => c.v === s.v);
    let i = -1; mine.forEach((c, k) => { if (f >= c.f0) i = k; });
    if (i >= 0) {
      const lv = (k: number) => (k % 2 === 0 ? 0 : 0.1);
      const kk = ease(clamp((f - mine[i].f0) / 5));
      const from = i > 0 ? lv(i - 1) : 0;
      z += from + (lv(i) - from) * kk;
      ox = [540, 420, 660][i % 3]; oy = [900, 760, 1000][i % 3];
    }
  }
  // temblor corto cuando se dice una palabra de impacto
  let dx = 0, dy = 0;
  (tl.words[s.v] || []).forEach((w: any) => { const a = f - w.f; if (w.imp && a >= 0 && a < 6) { const m = 1 - a / 6; dx = (a % 2 ? 1 : -1) * 9 * m; dy = (a % 2 ? -1 : 1) * 6 * m; } });
  return (
    <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${z})`, transformOrigin: `${ox}px ${oy}px`}}>
      <SceneBody s={s} f={f} />
    </AbsoluteFill>
  );
};

/* ------------ carril de semanas + cartel que vuela al punto ------------ */
const HITS: {f: number; n: number}[] = [];
(() => { const first = (v: string, p: string, n: number) => { if (tl.words[v]) HITS.push({f: wfind(v, p), n}); }; first('V02', 'semana', 1); first('V04', 'semana', 2); first('V07', 'semana', 3); first('V09', 'semana', 4); first('V10', 'quinta', 5); })();
const FLY = 44;
const GAP = 112, X0 = 560, RAIL_Y = 1228;
const Rail = () => {
  const f = useCurrentFrame();
  const xs = [0, 1, 2, 3, 4].map((i) => X0 + i * GAP);
  const when = (w: number) => { const h = HITS.find((x) => x.n === w); return h ? h.f + FLY : undefined; };
  const cur = Math.max(0, ...[1, 2, 3, 4, 5].filter((w) => { const t = when(w); return t !== undefined && f >= t; }));
  const o = clamp(f / 10);
  return (
    <div style={{position: 'absolute', left: 0, top: RAIL_Y, width: 1080, height: 70, opacity: o}}>
      <div style={{position: 'absolute', left: X0, top: 31, width: GAP * 4, height: 7, borderRadius: 4, background: '#ffffff30'}} />
      <div style={{position: 'absolute', left: X0, top: 31, width: Math.max(0, (cur - 1) * GAP), height: 7, borderRadius: 4, background: LIME}} />
      {xs.map((x, i) => {
        const w = i + 1; const done = cur >= w; const st = when(w);
        const sc = st !== undefined && f >= st ? 1 + 0.5 * Math.max(0, 1 - (f - st) / 12) : 1;
        return (
          <div key={i} style={{position: 'absolute', left: x - 24, top: 10, width: 48, height: 48, borderRadius: 24, transform: `scale(${sc})`, background: done ? LIME : INK, border: `4px solid ${done ? LIME : '#ffffff55'}`, color: done ? INK : '#c8cfd9', fontFamily: 'Poppins', fontWeight: 800, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: done ? '0 0 22px #97d13170' : '0 4px 14px #0008'}}>
            {w}
          </div>
        );
      })}
    </div>
  );
};
const WeekCard = () => {
  const f = useCurrentFrame();
  const h = HITS.find((x) => f >= x.f && f < x.f + FLY + 2);
  if (!h) return null;
  const l = f - h.f;
  const slide = interpolate(l, [0, 12], [-460, 0], {easing: ease, extrapolateRight: 'clamp'});
  const p = ease(clamp((l - 26) / (FLY - 26)));
  const dotX = X0 + (h.n - 1) * GAP, dotY = RAIL_Y + 34;
  const cx = 540 + (dotX - 540) * p + slide * (1 - p), cy = 800 + (dotY - 800) * p;
  const sc = 1 - 0.88 * p;
  const o = clamp(l / 3) * (1 - clamp((l - (FLY - 4)) / 4));
  return (
    <div style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) scale(${sc})`, opacity: o, fontFamily: 'Poppins', fontWeight: 800}}>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 26, background: LIME, color: INK, padding: '10px 54px 10px 36px', borderRadius: 24, boxShadow: '0 16px 60px #97d13160'}}>
        <span style={{fontSize: 70, letterSpacing: 3}}>SEMANA</span>
        <span style={{fontSize: 170, lineHeight: 1}}>{h.n}</span>
      </div>
    </div>
  );
};

/* ------------ narrador ------------ */
const Narrator = ({s}: {s: any}) => {
  const f = useCurrentFrame();
  const l = f - s.f0;
  const y = (1 - pop(l, 13, 200)) * 200;
  const pad = String((s.of0 !== undefined ? s.of0 : s.f0) + (f - s.f0)).padStart(5, '0');
  return (
    <div style={{position: 'absolute', left: 0, top: 1292, width: 470, height: 628, transform: `translateY(${y}px)`}}>
      <Img src={staticFile(`aviso5/pip/${pad}.png`)} style={{width: 470, height: 628}} />
    </div>
  );
};

/* ------------ subtitulos: revelado con mascara, glow y glitch en palabras de impacto ------------ */
type W = {t: string; imp: boolean; f: number};
type Chunk = {v: string; words: W[]; f0: number; f1: number};
let CHUNKS: Chunk[] = [];
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
// la frase termina cuando empieza la siguiente o 3 fotogramas despues de la voz: nunca invade el plano siguiente
CHUNKS.forEach((c, i) => { const n = CHUNKS[i + 1]; c.f1 = n && n.v === c.v ? n.f0 : vEnd(c.v) + 3; });
// el cartel de semana ya dice "SEMANA n": se quita ese subtitulo para no duplicar
CHUNKS = CHUNKS.filter((c) => !(c.words.length <= 2 && /^(semana|quinta)/.test(norm(c.words[0].t))));
const disp = (w: W) => (w.t === 'Yim' ? 'GymEvoApp' : w.t === 'I' ? 'IA' : w.t).toUpperCase();

const Captions = () => {
  const f = useCurrentFrame();
  const s = shotAt(f);
  if (s.scene === 'FIN') return null;
  const c = CHUNKS.find((k) => f >= k.f0 && f < k.f1 && f < s.f1);
  if (!c) return null;
  const l = f - c.f0;
  const reveal = ease(clamp((l + 1) / 6));                      // mascara que revela de izquierda a derecha
  const out = clamp((f - (c.f1 - 3)) / 3);                      // salida rapida, ya sin la frase siguiente encima
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 905, height: 300, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: '10px 38px', clipPath: `inset(-60px ${(1 - reveal) * 100}% -60px 0)`, transform: `translateY(${-out * 30}px)`, opacity: 1 - out}}>
      {c.words.map((w, i) => {
        if (f < w.f) return null;
        const nxt = c.words[i + 1];
        const active = f >= w.f && (!nxt || f < nxt.f);
        const lw = f - w.f; const p = pop(lw, 12, 300);
        const slam = w.imp ? Math.max(0, 1 - lw / 5) : 0;
        const glitch = w.imp && lw < 4 ? (lw % 2 === 0 ? 6 : -6) : 0;
        const glow = w.imp ? '0 0 30px #97d131, 0 0 70px #97d13190, ' : '';
        return (
          <span key={i} style={{display: 'inline-block', position: 'relative', fontFamily: 'Poppins', fontWeight: 800, fontSize: w.imp ? 110 : 90, lineHeight: 1.05, letterSpacing: 1, padding: '2px 4px', transform: `translate(${glitch}px, ${(1 - p) * 26}px) scale(${0.92 + 0.08 * p + 0.16 * slam})`, color: active || w.imp ? LIME : TXT, WebkitTextStroke: '14px ' + INK, paintOrder: 'stroke fill', textShadow: glow + '0 8px 24px #000c'}}>
            {disp(w)}
          </span>
        );
      })}
    </div>
  );
};

/* ------------ oferta y cierre ------------ */
const OfferChip = ({s}: {s: any}) => {
  const f = useCurrentFrame(); const l = f - (wfind('V12', 'gratis') - 2);
  if (s.scene !== 'L12' || l < 0) return null;
  const hide = 1 - clamp((f - (wfind('V12', 'arranca') - 8)) / 6);
  if (hide <= 0) return null;
  const y = interpolate(l, [0, 12], [80, 0], {easing: ease, extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center', opacity: clamp(l / 5) * hide, transform: `translateY(${y}px)`}}>
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
const TR = 10;   // fotogramas de la transicion "logo como mascara" antes del plano 12
export const Aviso5 = () => {
  useFonts();
  const f = useCurrentFrame();
  const s = shotAt(f);
  const l = f - s.f0;
  const punch = s.i > 1 ? 0.06 * Math.max(0, 1 - l / 9) ** 2 : 0;
  const flash = s.i > 1 ? 0.24 * Math.max(0, 1 - l / 3) : 0;
  const fin = s.scene === 'FIN';
  const s12 = SH.find((x) => x.scene === 'L12');
  const inTr = !!s12 && f >= s12.f0 - TR && f < s12.f0;
  const sz = inTr ? 160 * Math.pow(30, ease(clamp((f - (s12.f0 - TR)) / TR))) : 0;   // el logo crece hasta llenar la pantalla
  const s3 = SH.find((x) => x.scene === 'L03');
  const a3 = wfind('V03', 'plan') + 4;
  const a12 = wfind('V12', 'arranca') - 6;
  return (
    <AbsoluteFill style={{background: INK}}>
      <AbsoluteFill style={{transform: `scale(${1 + punch})`}}>
        {fin ? <EndCard s={s} /> : <Scene s={s} />}
        {inTr && (
          <AbsoluteFill style={{WebkitMaskImage: `url(${staticFile('gymevo/logo_mark.png')})`, maskImage: `url(${staticFile('gymevo/logo_mark.png')})`, WebkitMaskSize: `${sz}px ${sz}px`, maskSize: `${sz}px ${sz}px`, WebkitMaskPosition: '50% 42%', maskPosition: '50% 42%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat'}}>
            <SceneBody s={s12} f={f} shift={TR} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      {s.scene === 'L03' && <AppCard f={f} t0={a3} tOut={s3.f1 - 18} from={{x: 540, y: 1150}} to={{x: 800, y: 600, w: 330, h: 560}} label="TU PLAN REAL" />}
      {s.scene === 'L12' && <AppCard f={f} t0={a12} tOut={wfind('V12', 'descarga') - 4} from={{x: 270, y: 548}} to={{x: 600, y: 640, w: 480, h: 830}} label="GymEvoApp" />}
      {s.scene === 'L10' && HAVE.L10.hud && <Hud cfg={HAVE.L10} s={s} f={f} />}
      {!fin && <Rail />}
      {!fin && <Narrator s={s} />}
      <WeekCard />
      <OfferChip s={s} />
      <Captions />
      <AbsoluteFill style={{background: '#fff', opacity: flash, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
