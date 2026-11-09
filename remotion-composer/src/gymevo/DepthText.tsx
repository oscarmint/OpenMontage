import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {DEPTH, LIME} from './data';
import {useFonts} from './Fonts';
const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const DepthText = ({ghost = false}: {ghost?: boolean}) => {
  useFonts();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {DEPTH.map((d) => {
        if (f < d.f0 || f >= d.f1) return null;
        const l = f - d.f0, dur = d.f1 - d.f0;
        const reveal = ease(Math.min(1, l / 16));
        const fade = interpolate(f, [d.f1 - 8, d.f1], [1, 0], {extrapolateLeft: 'clamp'});
        const scale = 1;
        const X = reveal * 125;
        let dx = 0, clip = `polygon(0 0, ${X}% 0, ${X - 22}% 100%, 0 100%)`;
        if (d.kind === 'glitch' && l < 9) { dx = [-14, 10, -6, 12, -4, 8, -2, 4, 0][l]; clip = `polygon(0 0, ${Math.min(125, reveal * 125 + 30)}% 0, ${Math.min(125, reveal * 125 + 8)}% 100%, 0 100%)`; }
        const op = (d.kind === 'glitch' && l < 9 ? (l % 2 ? 0.55 : 1) : 1) * fade;
        const sweep = reveal < 1 && !ghost;
        return (
          <div key={d.word} style={{position: 'absolute', left: 0, width: 1080, top: d.y - d.size * 0.6, height: d.size * 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: op, transform: `translateX(${dx}px) scale(${scale})`}}>
            <div style={{position: 'relative'}}>
              <div style={{clipPath: clip}}>
                <span style={{display: 'block', fontFamily: 'Poppins', fontWeight: 800, fontSize: d.size, letterSpacing: d.size * 0.02, lineHeight: 1, color: ghost ? 'transparent' : LIME, WebkitTextStroke: ghost ? '4px rgba(232,255,176,0.8)' : `${Math.max(6, d.size * 0.02)}px #2f3f12`, paintOrder: 'stroke fill', textShadow: ghost ? undefined : '0 14px 40px rgba(0,0,0,0.55)', filter: ghost ? 'drop-shadow(0 0 8px rgba(151,209,49,0.5))' : 'drop-shadow(0 0 26px rgba(151,209,49,0.38))'}}>{d.word}</span>
              </div>
              {sweep ? <div style={{position: 'absolute', top: -10, bottom: -10, left: `${X - 12}%`, width: 14, transform: 'skewX(-14deg)', background: '#e8ffb0', boxShadow: `0 0 30px 8px ${LIME}`}} /> : null}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
