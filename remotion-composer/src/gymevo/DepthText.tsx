import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {DEPTH, LIME} from './data';
import {useFonts} from './Fonts';
const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const DepthText = () => {
  useFonts();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {DEPTH.map((d) => {
        if (f < d.f0 || f >= d.f1) return null;
        const l = f - d.f0, dur = d.f1 - d.f0;
        const reveal = ease(Math.min(1, l / 14));
        const fade = interpolate(f, [d.f1 - 8, d.f1], [1, 0], {extrapolateLeft: 'clamp'});
        const scale = 1 + 0.06 * (l / dur);
        let dx = 0, dy = 0, clip = `inset(0 ${(1 - reveal) * 100}% 0 0)`;
        if (d.kind === 'glitch' && l < 9) { dx = [-14, 10, -6, 12, -4, 8, -2, 4, 0][l]; clip = `inset(0 0 0 0)`; }
        if (d.kind === 'rise') { dy = (1 - reveal) * 90; clip = `inset(${(1 - reveal) * 100}% 0 0 0)`; }
        const op = (d.kind === 'glitch' && l < 9 ? (l % 2 ? 0.4 : 1) : 1) * fade;
        return (
          <div key={d.word} style={{position: 'absolute', left: 0, width: 1080, top: d.y - d.size * 0.6, height: d.size * 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: op, transform: `translate(${dx}px,${dy}px) scale(${scale})`, clipPath: clip}}>
            <span style={{fontFamily: 'Poppins', fontWeight: 800, fontSize: d.size, letterSpacing: d.size * 0.02, lineHeight: 1, color: 'rgba(151,209,49,0.10)', WebkitTextStroke: `${Math.max(4, d.size * 0.018)}px ${LIME}`, filter: 'drop-shadow(0 0 28px rgba(151,209,49,0.45))'}}>{d.word}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
