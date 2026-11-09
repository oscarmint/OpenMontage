import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {CUTS, FPS, GRAY, INK, LIME, LIME_D, PHRASES, TXT, wordFrame} from './data';
import {useFonts} from './Fonts';
import anchorsRaw from './anchors.json';

const anchors = anchorsRaw as Record<string, number[]>;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const anchorAt = (f: number): number[] | null => { for (let d = 0; d < 12; d++) { const a = anchors[String(f - d)] || anchors[String(f + d)]; if (a) return a; } return null; };
const pop = (l: number, damping = 10, stiffness = 190) => spring({frame: Math.max(0, l), fps: FPS, config: {damping, stiffness, mass: 0.7}});

/* ---------------- Subtitles ---------------- */
const Subtitles = () => {
  const f = useCurrentFrame();
  const inCal = f >= CUTS.calendar && f < CUTS.wipes[3];
  const y = inCal ? 330 : 1250;
  const items: React.ReactNode[] = [];
  PHRASES.forEach((p) => p.chunks.forEach((c, ci) => {
    if (f < c.f0 || f >= c.f1) return;
    const l0 = f - c.f0;
    const exit = interpolate(f, [c.f1 - 4, c.f1], [1, 0], {extrapolateLeft: 'clamp'});
    const gl = c.glitch && l0 < 4;
    items.push(
      <div key={p.id + ci} style={{position: 'absolute', left: 70, width: 940, top: y, transform: `translate(${gl ? [-9, 7, -4, 2][l0] : 0}px,-50%)`, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', gap: '4px 22px', opacity: exit, fontFamily: 'Poppins', textShadow: gl ? `-7px 0 ${LIME}, 7px 0 rgba(255,255,255,0.55)` : undefined}}>
        {c.words.map((w, wi) => {
          const l = f - w.f;
          const p1 = ease(clamp(l / 7));
          const sc = w.imp ? 0.72 + 0.28 * pop(l, 8, 200) : 1;
          return (
            <span key={wi} style={{display: 'inline-block', opacity: clamp(l / 5), transform: `translateY(${(1 - p1) * 28}px) scale(${sc})`, filter: `blur(${(1 - p1) * 8}px)`, fontWeight: w.imp ? 800 : 700, fontSize: w.imp ? 118 : 74, lineHeight: 1.15, color: w.imp ? LIME : TXT, textShadow: gl ? undefined : w.imp ? '0 0 26px rgba(151,209,49,0.55), 0 4px 18px rgba(0,0,0,0.6)' : '0 3px 16px rgba(0,0,0,0.7)'}}>{w.t}</span>
          );
        })}
      </div>
    );
  }));
  return <>{items}</>;
};

/* ---------------- Logo ---------------- */
const Mark = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 150 150">
    <rect width="150" height="150" rx="36" fill={LIME} /><rect y="118" width="150" height="32" rx="16" fill={LIME_D} opacity="0.55" />
    <path d="M86 22 L44 88 H72 L63 128 L108 60 H80 Z" fill={INK} />
  </svg>
);
const LogoCorner = () => {
  const f = useCurrentFrame();
  const a = CUTS.logo + 12;
  if (f < a) return null;
  const k = ease(clamp((f - a) / 14));
  const cx = interpolate(k, [0, 1], [540, 955]), cy = interpolate(k, [0, 1], [960, 250]), s = interpolate(k, [0, 1], [1.05, 0.52]);
  return <div style={{position: 'absolute', left: cx - 75, top: cy - 75, width: 150, height: 150, transform: `scale(${s})`, opacity: f > a + 14 ? 0.92 : 1, filter: 'drop-shadow(0 0 18px rgba(151,209,49,0.55))'}}><Mark size={150} /></div>;
};

/* ---------------- Glass HUD ---------------- */
const Glass = ({left, top, w, children, o = 1, sc = 1}: {left: number; top: number; w: number; children: React.ReactNode; o?: number; sc?: number}) => (
  <div style={{position: 'absolute', left, top, width: w, opacity: o, transform: `scale(${sc})`, transformOrigin: 'left top', padding: '18px 22px', borderRadius: 20, background: 'rgba(26,32,41,0.74)', backdropFilter: 'blur(14px)', border: '1px solid rgba(151,209,49,0.5)', boxShadow: '0 0 34px rgba(151,209,49,0.2), inset 0 0 22px rgba(151,209,49,0.06)', fontFamily: 'Poppins', color: TXT}}>
    <div style={{position: 'absolute', left: -2, top: -2, width: 22, height: 22, borderTop: `4px solid ${LIME}`, borderLeft: `4px solid ${LIME}`, borderTopLeftRadius: 20}} />
    <div style={{position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderBottom: `4px solid ${LIME}`, borderRight: `4px solid ${LIME}`, borderBottomRightRadius: 20}} />
    {children}
  </div>
);
const Leader = ({x1, y1, x2, y2, o, f}: {x1: number; y1: number; x2: number; y2: number; o: number; f: number}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: o}}>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LIME} strokeWidth={3} strokeDasharray="10 8" opacity={0.85} />
    <circle cx={x2} cy={y2} r={8} fill={LIME} />
    <circle cx={x2} cy={y2} r={8 + ((f % 36) / 36) * 26} fill="none" stroke={LIME} strokeWidth={3} opacity={1 - (f % 36) / 36} />
  </svg>
);
const win = (f: number, a: number, b: number) => ({o: clamp((f - a) / 6) * clamp((b - f) / 6), l: f - a, on: f >= a && f < b});

const HudRow = () => {
  const f = useCurrentFrame();
  const out: React.ReactNode[] = [];
  /* A: C07 serie card anchored to athlete */
  {
    const w = win(f, 502, 600);
    if (w.on) {
      const an = anchorAt(f) || [120, 520, 620, 1500];
      const left = clamp(an[2] + 20, 560, 690), top = clamp(an[1] + 70, 330, 900), s = 0.86 + 0.14 * ease(clamp(w.l / 10));
      out.push(<React.Fragment key="A">
        <Leader x1={left} y1={top + 40} x2={clamp(an[2] - 30, 300, 700)} y2={top + 140} o={w.o} f={f} />
        <Glass left={left} top={top} w={340} o={w.o} sc={s}>
          <div style={{fontSize: 22, color: GRAY, letterSpacing: 3, fontWeight: 600}}>SERIE</div>
          <div style={{fontSize: 56, fontWeight: 800, lineHeight: 1.1}}>1 <span style={{color: GRAY, fontSize: 34, fontWeight: 600}}>de 4</span></div>
          <div style={{fontSize: 26, color: LIME, fontWeight: 700, marginTop: 4}}>6–10 reps</div>
          <div style={{display: 'flex', gap: 12, marginTop: 12}}>{[0, 1, 2, 3].map((i) => <div key={i} style={{width: 26, height: 26, borderRadius: 13, border: `3px solid ${i === 0 ? LIME : '#3a4350'}`, background: i === 0 ? LIME : 'transparent'}} />)}</div>
        </Glass>
      </React.Fragment>);
    }
  }
  /* B: C09 guide card */
  {
    const w = win(f, 626, 696);
    if (w.on) {
      out.push(<Glass key="B" left={80} top={360} w={430} o={w.o} sc={0.88 + 0.12 * ease(clamp(w.l / 10))}>
        <div style={{fontSize: 22, color: GRAY, letterSpacing: 3, fontWeight: 600}}>GUÍA</div>
        <div style={{fontSize: 42, fontWeight: 800, marginBottom: 12}}>Paso a paso</div>
        {[0, 1, 2].map((i) => { const pr = clamp((w.l - 8 - i * 12) / 14); return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 10}}>
            <div style={{width: 34, height: 34, borderRadius: 17, background: pr >= 1 ? LIME : 'transparent', border: `3px solid ${LIME}`, color: INK, fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{pr >= 1 ? '✓' : ''}</div>
            <div style={{height: 10, borderRadius: 5, width: 290, background: '#2a323d', overflow: 'hidden'}}><div style={{height: 10, width: `${pr * 100}%`, background: LIME}} /></div>
          </div>); })}
      </Glass>);
    }
  }
  /* C: C09 registrar button */
  {
    const w = win(f, 712, 806);
    if (w.on) {
      const an = anchorAt(f) || [200, 500, 800, 1500];
      const left = clamp(an[2] - 150, 540, 700), top = clamp(an[1] + 330, 520, 980);
      const press = f >= 756 && f < 760 ? 0.94 : 1, done = f >= 760;
      const rl = f - 756;
      out.push(<React.Fragment key="C">
        <div style={{position: 'absolute', left, top, opacity: w.o, transform: `scale(${(0.8 + 0.2 * ease(clamp(w.l / 10))) * press})`, transformOrigin: 'left top', padding: '20px 30px', borderRadius: 26, background: LIME, color: INK, fontFamily: 'Poppins', fontWeight: 700, fontSize: 36, boxShadow: `0 8px 0 ${LIME_D}, 0 0 40px rgba(151,209,49,0.5)`}}>{done ? '✓ Serie 1 registrada' : 'Registrar serie 1'}</div>
        {rl >= 0 && rl < 16 ? <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}><circle cx={left + 140} cy={top + 40} r={20 + rl * 14} fill="none" stroke={LIME} strokeWidth={5} opacity={1 - rl / 16} /></svg> : null}
      </React.Fragment>);
    }
  }
  /* D: C05 chips */
  {
    const fi = wordFrame('v7a', 0, 2), fn = wordFrame('v7a', 2, 2);
    const w1 = win(f, fi, fi + 54), w2 = win(f, fn, fn + 60);
    if (w1.on) out.push(<React.Fragment key="D1"><Leader x1={800} y1={640} x2={690} y2={740} o={w1.o} f={f} />
      <div style={{position: 'absolute', left: 780, top: 590, opacity: w1.o, transform: `scale(${0.7 + 0.3 * pop(w1.l)})`, padding: '10px 26px', borderRadius: 18, background: 'rgba(26,32,41,0.8)', border: `2px solid ${LIME}`, color: LIME, fontFamily: 'Poppins', fontWeight: 800, fontSize: 52, boxShadow: '0 0 30px rgba(151,209,49,0.45)'}}>IA</div></React.Fragment>);
    if (w2.on) out.push(<React.Fragment key="D2"><Leader x1={330} y1={930} x2={400} y2={960} o={w2.o} f={f} />
      <Glass left={50} top={850} w={300} o={w2.o} sc={0.88 + 0.12 * ease(clamp(w2.l / 10))}><div style={{fontSize: 20, color: GRAY, letterSpacing: 3, fontWeight: 600}}>TU RUTINA</div><div style={{fontSize: 34, fontWeight: 800}}>Nivel · Meta</div></Glass></React.Fragment>);
  }
  /* E: C10 pills */
  {
    const fg = wordFrame('v13', 0, 3), fp = wordFrame('v13', 3, 2);
    const w1 = win(f, fg, CUTS.end - 6), w2 = win(f, fp, CUTS.end - 6);
    if (w1.on) out.push(<div key="E1" style={{position: 'absolute', left: 0, width: 1080, top: 1475, display: 'flex', justifyContent: 'center', opacity: w1.o, transform: `translateY(${(1 - ease(clamp(w1.l / 9))) * 40}px)`}}><div style={{padding: '18px 38px', borderRadius: 40, background: LIME, color: INK, fontFamily: 'Poppins', fontWeight: 800, fontSize: 40, boxShadow: `0 7px 0 ${LIME_D}, 0 0 40px rgba(151,209,49,0.45)`}}>7 días gratis · sin tarjeta</div></div>);
    if (w2.on) out.push(<div key="E2" style={{position: 'absolute', left: 0, width: 1080, top: 1385, display: 'flex', justifyContent: 'center', opacity: w2.o, transform: `scale(${0.7 + 0.3 * pop(w2.l)})`}}><div style={{padding: '10px 30px', borderRadius: 30, background: 'rgba(26,32,41,0.82)', border: `2px solid ${LIME}`, color: TXT, fontFamily: 'Poppins', fontWeight: 700, fontSize: 36}}>Pago <span style={{color: LIME}}>único</span></div></div>);
  }
  return <>{out}</>;
};

/* ---------------- Calendar insert ---------------- */
const CalendarInsert = () => {
  const f = useCurrentFrame();
  if (f < CUTS.calendar || f >= CUTS.wipes[3] + 4) return null;
  const l = f - CUTS.calendar, k = 0.72 + 0.28 * ease(clamp(l / 12));
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 140, top: 520, width: 800, height: 1100, borderRadius: 400, background: 'radial-gradient(ellipse, rgba(151,209,49,0.32), rgba(151,209,49,0) 68%)'}} />
      <div style={{position: 'absolute', left: 227, top: 410, width: 626, height: 1273, transform: `scale(${k})`, transformOrigin: '50% 50%', borderRadius: 84, overflow: 'hidden', background: '#0d1015', boxShadow: '0 0 60px rgba(151,209,49,0.28)'}}>
        <OffthreadVideo src={staticFile('gymevo/cal.mp4')} muted style={{width: 626 / 0.968, height: 1273 / 0.968, marginLeft: -9.9, marginTop: -9.9, objectFit: 'cover'}} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Transitions ---------------- */
const Wipe = ({c}: {c: number}) => {
  const f = useCurrentFrame();
  const p = (f - (c - 5)) / 10;
  if (p < 0 || p > 1) return null;
  const x = interpolate(p, [0, 1], [-700, 1500], {easing: Easing.inOut(Easing.cubic)});
  return <div style={{position: 'absolute', left: 0, top: -400, width: 340, height: 2800, transform: `translateX(${x}px) rotate(14deg)`, background: `linear-gradient(90deg, #3f5416 0%, ${LIME_D} 7%, ${LIME} 18%, ${LIME} 82%, ${LIME_D} 93%, #3f5416 100%)`, boxShadow: '0 0 60px rgba(151,209,49,0.6)'}} />;
};
const IrisO = () => {
  const f = useCurrentFrame(); const c = CUTS.irisO;
  if (f < c - 9 || f > c + 9) return null;
  const r = f <= c ? interpolate(f, [c - 8, c], [1400, 110], {extrapolateLeft: 'clamp', easing: Easing.in(Easing.cubic)}) : interpolate(f, [c, c + 8], [110, 1500], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs><mask id="mo"><rect width={1080} height={1920} fill="white" /><circle cx={540} cy={860} r={r} fill="black" /></mask></defs>
      <rect width={1080} height={1920} fill="#0d1015" mask="url(#mo)" />
      <circle cx={540} cy={860} r={r} fill="none" stroke={LIME} strokeWidth={10} />
    </svg>
  );
};
const LimeIris = ({c, cx, cy, id}: {c: number; cx: number; cy: number; id: string}) => {
  const f = useCurrentFrame();
  if (f < c - 8 || f > c + 9) return null;
  if (f < c) { const r = interpolate(f, [c - 8, c], [0, 1250], {easing: Easing.in(Easing.cubic)}); return <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}><circle cx={cx} cy={cy} r={r} fill={LIME} /></svg>; }
  const r = interpolate(f, [c, c + 9], [0, 1300], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}><defs><mask id={id}><rect width={1080} height={1920} fill="white" /><circle cx={cx} cy={cy} r={r} fill="black" /></mask></defs><rect width={1080} height={1920} fill={LIME} mask={`url(#${id})`} /></svg>;
};
const LogoPop = () => {
  const f = useCurrentFrame(); const c = CUTS.logo;
  if (f < c || f > c + 12) return null;
  return <div style={{position: 'absolute', left: 540 - 75, top: 960 - 75, width: 150, height: 150, transform: `scale(${0.5 + 0.55 * pop(f - c, 9, 200)})`}}><Mark size={150} /></div>;
};

/* ---------------- End card ---------------- */
const EndCard = () => {
  const f = useCurrentFrame();
  if (f < CUTS.end) return null;
  const l = f - CUTS.end;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 30%, rgba(151,209,49,0.22), rgba(18,22,28,0) 60%), ${INK}`, fontFamily: 'Poppins', alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 470, left: 0, width: 1080, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * pop(l - 6, 10, 170)})`, filter: 'drop-shadow(0 0 40px rgba(151,209,49,0.5))'}}><Mark size={210} /></div>
      <div style={{position: 'absolute', top: 740, left: 0, width: 1080, textAlign: 'center', fontWeight: 800, fontSize: 112, color: TXT, opacity: clamp((l - 10) / 6), transform: `translateY(${(1 - ease(clamp((l - 10) / 10))) * 30}px)`}}>Gym<span style={{color: LIME}}>Evo</span>App</div>
      <div style={{position: 'absolute', top: 1000, left: 0, width: 1080, display: 'flex', justifyContent: 'center', opacity: clamp((l - 20) / 6), transform: `scale(${0.8 + 0.2 * pop(l - 20)})`}}><div style={{padding: '20px 44px', borderRadius: 44, background: LIME, color: INK, fontWeight: 800, fontSize: 46, boxShadow: `0 8px 0 ${LIME_D}, 0 0 44px rgba(151,209,49,0.45)`}}>7 días gratis · sin tarjeta</div></div>
      <div style={{position: 'absolute', top: 1130, left: 0, width: 1080, textAlign: 'center', color: GRAY, fontWeight: 600, fontSize: 40, opacity: clamp((l - 30) / 6)}}>Pago único</div>
      <div style={{position: 'absolute', top: 1260, left: 0, width: 1080, textAlign: 'center', color: LIME, fontWeight: 800, fontSize: 60, opacity: clamp((l - 36) / 6)}}>gymevoapp.com</div>
      <div style={{position: 'absolute', top: 1350, left: 0, width: 1080, textAlign: 'center', color: GRAY, fontWeight: 600, fontSize: 38, opacity: clamp((l - 42) / 6)}}>@GymEvoApp</div>
    </AbsoluteFill>
  );
};

/* ---------------- Main ---------------- */
export const Overlay = () => {
  useFonts();
  const f = useCurrentFrame();
  const s = f < 340 ? 1 : f < 348 ? interpolate(f, [340, 348], [1, 1.28], {easing: Easing.in(Easing.cubic)}) : f < 358 ? interpolate(f, [348, 358], [1.28, 1], {easing: Easing.out(Easing.cubic)}) : 1;
  return (
    <AbsoluteFill style={{background: '#0d1015'}}>
      <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: '540px 1000px'}}><OffthreadVideo src={staticFile('gymevo/base_depth.mp4')} muted /></AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(13,16,21,0) 52%, rgba(13,16,21,0.38) 70%, rgba(13,16,21,0) 88%)'}} />
      <CalendarInsert />
      <HudRow />
      <Subtitles />
      <LogoCorner />
      <EndCard />
      {CUTS.wipes.map((c) => <Wipe key={c} c={c} />)}
      <IrisO />
      <LimeIris c={CUTS.logo} cx={540} cy={960} id="ml" />
      <LimeIris c={CUTS.end} cx={540} cy={960} id="me" />
      <LogoPop />
    </AbsoluteFill>
  );
};
