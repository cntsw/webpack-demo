

// import 'zmodem.js/dist/zmodem.devel';


// import * as zmodem from 'xterm/lib/addons/zmodem/zmodem';
// import Zmodem from 'zmodem.js';


// import * as fit from 'xterm/lib/addons/fit/fit';

// import React from 'react';
// import {
//   render,
// } from 'react-dom';
// import App from './App';


import Zmodem from 'zmodem.js/src/zmodem_browser';

import { Terminal } from 'xterm';
import * as fullscreen from 'xterm/lib/addons/fullscreen/fullscreen';
import fromUTF8Array from './TextConvertor';

import 'xterm/dist/addons/fullscreen/fullscreen.css';
import 'xterm/dist/xterm.css';


// https://xtermjs.org/docs/api/addons/fullscreen/
Terminal.applyAddon(fullscreen);

// Terminal.applyAddon(zmodem);

// https://xtermjs.org/docs/api/addons/fit/
// Terminal.applyAddon(fit);


function createTerminalWindow(wsUrl) {
  const term = new Terminal({
  //   cols: 30,
  //   lines: 50
    cursorBlink: true,
    useStyle: true,
    fontSize: 14,
  });
  term.open(document.getElementById('container-shell'));


  let zsentry;
  const ws = new WebSocket(wsUrl);
  ws.binaryType = 'arraybuffer';

  ws.onmessage = (event) => {
    if (typeof (event.data) === 'string') {
      console.log(event.data);
      return;
    }
    //   const rawData = window.atob(message.data); // base64 to raw
    //   const bin = [];
    //   for (let i = 0; i < rawData.length; i++) {
    //     bin.push(rawData.charCodeAt(i));
    //   }

    //   const utf8Array = new Uint8Array(bin);

    //   zsentry.consume(utf8Array);

    zsentry.consume(new Uint8Array(event.data));

  //   term.write(String.fromCharCode(...rawData));
  };

  const encoder = new TextEncoder();

  term.on('data', (data) => {
    let binArr = data;
    if (typeof (data) === 'string') {
      binArr = encoder.encode(data);
    }
    ws.send(binArr);
  });


  window.term = term;
  // term.toggleFullScreen(true);
  // term.fit();
  term.focus();


  function handleReceive(zsession) {
    zsession.on('offer', (offer) => {
      const fileBuffer = [];

      let size = 0;
      const printSendedSize = () => {
        term.write(`already send: ${(size / 1024 / 1024).toFixed(3)}MB\r`);
      };

      term.write('\r\n start download \r\n');
      let last = Date.now();
      offer.on('input', (payload) => {
        const newPayload = new Uint8Array(payload);
        fileBuffer.push(newPayload);
        size += newPayload.length;

        const now = Date.now();
        if (now - last > 200) {
          last = now;
          printSendedSize();
        }
      });

      offer.accept().then(() => {
        printSendedSize();
        // download (ref: zmodem_browser.save_to_disk)
        const blob = new Blob(fileBuffer, { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);

        const el = document.createElement('a');
        el.style.display = 'none';
        el.href = url;
        el.download = offer.get_details().name;
        document.body.appendChild(el);
        el.click();

        document.body.removeChild(el);

        term.write('\r\ncomplate \r\n');
      }, console.error.bind(console));
    });
    const promise = new Promise(((res) => {
      zsession.on('session_end', () => {
        res();
      });
    }));
    zsession.start();
    return promise;
  }


  function handleSend(zsession) {
    return new Promise(((res) => {
      const fileInput = document.getElementById('fileInput');

      fileInput.click();
      window.fileInput = fileInput;

      fileInput.onchange = () => {
        const files = fileInput.files;
        Zmodem.Browser.send_files(
          zsession,
          files,
          {
            on_progress(obj, xfer) {
              console.log(xfer);
            },
            on_file_complete(obj) {
              console.log(obj);
              term.write('\r\n complete \r\n');
            },
          },
        ).then(
          zsession.close.bind(zsession),
          console.error.bind(console),
        ).then(() => {
          res();
        });
      };
    }));
  }

  // ---------

  zsentry = new Zmodem.Sentry({
    to_terminal: (octets) => {
      term.write(String.fromCharCode(...octets));
    },

    sender: (octets) => {
      ws.send(new Uint8Array(octets));
    },

    on_retract: () => {
      console.log('on_retract');
    },

    on_detect: (detection) => {
      console.log(detection);

      term.setOption('disableStdin', true);
      const zsession = detection.confirm();

      let promise;
      if (zsession.type === 'send') {
        promise = handleSend(zsession);
      } else {
      // receive
        promise = handleReceive(zsession);
      }

      promise.catch(console.error.bind(console)).then(() => {
        term.setOption('disableStdin', false);
      });

      term.setOption('disableStdin', false);
    },
  });
}

export default createTerminalWindow;
