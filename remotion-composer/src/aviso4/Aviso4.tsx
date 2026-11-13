import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {useFonts} from '../gymevo/Fonts';
import tlRaw from './timeline.json';

const tl: any = tlRaw;
const FPS = 24;
const LIME = '#97d131', LIME_D = '#5a7d16', INK = '#12161c', TXT = '#f2f4f0', GRAY = '#aab1bd', RED = '#ff5a5f';
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pop = (l: number, d = 10, s = 190) => spring({frame: Math.max(0, l), fps: FPS, config: {damping: d, stiffness: s, mass: 0.7}});
const win = (f: number, a: number, b: number) => ({on: f >= a && f < b, l: f - a, o: clamp((f - a) / 5) * clamp((b - f) / 5)});

type W = {t: string; imp: boolean; f: number};
const WORDS: Record<string, W[]> = tl.words;
const SH = (i: number) => tl.shots[i - 1];
const wf = (v: string, p: string): number => { const w = WORDS[v].find((x) => x.t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zñ]/g, '').startsWith(p)); return w ? w.f : SH(1).f0; };
const vStart = (v: string) => Math.round(tl.voices[v].T * FPS);
const vEnd = (v: string) => Math.round((tl.voices[v].T + tl.voices[v].dv) * FPS);

/* ---------- subtitle chunks ---------- */
type Chunk = {v: string; words: W[]; f0: number; f1: number};
const CHUNKS: Chunk[] = [];
Object.keys(WORDS).forEach((v) => {
  let cur: W[] = [];
  const flush = () => { if (cur.length) { CHUNKS.push({v, words: cur, f0: cur[0].f, f1: 0}); cur = []; } };
  WORDS[v].forEach((w) => {
    if (w.t === 'Evo' || w.t === 'App') return;                  // "Yim Evo App" is shown as one word
    cur.push(w);
    if (/[,.:]$/.test(w.t) || cur.length >= 4 || (cur.length >= 3 && w.t.length > 7)) flush();
  });
  flush();
});
CHUNKS.forEach((c, i) => { const n = CHUNKS[i + 1]; c.f1 = n && n.v === c.v ? n.f0 : vEnd(c.v) + 8; });
const inS = (c: Chunk, i: number) => c.f0 >= SH(i).f0 && c.f0 < SH(i).f1;
const disp = (w: W) => (w.t === 'Yim' ? 'GymEvoApp' : w.t);

const Subtitles = () => {
  const f = useCurrentFrame();
  if (f >= SH(12).f0) return null;
  const items: React.ReactNode[] = [];
  CHUNKS.forEach((c, ci) => {
    if (f < c.f0 || f >= c.f1 + 10) return;
    items.push(
      <div key={ci} style={{position: 'absolute', left: inS(c, 6) || inS(c, 9) ? 30 : 70, width: inS(c, 6) || inS(c, 9) ? 620 : 940, top: inS(c, 7) || inS(c, 10) ? 1235 : 1010, transform: 'translateY(-50%)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', gap: '4px 22px', fontFamily: 'Poppins'}}>
        {c.words.map((w, wi) => {
          const l = f - w.f; const ex = clamp((f - (c.f1 - 2) - wi * 0.8) / 6); const pIn = ease(clamp(l / 7));
          const sc = w.imp ? 0.8 + 0.2 * pop(l, 8, 200) : 1; const rv = w.imp ? clamp(l / 9) : 1; const X = rv * 125;
          return (
            <span key={wi} style={{position: 'relative', display: 'inline-block', opacity: clamp(l / 4) * (1 - ex), transform: `translateY(${(1 - pIn) * 30 - ex * 52}px) scale(${sc})`, filter: `blur(${(w.imp ? 0 : (1 - pIn) * 8) + ex * 7}px)`}}>
              <span style={{display: 'inline-block', clipPath: w.imp ? `polygon(0 -20%, ${X}% -20%, ${X - 24}% 120%, 0 120%)` : undefined, fontWeight: w.imp ? 800 : 700, fontSize: w.imp ? 112 : 70, lineHeight: 1.15, color: w.imp ? LIME : TXT, textShadow: w.imp ? '0 0 26px rgba(151,209,49,0.55), 0 4px 18px rgba(0,0,0,0.65)' : '0 3px 16px rgba(0,0,0,0.75)'}}>{disp(w)}</span>
              {w.imp && rv < 1 ? <span style={{position: 'absolute', top: '10%', bottom: '10%', left: `${X - 14}%`, width: 8, transform: 'skewX(-14deg)', background: '#e8ffb0', boxShadow: `0 0 18px 5px ${LIME}`}} /> : null}
            </span>
          );
        })}
      </div>
    );
  });
  return <>{items}</>;
};

/* hides the partial wall sign visible in shot 2 */
const SignBlur = () => { const f = useCurrentFrame(); if (f < SH(2).f0 || f >= SH(2).f1) return null; return <div style={{position: 'absolute', left: 0, top: 285, width: 330, height: 150, backdropFilter: 'blur(26px)', background: 'rgba(18,22,28,0.35)', borderBottomRightRadius: 40}} />; };

/* ---------- small building blocks ---------- */
const Glass = ({left, top, w, children, o = 1, sc = 1}: any) => (
  <div style={{position: 'absolute', left, top, width: w, opacity: o, transform: `scale(${sc})`, transformOrigin: 'left top', padding: '18px 22px', borderRadius: 22, background: 'rgba(26,32,41,0.82)', backdropFilter: 'blur(14px)', border: '1px solid rgba(151,209,49,0.5)', boxShadow: '0 0 34px rgba(151,209,49,0.2)', fontFamily: 'Poppins', color: TXT}}>
    <div style={{position: 'absolute', left: -2, top: -2, width: 22, height: 22, borderTop: `4px solid ${LIME}`, borderLeft: `4px solid ${LIME}`, borderTopLeftRadius: 22}} />
    <div style={{position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderBottom: `4px solid ${LIME}`, borderRight: `4px solid ${LIME}`, borderBottomRightRadius: 22}} />
    {children}
  </div>
);
const Leader = ({x1, y1, x2, y2, o, f}: any) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: o}}>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LIME} strokeWidth={3} strokeDasharray="10 8" opacity={0.85} />
    <circle cx={x2} cy={y2} r={8} fill={LIME} /><circle cx={x2} cy={y2} r={8 + ((f % 36) / 36) * 26} fill="none" stroke={LIME} strokeWidth={3} opacity={1 - (f % 36) / 36} />
  </svg>
);
const Pill = ({children, size = 40, style}: any) => <div style={{display: 'inline-block', padding: '16px 36px', borderRadius: 40, background: LIME, color: INK, fontFamily: 'Poppins', fontWeight: 800, fontSize: size, boxShadow: `0 7px 0 ${LIME_D}, 0 0 40px rgba(151,209,49,0.45)`, ...style}}>{children}</div>;

/* ---------- week labels ---------- */
const WEEKS = [{f: wf('V02', 'semana'), n: 1}, {f: wf('V05', 'semana'), n: 2}, {f: wf('V07', 'semana'), n: 3}, {f: wf('V09a', 'semana'), n: 4}, {f: wf('V09b', 'quinta'), n: 5}];
const WeekLabel = () => {
  const f = useCurrentFrame();
  return <>{WEEKS.map((w) => { const k = win(f, w.f, w.f + 58); if (!k.on) return null; const p = pop(k.l, 9, 200);
    return <div key={w.n} style={{position: 'absolute', left: 0, width: 1080, top: 215, display: 'flex', justifyContent: 'center', opacity: k.o, transform: `scale(${0.6 + 0.4 * p}) translateY(${(1 - ease(clamp(k.l / 8))) * -30}px)`}}>
      <Pill size={58} style={{padding: '16px 46px'}}>SEMANA {w.n}</Pill>
      <svg width={1080} height={400} style={{position: 'absolute', top: -120, left: 0}}><circle cx={540} cy={170} r={60 + k.l * 7} fill="none" stroke={LIME} strokeWidth={4} opacity={clamp(1 - k.l / 14)} /></svg>
    </div>; })}</>;
};

/* ---------- shot graphics ---------- */
const QMark = () => {
  const f = useCurrentFrame(); const a = SH(2).f0 + 10, b = SH(2).f1 - 4; const k = win(f, a, b); if (!k.on) return null;
  const drop = spring({frame: k.l, fps: FPS, config: {damping: 7, stiffness: 120, mass: 1}}); const y = interpolate(drop, [0, 1], [-320, 470]);
  return <div style={{position: 'absolute', left: 560, width: 480, top: y - 200, textAlign: 'center', opacity: k.o, fontFamily: 'Poppins', fontWeight: 800, fontSize: 330, lineHeight: 1, color: LIME, WebkitTextStroke: '10px #2f3f12', paintOrder: 'stroke fill', textShadow: '0 18px 40px rgba(0,0,0,0.6)', filter: 'drop-shadow(0 0 30px rgba(151,209,49,0.5))', transform: `rotate(${Math.sin(k.l / 5) * 4}deg)`}}>?</div>;
};
const Repeat3 = () => {
  const f = useCurrentFrame(); const a = wf('V03', 'mismos') - 6, b = SH(3).f1 - 3; const k = win(f, a, b); if (!k.on) return null;
  return <>{[0, 1, 2].map((i) => { const l = k.l - i * 5; if (l < 0) return null;
    return <div key={i} style={{position: 'absolute', left: 0, width: 1080, top: 330 + i * 140, textAlign: 'center', opacity: k.o * [1, 0.55, 0.3][i], transform: `translateX(${(1 - ease(clamp(l / 8))) * (i % 2 ? 120 : -120)}px) scale(${0.9 + 0.1 * pop(l)})`, fontFamily: 'Poppins', fontWeight: 800, fontSize: 70, color: TXT, textShadow: '0 4px 18px rgba(0,0,0,0.7)'}}>LOS <span style={{color: LIME}}>MISMOS</span> MOVIMIENTOS</div>; })}</>;
};
const PhoneChips = () => {
  const f = useCurrentFrame(); const out: React.ReactNode[] = [];
  const bk = win(f, SH(4).f0 + 6, SH(4).f1 - 6);
  if (bk.on) { const hw = 232 * (1 + 0.015 * Math.sin(f / 4)), hh = 440 * (1 + 0.015 * Math.sin(f / 4)), cx = 531, cy = 1030, L = 56;
    out.push(<svg key="br" width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: bk.o * 0.9}}>{[[-1, -1, 1, 1], [1, -1, -1, 1], [1, 1, -1, -1], [-1, 1, 1, -1]].map(([sx, sy, dx, dy], i) => { const x = cx + sx * hw, y = cy + sy * hh; return <polyline key={i} points={`${x + dx * L},${y} ${x},${y} ${x},${y + dy * L}`} fill="none" stroke={LIME} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />; })}</svg>); }
  const fi = wf('V04a', 'ia'), w1 = win(f, fi, fi + 62);
  if (w1.on) out.push(<React.Fragment key="ia"><Leader x1={820} y1={660} x2={700} y2={760} o={w1.o} f={f} /><div style={{position: 'absolute', left: 800, top: 600, opacity: w1.o, transform: `scale(${0.7 + 0.3 * pop(w1.l)})`, padding: '10px 28px', borderRadius: 18, background: 'rgba(26,32,41,0.85)', border: `2px solid ${LIME}`, color: LIME, fontFamily: 'Poppins', fontWeight: 800, fontSize: 56, boxShadow: '0 0 30px rgba(151,209,49,0.45)'}}>IA</div></React.Fragment>);
  const fn = wf('V04a', 'nivel'), w2 = win(f, fn - 2, vEnd('V04a') + 14);
  if (w2.on) out.push(<React.Fragment key="nm"><Leader x1={330} y1={900} x2={400} y2={950} o={w2.o} f={f} /><Glass left={30} top={820} w={300} o={w2.o} sc={0.88 + 0.12 * ease(clamp(w2.l / 10))}><div style={{fontSize: 20, color: GRAY, letterSpacing: 3, fontWeight: 600}}>TU RUTINA</div><div style={{fontSize: 36, fontWeight: 800}}>Nivel · Meta</div></Glass></React.Fragment>);
  return <>{out}</>;
};
const Split = () => {
  const f = useCurrentFrame(); const k = win(f, SH(6).f0 + 4, SH(6).f1 - 4); if (!k.on) return null; const p = pop(k.l, 10, 170);
  return <>
    <div style={{position: 'absolute', left: 538, top: 0, width: 4, height: 1920, background: LIME, opacity: k.o * 0.8, boxShadow: '0 0 20px rgba(151,209,49,0.6)'}} />
    <div style={{position: 'absolute', left: 30, top: 150, opacity: k.o, transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: 'left top', fontFamily: 'Poppins', fontWeight: 800, fontSize: 52, color: TXT, display: 'flex', alignItems: 'center', gap: 14}}><span style={{display: 'inline-flex', width: 62, height: 62, borderRadius: 31, background: RED, color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 40}}>✕</span>INCORRECTA</div>
    <div style={{position: 'absolute', right: 30, top: 150, opacity: k.o, transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: 'right top', fontFamily: 'Poppins', fontWeight: 800, fontSize: 52, color: TXT, display: 'flex', alignItems: 'center', gap: 14}}>CORRECTA<span style={{display: 'inline-flex', width: 62, height: 62, borderRadius: 31, background: LIME, color: INK, alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800}}>✓</span></div>
  </>;
};
const GuideInsert = () => {
  const f = useCurrentFrame(); const a = wf('V06', 'guia') - 4; const k = win(f, a, a + 84); if (!k.on) return null;
  return <div style={{position: 'absolute', left: 650, top: 1060, width: 360, opacity: k.o, transform: `scale(${0.8 + 0.2 * ease(clamp(k.l / 8))})`, transformOrigin: 'right bottom'}}>
    <div style={{textAlign: 'center', fontFamily: 'Poppins', fontWeight: 800, fontSize: 28, color: LIME, marginBottom: 10, letterSpacing: 2, textShadow: '0 2px 12px rgba(0,0,0,0.8)'}}>GUÍA PASO A PASO</div>
    <div style={{width: 360, height: 756, borderRadius: 44, overflow: 'hidden', border: `3px solid ${LIME}`, boxShadow: '0 0 40px rgba(151,209,49,0.45)', background: INK}}><OffthreadVideo src={staticFile('aviso4/rc_guia.mp4')} muted style={{width: 360, height: 756, objectFit: 'cover'}} /></div>
  </div>;
};
const Infographic = () => {
  const f = useCurrentFrame(); const s = SH(7); const k = win(f, s.f0 + 2, s.f1 - 2); if (!k.on) return null;
  const card = (left: number, good: boolean, title: string, items: string[]) => {
    const p = ease(clamp(k.l / 9)); const dx = (good ? 1 : -1) * (1 - p) * 140;
    return <div style={{position: 'absolute', left: left + dx, top: 400, width: 470, height: 720, opacity: k.o * p, borderRadius: 28, padding: '28px 26px', fontFamily: 'Poppins', background: good ? 'rgba(151,209,49,0.12)' : 'rgba(26,32,41,0.9)', border: `3px solid ${good ? LIME : '#3a4350'}`, boxShadow: good ? '0 0 46px rgba(151,209,49,0.3)' : 'none'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, fontWeight: 800, fontSize: 48, color: good ? LIME : GRAY}}><span style={{display: 'inline-flex', width: 56, height: 56, borderRadius: 28, background: good ? LIME : RED, color: good ? INK : '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 36}}>{good ? '✓' : '✕'}</span>{title}</div>
      {items.map((t, i) => { const l = k.l - 12 - i * 6; return <div key={i} style={{marginTop: 34, display: 'flex', alignItems: 'center', gap: 16, opacity: clamp(l / 5), transform: `translateX(${(1 - ease(clamp(l / 8))) * 40}px)`, fontWeight: 700, fontSize: 38, color: good ? TXT : GRAY}}><span style={{color: good ? LIME : RED, fontSize: 40}}>{good ? '✓' : '✕'}</span>{t}</div>; })}
    </div>;
  };
  return <>{card(50, false, 'SIN GUÍA', ['Adivinar la técnica', 'Repetir lo mismo', 'Dudas en cada serie'])}{card(560, true, 'CON GUÍA', ['Paso a paso', 'Técnica a la vista', 'Qué sigue, claro'])}</>;
};
const RegistrarHUD = () => {
  const f = useCurrentFrame(); const a = wf('V08a', 'registras') - 2, b = vEnd('V08a') + 24; const k = win(f, a, b); if (!k.on) return null;
  const fp = wf('V08a', 'peso') + 4; const press = f >= fp && f < fp + 4 ? 0.94 : 1; const done = f >= fp + 4; const rl = f - fp;
  return <>
    <div style={{position: 'absolute', left: 520, top: 1180, opacity: k.o, transform: `scale(${(0.8 + 0.2 * ease(clamp(k.l / 8))) * press})`, transformOrigin: 'left top', padding: '20px 34px', borderRadius: 28, background: LIME, color: INK, fontFamily: 'Poppins', fontWeight: 700, fontSize: 40, boxShadow: `0 8px 0 ${LIME_D}, 0 0 44px rgba(151,209,49,0.5)`}}>{done ? '✓ Serie 1 registrada' : 'Registrar serie 1'}</div>
    {rl >= 0 && rl < 16 ? <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}><circle cx={700} cy={1235} r={24 + rl * 14} fill="none" stroke={LIME} strokeWidth={5} opacity={1 - rl / 16} /></svg> : null}
  </>;
};
const CalInsert = () => {
  const f = useCurrentFrame(); const a = wf('V09a', 'progreso') - 6; const k = win(f, a, a + 62); if (!k.on) return null;
  return <div style={{position: 'absolute', left: 690, top: 780, width: 350, opacity: k.o, transform: `scale(${0.8 + 0.2 * ease(clamp(k.l / 8))})`, transformOrigin: 'right top'}}>
    <div style={{textAlign: 'center', fontFamily: 'Poppins', fontWeight: 800, fontSize: 28, color: LIME, marginBottom: 10, letterSpacing: 2, textShadow: '0 2px 12px rgba(0,0,0,0.8)'}}>TU PROGRESO</div>
    <div style={{width: 350, height: 720, borderRadius: 44, overflow: 'hidden', border: `3px solid ${LIME}`, boxShadow: '0 0 40px rgba(151,209,49,0.45)', background: INK}}><OffthreadVideo src={staticFile('gymevo/cal.mp4')} muted style={{width: 350 / 0.968, height: 720 / 0.968, marginLeft: -5.5, marginTop: -11, objectFit: 'cover'}} /></div>
  </div>;
};
const WeightHUD = () => {
  const f = useCurrentFrame(); const a = wf('V09b', 'peso') - 2; const k = win(f, a, a + 84); if (!k.on) return null;
  return <Glass left={560} top={880} w={460} o={k.o} sc={0.88 + 0.12 * ease(clamp(k.l / 10))}>
    <div style={{fontSize: 22, color: GRAY, letterSpacing: 3, fontWeight: 600}}>PRÓXIMA SERIE</div>
    <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 6}}><span style={{display: 'inline-flex', width: 58, height: 58, borderRadius: 29, background: LIME, color: INK, alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 800}}>↑</span><span style={{fontSize: 42, fontWeight: 800}}>Peso sugerido</span></div>
    <div style={{fontSize: 26, color: GRAY, marginTop: 8, fontWeight: 600}}>Así te sugerimos el peso ideal</div>
  </Glass>;
};
const CalendarFill = () => {
  const f = useCurrentFrame(); const s = SH(10); const k = win(f, s.f0 + 2, s.f1 - 2); if (!k.on) return null; const cells: React.ReactNode[] = [];
  for (let r = 0; r < 5; r++) { cells.push(<div key={'r' + r} style={{position: 'absolute', left: 52, top: 470 + r * 126 + 34, fontFamily: 'Poppins', fontWeight: 700, fontSize: 30, color: GRAY, opacity: k.o}}>S{r + 1}</div>);
    for (let c = 0; c < 7; c++) { const i = r * 7 + c; const l = k.l - 16 - i * 2.6; const on = l > 0; const p = pop(l, 9, 210);
      cells.push(<div key={i} style={{position: 'absolute', left: 120 + c * 120, top: 470 + r * 126, width: 104, height: 104, borderRadius: 26, opacity: k.o, background: on ? LIME : 'rgba(26,32,41,0.9)', border: `2px solid ${on ? LIME : '#3a4350'}`, boxShadow: on ? '0 0 22px rgba(151,209,49,0.5)' : 'none', transform: `scale(${on ? 0.7 + 0.3 * p : 1})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: INK, fontFamily: 'Poppins', fontWeight: 800, fontSize: 56}}>{on ? '✓' : ''}</div>); } }
  const fe = wf('V10', 'excusas'); const q = win(f, fe - 2, s.f1 - 2); const X = clamp((f - fe) / 9) * 125;
  return <>{cells}{q.on ? <div style={{position: 'absolute', left: 0, width: 1080, top: 250, textAlign: 'center', fontFamily: 'Poppins', fontWeight: 800, fontSize: 118, color: LIME, clipPath: `polygon(0 -20%, ${X}% -20%, ${X - 24}% 120%, 0 120%)`, textShadow: '0 0 30px rgba(151,209,49,0.5)', opacity: q.o}}>SIN EXCUSAS</div> : null}</>;
};
const PillS11 = () => {
  const f = useCurrentFrame(); const a = wf('V11', 'gratis') - 2; const k = win(f, a, SH(11).f1 - 3); if (!k.on) return null;
  return <div style={{position: 'absolute', left: 500, top: 1500, opacity: k.o, transform: `translateY(${(1 - ease(clamp(k.l / 9))) * 40}px)`}}><Pill size={38}>7 días gratis · sin tarjeta</Pill></div>;
};

/* ---------- logo ---------- */
const LOGO_T = wf('V04a', 'yim'); const CORNER_END = SH(12).f0;
const LogoPop = () => { const f = useCurrentFrame(); if (f < LOGO_T || f > LOGO_T + 12) return null;
  return <div style={{position: 'absolute', left: 540 - 320, top: 700 - 133, width: 640, transform: `scale(${0.5 + 0.55 * pop(f - LOGO_T, 9, 200)})`, filter: 'drop-shadow(0 0 30px rgba(151,209,49,0.5))'}}><Img src={staticFile('gymevo/logo_mark.png')} style={{width: 640, display: 'block'}} /></div>; };
const LogoCorner = () => { const f = useCurrentFrame(); const a = LOGO_T + 12; if (f < a || f >= CORNER_END) return null; const k = ease(clamp((f - a) / 14));
  const cx = interpolate(k, [0, 1], [540, 940]), cy = interpolate(k, [0, 1], [700, 130]), s = interpolate(k, [0, 1], [1.05, 0.5]);
  return <div style={{position: 'absolute', left: cx - 160, top: cy - 66, width: 320, transform: `scale(${s})`, opacity: 0.96, filter: 'drop-shadow(0 0 16px rgba(151,209,49,0.45))'}}><Img src={staticFile('gymevo/logo_mark.png')} style={{width: 320, display: 'block'}} /></div>; };

/* ---------- transitions ---------- */
const Wipe = ({c}: {c: number}) => { const f = useCurrentFrame(); const p = (f - (c - 5)) / 10; if (p < 0 || p > 1) return null;
  const x = interpolate(p, [0, 1], [-700, 1500], {easing: Easing.inOut(Easing.cubic)});
  return <div style={{position: 'absolute', left: 0, top: -400, width: 340, height: 2800, transform: `translateX(${x}px) rotate(14deg)`, background: `linear-gradient(90deg, #3f5416 0%, ${LIME_D} 7%, ${LIME} 18%, ${LIME} 82%, ${LIME_D} 93%, #3f5416 100%)`, boxShadow: '0 0 60px rgba(151,209,49,0.6)'}} />; };
const LimeIris = ({c}: {c: number}) => { const f = useCurrentFrame(); if (f < c - 8 || f > c + 9) return null;
  if (f < c) { const r = interpolate(f, [c - 8, c], [0, 1250], {easing: Easing.in(Easing.cubic)}); return <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}><circle cx={540} cy={800} r={r} fill={LIME} /></svg>; }
  const r = interpolate(f, [c, c + 9], [0, 1300], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}><defs><mask id="mi"><rect width={1080} height={1920} fill="white" /><circle cx={540} cy={800} r={r} fill="black" /></mask></defs><rect width={1080} height={1920} fill={LIME} mask="url(#mi)" /></svg>; };

/* ---------- end card ---------- */
const EndCard = () => {
  const f = useCurrentFrame(); const a = SH(12).f0; if (f < a) return null; const l = f - a;
  const fp = wf('V12', 'pago'), fe = wf('V12', 'entra');
  return <AbsoluteFill>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1250, background: 'radial-gradient(ellipse at 50% 22%, rgba(151,209,49,0.22), rgba(18,22,28,0) 62%)'}} />
    <div style={{position: 'absolute', top: 90, left: 0, width: 1080, display: 'flex', justifyContent: 'center', opacity: clamp((l - 4) / 6), transform: `scale(${0.7 + 0.3 * pop(l - 6, 10, 170)})`, filter: 'drop-shadow(0 0 40px rgba(151,209,49,0.35))'}}><Img src={staticFile('gymevo/logo_full.png')} style={{width: 760, display: 'block'}} /></div>
    <div style={{position: 'absolute', top: 700, left: 0, width: 1080, display: 'flex', justifyContent: 'center', opacity: clamp((l - 16) / 6), transform: `scale(${0.8 + 0.2 * pop(l - 16)})`}}><Pill size={44}>7 días gratis · sin tarjeta</Pill></div>
    {f >= fp - 2 ? <div style={{position: 'absolute', top: 830, left: 70, width: 940, padding: '24px 20px', borderRadius: 28, background: 'rgba(26,32,41,0.85)', border: `2px solid ${LIME}`, textAlign: 'center', opacity: clamp((f - fp + 2) / 6), transform: `translateY(${(1 - ease(clamp((f - fp + 2) / 10))) * 40}px)`, boxShadow: '0 0 34px rgba(151,209,49,0.2)', fontFamily: 'Poppins'}}>
      <div style={{color: TXT, fontWeight: 800, fontSize: 64, lineHeight: 1.1}}>Pago <span style={{color: LIME}}>único</span></div><div style={{color: GRAY, fontWeight: 600, fontSize: 38, marginTop: 8}}>Tú eliges por cuánto tiempo</div></div> : null}
    {f >= fe - 2 ? <><div style={{position: 'absolute', top: 1090, left: 0, width: 1080, textAlign: 'center', color: LIME, fontFamily: 'Poppins', fontWeight: 800, fontSize: 64, clipPath: `polygon(0 0, ${clamp((f - fe + 2) / 12) * 125}% 0, ${clamp((f - fe + 2) / 12) * 125 - 22}% 100%, 0 100%)`}}>gymevoapp.com</div>
      <div style={{position: 'absolute', top: 1185, left: 0, width: 1080, textAlign: 'center', color: GRAY, fontFamily: 'Poppins', fontWeight: 600, fontSize: 38, opacity: clamp((f - fe - 6) / 6)}}>@GymEvoApp</div></> : null}
  </AbsoluteFill>;
};

export const Aviso4 = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: INK}}>
      <OffthreadVideo src={staticFile('aviso4/base_pip.mp4')} muted />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(13,16,21,0) 40%, rgba(13,16,21,0.34) 55%, rgba(13,16,21,0) 70%)'}} />
      <SignBlur />
      <QMark /><Repeat3 /><PhoneChips /><Split /><GuideInsert /><Infographic /><RegistrarHUD /><CalInsert /><WeightHUD /><CalendarFill /><PillS11 />
      <WeekLabel />
      <Subtitles />
      <LogoCorner /><LogoPop />
      <EndCard />
      {tl.shots.slice(1, 11).map((s: any) => <Wipe key={s.i} c={s.f0} />)}
      <LimeIris c={SH(12).f0} />
    </AbsoluteFill>
  );
};
