

import { Terminal } from 'xterm';
import React from 'react';
import {
  render,
} from 'react-dom';
import App from './App';

import './index.css';
import 'xterm/dist/xterm.css';

const term = new Terminal();
term.open(document.getElementById('xterm'));


render(<App />, document.getElementById('root'));
