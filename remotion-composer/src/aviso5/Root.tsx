import React from 'react';
import {Composition} from 'remotion';
import {Aviso5} from './Aviso5';
import tl from './timeline5.json';
export const Root = () => <Composition id="Aviso5" component={Aviso5} durationInFrames={(tl as any).total_f} fps={24} width={1080} height={1920} />;
