import {Composition} from 'remotion';
import {Aviso4} from './Aviso4';
import tl from './timeline.json';
export const Root = () => <Composition id="Aviso4" component={Aviso4} durationInFrames={(tl as any).total_f} fps={24} width={1080} height={1920} />;
