import {Composition} from 'remotion';
import {Overlay} from './Overlay';
import {DepthText} from './DepthText';
import {FPS, N} from './data';
export const Root = () => (
  <>
    <Composition id="Overlay" component={Overlay} durationInFrames={N} fps={FPS} width={1080} height={1920} />
    <Composition id="DepthText" component={DepthText} durationInFrames={N} fps={FPS} width={1080} height={1920} />
  </>
);
