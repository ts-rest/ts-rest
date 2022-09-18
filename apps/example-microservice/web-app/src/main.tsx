import React from 'react';
import { App } from './App';

import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(<App message={'Hello World'} />);
