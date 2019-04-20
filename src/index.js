

import { Terminal } from 'xterm';
import * as fullscreen from 'xterm/lib/addons/fullscreen/fullscreen';
import * as fit from 'xterm/lib/addons/fit/fit';

import React from 'react';
import {
  render,
} from 'react-dom';
import App from './App';

import './index.css';
import 'xterm/dist/addons/fullscreen/fullscreen.css'
import 'xterm/dist/xterm.css';

// render(<App />, document.getElementById('root'));


// https://xtermjs.org/docs/api/addons/fullscreen/
Terminal.applyAddon(fullscreen);

// https://xtermjs.org/docs/api/addons/fit/
// Terminal.applyAddon(fit);

const term = new Terminal({
  cursorBlink: true,
  useStyle: true,
  fontSize: 14,
});
term.open(document.getElementById('container-shell'));

var ws = new WebSocket("ws://localhost:8080/xterm")
ws.onmessage = function (message) {
  term.write(window.atob(message.data));
}
term.on('data', function (data) {
  ws.send(window.btoa(data))
});

window.term = term
term.toggleFullScreen(true);
// term.fit();
term.focus();

