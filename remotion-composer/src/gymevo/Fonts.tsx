import {useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
export const useFonts = () => {
  useState(() => {
    const h = delayRender('poppins');
    Promise.all([600, 700, 800].map((w) =>
      new FontFace('Poppins', `url(${staticFile(`gymevo/fonts/poppins-latin-${w}-normal.woff2`)})`, {weight: String(w)})
        .load().then((f) => { (document as any).fonts.add(f); })
    )).then(() => continueRender(h)).catch(() => continueRender(h));
    return 0;
  });
};
